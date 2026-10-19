import { CloudRain, Droplets, Radio, Shield } from "lucide-react";
import { statusBadgeClass } from "@/lib/rule-engine";
import type { FewsStatus, DewsStatus } from "@/lib/rule-engine";
import { LEVELS } from "@/lib/dam-data";
import { SENGKALING_ASSET } from "@/lib/sengkaling-monitoring";

export function OverviewStatusHero({
  fews,
  dews,
  dataOk,
  level,
}: {
  fews: FewsStatus;
  dews: DewsStatus;
  dataOk: boolean;
  level?: number;
}) {
  const cards = [
    {
      icon: CloudRain,
      title: "FEWS",
      value: fews,
      hint: "Peringatan banjir & ruang tampungan",
      cls: statusBadgeClass(fews),
    },
    {
      icon: Droplets,
      title: "DEWS",
      value: dews,
      hint: "Peringatan kekeringan & alokasi air",
      cls: statusBadgeClass(dews),
    },
    {
      icon: Radio,
      title: "Data ADAS",
      value: dataOk ? "VALID" : "TIDAK VALID",
      hint: dataOk ? "Input FEWS/DEWS & ML BSK-SBW" : `${SENGKALING_ASSET.operatorBuId} verifikasi WL-01`,
      cls: dataOk ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
    },
    {
      icon: Shield,
      title: "Muka air",
      value: level !== undefined ? `+${level.toFixed(2)} m` : "—",
      hint: `NWL +${LEVELS.NWL} m · FEWS +${LEVELS.FEWS} m`,
      cls: "bg-water/30 text-foreground",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-card transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <c.icon className="size-5 text-primary" />
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c.cls}`}>{c.value}</span>
          </div>
          <p className="mt-4 font-display text-sm font-semibold">{c.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
