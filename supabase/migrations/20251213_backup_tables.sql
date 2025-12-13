-- ============================================
-- Yedekleme Sistemi Tabloları
-- Tarih: 2025-12-13
-- ============================================

-- 1. Yedekleme geçmişi tablosu
CREATE TABLE IF NOT EXISTS backup_history (
  id TEXT PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'daily', -- daily, weekly, monthly, manual
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  tables_count INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  file_size BIGINT, -- bytes
  storage_path TEXT, -- S3/Supabase Storage path (opsiyonel)
  error_message TEXT,
  triggered_by VARCHAR(50) DEFAULT 'system', -- system, manual, api
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_backup_history_type ON backup_history(type);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at);

-- 3. Otomatik temizlik: 1 yıldan eski yedek kayıtlarını sil
-- (Bu bir cron job ile çalıştırılabilir veya Supabase Edge Function)

COMMENT ON TABLE backup_history IS 'Sistem yedekleme geçmişi';

