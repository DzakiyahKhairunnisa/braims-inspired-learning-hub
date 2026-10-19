import type { Reading } from "./telemetry";
import { DEFAULT_DAM_CONFIG } from "./dam-config";
import { LEVELS } from "./dam-data";

export const ML_DEMO_LABEL =
  "Model baseline (bukan deep learning terlatih) — demonstrasi untuk integrasi FEWS/DEWS BSK-SBW";

/** Koefisien model baseline — satu sumber kebenaran untuk UI & perhitungan. */
export const ML_COEFFICIENTS = {
  slopeLookbackSteps: 4,
  /** Faktor peredam tren saat diproyeksikan per jam horizon. */
  slopeHorizonFactor: 0.5,
  rainCapM: 0.15,
  rainCoeff: 0.008,
  inflowNetFloorM: -0.05,
  inflowNetCoeff: 0.002,
  bandBaseM: 0.12,
  bandStepM: 0.1,
  floodTrendDeltaM: 0.3,
  rainHighMm: 8,
  inflowSurplusM3s: 15,
  inflowLowM3s: 25,
  anomalyQinReferenceM3s: 50,
} as const;

export interface MlInputVariable {
  symbol: string;
  label: string;
  unit: string;
  source: string;
  value: number | null;
}

export interface MlDerivedTerm {
  symbol: string;
  label: string;
  formula: string;
  value: number | null;
  unit: string;
}

export interface MlModelSnapshot {
  valid: boolean;
  reason?: string;
  inputs: MlInputVariable[];
  derived: MlDerivedTerm[];
  horizonsHours: number[];
  riskRules: string[];
}

export const ML_METHODOLOGY_SUMMARY = {
  name: "Hybrid baseline — ekstrapolasi tren + koreksi hujan & neraca debit",
  class: "Regresi deterministik / heuristic (bukan jaringan saraf terlatih)",
  output: "Proyeksi elevasi Z(h) dan indikator risiko untuk rule engine FEWS/DEWS",
} as const;

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

export function computeDerivedTerms(data: Reading[]): MlDerivedTerm[] | null {
  const last = data[data.length - 1];
  if (!last || data.length < 4) return null;
  const prev = data[data.length - ML_COEFFICIENTS.slopeLookbackSteps] ?? data[0]!;
  const slopePerStep =
    (last.level - prev.level) / ML_COEFFICIENTS.slopeLookbackSteps;
  const rainBoost = Math.min(
    ML_COEFFICIENTS.rainCapM,
    last.rain * ML_COEFFICIENTS.rainCoeff,
  );
  const inflowBoost = Math.max(
    ML_COEFFICIENTS.inflowNetFloorM,
    (last.qin - last.qout) * ML_COEFFICIENTS.inflowNetCoeff,
  );
  return [
    {
      symbol: "m",
      label: "Gradien tren muka air",
      formula: `m = (Z_t − Z_{t−${ML_COEFFICIENTS.slopeLookbackSteps}}) / ${ML_COEFFICIENTS.slopeLookbackSteps}`,
      value: +slopePerStep.toFixed(4),
      unit: "m / sampel",
    },
    {
      symbol: "β_P",
      label: "Kontribusi hujan",
      formula: `β_P = min(${ML_COEFFICIENTS.rainCapM}, P × ${ML_COEFFICIENTS.rainCoeff})`,
      value: +rainBoost.toFixed(4),
      unit: "m / jam (efek)",
    },
    {
      symbol: "β_Q",
      label: "Kontribusi neraca debit",
      formula: `β_Q = max(${ML_COEFFICIENTS.inflowNetFloorM}, (Q_in − Q_out) × ${ML_COEFFICIENTS.inflowNetCoeff})`,
      value: +inflowBoost.toFixed(4),
      unit: "m / jam (efek)",
    },
  ];
}

