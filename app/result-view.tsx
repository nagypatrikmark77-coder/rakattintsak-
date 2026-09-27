"use client";

// Az ellenőrzés eredménye. Csak a CheckResponse mezőit jeleníti meg (előre megírt mondatok,
// a felhasználó üzenetéből vett idézet és a tudásbázis adatai); modell által írt szöveg ide nem kerül.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CheckResponse, Verdict } from "@/lib/types";
import { ReadAloudButton, readNagyiMode, saveNagyiMode } from "./nagyi";

// Szín csak az ítéletnél van.
const VERDICT_CLASS: Record<Verdict, string> = {
  red: "bg-red-700 text-white",
  yellow: "bg-yellow-300 text-black",
  gray: "bg-gray-200 text-black",
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
    <section ref={sectionRef} aria-label="Az ellenőrzés eredménye" className="flex flex-col gap-6">
      <button
        type="button"
        aria-pressed={nagyi}
        onClick={toggleNagyi}
        className={`min-h-[56px] self-start border-2 border-black px-4 text-lg font-bold ${
          nagyi ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        Nagyi mód<span aria-hidden="true">: {nagyi ? "be" : "ki"}</span>
      </button>

      <div className={`p-4 ${VERDICT_CLASS[result.verdict]}`}>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={`font-bold focus:outline-none ${nagyi ? "text-[2.25rem] leading-tight" : "text-3xl leading-tight"}`}
        >
          {result.headline}
        </h2>
      </div>

      {nagyi ? (
        <ReadAloudButton text={result.headline} />
      ) : (
        <>
          {result.reasons.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-bold">Amit találtunk</h3>
              <ul className="flex flex-col gap-4">
                {result.reasons.map((reason, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <p>{reason.text}</p>
                    {reason.evidence.trim() && (
                      <p className="border-l-4 border-black pl-3 wrap-anywhere">„{reason.evidence.trim()}”</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.actions.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-bold">Mit tegyél most?</h3>
              <ol className="list-decimal space-y-2 pl-6">
                {result.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}

          {card && (
            <div className="flex flex-col gap-3 border-2 border-black p-4">
              <dl className="flex flex-col gap-2">
                <div>
                  <dt className="font-bold">Kinek adja ki magát:</dt>
                  <dd>{card.claimed}</dd>
                </div>
                <div>
                  <dt className="font-bold">A linkben szereplő cím:</dt>
                  <dd className="wrap-anywhere">{card.examined_domain || "nincs link az üzenetben"}</dd>
                </div>
                <div>
                  <dt className="font-bold">A hivatalos cím:</dt>
                  <dd className="wrap-anywhere">
                    {card.official_domain}
                    {!card.verified && " (a hivatalos adatokat még nem ellenőriztük)"}
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
                  className="flex min-h-[56px] items-center underline"
                >
                  A szervezet hivatalos oldala
                </a>
              )}
            </div>
          )}

          {result.checked.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-bold">Mit néztünk meg</h3>
              <ul className="list-disc space-y-2 pl-6">
                {result.checked.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {result.not_checked.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-bold">Mit nem tudtunk megnézni</h3>
              <ul className="list-disc space-y-2 pl-6">
                {result.not_checked.map((item, i) => (
                  <li key={i} className="wrap-anywhere">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href="/rakattintottam" className="flex min-h-[56px] items-center text-lg underline">
            Már rákattintottam
          </Link>
        </>
      )}
    </section>
  );
}
