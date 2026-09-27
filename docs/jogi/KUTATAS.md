# Mélykutatás a jogi dokumentumokhoz

**Rákattintsak?** · 2026. szeptember 27. · Minden forrás letöltve: 2026-09-27

**Módszer:** négy párhuzamos kutatás készült. Mindegyik keresőben kereste meg a forrásokat, és az első találatokat nyitotta meg: összesen 150-nél több forrást, ahol lehetett, hivatalos, elsődleges forrásból. A jogszabályszövegek a Nemzeti Jogszabálytárból és a Jogtárból származnak. Az EUR-Lex a letöltőknek nem adott tartalmat, ezért a GDPR magyar szövegét a Jogtárból idézzük. Ahol mérni lehetett, mértünk: HTTP-fejlécek, a Supabase-séma és a böngésző hangjai. **Ez nem jogi tanácsadás, hanem tényfeltárás.** Élesítés előtt ügyvédi vagy adatvédelmi szakértői átnézés javasolt.

Rövidítések: **A** = GDPR és NAIH, **B** = adatfeldolgozók, **C** = ÁSZF és fogyasztóvédelem, **D** = MI-rendelet, DSA, helyi tárolás.

---

## 1. Legfontosabb megállapítások (és hova kerültek)

| # | Megállapítás | Forrás | Hova került |
|---|---|---|---|
| 1 | Az EGT-beli ügyféllel az **Anthropic Ireland, Limited** szerződik. Az adatfeldolgozási feltételek (DPA) automatikusan a szerződés részei, és általános adatvédelmi kikötéseket (SCC, Module 2/3) tartalmaznak. | B | Adatkezelési tájékoztató 5–6. |
| 2 | Az Anthropic **nincs** az EU–USA Adatvédelmi Keretrendszer (DPF) listáján. Mérve: sem az aktív, sem az inaktív résztvevők között nem szerepel. A továbbítás alapja tehát az SCC. | A, B | Adatkezelési tájékoztató 6. |
| 3 | Az Anthropic API-n beküldött be- és kimenetet **30 napon belül törli**. Ha egy tartalmat szabálysértőnek jelöl meg, azt legfeljebb 2 évig, a biztonsági pontszámot legfeljebb 7 évig őrzi. Az API-adaton **nem tanít** modellt. (Egy platformoldal szerint alapból nincs megőrzés, a két hivatalos oldal nem egyezik. A konzervatív 30 nap került be.) | B | Adatkezelési tájékoztató 4.1, 5. |
| 4 | Az Anthropicnál a nyugvó adat és a képfeldolgozás csak az USA-ban lehet. EU-s feldolgozási régió 2026-ban nincs, a Haiku 4.5-nél nem is állítható. | B | Adatkezelési tájékoztató 5. |
| 5 | A Vercel Inc. **DPF-tanúsított** (mérve). DPA-t **csak Pro és Enterprise terven** ad. A Hobby terv csak nem kereskedelmi használatra való. A kérésnapló tartalmazza a látogató IP-címét. Megőrzés: Hobby 1 óra, Pro 1 nap. **A projekt csapatának csomagja Pro** (a Vercel API-ján ellenőrizve). | B | Adatkezelési tájékoztató 4.7, 5–6. |
| 6 | A szerverfunkció mérve az **USA-ban (iad1, Washington)** fut, ez a Vercel alapértelmezése. | B | Adatkezelési tájékoztató 5. |
| 7 | A Supabase-szel a **Supabase Pte. Ltd. (Szingapúr)** szerződik. A DPA automatikus és SCC-t tartalmaz. DPF nincs. A projekt régiója `eu-west-1` (Írország), a szervezet terve Pro (mérve). Az auth-munkamenet IP-t és böngészőazonosítót tárol, az auditnapló IP-t. A naplók 7 napig maradnak meg Pro terven. Anonim fiókokat a Supabase nem töröl automatikusan. | B | Adatkezelési tájékoztató 4.4, 5–6. |
| 8 | A Google-bejelentkezésnél a Google Ireland Limited **önálló adatkezelő**. Név, e-mail-cím, profilkép és azonosító érkezik tőle. | B | Adatkezelési tájékoztató 4.5 |
| 9 | Asztali Chrome-on (macOS) az egyetlen magyar hang helyi hang, nem hálózati (mérve). Androidon, Edge-ben és iOS-en nem mértük. | B | Adatkezelési tájékoztató 5. (felolvasás) |
| 10 | A GDPR 8. cikke csak hozzájárulás-alapú adatkezelésre vonatkozik. Magyarország nem tért el a 16 évtől, és **az Infotv.-ben nincs 16 éves szabály**. Szerződéses jogalapnál a Ptk. 2:10–2:14. §-a az irányadó. | A | Adatkezelési tájékoztató 9.; ÁSZF |
| 11 | Az Infotv. 23. § (3) szerint a per a lakóhely vagy tartózkodási hely szerinti törvényszék előtt **is** indítható. A régi „a törvényszék hatáskörébe tartozik” mondat kikerült a törvényből. | A | Adatkezelési tájékoztató 11. |
| 12 | A NAIH címe ellenőrizve aktuális: 1055 Budapest, Falk Miksa utca 9–11.; Pf. 9, 1363. | A | Adatkezelési tájékoztató 11. |
| 13 | Jogos érdeknél célonként kell érdekmérlegelni. A tájékoztatónak a szempontokat és az eredményt is közölnie kell (NAIH/2020/1154/9), és jeleznie kell, hogy kérésre további információ jár (EDPB 1/2024, 68. pont). | A | Adatkezelési tájékoztató 12. |
| 14 | A tiltakozási jogot **minden más információtól elkülönítve** kell megjeleníteni (GDPR 21. cikk (4)). | A | Adatkezelési tájékoztató 10.1 |
| 15 | Az üzenetben szereplő harmadik személyek adatára a **14. cikk (5) b)** kivétel alkalmazható, de dokumentált mérlegeléssel és nyilvános tájékoztatással (WP260, 60–62. pont, a kórházi hozzátartozós példa). | A | Adatkezelési tájékoztató 4.9 |
| 16 | Különleges adat: a szándék hiánya nem ment fel a 9. cikk alól (EUB C-252/21). Kell a „ne küldj be” figyelmeztetés és a tárolás nélküli kezelés. A 9. cikk (2) szerinti jogalap **nyitott jogi kérdés**. | A | Adatkezelési tájékoztató 4.1; README |
| 17 | Az ítélet valószínűleg nem a 22. cikk szerinti döntés. A logika leírása mégis jó gyakorlat (WP251), és példával kell megmutatni, mi változtat az eredményen (EUB C-203/22). | A | Adatkezelési tájékoztató 8. |
| 18 | A sózott IP-hash a Kft.-nél **személyes adat** (álnevesített), mert a só nála van (GDPR (26) preambulumbekezdés, EDPB 01/2025). Kiszivárgott só esetén a teljes IPv4-tér (2³² cím) másodpercek alatt végigpróbálható, ezért a só titkossága a védelem alapja. | A | Adatkezelési tájékoztató 4.3; README |
| 19 | A DPF-határozat ((EU) 2023/1795) formálisan hatályos. A T-553/23 Latombe-keresetet elutasították, a C-703/25 P fellebbezés folyamatban van. A Trump v. Slaughter ítélet után az EDPB felülvizsgálatot kért. **Stabil, de bizonytalan.** | A | Adatkezelési tájékoztató 6. (a Vercelnél SCC-tartalék is van) |
| 20 | Az **MI-rendelet 50. cikk (1)** 2026. augusztus 2. óta alkalmazandó. A Digital Omnibus ((EU) 2026/1744) csak az 50. cikk (2) gépi jelölésének adott haladékot. A Kft. **szolgáltatónak** minősül (Bizottsági iránymutatás (11) pont). Egy idős célközönségnél az „egyértelmű, hogy MI” kivételre nem lehet építeni ((45) pont). | D | Jogi nyilatkozat; **README: a felületi MI-tájékoztatás kötelező** |
| 21 | Az MI-tájékoztatás **csak az ÁSZF-ben nem elég**, a beviteli mező mellett kell lennie ((37)–(38) pont). A „választ MI generálja” mondat nálunk nem igaz, mert szabályok és sablonok adják a választ. | D | Jogi nyilatkozat; README |
| 22 | A magyar MI-hatóság az **MI Piacfelügyeleti Hatóság** (Mesterséges Intelligencia Hivatal, Tudományos és Technológiai Minisztérium), nem az NMHH. | D | Jogi nyilatkozat |
| 23 | DSA: maga az ellenőrzés valószínűleg nem közvetítő szolgáltatás (saját mérlegelés). A családi riasztás szürke zóna. A 11., 12. és 14. cikk szerinti elemek olcsón beírhatók. | D | ÁSZF |
| 24 | Az Eht. 155. § (4) szövegében **nincs** „feltétlenül szükséges” kivétel. A NAIH a WP29 4/2012. számú véleményét alkalmazza. Hozzájárulás nem kell, **de első látogatáskor egyszeri, rövid tájékoztatás kell** (NAIH/2017/1060/V). A localStorage és a Cache API is tárolásnak számít (EDPB 2/2023). | D | Adatkezelési tájékoztató 7.; README |
| 25 | A WP29 szerint a **tartós bejelentkezés nem esik a kivétel alá**. A kód szerint a főoldalon a munkamenet az első ellenőrzéskor jön létre, ami rendben van. A Családi védőháló oldal viszont már megnyitáskor létrehozza. | D, kód | **README D1** |
| 26 | Ingyenes szolgáltatásnál a **Ptk. 6:147. §** az irányadó. A téves ítéletből eredő kárért szándékosság esetén, vagy akkor van felelősség, ha nem tájékoztattunk egy lényeges tulajdonságról. A „SZÜRKE ≠ biztonságos” mondat maga ez a tájékoztatás. | C | ÁSZF, Jogi nyilatkozat |
| 27 | A felelősségkorlátozás **szokatlan kikötés**: külön figyelemfelhívás és kifejezett elfogadás kell hozzá (Ptk. 6:78. § (2), BH 2025.1.17). A 6:152. § és a 6:104. § (1) h) korlátai abszolútak. | C | ÁSZF; README |
| 28 | Panaszkezelés az Fgytv. 17/A. § szerint: 30 napon belül érdemi válasz, a panaszt és a választ 3 évig meg kell őrizni. A békéltető testület a fogyasztó lakóhelye szerinti. A Hajdú-Bihar Vármegyei Békéltető Testület címe 4025 Debrecen, Vörösmarty u. 13–15. | C | ÁSZF; Adatkezelési tájékoztató 4.8 |
| 29 | Az EU online vitarendezési (ODR) platform **2025. július 20-án megszűnt**, nem kell rá hivatkozni. | C | ÁSZF |
| 30 | Az impresszumba az Ekertv. 4. § szerint a **tárhelyszolgáltató** adatai is kellenek. | B, C | Impresszum |
| 31 | Akadálymentesítési nyilatkozat csak közszférabeli szervezetnek kötelező. A 2022. évi XVII. törvény erre a szolgáltatásra nem vonatkozik. | D | nem került dokumentumba |

