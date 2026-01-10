-- ============================================================================
-- FIX: exam_results TABLOSU - Eksik Tablo Hatası Çözümü
-- ============================================================================

-- 1. exam_results tablosu zaten varsa silip yeniden oluştur
DROP TABLE IF EXISTS exam_results CASCADE;

CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_participant_id UUID NOT NULL UNIQUE REFERENCES exam_participants(id) ON DELETE CASCADE,
  
  -- Sonuçlar
  total_correct INT NOT NULL DEFAULT 0,
  total_wrong INT NOT NULL DEFAULT 0,
  total_blank INT NOT NULL DEFAULT 0,
  total_net DECIMAL(6,2) NOT NULL DEFAULT 0,
  
  -- Sıralamalar
  class_rank INT,
  organization_rank INT,
  percentile DECIMAL(5,2),
  
  -- AI Analiz (opsiyonel)
  ai_analysis JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index'ler
CREATE INDEX idx_exam_results_participant ON exam_results(exam_participant_id);
CREATE INDEX idx_exam_results_org_rank ON exam_results(organization_rank);

-- 3. RLS Enable + Policies
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_results_select" ON exam_results FOR SELECT USING (true);
CREATE POLICY "exam_results_insert" ON exam_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher'))
);
CREATE POLICY "exam_results_update" ON exam_results FOR UPDATE USING (
  EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher'))
);
CREATE POLICY "exam_results_delete" ON exam_results FOR DELETE USING (
  EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 4. Mevcut exam_participants verilerini migrate et
INSERT INTO exam_results (
  exam_participant_id,
  total_correct,
  total_wrong,
  total_blank,
  total_net,
  organization_rank,
  created_at
)
SELECT 
  id,
  COALESCE(correct_count, 0),
  COALESCE(wrong_count, 0),
  COALESCE(empty_count, 0),
  COALESCE(net, 0),
  rank,
  created_at
FROM exam_participants
ON CONFLICT (exam_participant_id) DO UPDATE SET
  total_correct = EXCLUDED.total_correct,
  total_wrong = EXCLUDED.total_wrong,
  total_blank = EXCLUDED.total_blank,
  total_net = EXCLUDED.total_net,
  organization_rank = EXCLUDED.organization_rank,
  updated_at = NOW();

-- 5. exam_result_sections için veri oluştur (eşit dağılım - gerçek veri yoksa)
DO $$
DECLARE
  v_result RECORD;
  v_section RECORD;
  v_section_count INT;
  v_total_sections INT;
BEGIN
  -- Her exam_result için
  FOR v_result IN SELECT * FROM exam_results LOOP
    -- İlgili sınavın sections'larını al
    SELECT COUNT(*) INTO v_total_sections
    FROM exam_sections es
    JOIN exam_participants ep ON ep.exam_id = es.exam_id
    WHERE ep.id = v_result.exam_participant_id;
    
    IF v_total_sections > 0 THEN
      v_section_count := 0;
      
      -- Her section için result_section oluştur
      FOR v_section IN 
        SELECT es.* 
        FROM exam_sections es
        JOIN exam_participants ep ON ep.exam_id = es.exam_id
        WHERE ep.id = v_result.exam_participant_id
        ORDER BY es.sort_order
      LOOP
        v_section_count := v_section_count + 1;
        
        -- Eşit dağılım: Her ders toplam soruların (1/toplam_ders) kadarını alır
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
          FLOOR(v_result.total_correct * v_section.question_count::DECIMAL / 
            (SELECT SUM(question_count) FROM exam_sections es2 
             JOIN exam_participants ep2 ON ep2.exam_id = es2.exam_id 
             WHERE ep2.id = v_result.exam_participant_id)),
          FLOOR(v_result.total_wrong * v_section.question_count::DECIMAL / 
            (SELECT SUM(question_count) FROM exam_sections es2 
             JOIN exam_participants ep2 ON ep2.exam_id = es2.exam_id 
             WHERE ep2.id = v_result.exam_participant_id)),
          FLOOR(v_result.total_blank * v_section.question_count::DECIMAL / 
            (SELECT SUM(question_count) FROM exam_sections es2 
             JOIN exam_participants ep2 ON ep2.exam_id = es2.exam_id 
             WHERE ep2.id = v_result.exam_participant_id)),
          FLOOR(v_result.total_correct * v_section.question_count::DECIMAL / 
            (SELECT SUM(question_count) FROM exam_sections es2 
             JOIN exam_participants ep2 ON ep2.exam_id = es2.exam_id 
             WHERE ep2.id = v_result.exam_participant_id)) - 
          FLOOR(v_result.total_wrong * v_section.question_count::DECIMAL / 
            (SELECT SUM(question_count) FROM exam_sections es2 
             JOIN exam_participants ep2 ON ep2.exam_id = es2.exam_id 
             WHERE ep2.id = v_result.exam_participant_id)) / 4.0
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

COMMENT ON TABLE exam_results IS 'Katılımcı sınav sonuçları (exam_participants ile 1:1)';
