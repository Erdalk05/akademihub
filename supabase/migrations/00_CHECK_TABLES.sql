-- =============================================
-- MIGRATION KONTROL SCRIPTI
-- Bu dosyayı çalıştırarak hangi tabloların
-- oluşturulduğunu kontrol edebilirsiniz
-- =============================================

-- 1. EA tablolarını listele
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'ea_dersler' THEN '001 - Ders tanımları'
    WHEN table_name = 'ea_sinavlar' THEN '001 - Sınav tanımları'
    WHEN table_name = 'ea_sinav_dersler' THEN '001 - Sınav-Ders ilişkisi'
    WHEN table_name = 'ea_cevap_anahtarlari' THEN '001 - Cevap anahtarları'
    WHEN table_name = 'ea_katilimcilar' THEN '001 - Katılımcılar'
    WHEN table_name = 'ea_katilimci_cevaplar' THEN '001 - Katılımcı cevapları'
    WHEN table_name = 'ea_sonuclar' THEN '001 - Sonuçlar'
    WHEN table_name = 'ea_ders_sonuclari' THEN '001 - Ders sonuçları'
    WHEN table_name = 'ea_ham_yuklemeler' THEN '005 - Ham yüklemeler'
    WHEN table_name = 'ea_soru_kazanimlari' THEN '005 - Soru kazanımları'
    WHEN table_name = 'ea_optik_sablonlar' THEN '005 - Optik şablonlar'
    WHEN table_name = 'ea_cevap_anahtar_sablonlari' THEN '005 - Cevap anahtarı şablonları'
    WHEN table_name = 'ea_kazanimlar' THEN '006 - Kazanımlar'
    WHEN table_name = 'ea_kazanim_sonuclari' THEN '006 - Kazanım sonuçları'
    WHEN table_name = 'ea_degisiklik_loglari' THEN '006 - Değişiklik logları'
    ELSE 'Bilinmeyen'
  END as migration,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ea_%'
ORDER BY table_name;

-- 2. ea_sinavlar tablosunun kolonlarını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ea_sinavlar'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Toplam tablo sayısı
SELECT 
  COUNT(*) as toplam_ea_tablosu,
  CASE 
    WHEN COUNT(*) = 15 THEN '✅ Tüm tablolar mevcut'
    WHEN COUNT(*) >= 8 AND COUNT(*) < 12 THEN '⚠️ Migration 001 tamam, 005-006 eksik'
    WHEN COUNT(*) < 8 THEN '❌ Migration 001 eksik veya hatalı'
    ELSE '⚠️ Bazı tablolar eksik'
  END as durum
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ea_%';
