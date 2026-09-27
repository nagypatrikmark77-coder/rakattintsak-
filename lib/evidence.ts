// Idézet-ellenőrzés: csak az a jel marad, amelynek idézete tényleg szerepel a transcriptben.
import type { Extraction } from "./types";

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

export function verifyEvidence(ex: Extraction): Extraction {
  const t = normalizeForMatch(ex.transcript);
  const ok = (e: { evidence: string }) => {
    const n = normalizeForMatch(e.evidence ?? "");
    return n !== "" && t.includes(n);
  };
  return {
    ...ex,
    requests: ex.requests.filter(ok),
    pressure: ex.pressure.filter(ok),
    sender_number: ex.sender_number && numberInTranscript(ex.sender_number, ex.transcript) ? ex.sender_number : null,
  };
}
