-- =============================================
-- EXAM ANALYTICS - INDEXES
-- Migration: 20260118_ea_003_indexes.sql
-- Date: 2026-01-18
-- Purpose: Performance indexes for Exam Analytics tables
-- =============================================

-- INDEX STRATEGY:
-- 1. Organization ID (every table, for RLS)
-- 2. Foreign Keys (for JOINs)
-- 3. Frequently queried columns (durum, tarih, etc.)
-- 4. Composite indexes (multi-column queries)

-- =============================================
-- 1. DERSLER INDEXES
-- =============================================

-- Organization isolation (critical for RLS)
CREATE INDEX idx_dersler_organization ON ea_dersler(organization_id);

-- Aktif dersler sorgusu
CREATE INDEX idx_dersler_active ON ea_dersler(organization_id, is_active);

-- Ders kodu araması
CREATE INDEX idx_dersler_kod ON ea_dersler(ders_kodu);

-- Sıralama için
CREATE INDEX idx_dersler_sira ON ea_dersler(organization_id, sira_no);

-- =============================================
-- 2. SINAVLAR INDEXES
-- =============================================

-- Organization isolation (critical for RLS)
CREATE INDEX idx_sinavlar_organization ON ea_sinavlar(organization_id);

-- Academic year filtering
CREATE INDEX idx_sinavlar_academic_year ON ea_sinavlar(academic_year_id);

-- Composite: organization + academic year
CREATE INDEX idx_sinavlar_org_year ON ea_sinavlar(organization_id, academic_year_id);

-- Durum filtering
CREATE INDEX idx_sinavlar_durum ON ea_sinavlar(organization_id, durum);

-- Tarih filtering
CREATE INDEX idx_sinavlar_tarih ON ea_sinavlar(sinav_tarihi DESC);

-- Composite: organization + durum + tarih
CREATE INDEX idx_sinavlar_org_durum_tarih ON ea_sinavlar(
  organization_id, 
  durum, 
  sinav_tarihi DESC
);

-- Sınav tipi filtering
CREATE INDEX idx_sinavlar_tipi ON ea_sinavlar(organization_id, sinav_tipi);

-- Yayınlanmış sınavlar
CREATE INDEX idx_sinavlar_published ON ea_sinavlar(organization_id, is_published);

-- =============================================
-- 3. SINAV_DERSLER INDEXES
-- =============================================

-- Sınav'a göre JOIN
CREATE INDEX idx_sinav_dersler_sinav ON ea_sinav_dersler(sinav_id);

-- Ders'e göre JOIN
CREATE INDEX idx_sinav_dersler_ders ON ea_sinav_dersler(ders_id);

-- Composite: sınav + sıralama
CREATE INDEX idx_sinav_dersler_sinav_sira ON ea_sinav_dersler(sinav_id, sira_no);

-- =============================================
-- 4. CEVAP ANAHTARLARI INDEXES
-- =============================================

-- Sınav'a göre JOIN
CREATE INDEX idx_cevap_anahtar_sinav ON ea_cevap_anahtarlari(sinav_id);

-- Ders'e göre JOIN
CREATE INDEX idx_cevap_anahtar_ders ON ea_cevap_anahtarlari(ders_id);

-- Composite: sınav + ders + versiyon (unique sorguları için)
CREATE INDEX idx_cevap_anahtar_sinav_ders_ver ON ea_cevap_anahtarlari(
  sinav_id, 
  ders_id, 
  versiyon
);

-- Aktif cevap anahtarları
CREATE INDEX idx_cevap_anahtar_active ON ea_cevap_anahtarlari(sinav_id, is_active);

-- =============================================
-- 5. KATILIMCILAR INDEXES
-- =============================================

-- Organization isolation
CREATE INDEX idx_katilimcilar_organization ON ea_katilimcilar(organization_id);

-- Sınav'a göre JOIN
CREATE INDEX idx_katilimcilar_sinav ON ea_katilimcilar(sinav_id);

-- Student'a göre JOIN (NULL olabilir)
CREATE INDEX idx_katilimcilar_student ON ea_katilimcilar(student_id) WHERE student_id IS NOT NULL;

-- Composite: sınav + student (unique sorguları için)
CREATE INDEX idx_katilimcilar_sinav_student ON ea_katilimcilar(sinav_id, student_id);

-- Durum filtering
CREATE INDEX idx_katilimcilar_durum ON ea_katilimcilar(sinav_id, durum);

-- Eşleşme durumu
CREATE INDEX idx_katilimcilar_eslesme ON ea_katilimcilar(sinav_id, eslesme_durumu);

-- Katılım durumu
CREATE INDEX idx_katilimcilar_katildi ON ea_katilimcilar(sinav_id, katildi);

-- Öğrenci numarası araması
CREATE INDEX idx_katilimcilar_ogrenci_no ON ea_katilimcilar(ogrenci_no);

-- =============================================
-- 6. KATILIMCI CEVAPLAR INDEXES
-- =============================================

-- Katılımcı'ya göre JOIN
CREATE INDEX idx_katilimci_cevaplar_katilimci ON ea_katilimci_cevaplar(katilimci_id);

-- Ders'e göre JOIN
CREATE INDEX idx_katilimci_cevaplar_ders ON ea_katilimci_cevaplar(ders_id);

-- Composite: katılımcı + ders
CREATE INDEX idx_katilimci_cevaplar_kat_ders ON ea_katilimci_cevaplar(katilimci_id, ders_id);

