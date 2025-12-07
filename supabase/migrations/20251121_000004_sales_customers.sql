-- Sales Customers table for harici (öğrenci olmayan) müşteriler
create table if not exists public.sales_customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text null,
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_customers_full_name
  on public.sales_customers using gin (to_tsvector('turkish', coalesce(full_name, '')));

-- RLS şimdilik kapalı; backend service role ile kullanılacak
alter table public.sales_customers disable row level security;



