-- =====================================================
-- Multi-Tenant Migration: organization_id Columns
-- =====================================================
-- Bu migration, çoklu kurum desteği için gerekli 
-- organization_id sütunlarını tablolara ekler.
-- =====================================================

-- 1. Students tablosuna organization_id ekle
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 2. Finance_installments tablosuna organization_id ekle
ALTER TABLE finance_installments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 3. Enrollments tablosuna organization_id ekle  
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 4. Other_income tablosuna organization_id ekle
ALTER TABLE other_income 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 5. Expenses tablosuna organization_id ekle
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 6. Finance_logs tablosuna organization_id ekle
ALTER TABLE finance_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 7. Users tablosuna organization_id ekle (kullanıcı hangi kuruma bağlı)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- =====================================================
-- İndeksler (Performans için)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_organization_id ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_installments_organization_id ON finance_installments(organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_organization_id ON enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_other_income_organization_id ON other_income(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_logs_organization_id ON finance_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- =====================================================
-- Mevcut Verileri Varsayılan Kuruma Ata
-- =====================================================

-- İlk kurumu (merkez) varsayılan olarak al
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- İlk aktif kurumu bul
  SELECT id INTO default_org_id FROM organizations WHERE is_active = true ORDER BY created_at ASC LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- Mevcut öğrencileri varsayılan kuruma ata (organization_id NULL olanlar)
    UPDATE students SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Mevcut taksitleri varsayılan kuruma ata
    UPDATE finance_installments SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Mevcut kayıtları varsayılan kuruma ata
    UPDATE enrollments SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Mevcut diğer gelirleri varsayılan kuruma ata
    UPDATE other_income SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Mevcut giderleri varsayılan kuruma ata
    UPDATE expenses SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Mevcut logları varsayılan kuruma ata
    UPDATE finance_logs SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    -- Mevcut kullanıcıları varsayılan kuruma ata
    UPDATE users SET organization_id = default_org_id WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Tüm veriler % kurumuna atandı.', default_org_id;
  ELSE
    RAISE NOTICE 'Varsayılan kurum bulunamadı. Lütfen önce organizations tablosuna kurum ekleyin.';
  END IF;
END $$;

-- =====================================================
-- Örnek Kurumları Ekle (Henüz yoksa)
-- =====================================================

-- Dikmen Çözüm Kurs
INSERT INTO organizations (name, slug, tax_id, address, phone, email, is_active)
VALUES (
  'Dikmen Çözüm Kurs',
  'dikmen-cozum-kurs',
  '1234567891',
  'Dikmen Caddesi No:15, Çankaya, Ankara',
  '+90 312 000 00 01',
  'info@dikmencozumkurs.com',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Liderler Koleji
INSERT INTO organizations (name, slug, tax_id, address, phone, email, is_active)
VALUES (
  'Liderler Koleji',
  'liderler-koleji',
  '9876543210',
  'Bahçelievler Mahallesi, Liderler Sokak No:25, İstanbul',
  '+90 212 000 00 02',
  'info@liderlerkoleji.com',
  true
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

