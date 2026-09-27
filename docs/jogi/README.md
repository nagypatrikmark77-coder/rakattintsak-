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
2. **Az ÁSZF elfogadása.** A felelősségkorlátozás szokatlan kikötés. Csak akkor válik a szerződés részévé, ha a felhasználó figyelmét külön felhívjuk rá, és kifejezetten elfogadja, például egy jelölőnégyzettel az első ellenőrzés előtt (Ptk. 6:78. § (2), BH 2025.1.17).
3. **MI-tájékoztatás a felületen.** Az MI-rendelet 50. cikk (1) bekezdése **2026. augusztus 2. óta alkalmazandó**, és a Kft. szolgáltatónak minősül. A tájékoztatás csak az ÁSZF-ben nem elég: a beviteli mező mellett, az első ellenőrzés előtt kell megjelennie, és minden eredménynél kell egy rövid címke. A jelenlegi felületen ilyen tájékoztatást nem láttam. Szövegtervezet a [KUTATAS.md](KUTATAS.md) 20–21. sora mögötti forrásokból:
   > „Az üzenetedet mesterséges intelligencia (az Anthropic Claude nevű modellje) olvassa át, és kigyűjti belőle a gyanús jeleket. Hogy SZÜRKE, SÁRGA vagy PIROS lesz, azt ezekből a jelekből előre rögzített szabályok döntik el, a teendőket pedig mi írtuk meg előre. Az MI tévedhet: jelet kihagyhat vagy félreolvashat. A SZÜRKE nem jelenti azt, hogy az üzenet biztosan biztonságos.”
4. **Első látogatáskor egy rövid, egyszeri tájékoztató sáv a helyi tárolásról.** Ez nem hozzájárulást kérő süti-sáv, hanem egy rövid összefoglaló, linkkel az adatkezelési tájékoztató 7. fejezetére (NAIH/2017/1060/V). Ugyanitt vagy az első ellenőrzésnél **kifejezetten fel kell hívni a figyelmet a tiltakozási jogra** (GDPR 21. cikk (4)).
5. **A Vercel-terv ellenőrzése.** Ha a projekt Hobby terven fut, nincs adatfeldolgozási szerződés (DPA) a Vercellel, és a Kft. általi használat a Vercel feltételei szerint kereskedelmi, tehát **Pro terv kell**. Ha be van kapcsolva az Observability Plus, a naplók 30 napig maradnak meg: ekkor az adatkezelési tájékoztató 4.7. pontját frissíteni kell.
6. **Az Anthropic szerződő felének ellenőrzése.** A legutóbbi számlán meg kell nézni, hogy az eladó az Anthropic Ireland, Limited-e (EGT-beli ügyfél esetén ez a feltételek szerinti szerződő fél).
7. **A Supabase auth-adatok ellenőrzése.** Három dolgot kell megnézni: ki van-e töltve az `auth.sessions.ip`, be van-e kapcsolva az auditnapló adatbázisba írása, és milyen kulcsok vannak a Google `identity_data` mezőjében. A csak darabszámokat kérő lekérdezés megvan, de a jogosultsági rendszer nem engedte lefuttatni. Neked kell lefuttatnod vagy engedélyezned.
8. **Ügyvédi vagy adatvédelmi szakértői átnézés.** Ugyanekkor a 2026. október 1-jétől hatályos jogszabályszövegeket is újra meg kell nézni.

## Döntést igénylő pontok

| # | Kérdés | Javaslat |
|---|---|---|
| D1 | **A csendes anonim munkamenet első megnyitáskor.** A WP29 szerint a tartós bejelentkezés nem esik a „feltétlenül szükséges” kivétel alá, és az ellenőrzés munkamenet nélkül is fut, csak IP-korláttal. | A munkamenet csak az első ellenőrzéskor jöjjön létre (kódváltozás). |
| D2 | **A véletlenül beküldött különleges adat** (például egészségügyi adat) jogalapja (GDPR 9. cikk (2)). | Jogászi kérdés. A tájékoztató most figyelmeztet, és nem tárolja az adatot. |
| D3 | **Sikertelen ellenőrzés után a megosztott tartalom** korlátlan ideig a készüléken marad (Cache API). | Legyen lejárata, például 24 óra. |

## Nyitott tételek a kódban (nem ennek a körnek a része)

| # | Tétel | Miért |
|---|---|---|
| K1 | A `usage`, az `alerts`, a `families` és a `family_members` táblának, valamint az anonim fiókoknak **nincs automatikus törlési ideje**. A Supabase anonim fiókokat nem töröl. | Korlátozott tárolhatóság (GDPR 5. cikk (1) e)). Ma a tájékoztató ezt írja: „a fiók törléséig”. |
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
