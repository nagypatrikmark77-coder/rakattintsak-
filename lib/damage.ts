// "Már rákattintottam": a válaszokból kiválasztott teendők és a bankok kártyaletiltó számai.
import type { DamageControl, DamageStep, OfficialEntity } from "./types";

// A tulajdonos szabálya: "bank mindig első" – azonos prioritásnál ez a lépés megelőz minden mást.
const BANK_STEP_ID = "bank_urgent";

// Egy lépés akkor érvényes, ha a trigger_any valamelyik kérdésére "igen" volt a válasz,
// vagy (trigger_none esetén) a felsorolt kérdések mindegyikére "nem". A hiányzó válasz nem "nem".
function applies(step: DamageStep, answers: Record<string, boolean>): boolean {
  if (step.trigger_any?.some((id) => answers[id] === true)) return true;
  if (step.trigger_none && step.trigger_none.length > 0) {
    return step.trigger_none.every((id) => answers[id] === false);
  }
  return false;
}

export function selectSteps(
  answers: Record<string, boolean>,
  dc: DamageControl,
): { id: string; step: DamageStep }[] {
  const selected = Object.entries(dc.steps)
    .map(([id, step], order) => ({ id, step, order }))
    .filter(({ step }) => applies(step, answers));

  selected.sort((a, b) => {
    if (a.step.priority !== b.step.priority) return a.step.priority - b.step.priority;
    if (a.id === BANK_STEP_ID) return -1;
    if (b.id === BANK_STEP_ID) return 1;
    return a.order - b.order;
  });

  return selected.map(({ id, step }) => ({ id, step }));
}

const CARD_BLOCK_LABELS: Record<string, string> = {
  card_block_24h: "Kártyaletiltás, 0-24",
  card_block_24h_free: "Kártyaletiltás, 0-24, ingyenes",
  general_and_card_block_24h_free: "Ügyfélszolgálat és kártyaletiltás, 0-24, ingyenes",
  card_block: "Kártyaletiltás",
};

// Telefonszám a UI-ban csak verified:true bejegyzésből jelenhet meg: ez az egyetlen forrás.
export function bankContacts(entities: OfficialEntity[]): { name: string; label: string; number: string }[] {
  const out: { name: string; label: string; number: string }[] = [];
  for (const e of entities) {
    if (e.verified !== true || e.category !== "bank" || !e.contacts) continue;
    for (const [key, number] of Object.entries(e.contacts)) {
      if (!key.includes("card_block")) continue;
      out.push({ name: e.name, label: CARD_BLOCK_LABELS[key] ?? "Kártyaletiltás", number });
    }
  }
  return out;
}

// tel: link: csak számjegyek, a vezető + megmarad.
export function telHref(number: string): string {
  const trimmed = number.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `tel:${plus}${trimmed.replace(/\D/g, "")}`;
}
