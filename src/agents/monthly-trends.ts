/**
 * Agent: Month-to-month spending and income trends.
 */

import type { UserFinancialContext } from "../types";
import type { AgentResult } from "../types";

export interface MonthlyTrendsPayload {
  expenseTrend: { month: string; total: number; changeVsPrev?: number; changePct?: number }[];
  incomeTrend: { month: string; amount: number; changeVsPrev?: number; changePct?: number }[];
  savingsRateByMonth: { month: string; income: number; expense: number; savings: number; ratePct: number }[];
  increasingExpenseMonths: string[];
  decreasingIncomeMonths: string[];
}

export function runMonthlyTrendsAgent(
  ctx: UserFinancialContext
): AgentResult<MonthlyTrendsPayload> {
  try {
    const { monthlyIncome, expenses } = ctx;

    const expenseByMonth = new Map<string, number>();
    for (const e of expenses) {
      const month = e.date.slice(0, 7);
      const amt = Number(e.amount) || 0;
      expenseByMonth.set(month, (expenseByMonth.get(month) ?? 0) + amt);
    }

    const incomeSorted = [...monthlyIncome].map((m) => ({ ...m, amount: Number(m.amount) || 0 })).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
    const expenseSorted = Array.from(expenseByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    const incomeTrend: MonthlyTrendsPayload["incomeTrend"] = incomeSorted.map(
      (m, i) => {
        const prev = incomeSorted[i - 1]?.amount;
        const changeVsPrev =
          prev !== undefined ? m.amount - prev : undefined;
        const changePct =
          prev !== undefined && prev !== 0
            ? (changeVsPrev! / prev) * 100
            : undefined;
        return {
          month: m.month,
          amount: m.amount,
          changeVsPrev,
          changePct,
        };
      }
    );

    const expenseTrend: MonthlyTrendsPayload["expenseTrend"] = expenseSorted.map(
      ([month, total], i) => {
        const prev = expenseSorted[i - 1]?.[1];
        const changeVsPrev = prev !== undefined ? total - prev : undefined;
        const changePct =
          prev !== undefined && prev !== 0
            ? (changeVsPrev! / prev) * 100
            : undefined;
        return {
          month,
          total,
          changeVsPrev,
          changePct,
        };
      }
    );

    const allMonths = new Set([
      ...incomeTrend.map((x) => x.month),
      ...expenseTrend.map((x) => x.month),
    ]);
    const savingsRateByMonth: MonthlyTrendsPayload["savingsRateByMonth"] = [];
    for (const month of Array.from(allMonths).sort()) {
      const income = monthlyIncome
        .filter((m) => m.month === month)
        .reduce((s, m) => s + (Number(m.amount) || 0), 0);
      const expense = expenseByMonth.get(month) ?? 0;
      const savings = income - expense;
      const ratePct = income > 0 ? (savings / income) * 100 : 0;
      savingsRateByMonth.push({
        month,
        income,
        expense,
        savings,
        ratePct,
      });
    }
    savingsRateByMonth.sort((a, b) => a.month.localeCompare(b.month));

    const increasingExpenseMonths = expenseTrend
      .filter((x) => x.changePct != null && x.changePct > 0)
      .map((x) => x.month);
    const decreasingIncomeMonths = incomeTrend
      .filter((x) => x.changePct != null && x.changePct < 0)
      .map((x) => x.month);

    return {
      agentId: "monthly-trends",
      payload: {
        expenseTrend,
        incomeTrend,
        savingsRateByMonth,
        increasingExpenseMonths,
        decreasingIncomeMonths,
      },
    };
  } catch (err) {
    return {
      agentId: "monthly-trends",
      payload: {} as MonthlyTrendsPayload,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
