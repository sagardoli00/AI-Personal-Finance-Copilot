# Personal Finance Copilot

AI Personal Finance Copilot that analyzes **one user’s** financial data from Supabase using a **work tree** and **multiple agents**. All insights are data-backed; no generic or assumed advice.

## Quick start

1. **Supabase**: Create a project, run `supabase/schema.sql`, enable Auth. See [SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md).
2. **Backend**: Copy `.env.example` → `.env`, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`. Run `npm install && npm run build && npm run server`.
3. **Frontend**: Copy `frontend/.env.example` → `frontend/.env`, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`. Run `npm run dev:frontend`.
4. **Seed users**: `npx ts-node src/scripts/seed-five-users.ts` — creates 5 test users. Log in with `user1@finance-copilot.test` / `Test123!@#`.

## Rules (strict)

- Uses **only** the data provided from Supabase.
- No generic financial advice; no invented data.
- All insights include numbers from the data.
- If data is insufficient, that is stated clearly.

## Responsibilities

1. Analyze spending patterns across months  
2. Identify overspending categories  
3. Compare month-to-month trends  
4. Evaluate savings consistency  
5. Give practical, realistic improvement suggestions  

## Output format

- **Summary** (2–3 lines)  
- **Key Insights** (bullet points with numbers)  
- **Risks / Warnings** (if any)  
- **Actionable Suggestions** (clear and achievable)  

Tone: professional, realistic, data-focused. No motivational quotes or vague advice.

---

## Web frontend (read + write)

The frontend lets you view your data, **add** income, expenses, and goals, and chat with the copilot.

**Run the full stack:**

1. **Backend API** (terminal 1):
   ```bash
   npm run build
   npm run server
   ```
   Server runs at `http://localhost:3001`.

2. **Frontend** (terminal 2):
   ```bash
   npm run dev:frontend
   ```
   Open `http://localhost:5173`.

3. **Supabase:** If you want to edit rows from the app later, run `supabase/allow-update.sql` in SQL Editor.

The frontend uses `frontend/.env` — copy from `frontend/.env.example` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

**Production:** Set `CORS_ORIGIN` to your frontend URL, `PORT` as needed. Build frontend: `npm run frontend:build` and serve the `frontend/dist` folder. Run the backend with `npm run server`.

---

## Project structure

```
src/
  data/           # Supabase fetch (one user)
  agents/         # Multiple analysis agents
    spending-patterns.ts
    overspending-categories.ts
    monthly-trends.ts
    savings-consistency.ts
    synthesizer.ts
  work-tree/      # Orchestrator: run agents in parallel → synthesize
  index.ts        # Entry: run work tree, print report
```

## Supabase tables (expected)

- **monthly_income**: `user_id`, `month` (YYYY-MM), `amount`, optional `currency`, `source`
- **expenses**: `user_id`, `date` (YYYY-MM-DD), `category`, `amount`, optional `currency`, `description`
- **savings_goals**: `user_id`, `name`, `target_amount`, `current_amount`, optional `deadline`, `currency`

**→ Full step-by-step: see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)** (create project, run schema, get keys, add data, run copilot).

**→ For login + 5 test users: see [SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md)** (enable Auth, RLS, run seed-five-users script).

## Setup

1. Copy `.env.example` to `.env` and set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `USER_ID` (or pass as first CLI argument)
2. Install and run:

```bash
npm install
npm run build
USER_ID=your-user-uuid npm start
# or
npm start -- your-user-uuid
```

## Ask personal questions

Run the copilot and ask in plain English (answers use your Supabase data):

```bash
npm run build
npm run ask -- "how can I save money"
npm run ask -- "am I overspending?"
npm run ask -- "where am I spending most?"
npm run ask -- "how is my emergency fund?"
npm run ask -- "full report"
```

Or run **`npm run ask`** with no argument: it will prompt **You:** — type your question and press Enter. Type **exit** or **quit** when done.

### Natural answers with OpenAI (optional)

If you set **`OPENAI_API_KEY`** in `.env`, the copilot sends your data + your question to OpenAI and returns a short, natural answer (e.g. "You're spending most in February and on Food; least in March. To save, trim Food first."). Get a key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Without the key, answers use built-in keyword matching.

## Work tree and multiple agents

- **Work tree**: `runWorkTree(userId)` in `src/work-tree/orchestrator.ts`:
  1. Fetches user context from Supabase (income, expenses, savings goals).
  2. Runs four agents **in parallel**: spending patterns, overspending categories, monthly trends, savings consistency.
  3. Runs the **synthesizer** on all agent results to produce the final report.

- **Agents** (data-only, no LLM):
  - **Spending patterns**: totals by category and month, category-by-month.
  - **Overspending**: income vs expense by month, category share of income, months over income.
  - **Monthly trends**: expense/income trend, savings rate by month, increasing expense / decreasing income months.
  - **Savings consistency**: goal progress, on-track vs behind, completed goals.
  - **Synthesizer**: turns agent outputs into Summary, Key Insights, Risks, Actionable Suggestions.

