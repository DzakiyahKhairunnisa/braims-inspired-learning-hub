import { LEVELS } from "@/lib/dam-data";

const MIN = 98;
const MAX = 128;
const pct = (z: number) => ((z - MIN) / (MAX - MIN)) * 100;

const markers = [
  { z: LEVELS.CREST, label: "Puncak +127,05", cls: "border-foreground/60" },
  { z: LEVELS.HWL, label: "HWL/FWL +123", cls: "border-destructive" },
  { z: LEVELS.NWL, label: "NWL +119", cls: "border-success" },
  { z: LEVELS.FEWS, label: "FEWS trigger +113", cls: "border-warning" },
  { z: LEVELS.LWL, label: "LWL +101", cls: "border-muted-foreground" },
];

export function ReservoirGauge({ level }: { level?: number | undefined }) {
  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-border bg-muted/40">
      {level !== undefined && (
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/70 to-primary/25 transition-all duration-1000"
          style={{ height: `${pct(level)}%` }}
        >
          <div className="absolute -top-px left-0 right-0 h-0.5 bg-primary" />
          <span className="absolute -top-7 left-3 rounded bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
            +{level.toFixed(2)} m
          </span>
        </div>
      )}
      {markers.map((m) => (
        <div key={m.label} className={`absolute inset-x-0 border-t border-dashed ${m.cls}`} style={{ bottom: `${pct(m.z)}%` }}>
          <span className="absolute right-2 -top-5 font-mono text-[11px] text-foreground/80">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
