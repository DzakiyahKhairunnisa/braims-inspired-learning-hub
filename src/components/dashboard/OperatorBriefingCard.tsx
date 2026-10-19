import { Bell, ChevronRight } from "lucide-react";
import type { OperatorBriefing } from "@/lib/operation-pipeline";

const priorityStyle: Record<OperatorBriefing["priority"], string> = {
  normal: "from-success/15 to-card border-success/30",
  sedang: "from-warning/15 to-card border-warning/40",
  tinggi: "from-orange-500/15 to-card border-orange-500/40",
  kritis: "from-destructive/20 to-card border-destructive/50",
};

export function OperatorBriefingCard({
  briefing,
  onOpenOperator,
}: {
  briefing: OperatorBriefing;
  onOpenOperator: () => void;
}) {
  return (
    <section className={`rounded-2xl border bg-gradient-to-br p-5 md:p-6 ${priorityStyle[briefing.priority]}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {briefing.notifyOperator && <Bell className="size-3.5 text-primary" />}
            Ringkasan untuk Operator Utama
          </p>
          <h2 className="mt-2 font-display text-xl font-bold">{briefing.headline}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{briefing.summary}</p>
          {briefing.notifyOperator && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Notifikasi dashboard aktif · penerima: Operator Utama (OP-UTAMA)
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenOperator}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-navy-foreground hover:opacity-90"
        >
          Operator Center <ChevronRight className="size-4" />
        </button>
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {briefing.actions.map((a) => (
          <li key={a} className="flex gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-2 text-sm">
            <span className="text-primary">→</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
