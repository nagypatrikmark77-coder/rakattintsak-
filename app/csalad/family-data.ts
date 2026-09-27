// A családi nézet tiszta segédfüggvényei (böngészőben és tesztben is futnak).
// A riasztás csak márka és időpont: tartalom, link, idézet soha nincs benne.

export type AlertRow = { id: string; brand: string; created_at: string };
export type Membership = { family_id: string; role: "owner" | "member"; code: string };

export const ALERT_LIMIT = 50;

// Magyar dátum és idő, alapból a készülék időzónájában (pl. "2026. szeptember 27. 14:05").
export function formatAlertTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function alertLine(alert: AlertRow, timeZone?: string): string {
  return `PIROS ítélet – ${alert.brand} – ${formatAlertTime(alert.created_at, timeZone)}`;
}

export function toAlertRow(value: unknown): AlertRow | null {
  if (!value || typeof value !== "object") return null;
  const { id, brand, created_at } = value as Record<string, unknown>;
  if (typeof id !== "string" || typeof brand !== "string" || typeof created_at !== "string") return null;
  return { id, brand, created_at };
}

// Új riasztás a lista elejére, ismétlés nélkül, legfeljebb ALERT_LIMIT elem.
export function mergeAlert(list: AlertRow[], alert: AlertRow): AlertRow[] {
  if (list.some((a) => a.id === alert.id)) return list;
  return [alert, ...list].slice(0, ALERT_LIMIT);
}

// family_members + families(id, code) sorokból tagságok; a beágyazott család objektum vagy tömb is lehet.
// A tulajdonosi tagság kerül előre.
export function parseMemberships(rows: unknown): Membership[] {
  if (!Array.isArray(rows)) return [];
  const out: Membership[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { family_id, role, families } = row as Record<string, unknown>;
    const family = Array.isArray(families) ? families[0] : families;
    const code = family && typeof family === "object" ? (family as Record<string, unknown>).code : undefined;
    if (typeof family_id !== "string" || typeof code !== "string") continue;
    if (role !== "owner" && role !== "member") continue;
    out.push({ family_id, role, code });
  }
  return out.sort((a, b) => (a.role === b.role ? 0 : a.role === "owner" ? -1 : 1));
}
