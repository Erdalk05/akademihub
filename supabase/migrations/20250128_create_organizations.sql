-- =============================================
-- ORGANIZATIONS TABLE
-- Çoklu kurum/şube yönetimi için
-- =============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  tax_id VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Kurum ayarları (JSON)
  settings JSONB DEFAULT '{
    "currency": "TRY",
    "fiscalYearStart": "09-01",
    "defaultInstallmentCount": 10,
    "defaultDiscounts": {
      "sibling": 10,
      "earlyBird": 5,
      "staff": 20
    }
  }'::jsonb,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Index'ler
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Varsayılan kurum ekle (migration için)
INSERT INTO organizations (name, slug, tax_id, address, phone, email, is_active)
VALUES (
  'AkademiHub - Merkez Kampüs',
  'merkez',
  '1234567890',
  'Örnek Mahallesi, Örnek Caddesi No:1, İstanbul',
  '+90 212 000 00 00',
  'info@akademihub.com',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Yorum ekle
COMMENT ON TABLE organizations IS 'Kurum/şube bilgileri - çoklu tenant desteği';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN organizations.settings IS 'Kurum özel ayarları (JSON)';




