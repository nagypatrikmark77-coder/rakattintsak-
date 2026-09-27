// Privacy-kapu: az app és a lib kódjában nem lehet console-hívás (kivéve lib/log.ts), és nem írhat fájlt.
// Kilépési kód 1, ha bármi találat van.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "lib", "public/sw.js"];
const ALLOWED = new Set(["lib/log.ts"]);
const RULES = [
  { name: "console", re: /\bconsole\s*\./ },
  { name: "fájlírás", re: /\b(writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream)\b/ },
];

function walk(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((name) => walk(join(path, name)));
}

const files = ROOTS.flatMap(walk).filter((f) => /\.(ts|tsx|js|mjs)$/.test(f) && !ALLOWED.has(f));
const hits = [];
for (const file of files) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const rule of RULES) if (rule.re.test(line)) hits.push(`${file}:${i + 1} ${rule.name}: ${line.trim()}`);
    });
}

if (hits.length) {
  console.error(`Privacy-kapu: ${hits.length} tiltott hívás\n${hits.join("\n")}`);
  process.exit(1);
}
console.log(`Privacy-kapu: rendben (${files.length} fájl)`);
