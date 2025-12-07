-- =============================================
-- MEVCUT TABLOLARA ORGANIZATION_ID VE ACADEMIC_YEAR_ID EKLEME
-- =============================================

-- 1. STUDENTS TABLOSUNA EKLE
-- =============================================
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_students_organization ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_org_year ON students(organization_id, academic_year_id);

-- Mevcut öğrencilere varsayılan değerler ata
DO $$
DECLARE
  v_org_id UUID;
  v_year_id UUID;
BEGIN
  -- Merkez kampüs ve aktif yıl ID'lerini al
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'merkez' LIMIT 1;
  SELECT id INTO v_year_id FROM academic_years WHERE is_active = true LIMIT 1;
  
  -- Mevcut öğrencileri güncelle
  IF v_org_id IS NOT NULL AND v_year_id IS NOT NULL THEN
    UPDATE students 
    SET organization_id = v_org_id,
        academic_year_id = v_year_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- organization_id'yi NOT NULL yap (varsayılan değerler atandıktan sonra)
ALTER TABLE students 
ALTER COLUMN organization_id SET NOT NULL;


-- 2. FINANCE_INSTALLMENTS TABLOSUNA EKLE
-- =============================================
ALTER TABLE finance_installments
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_installments_organization ON finance_installments(organization_id);
CREATE INDEX IF NOT EXISTS idx_installments_academic_year ON finance_installments(academic_year_id);

-- Mevcut taksitlere students tablosundan organization_id ve academic_year_id'yi kopyala
DO $$
BEGIN
  UPDATE finance_installments fi
  SET 
    organization_id = s.organization_id,
    academic_year_id = s.academic_year_id
  FROM students s
  WHERE fi.student_id = s.id
    AND fi.organization_id IS NULL;
END $$;

-- organization_id'yi NOT NULL yap
ALTER TABLE finance_installments
ALTER COLUMN organization_id SET NOT NULL;


-- 3. ACTIVITY_LOGS TABLOSUNA EKLE
-- =============================================
ALTER TABLE activity_logs
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_academic_year ON activity_logs(academic_year_id);

-- Mevcut loglara varsayılan değerler ata
DO $$
DECLARE
  v_org_id UUID;
  v_year_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'merkez' LIMIT 1;
  SELECT id INTO v_year_id FROM academic_years WHERE is_active = true LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    UPDATE activity_logs 
    SET organization_id = v_org_id,
        academic_year_id = v_year_id
    WHERE organization_id IS NULL;
  END IF;
END $$;


-- 4. FINANCE_EXPENSES TABLOSUNA EKLE (eğer varsa)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_expenses') THEN
    ALTER TABLE finance_expenses
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_expenses_organization ON finance_expenses(organization_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_academic_year ON finance_expenses(academic_year_id);
    
    -- Varsayılan değerler
    DECLARE
      v_org_id UUID;
      v_year_id UUID;
    BEGIN
      SELECT id INTO v_org_id FROM organizations WHERE slug = 'merkez' LIMIT 1;
      SELECT id INTO v_year_id FROM academic_years WHERE is_active = true LIMIT 1;
      
      IF v_org_id IS NOT NULL THEN
        UPDATE finance_expenses 
        SET organization_id = v_org_id,
            academic_year_id = v_year_id
        WHERE organization_id IS NULL;
      END IF;
    END;
  END IF;
END $$;


-- 5. ROW LEVEL SECURITY (RLS) POLİCİES
-- =============================================

-- Students için RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_org_isolation ON students
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Installments için RLS
ALTER TABLE finance_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY installments_org_isolation ON finance_installments
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Activity logs için RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_org_isolation ON activity_logs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );


-- Yorumlar
COMMENT ON COLUMN students.organization_id IS 'Öğrencinin kayıtlı olduğu kurum';
COMMENT ON COLUMN students.academic_year_id IS 'Öğrencinin kayıt yılı';
COMMENT ON COLUMN finance_installments.organization_id IS 'Taksitin ait olduğu kurum';
COMMENT ON COLUMN finance_installments.academic_year_id IS 'Taksitin ait olduğu akademik yıl';




