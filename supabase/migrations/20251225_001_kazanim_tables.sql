-- ============================================
-- AkademiHub - Kazanım Bazlı Değerlendirme Sistemi
-- MEB Müfredatı Uyumlu
-- ============================================

-- 1. KAZANIMLAR (MEB Kazanımları)
CREATE TABLE IF NOT EXISTS kazanimlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hiyerarşi
  ders_kodu TEXT NOT NULL,              -- 'TUR', 'MAT', 'FEN', 'SOS', 'ING', 'DIN'
  ders_adi TEXT NOT NULL,               -- 'Türkçe'
  sinif_seviyesi TEXT,                  -- '8', '9-10', '11-12'
  unite_no INT,                         -- 1, 2, 3...
  unite_adi TEXT,
  
  -- Kazanım Detayları
  kazanim_kodu TEXT NOT NULL UNIQUE,    -- 'T.8.1.2', 'M.8.2.1.1'
  kazanim_metni TEXT NOT NULL,          -- 'Sözcüğün mecaz anlamını kavrar'
  kisa_aciklama TEXT,                   -- Kısa versiyon
  
  -- Kategorilendirme
  bloom_seviyesi INT DEFAULT 1,         -- 1-6 (Hatırlama -> Oluşturma)
  zorluk_seviyesi TEXT DEFAULT 'orta',  -- 'kolay', 'orta', 'zor'
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SINAV_CEVAP_ANAHTARI (Kazanım Bazlı)
CREATE TABLE IF NOT EXISTS sinav_cevap_anahtari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  -- Soru Bilgisi
  soru_no INT NOT NULL,
  dogru_cevap CHAR(1) NOT NULL,         -- 'A', 'B', 'C', 'D', 'E'
  
  -- Ders ve Kazanım
  ders_kodu TEXT NOT NULL,              -- 'TUR', 'MAT'
  kazanim_id UUID REFERENCES kazanimlar(id),
  kazanim_kodu TEXT,                    -- 'T.8.1.2' (kazanim_id null ise)
  kazanim_metni TEXT,                   -- Kazanım açıklaması
  
  -- Ek bilgiler
  konu_adi TEXT,                        -- 'Sözcükte Anlam'
  zorluk DECIMAL(3,2) DEFAULT 0.5,      -- 0.00 - 1.00
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, soru_no)
);

-- 3. OPTİK ŞABLONLARI (Template)
CREATE TABLE IF NOT EXISTS optik_sablonlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Şablon Bilgisi
  sablon_adi TEXT NOT NULL,             -- 'Dikmen Çözüm LGS Şablonu'
  aciklama TEXT,
  
  -- Alan Tanımları (JSON)
  -- Format: [{"alan": "sinif_no", "baslangic": 1, "bitis": 10}, ...]
  alan_tanimlari JSONB NOT NULL,
  
  -- Soru Aralığı
  cevap_baslangic INT NOT NULL,         -- Cevapların başladığı karakter
  toplam_soru INT NOT NULL,             -- Toplam soru sayısı
  
  -- Opsiyonel Alanlar
  kitapcik_pozisyon INT,                -- Kitapçık tipi karakteri
  
  -- Durum
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÖĞRENCİ KAZANIM SONUÇLARI
CREATE TABLE IF NOT EXISTS ogrenci_kazanim_sonuclari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kazanim_id UUID REFERENCES kazanimlar(id),
  kazanim_kodu TEXT NOT NULL,
  
  -- Sonuç
  toplam_soru INT DEFAULT 0,            -- Bu kazanımdan kaç soru vardı
  dogru_sayisi INT DEFAULT 0,
  yanlis_sayisi INT DEFAULT 0,
  bos_sayisi INT DEFAULT 0,
  basari_orani DECIMAL(5,2),            -- 0.00 - 100.00 (%)
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id, kazanim_kodu)
);

-- 5. MANUEL VERİ GİRİŞİ (Optik okuyucu olmadan)
CREATE TABLE IF NOT EXISTS manuel_cevap_girisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Cevaplar (JSON array)
  -- Format: ["A", "B", "C", null, "D", ...]
  cevaplar JSONB NOT NULL,
  
  -- Kitapçık
  kitapcik_tipi CHAR(1) DEFAULT 'A',
  
  -- Giriş bilgisi
  giris_turu TEXT DEFAULT 'manuel',     -- 'manuel', 'optik', 'api'
  
  -- İşlenme durumu
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_kazanimlar_ders ON kazanimlar(ders_kodu);
CREATE INDEX IF NOT EXISTS idx_kazanimlar_kod ON kazanimlar(kazanim_kodu);
CREATE INDEX IF NOT EXISTS idx_kazanimlar_org ON kazanimlar(organization_id);

CREATE INDEX IF NOT EXISTS idx_sinav_cevap_exam ON sinav_cevap_anahtari(exam_id);
CREATE INDEX IF NOT EXISTS idx_sinav_cevap_ders ON sinav_cevap_anahtari(ders_kodu);
CREATE INDEX IF NOT EXISTS idx_sinav_cevap_kazanim ON sinav_cevap_anahtari(kazanim_id);

CREATE INDEX IF NOT EXISTS idx_optik_sablon_org ON optik_sablonlari(organization_id);
CREATE INDEX IF NOT EXISTS idx_optik_sablon_default ON optik_sablonlari(is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_ogrenci_kazanim_exam ON ogrenci_kazanim_sonuclari(exam_id);
CREATE INDEX IF NOT EXISTS idx_ogrenci_kazanim_student ON ogrenci_kazanim_sonuclari(student_id);
CREATE INDEX IF NOT EXISTS idx_ogrenci_kazanim_kod ON ogrenci_kazanim_sonuclari(kazanim_kodu);

CREATE INDEX IF NOT EXISTS idx_manuel_cevap_exam ON manuel_cevap_girisi(exam_id);
CREATE INDEX IF NOT EXISTS idx_manuel_cevap_student ON manuel_cevap_girisi(student_id);

-- COMMENTS
COMMENT ON TABLE kazanimlar IS 'MEB müfredatı kazanımları - ders ve sınıf bazlı';
COMMENT ON TABLE sinav_cevap_anahtari IS 'Sınav sorularının kazanım eşleştirmesi';
COMMENT ON TABLE optik_sablonlari IS 'Optik okuyucu TXT şablonları - alan tanımları';
COMMENT ON TABLE ogrenci_kazanim_sonuclari IS 'Öğrencinin kazanım bazlı başarı analizi';
COMMENT ON TABLE manuel_cevap_girisi IS 'Optik olmadan manuel cevap girişi';

