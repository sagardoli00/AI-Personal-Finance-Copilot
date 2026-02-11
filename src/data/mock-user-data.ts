/**
 * Mock financial context from user-provided data.
 * Monthly Income: 30000 | Jan: 17799, Feb: 22399, Mar: 17399
 * Categories: Food, Rent, Entertainment (split to match totals)
 * Goal: Emergency Fund 60000 in 6 months
 */

import type { UserFinancialContext } from "../types";

const USER_ID = "mock-user";

// Income 30000 each month (Jan–Mar)
const monthlyIncome = [
  { id: "1", user_id: USER_ID, month: "2025-01", amount: 30000 },
  { id: "2", user_id: USER_ID, month: "2025-02", amount: 30000 },
  { id: "3", user_id: USER_ID, month: "2025-03", amount: 30000 },
];

// Category split to match: Jan 17799, Feb 22399, Mar 17399 (Rent 8000/mo, rest Food + Entertainment)
const expenses = [
  { id: "e1", user_id: USER_ID, date: "2025-01-05", category: "Rent", amount: 8000 },
  { id: "e2", user_id: USER_ID, date: "2025-01-10", category: "Food", amount: 5879 },
  { id: "e3", user_id: USER_ID, date: "2025-01-15", category: "Entertainment", amount: 3920 },
  { id: "e4", user_id: USER_ID, date: "2025-02-05", category: "Rent", amount: 8000 },
  { id: "e5", user_id: USER_ID, date: "2025-02-12", category: "Food", amount: 8640 },
  { id: "e6", user_id: USER_ID, date: "2025-02-18", category: "Entertainment", amount: 5759 },
  { id: "e7", user_id: USER_ID, date: "2025-03-05", category: "Rent", amount: 8000 },
  { id: "e8", user_id: USER_ID, date: "2025-03-11", category: "Food", amount: 5640 },
  { id: "e9", user_id: USER_ID, date: "2025-03-20", category: "Entertainment", amount: 3759 },
];

// Emergency Fund: 60000 in 6 months. Current amount 0 for analysis.
function getDeadlineSixMonthsFromNow(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

const savingsGoals = [
  {
    id: "g1",
    user_id: USER_ID,
    name: "Emergency Fund",
    target_amount: 60000,
    current_amount: 0,
    deadline: getDeadlineSixMonthsFromNow(),
  },
];

export function getMockUserContext(): UserFinancialContext {
  return {
    userId: USER_ID,
    monthlyIncome,
    expenses,
    savingsGoals,
    fetchedAt: new Date().toISOString(),
  };
}
