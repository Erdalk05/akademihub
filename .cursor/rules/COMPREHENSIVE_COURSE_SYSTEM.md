# 🎓 KAPSAMLI DERS SİSTEMİ - DEPLOYMENT REHBERİ

## 📋 ÖZETİ

Artık sisteminizde **23 ders** ve **sınıf bazlı filtreleme** var!

---

## 🗂️ SUPABASE'DE ÇALIŞTIRMANIZ GEREKEN DOSYA

### ⭐ YENİ MİGRATİON (ÖNEMLİ!)

```
📄 20260118_ea_010_comprehensive_courses.sql
```

**Bu dosya:**
- 23 ders tanımı ekler
- Tüm organizasyonlar için çalışır
- Eski 7 dersi günceller
- Yeni 16 ders ekler

---

## 📊 EKLENECEк 23 DERS

### İlköğretim Dersleri (7 ders)
| Kod | Ders Adı | Kategori | Renk | Açıklama |
|-----|----------|----------|------|----------|
| TUR | Türkçe | Sözel | 🔴 | Tüm sınıflar |
| MAT | Matematik | Sayısal | 🔵 | Tüm sınıflar |
| FEN | Fen Bilimleri | Sayısal | 🟢 | 4-8. sınıflar |
| SOS | Sosyal Bilimler | Sözel | 🟠 | 4-7. sınıflar + TYT |
| INK | T.C. İnkılap Tarihi | Sözel | 🟣 | 8. sınıf + LGS |
| DIN | Din Kültürü | Sözel | 🔷 | 4-8. sınıflar |
| ING | İngilizce | Dil | 🟡 | Tüm sınıflar |

### Lise Ortak Dersleri (7 ders)
| Kod | Ders Adı | Kategori | Renk | Açıklama |
|-----|----------|----------|------|----------|
| FIZ | Fizik | Sayısal | 🔵 | 9-12. sınıflar + AYT |
| KIM | Kimya | Sayısal | 🟢 | 9-12. sınıflar + AYT |
| BIY | Biyoloji | Sayısal | 🟢 | 9-12. sınıflar + AYT |
| TAR | Tarih | Sözel | 🟠 | 9-12. sınıflar + AYT |
| COG | Coğrafya | Sözel | 🟡 | 9-12. sınıflar + AYT |
| FEL | Felsefe | Sözel | 🟣 | 10-12. sınıflar + AYT |
| EDB | Edebiyat | Sözel | 🔴 | 9-12. sınıflar + AYT |

### AYT Detay Dersleri (4 ders)
| Kod | Ders Adı | Kategori | Renk | Açıklama |
|-----|----------|----------|------|----------|
| TAR1 | Tarih-1 | Sözel | 🟠 | AYT Sözel - İlkçağ-Ortaçağ |
| TAR2 | Tarih-2 | Sözel | 🟠 | AYT Sözel - Yakınçağ-Günümüz |
| COG1 | Coğrafya-1 | Sözel | 🟡 | AYT Sözel - Fiziki Coğrafya |
| COG2 | Coğrafya-2 | Sözel | 🟡 | AYT Sözel - Beşeri Coğrafya |

### Dil Dersleri (5 ders - İNG dahil)
| Kod | Ders Adı | Kategori | Renk | Açıklama |
|-----|----------|----------|------|----------|
| ING | İngilizce | Dil | 🟡 | Tüm sınıflar |
| ALM | Almanca | Dil | 🟡 | Lise + AYT Dil |
| FRA | Fransızca | Dil | 🔵 | Lise + AYT Dil |
| ARB | Arapça | Dil | 🟢 | Lise + AYT Dil |

**TOPLAM: 23 DERS**

---

## 🎯 SINIF BAZLI DERS SİSTEMİ

### 4. Sınıf
**Zorunlu:** TUR, MAT, FEN, SOS, DIN, ING (6 ders)  
**Seçmeli:** Yok

### 5. Sınıf
**Zorunlu:** TUR, MAT, FEN, SOS, DIN, ING (6 ders)  
**Seçmeli:** Yok

### 6. Sınıf
**Zorunlu:** TUR, MAT, FEN, SOS, DIN, ING (6 ders)  
**Seçmeli:** Yok

### 7. Sınıf
**Zorunlu:** TUR, MAT, FEN, SOS, DIN, ING (6 ders)  
**Seçmeli:** Yok

### 8. Sınıf (LGS)
**Zorunlu:** TUR, MAT, FEN, INK, DIN, ING (6 ders)  
**Seçmeli:** SOS (Opsiyonel)

### 9. Sınıf
**Zorunlu:** TUR, MAT, FIZ, KIM, BIY, TAR, COG, EDB, ING (9 ders)  
**Seçmeli:** DIN, ALM, FRA, ARB (4 ders)

### 10. Sınıf
**Zorunlu:** TUR, MAT, FIZ, KIM, BIY, TAR, COG, FEL, EDB, ING (10 ders)  
**Seçmeli:** DIN, ALM, FRA, ARB (4 ders)

### 11. Sınıf
**Zorunlu:** TUR, MAT, ING (3 ders)  
**Seçmeli:** FIZ, KIM, BIY, TAR, COG, FEL, EDB, DIN, ALM, FRA, ARB, TAR1, TAR2, COG1, COG2 (15 ders)

### 12. Sınıf (TYT/AYT)
**Zorunlu:** TUR, MAT (2 ders)  
**Seçmeli:** FIZ, KIM, BIY, TAR, COG, FEL, EDB, DIN, ING, ALM, FRA, ARB, TAR1, TAR2, COG1, COG2, SOS, FEN (18 ders)

### Mezun
**Zorunlu:** Yok  
**Seçmeli:** TÜM 23 DERS

