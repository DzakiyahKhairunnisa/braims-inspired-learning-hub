import { DEFAULT_DAM_CONFIG, type DamOperationalConfig } from "./dam-config";
import { LEVELS, storageAt } from "./dam-data";
import type { MlRiskInsight, ElevationForecastPoint } from "./ml-engine";
import type { Reading } from "./telemetry";
import type { ValidationResult } from "./sensor-validation";

export type FewsStatus = "NORMAL" | "WASPADA" | "SIAGA" | "KRITIS";
export type DewsStatus = "NORMAL" | "WASPADA" | "SIAGA";

export type RecommendationPriority = "rendah" | "sedang" | "tinggi" | "kritis";

export interface OperationalRecommendation {
  id: string;
  system: "FEWS" | "DEWS" | "SAFETY" | "DATA";
  priority: RecommendationPriority;
  title: string;
  triggerParams: Record<string, string | number>;
  riskExplanation: string;
  recommendedAction: string;
  createdAt: number;
}

export interface RuleEngineOutput {
  fews: FewsStatus;
  dews: DewsStatus;
  factors: string[];
  recommendations: OperationalRecommendation[];
  timeToNwlHours: number | null;
  timeToLwlHours: number | null;
}

function hoursToReach(current: number, target: number, dhdt: number): number | null {
  if (dhdt === 0) return null;
  const delta = target - current;
  if (dhdt > 0 && delta <= 0) return 0;
  if (dhdt < 0 && delta >= 0) return 0;
  if ((dhdt > 0 && delta < 0) || (dhdt < 0 && delta > 0)) return null;
  return Math.abs(delta / dhdt);
}

function rec(
  system: OperationalRecommendation["system"],
  priority: RecommendationPriority,
  title: string,
  triggerParams: Record<string, string | number>,
  riskExplanation: string,
  recommendedAction: string,
  createdAt: number,
): OperationalRecommendation {
  return {
    id: `REC-${system}-${title.replace(/\s+/g, "-").toUpperCase()}`,
    system,
    priority,
    title,
    triggerParams,
    riskExplanation,
    recommendedAction,
    createdAt,
  };
}

