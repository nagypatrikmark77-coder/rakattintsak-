import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ENTITIES } from "@/lib/kb";
import {
  analyzeLink,
  applyRedirect,
  extractUrls,
  matchesDomain,
  normalizeUrlForCompare,
  RISKY_TLDS,
  SHORTENERS,
  urlSetsDiffer,
} from "@/lib/links";
import type { Sample } from "@/lib/types";

const a = (raw: string) => analyzeLink(raw, ENTITIES);

// Minden rekonstruált mintához a pontosan várt linkek (sorrendben).
const EXPECTED_LINKS: Record<string, string[]> = {
  gls_small_fee_foreign: ["https://gls-hu-delivery.top/cim"],
  gls_typosquat: ["https://gls-grouq.com/hu"],
  foxpost_pro: ["foxpost.pro/atvetel"],
  foxpost_redirect_trick: ["https://foxpost-hu.delivery-track.xyz"],
  dpd_address_24h: ["https://bit.ly/dpd-hu-cim"],
  posta_fee_wrong_path: ["https://posta-kezbesites-biztonsagos.com/fizetes"],
  nav_refund_102k: ["https://nav-visszaterites.online/igenyles"],
  nav_official_domain_but_sms_link: ["https://nav.gov.hu.adoellenorzes.info"],
  mvm_disconnect: ["https://mvmnextrendezes.com"],
  mvm_info_tld: ["mvmnexthu.info"],
  toll_debt: ["https://utdij-rendezes.site"],
  mbh_locked: ["https://mbh-azonositas.com"],
  family_whatsapp: ["wa.me/+36200000000"],
  family_money: [],
  telekom_points: ["https://telekom-pontok.shop"],
  prompt_injection: ["https://otp-biztonsag.xyz"],
  legit_otp_code: [],
  legit_posta_vam: ["https://www.posta.hu/szolgaltatasok/vam"],
  legit_foxpost_arrival: ["https://www.foxpost.hu/csomagkovetes/"],
  legit_dpd_official_number: ["https://www.dpd.com/hu/hu/"],
  legit_mvm_no_link: [],
  legit_family_normal: [],
  tricky_punycode: ["https://xn--otpbnk-8ta.hu"],
  tricky_subdomain_brand: ["https://kh.hu.ugyfel-ellenorzes.com/belepes"],
  tricky_ip_link: ["http://185.23.44.12/erste/login"],
};

const fixture = JSON.parse(readFileSync("tests/fixtures/reconstructed.json", "utf8")) as { samples: Sample[] };

describe("extractUrls – rekonstruált minták", () => {
  it("minden minta szerepel a táblában", () => {
    expect(fixture.samples.length).toBeGreaterThan(0);
    for (const s of fixture.samples) expect(Object.keys(EXPECTED_LINKS)).toContain(s.id);
  });
  it.each(fixture.samples.map((s) => [s.id, s.text ?? ""] as const))("%s", (id, text) => {
    expect(extractUrls(text)).toEqual(EXPECTED_LINKS[id]);
  });
});

describe("extractUrls – szélső esetek", () => {
  it.each([
    ["Fizessen 3.500 Ft-ot a Kft. részére, stb.", []],
    ["A cim hianyos.Kerjuk erositse meg", []],
    ["Felado: ertesites@tarhely.gov.hu, valaszcim john.doe@gmail.com", []],
    ["Irjon ide: szabo.me@freemail.hu", []],
    ["Link: https://otpbank.hu@evil.top/x", ["https://otpbank.hu@evil.top/x"]],
    ["Nézd meg (www.posta.hu).", ["www.posta.hu"]],
    ["«https://x.hu/a»!", ["https://x.hu/a"]],
    ["„https://x.hu/b”, és 'foxpost.pro/c';", ["https://x.hu/b", "foxpost.pro/c"]],
    ["HTTPS://WWW.POSTA.HU/x?", ["HTTPS://WWW.POSTA.HU/x"]],
    ["a: bit.ly/x b: bit.ly/x c: https://bit.ly/x", ["bit.ly/x", "https://bit.ly/x"]],
    ["Ellenorizze: http://185.23.44.12/erste/login.", ["http://185.23.44.12/erste/login"]],
    ["Rendezze most:mvmnexthu.info!", ["mvmnexthu.info"]],
    ["Datum 2026.09.27, ido 10.30", []],
  ])("%s", (text, expected) => {
    expect(extractUrls(text)).toEqual(expected);
  });
});

