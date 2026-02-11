import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function AddIncome() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || amt < 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("monthly_income").insert({
        user_id: userId,
        month,
        amount: amt,
        source: source || undefined,
      });
      if (error) throw error;
      setMessage({ type: "success", text: "Income added." });
      setAmount("");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Add income</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="income-month">Month</label>
        <input id="income-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
        <label htmlFor="income-amount">Amount (₹)</label>
        <input id="income-amount" type="number" min="0" step="1" placeholder="30000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <label htmlFor="income-source">Source (optional)</label>
        <input id="income-source" type="text" placeholder="Salary, freelance…" value={source} onChange={(e) => setSource(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Adding…" : "Add income"}
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
