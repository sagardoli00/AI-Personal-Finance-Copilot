/**
 * Types for Personal Finance Copilot — single-user financial data from Supabase.
 */

export interface MonthlyIncome {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  amount: number;
  currency?: string;
  source?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string; // YYYY-MM-DD
  currency?: string;
}

export interface UserFinancialContext {
  userId: string;
  monthlyIncome: MonthlyIncome[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  fetchedAt: string; // ISO
}

export interface AgentResult<T = unknown> {
  agentId: string;
  payload: T;
  error?: string;
}
