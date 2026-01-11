-- ============================================
-- 2026-01-09 Optical templates table + exam link
-- ============================================
CREATE TABLE IF NOT EXISTS optical_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  total_columns INT,
  total_questions INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS exams
  ADD COLUMN IF NOT EXISTS optical_template_id UUID REFERENCES optical_templates(id);

CREATE INDEX IF NOT EXISTS idx_optical_templates_org ON optical_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_exams_optical_template ON exams(optical_template_id);

ALTER TABLE optical_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY optical_templates_org_isolation ON optical_templates
  FOR ALL
  USING (organization_id = auth.jwt() ->> 'organization_id')
  WITH CHECK (organization_id = auth.jwt() ->> 'organization_id');
