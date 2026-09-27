import { describe, expect, it } from "vitest";
import { stubExtract } from "@/lib/extract-stub";
import { ENTITIES } from "@/lib/kb";

describe("stubExtract", () => {
  it("teljes kimenet feladó-sorral és linkkel", () => {
    const text = "Felado: +63 912 345 6789\nGLS Hungary: fizesse ki a 190 Ft dijat: https://gls-hu-delivery.top/cim";
    expect(stubExtract(text, ["https://gls-hu-delivery.top/cim"], ENTITIES)).toEqual({
      transcript: text,
      urls_verbatim: ["https://gls-hu-delivery.top/cim"],
      claimed_sender: "gls",
      requests: [{ type: "click_link", evidence: "https://gls-hu-delivery.top/cim" }],
      pressure: [],
      contains_code_only: false,
      instructions_to_ai: false,
      sender_number: "+63 912 345 6789",
      has_attachment: false,
    });
  });

  it("link és feladó nélkül; ismeretlen küldő", () => {
    const ex = stubExtract("Szia anya, uj szamom van", [], ENTITIES);
    expect(ex.claimed_sender).toBe("ismeretlen");
    expect(ex.requests).toEqual([]);
    expect(ex.sender_number).toBeNull();
    expect(ex.urls_verbatim).toEqual([]);
  });

  it("Feladó: sor ékezettel, kisbetűvel is; üres érték null", () => {
    expect(stubExtract("Feladó:  +36 70 717 7702 \nDPD: csomag", [], ENTITIES).sender_number).toBe("+36 70 717 7702");
    expect(stubExtract("feladó: 06301112233\nszia", [], ENTITIES).sender_number).toBe("06301112233");
    expect(stubExtract("Feladó:\nszia", [], ENTITIES).sender_number).toBeNull();
    expect(stubExtract("A feladó: nem tudom", [], ENTITIES).sender_number).toBeNull();
  });
});
