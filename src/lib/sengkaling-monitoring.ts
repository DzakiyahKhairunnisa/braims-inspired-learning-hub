import { INTAKE, LEVELS, LOCATION, SPILLWAY, STORAGE } from "./dam-data";
import { WTC_INSTRUCTION } from "./wtc-instructions";

/** Aset operasi — rancangan LRBN SENGKALING-64, Desa Tengah, Kec. Utan, Kab. Sumbawa, NTB. */
export const SENGKALING_ASSET = {
  name: "Bendungan Sengkaling",
  code: "BSK-SBW",
  location: LOCATION.label,
  proposal: "LRBN SENGKALING-64 · Universitas Brawijaya",
  operatorBu: WTC_INSTRUCTION.recipientLabel,
  operatorBuId: WTC_INSTRUCTION.recipientId,
};

export const TELEMETRY_SOURCE_LABEL = "Telemetri BSK-SBW — ADAS/IoT (simulasi)";

/** Acuan elevasi & FEWS/DEWS selaras dam-data & rule engine. */
export const SENGKALING_LEVELS_GUIDE = {
  lwl: { z: LEVELS.LWL, note: "Tampungan mati 5,15 jt m³ · ambang DEWS SIAGA" },
  fews: { z: LEVELS.FEWS, note: "Trigger evaluasi banjir · ruang flood cushion ke HWL" },
  nwl: { z: LEVELS.NWL, note: "Operasi normal · 17,75 jt m³" },
  hwl: { z: LEVELS.HWL, note: "Batas operasi atas · 21,20 jt m³ (tabel elevasi)" },
  spillwayCrest: { z: SPILLWAY.crestElevationM, note: "Mercu Ogee pelimpah samping" },
  crest: { z: LEVELS.CREST, note: "Puncak bendungan urugan zona" },
  maxStorageM3: STORAGE.max,
  intakeQ: INTAKE.designDischargeM3s,
};

export type MonitoringLayer = "lapangan" | "adas" | "iot" | "ml" | "fews" | "dews";

export interface SengkalingSensorMeta {
  id: string;
  type: string;
  location: string;
  /** Lapisan ADAS (validasi) dan/atau IoT (transmisi). */
  layers: ("ADAS" | "IoT")[];
}

/** Inventaris sensor simulasi — penempatan sesuai komponen rancangan Sengkaling. */
export const SENGKALING_SENSOR_CATALOG: SengkalingSensorMeta[] = [
  { id: "WL-01", type: "Elevasi muka air (radar)", location: "Menara AWLR waduk Sengkaling", layers: ["ADAS", "IoT"] },
  { id: "Q-IN-01", type: "Debit masuk", location: "Sungai hulu / limpasan ke waduk", layers: ["ADAS", "IoT"] },
  { id: "Q-OUT-01", type: "Debit keluar", location: "Low-level outlet & saluran irigasi 3.500 ha", layers: ["ADAS", "IoT"] },
  { id: "RG-01", type: "Curah hujan", location: "Stasiun hujan tebing bendungan", layers: ["ADAS", "IoT"] },
  { id: "GT-01", type: "Posisi bukaan pintu", location: "Ruang kendali outlet (bukan kendali otomatis dashboard)", layers: ["ADAS", "IoT"] },
  { id: "PZ-03", type: "Piezometer tekanan pori", location: "Zona core bendungan (el. intake +95 m)", layers: ["ADAS"] },
  { id: "SP-01", type: "Rembesan (V-notch)", location: "Toe drain sisi hilir", layers: ["ADAS"] },
  { id: "DF-02", type: "Deformasi GNSS", location: "Puncak bendungan & sayap kiri", layers: ["ADAS", "IoT"] },
  { id: "SPW-01", type: "Status pelimpah", location: `Pelimpah samping mercu +${SPILLWAY.crestElevationM} m`, layers: ["ADAS", "IoT"] },
  { id: "GW-01", type: "Gateway Tele-O", location: "Pusat ADAS bendungan → pusat data BWS (simulasi)", layers: ["IoT"] },
];

export function sensorMeta(id: string): SengkalingSensorMeta | undefined {
  return SENGKALING_SENSOR_CATALOG.find((s) => s.id === id);
}

/** Alur data terintegrasi untuk UI (selaras tab dashboard). */
export const SENGKALING_DATA_STACK = [
  {
    key: "sensor",
    title: "Sensor lapangan BSK-SBW",
    detail: "AWLR, hujan, debit, pintu outlet, piezometer, rembesan, pelimpah.",
  },
  {
    key: "adas",
    title: "ADAS",
    detail: "Validasi rentang elevasi (+101–+127 m), deteksi missing/outlier, blokir rule engine jika WL-01 gagal.",
  },
  {
    key: "iot",
    title: "IoT / Tele-O",
    detail: "Gateway GW-01 mengirim deret waktu; interval diperketat saat FEWS/DEWS ≠ NORMAL.",
  },
  {
    key: "ml",
    title: "Prediksi ML (baseline)",
    detail: `Baseline Z(h)=Z_t+h(0,5·m+β_P+β_Q) dari WL-01, RG-01, Q-IN/OUT; masukan rule FEWS/DEWS.`,
  },
  {
    key: "fews",
    title: "FEWS",
    detail: `WASPADA dari +${LEVELS.FEWS} m / dH/dt / ML naik → SIAGA mendekati NWL +${LEVELS.NWL} m → KRITIS mendekati HWL +${LEVELS.HWL} m.`,
  },
  {
    key: "dews",
    title: "DEWS",
    detail: `WASPADA saat inflow rendah → SIAGA mendekati LWL +${LEVELS.LWL} m; konservasi irigasi 3.500 ha & air baku 76 L/det.`,
  },
] as const;
