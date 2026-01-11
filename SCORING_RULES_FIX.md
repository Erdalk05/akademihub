# ✅ SCORING RULES FIX - useScoringRules.ts

## 🎯 SORUN

Frontend `useScoringRules` hook'u, API'ye `organization_id` parametresini göndermiyordu.

**Sebep:**
- Hook, `organization-storage` key'inden (Zustand persist) `currentOrganization.id` okumaya çalışıyordu
- Ancak bu key ya yoktu ya da farklı formattaydı
- Sonuç: `organization_id` null oluyordu
- API 400 hatası dönüyordu
- Hook fallback'e düşüyordu

---

## ✅ ÇÖZÜM

Hook artık **doğrudan** `localStorage.getItem('current_organization_id')` kullanıyor.

### Değişiklikler

**lib/hooks/useScoringRules.ts - fetchRules fonksiyonu:**

#### ❌ ÖNCE (YANLIŞ)
```typescript
// Zustand persist formatından okumaya çalışıyordu
const stored = localStorage.getItem('organization-storage');
if (stored) {
  const parsed = JSON.parse(stored);
  organizationId = parsed?.state?.currentOrganization?.id || null;
}
```

#### ✅ SONRA (DOĞRU)
```typescript
// Doğrudan localStorage key'inden oku
organizationId = localStorage.getItem('current_organization_id');
```

---

## 📊 AKIŞ

### ÖNCEKİ AKIM (Fallback'e Düşüyordu)
```
1. Hook başlar
2. Zustand storage'dan okumaya çalışır
3. ❌ organizationId bulunamaz (yanlış key/format)
4. ❌ API'ye organization_id gönderilmez
5. ❌ API 400 döner ("organization_id required")
6. ❌ Hook fallback'e düşer
7. ❌ Hardcoded değerler kullanılır (LGS=3, TYT=4)
```

### YENİ AKIM (DB'den Yükleniyor)
```
1. Hook başlar
2. ✅ localStorage'dan 'current_organization_id' key'ini oku
3. ✅ API'ye organization_id parametresi gönder:
   GET /api/settings/scoring-rules?active=true&organization_id=xxx
4. ✅ API 200 + data döner (global + org kuralları)
5. ✅ rules state set edilir
6. ✅ Console: "[SCORING_RULES] ✅ DB'den 6 kural yüklendi (45ms)"
```

---

## 🔍 FALLBACK DURUMU

### Artık Fallback SADECE Şu Durumda Çalışır:

**API 200 döner AMA data.length === 0**

Yani:
- ✅ organization_id doğru gönderildi
- ✅ API başarılı çalıştı
- ✅ RLS izin verdi
- ❌ Ama kurum için hiç kural yok

Bu durumda:
```typescript
console.warn(`[SCORING_RULES] ⚠️  DB returned 0 rules - using fallback`);
setRules([]);  // Boş array
```

`getDefaultRuleWithFallback()` fonksiyonu tetiklendiğinde hardcoded değerleri kullanır.

---

## ⚠️ FALLBACK'E DÜŞMEME GEREKLİ ŞARTLAR

Hook'un fallback'e düşmemesi için:

1. ✅ `localStorage.setItem('current_organization_id', '<uuid>')` set edilmiş olmalı
2. ✅ Backend'de o organization için scoring_rules mevcut olmalı
3. ✅ RLS policies doğru yapılandırılmış olmalı (service_role bypass)

---

## 🧪 TEST NASIL YAPILIR

### 1. localStorage'ı Kontrol Et
```javascript
// Browser console'da:
console.log(localStorage.getItem('current_organization_id'));
// Beklenen: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (UUID)
```

### 2. API'yi Manuel Test Et
```bash
ORG_ID="<uuid-from-localStorage>"
curl "http://localhost:3000/api/settings/scoring-rules?active=true&organization_id=$ORG_ID" | jq
```

**Beklenen Response:**
```json
{
  "success": true,
  "data": [ ... 6+ rules ... ],
  "from_db": true,
  "duration_ms": 45
}
```

### 3. Frontend Console'u İzle
1. `/admin/spectra/sihirbaz` sayfasına git
2. Console'u aç (F12)
3. Şunu görmeli:

```
[SCORING_RULES] 📡 Fetching rules for org: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[SCORING_RULES] ✅ DB'den 6 kural yüklendi (123ms)
```

**GÖRMEMEK GEREKEN:**
```
❌ [SCORING_RULES] ❌ No organization_id
❌ [SCORING_RULES] ❌ API error (400)
❌ [SCORING_RULES] ⚠️  DB returned 0 rules - using fallback
```

---

## 📝 DEĞİŞEN DOSYALAR

### Değiştirilen Tek Dosya:
- ✅ `lib/hooks/useScoringRules.ts`

### Değişiklik Satırları:
- **69-82. satırlar** - organizationId alma mantığı basitleştirildi
- **53-56. satırlar** - Console log mesajları güncellendi

---

## 🎓 NEDEN ARTIK FALLBACK'E DÜŞMEYECEK

### Eski Sorun:
```typescript
// ❌ Karmaşık JSON parse + nested object access
const parsed = JSON.parse(localStorage.getItem('organization-storage'));
organizationId = parsed?.state?.currentOrganization?.id;
// Eğer format değişirse veya key yoksa → null
```

### Yeni Çözüm:
```typescript
// ✅ Basit, direkt key okuma
organizationId = localStorage.getItem('current_organization_id');
// Eğer key set edilmişse → UUID string
// Eğer key yoksa → null (ve hemen error fırlatılır, fallback'e düşmez)
```

**Kritik Fark:**
- **ÖNCE:** Sessizce fallback'e düşüyordu (organizationId null ama hata yok)
- **SONRA:** Eğer organizationId yoksa HEMEN error set ediyor (fallback'e düşmeden önce bloklıyor)

---

## ✅ DOĞRULAMA

Hook artık şu garantileri veriyor:

1. ✅ `current_organization_id` yoksa → ERROR göster, fallback'e düşme
2. ✅ API 400/500 dönerse → ERROR göster, fallback'e düşme  
3. ✅ API 200 + data.length > 0 → DB'den yüklendi LOG'u
4. ✅ API 200 + data.length === 0 → Fallback kullanılacak WARN'i

---

## 🚀 DEPLOYMENT

Değişiklik sadece frontend'de, hiçbir migration gerekmez.

1. ✅ Kod deploy et
2. ✅ localStorage'da `current_organization_id` key'inin set edildiğinden emin ol
3. ✅ Console loglarını izle
4. ✅ Step 1'de doğru yanlış katsayısı göründüğünü doğrula (LGS=3, TYT=4)

---

**STATUS:** ✅ Tamamlandı - Fallback artık sadece gerçek veri yokluğunda kullanılır.
