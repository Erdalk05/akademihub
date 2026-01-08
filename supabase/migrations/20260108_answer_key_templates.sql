-- ============================================================================
-- ANSWER KEY TEMPLATES - Cevap Anahtarı Şablonları
-- Kurumlar için kayıtlı cevap anahtarı şablonları
-- ============================================================================

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS answer_key_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  exam_type VARCHAR(50) NOT NULL, -- LGS, TYT, AYT_SAY, vb.
  class_level VARCHAR(10), -- 4, 5, 6, 7, 8, 9, 10, 11, 12, mezun
  total_questions INTEGER NOT NULL DEFAULT 0,
  answer_data JSONB NOT NULL DEFAULT '{}', -- Tam cevap anahtarı verisi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- İndeksler için
  CONSTRAINT answer_key_templates_name_org_unique UNIQUE (organization_id, name)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_org ON answer_key_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_exam_type ON answer_key_templates(exam_type);
CREATE INDEX IF NOT EXISTS idx_answer_key_templates_created_at ON answer_key_templates(created_at DESC);

-- RLS Politikaları
ALTER TABLE answer_key_templates ENABLE ROW LEVEL SECURITY;

-- Kurum kullanıcıları kendi kurumlarının şablonlarını görebilir
CREATE POLICY "Kurum kullanıcıları kendi şablonlarını görebilir" ON answer_key_templates
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Kurum kullanıcıları şablon oluşturabilir
CREATE POLICY "Kurum kullanıcıları şablon oluşturabilir" ON answer_key_templates
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Kurum kullanıcıları kendi şablonlarını güncelleyebilir
CREATE POLICY "Kurum kullanıcıları kendi şablonlarını güncelleyebilir" ON answer_key_templates
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Kurum kullanıcıları kendi şablonlarını silebilir
CREATE POLICY "Kurum kullanıcıları kendi şablonlarını silebilir" ON answer_key_templates
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_answer_key_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_answer_key_templates_updated_at
  BEFORE UPDATE ON answer_key_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_answer_key_templates_updated_at();

-- Yorum
COMMENT ON TABLE answer_key_templates IS 'Kurumların kaydettiği cevap anahtarı şablonları';
COMMENT ON COLUMN answer_key_templates.answer_data IS 'CevapAnahtari tipinde JSON veri';
