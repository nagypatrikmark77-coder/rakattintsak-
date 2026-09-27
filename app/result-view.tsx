"use client";

// Az ellenőrzés eredménye. Csak a CheckResponse mezőit jeleníti meg (előre megírt mondatok,
// a felhasználó üzenetéből vett idézet és a tudásbázis adatai); modell által írt szöveg ide nem kerül.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CheckResponse, Verdict } from "@/lib/types";
import { ReadAloudButton, readNagyiMode, saveNagyiMode } from "./nagyi";
import { Icon } from "./ui";

// Az ítéletet szín és szöveges címke együtt jelzi.
const VERDICT_CLASS: Record<Verdict, string> = {
  red: "verdict-red",
  yellow: "verdict-yellow",
  gray: "verdict-gray",
};

export default function ResultView({ result }: { result: CheckResponse }) {
  // Az eredmény csak a böngészőben, ellenőrzés után jelenik meg, ezért a tárolt beállítás itt olvasható.
  const [nagyi, setNagyi] = useState(readNagyiMode);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Új eredménynél odagörgetünk, és a fókusz a címsorra kerül (a képernyőolvasó felolvassa).
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [result]);

  function toggleNagyi() {
    const next = !nagyi;
    setNagyi(next);
    saveNagyiMode(next);
  }

  const card = result.brand_card;

  return (
    <section
      ref={sectionRef}
      aria-label="Az ellenőrzés eredménye"
      className="panel stack result-section"
    >
      <div className="result-toolbar">
        <p>Az ellenőrzés eredménye</p>
        <button
          type="button"
          aria-pressed={nagyi}
          onClick={toggleNagyi}
          className="mode-button"
        >
          Nagyi mód
          <span className="mode-toggle" aria-hidden="true" />
          <span className="sr-only">
            {nagyi ? "bekapcsolva" : "kikapcsolva"}
          </span>
        </button>
      </div>
      <div className={`verdict-card ${VERDICT_CLASS[result.verdict]}`}>
        <p className="verdict-label">
          <Icon name={result.verdict === "gray" ? "help" : "alert"} />
          {result.verdict === "red"
            ? "PIROS · FIGYELMEZTETÉS"
            : result.verdict === "yellow"
              ? "SÁRGA · ÓVATOSSÁG"
              : "SZÜRKE · NINCS EGYÉRTELMŰ JEL"}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={`focus:outline-none ${nagyi ? "nagyi-heading" : ""}`}
        >
          {result.headline}
        </h2>
      </div>

      {nagyi ? (
        <ReadAloudButton text={result.headline} />
      ) : (
        <>
          {result.reasons.length > 0 && (
            <div className="result-block">
              <h3>Amit találtunk</h3>
              <ul className="flex flex-col gap-4">
                {result.reasons.map((reason, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <p>{reason.text}</p>
                    {reason.evidence.trim() && (
                      <p className="evidence">„{reason.evidence.trim()}”</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.actions.length > 0 && (
            <div className="result-block">
              <h3>Mit tegyél most?</h3>
              <ol className="list-decimal space-y-2 pl-6">
                {result.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}

          {card && (
            <div className="domain-card">
              <dl className="flex flex-col gap-2">
                <div>
                  <dt className="font-bold">Kinek adja ki magát:</dt>
                  <dd>{card.claimed}</dd>
                </div>
                <div>
                  <dt className="font-bold">A linkben szereplő cím:</dt>
                  <dd className="wrap-anywhere">
                    {card.examined_domain || "nincs link az üzenetben"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">A hivatalos cím:</dt>
                  <dd className="wrap-anywhere">
                    {card.official_domain}
                    {!card.verified &&
                      " (a hivatalos adatokat még nem ellenőriztük)"}
                  </dd>
                </div>
                {card.examined_domain && (
                  <div>
                    <dt className="font-bold">Egyezik:</dt>
                    <dd>{card.matches ? "Igen" : "Nem"}</dd>
                  </div>
                )}
              </dl>
              {card.official_url && (
                <a
                  href={card.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link mt-3"
                >
                  A szervezet hivatalos oldala
                </a>
              )}
            </div>
          )}

          {result.checked.length > 0 && (
            <div className="result-block">
              <h3>Mit néztünk meg</h3>
              <ul className="list-disc space-y-2 pl-6">
                {result.checked.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {result.not_checked.length > 0 && (
            <div className="result-block">
              <h3>Mit nem tudtunk megnézni</h3>
              <ul className="list-disc space-y-2 pl-6">
                {result.not_checked.map((item, i) => (
                  <li key={i} className="wrap-anywhere">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/rakattintottam"
            className="button button-secondary button-wide"
          >
            Már rákattintottam <Icon name="arrow" />
          </Link>
        </>
      )}
    </section>
  );
}
