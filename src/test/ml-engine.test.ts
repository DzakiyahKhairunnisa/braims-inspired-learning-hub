import { describe, expect, it } from "vitest";
import { buildMlModelSnapshot, predictElevation } from "@/lib/ml-engine";
import type { Reading } from "@/lib/telemetry";

function series(level: number): Reading[] {
  const t0 = Date.now();
  return Array.from({ length: 8 }, (_, i) => ({
    t: t0 + i * 5000,
    level: level + i * 0.02,
    qin: 40,
    qout: 20,
    rain: 5,
    gate: 15,
  }));
}

describe("ml-engine baseline", () => {
  it("menghasilkan snapshot variabel dan turunan model", () => {
    const snap = buildMlModelSnapshot(series(114));
    expect(snap.valid).toBe(true);
    expect(snap.inputs.find((x) => x.symbol === "Z_t")?.value).toBeCloseTo(114.14, 1);
    expect(snap.derived.length).toBe(3);
  });

  it("memproyeksikan horizon sesuai panjang konfigurasi", () => {
    const fc = predictElevation(series(115));
    expect(fc.length).toBeGreaterThan(0);
    expect(fc[0]?.hoursAhead).toBe(1);
  });
});
