-- =====================================================
-- Super Admin (Franchise Sahibi) Rolü Ekleme
-- =====================================================
-- Bu migration, franchise yapısı için super_admin rolünü ekler.
-- Super Admin tüm kurumlara erişebilir.
-- =====================================================

-- 1. Users tablosuna is_super_admin sütunu ekle
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Varsayılan Super Admin kullanıcısı oluştur
-- Not: Şifreyi hashlemek için Supabase Auth kullanılmalı
-- Bu sadece referans amaçlıdır

-- Mevcut admin kullanıcısını super admin yap (varsa)
UPDATE users 
SET is_super_admin = true 
WHERE role = 'ADMIN' OR role = 'admin'
LIMIT 1;

-- =====================================================
-- Alternatif: Role sütununa super_admin değeri ekle
-- =====================================================

-- Eğer role sütunu enum ise, önce constraint'i kaldırıp yeniden ekleyin:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check 
--   CHECK (role IN ('super_admin', 'admin', 'accounting', 'staff', 'teacher', 'parent'));

-- =====================================================
-- Super Admin Kullanıcı Ekleme (Manuel)
-- =====================================================
-- Supabase Auth üzerinden kullanıcı oluşturup,
-- users tablosunda is_super_admin = true yapın:
--
-- UPDATE users SET is_super_admin = true WHERE email = 'franchise@akademihub.com';

-- =====================================================
-- Migration Tamamlandı
-- =====================================================

