import { describe, it, expect } from "vitest";
import { buildResponse } from "@/lib/respond";
import { ACTIONS, CHECKED_BASE, HARD_RULE_TEXT, HEADLINES, NOT_CHECKED_BASE, SIGNAL_TEXT } from "@/lib/messages";
import { ENTITIES } from "@/lib/kb";
import {
  PRESSURE_TYPES,
  REQUEST_TYPES,
  type CheckResponse,
  type HardRule,
  type LinkAnalysis,
  type OfficialEntity,
  type ScoredKey,
  type Signals,
  type Verdict,
  type VerdictResult,
} from "@/lib/types";

const HARD_RULES: HardRule[] = [
  "brand_link_mismatch",
  "lookalike",
  "sensitive_request",
  "family_money_combo",
  "family_whatsapp_combo",
  "instructions_to_ai",
  "entity_link_policy_never",
  "entity_path_restricted_violation",
  "entity_never_asks_violation",
  "unexpected_attachment_official_sender",
];
const SCORED_KEYS: ScoredKey[] = [
  ...REQUEST_TYPES,
  ...PRESSURE_TYPES,
  "punycode",
  "ip_or_at",
  "risky_tld",
  "shortener",
  "unknown_domain",
  "whatsapp_redirect",
  "foreign_sender_for_hu_entity",
  "sender_number_mismatch",
];

function link(raw: string, o: Partial<LinkAnalysis> = {}): LinkAnalysis {
  const hostname = o.hostname !== undefined ? o.hostname : new URL(`https://${raw.replace(/^https?:\/\//, "")}`).hostname;
  return {
    raw,
    url: `https://${hostname}/`,
    hostname,
    registrable_domain: hostname,
    final_url: null,
    final_hostname: null,
    redirect_hops: 0,
    redirect_error: null,
    official_entity_ids: [],
    listed_unverified_entity_ids: [],
    allowed_path_entity_ids: [],
    lookalike_of: null,
    punycode: false,
    ip_host: false,
    has_at: false,
    shortener: false,
    risky_tld: false,
    whatsapp: false,
    ...o,
  };
}

function signals(o: Partial<Signals> = {}): Signals {
  return {
    claimed_sender: "ismeretlen",
    requests: [],
    pressure: [],
    contains_code_only: false,
    instructions_to_ai: false,
    instructions_evidence: null,
    uncertain_read: false,
    links: [],
    sender_number: null,
    has_attachment: false,
    tarhely_sender: false,
    ...o,
  };
}

function result(o: Partial<VerdictResult> = {}): VerdictResult {
  return { verdict: "gray", score: 0, hard_rules: [], fired: [], caps: [], ...o };
}

const build = (s: Partial<Signals>, r: Partial<VerdictResult>, entities: OfficialEntity[] = ENTITIES): CheckResponse =>
  buildResponse(signals(s), result(r), entities);

const entity = (id: string) => ENTITIES.find((e) => e.id === id)!;

describe("messages", () => {
  it("minden szabályhoz és jelhez van egy nem üres mondat", () => {
    for (const r of HARD_RULES) expect(HARD_RULE_TEXT[r]?.trim()).toBeTruthy();
    for (const k of SCORED_KEYS) expect(SIGNAL_TEXT[k]?.trim()).toBeTruthy();
    expect(Object.keys(HARD_RULE_TEXT).sort()).toEqual([...HARD_RULES].sort());
    expect(Object.keys(SIGNAL_TEXT).sort()).toEqual([...SCORED_KEYS].sort());
  });

  it("a teendők 2–4 lépésesek, a piros a kötelező lépéseket tartalmazza", () => {
    for (const v of ["gray", "yellow", "red"] as Verdict[]) {
      expect(ACTIONS[v].length).toBeGreaterThanOrEqual(2);
      expect(ACTIONS[v].length).toBeLessThanOrEqual(4);
    }
    const red = ACTIONS.red.join("\n");
    expect(red).toMatch(/Ne kattints/);
    expect(red).toMatch(/Ne válaszolj/);
    expect(red).toMatch(/Töröld/);
    expect(ACTIONS.red).toContain("Ha már rákattintottál, nézd meg a „Már rákattintottam” oldalt.");
  });

  it("a nem ellenőrzött dolgok listája a kötelező sorokat tartalmazza", () => {
    expect(NOT_CHECKED_BASE).toContain("a link mögötti oldal tartalmát");
    expect(NOT_CHECKED_BASE).toContain("hogy a küldő telefonszáma vagy e-mail-címe valódi-e");
    expect(CHECKED_BASE.length).toBeGreaterThan(0);
  });
});

