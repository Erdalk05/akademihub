-- =============================================
-- EXAM ANALYTICS - GLOBAL DERS HAVUZU
-- Migration: 20260118_ea_011_global_course_pool.sql
-- Date: 2026-01-18
-- Purpose: Merkezi ders havuzu - Tüm kurumlar bu havuzdan çeker
-- =============================================

-- 1. ÖNCE: ea_dersler tablosunun organization_id kolonunu NULL yapılabilir hale getir
ALTER TABLE ea_dersler 
  ALTER COLUMN organization_id DROP NOT NULL;

-- 2. UNIQUE constraint'i güncelle (organization_id NULL olabilir)
ALTER TABLE ea_dersler 
  DROP CONSTRAINT IF EXISTS unq_dersler_kod;

ALTER TABLE ea_dersler 
  ADD CONSTRAINT unq_dersler_kod 
  UNIQUE NULLS NOT DISTINCT (organization_id, ders_kodu);

-- 3. GLOBAL (Merkezi) ders havuzunu oluştur
-- organization_id = NULL → Tüm kurumlar bu dersleri kullanabilir
INSERT INTO ea_dersler (
  organization_id,
  ders_kodu,
  ders_adi,
  ders_kategori,
  renk_kodu,
  sira_no,
  max_soru_sayisi,
  min_soru_sayisi,
  aciklama,
  is_active
) VALUES
  -- ════════════════════════════════════════════════════════════
  -- İLKÖĞRETİM DERSLERİ (4-8. Sınıflar)
  -- ════════════════════════════════════════════════════════════
  (NULL, 'TUR', 'Türkçe', 'sozel', '#EF4444', 1, 40, 1, 'Tüm sınıflar', true),
  (NULL, 'MAT', 'Matematik', 'sayisal', '#3B82F6', 2, 40, 1, 'Tüm sınıflar', true),
  (NULL, 'FEN', 'Fen Bilimleri', 'sayisal', '#10B981', 3, 40, 1, '4-8. sınıflar', true),
  (NULL, 'SOS', 'Sosyal Bilimler', 'sozel', '#F59E0B', 4, 40, 1, '4-7. sınıflar + TYT', true),
  (NULL, 'INK', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'sozel', '#8B5CF6', 5, 20, 1, '8. sınıf + LGS', true),
  (NULL, 'DIN', 'Din Kültürü ve Ahlak Bilgisi', 'sozel', '#06B6D4', 6, 20, 1, '4-8. sınıflar', true),
  (NULL, 'ING', 'İngilizce', 'dil', '#EC4899', 7, 20, 1, 'Tüm sınıflar', true),
  
  -- ════════════════════════════════════════════════════════════
  -- LİSE DERSLERİ (9-12. Sınıflar)
  -- ════════════════════════════════════════════════════════════
  (NULL, 'FIZ', 'Fizik', 'sayisal', '#3B82F6', 11, 40, 1, '9-12. sınıflar + AYT', true),
  (NULL, 'KIM', 'Kimya', 'sayisal', '#10B981', 12, 40, 1, '9-12. sınıflar + AYT', true),
  (NULL, 'BIY', 'Biyoloji', 'sayisal', '#059669', 13, 40, 1, '9-12. sınıflar + AYT', true),
  (NULL, 'TAR', 'Tarih', 'sozel', '#F59E0B', 14, 40, 1, '9-12. sınıflar + AYT', true),
  (NULL, 'COG', 'Coğrafya', 'sozel', '#84CC16', 15, 40, 1, '9-12. sınıflar + AYT', true),
  (NULL, 'FEL', 'Felsefe', 'sozel', '#A855F7', 16, 40, 1, '10-12. sınıflar + AYT', true),
  (NULL, 'EDB', 'Edebiyat', 'sozel', '#EF4444', 17, 40, 1, '9-12. sınıflar + AYT', true),
  
  -- ════════════════════════════════════════════════════════════
  -- AYT DETAY DERSLERİ
  -- ════════════════════════════════════════════════════════════
  (NULL, 'TAR1', 'Tarih-1', 'sozel', '#F59E0B', 21, 20, 1, 'AYT Sözel - İlkçağ-Ortaçağ', true),
  (NULL, 'TAR2', 'Tarih-2', 'sozel', '#F97316', 22, 20, 1, 'AYT Sözel - Yakınçağ-Günümüz', true),
  (NULL, 'COG1', 'Coğrafya-1', 'sozel', '#84CC16', 23, 20, 1, 'AYT Sözel - Fiziki Coğrafya', true),
  (NULL, 'COG2', 'Coğrafya-2', 'sozel', '#65A30D', 24, 20, 1, 'AYT Sözel - Beşeri Coğrafya', true),
  
  -- ════════════════════════════════════════════════════════════
  -- DİL DERSLERİ
  -- ════════════════════════════════════════════════════════════
  (NULL, 'ALM', 'Almanca', 'dil', '#EAB308', 31, 40, 1, 'Lise + AYT Dil', true),
  (NULL, 'FRA', 'Fransızca', 'dil', '#3B82F6', 32, 40, 1, 'Lise + AYT Dil', true),
  (NULL, 'ARB', 'Arapça', 'dil', '#22C55E', 33, 40, 1, 'Lise + AYT Dil', true)
ON CONFLICT (organization_id, ders_kodu) DO UPDATE SET
  ders_adi = EXCLUDED.ders_adi,
  renk_kodu = EXCLUDED.renk_kodu,
  sira_no = EXCLUDED.sira_no,
  aciklama = EXCLUDED.aciklama,
  updated_at = NOW();

-- 4. Kuruma özel dersleri silme (Artık global havuzdan çekilecek)
-- Eski organization-specific dersleri temizle (isteğe bağlı)
-- DELETE FROM ea_dersler WHERE organization_id IS NOT NULL;

-- 5. Yorum ekle
COMMENT ON TABLE ea_dersler IS 'Ders tanımları - Global havuz (organization_id=NULL) + Kuruma özel dersler';
COMMENT ON COLUMN ea_dersler.organization_id IS 'NULL = Global ders (tüm kurumlar), NOT NULL = Kuruma özel ders';

-- ════════════════════════════════════════════════════════════
-- KONTROL SORGUSU
-- ════════════════════════════════════════════════════════════
SELECT 
  CASE 
    WHEN organization_id IS NULL THEN 'GLOBAL (Tüm Kurumlar)'
    ELSE o.name
  END as kurum,
  COUNT(*) as ders_sayisi,
  STRING_AGG(ders_kodu, ', ' ORDER BY sira_no) as dersler
FROM ea_dersler d
LEFT JOIN organizations o ON o.id = d.organization_id
GROUP BY organization_id, o.name
ORDER BY organization_id NULLS FIRST;

RAISE NOTICE '✅ Global ders havuzu oluşturuldu! Artık tüm kurumlar bu dersleri kullanabilir.';