export function evaluateRules(
  reading: Reading | undefined,
  dhdt: number,
  validation: ValidationResult,
  ml: MlRiskInsight,
  forecast: ElevationForecastPoint[],
  config: DamOperationalConfig = DEFAULT_DAM_CONFIG,
): RuleEngineOutput {
  const factors: string[] = [];
  const recommendations: OperationalRecommendation[] = [];
  const t = reading?.t ?? Date.now();

  if (!reading || validation.criticalInvalid) {
    factors.push("Data kritis tidak valid");
    recommendations.push(
      rec(
        "DATA",
        "tinggi",
        "DATA TIDAK VALID",
        {},
        validation.messages.join(" ") || "Sensor kritis tidak tersedia.",
        "Verifikasi WL-01 & GW-01 Bendungan Sengkaling sebelum FEWS/DEWS otomatis aktif.",
        t,
      ),
    );
    return { fews: "NORMAL", dews: "NORMAL", factors, recommendations, timeToNwlHours: null, timeToLwlHours: null };
  }

  const { level, qin, qout, rain } = reading;
  const maxForecast = forecast.length ? Math.max(...forecast.map((f) => f.elevation)) : level;

  if (validation.messages.some((m) => m.includes("Anomali struktur"))) {
    factors.push("Indikasi anomali struktur");
    recommendations.push(
      rec(
        "SAFETY",
        "kritis",
        "Prioritas Keselamatan Struktur",
        { piezometer: "outlier" },
        "Parameter keamanan struktur memerlukan verifikasi segera.",
        "Ikuti RTD bendungan, hentikan rekomendasi pelepasan otomatis hingga engineer menyetujui.",
        t,
      ),
    );
  }

  // --- FEWS ---
  let fews: FewsStatus = "NORMAL";

  if (level >= config.levels.HWL - config.fewsKritisMarginBelowHwl || maxForecast >= config.levels.HWL - 0.3) {
    fews = "KRITIS";
    factors.push("Kondisi hidrologi mendekati batas operasi atas / HWL");
  } else if (level >= config.levels.NWL - config.fewsSiagaMarginBelowNwl || maxForecast >= config.levels.NWL) {
    fews = "SIAGA";
    factors.push("Elevasi mendekati NWL atau prediksi menuju NWL");
  } else if (
    level >= config.levels.FEWS ||
    dhdt >= config.fewsWaspadaDhdt ||
    (rain > 5 && qin > qout) ||
    ml.floodRiskTrend === "naik"
  ) {
    fews = "WASPADA";
    if (level >= config.levels.FEWS) factors.push(`Elevasi ≥ trigger evaluasi FEWS (+${config.levels.FEWS} m)`);
    if (dhdt >= config.fewsWaspadaDhdt) factors.push("Tren kenaikan muka air (dH/dt positif)");
    if (rain > 5) factors.push("Curah hujan meningkat");
    if (qin > qout + 5) factors.push("Debit masuk meningkat relatif terhadap keluar");
    if (ml.floodRiskTrend === "naik") factors.push("Model baseline memprediksi kenaikan lanjutan");
  }

  // --- DEWS ---
  let dews: DewsStatus = "NORMAL";

  if (level <= config.levels.LWL + config.dewsSiagaMarginAboveLwl || ml.droughtDeficitRisk === "tinggi") {
    dews = "SIAGA";
    factors.push(`Proyeksi/kondisi mendekati LWL (+${config.levels.LWL} m)`);
  } else if (dhdt <= config.dewsWaspadaDhdt || (qin < 30 && rain < 3) || ml.droughtDeficitRisk === "sedang") {
    dews = "WASPADA";
    if (dhdt <= config.dewsWaspadaDhdt) factors.push("Tren penurunan muka air");
    if (qin < 30 && rain < 3) factors.push("Inflow dan curah hujan rendah");
    if (ml.droughtDeficitRisk === "sedang") factors.push("Model baseline mengindikasikan potensi defisit tampungan");
  }

  const timeToNwlHours = hoursToReach(level, config.levels.NWL, dhdt);
  const timeToLwlHours = hoursToReach(level, config.levels.LWL + config.dewsSiagaMarginAboveLwl, dhdt);

  if (fews === "WASPADA") {
    recommendations.push(
      rec(
        "FEWS",
        "sedang",
        "FEWS WASPADA",
        { H: level, Qin: qin, P: rain, dHdt: +dhdt.toFixed(3) },
        "Debit inflow meningkat dan/atau elevasi menunjukkan tren naik. ML memprediksi kenaikan lanjutan.",
        "Verifikasi data, evaluasi ruang tampungan, tinjau kesiapan outlet.",
        t,
      ),
    );
  }
  if (fews === "SIAGA") {
    recommendations.push(
      rec(
        "FEWS",
        "tinggi",
        "FEWS SIAGA",
        { H: level, Qin: qin, prediksiMax: maxForecast },
        "Elevasi mendekati NWL dengan potensi kenaikan berlanjut.",
        "Evaluasi pelepasan air terkendali (controlled/early release); periksa kapasitas outlet dan kondisi hilir.",
        t,
      ),
    );
  }
  if (fews === "KRITIS") {
    recommendations.push(
      rec(
        "FEWS",
        "kritis",
        "FEWS KRITIS",
        { H: level, HWL: config.levels.HWL },
        "Kondisi hidrologi ekstrem atau mendekati batas operasi atas.",
        "Aktifkan prosedur RTD; verifikasi lapangan; koordinasi peringatan hilir melalui mekanisme resmi.",
        t,
      ),
    );
  }

  if (dews === "WASPADA") {
    const storage = storageAt(level);
    recommendations.push(
      rec(
        "DEWS",
        "sedang",
        "DEWS WASPADA",
        { H: level, Qin: qin, tampungan: +(storage / 1e6).toFixed(2) },
        "Elevasi menurun dan inflow di bawah pola yang diharapkan. Potensi defisit tampungan.",
        "Evaluasi distribusi air dan pola pelepasan berdasarkan kebutuhan prioritas.",
        t,
      ),
    );
  }
  if (dews === "SIAGA") {
    recommendations.push(
      rec(
        "DEWS",
        "tinggi",
        "DEWS SIAGA",
        { H: level, LWL: config.levels.LWL },
        "Proyeksi mendekati LWL; kebutuhan air dapat melebihi ketersediaan.",
        "Simulasikan penyesuaian distribusi; prioritaskan air baku wajib; skenario konservasi tampungan.",
        t,
      ),
    );
  }

  return { fews, dews, factors, recommendations, timeToNwlHours, timeToLwlHours };
}

export function statusBadgeClass(status: FewsStatus | DewsStatus): string {
  switch (status) {
    case "NORMAL":
      return "bg-success/20 text-success";
    case "WASPADA":
      return "bg-warning/20 text-warning";
    case "SIAGA":
      return "bg-orange-100 text-orange-700";
    case "KRITIS":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}
