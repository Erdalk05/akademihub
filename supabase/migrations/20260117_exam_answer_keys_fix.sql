-- ============================================
-- EXAM ANSWER KEYS - Kitapçık desteği ekleme
-- Version: 2.0
-- Date: 2026-01-17
-- ============================================

-- Mevcut yapı: answer_key JSONB (array)
-- Yeni yapı: question bazlı satırlar + kitapçık JSON

-- Eski answer_key JSONB kolonunu saklayalım (backward compat)
ALTER TABLE exam_answer_keys
  ADD COLUMN IF NOT EXISTS question_number INTEGER,
  ADD COLUMN IF NOT EXISTS correct_answer VARCHAR(10),
  ADD COLUMN IF NOT EXISTS section_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES exam_sections(id),
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS booklet_answers JSONB;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_exam_answer_keys_exam_question
  ON exam_answer_keys (exam_id, question_number);

CREATE INDEX IF NOT EXISTS idx_exam_answer_keys_section
  ON exam_answer_keys (section_id);

-- UNIQUE constraint: exam_id + question_number (bir sınav için her soru bir kez)
-- Ama mevcut UNIQUE (organization_id, exam_id) var, çakışabilir
-- Bu yüzden yeni constraint eklemeyelim, kod tarafından idempotent upsert yapacağız

COMMENT ON COLUMN exam_answer_keys.question_number IS 'Soru numarası (1-based)';
COMMENT ON COLUMN exam_answer_keys.correct_answer IS 'Doğru cevap (A/B/C/D/E veya boş)';
COMMENT ON COLUMN exam_answer_keys.section_code IS 'Ders kodu (lesson_code)';
COMMENT ON COLUMN exam_answer_keys.is_cancelled IS 'İptal edilmiş soru';
COMMENT ON COLUMN exam_answer_keys.booklet_answers IS 'Kitapçık bazlı cevaplar: {A:"B", B:"C", C:"D", D:"A"}';
