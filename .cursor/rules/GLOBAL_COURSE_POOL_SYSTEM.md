# 🌐 GLOBAL DERS HAVUZU SİSTEMİ - ÇOKLU KURUM ÇÖZÜMÜ

## 🎯 SORUN

**Eski Sistem:**
```
Yeni Kurum 1 → 23 ders ekle
Yeni Kurum 2 → 23 ders ekle
Yeni Kurum 3 → 23 ders ekle
...
Kurum 100 → 23 ders ekle ❌ SÜRDÜRÜLEMEZ!
```

**Sonuç:**
- ❌ Veritabanında 2,300 aynı kayıt (100 kurum x 23 ders)
- ❌ Her yeni kurumda manuel ders ekleme
- ❌ Ders güncelleme zor
- ❌ Senkronizasyon sorunu

---

## ✅ YENİ SİSTEM: GLOBAL DERS HAVUZU

### Konsept

```
┌─────────────────────────────────────────┐
│   GLOBAL DERS HAVUZU (23 ders)         │
│   organization_id = NULL                │
│   ↓ Tüm kurumlar buradan çeker          │
└─────────────────────────────────────────┘
         ↓         ↓         ↓
    Kurum 1   Kurum 2   Kurum 100
     (0)       (+2)      (0)
   
Kurum 1: 23 global ders kullanır
Kurum 2: 23 global + 2 özel = 25 ders
Kurum 100: 23 global ders kullanır
```

---

## 📊 AVANTAJLAR

### 1. **Tek Seferlik Ders Tanımı**
```sql
-- Sadece 1 kez çalıştır
organization_id = NULL → 23 ders
```

✅ Yeni kurum geldiğinde **hiçbir şey yapmana gerek yok!**

### 2. **Merkezi Güncelleme**
```sql
-- Türkçe dersini güncelle
UPDATE ea_dersler 
SET max_soru_sayisi = 50 
WHERE ders_kodu = 'TUR' AND organization_id IS NULL;

-- ✅ Tüm 100 kurum için güncellendi!
```

### 3. **Kuruma Özel Dersler**
```sql
-- Sadece "ABC Kursu" için özel ders ekle
INSERT INTO ea_dersler (organization_id, ders_kodu, ders_adi, ...)
VALUES ('abc-kurum-id', 'ROBO', 'Robotik', ...);

-- ✅ Sadece ABC Kursu bu dersi görür
```

### 4. **Öncelik Sistemi**
```
Kurum özel ders varsa → Onu kullan
Kurum özel ders yoksa → Global'i kullan
```

**Örnek:**
```sql
Global: TUR → "Türkçe" (40 soru)
Kurum X: TUR → "Türk Dili" (50 soru) [Özel]

Kurum X için → "Türk Dili" gösterilir
Diğer kurumlar için → "Türkçe" gösterilir
```

---

## 🔧 TEKNİK DETAYLAR

### Veritabanı Değişiklikleri

```sql
-- 1. organization_id NULL olabilir
ALTER TABLE ea_dersler 
  ALTER COLUMN organization_id DROP NOT NULL;

-- 2. UNIQUE constraint güncellendi
UNIQUE NULLS NOT DISTINCT (organization_id, ders_kodu)

-- 3. Global dersler eklendi
INSERT INTO ea_dersler (organization_id, ders_kodu, ...)
VALUES (NULL, 'TUR', 'Türkçe', ...);
```

### API Değişiklikleri

**Eski:**
```typescript
// Sadece kuruma özel dersleri getir
.eq('organization_id', organizationId)
```

**Yeni:**
```typescript
// Global + Kuruma özel dersleri getir
.or(`organization_id.is.null,organization_id.eq.${organizationId}`)

// Duplike kontrolü (Kuruma özel öncelikli)
const dersMap = new Map();
data?.forEach(ders => {
  const existing = dersMap.get(ders.ders_kodu);
  if (!existing || (ders.organization_id && !existing.organization_id)) {
    dersMap.set(ders.ders_kodu, ders);
  }
});
```

---

## 🚀 DEPLOYMENT

### Migration Dosyası:
```
📄 20260118_ea_011_global_course_pool.sql
```

### Adımlar:
1. **Eski Migration 010'u ÇALIŞTIRMAYIN!** (O artık gereksiz)
2. **Migration 011'i çalıştırın:**
   - Supabase Dashboard > SQL Editor
   - 20260118_ea_011_global_course_pool.sql
   - Run

### Ne Olacak:
```
1. organization_id → NULL yapılabilir hale gelir
2. Global 23 ders eklenir (organization_id = NULL)
3. Eski kuruma özel dersler kalır (opsiyonel temizlik)
4. ✅ Tüm kurumlar 23 dersi kullanabilir!
```

---

## 📋 KULLANIM ÖRNEKLERİ

### Örnek 1: Yeni Kurum Ekle
```sql
-- HIÇBIR ŞEY YAPMA!
-- Yeni kurum otomatik olarak 23 global dersi kullanır
```

### Örnek 2: Kuruma Özel Ders Ekle
```sql
-- "XYZ Okulu" için "Robotik" dersi ekle
INSERT INTO ea_dersler (
  organization_id,
  ders_kodu,
  ders_adi,
  ders_kategori,
  ...
) VALUES (
  'xyz-okul-id',
  'ROBO',
  'Robotik',
  'sayisal',
  ...
);

-- ✅ Sadece XYZ Okulu bu dersi görür
```

