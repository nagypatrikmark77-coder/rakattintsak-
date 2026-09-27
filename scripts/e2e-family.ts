// npm run e2e:family -- --target=https://rakattintsak.vercel.app
// Éles, végponttól végpontig tartó családi teszt két ideiglenes (jelszavas, nem anonim) tesztfelhasználóval:
// unoka létrehozza a családot → nagyi csatlakozik a kóddal → nagyi PIROS ellenőrzést futtat → az unoka Realtime-on
// megkapja a riasztást. Méri a késleltetést, ellenőrzi, hogy a riasztásban csak márka/ítélet/idő van. A végén töröl.
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const target = (process.argv.find((a) => a.startsWith("--target="))?.slice(9) ?? "https://rakattintsak.vercel.app").replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const ref = JSON.parse(Buffer.from(anonKey.split(".")[1] ?? "", "base64url").toString() || "{}").ref;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${ref}.supabase.co`;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "OK" : "XX"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function user(admin: SupabaseClient) {
  const email = `e2e-${randomBytes(6).toString("hex")}@rakattintsak.test`;
  const password = randomBytes(18).toString("base64url");
  const { data } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: signIn } = await client.auth.signInWithPassword({ email, password });
  return { id: data.user!.id, token: signIn.session!.access_token, client };
}

async function post(path: string, token: string, body: unknown) {
  const res = await fetch(`${target}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const created: string[] = [];
  try {
    const grandchild = await user(admin);
    const grandma = await user(admin);
    created.push(grandchild.id, grandma.id);

    const fam = await post("/api/family/create", grandchild.token, {});
    check("unoka: család létrehozása", fam.status === 200 && /^[A-Z2-9]{6}$/.test(fam.body.code), `${fam.status}`);
    const again = await post("/api/family/create", grandchild.token, {});
    check("unoka: ismételt létrehozás ugyanazt a családot adja", again.body.family_id === fam.body.family_id);
    const own = await post("/api/family/join", grandchild.token, { code: fam.body.code });
    check("unoka nem csatlakozhat a saját kódjával (409)", own.status === 409, `${own.status}`);
    const join = await post("/api/family/join", grandma.token, { code: fam.body.code.toLowerCase() });
    check("nagyi: csatlakozás kóddal (kisbetűvel is)", join.status === 200 && join.body.role === "member", `${join.status}`);
    const noAuth = await fetch(`${target}/api/family/create`, { method: "POST" });
    check("bejelentkezés nélkül nincs családlétrehozás (401)", noAuth.status === 401, `${noAuth.status}`);

    // Az unoka feliratkozik a riasztásokra (RLS szerint csak a saját családjáé).
    let receivedAt = 0;
    let received: Record<string, unknown> | null = null;
    await grandchild.client.realtime.setAuth(grandchild.token);
    const channel = grandchild.client
      .channel("e2e-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `family_id=eq.${fam.body.family_id}` }, (p) => {
        receivedAt = Date.now();
        received = p.new;
      });
    await new Promise<void>((resolve) => channel.subscribe((s) => s === "SUBSCRIBED" && resolve()));

    const sentAt = Date.now();
    const checkRes = await post("/api/check", grandma.token, {
      text: "OTP Bank: Fiokjat zaroltuk. Azonositson itt 24 oran belul: https://otp-azonositas-e2e.xyz/belepes",
    });
    check("nagyi: PIROS ítélet", checkRes.status === 200 && checkRes.body.verdict === "red", `${checkRes.status} ${checkRes.body.verdict}`);

    for (let i = 0; i < 100 && !received; i++) await new Promise((r) => setTimeout(r, 100));
    check("unoka: Realtime riasztás megérkezett", !!received, received ? `${receivedAt - sentAt} ms a kérés indításától` : "nem jött");
    const cols = Object.keys(received ?? {}).sort().join(",");
    check("riasztás: csak id, family_id, brand, verdict, created_at", cols === "brand,created_at,family_id,id,verdict", cols);
    check("riasztás márkája: OTP Bank", (received as { brand?: string } | null)?.brand === "OTP Bank");

    const { data: usage } = await admin.from("usage").select("count, red_count").eq("user_id", grandma.id).single();
    check("usage: a nagyi ellenőrzése számolva (count 1, red_count 1)", usage?.count === 1 && usage?.red_count === 1, JSON.stringify(usage));
    await grandchild.client.removeChannel(channel);
  } finally {
    for (const id of created) await admin.auth.admin.deleteUser(id);
  }
  console.log(`\nCsaládi E2E: ${failures === 0 ? "RENDBEN" : `${failures} HIBA`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.log(`XX  futási hiba: ${err instanceof Error ? err.message : "ismeretlen"}`);
  process.exit(1);
});
