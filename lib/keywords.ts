// Kulcsszavas tartalék-jelek (tagadásszűréssel), AI-nak címzett szöveg és az állított küldő felismerése.
// Minden illesztés ékezet- és kisbetű-érzéketlen: a foldAccents azonos hosszú, így az indexek az eredetire mutatnak.
import { foldAccents } from "./kb";
import {
  REQUEST_TYPES,
  type Evidenced,
  type Extraction,
  type OfficialEntity,
  type PressureType,
  type RequestType,
  type ScamPatterns,
} from "./types";

type SignalType = RequestType | PressureType;

export type KeywordSignals = {
  requests: Evidenced<RequestType>[];
  pressure: Evidenced<PressureType>[];
  instructions_evidence: string | null;
};

// Általános magyar tövek, amelyek a scam_patterns.json-ból hiányoznak.
export const EXTRA_KEYWORDS: Partial<Record<SignalType, string[]>> = {
  // Csak felszólító / főnévi igenévi alakok: a "átutalás érkezett" típusú valódi banki értesítés ne legyen pénzkérés.
  money_transfer: ["utalj", "utalni", "utald", "átutalni", "utalnál", "küldj pénzt", "fizesd ki", "fizesse ki", "fizessen"],
  // Konkrét alakok: az "új számla" ne legyen új telefonszám.
  new_phone_number: ["új számom", "új számról", "új számra", "új számon", "új számot"],
  // A fájl listájának ragozott alakjai (zároltuk, felfüggesztésre, kikapcsoljuk).
  account_block_threat: ["zárol", "felfüggeszt", "kikapcsol", "letilt"],
};

const W = "[\\p{L}\\p{N}]";
const START = `(?<!${W})`; // szókezdet
const END = `(?!${W})`; // szóvég
const NEGATIONS = ["ne", "soha", "sose"];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Kifejezés -> regex: ékezet nélkül, a szóköz bármilyen whitespace-re illeszt.
const src = (s: string) => esc(foldAccents(s.normalize("NFC").trim())).replace(/\s+/g, "\\s+");

// Tagadás: a találat előtti (mondaton belüli) utolsó 3 szó valamelyike ne/soha/sose.
function negated(before: string): boolean {
  const clause = before.split(/[.!?\n]/).pop() ?? "";
  const words = clause.match(new RegExp("\\p{L}+", "gu")) ?? [];
  return words.slice(-3).some((w) => NEGATIONS.includes(w.toLowerCase()));
}

// Az első nem tagadott találat indexe és hossza; a tő után a szó végéig idéz.
function firstHit(folded: string, keywords: string[]): [number, number] | null {
  const alts = [...keywords].sort((a, b) => b.length - a.length).map(src);
  for (const m of folded.matchAll(new RegExp(`${START}(?:${alts.join("|")})${W}*`, "giu"))) {
    if (!negated(folded.slice(0, m.index))) return [m.index, m.index + m[0].length];
  }
  return null;
}

// AI-nak / elemzőnek címzett szöveg (ékezet nélküli alakokkal).
const AI_SUBJ =
  "(?:(?:elemzo|ertekelo|ellenorzo)\\s+(?:rendszer|program|szoftver)|mesterseges\\s+intelligencia|chatgpt|claude|nyelvi\\s+modell|ai" +
  END +
  "|mi\\s+rendszer)";
const AI_IMP = `(?:jelol(?:d|je)|minosits(?:d|e)|ertekel(?:d|je)|tekints(?:d|e)|kezel(?:d|je)|mond(?:d|ja))${END}`;
const TAIL = "[^.!?\\]\\n]{0,60}";
const OLD_RULES = "(?:korabbi|elozo|fenti|eddigi|osszes|minden)\\s+(?:utasitas|instrukcio|parancs)\\p{L}*";
const FORGET = "(?:figyelmen\\s+kivul|felejtsd\\s+el)";
const INSTRUCTIONS = new RegExp(
  [
    "(?:ignore|disregard)\\s+(?:all|previous|prior|above)(?:\\s+(?:previous|prior|above|of\\s+the|the|your))*\\s+instructions" + END,
    `${FORGET}[\\s\\S]{0,40}?${START}${OLD_RULES}`,
    `${OLD_RULES}[\\s\\S]{0,40}?${START}${FORGET}`,
    `${AI_SUBJ}[\\s\\S]{0,80}?${START}${AI_IMP}${TAIL}`,
    `${AI_IMP}[\\s\\S]{0,80}?${START}${AI_SUBJ}${TAIL}`,
  ]
    .map((p) => `${START}(?:${p})`)
    .join("|"),
  "iu",
);

