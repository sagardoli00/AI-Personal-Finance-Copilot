/**
 * Agent: Synthesize results into personal, actionable advice.
 * Data-only. "You" language: where you're spending more, how to save money.
 */

import type { AgentResult } from "../types";
import type { SpendingPatternsPayload } from "./spending-patterns";
import type { OverspendingPayload } from "./overspending-categories";
import type { MonthlyTrendsPayload } from "./monthly-trends";
import type { SavingsConsistencyPayload } from "./savings-consistency";

export interface CopilotOutput {
  summary: string;
  keyInsights: string[];
  risksWarnings: string[];
  actionableSuggestions: string[];
}

export interface SynthesisInput {
  spending: AgentResult<SpendingPatternsPayload>;
  overspending: AgentResult<OverspendingPayload>;
  trends: AgentResult<MonthlyTrendsPayload>;
  savings: AgentResult<SavingsConsistencyPayload>;
  context?: { monthlyIncome: { amount: unknown }[]; expenses: { amount: unknown }[] };
}

export function runSynthesizer(input: SynthesisInput): CopilotOutput {
  const insights: string[] = [];
  const risks: string[] = [];
  const suggestions: string[] = [];

  // ---- Income, expenses, net — always from raw context for accuracy ----
  const totalIncome = input.context
    ? input.context.monthlyIncome.reduce((s, x) => s + Number(x.amount || 0), 0)
    : !input.trends.error && input.trends.payload?.incomeTrend
      ? input.trends.payload.incomeTrend.reduce((s, x) => s + Number(x.amount || 0), 0)
      : 0;
  const totalExpenses = input.context
    ? input.context.expenses.reduce((s, x) => s + Number(x.amount || 0), 0)
    : !input.spending.error && input.spending.payload?.overallTotal != null
      ? Number(input.spending.payload.overallTotal)
      : 0;
  const net = totalIncome - totalExpenses;
  insights.push(
    `Total income: ${formatMoney(totalIncome)}. Total expenses: ${formatMoney(totalExpenses)}. Net (money in hand): ${formatMoney(net)}.`
  );

  // ---- Spending ----
  if (input.spending.error) {
    insights.push(`Spending data unavailable (${input.spending.error}).`);
  } else {
    const p = input.spending.payload;
    if (p.overallTotal > 0) {
      insights.push(
        `You spent ${formatMoney(p.overallTotal)} over ${p.monthCount} month(s).`
      );
      if (p.totalByCategory.length) {
        const top = p.totalByCategory.sort((a, b) => b.total - a.total).slice(0, 3);
        insights.push(
          `Your top spending: ${top.map((t) => `${t.category} ${formatMoney(t.total)}`).join(" → ")}.`
        );
      }
    } else {
      insights.push("No expense data yet. Add your expenses to get advice.");
    }
  }

  // ---- Where you're spending more (highest month) ----
  if (!input.trends.error && input.trends.payload.expenseTrend.length > 0) {
    const trend = input.trends.payload.expenseTrend;
    const highest = trend.reduce((a, b) => (b.total > a.total ? b : a), trend[0]);
    const lowest = trend.reduce((a, b) => (b.total < a.total ? b : a), trend[0]);
    if (highest.month !== lowest.month) {
      insights.push(
        `You spent the most in ${monthName(highest.month)} (${formatMoney(highest.total)}) and the least in ${monthName(lowest.month)} (${formatMoney(lowest.total)}).`
      );
    }
  }

  // ---- Overspending vs income ----
  if (input.overspending.error) {
    // skip
  } else {
    const o = input.overspending.payload;
    if (o.overIncomeMonths.length) {
      risks.push(
        `You spent more than you earned in ${o.overIncomeMonths.map(monthName).join(", ")}. That drains savings.`
      );
      suggestions.push(
        "Cut discretionary spending (e.g. Entertainment, eating out) in high-spend months so you don’t exceed income."
      );
    }
    if (o.topCategoriesByShare.length) {
      const top = o.topCategoriesByShare[0];
      if (top && top.avgShareOfIncome > 30) {
        suggestions.push(
          `${top.category} is taking ${top.avgShareOfIncome.toFixed(0)}% of your income. Look for cuts there first (subscriptions, habits, one-offs).`
        );
      }
    }
  }

  // ---- Savings rate ----
  if (!input.trends.error && input.trends.payload.savingsRateByMonth.length) {
    const t = input.trends.payload;
    const negative = t.savingsRateByMonth.filter((s) => s.ratePct < 0);
    if (negative.length) {
      risks.push(
        `You had no savings (spent more than income) in ${negative.map((s) => monthName(s.month)).join(", ")}.`
      );
    }
    const avgRate =
      t.savingsRateByMonth.reduce((a, s) => a + s.ratePct, 0) / t.savingsRateByMonth.length;
    insights.push(
      `Your average savings rate is ${avgRate.toFixed(0)}%. ${avgRate < 20 ? "Aim to save at least 20% to build a safety net." : "Good base to build on."}`
    );
  }

  // ---- How to save money: category to cut ----
  if (!input.spending.error && input.spending.payload.totalByCategory.length > 0) {
    const cats = input.spending.payload.totalByCategory
      .sort((a, b) => b.total - a.total)
      .filter((c) => c.category.toLowerCase() !== "rent");
    if (cats.length > 0) {
      const toCut = cats[0];
      suggestions.push(
        `To save money, trim ${toCut.category} first (you spent ${formatMoney(toCut.total)}). Small cuts add up.`
      );
    }
  }

  // ---- Goals ----
  if (input.savings.error) {
    // skip
  } else {
    const s = input.savings.payload;
    if (s.goals.length) {
      insights.push(
        `Your goal: ${s.goals.map((g) => g.name).join(", ")} — ${s.overallProgressPct.toFixed(0)}% done (${formatMoney(s.totalCurrent)} of ${formatMoney(s.totalTarget)}).`
      );
      if (s.behindGoals.length) {
        risks.push(
          `You’re behind on: ${s.behindGoals.join(", ")}. Start or increase monthly contributions.`
        );
      }
      if (s.totalCurrent === 0 && s.totalTarget > 0 && s.goals.some((g) => g.deadline)) {
        const goal = s.goals.find((g) => g.deadline);
        const monthsLeft = goal?.deadline
          ? Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
          : 6;
        const monthlyNeeded = Math.round(s.totalTarget / monthsLeft);
        suggestions.push(
          `How to save for ${s.goals.map((g) => g.name).join(", ")}: put aside ${formatMoney(monthlyNeeded)} per month for the next ~${monthsLeft} months. Set a standing transfer so you don’t skip.`
        );
      }
      if (s.overallProgressPct > 0 && s.overallProgressPct < 100) {
        suggestions.push(
          "Keep your monthly savings amount fixed; automate the transfer so you stay on track."
        );
      }
    }
  }

  const hasData =
    !input.spending.error ||
    !input.overspending.error ||
    !input.trends.error ||
    !input.savings.error;

  const summary = hasData
    ? `Here’s what your spending and savings look like, and what to do next — all from your data.`
    : `Not enough data yet. Add income, expenses, and goals in Supabase, then run again.`;

  return {
    summary,
    keyInsights: insights.length ? insights : ["Add your data to see insights."],
    risksWarnings: risks.length ? risks : ["No major risks from your data."],
    actionableSuggestions: suggestions.length
      ? suggestions
      : ["Add income and expense data, then run again for concrete steps to save money."],
  };
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function monthName(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return names[m] || ym;
}
