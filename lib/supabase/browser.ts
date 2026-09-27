// Böngészőoldali Supabase: csendes anonim session, Google-fiók hozzákötése (M6).
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function browserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return client;
}

let pending: Promise<Session | null> | null = null;

// Első megnyitáskor csendben anonim bejelentkezés; a session megmarad (localStorage).
// Ha nem sikerül (pl. kikapcsolt anonim bejelentkezés, nincs net), null: az ellenőrzés akkor is fut, csak IP-limittel.
export function ensureSession(): Promise<Session | null> {
  const sb = browserClient();
  if (!sb) return Promise.resolve(null);
  pending ??= (async () => {
    const { data } = await sb.auth.getSession();
    if (data.session) return data.session;
    const { data: anon, error } = await sb.auth.signInAnonymously();
    return error ? null : anon.session;
  })()
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}

export async function authHeader(): Promise<Record<string, string>> {
  const session = await ensureSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

// Bejelentkezett = van session és nem anonim (Google-fiók hozzá van kötve).
export function isSignedIn(session: Session | null): boolean {
  return !!session && session.user.is_anonymous !== true;
}

// "Fiók mentése": a Google-identitást az anonim felhasználóhoz köti, így a user_id és minden adata megmarad.
// A böngésző átirányít a Google-höz, majd vissza a redirectPath-ra.
export async function linkGoogle(redirectPath: string): Promise<void> {
  const sb = browserClient();
  if (!sb) throw new Error("supabase_unavailable");
  await ensureSession();
  const { error } = await sb.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: new URL(redirectPath, window.location.origin).href },
  });
  if (error) throw error;
}

// Ha a Google-fiók már egy másik felhasználóhoz tartozik (identity_already_exists), abba lehet belépni.
export async function signInWithGoogle(redirectPath: string): Promise<void> {
  const sb = browserClient();
  if (!sb) throw new Error("supabase_unavailable");
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: new URL(redirectPath, window.location.origin).href },
  });
  if (error) throw error;
}

// Az OAuth-visszatérés hibakódja az URL-ben (pl. "identity_already_exists"), vagy null.
export function oauthErrorCode(): string | null {
  const params = new URLSearchParams(window.location.search + "&" + window.location.hash.replace(/^#/, ""));
  return params.get("error_code");
}

export async function signOut(): Promise<void> {
  await browserClient()?.auth.signOut();
}
