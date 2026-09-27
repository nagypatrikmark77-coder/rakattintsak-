# Jogi dokumentumok – Rákattintsak?

**Rákattintsak?** · Verzió 1.0 · 2026. szeptember 27. · Hatályos a közzététel napjától

> **⚠️ FONTOS: A RÁKATTINTSAK? NEM AD TANÁCSOT, ÉS NEM ISMER FEL MINDEN CSALÁST.**
>
> - Az ítélet (SZÜRKE, SÁRGA vagy PIROS) egy számítógépes rendszer automatikus becslése. **Nem minősül jogi, pénzügyi, banki, befektetési, informatikai-biztonsági vagy más szakmai tanácsadásnak**, és nem személyre szabott segítség.
> - **Nem garantáljuk, hogy minden csaló üzenetet felismerünk.** A rendszer tévedhet: egy csaló üzenetet is jelölhet SZÜRKE-nek, és egy valódi üzenetet is PIROS-nak. A SZÜRKE csak azt jelenti, hogy nem találtunk gyanús jelet, nem azt, hogy az üzenet biztosan valódi.
> - Nem helyettesíti a bankod, az érintett szervezet, a hatóságok vagy a rendőrség tájékoztatását. **A döntés mindig a tiéd.**
> - Ha bizonytalan vagy: ne kattints, ne adj meg adatot, ne utalj. Hívd a bankodat vagy a szervezetet azon a hivatalos számon, amelyet te magad keresel ki (például a bankkártyád hátoldaláról), ne azon, amelyik az üzenetben szerepel.

## Röviden

Ez a mappa a Rákattintsak? jogi csomagja. **Tervezet:** internetes kutatásra és a kód 2026. szeptember 27-i állapotára épül. **Élesítés előtt ügyvédi vagy adatvédelmi szakértői átnézés javasolt.** A dokumentumok jelenleg csak itt, fájlként léteznek, az alkalmazásban még nem jelennek meg.

## Tartalom

| Fájl | Mi ez | Kinek |
|---|---|---|
| [adatkezelesi-tajekoztato.md](adatkezelesi-tajekoztato.md) | Adatkezelési tájékoztató a GDPR 13–14. cikke szerint, benne a sütikről és a helyi tárolóról | felhasználók, érintettek, NAIH |
| [felhasznalasi-feltetelek.md](felhasznalasi-feltetelek.md) | Általános szerződési feltételek (ÁSZF): a szerződés, a korlátok, a felelősség, a panaszkezelés | felhasználók |
| [jogi-nyilatkozat.md](jogi-nyilatkozat.md) | **Nem minősül tanácsadásnak**, felelősségkizárás, AI-átláthatóság, szellemi tulajdon | felhasználók |
| [impresszum.md](impresszum.md) | Szolgáltatói adatok az Ekertv. 4. §-a szerint, tárhelyszolgáltatók | mindenki |
| [KUTATAS.md](KUTATAS.md) | A mélykutatás: források, megállapítások, következmények | Üzemeltető, jogász |

Adatkezelő és szolgáltató: **SCHINDLER 97 Kereskedelmi és Szolgáltató Korlátolt Felelősségű Társaság** (4033 Debrecen, Kinizsi u. 57.; cégjegyzékszám 09-09-005488; adószám 11556598-2-09; patrik@sidekickautomations.hu).

## Élesítés előtt kötelező

Ezek nélkül a dokumentumok nem tölthetik be a szerepüket, vagy valótlant állítanának:

1. **A dokumentumok beépítése az appba.** Oldalak, lábléc-linkek, és a dokumentumok elérhetősége minden oldalról.
2. **Az ÁSZF elfogadása.** A felelősségkorlátozás szokatlan kikötés. Csak akkor válik a szerződés részévé, ha a felhasználó figyelmét külön felhívjuk rá, és kifejezetten elfogadja (Ptk. 6:78. § (2), BH 2025.1.17). Az ÁSZF 3.2. pontja pontosan leírja a folyamatot: két külön, alapból üres jelölőnégyzet az első ellenőrzés előtt, a 10. fejezeté szó szerint az ÁSZF 10. fejezetének elején; visszaigazolás a képernyőn; új változatnál új elfogadás. Ha az elfogadást a készüléken (localStorage) vagy adatbázisban rögzítjük, az ÁSZF 3.4. pontját („nem iktatjuk”) és az adatkezelési tájékoztató 7. fejezetének táblázatát frissíteni kell.
3. **MI-tájékoztatás a felületen.** Az MI-rendelet 50. cikk (1) bekezdése **2026. augusztus 2. óta alkalmazandó**, és a Kft. szolgáltatónak minősül. A tájékoztatás csak az ÁSZF-ben nem elég: a beviteli mező mellett, az első ellenőrzés előtt kell megjelennie, és minden eredménynél kell egy rövid címke. Az `app/` mappában 2026. szeptember 27-én (a folyamatban lévő felületi átdolgozással együtt) nincs ilyen tájékoztatás. Szövegtervezet a [KUTATAS.md](KUTATAS.md) 20–21. megállapítása alapján:
   > „Az üzenetedet mesterséges intelligencia (az Anthropic Claude nevű modellje) olvassa át, és kigyűjti belőle a gyanús jeleket. Hogy SZÜRKE, SÁRGA vagy PIROS lesz, azt ezekből a jelekből előre rögzített szabályok döntik el, a teendőket pedig mi írtuk meg előre. Az MI tévedhet: jelet kihagyhat vagy félreolvashat. A SZÜRKE nem jelenti azt, hogy az üzenet biztosan biztonságos.”
