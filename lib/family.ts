// Családi védőháló (M4): családkód, család létrehozása, csatlakozás. Csak szerveren, service role klienssel.
// A családhoz Google-lal mentett fiók kell (anonim session nem elég); ez a fő visszaélés elleni védelem.
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, userFromRequest, type RequestUser } from "@/lib/supabase/server";

// 32 karakter: nincs benne I, O, 0, 1 (összetéveszthetők). 256 / 32 = 8, így a bájt % 32 egyenletes.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
export const MAX_CODE_ATTEMPTS = 5;
const UNIQUE_VIOLATION = "23505";

export type FamilyRole = "owner" | "member";
export type FamilyResult = { family_id: string; code: string; role: FamilyRole };
export type JoinError = "bad_length" | "not_found" | "own_family";
export type JoinResult = { ok: true; family: FamilyResult } | { ok: false; error: JoinError };

type RandomFill = (bytes: Uint8Array) => Uint8Array;
const cryptoFill: RandomFill = (bytes) => crypto.getRandomValues(bytes);

export function generateCode(random: RandomFill = cryptoFill): string {
  const bytes = random(new Uint8Array(CODE_LENGTH));
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

// Nagybetű, szóközök és kötőjelek nélkül. Nincs karaktercsere (0→O stb.), mert se 0, se O nincs a kódban.
export function cleanCode(input: string): string {
  // Kötőjelek: -, a Unicode kötőjel/gondolatjel-félék (U+2010–U+2015) és a mínuszjel (U+2212).
  return input.toUpperCase().replace(/[\s\-\u2010-\u2015\u2212]/g, "");
}

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

export function normalizeCode(input: string): string | null {
  const code = cleanCode(input);
  return CODE_RE.test(code) ? code : null;
}

// Ha a felhasználónak már van saját családja, azt adja vissza; különben újat hoz létre (ütköző kódnál újrapróbál).
export async function createFamily(
  admin: SupabaseClient,
  userId: string,
  random: RandomFill = cryptoFill,
): Promise<FamilyResult> {
  const { data: existing, error: findError } = await admin
    .from("families")
    .select("id, code")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    // Ha egy korábbi létrehozásnál a tagság-sor elmaradt, itt pótoljuk (a meglévő sort nem írjuk felül).
    const { error } = await admin
      .from("family_members")
      .upsert(
        { family_id: existing.id, user_id: userId, role: "owner" },
        { onConflict: "family_id,user_id", ignoreDuplicates: true },
      );
    if (error) throw error;
    return { family_id: existing.id, code: existing.code, role: "owner" };
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const { data: family, error } = await admin
      .from("families")
      .insert({ code: generateCode(random), owner_id: userId })
      .select("id, code")
      .single();
    if (error) {
      // Ütközés: vagy a kód foglalt (új kóddal próbáljuk), vagy egy párhuzamos kérés már létrehozta a családot
      // (families_owner_unique): akkor a meglévőt adjuk vissza.
      if (error.code === UNIQUE_VIOLATION) {
        const { data: raced } = await admin.from("families").select("id").eq("owner_id", userId).maybeSingle();
        if (raced) return createFamily(admin, userId, random);
        continue;
      }
      throw error;
    }
    const { error: memberError } = await admin
      .from("family_members")
      .insert({ family_id: family.id, user_id: userId, role: "owner" });
    if (memberError) {
      await admin.from("families").delete().eq("id", family.id);
      throw memberError;
    }
    return { family_id: family.id, code: family.code, role: "owner" };
  }
  throw new Error("family_code_exhausted");
}

// Csatlakozás kóddal "member" szerepben. Ismételt csatlakozás nem hiba, és meglévő szerepet nem ír felül.
export async function joinFamily(admin: SupabaseClient, userId: string, input: string): Promise<JoinResult> {
  const code = normalizeCode(input);
  if (!code) {
    // 6 karakter, de nem a kód ábécéjéből (pl. 0, O, 1, I): ilyen kód nem létezik.
    return { ok: false, error: cleanCode(input).length === CODE_LENGTH ? "not_found" : "bad_length" };
  }
  const { data: family, error } = await admin
    .from("families")
    .select("id, code, owner_id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!family) return { ok: false, error: "not_found" };
  if (family.owner_id === userId) return { ok: false, error: "own_family" };

  const { error: upsertError } = await admin
    .from("family_members")
    .upsert(
      { family_id: family.id, user_id: userId, role: "member" },
      { onConflict: "family_id,user_id", ignoreDuplicates: true },
    );
  if (upsertError) throw upsertError;
  return { ok: true, family: { family_id: family.id, code: family.code, role: "member" } };
}

// Hibás kódok számlálója kulcsonként (IP-hash, felhasználó), csak memóriában, példányonként (best effort).
// A kódtér 32^6 ≈ 1,07 milliárd, és a próbálkozáshoz Google-fiók kell; ez csak a tömeges találgatást fékezi.
export function createAttemptGuard({ max, windowMs, maxKeys = 10_000 }: { max: number; windowMs: number; maxKeys?: number }) {
  const entries = new Map<string, { count: number; resetAt: number }>();

  function prune(now: number) {
    for (const [key, e] of entries) if (e.resetAt <= now) entries.delete(key);
    while (entries.size >= maxKeys) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  }

  return {
    blocked(key: string, now = Date.now()): boolean {
      const e = entries.get(key);
      return !!e && e.resetAt > now && e.count >= max;
    },
    fail(key: string, now = Date.now()): void {
      const e = entries.get(key);
      if (e && e.resetAt > now) {
        e.count++;
        return;
      }
      if (entries.size >= maxKeys) prune(now);
      entries.set(key, { count: 1, resetAt: now + windowMs });
    },
  };
}

export const NO_STORE = { "Cache-Control": "no-store" };

export function familyError(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

// Közös kapu a családi API-khoz: 503 (nincs Supabase), 401 (nincs session), 403 (anonim, nincs Google-fiók).
export async function requireSavedUser(
  request: Request,
): Promise<{ admin: SupabaseClient; user: RequestUser } | Response> {
  const admin = adminClient();
  if (!admin) return familyError(503, "A családi funkció most nem elérhető.");
  const user = await userFromRequest(request, admin);
  if (!user) return familyError(401, "Jelentkezz be.");
  if (user.isAnonymous) return familyError(403, "A családhoz előbb mentsd a fiókodat Google-lal.");
  return { admin, user };
}
