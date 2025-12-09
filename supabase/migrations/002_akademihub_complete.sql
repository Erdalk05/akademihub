-- ============================================
-- AkademiHub - Complete Database Schema
-- Version: 2.0
-- Date: 2024
-- ============================================

-- Önce mevcut tabloları temizle (dikkat: production'da kullanmayın!)
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS installments CASCADE;
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;
-- DROP TABLE IF EXISTS guardians CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS app_users CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS academic_years CASCADE;

-- ============================================
-- 1. ACADEMIC YEARS (Akademik Yıllar)
-- ============================================
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- '2024-2025'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. APP_USERS (Uygulama Kullanıcıları)
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  name TEXT NOT NULL,
  surname TEXT,
  role TEXT NOT NULL DEFAULT 'STAFF', -- 'ADMIN', 'ACCOUNTING', 'STAFF'
  phone TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. STUDENTS (Öğrenciler)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  tc_no TEXT UNIQUE,
  birth_date DATE,
  birth_place TEXT,
  nationality TEXT DEFAULT 'TC',
  gender TEXT, -- 'male', 'female'
  blood_group TEXT,
  
  -- İletişim
  phone TEXT,
  phone2 TEXT,
  email TEXT,
  
  -- Adres
  city TEXT,
  district TEXT,
  address TEXT,
  
  -- Eğitim
  enrolled_class TEXT, -- '1. Sınıf', '2. Sınıf', vb.
  program_id TEXT,
  program_name TEXT,
  branch TEXT,
  previous_school TEXT,
  academic_year TEXT, -- '2024-2025'
  
  -- Sağlık
  health_notes TEXT,
  
  -- Fotoğraf
  photo_url TEXT,
  
  -- Durum
  status TEXT DEFAULT 'active', -- 'active', 'passive', 'graduated', 'transferred'
  registration_date DATE DEFAULT CURRENT_DATE,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES app_users(id)
);

-- ============================================
-- 4. GUARDIANS (Veliler)
-- ============================================
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Kişisel Bilgiler
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  tc_no TEXT,
  relation TEXT NOT NULL, -- 'mother', 'father', 'guardian', 'other'
  occupation TEXT,
  
  -- İletişim
  phone TEXT NOT NULL,
  phone2 TEXT,
  email TEXT,
  
  -- Adres
  city TEXT,
  district TEXT,
  address TEXT,
  
  -- Tip
  guardian_type TEXT DEFAULT 'primary', -- 'primary', 'legal', 'emergency'
  is_primary BOOLEAN DEFAULT false,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INSTALLMENTS (Taksitler)
-- ============================================
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Taksit Bilgileri
  installment_no INT NOT NULL, -- 0 = peşinat, 1-12 = taksitler
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- Ödeme Durumu
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue'
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  paid_date TIMESTAMPTZ,
  
  -- Ek Bilgiler
  description TEXT,
  academic_year TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. PAYMENTS (Ödemeler)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(id) ON DELETE SET NULL,
  
  -- Ödeme Bilgileri
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT NOT NULL, -- 'cash', 'credit_card', 'bank_transfer', 'pos'
  
  -- Detaylar
  description TEXT,
  receipt_no TEXT,
  
  -- Durum
  status TEXT DEFAULT 'completed', -- 'completed', 'cancelled', 'refunded'
  
  -- Kim aldı
  received_by UUID REFERENCES app_users(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. EXPENSES (Giderler)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gider Bilgileri
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL, -- 'personnel', 'rent', 'utilities', 'supplies', 'marketing', 'other'
  
  -- Detaylar
  description TEXT,
  vendor TEXT, -- Tedarikçi
  invoice_no TEXT,
  
  -- Ödeme
  payment_method TEXT, -- 'cash', 'bank_transfer', 'credit_card'
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT, -- 'monthly', 'yearly'
  
  -- Durum
  status TEXT DEFAULT 'paid', -- 'paid', 'pending', 'cancelled'
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES app_users(id)
);

