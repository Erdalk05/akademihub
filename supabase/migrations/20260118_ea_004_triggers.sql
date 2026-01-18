-- =============================================
-- EXAM ANALYTICS - TRIGGERS
-- Migration: 20260118_ea_004_triggers.sql
-- Date: 2026-01-18
-- Purpose: Triggers for Exam Analytics tables
-- =============================================

-- TRIGGER PURPOSES:
-- 1. Auto-update timestamps (updated_at)
-- 2. Data validation before insert/update
-- 3. Auto-calculate derived values (net, puan)
-- 4. Maintain data consistency

-- =============================================
-- 1. TIMESTAMP UPDATE FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_update_timestamp() IS 'Otomatik olarak updated_at timestamp''ini günceller';

-- =============================================
-- 2. APPLY TIMESTAMP TRIGGER TO ALL TABLES
-- =============================================

-- Dersler
CREATE TRIGGER trg_dersler_update_timestamp
  BEFORE UPDATE ON ea_dersler
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Sınavlar
CREATE TRIGGER trg_sinavlar_update_timestamp
  BEFORE UPDATE ON ea_sinavlar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Sınav Dersler
CREATE TRIGGER trg_sinav_dersler_update_timestamp
  BEFORE UPDATE ON ea_sinav_dersler
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Cevap Anahtarları
CREATE TRIGGER trg_cevap_anahtarlari_update_timestamp
  BEFORE UPDATE ON ea_cevap_anahtarlari
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Katılımcılar
CREATE TRIGGER trg_katilimcilar_update_timestamp
  BEFORE UPDATE ON ea_katilimcilar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Katılımcı Cevaplar
CREATE TRIGGER trg_katilimci_cevaplar_update_timestamp
  BEFORE UPDATE ON ea_katilimci_cevaplar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Sonuçlar
CREATE TRIGGER trg_sonuclar_update_timestamp
  BEFORE UPDATE ON ea_sonuclar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- Ders Sonuçları
CREATE TRIGGER trg_ders_sonuclari_update_timestamp
  BEFORE UPDATE ON ea_ders_sonuclari
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_update_timestamp();

-- =============================================
-- 3. EXAM DATE VALIDATION
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_validate_exam_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Sınav tarihi geçmişte olamaz (taslak hariç)
  IF NEW.durum != 'taslak' AND NEW.sinav_tarihi < CURRENT_DATE THEN
    RAISE EXCEPTION 'Sınav tarihi geçmişte olamaz (durum: %)', NEW.durum;
  END IF;
  
  -- Başlangıç saati bitiş saatinden önce olmalı
  IF NEW.baslangic_saati IS NOT NULL AND NEW.bitis_saati IS NOT NULL THEN
    IF NEW.baslangic_saati >= NEW.bitis_saati THEN
      RAISE EXCEPTION 'Başlangıç saati bitiş saatinden önce olmalı';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_validate_exam_dates() IS 'Sınav tarih ve saat kontrolü';

-- Apply to sinavlar
CREATE TRIGGER trg_sinavlar_validate_dates
  BEFORE INSERT OR UPDATE ON ea_sinavlar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_validate_exam_dates();

-- =============================================
-- 4. AUTO-CALCULATE NET (Ders Sonuçları)
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_calculate_ders_net()
RETURNS TRIGGER AS $$
BEGIN
  -- Net hesaplama: Doğru - (Yanlış / 3)
  -- Basitleştirilmiş formül, gerçek LGS/TYT formülü daha karmaşık
  NEW.net = NEW.dogru_sayisi - (NEW.yanlis_sayisi::NUMERIC / 3.0);
  
  -- Net negatif olamaz
  IF NEW.net < 0 THEN
    NEW.net = 0;
  END IF;
  
  -- Başarı yüzdesi hesaplama
  IF (NEW.dogru_sayisi + NEW.yanlis_sayisi + NEW.bos_sayisi) > 0 THEN
    NEW.basari_yuzdesi = (NEW.dogru_sayisi::NUMERIC / 
      (NEW.dogru_sayisi + NEW.yanlis_sayisi + NEW.bos_sayisi)::NUMERIC) * 100;
  ELSE
    NEW.basari_yuzdesi = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_calculate_ders_net() IS 'Ders sonuçları için net ve başarı yüzdesi hesapla';

-- Apply to ders_sonuclari
CREATE TRIGGER trg_ders_sonuclari_calculate_net
  BEFORE INSERT OR UPDATE ON ea_ders_sonuclari
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_calculate_ders_net();

-- =============================================
-- 5. AUTO-CALCULATE TOPLAM NET (Sonuçlar)
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_calculate_toplam_net()
RETURNS TRIGGER AS $$
BEGIN
  -- Toplam net hesaplama
  NEW.toplam_net = NEW.toplam_dogru - (NEW.toplam_yanlis::NUMERIC / 3.0);
  
  -- Net negatif olamaz
  IF NEW.toplam_net < 0 THEN
    NEW.toplam_net = 0;
  END IF;
  
  -- Başarı yüzdesi hesaplama
  IF NEW.toplam_soru > 0 THEN
    NEW.basari_yuzdesi = (NEW.toplam_dogru::NUMERIC / NEW.toplam_soru::NUMERIC) * 100;
  ELSE
    NEW.basari_yuzdesi = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_calculate_toplam_net() IS 'Toplam sonuçlar için net ve başarı yüzdesi hesapla';

-- Apply to sonuclar
CREATE TRIGGER trg_sonuclar_calculate_net
  BEFORE INSERT OR UPDATE ON ea_sonuclar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_calculate_toplam_net();

-- =============================================
-- 6. VALIDATE ANSWER KEY LENGTH
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_validate_cevap_anahtari()
RETURNS TRIGGER AS $$
DECLARE
  soru_sayisi INT;
  cevap_sayisi INT;
