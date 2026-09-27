"use client";

// A válaszok csak ebben a komponensállapotban élnek: semmit nem mentünk és nem küldünk el.
import { useEffect, useRef, useState } from "react";
import { bankContacts, selectSteps, telHref } from "@/lib/damage";
import { DAMAGE, ENTITIES } from "@/lib/kb";

const QUESTIONS = DAMAGE.questions;
const BANK_CONTACTS = bankContacts(ENTITIES);

export default function DamageFlow() {
  const [{ answers, index }, setFlow] = useState<{ answers: Record<string, boolean>; index: number }>({
    answers: {},
    index: 0,
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Az első betöltéskor nem visszük el a fókuszt, csak a felhasználó lépései után.
  const moveFocus = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    headingRef.current?.focus();
  }, [index]);

  function answer(value: boolean) {
    moveFocus.current = true;
    setFlow((prev) => {
      if (prev.index >= QUESTIONS.length) return prev;
      const q = QUESTIONS[prev.index];
      return { answers: { ...prev.answers, [q.id]: value }, index: prev.index + 1 };
    });
  }

  function back() {
    moveFocus.current = true;
    setFlow((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }));
  }

  function restart() {
    moveFocus.current = true;
    setFlow({ answers: {}, index: 0 });
  }

  if (index < QUESTIONS.length) {
    const q = QUESTIONS[index];
    return (
      <section className="flex flex-col gap-4">
        <h2 ref={headingRef} tabIndex={-1} className="flex flex-col gap-2 focus:outline-none">
          <span className="text-base font-normal">
            <span aria-hidden="true">
              {index + 1} / {QUESTIONS.length}
            </span>
            <span className="sr-only">
              {index + 1}. kérdés, összesen {QUESTIONS.length}.
            </span>
          </span>
          <span className="text-2xl font-bold">{q.text}</span>
        </h2>
        <button
          type="button"
          onClick={() => answer(true)}
          className="min-h-[56px] w-full bg-black px-4 text-lg font-bold text-white"
        >
          Igen
        </button>
        <button
          type="button"
          onClick={() => answer(false)}
          className="min-h-[56px] w-full border-2 border-black bg-white px-4 text-lg font-bold text-black"
        >
          Nem
        </button>
        {index > 0 && (
          <button type="button" onClick={back} className="min-h-[56px] self-start text-base underline">
            Vissza
          </button>
        )}
      </section>
    );
  }

  const steps = selectSteps(answers, DAMAGE);

  return (
    <section className="flex flex-col gap-4">
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
        Mit tegyél most
      </h2>
      <ol className="flex flex-col gap-4">
        {steps.map(({ id, step }) => (
          <li key={id} className="flex flex-col gap-3 border-2 border-black p-4">
            <h3 className="text-xl font-bold">{step.title}</h3>
            <ul className="flex list-disc flex-col gap-2 pl-6">
              {step.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {id === "bank_urgent" && BANK_CONTACTS.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="font-bold">Ellenőrzött bankok kártyaletiltó számai:</p>
                <ul className="flex flex-col">
                  {BANK_CONTACTS.map((c) => (
                    <li key={`${c.name}-${c.number}`}>
                      <a href={telHref(c.number)} className="flex min-h-[56px] items-center underline">
                        {c.name} – {c.label}: {c.number}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {step.links && step.links.length > 0 && (
              <ul className="flex flex-col">
                {step.links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[56px] items-center underline"
                    >
                      {l.label}
                      <span className="sr-only"> (új lapon nyílik meg)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={restart}
        className="min-h-[56px] w-full border-2 border-black bg-white px-4 text-lg font-bold text-black"
      >
        Újrakezdés
      </button>
    </section>
  );
}
