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

## Tudásbázis-integráció (2026-09-27)
- Az 5 KB-fájl szó szerint került be. A szervezetlista ez (20 db); Packeta és Express One nincs rajta, ilyen küldő „egyéb”.
- Whitelist: csak verified:true szervezet official_domains-e. A verified:false official_domains és bármely legacy_domains_unverified = „listázott, nem ellenőrzött”: nem hivatalos (a brand kártyán nem „egyezik”), de nem hasonmás és nem márka-eltérés, és a „minden link hivatalos → max SÁRGA” korlátba beszámít. Így teljesül: hiányzó hivatalos domain = legfeljebb sárga.
- Márkatokenek (hasonmás-kereséshez) a domainek első címkéjéből és az egyszavas aliasokból származnak (lib/kb.ts), mert a KB-fájl nem tartalmaz tokeneket és nem írható át. Ismert kockázat: vodafone.com / telenor.com hasonmásnak számít (One, Yettel alias).
- Rövid (≤3 betűs) márkatoken csak a regisztrálható domain címkéjében, kötőjellel határolt tokenként számít (a subdomainben nem), hogy pl. one.google.com ne legyen hasonmás; a „posta.hu-csomag.top” típusú trükköt külön szabály fogja (hivatalos domain a hostban, utána további karakterek).
- sms_link_policy "unknown" és "official_only": az alap márka-eltérés szabály él (a KB szerint „alap szabályok érvényesek”).
- never_asks leképezése a kéréstípusokra: bank_login→password, bank_account→card_data, payment→card_data+money_transfer.
- A regex-tartalék ékezet-érzéketlen (azonos hosszú ékezetlevétel, az idézet az eredeti szövegből jön), mert a valódi SMS-ek és a rekonstruált minták nagy része ékezet nélküli. Az idézet-ellenőrzés marad ékezetmegőrző.
- A regex-kulcsszavak szó elején kezdődnek és szóközépen végződhetnek (tőként: „sürgős” → „sürgősen”).
- A regex-tartalék a fájl listáján túl néhány általános tővel bővül (money_transfer: utalj/utalni/…; new_phone_number: „új szám”). Ezek nem mintára írt kivételek.
- Az instructions_to_ai-nak regex-tartaléka is van (AI-nak vagy elemzőnek szóló felszólítás), hogy a modell rábeszélése ellen is védjen.
- A feladó száma a Haiku `sender_number` mezőjéből jön, és csak akkor számít, ha a számjegyei a transcriptben is szerepelnek. Szöveges evalmintánál „Feladó: …” sor kerül a szöveg elé.
- foreign_sender_for_hu_entity: minden listás szervezetre (Revolutra is), csak +, 00 vagy 06 előtagú számra; alfanumerikus feladóra nem.
- A tarhely-szabályhoz a feladó az üzenet szövegéből jön (szerepel benne: ertesites@tarhely.gov.hu), a csatolmány a Haiku `has_attachment` mezőjéből.
- A damage_control.json számai (112, 06 80 225 225) és a „biztonságos eszköz” szöveg a tulajdonos szó szerinti szövege, ezért megjelenik. Entitás-telefonszám csak verified:true bejegyzésből jelenik meg.
- A tiltott-szó kapu a kódot és az app/**/*.tsx fájlokat nézi, a data/*.json-t nem (tulajdonosi szöveg).
- `npm run eval` kulcs nélkül „stub” módban fut (determinisztikus kiolvasó: alias-alapú küldőfelismerés + regex-tartalék). A Haiku-s „live” mód a kulccsal indul, a sikerkritériumot mindkét módban mérjük.
- Az eval alapból nem követ redirectet (a --follow kapcsolja be), mert a minták között valódi csaló domainek is vannak.
- A 25 rekonstruált minta lefedi az eredeti brief 15 szintetikus mintájának listáját, ezért külön 15-ös készlet nem készül. Képes minta a kulcs után jön.
- /api/check: ha nincs ANTHROPIC_API_KEY, 503-at ad (éles módban stub nem fut).
- Időkeret: a /api/check maxDuration = 60 mp; a Haiku-hívás időkorlátja 45 mp, újrapróbálás nélkül (a retry nem férne bele); a redirect-követés (legfeljebb 5 × 3 mp) szöveges bemenetnél ezzel párhuzamosan fut. Élő füstteszt: egy rövid SMS kiolvasása 10,8 mp volt (első strict-sémás hívás).
- A Haiku strict tool use módban fut (a claude-api skill szerint Haiku 4.5-ön támogatott), kikényszerített tool_choice-szal, temperature 0-val, max_tokens 16000-rel.
- A path_restricted szabály a látható (a szervezet által küldött) linkre vonatkozik; redirect után a végcélnak elég a szervezet hivatalos domainjén maradnia. Ok: az éles mérés kimutatta, hogy a valódi posta.hu/szolgaltatasok/vam 301-gyel a net.posta.hu/dashboard/public/dashboard-ui/vam/ oldalra visz, így a korábbi metszet-logika a valódi vámdíj-SMS-t PIROS-ra tette.
- Hasonmás-finomítás (általános szabály): 4–5 betűs márkatoken csak domainrész elején számít (sneakers.hu ≠ NEAK, bonusz.hu ≠ NÚSZ); a közös állami domain aldomain-címkéje (tarhely.gov.hu, neak.gov.hu) nem márkatoken és nem Levenshtein-alap (tarhely.eu, peak.com nem hasonmás).
- Regex-tartalék: az „átutal” tő helyett csak felszólító/főnévi igenévi alakok (a „átutalás érkezett” valódi banki értesítés ne legyen pénzkérés); az „új szám” helyett konkrét alakok („új számla” ≠ új telefonszám); a zárolás ragozott tövei (zárol, felfüggeszt, kikapcsol, letilt) is fenyegetésnek számítanak.
