import { Bell } from "lucide-react";
import { markNotificationsRead, type DashboardNotification } from "@/lib/operator-workflow";
import { fmtDateTime } from "@/lib/telemetry";

export function NotificationBell({
  notifications,
  open,
  onToggle,
}: {
  notifications: DashboardNotification[];
  open: boolean;
  onToggle: () => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button type="button" className="relative" aria-label="Notifikasi" onClick={onToggle}>
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,24rem)] rounded-xl border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifikasi Operator</p>
            <button type="button" className="text-xs text-primary" onClick={() => markNotificationsRead()}>
              Tandai dibaca
            </button>
          </div>
          <ul className="max-h-80 space-y-2 overflow-auto">
            {notifications.slice(0, 12).map((n) => (
              <li key={n.id} className={`rounded-lg border p-3 text-xs ${n.read ? "border-border opacity-70" : "border-primary/40 bg-primary/5"}`}>
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-muted-foreground">{fmtDateTime(n.at)} · {n.status}</p>
                <p className="mt-2">{n.body}</p>
                <p className="mt-2 text-muted-foreground">Rekomendasi: {n.recommendation}</p>
                <p className="mt-1 text-[10px] text-primary">Penerima: {n.recipient}</p>
                <p className="mt-1 font-mono text-[10px]">{n.parameters}</p>
              </li>
            ))}
            {!notifications.length && <li className="py-4 text-center text-muted-foreground">Tidak ada notifikasi.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