export function buildMlModelSnapshot(data: Reading[]): MlModelSnapshot {
  const horizonsHours = DEFAULT_DAM_CONFIG.mlHorizonsHours;
  const last = data[data.length - 1];
  if (!last || data.length < 4) {
    return {
      valid: false,
      reason: "Minimal 4 sampel deret waktu (interval simulasi ~5 detik).",
      inputs: [],
      derived: [],
      horizonsHours,
      riskRules: [],
    };
  }

  const inputs: MlInputVariable[] = [
    { symbol: "Z_t", label: "Elevasi muka air", unit: "m", source: "WL-01 (ADAS)", value: last.level },
    { symbol: "Q_in", label: "Debit masuk", unit: "m³/s", source: "Q-IN-01", value: last.qin },
    { symbol: "Q_out", label: "Debit keluar", unit: "m³/s", source: "Q-OUT-01", value: last.qout },
    { symbol: "P", label: "Curah hujan", unit: "mm", source: "RG-01", value: last.rain },
    { symbol: "G", label: "Bukaan pintu", unit: "%", source: "GT-01", value: last.gate },
  ];

  const derived = computeDerivedTerms(data) ?? [];

  const riskRules = [
    `Tren banjir naik jika max(Z(h)) ≥ NWL−1 m (+${LEVELS.NWL - 1} m) atau ΔZ > ${ML_COEFFICIENTS.floodTrendDeltaM} m`,
    `Tren turun jika min(Z(h)) < Z_t − ${ML_COEFFICIENTS.floodTrendDeltaM} m`,
    `Defisit tinggi jika min(Z(h)) ≤ LWL+${DEFAULT_DAM_CONFIG.dewsSiagaMarginAboveLwl} m (+${LEVELS.LWL + DEFAULT_DAM_CONFIG.dewsSiagaMarginAboveLwl} m)`,
    `Defisit sedang jika min(Z(h)) < FEWS (+${LEVELS.FEWS} m) dan Q_in < ${ML_COEFFICIENTS.inflowLowM3s} m³/s`,
    `Skor anomali Q_in: min(1, |Q_in − ${ML_COEFFICIENTS.anomalyQinReferenceM3s}| / 100)`,
  ];

  return { valid: true, inputs, derived, horizonsHours, riskRules };
}

/** Baseline: ekstrapolasi tren + pengaruh hujan/inflow — bukan model terlatih. */
export function predictElevation(
  data: Reading[],
  horizons = DEFAULT_DAM_CONFIG.mlHorizonsHours,
): ElevationForecastPoint[] {
  const last = data[data.length - 1];
  if (!last || data.length < 4) return [];

  const prev = data[data.length - ML_COEFFICIENTS.slopeLookbackSteps] ?? data[0]!;
  const slopePerStep = (last.level - prev.level) / ML_COEFFICIENTS.slopeLookbackSteps;
  const rainBoost = Math.min(ML_COEFFICIENTS.rainCapM, last.rain * ML_COEFFICIENTS.rainCoeff);
  const inflowBoost = Math.max(
    ML_COEFFICIENTS.inflowNetFloorM,
    (last.qin - last.qout) * ML_COEFFICIENTS.inflowNetCoeff,
  );

  return horizons.map((h, i) => {
    const z =
      last.level +
      (slopePerStep * ML_COEFFICIENTS.slopeHorizonFactor * h + rainBoost * h + inflowBoost * h);
    const band = ML_COEFFICIENTS.bandBaseM + i * ML_COEFFICIENTS.bandStepM;
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
    factors.push(`Prediksi FEWS: mendekati/melampaui NWL Sengkaling (+${LEVELS.NWL} m)`);
  } else if (maxF > last.level + ML_COEFFICIENTS.floodTrendDeltaM) {
    floodRiskTrend = "naik";
    factors.push("Tren kenaikan muka air diproyeksikan berlanjut");
  } else if (minF < last.level - ML_COEFFICIENTS.floodTrendDeltaM) {
    floodRiskTrend = "turun";
  }

  if (last.rain > ML_COEFFICIENTS.rainHighMm) factors.push("Curah hujan tinggi pada sampel terakhir");
  if (last.qin > last.qout + ML_COEFFICIENTS.inflowSurplusM3s) {
    factors.push("Debit masuk melebihi debit keluar secara signifikan");
  }

  let droughtDeficitRisk: MlRiskInsight["droughtDeficitRisk"] = "rendah";
  if (minF <= LEVELS.LWL + DEFAULT_DAM_CONFIG.dewsSiagaMarginAboveLwl) {
    droughtDeficitRisk = "tinggi";
    factors.push(`Proyeksi DEWS: mendekati LWL Sengkaling (+${LEVELS.LWL} m)`);
  } else if (minF < LEVELS.FEWS && last.qin < ML_COEFFICIENTS.inflowLowM3s) {
    droughtDeficitRisk = "sedang";
    factors.push("Inflow rendah dengan tren penurunan tampungan");
  }

  const anomalyScore = Math.min(
    1,
    Math.abs(last.qin - ML_COEFFICIENTS.anomalyQinReferenceM3s) / 100,
  );

  return { floodRiskTrend, droughtDeficitRisk, factors, anomalyScore };
}
