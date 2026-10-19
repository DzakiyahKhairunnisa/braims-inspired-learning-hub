import { LEVELS } from "./dam-data";

/** Ambang operasi — dapat disesuaikan melalui SOP / dokumen operasi final. */
export interface DamOperationalConfig {
  levels: typeof LEVELS;
  /** Kenaikan muka air per interval sampel (proxy dH/dt) untuk FEWS Waspada */
  fewsWaspadaDhdt: number;
  /** Margin di bawah NWL (m) untuk FEWS Siaga */
  fewsSiagaMarginBelowNwl: number;
  /** Margin di bawah HWL (m) untuk FEWS Kritis */
  fewsKritisMarginBelowHwl: number;
  /** Penurunan muka air per interval untuk DEWS Waspada */
  dewsWaspadaDhdt: number;
  /** Margin di atas LWL (m) untuk DEWS Siaga */
  dewsSiagaMarginAboveLwl: number;
  /** Horizon prediksi ML (jam) */
  mlHorizonsHours: number[];
  /** Kontak RTD (konfigurasi) */
  emergencyContacts: { role: string; name: string; phone: string }[];
}

export const DEFAULT_DAM_CONFIG: DamOperationalConfig = {
  levels: LEVELS,
  fewsWaspadaDhdt: 0.04,
  fewsSiagaMarginBelowNwl: 2,
  fewsKritisMarginBelowHwl: 0.6,
  dewsWaspadaDhdt: -0.03,
  dewsSiagaMarginAboveLwl: 3,
  mlHorizonsHours: [1, 3, 6, 12, 24],
  emergencyContacts: [
    { role: "Operator BU Bendungan Sengkaling", name: "— (konfigurasi)", phone: "—" },
    { role: "WTC / Unit Alokasi Air BWS NTB I", name: "— (konfigurasi)", phone: "—" },
    { role: "Engineer Bendungan (tim LRBN-64 / PU)", name: "— (konfigurasi)", phone: "—" },
    { role: "BPBD Kab. Sumbawa", name: "— (konfigurasi)", phone: "—" },
  ],
};