---

## 🚀 DEPLOYMENT ADIMLARI

### 1️⃣ Supabase Dashboard'a Giriş Yapın
- https://supabase.com/dashboard
- Projenizi seçin

### 2️⃣ SQL Editor'ü Açın
- Sol menüden **SQL Editor** seçin
- **New Query** butonuna tıklayın

### 3️⃣ Migration Dosyasını Kopyalayın
```sql
-- 20260118_ea_010_comprehensive_courses.sql dosyasının tamamını kopyalayın
```

### 4️⃣ Çalıştırın
- **Run** butonuna tıklayın
- Tüm organization'lar için dersler eklenecek

### 5️⃣ Sonuçları Kontrol Edin

**Beklenen Çıktı:**
```
Dersler eklendi: <org_id> - Toplam: 23 ders
```

**Rapor Tablosu:**
| organization_name | toplam_ders | sayisal_dersler | sozel_dersler | dil_dersleri |
|-------------------|-------------|-----------------|---------------|--------------|
| Dikmen Çözüm Kurs | 23          | 5               | 14            | 4            |

---

## ✅ DOĞRULAMA

### Kontrol SQL'i:
```sql
SELECT 
  ders_kodu,
  ders_adi,
  ders_kategori,
  aciklama
FROM ea_dersler
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY sira_no;
```

**Beklenen:** 23 satır

---

## 🎨 KULLANICI ARAYÜZÜNDE DEĞİŞİKLİKLER

### 1. Sınıf Seçimi
- 4-12 butonları + Mezun butonu
- Sınıf seçilince → O sınıfa uygun dersler gösterilir

### 2. Ders Ekleme Modalı
```
Ders Ekle
12 ders eklenebilir (8. Sınıf için)

┌─────────────────────────────────┐
│ 🔴 Türkçe          [Zorunlu]    │
│    TUR • Tüm sınıflar           │
├─────────────────────────────────┤
│ 🔵 Matematik       [Zorunlu]    │
│    MAT • Tüm sınıflar           │
├─────────────────────────────────┤
│ 🟠 Sosyal Bilimler              │
│    SOS • 4-7. sınıflar + TYT    │
└─────────────────────────────────┘
```

### 3. Zorunlu/Seçmeli Badge
- **Zorunlu:** Mavi badge
- **Seçmeli:** Badge yok

### 4. Başarı Mesajı
```
✅ Tüm dersler başarıyla yüklendi! (6 ders)
Sistemde 23 ders var, 8. Sınıf için 6 tanesi kullanılıyor
```

---

## 📝 ÖRNEKLER

### Örnek 1: LGS Sınavı (8. Sınıf)
1. Sınav türü: **LGS** seç
2. Sınıf: **8. Sınıf** seç
3. Otomatik gelen dersler: TUR, INK, DIN, ING, MAT, FEN (6 ders)
4. "Ders Ekle" tıkla → Sadece **SOS** görünür (opsiyonel)

### Örnek 2: TYT Sınavı (12. Sınıf)
1. Sınav türü: **TYT** seç
2. Sınıf: **12. Sınıf** seç
3. Otomatik gelen dersler: TUR, SOS, MAT, FEN (4 ders)
4. "Ders Ekle" tıkla → 18 ders daha eklenebilir

### Örnek 3: Konu Testi (9. Sınıf - Fizik)
1. Sınav türü: **Konu Testi** seç
2. Sınıf: **9. Sınıf** seç
3. Otomatik ders yok
4. "Ders Ekle" tıkla → 9 zorunlu + 4 seçmeli = 13 ders görünür
5. **FIZ** seç → Sadece Fizik dersi eklenir

---

## 🔧 TEKNİK DETAYLAR

### Filtreleme Mantığı:
```typescript
// 1. Zaten eklenmişleri çıkar
// 2. LGS için SOS'u çıkar
// 3. Sınıf seviyesine göre filtrele

if (step1.sinifSeviyesi === 8) {
  eklenebilirDersler = ['TUR', 'MAT', 'FEN', 'INK', 'DIN', 'ING', 'SOS']
}
```

### Zorunlu Kontrol:
```typescript
isDersZorunlu('TUR', 8) → true
isDersZorunlu('SOS', 8) → false
```

---

## 📞 SORUN GİDERME

### Sorun 1: "Sistemde 7 ders görünüyor"
**Çözüm:** Migration 010'u çalıştırın → 23 ders olacak

### Sorun 2: "Sınıf seçince ders gelmiyor"
**Çözüm:** Sayfayı yenileyin (F5)

### Sorun 3: "Tüm dersler gözüküyor"
**Çözüm:** Sınıf seç butonu → Sınıfı seçin → Dersler filtrelenecek

---

## ✅ BAŞARI KRİTERLERİ

- [ ] Supabase'de 23 ders var
- [ ] 8. Sınıf seçildiğinde 6 ders görünüyor (+ SOS opsiyonel)
- [ ] 12. Sınıf seçildiğinde 20 ders görünüyor
- [ ] Mezun seçildiğinde 23 ders görünüyor
- [ ] Zorunlu dersler "Zorunlu" badge ile işaretli
- [ ] Ders açıklamaları görünüyor

---

## 🎉 SONUÇ

Artık sisteminizde:
- ✅ 23 profesyonel ders tanımı
- ✅ Sınıf bazlı akıllı filtreleme
- ✅ Zorunlu/seçmeli ders sistemi
- ✅ Detaylı açıklamalar
- ✅ Renk kodları
- ✅ Kategori bazlı raporlama

**Commit:** `5208953`  
**Dosya:** `20260118_ea_010_comprehensive_courses.sql`
