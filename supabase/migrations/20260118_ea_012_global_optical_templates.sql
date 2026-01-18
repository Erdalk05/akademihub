-- =============================================
-- EXAM ANALYTICS - GLOBAL OPTİK ŞABLON HAVUZU
-- Migration: 20260118_ea_012_global_optical_templates.sql
-- Date: 2026-01-18
-- Purpose: Merkezi optik şablon havuzu + Kuruma özel şablonlar
-- =============================================

-- =====================================================
-- 1️⃣ organization_id kolonunu NULL yapılabilir hale getir
-- =====================================================
ALTER TABLE ea_optik_sablonlar
  ALTER COLUMN organization_id DROP NOT NULL;

-- =====================================================
-- 2️⃣ UNIQUE constraint güncelle
-- =====================================================
ALTER TABLE ea_optik_sablonlar
  DROP CONSTRAINT IF EXISTS unq_sablon_adi;

ALTER TABLE ea_optik_sablonlar
  ADD CONSTRAINT unq_sablon_adi
  UNIQUE NULLS NOT DISTINCT (organization_id, sablon_adi);

-- =====================================================
-- 3️⃣ GLOBAL OPTİK ŞABLONLAR EKLE
-- organization_id = NULL → Tüm kurumlar kullanabilir
-- =====================================================

-- ════════════════════════════════════════════════════════════
-- STANDART LGS OPTİK FORMU
-- ════════════════════════════════════════════════════════════
INSERT INTO ea_optik_sablonlar (
  organization_id,
  sablon_adi,
  aciklama,
  format_tipi,
  satir_uzunlugu,
  alan_tanimlari,
  cevap_baslangic,
  cevap_uzunluk,
  is_active,
  is_default
) VALUES (
  NULL,
  'Standart LGS Optik Formu',
  'MEB Standart LGS optik formu - 90 soru',
  'fixed_width',
  100,
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "uzunluk": 10},
    {"alan": "cevaplar", "baslangic": 11, "uzunluk": 90}
  ]'::jsonb,
  11,
  90,
  true,
  true
)
ON CONFLICT (organization_id, sablon_adi) DO UPDATE SET
  aciklama = EXCLUDED.aciklama,
  alan_tanimlari = EXCLUDED.alan_tanimlari,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- ════════════════════════════════════════════════════════════
-- STANDART TYT OPTİK FORMU
-- ════════════════════════════════════════════════════════════
INSERT INTO ea_optik_sablonlar (
  organization_id,
  sablon_adi,
  aciklama,
  format_tipi,
  satir_uzunlugu,
  alan_tanimlari,
  cevap_baslangic,
  cevap_uzunluk,
  is_active,
  is_default
) VALUES (
  NULL,
  'Standart TYT Optik Formu',
  'MEB Standart TYT optik formu - 120 soru',
  'fixed_width',
  130,
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "uzunluk": 10},
    {"alan": "cevaplar", "baslangic": 11, "uzunluk": 120}
  ]'::jsonb,
  11,
  120,
  true,
  true
)
ON CONFLICT (organization_id, sablon_adi) DO UPDATE SET
  aciklama = EXCLUDED.aciklama,
  alan_tanimlari = EXCLUDED.alan_tanimlari,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- ════════════════════════════════════════════════════════════
-- STANDART AYT OPTİK FORMU
-- ════════════════════════════════════════════════════════════
INSERT INTO ea_optik_sablonlar (
  organization_id,
  sablon_adi,
  aciklama,
  format_tipi,
  satir_uzunlugu,
  alan_tanimlari,
  cevap_baslangic,
  cevap_uzunluk,
  is_active,
  is_default
) VALUES (
  NULL,
  'Standart AYT Optik Formu',
  'MEB Standart AYT optik formu - 80 soru',
  'fixed_width',
  90,
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "uzunluk": 10},
    {"alan": "cevaplar", "baslangic": 11, "uzunluk": 80}
  ]'::jsonb,
  11,
  80,
  true,
  true
)
ON CONFLICT (organization_id, sablon_adi) DO UPDATE SET
  aciklama = EXCLUDED.aciklama,
  alan_tanimlari = EXCLUDED.alan_tanimlari,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- ════════════════════════════════════════════════════════════
-- GENEL AMAÇLI OPTİK FORM (20 SORU)
-- ════════════════════════════════════════════════════════════
INSERT INTO ea_optik_sablonlar (
  organization_id,
  sablon_adi,
  aciklama,
  format_tipi,
  satir_uzunlugu,
  alan_tanimlari,
  cevap_baslangic,
  cevap_uzunluk,
  is_active,
  is_default
) VALUES (
  NULL,
  'Konu Testi - 20 Soru',
  'Kısa testler için 20 soruluk optik form',
  'fixed_width',
  30,
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "uzunluk": 10},
    {"alan": "cevaplar", "baslangic": 11, "uzunluk": 20}
  ]'::jsonb,
  11,
  20,
  true,
  false
)
ON CONFLICT (organization_id, sablon_adi) DO UPDATE SET
  aciklama = EXCLUDED.aciklama,
  alan_tanimlari = EXCLUDED.alan_tanimlari,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- ════════════════════════════════════════════════════════════
-- GENEL AMAÇLI OPTİK FORM (40 SORU)
-- ════════════════════════════════════════════════════════════
INSERT INTO ea_optik_sablonlar (
  organization_id,
  sablon_adi,
  aciklama,
  format_tipi,
  satir_uzunlugu,
  alan_tanimlari,
  cevap_baslangic,
  cevap_uzunluk,
  is_active,
  is_default
) VALUES (
  NULL,
  'Konu Testi - 40 Soru',
  'Orta boy testler için 40 soruluk optik form',
  'fixed_width',
  50,
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "uzunluk": 10},
    {"alan": "cevaplar", "baslangic": 11, "uzunluk": 40}
  ]'::jsonb,
  11,
  40,
  true,
  false
)
ON CONFLICT (organization_id, sablon_adi) DO UPDATE SET
  aciklama = EXCLUDED.aciklama,
  alan_tanimlari = EXCLUDED.alan_tanimlari,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- =====================================================
-- 4️⃣ TABLO AÇIKLAMALARI
-- =====================================================
COMMENT ON TABLE ea_optik_sablonlar IS
'Optik şablon tanımları:
- organization_id = NULL → Global şablon (MEB standartları)
- organization_id NOT NULL → Kuruma özel şablon';

COMMENT ON COLUMN ea_optik_sablonlar.organization_id IS
'NULL = Global şablon, NOT NULL = Kuruma özel şablon';

-- =====================================================
-- 5️⃣ KONTROL SORGUSU
-- =====================================================
SELECT
  CASE
    WHEN organization_id IS NULL THEN '🌐 GLOBAL'
    ELSE '🏢 ' || o.name
  END AS kurum,
  COUNT(*) AS sablon_sayisi,
  STRING_AGG(sablon_adi, ', ' ORDER BY sablon_adi) AS sablonlar
FROM ea_optik_sablonlar s
LEFT JOIN organizations o ON o.id = s.organization_id
WHERE is_active = true
GROUP BY organization_id, o.name
ORDER BY organization_id NULLS FIRST;
