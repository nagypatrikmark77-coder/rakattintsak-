// Az alkalmazás pajzs-kérdőjel jelének PWA-változatai.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const svg = (size, padding) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="#e5efb4"/>
  <g transform="translate(${padding} ${padding}) scale(${(size - 2 * padding) / 24})" fill="none" stroke="#284f3c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3 4.5 6v5c0 4.5 3 7.5 7.5 10 4.5-2.5 7.5-5.5 7.5-10V6L12 3Z"/>
    <path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 1.5-2.5 1.5-2.5 3M12 16h.01"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
await sharp(Buffer.from(svg(192, 16))).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(svg(512, 40))).png().toFile("public/icons/icon-512.png");
// Maskable: a biztonsági zóna a középső 80%, ezért nagyobb margó.
await sharp(Buffer.from(svg(512, 110))).png().toFile("public/icons/icon-maskable-512.png");
console.log("ikonok kész");
