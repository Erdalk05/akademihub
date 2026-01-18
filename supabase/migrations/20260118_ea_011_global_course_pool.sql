-- =============================================
-- EXAM ANALYTICS - GLOBAL DERS HAVUZU
-- Migration: 20260118_ea_011_global_course_pool.sql
-- Date: 2026-01-18
-- Purpose:
--  - organization_id = NULL → GLOBAL dersler
--  - organization_id NOT NULL → Kuruma özel dersler
-- =============================================


-- =====================================================
-- 1️⃣ organization_id kolonunu NULL yapılabilir hale getir
-- =====================================================
ALTER TABLE ea_dersler
  ALTER COLUMN organization_id DROP NOT NULL;


-- =====================================================
-- 2️⃣ UNIQUE constraint güncelle
-- organization_id NULL olabilir ama ders_kodu çakışmaz
-- =====================================================
ALTER TABLE ea_dersler
  DROP CONSTRAINT IF EXISTS unq_dersler_kod;

ALTER TABLE ea_dersler
  ADD CONSTRAINT unq_dersler_kod
  UNIQUE NULLS NOT DISTINCT (organization_id, ders_kodu);


-- =====================================================
-- 3️⃣ GLOBAL (MERKEZİ) DERS HAVUZU EKLE
-- organization_id = NULL
-- =====================================================
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

-- ═══════════════════════════════════════════════
-- İLKÖĞRETİM / LGS DERSLERİ
-- ═══════════════════════════════════════════════
(NULL, 'TUR', 'Türkçe', 'sozel', '#EF4444', 1, 40, 1, '4-8. sınıflar', true),
(NULL, 'MAT', 'Matematik', 'sayisal', '#3B82F6', 2, 40, 1, '4-8. sınıflar', true),
(NULL, 'FEN', 'Fen Bilimleri', 'sayisal', '#10B981', 3, 40, 1, '4-8. sınıflar', true),
(NULL, 'INK', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'sozel', '#8B5CF6', 4, 20, 1, '8. sınıf + LGS', true),
(NULL, 'DIN', 'Din Kültürü ve Ahlak Bilgisi', 'sozel', '#06B6D4', 5, 20, 1, '4-8. sınıflar', true),
(NULL, 'ING', 'İngilizce', 'dil', '#EC4899', 6, 20, 1, '4-8. sınıflar', true),

-- NOT: LGS’de ayrı "Sosyal Bilimler" dersi YOK
-- Sosyal içerik → İnkılap Tarihi içinde


-- ═══════════════════════════════════════════════
-- TYT / AYT ORTAK DERSLER
-- ═══════════════════════════════════════════════
(NULL, 'FIZ', 'Fizik', 'sayisal', '#2563EB', 11, 40, 1, 'TYT + AYT', true),
(NULL, 'KIM', 'Kimya', 'sayisal', '#16A34A', 12, 40, 1, 'TYT + AYT', true),
(NULL, 'BIY', 'Biyoloji', 'sayisal', '#059669', 13, 40, 1, 'TYT + AYT', true),
(NULL, 'TAR', 'Tarih', 'sozel', '#F59E0B', 14, 40, 1, 'TYT + AYT', true),
(NULL, 'COG', 'Coğrafya', 'sozel', '#84CC16', 15, 40, 1, 'TYT + AYT', true),
(NULL, 'FEL', 'Felsefe', 'sozel', '#A855F7', 16, 40, 1, 'TYT + AYT', true),
(NULL, 'EDB', 'Türk Dili ve Edebiyatı', 'sozel', '#DC2626', 17, 40, 1, 'TYT + AYT', true),

-- ═══════════════════════════════════════════════
-- AYT DETAY DERSLERİ
-- ═══════════════════════════════════════════════
(NULL, 'TAR1', 'Tarih-1', 'sozel', '#F59E0B', 21, 20, 1, 'AYT Sözel', true),
(NULL, 'TAR2', 'Tarih-2', 'sozel', '#F97316', 22, 20, 1, 'AYT Sözel', true),
(NULL, 'COG1', 'Coğrafya-1', 'sozel', '#84CC16', 23, 20, 1, 'AYT Sözel', true),
(NULL, 'COG2', 'Coğrafya-2', 'sozel', '#65A30D', 24, 20, 1, 'AYT Sözel', true),

-- ═══════════════════════════════════════════════
-- YABANCI DİL
-- ═══════════════════════════════════════════════
(NULL, 'ALM', 'Almanca', 'dil', '#EAB308', 31, 40, 1, 'YDT', true),
(NULL, 'FRA', 'Fransızca', 'dil', '#3B82F6', 32, 40, 1, 'YDT', true),
(NULL, 'ARB', 'Arapça', 'dil', '#22C55E', 33, 40, 1, 'YDT', true)

ON CONFLICT (organization_id, ders_kodu) DO UPDATE SET
  ders_adi = EXCLUDED.ders_adi,
  renk_kodu = EXCLUDED.renk_kodu,
  sira_no = EXCLUDED.sira_no,
  aciklama = EXCLUDED.aciklama,
  updated_at = NOW();


-- =====================================================
-- 4️⃣ TABLO AÇIKLAMALARI
-- =====================================================
COMMENT ON TABLE ea_dersler IS
'Ders tanımları:
- organization_id = NULL → Global ders
- organization_id NOT NULL → Kuruma özel ders';

COMMENT ON COLUMN ea_dersler.organization_id IS
'NULL = Global ders, NOT NULL = Kuruma özel ders';


-- =====================================================
-- 5️⃣ KONTROL SORGUSU (SONUÇ GÖRMEK İÇİN)
-- =====================================================
SELECT
  CASE
    WHEN organization_id IS NULL THEN 'GLOBAL'
    ELSE o.name
  END AS kurum,
  COUNT(*) AS ders_sayisi,
  STRING_AGG(ders_kodu, ', ' ORDER BY sira_no) AS dersler
FROM ea_dersler d
LEFT JOIN organizations o ON o.id = d.organization_id
GROUP BY organization_id, o.name
ORDER BY organization_id NULLS FIRST;
