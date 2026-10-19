import { DEVELOPMENT_ROADMAP, DIGITAL_TWIN_POSITIONING } from "@/lib/development-roadmap";

const statusStyle = {
  berjalan: "bg-success/15 text-success",
  rencana: "bg-sky-100 text-sky-800",
  visi: "bg-violet-100 text-violet-800",
} as const;

export function DevelopmentRoadmap({ compact }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Rencana pengembangan</p>
      <h2 className="mt-2 text-xl font-bold md:text-2xl">{DIGITAL_TWIN_POSITIONING.headline}</h2>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{DIGITAL_TWIN_POSITIONING.intro}</p>

      <ol className={`mt-8 space-y-4 ${compact ? "" : "md:space-y-6"}`}>
        {DEVELOPMENT_ROADMAP.map((step, i) => (
          <li
            key={step.id}
            className="relative rounded-xl border border-border bg-muted/30 p-4 md:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[step.status]}`}>
                {step.phase}
              </span>
              <h3 className="font-display text-base font-semibold">{step.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.summary}</p>
            {!compact && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {step.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
