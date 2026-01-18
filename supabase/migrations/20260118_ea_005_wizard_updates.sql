-- =============================================
-- EXAM ANALYTICS - WIZARD UPDATES
-- Migration: 20260118_ea_005_wizard_updates.sql
-- Date: 2026-01-18
-- Purpose: Add missing tables and columns for Wizard functionality
-- Reference: SINAV EKLEME WIZARD.md dokümanı
-- =============================================

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 1: EA_SINAVLAR TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Sınıf seviyesi (4-12, mezun)
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS sinif_seviyesi INT;

-- Toplam soru sayısı
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS toplam_soru INT DEFAULT 0;

-- Yanlış katsayısı (LGS: 0.333, TYT: 0.25)
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS yanlis_katsayi NUMERIC(5,4) DEFAULT 0.3333;

-- Optik şablon referansı
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS optik_sablon_id UUID;

-- Katılımcı sayısı
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS katilimci_sayisi INT DEFAULT 0;

-- Yayınlanma tarihi
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS yayinlanma_tarihi TIMESTAMPTZ;

-- Hesaplama tarihi
ALTER TABLE ea_sinavlar ADD COLUMN IF NOT EXISTS hesaplama_tarihi TIMESTAMPTZ;

-- Durum check constraint güncelle
ALTER TABLE ea_sinavlar DROP CONSTRAINT IF EXISTS chk_sinavlar_durum;
ALTER TABLE ea_sinavlar ADD CONSTRAINT chk_sinavlar_durum CHECK (
  durum IN ('taslak', 'cevap_girildi', 'veri_yuklendi', 'hesaplaniyor', 
            'yayinlandi', 'zamanli_yayin', 'hata', 'arsivlendi', 'silindi')
);

COMMENT ON COLUMN ea_sinavlar.sinif_seviyesi IS 'Sınıf: 4-12 veya mezun için 0';
COMMENT ON COLUMN ea_sinavlar.yanlis_katsayi IS 'LGS: 0.333, TYT: 0.25, Konu testi: 0';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 2: EA_SINAV_DERSLER TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Ders başlangıç soru numarası
ALTER TABLE ea_sinav_dersler ADD COLUMN IF NOT EXISTS baslangic_soru INT;

-- Ders bitiş soru numarası
ALTER TABLE ea_sinav_dersler ADD COLUMN IF NOT EXISTS bitis_soru INT;

-- Ders kodu (kısa kod: TUR, MAT, FEN)
ALTER TABLE ea_sinav_dersler ADD COLUMN IF NOT EXISTS ders_kodu VARCHAR(10);

COMMENT ON COLUMN ea_sinav_dersler.baslangic_soru IS 'Örn: Türkçe 1-20, Mat 21-40';
COMMENT ON COLUMN ea_sinav_dersler.bitis_soru IS 'Bitiş soru numarası (inclusive)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 3: EA_CEVAP_ANAHTARLARI TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Kitapçık (A, B, C, D)
ALTER TABLE ea_cevap_anahtarlari ADD COLUMN IF NOT EXISTS kitapcik VARCHAR(1) DEFAULT 'A';

-- Cevap dizisi (string format: "ABCDABCD...")
ALTER TABLE ea_cevap_anahtarlari ADD COLUMN IF NOT EXISTS cevap_dizisi TEXT;

-- Soru sayısı
ALTER TABLE ea_cevap_anahtarlari ADD COLUMN IF NOT EXISTS soru_sayisi INT;

-- Unique constraint güncelle
ALTER TABLE ea_cevap_anahtarlari DROP CONSTRAINT IF EXISTS unq_cevap_anahtar;
ALTER TABLE ea_cevap_anahtarlari ADD CONSTRAINT unq_cevap_anahtar_v2 
  UNIQUE (sinav_id, ders_id, kitapcik);

COMMENT ON COLUMN ea_cevap_anahtarlari.cevap_dizisi IS 'Format: ABCDABCD... (string)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 4: EA_KATILIMCILAR TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Katılımcı tipi (asil/misafir) - mevcut durum alanını düzelt
ALTER TABLE ea_katilimcilar RENAME COLUMN durum TO katilimci_tipi;

-- Misafir öğrenci bilgileri
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS misafir_ogrenci_no VARCHAR(50);
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS misafir_tc_no VARCHAR(11);
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS misafir_ad_soyad VARCHAR(200);
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS misafir_sinif VARCHAR(10);
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS misafir_sube VARCHAR(10);

-- Kitapçık
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS kitapcik VARCHAR(1) DEFAULT 'A';

-- Ham yükleme referansı
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS ham_satir_no INT;
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS ham_yukleme_id UUID;

-- Sıralama
ALTER TABLE ea_katilimcilar ADD COLUMN IF NOT EXISTS sira INT;

