import { describe, expect, it } from "vitest";
import { normalizeForMatch, verifyEvidence } from "@/lib/evidence";
import type { Extraction } from "@/lib/types";

const base = (over: Partial<Extraction>): Extraction => ({
  transcript: "",
  urls_verbatim: [],
  claimed_sender: "ismeretlen",
  requests: [],
  pressure: [],
  contains_code_only: false,
  instructions_to_ai: false,
  sender_number: null,
  has_attachment: false,
  ...over,
});

describe("normalizeForMatch", () => {
  it("NFC, kisbetű, whitespace-összevonás, trim, ékezet marad", () => {
    expect(normalizeForMatch("  SÜRGŐS\n\t Üzenet  ")).toBe("sürgős üzenet");
    expect(normalizeForMatch("Sürgős")).toBe("sürgős");
  });
});

describe("verifyEvidence", () => {
  const transcript = "Anyu, uj szamrol irok.\nSürgősen  UTALJ 180 ezret!";

  it("megtartja a transcriptben szereplő idézetet (kis-nagybetű, whitespace mindegy)", () => {
    const ex = base({
      transcript,
      requests: [{ type: "money_transfer", evidence: "sürgősen utalj" }],
      pressure: [{ type: "family_impersonation", evidence: "anyu," }],
    });
    const out = verifyEvidence(ex);
    expect(out.requests).toEqual(ex.requests);
    expect(out.pressure).toEqual(ex.pressure);
  });

  it("eldobja a kitalált, üres és ékezetében eltérő idézetet", () => {
    const out = verifyEvidence(
      base({
        transcript,
        requests: [
          { type: "card_data", evidence: "adja meg a kártyaszámát" },
          { type: "money_transfer", evidence: "" },
          { type: "share_code", evidence: "   " },
        ],
        pressure: [
          { type: "deadline", evidence: "surgosen" },
          { type: "new_phone_number", evidence: "uj szamrol" },
        ],
      }),
    );
    expect(out.requests).toEqual([]);
    expect(out.pressure).toEqual([{ type: "new_phone_number", evidence: "uj szamrol" }]);
  });

  it("nem módosítja a bemenetet", () => {
    const ex = base({ transcript: "x", requests: [{ type: "password", evidence: "jelszó" }], sender_number: "+36301112233" });
    verifyEvidence(ex);
    expect(ex.requests).toHaveLength(1);
    expect(ex.sender_number).toBe("+36301112233");
  });

  describe("sender_number", () => {
    const keep = (t: string, n: string) => verifyEvidence(base({ transcript: t, sender_number: n })).sender_number;
    it("megtartja, ha a számjegyek elválasztókkal szerepelnek", () => {
      expect(keep("Feladó: +63 912 345 6789\nGLS", "+63 912 345 6789")).toBe("+63 912 345 6789");
      expect(keep("Felado: +63 912-345-6789", "+639123456789")).toBe("+639123456789");
      expect(keep("Hívja: (06) 30.111.2233", "06301112233")).toBe("06301112233");
      expect(keep("tel 36301112233", "+36 30 111 2233")).toBe("+36 30 111 2233");
    });
    it("null-ra állítja, ha nincs a transcriptben, túl rövid, vagy csak egy hosszabb szám része", () => {
      expect(keep("DPD: csomag", "+36 70 717 7702")).toBeNull();
      expect(keep("kód: 12345", "12345")).toBeNull();
      expect(keep("OTP Bank", "OTP Bank")).toBeNull();
      expect(keep("azonosító: 9123456789", "123456")).toBeNull();
      expect(keep("azonosító: 99123456", "123456")).toBeNull();
      expect(verifyEvidence(base({ transcript: "x", sender_number: null })).sender_number).toBeNull();
    });
  });
});

describe("share_code tartalmi kapu", () => {
  const base = { urls_verbatim: [], claimed_sender: "telekom", pressure: [], contains_code_only: false, instructions_to_ai: false, sender_number: null, has_attachment: false };
  it("értékelés kérése (0–10 pontozás) nem share_code", () => {
    const transcript = "Kérjük, hogy 10-es skálán pontozz, ahol a 10=kimondottan ajánlanám.";
    const out = verifyEvidence({ ...base, transcript, requests: [{ type: "share_code", evidence: "Kérjük, hogy 10-es skálán pontozz" }] });
    expect(out.requests).toEqual([]);
  });
  it("kód vagy számsor továbbküldése share_code marad (ékezet nélkül is)", () => {
    const transcript = "Kuldje el a kapott kodot erre a szamra. Olvassa fel a bediktalt számsort.";
    const out = verifyEvidence({
      ...base,
      transcript,
      requests: [{ type: "share_code", evidence: "Kuldje el a kapott kodot" }],
    });
    expect(out.requests.map((r) => r.type)).toEqual(["share_code"]);
  });
});
