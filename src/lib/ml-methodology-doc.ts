import { LEVELS, RESERVOIR, STORAGE, TEAM } from "./dam-data";
import { ML_COEFFICIENTS } from "./ml-engine";

export interface MethodologySection {
  id: string;
  title: string;
  paragraphs: string[];
  formulas?: { label: string; expr: string; note?: string }[];
  bullets?: string[];
}

/** Narasi metodologi untuk tab Prediksi ML — selaras penjelasan akademik/operasi. */
export const ML_METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    id: "theory",
    title: "1. Landasan teori operasi waduk (acuan hidrologi)",
    paragraphs: [
      "Dalam perencanaan dan operasi bendungan, perubahan tampungan biasanya dijelaskan dengan neraca massa air dan hubungan geometri waduk. Ini adalah acuan teori yang umum dipakai engineer — bukan rumus khusus yang “dipelajari” oleh jaringan saraf di dashboard ini.",
      `Untuk Bendungan Sengkaling (${TEAM.name}), kurva elevasi–volume di aplikasi ini diinterpolasi dari titik rancangan LWL (+${LEVELS.LWL} m), NWL (+${LEVELS.NWL} m), dan HWL (+${LEVELS.HWL} m) sesuai proposal LRBN.`,
    ],
    formulas: [
      {
        label: "Neraca massa tampungan",
        expr: "dV/dt = Q_in − Q_out − Q_evap (+ term lain jika ada)",
        note: "V = volume tampungan (m³), Q dalam m³/s.",
      },
      {
        label: "Kaitan kenaikan muka air",
        expr: "dZ/dt ≈ (Q_in − Q_out) / A_s(Z)",
        note: `A_s(Z) = luas permukaan waduk pada elevasi Z. Rancangan: luas permukaan ≈ ${RESERVOIR.surfaceAreaHa} ha.`,
      },
      {
        label: "Kurva tampungan (rancangan)",
        expr: "V = f(Z)  dari tabel elevasi proposal",
        note: `Contoh: NWL ≈ ${(STORAGE.nwl / 1e6).toFixed(2)} jt m³, HWL ≈ ${(STORAGE.hwl / 1e6).toFixed(3)} jt m³, tampungan maks. ≈ ${(STORAGE.max / 1e6).toFixed(2)} jt m³.`,
      },
    ],
    bullets: [
      "Prediksi inflow dari hujan biasanya memakai model hujan–aliran DAS + routing, lalu di-routing ke waduk.",
      "ML operasional sungguhan umumnya dikalibrasi pada data historik bendungan (regresi, ensemble, LSTM, dll.).",
    ],
  },
  {
    id: "implemented",
    title: "2. Yang benar-benar diimplementasi di modul ini",
    paragraphs: [
      "Modul “Prediksi ML” pada dashboard adalah baseline deterministik untuk simulasi DSS: menggabungkan ekstrapolasi tren muka air dari deret waktu dengan koreksi sederhana curah hujan dan neraca debit. Ini memudahkan integrasi ke FEWS/DEWS tanpa menunggu data lapangan panjang.",
      "Koefisien numerik (0,008, 0,002, 0,5, dll.) ditetapkan di kode sebagai parameter demonstrasi — belum dikalibrasi terhadap DAS Sengkaling atau rekaman bendungan nyata.",
    ],
    formulas: [
      {
        label: "Gradien tren",
        expr: `m = (Z_t − Z_{t−${ML_COEFFICIENTS.slopeLookbackSteps}}) / ${ML_COEFFICIENTS.slopeLookbackSteps}`,
        note: "Z dari sensor WL-01; satu “sampel” ≈ 5 detik pada simulasi.",
      },
      {
        label: "Koreksi hujan",
        expr: `β_P = min(${ML_COEFFICIENTS.rainCapM}, P × ${ML_COEFFICIENTS.rainCoeff})`,
        note: "P = curah hujan RG-01 (mm). Efek dibatasi agar proyeksi stabil.",
      },
      {
        label: "Koreksi neraca debit",
        expr: `β_Q = max(${ML_COEFFICIENTS.inflowNetFloorM}, (Q_in − Q_out) × ${ML_COEFFICIENTS.inflowNetCoeff})`,
        note: "Mengarahkan tren mengikuti surplus/defisit debit instan.",
      },
      {
        label: "Proyeksi horizon h (jam)",
        expr: `Z(h) = Z_t + h × (${ML_COEFFICIENTS.slopeHorizonFactor}·m + β_P + β_Q)`,
        note: "h ∈ {1, 3, 6, 12, 24} jam (konfigurasi dashboard).",
      },
      {
        label: "Pita ketidakpastian (visual)",
        expr: `ε_i = ${ML_COEFFICIENTS.bandBaseM} + ${ML_COEFFICIENTS.bandStepM} × i`,
        note: "Bukan interval kepercayaan statistik 95%; hanya melebar per horizon.",
      },
    ],
  },
  {
    id: "sengkaling",
    title: "3. Hubungan dengan rancangan Bendungan Sengkaling",
    paragraphs: [
      "Elevasi pemicu operasi dari proposal LRBN SENGKALING-64 dipakai secara konsisten di seluruh aplikasi sebagai acuan FEWS/DEWS, bukan sebagai turunan langsung dari rumus Z(h) di atas.",
    ],
    bullets: [
      `LWL +${LEVELS.LWL} m — tampungan mati / acuan DEWS mendekati batas bawah.`,
      `FEWS trigger +${LEVELS.FEWS} m — evaluasi banjir & ruang flood cushion.`,
      `NWL +${LEVELS.NWL} m — operasi normal rancangan.`,
      `HWL / FWL +${LEVELS.HWL} m — batas operasi atas / acuan FEWS kritis.`,
      "Kurva V = f(Z) dipakai di KPI tampungan dashboard (fungsi storageAt), tetapi belum menggerakkan persamaan prediksi Z(h) modul baseline ini.",
      "Rule engine juga memakai pengukuran langsung (level, dH/dt, hujan, Q) — jalur paralel dengan keluaran ML, bukan satu model fisika tunggal.",
    ],
  },
  {
    id: "consistency",
    title: "4. Apakah menyalahi teori atau persamaan rancangan?",
    paragraphs: [
      "Modul ini tidak mengganti perhitungan desain (kapasitas pelimpah, PMF/Q1000, stabilitas bendungan, rating curve outlet) di proposal. Ia juga tidak men-declare bahwa Z(h) berasal dari bab hidrologi proposal — sehingga tidak “bertentangan” dengan dokumen desain, asalkan dijelaskan sebagai lapisan DSS demonstrasi.",
      "Secara ilmiah, ada simplifikasi: gradien m dinyatakan per sampel telemetri lalu dikalikan horizon jam; tanpa konversi waktu eksplisit ke dZ/dt fisik atau pembagian dengan A_s(Z). Itu adalah keterbatasan model baseline, bukan kontradiksi terhadap neraca massa — hanya belum diimplementasi penuh.",
    ],
    bullets: [
      "Arah kualitatif masih masuk akal: hujan/inflow surplus cenderung mengangkat proyeksi; defisit debit mendukung DEWS.",
      "Ambang risiko ML (mendekati NWL/LWL/FEWS) diselaraskan dengan level rancangan Sengkaling, bukan angka sembarangan.",
      "Jika ADAS menandai data tidak valid, ML tidak boleh menjadi satu-satunya dasar keputusan — sama seperti SOP operasi.",
    ],
  },
  {
    id: "roadmap",
    title: "5. Pengembangan ke model yang lebih “real”",
    bullets: [
      "Routing waduk: integrasikan dV/dt dengan kurva f(Z) proposal dan luas permukaan A_s(Z).",
      "Hujan–aliran: kalibrasi model DAS hulu Sengkaling untuk memprediksi Q_in, bukan hanya β_P heuristik.",
      "Kalibrasi parameter: regresi/optimasi terhadap skenario banjir/kekeringan rancangan atau data sintetis yang konsisten dengan Q rencana.",
      "ML terlatih: setelah ada deret waktu lapangan, latih model dengan validasi out-of-sample dan bandingkan dengan baseline ini.",
      "Gabungkan keluaran dengan rule FEWS/DEWS tunggal agar tidak ada dua logika pemicu yang membingungkan operator.",
    ],
    paragraphs: [
      "Sampai tahap itu, modul ini berperan sebagai placeholder transparan: rumus terbuka, koefisien terbaca di kode (ML_COEFFICIENTS), dan hasilnya hanya masukan ke peringatan dini — keputusan akhir tetap Operator BU setelah verifikasi lapangan.",
    ],
  },
];
