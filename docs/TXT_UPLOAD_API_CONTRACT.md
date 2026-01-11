# TXT Upload API Refactor - Contract Safety

## 📋 Özet

TXT/DAT parse işlemi **optical-parser contract**'ını kullanıyor ve **primitive-safe response** dönüyor.

---

## ✅ Yeni API Endpoint

**Endpoint:** `POST /api/spectra/parse-txt`

### Request Body
```typescript
{
  rawText: string;           // TXT/DAT dosya içeriği
  optikSablon: OptikFormSablonu; // Optik şablon tanımı
}
```

### Response (Success)
```typescript
{
  success: true,
  data: {
    basarili: boolean,
    dosyaAdi: string | null,
    sablonAdi: string,
    toplamSatir: number,
    basariliSatir: number,
    hataliSatir: number,
    uyariSatir: number,
    
    stats: {
      toplam: number,
      basarili: number,
      eksikVeri: number,
      gecersizSatir: number
    } | null,
    
    satirlar: Array<{
      satirNo: number,
      rawData: string,           // ✅ String
      kurumKodu: string,          // ✅ String (boş olabilir)
      ogrenciNo: string,          // ✅ String (boş olabilir)
      ogrenciAdi: string,         // ✅ String (boş olabilir)
      tcKimlik: string,           // ✅ String (boş olabilir)
      sinif: string,              // ✅ String (boş olabilir)
      kitapcik: string,           // ✅ String ('A','B','C','D')
      cinsiyet: string | null,    // ✅ String veya null
      cevaplar: Array<string | null>, // ✅ Array<string | null>
      hatalar: string[],          // ✅ Array<string>
      eslesmeDurumu: string,      // ✅ String
      eslesmiStudentId: string | null,
      eslesmiStudentAdi: string | null,
      status: string,             // ✅ 'ok' | 'eksik_veri' | 'gecersiz_satir'
      durumEtiketi: string | null
    }>,
    
    hatalar: string[],            // ✅ Array<string>
    uyarilar: string[],           // ✅ Array<string>
    parseBaslangic: string,       // ✅ ISO timestamp
    parseBitis: string,           // ✅ ISO timestamp
    sureMilisaniye: number
  }
}
```

### Response (Error)
```typescript
{
  success: false,
  message: string
}
```

---

## 🛡️ Contract Garantileri

### 1. **Sadece Primitive + Array**
- ✅ No Supabase raw response
- ✅ No complex objects
- ✅ No undefined (her alan tanımlı)
- ✅ Tüm string alanlar `String()` ile normalize edilir

### 2. **UI Render-Safe**
- ✅ `ogrenciNo`: string (boş olabilir ama her zaman string)
- ✅ `ogrenciAdi`: string (boş olabilir ama her zaman string)
- ✅ `cevaplar`: `Array<string | null>` (asla undefined)
- ✅ `hatalar`: `string[]` (OptikHata → string mesaj)

### 3. **Parser Contract Uyumlu**
- ✅ `parseOptikData` kullanır
- ✅ Optical parser contract'ındaki tüm garantiler geçerli
- ✅ `stats.toplam`, `stats.basarili`, `stats.eksikVeri`, `stats.gecersizSatir`

---

## 🔄 Mevcut Akış

### Client-Side Parse (Şu Anki)
```
User → TXT dosyası seç
  → Step4VeriYukle.tsx
    → parseOptikData(text, sablon)  // ✅ Client-side
      → setParseResult(result)
        → onChange({ parseResult })  // State'e kaydet
          → Wizard Submit
            → POST /api/spectra/wizard
```

### Server-Side Parse (Yeni - Opsiyonel)
```
User → TXT dosyası seç
  → Step4VeriYukle.tsx
    → POST /api/spectra/parse-txt { rawText, optikSablon }
      → parseOptikData(text, sablon)  // ✅ Server-side
        → Primitive-safe response
          → setParseResult(result)
            → onChange({ parseResult })
              → Wizard Submit
                → POST /api/spectra/wizard
```

---

## 📝 Transformation Logic

### OptikHata → string
```typescript
satir.hatalar.map(h => 
  typeof h === 'string' ? h : (h.mesaj || 'Bilinmeyen hata')
)
```

### Null-safe String Conversion
```typescript
ogrenciNo: String(satir.ogrenciNo || ''),  // '' fallback
ogrenciAdi: String(satir.ogrenciAdi || ''),
kurumKodu: String(satir.kurumKodu || ''),
```

### Array Safety
```typescript
cevaplar: satir.cevaplar.map(c => (c ? String(c) : null))
// Çıktı: ['A', 'B', null, 'C', ...] (asla undefined)
```

---

## ✅ Avantajlar

1. **Contract Consistency**: Client ve server aynı parser'ı kullanıyor
2. **Type Safety**: Response primitive-only, TypeScript uyumlu
3. **UI Safety**: React render error (Minified Error #31) riski yok
4. **Testing**: Server-side parse edilebilir, test edilebilir
5. **Flexibility**: Client-side hızlı, server-side güvenli (ikisi de kullanılabilir)

---

## 📌 Notlar

- ✅ Client-side parse korundu (mevcut akış bozulmadı)
- ✅ Yeni API opsiyonel (istenirse kullanılabilir)
- ✅ Optik parser contract tamamen uyumlu
- ✅ Response primitive + array only
- ✅ UI render-safe garantili

---

**Tarih:** 2026-01-08  
**Endpoint:** `/api/spectra/parse-txt`  
**Status:** ✅ TAMAMLANDI
