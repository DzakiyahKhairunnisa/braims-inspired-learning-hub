import { Bell, ChevronRight } from "lucide-react";
import type { OperatorBriefing } from "@/lib/operation-pipeline";
import type { OperatorRequestPayload } from "@/lib/operator-requests";
import { OperatorRequestLists } from "@/components/dashboard/OperatorRequestLists";
import { SENGKALING_ASSET } from "@/lib/sengkaling-monitoring";

const priorityStyle: Record<OperatorBriefing["priority"], string> = {
  normal: "from-emerald-50 to-white border-emerald-200",
  sedang: "from-amber-50 to-white border-amber-200",
  tinggi: "from-orange-50 to-white border-orange-200",
  kritis: "from-red-50 to-white border-red-200",
};

export function OperatorBriefingCard({
  briefing,
  dispatch,
  onOpenOperator,
}: {
  briefing: OperatorBriefing;
  dispatch: OperatorRequestPayload;
  onOpenOperator: () => void;
}) {
  return (
    <section className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm md:p-6 ${priorityStyle[briefing.priority]}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {briefing.notifyOperator && <Bell className="size-3.5 text-primary" />}
            Ringkasan — {SENGKALING_ASSET.code}
          </p>
          <h2 className="mt-2 font-display text-xl font-bold">{briefing.headline}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{briefing.summary}</p>
          {briefing.notifyOperator && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Notifikasi aktif · {SENGKALING_ASSET.operatorBu}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenOperator}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          Operator Center <ChevronRight className="size-4" />
        </button>
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">{dispatch.ringkasan}</p>
      <div className="mt-4">
        <OperatorRequestLists payload={dispatch} />
      </div>
    </section>
  );
}
