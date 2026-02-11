-- Allow anon to update (for frontend edits). Run in SQL Editor.
create policy "Allow update monthly_income" on public.monthly_income for update using (true);
create policy "Allow update expenses" on public.expenses for update using (true);
create policy "Allow update savings_goals" on public.savings_goals for update using (true);