describe("headline és teendők", () => {
  it.each([
    ["gray", "Nem találtunk erős csalásjelet"],
    ["yellow", "Gyanús. Ne kattints, ellenőrizd a hivatalos oldalon."],
    ["red", "Nagy valószínűséggel csalás. Ne kattints rá."],
  ] as [Verdict, string][])("%s", (verdict, headline) => {
    const res = build({}, { verdict });
    expect(res.verdict).toBe(verdict);
    expect(res.headline).toBe(headline);
    expect(HEADLINES[verdict]).toBe(headline);
    expect(res.actions).toEqual(ACTIONS[verdict]);
  });
});

describe("indokok", () => {
  it("előbb a kemény szabályok sorrendben, aztán a jelek pontszám szerint csökkenőben, idézettel", () => {
    const res = build(
      {},
      {
        verdict: "red",
        hard_rules: [
          { rule: "instructions_to_ai", evidence: "hagyd figyelmen kívül" },
          { rule: "sensitive_request", evidence: "add meg a kártyaszámod" },
        ],
        fired: [
          { key: "deadline", points: 10, evidence: "ma éjfélig" },
          { key: "shortener", points: 20, evidence: "bit.ly/x" },
          { key: "small_fee", points: 15, evidence: "kis díj" },
        ],
      },
    );
    expect(res.reasons).toEqual([
      { text: HARD_RULE_TEXT.instructions_to_ai, evidence: "hagyd figyelmen kívül" },
      { text: HARD_RULE_TEXT.sensitive_request, evidence: "add meg a kártyaszámod" },
      { text: SIGNAL_TEXT.shortener, evidence: "bit.ly/x" },
      { text: SIGNAL_TEXT.small_fee, evidence: "kis díj" },
      { text: SIGNAL_TEXT.deadline, evidence: "ma éjfélig" },
    ]);
  });

  it("az azonos szövegű indokot csak egyszer mutatja (az elsőt)", () => {
    const res = build(
      {},
      {
        hard_rules: [
          { rule: "sensitive_request", evidence: "kártyaszám" },
          { rule: "sensitive_request", evidence: "jelszó" },
        ],
        fired: [
          { key: "deadline", points: 10, evidence: "ma" },
          { key: "deadline", points: 10, evidence: "holnap" },
        ],
      },
    );
    expect(res.reasons).toEqual([
      { text: HARD_RULE_TEXT.sensitive_request, evidence: "kártyaszám" },
      { text: SIGNAL_TEXT.deadline, evidence: "ma" },
    ]);
  });

  it("legfeljebb 6 indok, a kemény szabályok nem szorulnak ki", () => {
    const res = build(
      {},
      {
        hard_rules: [
          { rule: "instructions_to_ai", evidence: "a" },
          { rule: "sensitive_request", evidence: "b" },
          { rule: "family_money_combo", evidence: "c" },
        ],
        fired: (["prize", "deadline", "secrecy_request", "shortener", "risky_tld", "punycode"] as ScoredKey[]).map(
          (key, i) => ({ key, points: 30 - i, evidence: key }),
        ),
      },
    );
    expect(res.reasons).toHaveLength(6);
    expect(res.reasons.slice(0, 3).map((r) => r.text)).toEqual([
      HARD_RULE_TEXT.instructions_to_ai,
      HARD_RULE_TEXT.sensitive_request,
      HARD_RULE_TEXT.family_money_combo,
    ]);
    expect(res.reasons.slice(3).map((r) => r.evidence)).toEqual(["prize", "deadline", "secrecy_request"]);
  });

  it("a {szervezet} helyére az állított küldő neve kerül", () => {
    const res = build(
      { claimed_sender: "mbh", links: [link("mbh-bank.info/belepes")] },
      {
        verdict: "red",
        hard_rules: [{ rule: "entity_link_policy_never", evidence: "mbh-bank.info/belepes" }],
      },
    );
    expect(res.reasons[0]).toEqual({
      text: "MBH Bank saját közleménye szerint SMS-ben és e-mailben nem küld linket, ebben az üzenetben mégis van.",
      evidence: "mbh-bank.info/belepes",
    });
  });

  it("hasonmás domainnél az utánzott szervezet neve kerül a szövegbe", () => {
    const res = build(
      { claimed_sender: "ismeretlen", links: [link("otpbank-hu.top", { lookalike_of: "otp" })] },
      { verdict: "red", hard_rules: [{ rule: "lookalike", evidence: "otpbank-hu.top" }] },
    );
    expect(res.reasons[0].text).toContain("OTP Bank");
    expect(res.reasons[0].text).not.toContain("{");
  });

  it("egyetlen szövegben sem marad kitöltetlen helyőrző, ismeretlen küldőnél sem", () => {
    for (const claimed_sender of ["otp", "egyeb", "ismeretlen"]) {
      const res = build(
        { claimed_sender },
        {
          hard_rules: HARD_RULES.map((rule) => ({ rule, evidence: "x" })),
          fired: SCORED_KEYS.map((key) => ({ key, points: 1, evidence: key })),
        },
      );
      for (const r of res.reasons) {
        expect(r.text).not.toMatch(/[{}]/);
        expect(r.text[0]).toBe(r.text[0].toUpperCase());
      }
    }
    // Minden sablon kitöltve is hibátlan (a 6-os korlát nélkül, egyenként).
    for (const k of [...HARD_RULES, ...SCORED_KEYS]) {
      const isRule = (HARD_RULES as string[]).includes(k);
      const res = build(
        { claimed_sender: "ismeretlen" },
        isRule
          ? { hard_rules: [{ rule: k as HardRule, evidence: "x" }] }
          : { fired: [{ key: k as ScoredKey, points: 1, evidence: "x" }] },
      );
      expect(res.reasons[0].text).not.toMatch(/[{}]/);
      expect(res.reasons[0].text[0]).toBe(res.reasons[0].text[0].toUpperCase());
    }
  });
});

