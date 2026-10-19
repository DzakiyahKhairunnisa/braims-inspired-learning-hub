import { LEVELS, RESERVOIR } from "./dam-data";
import type { DewsStatus, FewsStatus } from "./rule-engine";

/** Data rancangan PLTS Terapung — proposal LRBN SENGKALING-64. */
export const FLOATING_PV = {
  /** Kapasitas terpasang rancangan (proposal LRBN SENGKALING-64). */
  capacityMwP: 44.93,
  areaHa: RESERVOIR.fpvAreaHa,
  reservoirAreaHa: RESERVOIR.surfaceAreaHa,
  sharePercent: RESERVOIR.fpvSharePercent,
  /** PLTA rancangan (untuk konteks energi hibrida di dashboard). */
  hydroMw: 1.42,
  notes: [
    "Luas modul terapung 46,8 ha pada 7,5% permukaan waduk (624,02 ha).",
    "Integrasi energi mengikuti pola operasi waduk: prioritas keselamatan bendungan dan kualitas air.",
    "Saat kondisi hidrologi atau instrumen kritis tidak valid, produksi dapat dikurangi atau dihentikan sementara (simulasi).",
  ],
} as const;

/** Tampilan kapasitas PLTS (format Indonesia: 44,93 MWp). */
export function formatFloatingPvCapacityMwP(): string {
  return `${FLOATING_PV.capacityMwP.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MWp`;
}

export type FpvOpsStatus = "produksi" | "pantau" | "kurangi" | "henti_sementara";

export interface FpvOpsView {
  status: FpvOpsStatus;
  label: string;
  detail: string;
  /** Estimasi output AC (demo, bukan SCADA). */
  outputMw: number;
  utilizationPct: number;
}

export function assessFloatingPvOps(
  level: number | undefined,
  fews: FewsStatus,
  dews: DewsStatus,
  dataValid: boolean,
): FpvOpsView {
  if (!dataValid || level === undefined) {
    return {
      status: "henti_sementara",
      label: "Menunggu data valid",
      detail: "Output PLTS terapung tidak dihitung sampai sensor hidrologi utama tervalidasi.",
      outputMw: 0,
      utilizationPct: 0,
    };
  }

  const sunFactor = 0.72;
  let capFactor = sunFactor;

  if (level >= LEVELS.HWL - 0.5 || fews === "KRITIS") {
    return {
      status: "henti_sementara",
      label: "Henti sementara (keselamatan)",
      detail: "Muka air mendekati batas operasi atas. Fokus pada FEWS, outlet, dan RTD; modul terapung tidak diprioritaskan.",
      outputMw: 0,
      utilizationPct: 0,
    };
  }

  if (fews === "SIAGA" || level >= LEVELS.NWL - 0.5) {
    capFactor *= 0.35;
    return {
      status: "kurangi",
      label: "Kurangi / koordinasi lapangan",
      detail: "Ruang tampungan terbatas. Koordinasi inspeksi rakitan terapung dengan rencana pelepasan air terkendali.",
      outputMw: FLOATING_PV.capacityMwP * capFactor,
      utilizationPct: Math.round(capFactor * 100),
    };
  }

  if (fews === "WASPADA") {
    capFactor *= 0.75;
    return {
      status: "pantau",
      label: "Pantau ketat",
      detail: "FEWS aktif: pantau ikatan modul, akses perahu, dan jalur evakuasi peralatan jika debit meningkat.",
      outputMw: FLOATING_PV.capacityMwP * capFactor,
      utilizationPct: Math.round(capFactor * 100),
    };
  }

  if (dews === "SIAGA" || level <= LEVELS.LWL + 4) {
    capFactor *= 0.8;
    return {
      status: "pantau",
      label: "Pantau penurunan muka air",
      detail: "DEWS aktif: perhatikan akses perawatan saat tampungan menurun; distribusi air tetap mengikuti prioritas layanan.",
      outputMw: FLOATING_PV.capacityMwP * capFactor,
      utilizationPct: Math.round(capFactor * 100),
    };
  }

  if (dews === "WASPADA") {
    capFactor *= 0.9;
  }

  return {
    status: "produksi",
    label: "Produksi normal (simulasi)",
    detail: "Kondisi waduk dalam rentang operasi. Output mengikuti iradiasi dan ketersediaan modul (nilai demo).",
    outputMw: FLOATING_PV.capacityMwP * capFactor,
    utilizationPct: Math.round(capFactor * 100),
  };
}
