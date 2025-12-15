-- =====================================================
-- AkademiHub - Diğer Gelirler Ödeme Takibi
-- Migration: 005_other_income_payment.sql
-- Tarih: 2025-12-15
-- Açıklama: Diğer gelirlere ödeme takibi için alanlar ekleme
-- =====================================================

-- Ödeme durumu için yeni alanlar
ALTER TABLE other_income ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE other_income ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE other_income ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE other_income ADD COLUMN IF NOT EXISTS due_date DATE;

-- İndeks
CREATE INDEX IF NOT EXISTS idx_other_income_is_paid ON other_income(is_paid);
CREATE INDEX IF NOT EXISTS idx_other_income_due_date ON other_income(due_date);

-- Mevcut kayıtları ödendi olarak işaretle (geriye dönük uyumluluk)
UPDATE other_income SET is_paid = true, paid_amount = amount, paid_at = date WHERE is_paid IS NULL OR is_paid = false;

SELECT 'other_income odeme alanlari eklendi!' AS sonuc;
