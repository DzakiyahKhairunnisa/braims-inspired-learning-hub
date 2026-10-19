import { describe, expect, it } from "vitest";
import { validateSensors } from "@/lib/sensor-validation";
import { SENGKALING_ASSET } from "@/lib/sengkaling-monitoring";

/** Regression: Monitoring tab SensorTable title must resolve asset code (was ReferenceError). */
describe("dashboard monitoring dependencies", () => {
  it("SENGKALING_ASSET tersedia untuk label sensor", () => {
    expect(SENGKALING_ASSET.code).toBe("BSK-SBW");
  });

  it("sensor records include location untuk tabel monitoring", () => {
    const v = validateSensors({
      t: Date.now(),
      level: 114,
      qin: 40,
      qout: 20,
      rain: 5,
      gate: 15,
    });
    expect(v.sensors.every((s) => s.location.length > 0)).toBe(true);
  });
});
