-- Core sales tables: products, sales, sale_items

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



