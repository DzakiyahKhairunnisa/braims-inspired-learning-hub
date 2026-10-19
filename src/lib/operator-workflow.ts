import type { OperationalRecommendation } from "./rule-engine";

export type WorkflowStatus =
  | "baru"
  | "diakui"
  | "data_diverifikasi"
  | "disetujui"
  | "ditolak"
  | "dijalankan"
  | "hasil_diverifikasi";

export interface OperatorActionItem extends OperationalRecommendation {
  workflowStatus: WorkflowStatus;
  operatorId: string;
  decisionNote: string;
  updatedAt: number;
}

export interface AuditLogEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
  detail: string;
  recommendationId?: string;
}

export interface DashboardNotification {
  id: string;
  at: number;
  title: string;
  body: string;
  status: string;
  parameters: string;
  recommendation: string;
  recipient: string;
  followUp: WorkflowStatus | "—";
  read: boolean;
}

const STORAGE_KEY = "sengkaling-operator-state";

export interface OperatorState {
  items: OperatorActionItem[];
  audit: AuditLogEntry[];
  notifications: DashboardNotification[];
}

function loadState(): OperatorState {
  if (typeof window === "undefined") return { items: [], audit: [], notifications: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], audit: [], notifications: [] };
    return JSON.parse(raw) as OperatorState;
  } catch {
    return { items: [], audit: [], notifications: [] };
  }
}

function saveState(state: OperatorState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
const listeners = new Set<() => void>();

export function subscribeOperatorState(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  saveState(state);
  listeners.forEach((l) => l());
}

export function getOperatorState(): OperatorState {
  return state;
}

function audit(actor: string, action: string, detail: string, recommendationId?: string) {
  state.audit.unshift({
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    actor,
    action,
    detail,
    recommendationId,
  });
  if (state.audit.length > 200) state.audit = state.audit.slice(0, 200);
}

export function syncRecommendations(recs: OperationalRecommendation[], fews: string, dews: string) {
  const now = Date.now();
  for (const r of recs) {
    const exists = state.items.find((i) => i.id === r.id);
    if (!exists) {
      const item: OperatorActionItem = {
        ...r,
        workflowStatus: "baru",
        operatorId: "OP-UTAMA",
        decisionNote: "",
        updatedAt: now,
      };
      state.items.unshift(item);
      const notif: DashboardNotification = {
        id: `NTF-${r.id}`,
        at: r.createdAt,
        title: r.title,
        body: r.riskExplanation,
        status: r.system === "FEWS" ? fews : r.system === "DEWS" ? dews : r.priority,
        parameters: Object.entries(r.triggerParams)
          .map(([k, v]) => `${k}=${v}`)
          .join(", "),
        recommendation: r.recommendedAction,
        recipient: "Operator Utama",
        followUp: "baru",
        read: false,
      };
      state.notifications.unshift(notif);
    }
  }
  if (state.items.length > 50) state.items = state.items.slice(0, 50);
  if (state.notifications.length > 50) state.notifications = state.notifications.slice(0, 50);
  emit();
}

export function markNotificationsRead() {
  state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
  emit();
}

type WorkflowAction =
  | "ACKNOWLEDGE"
  | "VERIFY_DATA"
  | "APPROVE"
  | "REJECT"
  | "MARK_EXECUTED"
  | "VERIFY_RESULT";

const nextStatus: Record<WorkflowAction, WorkflowStatus> = {
  ACKNOWLEDGE: "diakui",
  VERIFY_DATA: "data_diverifikasi",
  APPROVE: "disetujui",
  REJECT: "ditolak",
  MARK_EXECUTED: "dijalankan",
  VERIFY_RESULT: "hasil_diverifikasi",
};

export function applyWorkflowAction(
  recommendationId: string,
  action: WorkflowAction,
  actor = "OP-UTAMA",
  note = "",
) {
  const item = state.items.find((i) => i.id === recommendationId);
  if (!item) return;
  item.workflowStatus = nextStatus[action];
  item.updatedAt = Date.now();
  if (note) item.decisionNote = note;
  audit(actor, action, note || `Status → ${item.workflowStatus}`, recommendationId);
  const n = state.notifications.find((x) => x.id === `NTF-${recommendationId}`);
  if (n) n.followUp = item.workflowStatus;
  emit();
}

export function clearOperatorDemoState() {
  state = { items: [], audit: [], notifications: [] };
  emit();
}
