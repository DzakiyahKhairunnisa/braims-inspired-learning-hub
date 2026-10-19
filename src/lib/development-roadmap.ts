import { TEAM } from "./dam-data";

export interface RoadmapPhase {
  id: string;
  phase: string;
  title: string;
  status: "berjalan" | "rencana" | "visi";
  summary: string;
  deliverables: string[];
}

/**
 * Digital twin bendungan diposisikan sebagai arah pengembangan jangka menengah,
 * bukan klaim fitur pada demonstrasi LRBN saat ini.
 */
export const DIGITAL_TWIN_POSITIONING = {
  headline: "Rencana pengembangan — Digital Twin Bendungan Sengkaling",
  intro:
    `Demonstrasi ${TEAM.name} saat ini adalah platform DSS (monitoring, ADAS/IoT simulasi, FEWS/DEWS, workflow Operator BU). ` +
    "Digital twin dipahami sebagai replika digital yang tersinkron dengan aset dan data lapangan, dengan model perilaku waduk/bendungan — itu target pengembangan, bukan status produk hari ini.",
} as const;

export const DEVELOPMENT_ROADMAP: RoadmapPhase[] = [
  {
    id: "now",
    phase: "Tahap berjalan",
    title: "DSS operasi & early warning (demo)",
    status: "berjalan",
    summary:
      "Integrasi sensor simulasi, validasi ADAS, rule FEWS/DEWS selaras elevasi rancangan, prediksi ML baseline, notifikasi dan workflow operator — tanpa kendali aktuator otomatis.",
    deliverables: [
      "Telemetri BSK-SBW & skenario uji",
      "Operator Center + instruksi WTC → BU",
      "Dokumentasi metodologi ML (teori vs implementasi)",
    ],
  },
  {
    id: "data",
    phase: "Tahap 1",
    title: "Data lapangan & kurva rancangan hidup",
    status: "rencana",
    summary:
      "Mengganti simulasi dengan data riil; kurva V = f(Z) dan tampungan dari LRBN dipakai secara aktif di perhitungan, bukan hanya di KPI.",
    deliverables: [
      "Gateway IoT produksi & protokol Tele-O",
      "Sinkronisasi tabel elevasi–volume proposal",
      "Audit kualitas data ADAS (SOP)",
    ],
  },
  {
    id: "hydro",
    phase: "Tahap 2",
    title: "Model hidrologi & routing waduk",
    status: "rencana",
    summary:
      "Neraca massa dV/dt = Q_in − Q_out dan dZ/dt ≈ (Q_in − Q_out)/A_s(Z) sebagai inti proyeksi, digabung model hujan–aliran DAS hulu.",
    deliverables: [
      "Model inflow terkalibrasi",
      "Skenario banjir/kekeringan konsisten Q rencana",
      "What-if pelepasan & kapasitas hilir",
    ],
  },
  {
    id: "ml",
    phase: "Tahap 3",
    title: "Analitik & ML terkalibrasi",
    status: "rencana",
    summary:
      "Mengganti baseline heuristik dengan model terlatih/terkalibrasi pada data historis, dengan validasi dan banding terhadap model fisika Tahap 2.",
    deliverables: [
      "Horizon prediksi multi-jam tervalidasi",
      "Ensemble atau ML + fisika (hybrid)",
      "Masukan tunggal ke FEWS/DEWS",
    ],
  },
  {
    id: "twin",
    phase: "Tahap 4 (visi)",
    title: "Digital twin terpadu",
    status: "visi",
    summary:
      "Replika digital komponen bendungan (geometri/aset), instrumen, dan perilaku hidrologi–struktur dalam satu lingkungan: monitor → simulasi → dukungan keputusan, dengan umpan balik kalibrasi dari lapangan.",
    deliverables: [
      "Model aset 3D/geospasial terikat titik sensor",
      "Panel struktur (rembesan, piezometer) terintegrasi",
      "Skenario operasi & pemeliharaan jangka panjang",
    ],
  },
];