BEGIN
  -- Sınav-ders ilişkisinden soru sayısını al
  SELECT sd.soru_sayisi INTO soru_sayisi
  FROM ea_sinav_dersler sd
  WHERE sd.sinav_id = NEW.sinav_id
    AND sd.ders_id = NEW.ders_id;
  
  IF soru_sayisi IS NULL THEN
    RAISE EXCEPTION 'Sınav-ders ilişkisi bulunamadı';
  END IF;
  
  -- Cevaplar array uzunluğunu kontrol et
  cevap_sayisi = jsonb_array_length(NEW.cevaplar);
  
  IF cevap_sayisi != soru_sayisi THEN
    RAISE EXCEPTION 'Cevap anahtarı uzunluğu (%) soru sayısı (%) ile eşleşmiyor', 
      cevap_sayisi, soru_sayisi;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_validate_cevap_anahtari() IS 'Cevap anahtarı uzunluğunu kontrol eder';

-- Apply to cevap_anahtarlari
CREATE TRIGGER trg_cevap_anahtarlari_validate
  BEFORE INSERT OR UPDATE ON ea_cevap_anahtarlari
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_validate_cevap_anahtari();

-- =============================================
-- 7. VALIDATE KATILIMCI CEVAPLAR
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_validate_katilimci_cevaplar()
RETURNS TRIGGER AS $$
DECLARE
  soru_sayisi INT;
  cevap_sayisi INT;
BEGIN
  -- Sınav-ders ilişkisinden soru sayısını al
  SELECT sd.soru_sayisi INTO soru_sayisi
  FROM ea_sinav_dersler sd
  JOIN ea_katilimcilar k ON k.sinav_id = sd.sinav_id
  WHERE k.id = NEW.katilimci_id
    AND sd.ders_id = NEW.ders_id;
  
  IF soru_sayisi IS NULL THEN
    RAISE EXCEPTION 'Sınav-ders ilişkisi bulunamadı';
  END IF;
  
  -- Cevaplar array uzunluğunu kontrol et
  cevap_sayisi = jsonb_array_length(NEW.cevaplar);
  
  IF cevap_sayisi != soru_sayisi THEN
    RAISE EXCEPTION 'Cevap uzunluğu (%) soru sayısı (%) ile eşleşmiyor', 
      cevap_sayisi, soru_sayisi;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_validate_katilimci_cevaplar() IS 'Katılımcı cevaplarının uzunluğunu kontrol eder';

-- Apply to katilimci_cevaplar
CREATE TRIGGER trg_katilimci_cevaplar_validate
  BEFORE INSERT OR UPDATE ON ea_katilimci_cevaplar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_validate_katilimci_cevaplar();

-- =============================================
-- 8. AUTO-SET PUBLISHED TIMESTAMP
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_set_published_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- is_published true olduğunda published_at'i set et
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = NOW();
  END IF;
  
  -- is_published false olursa published_at'i NULL yap
  IF NEW.is_published = false AND OLD.is_published = true THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_set_published_timestamp() IS 'Yayınlama zamanını otomatik set eder';

-- Apply to sinavlar
CREATE TRIGGER trg_sinavlar_set_published
  BEFORE UPDATE ON ea_sinavlar
  FOR EACH ROW
  WHEN (OLD.is_published IS DISTINCT FROM NEW.is_published)
  EXECUTE FUNCTION trg_ea_set_published_timestamp();

-- =============================================
-- 9. PREVENT DELETION OF PUBLISHED EXAMS
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_prevent_published_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_published = true THEN
    RAISE EXCEPTION 'Yayınlanmış sınav silinemez. Önce yayından kaldırın.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_prevent_published_delete() IS 'Yayınlanmış sınavların silinmesini engeller';

-- Apply to sinavlar
CREATE TRIGGER trg_sinavlar_prevent_published_delete
  BEFORE DELETE ON ea_sinavlar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_prevent_published_delete();

-- =============================================
-- 10. AUTO-MARK EXAM AS CALCULATED
-- =============================================

CREATE OR REPLACE FUNCTION trg_ea_mark_calculated()
RETURNS TRIGGER AS $$
BEGIN
  -- Sonuç insert/update olduğunda hesaplandi flag'i true yap
  IF NEW.toplam_net IS NOT NULL AND NEW.toplam_net > 0 THEN
    NEW.hesaplandi = true;
    NEW.hesaplama_tarihi = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trg_ea_mark_calculated() IS 'Sonuç hesaplandığında flag''i işaretle';

-- Apply to sonuclar
CREATE TRIGGER trg_sonuclar_mark_calculated
  BEFORE INSERT OR UPDATE ON ea_sonuclar
  FOR EACH ROW
  EXECUTE FUNCTION trg_ea_mark_calculated();

-- =============================================
-- VERIFICATION
-- =============================================
DO $$
DECLARE
  trigger_count INT;
  function_count INT;
BEGIN
  -- Trigger sayısını kontrol et
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE c.relname LIKE 'ea_%';
  
  -- Function sayısını kontrol et
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname LIKE 'trg_ea_%'
    AND n.nspname = 'public';
  
  IF trigger_count < 18 THEN
    RAISE WARNING 'Beklenen trigger sayısı: 18+, Oluşan: %', trigger_count;
  END IF;
  
  IF function_count < 10 THEN
    RAISE WARNING 'Beklenen function sayısı: 10+, Oluşan: %', function_count;
  END IF;
  
  RAISE NOTICE '✓ Exam Analytics trigger''ları başarıyla oluşturuldu';
  RAISE NOTICE '  - % trigger', trigger_count;
  RAISE NOTICE '  - % function', function_count;
END $$;

-- =============================================
-- END OF MIGRATION
-- =============================================
