import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const CATEGORIES = ["Food", "Rent", "Entertainment", "Transport", "Shopping", "Health", "Utilities", "Other"];

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

type ExpenseRow = { id?: string; date: string; category: string; amount: number; description?: string | null };

export function AddExpense() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [mode, setMode] = useState<"add" | "view">("add");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // View/filter state (only current user's data)
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRow[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchUserExpenses = useCallback(async () => {
    if (!userId) return;
    setFilterLoading(true);
    try {
      let q = supabase
        .from("expenses")
        .select("id, date, category, amount, description")
        .eq("user_id", userId)
        .order("date", { ascending: false });
      if (filterCategory) q = q.eq("category", filterCategory);
      if (filterDateFrom) q = q.gte("date", filterDateFrom);
      if (filterDateTo) q = q.lte("date", filterDateTo);
      const { data, error } = await q;
      if (error) throw error;
      setFilteredExpenses((data ?? []) as ExpenseRow[]);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setFilterLoading(false);
    }
  }, [userId, filterCategory, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (mode === "view" && userId) fetchUserExpenses();
  }, [mode, userId, fetchUserExpenses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || amt < 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        date,
        category,
        amount: amt,
        description: description || undefined,
      });
      if (error) throw error;
      setMessage({ type: "success", text: "Expense added." });
      setAmount("");
      setDescription("");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header-row" style={{ marginBottom: "1rem" }}>
        <h2>Add expense</h2>
        <div className="view-expense-toggles">
          <button
            type="button"
            className={mode === "add" ? "active" : ""}
            onClick={() => setMode("add")}
          >
            Add expense
          </button>
          <button
            type="button"
            className={mode === "view" ? "active" : ""}
            onClick={() => setMode("view")}
          >
            View & filter my expenses
          </button>
        </div>
      </div>

      {message && (
        <p className={`form-message form-message-${message.type}`} role="alert" style={{ marginBottom: "1rem" }}>
          {message.text}
        </p>
      )}

      {mode === "add" && (
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="expense-date">Date</label>
          <input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <label htmlFor="expense-category">Category</label>
          <select id="expense-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label htmlFor="expense-amount">Amount (₹)</label>
          <input id="expense-amount" type="number" min="0" step="1" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <label htmlFor="expense-desc">Description (optional)</label>
          <input id="expense-desc" type="text" placeholder="Lunch, groceries…" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding…" : "Add expense"}
          </button>
        </form>
      )}

      {mode === "view" && (
        <>
          <div className="filter-row">
            <label htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label htmlFor="filter-date-from">From date</label>
            <input
              id="filter-date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
            <label htmlFor="filter-date-to">To date</label>
            <input
              id="filter-date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={fetchUserExpenses}
              disabled={filterLoading}
            >
              {filterLoading ? "Loading…" : "Apply filters"}
            </button>
          </div>
          <p className="filter-hint">Showing only your expenses. Filters apply to your data only.</p>
          {filterLoading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading your expenses…</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="empty-state">No expenses match the filters. Try different dates or categories.</p>
          ) : (
            <div className="expense-list">
              <div className="list-item list-item-header">
                <span>Date · Category</span>
                <span className="amount">Amount</span>
              </div>
              {filteredExpenses.map((x) => (
                <div key={x.id ?? `${x.date}-${x.category}-${x.amount}`} className="list-item">
                  <span>
                    {x.date} · {x.category}
                    {x.description ? ` — ${x.description}` : ""}
                  </span>
                  <span className="amount">{formatMoney(Number(x.amount))}</span>
                </div>
              ))}
              <div className="list-item list-item-total">
                <span>Total</span>
                <span className="amount">
                  {formatMoney(filteredExpenses.reduce((s, x) => s + Number(x.amount), 0))}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
