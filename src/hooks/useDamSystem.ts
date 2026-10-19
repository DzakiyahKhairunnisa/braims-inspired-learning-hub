import { useEffect, useMemo, useSyncExternalStore } from "react";
import { predictElevation, assessMlRisk } from "@/lib/ml-engine";
import { evaluateRules } from "@/lib/rule-engine";
import { validateSensors } from "@/lib/sensor-validation";
import { operatorTasksForRecommendation, operatorRoutineDispatch } from "@/lib/operator-requests";
import { getOperatorState, subscribeOperatorState, syncRecommendations } from "@/lib/operator-workflow";
import { scenarioFlags, type SimScenarioId } from "@/lib/simulation-scenarios";
import type { Reading } from "@/lib/telemetry";

export function useOperatorStore() {
  return useSyncExternalStore(subscribeOperatorState, getOperatorState, () => ({
    items: [],
    audit: [],
    notifications: [],
    manualMessages: [],
  }));
}

export function useDamSystem(
  data: Reading[],
  current: Reading | undefined,
  dhdt: number,
  scenario: SimScenarioId,
) {
  const flags = scenarioFlags(scenario);

  const validation = useMemo(
    () => validateSensors(current, flags),
    [current, flags.forceWlOffline, flags.seepageAnomaly, flags.structureAlert],
  );

  const forecast = useMemo(() => predictElevation(data), [data]);
  const ml = useMemo(() => assessMlRisk(data, forecast), [data, forecast]);

  const rules = useMemo(
    () => evaluateRules(current, dhdt, validation, ml, forecast),
    [current, dhdt, validation, ml, forecast],
  );

  const operatorDispatch = useMemo(() => {
    if (rules.recommendations.length) {
      const primary = rules.recommendations[0]!;
      const tasks = operatorTasksForRecommendation(primary, rules.fews, rules.dews);
      return tasks;
    }
    return operatorRoutineDispatch(rules.fews, rules.dews);
  }, [rules.recommendations, rules.fews, rules.dews]);

  const recKey = rules.recommendations.map((r) => r.id).join("|");
  useEffect(() => {
    const tasks = rules.recommendations.map((r) => {
      const t = operatorTasksForRecommendation(r, rules.fews, rules.dews);
      return { id: r.id, pantau: t.pantau, sesuaikan: t.sesuaikan };
    });
    if (rules.recommendations.length) {
      syncRecommendations(rules.recommendations, rules.fews, rules.dews, tasks);
    }
  }, [recKey, rules.fews, rules.dews, rules.recommendations]);

  return { validation, forecast, ml, rules, operatorDispatch };
}
