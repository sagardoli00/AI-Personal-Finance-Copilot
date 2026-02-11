/**
 * API server for frontend: POST /api/ask → copilot answer.
 * Production-ready: env validation, CORS, error handling.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { runWorkTreeWithContext } from "./work-tree/orchestrator";
import { answerWithData, isOpenAIAvailable } from "./llm";
import { getMockUserContext } from "./data/mock-user-data";

const useMock = process.env.USE_MOCK_DATA === "1";
const userId = process.env.USER_ID ?? "default-user";

if (!useMock && (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set in .env or use USE_MOCK_DATA=1.");
  process.exit(1);
}

if (!isOpenAIAvailable()) {
  console.warn("OPENAI_API_KEY not set. /api/ask will return 503.");
}

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));

app.post("/api/ask", async (req, res) => {
  try {
    if (!isOpenAIAvailable()) {
      return res.status(503).json({ error: "Copilot unavailable. Set OPENAI_API_KEY." });
    }
    const { question, user_id: bodyUserId } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question required" });
    }
    const trimmed = question.trim();
    if (!trimmed) return res.status(400).json({ error: "question required" });

    const authHeader = req.headers.authorization;
    const hasToken = authHeader?.startsWith("Bearer ");
    const token = hasToken ? authHeader!.slice(7) : null;
    const bodyUid = bodyUserId && typeof bodyUserId === "string" ? bodyUserId : null;

    if (!hasToken || !token || !bodyUid) {
      return res.status(401).json({ error: "Log in to use the copilot." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const sup = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data: { user: authUser }, error } = await sup.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    if (authUser.id !== bodyUid) {
      return res.status(401).json({ error: "Session mismatch. Please log out and log in again." });
    }
    const targetUserId = bodyUid;
    const context = useMock
      ? getMockUserContext()
      : await (await import("./data/supabase")).fetchUserFinancialContext(targetUserId);
    const result = runWorkTreeWithContext(context);
    const answer = await answerWithData(trimmed, result.output);
    res.json({ answer });
  } catch (e) {
    const err = e as Error;
    console.error("[api/ask]", err.message);
    res.status(500).json({ error: "Internal error. Try again." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, openai: isOpenAIAvailable() });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Server http://localhost:${port}`);
});
