// Kép kicsinyítése a böngészőben, feltöltés előtt (DECISIONS.md: hosszabb oldal max 1024px, JPEG 0,85).
// Az EXIF-forgatás beleég a képbe, a többi metaadat (pl. GPS) az újrakódolással elvész.
// A képet csak memóriában tartjuk, sehova nem mentjük.

export const MAX_IMAGE_SIDE = 1024;
export const JPEG_QUALITY = 0.85;

// A böngésző nem tudja megnyitni a képet (pl. HEIC Android Chrome-on), vagy nem sikerült újrakódolni.
export class ImageDecodeError extends Error {
  constructor(message = "image_decode_failed") {
    super(message);
    this.name = "ImageDecodeError";
  }
}

// A kép új mérete: a hosszabb oldal legfeljebb max, az arány marad, nagyítás nincs.
export function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  if (![w, h, max].every((n) => Number.isFinite(n) && n > 0)) throw new RangeError("invalid_dimensions");
  const longest = Math.max(w, h);
  if (longest <= max) return { width: Math.round(w), height: Math.round(h) };
  const scale = max / longest;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decodeWithBitmap(file: Blob): Promise<Decoded | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    // Régebbi Safari nem ismeri az opciót, vagy a formátumot: jöhet az <img>.
    return null;
  }
}

// Tartalék: <img> elem. A modern böngészők itt is alkalmazzák az EXIF-forgatást (image-orientation: from-image).
function decodeWithImage(file: Blob): Promise<Decoded> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageDecodeError());
    };
    img.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImageDecodeError("image_encode_failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new ImageDecodeError()));
    reader.onerror = () => reject(new ImageDecodeError());
    reader.readAsDataURL(blob);
  });
}

// Bármely kép → JPEG data URL, a hosszabb oldal legfeljebb 1024px. bytes: a JPEG mérete.
export async function resizeImage(file: Blob): Promise<{ dataUrl: string; bytes: number }> {
  const decoded = (await decodeWithBitmap(file)) ?? (await decodeWithImage(file));
  try {
    if (!(decoded.width > 0 && decoded.height > 0)) throw new ImageDecodeError();
    const { width, height } = fitWithin(decoded.width, decoded.height, MAX_IMAGE_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageDecodeError("image_encode_failed");
    // Átlátszó PNG-nél a JPEG fekete hátteret kapna: fehér alap.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, width, height);
    const blob = await canvasToJpeg(canvas);
    return { dataUrl: await blobToDataUrl(blob), bytes: blob.size };
  } catch (err) {
    throw err instanceof ImageDecodeError ? err : new ImageDecodeError();
  } finally {
    decoded.release();
  }
}
