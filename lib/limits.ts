// Visszaélés elleni limit: 20 ellenőrzés / óra / IP ÉS 30 / nap / felhasználó, amelyik előbb eléri.
// Az IP-t csak sózott hash-ként tároljuk (legfeljebb 2 óráig), a usage sorba tartalom soha nem kerül.
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const HOUR_LIMIT_PER_IP = 20;
export const DAY_LIMIT_PER_USER = 30;

export type LimitResult = "ok" | "ip_hour" | "user_day" | "unavailable";

export const LIMIT_MESSAGES: Record<"ip_hour" | "user_day", string> = {
  ip_hour: "Ebből a hálózatból most túl sok ellenőrzés érkezett. Próbáld újra egy óra múlva.",
  user_day: "Mára elérted a napi 30 ellenőrzést. Holnap újra próbálhatod.",
};

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export function ipHash(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

// Adatbázis-hiba esetén "unavailable": a hívó ilyenkor engedi az ellenőrzést (az idős felhasználó ne maradjon válasz nélkül);
// a költséget ilyenkor az Anthropic havi keret védi.
export async function hitLimits(admin: SupabaseClient, userId: string | null, hash: string): Promise<LimitResult> {
  const { data, error } = await admin.rpc("hit_limits", {
    p_user_id: userId,
    p_ip_hash: hash,
    p_hour_limit: HOUR_LIMIT_PER_IP,
    p_day_limit: DAY_LIMIT_PER_USER,
  });
  if (error || (data !== "ok" && data !== "ip_hour" && data !== "user_day")) return "unavailable";
  return data;
}
