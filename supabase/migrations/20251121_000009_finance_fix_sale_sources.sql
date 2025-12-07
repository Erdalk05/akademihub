-- Mevcut verilerde eğitim ve satış taksitleri karışmış olabilir.
-- Bu migration, satışa bağlı taksitlerin source alanını 'sale' yaparak
-- öğrenci eğitim ekranından ayrılmasını sağlar.

-- 1) agreement_id'si sales tablosundaki bir satışa işaret eden tüm taksitler
--    kesin olarak satış taksiti kabul edilir.
update public.finance_installments fi
set source = 'sale'
where fi.agreement_id in (select id from public.sales)
  and (fi.source is null or fi.source <> 'sale');

-- 2) Not alanı "Satış:" ile başlayan taksitler de satış olarak işaretlenir.
update public.finance_installments fi
set source = 'sale'
where fi.note like 'Satış:%'
  and (fi.source is null or fi.source <> 'sale');

-- 3) Geri kalan ve source değeri NULL olan kayıtlar eğitim taksiti kabul edilip
--    açıkça 'education' olarak işaretlenir (daha net filtreleme için).
update public.finance_installments fi
set source = 'education'
where fi.source is null;


