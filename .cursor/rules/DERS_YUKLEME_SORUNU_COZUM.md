# 🔍 DERS YÜKLEME SORUNU ÇÖZÜM REHBERİ

## ❌ Hata Mesajı
```
Sistemde kayıtlı ders bulunamadı!
Lütfen önce Supabase'de migration 008 (seed_dersler) dosyasını çalıştırın.
```

---

## 🎯 ADIM ADIM ÇÖZÜM

### 1️⃣ Supabase Dashboard'a Giriş Yap
- https://supabase.com/dashboard
- Projenizi seçin

### 2️⃣ SQL Editor'ü Aç
- Sol menüden **SQL Editor** seçin

### 3️⃣ İlk Önce Teşhis Yap
**DIAGNOSE_DERS_PROBLEM.sql** dosyasını çalıştır:

```sql
-- 1. Organizations tablosunu kontrol et
SELECT id, name, slug FROM organizations;

-- 2. ea_dersler tablosunu kontrol et
SELECT organization_id, ders_kodu, ders_adi FROM ea_dersler;

-- 3. Hangi organization'da kaç ders var?
SELECT 
  o.name,
  o.id,
  COUNT(d.id) as ders_sayisi
FROM organizations o
LEFT JOIN ea_dersler d ON d.organization_id = o.id
GROUP BY o.id, o.name;
```

**Beklenen Sonuç:**
```
| name                  | id                                   | ders_sayisi |
|-----------------------|--------------------------------------|-------------|
| Dikmen Çözüm Kurs     | abc123...                            | 6 (LGS)     |
```

**Not:** LGS için 6 ders, TYT/AYT için 7 ders (Sosyal Bilimler ekstra)

---

### 4️⃣ Eğer `ders_sayisi = 0` ise

#### Seçenek A: Migration 009 (TÜM Organizations için)
**Önerilen:** Bu tüm organization'lar için çalışır.

```sql
-- 20260118_ea_009_seed_dersler_all_orgs.sql dosyasını çalıştır
```

#### Seçenek B: Manuel Ekleme (Sadece sizin org için)
```sql
-- Önce organizationId'nizi bulun
SELECT id, name FROM organizations WHERE name = 'Dikmen Çözüm Kurs';

-- Sonra bu ID'yi kullanarak dersleri ekleyin
INSERT INTO ea_dersler (
  organization_id,
  ders_kodu,
  ders_adi,
  ders_kategori,
  renk_kodu,
  sira_no,
  max_soru_sayisi,
  min_soru_sayisi,
  is_active
) VALUES
  ('YOUR_ORG_ID_HERE', 'TUR', 'Türkçe', 'sozel', '#EF4444', 1, 40, 1, true),
  ('YOUR_ORG_ID_HERE', 'MAT', 'Matematik', 'sayisal', '#3B82F6', 2, 40, 1, true),
  ('YOUR_ORG_ID_HERE', 'FEN', 'Fen Bilimleri', 'sayisal', '#10B981', 3, 40, 1, true),
  ('YOUR_ORG_ID_HERE', 'INK', 'T.C. İnkılap Tarihi', 'sozel', '#8B5CF6', 4, 20, 1, true),
  ('YOUR_ORG_ID_HERE', 'DIN', 'Din Kültürü', 'sozel', '#06B6D4', 5, 20, 1, true),
  ('YOUR_ORG_ID_HERE', 'ING', 'İngilizce', 'sozel', '#EC4899', 6, 20, 1, true),
  -- TYT/AYT için ek ders (opsiyonel)
  ('YOUR_ORG_ID_HERE', 'SOS', 'Sosyal Bilimler', 'sozel', '#F59E0B', 7, 40, 1, true);
```

---

### 5️⃣ Kontrol Et
```sql
-- Derslerin eklendiğini kontrol et
SELECT 
  ders_kodu,
  ders_adi,
  sira_no,
  is_active
FROM ea_dersler
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY sira_no;
```

