-- ============================================================================
-- SPECTRA SOURCE COLUMN - Sınav Kaynağı Ayrımı
-- ============================================================================
-- Bu migration, Spectra sınavlarını eski/legacy sınavlardan ayırır.
-- 
-- Değerler:
--   'spectra' = Spectra Wizard ile oluşturulan sınavlar (aktif, kullanılacak)
--   'legacy'  = Eski sistem sınavları (gösterilmeyecek, saklanacak)
--   'import'  = Dışarıdan import edilen sınavlar (gelecekte)
-- ============================================================================

-- 1. Kolonu ekle (nullable + default)
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'spectra';

-- 2. Mevcut eski sınavları işaretle
-- Not: Bu sadece NULL olanları 'legacy' yapar
-- Spectra ile oluşturulanlar zaten 'spectra' olacak
UPDATE exams 
SET source = 'legacy' 
WHERE source IS NULL;

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_exams_source ON exams(source);
CREATE INDEX IF NOT EXISTS idx_exams_source_org ON exams(source, organization_id);

-- 4. Yorum
COMMENT ON COLUMN exams.source IS 'Sınav kaynağı: spectra (Wizard), legacy (eski sistem), import (dışarıdan)';

-- ============================================================================
-- END
-- ============================================================================
