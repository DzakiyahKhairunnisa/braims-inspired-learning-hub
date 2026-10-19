import { Eye, SlidersHorizontal } from "lucide-react";
import type { OperatorRequestPayload } from "@/lib/operator-requests";

export function OperatorRequestLists({
  payload,
  compact,
}: {
  payload: OperatorRequestPayload;
  compact?: boolean;
}) {
  if (!payload.pantau.length && !payload.sesuaikan.length) return null;

  return (
    <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
      <ListBox
        icon={Eye}
        title="Pantau"
        subtitle="Yang harus diperiksa Operator BU"
        items={payload.pantau}
        tone="sky"
      />
      <ListBox
        icon={SlidersHorizontal}
        title="Sesuaikan"
        subtitle="Penyesuaian operasi (setujui/tolak di Operator Center)"
        items={payload.sesuaikan}
        tone="amber"
      />
    </div>
  );
}

function ListBox({
  icon: Icon,
  title,
  subtitle,
  items,
  tone,
}: {
  icon: typeof Eye;
  title: string;
  subtitle: string;
  items: string[];
  tone: "sky" | "amber";
}) {
  const bg = tone === "sky" ? "bg-sky-50 border-sky-200" : "bg-amber-50 border-amber-200";
  const iconCls = tone === "sky" ? "text-sky-600" : "text-amber-700";
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${iconCls}`}>
        <Icon className="size-4" />
        {title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={item} className="flex gap-2 text-sm text-foreground">
            <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(97 + i)}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