describe("analyzeLink – alapmezők", () => {
  it("séma nélkül https-t tesz elé, redirect-mezők üresek", () => {
    const l = a("foxpost.pro/atvetel");
    expect(l).toMatchObject({
      raw: "foxpost.pro/atvetel",
      url: "https://foxpost.pro/atvetel",
      hostname: "foxpost.pro",
      registrable_domain: "foxpost.pro",
      final_url: null,
      final_hostname: null,
      redirect_hops: 0,
      redirect_error: null,
    });
  });
  it("nem értelmezhető link: minden null/üres", () => {
    const l = a("https://exa mple.com");
    expect(l).toMatchObject({ url: null, hostname: null, registrable_domain: null, lookalike_of: null });
    expect(l.official_entity_ids).toEqual([]);
  });
});

describe("analyzeLink – hivatalos / listázott / útvonal", () => {
  it("posta vám útvonal: hivatalos és engedett útvonal", () => {
    const l = a("https://www.posta.hu/szolgaltatasok/vam");
    expect(l.official_entity_ids).toEqual(["posta"]);
    expect(l.allowed_path_entity_ids).toEqual(["posta"]);
    expect(l.lookalike_of).toBeNull();
  });
  it("posta más útvonal: hivatalos, de nem engedett", () => {
    const l = a("https://www.posta.hu/fizetes");
    expect(l.official_entity_ids).toEqual(["posta"]);
    expect(l.allowed_path_entity_ids).toEqual([]);
  });
  it.each([
    ["https://www.posta.hu/szolgaltatasok/vam/x", ["posta"]],
    ["https://posta.hu/szolgaltatasok/vam", ["posta"]],
    ["https://www.posta.hu/szolgaltatasok/vamx", []],
    ["https://evil.com/posta.hu/szolgaltatasok/vam", []],
    ["https://posta.hu.evil.com/szolgaltatasok/vam", []],
  ])("útvonal %s", (raw, expected) => {
    expect(a(raw).allowed_path_entity_ids).toEqual(expected);
  });
  it.each([
    ["https://www.foxpost.hu/csomagkovetes/", "foxpost"],
    ["https://www.dpd.com/hu/hu/", "dpd"],
    ["https://ugyintezes.police.hu", "police"],
    ["https://nav.gov.hu", "nav"],
    ["https://netbank.otpbank.hu/x", "otp"],
  ])("hivatalos: %s", (raw, id) => {
    expect(a(raw).official_entity_ids).toEqual([id]);
  });
  it("nav.gov.hu a kau gov.hu (nem ellenőrzött) domainjére is illeszkedik", () => {
    expect(a("https://nav.gov.hu").listed_unverified_entity_ids).toEqual(["kau"]);
  });
  it.each([
    ["https://raiffeisen.hu", ["raiffeisen"]],
    ["mkb.hu", ["mbh"]],
    ["https://www.cib.hu", ["cib"]],
    ["https://www.budapestbank.hu/x", ["mbh"]],
  ])("listázott, nem ellenőrzött: %s", (raw, ids) => {
    const l = a(raw);
    expect(l.official_entity_ids).toEqual([]);
    expect(l.listed_unverified_entity_ids).toEqual(ids);
    expect(l.lookalike_of).toBeNull();
  });
  it("otpbank.co.hu nem OTP (co.hu public suffix), hanem hasonmás", () => {
    const l = a("https://otpbank.co.hu");
    expect(l.official_entity_ids).toEqual([]);
    expect(l.lookalike_of).toBe("otp");
  });
  it("matchesDomain: végződés-egyezés címkehatáron", () => {
    expect(matchesDomain("nav.gov.hu", "nav.gov.hu")).toBe(true);
    expect(matchesDomain("www.posta.hu", "posta.hu")).toBe(true);
    expect(matchesDomain("fakeposta.hu", "posta.hu")).toBe(false);
    expect(matchesDomain("posta.hu.evil.com", "posta.hu")).toBe(false);
  });
});