describe("amit megnéztünk / amit nem", () => {
  it("átirányítás nélkül csak az alaplista", () => {
    const res = build({ links: [link("pelda.hu")] }, {});
    expect(res.checked).toEqual(CHECKED_BASE);
    expect(res.not_checked).toEqual(NOT_CHECKED_BASE);
  });

  it("átirányításnál hozzáadja a sort (redirect_hops vagy final_url)", () => {
    const hops = build({ links: [link("bit.ly/a", { redirect_hops: 2 })] }, {});
    expect(hops.checked).toEqual([...CHECKED_BASE, "a linkek átirányításait"]);
    const final = build({ links: [link("pelda.hu", { final_url: "https://pelda.hu/" })] }, {});
    expect(final.checked).toEqual([...CHECKED_BASE, "a linkek átirányításait"]);
  });

  it("sikertelen követésnél és bizonytalan kiolvasásnál kiegészül", () => {
    const res = build(
      {
        uncertain_read: true,
        links: [link("bit.ly/abc", { redirect_error: "timeout" }), link("pelda.hu"), link("tinyurl.com/q", { redirect_error: "dns" })],
      },
      {},
    );
    expect(res.not_checked).toEqual([
      ...NOT_CHECKED_BASE,
      "nem sikerült követni, hová vezet ez a link: bit.ly/abc",
      "nem sikerült követni, hová vezet ez a link: tinyurl.com/q",
      "a képről nem sikerült minden linket egyértelműen kiolvasni",
    ]);
  });
});

