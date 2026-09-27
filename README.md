# Rákattintsak?

Magyar nyelvű PWA. Egy gyanús SMS, e-mail, link vagy képernyőkép beküldése után néhány másodperc alatt érthető, bizonyítékkal alátámasztott ítéletet ad (SZÜRKE / SÁRGA / PIROS), és megmondja, mit kell most tenni. Célcsoport: idősebbek és a családjuk.

Élesben: https://rakattintsak.vercel.app

## ⚠️ Patrik, ezt állítsd be

1. **Anthropic havi költségkeret.** Az Anthropic konzolban (Settings → Limits) állíts be havi keretet.
   - Egy ellenőrzés kb. 0,004–0,015 $.
   - A limit 20 ellenőrzés óránként és IP-címenként, valamint 30 naponta és felhasználónként. Egyetlen, a limitet végig kihasználó IP ennek ellenére 14 400 ellenőrzést futtathat havonta, ez akár kb. 60–200 $.
   - A keret az utolsó védvonal.
2. **Supabase Auth**, a „rakattintsak-” projekt Authentication menüjében:
   - Sign In / Providers: **Allow anonymous sign-ins** BE. Enélkül az ellenőrzés működik, de csak IP-limittel, és családi funkció nincs.
   - ugyanott: **Allow manual linking** BE (a „Fiók mentése Google-lal” gomb `linkIdentity`-t használ).
   - Google provider: be van kapcsolva.
   - URL Configuration: Site URL `https://rakattintsak.vercel.app`; Redirect URLs `https://rakattintsak.vercel.app/**`, `http://localhost:3000/**`.
3. **A `data/official_entities.json` ellenőrzése.** A `verified: false` sorok (Raiffeisen, CIB, Revolut, One, Ügyfélkapu+, NEAK) domainje nem számít hivatalosnak, amíg nem ellenőrzöd őket.

## Futtatás

```bash
npm install
npm run dev              # http://localhost:3000
npm test                 # unit tesztek (vitest)
npm run eval             # kiértékelés a tests/fixtures mintákon (kulccsal: Haiku, kulcs nélkül: stub)
npm run eval -- --target=https://rakattintsak.vercel.app   # éles mérés a telepített API ellen
npm run check:privacy    # kapu: nincs console-hívás és fájlírás az app/lib kódban
npm run test:db          # adatbázis-kapu: limitek, riasztás, RLS (ideiglenes tesztfelhasználókkal)
npm run build
```

## Környezeti változók

| Név | Hol | Mire |
|---|---|---|
| `ANTHROPIC_API_KEY` | szerver | a Haiku 4.5 kiolvasás |
| `NEXT_PUBLIC_SUPABASE_URL` | publikus | Supabase API. Helyben az anon kulcsból is származtatható |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publikus | Supabase anon kulcs. Helyben `SUPABASE_ANON_KEY` is jó |
| `SUPABASE_SERVICE_ROLE_KEY` | szerver | limitek, családok, riasztások írása |
| `RATE_LIMIT_SALT` | szerver | az IP-hash sója |

## Adatvédelem

- A beküldött szöveg és kép csak memóriában él. Nem kerül adatbázisba, logba vagy fájlba. Ezt a `check:privacy` kapu és egy éles „kanári” mérés is ellenőrzi.
- Tárolt adat:
  - `alerts`: család, márka, ítélet, idő.
  - `usage`: felhasználó, nap, darabszámok.
  - `rate_limits`: sózott IP-hash, legfeljebb 2 óráig.
  - `families` és `family_members`: családkód és tagság.
- Tartalom, idézet vagy link soha nem kerül tárolásra.

## Felépítés

- `lib/pipeline.ts`: kiolvasás → idézet-ellenőrzés → kulcsszó-tartalék → linkelemzés (+ redirect) → ítélet → válasz.
- `lib/extract.ts`: egyetlen Haiku-hívás, strict tool use. A modell nem ítél, csak kiolvas.
- `lib/verdict.ts`: tiszta ítéletmotor (kemény szabályok + pontok + korlátok).
- `lib/links.ts`, `lib/redirects.ts`: domainelemzés, hasonmás-felismerés, SSRF-biztos HEAD-követés.
- `data/`: tudásbázis (szervezetek, csalásminták, „Már rákattintottam” döntési fa).
- `supabase/migrations/`: séma, RLS, limit- és riasztásfüggvények.
- `DECISIONS.md`: minden döntés egy sorban.
