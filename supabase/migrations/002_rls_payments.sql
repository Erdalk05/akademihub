-- Enable RLS on payments (idempotent-safe if already enabled)
alter table if exists public.payments enable row level security;

-- Allow inserts via service role only
create policy if not exists "payments_insert_service_role"
on public.payments
for insert
using ( auth.role() = 'service_role' )
with check ( auth.role() = 'service_role' );

-- Optionally allow selects to existing roles per your needs (not required here)
-- create policy if not exists "payments_select_authenticated"
-- on public.payments
-- for select
-- to authenticated
-- using ( true );











