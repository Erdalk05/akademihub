-- ============================================================================
-- SCORING RULES - Kurum Bazlı Puanlama Kuralları
-- Her kurum kendi LGS/TYT/AYT katsayılarını belirleyebilir
-- ============================================================================

-- Puanlama kuralları tablosu
CREATE TABLE IF NOT EXISTS scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Sınav türü
  sinav_turu TEXT NOT NULL, -- 'LGS', 'TYT', 'AYT_SAY', 'AYT_EA', 'AYT_SOZ', 'AYT_DIL', 'DENEME'
  ad TEXT NOT NULL,
  aciklama TEXT,
  
  -- Net hesaplama
  net_hesaplama TEXT NOT NULL DEFAULT 'standart_4', -- 'standart_4', 'standart_3', 'yok', 'ozel'
  yanlis_katsayisi NUMERIC(3,1) NOT NULL DEFAULT 4,
  
  -- Puan aralığı
  taban_puan NUMERIC(5,2) NOT NULL DEFAULT 0,
  tavan_puan NUMERIC(5,2) NOT NULL DEFAULT 500,
  
  -- Formül tipi
  formul_tipi TEXT NOT NULL DEFAULT 'linear', -- 'lgs', 'tyt', 'ayt_say', 'ayt_soz', 'ayt_ea', 'linear'
  
  -- Ders katsayıları (JSON array)
  ders_katsayilari JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Örnek: [{"dersKodu": "TYT_TUR", "dersAdi": "Türkçe", "katsayi": 1.32}]
  
  -- Ders dağılımı (JSON array) - opsiyonel, özel sınavlar için
  ders_dagilimi JSONB DEFAULT '[]'::jsonb,
  -- Örnek: [{"dersKodu": "TUR", "dersAdi": "Türkçe", "soruSayisi": 40, "baslangicSoru": 1, "bitisSoru": 40}]
  
  -- Normalizasyon
  normalizasyon TEXT DEFAULT 'yok', -- 'yok', 'linear', 'standart_sapma', 'percentile'
  standart_sapma_dahil BOOLEAN DEFAULT false,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Bu sınav türü için varsayılan mı?
  is_system BOOLEAN DEFAULT false, -- Sistem tarafından oluşturuldu mu? (silinemez)
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_scoring_rules_org ON scoring_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_sinav_turu ON scoring_rules(sinav_turu);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_active ON scoring_rules(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_rules_default ON scoring_rules(organization_id, sinav_turu) WHERE is_default = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_scoring_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scoring_rules_updated ON scoring_rules;
CREATE TRIGGER trigger_scoring_rules_updated
  BEFORE UPDATE ON scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_scoring_rules_timestamp();

-- RLS Policies
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;

-- Okuma: Kendi kurum verilerini görebilir
DROP POLICY IF EXISTS scoring_rules_select ON scoring_rules;
CREATE POLICY scoring_rules_select ON scoring_rules
  FOR SELECT
  USING (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    OR is_system = true
  );

-- Ekleme: Kendi kurumuna ekleyebilir
DROP POLICY IF EXISTS scoring_rules_insert ON scoring_rules;
CREATE POLICY scoring_rules_insert ON scoring_rules
  FOR INSERT
  WITH CHECK (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
  );

-- Güncelleme: Kendi kurum verilerini güncelleyebilir (sistem kayıtları hariç)
DROP POLICY IF EXISTS scoring_rules_update ON scoring_rules;
CREATE POLICY scoring_rules_update ON scoring_rules
  FOR UPDATE
  USING (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    AND is_system = false
  );

-- Silme: Kendi kurum verilerini silebilir (sistem kayıtları hariç)
DROP POLICY IF EXISTS scoring_rules_delete ON scoring_rules;
CREATE POLICY scoring_rules_delete ON scoring_rules
  FOR DELETE
  USING (
    organization_id::text = (current_setting('request.jwt.claims', true)::json->>'organization_id')
    AND is_system = false
  );

-- ============================================================================
-- VARSAYILAN PUANLAMA KURALLARI (SEED DATA)
-- Bu veriler her kurum için ilk kayıt olarak eklenir
-- ============================================================================

-- Fonksiyon: Yeni kurum için varsayılan puanlama kurallarını oluştur
CREATE OR REPLACE FUNCTION create_default_scoring_rules(org_id UUID)
RETURNS void AS $$
BEGIN
  -- LGS Varsayılan
  INSERT INTO scoring_rules (
    organization_id, sinav_turu, ad, aciklama,
    net_hesaplama, yanlis_katsayisi, taban_puan, tavan_puan,
    formul_tipi, ders_katsayilari, is_default, is_system
  ) VALUES (
    org_id, 'LGS', 'LGS Standart', 'LGS deneme sınavları için varsayılan puanlama',
    'standart_3', 3, 100, 500, 'lgs',
    '[
      {"dersKodu": "TUR", "dersAdi": "Türkçe", "katsayi": 4.0},
      {"dersKodu": "MAT", "dersAdi": "Matematik", "katsayi": 4.0},
      {"dersKodu": "FEN", "dersAdi": "Fen Bilimleri", "katsayi": 4.0},
      {"dersKodu": "SOS", "dersAdi": "T.C. İnkılap Tarihi", "katsayi": 4.0},
      {"dersKodu": "DIN", "dersAdi": "Din Kültürü", "katsayi": 4.0},
      {"dersKodu": "ING", "dersAdi": "İngilizce", "katsayi": 4.0}
    ]'::jsonb,
    true, true
  ) ON CONFLICT DO NOTHING;

  -- TYT Varsayılan
  INSERT INTO scoring_rules (
    organization_id, sinav_turu, ad, aciklama,
    net_hesaplama, yanlis_katsayisi, taban_puan, tavan_puan,
    formul_tipi, ders_katsayilari, normalizasyon, standart_sapma_dahil,
    is_default, is_system
  ) VALUES (
    org_id, 'TYT', 'TYT Standart', 'TYT deneme sınavları için ÖSYM uyumlu puanlama',
    'standart_4', 4, 0, 500, 'tyt',
    '[
      {"dersKodu": "TYT_TUR", "dersAdi": "Türkçe", "katsayi": 1.32},
      {"dersKodu": "TYT_SOS", "dersAdi": "Sosyal Bilimler", "katsayi": 1.36},
      {"dersKodu": "TYT_MAT", "dersAdi": "Temel Matematik", "katsayi": 1.32},
      {"dersKodu": "TYT_FEN", "dersAdi": "Fen Bilimleri", "katsayi": 1.36}
    ]'::jsonb,
    'standart_sapma', true,
    true, true
  ) ON CONFLICT DO NOTHING;

  -- AYT Sayısal Varsayılan
  INSERT INTO scoring_rules (
    organization_id, sinav_turu, ad, aciklama,
    net_hesaplama, yanlis_katsayisi, taban_puan, tavan_puan,
    formul_tipi, ders_katsayilari, normalizasyon, standart_sapma_dahil,
    is_default, is_system
  ) VALUES (
    org_id, 'AYT_SAY', 'AYT Sayısal Standart', 'AYT Sayısal deneme sınavları için ÖSYM uyumlu puanlama',
    'standart_4', 4, 0, 500, 'ayt_say',
    '[
      {"dersKodu": "AYT_MAT", "dersAdi": "Matematik", "katsayi": 3.00},
      {"dersKodu": "AYT_FIZ", "dersAdi": "Fizik", "katsayi": 2.85},
      {"dersKodu": "AYT_KIM", "dersAdi": "Kimya", "katsayi": 3.07},
      {"dersKodu": "AYT_BIY", "dersAdi": "Biyoloji", "katsayi": 3.07}
    ]'::jsonb,
    'standart_sapma', true,
    true, true
  ) ON CONFLICT DO NOTHING;

  -- AYT Eşit Ağırlık Varsayılan
  INSERT INTO scoring_rules (
    organization_id, sinav_turu, ad, aciklama,
    net_hesaplama, yanlis_katsayisi, taban_puan, tavan_puan,
    formul_tipi, ders_katsayilari, normalizasyon, standart_sapma_dahil,
    is_default, is_system
  ) VALUES (
    org_id, 'AYT_EA', 'AYT Eşit Ağırlık Standart', 'AYT EA deneme sınavları için ÖSYM uyumlu puanlama',
    'standart_4', 4, 0, 500, 'ayt_ea',
    '[
      {"dersKodu": "EDEB", "dersAdi": "Türk Dili ve Edebiyatı", "katsayi": 3.00},
      {"dersKodu": "TAR1", "dersAdi": "Tarih-1", "katsayi": 2.80},
      {"dersKodu": "COG1", "dersAdi": "Coğrafya-1", "katsayi": 3.33},
      {"dersKodu": "MAT", "dersAdi": "Matematik", "katsayi": 3.00}
    ]'::jsonb,
    'standart_sapma', true,
    true, true
  ) ON CONFLICT DO NOTHING;

  -- AYT Sözel Varsayılan
  INSERT INTO scoring_rules (
    organization_id, sinav_turu, ad, aciklama,
    net_hesaplama, yanlis_katsayisi, taban_puan, tavan_puan,
    formul_tipi, ders_katsayilari, normalizasyon, standart_sapma_dahil,
    is_default, is_system
  ) VALUES (
    org_id, 'AYT_SOZ', 'AYT Sözel Standart', 'AYT Sözel deneme sınavları için ÖSYM uyumlu puanlama',
    'standart_4', 4, 0, 500, 'ayt_soz',
    '[
      {"dersKodu": "EDEB", "dersAdi": "Türk Dili ve Edebiyatı", "katsayi": 3.00},
      {"dersKodu": "TAR1", "dersAdi": "Tarih-1", "katsayi": 2.80},
      {"dersKodu": "COG1", "dersAdi": "Coğrafya-1", "katsayi": 3.33},
      {"dersKodu": "TAR2", "dersAdi": "Tarih-2", "katsayi": 2.90},
      {"dersKodu": "COG2", "dersAdi": "Coğrafya-2", "katsayi": 2.90},
      {"dersKodu": "FEL", "dersAdi": "Felsefe Grubu", "katsayi": 3.00},
      {"dersKodu": "DIN", "dersAdi": "Din Kültürü", "katsayi": 3.33}
    ]'::jsonb,
    'standart_sapma', true,
    true, true
  ) ON CONFLICT DO NOTHING;

  -- YDT Varsayılan
  INSERT INTO scoring_rules (
    organization_id, sinav_turu, ad, aciklama,
    net_hesaplama, yanlis_katsayisi, taban_puan, tavan_puan,
    formul_tipi, ders_katsayilari, normalizasyon, standart_sapma_dahil,
    is_default, is_system
  ) VALUES (
    org_id, 'AYT_DIL', 'YDT Standart', 'Yabancı Dil Testi için ÖSYM uyumlu puanlama',
    'standart_4', 4, 0, 500, 'ydt',
    '[
      {"dersKodu": "ING", "dersAdi": "İngilizce", "katsayi": 3.75}
    ]'::jsonb,
    'standart_sapma', true,
    true, true
  ) ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- Yorum: Bu fonksiyonu yeni kurum oluşturulduğunda çağırın:
-- SELECT create_default_scoring_rules('kurum-uuid-buraya');
