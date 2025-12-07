-- =====================================================================
-- AKADEMİHUB MASTER MIGRATION PACK
-- Finans, Satış, Ürün Yönetimi, Cari Hesap tam entegrasyon
-- =====================================================================

-- ==========================================================
-- 1) PRODUCTS (Ürün Havuzu)
-- ==========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null,
  stock integer not null default 0,
  minimum_stock integer not null default 0,
  description text null,
  image_url text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_name
  on public.products using gin (to_tsvector('turkish', coalesce(name, '')));

alter table public.products disable row level security;


-- ==========================================================
-- 2) SALES CUSTOMERS (Öğrenci Olmayan Müşteriler)
-- ==========================================================
create table if not exists public.sales_customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text null,
  created_at timestamptz not null default now()
);

alter table public.sales_customers disable row level security;


-- ==========================================================
-- 3) SALES (Satış)
-- ==========================================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_no text not null,
  customer_type text not null, -- 'student' | 'external'
  student_id uuid null references public.students(id) on delete set null,
  sales_customer_id uuid null references public.sales_customers(id) on delete set null,
  total_amount numeric not null,
  discount numeric not null default 0,
  tax numeric not null default 0,
  net_amount numeric not null,
  payment_method text null,
  status text not null default 'completed',
  sale_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_sales_sale_no
  on public.sales(sale_no);

create index if not exists idx_sales_sale_date
  on public.sales(sale_date);

alter table public.sales disable row level security;


-- ==========================================================
-- 4) SALE ITEMS (Satış kalemleri)
-- ==========================================================
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid null references public.products(id) on delete set null,
  product_name text not null,
  category text not null,
  quantity integer not null,
  unit_price numeric not null,
  total_price numeric not null,
  discount numeric not null default 0
);

create index if not exists idx_sale_items_sale_id
  on public.sale_items(sale_id);

alter table public.sale_items disable row level security;


-- ==========================================================
-- 5) FINANCE INSTALLMENTS (Taksit Sistemi Genişletme)
-- ==========================================================
alter table if exists public.finance_installments  
  add column if not exists is_old boolean not null default false;

alter table if exists public.finance_installments  
  add column if not exists is_new boolean not null default false;

alter table if exists public.finance_installments  
  add column if not exists source text null;  
  -- 'tuition' | 'sale'

alter table if exists public.finance_installments  
  add column if not exists sale_id uuid null references public.sales(id) on delete set null;

alter table if exists public.finance_installments
  add column if not exists agreement_id uuid null;

alter table if exists public.finance_installments
  add column if not exists transaction_type text null;
  -- 'tuition', 'sale', 'payment', 'refund'

create index if not exists idx_finance_installments_sale_id
  on public.finance_installments(sale_id);

create index if not exists idx_finance_installments_source
  on public.finance_installments(source);


-- ==========================================================
-- 6) FINANCE PAYMENTS (Ödeme hareketleri)
-- ==========================================================
create table if not exists public.finance_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  installment_id uuid null references public.finance_installments(id) on delete set null,
  sale_id uuid null references public.sales(id) on delete set null,
  amount numeric not null,
  payment_method text null,
  description text null,
  payment_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_payments_student
  on public.finance_payments(student_id);

create index if not exists idx_finance_payments_date
  on public.finance_payments(payment_date);

alter table public.finance_payments disable row level security;


-- ==========================================================
-- 7) VIEW: CARI HESAP (Finans + Satış + Ödeme birleşimi)
-- ==========================================================
create or replace view public.v_cari_hesap as
select
  fi.student_id,
  fi.id as installment_id,
  fi.amount,
  fi.paid_amount,
  fi.due_date,
  fi.status,
  fi.source,
  fi.sale_id,
  fi.transaction_type,
  'installment' as record_type,
  fi.created_at
from public.finance_installments fi

union all

select
  fp.student_id,
  fp.installment_id,
  fp.amount,
  fp.amount as paid_amount,
  fp.payment_date as due_date,
  'paid' as status,
  case when fp.sale_id is not null then 'sale' else 'tuition' end as source,
  fp.sale_id,
  'payment' as transaction_type,
  'payment' as record_type,
  fp.created_at
from public.finance_payments fp;
