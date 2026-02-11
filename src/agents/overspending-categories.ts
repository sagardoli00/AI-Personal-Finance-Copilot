/**
 * Agent: Identify overspending categories (vs income share).
 */

import type { UserFinancialContext } from "../types";
import type { AgentResult } from "../types";

export interface OverspendingPayload {
  incomeByMonth: { month: string; amount: number }[];
  expenseByMonth: { month: string; total: number }[];
  categoryShareByMonth: { month: string; category: string; amount: number; shareOfIncome: number }[];
  overIncomeMonths: string[];
  topCategoriesByShare: { category: string; avgShareOfIncome: number; months: number }[];
}

export function runOverspendingAgent(
  ctx: UserFinancialContext
): AgentResult<OverspendingPayload> {
  try {
    const { monthlyIncome, expenses } = ctx;
    const incomeMap = new Map<string, number>();
    for (const m of monthlyIncome) {
      const amt = Number(m.amount) || 0;
      incomeMap.set(m.month, (incomeMap.get(m.month) ?? 0) + amt);
    }
    const incomeByMonth = Array.from(incomeMap.entries()).map(([month, amount]) => ({ month, amount }));

    const byMonth = new Map<string, number>();
    const byMonthCategory = new Map<string, number>();
    for (const e of expenses) {
      const month = e.date.slice(0, 7);
      const amt = Number(e.amount) || 0;
      byMonth.set(month, (byMonth.get(month) ?? 0) + amt);
      const key = `${month}|${e.category}`;
      byMonthCategory.set(key, (byMonthCategory.get(key) ?? 0) + amt);
    }

    const expenseByMonth = Array.from(byMonth.entries()).map(([month, total]) => ({
      month,
      total,
    }));

    const overIncomeMonths: string[] = [];
    const allMonths = new Set([...incomeMap.keys(), ...byMonth.keys()]);
    for (const month of allMonths) {
      const inc = incomeMap.get(month) ?? 0;
      const exp = byMonth.get(month) ?? 0;
      if (inc > 0 && exp > inc) overIncomeMonths.push(month);
    }

    const categoryShareByMonth: OverspendingPayload["categoryShareByMonth"] = [];
    for (const [key, amount] of byMonthCategory) {
      const [month, category] = key.split("|");
      const income = incomeMap.get(month) ?? 0;
      const shareOfIncome = income > 0 ? (amount / income) * 100 : 0;
      categoryShareByMonth.push({ month, category, amount, shareOfIncome });
    }

    const categoryMonths = new Map<string, { sum: number; count: number }>();
    for (const r of categoryShareByMonth) {
      const c = categoryMonths.get(r.category) ?? { sum: 0, count: 0 };
      c.sum += r.shareOfIncome;
      c.count += 1;
      categoryMonths.set(r.category, c);
    }
    const topCategoriesByShare = Array.from(categoryMonths.entries())
      .map(([category, v]) => ({
        category,
        avgShareOfIncome: v.count > 0 ? v.sum / v.count : 0,
        months: v.count,
      }))
      .sort((a, b) => b.avgShareOfIncome - a.avgShareOfIncome)
      .slice(0, 10);

    return {
      agentId: "overspending-categories",
      payload: {
        incomeByMonth,
        expenseByMonth,
        categoryShareByMonth,
        overIncomeMonths,
        topCategoriesByShare,
      },
    };
  } catch (err) {
    return {
      agentId: "overspending-categories",
      payload: {} as OverspendingPayload,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
