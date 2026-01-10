-- ============================================================================
-- EXAM_RESULT_SECTIONS TABLOSU - Ders Bazlı Sonuçlar
-- Her katılımcının her dersteki performansı
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_result_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_result_id UUID NOT NULL REFERENCES exam_results(id) ON DELETE CASCADE,
  exam_section_id UUID NOT NULL REFERENCES exam_sections(id) ON DELETE CASCADE,
  
  -- Sonuç Verileri
  correct_count INT NOT NULL DEFAULT 0,     -- Doğru sayısı
  wrong_count INT NOT NULL DEFAULT 0,       -- Yanlış sayısı
  blank_count INT NOT NULL DEFAULT 0,       -- Boş sayısı
  net DECIMAL(6,2) NOT NULL DEFAULT 0,      -- Net (doğru - yanlış/4)
  
  -- Detaylı Cevaplar (opsiyonel)
  answers JSONB,                            -- {"1": "A", "2": "B", ...}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- İNDEKSLER
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_result_sections_result_id 
  ON exam_result_sections(exam_result_id);
  
CREATE INDEX IF NOT EXISTS idx_exam_result_sections_section_id 
  ON exam_result_sections(exam_section_id);

-- ============================================================================
-- RLS (Row Level Security) POLİCİES
-- ============================================================================

ALTER TABLE exam_result_sections ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (exam_result üzerinden filtrele)
CREATE POLICY "exam_result_sections_select" ON exam_result_sections
  FOR SELECT
  USING (true);

-- Sadece admin ekleyebilir/güncelleyebilir
CREATE POLICY "exam_result_sections_insert" ON exam_result_sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "exam_result_sections_update" ON exam_result_sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "exam_result_sections_delete" ON exam_result_sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- YORUM
-- ============================================================================

COMMENT ON TABLE exam_result_sections IS 'Katılımcıların ders bazlı sonuçları';
COMMENT ON COLUMN exam_result_sections.net IS 'Net hesaplaması: correct_count - (wrong_count / 4)';
COMMENT ON COLUMN exam_result_sections.answers IS 'Bu dersteki cevaplar (JSON): {"1": "A", "2": "B"}';
