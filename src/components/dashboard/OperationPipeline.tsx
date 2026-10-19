import { ArrowRight, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import type { PipelineStep } from "@/lib/operation-pipeline";

const icon = (state: PipelineStep["state"]) => {
  if (state === "blocked") return <Ban className="size-4 text-destructive" />;
  if (state === "warning") return <AlertTriangle className="size-4 text-warning" />;
  if (state === "active") return <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative size-2 rounded-full bg-primary" /></span>;
  return <CheckCircle2 className="size-4 text-success" />;
};

const ring = (state: PipelineStep["state"]) => {
  switch (state) {
    case "blocked":
      return "border-destructive/60 bg-destructive/10";
    case "warning":
      return "border-warning/50 bg-warning/10";
    case "active":
      return "border-primary bg-primary/10 shadow-[0_0_24px_-4px] shadow-primary/40";
    default:
      return "border-border bg-card";
  }
};

export function OperationPipeline({ steps }: { steps: PipelineStep[] }) {
  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Alur keputusan</p>
          <h2 className="mt-1 font-display text-lg font-bold md:text-xl">Dari sensor hingga Operator Utama</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Data lapangan divalidasi ADAS, dianalisis (termasuk prediksi demo), lalu FEWS/DEWS menghasilkan rekomendasi.
            Notifikasi masuk ke Operator Utama — keputusan disimpan di audit log, tanpa kendali aktuator otomatis.
          </p>
        </div>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
        {steps.map((s, i) => (
          <div key={s.id} className="flex min-w-[140px] flex-1 items-center gap-2">
            <div className={`flex min-h-[88px] flex-1 flex-col justify-between rounded-xl border p-3 transition ${ring(s.state)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {icon(s.state)}
              </div>
              <p className="mt-2 text-sm font-semibold leading-tight">{s.title}</p>
              <p className="text-[11px] leading-snug text-muted-foreground">{s.subtitle}</p>
            </div>
            {i < steps.length - 1 && <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground md:block" />}
          </div>
        ))}
      </div>
    </section>
  );
}
