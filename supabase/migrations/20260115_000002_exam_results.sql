-- ============================================================================
-- EXAM RESULTS - Kalıcı Hesaplama Sonuçları
-- SPECTRA ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
-- ============================================================================
-- 
-- BU TABLO:
-- - Recalculate API'den gelen sonuçları KALICI olarak saklar
-- - Step 5 UI bu tablodan okur
-- - Her hesaplama sonrası DELETE + INSERT yapılır (upsert benzeri)
-- - Scoring engine'den bağımsız, sadece sonuç deposu
-- 
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Bağlantılar
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_answer_id UUID NOT NULL REFERENCES exam_student_answers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- nullable (misafir için)
  
  -- Katılımcı Bilgileri
  participant_name TEXT, -- Öğrenci adı veya misafir adı
  participant_identifier TEXT NOT NULL, -- UNIQUE identifier (student_no veya custom)
  booklet_type TEXT, -- 'A' | 'B' | 'C' | 'D' | NULL
  
  -- Hesaplama Sonuçları
  total_correct INT NOT NULL DEFAULT 0,
  total_wrong INT NOT NULL DEFAULT 0,
  total_empty INT NOT NULL DEFAULT 0,
  total_cancelled INT NOT NULL DEFAULT 0,
  total_net NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_score NUMERIC(8,2) NOT NULL DEFAULT 0,
  
  -- Ders Bazlı Breakdown (JSONB)
  -- Format: [{"lesson_id": "uuid", "lesson_code": "TUR", "lesson_name": "Türkçe", 
  --           "correct": 15, "wrong": 3, "empty": 2, "cancelled": 0, 
  --           "net": 14.25, "weighted_score": 18.81}]
  lesson_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Scoring Config Snapshot (hesaplama sırasında kullanılan config)
  -- Format: {"scoring_type": "preset", "preset_name": "LGS", 
  --          "correct_score": 1.0, "wrong_penalty": 0.33, 
  --          "cancelled_question_policy": "count_as_correct",
  --          "lesson_weights": [...]}
  scoring_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Meta
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Bir sınav + öğrenci için tek sonuç
  UNIQUE(exam_id, student_answer_id)
);

-- ============================================================================
-- INDEXES (Performans için kritik)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_results_exam 
  ON exam_results(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_student_answer 
  ON exam_results(student_answer_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_student 
  ON exam_results(student_id) WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exam_results_calculated 
  ON exam_results(calculated_at);

-- Net bazlı sıralama için
CREATE INDEX IF NOT EXISTS idx_exam_results_net 
  ON exam_results(exam_id, total_net DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- SELECT: Kendi kurumunun sınavlarına ait sonuçları görebilir
DROP POLICY IF EXISTS exam_results_select ON exam_results;
CREATE POLICY exam_results_select ON exam_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_results.exam_id
      AND exams.organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    )
  );

-- INSERT: Kendi kurumunun sınavlarına sonuç ekleyebilir
DROP POLICY IF EXISTS exam_results_insert ON exam_results;
CREATE POLICY exam_results_insert ON exam_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_results.exam_id
      AND exams.organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    )
  );

-- UPDATE: Kendi kurumunun sınav sonuçlarını güncelleyebilir
DROP POLICY IF EXISTS exam_results_update ON exam_results;
CREATE POLICY exam_results_update ON exam_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_results.exam_id
      AND exams.organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    )
  );

-- DELETE: Kendi kurumunun sınav sonuçlarını silebilir
DROP POLICY IF EXISTS exam_results_delete ON exam_results;
CREATE POLICY exam_results_delete ON exam_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_results.exam_id
      AND exams.organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exam_results IS 'Sınav hesaplama sonuçları - KALICI depolama (SPECTRA ANAYASA v2.0)';
COMMENT ON COLUMN exam_results.exam_id IS 'Sınav ID (foreign key)';
COMMENT ON COLUMN exam_results.student_answer_id IS 'Öğrenci cevap kaydı ID (foreign key)';
COMMENT ON COLUMN exam_results.student_id IS 'Öğrenci ID (nullable - misafir için NULL)';
COMMENT ON COLUMN exam_results.participant_name IS 'Katılımcı adı (öğrenci veya misafir)';
COMMENT ON COLUMN exam_results.participant_identifier IS 'Katılımcı benzersiz tanımlayıcı (student_no veya custom)';
COMMENT ON COLUMN exam_results.booklet_type IS 'Kitapçık tipi (A/B/C/D/NULL)';
COMMENT ON COLUMN exam_results.total_correct IS 'Toplam doğru sayısı';
COMMENT ON COLUMN exam_results.total_wrong IS 'Toplam yanlış sayısı';
COMMENT ON COLUMN exam_results.total_empty IS 'Toplam boş sayısı';
COMMENT ON COLUMN exam_results.total_cancelled IS 'Toplam iptal soru sayısı';
COMMENT ON COLUMN exam_results.total_net IS 'Toplam net (doğru - yanlış*ceza)';
COMMENT ON COLUMN exam_results.total_score IS 'Toplam puan (ağırlıklı)';
COMMENT ON COLUMN exam_results.lesson_breakdown IS 'Ders bazlı detay breakdown (JSONB array)';
COMMENT ON COLUMN exam_results.scoring_snapshot IS 'Hesaplama sırasında kullanılan scoring config snapshot (JSONB)';
COMMENT ON COLUMN exam_results.calculated_at IS 'Hesaplama zamanı';

-- ============================================================================
-- ÖRNEK SORGULAR
-- ============================================================================
-- 
-- Belirli bir sınav için tüm sonuçlar (net sıralı):
-- SELECT * FROM exam_results 
-- WHERE exam_id = 'exam-uuid-here' 
-- ORDER BY total_net DESC;
--
-- Öğrenci bazlı arama:
-- SELECT * FROM exam_results 
-- WHERE exam_id = 'exam-uuid-here' 
-- AND participant_identifier ILIKE '%1234%';
--
-- Ders bazlı analiz:
-- SELECT participant_name, lesson_breakdown
-- FROM exam_results
-- WHERE exam_id = 'exam-uuid-here';
--
-- ============================================================================
