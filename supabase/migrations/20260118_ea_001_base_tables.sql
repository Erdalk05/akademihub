-- =============================================
-- EXAM ANALYTICS - BASE TABLES
-- Migration: 20260118_ea_001_base_tables.sql
-- Date: 2026-01-18
-- Purpose: Create core Exam Analytics tables
-- =============================================

-- NAMING CONVENTION:
-- - Prefix: ea_ (Exam Analytics)
-- - Tables: plural form (ea_sinavlar, ea_dersler)
-- - Columns: snake_case
-- - FK: {table}_id format

-- ISOLATION RULES:
-- ✅ CAN read: students, organizations, academic_years
-- ❌ CANNOT write: students, finance_*
-- ✅ CAN write: ea_*, optik_*

-- =============================================
-- 1. DERSLER TABLOSU (Ders Tanımları)
-- =============================================
DROP TABLE IF EXISTS ea_dersler CASCADE;

CREATE TABLE ea_dersler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Ders bilgileri
  ders_kodu VARCHAR(20) NOT NULL,  -- 'MAT', 'FEN', 'TRK'
  ders_adi VARCHAR(100) NOT NULL,  -- 'Matematik', 'Fen Bilimleri'
  ders_kategori VARCHAR(50),       -- 'sayisal', 'sozel', 'ea'
  
  -- Soru sayısı limitleri
  max_soru_sayisi INT DEFAULT 40,
  min_soru_sayisi INT DEFAULT 1,
  
  -- Metadata
  aciklama TEXT,
  renk_kodu VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
  sira_no INT DEFAULT 0,                   -- Display order
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unq_dersler_kod UNIQUE (organization_id, ders_kodu),
  CONSTRAINT chk_dersler_soru_sayisi CHECK (max_soru_sayisi >= min_soru_sayisi)
);

COMMENT ON TABLE ea_dersler IS 'Ders tanımları - Matematik, Türkçe, Fen vb.';
COMMENT ON COLUMN ea_dersler.ders_kodu IS 'Kısa kod: MAT, FEN, TRK, SOS';
COMMENT ON COLUMN ea_dersler.ders_kategori IS 'sayisal, sozel, ea (eşit ağırlık)';

-- =============================================
-- 2. SINAVLAR TABLOSU (Sınav Tanımları)
-- =============================================
DROP TABLE IF EXISTS ea_sinavlar CASCADE;

CREATE TABLE ea_sinavlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  
  -- Sınav bilgileri
  sinav_kodu VARCHAR(50) NOT NULL,        -- 'LGS-2024-01', 'TYT-DENEME-1'
  sinav_adi VARCHAR(200) NOT NULL,        -- 'LGS Deneme Sınavı 1'
  sinav_tipi VARCHAR(20) NOT NULL,        -- 'lgs', 'tyt', 'ayt', 'deneme'
  sinav_alt_tipi VARCHAR(50),             -- 'tyt', 'ayt-sayisal', 'ayt-sozel'
  
  -- Tarih ve süre
  sinav_tarihi DATE,
  baslangic_saati TIME,
  bitis_saati TIME,
  sure_dakika INT,                        -- Toplam süre (dakika)
  
  -- Durum
  durum VARCHAR(20) DEFAULT 'taslak',     -- 'taslak', 'aktif', 'tamamlandi', 'arsivlendi'
  
  -- Ayarlar
  ayarlar JSONB DEFAULT '{}'::jsonb,      -- Genel ayarlar
  
  -- Yayınlama
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Açıklama
  aciklama TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unq_sinavlar_kod UNIQUE (organization_id, sinav_kodu),
  CONSTRAINT chk_sinavlar_durum CHECK (durum IN ('taslak', 'aktif', 'tamamlandi', 'arsivlendi')),
  CONSTRAINT chk_sinavlar_tipi CHECK (sinav_tipi IN ('lgs', 'tyt', 'ayt', 'deneme', 'diger'))
);

COMMENT ON TABLE ea_sinavlar IS 'Sınav tanımları - tüm sınav türleri için ana tablo';
COMMENT ON COLUMN ea_sinavlar.sinav_tipi IS 'Sınav türü: lgs, tyt, ayt, deneme, diger';
COMMENT ON COLUMN ea_sinavlar.durum IS 'taslak, aktif, tamamlandi, arsivlendi';

