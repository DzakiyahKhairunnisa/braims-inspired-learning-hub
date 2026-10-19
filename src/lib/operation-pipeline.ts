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
  { id: "sensor", title: "Sensor lapangan", subtitle: "AWLR, hujan, debit, struktur" },
  { id: "adas", title: "ADAS", subtitle: "Akuisisi & cek kualitas data" },
  { id: "iot", title: "Gateway IoT", subtitle: "Transmisi ke pusat data" },
  { id: "database", title: "Basis data", subtitle: "Deret waktu terpusat" },
  { id: "ml", title: "Prediksi", subtitle: "Tren muka air & risiko (demo)" },
  { id: "rules", title: "FEWS / DEWS", subtitle: "Status & rekomendasi operasi" },
  { id: "notify", title: "Notifikasi", subtitle: "Ke Operator Utama" },
  { id: "operator", title: "Keputusan", subtitle: "Setujui / tolak / verifikasi" },
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
        "Sensor kritis tidak valid. Sistem tidak mengirim rekomendasi pelepasan otomatis; Operator Utama harus memverifikasi instrumen dan kondisi lapangan.",
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
        "FEWS KRITIS: sistem mengirim notifikasi prioritas ke Operator Utama. Ikuti prosedur darurat dan verifikasi lapangan; tidak ada perintah otomatis ke pintu bendungan.",
      actions: recommendations.filter((r) => r.system === "FEWS" || r.system === "SAFETY").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "kritis",
    };
  }

  if (rules.fews === "SIAGA") {
    return {
      headline: "Evaluasi pelepasan air terkendali",
      summary:
        "Elevasi atau prediksi mendekati batas operasi atas. Notifikasi dikirim ke Operator Utama untuk meninjau outlet, kapasitas hilir, dan skenario pelepasan.",
      actions: recommendations.filter((r) => r.system === "FEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "tinggi",
    };
  }

  if (rules.fews === "WASPADA") {
    return {
      headline: "Pantau banjir — siapkan ruang tampungan",
      summary:
        "Inflow, hujan, atau tren muka air meningkat. Operator Utama menerima ringkasan FEWS WASPADA beserta rekomendasi evaluasi outlet.",
      actions: recommendations.filter((r) => r.system === "FEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "sedang",
    };
  }

  if (rules.dews === "SIAGA") {
    return {
      headline: "Konservasi tampungan — prioritas alokasi air",
      summary:
        "DEWS SIAGA: proyeksi mendekati LWL. Notifikasi ke Operator Utama untuk menyesuaikan distribusi irigasi dan pelepasan non-prioritas.",
      actions: recommendations.filter((r) => r.system === "DEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "tinggi",
    };
  }

  if (rules.dews === "WASPADA") {
    return {
      headline: "Pantau kekeringan — efisiensi distribusi",
      summary:
        "Tren penurunan muka air dan inflow rendah. Operator Utama diminta meninjau pola pelepasan dan kebutuhan air baku/irigasi.",
      actions: recommendations.filter((r) => r.system === "DEWS").map((r) => r.recommendedAction),
      notifyOperator: true,
      priority: "sedang",
    };
  }

  return {
    headline: "Operasi dalam rentang normal",
    summary:
      "Data valid, FEWS dan DEWS normal. Sistem tetap memantau setiap 5 detik (simulasi) dan mencatat perubahan ke Operator Utama jika status berubah.",
    actions: ["Lanjutkan monitoring berkala.", "Tinjau prediksi ML untuk perencanaan 6–24 jam ke depan."],
    notifyOperator: false,
    priority: "normal",
  };
}
