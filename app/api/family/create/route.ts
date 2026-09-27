// POST /api/family/create — a Google-lal mentett felhasználó családot hoz létre (owner), vagy visszakapja a meglévőt.
// Válasz: { family_id, code, role: "owner" }. Hibánál { error } magyar üzenettel.
import { createFamily, familyError, NO_STORE, requireSavedUser } from "@/lib/family";
import { logError } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const auth = await requireSavedUser(request);
    if (auth instanceof Response) return auth;
    const family = await createFamily(auth.admin, auth.user.id);
    return Response.json(family, { headers: NO_STORE });
  } catch (err) {
    logError("family_create_failed", err);
    return familyError(500, "A családot most nem sikerült létrehozni. Próbáld újra később.");
  }
}