-- =============================================
-- 3. SINAV_DERSLER İLİŞKİ TABLOSU
-- =============================================
DROP TABLE IF EXISTS ea_sinav_dersler CASCADE;

CREATE TABLE ea_sinav_dersler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
  ders_id UUID NOT NULL REFERENCES ea_dersler(id) ON DELETE CASCADE,
  
  -- Ders detayları
  soru_sayisi INT NOT NULL,               -- Bu dersten kaç soru var
  dogru_puan NUMERIC(5,2) DEFAULT 3.0,    -- Doğru cevap puanı
  yanlis_puan NUMERIC(5,2) DEFAULT -1.0,  -- Yanlış cevap puanı (eksi)
  bos_puan NUMERIC(5,2) DEFAULT 0.0,      -- Boş cevap puanı
  
  -- Sıralama
  sira_no INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unq_sinav_ders UNIQUE (sinav_id, ders_id),
  CONSTRAINT chk_sinav_ders_soru_pozitif CHECK (soru_sayisi > 0)
);

COMMENT ON TABLE ea_sinav_dersler IS 'Sınav-Ders ilişkisi - her sınavda hangi derslerden kaç soru var';

-- =============================================
-- 4. CEVAP ANAHTARLARI TABLOSU
-- =============================================
DROP TABLE IF EXISTS ea_cevap_anahtarlari CASCADE;

CREATE TABLE ea_cevap_anahtarlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
  ders_id UUID NOT NULL REFERENCES ea_dersler(id) ON DELETE CASCADE,
  
  -- Cevap anahtarı
  cevaplar JSONB NOT NULL,                -- ['A', 'B', 'C', 'D', 'A', ...]
  
  -- Versiyon
  versiyon INT DEFAULT 1,                 -- Cevap anahtarı versiyonu
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unq_cevap_anahtar UNIQUE (sinav_id, ders_id, versiyon)
);

COMMENT ON TABLE ea_cevap_anahtarlari IS 'Sınav cevap anahtarları - ders bazında';
COMMENT ON COLUMN ea_cevap_anahtarlari.cevaplar IS 'JSON array: ["A", "B", "C", "D", ...]';

-- =============================================
-- 5. KATILIMCILAR TABLOSU
-- =============================================
DROP TABLE IF EXISTS ea_katilimcilar CASCADE;

CREATE TABLE ea_katilimcilar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- NULL = misafir
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Katılımcı bilgileri
  katilimci_adi VARCHAR(200),             -- Optik'ten gelen isim
  ogrenci_no VARCHAR(50),                 -- Optik'ten gelen numara
  
  -- Eşleşme durumu
  durum VARCHAR(20) DEFAULT 'asil',       -- 'asil', 'misafir'
  eslesme_durumu VARCHAR(20) DEFAULT 'otomatik', -- 'otomatik', 'manuel', 'beklemede'
  
  -- Katılım
  katildi BOOLEAN DEFAULT false,
  katilim_tarihi TIMESTAMPTZ,
  
  -- Optik form bilgileri
  optik_form_no VARCHAR(50),
  optik_data JSONB,                       -- Ham optik okuma verisi
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unq_sinav_student UNIQUE (sinav_id, student_id),
  CONSTRAINT chk_katilimci_durum CHECK (durum IN ('asil', 'misafir')),
  CONSTRAINT chk_eslesme_durum CHECK (eslesme_durumu IN ('otomatik', 'manuel', 'beklemede'))
);

COMMENT ON TABLE ea_katilimcilar IS 'Sınav katılımcıları - asil ve misafir öğrenciler';
COMMENT ON COLUMN ea_katilimcilar.student_id IS 'NULL ise misafir katılımcı (sistemde kayıtlı değil)';
COMMENT ON COLUMN ea_katilimcilar.durum IS 'asil: sistemde kayıtlı, misafir: sistemde yok';

-- =============================================
-- 6. KATILIMCI CEVAPLAR TABLOSU
-- =============================================
DROP TABLE IF EXISTS ea_katilimci_cevaplar CASCADE;

CREATE TABLE ea_katilimci_cevaplar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  katilimci_id UUID NOT NULL REFERENCES ea_katilimcilar(id) ON DELETE CASCADE,
  ders_id UUID NOT NULL REFERENCES ea_dersler(id) ON DELETE CASCADE,
  
  -- Cevaplar
  cevaplar JSONB NOT NULL,                -- ['A', 'B', null, 'D', ...] (null = boş)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unq_katilimci_ders_cevap UNIQUE (katilimci_id, ders_id)
);

