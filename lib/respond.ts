// A verdikt és a jelek felhasználói válasszá alakítása. Csak előre megírt mondatok;
// dinamikus csak a felhasználó üzenetéből vett idézet és a tudásbázis neve/domainje. Telefonszám nem kerül bele.
import {
  ACTIONS,
  CHECKED_BASE,
  CHECKED_REDIRECTS,
  ENTITY_FALLBACK,
  HARD_RULE_TEXT,
  HEADLINES,
  NOT_CHECKED_BASE,
  NOT_CHECKED_REDIRECT_FAILED,
  NOT_CHECKED_UNCERTAIN_READ,
  SIGNAL_TEXT,
} from "./messages";
import type { CheckResponse, OfficialEntity, Signals, VerdictResult } from "./types";

const MAX_REASONS = 6;

// A helyőrző mindig mondat elején áll; a tartalék szöveg ott nagybetűvel kezdődik.
function fill(text: string, name: string | undefined): string {
  return text.replace(/\{szervezet\}/g, (_m, at: number) =>
    name ?? (at === 0 ? ENTITY_FALLBACK[0].toUpperCase() + ENTITY_FALLBACK.slice(1) : ENTITY_FALLBACK),
  );
}

function brandCard(signals: Signals, e: OfficialEntity): NonNullable<CheckResponse["brand_card"]> {
  const isOfficial = (l: Signals["links"][number]) => l.official_entity_ids.includes(e.id);
  const examined = signals.links.find((l) => !isOfficial(l)) ?? signals.links[0];
  return {
    claimed: e.name,
    examined_domain: examined?.hostname ?? "",
    official_domain: e.official_domains[0] ?? "",
    matches: e.verified && signals.links.length > 0 && signals.links.every(isOfficial),
    verified: e.verified,
    official_url: e.official_url,
  };
}

export function buildResponse(signals: Signals, result: VerdictResult, entities: OfficialEntity[]): CheckResponse {
  const byId = (id: string | null | undefined) => entities.find((e) => e.id === id);
  const claimed = byId(signals.claimed_sender);
  // Hasonmásnál az utánzott szervezetet nevezzük meg (az idézett linkét, különben az elsőét).
  const lookalikes = signals.links.filter((l) => l.lookalike_of);
  const imitated = (evidence: string) =>
    byId((lookalikes.find((l) => l.raw === evidence) ?? lookalikes[0])?.lookalike_of) ?? claimed;

  const candidates = [
    ...result.hard_rules.map((h) => ({
      text: fill(HARD_RULE_TEXT[h.rule], (h.rule === "lookalike" ? imitated(h.evidence) : claimed)?.name),
      evidence: h.evidence,
    })),
    ...[...result.fired]
      .sort((a, b) => b.points - a.points)
      .map((f) => ({ text: fill(SIGNAL_TEXT[f.key], claimed?.name), evidence: f.evidence })),
  ];
  const reasons = candidates.filter((r, i) => candidates.findIndex((c) => c.text === r.text) === i).slice(0, MAX_REASONS);

  const followed = signals.links.some((l) => l.redirect_hops > 0 || l.final_url);
  return {
    verdict: result.verdict,
    headline: HEADLINES[result.verdict],
    reasons,
    actions: [...ACTIONS[result.verdict]],
    checked: followed ? [...CHECKED_BASE, CHECKED_REDIRECTS] : [...CHECKED_BASE],
    not_checked: [
      ...NOT_CHECKED_BASE,
      ...signals.links.filter((l) => l.redirect_error).map((l) => NOT_CHECKED_REDIRECT_FAILED + l.raw),
      ...(signals.uncertain_read ? [NOT_CHECKED_UNCERTAIN_READ] : []),
    ],
    ...(claimed ? { brand_card: brandCard(signals, claimed) } : {}),
  };
}
