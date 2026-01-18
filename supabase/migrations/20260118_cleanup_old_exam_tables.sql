-- =============================================
-- CLEANUP OLD EXAM TABLES
-- Migration: 20260118_cleanup_old_exam_tables.sql
-- Date: 2026-01-18
-- Purpose: Remove unused legacy exam tables before Exam Analytics implementation
-- =============================================

-- CONTEXT:
-- These tables were part of the initial schema (001_init_schema.sql)
-- but were never used in production. They are being removed to:
-- 1. Avoid confusion with new Exam Analytics tables (ea_* prefix)
-- 2. Clean up the database schema
-- 3. Ensure no legacy references exist

-- SAFETY CHECK:
-- Before running this migration, ensure:
-- 1. No data exists in these tables (they were never used)
-- 2. No foreign keys reference these tables
-- 3. Backup has been taken

-- =============================================
-- DROP TABLES (CASCADE to remove dependencies)
-- =============================================

-- Drop exam_results first (has FK to exams)
DROP TABLE IF EXISTS exam_results CASCADE;

-- Drop questions (has FK to exams)
DROP TABLE IF EXISTS questions CASCADE;

-- Drop exams (parent table)
DROP TABLE IF EXISTS exams CASCADE;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify tables are dropped
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams') THEN
    RAISE EXCEPTION 'exams table still exists!';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
    RAISE EXCEPTION 'questions table still exists!';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_results') THEN
    RAISE EXCEPTION 'exam_results table still exists!';
  END IF;
  
  RAISE NOTICE 'Cleanup completed successfully. Old exam tables removed.';
END $$;

-- =============================================
-- NOTES FOR EXAM ANALYTICS IMPLEMENTATION
-- =============================================

-- NEW TABLE STRUCTURE (to be created in next migrations):
-- ea_sinavlar          → Exam definitions
-- ea_katilimcilar      → Exam participants (with student matching)
-- ea_sonuclar          → Exam results
-- ea_cevap_anahtarlari → Answer keys
-- optik_sablonlar      → Optical form templates

-- NAMING CONVENTION:
-- All Exam Analytics tables use 'ea_' prefix
-- All optical reading tables use 'optik_' prefix

-- ISOLATION RULES:
-- Exam Analytics module:
-- ✅ CAN read from: students, organizations, academic_years
-- ❌ CANNOT write to: students, finance_*
-- ✅ CAN write to: ea_*, optik_*

-- =============================================
-- END OF MIGRATION
-- =============================================
