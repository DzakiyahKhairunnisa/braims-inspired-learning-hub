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

export function OperationPipeline({ steps, compact }: { steps: PipelineStep[]; compact?: boolean }) {
  return (
    <section className={`rounded-xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/50 shadow-card ${compact ? "p-3" : "p-4 md:p-5"}`}>
      {!compact && (
        <p className="mb-3 text-xs text-muted-foreground">
          Sensor → ADAS → IoT → ML → FEWS/DEWS → Operator BU (simulasi, tanpa kendali aktuator).
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {steps.map((s, i) => (
          <div key={s.id} className="flex min-w-[120px] flex-1 items-center gap-1.5">
            <div className={`flex min-h-[72px] flex-1 flex-col justify-between rounded-lg border p-2 transition ${ring(s.state)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {icon(s.state)}
              </div>
              <p className="mt-1 text-xs font-semibold leading-tight">{s.title}</p>
              <p className="text-[10px] leading-snug text-muted-foreground line-clamp-2">{s.subtitle}</p>
            </div>
            {i < steps.length - 1 && <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground md:block" />}
          </div>
        ))}
      </div>
    </section>
  );
}
