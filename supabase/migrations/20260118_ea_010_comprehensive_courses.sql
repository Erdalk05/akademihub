-- =============================================
-- EXAM ANALYTICS - KAPSAMLI DERS TANIMLARI
-- Migration: 20260118_ea_010_comprehensive_courses.sql
-- Date: 2026-01-18
-- Purpose: Tüm sınıf seviyeleri için detaylı ders tanımları
-- =============================================

-- NOT: Bu migration TÜM organization'lar için çalışır
-- 4. sınıftan Mezun'a kadar tüm dersler dahil

DO $$
DECLARE
  org_record RECORD;
BEGIN
  -- Her organization için dersleri ekle
  FOR org_record IN SELECT id FROM organizations LOOP
    
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
      -- ════════════════════════════════════════════════════════════
      -- İLKÖĞRETİM DERSLERİ (4-8. Sınıflar)
      -- ════════════════════════════════════════════════════════════
      (org_record.id, 'TUR', 'Türkçe', 'sozel', '#EF4444', 1, 40, 1, 'Tüm sınıflar', true),
      (org_record.id, 'MAT', 'Matematik', 'sayisal', '#3B82F6', 2, 40, 1, 'Tüm sınıflar', true),
      (org_record.id, 'FEN', 'Fen Bilimleri', 'sayisal', '#10B981', 3, 40, 1, '4-8. sınıflar', true),
      (org_record.id, 'SOS', 'Sosyal Bilimler', 'sozel', '#F59E0B', 4, 40, 1, '4-7. sınıflar + TYT', true),
      (org_record.id, 'INK', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'sozel', '#8B5CF6', 5, 20, 1, '8. sınıf + LGS', true),
      (org_record.id, 'DIN', 'Din Kültürü ve Ahlak Bilgisi', 'sozel', '#06B6D4', 6, 20, 1, '4-8. sınıflar', true),
      (org_record.id, 'ING', 'İngilizce', 'dil', '#EC4899', 7, 20, 1, 'Tüm sınıflar', true),
      
      -- ════════════════════════════════════════════════════════════
      -- LİSE DERSLERİ (9-12. Sınıflar)
      -- ════════════════════════════════════════════════════════════
      
      -- Ortak Dersler
      (org_record.id, 'FIZ', 'Fizik', 'sayisal', '#3B82F6', 11, 40, 1, '9-12. sınıflar + AYT', true),
      (org_record.id, 'KIM', 'Kimya', 'sayisal', '#10B981', 12, 40, 1, '9-12. sınıflar + AYT', true),
      (org_record.id, 'BIY', 'Biyoloji', 'sayisal', '#059669', 13, 40, 1, '9-12. sınıflar + AYT', true),
      (org_record.id, 'TAR', 'Tarih', 'sozel', '#F59E0B', 14, 40, 1, '9-12. sınıflar + AYT', true),
      (org_record.id, 'COG', 'Coğrafya', 'sozel', '#84CC16', 15, 40, 1, '9-12. sınıflar + AYT', true),
      (org_record.id, 'FEL', 'Felsefe', 'sozel', '#A855F7', 16, 40, 1, '10-12. sınıflar + AYT', true),
      (org_record.id, 'EDB', 'Edebiyat', 'sozel', '#EF4444', 17, 40, 1, '9-12. sınıflar + AYT', true),
      
      -- AYT Özel Dersler (Detaylı)
      (org_record.id, 'TAR1', 'Tarih-1', 'sozel', '#F59E0B', 21, 20, 1, 'AYT Sözel - İlkçağ-Ortaçağ', true),
      (org_record.id, 'TAR2', 'Tarih-2', 'sozel', '#F97316', 22, 20, 1, 'AYT Sözel - Yakınçağ-Günümüz', true),
      (org_record.id, 'COG1', 'Coğrafya-1', 'sozel', '#84CC16', 23, 20, 1, 'AYT Sözel - Fiziki Coğrafya', true),
      (org_record.id, 'COG2', 'Coğrafya-2', 'sozel', '#65A30D', 24, 20, 1, 'AYT Sözel - Beşeri Coğrafya', true),
      
      -- Dil Dersleri
      (org_record.id, 'ALM', 'Almanca', 'dil', '#EAB308', 31, 40, 1, 'Lise + AYT Dil', true),
      (org_record.id, 'FRA', 'Fransızca', 'dil', '#3B82F6', 32, 40, 1, 'Lise + AYT Dil', true),
      (org_record.id, 'ARB', 'Arapça', 'dil', '#22C55E', 33, 40, 1, 'Lise + AYT Dil', true)
      
    ON CONFLICT (organization_id, ders_kodu) DO UPDATE SET
      ders_adi = EXCLUDED.ders_adi,
      renk_kodu = EXCLUDED.renk_kodu,
      sira_no = EXCLUDED.sira_no,
      aciklama = EXCLUDED.aciklama,
      updated_at = NOW();
    
    RAISE NOTICE 'Dersler eklendi: % - Toplam: % ders', org_record.id, 
      (SELECT COUNT(*) FROM ea_dersler WHERE organization_id = org_record.id);
    
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════
-- SONUÇ RAPORU
-- ════════════════════════════════════════════════════════════
SELECT 
  o.name as organization_name,
  COUNT(d.id) as toplam_ders,
  COUNT(CASE WHEN d.ders_kategori = 'sayisal' THEN 1 END) as sayisal_dersler,
  COUNT(CASE WHEN d.ders_kategori = 'sozel' THEN 1 END) as sozel_dersler,
  COUNT(CASE WHEN d.ders_kategori = 'dil' THEN 1 END) as dil_dersleri
FROM organizations o
LEFT JOIN ea_dersler d ON d.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;

COMMENT ON TABLE ea_dersler IS 'Ders tanımları - 4. sınıftan Mezun''a kadar tüm dersler';
