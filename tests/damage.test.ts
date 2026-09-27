import { describe, expect, it } from "vitest";
import { bankContacts, selectSteps, telHref } from "@/lib/damage";
import { DAMAGE, ENTITIES } from "@/lib/kb";
import type { DamageControl, OfficialEntity } from "@/lib/types";

const QUESTION_IDS = DAMAGE.questions.map((q) => q.id);

// Minden kérdés "nem", kivéve a megadottakat.
function answers(yes: string[]): Record<string, boolean> {
  return Object.fromEntries(QUESTION_IDS.map((id) => [id, yes.includes(id)]));
}

function ids(yes: string[]): string[] {
  return selectSteps(answers(yes), DAMAGE).map((s) => s.id);
}

describe("selectSteps", () => {
  it("minden nem → csak nothing_given", () => {
    expect(ids([])).toEqual(["nothing_given"]);
  });

  it("kártyaadat → bank, rendőrség, áldozatsegítés (bank az első)", () => {
    expect(ids(["gave_card"])).toEqual(["bank_urgent", "police", "victim_support"]);
  });

  it("csak alkalmazás telepítése → app_installed, majd rendőrség", () => {
    expect(ids(["installed_app"])).toEqual(["app_installed", "police"]);
  });

  it("belépési adat + alkalmazás → bank_urgent az első az azonos prioritás ellenére", () => {
    expect(ids(["gave_login", "installed_app"])).toEqual([
      "bank_urgent",
      "app_installed",
      "change_login",
      "police",
      "victim_support",
    ]);
  });

  it("csak személyes adat → personal_data_only", () => {
    expect(ids(["gave_personal"])).toEqual(["personal_data_only"]);
  });

  it("a lépés objektumát is visszaadja", () => {
    const [first] = selectSteps(answers(["gave_card"]), DAMAGE);
    expect(first.step).toBe(DAMAGE.steps.bank_urgent);
  });

  it("bank_urgent akkor is első azonos prioritásnál, ha a JSON-ban később jön", () => {
    const dc: DamageControl = {
      questions: [{ id: "q", text: "?" }],
      steps: {
        other: { trigger_any: ["q"], priority: 1, title: "A", items: [] },
        bank_urgent: { trigger_any: ["q"], priority: 1, title: "B", items: [] },
        later: { trigger_any: ["q"], priority: 1, title: "C", items: [] },
      },
    };
    expect(selectSteps({ q: true }, dc).map((s) => s.id)).toEqual(["bank_urgent", "other", "later"]);
  });

  it("egyéb holtversenyben a JSON-kulcs sorrendje dönt", () => {
    const dc: DamageControl = {
      questions: [{ id: "q", text: "?" }],
      steps: {
        z_first: { trigger_any: ["q"], priority: 2, title: "A", items: [] },
        a_second: { trigger_any: ["q"], priority: 2, title: "B", items: [] },
        low: { trigger_any: ["q"], priority: 1, title: "C", items: [] },
      },
    };
    expect(selectSteps({ q: true }, dc).map((s) => s.id)).toEqual(["low", "z_first", "a_second"]);
  });

  it("trigger_none csak akkor teljesül, ha minden felsorolt kérdésre nem volt a válasz", () => {
    expect(selectSteps({}, DAMAGE)).toEqual([]);
    const partial = answers([]);
    delete partial.gave_personal;
    expect(selectSteps(partial, DAMAGE)).toEqual([]);
  });
});

describe("bankContacts", () => {
  it("csak az ellenőrzött bankok kártyaletiltó számai: OTP, K&H, MBH, Erste", () => {
    expect(bankContacts(ENTITIES)).toEqual([
      { name: "OTP Bank", label: "Kártyaletiltás, 0-24", number: "+36 1 366 6000" },
      { name: "K&H Bank", label: "Kártyaletiltás, 0-24, ingyenes", number: "+36 80 414 243" },
      { name: "MBH Bank", label: "Ügyfélszolgálat és kártyaletiltás, 0-24, ingyenes", number: "06 80 350 350" },
      { name: "Erste Bank", label: "Kártyaletiltás", number: "+36 1 302 5885" },
    ]);
  });

  it("soha nem ad Raiffeisen vagy CIB számot (nem ellenőrzött)", () => {
    const names = bankContacts(ENTITIES).map((c) => c.name);
    expect(names).not.toContain("Raiffeisen Bank");
    expect(names).not.toContain("CIB Bank");
  });

  it("kiszűri a nem ellenőrzött, a nem banki és a nem kártyaletiltó bejegyzéseket", () => {
    const base = ENTITIES.find((e) => e.id === "otp")!;
    const make = (over: Partial<OfficialEntity>): OfficialEntity => ({ ...base, ...over });
    const result = bankContacts([
      make({ name: "Nem ellenőrzött", verified: false, contacts: { card_block_24h: "+36 1 111 1111" } }),
      make({ name: "Nem bank", category: "telco", contacts: { card_block_24h: "+36 1 222 2222" } }),
      make({ name: "Nincs szám", contacts: undefined }),
      make({ name: "Ismeretlen kulcs", contacts: { general: "+36 1 333 3333", card_block_weekend: "+36 1 444 4444" } }),
    ]);
    expect(result).toEqual([{ name: "Ismeretlen kulcs", label: "Kártyaletiltás", number: "+36 1 444 4444" }]);
  });
});

describe("telHref", () => {
  it("megtartja a vezető +-t, a szóközöket elhagyja", () => {
    expect(telHref("+36 1 366 6000")).toBe("tel:+3613666000");
  });
  it("06-os számnál csak számjegyek", () => {
    expect(telHref("06 80 350 350")).toBe("tel:0680350350");
  });
  it("csak a vezető +-t tartja meg", () => {
    expect(telHref(" +36 (1) 302-5885 ")).toBe("tel:+3613025885");
  });
});
