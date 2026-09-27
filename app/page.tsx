import CheckForm from "./check-form";
import Link from "next/link";
import { Icon, PageHeading } from "./ui";

export default function Home() {
  return (
    <main>
      <PageHeading eyebrow="ÜZENETELLENŐRZÉS" title="Gyanús üzenetet kaptál?">
        Nézzük meg együtt, mielőtt kattintasz.
      </PageHeading>
      <div className="content-grid">
        <CheckForm />
        <aside
          className="support-column"
          aria-label="Segítség az ellenőrzéshez"
        >
          <section className="guide-card">
            <span className="section-icon">
              <Icon name="search" />
            </span>
            <h2>Csak néhány lépés.</h2>
            <ol className="guide-steps">
              <li>
                <span className="step-number">1</span>
                <div>
                  <h3>Másold be vagy töltsd fel</h3>
                  <p>
                    SMS, e-mail, link vagy az üzenetről készült képernyőkép.
                  </p>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div>
                  <h3>Indítsd el az ellenőrzést</h3>
                  <p>
                    Megnézzük az üzenetben és a linkekben felismerhető jeleket.
                  </p>
                </div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div>
                  <h3>Nézd meg a teendőket</h3>
                  <p>Érthetően megmutatjuk, mit találtunk, és mit tehetsz.</p>
                </div>
              </li>
            </ol>
            <Link href="/utmutato" className="text-link">
              Részletes útmutató <Icon name="arrow" />
            </Link>
          </section>
          <div className="quiet-note">
            <Icon name="help" />
            <p>
              Az ellenőrzés támpontot ad. A gyanús jelek hiánya önmagában nem
              igazolja az üzenet hitelességét.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