---

## 2. Források témakörönként

### 2.1. Jogszabályok (hatályos szöveg)

- GDPR, magyar szöveg: https://net.jogtar.hu/jogszabaly?docid=a1600679.eup
- Infotv. (2011. évi CXII.): https://net.jogtar.hu/jogszabaly?docid=a1100112.tv
- Ptk. (2013. évi V.): https://net.jogtar.hu/jogszabaly?docid=a1300005.tv
- Pp. (2016. évi CXXX.): https://net.jogtar.hu/jogszabaly?docid=a1600130.tv
- Ekertv. (2001. évi CVIII.): https://net.jogtar.hu/jogszabaly?docid=a0100108.tv
- Eht. (2003. évi C.): https://net.jogtar.hu/jogszabaly?docid=a0300100.tv
- Iszt. (2023. évi CIV., DSA-végrehajtás): https://net.jogtar.hu/jogszabaly?docid=a2300104.tv
- Akadálymentességi törvény (2022. évi XVII.): https://net.jogtar.hu/jogszabaly?docid=a2200017.tv
- 326/2024. Korm. rendelet (fogyasztóvédelmi hatóság): https://net.jogtar.hu/jogszabaly?docid=a2400326.kor
- 2025. évi LXXV. törvény (MI-végrehajtás): https://njt.jog.gov.hu/jogszabaly/2025-75-00-00
- 344/2025. Korm. rendelet (MI-hatóságok): https://njt.jog.gov.hu/jogszabaly/2025-344-20-22

