-- ============================================================================
-- UNIVERSAL EXAM SECTIONS POPULATOR
-- Tüm sınavlar için otomatik olarak exam_sections ve exam_result_sections oluşturur
-- ============================================================================

DO $$
DECLARE
  v_exam RECORD;
  v_participant RECORD;
  v_result RECORD;
  v_section RECORD;
  v_section_ids UUID[];
  v_total_questions INT;
  v_section_ratio DECIMAL;
  v_sections_created INT := 0;
  v_results_created INT := 0;
BEGIN
  RAISE NOTICE '=== BAŞLANGIC: Universal Exam Sections Populator ===';
  
  -- Tüm Spectra kaynaklı sınavları bul
  FOR v_exam IN 
    SELECT id, name, exam_type, total_questions, organization_id
    FROM exams
    WHERE source = 'spectra' OR source IS NULL
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '>>> Processing Exam: % (ID: %)', v_exam.name, v_exam.id;
    
    -- Bu sınav için sections var mı kontrol et
    SELECT COUNT(*) INTO v_total_questions
    FROM exam_sections
    WHERE exam_id = v_exam.id;
    
    IF v_total_questions > 0 THEN
      RAISE NOTICE '  ✓ exam_sections already exists (%)', v_total_questions;
    ELSE
      RAISE NOTICE '  ✗ exam_sections MISSING - Creating standard LGS structure...';
      
      -- LGS standart yapısı oluştur (6-7 ders)
      -- Türkçe (20 soru)
      INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
      VALUES (v_exam.id, v_exam.organization_id, 'Türkçe', 'TUR', 20, 1, 1, 20)
      ON CONFLICT DO NOTHING;
      
      -- Matematik (20 soru)
      INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
      VALUES (v_exam.id, v_exam.organization_id, 'Matematik', 'MAT', 20, 2, 21, 40)
      ON CONFLICT DO NOTHING;
      
      -- Fen Bilimleri (20 soru)
      INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
      VALUES (v_exam.id, v_exam.organization_id, 'Fen Bilimleri', 'FEN', 20, 3, 41, 60)
      ON CONFLICT DO NOTHING;
      
      -- Sosyal Bilimler (10 soru) - İsteğe bağlı
      IF v_exam.total_questions >= 100 THEN
        INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
        VALUES (v_exam.id, v_exam.organization_id, 'Sosyal Bilimler', 'SOS', 10, 4, 61, 70)
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- T.C. İnkılap Tarihi (10 soru)
      INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
      VALUES (v_exam.id, v_exam.organization_id, 'T.C. İnkılap Tarihi ve Atatürkçülük', 'INK', 10, 5, 71, 80)
      ON CONFLICT DO NOTHING;
      
      -- Din Kültürü (10 soru)
      INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
      VALUES (v_exam.id, v_exam.organization_id, 'Din Kültürü ve Ahlak Bilgisi', 'DIN', 10, 6, 81, 90)
      ON CONFLICT DO NOTHING;
      
      -- İngilizce (10 soru)
      INSERT INTO exam_sections (exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
      VALUES (v_exam.id, v_exam.organization_id, 'İngilizce', 'ING', 10, 7, 91, 100)
      ON CONFLICT DO NOTHING;
      
      GET DIAGNOSTICS v_sections_created = ROW_COUNT;
      RAISE NOTICE '  ✓ Created % exam_sections', v_sections_created;
    END IF;
    
    -- exam_results tablosunu doldur (eksikse)
    FOR v_participant IN
      SELECT id, correct_count, wrong_count, empty_count, net, rank
      FROM exam_participants
      WHERE exam_id = v_exam.id
    LOOP
      -- exam_result var mı kontrol et
      SELECT * INTO v_result
      FROM exam_results
      WHERE exam_participant_id = v_participant.id;
      
      IF v_result.id IS NULL THEN
        -- Yoksa oluştur
        INSERT INTO exam_results (
          exam_participant_id,
          total_correct,
          total_wrong,
          total_blank,
          total_net,
          organization_rank,
          created_at
        ) VALUES (
          v_participant.id,
          COALESCE(v_participant.correct_count, 0),
          COALESCE(v_participant.wrong_count, 0),
          COALESCE(v_participant.empty_count, 0),
          COALESCE(v_participant.net, 0),
          v_participant.rank,
          NOW()
        )
        ON CONFLICT (exam_participant_id) DO NOTHING
        RETURNING * INTO v_result;
        
        v_results_created := v_results_created + 1;
      END IF;
    END LOOP;
    
    IF v_results_created > 0 THEN
      RAISE NOTICE '  ✓ Created % exam_results', v_results_created;
    END IF;
    
    -- exam_result_sections oluştur
    -- Bu sınav için toplam soru sayısı
    SELECT SUM(question_count) INTO v_total_questions
    FROM exam_sections
    WHERE exam_id = v_exam.id;
    
    IF v_total_questions > 0 THEN
      RAISE NOTICE '  → Populating exam_result_sections (total questions: %)...', v_total_questions;
      
      FOR v_result IN
        SELECT er.* 
        FROM exam_results er
        JOIN exam_participants ep ON ep.id = er.exam_participant_id
        WHERE ep.exam_id = v_exam.id
      LOOP
        -- Her section için result_section oluştur
        FOR v_section IN
          SELECT * FROM exam_sections
          WHERE exam_id = v_exam.id
          ORDER BY sort_order
        LOOP
          -- Bu dersin soru oranı
          v_section_ratio := v_section.question_count::DECIMAL / v_total_questions;
          
          -- Zaten var mı kontrol et
          IF NOT EXISTS (
            SELECT 1 FROM exam_result_sections
            WHERE exam_result_id = v_result.id
            AND exam_section_id = v_section.id
          ) THEN
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
            );
          END IF;
        END LOOP;
      END LOOP;
      
      RAISE NOTICE '  ✓ exam_result_sections populated';
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TAMAMLANDI ===';
  
  -- Final summary
  RAISE NOTICE '';
  RAISE NOTICE 'SUMMARY:';
  RAISE NOTICE '  - Processed exams: %', (SELECT COUNT(*) FROM exams WHERE source = 'spectra' OR source IS NULL);
  RAISE NOTICE '  - Total exam_sections: %', (SELECT COUNT(*) FROM exam_sections);
  RAISE NOTICE '  - Total exam_results: %', (SELECT COUNT(*) FROM exam_results);
  RAISE NOTICE '  - Total exam_result_sections: %', (SELECT COUNT(*) FROM exam_result_sections);
  
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT 
  e.id as exam_id,
  e.name as exam_name,
  COUNT(DISTINCT es.id) as sections_count,
  COUNT(DISTINCT er.id) as results_count,
  COUNT(ers.id) as result_sections_count,
  CASE 
    WHEN COUNT(DISTINCT es.id) = 0 THEN '❌ NO SECTIONS'
    WHEN COUNT(ers.id) = 0 THEN '❌ NO RESULT_SECTIONS'
    WHEN COUNT(ers.id) = COUNT(DISTINCT er.id) * COUNT(DISTINCT es.id) THEN '✅ COMPLETE'
    ELSE '⚠️ INCOMPLETE'
  END as status
FROM exams e
LEFT JOIN exam_sections es ON es.exam_id = e.id
LEFT JOIN exam_participants ep ON ep.exam_id = e.id
LEFT JOIN exam_results er ON er.exam_participant_id = ep.id
LEFT JOIN exam_result_sections ers ON ers.exam_result_id = er.id
WHERE e.source = 'spectra' OR e.source IS NULL
GROUP BY e.id, e.name
ORDER BY e.created_at DESC;
