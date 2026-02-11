# Supabase Auth + 5 Users Setup

## 1. Enable Auth in Supabase

1. Go to your **Supabase project** → **Authentication** → **Providers**.
2. Ensure **Email** is enabled (default).
3. Optional: Under **Authentication** → **Settings** → **Auth**, disable "Confirm email" for testing (or leave on and confirm via the link).

## 2. Update RLS policies (for Auth)

Run this in **SQL Editor** to restrict data by logged-in user:

```sql
-- Drop old policies if they exist
drop policy if exists "Allow read monthly_income" on public.monthly_income;
drop policy if exists "Allow read expenses" on public.expenses;
drop policy if exists "Allow read savings_goals" on public.savings_goals;

-- Auth-based policies (users see only their own data)
create policy "Users read own monthly_income" on public.monthly_income
  for all using (user_id = auth.uid()::text);

create policy "Users read own expenses" on public.expenses
  for all using (user_id = auth.uid()::text);

create policy "Users read own savings_goals" on public.savings_goals
  for all using (user_id = auth.uid()::text);
```

## 3. Add SERVICE_ROLE key

1. Go to **Project Settings** → **API**.
2. Copy the **service_role** key (keep it secret).
3. Add to your root `.env`:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Create 5 users with 5 months of history

From the project root:

```bash
npx ts-node src/scripts/seed-five-users.ts
```

This creates:

- **5 users** with emails `user1@finance-copilot.test` … `user5@finance-copilot.test`, password `Test123!@#`
- **5 months** of income (Oct 2024 – Feb 2025) per user
- **8–15 expenses per month** across Food, Rent, Entertainment, Transport, etc.
- **2 savings goals** per user (Emergency Fund, Vacation)

## 5. Test login

1. Run the frontend: `npm run dev:frontend`
2. Go to http://localhost:5173
3. Sign in with `user1@finance-copilot.test` / `Test123!@#`
4. You should see the dashboard with that user’s data.

## Summary: What to add in Supabase

| Step | What | Where |
|------|------|-------|
| 1 | Auth is on | Authentication → Providers (Email) |
| 2 | RLS policies | SQL Editor (run the policy SQL above) |
| 3 | service_role key | `.env` (root) |
| 4 | Seed script | `npx ts-node src/scripts/seed-five-users.ts` |
