import { WTC_INSTRUCTION, formatInstructionRef, type TmaStatusId } from "./wtc-instructions";
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
  pantau: string[];
  sesuaikan: string[];
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
  pantau: string[];
  sesuaikan: string[];
  /** Pesan manual dari pengawas / engineer */
  manual?: boolean;
  sender?: string;
  messageKind?: ManualMessageKind;
}

export type ManualMessageKind = "pantau" | "sesuaikan" | "keduanya";

export interface ManualOperatorMessage {
  id: string;
  at: number;
  kind: ManualMessageKind;
  sender: string;
  subject: string;
  pantau: string[];
  sesuaikan: string[];
  recipient: string;
  read: boolean;
  instructionRef: string;
  tmaStatus: TmaStatusId;
  elevationM?: number;
  channel: string;
}

export interface OperatorState {
  items: OperatorActionItem[];
  audit: AuditLogEntry[];
  notifications: DashboardNotification[];
  manualMessages: ManualOperatorMessage[];
}

const STORAGE_KEY = "sengkaling-operator-state";

function loadState(): OperatorState {
  if (typeof window === "undefined") return { items: [], audit: [], notifications: [], manualMessages: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], audit: [], notifications: [], manualMessages: [] };
    const parsed = JSON.parse(raw) as OperatorState & {
      manualMessages?: (ManualOperatorMessage & { dirtoRef?: string })[];
    };
    const manualMessages = (parsed.manualMessages ?? []).map((m) => ({
      ...m,
      instructionRef: m.instructionRef ?? m.dirtoRef ?? "",
    }));
    return { ...parsed, manualMessages };
  } catch {
    return { items: [], audit: [], notifications: [], manualMessages: [] };
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

export function syncRecommendations(
  recs: OperationalRecommendation[],
  fews: string,
  dews: string,
  tasks?: { id: string; pantau: string[]; sesuaikan: string[] }[],
) {
  const now = Date.now();
  for (const r of recs) {
    const exists = state.items.find((i) => i.id === r.id);
    if (!exists) {
      const task = tasks?.find((t) => t.id === r.id);
      const item: OperatorActionItem = {
        ...r,
        workflowStatus: "baru",
        operatorId: WTC_INSTRUCTION.recipientId,
        decisionNote: "",
        updatedAt: now,
        pantau: task?.pantau ?? [],
        sesuaikan: task?.sesuaikan ?? [],
      };
      state.items.unshift(item);
      const notif: DashboardNotification = {
        id: `NTF-${r.id}`,
        at: r.createdAt,
        title: `Operator BU · ${r.system} — ${r.title}`,
        body: r.riskExplanation,
        status: r.system === "FEWS" ? fews : r.system === "DEWS" ? dews : r.priority,
        parameters: Object.entries(r.triggerParams)
          .map(([k, v]) => `${k}=${v}`)
          .join(", "),
        recommendation: r.recommendedAction,
        recipient: WTC_INSTRUCTION.recipientLabel,
        followUp: "baru",
        read: false,
        pantau: task?.pantau ?? [],
        sesuaikan: task?.sesuaikan ?? [],
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
  actor = WTC_INSTRUCTION.recipientId,
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
  state = { items: [], audit: [], notifications: [], manualMessages: [] };
  emit();
}

function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function sendManualOperatorMessage(input: {
  kind: ManualMessageKind;
  sender: string;
  subject: string;
  pantauText: string;
  sesuaikanText: string;
  tmaStatus: TmaStatusId;
  elevationM?: number;
  channel: string;
}): boolean {
  const pantau = input.kind === "sesuaikan" ? [] : linesToList(input.pantauText);
  const sesuaikan = input.kind === "pantau" ? [] : linesToList(input.sesuaikanText);

  if (input.kind === "pantau" && pantau.length === 0) return false;
  if (input.kind === "sesuaikan" && sesuaikan.length === 0) return false;
  if (input.kind === "keduanya" && pantau.length === 0 && sesuaikan.length === 0) return false;

  const at = Date.now();
  const id = `MSG-MANUAL-${at}`;
  const instructionRef = formatInstructionRef(at);
  const recipient = WTC_INSTRUCTION.recipientLabel;

  const msg: ManualOperatorMessage = {
    id,
    at,
    kind: input.kind,
    sender: input.sender.trim() || WTC_INSTRUCTION.senderRoles[0],
    subject: input.subject.trim() || "Instruksi operasi real-time",
    pantau,
    sesuaikan,
    recipient,
    read: false,
    instructionRef,
    tmaStatus: input.tmaStatus,
    elevationM: input.elevationM,
    channel: input.channel,
  };

  state.manualMessages.unshift(msg);
  if (state.manualMessages.length > 80) state.manualMessages = state.manualMessages.slice(0, 80);

  const kindLabel =
    input.kind === "pantau" ? "PANTAU" : input.kind === "sesuaikan" ? "SESUAIKAN" : "PANTAU & SESUAIKAN";

  const tmaLabel = input.tmaStatus.toUpperCase();
  const elev = input.elevationM != null ? ` · TMA +${input.elevationM.toFixed(2)} m` : "";

  state.notifications.unshift({
    id: `NTF-${id}`,
    at,
    title: `Instruksi WTC — ${kindLabel}`,
    body: `Ref ${instructionRef} · ${input.channel} dari ${msg.sender}. Status TMA: ${tmaLabel}${elev}. Operator BU wajib pantau/sesuaikan lalu konfirmasi eksekusi.`,
    status: `${tmaLabel} · ${kindLabel}`,
    parameters: `ref=${instructionRef}`,
    recommendation: "Eksekusi instruksi secara real-time; laporkan hasil di Operator Center (ACK → VERIFY → EXECUTED).",
    recipient,
    followUp: "baru",
    read: false,
    pantau,
    sesuaikan,
    manual: true,
    sender: msg.sender,
    messageKind: input.kind,
  });
  if (state.notifications.length > 80) state.notifications = state.notifications.slice(0, 80);

  const manualItem: OperatorActionItem = {
    id,
    system: "DATA",
    priority: "sedang",
    title: msg.subject,
    triggerParams: { ref: instructionRef, TMA: tmaLabel, pengirim: msg.sender },
    riskExplanation: `Instruksi WTC (${kindLabel}) — status TMA ${tmaLabel}.`,
    recommendedAction: "Eksekusi instruksi WTC; konfirmasi di workflow (tanpa kendali aktuator otomatis).",
    createdAt: at,
    workflowStatus: "baru",
    operatorId: WTC_INSTRUCTION.recipientId,
    decisionNote: "",
    updatedAt: at,
    pantau,
    sesuaikan,
  };
  state.items.unshift(manualItem);
  if (state.items.length > 80) state.items = state.items.slice(0, 80);

  audit(msg.sender, "INSTRUKSI_WTC", `${instructionRef} ${kindLabel}: ${msg.subject}`, id);
  emit();
  return true;
}
