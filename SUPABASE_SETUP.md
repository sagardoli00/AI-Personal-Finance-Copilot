# Supabase setup for Finance Copilot

Do these steps in Supabase so the copilot **reads all data from Supabase** (no mock data).

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose org, name, database password, region.
3. Wait for the project to be ready.

---

## 2. Create the tables (run the schema)

1. In the project, open **SQL Editor**.
2. Click **New query**.
3. Copy the contents of **`supabase/schema.sql`** from this repo and paste into the editor.
4. Click **Run** (or Ctrl+Enter).

You should see “Success.” That creates:

| Table            | Purpose                          |
|------------------|----------------------------------|
| `monthly_income` | One row per user per month       |
| `expenses`       | One row per expense transaction  |
| `savings_goals`  | One row per savings goal         |

---

## 3. Get your API keys

1. Go to **Project Settings** (gear icon) → **API**.
2. Copy:
   - **Project URL** → use as `SUPABASE_URL`
   - **anon public** key → use as `SUPABASE_ANON_KEY`

---

## 4. Configure the app (.env)

In the project root, create or edit **`.env`**:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
USER_ID=your-user-id
```

- Use the **Project URL** and **anon public** key from step 3.
- `USER_ID` = the value you use to identify a user (e.g. Supabase Auth user id, or a string like `user-1`). The copilot will load data for this user only.

---

## 5. Add data in Supabase

Use **Table Editor** (or SQL) to insert rows. Use the **same `user_id`** as in `.env` for all rows.

### monthly_income

| Column    | Type   | Required | Example    |
|-----------|--------|----------|------------|
| user_id   | text   | Yes      | same as USER_ID in .env |
| month     | text   | Yes      | `2025-01` (YYYY-MM) |
| amount    | number | Yes      | `30000`    |
| currency  | text   | No       | `INR`      |
| source    | text   | No       | Salary     |

- One row per month per user.

### expenses

| Column     | Type   | Required | Example    |
|------------|--------|----------|------------|
| user_id    | text   | Yes      | same as USER_ID |
| date       | date   | Yes      | `2025-01-15` |
| category   | text   | Yes      | Food, Rent, Entertainment |
| amount     | number | Yes      | `5000`     |
| currency   | text   | No       | `INR`      |
| description| text   | No       | Lunch      |

- One row per expense.

### savings_goals

| Column        | Type   | Required | Example    |
|---------------|--------|----------|------------|
| user_id       | text   | Yes      | same as USER_ID |
| name          | text   | Yes      | Emergency Fund |
| target_amount | number | Yes      | `60000`    |
| current_amount| number | Yes      | `0`        |
| deadline      | date   | No       | `2025-09-30` |
| currency      | text   | No       | `INR`      |

---

## 6. Run the copilot (read from Supabase)

From the project root:

```bash
npm run build
npm start
```

Or with explicit user:

```bash
USER_ID=your-user-id npm start
```

The copilot will **read only from Supabase** (no mock data) and print the report.

---

## Quick checklist

- [ ] Supabase project created  
- [ ] `supabase/schema.sql` run in SQL Editor  
- [ ] `.env` has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `USER_ID`  
- [ ] Data added in `monthly_income`, `expenses`, `savings_goals` with same `user_id`  
- [ ] `npm run build` and `npm start` (no `--mock`)  

---

## If you use Supabase Auth

Use the signed-in user’s id as `USER_ID`. In the schema, you can switch to RLS policies that use `auth.uid()::text` (see comments in `supabase/schema.sql`) so users only see their own rows. The copilot still needs a single `user_id` to filter; pass the authenticated user’s id when you call the app.
