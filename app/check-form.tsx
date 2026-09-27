"use client";

// A főoldal űrlapja: szöveg vagy kép beküldése a /api/check végpontra, az eredmény ugyanitt, az űrlap alatt.
// A beküldött tartalom csak az oldal memóriájában él. Megosztásnál a Cache API-ban váró tartalmat
// csak sikeres ellenőrzés után töröljük, hogy hiba esetén újra lehessen próbálni.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { resizeImage } from "@/lib/image-resize";
import { clearSharedPayload, combineSharedText, peekSharedPayload } from "@/lib/shared-inbox";
import { ensureSession, authHeader } from "@/lib/supabase/browser";
import type { CheckResponse } from "@/lib/types";
import ResultView from "./result-view";

const MSG_EMPTY = "Másolj be egy üzenetet vagy linket, vagy tölts fel egy képet.";
const MSG_NETWORK = "Nem sikerült elérni a szervert. Ellenőrizd az internetkapcsolatot, és próbáld újra.";
const MSG_FAILED = "Az ellenőrzés most nem sikerült. Próbáld újra később.";
const MSG_IMAGE_FORMAT = "Ezt a képformátumot nem tudom megnyitni. Készíts képernyőképet, és azt töltsd fel.";
const MSG_SHARE_FAILED = "A megosztás nem sikerült. Nyisd meg újra az alkalmazást, és próbáld még egyszer.";
const MSG_SHARE_EMPTY = "Nem találtam megosztott tartalmat.";
const MSG_SHARE_UNREADABLE = "Nem sikerült beolvasni a megosztott tartalmat.";

// A szerver legfeljebb 60 másodpercig dolgozik; ennél tovább nem várunk.
const REQUEST_TIMEOUT_MS = 70_000;

type PreparedImage = { dataUrl: string; bytes: number };
type CheckError = { message: string; canRetry: boolean };
type Outcome = { result: CheckResponse } | { error: CheckError };

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

// Csak a várt alakú választ jelenítjük meg.
function isCheckResponse(v: unknown): v is CheckResponse {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  const card = r.brand_card as Record<string, unknown> | undefined;
  return (
    (r.verdict === "red" || r.verdict === "yellow" || r.verdict === "gray") &&
    typeof r.headline === "string" &&
    Array.isArray(r.reasons) &&
    r.reasons.every(
      (x) =>
        !!x &&
        typeof (x as Record<string, unknown>).text === "string" &&
        typeof (x as Record<string, unknown>).evidence === "string",
    ) &&
    isStringArray(r.actions) &&
    isStringArray(r.checked) &&
    isStringArray(r.not_checked) &&
    (card === undefined ||
      (!!card &&
        typeof card === "object" &&
        typeof card.claimed === "string" &&
        typeof card.examined_domain === "string" &&
        typeof card.official_domain === "string" &&
        typeof card.matches === "boolean" &&
        typeof card.verified === "boolean" &&
        typeof card.official_url === "string"))
  );
}

async function postCheck(text: string, image: string | null): Promise<Outcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ text, image }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return { error: { message: MSG_NETWORK, canRetry: true } };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  } finally {
    clearTimeout(timer);
  }
  if (res.ok && isCheckResponse(body)) return { result: body };
  const serverMessage =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : null;
  // Újrapróbálás: szerverhiba, limit, vagy értelmezhetetlen válasz. A 400/413 a bemeneten múlik.
  const canRetry = res.status >= 500 || res.status === 429 || !serverMessage;
  return { error: { message: serverMessage ?? MSG_FAILED, canRetry } };
}

