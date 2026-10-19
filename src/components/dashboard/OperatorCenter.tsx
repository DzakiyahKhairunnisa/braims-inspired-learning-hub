import { useState } from "react";
import {
  applyWorkflowAction,
  clearOperatorDemoState,
  type OperatorActionItem,
} from "@/lib/operator-workflow";
import { fmtDateTime } from "@/lib/telemetry";
import type { OperatorState } from "@/lib/operator-workflow";

const actions = [
  { key: "ACKNOWLEDGE" as const, label: "ACKNOWLEDGE" },
  { key: "VERIFY_DATA" as const, label: "VERIFY DATA" },
  { key: "APPROVE" as const, label: "APPROVE RECOMMENDATION" },
  { key: "REJECT" as const, label: "REJECT RECOMMENDATION" },
  { key: "MARK_EXECUTED" as const, label: "MARK AS EXECUTED" },
  { key: "VERIFY_RESULT" as const, label: "VERIFY RESULT" },
];

const statusLabel: Record<string, string> = {
  baru: "Baru",
  diakui: "Diakui",
  data_diverifikasi: "Data diverifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dijalankan: "Dijalankan",
  hasil_diverifikasi: "Hasil diverifikasi",
};

function priorityCls(p: string) {
  if (p === "kritis") return "text-destructive";
  if (p === "tinggi") return "text-orange-400";
  if (p === "sedang") return "text-warning";
  return "text-muted-foreground";
}

export function OperatorCenter({ state }: { state: OperatorState }) {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const onAction = (id: string, action: typeof actions[number]["key"]) => {
    applyWorkflowAction(id, action, "OP-UTAMA", note);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold">Operator Action Center</h2>
          <button
            type="button"
            onClick={() => clearOperatorDemoState()}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Reset demo workflow
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Tombol di bawah hanya memperbarui status workflow dan audit log di dashboard. Tidak mengirim perintah ke aktuator bendungan nyata.
        </p>
        <label className="mt-4 block text-sm">
          <span className="text-muted-foreground">Catatan keputusan (opsional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
            rows={2}
            placeholder="Alasan persetujuan / penolakan..."
          />
        </label>
      </section>

      <div className="space-y-4">
        {state.items.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada rekomendasi aktif. Jalankan skenario simulasi FEWS/DEWS untuk menghasilkan item.</p>
        )}
        {state.items.map((item) => (
          <RecommendationCard
            key={item.id}
            item={item}
            expanded={selected === item.id}
            onToggle={() => setSelected(selected === item.id ? null : item.id)}
            onAction={onAction}
          />
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Audit Log</h2>
        <div className="mt-4 max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Waktu</th>
                <th className="px-2 py-2">Aktor</th>
                <th className="px-2 py-2">Aksi</th>
                <th className="px-2 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {state.audit.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-2 py-2 font-sans text-muted-foreground">{fmtDateTime(a.at)}</td>
                  <td className="px-2 py-2">{a.actor}</td>
                  <td className="px-2 py-2 font-mono text-xs">{a.action}</td>
                  <td className="px-2 py-2">{a.detail}</td>
                </tr>
              ))}
              {!state.audit.length && (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-center text-muted-foreground">Belum ada entri audit.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RecommendationCard({
  item,
  expanded,
  onToggle,
  onAction,
}: {
  item: OperatorActionItem;
  expanded: boolean;
  onToggle: () => void;
  onAction: (id: string, action: typeof actions[number]["key"]) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{item.id}</p>
          <h3 className="mt-1 font-display text-lg font-semibold">{item.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(item.createdAt)} · {item.system}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${priorityCls(item.priority)}`}>
          {item.priority}
        </span>
      </button>
      {expanded && (
        <div className="mt-4 space-y-3 text-sm">
          <p><span className="text-muted-foreground">Status workflow:</span> {statusLabel[item.workflowStatus] ?? item.workflowStatus}</p>
          <p><span className="text-muted-foreground">Penjelasan risiko:</span> {item.riskExplanation}</p>
          <p><span className="text-muted-foreground">Rekomendasi:</span> {item.recommendedAction}</p>
          <p className="font-mono text-xs text-muted-foreground">
            Pemicu: {Object.entries(item.triggerParams).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}
          </p>
          {item.decisionNote && <p className="rounded-lg bg-muted p-3">Catatan: {item.decisionNote}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => onAction(item.id, a.key)}
                className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
