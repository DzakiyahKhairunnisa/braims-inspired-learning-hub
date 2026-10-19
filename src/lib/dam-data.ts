// Design values from proposal LRBN SENGKALING-64 (Universitas Brawijaya). Planned design data, not field measurements.
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
  effectiveReported: 12_600_000,
  maxReported: 27_460_000,
};

/** Lokasi perencanaan — proposal LRBN SENGKALING-64. */
export const LOCATION = {
  village: "Desa Tengah",
  district: "Kecamatan Utan",
  regency: "Kabupaten Sumbawa",
  province: "Nusa Tenggara Barat",
  label: "Desa Tengah, Kecamatan Utan, Kabupaten Sumbawa, NTB",
  alignment: [
    { point: 1, e: 513_459.216, n: 9_065_401.048, elevation: 130 },
    { point: 2, e: 514_243.902, n: 9_065_445.665, elevation: 130 },
  ],
} as const;

export const DAM_GEOMETRY = {
  crestWidthM: 10.86,
  heightM: 57.05,
  freeboardM: 3.5,
  valleyFloorM: 70,
  crestElevationM: LEVELS.CREST,
} as const;

export const RESERVOIR = {
  surfaceAreaHa: 624.02,
  fpvAreaHa: 46.8,
  fpvSharePercent: 7.5,
} as const;

export const SPILLWAY = {
  type: "Pelimpah samping",
  weirType: "Mercu Ogee Tipe 1",
  crestElevationM: 125.5,
  weirHeightM: 15,
  weirWidthM: 10,
  channelLengthM: 700,
  channelWidthM: 10,
} as const;

export const INTAKE = {
  type: "Menara intake",
  elevationM: 95,
  designDischargeM3s: 3.4,
  inletWidthM: 4,
  powerhouseElevationM: 45,
  headM: 50,
  powerMw: 1.42,
} as const;

export const BENEFITS = [
  { key: "irrigation", label: "Irigasi", value: "3.500 ha", note: "Kebutuhan maks. 2,5 m³/det" },
  { key: "rawWater", label: "Air Baku / Minum", value: "76 L/det", note: "±35.000 jiwa terlayani" },
  { key: "hydro", label: "PLTA", value: "±1,42 MW", note: "Debit rencana intake 3,40 m³/det" },
  { key: "flood", label: "Pengendalian Banjir", value: "Q1000 & QPMF", note: "Reduksi debit puncak PMF 11,76%" },
  { key: "fpv", label: "Floating Solar PV", value: "44,93 MWp", note: `7,5% luas waduk (${RESERVOIR.fpvAreaHa} ha)` },
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
  competition: "Lomba Rancang Bendungan Nasional X",
  members: [
    "Dzakiyah Khairunnisa (Ketua)",
    "Muhammad Rasya Putra",
    "Karol Ignasio Harunara Leton",
  ],
  advisors: [
    "Ir. Anggara Wiyono Wit Saputra, S.T., M.Tech., Ph.D., IPM., ASEAN Eng.",
    "Prof. Dr. Ir. Pitojo Tri Juwono, M.T., IPU., ASEAN Eng.",
  ],
};

// Linear interpolation over the reservoir-level table (proposal). Approximate between LWL, NWL, HWL.
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
