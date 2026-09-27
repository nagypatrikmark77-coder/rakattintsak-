// Szerveroldali Supabase (service role): felhasználó azonosítása a Bearer tokenből.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type RequestUser = { id: string; isAnonymous: boolean };

export async function userFromRequest(request: Request, admin: SupabaseClient): Promise<RequestUser | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, isAnonymous: data.user.is_anonymous === true };
}
