/**
 * Supabase data fetch layer — one user's financial data.
 * Set SUPABASE_URL and SUPABASE_ANON_KEY in env.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  MonthlyIncome,
  Expense,
  SavingsGoal,
  UserFinancialContext,
} from "../types";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set them in .env or environment."
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSupabaseForDataFetch(): SupabaseClient {
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
  if (!supabaseServiceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. The backend needs it to fetch user data (RLS restricts anon). Add it to .env"
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function fetchUserFinancialContext(
  userId: string
): Promise<UserFinancialContext> {
  const supabase = getSupabaseForDataFetch();

  const [incomeRes, expensesRes, goalsRes] = await Promise.all([
    supabase
      .from("monthly_income")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: false }),
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId),
  ]);

  const monthlyIncome = (incomeRes.data ?? []) as MonthlyIncome[];
  const expenses = (expensesRes.data ?? []) as Expense[];
  const savingsGoals = (goalsRes.data ?? []) as SavingsGoal[];

  return {
    userId,
    monthlyIncome,
    expenses,
    savingsGoals,
    fetchedAt: new Date().toISOString(),
  };
}