describe("analyzeLink – hasonmás", () => {
  it.each([
    ["foxpost.pro", "foxpost"],
    ["https://foxpost-hu.delivery-track.xyz", "foxpost"],
    ["https://mvmnextrendezes.com", "mvm"],
    ["mvmnexthu.info", "mvm"],
    ["https://posta-kezbesites-biztonsagos.com/fizetes", "posta"],
    ["https://telekom-pontok.shop", "telekom"],
    ["https://utdij-rendezes.site", "nusz"],
    ["https://otp-biztonsag.xyz", "otp"],
    ["https://nav-visszaterites.online/igenyles", "nav"],
    ["https://mbh-azonositas.com", "mbh"],
    ["https://gls-hu-delivery.top/cim", "gls"],
    ["https://nav.gov.hu.adoellenorzes.info", "nav"],
    ["https://kh.hu.ugyfel-ellenorzes.com/belepes", "kh"],
    ["https://posta.hu-csomag.top", "posta"],
    ["https://gls-grouq.com/hu", "gls"],
    ["https://otpbnk.com", "otp"],
    ["https://otpbank.com", "otp"],
    ["https://telecom.hu", "telekom"],
    ["https://telekorn.hu", "telekom"],
    ["https://raiffeisem.hu", "raiffeisen"],
  ])("%s → %s", (raw, id) => {
    expect(a(raw).lookalike_of).toBe(id);
  });
  it.each([
    "mav.hu",
    "dhl.com",
    "google.com",
    "emag.hu",
    "index.hu",
    "iphone.com",
    "money.hu",
    "english.hu",
    "one.google.com",
    "phone.hungary.com", // "one.hu" szó közepén: a (c) szabály címkehatárt kér
    "wa.me",
    "bit.ly",
    "https://www.posta.hu",
    "https://www.foxpost.hu",
    "https://www.dpd.com",
    "https://nav.gov.hu",
    "https://ugyintezes.police.hu",
    "https://raiffeisen.hu",
    "mkb.hu",
    "https://www.cib.hu",
    "http://185.23.44.12/erste/login",
  ])("%s nem hasonmás", (raw) => {
    expect(a(raw).lookalike_of).toBeNull();
  });
});

describe("analyzeLink – jelzők", () => {
  it("whatsapp", () => {
    expect(a("wa.me/+36200000000").whatsapp).toBe(true);
    expect(a("https://api.whatsapp.com/send?phone=36200000000").whatsapp).toBe(true);
    expect(a("https://chat.whatsapp.com/AbCd").whatsapp).toBe(true);
    expect(a("https://whatsapp-hu.com").whatsapp).toBe(false);
    expect(a("https://www.posta.hu").whatsapp).toBe(false);
  });
  it("punycode", () => {
    const l = a("https://xn--otpbnk-8ta.hu");
    expect(l.punycode).toBe(true);
    expect(l.hostname).toBe("xn--otpbnk-8ta.hu");
    expect(a("https://otpbánk.hu").punycode).toBe(true);
    expect(a("https://otpbank.hu").punycode).toBe(false);
  });
  it("IP-cím host", () => {
    const l = a("http://185.23.44.12/erste/login");
    expect(l).toMatchObject({ ip_host: true, hostname: "185.23.44.12", registrable_domain: null });
    expect(a("http://[2001:db8::1]/x").ip_host).toBe(true);
    expect(a("https://185-23-44-12.hu").ip_host).toBe(false);
  });
  it("@ az authority-ben", () => {
    const l = a("https://otpbank.hu@evil.top/x");
    expect(l).toMatchObject({ has_at: true, hostname: "evil.top", risky_tld: true });
    expect(l.official_entity_ids).toEqual([]);
    expect(a("https://evil.top/x?to=a@b.hu").has_at).toBe(false);
  });
  it("linkrövidítő", () => {
    expect(SHORTENERS).toContain("bit.ly");
    expect(a("https://bit.ly/dpd-hu-cim").shortener).toBe(true);
    expect(a("https://www.bit.ly/x").shortener).toBe(true);
    expect(a("t.co/x").shortener).toBe(true);
    expect(a("https://bitly.com").shortener).toBe(false);
  });
  it("kockázatos TLD", () => {
    expect(RISKY_TLDS).toContain("xyz");
    expect(a("https://foxpost-hu.delivery-track.xyz").risky_tld).toBe(true);
    expect(a("https://telekom-pontok.shop").risky_tld).toBe(true);
    expect(a("https://valami.shop.hu").risky_tld).toBe(false);
    expect(a("https://www.posta.hu").risky_tld).toBe(false);
  });
});

