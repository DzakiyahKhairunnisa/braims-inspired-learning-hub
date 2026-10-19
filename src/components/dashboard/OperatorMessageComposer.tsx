import { useState } from "react";
import { Send } from "lucide-react";
import { TMA_OPERATION_STATUS, WTC_INSTRUCTION, type TmaStatusId } from "@/lib/wtc-instructions";
import { sendManualOperatorMessage, type ManualMessageKind } from "@/lib/operator-workflow";

const KINDS: { id: ManualMessageKind; label: string }[] = [
  { id: "pantau", label: "Instruksi PANTAU" },
  { id: "sesuaikan", label: "Instruksi SESUAIKAN" },
  { id: "keduanya", label: "PANTAU + SESUAIKAN" },
];

export function OperatorMessageComposer({ suggestedElevation }: { suggestedElevation?: number }) {
  const [kind, setKind] = useState<ManualMessageKind>("keduanya");
  const [sender, setSender] = useState(WTC_INSTRUCTION.senderRoles[0]);
  const [channel, setChannel] = useState(WTC_INSTRUCTION.channels[0]);
  const [tmaStatus, setTmaStatus] = useState<TmaStatusId>("normal");
  const [elevation, setElevation] = useState(
    suggestedElevation != null ? suggestedElevation.toFixed(2) : "",
  );
  const [subject, setSubject] = useState("");
  const [pantauText, setPantauText] = useState("");
  const [sesuaikanText, setSesuaikanText] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const needsPantau = kind === "pantau" || kind === "keduanya";
  const needsSesuaikan = kind === "sesuaikan" || kind === "keduanya";

  const onSend = () => {
    setError("");
    const elev = elevation.trim() ? Number(elevation) : undefined;
    if (elevation.trim() && Number.isNaN(elev)) {
      setError("Elevasi TMA tidak valid.");
      return;
    }
    const ok = sendManualOperatorMessage({
      kind,
      sender,
      channel,
      tmaStatus,
      elevationM: elev,
      subject: subject.trim() || "Instruksi operasi waduk Sengkaling",
      pantauText,
      sesuaikanText,
    });
    if (!ok) {
      setError("Isi minimal satu baris pada kolom pantau dan/atau sesuaikan.");
      return;
    }
    setSent(true);
    setPantauText("");
    setSesuaikanText("");
    setSubject("");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-card md:p-6">
      <h2 className="font-display text-lg font-bold">Instruksi real-time ke Operator Bendungan Utama</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        WTC / Unit Alokasi Air (BWS NTB I) mengirim instruksi <b>pantau</b> atau <b>sesuaikan</b> ke Operator BU di lokasi.
        Operator mengeksekusi di lapangan dan melaporkan kembali lewat Operator Center (simulasi Tele-O).
      </p>

      <div className="mt-4 rounded-lg bg-sky-50 px-4 py-3 text-xs text-sky-900">
        <p><b>Penerima:</b> {WTC_INSTRUCTION.recipientLabel}</p>
        <p className="mt-1"><b>Alur:</b> WTC kirim instruksi → BU pantau/sesuaikan → BU konfirmasi di workflow dashboard.</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted-foreground">Pengirim (WTC / Unit Alokasi Air)</span>
          <select
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
          >
            {WTC_INSTRUCTION.senderRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Kanal instruksi</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
          >
            {WTC_INSTRUCTION.channels.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Status TMA bendungan</span>
          <select
            value={tmaStatus}
            onChange={(e) => setTmaStatus(e.target.value as TmaStatusId)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
          >
            {TMA_OPERATION_STATUS.map((s) => (
              <option key={s.id} value={s.id}>{s.label} — {s.hint}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">TMA saat instruksi (+m)</span>
          <input
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-mono"
            placeholder="Contoh: 114.25"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-muted-foreground">Ringkasan instruksi</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
            placeholder="Contoh: Intensifikasi pantau saat hujan zona hulu"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`rounded-lg border px-4 py-2 text-sm transition ${kind === k.id ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border hover:bg-muted"}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {needsPantau && (
          <label className="block text-sm">
            <span className="font-medium text-sky-700">Pantau (satu item per baris)</span>
            <textarea
              value={pantauText}
              onChange={(e) => setPantauText(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-sky-200 bg-sky-50/50 px-3 py-2 text-sm"
              placeholder="Peil / sensor WL-01 tiap 30 menit&#10;Laporan curah hujan RG-01 ke WTC&#10;Kondisi hilir & debit Q-OUT-01"
            />
          </label>
        )}
        {needsSesuaikan && (
          <label className="block text-sm">
            <span className="font-medium text-amber-800">Sesuaikan (satu item per baris)</span>
            <textarea
              value={sesuaikanText}
              onChange={(e) => setSesuaikanText(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm"
              placeholder="Bukaan pintu outlet +5% bertahap&#10;Kurangi alokasi irigasi blok selatan&#10;Siapkan skenario pelepasan jika TMA naik lagi"
            />
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSend}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Send className="size-4" />
          Kirim instruksi ke Operator BU
        </button>
        {sent && <span className="text-sm font-medium text-success">Instruksi terkirim ke Operator BU.</span>}
        {error && <span className="text-sm font-medium text-destructive">{error}</span>}
      </div>
    </section>
  );
}
