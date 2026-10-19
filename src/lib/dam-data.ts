// Design values from the SENGKALING-64 proposal (LRBN 2026). Planned design data, not measurements.
export const LEVELS = {
  LWL: 101,
  FEWS: 113,
  NWL: 119,
  HWL: 123,
  QPMF_FLOOD: 123.55,
  CREST: 127.05,
} as const;

export const STORAGE = {
  dead: 5_150_000,
  nwl: 17_750_000,
  hwl: 21_197_404,
  effectiveMin: 6_740_000,
  effectiveReported: 12_600_000,
  maxReported: 27_460_000,
};

export const BENEFITS = [
  { key: "irrigation", label: "Irigasi", value: "3.500 ha", note: "Kebutuhan maks. 2,5 m³/det" },
  { key: "rawWater", label: "Air Baku / Minum", value: "≥ 76 L/det", note: "±35.000 jiwa terlayani" },
  { key: "hydro", label: "PLTA", value: "1,40 MW", note: "Energi listrik terbarukan" },
  { key: "flood", label: "Pengendalian Banjir", value: "Q1000 & QPMF", note: "Flood cushion +113 → +123 m" },
  { key: "fpv", label: "Floating Solar PV", value: "44,93 MWp", note: "Konsep · 7,5% luas waduk (46,8 ha)" },
  { key: "tourism", label: "Pariwisata & Perikanan", value: "Siteplan", note: "Kawasan wisata & budidaya ikan" },
];

export const FLOODS = [
  { rp: "2 th", q: 96.89 },
  { rp: "5 th", q: 168.02 },
  { rp: "10 th", q: 227.07 },
  { rp: "20 th", q: 287.35 },
  { rp: "25 th", q: 307.1 },
  { rp: "50 th", q: 369.56 },
  { rp: "100 th", q: 433.77 },
  { rp: "200 th", q: 499.64 },
  { rp: "1000 th", q: 637.3 },
  { rp: "0,5 PMF", q: 862.22 },
  { rp: "PMF", q: 1816.43 },
];

export const TEAM = {
  name: "SENGKALING-64",
  university: "Universitas Brawijaya",
  members: ["Dzakiyah Khairunnisa (Ketua)", "Muhammad Rasya Putra", "Karol Ignasio Harunara Leton"],
  advisor: "Ir. Anggara Wiyono Wit Saputra, ST., M.Tech., IPM., ASEAN Eng., Ph.D.",
};

// Linear interpolation over the reservoir-level table (Tabel 3.1). Approximate.
const CURVE: [number, number][] = [
  [LEVELS.LWL, STORAGE.dead],
  [LEVELS.NWL, STORAGE.nwl],
  [LEVELS.HWL, STORAGE.hwl],
];
export function storageAt(z: number): number {
  const [first] = CURVE;
  if (!first) return 0;
  if (z <= first[0]) return (first[1] * Math.max(0, z - 90)) / (first[0] - 90);
  for (let i = 1; i < CURVE.length; i++) {
    const p0 = CURVE[i - 1]!;
    const p1 = CURVE[i]!;
    if (z <= p1[0]) return p0[1] + ((z - p0[0]) / (p1[0] - p0[0])) * (p1[1] - p0[1]);
  }
  return CURVE[CURVE.length - 1]![1];
}

export type Mode = "DEWS" | "NORMAL" | "FEWS" | "SPILLWAY";
// Operating logic from proposal §3.7. Thresholds are operating triggers, not safety limits.
export function operatingMode(z: number, trend: number): Mode {
  if (z >= LEVELS.HWL - 0.3) return "SPILLWAY";
  if (z >= LEVELS.FEWS) return "FEWS";
  if (trend < 0) return "DEWS";
  return "NORMAL";
}
