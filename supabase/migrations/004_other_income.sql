-- =====================================================
-- AkademiHub - Diğer Gelirler (Other Income) Tablosu
-- Migration: 004_other_income.sql
-- Tarih: 2025-12-10
-- Açıklama: Kitap, Kırtasiye, Yemek, Üniforma ve diğer 
--           gelir kategorileri için yeni tablo
-- =====================================================

-- NOT: Bu tablo mevcut finance_installments tablosuna 
-- DOKUNMADAN, ayrı bir gelir takip sistemi oluşturur.

-- Diğer Gelirler Tablosu
CREATE TABLE IF NOT EXISTS other_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Öğrenci ilişkisi (opsiyonel - genel gelirler için null olabilir)
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Gelir bilgileri
  title TEXT NOT NULL,                    -- Gelir başlığı (örn: "Matematik Kitabı")
  category TEXT NOT NULL DEFAULT 'other', -- Kategori: book, uniform, meal, stationery, other
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,-- Tutar
  payment_type TEXT DEFAULT 'cash',       -- Ödeme türü: cash, card, bank, other
  
  -- Tarih ve notlar
  date TIMESTAMPTZ DEFAULT NOW(),         -- İşlem tarihi
  notes TEXT,                             -- Açıklama/notlar
  
  -- Oluşturan kullanıcı
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kategori enum kontrolü için constraint (opsiyonel ama önerilir)
-- ALTER TABLE other_income 
-- ADD CONSTRAINT check_category 
-- CHECK (category IN ('book', 'uniform', 'meal', 'stationery', 'other'));

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_other_income_student_id ON other_income(student_id);
CREATE INDEX IF NOT EXISTS idx_other_income_category ON other_income(category);
CREATE INDEX IF NOT EXISTS idx_other_income_date ON other_income(date);
CREATE INDEX IF NOT EXISTS idx_other_income_created_at ON other_income(created_at);

-- RLS (Row Level Security) - Tüm authenticated kullanıcılar için izin
ALTER TABLE other_income ENABLE ROW LEVEL SECURITY;

-- Tüm işlemlere izin veren policy
DROP POLICY IF EXISTS "allow_all_other_income" ON other_income;
CREATE POLICY "allow_all_other_income" ON other_income
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger fonksiyonu (eğer yoksa oluştur)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trigger_other_income_updated_at ON other_income;
CREATE TRIGGER trigger_other_income_updated_at
  BEFORE UPDATE ON other_income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Başarı mesajı
SELECT 'other_income tablosu basariyla olusturuldu!' AS sonuc;