COMMENT ON TABLE ea_katilimci_cevaplar IS 'Katılımcı cevapları - ders bazında';
COMMENT ON COLUMN ea_katilimci_cevaplar.cevaplar IS 'JSON array: ["A", "B", null, "D", ...] (null = boş)';

-- =============================================
-- 7. SONUÇLAR TABLOSU
-- =============================================
DROP TABLE IF EXISTS ea_sonuclar CASCADE;

CREATE TABLE ea_sonuclar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
  katilimci_id UUID NOT NULL REFERENCES ea_katilimcilar(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Genel sonuçlar
  toplam_soru INT NOT NULL DEFAULT 0,
  toplam_dogru INT NOT NULL DEFAULT 0,
  toplam_yanlis INT NOT NULL DEFAULT 0,
  toplam_bos INT NOT NULL DEFAULT 0,
  toplam_net NUMERIC(10,2) NOT NULL DEFAULT 0,
  toplam_puan NUMERIC(10,2) DEFAULT 0,
  
  -- Başarı oranı
  basari_yuzdesi NUMERIC(5,2) DEFAULT 0,  -- 0-100
  
  -- Sıralama
  genel_siralama INT,
  sinif_siralaması INT,
  
  -- Ders bazında sonuçlar (denormalized)
  ders_sonuclari JSONB,                   -- {ders_id: {dogru, yanlis, bos, net, ...}}
  
  -- Durum
  is_published BOOLEAN DEFAULT false,
  hesaplandi BOOLEAN DEFAULT false,
  hesaplama_tarihi TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unq_sonuc_katilimci UNIQUE (sinav_id, katilimci_id),
  CONSTRAINT chk_sonuc_soru_sayisi CHECK (
    toplam_soru = toplam_dogru + toplam_yanlis + toplam_bos
  ),
  CONSTRAINT chk_sonuc_pozitif CHECK (
    toplam_dogru >= 0 AND 
    toplam_yanlis >= 0 AND 
    toplam_bos >= 0 AND
    toplam_net >= 0
  )
);

COMMENT ON TABLE ea_sonuclar IS 'Sınav sonuçları - katılımcı bazında toplu sonuç';
COMMENT ON COLUMN ea_sonuclar.ders_sonuclari IS 'Ders bazında detaylı sonuçlar (JSONB)';
COMMENT ON COLUMN ea_sonuclar.is_published IS 'Sonuçlar öğrencilere açıldı mı?';

-- =============================================
-- 8. DERS SONUÇLARI TABLOSU (Detaylı)
-- =============================================
DROP TABLE IF EXISTS ea_ders_sonuclari CASCADE;

CREATE TABLE ea_ders_sonuclari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sonuc_id UUID NOT NULL REFERENCES ea_sonuclar(id) ON DELETE CASCADE,
  ders_id UUID NOT NULL REFERENCES ea_dersler(id) ON DELETE CASCADE,
  
  -- Ders sonuçları
  dogru_sayisi INT NOT NULL DEFAULT 0,
  yanlis_sayisi INT NOT NULL DEFAULT 0,
  bos_sayisi INT NOT NULL DEFAULT 0,
  net NUMERIC(10,2) NOT NULL DEFAULT 0,
  puan NUMERIC(10,2) DEFAULT 0,
  
  -- Başarı
  basari_yuzdesi NUMERIC(5,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unq_sonuc_ders UNIQUE (sonuc_id, ders_id),
  CONSTRAINT chk_ders_sonuc_pozitif CHECK (
    dogru_sayisi >= 0 AND 
    yanlis_sayisi >= 0 AND 
    bos_sayisi >= 0 AND
    net >= 0
  )
);

COMMENT ON TABLE ea_ders_sonuclari IS 'Ders bazında detaylı sonuçlar';

-- =============================================
-- VERIFICATION
-- =============================================
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'ea_%';
  
  IF table_count < 8 THEN
    RAISE EXCEPTION 'Tüm tablolar oluşturulamadı. Beklenen: 8, Oluşan: %', table_count;
  END IF;
  
  RAISE NOTICE '✓ Exam Analytics temel tabloları başarıyla oluşturuldu (% tablo)', table_count;
END $$;

-- =============================================
-- END OF MIGRATION
-- =============================================
