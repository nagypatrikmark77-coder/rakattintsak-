// Tiltott szavak a felhasználónak szóló szövegekben. A data/*.json a tulajdonos szó szerinti szövege, azt nem nézzük.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const BANNED = ["biztonságos", "biztonságosan", "biztosan valódi", "100%", "garantált", "garantáltan"];

// Kis-nagybetűre érzéketlen, ékezetre pontos (NFC-re normalizálva).
function findBanned(text: string): string[] {
  const t = text.normalize("NFC").toLowerCase();
  return BANNED.filter((w) => t.includes(w));
}

function scannedFiles(): string[] {
  const app = (readdirSync(join(ROOT, "app"), { recursive: true }) as string[])
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => join("app", f));
  return ["lib/messages.ts", "lib/respond.ts", ...app];
}

describe("findBanned", () => {
  const real = readFileSync(join(ROOT, "lib/messages.ts"), "utf8");

  it("elkapja a valódi fájl másolatába írt tiltott szót", () => {
    expect(findBanned(real)).toEqual([]);
    expect(findBanned(real + '\nexport const X = "Ez az oldal Biztonságos.";')).toContain("biztonságos");
  });

  it("kis-nagybetűre érzéketlen, a többi szót is elkapja", () => {
    expect(findBanned("GARANTÁLTAN jó")).toEqual(["garantált", "garantáltan"]);
    expect(findBanned("100% biztos")).toEqual(["100%"]);
    expect(findBanned("Ez biztosan valódi.")).toEqual(["biztosan valódi"]);
    expect(findBanned("biztonságosan")).toEqual(["biztonságos", "biztonságosan"]);
  });

  it("ékezetre pontos, a felbontott ékezetet is elkapja", () => {
    expect(findBanned("biztonsagos")).toEqual([]);
    expect(findBanned("Biztonsági központ")).toEqual([]);
    expect(findBanned("biztonságos".normalize("NFD"))).toEqual(["biztonságos"]);
  });
});

describe("tiltott szavak a forrásban", () => {
  const files = scannedFiles();

  it("a lista a lib-fájlokat és az app összes .tsx fájlját tartalmazza", () => {
    expect(files).toContain("lib/messages.ts");
    expect(files).toContain("lib/respond.ts");
    expect(files).toContain(join("app", "page.tsx"));
  });

  it.each(files)("%s", (f) => {
    expect(findBanned(readFileSync(join(ROOT, f), "utf8"))).toEqual([]);
  });
});
