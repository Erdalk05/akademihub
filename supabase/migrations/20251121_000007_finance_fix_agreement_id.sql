-- Bazı ortamlarda finance_installments tablosu eski şema ile oluştuğu için
-- agreement_id kolonu eksik kalmış olabilir. Bu migration kolonu ekler.

alter table if exists public.finance_installments
  add column if not exists agreement_id uuid null;



