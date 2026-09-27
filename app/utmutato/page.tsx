import type { Metadata } from "next";
import Link from "next/link";
import { Icon, PageHeading } from "../ui";

export const metadata: Metadata = {
  title: "Használati útmutató – Rákattintsak?",
};

export default function GuidePage() {
  return (
    <main className="guide-page">
      <PageHeading
        eyebrow="SEGÍTSÉG A HASZNÁLATHOZ"
        title="Jó tudni, mielőtt kattintasz."
      >
        Így használd az ellenőrzést, és így értelmezd, amit találtunk.
      </PageHeading>
      <div className="stack">
        <section className="panel guide-section">
          <h2>
            <span className="section-icon">
              <Icon name="search" />
            </span>
            Hogyan ellenőrizz egy üzenetet?
          </h2>
          <ol className="guide-steps">
            <li>
              <span className="step-number">1</span>
              <div>
                <h3>Másold be a teljes üzenetet</h3>
                <p>
                  Használhatsz SMS-t, e-mailt vagy linket. A feladó és a teljes
                  szöveg is segíthet. Képernyőképet is feltölthetsz, akár a
                  szöveg mellé.
                </p>
              </div>
            </li>
            <li>
              <span className="step-number">2</span>
              <div>
                <h3>Nyomd meg az „Üzenet ellenőrzése” gombot</h3>
                <p>
                  Várd meg az eredményt. Ha a kép nem olvasható, készíts egy
                  élesebb képernyőképet, vagy másold be a szöveget.
                </p>
              </div>
            </li>
            <li>
              <span className="step-number">3</span>
              <div>
                <h3>Olvasd el az indoklást és a teendőket</h3>
                <p>
                  Az eredményben megmutatjuk a felismert jeleket, a javasolt
                  lépéseket és az ellenőrzés korlátait is.
                </p>
              </div>
            </li>
          </ol>
          <Link href="/" className="text-link mt-5">
            Üzenet ellenőrzése <Icon name="arrow" />
          </Link>
        </section>
        <section id="eredmenyek" className="panel guide-section">
          <h2>
            <span className="section-icon">
              <Icon name="help" />
            </span>
            Mit jelentenek a színek?
          </h2>
          <div className="verdict-explainer">
            <div className="verdict-red">
              <h3>Piros · Erős figyelmeztetés</h3>
              <p>
                Az ellenőrzés csalásra utaló jeleket talált. Olvasd el az
                indoklást, és kövesd a javasolt lépéseket.
              </p>
            </div>
            <div className="verdict-yellow">
              <h3>Sárga · Érdemes megállni</h3>
              <p>
                Gyanús jel vagy bizonytalanság merült fel. Az eredményben
                láthatod, mi indokolja az óvatosságot.
              </p>
            </div>
            <div className="verdict-gray">
              <h3>Szürke · Nincs egyértelmű jel</h3>
              <p>
                Nem találtunk elég jelet a figyelmeztetéshez. Ez önmagában nem
                igazolja, hogy az üzenet valódi.
              </p>
            </div>
          </div>
        </section>
        <section className="panel guide-section">
          <h2>
            <span className="section-icon">
              <Icon name="book" />
            </span>
            Gyakori kérdések
          </h2>
          <details className="faq-item">
            <summary>Szükségem van fiókra az ellenőrzéshez?</summary>
            <p>
              Az üzenetellenőrzéshez nem kell Google-fiókkal belépned. A családi
              védőhálóhoz az alkalmazásban mentened kell a fiókodat.
            </p>
          </details>
          <details className="faq-item">
            <summary>Mit lát a családom az üzeneteimből?</summary>
            <p>
              A családtag piros eredményű ellenőrzésekor a védőháló a szervezet
              nevét és az időpontot mutatja. A beküldött üzenet és kép nem
              jelenik meg a család számára. Az azonnali jelzéshez a figyelő
              családtagnál nyitva kell lennie a családi oldalnak.
            </p>
          </details>
          <details className="faq-item">
            <summary>Mire való a Nagyi mód?</summary>
            <p>
              Az eredményen bekapcsolva nagyobb betűkkel, egyszerűbb nézetben
              jelenik meg a legfontosabb üzenet. Ha a készülék magyar
              felolvasást támogat, a Felolvasás gomb is elérhető.
            </p>
          </details>
          <details className="faq-item">
            <summary>Mit tegyek, ha már rákattintottam?</summary>
            <p>
              A „Már rákattintottam” oldalon hat rövid kérdés után megmutatjuk a
              válaszaidhoz tartozó teendőket.
            </p>
            <Link href="/rakattintottam" className="text-link">
              Mutasd a kérdéseket <Icon name="arrow" />
            </Link>
          </details>
        </section>
      </div>
    </main>
  );
}
