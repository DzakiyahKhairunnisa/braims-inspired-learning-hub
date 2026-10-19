/**
 * Generates 15 placeholder JPG gallery images for the dam design page.
 * Run: node scripts/generate-gallery.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "gallery");

const palette = [
  ["#0c4a6e", "#38bdf8"],
  ["#134e4a", "#2dd4bf"],
  ["#1e3a5f", "#60a5fa"],
  ["#164e63", "#22d3ee"],
  ["#312e81", "#a78bfa"],
  ["#713f12", "#fbbf24"],
  ["#3f3f46", "#a1a1aa"],
  ["#14532d", "#4ade80"],
  ["#7c2d12", "#fb923c"],
  ["#1e40af", "#93c5fd"],
  ["#065f46", "#34d399"],
  ["#4c1d95", "#c4b5fd"],
  ["#0f766e", "#5eead4"],
  ["#991b1b", "#fca5a5"],
  ["#1d4ed8", "#bfdbfe"],
];

const titles = [
  "Vista Waduk Sengkaling",
  "Penampang Bendungan",
  "Zona Inti Urugan",
  "Spillway Ogee",
  "Low-Level Outlet",
  "Terowongan Pengelak",
  "Model BIM",
  "Instrumentasi ADAS",
  "Kawasan Hilir",
  "Jaringan Irigasi",
  "Floating Solar PV",
  "Siteplan Wisata",
  "Kurva Tampungan",
  "Skenario Q1000",
  "Tim SENGKALING-64",
];

await mkdir(outDir, { recursive: true });

for (let i = 0; i < 15; i++) {
  const [c1, c2] = palette[i];
  const title = titles[i];
  const svg = `
<svg width="1280" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <path d="M0 520 Q320 480 640 540 T1280 500 L1280 800 L0 800 Z" fill="${c1}" opacity="0.35"/>
  <path d="M0 600 Q400 560 800 620 T1280 580 L1280 800 L0 800 Z" fill="#0f172a" opacity="0.25"/>
  <text x="64" y="120" fill="white" font-family="Arial,sans-serif" font-size="42" font-weight="bold">Bendungan Sengkaling</text>
  <text x="64" y="180" fill="white" font-family="Arial,sans-serif" font-size="28" opacity="0.9">${title}</text>
  <text x="64" y="720" fill="white" font-family="Arial,sans-serif" font-size="20" opacity="0.75">Ilustrasi Rancangan · LRBN 2026 · SIMULASI VISUAL</text>
  <text x="64" y="752" fill="white" font-family="Arial,sans-serif" font-size="16" opacity="0.6">Desa Tengah, Kec. Utan, Kab. Sumbawa, NTB</text>
</svg>`;

  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
  const name = `sengkaling-${String(i + 1).padStart(2, "0")}.jpg`;
  await writeFile(join(outDir, name), buf);
  console.log("Wrote", name);
}

const heroPath = join(__dirname, "..", "src", "assets", "dam-hero.jpg");
await mkdir(dirname(heroPath), { recursive: true });
const heroSvg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0c4a6e"/><stop offset="100%" stop-color="#164e63"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <path d="M0 700 Q480 620 960 680 T1920 640 L1920 1080 L0 1080 Z" fill="#0f172a" opacity="0.4"/>
  <text x="80" y="200" fill="white" font-family="Arial" font-size="64" font-weight="bold">Bendungan Sengkaling</text>
  <text x="80" y="280" fill="#7dd3fc" font-family="Arial" font-size="28">Rancangan Bendungan Sengkaling · LRBN X</text>
</svg>`;
await writeFile(heroPath, await sharp(Buffer.from(heroSvg)).jpeg({ quality: 90 }).toBuffer());
console.log("Wrote hero", heroPath);

console.log("Done:", outDir);
