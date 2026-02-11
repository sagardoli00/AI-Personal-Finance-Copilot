import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function AddGoal() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetNum = Number(target);
    const currentNum = Math.max(0, Number(current) || 0);
    if (!name.trim() || !target || targetNum <= 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("savings_goals").insert({
        user_id: userId,
        name: name.trim(),
        target_amount: targetNum,
        current_amount: currentNum,
        deadline: deadline || undefined,
      });
      if (error) throw error;
      setMessage({ type: "success", text: "Goal added." });
      setName("");
      setTarget("");
      setCurrent("0");
      setDeadline("");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Add savings goal</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="goal-name">Goal name</label>
        <input id="goal-name" type="text" placeholder="Emergency Fund, Vacation…" value={name} onChange={(e) => setName(e.target.value)} required />
        <label htmlFor="goal-target">Target amount (₹)</label>
        <input id="goal-target" type="number" min="1" step="1" placeholder="60000" value={target} onChange={(e) => setTarget(e.target.value)} required />
        <label htmlFor="goal-current">Current amount (₹)</label>
        <input id="goal-current" type="number" min="0" step="1" placeholder="0" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <label htmlFor="goal-deadline">Deadline (optional)</label>
        <input id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Adding…" : "Add goal"}
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
