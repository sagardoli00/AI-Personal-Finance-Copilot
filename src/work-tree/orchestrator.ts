/**
 * Work tree: run multiple agents in parallel, then synthesize.
 * Single user — pass userId to fetch data and produce Copilot output.
 */

import type { UserFinancialContext } from "../types";
import type { AgentResult } from "../types";
import { fetchUserFinancialContext } from "../data/supabase";
import { runSpendingPatternsAgent } from "../agents/spending-patterns";
import { runOverspendingAgent } from "../agents/overspending-categories";
import { runMonthlyTrendsAgent } from "../agents/monthly-trends";
import { runSavingsConsistencyAgent } from "../agents/savings-consistency";
import {
  runSynthesizer,
  type CopilotOutput,
  type SynthesisInput,
} from "../agents/synthesizer";
import type { SpendingPatternsPayload } from "../agents/spending-patterns";
import type { OverspendingPayload } from "../agents/overspending-categories";
import type { MonthlyTrendsPayload } from "../agents/monthly-trends";
import type { SavingsConsistencyPayload } from "../agents/savings-consistency";

export interface WorkTreeResult {
  userId: string;
  output: CopilotOutput;
  context: UserFinancialContext;
  agentResults: {
    spending: AgentResult<SpendingPatternsPayload>;
    overspending: AgentResult<OverspendingPayload>;
    trends: AgentResult<MonthlyTrendsPayload>;
    savings: AgentResult<SavingsConsistencyPayload>;
  };
}

/**
 * Run the full work tree with pre-loaded context (e.g. mock data). No Supabase call.
 */
export function runWorkTreeWithContext(context: UserFinancialContext): WorkTreeResult {
  const [spending, overspending, trends, savings] = [
    runSpendingPatternsAgent(context),
    runOverspendingAgent(context),
    runMonthlyTrendsAgent(context),
    runSavingsConsistencyAgent(context),
  ];

  const output = runSynthesizer({
    spending,
    overspending,
    trends,
    savings,
    context: { monthlyIncome: context.monthlyIncome, expenses: context.expenses },
  });

  return {
    userId: context.userId,
    output,
    context,
    agentResults: { spending, overspending, trends, savings },
  };
}

/**
 * Run the full work tree: fetch data from Supabase, run all analysis agents in parallel, synthesize.
 */
export async function runWorkTree(userId: string): Promise<WorkTreeResult> {
  const context = await fetchUserFinancialContext(userId);

  return runWorkTreeWithContext(context);
}

/**
 * Format Copilot output as required: Summary, Key Insights, Risks, Actionable Suggestions.
 */
export function formatCopilotReport(output: CopilotOutput): string {
  const lines: string[] = [
    "## Summary",
    output.summary,
    "",
    "## Key Insights",
    ...output.keyInsights.map((i) => `- ${i}`),
    "",
    "## Risks / Warnings",
    ...output.risksWarnings.map((r) => `- ${r}`),
    "",
    "## Actionable Suggestions",
    ...output.actionableSuggestions.map((s) => `- ${s}`),
  ];
  return lines.join("\n");
}
