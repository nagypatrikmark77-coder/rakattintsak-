import { describe, expect, it } from "vitest";
import { combineSharedText } from "@/lib/shared-inbox";

describe("combineSharedText", () => {
  it("összefűzi a címet, szöveget és linket", () => {
    expect(combineSharedText({ title: "Posta", text: "Csomagod vár", url: "https://x.hu", image: null })).toBe(
      "Posta\nCsomagod vár\nhttps://x.hu",
    );
  });
  it("nem ismétli a szövegben már szereplő linket", () => {
    expect(
      combineSharedText({ title: "", text: "Kattints: https://x.hu/a", url: "https://x.hu/a", image: null }),
    ).toBe("Kattints: https://x.hu/a");
  });
});
