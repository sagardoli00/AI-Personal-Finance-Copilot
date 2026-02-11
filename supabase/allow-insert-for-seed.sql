-- Allow anon to insert (for seeding / local dev). Run in SQL Editor if seed script fails with RLS.
create policy "Allow insert monthly_income" on public.monthly_income for insert with check (true);
create policy "Allow insert expenses" on public.expenses for insert with check (true);
create policy "Allow insert savings_goals" on public.savings_goals for insert with check (true);

create policy "Allow delete monthly_income" on public.monthly_income for delete using (true);
create policy "Allow delete expenses" on public.expenses for delete using (true);
create policy "Allow delete savings_goals" on public.savings_goals for delete using (true);