-- =============================================
-- 7. SONUÇLAR INDEXES
-- =============================================

-- Organization isolation
CREATE INDEX idx_sonuclar_organization ON ea_sonuclar(organization_id);

-- Sınav'a göre JOIN
CREATE INDEX idx_sonuclar_sinav ON ea_sonuclar(sinav_id);

-- Katılımcı'ya göre JOIN
CREATE INDEX idx_sonuclar_katilimci ON ea_sonuclar(katilimci_id);

-- Student'a göre JOIN (NULL olabilir)
CREATE INDEX idx_sonuclar_student ON ea_sonuclar(student_id) WHERE student_id IS NOT NULL;

-- Composite: sınav + student
CREATE INDEX idx_sonuclar_sinav_student ON ea_sonuclar(sinav_id, student_id);

-- Yayınlanmış sonuçlar
CREATE INDEX idx_sonuclar_published ON ea_sonuclar(sinav_id, is_published);

-- Hesaplanmış sonuçlar
CREATE INDEX idx_sonuclar_hesaplandi ON ea_sonuclar(sinav_id, hesaplandi);

-- Sıralama için (net bazlı)
CREATE INDEX idx_sonuclar_siralama ON ea_sonuclar(sinav_id, toplam_net DESC);

-- Composite: sınav + yayın + net (sıralama + filtreleme)
CREATE INDEX idx_sonuclar_sinav_pub_net ON ea_sonuclar(
  sinav_id, 
  is_published, 
  toplam_net DESC
);

-- =============================================
-- 8. DERS SONUÇLARI INDEXES
-- =============================================

-- Sonuç'a göre JOIN
CREATE INDEX idx_ders_sonuclari_sonuc ON ea_ders_sonuclari(sonuc_id);

-- Ders'e göre JOIN
CREATE INDEX idx_ders_sonuclari_ders ON ea_ders_sonuclari(ders_id);

-- Composite: sonuç + ders
CREATE INDEX idx_ders_sonuclari_sonuc_ders ON ea_ders_sonuclari(sonuc_id, ders_id);

-- Net bazlı sıralama
CREATE INDEX idx_ders_sonuclari_net ON ea_ders_sonuclari(ders_id, net DESC);

-- =============================================
-- PARTIAL INDEXES (Conditional)
-- =============================================

-- Sadece aktif sınavlar için index
CREATE INDEX idx_sinavlar_aktif_only ON ea_sinavlar(organization_id, sinav_tarihi DESC)
  WHERE durum = 'aktif';

-- Sadece yayınlanmış sınavlar için index
CREATE INDEX idx_sinavlar_published_only ON ea_sinavlar(organization_id, sinav_tarihi DESC)
  WHERE is_published = true;

-- Sadece asil katılımcılar için index
CREATE INDEX idx_katilimcilar_asil_only ON ea_katilimcilar(sinav_id, student_id)
  WHERE durum = 'asil';

-- Sadece misafir katılımcılar için index
CREATE INDEX idx_katilimcilar_misafir_only ON ea_katilimcilar(sinav_id)
  WHERE durum = 'misafir';

-- =============================================
-- GIN INDEXES (JSONB columns)
-- =============================================

-- Ayarlar JSONB
CREATE INDEX idx_sinavlar_ayarlar_gin ON ea_sinavlar USING gin(ayarlar);

-- Optik data JSONB
CREATE INDEX idx_katilimcilar_optik_gin ON ea_katilimcilar USING gin(optik_data);

-- Ders sonuçları JSONB
CREATE INDEX idx_sonuclar_ders_sonuclari_gin ON ea_sonuclar USING gin(ders_sonuclari);

-- Cevaplar JSONB
CREATE INDEX idx_cevap_anahtarlari_cevaplar_gin ON ea_cevap_anahtarlari USING gin(cevaplar);

CREATE INDEX idx_katilimci_cevaplar_cevaplar_gin ON ea_katilimci_cevaplar USING gin(cevaplar);

-- =============================================
-- TEXT SEARCH INDEXES
-- =============================================

-- Sınav adı text search
CREATE INDEX idx_sinavlar_adi_trgm ON ea_sinavlar USING gin(sinav_adi gin_trgm_ops);

-- Ders adı text search
CREATE INDEX idx_dersler_adi_trgm ON ea_dersler USING gin(ders_adi gin_trgm_ops);

-- Katılımcı adı text search
CREATE INDEX idx_katilimcilar_adi_trgm ON ea_katilimcilar USING gin(katilimci_adi gin_trgm_ops);

-- =============================================
-- VERIFICATION
-- =============================================
DO $$
DECLARE
  index_count INT;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename LIKE 'ea_%'
    AND indexname LIKE 'idx_%';
  
  IF index_count < 50 THEN
    RAISE WARNING 'Beklenen index sayısı: 50+, Oluşan: %', index_count;
  END IF;
  
  RAISE NOTICE '✓ Exam Analytics index''leri başarıyla oluşturuldu (% index)', index_count;
END $$;

-- =============================================
-- INDEX USAGE TIPS
-- =============================================

-- İstatistik toplama (query planner için)
ANALYZE ea_dersler;
ANALYZE ea_sinavlar;
ANALYZE ea_sinav_dersler;
ANALYZE ea_cevap_anahtarlari;
ANALYZE ea_katilimcilar;
ANALYZE ea_katilimci_cevaplar;
ANALYZE ea_sonuclar;
ANALYZE ea_ders_sonuclari;

-- =============================================
-- END OF MIGRATION
-- =============================================
