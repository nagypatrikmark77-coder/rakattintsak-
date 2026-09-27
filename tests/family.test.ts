import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestUser } from "@/lib/supabase/server";
import { POST as createRoute } from "@/app/api/family/create/route";
import { POST as joinRoute } from "@/app/api/family/join/route";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  MAX_CODE_ATTEMPTS,
  createAttemptGuard,
  createFamily,
  generateCode,
  joinFamily,
  normalizeCode,
} from "@/lib/family";
import {
  ALERT_LIMIT,
  alertLine,
  formatAlertTime,
  mergeAlert,
  parseMemberships,
  toAlertRow,
  type AlertRow,
} from "@/app/csalad/family-data";

// Az API-útvonalak tesztjéhez: a service role kliens és a kérés felhasználója kívülről állítható.
const server = vi.hoisted(() => ({ admin: null as unknown, user: null as RequestUser | null }));
vi.mock("@/lib/supabase/server", () => ({
  adminClient: () => server.admin,
  userFromRequest: async () => server.user,
}));

// Determinisztikus RNG: minden híváskor a következő bájtsort adja.
function rng(...sequences: number[][]) {
  let i = 0;
  return (bytes: Uint8Array) => {
    bytes.set(sequences[Math.min(i++, sequences.length - 1)]);
    return bytes;
  };
}
const idx = (code: string) => [...code].map((c) => CODE_ALPHABET.indexOf(c));

