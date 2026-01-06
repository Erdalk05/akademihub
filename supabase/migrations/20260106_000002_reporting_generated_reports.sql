-- ============================================
-- AkademiHub - Reporting: generated_reports
-- ============================================
-- Amaç:
-- - UI’dan üretilen PDF/Excel export'larını standart bir tabloda loglamak
-- - İleride server-side PDF/Excel üretimine (file_url + storage) evrimlemek
-- ============================================

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL, -- 'exam' | 'class' | 'dashboard' | ...
  sections JSONB,            -- exportable bölümler
  default_format TEXT,       -- 'pdf' | 'excel'
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,     -- 'exam' | 'class' | 'dashboard'
  entity_id TEXT NULL,           -- UUID veya string (esnek)
  section TEXT NULL,             -- 'students_table' | 'summary' | 'full_page' ...
  format TEXT NOT NULL,          -- 'pdf' | 'excel'
  status TEXT NOT NULL DEFAULT 'requested', -- requested | generating | generated_client | generated_server | failed
  title TEXT NULL,
  filename TEXT NULL,
  file_url TEXT NULL,            -- ileride storage URL
  metadata JSONB,                -- rowCount, filters, vs
  requested_by UUID NULL,        -- auth.uid()
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  generated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_org ON generated_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_entity ON generated_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created ON generated_reports(created_at DESC);

-- RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Templates: view within org
CREATE POLICY "report_templates_select_org"
  ON report_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Generated: view within org
CREATE POLICY "generated_reports_select_org"
  ON generated_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Generated: insert within org
CREATE POLICY "generated_reports_insert_org"
  ON generated_reports FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- Generated: update only owner (requested_by)
CREATE POLICY "generated_reports_update_owner"
  ON generated_reports FOR UPDATE
  USING (requested_by = auth.uid());


