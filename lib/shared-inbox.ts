// A service worker által a megosztás menüből elmentett tartalom kiolvasása és törlése.
// Csak a böngészőben fut; a tartalom a készüléken marad.

const SHARE_CACHE = "rakattintsak-share-v1";

export type SharedPayload = {
  title: string;
  text: string;
  url: string;
  image: Blob | null;
};

export async function takeSharedPayload(): Promise<SharedPayload | null> {
  if (!("caches" in window)) return null;
  const cache = await caches.open(SHARE_CACHE);
  const textRes = await cache.match("/__shared/text");
  if (!textRes) return null;
  const fields = (await textRes.json()) as { title?: string; text?: string; url?: string };
  const imageRes = await cache.match("/__shared/image");
  const image = imageRes ? await imageRes.blob() : null;
  await cache.delete("/__shared/text");
  await cache.delete("/__shared/image");
  return { title: fields.title ?? "", text: fields.text ?? "", url: fields.url ?? "", image };
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
