// A service worker által a megosztás menüből elmentett tartalom kiolvasása és törlése.
// Csak a böngészőben fut; a tartalom a készüléken marad.
// A főoldal előbb csak kiolvassa (peek), és csak sikeres ellenőrzés után törli (clear):
// ha az ellenőrzés nem sikerül (nincs net, szerverhiba, limit), a tartalom megmarad az újrapróbáláshoz.

const SHARE_CACHE = "rakattintsak-share-v1";
const TEXT_KEY = "/__shared/text";
const IMAGE_KEY = "/__shared/image";

export type SharedPayload = {
  title: string;
  text: string;
  url: string;
  image: Blob | null;
};

function cacheStorage(): CacheStorage | null {
  return typeof caches === "undefined" ? null : caches;
}

// Kiolvasás törlés nélkül.
export async function peekSharedPayload(): Promise<SharedPayload | null> {
  const storage = cacheStorage();
  if (!storage) return null;
  const cache = await storage.open(SHARE_CACHE);
  const textRes = await cache.match(TEXT_KEY);
  if (!textRes) return null;
  const fields = (await textRes.json()) as { title?: string; text?: string; url?: string };
  const imageRes = await cache.match(IMAGE_KEY);
  const image = imageRes ? await imageRes.blob() : null;
  return { title: fields.title ?? "", text: fields.text ?? "", url: fields.url ?? "", image };
}

export async function clearSharedPayload(): Promise<void> {
  const storage = cacheStorage();
  if (!storage) return;
  const cache = await storage.open(SHARE_CACHE);
  await cache.delete(TEXT_KEY);
  await cache.delete(IMAGE_KEY);
}

// Android a linket gyakran a text mezőben küldi, a url mező üres. Ismétlődést nem fűzünk hozzá.
export function combineSharedText(p: SharedPayload): string {
  const parts: string[] = [];
  for (const part of [p.title, p.text, p.url]) {
    const t = part.trim();
    if (t && !parts.some((existing) => existing.includes(t))) parts.push(t);
  }
  return parts.join("\n");
}
