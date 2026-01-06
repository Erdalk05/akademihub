-- ============================================
-- AkademiHub - Reporting: generated_reports file_path
-- ============================================

ALTER TABLE generated_reports
ADD COLUMN IF NOT EXISTS file_path TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_generated_reports_file_path ON generated_reports(file_path);


