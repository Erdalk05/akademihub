-- =============================================
-- EXAM ANALYTICS - SOS (Sosyal Bilimler) Dersi Ekle
-- Migration: 20260118_ea_013_add_sos_course.sql
-- Date: 2026-01-18
-- Purpose: TYT için eksik SOS dersini ekle
-- =============================================

INSERT INTO ea_dersler (
  organization_id,
  ders_kodu,
  ders_adi,
  ders_kategori,
  renk_kodu,
  sira_no,
  max_soru_sayisi,
  min_soru_sayisi,
  aciklama,
  is_active
) VALUES
(NULL, 'SOS', 'Sosyal Bilimler', 'sozel', '#F59E0B', 7, 40, 1, 'TYT', true),
(NULL, 'MAT_AYT', 'Matematik (AYT)', 'sayisal', '#1E40AF', 18, 40, 1, 'AYT Sayısal', true),
(NULL, 'BIO', 'Biyoloji', 'sayisal', '#059669', 19, 40, 1, 'AYT Sayısal (alias: BIY)', true)

ON CONFLICT (organization_id, ders_kodu) DO UPDATE SET
  ders_adi = EXCLUDED.ders_adi,
  renk_kodu = EXCLUDED.renk_kodu,
  sira_no = EXCLUDED.sira_no,
  aciklama = EXCLUDED.aciklama,
  updated_at = NOW();


-- KONTROL
SELECT ders_kodu, ders_adi, aciklama 
FROM ea_dersler 
WHERE organization_id IS NULL 
ORDER BY sira_no;