### 2.2. Uniós iránymutatások, hatósági anyagok, ítéletek

- WP260 rev.01, átláthatóság (az Európai Bizottság hivatalos oldala; a kutatás a szöveget egy tükörmásolatból olvasta): https://ec.europa.eu/newsroom/article29/items/622227/en
- WP251, automatizált döntés (magyarul, NAIH): https://www.naih.hu/files/wp251rev01_hu.pdf
- EDPB 2/2019, 6. cikk (1) b): https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines-art_6-1-b-adopted_after_public_consultation_en.pdf
- EDPB 1/2024, jogos érdek: https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202401_legitimateinterest_en.pdf
- EDPB 01/2025, álnevesítés: https://www.edpb.europa.eu/system/files/2025-01/edpb_guidelines_202501_pseudonymisation_en.pdf
- EDPB 2/2023 v2, az ePrivacy 5. cikk (3) technikai hatálya: https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf
- EDPB ChatGPT Taskforce-jelentés: https://www.edpb.europa.eu/system/files/2024-05/edpb_20240523_report_chatgpt_taskforce_en.pdf
- WP29 4/2012. számú vélemény (WP194), süti-kivételek: https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf
- NAIH/2020/1154/9, érdekmérlegelés: https://naih.hu/files/NAIH-2020-1154-9-hatarozat.pdf
- NAIH webáruház-tájékoztató (2017), sütik: https://naih.hu/files/2017-02-17-webaruhaz-tajekoztato-NAIH-2017-1060-V.pdf
- NAIH elérhetőségek: https://www.naih.hu/ugyfelszolgalat-kapcsolat
- NAIH, harmadik országba továbbítás: https://www.naih.hu/harmadik-orszagba-vagy-nemzetkozi-szervezethez-torteno-adattovabbitas-gdpr-v-fejezet
- EUB C-203/22 (Dun & Bradstreet), sajtóközlemény: https://curia.europa.eu/site/upload/docs/application/pdf/2025-02/cp250022en.pdf
- EUB C-154/21 (Österreichische Post), sajtóközlemény: https://curia.europa.eu/site/upload/docs/application/pdf/2023-01/cp230004en.pdf
- Törvényszék T-553/23 (Latombe), sajtóközlemény: https://curia.europa.eu/site/upload/docs/application/pdf/2025-09/cp250106en.pdf
- DPF a Trump v. Slaughter után (activeMind): https://www.activemind.legal/guides/dpf-supreme-court/
- MI-rendelet 50. cikk (AI Act Service Desk): https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50
- Bizottsági iránymutatás az 50. cikkről (C(2026) 5054): https://ai-act-service-desk.ec.europa.eu/sites/default/files/2026-07/guidelines_on_the_implementation_of_the_transparency_obligations_for_certain_ai_systems_under_article_50_of_the_ai_act_bzptwqhk0ikg1dtlddap41psfy_131215.pdf
- Bizottsági GYIK, 50. cikk: https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- MI-rendelet, III. melléklet: https://artificialintelligenceact.eu/annex/3/
- Digital Omnibus az MI-rendeletről: https://artificialintelligenceact.eu/ai-act-explorer/digital-omnibus/
- MI Piacfelügyeleti Hatóság: https://mihivatal.gov.hu/rolunk
- DSA 3. cikk: https://www.eu-digital-services-act.com/Digital_Services_Act_Article_3.html
- DSA 14. cikk: https://www.eu-digital-services-act.com/Digital_Services_Act_Article_14.html
- NMHH, közvetítő szolgáltatók: https://nmhh.hu/szakmai-erdekeltek/kozvetito-szolgaltatok-felugyelete

