-- Finance Copilot: Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query

-- 1. Monthly income (one row per user per month)
create table if not exists public.monthly_income (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  month text not null,
  amount numeric not null check (amount >= 0),
  currency text default 'INR',
  source text,
  created_at timestamptz default now()
);

-- 2. Expenses (one row per transaction)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  category text not null,
  amount numeric not null check (amount >= 0),
  currency text default 'INR',
  description text,
  created_at timestamptz default now()
);

-- 3. Savings goals
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null check (current_amount >= 0) default 0,
  deadline date,
  currency text default 'INR',
  created_at timestamptz default now()
);

-- Indexes for fast filtering by user_id
create index if not exists idx_monthly_income_user_id on public.monthly_income (user_id);
create index if not exists idx_expenses_user_id on public.expenses (user_id);
create index if not exists idx_savings_goals_user_id on public.savings_goals (user_id);

-- Optional: Row Level Security (RLS) so users only see their own data
-- Enable RLS on each table
alter table public.monthly_income enable row level security;
alter table public.expenses enable row level security;
alter table public.savings_goals enable row level security;

-- Policy: allow read for service role / anon if you use anon key from backend only
-- Option A: Allow all for anon (use only if your app is server-side and you pass user_id)
create policy "Allow read monthly_income" on public.monthly_income
  for select using (true);

create policy "Allow read expenses" on public.expenses
  for select using (true);

create policy "Allow read savings_goals" on public.savings_goals
  for select using (true);

-- Option B (recommended if you use Supabase Auth): restrict by auth.uid()
-- Drop the policies above and use these instead:
-- create policy "Users read own monthly_income" on public.monthly_income
--   for select using (user_id = auth.uid()::text);
-- create policy "Users read own expenses" on public.expenses
--   for select using (user_id = auth.uid()::text);
-- create policy "Users read own savings_goals" on public.savings_goals
--   for select using (user_id = auth.uid()::text);

-- Grant usage for anon (so your app with anon key can read)
grant select on public.monthly_income to anon;
grant select on public.expenses to anon;
grant select on public.savings_goals to anon;