### Örnek 3: Global Ders Güncelle
```sql
-- Tüm kurumlar için Matematik'in max soru sayısını değiştir
UPDATE ea_dersler 
SET max_soru_sayisi = 50 
WHERE ders_kodu = 'MAT' AND organization_id IS NULL;

-- ✅ 100 kurum için tek seferde güncellendi!
```

### Örnek 4: Kuruma Özel Güncelleme
```sql
-- Sadece "ABC Kursu" için Türkçe'yi değiştir
-- Önce kuruma özel kayıt oluştur
INSERT INTO ea_dersler (
  organization_id,
  ders_kodu,
  ders_adi,
  ...
) VALUES (
  'abc-kurs-id',
  'TUR',
  'Türk Dili',  -- Özel isim
  ...
);

-- ✅ ABC Kursu "Türk Dili" görür
-- ✅ Diğer kurumlar "Türkçe" görür
```

---

## 🔍 KONTROL SORGUSU

### Global ve Kuruma Özel Dersleri Göster:
```sql
SELECT 
  CASE 
    WHEN organization_id IS NULL THEN '🌐 GLOBAL'
    ELSE '🏢 ' || o.name
  END as kurum,
  COUNT(*) as ders_sayisi,
  STRING_AGG(ders_kodu, ', ' ORDER BY sira_no) as dersler
FROM ea_dersler d
LEFT JOIN organizations o ON o.id = d.organization_id
GROUP BY organization_id, o.name
ORDER BY organization_id NULLS FIRST;
```

**Beklenen Çıktı:**
```
| kurum                | ders_sayisi | dersler                    |
|----------------------|-------------|----------------------------|
| 🌐 GLOBAL            | 23          | TUR, MAT, FEN, SOS, ...   |
| 🏢 ABC Kursu         | 2           | ROBO, PROG                |
| 🏢 XYZ Okulu         | 1           | SANAT                     |
```

### Bir Kurumun Gördüğü Tüm Dersleri Kontrol Et:
```sql
SELECT *
FROM ea_dersler
WHERE organization_id IS NULL 
   OR organization_id = 'KURUM_ID'
ORDER BY sira_no;
```

---

## 📊 VERİTABANI BOYUTU KARŞILAŞTIRMA

### Eski Sistem (Organization-Specific):
```
100 Kurum x 23 Ders = 2,300 kayıt
1000 Kurum x 23 Ders = 23,000 kayıt ❌
```

### Yeni Sistem (Global Pool):
```
1 Global Pool x 23 Ders = 23 kayıt
+ Kuruma özel dersler (ortalama 2-3 ders/kurum)

100 Kurum: 23 + (100 x 2) = 223 kayıt ✅
1000 Kurum: 23 + (1000 x 2) = 2,023 kayıt ✅

%90 daha az kayıt!
```

---

## 🎯 MİGRATİON SIRASI (GÜNCELLENMİŞ)

```
1. 20260118_cleanup_old_exam_tables.sql
2. 20260118_ea_001_base_tables.sql
3. 20260118_ea_002_rls_policies.sql
4. 20260118_ea_003_indexes.sql
5. 20260118_ea_004_triggers.sql
6. 20260118_ea_005_wizard_updates.sql
7. 20260118_ea_006_kazanim_tables.sql
8. 20260118_ea_007_sinav_tipi_constraint.sql
9. 20260118_ea_008_seed_dersler.sql [ESKİ - ATLAYAB İLİRSİNİZ]
10. 20260118_ea_009_seed_dersler_all_orgs.sql [ESKİ - ATLAYAB İLİRSİNİZ]
11. 20260118_ea_010_comprehensive_courses.sql [ESKİ - ATLAYAB İLİRSİNİZ]
12. 20260118_ea_011_global_course_pool.sql ⭐ YENİ - BUNU ÇALIŞTIRIN!
```

---

## ✅ BAŞARI KRİTERLERİ

- [ ] Migration 011 çalıştı
- [ ] Global derslerde organization_id = NULL
- [ ] API Global + Kuruma özel dersleri getiriyor
- [ ] Yeni kurum eklenince otomatik 23 ders kullanılabilir
- [ ] Kuruma özel ders eklenebiliyor
- [ ] Duplike kontrolü çalışıyor (Kuruma özel öncelikli)

---

## 🎉 SONUÇ

### Öncesi:
```
❌ Her kurum için 23 ders ekle
❌ 100 kurum = 2,300 kayıt
❌ Güncelleme zor
❌ Senkronizasyon sorunu
```

### Sonrası:
```
✅ Tek seferlik 23 ders tanımı
✅ 100 kurum = 223 kayıt (%90 azalma)
✅ Merkezi güncelleme
✅ Kuruma özel ders esnekliği
✅ Otomatik yeni kurum desteği
✅ Scalable (1000+ kurum)
```

**Commit:** İkinci commit'te gelecek  
**Dosyalar:**
- `20260118_ea_011_global_course_pool.sql`
- `app/api/admin/exam-analytics/dersler/route.ts`
