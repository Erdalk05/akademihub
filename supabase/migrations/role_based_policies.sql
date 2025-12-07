-- =====================================================
-- AkademiHub Role-Based Access Control (RBAC)
-- Supabase RLS Politikaları
-- =====================================================
-- Roller:
--   - admin: Tüm işlemleri yapabilir (SELECT, INSERT, UPDATE, DELETE)
--   - accounting (muhasebe): SELECT, INSERT yapabilir (DELETE ve UPDATE yasak)
--   - staff (personel): Sadece SELECT yapabilir
-- =====================================================

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "admin_all_students" ON students;
DROP POLICY IF EXISTS "accounting_read_students" ON students;
DROP POLICY IF EXISTS "staff_read_students" ON students;
DROP POLICY IF EXISTS "admin_all_installments" ON finance_installments;
DROP POLICY IF EXISTS "accounting_read_create_installments" ON finance_installments;
DROP POLICY IF EXISTS "staff_read_installments" ON finance_installments;
DROP POLICY IF EXISTS "admin_all_expenses" ON expenses;
DROP POLICY IF EXISTS "accounting_read_create_expenses" ON expenses;
DROP POLICY IF EXISTS "staff_read_expenses" ON expenses;

-- =====================================================
-- STUDENTS TABLOSU POLİTİKALARI
-- =====================================================

-- RLS'i etkinleştir
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Admin: Tüm işlemler
CREATE POLICY "admin_all_students" ON students
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Muhasebe: Sadece okuma ve ekleme
CREATE POLICY "accounting_select_students" ON students
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

CREATE POLICY "accounting_insert_students" ON students
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

-- Personel: Sadece okuma ve ekleme
CREATE POLICY "staff_select_students" ON students
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'staff'
    OR current_setting('app.current_user_role', true) = 'staff'
  );

CREATE POLICY "staff_insert_students" ON students
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'staff'
    OR current_setting('app.current_user_role', true) = 'staff'
  );

-- =====================================================
-- FINANCE_INSTALLMENTS (TAKSİTLER) TABLOSU POLİTİKALARI
-- =====================================================

ALTER TABLE finance_installments ENABLE ROW LEVEL SECURITY;

-- Admin: Tüm işlemler
CREATE POLICY "admin_all_installments" ON finance_installments
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Muhasebe: Okuma ve ekleme
CREATE POLICY "accounting_select_installments" ON finance_installments
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

CREATE POLICY "accounting_insert_installments" ON finance_installments
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

-- Muhasebe: Ödeme güncelleme (paid_amount, is_paid, status)
-- NOT: Bu admin olmadan muhasebecinin ödeme almasına izin verir
CREATE POLICY "accounting_update_payment_installments" ON finance_installments
  FOR UPDATE
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

-- Personel: Sadece okuma
CREATE POLICY "staff_select_installments" ON finance_installments
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'staff'
    OR current_setting('app.current_user_role', true) = 'staff'
  );

-- =====================================================
-- EXPENSES (GİDERLER) TABLOSU POLİTİKALARI
-- =====================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Admin: Tüm işlemler
CREATE POLICY "admin_all_expenses" ON expenses
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Muhasebe: Okuma ve ekleme
CREATE POLICY "accounting_select_expenses" ON expenses
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

CREATE POLICY "accounting_insert_expenses" ON expenses
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'accounting'
    OR current_setting('app.current_user_role', true) = 'accounting'
  );

-- Personel: Sadece okuma
CREATE POLICY "staff_select_expenses" ON expenses
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'staff'
    OR current_setting('app.current_user_role', true) = 'staff'
  );

-- =====================================================
-- ENROLLMENTS (KAYITLAR) TABLOSU POLİTİKALARI
-- =====================================================

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Admin: Tüm işlemler
CREATE POLICY "admin_all_enrollments" ON enrollments
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- Muhasebe ve Personel: Okuma ve ekleme
CREATE POLICY "accounting_staff_select_enrollments" ON enrollments
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' IN ('accounting', 'staff')
    OR current_setting('app.current_user_role', true) IN ('accounting', 'staff')
  );

CREATE POLICY "accounting_staff_insert_enrollments" ON enrollments
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' IN ('accounting', 'staff')
    OR current_setting('app.current_user_role', true) IN ('accounting', 'staff')
  );

-- =====================================================
-- APP_USERS (KULLANICILAR) TABLOSU POLİTİKALARI
-- =====================================================

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Sadece Admin: Tüm işlemler
CREATE POLICY "admin_all_app_users" ON app_users
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- =====================================================
-- FINANCE_LOGS (FİNANS LOGLARI) TABLOSU POLİTİKALARI
-- =====================================================

-- Eğer tablo varsa
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'finance_logs') THEN
    EXECUTE 'ALTER TABLE finance_logs ENABLE ROW LEVEL SECURITY';
    
    -- Admin: Tüm işlemler
    EXECUTE 'CREATE POLICY "admin_all_finance_logs" ON finance_logs
      FOR ALL
      USING (
        current_setting(''request.jwt.claims'', true)::json->>''role'' = ''admin''
        OR current_setting(''app.current_user_role'', true) = ''admin''
      )
      WITH CHECK (
        current_setting(''request.jwt.claims'', true)::json->>''role'' = ''admin''
        OR current_setting(''app.current_user_role'', true) = ''admin''
      )';
    
    -- Muhasebe: Okuma
    EXECUTE 'CREATE POLICY "accounting_select_finance_logs" ON finance_logs
      FOR SELECT
      USING (
        current_setting(''request.jwt.claims'', true)::json->>''role'' = ''accounting''
        OR current_setting(''app.current_user_role'', true) = ''accounting''
      )';
  END IF;
END $$;

-- =====================================================
-- PUBLIC ACCESS İÇİN SERVICE ROLE BYPASS
-- =====================================================
-- Service role key kullanıldığında RLS bypass edilir (bu zaten varsayılan)
-- API route'larımız service role kullanıyor, bu yüzden
-- backend'de rol kontrolü yapıyoruz

-- =====================================================
-- YARDIMCI FONKSİYONLAR
-- =====================================================

-- Kullanıcı rolünü ayarlamak için fonksiyon
CREATE OR REPLACE FUNCTION set_user_role(role_name TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_role', role_name, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut kullanıcı rolünü almak için fonksiyon
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('app.current_user_role', true),
    'staff'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- ÖZET
-- =====================================================
-- admin: SELECT, INSERT, UPDATE, DELETE (tüm tablolarda)
-- accounting: SELECT, INSERT (bazı tablolarda UPDATE - ödeme alma)
-- staff: SELECT, INSERT (sadece enrollment ve students)
-- =====================================================




