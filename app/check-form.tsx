"use client";

import { useEffect, useState } from "react";
import { combineSharedText, takeSharedPayload, type SharedPayload } from "@/lib/shared-inbox";

export default function CheckForm() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [shared, setShared] = useState<SharedPayload | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("shared");
    if (!flag) return;
    window.history.replaceState(null, "", "/");
    if (flag === "failed") {
      setNotice("A megosztás nem sikerült. Nyisd meg újra az alkalmazást, és próbáld még egyszer.");
      return;
    }
    takeSharedPayload()
      .then((payload) => {
        if (!payload) {
          setNotice("Nem találtam megosztott tartalmat.");
          return;
        }
        setShared(payload);
        setText(combineSharedText(payload));
        setImage(payload.image);
      })
      .catch(() => setNotice("Nem sikerült beolvasni a megosztott tartalmat."));
  }, []);

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  return (
    <div className="flex flex-col gap-4">
      {notice && <p className="border-2 border-black p-3">{notice}</p>}

      {shared && (
        <div className="border-2 border-black p-3 text-base">
          <p className="font-bold">Megosztva érkezett (M1 teszt):</p>
          <p>Cím: {shared.title ? `„${shared.title}”` : "üres"}</p>
          <p>Szöveg: {shared.text ? `„${shared.text}”` : "üres"}</p>
          <p>Link: {shared.url ? `„${shared.url}”` : "üres"}</p>
          <p>
            Kép:{" "}
            {shared.image
              ? `${shared.image.type || "ismeretlen típus"}, ${Math.round(shared.image.size / 1024)} KB`
              : "nincs"}
          </p>
        </div>
      )}

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
        {image ? "Másik kép választása" : "Kép feltöltése"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
      </label>

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="A kiválasztott kép" className="max-h-80 w-full border border-black object-contain" />
      )}

      <button
        type="button"
        onClick={() => setNotice("Az ellenőrzés a következő mérföldkőben készül el.")}
        className="min-h-[56px] bg-black px-4 text-lg font-bold text-white"
      >
        Ellenőrzöm
      </button>

      <a href="/rakattintottam" className="text-base underline">
        Már rákattintottam
      </a>
    </div>
  );
}
