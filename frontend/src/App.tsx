import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { Dashboard } from "./components/Dashboard";
import { AddIncome } from "./components/AddIncome";
import { AddExpense } from "./components/AddExpense";
import { AddGoal } from "./components/AddGoal";
import { Chat } from "./components/Chat";
import { Login } from "./components/Login";
import "./App.css";

type Tab = "dashboard" | "add-income" | "add-expense" | "add-goal" | "chat";

function App() {
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) {
    return (
      <div className="app">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-icon">💰</div>
        <div style={{ flex: 1 }}>
          <h1>Finance Copilot</h1>
          <span className="header-tagline">Track, save, get smarter</span>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => signOut()}>
          Sign out
        </button>
      </header>

      <nav className="nav" role="navigation" aria-label="Main">
        <button
          type="button"
          className={tab === "dashboard" ? "active" : ""}
          onClick={() => setTab("dashboard")}
          aria-current={tab === "dashboard" ? "page" : undefined}
        >
          Dashboard
        </button>
        <button type="button" className={tab === "add-income" ? "active" : ""} onClick={() => setTab("add-income")} aria-current={tab === "add-income" ? "page" : undefined}>
          Add income
        </button>
        <button type="button" className={tab === "add-expense" ? "active" : ""} onClick={() => setTab("add-expense")} aria-current={tab === "add-expense" ? "page" : undefined}>
          Add expense
        </button>
        <button type="button" className={tab === "add-goal" ? "active" : ""} onClick={() => setTab("add-goal")} aria-current={tab === "add-goal" ? "page" : undefined}>
          Add goal
        </button>
        <button type="button" className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")} aria-current={tab === "chat" ? "page" : undefined}>
          Ask copilot
        </button>
      </nav>

      <main>
        {tab === "dashboard" && <Dashboard />}
        {tab === "add-income" && <AddIncome />}
        {tab === "add-expense" && <AddExpense />}
        {tab === "add-goal" && <AddGoal />}
        {tab === "chat" && <Chat />}
      </main>
    </div>
  );
}

export default App;
