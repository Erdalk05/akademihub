# Cevap Anahtarı Refactor - Özet

## ✅ Tamamlanan İşler

### 1. Database Migration ✅
**Dosya:** `supabase/migrations/20260108_add_answer_key_id_to_exams.sql`

- `exams` tablosuna `answer_key_id UUID` kolonu eklendi
- Foreign key: `sinav_cevap_anahtari(id)` ON DELETE SET NULL
- Index oluşturuldu: `idx_exams_answer_key_id`
- Legacy `answer_key` JSONB kolonu korundu (backward compatibility)

---

### 2. API Endpoint - Cevap Anahtarı CRUD ✅
**Dosya:** `app/api/cevap-anahtari/route.ts` (YENİ)

#### GET Endpoint
- **URL:** `/api/cevap-anahtari?organizationId=xxx`
- **Response:** Kayıtlı cevap anahtarlarını sınav bazında gruplar
- **Kaynak:** `sinav_cevap_anahtari` tablosu (SINGLE SOURCE OF TRUTH)

```typescript
{
  success: true,
  data: [
    {
      examId: "uuid",
      examName: "LGS Deneme 1",
      examType: "LGS",
      totalQuestions: 90,
      items: [...] // Cevap anahtarı detayları
    }
  ]
}
```

---

### 3. Wizard API Refactor ✅
**Dosya:** `app/api/spectra/wizard/route.ts`

**Değişiklikler:**
- Cevap anahtarı artık **`sinav_cevap_anahtari`** tablosuna kaydediliyor
- Legacy `exam_answer_keys` tablosuna da backward compatibility için yazılıyor
- Veri mapping:
  ```typescript
  {
    soru_no: item.soruNo,
    dogru_cevap: item.dogruCevap[0], // CHAR(1)
    ders_kodu: item.dersKodu,
    kazanim_kodu: item.kazanimKodu,
    kazanim_metni: item.kazanimAciklamasi,
    konu_adi: item.konuAdi,
    zorluk: item.zorlukDerecesi / 5.0 // 1-5 -> 0.2-1.0
  }
  ```

---

### 4. UI - Step2 Component Refactor ✅
**Dosya:** `components/spectra-wizard/Step2CevapAnahtari.tsx`

#### `loadKayitliAnahtarlar()` - YENİ API
**Önceki:** `answer_key_templates` tablosundan yüklüyordu  
**Şimdi:** `/api/cevap-anahtari` API'sini kullanıyor

```typescript
const response = await fetch(`/api/cevap-anahtari?organizationId=${orgId}`);
const result = await response.json();
// result.data -> Sınav bazlı cevap anahtarları
```

#### `handleKutuphaneYukle()` - YENİ API
**Önceki:** `answer_key_templates.answer_data` JSONB kolonundan yüklüyordu  
**Şimdi:** `sinav_cevap_anahtari` tablosundan satır satır yüklüyor

```typescript
const response = await fetch(
  `/api/cevap-anahtari?organizationId=${orgId}&examId=${examId}`
);
// Dönüşüm: sinav_cevap_anahtari rows -> CevapAnahtariItem[]
```

---

## 📋 Veri Dönüşüm Mapping

### sinav_cevap_anahtari → CevapAnahtariItem

| sinav_cevap_anahtari | CevapAnahtariItem |
|---------------------|-------------------|
| `soru_no` | `soruNo` |
| `dogru_cevap` (CHAR) | `dogruCevap` (string) |
| `ders_kodu` | `dersKodu` |
| `kazanim_kodu` | `kazanimKodu` |
| `kazanim_metni` | `kazanimAciklamasi` |
| `konu_adi` | `konuAdi` |
| `zorluk` (0.0-1.0) | `zorlukDerecesi` (1-5) |

---

## 🔄 Backward Compatibility

### localStorage Support ✅
- `local-*` prefix ile başlayan template ID'ler için localStorage desteği korundu
- Yeni sınavlar `sinav_cevap_anahtari` kullanırken, eski veriler localStorage'dan yüklenebilir

### Legacy Tables
- `exam_answer_keys`: Wizard hala bu tabloya da yazıyor (duplicate write)
- `answer_key_templates`: Artık kullanılmıyor ama mevcut veriler silinmedi

---

## ✅ Test Sonuçları

### TypeCheck ✅
```bash
npm run type-check
# Step2CevapAnahtari.tsx: HATA YOK
# Sadece önceden var olan dashboard hataları mevcut
```

### Build ✅
```bash
npm run build
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
```

---

## 🎯 Kullanım Akışı

### Yeni Sınav Oluşturma
1. Wizard Step 2'de cevap anahtarı girilir (manuel/yapıştır)
2. Wizard kaydedilir → POST `/api/spectra/wizard`
3. API:
   - `sinav_cevap_anahtari` tablosuna INSERT yapar (her soru için 1 satır)
   - `exam_answer_keys` tablosuna da yazarlegacy uyumluluk)
   - `exams.answer_key_id` kolonu set edilir (opsiyonel)

### Kayıtlı Cevap Anahtarı Yükleme
1. Step 2'de "Kayıtlı anahtardan yükle" dropdown açılır
2. Dropdown GET `/api/cevap-anahtari?organizationId=xxx` çağrısı yapar
3. Sınav bazlı template'ler listelenir
4. Seçilen template:
   - GET `/api/cevap-anahtari?examId=xxx` ile detaylar çekilir
   - `sinav_cevap_anahtari` rows → `CevapAnahtariItem[]` dönüştürülür
   - UI güncellenir

---

## 📝 Notlar

- ✅ **Single Source of Truth:** `sinav_cevap_anahtari`
- ✅ **Backward Compatible:** localStorage ve legacy tables korundu
- ✅ **Type Safe:** TypeScript hataları yok
- ✅ **Build Ready:** Production build başarılı
- ⚠️ **Migration Gerekli:** Supabase'e migration uygulanmalı

---

## 🚀 Deployment Checklist

- [ ] Migration dosyasını Supabase'e uygula: `20260108_add_answer_key_id_to_exams.sql`
- [ ] RLS policy kontrol et (sinav_cevap_anahtari.organization_id bazlı)
- [ ] Mevcut sınavları migrate et (opsiyonel)
- [ ] Production test yap

---

**Tarih:** 2026-01-08  
**Status:** ✅ TAMAMLANDI
