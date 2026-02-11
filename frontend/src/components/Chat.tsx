import { useState, useRef, useEffect } from "react";
import { askCopilot } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type Msg = { role: "user" | "copilot"; text: string };

export function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading || !user) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? undefined;
      const uid = session?.user?.id ?? undefined;
      const answer = await askCopilot(q, token, uid);
      setMessages((m) => [...m, { role: "copilot", text: answer }]);
    } catch (err) {
      const msg = (err as Error).message;
      setMessages((m) => [
        ...m,
        { role: "copilot", text: msg.includes("Copilot unavailable") ? "The copilot is not configured. Set OPENAI_API_KEY on the server." : `Sorry, something went wrong. ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Ask your copilot</h2>
      <p className="card-subtitle">
        Ask anything about your spending, savings, or how to save money.
      </p>
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 && !loading && (
          <p className="empty-state">
            {user
              ? "Try: \"Where am I spending most?\" or \"How can I save money?\""
              : "Log in to ask the copilot and get personalized advice."}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.role === "copilot" && <strong>Copilot: </strong>}
            {m.text}
          </div>
        ))}
        {loading && <div className="chat-msg copilot chat-msg-loading">Thinking…</div>}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-wrap">
        <label htmlFor="chat-input" className="sr-only">Your question</label>
        <input
          id="chat-input"
          className="chat-input"
          placeholder={user ? "Your question…" : "Log in to ask…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || !user}
          maxLength={500}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !user}>
          Ask
        </button>
      </form>
    </div>
  );
}
