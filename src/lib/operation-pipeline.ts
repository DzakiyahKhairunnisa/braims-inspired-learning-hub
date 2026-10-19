import { WTC_INSTRUCTION } from "./wtc-instructions";
import { SENGKALING_ASSET } from "./sengkaling-monitoring";
import type { ValidationResult } from "./sensor-validation";
import type { RuleEngineOutput, FewsStatus, DewsStatus } from "./rule-engine";
import type { OperationalRecommendation } from "./rule-engine";

export type PipelineStepId =
  | "sensor"
  | "adas"
  | "iot"
  | "database"
  | "ml"
  | "rules"
  | "notify"
  | "operator";

export interface PipelineStep {
  id: PipelineStepId;
  title: string;
  subtitle: string;
  state: "ok" | "active" | "warning" | "blocked";
}

export interface OperatorBriefing {
  headline: string;
  summary: string;
  actions: string[];
  notifyOperator: boolean;
  priority: "normal" | "sedang" | "tinggi" | "kritis";
}

const STEPS_META: { id: PipelineStepId; title: string; subtitle: string }[] = [
  { id: "sensor", title: "Sensor BSK-SBW", subtitle: "WL-01, RG-01, Q-IN/OUT, struktur" },
  { id: "adas", title: "ADAS", subtitle: "Validasi elevasi & instrumen Sengkaling" },
  { id: "iot", title: "IoT GW-01", subtitle: "Tele-O ke pusat data (simulasi)" },
  { id: "database", title: "Basis data", subtitle: "Deret waktu waduk Sengkaling" },
  { id: "ml", title: "Prediksi ML", subtitle: "Masukan FEWS/DEWS (baseline demo)" },
  { id: "rules", title: "FEWS / DEWS", subtitle: "Ambang +113 / +119 / +123 & DEWS" },
  { id: "notify", title: "Notifikasi", subtitle: WTC_INSTRUCTION.recipientLabel },
  { id: "operator", title: "Operator BU", subtitle: "ACK · verifikasi · eksekusi (dashboard)" },
];

export function buildPipelineSteps(
  validation: ValidationResult,
  rules: RuleEngineOutput,
  hasPendingOperatorItems: boolean,
): PipelineStep[] {
  const blocked = validation.criticalInvalid;
  const warn = !blocked && validation.sensors.some((s) => s.quality !== "Valid" && s.id !== "DF-02");
  const fewsHigh = rules.fews !== "NORMAL";
  const dewsHigh = rules.dews !== "NORMAL";

  return STEPS_META.map((m) => {
    let state: PipelineStep["state"] = "ok";

    if (m.id === "sensor" && blocked) state = "blocked";
    else if (m.id === "adas" && blocked) state = "blocked";
    else if (m.id === "adas" && warn) state = "warning";
    else if (m.id === "iot" && blocked) state = "blocked";
    else if (m.id === "rules" && (fewsHigh || dewsHigh)) state = "active";
    else if (m.id === "notify" && (fewsHigh || dewsHigh || rules.recommendations.length > 0)) state = "active";
    else if (m.id === "operator" && hasPendingOperatorItems) state = "active";
    else if (m.id === "ml" && fewsHigh) state = "warning";

    return { ...m, state };
  });
}

function priorityFromFewsDews(fews: FewsStatus, dews: DewsStatus): OperatorBriefing["priority"] {
  if (fews === "KRITIS") return "kritis";
  if (fews === "SIAGA" || dews === "SIAGA") return "tinggi";
  if (fews === "WASPADA" || dews === "WASPADA") return "sedang";
  return "normal";
}

export function buildOperatorBriefing(
  validation: ValidationResult,
  rules: RuleEngineOutput,
  recommendations: OperationalRecommendation[],
): OperatorBriefing {
  const priority = priorityFromFewsDews(rules.fews, rules.dews);
  const notifyOperator = priority !== "normal" || !validation.dataValid || recommendations.length > 0;

  if (!validation.dataValid) {
    return {
      headline: "Verifikasi data sebelum keputusan operasi",
      summary:
        `Sensor kritis tidak valid di ${SENGKALING_ASSET.name}. FEWS/DEWS ditahan; ${SENGKALING_ASSET.operatorBu} memverifikasi instrumen dan lapangan.`,
      actions: [
        "Buka tab Sensor & IoT dan cek WL-01 / gateway.",
        "Gunakan VERIFY DATA di Operator Center setelah data diperbaiki.",
        "Jangan mengandalkan prediksi ML hingga data valid.",
      ],
      notifyOperator: true,
      priority: "tinggi",
    };
  }

  if (rules.fews === "KRITIS") {
    return {
      headline: "Kondisi hidrologi kritis — koordinasi RTD",
      summary:
        `FEWS KRITIS ${SENGKALING_ASSET.code}: notifikasi ke Operator BU & koordinasi WTC BWS NTB I. RTD bendungan; tanpa kendali pintu otomatis dari dashboard.`,
      actions: recommendations.filter((r) => r.system === "FEWS" || r.system === "SAFETY").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "kritis",
    };
  }

  if (rules.fews === "SIAGA") {
    return {
      headline: "Evaluasi pelepasan air terkendali",
      summary:
        "Elevasi atau prediksi mendekati batas operasi atas. Operator BU meninjau outlet, kapasitas hilir, dan skenario pelepasan.",
      actions: recommendations.filter((r) => r.system === "FEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "tinggi",
    };
  }

  if (rules.fews === "WASPADA") {
    return {
      headline: "Pantau banjir — siapkan ruang tampungan",
      summary:
        "Inflow, hujan, atau tren muka air meningkat. Ringkasan FEWS WASPADA dan rekomendasi evaluasi outlet dikirim ke Operator BU.",
      actions: recommendations.filter((r) => r.system === "FEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "sedang",
    };
  }

  if (rules.dews === "SIAGA") {
    return {
      headline: "Konservasi tampungan — prioritas alokasi air",
      summary:
        "DEWS SIAGA: proyeksi mendekati LWL. Operator BU menyesuaikan distribusi irigasi dan pelepasan non-prioritas.",
      actions: recommendations.filter((r) => r.system === "DEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "tinggi",
    };
  }

  if (rules.dews === "WASPADA") {
    return {
      headline: "Pantau kekeringan — efisiensi distribusi",
      summary:
        "Tren penurunan muka air dan inflow rendah. Operator BU meninjau pola pelepasan dan kebutuhan air baku/irigasi.",
      actions: recommendations.filter((r) => r.system === "DEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "sedang",
    };
  }

  return {
    headline: "Operasi dalam rentang normal",
    summary:
      "Data valid, FEWS dan DEWS normal. Sistem memantau setiap 5 detik (simulasi) dan mencatat perubahan ke Operator BU jika status berubah.",
    actions: ["Lanjutkan monitoring berkala.", "Tinjau prediksi ML untuk perencanaan 6–24 jam ke depan."],
    notifyOperator: false,
    priority: "normal",
  };
}
