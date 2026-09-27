# Adatkezelési tájékoztató

**Rákattintsak?** · Verzió 1.0 · 2026. szeptember 27. · Hatályos a közzététel napjától

> **⚠️ FONTOS: A RÁKATTINTSAK? NEM AD TANÁCSOT, ÉS NEM ISMER FEL MINDEN CSALÁST.**
>
> - Az ítélet (SZÜRKE, SÁRGA vagy PIROS) egy számítógépes rendszer automatikus becslése. **Nem minősül jogi, pénzügyi, banki, befektetési, informatikai-biztonsági vagy más szakmai tanácsadásnak**, és nem személyre szabott segítség.
> - **Nem garantáljuk, hogy minden csaló üzenetet felismerünk.** A rendszer tévedhet: egy csaló üzenetet is jelölhet SZÜRKE-nek, és egy valódi üzenetet is PIROS-nak. A SZÜRKE csak azt jelenti, hogy nem találtunk gyanús jelet, nem azt, hogy az üzenet biztosan valódi.
> - Nem helyettesíti a bankod, az érintett szervezet, a hatóságok vagy a rendőrség tájékoztatását. **A döntés mindig a tiéd.**
> - Ha bizonytalan vagy: ne kattints, ne adj meg adatot, ne utalj. Hívd a bankodat vagy a szervezetet azon a hivatalos számon, amelyet te magad keresel ki (például a bankkártyád hátoldaláról), ne azon, amelyik az üzenetben szerepel.

## Röviden

