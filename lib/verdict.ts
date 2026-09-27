// Ítéletmotor: kemény szabályok + pontozás + korlátok. Tiszta függvény, nincs I/O.
import type {
  FiredSignal,
  HardRule,
  LinkAnalysis,
  OfficialEntity,
  RequestType,
  ScoredKey,
  Signals,
  Verdict,
  VerdictResult,
} from "./types";

// Csak a pontozott kulcsok; card_data / password / share_code kizárólag kemény szabály.
export const POINTS: Partial<Record<ScoredKey, number>> = {
  punycode: 40,
  ip_or_at: 40,
  app_install: 35,
  money_transfer: 30,
  secrecy_request: 30,
  foreign_sender_for_hu_entity: 30,
  sender_number_mismatch: 30,
  small_fee: 25,
  prize: 25,
  family_impersonation: 25,
  whatsapp_redirect: 25,
  personal_data: 20,
  account_block_threat: 20,
  new_phone_number: 20,
  risky_tld: 15,
  shortener: 15,
  call_back: 15,
  click_link: 10,
  deadline: 10,
  unknown_domain: 5,
};

export const THRESHOLDS = { yellow: 25, red: 40 } as const;

const SENSITIVE: RequestType[] = ["card_data", "password", "share_code"];
const NEVER_ASKS: Record<string, RequestType[]> = {
  card_data: ["card_data"],
  password: ["password"],
  bank_login: ["password"],
  bank_account: ["card_data"],
  payment: ["card_data", "money_transfer"],
};
const TARHELY_SENDER = "ertesites@tarhely.gov.hu";

// Nemzetközi forma "+" nélkül (pl. "36707177702"); null, ha alfanumerikus, túl rövid vagy előtag nélküli.
export function normalizePhone(s: string): string | null {
  const c = s.replace(/[\s\-.()/]/g, "");
  if (!/^\+?\d{6,}$/.test(c)) return null;
  if (c.startsWith("+")) return c.slice(1);
  if (c.startsWith("00")) return c.slice(2);
  if (c.startsWith("06")) return "36" + c.slice(2);
  return null;
}

export function scoreToVerdict(score: number): Verdict {
  return score >= THRESHOLDS.red ? "red" : score >= THRESHOLDS.yellow ? "yellow" : "gray";
}

const isListed = (l: LinkAnalysis) => l.official_entity_ids.length > 0 || l.listed_unverified_entity_ids.length > 0;
const isUnknown = (l: LinkAnalysis) =>
  !isListed(l) &&
  l.lookalike_of === null &&
  !(l.punycode || l.ip_host || l.has_at || l.shortener || l.risky_tld || l.whatsapp);

export function decide(signals: Signals, entities: OfficialEntity[]): VerdictResult {
  const { requests, pressure, links } = signals;
  const entity = entities.find((e) => e.id === signals.claimed_sender);
  const c = entity?.id;
  const req = (t: RequestType) => requests.find((r) => r.type === t);
  const hasPressure = (t: string) => pressure.some((p) => p.type === t);
  const family = hasPressure("family_impersonation");
  const newNumber = hasPressure("new_phone_number");
  const money = req("money_transfer");
  const wa = links.find((l) => l.whatsapp);
  const forbidden = new Set((entity?.never_asks ?? []).flatMap((k) => NEVER_ASKS[k] ?? []));

  const hard_rules: VerdictResult["hard_rules"] = [];
  const hard = (rule: HardRule, evidence: string | null | undefined) => {
    if (evidence != null) hard_rules.push({ rule, evidence });
  };
  hard(
    "brand_link_mismatch",
    c && links.find((l) => !l.official_entity_ids.includes(c) && !l.listed_unverified_entity_ids.includes(c))?.raw,
  );
  hard("lookalike", links.find((l) => l.lookalike_of !== null)?.raw);
  hard("sensitive_request", requests.find((r) => SENSITIVE.includes(r.type))?.evidence);
  hard("family_money_combo", family && newNumber ? money?.evidence : null);
  hard("family_whatsapp_combo", family && newNumber ? wa?.raw : null);
  hard("instructions_to_ai", signals.instructions_to_ai ? (signals.instructions_evidence ?? "") : null);
  hard("entity_link_policy_never", entity?.sms_link_policy === "never" ? links[0]?.raw : null);
  hard(
    "entity_path_restricted_violation",
    c && entity?.sms_link_policy === "path_restricted"
      ? links.find((l) => !l.allowed_path_entity_ids.includes(c))?.raw
      : null,
  );
  hard("entity_never_asks_violation", requests.find((r) => forbidden.has(r.type))?.evidence);
  hard("unexpected_attachment_official_sender", signals.tarhely_sender && signals.has_attachment ? TARHELY_SENDER : null);

  const fired: FiredSignal[] = [];
  const score = (key: ScoredKey, evidence: string) => {
    const points = POINTS[key];
    if (points && !fired.some((f) => f.key === key)) fired.push({ key, points, evidence });
  };
  for (const r of requests) score(r.type, r.evidence);
  const familyCounts = newNumber || !!money || !!wa;
  for (const p of pressure) if (p.type !== "family_impersonation" || familyCounts) score(p.type, p.evidence);
  for (const l of links) {
    if (l.punycode) score("punycode", l.raw);
    if (l.ip_host || l.has_at) score("ip_or_at", l.raw);
    if (l.risky_tld) score("risky_tld", l.raw);
    if (l.shortener) score("shortener", l.raw);
    if (l.whatsapp) score("whatsapp_redirect", l.raw);
    if (isUnknown(l)) score("unknown_domain", l.raw);
  }
  const sender = signals.sender_number;
  const phone = sender ? normalizePhone(sender) : null;
  if (entity && sender && phone) {
    if (!phone.startsWith("36")) score("foreign_sender_for_hu_entity", sender);
    const senders = entity.official_sms_senders ?? [];
    if (senders.length > 0 && !senders.map(normalizePhone).includes(phone)) score("sender_number_mismatch", sender);
  }
  const total = fired.reduce((sum, f) => sum + f.points, 0);

  const caps: VerdictResult["caps"] = [];
  let verdict = scoreToVerdict(total);
  if (hard_rules.length > 0) verdict = "red";
  else if (verdict === "red" && links.length > 0 && links.every(isListed)) {
    verdict = "yellow";
    caps.push("all_links_official_max_yellow");
  } else if (verdict === "gray" && signals.uncertain_read) {
    verdict = "yellow";
    caps.push("uncertain_read_min_yellow");
  }

  return { verdict, score: total, hard_rules, fired, caps };
}
