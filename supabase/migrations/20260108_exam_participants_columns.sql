-- ============================================================================
-- EXAM_PARTICIPANTS - Dashboard uyumlu kolonlar
-- Bu kolonlar Dashboard'un beklediği format için gerekli
-- ============================================================================

-- Sonuç kolonlarını ekle (yoksa)
ALTER TABLE exam_participants 
ADD COLUMN IF NOT EXISTS class_name TEXT,
ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wrong_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS empty_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS net DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS score DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS rank INTEGER,
ADD COLUMN IF NOT EXISTS answers JSONB;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_exam_participants_exam_id_rank ON exam_participants(exam_id, rank);
CREATE INDEX IF NOT EXISTS idx_exam_participants_class_name ON exam_participants(class_name);

-- Yorum
COMMENT ON COLUMN exam_participants.correct_count IS 'Toplam doğru sayısı';
COMMENT ON COLUMN exam_participants.wrong_count IS 'Toplam yanlış sayısı';
COMMENT ON COLUMN exam_participants.empty_count IS 'Toplam boş sayısı';
COMMENT ON COLUMN exam_participants.net IS 'Net puan (doğru - yanlış/4)';
COMMENT ON COLUMN exam_participants.score IS 'Tahmini puan';
COMMENT ON COLUMN exam_participants.rank IS 'Kurum sıralaması';
COMMENT ON COLUMN exam_participants.answers IS 'Öğrenci cevapları JSON formatında';
