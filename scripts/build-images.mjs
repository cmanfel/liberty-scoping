// Derives every raster asset used by the site from the two supplied brand
// images in assets-src/. Image processing only (crop / resize / encode); the
// artwork itself is never redrawn or regenerated.
//
//   node scripts/build-images.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = (f) => path.join(root, "assets-src", f);
const pub = (f) => path.join(root, "public", f);
const app = (f) => path.join(root, "src", "app", f);

const HERO = src("lady-justice-hero-original.png"); // 1536 x 1024
const MONO = src("liberty-scoping-monogram-original.png"); // 389 x 555

await mkdir(pub("images"), { recursive: true });
await mkdir(pub("logo"), { recursive: true });

const webp = { quality: 90, effort: 6, smartSubsample: true };
const avif = { quality: 62, effort: 7, chromaSubsampling: "4:4:4" };

// --- Hero: desktop / tablet (full artwork, native resolution, no upscaling)
const hero = sharp(HERO);
await hero.clone().webp(webp).toFile(pub("images/lady-justice-hero.webp"));
await hero.clone().avif(avif).toFile(pub("images/lady-justice-hero.avif"));

// --- Hero: mobile art direction. Crop (not resize) to keep the face, halo,
// raised arm and both scale pans; the left-most hair wisps are trimmed.
const MOBILE_CROP = { left: 140, top: 0, width: 1160, height: 1024 };
const mobile = sharp(HERO).extract(MOBILE_CROP);
await mobile.clone().webp(webp).toFile(pub("images/lady-justice-mobile.webp"));
await mobile.clone().avif(avif).toFile(pub("images/lady-justice-mobile.avif"));
// Smaller mobile variant (downscale only) for 1x/2x phones to save bytes.
await mobile
  .clone()
  .resize({ width: 780 })
  .webp(webp)
  .toFile(pub("images/lady-justice-mobile-780.webp"));
await mobile
  .clone()
  .resize({ width: 780 })
  .avif(avif)
  .toFile(pub("images/lady-justice-mobile-780.avif"));

// --- Monogram: square crop around the circular emblem with a soft circular
// alpha mask so it sits cleanly on any dark background.
const CX = 194;
const CY = 283;
const HALF = 160;
const SIZE = HALF * 2; // 320
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${HALF}" cy="${HALF}" r="${HALF - 4}" fill="#fff"/></svg>`,
);
const markSquare = await sharp(MONO)
  .extract({ left: CX - HALF, top: CY - HALF, width: SIZE, height: SIZE })
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

await sharp(markSquare)
  .png({ compressionLevel: 9 })
  .toFile(pub("logo/liberty-scoping-monogram-mark.png"));
await sharp(markSquare)
  .webp({ quality: 92, effort: 6, alphaQuality: 100 })
  .toFile(pub("logo/liberty-scoping-monogram-mark.webp"));

// --- Icons (flat black tile behind the mark so tiny sizes stay legible)
const tile = async (size, scale = 1) => {
  const inner = Math.round(size * scale);
  const mark = await sharp(markSquare)
    .resize(inner, inner, { kernel: "lanczos3" })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 3, background: "#080808" },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 });
};

await (await tile(32, 1)).toFile(app("icon.png"));
await (await tile(180, 0.94)).toFile(app("apple-icon.png"));

// favicon.ico: PNG-in-ICO container with 16, 32 and 48 px images.
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(
  icoSizes.map(async (s) => (await tile(s, 1)).toBuffer()),
);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length;
const entries = pngs.map((buf, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(icoSizes[i], 0);
  e.writeUInt8(icoSizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});
await writeFile(
  app("favicon.ico"),
  Buffer.concat([header, ...entries, ...pngs]),
);

console.log("images built");
