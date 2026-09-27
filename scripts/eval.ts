// npm run eval — a pipeline kiértékelése a tests/fixtures/*.json mintákon.
//   Mód: "live" (Haiku), ha van ANTHROPIC_API_KEY, különben "stub" (kulcs nélküli, determinisztikus kiolvasó).
//   --stub      stub mód akkor is, ha van kulcs
//   --follow    redirect-követés (alapból KI: az eval ne küldjön kérést a mintákban szereplő, akár valódi csaló domainekre)
//   --target=https://…  a telepített /api/check végpontot méri (éles mérés; ott a redirect-követés be van kapcsolva)
// Sikerkritérium: scam soha nem SZÜRKE, legit soha nem PIROS. Bukásnál a kilépési kód 1.
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { ENTITIES, foldAccents } from "@/lib/kb";
import { extractWithClaude } from "@/lib/extract";
import { stubExtract } from "@/lib/extract-stub";
import { runCheck, type CheckInput, type Extractor, type ImageMediaType } from "@/lib/pipeline";
import type { Sample, Verdict } from "@/lib/types";

const args = new Set(process.argv.slice(2));
const target = process.argv.find((a) => a.startsWith("--target="))?.slice("--target=".length).replace(/\/$/, "");
const mode: "live" | "stub" | "target" = target ? "target" : process.env.ANTHROPIC_API_KEY && !args.has("--stub") ? "live" : "stub";
const follow = args.has("--follow");
// --only=a,b  csak ezek az id-k (vagy id-előtagok) futnak
const only = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length).split(",").filter(Boolean);

const FIXTURE_DIR = "tests/fixtures";
const LABEL: Record<Verdict, string> = { gray: "SZÜRKE", yellow: "SÁRGA", red: "PIROS" };

// Sikerkritérium + (ha a minta megadja) az elvárt ítélet pontos egyezése.
function passes(s: EvalSample, verdict: Verdict): boolean {
  const criterion = s.expected === "scam" ? verdict !== "gray" : verdict !== "red";
  const fold = (x: string) => foldAccents(x.normalize("NFC")).toUpperCase();
  const exact = !s.expect_verdict || fold(s.expect_verdict) === fold(LABEL[verdict]);
  return criterion && exact;
}
const MEDIA: Record<string, ImageMediaType> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

type LegacyFixture = { id: string; input_text?: string; image_path?: string; expected: "scam" | "legit"; note?: string; synthetic?: boolean };

type EvalSample = Sample & { expect_verdict?: string };

// Ha egy mintának szövege ÉS képe is van, két változatban fut: [szöveg] (Feladó: sorral) és [kép] (csak a képernyőkép).
function variants(s: EvalSample): EvalSample[] {
  if (!s.text || !s.image_path) return [s];
  return [
    { ...s, id: `${s.id} [szöveg]`, image_path: undefined },
    { ...s, id: `${s.id} [kép]`, text: undefined, sender: undefined },
  ];
}

