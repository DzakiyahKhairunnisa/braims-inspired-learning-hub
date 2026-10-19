/** Instruksi real-time WTC / Unit Alokasi Air BWS NTB I → Operator BU di lokasi bendungan. */

export const WTC_INSTRUCTION = {
  recipientLabel: "Operator Bendungan Utama (BU) — Bendungan Sengkaling",
  recipientId: "OP-BU-SENGKALING",
  senderRoles: [
    "Water Trip Control (WTC) — BWS NTB I",
    "Unit Alokasi Air — BWS NTB I",
    "Command Center BWS NTB I",
    "Pengawas Operasi Bendungan",
  ] as const,
  channels: ["Dashboard (simulasi Tele-O)", "Catatan internal WTC"] as const,
};

export const TMA_OPERATION_STATUS = [
  { id: "normal", label: "Normal", hint: "TMA dalam batas operasi, pantau rutin" },
  { id: "waspada", label: "Waspada", hint: "Tren naik/turun — intensifkan pelaporan ke WTC" },
  { id: "siaga", label: "Siaga", hint: "Siapkan tindakan pelepasan / konservasi" },
  { id: "awas", label: "Awas", hint: "Kondisi kritis — koordinasi RTD & pemberitahuan berjenjang" },
] as const;

export type TmaStatusId = (typeof TMA_OPERATION_STATUS)[number]["id"];

export function formatInstructionRef(at: number): string {
  const d = new Date(at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(at % 1000).padStart(3, "0");
  return `INS-SENGKALING-${y}${m}${day}-${seq}`;
}
