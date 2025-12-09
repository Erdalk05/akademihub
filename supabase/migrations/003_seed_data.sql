-- ============================================
-- AkademiHub - Seed Data (Örnek Veriler)
-- ============================================

-- ============================================
-- 1. ACADEMIC YEARS
-- ============================================
INSERT INTO academic_years (name, start_date, end_date, is_active) VALUES
  ('2023-2024', '2023-09-01', '2024-06-30', false),
  ('2024-2025', '2024-09-01', '2025-06-30', true),
  ('2025-2026', '2025-09-01', '2026-06-30', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. APP_USERS (Varsayılan Kullanıcılar)
-- Not: Şifreler bcrypt ile hash'lenmiş olmalı
-- Aşağıdaki hash'ler 'admin123' şifresine karşılık gelir
-- ============================================
INSERT INTO app_users (email, password_hash, name, surname, role, is_active) VALUES
  ('admin@akademihub.com', '$2b$10$rQZ9QH5F5QPQP5Q5Q5Q5Q.Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'Sistem', 'Admin', 'ADMIN', true),
  ('muhasebe@akademihub.com', '$2b$10$rQZ9QH5F5QPQP5Q5Q5Q5Q.Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'Muhasebe', 'Kullanıcı', 'ACCOUNTING', true),
  ('personel@akademihub.com', '$2b$10$rQZ9QH5F5QPQP5Q5Q5Q5Q.Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'Personel', 'Kullanıcı', 'STAFF', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. SETTINGS (Varsayılan Ayarlar)
-- ============================================
INSERT INTO settings (
  institution_name,
  institution_address,
  institution_phone,
  institution_email,
  default_currency
) VALUES (
  'AkademiHub Eğitim Kurumu',
  'Örnek Mahallesi, Eğitim Caddesi No: 1, İstanbul',
  '+90 212 123 45 67',
  'info@akademihub.com',
  'TRY'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 4. PAYMENT_TEMPLATES (Ödeme Şablonları)
-- ============================================
INSERT INTO payment_templates (name, description, total_amount, installment_count, is_active) VALUES
  ('Anaokulu Yıllık', 'Anaokulu yıllık eğitim ücreti', 85000.00, 10, true),
  ('İlkokul Yıllık', 'İlkokul yıllık eğitim ücreti', 95000.00, 10, true),
  ('Ortaokul Yıllık', 'Ortaokul yıllık eğitim ücreti', 105000.00, 10, true),
  ('Lise Yıllık', 'Lise yıllık eğitim ücreti', 120000.00, 10, true),
  ('Servis Ücreti', 'Yıllık servis ücreti', 25000.00, 10, true),
  ('Yemek Ücreti', 'Yıllık yemek ücreti', 18000.00, 10, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ÖRNEK ÖĞRENCİLER (Test için)
-- ============================================
INSERT INTO students (
  student_no, first_name, last_name, tc_no, birth_date, birth_place,
  nationality, gender, blood_group, phone, email, city, district,
  enrolled_class, program_name, academic_year, status
) VALUES
  ('250001', 'Ahmet', 'Yılmaz', '12345678901', '2015-03-15', 'İstanbul', 'TC', 'male', 'A+', '5551234567', 'veli1@email.com', 'İstanbul', 'Kadıköy', '3. Sınıf', 'İlkokul', '2024-2025', 'active'),
  ('250002', 'Ayşe', 'Demir', '12345678902', '2014-07-22', 'Ankara', 'TC', 'female', 'B+', '5551234568', 'veli2@email.com', 'İstanbul', 'Beşiktaş', '4. Sınıf', 'İlkokul', '2024-2025', 'active'),
  ('250003', 'Mehmet', 'Kaya', '12345678903', '2012-11-10', 'İzmir', 'TC', 'male', 'O+', '5551234569', 'veli3@email.com', 'İstanbul', 'Şişli', '6. Sınıf', 'Ortaokul', '2024-2025', 'active'),
  ('250004', 'Zeynep', 'Çelik', '12345678904', '2010-05-08', 'Bursa', 'TC', 'female', 'AB+', '5551234570', 'veli4@email.com', 'İstanbul', 'Üsküdar', '8. Sınıf', 'Ortaokul', '2024-2025', 'active'),
  ('250005', 'Can', 'Öztürk', '12345678905', '2008-09-25', 'İstanbul', 'TC', 'male', 'A-', '5551234571', 'veli5@email.com', 'İstanbul', 'Bakırköy', '10. Sınıf', 'Lise', '2024-2025', 'active')
ON CONFLICT (student_no) DO NOTHING;

-- ============================================
-- 6. ÖRNEK VELİLER
-- ============================================
INSERT INTO guardians (student_id, first_name, last_name, tc_no, relation, phone, email, guardian_type, is_primary)
SELECT 
  s.id,
  CASE 
    WHEN s.student_no = '250001' THEN 'Mustafa'
    WHEN s.student_no = '250002' THEN 'Ali'
    WHEN s.student_no = '250003' THEN 'Hasan'
    WHEN s.student_no = '250004' THEN 'Osman'
    WHEN s.student_no = '250005' THEN 'Kemal'
  END,
  s.last_name,
  REPLACE(s.tc_no, '01', '99'),
  'father',
  s.phone,
  s.email,
  'primary',
  true
FROM students s
WHERE s.student_no IN ('250001', '250002', '250003', '250004', '250005')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. ÖRNEK TAKSİTLER
-- ============================================
-- Her öğrenci için 10 taksit oluştur
DO $$
DECLARE
  student_rec RECORD;
  i INT;
  base_amount DECIMAL := 9500.00;
  due_date DATE;
BEGIN
  FOR student_rec IN SELECT id, student_no FROM students WHERE student_no IN ('250001', '250002', '250003', '250004', '250005')
  LOOP
    -- Peşinat (0. taksit)
    INSERT INTO installments (student_id, installment_no, amount, due_date, status, academic_year)
    VALUES (student_rec.id, 0, base_amount, '2024-09-01', 'paid', '2024-2025')
    ON CONFLICT DO NOTHING;
    
    -- 10 taksit
    FOR i IN 1..10 LOOP
      due_date := DATE '2024-09-01' + (i * INTERVAL '1 month');
      
      INSERT INTO installments (student_id, installment_no, amount, due_date, status, academic_year)
      VALUES (
        student_rec.id, 
        i, 
        base_amount,
        due_date,
        CASE 
          WHEN i <= 3 THEN 'paid'
          WHEN i = 4 THEN 'overdue'
          ELSE 'pending'
        END,
        '2024-2025'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 8. ÖRNEK ÖDEMELER
-- ============================================
INSERT INTO payments (student_id, installment_id, amount, payment_date, payment_method, description, status)
SELECT 
  i.student_id,
  i.id,
  i.amount,
  i.due_date,
  'bank_transfer',
  'Taksit ödemesi - ' || i.installment_no || '. taksit',
  'completed'
FROM installments i
WHERE i.status = 'paid'
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ÖRNEK GİDERLER
-- ============================================
INSERT INTO expenses (title, amount, expense_date, category, description, payment_method, status) VALUES
  ('Eylül Ayı Personel Maaşları', 150000.00, '2024-09-30', 'personnel', 'Eylül ayı maaş ödemeleri', 'bank_transfer', 'paid'),
  ('Ekim Ayı Personel Maaşları', 150000.00, '2024-10-31', 'personnel', 'Ekim ayı maaş ödemeleri', 'bank_transfer', 'paid'),
  ('Kasım Ayı Personel Maaşları', 150000.00, '2024-11-30', 'personnel', 'Kasım ayı maaş ödemeleri', 'bank_transfer', 'paid'),
  ('Kira - Eylül', 35000.00, '2024-09-01', 'rent', 'Eylül ayı kira', 'bank_transfer', 'paid'),
  ('Kira - Ekim', 35000.00, '2024-10-01', 'rent', 'Ekim ayı kira', 'bank_transfer', 'paid'),
  ('Kira - Kasım', 35000.00, '2024-11-01', 'rent', 'Kasım ayı kira', 'bank_transfer', 'paid'),
  ('Elektrik Faturası - Eylül', 8500.00, '2024-09-15', 'utilities', 'Eylül ayı elektrik', 'bank_transfer', 'paid'),
  ('Doğalgaz Faturası - Ekim', 4200.00, '2024-10-20', 'utilities', 'Ekim ayı doğalgaz', 'bank_transfer', 'paid'),
  ('Kırtasiye Malzemeleri', 12500.00, '2024-09-05', 'supplies', 'Dönem başı kırtasiye alımı', 'credit_card', 'paid'),
  ('Temizlik Malzemeleri', 3500.00, '2024-10-10', 'supplies', 'Aylık temizlik malzemesi', 'cash', 'paid'),
  ('Google Ads', 5000.00, '2024-09-01', 'marketing', 'Eylül ayı dijital reklam', 'credit_card', 'paid'),
  ('Broşür Basımı', 2500.00, '2024-08-25', 'marketing', 'Kayıt dönemi broşürler', 'bank_transfer', 'paid')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. ÖRNEK AKTİVİTE LOGLARI
-- ============================================
INSERT INTO activity_logs (user_email, user_name, action, entity_type, description) VALUES
  ('admin@akademihub.com', 'Sistem Admin', 'LOGIN', 'user', 'Sisteme giriş yapıldı'),
  ('admin@akademihub.com', 'Sistem Admin', 'CREATE', 'student', 'Yeni öğrenci kaydı oluşturuldu: Ahmet Yılmaz'),
  ('muhasebe@akademihub.com', 'Muhasebe Kullanıcı', 'PAYMENT', 'payment', 'Ödeme alındı: 9,500 TL'),
  ('admin@akademihub.com', 'Sistem Admin', 'UPDATE', 'settings', 'Sistem ayarları güncellendi')
ON CONFLICT DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
SELECT 'Seed data başarıyla yüklendi!' AS message;

