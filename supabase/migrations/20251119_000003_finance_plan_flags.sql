-- Ek alanlar: eski / yeni plan ayrımı için
alter table if exists public.finance_installments
  add column if not exists is_old boolean not null default false;

alter table if exists public.finance_installments
  add column if not exists is_new boolean not null default false;