describe("generateCode", () => {
  it("6 karakter a 32 betűs ábécéből, bájt % 32 szerint", () => {
    expect(CODE_ALPHABET).toHaveLength(32);
    expect(generateCode(rng([0, 1, 2, 3, 4, 5]))).toBe("ABCDEF");
    expect(generateCode(rng([31, 32, 63, 255, 224, 8]))).toBe("9A99AJ");
  });

  it("egyenletes: minden bájtérték pontosan 8-szor képez minden karakterre", () => {
    const counts = new Map<string, number>();
    for (let b = 0; b < 256; b++) {
      const c = generateCode(rng([b, b, b, b, b, b]))[0];
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    expect(counts.size).toBe(32);
    expect([...counts.values()].every((n) => n === 8)).toBe(true);
  });

  it("valódi RNG-vel sem ad I, O, 0, 1 karaktert", () => {
    for (let i = 0; i < 2000; i++) {
      const code = generateCode();
      expect(code).toMatch(new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`));
      expect(code).not.toMatch(/[IO01]/);
    }
  });
});

describe("normalizeCode", () => {
  it("nagybetűsít, a szóközt és a kötőjelet elhagyja", () => {
    expect(normalizeCode("abc-def")).toBe("ABCDEF");
    expect(normalizeCode(" ab c d e f ")).toBe("ABCDEF");
    expect(normalizeCode("abc–def")).toBe("ABCDEF"); // gondolatjel (U+2013)
    expect(normalizeCode("k7m2p9")).toBe("K7M2P9");
  });

  it("minden mást elutasít", () => {
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("ABCDE")).toBeNull();
    expect(normalizeCode("ABCDEFG")).toBeNull();
    expect(normalizeCode("ABCDE0")).toBeNull();
    expect(normalizeCode("ABCDEO")).toBeNull();
    expect(normalizeCode("ABCDE1")).toBeNull();
    expect(normalizeCode("ABCDEI")).toBeNull();
    expect(normalizeCode("ÁBCDEF")).toBeNull();
    expect(normalizeCode("ABC.DE")).toBeNull();
  });
});

// Minimális, memóriabeli Supabase-utánzat: csak a lib/family.ts által használt lánchívások.
type Row = Record<string, unknown>;
type DbError = { code: string; message: string };

class FakeDb {
  tables: Record<string, Row[]> = { families: [], family_members: [] };
  failNext: Record<string, DbError> = {}; // "tábla:művelet" → a következő ilyen hívás hibája
  private seq = 0;
  nextId() {
    return `fam-${++this.seq}`;
  }
  from(table: string) {
    return new FakeQuery(this, table);
  }
  client() {
    return this as unknown as SupabaseClient;
  }
}

class FakeQuery {
  private op: "select" | "insert" | "upsert" | "delete" = "select";
  private payload: Row | null = null;
  private ignoreDuplicates = false;
  private filters: [string, unknown][] = [];
  private mode: "many" | "single" | "maybe" = "many";
  constructor(
    private db: FakeDb,
    private table: string,
  ) {}
  select() {
    return this;
  }
  insert(row: Row) {
    this.op = "insert";
    this.payload = row;
    return this;
  }
  upsert(row: Row, opts?: { ignoreDuplicates?: boolean }) {
    this.op = "upsert";
    this.payload = row;
    this.ignoreDuplicates = !!opts?.ignoreDuplicates;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push([col, val]);
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  maybeSingle() {
    this.mode = "maybe";
    return this;
  }
  then<T>(resolve: (v: { data: unknown; error: DbError | null }) => T, reject?: (e: unknown) => T) {
    return Promise.resolve()
      .then(() => this.run())
      .then(resolve, reject);
  }
  private run(): { data: unknown; error: DbError | null } {
    const key = `${this.table}:${this.op}`;
    const injected = this.db.failNext[key];
    if (injected) {
      delete this.db.failNext[key];
      return { data: null, error: injected };
    }
    const rows = this.db.tables[this.table];
    const match = (r: Row) => this.filters.every(([c, v]) => r[c] === v);
    if (this.op === "select") {
      const found = rows.filter(match);
      return { data: this.mode === "many" ? found : (found[0] ?? null), error: null };
    }
    if (this.op === "delete") {
      this.db.tables[this.table] = rows.filter((r) => !match(r));
      return { data: null, error: null };
    }
    const row = { ...this.payload } as Row;
    const conflict =
      this.table === "families"
        ? rows.find((r) => r.code === row.code)
        : rows.find((r) => r.family_id === row.family_id && r.user_id === row.user_id);
    if (conflict) {
      if (this.op === "upsert" && this.ignoreDuplicates) return { data: null, error: null };
      if (this.op === "upsert") {
        Object.assign(conflict, row);
        return { data: null, error: null };
      }
      return { data: null, error: { code: "23505", message: "duplicate key" } };
    }
    if (this.table === "families") row.id = this.db.nextId();
    rows.push(row);
    return { data: row, error: null };
  }
}

describe("createFamily", () => {
  it("új családot hoz létre owner tagsággal", async () => {
    const db = new FakeDb();
    const fam = await createFamily(db.client(), "u1", rng(idx("K7M2P9")));
    expect(fam).toEqual({ family_id: "fam-1", code: "K7M2P9", role: "owner" });
    expect(db.tables.families).toEqual([{ id: "fam-1", code: "K7M2P9", owner_id: "u1" }]);
    expect(db.tables.family_members).toEqual([{ family_id: "fam-1", user_id: "u1", role: "owner" }]);
  });

  it("ha már van saját családja, azt adja vissza, és nem hoz létre újat", async () => {
    const db = new FakeDb();
    const first = await createFamily(db.client(), "u1", rng(idx("AAAAAA")));
    const second = await createFamily(db.client(), "u1", rng(idx("BBBBBB")));
    expect(second).toEqual(first);
    expect(db.tables.families).toHaveLength(1);
    expect(db.tables.family_members).toHaveLength(1);
  });

  it("a hiányzó owner tagságot pótolja a meglévő családnál", async () => {
    const db = new FakeDb();
    db.tables.families.push({ id: "fam-x", code: "CCCCCC", owner_id: "u1" });
    const fam = await createFamily(db.client(), "u1");
    expect(fam.family_id).toBe("fam-x");
    expect(db.tables.family_members).toEqual([{ family_id: "fam-x", user_id: "u1", role: "owner" }]);
  });

  it("kódütközésnél új kóddal újrapróbál", async () => {
    const db = new FakeDb();
    db.tables.families.push({ id: "fam-x", code: "AAAAAA", owner_id: "other" });
    const fam = await createFamily(db.client(), "u1", rng(idx("AAAAAA"), idx("AAAAAA"), idx("BBBBBB")));
    expect(fam.code).toBe("BBBBBB");
    expect(db.tables.families).toHaveLength(2);
  });

  it(`${MAX_CODE_ATTEMPTS} ütközés után feladja`, async () => {
    const db = new FakeDb();
    db.tables.families.push({ id: "fam-x", code: "AAAAAA", owner_id: "other" });
    const always = rng(...Array.from({ length: MAX_CODE_ATTEMPTS }, () => idx("AAAAAA")), idx("BBBBBB"));
    await expect(createFamily(db.client(), "u1", always)).rejects.toThrow("family_code_exhausted");
    expect(db.tables.families).toHaveLength(1);
  });

  it("más adatbázis-hibát nem próbál újra, hanem továbbdob", async () => {
    const db = new FakeDb();
    db.failNext["families:insert"] = { code: "42501", message: "denied" };
    await expect(createFamily(db.client(), "u1")).rejects.toMatchObject({ code: "42501" });
    expect(db.tables.families).toHaveLength(0);
  });

  it("ha a tagság-sor nem jön létre, a családot visszatörli", async () => {
    const db = new FakeDb();
    db.failNext["family_members:insert"] = { code: "08006", message: "connection" };
    await expect(createFamily(db.client(), "u1")).rejects.toMatchObject({ code: "08006" });
    expect(db.tables.families).toHaveLength(0);
  });
});

describe("joinFamily", () => {
  async function seeded() {
    const db = new FakeDb();
    await createFamily(db.client(), "grandchild", rng(idx("K7M2P9")));
    return db;
  }

  it("kóddal member szerepben csatlakozik (kisbetű, kötőjel is jó)", async () => {
    const db = await seeded();
    const res = await joinFamily(db.client(), "grandma", "k7m-2p9");
    expect(res).toEqual({ ok: true, family: { family_id: "fam-1", code: "K7M2P9", role: "member" } });
    expect(db.tables.family_members).toContainEqual({ family_id: "fam-1", user_id: "grandma", role: "member" });
  });

  it("ismételt csatlakozás nem hiba és nem duplikál", async () => {
    const db = await seeded();
    await joinFamily(db.client(), "grandma", "K7M2P9");
    const again = await joinFamily(db.client(), "grandma", "K7M2P9");
    expect(again.ok).toBe(true);
    expect(db.tables.family_members.filter((m) => m.user_id === "grandma")).toHaveLength(1);
  });

  it("a saját családjához a tulajdonos nem csatlakozhat, és a szerepe marad owner", async () => {
    const db = await seeded();
    expect(await joinFamily(db.client(), "grandchild", "K7M2P9")).toEqual({ ok: false, error: "own_family" });
    expect(db.tables.family_members).toEqual([{ family_id: "fam-1", user_id: "grandchild", role: "owner" }]);
  });

  it("meglévő tagság szerepét nem írja felül", async () => {
    const db = await seeded();
    db.tables.family_members.push({ family_id: "fam-1", user_id: "co", role: "owner" });
    expect((await joinFamily(db.client(), "co", "K7M2P9")).ok).toBe(true);
    expect(db.tables.family_members).toContainEqual({ family_id: "fam-1", user_id: "co", role: "owner" });
  });

  it("ismeretlen kód: not_found", async () => {
    const db = await seeded();
    expect(await joinFamily(db.client(), "grandma", "ZZZZZZ")).toEqual({ ok: false, error: "not_found" });
    expect(db.tables.family_members).toHaveLength(1);
  });

  it("rossz hossz: bad_length; 6 karakter, de nem a kód ábécéjéből: not_found", async () => {
    const db = await seeded();
    expect(await joinFamily(db.client(), "grandma", "K7M2P")).toEqual({ ok: false, error: "bad_length" });
    expect(await joinFamily(db.client(), "grandma", "")).toEqual({ ok: false, error: "bad_length" });
    expect(await joinFamily(db.client(), "grandma", "K7M2PO")).toEqual({ ok: false, error: "not_found" });
  });

  it("adatbázis-hibát továbbdob", async () => {
    const db = await seeded();
    db.failNext["family_members:upsert"] = { code: "08006", message: "connection" };
    await expect(joinFamily(db.client(), "grandma", "K7M2P9")).rejects.toMatchObject({ code: "08006" });
  });
});

describe("API: /api/family/create és /api/family/join", () => {
  function post(path: string, body?: unknown, ip = "203.0.113.1") {
    return new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function call(route: (r: Request) => Promise<Response>, req: Request) {
    const res = await route(req);
    expect(res.headers.get("cache-control")).toBe("no-store");
    return { status: res.status, body: await res.json() };
  }
  function setup(user: RequestUser | null) {
    const db = new FakeDb();
    server.admin = db.client();
    server.user = user;
    return db;
  }

  it("kapu: 503 Supabase nélkül, 401 bejelentkezés nélkül, 403 anonim felhasználónak", async () => {
    for (const route of [createRoute, joinRoute]) {
      server.admin = null;
      expect(await call(route, post("/x", { code: "K7M2P9" }))).toEqual({
        status: 503,
        body: { error: "A családi funkció most nem elérhető." },
      });
      setup(null);
      expect(await call(route, post("/x", { code: "K7M2P9" }))).toEqual({
        status: 401,
        body: { error: "Jelentkezz be." },
      });
      const db = setup({ id: "anon", isAnonymous: true });
      expect(await call(route, post("/x", { code: "K7M2P9" }))).toEqual({
        status: 403,
        body: { error: "A családhoz előbb mentsd a fiókodat Google-lal." },
      });
      expect(db.tables.families).toHaveLength(0);
    }
  });

  it("létrehozás, majd csatlakozás a kóddal; hibakódok magyar üzenettel", async () => {
    const db = setup({ id: "grandchild", isAnonymous: false });
    const created = await call(createRoute, post("/api/family/create"));
    expect(created.status).toBe(200);
    expect(created.body).toMatchObject({ family_id: "fam-1", role: "owner" });
    const code: string = created.body.code;

    expect(await call(joinRoute, post("/api/family/join", { code }))).toEqual({
      status: 409,
      body: { error: "Ez a te családod kódja. A nagyi telefonján add meg." },
    });

    server.user = { id: "grandma", isAnonymous: false };
    expect(await call(joinRoute, post("/api/family/join", { code: "K7M" }, "203.0.113.2"))).toEqual({
      status: 400,
      body: { error: "A kód 6 karakter." },
    });
    expect(await call(joinRoute, post("/api/family/join", {}, "203.0.113.2"))).toMatchObject({ status: 400 });
    const unknown = code === "ZZZZZZ" ? "YYYYYY" : "ZZZZZZ";
    expect(await call(joinRoute, post("/api/family/join", { code: unknown }, "203.0.113.2"))).toEqual({
      status: 404,
      body: { error: "Nincs ilyen családkód. Ellenőrizd, és próbáld újra." },
    });
    expect(await call(joinRoute, post("/api/family/join", { code: code.toLowerCase() }, "203.0.113.2"))).toEqual({
      status: 200,
      body: { family_id: "fam-1", code, role: "member" },
    });
    expect(db.tables.family_members).toContainEqual({ family_id: "fam-1", user_id: "grandma", role: "member" });
  });

  it("10 hibás kód után 429 ugyanarról az IP-ről (jó kóddal is), más IP és felhasználó nincs blokkolva", async () => {
    const db = setup({ id: "owner-x", isAnonymous: false });
    await createFamily(db.client(), "owner-x", rng(idx("K7M2P9")));
    server.user = { id: "guesser", isAnonymous: false };
    for (let i = 0; i < 10; i++) {
      expect((await call(joinRoute, post("/j", { code: "ZZZZZZ" }, "198.51.100.7"))).status).toBe(404);
    }
    expect(await call(joinRoute, post("/j", { code: "K7M2P9" }, "198.51.100.7"))).toEqual({
      status: 429,
      body: { error: "Túl sok hibás kód. Próbáld újra negyedóra múlva." },
    });
    // Ugyanaz a felhasználó más IP-ről is blokkolva van.
    expect((await call(joinRoute, post("/j", { code: "K7M2P9" }, "198.51.100.8"))).status).toBe(429);
    server.user = { id: "grandma-2", isAnonymous: false };
    expect((await call(joinRoute, post("/j", { code: "K7M2P9" }, "198.51.100.9"))).status).toBe(200);
  });

  it("adatbázis-hibánál 500, és csak hibakódot naplóz", async () => {
    const db = setup({ id: "u-err", isAnonymous: false });
    db.failNext["families:select"] = { code: "08006", message: "secret detail" };
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await call(createRoute, post("/api/family/create"))).toEqual({
      status: 500,
      body: { error: "A családot most nem sikerült létrehozni. Próbáld újra később." },
    });
    expect(logged).toHaveBeenCalledWith(JSON.stringify({ code: "family_create_failed", kind: "object", detail: "08006" }));
    logged.mockRestore();
  });
});

describe("createAttemptGuard", () => {
  it("max hibás próbálkozás után blokkol, az ablak lejártával felold", () => {
    const guard = createAttemptGuard({ max: 3, windowMs: 1000 });
    for (let i = 0; i < 2; i++) guard.fail("ip:a", 0);
    expect(guard.blocked("ip:a", 10)).toBe(false);
    guard.fail("ip:a", 20);
    expect(guard.blocked("ip:a", 30)).toBe(true);
    expect(guard.blocked("ip:b", 30)).toBe(false);
    expect(guard.blocked("ip:a", 1000)).toBe(false);
    guard.fail("ip:a", 1000);
    expect(guard.blocked("ip:a", 1001)).toBe(false);
  });

  it("a kulcsok száma korlátos", () => {
    const guard = createAttemptGuard({ max: 1, windowMs: 1000, maxKeys: 2 });
    guard.fail("a", 0);
    guard.fail("b", 0);
    guard.fail("c", 0);
    expect(guard.blocked("a", 1)).toBe(false);
    expect(guard.blocked("c", 1)).toBe(true);
  });
});

describe("családi nézet segédfüggvényei", () => {
  const alert: AlertRow = { id: "a1", brand: "Magyar Posta", created_at: "2026-09-27T12:05:00Z" };

  it("magyar dátum és a riasztás sora", () => {
    expect(formatAlertTime(alert.created_at, "Europe/Budapest")).toBe("2026. szeptember 27. 14:05");
    expect(alertLine(alert, "Europe/Budapest")).toBe("PIROS ítélet – Magyar Posta – 2026. szeptember 27. 14:05");
  });

  it("toAlertRow csak az id, brand, created_at mezőket veszi át", () => {
    expect(toAlertRow({ ...alert, family_id: "f", verdict: "red" })).toEqual(alert);
    expect(toAlertRow({ id: "x" })).toBeNull();
    expect(toAlertRow(null)).toBeNull();
  });

  it("mergeAlert: elejére tesz, nem duplikál, legfeljebb 50", () => {
    const older: AlertRow = { ...alert, id: "a0" };
    expect(mergeAlert([older], alert).map((a) => a.id)).toEqual(["a1", "a0"]);
    expect(mergeAlert([alert, older], alert).map((a) => a.id)).toEqual(["a1", "a0"]);
    const full = Array.from({ length: ALERT_LIMIT }, (_, i) => ({ ...alert, id: `x${i}` }));
    const merged = mergeAlert(full, alert);
    expect(merged).toHaveLength(ALERT_LIMIT);
    expect(merged[0].id).toBe("a1");
  });

  it("parseMemberships: beágyazott család objektumként vagy tömbként, owner előre, hibás sor kimarad", () => {
    expect(
      parseMemberships([
        { family_id: "f2", role: "member", families: [{ id: "f2", code: "BBBBBB" }] },
        { family_id: "f1", role: "owner", families: { id: "f1", code: "AAAAAA" } },
        { family_id: "f3", role: "admin", families: { id: "f3", code: "CCCCCC" } },
        { family_id: "f4", role: "member", families: null },
      ]),
    ).toEqual([
      { family_id: "f1", role: "owner", code: "AAAAAA" },
      { family_id: "f2", role: "member", code: "BBBBBB" },
    ]);
    expect(parseMemberships(null)).toEqual([]);
  });
});