4. **Első látogatáskor egy rövid, egyszeri tájékoztató sáv a helyi tárolásról.** Ez nem hozzájárulást kérő süti-sáv, hanem egy rövid összefoglaló, linkkel az adatkezelési tájékoztató 7. fejezetére (NAIH/2017/1060/V). Ugyanitt vagy az első ellenőrzésnél **kifejezetten fel kell hívni a figyelmet a tiltakozási jogra** (GDPR 21. cikk (4)).
5. **Vercel: az Observability Plus ellenőrzése.** A csomag **Pro**: a Vercel API-ján 2026. szeptember 27-én ellenőriztem. Így a Vercel adatfeldolgozási feltételei (DPA) vonatkoznak ránk, és a futásidejű naplók 1 napig maradnak meg. Ha be van kapcsolva az Observability Plus, a naplók 30 napig maradnak meg: ekkor az adatkezelési tájékoztató 4.7. pontját frissíteni kell.
6. **Az Anthropic szerződő felének ellenőrzése.** A legutóbbi számlán meg kell nézni, hogy az eladó az Anthropic Ireland, Limited-e (EGT-beli ügyfél esetén ez a feltételek szerinti szerződő fél).
7. **A Supabase auth-adatok ellenőrzése.** Három dolgot kell megnézni: ki van-e töltve az `auth.sessions.ip`, be van-e kapcsolva az auditnapló adatbázisba írása, és milyen kulcsok vannak a Google `identity_data` mezőjében. A csak darabszámokat kérő lekérdezés megvan, de a jogosultsági rendszer nem engedte lefuttatni. Neked kell lefuttatnod vagy engedélyezned.
8. **Ügyvédi vagy adatvédelmi szakértői átnézés.** Ugyanekkor a 2026. október 1-jétől hatályos jogszabályszövegeket is újra meg kell nézni.

## Üzemeltetési eljárás: törlési kérelem e-mailben

Amíg az appban nincs törlés (K3), a kérelmeket kézzel kell teljesíteni, legkésőbb egy hónapon belül (GDPR 12. cikk (3)):

1. Azonosítás: mentett fióknál a Google-fiók e-mail-címe, névtelen fióknál a fiókazonosító (adatkezelési tájékoztató 10. fejezet).
2. **Fióktörlés:** a Supabase Authentication felületén a felhasználó törlése. Ez törli a `usage`, a `family_members` és (tulajdonosnál) a `families` sorokat, a család `alerts` soraival együtt.
3. **Nagyi (member) fiókja vagy kilépése:** amíg a [javasolt migráció](javasolt-migracio.sql) nincs alkalmazva, az `alerts` sor nem tudja, melyik tagtól származik. Ilyenkor a család azon riasztásait kell törölni, amelyek a tag csatlakozása (`family_members.created_at`) óta keletkeztek. Ha a családnak több tagja van, erről a tulajdonost tájékoztatni kell. A migráció után: `select public.leave_family(<user_id>, <family_id>)`.
4. A kérelmet és a választ a kérelem lezárásától számított 5 évig meg kell őrizni (adatkezelési tájékoztató 4.8.).

## Döntést igénylő pontok

