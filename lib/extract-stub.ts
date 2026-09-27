// Kulcs nélküli, determinisztikus kiolvasás (az LLM-es extract helyett, ha nincs ANTHROPIC_API_KEY).
// A kulcsszavas jeleket a pipeline fésüli hozzá később, itt nem.
import { foldAccents } from "./kb";
import { detectClaimedSender } from "./keywords";
import type { Extraction, OfficialEntity } from "./types";

// "Feladó: <szám>" sor (sor elején, ékezet- és kisbetű-érzéketlen) értéke, vagy null.
function senderLine(text: string): string | null {
  const m = /^[ \t]*felado[ \t]*:[ \t]*([^\n]*)$/im.exec(foldAccents(text));
  if (!m) return null;
  const start = m.index + m[0].length - m[1].length;
  return text.slice(start, start + m[1].length).trim() || null;
}

export function stubExtract(text: string, urls: string[], entities: OfficialEntity[]): Extraction {
  return {
    transcript: text,
    urls_verbatim: urls,
    claimed_sender: detectClaimedSender(text, entities) ?? "ismeretlen",
    requests: urls.length ? [{ type: "click_link", evidence: urls[0] }] : [],
    pressure: [],
    contains_code_only: false,
    instructions_to_ai: false,
    sender_number: senderLine(text),
    has_attachment: false,
  };
}
