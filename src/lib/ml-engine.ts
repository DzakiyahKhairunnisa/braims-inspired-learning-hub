import type { Reading } from "./telemetry";
import { DEFAULT_DAM_CONFIG } from "./dam-config";
import { LEVELS } from "./dam-data";

export const ML_DEMO_LABEL = "MODEL DEMO — BELUM DILATIH DENGAN DATA LAPANGAN";

export interface ElevationForecastPoint {
  hoursAhead: number;
  label: string;
  elevation: number;
  lower: number;
  upper: number;
}

export interface MlRiskInsight {
  floodRiskTrend: "naik" | "stabil" | "turun";
  droughtDeficitRisk: "tinggi" | "sedang" | "rendah";
  factors: string[];
  anomalyScore: number;
}

/** Baseline: ekstrapolasi tren + pengaruh hujan/inflow — bukan model terlatih. */
export function predictElevation(
  data: Reading[],
  horizons = DEFAULT_DAM_CONFIG.mlHorizonsHours,
): ElevationForecastPoint[] {
  const last = data[data.length - 1];
  if (!last || data.length < 4) return [];

  const prev = data[data.length - 5] ?? data[0]!;
  const slopePerStep = (last.level - prev.level) / 4;
  const rainBoost = Math.min(0.15, last.rain * 0.008);
  const inflowBoost = Math.max(-0.05, (last.qin - last.qout) * 0.002);

  return horizons.map((h, i) => {
    const z = last.level + (slopePerStep * h * 0.5 + rainBoost * h + inflowBoost * h);
    const band = 0.12 + i * 0.1;
    return {
      hoursAhead: h,
      label: `+${h}j`,
      elevation: +z.toFixed(2),
      lower: +(z - band).toFixed(2),
      upper: +(z + band).toFixed(2),
    };
  });
}

export function assessMlRisk(data: Reading[], forecast: ElevationForecastPoint[]): MlRiskInsight {
  const last = data[data.length - 1];
  const factors: string[] = [];
  if (!last) {
    return { floodRiskTrend: "stabil", droughtDeficitRisk: "rendah", factors: ["Data tidak tersedia"], anomalyScore: 0 };
  }

  const maxF = forecast.reduce((m, p) => Math.max(m, p.elevation), last.level);
  const minF = forecast.reduce((m, p) => Math.min(m, p.elevation), last.level);

  let floodRiskTrend: MlRiskInsight["floodRiskTrend"] = "stabil";
  if (maxF >= LEVELS.NWL - 1) {
    floodRiskTrend = "naik";
    factors.push(`Prediksi mendekati/melampaui NWL (+${LEVELS.NWL} m) dalam horizon terdekat`);
  } else if (maxF > last.level + 0.3) {
    floodRiskTrend = "naik";
    factors.push("Tren kenaikan muka air diproyeksikan berlanjut");
  } else if (minF < last.level - 0.3) {
    floodRiskTrend = "turun";
  }

  if (last.rain > 8) factors.push("Curah hujan tinggi pada sampel terakhir");
  if (last.qin > last.qout + 15) factors.push("Debit masuk melebihi debit keluar secara signifikan");

  let droughtDeficitRisk: MlRiskInsight["droughtDeficitRisk"] = "rendah";
  if (minF <= LEVELS.LWL + DEFAULT_DAM_CONFIG.dewsSiagaMarginAboveLwl) {
    droughtDeficitRisk = "tinggi";
    factors.push(`Proyeksi mendekati LWL (+${LEVELS.LWL} m)`);
  } else if (minF < LEVELS.FEWS && last.qin < 25) {
    droughtDeficitRisk = "sedang";
    factors.push("Inflow rendah dengan tren penurunan tampungan");
  }

  const anomalyScore = Math.min(1, Math.abs(last.qin - 50) / 100);

  return { floodRiskTrend, droughtDeficitRisk, factors, anomalyScore };
}
