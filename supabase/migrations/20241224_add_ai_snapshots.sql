-- ============================================
-- AkademiHub - AI Snapshot Cache System
-- ============================================
-- PHASE 5.1.1 - Enterprise AI Cache
--
-- Bu tablo:
-- - AI çıktılarını cache'ler
-- - Aynı veri için tekrar AI çağrısı önler
-- - Race condition koruması sağlar
-- - Audit trail için metadata tutar
-- ============================================

-- AI Snapshot tablosu
CREATE TABLE IF NOT EXISTS exam_student_ai_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Rol (öğrenci, veli, öğretmen)
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'teacher')),
  
  -- Analytics hash (değişiklik tespiti için)
  analytics_hash TEXT NOT NULL,
  
  -- Model bilgisi
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  
  -- AI çıktısı (yapılandırılmış)
  content JSONB NOT NULL,
  
  -- Mesaj metni (hızlı erişim için)
  message TEXT,
  
  -- Ton ayarı
  tone TEXT NOT NULL DEFAULT 'balanced',
  
  -- Veri kalitesi skoru (0-100)
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Kaynak: AI mi fallback mi?
  source TEXT NOT NULL CHECK (source IN ('ai', 'fallback')) DEFAULT 'ai',
  
  -- Durum: computing sırasında race condition engellenir
  status TEXT NOT NULL CHECK (status IN ('ready', 'computing', 'failed')) DEFAULT 'ready',
  
  -- Audit metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Token kullanımı (maliyet takibi)
  token_usage JSONB DEFAULT NULL,
  
  -- Üretim süresi (ms)
  generation_duration_ms INTEGER,
  
  -- Tetikleyici
  trigger_reason TEXT CHECK (trigger_reason IN ('initial', 'analytics_change', 'ttl_refresh', 'manual')) DEFAULT 'initial',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: Bir öğrenci + sınav + rol için tek snapshot
  UNIQUE (exam_id, student_id, role)
);

-- Hızlı lookup için index
CREATE INDEX IF NOT EXISTS idx_ai_snapshot_lookup 
ON exam_student_ai_snapshots (exam_id, student_id, role);

-- Hash bazlı lookup için index
CREATE INDEX IF NOT EXISTS idx_ai_snapshot_hash 
ON exam_student_ai_snapshots (analytics_hash);

-- Status bazlı lookup (computing olanları bulmak için)
CREATE INDEX IF NOT EXISTS idx_ai_snapshot_status 
ON exam_student_ai_snapshots (status) WHERE status != 'ready';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_snapshot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_snapshot_updated_at ON exam_student_ai_snapshots;
CREATE TRIGGER trigger_ai_snapshot_updated_at
  BEFORE UPDATE ON exam_student_ai_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_snapshot_updated_at();

-- Stale snapshots temizleme (90 günden eski computing/failed)
-- Bu cronjob ile çalıştırılabilir
CREATE OR REPLACE FUNCTION cleanup_stale_ai_snapshots()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM exam_student_ai_snapshots
  WHERE status IN ('computing', 'failed')
    AND updated_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS politikaları
ALTER TABLE exam_student_ai_snapshots ENABLE ROW LEVEL SECURITY;

-- Okuma: Kendi okulunun verileri
CREATE POLICY "ai_snapshots_select_policy" ON exam_student_ai_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN schools sc ON s.school_id = sc.id
      WHERE s.id = exam_student_ai_snapshots.student_id
        AND sc.id = auth.jwt() ->> 'school_id'::text
    )
  );

-- Yazma: Sadece sistem (service role)
CREATE POLICY "ai_snapshots_insert_policy" ON exam_student_ai_snapshots
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ai_snapshots_update_policy" ON exam_student_ai_snapshots
  FOR UPDATE
  USING (true);

-- Yorum
COMMENT ON TABLE exam_student_ai_snapshots IS 'AI Coach çıktılarını cache''ler. Race condition koruması ve maliyet kontrolü sağlar.';
COMMENT ON COLUMN exam_student_ai_snapshots.analytics_hash IS 'StudentAnalyticsOutput''un SHA-256 hash''i. Değişiklik tespiti için kullanılır.';
COMMENT ON COLUMN exam_student_ai_snapshots.status IS 'computing: AI çalışıyor, race lock aktif. ready: Kullanılabilir. failed: Hata oluştu.';
COMMENT ON COLUMN exam_student_ai_snapshots.confidence_score IS 'Veri kalitesi skoru (0-100). AI confidence değil, input completeness.';