### 2.3. Szolgáltatók (adatfeldolgozók)

- Anthropic, kereskedelmi feltételek: https://www.anthropic.com/legal/commercial-terms
- Anthropic, adatfeldolgozási feltételek: https://www.anthropic.com/legal/data-processing-addendum
- Anthropic, adatvédelmi szabályzat: https://www.anthropic.com/legal/privacy
- Anthropic, megőrzési idő: https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- Anthropic, API és adatmegőrzés: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- Anthropic, adatrezidencia: https://platform.claude.com/docs/en/manage-claude/data-residency
- Anthropic, felhasználási szabályzat: https://www.anthropic.com/legal/aup
- DPF-résztvevők listája: https://www.dataprivacyframework.gov/list
- Vercel, adatfeldolgozási feltételek: https://vercel.com/legal/dpa
- Vercel, adatvédelmi tájékoztató: https://vercel.com/legal/privacy-notice
- Vercel, felhasználási feltételek: https://vercel.com/legal/terms
- Vercel, futásidejű naplók: https://vercel.com/docs/logs/runtime
- Vercel, függvényrégiók: https://vercel.com/docs/functions/configuring-functions/region
- Supabase, adatfeldolgozási feltételek: https://supabase.com/legal/dpa
- Supabase, felhasználási feltételek: https://supabase.com/terms
- Supabase, adatvédelmi szabályzat: https://supabase.com/privacy
- Supabase, díjszabás és naplómegőrzés: https://supabase.com/pricing
- Supabase, anonim bejelentkezés: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase, munkamenetek: https://supabase.com/docs/guides/auth/sessions
- Supabase, auditnapló: https://supabase.com/docs/guides/auth/audit-logs
- Supabase, GDPR: https://supabase.com/docs/guides/security/gdpr-compliance
- Google, adatvédelmi irányelvek: https://policies.google.com/privacy?hl=en
- MDN, `SpeechSynthesisVoice.localService`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

