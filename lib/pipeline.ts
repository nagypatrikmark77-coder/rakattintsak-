// A teljes ellenőrzés: kiolvasás → idézet-ellenőrzés → kulcsszó-tartalék → linkek → ítélet → válasz.
// Minden memóriában fut; semmit nem ment és nem naplóz.
import { ENTITIES, PATTERNS } from "./kb";
import { analyzeLink, applyRedirect, extractUrls, urlSetsDiffer } from "./links";
import { followRedirects } from "./redirects";
import { verifyEvidence } from "./evidence";
import { findKeywordSignals, mergeSignals } from "./keywords";
import { decide } from "./verdict";
import { buildResponse } from "./respond";
import type { CheckResponse, Extraction, LinkAnalysis, Signals, VerdictResult } from "./types";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
export type CheckInput = { text?: string; imageBase64?: string; imageMediaType?: ImageMediaType };

// A kiolvasó megkapja a bemenetet és a szövegből regex-szel talált linkeket (a kulcs nélküli stubnak kell).
export type Extractor = (input: CheckInput, urls: string[]) => Promise<Extraction>;

export type PipelineOptions = {
  extract: Extractor;
  followRedirects: boolean; // élesben igen; az eval alapból nem küld kérést a mintákban szereplő domainekre
  compareUrls: boolean; // uncertain_read: csak valódi (LLM) kiolvasásnál van értelme
};

export type CheckOutcome = { response: CheckResponse; result: VerdictResult; signals: Signals };

const MAX_FOLLOWED_LINKS = 5;

async function analyzeLinks(transcript: string, follow: boolean): Promise<{ raws: string[]; links: LinkAnalysis[] }> {
  const raws = extractUrls(transcript);
  const analyzed = raws.map((raw) => analyzeLink(raw, ENTITIES));
  if (!follow) return { raws, links: analyzed };
  const links = await Promise.all(
    analyzed.map(async (link, i) => {
      if (i >= MAX_FOLLOWED_LINKS || !link.url) return link;
      return applyRedirect(link, await followRedirects(link.url), ENTITIES);
    }),
  );
  return { raws, links };
}

export async function runCheck(input: CheckInput, opts: PipelineOptions): Promise<CheckOutcome> {
  const text = input.text?.trim() ?? "";
  const textOnly = text !== "" && !input.imageBase64;
  // Szöveges bemenetnél a linkek (és a redirect-követés) a kiolvasással párhuzamosan futnak.
  const earlyLinks = textOnly ? analyzeLinks(text, opts.followRedirects) : null;

  const extraction = verifyEvidence(await opts.extract({ ...input, text }, text ? extractUrls(text) : []));
  const { raws, links } = await (earlyLinks ?? analyzeLinks(extraction.transcript, opts.followRedirects));

  const hits = findKeywordSignals(extraction.transcript, PATTERNS);
  const merged = mergeSignals(extraction, hits);

  const signals: Signals = {
    claimed_sender: extraction.claimed_sender,
    requests: merged.requests,
    pressure: merged.pressure,
    contains_code_only: extraction.contains_code_only,
    instructions_to_ai: extraction.instructions_to_ai || hits.instructions_evidence !== null,
    instructions_evidence: hits.instructions_evidence,
    uncertain_read: opts.compareUrls && urlSetsDiffer(raws, extraction.urls_verbatim),
    links,
    sender_number: extraction.sender_number,
    has_attachment: extraction.has_attachment,
    tarhely_sender: /ertesites@tarhely\.gov\.hu/i.test(extraction.transcript),
  };

  const result = decide(signals, ENTITIES);
  return { response: buildResponse(signals, result, ENTITIES), result, signals };
}
