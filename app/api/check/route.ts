// POST /api/check — { text?: string, image?: base64 | data URL }
// A beküldött tartalom csak memóriában él; nem mentjük és nem naplózzuk.
import { extractWithClaude } from "@/lib/extract";
import { ENTITIES } from "@/lib/kb";
import { clientIp, hitLimits, ipHash, LIMIT_MESSAGES } from "@/lib/limits";
import { logError } from "@/lib/log";
import { runCheck, type CheckInput, type ImageMediaType } from "@/lib/pipeline";
import { adminClient, userFromRequest } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_TEXT_CHARS = 5000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MEDIA_TYPES: ImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function error(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function parseImage(value: string): { base64: string; mediaType: ImageMediaType } | null {
  const m = value.match(/^data:([a-z/+-]+);base64,([\s\S]*)$/);
  const mediaType = (m ? m[1] : "image/jpeg") as ImageMediaType;
  const base64 = (m ? m[2] : value).replace(/\s/g, "");
  if (!MEDIA_TYPES.includes(mediaType) || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;
  return { base64, mediaType };
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return error(413, "A kép túl nagy. Legfeljebb 4 MB lehet.");
  }

  let body: { text?: unknown; image?: unknown };
  try {
    body = await request.json();
  } catch {
    return error(400, "Hibás kérés.");
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const imageRaw = typeof body.image === "string" && body.image ? body.image : null;
  if (!text && !imageRaw) return error(400, "Másolj be egy üzenetet vagy linket, vagy tölts fel egy képet.");
  if (text.length > MAX_TEXT_CHARS) return error(413, "A szöveg túl hosszú. Legfeljebb 5000 karakter lehet.");

  const input: CheckInput = { text };
  if (imageRaw) {
    const image = parseImage(imageRaw);
    if (!image) return error(400, "A képet nem sikerült beolvasni.");
    if (Math.floor((image.base64.length * 3) / 4) > MAX_IMAGE_BYTES) {
      return error(413, "A kép túl nagy. Legfeljebb 4 MB lehet.");
    }
    input.imageBase64 = image.base64;
    input.imageMediaType = image.mediaType;
  }

  // Limit: 20/óra/IP és 30/nap/felhasználó (anonim session is felhasználó). Adatbázis-hiba esetén engedjük.
  const admin = adminClient();
  const user = admin ? await userFromRequest(request, admin) : null;
  if (admin) {
    const limit = await hitLimits(admin, user?.id ?? null, ipHash(clientIp(request)));
    if (limit === "ip_hour" || limit === "user_day") return error(429, LIMIT_MESSAGES[limit]);
    if (limit === "unavailable") logError("limits_unavailable");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    logError("no_api_key");
    return error(503, "Az ellenőrzés most nem elérhető. Próbáld újra később.");
  }

  try {
    const { response, signals } = await runCheck(input, {
      extract: (i) => extractWithClaude(i),
      followRedirects: true,
      compareUrls: true,
    });
    // PIROS ítéletnél: red_count++ és riasztás a családnak. Csak a márka neve megy, tartalom soha.
    if (response.verdict === "red" && admin && user) {
      const brand = ENTITIES.find((e) => e.id === signals.claimed_sender)?.name ?? "ismeretlen";
      const { error: rpcError } = await admin.rpc("record_red", { p_user_id: user.id, p_brand: brand });
      if (rpcError) logError("record_red_failed");
    }
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logError("check_failed", err);
    return error(502, "Az ellenőrzés most nem sikerült. Próbáld újra később.");
  }
}
