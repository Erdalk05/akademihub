-- =====================================================
-- EXAM ANALYTICS - CEVAP ANAHTARI YÖNETİM SİSTEMİ
-- Migration: 020 - Answer Key System
-- =====================================================

-- =====================================================
-- 1. MEB KAZANIMLARI (Global Reference Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS ea_meb_kazanimlar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kazanım bilgileri
    kazanim_kodu VARCHAR(50) NOT NULL UNIQUE,      -- MEB resmi kodu (örn: M.8.1.1.1)
    kazanim_adi TEXT NOT NULL,                      -- Kazanım açıklaması
    
    -- Sınıflandırma
    ders_kodu VARCHAR(20) NOT NULL,                 -- MAT, TUR, FEN, SOS, ING, DIN
    sinif_seviyesi INTEGER,                         -- 4-12, NULL = tüm sınıflar
    unite_no INTEGER,                               -- Ünite numarası
    konu_adi VARCHAR(255),                          -- Konu adı
    
    -- Sınav türü uyumluluğu
    sinav_turleri VARCHAR(50)[] DEFAULT ARRAY['lgs', 'tyt', 'ayt'],
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kazanım arama indexleri
CREATE INDEX IF NOT EXISTS idx_meb_kazanimlar_kodu ON ea_meb_kazanimlar(kazanim_kodu);
CREATE INDEX IF NOT EXISTS idx_meb_kazanimlar_ders ON ea_meb_kazanimlar(ders_kodu);
CREATE INDEX IF NOT EXISTS idx_meb_kazanimlar_sinif ON ea_meb_kazanimlar(sinif_seviyesi);
CREATE INDEX IF NOT EXISTS idx_meb_kazanimlar_search ON ea_meb_kazanimlar USING gin(to_tsvector('turkish', kazanim_adi));

-- =====================================================
-- 2. CEVAP ANAHTARI ŞABLONLARI (Kurum bazlı kütüphane)
-- =====================================================
CREATE TABLE IF NOT EXISTS ea_cevap_anahtari_sablonlar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Şablon bilgileri
    sablon_adi VARCHAR(255) NOT NULL,
    sinav_tipi VARCHAR(50) NOT NULL,                -- lgs, tyt, ayt, kurum_denemesi, konu_testi
    toplam_soru INTEGER NOT NULL,
    
    -- Ders dağılımı (JSON - hızlı erişim için)
    ders_dagilimi JSONB DEFAULT '[]'::jsonb,
    -- Örnek: [{"dersKodu": "MAT", "soruSayisi": 20, "baslangic": 1, "bitis": 20}]
    
    -- Metadata
    kullanim_sayisi INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(organization_id, sablon_adi)
);

-- Şablon indexleri
CREATE INDEX IF NOT EXISTS idx_cevap_sablonlar_org ON ea_cevap_anahtari_sablonlar(organization_id);
CREATE INDEX IF NOT EXISTS idx_cevap_sablonlar_tip ON ea_cevap_anahtari_sablonlar(sinav_tipi);

-- =====================================================
-- 3. CEVAP ANAHTARI KİTAPÇIKLARI
-- =====================================================
CREATE TABLE IF NOT EXISTS ea_cevap_anahtari_kitapciklar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- İlişkiler (şablon VEYA sınav - biri dolu olmalı)
    sablon_id UUID REFERENCES ea_cevap_anahtari_sablonlar(id) ON DELETE CASCADE,
    sinav_id UUID REFERENCES ea_sinavlar(id) ON DELETE CASCADE,
    
    -- Kitapçık bilgisi
    kitapcik_kodu CHAR(1) NOT NULL CHECK (kitapcik_kodu IN ('A', 'B', 'C', 'D')),
    
    -- Cevaplar (tek string - hızlı erişim)
    cevap_dizisi TEXT,                              -- "ABCDABCDABCD..."
    
    -- Metadata
    is_primary BOOLEAN DEFAULT false,               -- Ana kitapçık mı?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_kitapcik_parent CHECK (
        (sablon_id IS NOT NULL AND sinav_id IS NULL) OR
        (sablon_id IS NULL AND sinav_id IS NOT NULL)
    ),
    UNIQUE(sablon_id, kitapcik_kodu),
    UNIQUE(sinav_id, kitapcik_kodu)
);

-- Kitapçık indexleri
CREATE INDEX IF NOT EXISTS idx_kitapciklar_sablon ON ea_cevap_anahtari_kitapciklar(sablon_id);
CREATE INDEX IF NOT EXISTS idx_kitapciklar_sinav ON ea_cevap_anahtari_kitapciklar(sinav_id);

-- =====================================================
-- 4. SORU BAZLI CEVAPLAR VE KAZANIMLAR
-- =====================================================
CREATE TABLE IF NOT EXISTS ea_cevap_anahtari_sorular (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- İlişkiler
    kitapcik_id UUID NOT NULL REFERENCES ea_cevap_anahtari_kitapciklar(id) ON DELETE CASCADE,
    
    -- Soru bilgileri
    soru_no INTEGER NOT NULL,
    dogru_cevap CHAR(1) CHECK (dogru_cevap IN ('A', 'B', 'C', 'D', 'E', '-')),
    
    -- Ders bilgisi
    ders_kodu VARCHAR(20),
    
    -- MEB Kazanım (opsiyonel)
    kazanim_id UUID REFERENCES ea_meb_kazanimlar(id),
    kazanim_kodu VARCHAR(50),                       -- Denormalized for speed
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(kitapcik_id, soru_no)
);

