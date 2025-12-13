-- ============================================
-- Taksit Sistemi Ek Özellikleri
-- Tarih: 2025-12-13
-- ============================================

-- 1. finance_installments tablosuna yeni sütunlar ekle
ALTER TABLE finance_installments 
ADD COLUMN IF NOT EXISTS postpone_reason TEXT,
ADD COLUMN IF NOT EXISTS postponed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS penalty_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalty_calculated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS original_due_date DATE,
ADD COLUMN IF NOT EXISTS postpone_count INTEGER DEFAULT 0;

-- 2. Geri iade tablosu oluştur
CREATE TABLE IF NOT EXISTS finance_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  installment_id UUID REFERENCES finance_installments(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'refund',
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'İade',
  refund_method VARCHAR(50), -- cash, bank_transfer, credit_card
  refund_details JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, cancelled
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Gecikme cezası geçmişi tablosu
CREATE TABLE IF NOT EXISTS penalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID REFERENCES finance_installments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  penalty_amount DECIMAL(12, 2) NOT NULL,
  days_overdue INTEGER NOT NULL,
  calculation_type VARCHAR(50), -- fixed, percentage, daily_percentage
  rate_applied DECIMAL(5, 4),
  waived BOOLEAN DEFAULT FALSE,
  waived_by UUID,
  waived_at TIMESTAMPTZ,
  waive_reason TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Aktivite logları tablosu (eğer yoksa)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  user_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. İndeksler
CREATE INDEX IF NOT EXISTS idx_refunds_student ON finance_refunds(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON finance_refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON finance_refunds(created_at);
CREATE INDEX IF NOT EXISTS idx_penalty_history_installment ON penalty_history(installment_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- 6. Status için index
CREATE INDEX IF NOT EXISTS idx_installments_status ON finance_installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_cancelled ON finance_installments(cancelled_at);

-- 7. Taksit öteleme ve iptal için RLS politikaları
-- (Sadece admin ve muhasebe erişebilir)

COMMENT ON TABLE finance_refunds IS 'Geri iade kayıtları';
COMMENT ON TABLE penalty_history IS 'Gecikme cezası geçmişi';
COMMENT ON TABLE activity_logs IS 'Sistem aktivite logları';