describe("applyRedirect", () => {
  it("bit.ly → www.dpd.com: rövidítő marad, hivatalos metszet üres", () => {
    const l = applyRedirect(a("https://bit.ly/dpd-hu-cim"), { final_url: "https://www.dpd.com/hu/hu/", hops: 1, error: null }, ENTITIES);
    expect(l).toMatchObject({
      final_url: "https://www.dpd.com/hu/hu/",
      final_hostname: "www.dpd.com",
      redirect_hops: 1,
      redirect_error: null,
      shortener: true,
      lookalike_of: null,
      hostname: "bit.ly",
    });
    expect(l.official_entity_ids).toEqual([]);
  });
  it("hivatalos → hivatalos másik host: metszet megmarad", () => {
    const l = applyRedirect(
      a("https://www.posta.hu/szolgaltatasok/vam"),
      { final_url: "https://posta.hu/szolgaltatasok/vam/", hops: 1, error: null },
      ENTITIES,
    );
    expect(l.official_entity_ids).toEqual(["posta"]);
    expect(l.allowed_path_entity_ids).toEqual(["posta"]);
  });
  it("hivatalos → csaló: nincs hivatalos, a hasonmás a végcélból jön", () => {
    const l = applyRedirect(a("https://www.foxpost.hu"), { final_url: "https://foxpost.pro/x", hops: 2, error: null }, ENTITIES);
    expect(l.official_entity_ids).toEqual([]);
    expect(l.lookalike_of).toBe("foxpost");
  });
  it("jelzők: VAGY, kivéve a rövidítőt (csak látható)", () => {
    const l = applyRedirect(a("https://bit.ly/x"), { final_url: "https://otp-biztonsag.xyz/", hops: 1, error: null }, ENTITIES);
    expect(l).toMatchObject({ shortener: true, risky_tld: true, lookalike_of: "otp" });
    const m = applyRedirect(a("https://www.dpd.com"), { final_url: "https://bit.ly/x", hops: 1, error: null }, ENTITIES);
    expect(m.shortener).toBe(false);
    const w = applyRedirect(a("https://bit.ly/y"), { final_url: "https://wa.me/36200000000", hops: 1, error: null }, ENTITIES);
    expect(w.whatsapp).toBe(true);
  });
  it("hiba: a végcél null, a hiba és az ugrásszám beíródik, a többi marad", () => {
    const before = a("https://www.posta.hu/szolgaltatasok/vam");
    const l = applyRedirect(before, { final_url: null, hops: 0, error: "timeout" }, ENTITIES);
    expect(l).toEqual({ ...before, redirect_error: "timeout" });
  });
});

