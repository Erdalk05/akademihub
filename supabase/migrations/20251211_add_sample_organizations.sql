-- =============================================
-- ÖRNEK KURUMLAR
-- Çoklu kurum yapısı için örnek veriler
-- =============================================

-- Dikmen Çözüm Kurs
INSERT INTO organizations (name, slug, tax_id, address, phone, email, is_active, settings)
VALUES (
  'Dikmen Çözüm Kurs',
  'dikmen-cozum-kurs',
  '1234567891',
  'Dikmen Caddesi No:15, Çankaya, Ankara',
  '+90 312 000 00 01',
  'info@dikmencozumkurs.com',
  true,
  '{
    "currency": "TRY",
    "fiscalYearStart": "09-01",
    "defaultInstallmentCount": 10,
    "defaultDiscounts": {
      "sibling": 10,
      "earlyBird": 5,
      "staff": 20
    }
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Liderler Koleji
INSERT INTO organizations (name, slug, tax_id, address, phone, email, is_active, settings)
VALUES (
  'Liderler Koleji',
  'liderler-koleji',
  '9876543210',
  'Bahçelievler Mahallesi, Liderler Sokak No:25, İstanbul',
  '+90 212 000 00 02',
  'info@liderlerkoleji.com',
  true,
  '{
    "currency": "TRY",
    "fiscalYearStart": "09-01",
    "defaultInstallmentCount": 12,
    "defaultDiscounts": {
      "sibling": 15,
      "earlyBird": 10,
      "staff": 25
    }
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Yorum
COMMENT ON TABLE organizations IS 'Çoklu kurum/şube yönetimi - Her kurum kendi verilerine sahip';



