-- ============================================================================
-- DEBUG: exam_result_sections KONTROL VE POPULATE
-- ============================================================================

-- 1. KONTROL: exam_result_sections tablosu tamamen boş mu?
SELECT 
  'exam_result_sections' AS tablo,
  COUNT(*) AS toplam_kayit
FROM exam_result_sections;

-- 2. KONTROL: Bu sınav için kayıt var mı?
SELECT 
  'bu_sinav_icin' AS kontrol,
  COUNT(*) AS kayit_sayisi
FROM exam_result_sections ers
JOIN exam_results er ON er.id = ers.exam_result_id
JOIN exam_participants ep ON ep.id = er.exam_participant_id
WHERE ep.exam_id = '77430063-1307-45b3-9dca-20600486d157';

-- 3. KONTROL: exam_sections var mı?
SELECT 
  'exam_sections' AS tablo,
  COUNT(*) AS toplam_section
FROM exam_sections
WHERE exam_id = '77430063-1307-45b3-9dca-20600486d157';

-- 4. KONTROL: exam_results var mı?
SELECT 
  'exam_results' AS tablo,
  COUNT(*) AS toplam_result
FROM exam_results er
JOIN exam_participants ep ON ep.id = er.exam_participant_id
WHERE ep.exam_id = '77430063-1307-45b3-9dca-20600486d157';

-- ============================================================================
-- EĞER YUKARIDAKILER:
-- - exam_sections: 7 kayıt
-- - exam_results: 54 kayıt
-- - exam_result_sections: 0 kayıt
-- 
-- O ZAMAN AŞAĞIDAKİ POPULATE SCRIPT'İNİ ÇALIŞTIR:
-- ============================================================================

DO $$
DECLARE
  v_exam_id UUID := '77430063-1307-45b3-9dca-20600486d157';
  v_result RECORD;
  v_section RECORD;
  v_total_questions INT;
  v_section_ratio DECIMAL;
BEGIN
  RAISE NOTICE 'Starting populate for exam: %', v_exam_id;
  
  -- Her exam_result için
  FOR v_result IN 
    SELECT er.* 
    FROM exam_results er
    JOIN exam_participants ep ON ep.id = er.exam_participant_id
    WHERE ep.exam_id = v_exam_id
  LOOP
    -- Toplam soru sayısını al
    SELECT SUM(question_count) INTO v_total_questions
    FROM exam_sections
    WHERE exam_id = v_exam_id;
    
    RAISE NOTICE 'Processing result_id: %, total_questions: %', v_result.id, v_total_questions;
    
    IF v_total_questions > 0 THEN
      -- Her section için result_section oluştur
      FOR v_section IN 
        SELECT * FROM exam_sections
        WHERE exam_id = v_exam_id
        ORDER BY sort_order
      LOOP
        -- Bu dersin soru oranı
        v_section_ratio := v_section.question_count::DECIMAL / v_total_questions;
        
        -- exam_result_sections'a ekle
        INSERT INTO exam_result_sections (
          exam_result_id,
          exam_section_id,
          correct_count,
          wrong_count,
          blank_count,
          net
        ) VALUES (
          v_result.id,
          v_section.id,
          GREATEST(0, FLOOR(v_result.total_correct * v_section_ratio)),
          GREATEST(0, FLOOR(v_result.total_wrong * v_section_ratio)),
          GREATEST(0, FLOOR(v_result.total_blank * v_section_ratio)),
          GREATEST(0, FLOOR(v_result.total_correct * v_section_ratio) - FLOOR(v_result.total_wrong * v_section_ratio) / 4.0)
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '  - Section: % (%), correct: %, wrong: %, net: %',
          v_section.name,
          v_section.code,
          FLOOR(v_result.total_correct * v_section_ratio),
          FLOOR(v_result.total_wrong * v_section_ratio),
          FLOOR(v_result.total_correct * v_section_ratio) - FLOOR(v_result.total_wrong * v_section_ratio) / 4.0;
      END LOOP;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Populate completed!';
END $$;

-- 5. DOĞRULA: Şimdi kayıtlar oluştu mu?
SELECT 
  'SONUC_KONTROL' AS durum,
  COUNT(*) AS olusturulan_kayit
FROM exam_result_sections ers
JOIN exam_results er ON er.id = ers.exam_result_id
JOIN exam_participants ep ON ep.id = er.exam_participant_id
WHERE ep.exam_id = '77430063-1307-45b3-9dca-20600486d157';

-- Beklenen: 54 öğrenci × 7 ders = 378 kayıt
