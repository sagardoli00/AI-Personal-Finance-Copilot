/**
 * Agent: Spending patterns across months (by category and over time).
 */

import type { UserFinancialContext } from "../types";
import type { AgentResult } from "../types";

export interface SpendingPatternsPayload {
  totalByCategory: { category: string; total: number; count: number }[];
  totalByMonth: { month: string; total: number; count: number }[];
  categoryByMonth: { month: string; category: string; total: number }[];
  overallTotal: number;
  monthCount: number;
}

export function runSpendingPatternsAgent(
  ctx: UserFinancialContext
): AgentResult<SpendingPatternsPayload> {
  try {
    const { expenses } = ctx;
    if (!expenses.length) {
      return {
        agentId: "spending-patterns",
        payload: {
          totalByCategory: [],
          totalByMonth: [],
          categoryByMonth: [],
          overallTotal: 0,
          monthCount: 0,
        },
      };
    }

    const byCategory = new Map<string, { total: number; count: number }>();
    const byMonth = new Map<string, { total: number; count: number }>();
    const categoryByMonth: { month: string; category: string; total: number }[] = [];
    let overallTotal = 0;

    for (const e of expenses) {
      const month = e.date.slice(0, 7);
      const amt = Number(e.amount) || 0;
      overallTotal += amt;

      const cat = byCategory.get(e.category) ?? { total: 0, count: 0 };
      cat.total += amt;
      cat.count += 1;
      byCategory.set(e.category, cat);

      const mon = byMonth.get(month) ?? { total: 0, count: 0 };
      mon.total += e.amount;
      mon.count += 1;
      byMonth.set(month, mon);

      categoryByMonth.push({ month, category: e.category, total: amt });
    }

    const totalByCategory = Array.from(byCategory.entries()).map(
      ([category, v]) => ({ category, total: v.total, count: v.count })
    );
    const totalByMonth = Array.from(byMonth.entries()).map(([month, v]) => ({
      month,
      total: v.total,
      count: v.count,
    }));

    const byMonthCategory = new Map<string, number>();
    for (const r of categoryByMonth) {
      const key = `${r.month}|${r.category}`;
      byMonthCategory.set(key, (byMonthCategory.get(key) ?? 0) + r.total);
    }
    const categoryByMonthAgg = Array.from(byMonthCategory.entries()).map(
      ([key, total]) => {
        const [month, category] = key.split("|");
        return { month, category, total };
      }
    );

    return {
      agentId: "spending-patterns",
      payload: {
        totalByCategory,
        totalByMonth,
        categoryByMonth: categoryByMonthAgg,
        overallTotal,
        monthCount: byMonth.size,
      },
    };
  } catch (err) {
    return {
      agentId: "spending-patterns",
      payload: {} as SpendingPatternsPayload,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
