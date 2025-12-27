-- ============================================
-- CEVAP ANAHTARI ŞABLONLARI (Kütüphane)
-- Aynı cevap anahtarını tekrar tekrar girmemek için
-- ============================================

CREATE TABLE IF NOT EXISTS cevap_anahtari_sablonlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Şablon bilgisi
  sablon_adi TEXT NOT NULL,
  aciklama TEXT,

  -- Filtreleme / sınıflandırma
  sinav_turu TEXT,              -- 'LGS', 'TYT', 'DENEME' vb.
  sinif_seviyesi TEXT,          -- '8', '7' vb.

  -- Cevap anahtarı verisi (CevapAnahtariSatir[])
  cevap_anahtari JSONB NOT NULL,

  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),

  -- Durum / meta
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cevap_anahtari_sablonlari_org
  ON cevap_anahtari_sablonlari (organization_id);

CREATE INDEX IF NOT EXISTS idx_cevap_anahtari_sablonlari_active
  ON cevap_anahtari_sablonlari (is_active);