-- ============================================
-- 8. CONTRACTS (Sözleşmeler)
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Sözleşme Bilgileri
  contract_no TEXT UNIQUE NOT NULL,
  contract_type TEXT DEFAULT 'enrollment', -- 'enrollment', 'renewal'
  
  -- Finansal
  total_fee DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  discount_reason TEXT,
  net_fee DECIMAL(10, 2) NOT NULL,
  down_payment DECIMAL(10, 2) DEFAULT 0,
  installment_count INT DEFAULT 1,
  
  -- Onaylar
  kvkk_approved BOOLEAN DEFAULT false,
  terms_approved BOOLEAN DEFAULT false,
  payment_approved BOOLEAN DEFAULT false,
  
  -- İmza
  guardian_signature TEXT, -- Base64 image
  guardian_signed_at TIMESTAMPTZ,
  institution_signature TEXT,
  institution_signed_at TIMESTAMPTZ,
  
  -- Durum
  status TEXT DEFAULT 'draft', -- 'draft', 'pending', 'signed', 'cancelled'
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES app_users(id)
);

-- ============================================
-- 9. ACTIVITY_LOGS (Aktivite Logları)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Kim
  user_id UUID REFERENCES app_users(id),
  user_email TEXT,
  user_name TEXT,
  
  -- Ne
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', etc.
  entity_type TEXT, -- 'student', 'payment', 'expense', 'user', etc.
  entity_id UUID,
  
  -- Detay
  description TEXT NOT NULL,
  metadata JSONB, -- Ek veriler
  
  -- IP & Device
  ip_address TEXT,
  user_agent TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. SETTINGS (Ayarlar)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Kurum Bilgileri
  institution_name TEXT DEFAULT 'AkademiHub',
  institution_logo TEXT,
  institution_address TEXT,
  institution_phone TEXT,
  institution_email TEXT,
  institution_website TEXT,
  tax_number TEXT,
  tax_office TEXT,
  
  -- API Ayarları
  sms_provider TEXT, -- 'twilio', 'netgsm', 'iletimerkezi'
  sms_api_key TEXT,
  sms_sender_id TEXT,
  
  email_provider TEXT, -- 'resend', 'sendgrid', 'smtp'
  email_api_key TEXT,
  email_from_address TEXT,
  
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  
  -- Finansal Ayarlar
  default_currency TEXT DEFAULT 'TRY',
  default_vat_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Meta
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES app_users(id)
);

-- ============================================
-- 11. PAYMENT_TEMPLATES (Ödeme Şablonları)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  installment_count INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. NOTIFICATIONS (Bildirimler)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  
  -- İlişki
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  
  -- Durum
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performans için)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_student_no ON students(student_no);
CREATE INDEX IF NOT EXISTS idx_students_tc_no ON students(tc_no);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year);
CREATE INDEX IF NOT EXISTS idx_students_enrolled_class ON students(enrolled_class);

CREATE INDEX IF NOT EXISTS idx_guardians_student_id ON guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);

CREATE INDEX IF NOT EXISTS idx_installments_student_id ON installments(student_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_contracts_student_id ON contracts(student_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- FUNCTIONS (Yardımcı Fonksiyonlar)
-- ============================================

-- Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guardians_updated_at ON guardians;
CREATE TRIGGER update_guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;
CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS'i etkinleştir
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service Role için tam erişim (API'ler için)
CREATE POLICY "Service role full access on app_users" ON app_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on students" ON students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on guardians" ON guardians
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on installments" ON installments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on expenses" ON expenses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on contracts" ON contracts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on activity_logs" ON activity_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VIEWS (Görünümler)
-- ============================================

-- Öğrenci Özet View
CREATE OR REPLACE VIEW student_summary AS
SELECT 
  s.id,
  s.student_no,
  s.first_name || ' ' || s.last_name AS full_name,
  s.enrolled_class,
  s.status,
  s.academic_year,
  COALESCE(SUM(i.amount), 0) AS total_fee,
  COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) AS paid_amount,
  COALESCE(SUM(CASE WHEN i.status IN ('pending', 'overdue') THEN i.amount ELSE 0 END), 0) AS remaining_amount,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count
FROM students s
LEFT JOIN installments i ON s.id = i.student_id
GROUP BY s.id, s.student_no, s.first_name, s.last_name, s.enrolled_class, s.status, s.academic_year;

-- Aylık Finans Özeti View
CREATE OR REPLACE VIEW monthly_finance_summary AS
SELECT 
  DATE_TRUNC('month', payment_date) AS month,
  COUNT(*) AS payment_count,
  SUM(amount) AS total_income
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

-- ============================================
-- DONE!
-- ============================================

