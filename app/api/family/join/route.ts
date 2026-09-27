// POST /api/family/join — { code } — a Google-lal mentett felhasználó "member" szerepben csatlakozik a családhoz.
// Válasz: { family_id, code, role: "member" }. Hibánál { error } magyar üzenettel.
// Visszaélés ellen: a Google-fiók kötelező, és a hibás kódokat IP-hash és felhasználó szerint memóriában számoljuk
// (10 hibás kód / 15 perc). Adatbázist nem használ, példányonként él.
import { createAttemptGuard, familyError, joinFamily, NO_STORE, requireSavedUser, type JoinError } from "@/lib/family";
import { clientIp, ipHash } from "@/lib/limits";
import { logError } from "@/lib/log";

const guard = createAttemptGuard({ max: 10, windowMs: 15 * 60 * 1000 });

const JOIN_ERRORS: Record<JoinError, [number, string]> = {
  bad_length: [400, "A kód 6 karakter."],
  not_found: [404, "Nincs ilyen családkód. Ellenőrizd, és próbáld újra."],
  own_family: [409, "Ez a te családod kódja. A nagyi telefonján add meg."],
};

export async function POST(request: Request) {
  try {
    const auth = await requireSavedUser(request);
    if (auth instanceof Response) return auth;

    const keys = [`ip:${ipHash(clientIp(request))}`, `user:${auth.user.id}`];
    if (keys.some((k) => guard.blocked(k))) {
      return familyError(429, "Túl sok hibás kód. Próbáld újra negyedóra múlva.");
    }

    let body: { code?: unknown };
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await joinFamily(auth.admin, auth.user.id, typeof body.code === "string" ? body.code : "");
    if (!result.ok) {
      if (result.error !== "own_family") keys.forEach((k) => guard.fail(k));
      const [status, message] = JOIN_ERRORS[result.error];
      return familyError(status, message);
    }
    return Response.json(result.family, { headers: NO_STORE });
  } catch (err) {
    logError("family_join_failed", err);
    return familyError(500, "A csatlakozás most nem sikerült. Próbáld újra később.");
  }
}
