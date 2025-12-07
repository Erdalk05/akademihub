-- PART 1 — DATABASE MIGRATIONS (SUPABASE SQL)
-- Create core tables and functions for finance module

-- 1) Table: finance_installments
create table if not exists public.finance_installments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  agreement_id uuid null,
  installment_no integer not null,
  amount numeric not null,
  due_date date not null,
  is_paid boolean not null default false,
  payment_id uuid null,
  payment_method text null,
  paid_at timestamptz null,
  status text not null default 'active', -- active | void | refunded | deleted
  created_at timestamptz not null default now()
);

-- 2) Table: finance_logs
create table if not exists public.finance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid,
  agreement_id uuid,
  action text not null, -- generate_installments | pay_installment | void_installment | update_amount | etc.
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Indexes (recommended)
create index if not exists idx_fin_installments_student on public.finance_installments(student_id);
create index if not exists idx_fin_installments_due_date on public.finance_installments(due_date);
create index if not exists idx_fin_installments_status on public.finance_installments(status);
create index if not exists idx_fin_logs_student on public.finance_logs(student_id);

-- Foreign keys (optional but recommended)
alter table public.finance_installments
  add constraint if not exists fk_fin_installments_student
  foreign key (student_id) references public.students(id)
  on delete cascade;

-- Receipts support (optional)
alter table if exists public.receipts
  add column if not exists installment_id uuid;

alter table if exists public.receipts
  add constraint if not exists fk_receipt_installment
  foreign key (installment_id) references public.finance_installments(id)
  on delete set null;

-- RLS (disabled for now)
alter table public.finance_installments disable row level security;
alter table public.finance_logs disable row level security;

-- 3) Function: generate_installments(student_id, agreement_id, count, amount, first_due)
create or replace function public.generate_installments(
  p_student_id uuid,
  p_agreement_id uuid,
  p_count int,
  p_amount numeric,
  p_first_due date
) returns setof public.finance_installments
language plpgsql
as $$
declare
  i int;
  v_due date;
  v_row public.finance_installments;
begin
  if p_count is null or p_count <= 0 then
    raise exception 'count must be > 0';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be > 0';
  end if;

  for i in 1..p_count loop
    -- 30-day intervals approximation
    v_due := p_first_due + ((i - 1) * interval '30 days');
    insert into public.finance_installments(
      student_id, agreement_id, installment_no, amount, due_date, is_paid, status
    ) values (
      p_student_id, p_agreement_id, i, p_amount, v_due::date, false, 'active'
    )
    returning * into v_row;
    return next v_row;
  end loop;

  -- Log
  insert into public.finance_logs(student_id, agreement_id, action, payload)
  values (p_student_id, p_agreement_id, 'generate_installments',
          jsonb_build_object('count', p_count, 'amount', p_amount, 'first_due', p_first_due));
end;
$$;

-- 4) Function: pay_installment(installment_id, method)
create or replace function public.pay_installment(
  p_installment_id uuid,
  p_method text
) returns public.finance_installments
language plpgsql
as $$
declare
  v_row public.finance_installments;
  v_payment_id uuid := gen_random_uuid();
begin
  update public.finance_installments
  set is_paid = true,
      paid_at = now(),
      payment_method = p_method,
      payment_id = v_payment_id
  where id = p_installment_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'installment not found';
  end if;

  -- Log
  insert into public.finance_logs(student_id, agreement_id, action, payload)
  values (v_row.student_id, v_row.agreement_id, 'pay_installment',
          jsonb_build_object('installment_id', p_installment_id, 'payment_method', p_method, 'payment_id', v_payment_id));

  return v_row;
end;
$$;