- **A beküldött üzenetet nem mentjük el.** A szöveg vagy a kép csak az ellenőrzés néhány másodpercéig van nálunk, a memóriában. Nem kerül adatbázisba, naplóba vagy fájlba.
- Az üzenetet **egy mesterséges intelligencia** (az Anthropic cég Claude Haiku 4.5 modellje) olvassa ki. Az Anthropic a saját szabályai szerint **legfeljebb 30 napig** őrzi meg, és **nem tanít rajta** modellt.
- Nem kérjük a neved, az e-mail-címed vagy a telefonszámod. Első megnyitáskor a készüléked egy **névtelen azonosítót** kap. Ehhez kötjük, hány ellenőrzést végeztél aznap.
- Az IP-címedet csak **titkosított (hash-elt) formában**, néhány óráig tároljuk, hogy a szolgáltatással ne lehessen visszaélni.
- A családi funkcióban a család tagjai **csak annyit látnak**, hogy melyik szervezet nevében érkezett PIROS üzenet, és mikor. Az üzenet tartalmát nem.
- Nincs reklám, nincs látogatottságmérés, nincs marketing. **Adatot nem adunk el.**
- **Tiltakozhatsz** az IP-címed és a használati számláló visszaélés-megelőzési célú kezelése ellen ([10.1. pont](#101-tiltakozási-jog)).
- Bármikor kérhetsz tájékoztatást, törlést vagy mást: **patrik@sidekickautomations.hu**.

---

## 1. Ki kezeli az adataidat?

Az adatkezelő (a továbbiakban: **Üzemeltető** vagy **mi**):

| | |
|---|---|
| Név | SCHINDLER 97 Kereskedelmi és Szolgáltató Korlátolt Felelősségű Társaság (SCHINDLER 97 Kft.) |
| Székhely | 4033 Debrecen, Kinizsi u. 57. |
| Cégjegyzékszám | 09-09-005488 (nyilvántartja: Debreceni Törvényszék Cégbírósága) |
| Adószám | 11556598-2-09 |
| E-mail | patrik@sidekickautomations.hu |
| Telefon | +36 30 670 2766 |
| Webcím | https://rakattintsak.vercel.app |

Az Üzemeltető nevében adatvédelmi ügyekben **Nagy Patrik** jár el. **Adatvédelmi tisztviselőt nem jelöltünk ki**, mert erre a GDPR 37. cikke szerint nem vagyunk kötelesek. Nem vagyunk hatóság, és a fő tevékenységünk nem az érintettek nagymértékű, rendszeres megfigyelése vagy különleges adataik nagymértékű kezelése.

A tájékoztató a Rákattintsak? webes alkalmazásra (a továbbiakban: **Szolgáltatás**) vonatkozik.

## 2. Milyen szabályok szerint kezeljük az adataidat?

- az Európai Parlament és a Tanács (EU) 2016/679 rendelete (általános adatvédelmi rendelet, **GDPR**);
- az információs önrendelkezési jogról és az információszabadságról szóló **2011. évi CXII. törvény (Infotv.)**;
- az elektronikus kereskedelmi szolgáltatások, valamint az információs társadalommal összefüggő szolgáltatások egyes kérdéseiről szóló **2001. évi CVIII. törvény (Ekertv.)**;
- a Polgári Törvénykönyvről szóló **2013. évi V. törvény (Ptk.)**;
- a fogyasztóvédelemről szóló **1997. évi CLV. törvény (Fgytv.)**;
- a végberendezésen történő tárolásra az elektronikus hírközlésről szóló **2003. évi C. törvény (Eht.) 155. § (4) bekezdése** ([7. fejezet](#7-mit-tárolunk-a-készülékeden-sütik-és-helyi-tároló));
- a mesterséges intelligenciáról szóló **(EU) 2024/1689 rendelet** (MI-rendelet) átláthatósági szabályai ([Jogi nyilatkozat](jogi-nyilatkozat.md)).

## 3. Hogyan működik a Szolgáltatás? (amit az adatkezeléshez tudnod kell)

1. Bemásolsz egy gyanús üzenetet (legfeljebb 5000 karakter), vagy feltöltesz róla egy képernyőképet. A képet a böngésződ **még feltöltés előtt kicsinyíti**: a hosszabbik oldala legfeljebb 1024 képpont lesz. Az újratömörítés **eltávolítja a kép rejtett adatait**, például a GPS-helyadatot.
2. Szerverünk az üzenetet **egyetlen kéréssel** elküldi az Anthropic mesterségesintelligencia-szolgáltatásának. A modell pontos neve **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`). **A modell nem dönt.** Csak kiolvassa a jeleket: ki a feladó, milyen linkek vannak az üzenetben, kér-e kódot, pénzt vagy adatot.
3. Ha az üzenetben link van, **szerverünk ellenőrzi a linket**: egy úgynevezett HEAD-kérést küld rá, és követi az átirányításokat. Ez legfeljebb 5 linket érint üzenetenként, linkenként legfeljebb 5 átirányítással. A kérés `RakattintsakBot/1.0` néven megy ki.
4. Az ítéletet (SZÜRKE, SÁRGA vagy PIROS) egy **előre megírt szabályokat követő program** hozza meg. A program a jeleket egy ellenőrzött szervezetlistával és ismert csalásmintákkal veti össze. Az ítélet kiírt szövegei előre megírt sablonok.
5. Az eredmény megjelenik a képernyődön, **az üzenet pedig nálunk megszűnik**.

## 4. Milyen adatokat kezelünk, miért, milyen jogalapon és meddig?

### 4.1. A beküldött üzenet ellenőrzése

| | |
|---|---|
| **Adatok** | A bemásolt szöveg vagy a képernyőkép, és minden, ami benne van. Ez lehet a te adatod, vagy más személyek adata: a feladó telefonszáma vagy neve, egy megszólítás, egy link. |
| **Cél** | Az általad kért ellenőrzés elvégzése és az eredmény megjelenítése. |
| **Jogalap** | A saját adataid esetében a **GDPR 6. cikk (1) bekezdés b) pontja**: a Szolgáltatás nyújtása a [Felhasználási feltételek](felhasznalasi-feltetelek.md) szerint. Az üzenetben szereplő más személyek adatai esetében a **GDPR 6. cikk (1) bekezdés f) pontja**: a csalás elleni védekezéshez fűződő jogos érdeked és a mi jogos érdekünk ([12. fejezet](#12-érdekmérlegelés-összefoglaló)). |
| **Megőrzés** | **Nálunk semeddig.** A tartalom csak a kérés feldolgozásáig, a szerver memóriájában él: jellemzően néhány másodpercig, legfeljebb 60 másodpercig (ennyi a szerverfunkció időkorlátja). Nem kerül adatbázisba, naplóba vagy fájlba. Ezt minden kódváltozásnál egy automatikus ellenőrzés (`check:privacy`) vizsgálja. **Az Anthropic a be- és kimenetet 30 napon belül törli**¹, és nem tanít rajta modellt. Részletek: [5. fejezet](#5-kik-férnek-hozzá-az-adataidhoz-címzettek). |

<sub>¹ Kivétel az Anthropic feltételei szerint: ha a rendszere egy tartalmat a felhasználási szabályzatába ütközőnek jelöl meg, a be- és kimenetet legfeljebb 2 évig, a biztonsági besorolás eredményét legfeljebb 7 évig őrizheti meg.</sub>

> **Kérünk, ne küldj be felesleges személyes adatot.** A képernyőképen takard le vagy vágd le, ami nem kell az ellenőrzéshez: saját név, számlaszám, lakcím, jelszó, PIN-kód, bankkártyaszám. **Különleges adatot** (például egészségügyi adatot) se küldj be. Ha egy üzenetben mégis van ilyen, azt csak az ellenőrzéshez használjuk, a fentiek szerint nem tároljuk, és semmilyen következtetést nem vonunk le belőle rólad.

Az üzenetben szereplő más személyekre (például a feladóra) vonatkozó tájékoztatást a [4.9. pont](#49-ha-a-te-adataid-szerepelnek-egy-nekünk-beküldött-üzenetben-gdpr-14-cikk) tartalmazza.

### 4.2. A linkek ellenőrzése

| | |
|---|---|
| **Adatok** | Az üzenetben talált link (webcím). Ebben lehet egy egyedi azonosító, amelyet a feladó rendelt hozzád. |
| **Cél** | Megállapítani, hová vezet valójában a link (átirányítások), és hogy a végcél egy szervezet hivatalos oldala-e. |
| **Jogalap** | GDPR 6. cikk (1) bekezdés b) pont (a kért ellenőrzés része), illetve f) pont (csalás elleni védekezés). |
| **Megőrzés** | Nálunk semeddig: csak a kérés idejére, a memóriában. |

> **Fontos tudnod:** amikor szerverünk ellenőrzi a linket, **a link gazdája (például egy csaló weboldala) látja, hogy valaki megnyitotta a linket**. A te IP-címedet nem látja, csak a mi szerverünkét. Ha a link egyedi azonosítót tartalmaz, a csaló ebből arra következtethet, hogy az üzenetet elolvasták. A belső hálózati címekre nem küldünk kérést.

### 4.3. Visszaélés-megelőzés: óránkénti korlát IP-cím alapján

| | |
|---|---|
| **Adatok** | Az IP-címed **sózott SHA-256 hash-e**. Ez egy titkos kulccsal képzett ujjlenyomat, amelyből a kulcs nélkül az IP-cím nem állítható vissza. Magát az IP-címet nem tároljuk. Tárolt mezők: `rate_limits` tábla: `ip_hash`, `window_start` (az óra kezdete), `count` (az abban az órában végzett ellenőrzések száma). |
| **Cél** | Egy hálózatból óránként legfeljebb 20 ellenőrzés indulhasson. Ez megvédi a Szolgáltatást a tömeges, automatizált visszaéléstől és az ebből eredő költségektől, így a Szolgáltatás mindenkinek ingyenes és elérhető maradhat. |
| **Jogalap** | GDPR 6. cikk (1) bekezdés f) pont, jogos érdek ([12. fejezet](#12-érdekmérlegelés-összefoglaló)). |
| **Megőrzés** | A sor az óra kezdetétől számított **2 óra elteltével, a következő ellenőrzés során** törlődik. Ha közben senki nem ellenőriz, a törlés addig vár. Egy 10:00 és 10:59 között létrejött sor 12:00 után törölhetővé válik, és az első ezután érkező ellenőrzés törli. |

A hash-elt IP-cím is **személyes adatnak** minősül, mert a titkos kulcs nálunk van, és elvben újra előállítható. Ezért is kezeljük a GDPR szerint.

**Családkód-próbálkozások.** Ha valaki egymás után hibás családkódokat ír be, a hibákat a szerver **csak a memóriájában** számolja: az IP-cím hash-e és a felhasználói azonosító szerint, 15 percen keresztül legfeljebb 10 hibáig. Ez nem kerül adatbázisba, és legfeljebb 15 perc után, vagy a szerver újraindulásakor megszűnik. A jogalap GDPR 6. cikk (1) bekezdés f) pont, a családkódok kitalálgatás elleni védelme.

### 4.4. Névtelen fiók és napi korlát

| | |
|---|---|
| **Adatok** | Első megnyitáskor a Szolgáltatás a háttérben **névtelen (anonim) felhasználót** hoz létre. Ehhez nem kell név, e-mail-cím vagy telefonszám. A Supabase felhasználói nyilvántartásában (`auth.users`) ez tárolódik róla: a véletlenszerű azonosító, a névtelen jelző (`is_anonymous`), a létrehozás és az utolsó belépés ideje. A bejelentkezési munkamenethez (`auth.sessions`) a Supabase rögzíti az IP-címet és a böngésző azonosítóját (user agent). A bejelentkezési eseménynaplóba is kerül IP-cím. Napi használat: `usage` tábla: `user_id`, `day` (magyar idő szerinti nap), `count` (ellenőrzések száma), `red_count` (ebből PIROS ítéletek száma). |
| **Cél** | Egy felhasználó naponta legfeljebb 30 ellenőrzést végezhessen (visszaélés-megelőzés). A névtelen fiókhoz később Google-fiókot köthetsz, és ezzel elérheted a családi funkciót. |
| **Jogalap** | A napi korlát esetében GDPR 6. cikk (1) bekezdés f) pont, jogos érdek ([12. fejezet](#12-érdekmérlegelés-összefoglaló)). A fiókmentés lehetővé tétele esetében GDPR 6. cikk (1) bekezdés b) pont. |
| **Megőrzés** | A fiók és a napi használati sorok **a fiók törléséig** maradnak meg. Automatikus törlés jelenleg nincs, a törlést bármikor kérheted ([10. fejezet](#10-milyen-jogaid-vannak)). A munkamenet a kijelentkezésig vagy a lejáratáig él, utána legfeljebb 24 órával a Supabase törli. A Supabase bejelentkezési eseménynaplója és rendszernaplói **7 napig** maradnak meg. |

### 4.5. Fiók mentése Google-lal (nem kötelező)

| | |
|---|---|
| **Adatok** | Ha a „Fiók mentése Google-lal” gombot választod, a Google a hozzájárulásoddal átadja nekünk a Google-fiókod **e-mail-címét, nevét, profilképének webcímét és Google-azonosítóját**. Ezeket a Supabase a fiókodhoz kapcsolt azonosítóként tárolja (`auth.identities`). |
| **Cél** | Fiókod megmaradjon egy másik készüléken vagy a böngésző törlése után is, és elérhesd a családi funkciót, amely csak mentett fiókkal működik. |
| **Jogalap** | GDPR 6. cikk (1) bekezdés b) pont: az általad választott funkció nyújtása. |
| **Megőrzés** | A fiók törléséig. |

A Google-bejelentkezés során a **Google** a saját felhasználói fiókrendszerére nézve **önálló adatkezelő**. Adatkezelésére a Google adatvédelmi irányelvei vonatkoznak: https://policies.google.com/privacy?hl=hu.

### 4.6. Családi funkció (nem kötelező)

A családi funkcióval egy családtag (a továbbiakban: **unoka**) figyelmeztetést kaphat, ha egy másik családtag (a továbbiakban: **nagyi**) ellenőrzése PIROS ítéletet ad. Mindkettőjüknek mentett (Google-lal összekötött) fiók kell.

| | |
|---|---|
| **Adatok** | **Család:** `families` tábla: `id`, `code` (6 karakteres családkód), `owner_id` (az unoka azonosítója), `created_at`. **Tagság:** `family_members` tábla: `family_id`, `user_id`, `role` (tulajdonos vagy tag), `created_at`. **Riasztás:** `alerts` tábla: `id`, `family_id`, `brand` (annak a szervezetnek a neve, amelynek a nevében az üzenet érkezett, vagy az „ismeretlen” szó), `verdict` (mindig PIROS), `created_at` (időpont). **A riasztásban soha nincs benne az üzenet szövege, képe, linkje vagy feladója.** |
| **Cél** | A családtagok értesítése, hogy egy idősebb hozzátartozójuk csaló üzenetet kaphatott, és segíthessenek neki. |
| **Jogalap** | GDPR 6. cikk (1) bekezdés b) pont. A családot az unoka hozza létre. A nagyi **maga írja be a családkódot**, és ezzel kéri, hogy a PIROS ítéleteiről a család értesítést kapjon. |
| **Kik látják** | A család tagjai: a családot, a tagságokat (csak azonosítóként, név nélkül) és a riasztásokat. A családi oldalon legfeljebb az utolsó 50 riasztás jelenik meg, valós időben. Ha az unoka engedélyezte, a böngészője értesítést is mutat. Az értesítést a készüléke jeleníti meg, külső értesítési (push) szolgáltatást nem használunk. |
| **Megőrzés** | A család, illetve az érintett fiók törléséig. Ha a családot vagy egy fiókot törlünk, a hozzá tartozó tagságok és riasztások is törlődnek. A kilépést, a család törlését vagy a riasztások törlését jelenleg e-mailben kérheted. |

### 4.7. Üzemeltetési naplók

| | |
|---|---|
| **Adatok** | A tárhelyszolgáltatónk (Vercel) minden kérésről naplót vezet: IP-cím, böngészőazonosító, a kért oldal címe, időpont. **A mi programkódunk ebbe csak egy hibakódot és a hiba típusát írja**, az üzenet tartalmát soha. |
| **Cél** | A Szolgáltatás működtetése, hibakeresés, biztonság. |
| **Jogalap** | GDPR 6. cikk (1) bekezdés f) pont, jogos érdek ([12. fejezet](#12-érdekmérlegelés-összefoglaló)). |
| **Megőrzés** | A Vercel futásidejű naplóit a Vercel **legfeljebb 1 napig** őrzi meg. A Supabase rendszernaplói **7 napig** maradnak meg. |

### 4.8. Kapcsolattartás, kérelmek és panaszok

| | |
|---|---|
| **Adatok** | Ha írsz nekünk: az e-mail-címed, a neved (ha megadod), a leveled tartalma és a válaszunk. |
| **Cél** | A kérdésed, adatvédelmi kérelmed vagy panaszod intézése. |
| **Jogalap** | Adatvédelmi kérelem és fogyasztói panasz esetén a **GDPR 6. cikk (1) bekezdés c) pontja**: a GDPR 12–22. cikke, illetve az Fgytv. 17/A. §-a szerinti jogi kötelezettség. Egyéb megkeresés esetén a GDPR 6. cikk (1) bekezdés f) pontja: jogos érdekünk, hogy válaszolhassunk. |
| **Megőrzés** | Fogyasztói panasz és a rá adott válasz: **3 év** (Fgytv. 17/A. § (7) bekezdés). Adatvédelmi kérelem: a kérelem lezárásától számított **5 év**, az általános elévülési idő (Ptk. 6:22. §), hogy utólag igazolni tudjuk, mit tettünk. Egyéb levelezés: a lezárástól számított **1 év**. |

Az e-mailjeinket a **Google Ireland Limited** levelezőrendszere kezeli adatfeldolgozóként.

### 4.9. Ha a te adataid szerepelnek egy nekünk beküldött üzenetben (GDPR 14. cikk)

Ez a pont annak szól, **akinek az adata egy olyan üzenetben szerepel, amelyet valaki más ellenőrzésre beküldött**. Ilyen például az SMS feladója, vagy egy név, egy telefonszám, egy link az üzenetben.

| | |
|---|---|
| **Honnan kaptuk?** | Attól a felhasználótól, aki az üzenetet megkapta, és beküldte ellenőrzésre. |
| **Milyen adat?** | Ami az üzenetben szerepel: jellemzően telefonszám, név, e-mail-cím, link, a szöveg maga. |
| **Mire használjuk?** | Csak arra, hogy megállapítsuk, csalásra utal-e az üzenet ([4.1.](#41-a-beküldött-üzenet-ellenőrzése) és [4.2. pont](#42-a-linkek-ellenőrzése)). Rólad nem hozunk döntést, és nem építünk rólad profilt. |
| **Jogalap** | GDPR 6. cikk (1) bekezdés f) pont: a címzett és a mi jogos érdekünk a csalás elleni védekezésben ([12. fejezet](#12-érdekmérlegelés-összefoglaló)). |
| **Kinek adjuk át?** | Az Anthropicnak a kiolvasáshoz ([5. fejezet](#5-kik-férnek-hozzá-az-adataidhoz-címzettek)). |
| **Meddig?** | Nálunk csak a kérés idejére (legfeljebb 60 másodperc), az Anthropicnál 30 napon belül törlődik. |

**Miért nem értesítünk téged külön?** Nem tudjuk, ki vagy. Az üzenetet nem tároljuk, így később sem tudnánk kapcsolatba lépni veled. Csaló feladó esetén az értesítés meghiúsítaná a védekezést. Ezért az egyéni tájékoztatás lehetetlen, és veszélyeztetné az adatkezelés célját (GDPR 14. cikk (5) bekezdés b) pont). Helyette ezt a tájékoztatót nyilvánosan elérhetővé tesszük. A [10. fejezet](#10-milyen-jogaid-vannak) szerinti jogok és a [11. fejezet](#11-jogorvoslat) szerinti jogorvoslat téged is megilletnek.

## 5. Kik férnek hozzá az adataidhoz? (címzettek)

Az adataidhoz az Üzemeltetőn belül csak **Nagy Patrik** fér hozzá, és csak a fenti célokra. Ezen kívül az alábbi szolgáltatókat vesszük igénybe. Adatfeldolgozóként csak a mi utasításunkra, a velük kötött adatfeldolgozási szerződés szerint dolgozhatnak (GDPR 28. cikk).

| Címzett | Szerep | Milyen adat | Hol | Továbbítási garancia |
|---|---|---|---|---|
| **Anthropic Ireland, Limited**, 6th Floor, South Bank House, Barrow Street, Dublin 4, D04 TR29, Írország (anyavállalata: Anthropic, PBC, 548 Market St, PMB 90375, San Francisco, CA 94104, USA) | adatfeldolgozó: a mesterséges intelligencia általi kiolvasás (az Anthropic, PBC a lánc további adatfeldolgozója) | a beküldött szöveg vagy kép és a modell válasza | Az adatokat az **USA-ban** tárolja, a feldolgozás a globális infrastruktúráján történhet. | az Európai Bizottság **általános adatvédelmi kikötései** (SCC), az Anthropic adatfeldolgozási feltételeinek része |
| **Vercel Inc.**, 440 N Barranca Ave #4133, Covina, CA 91723, USA | adatfeldolgozó: tárhely és a szerverprogram futtatása | minden kérés technikai adatai (IP-cím, böngészőazonosító, kért cím), a kérés tartalma átfutás közben | A weboldalt a hozzád legközelebbi szerver szolgálja ki. A szerverprogram (az ellenőrzés) jelenleg az **USA-ban** (Washington, D.C.) fut. | **EU–USA Adatvédelmi Keretrendszer** (a Vercel tanúsított résztvevő) és általános adatvédelmi kikötések |
| **Supabase Pte. Ltd.**, 65 Chulia Street #38-02/03, OCBC Centre, Szingapúr 049513 | adatfeldolgozó: adatbázis, bejelentkezés, valós idejű riasztás | névtelen azonosító, munkamenet (IP-cím, böngészőazonosító), Google-fiókadatok, használati számláló, IP-hash, család, tagság, riasztás | Az adatbázis és a bejelentkezés **az EU-ban, Írországban** (eu-west-1) fut. A naplók, a mentések és a Supabase alvállalkozói az EU-n kívül is lehetnek. | általános adatvédelmi kikötések (SCC), a Supabase adatfeldolgozási feltételeinek része |
| **Google Ireland Limited**, Gordon House, Barrow Street, Dublin 4, Írország | **önálló adatkezelő** a Google-bejelentkezésnél; **adatfeldolgozó** az e-mail-levelezésünknél | Google-bejelentkezésnél a bejelentkezés ténye; levelezésnél a leveleid | EU, illetve a Google globális infrastruktúrája | a Google LLC az **EU–USA Adatvédelmi Keretrendszer** tanúsított résztvevője |
| **A család tagjai** | címzettek a családi funkcióban | a riasztás (szervezet neve és időpont) | – | – |

**Nem adatfeldolgozók, de tudnod kell róluk:**

- **A beküldött linkek gazdái** a linkellenőrzéskor megkapják a link címét és a szerverünk IP-címét ([4.2. pont](#42-a-linkek-ellenőrzése)).
- **A böngésződ felolvasó funkciója** (Nagyi mód, „Felolvasás” gomb): az ítélet előre megírt címsorát a böngésződ vagy a telefonod beépített beszédfunkciója olvassa fel. A mi szerverünk ebben nem vesz részt. Egyes böngészők a hangot a gyártó szerverén állítják elő. A felolvasott szöveg ilyenkor sem a beküldött üzenet, csak az ítélet címsora (például „Nagy valószínűséggel csalás. Ne kattints rá.”).

Adatot **nem adunk el**, reklámcélra nem adunk át, és nem használjuk profilalkotásra. Hatóságnak (például bíróságnak, rendőrségnek) csak jogszabályban előírt esetben, a megkeresés szerinti körben adunk ki adatot. Az üzenetek tartalmát ilyenkor sem tudjuk kiadni, mert nem tároljuk.

**Modelltanítás:** az Anthropic a kereskedelmi feltételei szerint **nem tanít modellt** az API-n beküldött tartalmakon. A mi Szolgáltatásunk sem használja fel a beküldött tartalmakat semmilyen tanításra.

## 6. Harmadik országba (az Európai Gazdasági Térségen kívülre) történő továbbítás

A fenti táblázat szerint egyes adatok az **Európai Gazdasági Térségen kívülre**, elsősorban az **Egyesült Államokba** és **Szingapúrba** kerülnek, vagy onnan is hozzáférhetők. Ez három módon történik:

- **Beküldött üzenet (Anthropic) → USA:** az Anthropic adatfeldolgozási feltételeibe épített, a Bizottság (EU) 2021/914 végrehajtási határozatával elfogadott **általános adatvédelmi kikötések** alapján (GDPR 46. cikk (2) bekezdés c) pont). Az Anthropic nem szerepel az EU–USA Adatvédelmi Keretrendszer résztvevői között. A feltételek: https://www.anthropic.com/legal/data-processing-addendum
- **Tárhely (Vercel) → USA:** a Bizottság 2023. július 10-i (EU) 2023/1795 végrehajtási határozata (**EU–USA Adatvédelmi Keretrendszer**, GDPR 45. cikk) alapján, mert a Vercel Inc. a keretrendszer tanúsított résztvevője. Ezt a Vercel adatfeldolgozási feltételeibe épített általános adatvédelmi kikötések egészítik ki. A feltételek: https://vercel.com/legal/dpa
- **Adatbázis (Supabase) → Szingapúr, USA:** az adatbázis és a bejelentkezés az EU-ban (Írországban) fut. A szerződő fél szingapúri. A naplókhoz, a mentésekhez és a támogatáshoz a Supabase és az alvállalkozói az EU-n kívülről is hozzáférnek. Ezekre a Supabase adatfeldolgozási feltételeibe épített **általános adatvédelmi kikötések** vonatkoznak (GDPR 46. cikk (2) bekezdés c) pont). A feltételek: https://supabase.com/legal/dpa

A kikötések egy példányát kérésedre is megküldjük.

## 7. Mit tárolunk a készülékeden? (sütik és helyi tároló)

**Sütit (cookie) nem használunk.** Látogatottságmérő, reklám- vagy közösségimédia-kódot sem használunk. A Szolgáltatás működéséhez a böngésződ helyi tárolójában (localStorage, Cache API) ezeket tároljuk:

| Mi | Hol | Mire kell | Meddig |
|---|---|---|---|
| Bejelentkezési munkamenet (`sb-…-auth-token`; Google-összekötés közben átmenetileg `sb-…-auth-token-code-verifier`) | localStorage | A névtelen vagy mentett fiókod felismerése, a napi korlát, a családi funkció | Kijelentkezésig, illetve amíg a böngésző adatait nem törlöd |
| Nagyi mód beállítás (`rakattintsak.nagyi`) | localStorage | Megjegyzi, hogy a nagyobb, egyszerűbb nézetet kérted | Amíg át nem állítod, vagy a böngésző adatait nem törlöd |
| Megosztott tartalom (`rakattintsak-share-v1`) | Cache API | Ha a telefon „Megosztás” menüjéből küldesz üzenetet, az itt vár, amíg az ellenőrzés sikerül. **Addig nem megy szerverre.** | A sikeres ellenőrzés után törlődik. Ha az ellenőrzés nem sikerül, az újrapróbáláshoz megmarad, amíg sikerrel újra nem próbálod, vagy a böngésző adatait nem törlöd. |
| Szervizprogram (service worker) | böngésző | A megosztás fogadása és a családi értesítések megjelenítése | Amíg a böngésző adatait nem törlöd |
| Értesítési engedély | böngésző | Csak ha a családi oldalon engedélyezed | Amíg vissza nem vonod a böngésző beállításaiban |

A végberendezésen történő tárolásról az Eht. 155. § (4) bekezdése rendelkezik. A NAIH gyakorlata szerint a **feltétlenül szükséges** tároláshoz, például a bejelentkezéshez, a felhasználó által kért beállításhoz és a felhasználó által bevitt tartalomhoz nem kell hozzájárulás, elég a tájékoztatás. A NAIH ebben a 29. cikk szerinti munkacsoport 4/2012. számú véleményét tekinti irányadónak. A fenti tárolások ezt a célt szolgálják: nélkülük az általad kért szolgáltatás nem működik. A tárolt adatokat a böngésződ beállításaiban bármikor törölheted. Ilyenkor a névtelen fiókod elvész a készülékről, a Google-lal mentett fiókodba viszont újra be tudsz lépni.

## 8. Automatizált döntéshozatal

Az ítélet **automatikusan**, emberi közreműködés nélkül születik. **Kizárólag automatizált döntésnek viszont nem minősül a GDPR 22. cikke szerint.** Rád nézve nem vált ki joghatást, és hasonlóan jelentős hatással sem jár: semmit nem tilt le, nem utasít el és nem jelent be. Csak egy figyelmeztető becslést mutat, és a döntés a tiéd marad.

Átláthatósági okból elmondjuk, milyen logika szerint születik az ítélet:

- A mesterséges intelligencia csak kiolvassa a jeleket.
- A szabályalapú program a jeleket pontozza. Ilyen jel például, ha az üzenet kódot vagy pénzt kér, sürget, vagy a link nem a szervezet hivatalos oldalára mutat.
- A program kemény szabályokat is alkalmaz: bizonyos jelek önmagukban PIROS ítéletet adnak.
- A pontszám alapján: 0–24 pont SZÜRKE, 25–39 pont SÁRGA, 40 ponttól PIROS.
- Az eredménynél megmutatjuk, milyen jelek alapján döntöttünk.

**Példa arra, mi változtat az eredményen** (tegyük fel, hogy más jel nincs az üzenetben):
- Az üzenet határidőt szab (10 pont), linkre kattintásra kér (10 pont), és a link a szervezet hivatalos oldalára mutat: 20 pont, **SZÜRKE**.
- Ugyanez, de a link egy listánkon nem szereplő oldalra visz (5 pont): 25 pont, **SÁRGA**.
- Ha a link rövidített cím (15 pont az 5 helyett): 35 pont, **SÁRGA**.
- Ha az üzenet emellett pénzátutalást is kér (30 pont): 65 pont, **PIROS**.
- Ha az üzenet jelszót, kártyaadatot vagy egy kapott kód továbbadását kéri, vagy a link egy ismert szervezet hivatalos címét utánozza, az kemény szabály: pontszámtól függetlenül **PIROS**.
- Ha az üzenet minden linkje a szervezet hivatalos oldalára mutat, az ítélet legfeljebb **SÁRGA** lehet. Kemény szabály esetén ez a korlát nem érvényes.
- Ha a képernyőkép nehezen olvasható, az ítélet legalább **SÁRGA**.

**Profilalkotást nem végzünk.** A napi számláló (`red_count`) csak összesített darabszám, nem értékelünk vele téged.

## 9. Korhatár

A Szolgáltatást **16 éves kortól** veheted igénybe. 16 év alatt csak a szülőd (törvényes képviselőd) hozzájárulásával. A korhatárt mi határoztuk meg. A kiskorúak szerződéskötésére a Ptk. 2:10–2:14. §-a az irányadó. Adatkezelésünk nem hozzájáruláson alapul, ezért a GDPR 8. cikke nem alkalmazandó rá. Ha tudomásunkra jut, hogy 16 év alatti személy a szülője hozzájárulása nélkül mentett fiókot vagy családot hozott létre, a fiókját és a hozzá tartozó adatokat töröljük.

## 10. Milyen jogaid vannak?

### 10.1. Tiltakozási jog

> **Bármikor tiltakozhatsz** az ellen, hogy jogos érdek alapján kezeljük az adataidat (GDPR 21. cikk). Ide tartozik az IP-címed hash-e az óránkénti korláthoz, a névtelen fiókodhoz tartozó napi számláló, az üzemeltetési naplók, és a rólad szóló adat egy más által beküldött üzenetben. Írj a **patrik@sidekickautomations.hu** címre. Tiltakozásod után az adatot csak akkor kezeljük tovább, ha bizonyítjuk, hogy olyan kényszerítő erejű jogos ok indokolja, amely elsőbbséget élvez az érdekeiddel, jogaiddal és szabadságaiddal szemben, vagy jogi igény érvényesítéséhez kell.

### 10.2. További jogaid

| Jog | Mit jelent |
|---|---|
| **Hozzáférés** (GDPR 15. cikk) | Megkérdezheted, kezelünk-e rólad adatot, és ha igen, milyet, miért, meddig. Kérheted az adataid másolatát is. |
| **Helyesbítés** (16. cikk) | Kérheted a pontatlan adat javítását. |
| **Törlés** (17. cikk) | Kérheted az adataid törlését, például a fiókod, a családod vagy a riasztások törlését. |
| **Korlátozás** (18. cikk) | Kérheted, hogy egy ideig csak tároljuk az adatot, de ne használjuk. Ilyen eset például, amíg egy vitát tisztázunk. |
| **Értesítés** (19. cikk) | Ha helyesbítünk, törlünk vagy korlátozunk, erről értesítjük azokat, akiknek az adatot továbbítottuk, és kérésedre megmondjuk, kik ők. |
| **Adathordozhatóság** (20. cikk) | A szerződés alapján kezelt, általad megadott adataidat géppel olvasható formában kikérheted. |
| **Tiltakozás** (21. cikk) | Lásd a [10.1. pontot](#101-tiltakozási-jog). |
| **Automatizált döntés** (22. cikk) | Jogod van arra, hogy ne kizárólag automatizált döntés alapján hozzanak rólad joghatással járó döntést. Ilyen döntést nem hozunk ([8. fejezet](#8-automatizált-döntéshozatal)). |

**Hogyan élhetsz a jogaiddal?** Írj a **patrik@sidekickautomations.hu** címre. **Egy hónapon belül** válaszolunk (GDPR 12. cikk (3) bekezdés). Ha a kérelem bonyolult, vagy sok kérelem érkezik, ez további két hónappal meghosszabbodhat. Ilyenkor az első hónapon belül jelezzük a késést és az okát. A válasz **ingyenes**.

**Azonosítás.** A névtelen fiókhoz nem tartozik név vagy e-mail-cím, ezért névtelen fióknál csak úgy tudjuk megtalálni az adataidat, ha a kérelemben megadod a fiókazonosítót. Mentett fióknál a Google-fiókod e-mail-címe elég. Ha nem tudunk azonosítani, ezt megírjuk (GDPR 11. cikk (2) bekezdés, 12. cikk (2) és (6) bekezdés). **A beküldött üzenetekről nem tudunk adatot kiadni, mert egyiket sem tároljuk.**

## 11. Jogorvoslat

Ha úgy érzed, hogy megsértettük az adatvédelmi jogaidat, először írj nekünk, hátha gyorsan rendezni tudjuk. Ezen kívül:

**Panaszt tehetsz az adatvédelmi hatóságnál** (GDPR 77. cikk, Infotv. 52. §):

| | |
|---|---|
| Név | Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH) |
| Cím | 1055 Budapest, Falk Miksa utca 9–11. |
| Postacím | 1363 Budapest, Pf. 9. |
| E-mail | ugyfelszolgalat@naih.hu |
| Telefon | +36 1 391 1400 |
| Web | https://naih.hu (online ügyindítás: https://naih.hu/online-ugyinditas) |

**Bírósághoz is fordulhatsz** (GDPR 79. cikk, Infotv. 23. §). A pert választásod szerint a lakóhelyed vagy tartózkodási helyed szerint illetékes **törvényszék** előtt is megindíthatod. A bíróságok elérhetősége: https://birosag.hu.

## 12. Érdekmérlegelés (összefoglaló)

Ahol a jogalap a jogos érdek (GDPR 6. cikk (1) bekezdés f) pont), háromlépcsős érdekmérlegelést végeztünk. Ennek összefoglalója:

| Adatkezelés | 1. Jogos érdek | 2. Szükségesség | 3. Mérlegelés |
|---|---|---|---|
| Harmadik személyek adatai a beküldött üzenetben (4.1–4.2.) | Csalás elleni védekezés: a felhasználóé (ne károsodjon) és az Üzemeltetőé (a Szolgáltatás nyújtása) | Az ellenőrzéshez a teljes üzenetet látni kell. A feladó száma és a link maga a legfontosabb jel. | A feldolgozás másodpercekig tart, nem tároljuk, nem azonosítjuk az érintettet, és nem hozunk róla döntést. A csaló feladónak nincs méltányolható érdeke abban, hogy üzenetét ne vizsgálják meg. **Az érdek elsőbbséget élvez.** |
| IP-hash az óránkénti korláthoz (4.3.) | Visszaélés és tömeges automatizált használat megelőzése, a költségek kordában tartása | Fiók nélkül ez az egyetlen megbízható korlát. Maga az IP-cím nem kerül tárolásra, csak a hash-e, órás bontásban. | Rövid megőrzés, hash-elt forma, csak darabszám, más célra nem használjuk. A korlát a normál használatot nem érinti. **Az érdek elsőbbséget élvez.** |
| Napi korlát a névtelen fiókhoz (4.4.) | Ugyanaz, mint fent, felhasználónként | Az IP-korlát egy közös hálózatból (például egy idősotthon wifijéről) túl szigorú lenne, a felhasználónkénti korlát méltányosabb. | Névtelen azonosító, csak darabszám. Személyazonosság nincs hozzárendelve. **Az érdek elsőbbséget élvez.** |
| Üzemeltetési naplók (4.7.) | A Szolgáltatás biztonságos, hibamentes működtetése | Tárhelyszolgáltatás naplózás nélkül nem működtethető biztonságosan | Rövid (1–7 napos) megőrzés, a naplókat a mi kódunk nem egészíti ki tartalommal. **Az érdek elsőbbséget élvez.** |

Az érdekmérlegelésről kérésedre további tájékoztatást adunk.

## 13. Adatbiztonság

- Az adatforgalom titkosított (HTTPS).
- Az adatbázis-táblákat sorszintű hozzáférés-szabályozás védi. Egy felhasználó csak a saját napi számlálóját, egy családtag csak a saját családja adatait láthatja. Az IP-hash táblához csak a szerver fér hozzá.
- A beküldött tartalmat nem tároljuk. Egy automatikus ellenőrzés (`check:privacy`) minden kódváltozásnál vizsgálja, hogy a kód nem ír-e tartalmat naplóba vagy fájlba.
- A szerverkulcsok csak a szerveren érhetők el, a böngészőbe nem kerülnek.
- Adatvédelmi incidens esetén a GDPR 33–34. cikke szerint járunk el: az incidenst nyilvántartjuk, szükség esetén 72 órán belül bejelentjük a NAIH-nak, és ha magas kockázattal jár rád nézve, téged is értesítünk.

## 14. Kötelező-e megadni az adatokat?

Adatot megadni **nem kötelező**, és jogszabály sem írja elő. Ha viszont nem küldesz be üzenetet, nem tudjuk ellenőrizni. IP-cím nélkül pedig technikailag nem működik az internetes kapcsolat. A Google-fiók összekötése és a családi funkció teljesen önkéntes, nélkülük is ellenőrizhetsz.

## 15. A tájékoztató módosítása

Ha a Szolgáltatás adatkezelése megváltozik (például új funkció vagy új szolgáltató), ezt a tájékoztatót frissítjük, és a változásról a Szolgáltatásban tájékoztatunk, mielőtt az új adatkezelés elindul. A korábbi változatokat kérésre megküldjük.

**Kapcsolódó dokumentumok:** [Felhasználási feltételek](felhasznalasi-feltetelek.md) · [Jogi nyilatkozat](jogi-nyilatkozat.md) · [Impresszum](impresszum.md)
