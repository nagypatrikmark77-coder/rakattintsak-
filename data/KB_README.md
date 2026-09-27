# Rákattintsak? – tudásbázis (2026-09-27)

Másold be a repóba: `data/` alá a három JSON-t, `tests/fixtures/` alá a fixture-t.

| Fájl | Mire való |
|---|---|
| `official_entities.json` | 20 szervezet: hivatalos domainek, linkszabály, hivatalos SMS-feladó, 0-24 számok, forrásokkal |
| `scam_patterns.json` | Csalás-narratívák, magyar kulcsszó-regex tartalék, 8 új ítélet-jel |
| `damage_control.json` | "Már rákattintottam" döntési fa, bank -> rendőrség -> áldozatsegítés sorrend |
| `fixtures/reconstructed.json` | 25 teszt (19 csaló, 6 valódi), nyilvános figyelmeztetésekből sajat szavakkal |

## Szabály a listához
- Whitelistbe csak `verified: true` domain kerül.
- Hiányzó hivatalos domain = legfeljebb sárga (biztonságos hiba). Hibásan felvett domain = csalót engedünk át (veszélyes hiba).
- Telefonszám csak `verified: true` bejegyzésből jelenhet meg a UI-ban.

## Amit Patriknak kézzel kell ellenőrizni (verified: false)
Raiffeisen, CIB, Revolut, One, Ügyfélkapu+ / magyarorszag.hu, NEAK. Plusz: a Magyar Posta SMS-feladó száma 2022-es forrásból van.

## Új szabályok Claude Code-nak (a brief kiegészítése)
1. **Kemény piros:** `sms_link_policy == "never"` (NAV, NÚSZ, MVM Next, MBH, Rendőrség) és van BÁRMILYEN link, hivatalos domain is.
2. **Kemény piros:** `path_restricted` (Posta) és a link nem a megengedett útvonal.
3. **Kemény piros:** a kérés metszi a szervezet `never_asks` listáját (Foxpost, GLS, DPD soha nem kér kártyaadatot).
4. **Kemény piros:** `ertesites@tarhely.gov.hu` feladó + csatolmány.
5. **Pont:** `whatsapp_redirect` 25 (wa.me link). Kombó kemény piros: családtag + új szám + wa.me.
6. **Pont:** `secrecy_request` 30 ("ne szóljon a bankjának").
7. **Pont:** `foreign_sender_for_hu_entity` 30 (nem +36 feladó magyar szervezet nevében).
8. **Pont:** `sender_number_mismatch` 30 (pl. DPD csak +36 70 717 7702-ről küld).

## Regex-tartalék buktatói
- **Tagadás:** "a kódot ne adja meg senkinek" nem kódkérés. A találat előtti 3 szóban "ne", "soha", "sose" -> a találat nem számít.
- **Családi szavak önmagukban nem pontoznak:** "Szia Mama" csak akkor ér pontot, ha mellette új szám, pénzkérés vagy wa.me link is van. Különben a nagyi minden unokai üzenete sárga lesz.
- A `known_scam_domains_examples` NEM feketelista, csak fixture: a hasonmás-felismerésnek kell elkapnia őket.
