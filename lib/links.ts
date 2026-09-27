// Determinisztikus linkelemzés (hálózat nélkül): kinyerés, hivatalos/hasonmás domain, jelzők.
import { parse } from "tldts";
import type { LinkAnalysis, OfficialEntity } from "./types";

export const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.ly", "is.gd", "cutt.ly", "rebrand.ly", "ow.ly", "buff.ly", "rb.gy", "shorturl.at",
  "t.co", "s.id", "v.gd", "tiny.cc", "bl.ink", "lnkd.in", "goo.gl", "qrco.de", "short.io",
];
export const RISKY_TLDS = ["xyz", "top", "icu", "shop", "click", "live", "online", "site", "cfd", "sbs"];

const TRAIL = /[.,;:!?)\]}»”"']+$/;
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
// Séma-s URL, vagy csupasz domain (opcionális úttal). A csupasz jelölt nem kezdődhet szó/e-mail közepén,
// és a domain után nem jöhet @ (e-mail cím).
const LABEL = "[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]*[\\p{L}\\p{N}])?";
const CANDIDATE = new RegExp(
  `https?:\\/\\/[^\\s<>"“”«»]+|(?<![\\p{L}\\p{N}@._%+\\/-])${LABEL}(?:\\.${LABEL})+(?![\\p{L}\\p{N}@-])(?:[\\/?#:][^\\s<>"“”«»]*)?`,
  "giu",
);

