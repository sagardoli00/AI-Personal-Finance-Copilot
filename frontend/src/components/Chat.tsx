import { useState, useRef, useEffect } from "react";
import { askCopilot } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const CHAT_CACHE_KEY = "finance-copilot-chat";
const MAX_CACHED_MESSAGES = 100;

type Msg = { role: "user" | "copilot"; text: string };

function loadCachedMessages(userId: string | undefined): Msg[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${CHAT_CACHE_KEY}-${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m): m is Msg => m && typeof m === "object" && (m.role === "user" || m.role === "copilot") && typeof (m as Msg).text === "string")
      .slice(-MAX_CACHED_MESSAGES);
  } catch {
    return [];
  }
}

function saveCachedMessages(userId: string | undefined, messages: Msg[]) {
  if (!userId) return;
  try {
    if (messages.length === 0) {
      localStorage.removeItem(`${CHAT_CACHE_KEY}-${userId}`);
      return;
    }
    const toSave = messages.slice(-MAX_CACHED_MESSAGES);
    localStorage.setItem(`${CHAT_CACHE_KEY}-${userId}`, JSON.stringify(toSave));
  } catch {
    // ignore quota or parse errors
  }
}

export function Chat() {
  const { user } = useAuth();
  const userId = user?.id;
  // Initialize from cache so when we come back from Dashboard/Expense tab, chat continues
  const [messages, setMessages] = useState<Msg[]>(() => loadCachedMessages(user?.id));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // When user switches account, load that user's chat
  useEffect(() => {
    setMessages(loadCachedMessages(userId));
  }, [userId]);

  // Persist to cache when messages change (don't run on first mount with empty — we already init from cache)
  useEffect(() => {
    saveCachedMessages(userId, messages);
  }, [userId, messages]);

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

  function clearChat() {
    setMessages([]);
    saveCachedMessages(userId, []);
  }

  return (
    <div className="card">
      <div className="card-header-row">
        <div>
          <h2>Ask your copilot</h2>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            Ask anything about your spending, savings, or how to save money. Chat is saved for this account.
          </p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="btn btn-sm" onClick={clearChat}>
            Clear chat
          </button>
        )}
      </div>
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
