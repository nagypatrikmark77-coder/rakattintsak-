# Döntések

Egy sor = egy döntés. A jóváhagyott tervből (2026-09-27) és a végrehajtás közbeni apró döntésekből.

## Teljes felület megújítása (2026-09-27)
- A korábbi 480 px-es elrendezést világos, zsályazöld alkalmazásfelület váltja: asztali oldalsáv, mobilon közvetlenül elérhető menüsor; a három fő funkció külön menüpont, a használati segítség a `/utmutato` oldalon érhető el. Promóciós banner nincs.
- Az űrlapok, az eredmények mindhárom ítéletszíne, a Nagyi mód, a családi nézetek és a hatkérdéses segítség egységes kártyákat, gombokat, fókuszjelzéseket és visszajelzéseket kapott. A kérdőjeles pajzs a böngészőikonon és a PWA-ikonokon is megjelenik.
- A design munka a megjelenítést érinti; az API, a kiértékelés, a tagság- és hitelesítéskezelés, a megosztás, az adatbázis és az értesítések folyamata változatlan. A böngészős QA szimulált API- és családi válaszokkal futott; az éles AI, Google-belépés és értesítéskézbesítés működését nem bizonyítja.

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
- M1→M3: a megosztott tartalom a Cache API-ban (rakattintsak-share-v1) vár; a főoldal előbb csak kiolvassa, és csak sikeres ellenőrzés után törli (hiba, limit vagy hiányzó session esetén megmarad az újrapróbáláshoz).
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

## M4–M6: család, limitek, auth (2026-09-27)
- Supabase-projekt: „rakattintsak-” (usrplrvqukilhuvelgjb, eu-west-1), Patrik hozta létre. A `SUPABASE_URL` az .env.local-ban Postgres connection string, ezért az API URL-t az anon kulcs ref-jéből származtatjuk (next.config env); a Vercelen a brief szerinti NEXT_PUBLIC_* nevek vannak.
- Az M5/M6 kiegészítés felülírja az eredeti brief „fiók nélkül, localStorage family_id, alerts anon select” részét: minden felhasználó (anonim is) Supabase-sessiont kap; az alerts csak a család tagjainak olvasható (RLS), anonnak nem.
- Tagság külön táblában (family_members: owner = unoka, member = nagyi); families.owner_id a user_id-hoz kötve. Riasztás csak a „member” PIROS ellenőrzéséből születik; az unoka saját ellenőrzése nem riaszt.
- A riasztás családját a szerver a bejelentkezett user tagságából határozza meg, a kliens nem küld family_id-t.
- „Előzmények” = a család riasztásainak listája (márka + időpont). Ellenőrzés-előzményt nem tárolunk, mert tartalmat nem tárolhatunk.
- Limit: `hit_limits` SQL-függvény, egy tranzakcióban nézi a 20/óra/IP és a 30/nap/felhasználó limitet (Europe/Budapest nap); elutasított kérés nem számít bele. Supabase-hiba esetén az ellenőrzés engedett (fail-open), a költséget az Anthropic keret védi.
- IP-hash: sha256(RATE_LIMIT_SALT | ip); a rate_limits sorok 2 óra után törlődnek.
- A tagság-ellenőrző (is_family_member) a nem publikált `private` sémában van, hogy RPC-n ne legyen hívható. A Supabase saját `public.rls_auto_enable()` függvényéhez nem nyúltunk (a tanácsadó jelzi, projekt-alapértelmezés).
- `npm run test:db`: adatbázis-kapu ideiglenes tesztfelhasználókkal (limitek, riasztás, oszlopok, RLS), a végén törli őket; elrontott limittel (--day-limit=1000) bizonyítottan elbukik.
- M6 Google: „Fiók mentése Google-lal” = linkIdentity az anonim userhez (a user_id és a usage megmarad). Ha a Google-fiók már másik felhasználóhoz tartozik (identity_already_exists), „Belépés ezzel a Google-fiókkal” = signInWithOAuth (az eszköz anonim adatai ilyenkor nem kerülnek át).

## Valódi minták és séma-pontosítás (2026-09-27)
- tests/fixtures/collected.json: Patrik 3 valódi csaló SMS-e (DPD +91, Telekom +30, Telekom +90 rövidítővel), a Telekom NPS-kérdőív (legit, SZÜRKE elvárással) és a Telekom ÁSZF-értesítés (legit; Patrik képernyőképe, a szöveges változatot Claude írta át a képről a furcsa ékezetekkel, a „napjàtòl” ékezete a képen nem teljesen egyértelmű). A Patrik által beillesztett JSON 3. mintájának sérült szövege („gyarapojándékokra”) helyett az eredeti fájl ép szövege maradt (egyezik a képernyőképpel).
- Ha egy mintának szövege és képe is van, két változatban fut: [szöveg] (Feladó: sorral) és [kép]. Csak telefonszám-alakú feladó kerül „Feladó:” sorként a szöveg elé. Az expect_verdict (ha van) szintén kapu; az ékezet nélküli „SZURKE” is SZÜRKE.
- Séma (Patrik szövege szerint): share_code, money_transfer (utánvét nem), card_data (fizetési mód említése nem), call_back (megadott szám felszólítás nélkül nem); furcsa ékezet önmagában nem jel; séma nélküli és sortöréssel megtört link is link; képnél a látható feladó a transcript első sora („Feladó: …”), hogy az idézet-ellenőrzés megtalálja.
- share_code tartalmi kapu (kód): az idézetnek kódra/számsorra/számra/PIN-re kell hivatkoznia, különben a jel kiesik. Ok: a Haiku a séma pontos leírása ellenére is share_code-nak jelölte az NPS 0–10 pontozást (3/3 futásban), ami kemény PIROS lenne egy valódi üzeneten. Ára: egy kódot meg nem nevező, homályos továbbküldés-kérés nem hard rule.
- Regex-tartalék: a pénzkérés-találat nem számít, ha a mondatában utánvét / futárnál / futárnak / átvételkor szerepel.
- Sortöréssel megtört link (képernyőkép): ha a regex-találat a modell egyik linkjének eleje, és a teljes link a transcriptben csak whitespace-szel megszakítva szerepel, a teljes linket elemezzük (így az útvonal-szabály és az uncertain_read is a teljes linket látja).
