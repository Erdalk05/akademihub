# ❌ Migration Hatası: "column durum does not exist"

## Sorun
```
Error: Failed to run sql query: ERROR: 42703: column "durum" does not exist
```

Migration 005'i çalıştırmaya çalıştınız ama **migration 001 henüz çalıştırılmamış**.

---

## ✅ Çözüm: Migration'ları SIRASIYLA Çalıştırın

Supabase Dashboard > SQL Editor'de **aşağıdaki sırayla** çalıştırın:

### 1️⃣ Önce Temizlik
```sql
-- 20260118_cleanup_old_exam_tables.sql
DROP TABLE IF EXISTS exam_results CASCADE;
DROP TABLE IF EXISTS exam_participants CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
-- ... (tüm dosyayı çalıştır)
```

### 2️⃣ Temel Tabloları Oluştur
```sql
-- 20260118_ea_001_base_tables.sql
CREATE TABLE ea_dersler (...);
CREATE TABLE ea_sinavlar (...);  -- ← durum kolonu burada oluşuyor
-- ... (tüm dosyayı çalıştır)
```

### 3️⃣ RLS Policy'leri
```sql
-- 20260118_ea_002_rls_policies.sql
```

### 4️⃣ Index'ler
```sql
-- 20260118_ea_003_indexes.sql
```

### 5️⃣ Trigger'lar
```sql
-- 20260118_ea_004_triggers.sql
```

### 6️⃣ Wizard Güncellemeleri
```sql
-- 20260118_ea_005_wizard_updates.sql
-- ← Şu anda burada hata alıyorsunuz
```

### 7️⃣ Kazanım Tabloları
```sql
-- 20260118_ea_006_kazanim_tables.sql
```

### 8️⃣ Constraint Güncelleme
```sql
-- 20260118_ea_007_sinav_tipi_constraint.sql
```

### 9️⃣ Seed Data
```sql
-- 20260118_ea_008_seed_dersler.sql
```

---

## 🔍 Kontrol: Hangi Migration'lar Çalıştı?

Supabase'de şu sorguyu çalıştırın:

```sql
-- ea_ ile başlayan tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ea_%'
ORDER BY table_name;
```

**Beklenen sonuç (15 tablo):**
- ea_cevap_anahtar_sablonlari
- ea_cevap_anahtarlari
- ea_degisiklik_loglari
- ea_ders_sonuclari
- ea_dersler
- ea_ham_yuklemeler
- ea_katilimci_cevaplar
- ea_katilimcilar
- ea_kazanim_sonuclari
- ea_kazanimlar
- ea_optik_sablonlar
- ea_sinav_dersler
- ea_sinavlar ← Bu yoksa migration 001 çalışmamış
- ea_sonuclar
- ea_soru_kazanimlari

---

## 🚨 Eğer Tablolar Karışıksa

Tüm `ea_*` tablolarını silip baştan başlayın:

```sql
-- TÜM EA TABLOLARINI SİL (DİKKATLİ!)
DROP TABLE IF EXISTS ea_degisiklik_loglari CASCADE;
DROP TABLE IF EXISTS ea_kazanim_sonuclari CASCADE;
DROP TABLE IF EXISTS ea_kazanimlar CASCADE;
DROP TABLE IF EXISTS ea_soru_kazanimlari CASCADE;
DROP TABLE IF EXISTS ea_cevap_anahtar_sablonlari CASCADE;
DROP TABLE IF EXISTS ea_optik_sablonlar CASCADE;
DROP TABLE IF EXISTS ea_ham_yuklemeler CASCADE;
DROP TABLE IF EXISTS ea_ders_sonuclari CASCADE;
DROP TABLE IF EXISTS ea_sonuclar CASCADE;
DROP TABLE IF EXISTS ea_katilimci_cevaplar CASCADE;
DROP TABLE IF EXISTS ea_katilimcilar CASCADE;
DROP TABLE IF EXISTS ea_cevap_anahtarlari CASCADE;
DROP TABLE IF EXISTS ea_sinav_dersler CASCADE;
DROP TABLE IF EXISTS ea_sinavlar CASCADE;
DROP TABLE IF EXISTS ea_dersler CASCADE;

-- Sonra migration 001'den başlayarak sırasıyla çalıştır
```

---

## ✅ Doğru Sıra

1. cleanup (eski tabloları sil)
2. 001 (temel tablolar) ← **durum kolonu burada**
3. 002 (RLS)
4. 003 (indexes)
5. 004 (triggers)
6. 005 (wizard updates) ← **burada hata alıyorsunuz**
7. 006 (kazanım)
8. 007 (constraint)
9. 008 (seed data)

Her migration'ı çalıştırdıktan sonra "Success" mesajını bekleyin!
