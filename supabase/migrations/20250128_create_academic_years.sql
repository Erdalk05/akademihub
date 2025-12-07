-- =============================================
-- ACADEMIC YEARS TABLE
-- Akademik yıl yönetimi (2023-2024, 2024-2025 vb.)
-- =============================================

CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Yıl bilgileri
  name VARCHAR(20) NOT NULL, -- '2024-2025'
  display_name VARCHAR(100), -- 'Eğitim Öğretim Yılı 2024-2025'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Durum
  is_active BOOLEAN DEFAULT false, -- Şu an aktif olan yıl
  is_closed BOOLEAN DEFAULT false, -- Yıl kapandı mı (read-only)
  is_current BOOLEAN DEFAULT false, -- Mevcut dönem (bir tane olmalı)
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT academic_years_name_org_unique UNIQUE (organization_id, name),
  CONSTRAINT academic_years_dates_valid CHECK (end_date > start_date),
  CONSTRAINT academic_years_name_format CHECK (name ~ '^\d{4}-\d{4}$')
);

-- Index'ler
CREATE INDEX idx_academic_years_organization ON academic_years(organization_id);
CREATE INDEX idx_academic_years_is_active ON academic_years(is_active);
CREATE INDEX idx_academic_years_is_current ON academic_years(is_current);
CREATE INDEX idx_academic_years_dates ON academic_years(start_date, end_date);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_academic_years_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_years_updated_at();

-- Bir kurumda sadece bir aktif yıl olabilir (trigger)
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
  
  IF NEW.is_current = true THEN
    UPDATE academic_years 
    SET is_current = false 
    WHERE organization_id = NEW.organization_id 
      AND id != NEW.id 
      AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_year
  BEFORE INSERT OR UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_year();

-- Varsayılan akademik yılları ekle (migration için)
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Merkez kampüs ID'sini al
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'merkez' LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    -- 2023-2024 (geçmiş)
    INSERT INTO academic_years (organization_id, name, display_name, start_date, end_date, is_active, is_closed, is_current)
    VALUES (
      v_org_id,
      '2023-2024',
      'Eğitim Öğretim Yılı 2023-2024',
      '2023-09-01',
      '2024-06-30',
      false,
      true,
      false
    ) ON CONFLICT (organization_id, name) DO NOTHING;
    
    -- 2024-2025 (mevcut)
    INSERT INTO academic_years (organization_id, name, display_name, start_date, end_date, is_active, is_closed, is_current)
    VALUES (
      v_org_id,
      '2024-2025',
      'Eğitim Öğretim Yılı 2024-2025',
      '2024-09-01',
      '2025-06-30',
      true,
      false,
      true
    ) ON CONFLICT (organization_id, name) DO NOTHING;
    
    -- 2025-2026 (gelecek - ön kayıt için)
    INSERT INTO academic_years (organization_id, name, display_name, start_date, end_date, is_active, is_closed, is_current)
    VALUES (
      v_org_id,
      '2025-2026',
      'Eğitim Öğretim Yılı 2025-2026',
      '2025-09-01',
      '2026-06-30',
      false,
      false,
      false
    ) ON CONFLICT (organization_id, name) DO NOTHING;
  END IF;
END $$;

-- Yorum ekle
COMMENT ON TABLE academic_years IS 'Akademik yıl tanımları (2023-2024, 2024-2025 vb.)';
COMMENT ON COLUMN academic_years.is_active IS 'Şu an aktif olan yıl (veri girişi bu yıla yapılıyor)';
COMMENT ON COLUMN academic_years.is_closed IS 'Yıl kapandı (read-only, sadece raporlama)';
COMMENT ON COLUMN academic_years.is_current IS 'Mevcut eğitim dönemi';




