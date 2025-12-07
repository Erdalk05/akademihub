-- =============================================
-- ADD MISSING COLUMNS TO STUDENTS TABLE
-- Migration: 20251202
-- Purpose: Enable Excel import functionality
-- =============================================

-- Add name columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add contact columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add additional info columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS health_notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school TEXT;

-- Add finance columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_fee NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_first_name ON students(first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);

-- Update any NULL organization_id with default (if applicable)
UPDATE students 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'merkez' LIMIT 1)
WHERE organization_id IS NULL;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================



