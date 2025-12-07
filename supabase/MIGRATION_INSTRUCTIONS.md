# 📊 SUPABASE MIGRATION INSTRUCTIONS

## Çoklu Yıl + Çoklu Kurum Sistemi Migrasyonu

### ⚠️ ÖNEMLİ UYARILAR

1. **Backup Alın**: Migration öncesi mutlaka database backup alın
2. **Test Environment**: Önce test ortamında deneyin
3. **Production Zamanı**: Kullanıcı trafiğinin az olduğu saatte yapın
4. **Geri Dönüş Planı**: Rollback scriptini hazır bulundurun

---

## 🚀 MIGRATION ADIMLARI

### Adım 1: Supabase Dashboard'a Giriş

1. https://supabase.com → Projenize giriş yapın
2. Sol menüden **SQL Editor** seçin

### Adım 2: Migration Script'i Çalıştırın

1. `supabase/migrations/001_create_multi_tenant_tables.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'e yapıştırın
4. **RUN** butonuna basın

### Adım 3: Doğrulama

Migration sonrası şu komutları çalıştırıp kontrol edin:

```sql
-- 1. Yeni tablolar oluştu mu?
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('organizations', 'academic_years', 'organization_users');

-- 2. Kolonlar eklendi mi?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('organization_id', 'academic_year_id');

-- 3. Default data var mı?
SELECT * FROM organizations;
SELECT * FROM academic_years;

-- 4. Mevcut öğrenciler migrated mi?
SELECT 
  COUNT(*) as total,
  COUNT(organization_id) as with_org,
  COUNT(academic_year_id) as with_year
FROM students;
```

### Adım 4: RLS Policies Kontrolü

```sql
-- Policies oluştu mu?
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('organizations', 'academic_years', 'organization_users');
```

---

## 📋 MIGRATION SONRASI KONTROLLER

### ✅ Başarı Kriterleri

- [ ] `organizations` tablosu oluşturuldu (1 default kayıt ile)
- [ ] `academic_years` tablosu oluşturuldu (1 aktif yıl ile)
- [ ] `organization_users` tablosu oluşturuldu
- [ ] `students` tablosuna `organization_id` ve `academic_year_id` eklendi
- [ ] Mevcut tüm students'a default organization atandı
- [ ] `finance_installments` tablosuna kolonlar eklendi
- [ ] `activity_logs` tablosuna kolonlar eklendi
- [ ] RLS policies aktif
- [ ] Triggers çalışıyor

### ❌ Hata Durumunda

Eğer migration sırasında hata alırsanız:

```sql
-- ROLLBACK (Geri alma)
-- Not: Bu sadece yeni tabloları siler, mevcut tablolara dokunmaz

DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Eğer kolonlar eklendiyse:
ALTER TABLE students DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE students DROP COLUMN IF EXISTS academic_year_id CASCADE;
ALTER TABLE finance_installments DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE finance_installments DROP COLUMN IF EXISTS academic_year_id CASCADE;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS academic_year_id CASCADE;
```

---

## 🔧 PRODUCTION'DA UYGULAMA

### Önerilen Zaman Dilimi

- **En İyi**: Cumartesi sabahı 06:00-08:00
- **Alternatif**: Hafta içi gece 02:00-04:00

### Adımlar

1. ✅ Kullanıcılara bildirim gönderin (1 gün önce)
2. ✅ Backup alın (automatic + manuel)
3. ✅ Maintenance mode açın (opsiyonel)
4. ✅ Migration'ı çalıştırın
5. ✅ Test kullanıcı ile login yapın
6. ✅ Dashboard'u kontrol edin
7. ✅ Öğrenci listesini kontrol edin
8. ✅ Kayıt işlemi test edin
9. ✅ Maintenance mode kapatın
10. ✅ Monitoring'i aktif takip edin (1 saat)

---

## 📞 DESTEK

Sorun olursa:
1. Migration log'larını kaydedin
2. Error mesajlarını not edin
3. `SELECT version();` ile Postgres versiyonunu kontrol edin
4. Supabase support'a ticket açın

---

## 🎯 SONRAKI ADIMLAR

Migration tamamlandıktan sonra:

1. ✅ Frontend Context'lerini ekleyin (`OrganizationContext`, `AcademicYearContext`)
2. ✅ TopBar'a selector'ları ekleyin
3. ✅ API endpoint'lerini güncelleyin
4. ✅ Tüm query'lere filter ekleyin

**HAZIR MISINIZ?** 🚀

