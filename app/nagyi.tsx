"use client";

// Nagyi mód: a beállítás a készüléken marad (localStorage), és a címsor felolvasása magyar hanggal.
import { useEffect, useSyncExternalStore } from "react";

const NAGYI_KEY = "rakattintsak.nagyi";

export function readNagyiMode(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(NAGYI_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveNagyiMode(on: boolean): void {
  try {
    window.localStorage.setItem(NAGYI_KEY, on ? "1" : "0");
  } catch {
    // Privát mód vagy letiltott tárhely: a beállítás csak erre a megnyitásra érvényes.
  }
}

function speech(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

// "hu-HU", "hu_HU", "hu" és egyéb "hu-..." jelölés. A pontos hu-HU az első.
function hungarianVoice(): SpeechSynthesisVoice | null {
  const synth = speech();
  if (!synth) return null;
  const voices = synth.getVoices().map((voice) => ({ voice, lang: voice.lang.toLowerCase().replace(/_/g, "-") }));
  return (
    voices.find((v) => v.lang === "hu-hu")?.voice ??
    voices.find((v) => v.lang === "hu" || v.lang.startsWith("hu-"))?.voice ??
    null
  );
}

// A hanglista sok böngészőben csak később töltődik be: azonnal is lekérjük, és a voiceschanged eseményre is.
function subscribeVoices(onChange: () => void): () => void {
  const synth = speech();
  if (!synth || typeof synth.addEventListener !== "function") return () => {};
  synth.addEventListener("voiceschanged", onChange);
  return () => synth.removeEventListener("voiceschanged", onChange);
}

const hasHungarianVoice = () => hungarianVoice() !== null;
const noVoiceOnServer = () => false;

// Csak akkor jelenik meg, ha van felolvasás és magyar hang.
export function ReadAloudButton({ text }: { text: string }) {
  const available = useSyncExternalStore(subscribeVoices, hasHungarianVoice, noVoiceOnServer);

  // Ha az eredmény eltűnik (új ellenőrzés, Nagyi mód kikapcsolása), a felolvasás is álljon le.
  useEffect(() => () => speech()?.cancel(), []);

  if (!available) return null;

  function read() {
    const synth = speech();
    const voice = hungarianVoice();
    if (!synth || !voice) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hu-HU";
    utterance.voice = voice;
    synth.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={read}
      className="min-h-[56px] w-full border-2 border-black bg-white px-4 text-lg font-bold text-black"
    >
      Felolvasás
    </button>
  );
}
