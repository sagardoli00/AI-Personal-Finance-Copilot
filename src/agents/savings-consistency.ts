/**
 * Agent: Evaluate savings goals and consistency.
 */

import type { UserFinancialContext } from "../types";
import type { AgentResult } from "../types";

export interface SavingsConsistencyPayload {
  goals: {
    name: string;
    target_amount: number;
    current_amount: number;
    progressPct: number;
    remaining: number;
    deadline?: string;
  }[];
  totalTarget: number;
  totalCurrent: number;
  overallProgressPct: number;
  onTrackGoals: string[];
  behindGoals: string[];
  completedGoals: string[];
}

export function runSavingsConsistencyAgent(
  ctx: UserFinancialContext
): AgentResult<SavingsConsistencyPayload> {
  try {
    const { savingsGoals } = ctx;
    if (!savingsGoals.length) {
      return {
        agentId: "savings-consistency",
        payload: {
          goals: [],
          totalTarget: 0,
          totalCurrent: 0,
          overallProgressPct: 0,
          onTrackGoals: [],
          behindGoals: [],
          completedGoals: [],
        },
      };
    }

    const goals = savingsGoals.map((g) => {
      const target = Number(g.target_amount) || 0;
      const current = Number(g.current_amount) || 0;
      const progressPct = target > 0 ? (current / target) * 100 : 0;
      const remaining = Math.max(0, target - current);
      return {
        name: g.name,
        target_amount: target,
        current_amount: current,
        progressPct,
        remaining,
        deadline: g.deadline,
      };
    });

    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
    const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
    const overallProgressPct =
      totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    const completedGoals = goals.filter((g) => g.progressPct >= 100).map((g) => g.name);
    const behindGoals = goals
      .filter((g) => g.progressPct < 100 && g.deadline)
      .map((g) => g.name);
    const onTrackGoals = goals
      .filter((g) => g.progressPct < 100 && g.progressPct > 0)
      .map((g) => g.name);

    return {
      agentId: "savings-consistency",
      payload: {
        goals,
        totalTarget,
        totalCurrent,
        overallProgressPct,
        onTrackGoals,
        behindGoals,
        completedGoals,
      },
    };
  } catch (err) {
    return {
      agentId: "savings-consistency",
      payload: {} as SavingsConsistencyPayload,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
