# Döntések

Egy sor = egy döntés. A jóváhagyott tervből (2026-09-27) és a végrehajtás közbeni apró döntésekből.

## A jóváhagyott tervből
- Küszöb: 0–24 SZÜRKE, 25–39 SÁRGA, 40+ PIROS (Patrik döntése).
- Hasonmás domain: ≤3 betűs márkanév csak önálló domain-címkeként (pont/kötőjel határolva) számít, 4+ betűs részszóként is; Levenshtein ≤2 csak 7+ karakteres címkére, ≤1 4–6 karakteresre, 3 alatt nincs (Patrik döntése).
- Redirect-követés minden linkre: csak HEAD, max 5 ugrás, 3 mp/ugrás, SSRF-védelem, max 5 link/üzenet (Patrik döntése).
- Unoka-riasztás: Supabase Realtime + megnyitáskor a korábbi riasztások listája, Web Push nincs (Patrik döntése).
- A „minden link hivatalos → max SÁRGA” korlát csak akkor él, ha legalább 1 link van.
- Egy link akkor hivatalos, ha a látható host ÉS a redirect végcélja is hivatalos; egyezés host-végződésre (pl. nav.gov.hu), nem csak regisztrálható domainre.
- Kép: kliensoldalon hosszabb oldal max 1024px, JPEG 0,85; a 4 MB korlát a szerverre érkező (kicsinyített) képre vonatkozik.
- Minden jel egyszer pontoz, akkor is, ha több link hordozza.

## Végrehajtás közben
- M1: a share-target szerveroldali fallbackje (ha nincs aktív service worker) nem olvassa a kérés törzsét, csak 303-mal a /?shared=failed oldalra irányít.
- M1: a megosztott tartalom a Cache API-ban (rakattintsak-share-v1) vár, a főoldal kiolvasás után azonnal törli.
- M1: Android a linket gyakran a text mezőben küldi; a főoldal a title/text/url mezőket ismétlődés nélkül fűzi össze.
- M1: ikon = generált fekete „?” fehér alapon (scripts/icons.mjs), nincs logó.
- M1: @types/node ^24 (a Vercel alapértelmezett Node 24.x, és a vitest 5 ezt kéri).
