-- =============================================
-- EXAM ANALYTICS - SEED DERSLER
-- Migration: 20260118_ea_008_seed_dersler.sql
-- Date: 2026-01-18
-- Purpose: Varsayılan ders tanımlarını ekle
-- =============================================

-- NOT: Bu migration her organization için ayrı çalıştırılmalı
-- Şimdilik tek bir organization için seed data ekliyoruz

-- Varsayılan dersler (LGS, TYT, AYT için)
INSERT INTO ea_dersler (
  organization_id,
  ders_kodu,
  ders_adi,
  ders_kategori,
  renk_kodu,
  sira_no,
  max_soru_sayisi,
  min_soru_sayisi,
  is_active
) VALUES
  -- LGS Dersleri
  ((SELECT id FROM organizations LIMIT 1), 'TUR', 'Türkçe', 'sozel', '#EF4444', 1, 40, 1, true),
  ((SELECT id FROM organizations LIMIT 1), 'MAT', 'Matematik', 'sayisal', '#3B82F6', 2, 40, 1, true),
  ((SELECT id FROM organizations LIMIT 1), 'FEN', 'Fen Bilimleri', 'sayisal', '#10B981', 3, 40, 1, true),
  ((SELECT id FROM organizations LIMIT 1), 'SOS', 'Sosyal Bilimler', 'sozel', '#F59E0B', 4, 40, 1, true),
  ((SELECT id FROM organizations LIMIT 1), 'INK', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'sozel', '#8B5CF6', 5, 20, 1, true),
  ((SELECT id FROM organizations LIMIT 1), 'DIN', 'Din Kültürü ve Ahlak Bilgisi', 'sozel', '#06B6D4', 6, 20, 1, true),
  ((SELECT id FROM organizations LIMIT 1), 'ING', 'İngilizce', 'sozel', '#EC4899', 7, 20, 1, true)
ON CONFLICT (organization_id, ders_kodu) DO UPDATE SET
  ders_adi = EXCLUDED.ders_adi,
  renk_kodu = EXCLUDED.renk_kodu,
  sira_no = EXCLUDED.sira_no,
  updated_at = NOW();

COMMENT ON TABLE ea_dersler IS 'Ders tanımları - seed data eklendi';
