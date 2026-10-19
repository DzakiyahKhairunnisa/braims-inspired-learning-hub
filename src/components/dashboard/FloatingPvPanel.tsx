import { Sun, Waves, Zap } from "lucide-react";
import { FLOATING_PV, type FpvOpsView } from "@/lib/floating-pv";
import { INTAKE } from "@/lib/dam-data";

const statusColor: Record<FpvOpsView["status"], string> = {
  produksi: "text-success",
  pantau: "text-warning",
  kurangi: "text-orange-400",
  henti_sementara: "text-destructive",
};

export function FloatingPvPanel({ ops, level }: { ops: FpvOpsView; level?: number }) {
  const hydro = INTAKE.powerMw;
  const totalDemo = ops.outputMw + (ops.outputMw > 0 ? hydro * 0.85 : 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative bg-gradient-to-r from-amber-500/25 via-sky-500/20 to-primary/15 px-5 py-6 md:px-8">
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
              <Sun className="size-4 text-amber-500" />
              PLTS Terapung (FPV)
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">{FLOATING_PV.capacityMwP} MWp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {FLOATING_PV.areaHa} ha · {FLOATING_PV.sharePercent}% dari luas waduk {FLOATING_PV.reservoirAreaHa} ha
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 backdrop-blur">
            <p className="text-xs text-muted-foreground">Status operasi (simulasi)</p>
            <p className={`mt-1 font-display text-lg font-bold ${statusColor[ops.status]}`}>{ops.label}</p>
            {level !== undefined && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">Muka air +{level.toFixed(2)} m</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
        <Metric icon={Zap} label="Output FPV (demo)" value={`${ops.outputMw.toFixed(1)} MW`} sub={`Kapasitas ${ops.utilizationPct}%`} />
        <Metric icon={Waves} label="PLTA rancangan" value={`±${hydro} MW`} sub="Menara intake +95 m" />
        <Metric icon={Sun} label="Energi hibrida (demo)" value={`${totalDemo.toFixed(1)} MW`} sub="FPV + PLTA saat produksi" />
      </div>

      <div className="border-t border-border px-5 py-4 md:px-6">
        <p className="text-sm text-muted-foreground">{ops.detail}</p>
        <ul className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
          {FLOATING_PV.notes.map((n) => (
            <li key={n} className="rounded-lg bg-muted/50 px-3 py-2">{n}</li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border bg-muted/30 px-5 py-3 md:px-6">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-sky-500 transition-all duration-700"
            style={{ width: `${Math.min(100, (FLOATING_PV.areaHa / FLOATING_PV.reservoirAreaHa) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Proporsi area FPV pada permukaan waduk (rancangan)
        </p>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export function FloatingPvCompact({ ops, onClick }: { ops: FpvOpsView; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-sky-500/10 p-4 text-left transition hover:border-amber-500/50"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Floating PV</p>
        <p className="mt-1 font-display text-lg font-bold">{FLOATING_PV.capacityMwP} MWp</p>
        <p className={`text-sm font-medium ${statusColor[ops.status]}`}>{ops.label}</p>
      </div>
      <p className="font-mono text-2xl font-bold text-amber-600 group-hover:scale-105 transition">{ops.outputMw.toFixed(0)}<span className="text-sm"> MW</span></p>
    </button>
  );
}