// Mondat-szintű kizárás: az utánvét (fizetés a futárnál, átvételkor) nem online pénzkérés.
const EXCLUSIONS: Partial<Record<SignalType, RegExp>> = {
  money_transfer: /utanvet|futarnal|futarnak|atvetelkor/i,
};
function excluded(type: SignalType, folded: string, at: number): boolean {
  const re = EXCLUSIONS[type];
  if (!re) return false;
  const start = Math.max(...[".", "!", "?", "\n"].map((c) => folded.lastIndexOf(c, at - 1))) + 1;
  const ends = [".", "!", "?", "\n"].map((c) => folded.indexOf(c, at)).filter((i) => i >= 0);
  return re.test(folded.slice(start, ends.length ? Math.min(...ends) : folded.length));
}

export function findKeywordSignals(transcript: string, patterns: ScamPatterns): KeywordSignals {
  const text = transcript.normalize("NFC");
  const folded = foldAccents(text);
  const all: Partial<Record<SignalType, string[]>> = { ...patterns.keyword_regex_fallback };
  for (const [k, v] of Object.entries(EXTRA_KEYWORDS) as [SignalType, string[]][]) all[k] = [...(all[k] ?? []), ...v];

  const hits: { type: SignalType; evidence: string; at: number }[] = [];
  for (const [type, kws] of Object.entries(all) as [SignalType, string[]][]) {
    const hit = kws.length ? firstHit(folded, kws) : null;
    if (hit && !excluded(type, folded, hit[0])) hits.push({ type, evidence: text.slice(hit[0], hit[1]), at: hit[0] });
  }
  hits.sort((a, b) => a.at - b.at);
  const isRequest = (t: SignalType): t is RequestType => (REQUEST_TYPES as readonly string[]).includes(t);
  const ai = INSTRUCTIONS.exec(folded);
  return {
    requests: hits.flatMap(({ type, evidence }) => (isRequest(type) ? [{ type, evidence }] : [])),
    pressure: hits.flatMap(({ type, evidence }) => (isRequest(type) ? [] : [{ type, evidence }])),
    instructions_evidence: ai ? text.slice(ai.index, ai.index + ai[0].length) : null,
  };
}

// Típus szerinti unió: a kiolvasás tételei elöl, kulcsszó-találat csak még hiányzó típusra.
export function mergeSignals(ex: Extraction, hits: KeywordSignals): Pick<Extraction, "requests" | "pressure"> {
  const union = <T extends string>(a: Evidenced<T>[], b: Evidenced<T>[]) => [
    ...a,
    ...b.filter((h) => !a.some((x) => x.type === h.type)),
  ];
  return { requests: union(ex.requests, hits.requests), pressure: union(ex.pressure, hits.pressure) };
}

// Az állított küldő: a legkorábban előforduló név/alias (egész szóként); egyenlőségnél a hosszabb nyer.
export function detectClaimedSender(transcript: string, entities: OfficialEntity[]): string | null {
  const folded = foldAccents(transcript.normalize("NFC"));
  let best: { id: string; at: number; len: number } | null = null;
  for (const e of entities) {
    for (const alias of [e.name, ...e.aliases]) {
      const m = new RegExp(`${START}${src(alias)}${END}`, "iu").exec(folded);
      if (m && (!best || m.index < best.at || (m.index === best.at && m[0].length > best.len))) {
        best = { id: e.id, at: m.index, len: m[0].length };
      }
    }
  }
  return best?.id ?? null;
}