-- Eşleştirme durumu için check constraint güncelle
ALTER TABLE ea_katilimcilar DROP CONSTRAINT IF EXISTS chk_eslesme_durum;
ALTER TABLE ea_katilimcilar ADD CONSTRAINT chk_eslesme_durum_v2 CHECK (
  eslesme_durumu IN ('eslesti', 'bulunamadi', 'manuel_bekliyor', 'otomatik', 'manuel', 'beklemede')
);

-- Katılımcı tipi check constraint
ALTER TABLE ea_katilimcilar DROP CONSTRAINT IF EXISTS chk_katilimci_durum;
ALTER TABLE ea_katilimcilar ADD CONSTRAINT chk_katilimci_tipi CHECK (
  katilimci_tipi IN ('asil', 'misafir')
);

COMMENT ON COLUMN ea_katilimcilar.misafir_ogrenci_no IS 'student_id NULL ise kullanılır';
COMMENT ON COLUMN ea_katilimcilar.ham_satir_no IS 'TXT dosyasındaki satır numarası';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 5: EA_KATILIMCI_CEVAPLAR TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Cevap dizisi (string format)
ALTER TABLE ea_katilimci_cevaplar ADD COLUMN IF NOT EXISTS cevap_dizisi TEXT;

COMMENT ON COLUMN ea_katilimci_cevaplar.cevap_dizisi IS 'Format: ABCD-A* (- boş, * çoklu)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 6: EA_SONUCLAR TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Sözel sonuçlar
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sozel_net NUMERIC(10,2) DEFAULT 0;
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sozel_dogru INT DEFAULT 0;
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sozel_yanlis INT DEFAULT 0;

-- Sayısal sonuçlar
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sayisal_net NUMERIC(10,2) DEFAULT 0;
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sayisal_dogru INT DEFAULT 0;
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sayisal_yanlis INT DEFAULT 0;

-- LGS puanı
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS lgs_puan NUMERIC(10,3);

-- TYT/AYT puanları (ileride)
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS tyt_puan NUMERIC(10,3);
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS ayt_puan NUMERIC(10,3);

-- Sıralama
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sira INT;
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sinif_sirasi INT;
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS sube_sirasi INT;

-- Yüzdelik
ALTER TABLE ea_sonuclar ADD COLUMN IF NOT EXISTS yuzdelik NUMERIC(5,2);

COMMENT ON COLUMN ea_sonuclar.lgs_puan IS '100 + (net * 3.333) formülü';
COMMENT ON COLUMN ea_sonuclar.sira IS 'Genel sıralama (kurum bazında)';
COMMENT ON COLUMN ea_sonuclar.yuzdelik IS 'Yüzdelik dilim (0-100)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 7: EA_DERS_SONUCLARI TABLOSUNA EKSİK ALANLAR EKLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Soru sayısı
ALTER TABLE ea_ders_sonuclari ADD COLUMN IF NOT EXISTS soru_sayisi INT;

-- sinav_id eklendi (sonuc_id üzerinden JOIN yapılabilir ama performance için)
ALTER TABLE ea_ders_sonuclari ADD COLUMN IF NOT EXISTS sinav_id UUID REFERENCES ea_sinavlar(id);

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 8: YENİ TABLO - EA_HAM_YUKLEMELER
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS ea_ham_yuklemeler CASCADE;

CREATE TABLE ea_ham_yuklemeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Dosya bilgileri
  dosya_adi VARCHAR(255) NOT NULL,
  dosya_icerigi TEXT, -- Base64 veya raw text
  dosya_boyutu INT,
  
  -- İstatistikler
  satir_sayisi INT DEFAULT 0,
  basarili_satir INT DEFAULT 0,
  hatali_satir INT DEFAULT 0,
  
  -- Yükleme bilgileri
  yukleme_tarihi TIMESTAMPTZ DEFAULT NOW(),
  yukleyen_id UUID REFERENCES users(id),
  
  -- Durum
  islem_durumu VARCHAR(20) DEFAULT 'yuklendi', -- yuklendi, isleniyor, tamamlandi, hata
  hata_mesaji TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ea_ham_yuklemeler IS 'TXT dosya yüklemelerinin arşivi';
COMMENT ON COLUMN ea_ham_yuklemeler.dosya_icerigi IS 'Ham dosya içeriği (arşiv için)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 9: YENİ TABLO - EA_SORU_KAZANIMLARI
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS ea_soru_kazanimlari CASCADE;

CREATE TABLE ea_soru_kazanimlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
  ders_id UUID NOT NULL REFERENCES ea_dersler(id) ON DELETE CASCADE,
  
  -- Soru-Kazanım eşleşmesi
  soru_no INT NOT NULL,
  kazanim_kodu VARCHAR(50), -- MEB kodu: DKAB.8.1.2
  kazanim_adi TEXT,
  
  -- Opsiyonel: Kazanım tablosuna referans
  kazanim_id UUID, -- İleride ea_kazanimlar tablosuna FK
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unq_soru_kazanim UNIQUE (sinav_id, soru_no)
);