export function extractUrls(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const s = m[0].replace(TRAIL, "");
    if (/^https?:\/\/$/i.test(s) || out.includes(s)) continue;
    if (!SCHEME.test(s)) {
      const p = parse(s.split(/[/?#:]/)[0]);
      if (!p.isIcann || !p.domain) continue;
    }
    out.push(s);
  }
  return out;
}

export function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith("." + domain);
}

const isIpHost = (h: string) => h.startsWith("[") || /^\d{1,3}(\.\d{1,3}){3}$/.test(h);

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const allDomains = (e: OfficialEntity) => [...e.official_domains, ...(e.legacy_domains_unverified ?? [])];

// A hivatalos domain a hostban, címkehatáron kezdődik, és utána még jön valami (pl. posta.hu-csomag.top).
function domainAsPrefix(host: string, domain: string): boolean {
  for (let i = host.indexOf(domain); i >= 0; i = host.indexOf(domain, i + 1)) {
    if ((i === 0 || ".-".includes(host[i - 1])) && i + domain.length < host.length) return true;
  }
  return false;
}

// Márkatoken a hostban: ≥6 betű bárhol; 4–5 betű csak domainrész elején (pont/kötőjel után),
// hogy pl. "sneakers" ne legyen NEAK, "bonusz" ne legyen NÚSZ; ≤3 betű csak önálló tokenként a regisztrálható címkében.
function tokenInHost(t: string, hostNoSuffix: string, labelParts: string[]): boolean {
  if (t.length >= 6) return hostNoSuffix.includes(t);
  if (t.length >= 4) return hostNoSuffix.split(/[.-]/).some((seg) => seg.startsWith(t));
  return labelParts.includes(t);
}

function isLookalike(e: OfficialEntity, host: string, hostNoSuffix: string, label: string): boolean {
  const parts = label.split("-");
  for (const t of e.brand_tokens) {
    if (tokenInHost(t, hostNoSuffix, parts)) return true;
  }
  for (const d of allDomains(e)) {
    if (domainAsPrefix(host, d)) return true;
    // Szerkesztési távolság csak önálló (regisztrálható) domain címkéjével: egy közös állami domain
    // aldomainje (tarhely.gov.hu, neak.gov.hu) nem márkanév.
    if (parse(d).domain !== d) continue;
    const first = d.split(".")[0];
    const longer = Math.max(label.length, first.length);
    const max = longer >= 7 ? 2 : longer >= 4 ? 1 : -1;
    if (levenshtein(label, first) <= max) return true;
  }
  return false;
}

export function analyzeLink(raw: string, entities: OfficialEntity[]): LinkAnalysis {
  const s = raw.trim();
  const withScheme = SCHEME.test(s) ? s : "https://" + s;
  const authority = withScheme.replace(SCHEME, "").split(/[/?#\\]/)[0];
  const res: LinkAnalysis = {
    raw,
    url: null,
    hostname: null,
    registrable_domain: null,
    final_url: null,
    final_hostname: null,
    redirect_hops: 0,
    redirect_error: null,
    official_entity_ids: [],
    listed_unverified_entity_ids: [],
    allowed_path_entity_ids: [],
    lookalike_of: null,
    punycode: false,
    ip_host: false,
    has_at: authority.includes("@"),
    shortener: false,
    risky_tld: false,
    whatsapp: false,
  };
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return res;
  }
  const host = u.hostname.toLowerCase();
  if (!host) return res;
  const ip = isIpHost(host);
  const p = ip ? null : parse(host);
  const domain = p?.domain ?? null;
  const suffix = p?.publicSuffix ?? null;

  res.url = u.href;
  res.hostname = host;
  res.registrable_domain = domain;
  res.ip_host = ip;
  res.punycode = host.split(".").some((l) => l.startsWith("xn--"));
  res.shortener = domain !== null && SHORTENERS.includes(domain);
  res.risky_tld = suffix !== null && RISKY_TLDS.includes(suffix);
  res.whatsapp = matchesDomain(host, "wa.me") || matchesDomain(host, "whatsapp.com");

  for (const e of entities) {
    if (e.official_domains.some((d) => matchesDomain(host, d))) {
      (e.verified ? res.official_entity_ids : res.listed_unverified_entity_ids).push(e.id);
    } else if (e.legacy_domains_unverified?.some((d) => matchesDomain(host, d))) {
      res.listed_unverified_entity_ids.push(e.id);
    }
    const allowed = e.allowed_link_paths?.some((ap) => {
      const i = ap.indexOf("/");
      const path = ap.slice(i);
      return i > 0 && matchesDomain(host, ap.slice(0, i)) && (u.pathname === path || u.pathname.startsWith(path + "/"));
    });
    if (allowed) res.allowed_path_entity_ids.push(e.id);
  }

  if (domain && suffix && !res.official_entity_ids.length && !res.listed_unverified_entity_ids.length) {
    const hostNoSuffix = host.slice(0, -(suffix.length + 1));
    const label = domain.slice(0, -(suffix.length + 1));
    res.lookalike_of = entities.find((e) => isLookalike(e, host, hostNoSuffix, label))?.id ?? null;
  }
  return res;
}

export function applyRedirect(
  link: LinkAnalysis,
  r: { final_url: string | null; hops: number; error: string | null },
  entities: OfficialEntity[],
): LinkAnalysis {
  const out: LinkAnalysis = { ...link, final_url: r.final_url, final_hostname: null, redirect_hops: r.hops, redirect_error: r.error };
  if (r.final_url === null) return out;
  const fin = analyzeLink(r.final_url, entities);
  out.final_hostname = fin.hostname;
  if (fin.hostname === link.hostname) return out;
  const both = (a: string[], b: string[]) => a.filter((id) => b.includes(id));
  return {
    ...out,
    official_entity_ids: both(link.official_entity_ids, fin.official_entity_ids),
    listed_unverified_entity_ids: both(link.listed_unverified_entity_ids, fin.listed_unverified_entity_ids),
    allowed_path_entity_ids: both(link.allowed_path_entity_ids, fin.allowed_path_entity_ids),
    lookalike_of: link.lookalike_of ?? fin.lookalike_of,
    punycode: link.punycode || fin.punycode,
    ip_host: link.ip_host || fin.ip_host,
    has_at: link.has_at || fin.has_at,
    risky_tld: link.risky_tld || fin.risky_tld,
    whatsapp: link.whatsapp || fin.whatsapp,
  };
}

export function normalizeUrlForCompare(raw: string): string {
  const s = raw.trim().replace(TRAIL, "").replace(SCHEME, "");
  const i = s.search(/[/?#]/);
  const norm = i < 0 ? s.toLowerCase() : s.slice(0, i).toLowerCase() + s.slice(i);
  return norm.replace(/\/+$/, "");
}

export function urlSetsDiffer(a: string[], b: string[]): boolean {
  const sa = new Set(a.map(normalizeUrlForCompare));
  const sb = new Set(b.map(normalizeUrlForCompare));
  return sa.size !== sb.size || [...sa].some((x) => !sb.has(x));
}