### 2.4. Magyar minták és szakirodalom

- Számlázz.hu adatkezelési tájékoztató (szerkezeti minta): https://www.szamlazz.hu/adatvedelem
- NAV-Mobil adatkezelési tájékoztató: https://nav.gov.hu/kozadat/altalanos_kozzeteteli_lista/nav_nyilvantartasai/nav-mobil-adatkezelesi-tajekoztato
- Jogászvilág, átlátható MI-rendszerek: https://jogaszvilag.hu/a-jovo-jogasza/atlathato-mi-rendszerek-a-mesterseges-intelligencia-alkalmazasara-vonatkozo-tajekoztatas-kovetelmenyei/
- Google Gemini, magyar súgó (MI-figyelmeztetés mintája): https://support.google.com/gemini/answer/13594961?hl=hu
- FormaZona, AI-chat adatkezelés (minta): https://formazona.hu/ai-chat-adatvedelem/
- Adatvédelmi ügyvéd, érdekmérlegelés: https://adatvedelmiugyved.hu/a-jogos-erdek-es-az-erdekmerlegelesi-teszt.php

---

## 3. Mit nem sikerült ellenőrizni

- **Vercel Observability Plus:** be van-e kapcsolva. Ha igen, a naplók 30 napig maradnak meg. A csomag Pro, ez ellenőrizve.
- **Anthropic szerződő entitása a valóságban:** a Console számlázási országa, illetve a számlán szereplő eladó.
- **Supabase auth-táblák tényleges tartalma:** ki van-e töltve a `sessions.ip`, ír-e az auditnapló az adatbázisba, és milyen kulcsok vannak a Google `identity_data` mezőjében. A csak darabszámokat kérő lekérdezést a jogosultsági rendszer nem engedte lefuttatni, ezt Patriknak kell engedélyeznie vagy lefuttatnia.
- **Felolvasás** Androidon, Edge-ben és iOS-en.
- **A 9. cikk (2) szerinti jogalap** véletlenül beküldött különleges adatnál (jogászi kérdés).
- **A 2026. október 1-jétől hatályos jogszabályszövegek:** a lekért időállapotok szeptember 30-ig szólnak.
- **A többi 7 regionális békéltető testület** elérhetősége.
- **Az MI Piacfelügyeleti Hatóság postai címe:** két forrás két eltérő címet adott.
- **A SCHINDLER 97 Kft. mérete** (mikro- vagy kisvállalkozás). A DSA és a 2022. évi XVII. törvény mentességeinél számít.

A kutatási nyers jegyzetek (négy fájl, soronkénti forrásokkal) a munkamenet ideiglenes könyvtárában készültek. A fenti táblázat ezek kivonata.
