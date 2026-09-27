import type { Metadata } from "next";
import Link from "next/link";
import DamageFlow from "./damage-flow";
import { Icon, PageHeading } from "../ui";

export const metadata: Metadata = {
  title: "Már rákattintottam – Rákattintsak?",
};

export default function Page() {
  return (
    <main>
      <PageHeading
        eyebrow="SEGÍTSÉG KATTINTÁS UTÁN"
        title="Már rákattintottam. Mi legyen?"
      >
        Válaszolj néhány rövid kérdésre, és megmutatjuk a következő lépéseket.
      </PageHeading>
      <div className="content-grid">
        <DamageFlow />
        <aside className="support-column">
          <section className="guide-card">
            <span className="section-icon">
              <Icon name="help" />
            </span>
            <h2>Lépésről lépésre.</h2>
            <p>
              A válaszaid alapján állítjuk össze, mit érdemes tenned. Mindig az
              aktuális kérdésre válaszolj.
            </p>
            <ol className="guide-steps">
              <li>
                <span className="step-number">1</span>
                <div>
                  <h3>Mondd el, mi történt</h3>
                  <p>Hat rövid, igennel vagy nemmel megválaszolható kérdés.</p>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div>
                  <h3>Nézd meg a teendőket</h3>
                  <p>A fontosabb lépések a lista elején jelennek meg.</p>
                </div>
              </li>
            </ol>
            <Link href="/" className="text-link">
              <Icon name="back" /> Vissza az ellenőrzéshez
            </Link>
          </section>
          <p className="quiet-note">
            <Icon name="lock" />A válaszaidat nem mentjük el.
          </p>
        </aside>
      </div>
    </main>
  );
}
