import { LEVELS } from "./dam-data";
import type { Reading } from "./telemetry";

export type SimScenarioId =
  | "default"
  | "normal"
  | "drought"
  | "near_lwl"
  | "flood"
  | "near_nwl"
  | "sensor_offline"
  | "structure_anomaly";

export interface SimScenarioMeta {
  id: SimScenarioId;
  label: string;
  description: string;
}

export const SIM_SCENARIOS: SimScenarioMeta[] = [
  { id: "default", label: "Simulasi Dinamis", description: "Pola sinusoidal demo (default)." },
  { id: "normal", label: "Normal", description: "Elevasi stabil di sekitar NWL − 4 m." },
  { id: "drought", label: "DEWS — Defisit", description: "Elevasi turun, inflow rendah." },
  { id: "near_lwl", label: "DEWS — Dekat LWL", description: "Proyeksi menuju LWL +101 m." },
  { id: "flood", label: "FEWS — Hujan & Inflow", description: "Hujan dan inflow meningkat, elevasi naik." },
  { id: "near_nwl", label: "FEWS — Dekat NWL", description: "Elevasi mendekati NWL +119 m." },
  { id: "sensor_offline", label: "Sensor Terputus", description: "Muka air tidak valid." },
  { id: "structure_anomaly", label: "Anomali Struktur", description: "Piezometer/rembesan perlu verifikasi." },
];

let activeScenario: SimScenarioId = "default";

export function getActiveScenario(): SimScenarioId {
  return activeScenario;
}

export function setActiveScenario(id: SimScenarioId) {
  activeScenario = id;
}

export function scenarioFlags(id: SimScenarioId) {
  return {
    forceWlOffline: id === "sensor_offline",
    seepageAnomaly: id === "structure_anomaly",
    structureAlert: id === "structure_anomaly",
  };
}

export function sampleForScenario(t: number, scenario: SimScenarioId): Reading {
  const h = t / 3_600_000;
  switch (scenario) {
    case "normal":
      return {
        t,
        level: 110.5,
        qin: 34,
        qout: 35,
        rain: 1.5,
        gate: 15,
      };
    case "drought":
      return {
        t,
        level: 108.5 - (h % 48) * 0.08,
        qin: 12 + Math.sin(h / 15),
        qout: 18,
        rain: 0.5,
        gate: 8,
      };
    case "near_lwl":
      return {
        t,
        level: 102.8 - (h % 24) * 0.05,
        qin: 8,
        qout: 14,
        rain: 0,
        gate: 5,
      };
    case "flood":
      return {
        t,
        level: 112 + (h % 36) * 0.25,
        qin: 55 + 25 * Math.sin(h / 4),
        qout: 22,
        rain: 18 + 8 * Math.sin(h / 2),
        gate: 35,
      };
    case "near_nwl":
      return {
        t,
        level: 118.2 + (h % 12) * 0.12,
        qin: 72,
        qout: 28,
        rain: 12,
        gate: 55,
      };
    case "sensor_offline":
      return {
        t,
        level: 114,
        qin: 40,
        qout: 20,
        rain: 5,
        gate: 20,
      };
    case "structure_anomaly":
      return {
        t,
        level: 116,
        qin: 45,
        qout: 25,
        rain: 4,
        gate: 22,
      };
    default: {
      const rain = Math.max(0, 12 * Math.sin(h / 5) + 6 * Math.sin(h / 1.3) - 4);
      const qin = 38 + rain * 4.2 + 8 * Math.sin(h / 9);
      const level = 114.2 + 2.1 * Math.sin(h / 30) + 0.6 * Math.sin(h / 6);
      const gate = level >= LEVELS.FEWS ? Math.min(100, 20 + (level - LEVELS.FEWS) * 18) : 12;
      const qout = 6 + gate * 0.9;
      return { t, level, qin, qout, rain, gate };
    }
  }
}
