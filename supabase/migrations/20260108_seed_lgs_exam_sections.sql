-- ============================================================================
-- LGS 8.SINIF SINAVI İÇİN SECTIONS VE RESULT_SECTIONS OLUŞTURMA
-- Exam ID: 77430063-1307-45b3-9dca-20600486d157
-- ============================================================================

DO $$
DECLARE
  v_exam_id UUID := '77430063-1307-45b3-9dca-20600486d157';
  v_org_id UUID;
  v_section_tur UUID;
  v_section_mat UUID;
  v_section_fen UUID;
  v_section_sos UUID;
  v_section_ink UUID;
  v_section_din UUID;
  v_section_ing UUID;
  v_result RECORD;
  v_participant RECORD;
BEGIN
  -- Organization ID'yi al
  SELECT organization_id INTO v_org_id
  FROM exams
  WHERE id = v_exam_id;
  
  RAISE NOTICE 'Organization ID: %', v_org_id;
  
  -- ================================================================
  -- 1. EXAM_SECTIONS OLUŞTUR (LGS 8. Sınıf Standart Yapısı)
  -- ================================================================
  
  -- Türkçe (20 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'Türkçe', 'TUR', 20, 1, 1, 20)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_tur;
  
  IF v_section_tur IS NULL THEN
    SELECT id INTO v_section_tur FROM exam_sections WHERE exam_id = v_exam_id AND code = 'TUR';
  END IF;
  RAISE NOTICE 'Türkçe Section ID: %', v_section_tur;
  
  -- Matematik (20 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'Matematik', 'MAT', 20, 2, 21, 40)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_mat;
  
  IF v_section_mat IS NULL THEN
    SELECT id INTO v_section_mat FROM exam_sections WHERE exam_id = v_exam_id AND code = 'MAT';
  END IF;
  RAISE NOTICE 'Matematik Section ID: %', v_section_mat;
  
  -- Fen Bilimleri (20 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'Fen Bilimleri', 'FEN', 20, 3, 41, 60)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_fen;
  
  IF v_section_fen IS NULL THEN
    SELECT id INTO v_section_fen FROM exam_sections WHERE exam_id = v_exam_id AND code = 'FEN';
  END IF;
  RAISE NOTICE 'Fen Bilimleri Section ID: %', v_section_fen;
  
  -- Sosyal Bilimler (10 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'Sosyal Bilimler', 'SOS', 10, 4, 61, 70)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_sos;
  
  IF v_section_sos IS NULL THEN
    SELECT id INTO v_section_sos FROM exam_sections WHERE exam_id = v_exam_id AND code = 'SOS';
  END IF;
  RAISE NOTICE 'Sosyal Bilimler Section ID: %', v_section_sos;
  
  -- İnkılap Tarihi (10 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'İnkılap Tarihi', 'INK', 10, 5, 71, 80)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_ink;
  
  IF v_section_ink IS NULL THEN
    SELECT id INTO v_section_ink FROM exam_sections WHERE exam_id = v_exam_id AND code = 'INK';
  END IF;
  RAISE NOTICE 'İnkılap Tarihi Section ID: %', v_section_ink;
  
  -- Din Kültürü (10 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'Din Kültürü', 'DIN', 10, 6, 81, 90)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_din;
  
  IF v_section_din IS NULL THEN
    SELECT id INTO v_section_din FROM exam_sections WHERE exam_id = v_exam_id AND code = 'DIN';
  END IF;
  RAISE NOTICE 'Din Kültürü Section ID: %', v_section_din;
  
  -- İngilizce (10 soru)
  INSERT INTO exam_sections (id, exam_id, organization_id, name, code, question_count, sort_order, start_question, end_question)
  VALUES (gen_random_uuid(), v_exam_id, v_org_id, 'İngilizce', 'ING', 10, 7, 91, 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_section_ing;
  
  IF v_section_ing IS NULL THEN
    SELECT id INTO v_section_ing FROM exam_sections WHERE exam_id = v_exam_id AND code = 'ING';
  END IF;
  RAISE NOTICE 'İngilizce Section ID: %', v_section_ing;
  
  RAISE NOTICE 'Exam sections oluşturuldu!';
  
  -- ================================================================
  -- 2. EXAM_RESULT_SECTIONS OLUŞTUR
  -- Mevcut exam_participants'tan exam_results'a geçiş yapıp
  -- her katılımcı için ders bazlı sonuçlar oluştur
  -- ================================================================
  
  -- Önce her katılımcı için exam_result var mı kontrol et
  FOR v_participant IN 
    SELECT id, correct_count, wrong_count, empty_count, net
    FROM exam_participants
    WHERE exam_id = v_exam_id
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
        created_at
      ) VALUES (
        v_participant.id,
        v_participant.correct_count,
        v_participant.wrong_count,
        v_participant.empty_count,
        v_participant.net,
        NOW()
      )
      RETURNING * INTO v_result;
      
      RAISE NOTICE 'Yeni exam_result oluşturuldu: %', v_result.id;
    END IF;
    
    -- Şimdi ders bazlı sonuçları ekle (eşit dağıtım - gerçek veri yoksa)
    -- Türkçe: 20 soruda yaklaşık %25 doğru
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_tur,
      FLOOR(v_participant.correct_count * 0.20),  -- %20
      FLOOR(v_participant.wrong_count * 0.20),
      FLOOR(v_participant.empty_count * 0.20),
      FLOOR(v_participant.correct_count * 0.20) - FLOOR(v_participant.wrong_count * 0.20) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
    -- Matematik: 20 soruda %20
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_mat,
      FLOOR(v_participant.correct_count * 0.20),
      FLOOR(v_participant.wrong_count * 0.20),
      FLOOR(v_participant.empty_count * 0.20),
      FLOOR(v_participant.correct_count * 0.20) - FLOOR(v_participant.wrong_count * 0.20) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
    -- Fen: 20 soruda %20
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_fen,
      FLOOR(v_participant.correct_count * 0.20),
      FLOOR(v_participant.wrong_count * 0.20),
      FLOOR(v_participant.empty_count * 0.20),
      FLOOR(v_participant.correct_count * 0.20) - FLOOR(v_participant.wrong_count * 0.20) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
    -- Sosyal: 10 soruda %10
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_sos,
      FLOOR(v_participant.correct_count * 0.10),
      FLOOR(v_participant.wrong_count * 0.10),
      FLOOR(v_participant.empty_count * 0.10),
      FLOOR(v_participant.correct_count * 0.10) - FLOOR(v_participant.wrong_count * 0.10) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
    -- İnkılap: 10 soruda %10
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_ink,
      FLOOR(v_participant.correct_count * 0.10),
      FLOOR(v_participant.wrong_count * 0.10),
      FLOOR(v_participant.empty_count * 0.10),
      FLOOR(v_participant.correct_count * 0.10) - FLOOR(v_participant.wrong_count * 0.10) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
    -- Din: 10 soruda %10
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_din,
      FLOOR(v_participant.correct_count * 0.10),
      FLOOR(v_participant.wrong_count * 0.10),
      FLOOR(v_participant.empty_count * 0.10),
      FLOOR(v_participant.correct_count * 0.10) - FLOOR(v_participant.wrong_count * 0.10) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
    -- İngilizce: 10 soruda %10
    INSERT INTO exam_result_sections (exam_result_id, exam_section_id, correct_count, wrong_count, blank_count, net)
    VALUES (
      v_result.id,
      v_section_ing,
      FLOOR(v_participant.correct_count * 0.10),
      FLOOR(v_participant.wrong_count * 0.10),
      FLOOR(v_participant.empty_count * 0.10),
      FLOOR(v_participant.correct_count * 0.10) - FLOOR(v_participant.wrong_count * 0.10) / 4.0
    )
    ON CONFLICT DO NOTHING;
    
  END LOOP;
  
  RAISE NOTICE 'Exam result sections oluşturuldu!';
  
END $$;
