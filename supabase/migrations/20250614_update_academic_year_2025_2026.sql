-- ================================================================
-- AKADEMİK YIL GÜNCELLEMESİ: 2024-2025 → 2025-2026
-- Tarih: 2025-06-14
-- Açıklama: Tüm öğrenci kayıtlarını ve ilgili tabloları yeni eğitim yılına taşır
-- ================================================================

-- 1. Önce academic_years tablosunda 2025-2026 yılını aktif yap
UPDATE academic_years 
SET is_active = false, is_current = false 
WHERE name = '2024-2025';

UPDATE academic_years 
SET is_active = true, is_current = true 
WHERE name = '2025-2026';

-- 2. Eğer 2025-2026 yoksa oluştur
INSERT INTO academic_years (name, display_name, start_date, end_date, is_active, is_current, is_closed)
SELECT 
  '2025-2026',
  'Eğitim Öğretim Yılı 2025-2026',
  '2025-09-01',
  '2026-08-31',
  true,
  true,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM academic_years WHERE name = '2025-2026'
);

-- 3. Tüm öğrencilerin academic_year alanını güncelle
UPDATE students 
SET academic_year = '2025-2026'
WHERE academic_year = '2024-2025' OR academic_year IS NULL;

-- 4. Öğrencilerin academic_year_id'sini de güncelle (eğer varsa)
UPDATE students s
SET academic_year_id = ay.id
FROM academic_years ay
WHERE ay.name = '2025-2026' 
  AND ay.is_active = true
  AND (s.academic_year = '2025-2026' OR s.academic_year_id IS NULL);

-- 5. Taksitlerin academic_year alanını güncelle
UPDATE finance_installments 
SET academic_year = '2025-2026'
WHERE academic_year = '2024-2025' OR academic_year IS NULL;

-- 6. Taksitlerin academic_year_id'sini de güncelle
UPDATE finance_installments fi
SET academic_year_id = ay.id
FROM academic_years ay
WHERE ay.name = '2025-2026' 
  AND ay.is_active = true
  AND (fi.academic_year = '2025-2026' OR fi.academic_year_id IS NULL);

-- 7. Activity logs için de güncelle
UPDATE activity_logs al
SET academic_year_id = ay.id
FROM academic_years ay
WHERE ay.name = '2025-2026' 
  AND ay.is_active = true
  AND al.academic_year_id IS NULL;

-- Sonuç kontrolü
DO $$
DECLARE
  student_count INTEGER;
  installment_count INTEGER;
  year_name TEXT;
BEGIN
  SELECT COUNT(*) INTO student_count FROM students WHERE academic_year = '2025-2026';
  SELECT COUNT(*) INTO installment_count FROM finance_installments WHERE academic_year = '2025-2026';
  SELECT name INTO year_name FROM academic_years WHERE is_active = true LIMIT 1;
  
  RAISE NOTICE '✅ Güncelleme tamamlandı!';
  RAISE NOTICE '   - Aktif Akademik Yıl: %', year_name;
  RAISE NOTICE '   - 2025-2026 Öğrenci sayısı: %', student_count;
  RAISE NOTICE '   - 2025-2026 Taksit sayısı: %', installment_count;
END $$;
