-- ============================================
-- OPTİK ŞABLON SEED DATA
-- Hazır şablonları veritabanına ekler
-- ============================================

-- ÖZDEBİR - LGS 90 Soru (GERÇEK VERİ İLE DOĞRULANDI)
INSERT INTO optik_sablonlari (
  sablon_adi,
  aciklama,
  alan_tanimlari,
  cevap_baslangic,
  toplam_soru,
  kitapcik_pozisyon,
  is_default,
  is_active
) VALUES (
  'ÖZDEBİR - LGS 90 Soru',
  'Özdebir Yayınları LGS optik formu - GERÇEK VERİ İLE DOĞRULANDI. 5-6-7-8. Sınıf destekli.',
  '[
    {"alan": "kurum_kodu", "baslangic": 1, "bitis": 10, "label": "Kurum Kodu"},
    {"alan": "ogrenci_no", "baslangic": 11, "bitis": 14, "label": "Öğrenci No"},
    {"alan": "tc", "baslangic": 15, "bitis": 25, "label": "TC Kimlik"},
    {"alan": "sinif_no", "baslangic": 26, "bitis": 27, "label": "Sınıf/Şube"},
    {"alan": "kitapcik", "baslangic": 28, "bitis": 28, "label": "Kitapçık"},
    {"alan": "cinsiyet", "baslangic": 29, "bitis": 29, "label": "Cinsiyet"},
    {"alan": "ogrenci_adi", "baslangic": 30, "bitis": 51, "label": "Ad Soyad"},
    {"alan": "cevaplar", "baslangic": 52, "bitis": 171, "label": "Cevaplar"}
  ]'::jsonb,
  52,  -- cevap_baslangic
  90,  -- toplam_soru
  28,  -- kitapcik_pozisyon
  true,  -- is_default (varsayılan şablon)
  true   -- is_active
) ON CONFLICT DO NOTHING;

-- NAR Yayınları - LGS 90 Soru
INSERT INTO optik_sablonlari (
  sablon_adi,
  aciklama,
  alan_tanimlari,
  cevap_baslangic,
  toplam_soru,
  kitapcik_pozisyon,
  is_default,
  is_active
) VALUES (
  'NAR Yayınları - LGS 90 Soru',
  'NAR Yayınları standart LGS deneme optik formu',
  '[
    {"alan": "ogrenci_no", "baslangic": 5, "bitis": 10, "label": "Öğrenci No"},
    {"alan": "ogrenci_adi", "baslangic": 11, "bitis": 35, "label": "Ad Soyad"},
    {"alan": "sinif_no", "baslangic": 36, "bitis": 37, "label": "Sınıf"},
    {"alan": "kitapcik", "baslangic": 38, "bitis": 38, "label": "Kitapçık"},
    {"alan": "cevaplar", "baslangic": 53, "bitis": 142, "label": "Cevaplar"}
  ]'::jsonb,
  53,
  90,
  38,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Netbil - LGS 90 Soru
INSERT INTO optik_sablonlari (
  sablon_adi,
  aciklama,
  alan_tanimlari,
  cevap_baslangic,
  toplam_soru,
  kitapcik_pozisyon,
  is_default,
  is_active
) VALUES (
  'Netbil - LGS 90 Soru',
  'Netbil standart LGS deneme optik formu',
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "bitis": 6, "label": "Öğrenci No"},
    {"alan": "ogrenci_adi", "baslangic": 7, "bitis": 30, "label": "Ad Soyad"},
    {"alan": "kitapcik", "baslangic": 31, "bitis": 31, "label": "Kitapçık"},
    {"alan": "cevaplar", "baslangic": 40, "bitis": 129, "label": "Cevaplar"}
  ]'::jsonb,
  40,
  90,
  31,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Tonguç Akademi - LGS 90 Soru
INSERT INTO optik_sablonlari (
  sablon_adi,
  aciklama,
  alan_tanimlari,
  cevap_baslangic,
  toplam_soru,
  kitapcik_pozisyon,
  is_default,
  is_active
) VALUES (
  'Tonguç Akademi - LGS 90 Soru',
  'Tonguç Akademi LGS deneme optik formu',
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "bitis": 7, "label": "Öğrenci No"},
    {"alan": "ogrenci_adi", "baslangic": 8, "bitis": 28, "label": "Ad Soyad"},
    {"alan": "kitapcik", "baslangic": 29, "bitis": 29, "label": "Kitapçık"},
    {"alan": "sinif_no", "baslangic": 30, "bitis": 32, "label": "Sınıf"},
    {"alan": "cevaplar", "baslangic": 35, "bitis": 124, "label": "Cevaplar"}
  ]'::jsonb,
  35,
  90,
  29,
  false,
  true
) ON CONFLICT DO NOTHING;

-- 3D Yayınları - TYT 120 Soru
INSERT INTO optik_sablonlari (
  sablon_adi,
  aciklama,
  alan_tanimlari,
  cevap_baslangic,
  toplam_soru,
  kitapcik_pozisyon,
  is_default,
  is_active
) VALUES (
  '3D Yayınları - TYT 120 Soru',
  'TYT tam deneme optik formu',
  '[
    {"alan": "ogrenci_no", "baslangic": 1, "bitis": 10, "label": "Öğrenci No"},
    {"alan": "ogrenci_adi", "baslangic": 11, "bitis": 35, "label": "Ad Soyad"},
    {"alan": "kitapcik", "baslangic": 36, "bitis": 36, "label": "Kitapçık"},
    {"alan": "cevaplar", "baslangic": 50, "bitis": 169, "label": "Cevaplar"}
  ]'::jsonb,
  50,
  120,
  36,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Doğrulama
DO $$
BEGIN
  RAISE NOTICE 'Optik şablonları eklendi. Toplam: %', (SELECT COUNT(*) FROM optik_sablonlari);
END $$;

