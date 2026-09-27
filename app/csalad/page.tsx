import type { Metadata } from "next";
import Link from "next/link";
import FamilyView from "./family-view";
import { Icon, PageHeading } from "../ui";

export const metadata: Metadata = {
  title: "Családi védőháló – Rákattintsak?",
};

export default function Page() {
  return (
    <main>
      <PageHeading eyebrow="FIGYELJETEK EGYMÁSRA" title="Családi védőháló">
        Egy kis segítség a családtól, amikor egy üzenet gyanúsnak bizonyul.
      </PageHeading>
      <div className="content-grid">
        <FamilyView />
        <aside className="support-column">
          <section className="guide-card">
            <span className="section-icon">
              <Icon name="family" />
            </span>
            <h2>Így kapcsolódtok össze.</h2>
            <ol className="guide-steps">
              <li>
                <span className="step-number">1</span>
                <div>
                  <h3>Hozz létre egy családot</h3>
                  <p>Mentsd a fiókodat, majd kérj egy családkódot.</p>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div>
                  <h3>Add át a kódot</h3>
                  <p>
                    A családtagod a saját készülékén, ezen az oldalon tud
                    csatlakozni.
                  </p>
                </div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div>
                  <h3>Lásd, ha segítség kell</h3>
                  <p>
                    Piros eredménynél megjelenik a szervezet neve és az időpont.
                  </p>
                </div>
              </li>
            </ol>
            <Link href="/utmutato" className="text-link">
              További tudnivalók <Icon name="arrow" />
            </Link>
          </section>
          <div className="quiet-note">
            <Icon name="bell" />
            <p>
              Azonnali jelzés akkor érkezik, ha a figyelő családtagnál ez az
              oldal nyitva van. A korábbi riasztások később is láthatók.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
