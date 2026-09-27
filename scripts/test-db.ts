// npm run test:db — adatbázis-kapu az éles Supabase-projekten, ideiglenes tesztfelhasználókkal (a végén törli őket).
// Ellenőrzi: IP-limit (20/óra), napi limit (30/nap/user), record_red (csak család + márka), a usage/alerts oszlopai
// (tartalom nincs), és az RLS-t (csak a saját sor / a saját család riasztásai). Bukásnál a kilépési kód 1.
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DAY_LIMIT_PER_USER, HOUR_LIMIT_PER_IP } from "@/lib/limits";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || deriveUrl(process.env.SUPABASE_ANON_KEY ?? "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const dayLimit = Number(process.argv.find((a) => a.startsWith("--day-limit="))?.split("=")[1] ?? DAY_LIMIT_PER_USER);

function deriveUrl(anon: string) {
  const ref = JSON.parse(Buffer.from(anon.split(".")[1] ?? "", "base64url").toString() || "{}").ref;
  return ref ? `https://${ref}.supabase.co` : "";
}

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "OK" : "XX"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function testUser(admin: SupabaseClient) {
  const email = `teszt-${randomBytes(6).toString("hex")}@rakattintsak.test`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error("tesztfelhasználó létrehozása nem sikerült");
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error("teszt-bejelentkezés nem sikerült");
  return { id: data.user.id, client };
}

async function main() {
  if (!url || !anonKey || !serviceKey) throw new Error("hiányzó Supabase env");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const hit = async (userId: string | null, hash: string, day = dayLimit) =>
    (await admin.rpc("hit_limits", { p_user_id: userId, p_ip_hash: hash, p_hour_limit: HOUR_LIMIT_PER_IP, p_day_limit: day })).data;
  const created: string[] = [];

  try {
    // 1. IP-limit: 20 engedett, a 21. tiltott.
    const ip = `teszt-${randomBytes(8).toString("hex")}`;
    const ipResults = [];
    for (let i = 0; i < HOUR_LIMIT_PER_IP + 1; i++) ipResults.push(await hit(null, ip));
    check(
      `IP-limit: ${HOUR_LIMIT_PER_IP} ok, a ${HOUR_LIMIT_PER_IP + 1}. "ip_hour"`,
      ipResults.slice(0, HOUR_LIMIT_PER_IP).every((r) => r === "ok") && ipResults[HOUR_LIMIT_PER_IP] === "ip_hour",
      ipResults.slice(-2).join(","),
    );
    await admin.from("rate_limits").delete().eq("ip_hash", ip);

    // 2. Napi limit: 30 engedett (mindegyik más IP-ről), a 31. tiltott.
    const grandma = await testUser(admin);
    const grandchild = await testUser(admin);
    created.push(grandma.id, grandchild.id);
    const dayResults = [];
    for (let i = 0; i < DAY_LIMIT_PER_USER + 1; i++) dayResults.push(await hit(grandma.id, `teszt-${randomBytes(8).toString("hex")}`));
    check(
      `napi limit: ${DAY_LIMIT_PER_USER} ok, a ${DAY_LIMIT_PER_USER + 1}. "user_day"`,
      dayResults.slice(0, DAY_LIMIT_PER_USER).every((r) => r === "ok") && dayResults[DAY_LIMIT_PER_USER] === "user_day",
      dayResults.slice(-2).join(","),
    );

    // 3. Család + record_red: riasztás csak a családnak, csak márka/ítélet/idő.
    const code = `T${randomBytes(3).toString("hex").toUpperCase()}`.slice(0, 6);
    const { data: fam } = await admin.from("families").insert({ code, owner_id: grandchild.id }).select("id").single();
    await admin.from("family_members").insert([
      { family_id: fam!.id, user_id: grandchild.id, role: "owner" },
      { family_id: fam!.id, user_id: grandma.id, role: "member" },
    ]);
    const { data: inserted } = await admin.rpc("record_red", { p_user_id: grandma.id, p_brand: "OTP Bank" });
    check("record_red: 1 riasztás a nagyi családjának", inserted === 1, String(inserted));
    const { data: ownerRed } = await admin.rpc("record_red", { p_user_id: grandchild.id, p_brand: "OTP Bank" });
    check("record_red: az unoka (owner) saját ellenőrzése nem riaszt", ownerRed === 0, String(ownerRed));

    const { data: alertRows } = await admin.from("alerts").select("*").eq("family_id", fam!.id);
    const alertCols = Object.keys(alertRows?.[0] ?? {}).sort().join(",");
    check("alerts oszlopai: csak id, family_id, brand, verdict, created_at", alertCols === "brand,created_at,family_id,id,verdict", alertCols);
    const { data: usageRows } = await admin.from("usage").select("*").eq("user_id", grandma.id);
    const usageCols = Object.keys(usageRows?.[0] ?? {}).sort().join(",");
    check("usage oszlopai: csak user_id, day, count, red_count", usageCols === "count,day,red_count,user_id", usageCols);
    check("usage: count = 30, red_count = 1", usageRows?.[0]?.count === DAY_LIMIT_PER_USER && usageRows?.[0]?.red_count === 1,
      `${usageRows?.[0]?.count}/${usageRows?.[0]?.red_count}`);

    // 4. RLS.
    const stranger = await testUser(admin);
    created.push(stranger.id);
    const { data: ownAlerts } = await grandchild.client.from("alerts").select("id").eq("family_id", fam!.id);
    check("RLS: az unoka látja a családja riasztását", ownAlerts?.length === 1, String(ownAlerts?.length));
    const { data: strangerAlerts } = await stranger.client.from("alerts").select("id");
    check("RLS: idegen felhasználó nem lát riasztást", strangerAlerts?.length === 0, String(strangerAlerts?.length));
    const { data: strangerUsage } = await stranger.client.from("usage").select("user_id");
    check("RLS: idegen felhasználó nem látja más usage sorát", strangerUsage?.length === 0, String(strangerUsage?.length));
    const { data: ownUsage } = await grandma.client.from("usage").select("user_id");
    check("RLS: a nagyi csak a saját usage sorát látja", ownUsage?.length === 1 && ownUsage[0].user_id === grandma.id);
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: anonAlerts } = await anon.from("alerts").select("id");
    check("RLS: bejelentkezés nélkül nincs riasztás-olvasás", !anonAlerts?.length, String(anonAlerts?.length ?? "hiba"));
    const { data: rl, error: rlError } = await grandma.client.from("rate_limits").select("*");
    check("rate_limits kliensről nem olvasható", !!rlError || rl?.length === 0);
    const { error: rpcError } = await grandma.client.rpc("hit_limits", { p_user_id: grandma.id, p_ip_hash: "x", p_hour_limit: 999, p_day_limit: 999 });
    check("hit_limits kliensről nem hívható", !!rpcError);
  } finally {
    for (const id of created) await admin.auth.admin.deleteUser(id);
  }

  console.log(`\nAdatbázis-kapu: ${failures === 0 ? "RENDBEN" : `${failures} HIBA`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.log(`XX  futási hiba: ${err instanceof Error ? err.message : "ismeretlen"}`);
  process.exit(1);
});