-- Soru indexleri
CREATE INDEX IF NOT EXISTS idx_sorular_kitapcik ON ea_cevap_anahtari_sorular(kitapcik_id);
CREATE INDEX IF NOT EXISTS idx_sorular_kazanim ON ea_cevap_anahtari_sorular(kazanim_id);
CREATE INDEX IF NOT EXISTS idx_sorular_ders ON ea_cevap_anahtari_sorular(ders_kodu);

-- =====================================================
-- 5. ea_sinavlar TABLOSUNA CEVAP ANAHTARI BAĞLANTISI
-- =====================================================
DO $$
BEGIN
    -- Cevap anahtarı şablon referansı
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ea_sinavlar' AND column_name = 'cevap_anahtari_sablon_id'
    ) THEN
        ALTER TABLE ea_sinavlar 
        ADD COLUMN cevap_anahtari_sablon_id UUID REFERENCES ea_cevap_anahtari_sablonlar(id);
    END IF;
    
    -- Cevap anahtarı tamamlandı mı?
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ea_sinavlar' AND column_name = 'cevap_anahtari_tamamlandi'
    ) THEN
        ALTER TABLE ea_sinavlar 
        ADD COLUMN cevap_anahtari_tamamlandi BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- 6. RLS POLİCYLERİ
-- =====================================================

-- MEB Kazanımları - Herkes okuyabilir (global reference)
ALTER TABLE ea_meb_kazanimlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meb_kazanimlar_select" ON ea_meb_kazanimlar;
CREATE POLICY "meb_kazanimlar_select" ON ea_meb_kazanimlar
    FOR SELECT USING (true);

-- Cevap Anahtarı Şablonları - Kurum bazlı
ALTER TABLE ea_cevap_anahtari_sablonlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cevap_sablonlar_select" ON ea_cevap_anahtari_sablonlar;
CREATE POLICY "cevap_sablonlar_select" ON ea_cevap_anahtari_sablonlar
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cevap_sablonlar_insert" ON ea_cevap_anahtari_sablonlar;
CREATE POLICY "cevap_sablonlar_insert" ON ea_cevap_anahtari_sablonlar
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cevap_sablonlar_update" ON ea_cevap_anahtari_sablonlar;
CREATE POLICY "cevap_sablonlar_update" ON ea_cevap_anahtari_sablonlar
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "cevap_sablonlar_delete" ON ea_cevap_anahtari_sablonlar;
CREATE POLICY "cevap_sablonlar_delete" ON ea_cevap_anahtari_sablonlar
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

-- Kitapçıklar - Parent üzerinden kontrol
ALTER TABLE ea_cevap_anahtari_kitapciklar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kitapciklar_all" ON ea_cevap_anahtari_kitapciklar;
CREATE POLICY "kitapciklar_all" ON ea_cevap_anahtari_kitapciklar
    FOR ALL USING (
        sablon_id IN (SELECT id FROM ea_cevap_anahtari_sablonlar) OR
        sinav_id IN (SELECT id FROM ea_sinavlar)
    );

-- Sorular - Parent üzerinden kontrol
ALTER TABLE ea_cevap_anahtari_sorular ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sorular_all" ON ea_cevap_anahtari_sorular;
CREATE POLICY "sorular_all" ON ea_cevap_anahtari_sorular
    FOR ALL USING (
        kitapcik_id IN (SELECT id FROM ea_cevap_anahtari_kitapciklar)
    );

-- =====================================================
-- 7. UPDATED_AT TRIGGER'LARI
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_meb_kazanimlar_updated_at ON ea_meb_kazanimlar;
CREATE TRIGGER update_meb_kazanimlar_updated_at
    BEFORE UPDATE ON ea_meb_kazanimlar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cevap_sablonlar_updated_at ON ea_cevap_anahtari_sablonlar;
CREATE TRIGGER update_cevap_sablonlar_updated_at
    BEFORE UPDATE ON ea_cevap_anahtari_sablonlar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kitapciklar_updated_at ON ea_cevap_anahtari_kitapciklar;
CREATE TRIGGER update_kitapciklar_updated_at
    BEFORE UPDATE ON ea_cevap_anahtari_kitapciklar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sorular_updated_at ON ea_cevap_anahtari_sorular;
