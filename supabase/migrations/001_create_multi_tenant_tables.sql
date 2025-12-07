-- =============================================
-- MULTI-TENANT & MULTI-PERIOD SYSTEM
-- Migration: 001
-- Created: 2025-11-28
-- =============================================

-- =============================================
-- 1. ORGANIZATIONS TABLE (Kurumlar)
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  tax_id VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Settings (JSON)
  settings JSONB DEFAULT '{
    "currency": "TRY",
    "timezone": "Europe/Istanbul",
    "language": "tr",
    "fiscal_year_start": "09-01",
    "default_installment_count": 10,
    "registration_fee": 5000
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Default organization (for existing data)
INSERT INTO organizations (name, slug, tax_id, address, phone, email)
VALUES (
  'Merkez Kampüs',
  'merkez',
  '1234567890',
  'İstanbul, Türkiye',
  '+90 555 123 4567',
  'info@akademihub.com'
) ON CONFLICT (slug) DO NOTHING;


-- =============================================
-- 2. ACADEMIC YEARS TABLE (Akademik Yıllar)
-- =============================================
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Year info
  name VARCHAR(50) NOT NULL, -- "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT false, -- Only one can be active per organization
  is_closed BOOLEAN DEFAULT false, -- Closed years are read-only
  
  -- Settings
  settings JSONB DEFAULT '{
    "registration_open": true,
    "allow_modifications": true
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, name),
  CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_academic_years_org ON academic_years(organization_id);
CREATE INDEX idx_academic_years_active ON academic_years(is_active);
CREATE INDEX idx_academic_years_dates ON academic_years(start_date, end_date);

-- Default academic year (current)
INSERT INTO academic_years (organization_id, name, start_date, end_date, is_active)
SELECT 
  id,
  '2024-2025',
  '2024-09-01'::DATE,
  '2025-06-30'::DATE,
  true
FROM organizations
WHERE slug = 'merkez'
ON CONFLICT (organization_id, name) DO NOTHING;


-- =============================================
-- 3. ORGANIZATION_USERS TABLE (Kurum-Kullanıcı İlişkisi)
-- =============================================
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users
  
  -- Role in this organization
  role VARCHAR(50) DEFAULT 'staff', -- admin, manager, accountant, teacher, staff
  
  -- Access control
  can_switch BOOLEAN DEFAULT false, -- Can switch to other organizations
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_users_org ON organization_users(organization_id);
CREATE INDEX idx_org_users_user ON organization_users(user_id);


-- =============================================
-- 4. ADD COLUMNS TO EXISTING TABLES
-- =============================================

-- Students table
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- Set default organization and year for existing students
UPDATE students 
SET 
  organization_id = (SELECT id FROM organizations WHERE slug = 'merkez' LIMIT 1),
  academic_year_id = (SELECT id FROM academic_years WHERE is_active = true LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE students ALTER COLUMN organization_id SET NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_org ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_year ON students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_org_year ON students(organization_id, academic_year_id);


-- Finance Installments table
ALTER TABLE finance_installments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- Set default for existing installments (via student)
UPDATE finance_installments fi
SET 
  organization_id = s.organization_id,
  academic_year_id = s.academic_year_id
FROM students s
WHERE fi.student_id = s.id AND fi.organization_id IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_installments_org ON finance_installments(organization_id);
CREATE INDEX IF NOT EXISTS idx_installments_year ON finance_installments(academic_year_id);


-- Activity Logs table
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;

-- Set default for existing logs
UPDATE activity_logs
SET 
  organization_id = (SELECT id FROM organizations WHERE slug = 'merkez' LIMIT 1),
  academic_year_id = (SELECT id FROM academic_years WHERE is_active = true LIMIT 1)
WHERE organization_id IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_year ON activity_logs(academic_year_id);


-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see organizations they belong to
CREATE POLICY org_select_policy ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Academic Years: Users can only see years from their organizations
CREATE POLICY year_select_policy ON academic_years
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Organization Users: Users can see their own memberships
CREATE POLICY org_users_select_policy ON organization_users
  FOR SELECT
  USING (user_id = auth.uid());


-- =============================================
-- 6. FUNCTIONS & TRIGGERS
-- =============================================

-- Function: Ensure only one active year per organization
CREATE OR REPLACE FUNCTION ensure_single_active_year()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE academic_years
    SET is_active = false
    WHERE organization_id = NEW.organization_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_single_active_year ON academic_years;
CREATE TRIGGER trigger_single_active_year
  BEFORE INSERT OR UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_year();


-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_years_updated_at ON academic_years;
CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Run this script in Supabase SQL Editor
-- Then verify with: SELECT * FROM organizations;

