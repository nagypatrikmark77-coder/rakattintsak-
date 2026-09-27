// A felhasználónak szóló összes előre megírt mondat. LLM-szöveg ide nem kerülhet.
// {szervezet}: az állított küldő (hasonmásnál az utánzott szervezet) neve a tudásbázisból. Mindig mondat elején áll.
import type { HardRule, ScoredKey, Verdict } from "./types";

export const HEADLINES: Record<Verdict, string> = {
  gray: "Nem találtunk erős csalásjelet",
  yellow: "Gyanús. Ne kattints, ellenőrizd a hivatalos oldalon.",
  red: "Nagy valószínűséggel csalás. Ne kattints rá.",
};

export const HARD_RULE_TEXT: Record<HardRule, string> = {
  brand_link_mismatch: "{szervezet} nevében ír, de a link nem a szervezet hivatalos oldalára mutat.",
  lookalike: "{szervezet} webcímét utánozza a link, de nem az övé.",
  sensitive_request: "Kártyaadatot, jelszót vagy kapott kódot kér. Bank vagy hivatal ilyet üzenetben nem kér.",
  family_money_combo: "Családtagnak adja ki magát, új számról ír, és pénzt kér. Ez a csalók ismert trükkje.",
  family_whatsapp_combo: "Családtagnak adja ki magát, új számról ír, és WhatsAppra hív. Ez a csalók ismert trükkje.",
  instructions_to_ai: "Az üzenetben rejtett szöveg próbálja becsapni ezt az ellenőrzést.",
  entity_link_policy_never:
    "{szervezet} saját közleménye szerint SMS-ben és e-mailben nem küld linket, ebben az üzenetben mégis van.",
  entity_path_restricted_violation:
    "{szervezet} SMS-ben csak egy megadott hivatalos oldalra küld linket, ez a link nem oda mutat.",
  entity_never_asks_violation: "{szervezet} saját közleménye szerint ilyet üzenetben nem kér, ez az üzenet mégis kéri.",
  unexpected_attachment_official_sender:
    "A hivatalos tárhely-értesítő nevében ír, de csatolmányt küld. Az igazi értesítőben soha nincs csatolmány.",
};

export const SIGNAL_TEXT: Record<ScoredKey, string> = {
  card_data: "Bankkártya-adatokat kér.",
  password: "Jelszót vagy belépési adatot kér.",
  share_code: "Azt kéri, hogy add meg vagy küldd el a kapott kódot.",
  money_transfer: "Pénzt vagy utalást kér.",
  app_install: "Azt kéri, hogy telepíts egy alkalmazást.",
  personal_data: "Személyes adatokat kér.",
  call_back: "Azt kéri, hogy hívj vissza egy számot.",
  click_link: "Azt kéri, hogy kattints a linkre.",
  small_fee: "Kis összegű díj kifizetését kéri.",
  prize: "Nyereményt vagy ajándékot ígér.",
  family_impersonation: "Családtagnak adja ki magát.",
  account_block_threat: "A számlád, kártyád vagy szolgáltatásod letiltásával fenyeget.",
  new_phone_number: "Azt írja, hogy új telefonszáma van.",
  deadline: "Siettet, nagyon rövid határidőt ad.",
  secrecy_request: "Azt kéri, hogy ne szólj róla senkinek.",
  punycode: "A link címében megtévesztő, hasonló kinézetű betűk vannak.",
  ip_or_at: "A link címe szokatlanul van felépítve, és elrejti, hová visz valójában.",
  risky_tld: "A link olyan címvégződésű oldalra visz, amelyet csalók gyakran használnak.",
  shortener: "Rövidített link, nem látszik, hová visz valójában.",
  unknown_domain: "A link olyan oldalra visz, amely nincs rajta az ismert hivatalos oldalak listáján.",
  whatsapp_redirect: "WhatsApp-beszélgetésre hív át.",
  foreign_sender_for_hu_entity: "{szervezet} nevében ír, de külföldi telefonszámról jött.",
  sender_number_mismatch: "{szervezet} nevében ír, de nem arról a számról jött, amelyről a szervezet SMS-t küld.",
};

export const ACTIONS: Record<Verdict, string[]> = {
  gray: [
    "Ha nem vártad az üzenetet, ne a linkre kattints: nyisd meg magad a hivatalos oldalt vagy alkalmazást.",
    "Üzenetből megnyitott oldalon ne adj meg kártyaadatot, jelszót vagy kódot.",
    "Ha bizonytalan vagy, kérdezz meg egy családtagot.",
  ],
  yellow: [
    "Ne kattints a linkre.",
    "Nyisd meg magad a szervezet hivatalos oldalát vagy alkalmazását, és ott nézd meg az ügyet.",
    "Ne adj meg adatot, és ne utalj pénzt.",
    "Ha bizonytalan vagy, kérdezz meg egy családtagot.",
  ],
  red: [
    "Ne kattints a linkre.",
    "Ne válaszolj, és ne hívd vissza a számot.",
    "Töröld az üzenetet.",
    "Ha már rákattintottál, nézd meg a „Már rákattintottam” oldalt.",
  ],
};

// „Megnéztük:” / „Nem néztük meg:” után álló tárgyak.
export const CHECKED_BASE: string[] = [
  "az üzenet szövegét, ismert csalási trükköket keresve",
  "hogy a linkek a megnevezett szervezet hivatalos oldalára mutatnak-e",
  "hogy a linkek címe utánoz-e ismert szervezetet",
];
export const CHECKED_REDIRECTS = "a linkek átirányításait";

export const NOT_CHECKED_BASE: string[] = [
  "a link mögötti oldal tartalmát",
  "hogy a küldő telefonszáma vagy e-mail-címe valódi-e",
  "hogy a szervezet valóban küldött-e neked üzenetet",
];
export const NOT_CHECKED_REDIRECT_FAILED = "nem sikerült követni, hová vezet ez a link: ";
export const NOT_CHECKED_UNCERTAIN_READ = "a képről nem sikerült minden linket egyértelműen kiolvasni";

// {szervezet} helyére, ha nincs ismert szervezet.
export const ENTITY_FALLBACK = "a megnevezett szervezet";
