-- =============================================
-- HATA TANI SCRIPTI
-- Ders yükleme sorununu teşhis et
-- =============================================

-- 1. Organizations tablosunu kontrol et
SELECT 
  id,
  name,
  slug,
  created_at
FROM organizations
ORDER BY created_at
LIMIT 5;

-- 2. ea_dersler tablosunu kontrol et
SELECT 
  organization_id,
  ders_kodu,
  ders_adi,
  is_active,
  created_at
FROM ea_dersler
ORDER BY created_at DESC
LIMIT 20;

-- 3. Hangi organization'da kaç ders var?
SELECT 
  o.name as organization_name,
  o.id as organization_id,
  COUNT(d.id) as ders_sayisi
FROM organizations o
LEFT JOIN ea_dersler d ON d.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;

-- 4. Eksik dersler var mı? (LGS için 6 ders: TUR, MAT, FEN, INK, DIN, ING)
SELECT 
  'TUR' as beklenen_kod,
  CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'TUR') 
    THEN '✅ Var' 
    ELSE '❌ Yok' 
  END as durum
UNION ALL
SELECT 'MAT', CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'MAT') THEN '✅ Var' ELSE '❌ Yok' END
UNION ALL
SELECT 'FEN', CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'FEN') THEN '✅ Var' ELSE '❌ Yok' END
UNION ALL
SELECT 'INK', CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'INK') THEN '✅ Var' ELSE '❌ Yok' END
UNION ALL
SELECT 'DIN', CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'DIN') THEN '✅ Var' ELSE '❌ Yok' END
UNION ALL
SELECT 'ING', CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'ING') THEN '✅ Var' ELSE '❌ Yok' END
UNION ALL
SELECT 'SOS', CASE WHEN EXISTS (SELECT 1 FROM ea_dersler WHERE ders_kodu = 'SOS') THEN '✅ Var (TYT/AYT için)' ELSE '⚠️ Yok (TYT/AYT için gerekli)' END;