describe("normalizeUrlForCompare / urlSetsDiffer", () => {
  it.each([
    ["https://www.Posta.HU/szolgaltatasok/vam/", "www.posta.hu/szolgaltatasok/vam"],
    ["HTTP://Foxpost.pro/Atvetel.", "foxpost.pro/Atvetel"],
    [" foxpost.pro/atvetel ", "foxpost.pro/atvetel"],
    ["https://x.hu/", "x.hu"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizeUrlForCompare(raw)).toBe(expected);
  });
  it("halmazként hasonlít", () => {
    expect(urlSetsDiffer(["https://foxpost.pro/atvetel"], ["foxpost.pro/atvetel"])).toBe(false);
    expect(urlSetsDiffer([], [])).toBe(false);
    expect(urlSetsDiffer(["a.hu", "a.hu"], ["https://a.hu/"])).toBe(false);
    expect(urlSetsDiffer(["b.hu", "a.hu"], ["a.hu", "b.hu"])).toBe(false);
    expect(urlSetsDiffer(["a.hu"], ["a.hu", "b.hu"])).toBe(true);
    expect(urlSetsDiffer(["https://otpbank.hu"], ["https://otpbamk.hu"])).toBe(true);
    expect(urlSetsDiffer(["a.hu"], [])).toBe(true);
  });
});

describe("hasonmás: köznyelvi szavak és állami aldomainek nem adnak hamis riasztást", () => {
  const la = (raw: string) => analyzeLink(raw, ENTITIES).lookalike_of;
  it.each(["https://sneakers.hu", "https://bonusz.hu", "https://tarhely.eu", "https://peak.com", "https://mytarhely.hu"])(
    "%s nem hasonmás",
    (raw) => expect(la(raw)).toBeNull(),
  );
  it.each([
    ["https://posta-kezbesites-biztonsagos.com/fizetes", "posta"],
    ["https://neak-ellenorzes.com", "neak"],
    ["https://utdij-rendezes.site", "nusz"],
    ["https://nav-visszaterites.online/igenyles", "nav"],
    ["https://nav.gov.hu.adoellenorzes.info", "nav"],
  ])("%s → %s", (raw, id) => expect(la(raw)).toBe(id));
});

describe("applyRedirect: az útvonal-szabály a látható linkre vonatkozik", () => {
  const vam = () => analyzeLink("https://www.posta.hu/szolgaltatasok/vam", ENTITIES);
  it("hivatalos Posta-aldomainre továbbító vámlink megtartja a megengedett útvonalat (valódi 301 → net.posta.hu)", () => {
    const out = applyRedirect(vam(), { final_url: "https://net.posta.hu/dashboard/public/dashboard-ui/vam/", hops: 1, error: null }, ENTITIES);
    expect(out.official_entity_ids).toEqual(["posta"]);
    expect(out.allowed_path_entity_ids).toEqual(["posta"]);
  });
  it("idegen domainre továbbító vámlink elveszti a hivatalos státuszt és a megengedett útvonalat", () => {
    const out = applyRedirect(vam(), { final_url: "https://posta-fizetes.top/vam", hops: 1, error: null }, ENTITIES);
    expect(out.official_entity_ids).toEqual([]);
    expect(out.allowed_path_entity_ids).toEqual([]);
  });
});

describe("repairWrappedUrls: sortöréssel megtört link", () => {
  it("a transcriptben szóközzel megtört linket a modell teljes linkjére cseréli", async () => {
    const { repairWrappedUrls } = await import("@/lib/links");
    const t = "Részleteket a telekom.hu/ aszfmodosulasok oldalon talàl.";
    expect(repairWrappedUrls(["telekom.hu/"], ["telekom.hu/aszfmodosulasok"], t)).toEqual(["telekom.hu/aszfmodosulasok"]);
  });
  it("nem cserél, ha a modell linkje nem szerepel a transcriptben (téves olvasás marad téves)", async () => {
    const { repairWrappedUrls } = await import("@/lib/links");
    expect(repairWrappedUrls(["telekom.hu/"], ["telekom.hu/masik"], "a telekom.hu/ aszf oldalon")).toEqual(["telekom.hu/"]);
  });
});
