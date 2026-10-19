import { useEffect, useState } from "react";
import { storageAt, LEVELS } from "./dam-data";

// Adapter layer: swap `simulatedSource` with a real API/MQTT source later.
export type Reading = { t: number; level: number; qin: number; qout: number; rain: number; gate: number };

export interface TelemetrySource {
  name: string;
  live: boolean;
  history(hours: number, points: number): Reading[];
  next(prev: Reading): Reading;
}

function sample(t: number): Reading {
  const h = t / 3_600_000;
  const rain = Math.max(0, 12 * Math.sin(h / 5) + 6 * Math.sin(h / 1.3) - 4);
  const qin = 38 + rain * 4.2 + 8 * Math.sin(h / 9);
  const level = 114.2 + 2.1 * Math.sin(h / 30) + 0.6 * Math.sin(h / 6);
  const gate = level >= LEVELS.FEWS ? Math.min(100, 20 + (level - LEVELS.FEWS) * 18) : 12;
  const qout = 6 + gate * 0.9;
  return { t, level, qin, qout, rain, gate };
}

export const simulatedSource: TelemetrySource = {
  name: "Simulator (Demo)",
  live: false,
  history(hours, points) {
    const now = Date.now();
    const step = (hours * 3_600_000) / points;
    return Array.from({ length: points }, (_, i) => sample(now - (points - 1 - i) * step));
  },
  next() {
    return sample(Date.now());
  },
};

export function useTelemetry(hours: number, source: TelemetrySource = simulatedSource) {
  const [data, setData] = useState<Reading[]>([]);
  useEffect(() => {
    setData(source.history(hours, 96));
    const id = setInterval(() => {
      setData((d) => (d.length ? [...d.slice(1), source.next(d[d.length - 1])] : d));
    }, 5000);
    return () => clearInterval(id);
  }, [hours, source]);
  const current = data[data.length - 1];
  const prev = data[data.length - 5];
  const trend = current && prev ? current.level - prev.level : 0;
  return { data, current, trend, storage: current ? storageAt(current.level) : 0, source };
}

export const fmtTime = (t: number) =>
  new Date(t).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
