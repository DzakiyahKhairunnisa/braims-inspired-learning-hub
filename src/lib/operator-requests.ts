import type { OperationalRecommendation, FewsStatus, DewsStatus } from "./rule-engine";

export interface OperatorRequestPayload {
  /** Instruksi pemantauan — dikirim ke Operator BU. */
  pantau: string[];
  /** Instruksi penyesuaian operasi — memerlukan persetujuan di Operator Center. */
  sesuaikan: string[];
  ringkasan: string;
}

export function operatorTasksForRecommendation(
  rec: OperationalRecommendation,
  fews: FewsStatus,
  dews: DewsStatus,
): OperatorRequestPayload {
  switch (rec.title) {
    case "DATA TIDAK VALID":
      return {
        ringkasan: "Sistem menahan rekomendasi otomatis hingga data kritis valid.",
        pantau: [
          "Sensor muka air WL-01 (online & nilai wajar)",
          "Gateway IoT GW-01 (koneksi stabil)",
          "Konsistensi debit Q-IN-01 vs tren muka air",
          "Log gangguan ADAS 1 jam terakhir",
        ],
        sesuaikan: [
          "Tandai VERIFY DATA setelah sensor pulih",
          "Jangan setujui pelepasan berdasarkan prediksi ML",
          "Aktifkan patroli lapangan jika gangguan berlanjut",
        ],
      };
    case "Prioritas Keselamatan Struktur":
      return {
        ringkasan: "Fokus keselamatan bendungan — pelepasan hanya setelah engineer setuju.",
        pantau: [
          "Piezometer PZ-03 & rembesan SP-01",
          "Deformasi / GNSS DF-02 (jika tersedia)",
          "Muka air & tekanan pori secara berkala",
          "Indikator anomali di dashboard keselamatan",
        ],
        sesuaikan: [
          "Ikuti RTD bendungan",
          "Tunda rekomendasi pelepasan otomatis",
          "Koordinasi inspeksi teknis struktur",
        ],
      };
    case "FEWS WASPADA":
      return {
        ringkasan: "FEWS Sengkaling WASPADA — pantau ketat ruang tampungan +113 m hingga +123 m.",
        pantau: [
          "Elevasi muka air (target: tren naik)",
          "Curah hujan RG-01 & radar hujan wilayah DAS",
          "Debit masuk Q-IN-01 vs keluar Q-OUT-01",
          "Prediksi elevasi 6–24 jam (modul ML demo)",
          "Status modul Floating PV (ikatan & akses perahu)",
        ],
        sesuaikan: [
          "Naikkan frekuensi refresh monitoring",
          "Tinjau kesiapan low-level outlet & spillway",
          "Siapkan skenario pelepasan awal jika tren berlanjut",
        ],
      };
    case "FEWS SIAGA":
      return {
        ringkasan: "Ruang tampungan terbatas — evaluasi pelepasan terkendali.",
        pantau: [
          "Elevasi mendekati NWL (+119 m)",
          "Kapasitas outlet & batas debit hilir",
          "Kondisi cuaca 12 jam ke depan",
          "Posisi bukaan pintu GT-01",
          "Notifikasi hilir (jika release direncanakan)",
        ],
        sesuaikan: [
          "Rancang pelepasan terkendali (controlled release)",
          "Koordinasi dengan BPBD / pengelola hilir",
          "Kurangi operasi non-prioritas di waduk",
        ],
      };
    case "FEWS KRITIS":
      return {
        ringkasan: "Kondisi hidrologi ekstrem — RTD dan Operator BU bertindak segera.",
        pantau: [
          "Muka air vs HWL (+123 m) setiap interval singkat",
          "Aliran spillway SPW-01",
          "Semua sensor hidrologi utama",
          "Komunikasi tim lapangan & RTD",
        ],
        sesuaikan: [
          "Aktifkan prosedur RTD",
          "Peringatan hilir melalui kanal resmi",
          "Prioritaskan keselamatan bendungan di atas pelepasan rutin",
        ],
      };
    case "DEWS WASPADA":
      return {
        ringkasan: "DEWS Sengkaling WASPADA — efisiensi irigasi 3.500 ha tanpa mengorbankan air baku 76 L/det.",
        pantau: [
          "Tren penurunan muka air harian",
          "Inflow & curah hujan musiman",
          "Kebutuhan air baku (76 L/det minimum)",
          "Jadwal irigasi 3.500 ha",
          "Persentase tampungan vs kapasitas maksimum",
        ],
        sesuaikan: [
          "Tinjau pola pelepasan non-prioritas",
          "Rotasi irigasi per blok",
          "Komunikasi ke pengguna air tentang efisiensi",
        ],
      };
    case "DEWS SIAGA":
      return {
        ringkasan: "Defisit tampungan — prioritas alokasi air wajib.",
        pantau: [
          "Elevasi mendekati LWL (+101 m)",
          "Proyeksi kebutuhan vs ketersediaan",
          "Kualitas air baku & intake",
          "Status PLTA & FPV (dampak operasi waduk)",
        ],
        sesuaikan: [
          "Prioritaskan air baku & layanan wajib",
          "Simulasikan skenario konservasi tampungan",
          "Kurangi pelepasan irigasi sesuai kebijakan alokasi",
        ],
      };
    default:
      return {
        ringkasan: rec.riskExplanation,
        pantau: ["Muka air", "FEWS/DEWS", "Kualitas data ADAS"],
        sesuaikan: [rec.recommendedAction],
      };
  }
}

/** Permintaan rutin saat kondisi normal — tetap dikirim sebagai referensi operator. */
export function operatorRoutineDispatch(fews: FewsStatus, dews: DewsStatus): OperatorRequestPayload {
  if (fews !== "NORMAL" || dews !== "NORMAL") {
    return { pantau: [], sesuaikan: [], ringkasan: "" };
  }
  return {
    ringkasan: "Kondisi normal — pemantauan rutin tanpa penyesuaian wajib.",
    pantau: [
      "Muka air & tampungan (acuan maks. 27,46 jt m³)",
      "Curah hujan & debit masuk/keluar",
      "Status sensor ADAS & gateway IoT",
      "Output Floating PV (simulasi)",
    ],
    sesuaikan: [
      "Tidak ada penyesuaian operasi wajib",
      "Lanjutkan jadwal distribusi & pemeliharaan terencana",
    ],
  };
}
