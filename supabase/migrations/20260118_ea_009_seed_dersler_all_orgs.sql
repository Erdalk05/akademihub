-- =============================================
-- EXAM ANALYTICS - SEED DERSLER (GELİŞTİRİLMİŞ)
-- Migration: 20260118_ea_009_seed_dersler_all_orgs.sql
-- Date: 2026-01-18
-- Purpose: TÜM organization'lar için ders tanımlarını ekle
-- =============================================

-- NOT: Bu migration TÜM organization'lar için çalışır
-- Her organization otomatik olarak bu dersleri alır

DO $$
DECLARE
  org_record RECORD;
BEGIN
  -- Her organization için dersleri ekle
  FOR org_record IN SELECT id FROM organizations LOOP
    
    -- Varsayılan dersler (LGS için 6 ders - Sosyal Bilimler YOK, TYT/AYT için ekstra)
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
      -- LGS Dersleri (6 ders)
      (org_record.id, 'TUR', 'Türkçe', 'sozel', '#EF4444', 1, 40, 1, true),
      (org_record.id, 'MAT', 'Matematik', 'sayisal', '#3B82F6', 2, 40, 1, true),
      (org_record.id, 'FEN', 'Fen Bilimleri', 'sayisal', '#10B981', 3, 40, 1, true),
      (org_record.id, 'INK', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'sozel', '#8B5CF6', 4, 20, 1, true),
      (org_record.id, 'DIN', 'Din Kültürü ve Ahlak Bilgisi', 'sozel', '#06B6D4', 5, 20, 1, true),
      (org_record.id, 'ING', 'İngilizce', 'sozel', '#EC4899', 6, 20, 1, true),
      -- TYT/AYT için ek ders
      (org_record.id, 'SOS', 'Sosyal Bilimler', 'sozel', '#F59E0B', 7, 40, 1, true)
    ON CONFLICT (organization_id, ders_kodu) DO UPDATE SET
      ders_adi = EXCLUDED.ders_adi,
      renk_kodu = EXCLUDED.renk_kodu,
      sira_no = EXCLUDED.sira_no,
      updated_at = NOW();
    
    RAISE NOTICE 'Dersler eklendi: Organization ID = %', org_record.id;
    
  END LOOP;
END $$;

-- Sonuç raporu
SELECT 
  o.name as organization_name,
  o.id as organization_id,
  COUNT(d.id) as ders_sayisi
FROM organizations o
LEFT JOIN ea_dersler d ON d.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;

COMMENT ON TABLE ea_dersler IS 'Ders tanımları - tüm organizasyonlar için seed data eklendi';