COMMENT ON TABLE ea_soru_kazanimlari IS 'Soru-kazanım eşleştirmeleri';
COMMENT ON COLUMN ea_soru_kazanimlari.kazanim_kodu IS 'MEB resmi kodu (DKAB.8.1.2)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 10: YENİ TABLO - EA_OPTIK_SABLONLAR (Referans için)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS ea_optik_sablonlar CASCADE;

CREATE TABLE ea_optik_sablonlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Şablon bilgileri
  sablon_adi VARCHAR(100) NOT NULL,
  aciklama TEXT,
  
  -- Format bilgileri
  format_tipi VARCHAR(50) DEFAULT 'fixed_width', -- fixed_width, csv, custom
  satir_uzunlugu INT, -- Sabit genişlik için karakter sayısı
  
  -- Alan tanımları (JSON)
  alan_tanimlari JSONB NOT NULL, -- [{alan: 'ogrenci_no', baslangic: 0, uzunluk: 10}, ...]
  
  -- Cevap pozisyonu
  cevap_baslangic INT, -- Cevap alanının başlangıç pozisyonu
  cevap_uzunluk INT, -- Cevap alanının uzunluğu
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unq_sablon_adi UNIQUE (organization_id, sablon_adi)
);

COMMENT ON TABLE ea_optik_sablonlar IS 'Optik okuma şablonları (TXT format tanımları)';
COMMENT ON COLUMN ea_optik_sablonlar.alan_tanimlari IS 'JSON: [{alan, baslangic, uzunluk}, ...]';

-- FK ekle
ALTER TABLE ea_sinavlar ADD CONSTRAINT fk_sinavlar_optik_sablon 
  FOREIGN KEY (optik_sablon_id) REFERENCES ea_optik_sablonlar(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 11: EA_CEVAP_ANAHTAR_SABLONLARI (Kütüphane için)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS ea_cevap_anahtar_sablonlari CASCADE;

CREATE TABLE ea_cevap_anahtar_sablonlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Şablon bilgileri
  sablon_adi VARCHAR(100) NOT NULL,
  sinav_turu VARCHAR(20), -- LGS, TYT, AYT
  
  -- Cevaplar (ders bazında)
  cevaplar JSONB NOT NULL, -- {ders_id: "ABCDABCD...", ...}
  
  -- Metadata
  toplam_soru INT,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unq_cevap_sablon_adi UNIQUE (organization_id, sablon_adi)
);

COMMENT ON TABLE ea_cevap_anahtar_sablonlari IS 'Cevap anahtarı şablonları (tekrar kullanım için)';

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 12: YENİ INDEX'LER
-- ═══════════════════════════════════════════════════════════════════════════

-- Ham yüklemeler
CREATE INDEX idx_ham_yuklemeler_sinav ON ea_ham_yuklemeler(sinav_id);
CREATE INDEX idx_ham_yuklemeler_org ON ea_ham_yuklemeler(organization_id);

-- Soru kazanımları
CREATE INDEX idx_soru_kazanimlari_sinav ON ea_soru_kazanimlari(sinav_id);
CREATE INDEX idx_soru_kazanimlari_ders ON ea_soru_kazanimlari(ders_id);
CREATE INDEX idx_soru_kazanimlari_kazanim_kodu ON ea_soru_kazanimlari(kazanim_kodu);

-- Optik şablonlar
CREATE INDEX idx_optik_sablonlar_org ON ea_optik_sablonlar(organization_id);
CREATE INDEX idx_optik_sablonlar_active ON ea_optik_sablonlar(organization_id, is_active);

-- Cevap anahtarı şablonları
CREATE INDEX idx_cevap_sablonlari_org ON ea_cevap_anahtar_sablonlari(organization_id);
CREATE INDEX idx_cevap_sablonlari_tur ON ea_cevap_anahtar_sablonlari(sinav_turu);

-- Mevcut tablolar için ek index'ler
CREATE INDEX IF NOT EXISTS idx_sinavlar_sinif_seviyesi ON ea_sinavlar(sinif_seviyesi);
CREATE INDEX IF NOT EXISTS idx_katilimcilar_kitapcik ON ea_katilimcilar(sinav_id, kitapcik);
CREATE INDEX IF NOT EXISTS idx_katilimcilar_ham_yukleme ON ea_katilimcilar(ham_yukleme_id);
CREATE INDEX IF NOT EXISTS idx_sonuclar_sira ON ea_sonuclar(sinav_id, sira);
CREATE INDEX IF NOT EXISTS idx_sonuclar_lgs_puan ON ea_sonuclar(sinav_id, lgs_puan DESC NULLS LAST);

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 13: RLS POLİCY'LERİ
-- ═══════════════════════════════════════════════════════════════════════════

