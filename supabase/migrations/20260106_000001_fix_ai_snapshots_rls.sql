-- ============================================
-- AkademiHub - Fix AI Snapshots RLS to Organizations Model
-- Date: 2026-01-06
-- ============================================
-- Problem:
-- - Previous migration example referenced schools/school_id which is not aligned
--   with the multi-tenant organizations model in this repo.
-- Solution:
-- - Add organization_id to exam_student_ai_snapshots (denormalized)
-- - Backfill from exams.organization_id
-- - Replace RLS policies to use organization_users membership
-- ============================================

-- 1) Add organization_id (denormalize for fast RLS + filtering)
ALTER TABLE exam_student_ai_snapshots
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2) Backfill (prefer exam's organization)
UPDATE exam_student_ai_snapshots s
SET organization_id = e.organization_id
FROM exams e
WHERE s.exam_id = e.id
  AND s.organization_id IS NULL;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_ai_snapshot_org
ON exam_student_ai_snapshots (organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_snapshot_org_exam_student
ON exam_student_ai_snapshots (organization_id, exam_id, student_id);

-- 4) RLS: enable (idempotent)
ALTER TABLE exam_student_ai_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS ai_snapshots_select_policy ON exam_student_ai_snapshots;
DROP POLICY IF EXISTS ai_snapshots_insert_policy ON exam_student_ai_snapshots;
DROP POLICY IF EXISTS ai_snapshots_update_policy ON exam_student_ai_snapshots;

-- Select: user can read snapshots for organizations they belong to
CREATE POLICY ai_snapshots_select_policy ON exam_student_ai_snapshots
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Insert/Update: only service_role should write (app server bypasses anyway)
CREATE POLICY ai_snapshots_insert_policy ON exam_student_ai_snapshots
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY ai_snapshots_update_policy ON exam_student_ai_snapshots
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


