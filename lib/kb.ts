// A tudásbázis betöltése (data/*.json) és a márkatokenek származtatása.
import { getDomain } from "tldts";
import entitiesFile from "@/data/official_entities.json";
import patternsFile from "@/data/scam_patterns.json";
import damageFile from "@/data/damage_control.json";
import type { DamageControl, OfficialEntity, OfficialEntityRaw, ScamPatterns } from "./types";

// Ékezetek levétele azonos hosszon (a magyar betűkre), hogy az indexek megmaradjanak.
const FOLD: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u",
  Á: "A", É: "E", Í: "I", Ó: "O", Ö: "O", Ő: "O", Ú: "U", Ü: "U", Ű: "U",
};
export function foldAccents(s: string): string {
  return s.replace(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, (c) => FOLD[c]);
}

// Márkatokenek: az önálló (regisztrálható) hivatalos és legacy domainek első címkéje + az egyszavas aliasok,
// kisbetűs ASCII-ként. Egy közös állami domain aldomainje (tarhely.gov.hu) nem márkanév.
export function brandTokens(e: OfficialEntityRaw): string[] {
  const tokens = new Set<string>();
  for (const d of [...e.official_domains, ...(e.legacy_domains_unverified ?? [])]) {
    if (getDomain(d) === d) tokens.add(d.split(".")[0].toLowerCase());
  }
  for (const alias of e.aliases) {
    if (/\s/.test(alias.trim())) continue;
    const t = foldAccents(alias).toLowerCase().replace(/\.hu$/, "").replace(/[^a-z0-9]/g, "");
    if (t) tokens.add(t);
  }
  return [...tokens];
}

export const ENTITIES: OfficialEntity[] = (entitiesFile.entities as OfficialEntityRaw[]).map((e) => ({
  ...e,
  brand_tokens: brandTokens(e),
}));

export const PATTERNS = patternsFile as unknown as ScamPatterns;
export const DAMAGE = damageFile as unknown as DamageControl;

export function entityById(id: string): OfficialEntity | undefined {
  return ENTITIES.find((e) => e.id === id);
}
