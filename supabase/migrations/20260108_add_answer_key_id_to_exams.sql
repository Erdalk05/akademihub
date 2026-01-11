-- Migration: Add answer_key_id to exams table
-- Date: 2026-01-08
-- Purpose: Single source of truth for answer keys via sinav_cevap_anahtari

-- 1. Add answer_key_id column (nullable for backward compatibility)
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS answer_key_id UUID REFERENCES sinav_cevap_anahtari(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exams_answer_key_id ON exams(answer_key_id);

-- 3. Add comment
COMMENT ON COLUMN exams.answer_key_id IS 'Foreign key to sinav_cevap_anahtari - single source of truth for answer keys';

-- Note: We keep the legacy answer_key JSONB column for backward compatibility
-- but new exams should use answer_key_id exclusively
