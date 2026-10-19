import type { Reading } from "./telemetry";
import { LEVELS } from "./dam-data";
import { sensorMeta } from "./sengkaling-monitoring";

export type SensorQuality = "Valid" | "Missing" | "Outlier" | "Stale" | "RangeError";

export interface SensorRecord {
  id: string;
  type: string;
  location: string;
  unit: string;
  online: boolean;
  quality: SensorQuality;
  value: string | null;
  lastUpdate: number | null;
  /** Simulasi: paksa offline untuk uji skenario */
  forcedOffline?: boolean;
}

export interface ValidationResult {
  dataValid: boolean;
  criticalInvalid: boolean;
  sensors: SensorRecord[];
  messages: string[];
}

const LEVEL_MIN = LEVELS.LWL - 5;
const LEVEL_MAX = LEVELS.CREST + 2;

export function validateSensors(
  r: Reading | undefined,
  opts?: { forceWlOffline?: boolean; seepageAnomaly?: boolean; structureAlert?: boolean },
): ValidationResult {
  const messages: string[] = [];
  const t = r?.t ?? null;

  const wlOffline = opts?.forceWlOffline ?? false;
  const levelOk =
    r &&
    !wlOffline &&
    r.level >= LEVEL_MIN &&
    r.level <= LEVEL_MAX &&
    Number.isFinite(r.level);

  if (wlOffline) {
    messages.push(
      "Sensor muka air WL-01 (menara AWLR waduk Sengkaling) tidak tersedia — DATA TIDAK VALID untuk FEWS/DEWS otomatis.",
    );
  }
  if (r && !wlOffline && (r.level < LEVEL_MIN || r.level > LEVEL_MAX)) {
    messages.push("Nilai muka air di luar rentang operasi yang diharapkan.");
  }

  const meta = (id: string, fallbackType: string) => {
    const m = sensorMeta(id);
    return { type: m?.type ?? fallbackType, location: m?.location ?? "BSK-SBW" };
  };

  const sensors: SensorRecord[] = [
    {
      id: "WL-01",
      ...meta("WL-01", "Elevasi muka air"),
      unit: "m",
      online: !wlOffline && !!r,
      quality: wlOffline ? "Missing" : levelOk ? "Valid" : "RangeError",
      value: r && !wlOffline ? r.level.toFixed(2) : null,
      lastUpdate: wlOffline ? null : t,
      forcedOffline: wlOffline,
    },
    {
      id: "Q-IN-01",
      ...meta("Q-IN-01", "Debit masuk"),
      unit: "m³/s",
      online: !!r,
      quality: r && r.qin >= 0 ? "Valid" : "Missing",
      value: r ? r.qin.toFixed(1) : null,
      lastUpdate: t,
    },
    {
      id: "Q-OUT-01",
      ...meta("Q-OUT-01", "Debit keluar"),
      unit: "m³/s",
      online: !!r,
      quality: r && r.qout >= 0 ? "Valid" : "Missing",
      value: r ? r.qout.toFixed(1) : null,
      lastUpdate: t,
    },
    {
      id: "RG-01",
      ...meta("RG-01", "Curah hujan"),
      unit: "mm",
      online: !!r,
      quality: r ? "Valid" : "Missing",
      value: r ? r.rain.toFixed(1) : null,
      lastUpdate: t,
    },
    {
      id: "GT-01",
      ...meta("GT-01", "Bukaan pintu"),
      unit: "%",
      online: !!r,
      quality: r ? "Valid" : "Missing",
      value: r ? r.gate.toFixed(0) : null,
      lastUpdate: t,
    },
    {
      id: "PZ-03",
      ...meta("PZ-03", "Piezometer"),
      unit: "kPa",
      online: true,
      quality: opts?.structureAlert ? "Outlier" : "Valid",
      value: opts?.structureAlert ? "158.2" : "142.6",
      lastUpdate: t,
    },
    {
      id: "SP-01",
      ...meta("SP-01", "Rembesan"),
      unit: "L/s",
      online: true,
      quality: opts?.seepageAnomaly ? "Outlier" : "Valid",
      value: opts?.seepageAnomaly ? "4.85" : "2.31",
      lastUpdate: t,
    },
    {
      id: "DF-02",
      ...meta("DF-02", "GNSS"),
      unit: "mm",
      online: false,
      quality: "Missing",
      value: null,
      lastUpdate: null,
    },
    {
      id: "SPW-01",
      ...meta("SPW-01", "Pelimpah"),
      unit: "",
      online: !!r,
      quality: r ? "Valid" : "Missing",
      value: r && r.level >= LEVELS.HWL ? "Overflow" : "Idle",
      lastUpdate: t,
    },
    {
      id: "GW-01",
      ...meta("GW-01", "Gateway"),
      unit: "",
      online: !wlOffline,
      quality: wlOffline ? "Stale" : "Valid",
      value: wlOffline ? "Terputus" : "Terhubung",
      lastUpdate: t,
    },
  ];

  const criticalInvalid = wlOffline || !levelOk;
  const anyBad = sensors.some((s) => s.quality !== "Valid" && s.id !== "DF-02");
  const dataValid = !!r && !criticalInvalid;

  if (opts?.structureAlert) {
    messages.push("Anomali struktur terdeteksi — prioritaskan prosedur keselamatan dan verifikasi teknis.");
  }
  if (opts?.seepageAnomaly) {
    messages.push("Nilai rembesan memerlukan verifikasi lapangan.");
  }
  if (!r) messages.push("Tidak ada data telemetri.");

  return { dataValid, criticalInvalid, sensors, messages };
}
