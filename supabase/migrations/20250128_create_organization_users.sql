-- =============================================
-- ORGANIZATION_USERS TABLE
-- Kullanıcı-Kurum ilişkisi ve yetkileri
-- =============================================

CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Supabase auth.users tablosundan
  
  -- Rol ve yetkiler
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Kullanıcının ana kurumu
  
  -- Access control
  can_switch BOOLEAN DEFAULT true, -- Kurum değiştirebilir mi
  requires_password BOOLEAN DEFAULT false, -- Geçiş için şifre gerekir mi
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT organization_users_unique UNIQUE (organization_id, user_id),
  CONSTRAINT organization_users_role_valid CHECK (
    role IN ('super_admin', 'admin', 'accountant', 'teacher', 'staff', 'parent')
  )
);

-- Index'ler
CREATE INDEX idx_organization_users_org ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user ON organization_users(user_id);
CREATE INDEX idx_organization_users_role ON organization_users(role);
CREATE INDEX idx_organization_users_is_active ON organization_users(is_active);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_organization_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organization_users_updated_at
  BEFORE UPDATE ON organization_users
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_users_updated_at();

-- Varsayılan kullanıcı-kurum ilişkisi ekle (migration için)
-- Not: Bu kısım gerçek user_id'ler için manuel olarak yapılacak
-- Şimdilik sadece tablo yapısını oluşturuyoruz

-- View: Kullanıcının erişebildiği kurumlar
CREATE OR REPLACE VIEW user_organizations AS
SELECT 
  ou.user_id,
  o.id as organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  o.logo_url,
  ou.role,
  ou.is_primary,
  ou.is_active,
  ou.can_switch,
  ou.requires_password,
  ou.last_accessed_at
FROM organization_users ou
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.is_active = true AND o.is_active = true
ORDER BY ou.is_primary DESC, ou.last_accessed_at DESC NULLS LAST, o.name;

-- Function: Kullanıcının bir kuruma erişimi var mı?
CREATE OR REPLACE FUNCTION user_has_org_access(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = p_user_id 
      AND organization_id = p_org_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Kullanıcının kurumundaki rolü nedir?
CREATE OR REPLACE FUNCTION get_user_org_role(p_user_id UUID, p_org_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM organization_users
  WHERE user_id = p_user_id 
    AND organization_id = p_org_id 
    AND is_active = true
  LIMIT 1;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql;

-- Yorum ekle
COMMENT ON TABLE organization_users IS 'Kullanıcı-Kurum ilişkisi ve roller';
COMMENT ON COLUMN organization_users.is_primary IS 'Kullanıcının ana/varsayılan kurumu';
COMMENT ON COLUMN organization_users.requires_password IS 'Kurum değiştirirken şifre sor';
COMMENT ON VIEW user_organizations IS 'Kullanıcının erişebildiği tüm kurumlar';




