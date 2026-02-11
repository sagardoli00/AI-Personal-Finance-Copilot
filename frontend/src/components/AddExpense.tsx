import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const CATEGORIES = ["Food", "Rent", "Entertainment", "Transport", "Shopping", "Health", "Utilities", "Other"];

export function AddExpense() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      <h2>Add expense</h2>
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
      {message && (
        <p className={`form-message form-message-${message.type}`} role="alert">
          {message.text}
        </p>
      )}
    </div>
  );
}
