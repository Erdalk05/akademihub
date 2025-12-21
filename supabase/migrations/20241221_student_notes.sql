-- ============================================================================
-- STUDENT NOTES TABLE
-- Öğrenci hakkında notlar tutmak için
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Not içeriği
  title VARCHAR(255),  -- Not başlığı (opsiyonel)
  content TEXT NOT NULL,  -- Not içeriği
  category VARCHAR(50) DEFAULT 'general',  -- Kategori: general, payment, behavior, academic, other
  
  -- Meta bilgiler
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(255),  -- Notu yazan kişinin adı
  
  -- Tarihler
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_student_notes_student ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_org ON student_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_created ON student_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_notes_category ON student_notes(category);

-- RLS Policies
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_all_student_notes" ON student_notes
  FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read notes from their organization
CREATE POLICY "read_org_student_notes" ON student_notes
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE user_id = auth.uid()
  ));

-- Authenticated users can create notes
CREATE POLICY "create_student_notes" ON student_notes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE user_id = auth.uid()
  ));

-- Authenticated users can update their own notes
CREATE POLICY "update_own_notes" ON student_notes
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Grant permissions
GRANT ALL ON student_notes TO authenticated, service_role;
