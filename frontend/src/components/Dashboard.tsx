import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [income, setIncome] = useState<{ id?: string; month: string; amount: number }[]>([]);
  const [expenses, setExpenses] = useState<{ id?: string; date: string; category: string; amount: number }[]>([]);
  const [goals, setGoals] = useState<{ id?: string; name: string; target_amount: number; current_amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const [i, e, g] = await Promise.all([
        supabase.from("monthly_income").select("id, month, amount").eq("user_id", userId).order("month", { ascending: false }),
        supabase.from("expenses").select("id, date, category, amount").eq("user_id", userId).order("date", { ascending: false }),
        supabase.from("savings_goals").select("id, name, target_amount, current_amount").eq("user_id", userId),
      ]);
      if (i.error) throw i.error;
      if (e.error) throw e.error;
      if (g.error) throw g.error;
      setIncome((i.data ?? []) as typeof income);
      setExpenses((e.data ?? []) as typeof expenses);
      setGoals((g.data ?? []) as typeof goals);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalIncome = income.reduce((s, x) => s + Number(x.amount), 0);
  const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount), 0);
  const net = totalIncome - totalExpenses;
  const recentExpenses = expenses.slice(0, 10);

  if (loading && income.length === 0 && expenses.length === 0 && goals.length === 0) {
    return (
      <div className="card">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "var(--danger)" }}>Could not load data. {error}</p>
        <button type="button" className="btn btn-primary" onClick={fetchData} style={{ marginTop: "0.5rem" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header-row">
          <h2>Your money at a glance</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={fetchData}>
            Refresh
          </button>
        </div>
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-card-label">Total income</div>
            <div className="stat-card-value">{formatMoney(totalIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total expenses</div>
            <div className="stat-card-value">{formatMoney(totalExpenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Net (income − expenses)</div>
            <div className="stat-card-value" style={{ color: net >= 0 ? "var(--accent)" : "var(--danger)" }}>
              {formatMoney(net)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent expenses</h2>
        {recentExpenses.length === 0 ? (
          <p className="empty-state">No expenses yet. Add one below.</p>
        ) : (
          recentExpenses.map((x) => (
            <div key={x.id ?? `${x.date}-${x.category}-${x.amount}`} className="list-item">
              <span>{x.date} · {x.category}</span>
              <span className="amount">{formatMoney(Number(x.amount))}</span>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Your goals</h2>
        {goals.length === 0 ? (
          <p className="empty-state">No goals yet. Add one below.</p>
        ) : (
          goals.map((g) => {
            const current = Number(g.current_amount);
            const target = Number(g.target_amount);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
            return (
              <div key={g.id ?? g.name} className="goal-item">
                <div className="stat">
                  <span>{g.name}</span>
                  <span>{formatMoney(current)} / {formatMoney(target)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
