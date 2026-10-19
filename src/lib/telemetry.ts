import { useEffect, useState, useSyncExternalStore } from "react";
import { storageAt, LEVELS } from "./dam-data";
import { TELEMETRY_SOURCE_LABEL } from "./sengkaling-monitoring";
import { getActiveScenario, sampleForScenario, setActiveScenario, type SimScenarioId } from "./simulation-scenarios";

// Adapter layer: swap `simulatedSource` with a real API/MQTT source later.
export type Reading = { t: number; level: number; qin: number; qout: number; rain: number; gate: number };

export interface TelemetrySource {
  name: string;
  live: boolean;
  history(hours: number, points: number): Reading[];
  next(prev?: Reading): Reading;
}

function sample(t: number): Reading {
  return sampleForScenario(t, getActiveScenario());
}

export const simulatedSource: TelemetrySource = {
  name: TELEMETRY_SOURCE_LABEL,
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

// Scenario change bus (simple pub/sub for React)
const scenarioListeners = new Set<() => void>();

export function subscribeScenarioStore(cb: () => void) {
  scenarioListeners.add(cb);
  return () => scenarioListeners.delete(cb);
}

export function changeSimulationScenario(id: SimScenarioId) {
  setActiveScenario(id);
  scenarioListeners.forEach((l) => l());
}

export function useSimulationScenario(): SimScenarioId {
  return useSyncExternalStore(subscribeScenarioStore, getActiveScenario, () => "default" as SimScenarioId);
}

export function useTelemetry(hours: number, source: TelemetrySource = simulatedSource) {
  const scenario = useSimulationScenario();
  const [data, setData] = useState<Reading[]>([]);

  useEffect(() => {
    setData(source.history(hours, 96));
    const id = setInterval(() => {
      setData((d) => (d.length ? [...d.slice(1), source.next(d.at(-1))] : d));
    }, 5000);
    return () => clearInterval(id);
  }, [hours, source, scenario]);

  const current = data[data.length - 1];
  const prev = data[data.length - 5];
  const trend = current && prev ? current.level - prev.level : 0;
  const dhdt = trend / 4;
  return {
    data,
    current,
    trend,
    dhdt,
    storage: current ? storageAt(current.level) : 0,
    source,
    scenario,
  };
}

export const fmtTime = (t: number) =>
  new Date(t).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });

export const fmtDateTime = (t: number) =>
  new Date(t).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
