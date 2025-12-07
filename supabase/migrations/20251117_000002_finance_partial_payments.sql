-- Add partial payment support to finance_installments
alter table if exists public.finance_installments
  add column if not exists paid_amount numeric not null default 0;

-- Backfill paid_amount for already paid installments
update public.finance_installments
set paid_amount = amount
where is_paid = true
  and paid_amount = 0;