export default function CheckForm() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preparingImage, setPreparingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<CheckError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);
  const shareHandled = useRef(false);

  const runCheck = useCallback(async (checkText: string, checkImage: string | null) => {
    if (inFlight.current) return;
    if (!checkText.trim() && !checkImage) {
      setResult(null);
      setError({ message: MSG_EMPTY, canRetry: false });
      return;
    }
    inFlight.current = true;
    setLoading(true);
    setResult(null);
    setError(null);
    setNotice(null);
    const outcome = await postCheck(checkText, checkImage);
    // Az eredmény és a töltés vége egy renderben: így az odagörgetés után nem ugrik el a tartalom.
    if ("result" in outcome) setResult(outcome.result);
    else setError(outcome.error);
    setLoading(false);
    inFlight.current = false;
    // Sikeres ellenőrzés után a megosztásból várakozó tartalom sem maradhat a készüléken.
    if ("result" in outcome) await clearSharedPayload().catch(() => {});
  }, []);

  // Megosztás menüből érkezés: /?shared=1 (a service worker a Cache API-ba tette a tartalmat) vagy /?shared=failed.
  useEffect(() => {
    if (shareHandled.current) return;
    const flag = new URLSearchParams(window.location.search).get("shared");
    if (!flag) return;
    shareHandled.current = true;

    void (async () => {
      if (flag === "failed") {
        window.history.replaceState(null, "", "/");
        setNotice(MSG_SHARE_FAILED);
        return;
      }

      let payload: Awaited<ReturnType<typeof peekSharedPayload>> = null;
      let unreadable = false;
      try {
        payload = await peekSharedPayload();
      } catch {
        unreadable = true;
      }
      if (!payload) {
        window.history.replaceState(null, "", "/");
        setNotice(unreadable ? MSG_SHARE_UNREADABLE : MSG_SHARE_EMPTY);
        return;
      }

      const sharedText = combineSharedText(payload);
      let sharedImage: PreparedImage | null = null;
      if (payload.image) {
        try {
          sharedImage = await resizeImage(payload.image);
        } catch {
          setImageError(MSG_IMAGE_FORMAT);
        }
      }
      setText(sharedText);
      setImage(sharedImage);
      window.history.replaceState(null, "", "/");

      await ensureSession();
      // Ha csak egy megnyithatatlan kép jött, nincs mit ellenőrizni: a képhiba üzenete látszik.
      if (!sharedText.trim() && !sharedImage) return;
      await runCheck(sharedText, sharedImage?.dataUrl ?? null);
    })();
  }, [runCheck]);

  async function onImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    // Ugyanaz a fájl újra kiválasztható legyen.
    e.target.value = "";
    if (!file) return;
    setImageError(null);
    setPreparingImage(true);
    try {
      setImage(await resizeImage(file));
    } catch {
      setImage(null);
      setImageError(MSG_IMAGE_FORMAT);
    } finally {
      setPreparingImage(false);
    }
  }

  function removeImage() {
    setImage(null);
    setImageError(null);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void runCheck(text, image?.dataUrl ?? null);
  }

  const busy = loading || preparingImage;

  return (
    <div className="flex flex-col gap-6">
      {notice && <p className="border-2 border-black p-3">{notice}</p>}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span>Másold ide az üzenetet vagy a linket</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full border-2 border-black p-3 text-lg"
          />
        </label>

        <label className="flex min-h-[56px] cursor-pointer items-center justify-center border-2 border-black px-4 text-lg">
          {preparingImage ? "Kép betöltése…" : image ? "Másik kép választása" : "Kép feltöltése"}
          <input type="file" accept="image/*" className="sr-only" onChange={onImageChange} disabled={busy} />
        </label>

        {imageError && (
          <p role="alert" className="border-2 border-black p-3">
            {imageError}
          </p>
        )}

        {image && (
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt="A kiválasztott kép"
              className="max-h-80 w-full border border-black object-contain"
            />
            <button
              type="button"
              onClick={removeImage}
              disabled={loading}
              className="min-h-[56px] self-start text-base underline"
            >
              Kép eltávolítása
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-[56px] bg-black px-4 text-lg font-bold text-white"
        >
          {loading ? "Ellenőrzöm…" : "Ellenőrzöm"}
        </button>

        <p role="status" className={loading ? "" : "sr-only"}>
          {loading ? "Néhány másodperc." : ""}
        </p>
      </form>

      {error && (
        <div role="alert" className="flex flex-col gap-3 border-2 border-black p-4">
          <p>{error.message}</p>
          {error.canRetry && (
            <button
              type="button"
              onClick={() => void runCheck(text, image?.dataUrl ?? null)}
              disabled={busy}
              className="min-h-[56px] border-2 border-black bg-white px-4 text-lg font-bold text-black"
            >
              Újra
            </button>
          )}
        </div>
      )}

      {result && <ResultView result={result} />}

      <nav className="flex flex-col">
        <Link href="/rakattintottam" className="flex min-h-[56px] items-center text-base underline">
          Már rákattintottam
        </Link>
        <Link href="/csalad" className="flex min-h-[56px] items-center text-base underline">
          Családi védőháló
        </Link>
      </nav>
    </div>
  );
}
