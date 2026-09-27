// Idézet-ellenőrzés: csak az a jel marad, amelynek idézete tényleg szerepel a transcriptben.
import { foldAccents } from "./kb";
import type { Extraction, RequestType } from "./types";

// NFC, kisbetű, whitespace összevonva, trim. Az ékezetek megmaradnak.
export function normalizeForMatch(s: string): string {
  return s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

// A feladó szám számjegyei (legalább 6) a transcriptben, elválasztókkal (szóköz, kötőjel, pont, zárójel)
// és opcionális "+"-szal; egy hosszabb szám belsejére nem illeszt.
function numberInTranscript(num: string, transcript: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 6) return false;
  return new RegExp(`(?<!\\d)\\+?${digits.split("").join("[\\s\\-.()]*")}(?!\\d)`).test(transcript);
}

// Tartalmi kapu a kemény szabályt kiváltó kérésekhez: a share_code egy kód/számsor továbbadása, ezért az idézetnek
// kódra vagy számra kell hivatkoznia (egy 0–10-es értékelés kérése nem ilyen). Ékezet nélküli alakban nézzük.
const REQUEST_GUARDS: Partial<Record<RequestType, RegExp>> = {
  share_code: /kod|szamsor|szam|pin\b|jelszo|code/i,
};

export function verifyEvidence(ex: Extraction): Extraction {
  const t = normalizeForMatch(ex.transcript);
  const ok = (e: { evidence: string }) => {
    const n = normalizeForMatch(e.evidence ?? "");
    return n !== "" && t.includes(n);
  };
  const guarded = (r: { type: RequestType; evidence: string }) => {
    const re = REQUEST_GUARDS[r.type];
    return !re || re.test(foldAccents(normalizeForMatch(r.evidence)));
  };
  return {
    ...ex,
    requests: ex.requests.filter((r) => ok(r) && guarded(r)),
    pressure: ex.pressure.filter(ok),
    sender_number: ex.sender_number && numberInTranscript(ex.sender_number, ex.transcript) ? ex.sender_number : null,
  };
}
