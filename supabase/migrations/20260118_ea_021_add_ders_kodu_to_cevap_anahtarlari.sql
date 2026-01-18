-- =====================================================
-- ea_cevap_anahtarlari tablosuna ders_kodu ekleme
-- =====================================================

-- ders_kodu kolonu ekle (ders_id NULL olabilir, ders_kodu ile fallback)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ea_cevap_anahtarlari' AND column_name = 'ders_kodu'
    ) THEN
        ALTER TABLE ea_cevap_anahtarlari 
        ADD COLUMN ders_kodu VARCHAR(20);
    END IF;
END $$;

-- ders_id NULL olabilir hale getir
ALTER TABLE ea_cevap_anahtarlari 
ALTER COLUMN ders_id DROP NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_cevap_anahtarlari_ders_kodu ON ea_cevap_anahtarlari(ders_kodu);

-- Kontrol
DO $$
BEGIN
    RAISE NOTICE '✅ ea_cevap_anahtarlari tablosuna ders_kodu eklendi';
END $$;
