-- ============================================================================
-- EXAM SCORING CONFIGS - Sınav Bazlı Puanlama Konfigürasyonları
-- SPECTRA ANAYASA v2.0 + EK PROTOKOL v2.1 Uyumlu
-- ============================================================================
-- 
-- BU TABLO:
-- - Her sınav için puanlama kurallarını tutar
-- - Recalculate engine'in TEK config kaynağıdır
-- - Preset (LGS/TYT/AYT) veya CUSTOM modları destekler
-- - lesson_weights ARRAY formatında (lesson_id + weight)
-- 
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_scoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Bağlantılar
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  -- Scoring Tipi
  scoring_type TEXT NOT NULL DEFAULT 'preset', -- 'preset' | 'custom'
  preset_name TEXT, -- 'LGS' | 'TYT' | 'AYT' | NULL (custom için)
  
  -- Temel Puanlama Parametreleri
  correct_score DECIMAL(4,2) NOT NULL DEFAULT 1.0, -- Doğru puan (genelde 1.0)
  wrong_penalty DECIMAL(4,2) NOT NULL DEFAULT 0.25, -- Yanlış ceza (0.25 = /4, 0.33 = /3)
  empty_score DECIMAL(4,2) NOT NULL DEFAULT 0, -- Boş puan (genelde 0)
  
  -- İptal Soru Politikası
  cancelled_question_policy TEXT NOT NULL DEFAULT 'count_as_correct',
  -- 'count_as_correct': İptal soru herkese doğru sayılır
  -- 'exclude_from_total': İptal soru toplam soru sayısından çıkarılır
  
  -- Ders Ağırlıkları (ARRAY format — ANAYASA EK PROTOKOL)
  -- Format: [{"lesson_id": "uuid-1", "weight": 1.32}, {"lesson_id": "uuid-2", "weight": 1.0}]
  lesson_weights JSONB DEFAULT '[]'::jsonb,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'ready'
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Bir sınav için tek config
  UNIQUE(exam_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_scoring_configs_org 
  ON exam_scoring_configs(organization_id);

CREATE INDEX IF NOT EXISTS idx_exam_scoring_configs_exam 
  ON exam_scoring_configs(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_scoring_configs_status 
  ON exam_scoring_configs(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE exam_scoring_configs ENABLE ROW LEVEL SECURITY;

-- SELECT: Kendi kurum verilerini görebilir
DROP POLICY IF EXISTS exam_scoring_configs_select ON exam_scoring_configs;
CREATE POLICY exam_scoring_configs_select ON exam_scoring_configs
  FOR SELECT
  USING (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
  );

-- INSERT: Kendi kurumuna ekleyebilir
DROP POLICY IF EXISTS exam_scoring_configs_insert ON exam_scoring_configs;
CREATE POLICY exam_scoring_configs_insert ON exam_scoring_configs
  FOR INSERT
  WITH CHECK (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
  );

-- UPDATE: Kendi kurum verilerini güncelleyebilir
DROP POLICY IF EXISTS exam_scoring_configs_update ON exam_scoring_configs;
CREATE POLICY exam_scoring_configs_update ON exam_scoring_configs
  FOR UPDATE
  USING (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
  );

-- DELETE: Kendi kurum verilerini silebilir
DROP POLICY IF EXISTS exam_scoring_configs_delete ON exam_scoring_configs;
CREATE POLICY exam_scoring_configs_delete ON exam_scoring_configs
  FOR DELETE
  USING (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
  );

-- ============================================================================
-- TRIGGER: updated_at otomatiği
-- ============================================================================

CREATE OR REPLACE FUNCTION update_exam_scoring_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exam_scoring_configs_updated ON exam_scoring_configs;
CREATE TRIGGER trigger_exam_scoring_configs_updated
  BEFORE UPDATE ON exam_scoring_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_scoring_configs_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exam_scoring_configs IS 'Sınav bazlı puanlama konfigürasyonları - SPECTRA ANAYASA v2.0 uyumlu';
COMMENT ON COLUMN exam_scoring_configs.scoring_type IS 'Puanlama tipi: preset (LGS/TYT/AYT) veya custom';
COMMENT ON COLUMN exam_scoring_configs.preset_name IS 'Preset adı: LGS, TYT, AYT (scoring_type=preset ise)';
COMMENT ON COLUMN exam_scoring_configs.correct_score IS 'Doğru cevap puanı (genelde 1.0)';
COMMENT ON COLUMN exam_scoring_configs.wrong_penalty IS 'Yanlış cevap cezası (0.25 = /4, 0.33 = /3)';
COMMENT ON COLUMN exam_scoring_configs.empty_score IS 'Boş cevap puanı (genelde 0)';
COMMENT ON COLUMN exam_scoring_configs.cancelled_question_policy IS 'İptal soru politikası: count_as_correct veya exclude_from_total';
COMMENT ON COLUMN exam_scoring_configs.lesson_weights IS 'Ders ağırlıkları array: [{"lesson_id": "uuid", "weight": 1.32}]';
COMMENT ON COLUMN exam_scoring_configs.status IS 'Config durumu: draft (taslak) veya ready (hazır)';

-- ============================================================================
-- PRESET DEFAULTS (LGS, TYT, AYT için default değerler)
-- ============================================================================
-- 
-- LGS:
--   wrong_penalty: 0.33 (yanlış / 3)
--   cancelled_question_policy: count_as_correct
--
-- TYT:
--   wrong_penalty: 0.25 (yanlış / 4)
--   cancelled_question_policy: count_as_correct
--   lesson_weights: Türkçe: 1.32, Sosyal: 1.36, Mat: 1.32, Fen: 1.36
--
-- AYT:
--   wrong_penalty: 0.25 (yanlış / 4)
--   cancelled_question_policy: count_as_correct
--   lesson_weights: Sınava göre değişir (Sayısal/Sözel/EA/Dil)
--
-- ============================================================================
