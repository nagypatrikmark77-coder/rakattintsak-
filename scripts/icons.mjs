// Egyszerű generált ikonok: fekete „?” fehér alapon. Nincs logó.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const svg = (size, padding) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="700"
        font-size="${Math.round((size - 2 * padding) * 0.8)}" fill="#000000">?</text>
</svg>`;

await mkdir("public/icons", { recursive: true });
await sharp(Buffer.from(svg(192, 16))).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(svg(512, 40))).png().toFile("public/icons/icon-512.png");
// Maskable: a biztonsági zóna a középső 80%, ezért nagyobb margó.
await sharp(Buffer.from(svg(512, 110))).png().toFile("public/icons/icon-maskable-512.png");
console.log("ikonok kész");