CREATE TRIGGER update_sorular_updated_at
    BEFORE UPDATE ON ea_cevap_anahtari_sorular
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ÖRNEK MEB KAZANIMLARI (LGS Matematik)
-- =====================================================
INSERT INTO ea_meb_kazanimlar (kazanim_kodu, kazanim_adi, ders_kodu, sinif_seviyesi, unite_no, konu_adi, sinav_turleri)
VALUES 
    -- Matematik 8. Sınıf
    ('M.8.1.1.1', 'Üslü ifadeleri tanır ve kullanır.', 'MAT', 8, 1, 'Üslü İfadeler', ARRAY['lgs']),
    ('M.8.1.1.2', 'Üslü ifadelerle çarpma ve bölme işlemleri yapar.', 'MAT', 8, 1, 'Üslü İfadeler', ARRAY['lgs']),
    ('M.8.1.2.1', 'Kareköklü ifadeleri tanır ve kullanır.', 'MAT', 8, 1, 'Kareköklü İfadeler', ARRAY['lgs']),
    ('M.8.1.2.2', 'Kareköklü ifadelerle toplama ve çıkarma işlemleri yapar.', 'MAT', 8, 1, 'Kareköklü İfadeler', ARRAY['lgs']),
    ('M.8.1.3.1', 'Gerçek sayıları tanır ve sayı doğrusunda gösterir.', 'MAT', 8, 1, 'Gerçek Sayılar', ARRAY['lgs']),
    ('M.8.2.1.1', 'Cebirsel ifadeleri çarpanlarına ayırır.', 'MAT', 8, 2, 'Cebirsel İfadeler', ARRAY['lgs']),
    ('M.8.2.2.1', 'Doğrusal denklemleri çözer.', 'MAT', 8, 2, 'Denklemler', ARRAY['lgs']),
    ('M.8.2.3.1', 'Eşitsizlikleri çözer ve sayı doğrusunda gösterir.', 'MAT', 8, 2, 'Eşitsizlikler', ARRAY['lgs']),
    
    -- Türkçe 8. Sınıf
    ('T.8.1.1.1', 'Metindeki ana fikri belirler.', 'TUR', 8, 1, 'Anlama', ARRAY['lgs']),
    ('T.8.1.2.1', 'Metindeki yardımcı fikirleri belirler.', 'TUR', 8, 1, 'Anlama', ARRAY['lgs']),
    ('T.8.2.1.1', 'Sözcükte anlam özelliklerini kavrar.', 'TUR', 8, 2, 'Sözcükte Anlam', ARRAY['lgs']),
    ('T.8.3.1.1', 'Cümlenin öğelerini belirler.', 'TUR', 8, 3, 'Cümle Bilgisi', ARRAY['lgs']),
    
    -- Fen Bilimleri 8. Sınıf
    ('F.8.1.1.1', 'Mevsim değişikliklerinin nedenlerini açıklar.', 'FEN', 8, 1, 'Mevsimler', ARRAY['lgs']),
    ('F.8.2.1.1', 'DNA ve genetik kod kavramlarını açıklar.', 'FEN', 8, 2, 'DNA ve Genetik Kod', ARRAY['lgs']),
    ('F.8.3.1.1', 'Basınç kavramını açıklar.', 'FEN', 8, 3, 'Basınç', ARRAY['lgs']),
    
    -- Sosyal Bilgiler 8. Sınıf (İnkılap Tarihi)
    ('SB.8.1.1.1', 'Osmanlı Devletinin son dönemindeki gelişmeleri değerlendirir.', 'SOS', 8, 1, 'Bir Kahraman Doğuyor', ARRAY['lgs']),
    ('SB.8.2.1.1', 'Milli Mücadelenin hazırlık dönemini analiz eder.', 'SOS', 8, 2, 'Milli Uyanış', ARRAY['lgs']),
    
    -- İngilizce 8. Sınıf
    ('E.8.1.1.1', 'Günlük yaşamla ilgili diyalogları anlar.', 'ING', 8, 1, 'Friendship', ARRAY['lgs']),
    ('E.8.2.1.1', 'Geçmiş zaman ifadelerini kullanır.', 'ING', 8, 2, 'Teen Life', ARRAY['lgs']),
    
    -- Din Kültürü 8. Sınıf
    ('DK.8.1.1.1', 'Kader ve kaza kavramlarını açıklar.', 'DIN', 8, 1, 'Kader', ARRAY['lgs']),
    ('DK.8.2.1.1', 'Zekât ve sadakanın önemini kavrar.', 'DIN', 8, 2, 'Zekât ve Sadaka', ARRAY['lgs'])
    
ON CONFLICT (kazanim_kodu) DO NOTHING;

-- =====================================================
-- KONTROL SORGUSU
-- =====================================================
DO $$
DECLARE
    tablo_sayisi INTEGER;
    kazanim_sayisi INTEGER;
BEGIN
    SELECT COUNT(*) INTO tablo_sayisi
    FROM information_schema.tables 
    WHERE table_name IN (
        'ea_meb_kazanimlar',
        'ea_cevap_anahtari_sablonlar',
        'ea_cevap_anahtari_kitapciklar',
        'ea_cevap_anahtari_sorular'
    );
    
    SELECT COUNT(*) INTO kazanim_sayisi FROM ea_meb_kazanimlar;
    
    RAISE NOTICE '✅ Cevap Anahtarı Sistemi kuruldu!';
    RAISE NOTICE '   - Tablolar: % / 4', tablo_sayisi;
    RAISE NOTICE '   - MEB Kazanımları: %', kazanim_sayisi;
END $$;