-- EA_HAM_YUKLEMELER
ALTER TABLE ea_ham_yuklemeler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ham_yuklemeler_select_org" ON ea_ham_yuklemeler
  FOR SELECT USING (organization_id = current_setting('app.organization_id', true)::uuid);

CREATE POLICY "ham_yuklemeler_insert_admin" ON ea_ham_yuklemeler
  FOR INSERT WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

CREATE POLICY "ham_yuklemeler_delete_admin" ON ea_ham_yuklemeler
  FOR DELETE USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- EA_SORU_KAZANIMLARI
ALTER TABLE ea_soru_kazanimlari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soru_kazanimlari_select_via_sinav" ON ea_soru_kazanimlari
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
  );

CREATE POLICY "soru_kazanimlari_insert_admin" ON ea_soru_kazanimlari
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

CREATE POLICY "soru_kazanimlari_delete_admin" ON ea_soru_kazanimlari
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- EA_OPTIK_SABLONLAR
ALTER TABLE ea_optik_sablonlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optik_sablonlar_select_org" ON ea_optik_sablonlar
  FOR SELECT USING (organization_id = current_setting('app.organization_id', true)::uuid);

CREATE POLICY "optik_sablonlar_insert_admin" ON ea_optik_sablonlar
  FOR INSERT WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

CREATE POLICY "optik_sablonlar_update_admin" ON ea_optik_sablonlar
  FOR UPDATE USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

CREATE POLICY "optik_sablonlar_delete_admin" ON ea_optik_sablonlar
  FOR DELETE USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- EA_CEVAP_ANAHTAR_SABLONLARI
ALTER TABLE ea_cevap_anahtar_sablonlari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cevap_sablonlari_select_org" ON ea_cevap_anahtar_sablonlari
  FOR SELECT USING (organization_id = current_setting('app.organization_id', true)::uuid);

CREATE POLICY "cevap_sablonlari_insert_admin" ON ea_cevap_anahtar_sablonlari
  FOR INSERT WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

CREATE POLICY "cevap_sablonlari_update_admin" ON ea_cevap_anahtar_sablonlari
  FOR UPDATE USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

CREATE POLICY "cevap_sablonlari_delete_admin" ON ea_cevap_anahtar_sablonlari
  FOR DELETE USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- BÖLÜM 14: TIMESTAMP TRİGGER'LARI
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TRIGGER trg_ham_yuklemeler_update_timestamp
  BEFORE UPDATE ON ea_ham_yuklemeler
  FOR EACH ROW EXECUTE FUNCTION trg_ea_update_timestamp();

CREATE TRIGGER trg_optik_sablonlar_update_timestamp
  BEFORE UPDATE ON ea_optik_sablonlar
  FOR EACH ROW EXECUTE FUNCTION trg_ea_update_timestamp();

CREATE TRIGGER trg_cevap_sablonlari_update_timestamp
  BEFORE UPDATE ON ea_cevap_anahtar_sablonlari
  FOR EACH ROW EXECUTE FUNCTION trg_ea_update_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  table_count INT;
  column_count INT;
BEGIN
  -- Tablo sayısı kontrol
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE 'ea_%';
  
  RAISE NOTICE '✓ Toplam Exam Analytics tablosu: %', table_count;
  
  -- Yeni eklenen tabloları kontrol
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ea_ham_yuklemeler') THEN
    RAISE EXCEPTION 'ea_ham_yuklemeler tablosu oluşturulamadı!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ea_soru_kazanimlari') THEN
    RAISE EXCEPTION 'ea_soru_kazanimlari tablosu oluşturulamadı!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ea_optik_sablonlar') THEN
    RAISE EXCEPTION 'ea_optik_sablonlar tablosu oluşturulamadı!';
  END IF;
  
  -- ea_sinavlar'da yeni kolonları kontrol
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'ea_sinavlar' AND column_name = 'sinif_seviyesi';
  
  IF column_count = 0 THEN
    RAISE EXCEPTION 'ea_sinavlar.sinif_seviyesi kolonu eklenemedi!';
  END IF;
  
  RAISE NOTICE '✓ Wizard güncellemeleri başarıyla uygulandı';
  RAISE NOTICE '  + ea_ham_yuklemeler tablosu oluşturuldu';
  RAISE NOTICE '  + ea_soru_kazanimlari tablosu oluşturuldu';
  RAISE NOTICE '  + ea_optik_sablonlar tablosu oluşturuldu';
  RAISE NOTICE '  + ea_cevap_anahtar_sablonlari tablosu oluşturuldu';
  RAISE NOTICE '  + Tüm eksik kolonlar eklendi';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
