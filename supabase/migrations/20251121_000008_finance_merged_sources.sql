-- Birleşik finans yapısı için kaynak alanları
-- education / sale gibi farklı kaynaklardan gelen taksitleri tek tabloda yönetmek için

alter table if exists public.finance_installments
  add column if not exists source text default 'education';

alter table if exists public.finance_installments
  add column if not exists sale_id uuid null references public.sales(id) on delete set null;

-- Sorgu performansı için yardımcı index'ler
create index if not exists idx_finance_installments_source
  on public.finance_installments (source);

create index if not exists idx_finance_installments_sale_id
  on public.finance_installments (sale_id);


