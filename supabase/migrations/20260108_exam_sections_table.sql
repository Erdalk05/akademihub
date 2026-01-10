-- ============================================================================
-- EXAM_SECTIONS TABLOSU - Sınav Ders/Bölüm Yapısı
-- Her sınavın hangi derslerden oluştuğunu tanımlar
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  -- Ders Bilgileri
  name TEXT NOT NULL,                       -- 'Türkçe', 'Matematik', 'Fen Bilimleri'
  code TEXT NOT NULL,                       -- 'TUR', 'MAT', 'FEN', 'SOS', 'ING', 'DIN'
  
  -- Soru Yapısı
  question_count INT NOT NULL,              -- Bu derste kaç soru var
  start_question INT,                       -- Başlangıç soru numarası (opsiyonel)
  end_question INT,                         -- Bitiş soru numarası (opsiyonel)
  
  -- Sıralama
  sort_order INT NOT NULL DEFAULT 0,        -- Gösterim sırası
  
  -- Ek Bilgiler
  description TEXT,                         -- Açıklama (opsiyonel)
  is_active BOOLEAN DEFAULT true,           -- Aktif mi?
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- İNDEKSLER
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_sections_exam_id 
  ON exam_sections(exam_id);
  
CREATE INDEX IF NOT EXISTS idx_exam_sections_org_id 
  ON exam_sections(organization_id);
  
CREATE INDEX IF NOT EXISTS idx_exam_sections_code 
  ON exam_sections(code);

-- ============================================================================
-- RLS (Row Level Security) POLİCİES
-- ============================================================================

ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (exam üzerinden filtrele)
CREATE POLICY "exam_sections_select" ON exam_sections
  FOR SELECT
  USING (true);

-- Sadece admin ekleyebilir/güncelleyebilir
CREATE POLICY "exam_sections_insert" ON exam_sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "exam_sections_update" ON exam_sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "exam_sections_delete" ON exam_sections
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

COMMENT ON TABLE exam_sections IS 'Sınav ders/bölüm yapısı - Her sınavın hangi derslerden oluştuğu';
COMMENT ON COLUMN exam_sections.code IS 'Ders kodu: TUR, MAT, FEN, SOS, ING, DIN, TYT_TUR, AYT_MAT vb.';
COMMENT ON COLUMN exam_sections.question_count IS 'Bu derste toplam kaç soru var';
COMMENT ON COLUMN exam_sections.start_question IS 'Dersin başlangıç soru numarası (opsiyonel)';
COMMENT ON COLUMN exam_sections.end_question IS 'Dersin bitiş soru numarası (opsiyonel)';
