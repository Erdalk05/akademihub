-- Settings Schema for AkademiHub
-- Kurum bilgileri, kullanıcılar, akademik yıllar, ödeme şablonları

-- 1. Kurum Ayarları Tablosu
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan kurum ayarları
INSERT INTO school_settings (key, value) VALUES
  ('school_name', 'AkademiHub Eğitim Kurumları'),
  ('school_address', 'Örnek Mah. Eğitim Cad. No:1 İstanbul'),
  ('school_phone', '0212 123 45 67'),
  ('school_email', 'info@akademihub.com'),
  ('school_website', 'www.akademihub.com'),
  ('school_logo', ''),
  ('school_tax_no', ''),
  ('school_mersis_no', ''),
  ('contract_template', ''),
  ('kvkk_text', '')
ON CONFLICT (key) DO NOTHING;

-- 2. Kullanıcılar Tablosu (Supabase Auth ile entegre)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'registrar' CHECK (role IN ('admin', 'accountant', 'registrar')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  permissions JSONB DEFAULT '{"finance":{"view":true,"edit":false,"delete":false},"students":{"view":true,"edit":false,"delete":false},"reports":{"view":true,"edit":false,"delete":false}}',
  password_hash VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan admin kullanıcı
INSERT INTO app_users (name, email, phone, role, status, permissions) VALUES
  ('Admin', 'admin@akademihub.com', '0532 123 45 67', 'admin', 'active', 
   '{"finance":{"view":true,"edit":true,"delete":true},"students":{"view":true,"edit":true,"delete":true},"reports":{"view":true,"edit":true,"delete":true}}')
ON CONFLICT (email) DO NOTHING;

-- 3. Akademik Yıllar Tablosu
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'future' CHECK (status IN ('active', 'past', 'future')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan akademik yıllar
INSERT INTO academic_years (name, start_date, end_date, status) VALUES
  ('2023-2024', '2023-09-01', '2024-06-30', 'past'),
  ('2024-2025', '2024-09-01', '2025-06-30', 'active'),
  ('2025-2026', '2025-09-01', '2026-06-30', 'future')
ON CONFLICT DO NOTHING;

-- 4. Ödeme Şablonları Tablosu
CREATE TABLE IF NOT EXISTS payment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(12,2) NOT NULL,
  max_installments INTEGER DEFAULT 10,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan ödeme şablonları
INSERT INTO payment_templates (name, base_price, max_installments, description) VALUES
  ('LGS Hazırlık', 120000, 10, '8. sınıf LGS hazırlık programı'),
  ('YKS Hazırlık', 150000, 12, '12. sınıf YKS hazırlık programı'),
  ('Genel Eğitim', 80000, 10, 'Standart eğitim programı'),
  ('IB Diploma', 250000, 12, 'Uluslararası Bakalorya programı')
ON CONFLICT DO NOTHING;

-- 5. İletişim Ayarları Tablosu
CREATE TABLE IF NOT EXISTS communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('sms', 'email', 'whatsapp')),
  is_enabled BOOLEAN DEFAULT false,
  provider_name VARCHAR(100),
  api_key TEXT,
  api_secret TEXT,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan iletişim ayarları
INSERT INTO communication_settings (provider_type, is_enabled, provider_name) VALUES
  ('sms', false, 'netgsm'),
  ('email', false, 'smtp'),
  ('whatsapp', false, 'whatsapp_business')
ON CONFLICT DO NOTHING;

-- Indexler
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_academic_years_status ON academic_years(status);
CREATE INDEX IF NOT EXISTS idx_payment_templates_active ON payment_templates(is_active);


