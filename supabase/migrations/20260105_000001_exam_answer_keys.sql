-- ============================================
-- AkademiHub - Exam Answer Keys (Supabase-first)
-- Version: 1.0
-- Date: 2026-01-05
-- ============================================
--
-- Amaç:
-- - Manuel cevap anahtarı verisini tek kaynak olarak Supabase'te tutmak
-- - organization_id + exam_id ile cevap anahtarı okuma/yazma
--
-- Not:
-- - exam_id UUID'dir ancak FK zorunlu DEĞİL (wizard sırasında "draft" id ile de kullanılabilir).
-- - Gerçek sınav id'leri için de aynı alan kullanılır.

CREATE TABLE IF NOT EXISTS exam_answer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id),
  exam_id UUID NOT NULL,

  -- Manuel cevap anahtarı (CevapAnahtariSatir[])
  answer_key JSONB NOT NULL,

  -- Kullanıcının sürükle-bırak ders sırası (opsiyonel)
  ders_sirasi TEXT[],

  -- UI kolaylığı için (LGS/TYT/AYT vb.)
  exam_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_answer_keys_org_exam
  ON exam_answer_keys (organization_id, exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_answer_keys_org
  ON exam_answer_keys (organization_id);