function loadSamples(): EvalSample[] {
  const samples: EvalSample[] = [];
  for (const file of readdirSync(FIXTURE_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const data = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    if (Array.isArray(data.samples)) samples.push(...(data.samples as EvalSample[]).flatMap(variants));
    else {
      const f = data as LegacyFixture;
      samples.push({ id: f.id, expected: f.expected, text: f.input_text, image_path: f.image_path, note: f.note, synthetic: f.synthetic });
    }
  }
  return only ? samples.filter((s) => only.some((o) => s.id.startsWith(o))) : samples;
}

// A feladó száma a screenshoton látszik; szöveges mintánál "Feladó:" sorként kerül a szöveg elé.
function toInput(s: EvalSample): CheckInput {
  // Csak telefonszám-alakú feladó kerül a szöveg elé (a fixture-megjegyzés, pl. "ismeretlen (…)", nem része az üzenetnek).
  const sender = s.sender && /^\+?[\d\s()/-]{6,}$/.test(s.sender.trim()) ? s.sender.trim() : "";
  const text = [sender ? `Feladó: ${sender}` : "", s.text ?? ""].filter(Boolean).join("\n");
  if (!s.image_path) return { text };
  return {
    text,
    imageBase64: readFileSync(s.image_path).toString("base64"),
    imageMediaType: MEDIA[extname(s.image_path).toLowerCase()] ?? "image/png",
  };
}

const extract: Extractor =
  mode === "live" ? (input) => extractWithClaude(input) : async (input, urls) => stubExtract(input.text ?? "", urls, ENTITIES);

// Éles mérés: csak az ítélet és az indoklások száma látszik (a pont és a jelek nincsenek a válaszban).
async function checkRemote(input: CheckInput): Promise<{ verdict: Verdict; detail: string }> {
  const image = input.imageBase64 ? `data:${input.imageMediaType};base64,${input.imageBase64}` : undefined;
  const res = await fetch(`${target}/api/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input.text, image }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { verdict: body.verdict, detail: `${body.reasons.length} indok: ${body.reasons.map((r: { text: string }) => r.text.slice(0, 40)).join(" | ")}` };
}

function pad(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

async function main() {
  const samples = loadSamples();
  console.log(
    `Eval: ${samples.length} minta, mód: ${mode}${mode === "stub" ? " (nincs ANTHROPIC_API_KEY vagy --stub)" : ""}${target ? ` → ${target}` : ""}, redirect-követés: ${mode === "target" ? "szerveroldalon be" : follow ? "be" : "ki"}\n`,
  );
  console.log(`${pad("id", 44)} ${pad("várt", 6)} ${pad("kapott", 7)} ${pad("pont", 5)} ok  jelek`);
  console.log("-".repeat(120));

  let failures = 0;
  let skipped = 0;
  const latencies: number[] = [];
  for (const s of samples) {
    if (s.image_path && mode === "stub") {
      skipped++;
      console.log(`${pad(s.id, 44)} ${pad(s.expected, 6)} ${pad("-", 7)} ${pad("-", 5)} --  kihagyva: képes minta stub módban nem futtatható`);
      continue;
    }
    const started = Date.now();
    let line: string;
    try {
      if (mode === "target") {
        const { verdict, detail } = await checkRemote(toInput(s));
        const ok = passes(s, verdict);
        if (!ok) failures++;
        latencies.push(Date.now() - started);
        console.log(`${pad(s.id, 44)} ${pad(s.expected, 6)} ${pad(LABEL[verdict], 7)} ${pad("-", 5)} ${ok ? "OK" : "XX"}  ${Date.now() - started}ms ${detail}`);
        continue;
      }
      const { result } = await runCheck(toInput(s), { extract, followRedirects: follow, compareUrls: mode === "live" });
      const ok = passes(s, result.verdict);
      if (!ok) failures++;
      const signals = [
        ...result.hard_rules.map((h) => `!${h.rule}`),
        ...result.fired.map((f) => `${f.key}(${f.points})`),
        ...result.caps.map((c) => `[${c}]`),
      ].join(" ");
      const ms = mode === "live" ? ` ${Date.now() - started}ms` : "";
      line = `${pad(s.id, 44)} ${pad(s.expected, 6)} ${pad(LABEL[result.verdict], 7)} ${pad(String(result.score), 5)} ${ok ? "OK" : "XX"}  ${signals}${ms}`;
    } catch (err) {
      failures++;
      line = `${pad(s.id, 44)} ${pad(s.expected, 6)} ${pad("HIBA", 7)} ${pad("-", 5)} XX  ${err instanceof Error ? err.name : "ismeretlen hiba"}`;
    }
    console.log(line);
  }

  const run = samples.length - skipped;
  if (latencies.length) {
    const sorted = [...latencies].sort((a, b) => a - b);
    console.log(`Késleltetés: p50 ${sorted[Math.floor(sorted.length / 2)]}ms, max ${sorted[sorted.length - 1]}ms`);
  }
  console.log("-".repeat(120));
  console.log(
    `Sikerkritérium (scam soha nem SZÜRKE, legit soha nem PIROS; + elvárt ítélet, ha a minta megadja): ${failures === 0 ? "TELJESÜL" : "BUKIK"} — ${run - failures}/${run} rendben${skipped ? `, ${skipped} kihagyva` : ""}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
