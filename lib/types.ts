// Közös szerződés a pipeline részei között. Minden modul ehhez igazodik.

export const REQUEST_TYPES = [
  "card_data",
  "password",
  "share_code",
  "money_transfer",
  "app_install",
  "personal_data",
  "call_back",
  "click_link",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const PRESSURE_TYPES = [
  "small_fee",
  "prize",
  "family_impersonation",
  "account_block_threat",
  "new_phone_number",
  "deadline",
  "secrecy_request",
] as const;
export type PressureType = (typeof PRESSURE_TYPES)[number];

// Egy jel és a hozzá tartozó szó szerinti idézet a transcriptből.
export type Evidenced<T> = { type: T; evidence: string };

// ---- Tudásbázis (data/*.json) ----

export type SmsLinkPolicy = "never" | "path_restricted" | "official_only" | "unknown";

// data/official_entities.json entities[] egy sora, ahogy a fájlban van.
export type OfficialEntityRaw = {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  official_domains: string[]; // host-végződések, pl. "otpbank.hu", "nav.gov.hu"
  legacy_domains_unverified?: string[];
  official_url: string;
  sms_link_policy: SmsLinkPolicy;
  sms_link_policy_note?: string;
  allowed_link_paths?: string[]; // pl. "posta.hu/szolgaltatasok/vam"
  official_email_domains?: string[];
  official_email_senders?: string[];
  official_email_note?: string;
  official_sms_senders?: string[]; // pl. "+36 70 717 7702"
  official_sms_senders_note?: string;
  never_asks?: string[]; // "card_data" | "password" | "bank_account" | "bank_login" | "payment"
  contacts?: Record<string, string>;
  verified: boolean;
  verify_note?: string;
  sources: string[];
};

// lib/kb.ts ad hozzá: hasonmás-kereséshez használt márkatokenek (kisbetűs ASCII).
export type OfficialEntity = OfficialEntityRaw & { brand_tokens: string[] };

export type ScamPatterns = {
  keyword_regex_fallback: Partial<Record<RequestType | PressureType, string[]>>;
};

export type DamageStep = {
  trigger_any?: string[];
  trigger_none?: string[];
  priority: number;
  title: string;
  items: string[];
  links?: { label: string; url: string }[];
};

export type DamageControl = {
  questions: { id: string; text: string }[];
  steps: Record<string, DamageStep>;
};

// ---- Pipeline ----

// "egyeb": a küldő megnevezett, de nincs a listán. "ismeretlen": nem derül ki, ki a küldő.
export type ClaimedSender = string; // OfficialEntity.id | "egyeb" | "ismeretlen"

// A kiolvasás (lib/extract.ts, vagy kulcs nélkül lib/extract-stub.ts) kimenete.
// Szöveges bemenetnél a transcript maga a bemenet.
export type Extraction = {
  transcript: string;
  urls_verbatim: string[];
  claimed_sender: ClaimedSender;
  requests: Evidenced<RequestType>[];
  pressure: Evidenced<PressureType>[];
  contains_code_only: boolean;
  instructions_to_ai: boolean;
  sender_number: string | null; // a látható feladó telefonszám (screenshoton), ha van
  has_attachment: boolean;
};

// Egy link determinisztikus elemzése (lib/links.ts + lib/redirects.ts).
export type LinkAnalysis = {
  raw: string; // ahogy a transcriptben szerepel
  url: string | null; // abszolút URL (hiányzó sémánál https://), null ha nem értelmezhető
  hostname: string | null; // ASCII (punycode) host
  registrable_domain: string | null; // tldts szerint
  final_url: string | null; // redirectek után; null ha nem követtük vagy nem sikerült
  final_hostname: string | null;
  redirect_hops: number;
  redirect_error: string | null; // "timeout" | "blocked_ip" | "dns" | "bad_scheme" | "bad_port" | "too_many_hops" | "network"
  // verified:true szervezetek, akiknek official_domains-ére a látható ÉS (ha ismert) a végső host is illeszkedik. Ez a whitelist.
  official_entity_ids: string[];
  // Szervezetek, akiknek listázott, de nem ellenőrzött domainjére illeszkedik (verified:false official_domains, vagy legacy_domains_unverified).
  // Nem whitelist, de nem is hasonmás és nem márka-eltérés.
  listed_unverified_entity_ids: string[];
  // Szervezetek, akiknek allowed_link_paths valamelyikét a link (látható ÉS ismert végső URL) teljesíti.
  allowed_path_entity_ids: string[];
  lookalike_of: string | null; // OfficialEntity.id, ha hasonmás
  punycode: boolean; // "xn--" a hostban
  ip_host: boolean; // IP-cím a host helyén
  has_at: boolean; // "@" az URL authority részében
  shortener: boolean;
  risky_tld: boolean;
  whatsapp: boolean; // wa.me, api.whatsapp.com, chat.whatsapp.com
};

// A verdict.ts bemenete: az idézet-ellenőrzött és kulcsszóval kiegészített jelek + linkek.
export type Signals = {
  claimed_sender: ClaimedSender;
  requests: Evidenced<RequestType>[];
  pressure: Evidenced<PressureType>[];
  contains_code_only: boolean;
  instructions_to_ai: boolean;
  instructions_evidence: string | null;
  uncertain_read: boolean;
  links: LinkAnalysis[];
  sender_number: string | null; // csak ha a transcriptben is szerepel
  has_attachment: boolean;
  tarhely_sender: boolean; // a transcriptben szerepel: ertesites@tarhely.gov.hu
};

export type Verdict = "gray" | "yellow" | "red";

export type HardRule =
  | "brand_link_mismatch" // állított küldő a listán + link nem az ő (ellenőrzött vagy listázott) domainjére
  | "lookalike" // hasonmás domain
  | "sensitive_request" // card_data | password | share_code
  | "family_money_combo" // family_impersonation + new_phone_number + money_transfer
  | "family_whatsapp_combo" // family_impersonation + new_phone_number + whatsapp link
  | "instructions_to_ai"
  | "entity_link_policy_never" // sms_link_policy == never + bármilyen link
  | "entity_path_restricted_violation" // path_restricted + link nem a megengedett útvonal
  | "entity_never_asks_violation" // kérés metszi a never_asks listát
  | "unexpected_attachment_official_sender"; // ertesites@tarhely.gov.hu + csatolmány

export type ScoredKey =
  | RequestType
  | PressureType
  | "punycode"
  | "ip_or_at"
  | "risky_tld"
  | "shortener"
  | "unknown_domain"
  | "whatsapp_redirect"
  | "foreign_sender_for_hu_entity"
  | "sender_number_mismatch";

export type FiredSignal = { key: ScoredKey; points: number; evidence: string };

export type VerdictResult = {
  verdict: Verdict;
  score: number;
  hard_rules: { rule: HardRule; evidence: string }[];
  fired: FiredSignal[];
  caps: ("all_links_official_max_yellow" | "uncertain_read_min_yellow")[];
};

// POST /api/check válasza.
export type CheckResponse = {
  verdict: Verdict;
  headline: string;
  reasons: { text: string; evidence: string }[];
  actions: string[];
  checked: string[];
  not_checked: string[];
  brand_card?: {
    claimed: string; // szervezet neve
    examined_domain: string; // a vizsgált link hostja ("" ha nincs link)
    official_domain: string; // a szervezet első hivatalos domainje
    matches: boolean; // csak verified:true szervezetnél lehet true
    verified: boolean; // a szervezet adatai ellenőrzöttek-e
    official_url: string;
  };
};

// Eval-minta: tests/fixtures/*.json (egyedi fájl vagy { samples: [...] }).
export type Sample = {
  id: string;
  expected: "scam" | "legit";
  text?: string;
  image_path?: string; // a repó gyökeréhez képest
  sender?: string; // feladó (a screenshoton látható szám)
  note?: string;
  synthetic?: boolean;
  expect_signals?: string[];
  source?: string;
};
