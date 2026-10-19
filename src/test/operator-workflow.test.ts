import { beforeEach, describe, expect, it } from "vitest";
import {
  applyWorkflowAction,
  clearOperatorDemoState,
  getOperatorState,
  sendManualOperatorMessage,
  syncRecommendations,
} from "@/lib/operator-workflow";

describe("Workflow operator", () => {
  beforeEach(() => {
    clearOperatorDemoState();
  });

  it("8. Operator menolak rekomendasi → alasan tersimpan di audit", () => {
    syncRecommendations(
      [
        {
          id: "REC-FEWS-TEST",
          system: "FEWS",
          priority: "sedang",
          title: "TEST",
          triggerParams: {},
          riskExplanation: "uji",
          recommendedAction: "uji",
          createdAt: Date.now(),
        },
      ],
      "WASPADA",
      "NORMAL",
    );
    applyWorkflowAction("REC-FEWS-TEST", "REJECT", "OP-BU-SENGKALING", "Data hujan diragukan");
    const { items, audit } = getOperatorState();
    expect(items[0]?.workflowStatus).toBe("ditolak");
    expect(audit.some((a) => a.action === "REJECT" && a.detail.includes("Data hujan"))).toBe(true);
  });

  it("mengirim pesan manual pantau/sesuaikan ke operator", () => {
    const ok = sendManualOperatorMessage({
      kind: "keduanya",
      sender: "Water Trip Control (WTC) — BWS NTB I",
      channel: "Dashboard (simulasi Tele-O)",
      tmaStatus: "waspada",
      elevationM: 114.5,
      subject: "Shift malam",
      pantauText: "WL-01\nRG-01",
      sesuaikanText: "Kurangi Qout irigasi",
    });
    expect(ok).toBe(true);
    const { manualMessages, notifications } = getOperatorState();
    expect(manualMessages[0]?.pantau).toHaveLength(2);
    expect(notifications[0]?.manual).toBe(true);
  });

  it("9. Operator menyetujui rekomendasi → status disetujui", () => {
    syncRecommendations(
      [
        {
          id: "REC-DEWS-TEST",
          system: "DEWS",
          priority: "sedang",
          title: "TEST2",
          triggerParams: {},
          riskExplanation: "uji",
          recommendedAction: "uji",
          createdAt: Date.now(),
        },
      ],
      "NORMAL",
      "WASPADA",
    );
    applyWorkflowAction("REC-DEWS-TEST", "APPROVE", "OP-BU-SENGKALING");
    expect(getOperatorState().items[0]?.workflowStatus).toBe("disetujui");
  });
});