**Beklenen Sonuç:**
```
| ders_kodu | ders_adi          | sira_no | is_active |
|-----------|-------------------|---------|-----------|
| TUR       | Türkçe            | 1       | true      |
| MAT       | Matematik         | 2       | true      |
| FEN       | Fen Bilimleri     | 3       | true      |
| INK       | T.C. İnkılap...   | 4       | true      |
| DIN       | Din Kültürü       | 5       | true      |
| ING       | İngilizce         | 6       | true      |
| SOS       | Sosyal Bilimler   | 7       | true      | (TYT/AYT için)
```

**Not:** LGS sınavı için ilk 6 ders yeterlidir (SOS dersi LGS'de yoktur)

---

### 6️⃣ Sayfayı Yenile
- Tarayıcıda **F5** veya **Ctrl+R** / **Cmd+R**
- Veya sayfayı tamamen kapat ve tekrar aç

---

## 🔍 SORUN DEVAМ EDİYORSA

### Console Log Kontrolü
1. Tarayıcıda **F12** tuşuna basın
2. **Console** sekmesine geçin
3. Sayfayı yenileyin
4. Şu satırları arayın:

```javascript
// Başarılı:
[EA Dersler] GET success: 7 ders bulundu

// Başarısız:
[EA Dersler] GET error: ...
```

### Network Kontrolü
1. **F12** > **Network** sekmesi
2. Sayfayı yenileyin
3. `/api/admin/exam-analytics/dersler?organizationId=...` isteğini bulun
4. **Response** sekmesine bakın

**Başarılı Response:**
```json
{
  "data": [
    {
      "id": "...",
      "ders_kodu": "TUR",
      "ders_adi": "Türkçe",
      ...
    }
  ]
}
```

**Başarısız Response:**
```json
{
  "data": []
}
```

---

## 🚨 EN YAKIN SORUNLAR

### Sorun 1: `organizationId` Yanlış
**Belirtiler:** API çalışıyor ama `data: []` dönüyor

**Çözüm:**
```javascript
// localStorage'da kontrol et (F12 > Console)
localStorage.getItem('organizationId')

// Supabase'de kontrol et
SELECT id, name FROM organizations;
```

### Sorun 2: RLS Policy Sorunu
**Belirtiler:** API hata veriyor, "Row Level Security" mesajı

**Çözüm:**
```sql
-- ea_dersler için RLS'yi geçici olarak kapat (TEST AMAÇLI)
ALTER TABLE ea_dersler DISABLE ROW LEVEL SECURITY;

-- Sonra tekrar aç
ALTER TABLE ea_dersler ENABLE ROW LEVEL SECURITY;
```

### Sorun 3: Tablo Yok
**Belirtiler:** "relation ea_dersler does not exist"

**Çözüm:**
```sql
-- Migration 001'i çalıştırın
-- 20260118_ea_001_base_tables.sql
```

---

## ✅ BAŞARI KONTROL LİSTESİ

- [ ] Supabase'de `organizations` tablosu var
- [ ] Supabase'de `ea_dersler` tablosu var
- [ ] `ea_dersler` tablosunda 6-7 kayıt var (LGS için: TUR, MAT, FEN, INK, DIN, ING; TYT/AYT için +SOS)
- [ ] Kayıtların `organization_id` doğru
- [ ] Kayıtların `is_active = true`
- [ ] API `/api/admin/exam-analytics/dersler` çalışıyor
- [ ] API'nin döndüğü `data` array'i boş değil
- [ ] Sayfada "✅ Tüm dersler başarıyla yüklendi!" mesajı görünüyor

---

## 📞 YARDIM

Eğer hala sorun yaşıyorsanız:

1. **DIAGNOSE_DERS_PROBLEM.sql** sonuçlarını paylaşın
2. **Console** log'larını paylaşın
3. **Network** response'unu paylaşın

Bu bilgilerle tam olarak nerede takıldığınızı görebiliriz!