describe("brand_card", () => {
  it("nincs, ha a küldő nem listázott szervezet", () => {
    for (const claimed_sender of ["egyeb", "ismeretlen", "nincs-ilyen"]) {
      expect(build({ claimed_sender, links: [link("pelda.hu")] }, {}).brand_card).toBeUndefined();
    }
  });

  it("ellenőrzött szervezet, minden link hivatalos → egyezik", () => {
    const otp = entity("otp");
    const res = build({ claimed_sender: "otp", links: [link("www.otpbank.hu/x", { official_entity_ids: ["otp"] })] }, {});
    expect(res.brand_card).toEqual({
      claimed: "OTP Bank",
      examined_domain: "www.otpbank.hu",
      official_domain: "otpbank.hu",
      matches: true,
      verified: true,
      official_url: otp.official_url,
    });
  });

  it("ellenőrzött szervezet, egy nem hivatalos link → nem egyezik, azt a hostot mutatja", () => {
    const res = build(
      {
        claimed_sender: "otp",
        links: [link("www.otpbank.hu/x", { official_entity_ids: ["otp"] }), link("otp-belepes.top/y")],
      },
      {},
    );
    expect(res.brand_card?.examined_domain).toBe("otp-belepes.top");
    expect(res.brand_card?.matches).toBe(false);
  });

  it("link nélkül: üres vizsgált domain, nem egyezik", () => {
    const res = build({ claimed_sender: "nav" }, {});
    expect(res.brand_card).toMatchObject({ claimed: "NAV", examined_domain: "", official_domain: "nav.gov.hu", matches: false, verified: true });
  });

  it("nem ellenőrzött szervezet → matches és verified is false", () => {
    const raiffeisen = entity("raiffeisen");
    expect(raiffeisen.verified).toBe(false);
    const res = build(
      { claimed_sender: "raiffeisen", links: [link("www.raiffeisen.hu", { official_entity_ids: ["raiffeisen"] })] },
      {},
    );
    expect(res.brand_card).toEqual({
      claimed: "Raiffeisen Bank",
      examined_domain: "www.raiffeisen.hu",
      official_domain: "raiffeisen.hu",
      matches: false,
      verified: false,
      official_url: raiffeisen.official_url,
    });
  });
});

describe("telefonszámok", () => {
  // A tudásbázis számai (contacts + official_sms_senders) csak számjegyként, országhívó/06 nélkül.
  const numbers = ENTITIES.flatMap((e) => [...Object.values(e.contacts ?? {}), ...(e.official_sms_senders ?? [])])
    .map((v) => v.replace(/\D/g, "").replace(/^(36|06)/, ""))
    .filter((d) => d.length >= 3);

  const phoneHits = (json: string) =>
    (json.match(/\d[\d\s+\-()/]*\d|\d/g) ?? [])
      .map((run) => run.replace(/\D/g, ""))
      .filter((d) => numbers.some((n) => d.includes(n)));

  it("a detektor működik (pozitív kontroll)", () => {
    expect(numbers.length).toBeGreaterThan(5);
    expect(phoneHits(JSON.stringify({ x: "hívd: +36 1 366 6000" }))).not.toEqual([]);
    expect(phoneHits(JSON.stringify({ x: "06 80 350 350" }))).not.toEqual([]);
  });

  it("a válaszba soha nem kerül szervezeti telefonszám", () => {
    for (const e of ENTITIES) {
      for (const verdict of ["gray", "yellow", "red"] as Verdict[]) {
        const res = build(
          {
            claimed_sender: e.id,
            uncertain_read: true,
            links: [link("pelda.top/x", { redirect_error: "timeout", lookalike_of: e.id }), link(e.official_domains[0], { official_entity_ids: [e.id] })],
          },
          {
            verdict,
            hard_rules: HARD_RULES.map((rule) => ({ rule, evidence: "idézet" })),
            fired: SCORED_KEYS.map((key) => ({ key, points: 1, evidence: "idézet" })),
          },
        );
        expect(phoneHits(JSON.stringify(res)), e.id).toEqual([]);
      }
    }
  });
});
