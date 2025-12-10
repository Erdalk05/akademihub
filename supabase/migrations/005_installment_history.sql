-- ============================================
-- 005: TAKSİT GEÇMİŞİ TABLOSU
-- Yeniden taksitlendirme yapıldığında eski taksitler burada saklanır
-- ============================================

-- Taksit Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS installment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Orijinal taksit bilgileri
  original_installment_id UUID,
  installment_no INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'archived',
  payment_method TEXT,
  description TEXT,
  
  -- Geçmiş meta bilgileri
  restructure_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restructure_reason TEXT, -- 'yeniden_taksitlendirme', 'indirim', 'iade' vb.
  restructured_by UUID REFERENCES app_users(id),
  
  -- Önceki toplam/yeni toplam karşılaştırması
  previous_total NUMERIC(12,2),
  new_total NUMERIC(12,2),
  previous_installment_count INTEGER,
  new_installment_count INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_installment_history_student ON installment_history(student_id);
CREATE INDEX IF NOT EXISTS idx_installment_history_date ON installment_history(restructure_date);

-- RLS Politikaları
ALTER TABLE installment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installment_history_select" ON installment_history FOR SELECT USING (true);
CREATE POLICY "installment_history_insert" ON installment_history FOR INSERT WITH CHECK (true);

COMMENT ON TABLE installment_history IS 'Yeniden taksitlendirme yapıldığında eski taksitlerin saklandığı arşiv tablosu';