| # | Kérdés | Javaslat |
|---|---|---|
| D1 | **A csendes anonim munkamenet.** A WP29 szerint a tartós bejelentkezés nem esik a „feltétlenül szükséges” kivétel alá. A kód szerint (`app/check-form.tsx`) a főoldalon a munkamenet csak az első ellenőrzéskor jön létre. Ez rendben van, mert a felhasználó ekkor kifejezetten kéri a szolgáltatást. A **Családi védőháló oldal** (`app/csalad/family-view.tsx`, `resolveView`) viszont már megnyitáskor létrehozza, akkor is, ha a felhasználó csak körülnéz. | A családi oldalon a munkamenet csak a „Fiók mentése Google-lal” gombra jöjjön létre: `ensureSession()` helyett csak a meglévő munkamenet kiolvasása (kódváltozás). |
| D2 | **A véletlenül beküldött különleges adat** (például egészségügyi adat) jogalapja (GDPR 9. cikk (2)). | Jogászi kérdés. A tájékoztató most figyelmeztet, és nem tárolja az adatot. |
| D3 | **Sikertelen ellenőrzés után a megosztott tartalom** korlátlan ideig a készüléken marad (Cache API). | Legyen lejárata, például 24 óra. |

## Nyitott tételek a kódban (nem ennek a körnek a része)

| # | Tétel | Miért |
|---|---|---|
| K1 | A `usage`, az `alerts`, a `families` és a `family_members` táblának, valamint az anonim fiókoknak **nincs automatikus törlési ideje**. A Supabase anonim fiókokat nem töröl. | Korlátozott tárolhatóság (GDPR 5. cikk (1) e)). Ma a tájékoztató ezt írja: „a fiók törléséig”. |
| K1b | Az `alerts` sor nem tudja, melyik tag PIROS ítéletéből született. Ezért ha egy tag kilép, a riasztásai nem törölhetők célzottan. | Kész javaslat: [javasolt-migracio.sql](javasolt-migracio.sql). Ez `alerts.user_id` oszlopot, kilépési függvényt (`leave_family`) és 10 percenkénti `pg_cron`-takarítást ad a `rate_limits` táblához. Az éles adatbázison a jogosultsági rendszer nem engedte lefuttatni. Alkalmazás után a `scripts/test-db.ts` oszlopellenőrzését és az adatkezelési tájékoztató 4.3. és 4.6. pontját frissíteni kell. |
| K2 | A `rate_limits` törlése csak a következő ellenőrzéskor fut. | Egy ütemezett törlés (`pg_cron`) garantált felső határt adna. |
| K3 | Az appban **nincs fióktörlés** és kilépés a családból, most ezeket csak e-mailben lehet kérni. | Érintetti jogok gyakorlásának megkönnyítése. |
| K4 | Az IP-hash statikus sóval készül. | Egy 2 óránként forgatott HMAC-kulcs után a hash a kulcs törlésével a Kft. számára sem kapcsolható vissza. |
| K5 | A felolvasás nem szűr helyi hangra (`localService`). | Szűréssel kijelenthető lenne, hogy a felolvasás csak a készüléken történik. |
| K6 | A szerverfunkció az USA-ban fut (iad1). | Egy EU-s régió (például `dub1`) közelebb van az Írországban futó adatbázishoz. Az Anthropic-hívás ettől még az USA-ba megy. |

## Karbantartás: melyik kódváltozás melyik fejezetet érinti

| Ha ez változik… | …ezt kell frissíteni |
|---|---|
| `supabase/migrations/*` (új tábla, oszlop) | Adatkezelési tájékoztató 4., 5., 13. |
| `lib/limits.ts` (korlátok, IP-hash) | Felhasználási feltételek (korlátok); Adatkezelési tájékoztató 4.3–4.4., 12. |
| `lib/extract.ts` (`EXTRACT_MODEL`, szolgáltató) | Adatkezelési tájékoztató 3., 5–6.; Jogi nyilatkozat (MI) |
| `lib/verdict.ts` (pontok, küszöbök, kemény szabályok) | Adatkezelési tájékoztató 8. (a példa számai) |
| `lib/redirects.ts` (linkellenőrzés) | Adatkezelési tájékoztató 4.2.; Jogi nyilatkozat |
| `app/api/check/route.ts` (méretkorlátok, időkorlát) | Felhasználási feltételek; Adatkezelési tájékoztató 3., 4.1. |
| `app/nagyi.tsx`, `lib/supabase/browser.ts`, `public/sw.js` (helyi tárolás) | Adatkezelési tájékoztató 7. |
| `app/csalad/*`, `app/api/family/*` (családi funkció) | Adatkezelési tájékoztató 4.6.; Felhasználási feltételek |
| Új külső szolgáltató, régió vagy terv | Adatkezelési tájékoztató 5–6.; Impresszum |

Ha a változás érinti a dokumentumokat, a verziószámot és a dátumot is emelni kell. Lényeges változásról a felhasználót előre értesíteni kell.
