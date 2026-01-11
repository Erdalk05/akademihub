# Optical Parser Output Contract

`optical-parser.ts` fonksiyonlarının dönüş yapıları ve contract tanımları.

## 📦 Ana Fonksiyon: `parseOptikData`

### İmza
```typescript
parseOptikData(rawText: string, sablon: OptikFormSablonu): OptikParseResult
```

### Dönüş Tipi: `OptikParseResult`

```typescript
interface OptikParseResult {
  basarili: boolean;              // Hiç hata olmadan parse edildi mi?
  dosyaAdi?: string;              // (opsiyonel) Kaynak dosya adı
  sablonAdi: string;              // Kullanılan şablon adı
  toplamSatir: number;            // Parse edilen toplam satır sayısı
  basariliSatir: number;          // Hatasız parse edilen satır sayısı
  hataliSatir: number;            // Hatayla parse edilen satır sayısı
  uyariSatir: number;             // Uyarı içeren satır sayısı
  satirlar: ParsedOptikSatir[];   // Parse edilmiş satırlar
  hatalar: OptikHata[];           // Kritik hatalar (error)
  uyarilar: OptikHata[];          // Uyarılar (warning/info)
  parseBaslangic: string;         // ISO timestamp (başlangıç)
  parseBitis: string;             // ISO timestamp (bitiş)
  sureMilisaniye: number;         // Parse süresi (ms)
  stats?: {                       // ✨ YENİ: Detaylı istatistikler
    toplam: number;               // Toplam satır (= toplamSatir)
    basarili: number;             // Başarılı satır (= basariliSatir)
    eksikVeri: number;            // Eksik alan içeren satır sayısı
    gecersizSatir: number;        // Geçersiz uzunluk/format satır sayısı
  };
}
```

---

## 📝 Satır Tipi: `ParsedOptikSatir`

Her bir parse edilmiş öğrenci satırını temsil eder.

```typescript
interface ParsedOptikSatir {
  satirNo: number;                // Satır numarası (1-indexed)
  rawData: string;                // Ham TXT satırı
  kurumKodu?: string;             // Kurum kodu (opsiyonel)
  ogrenciNo: string;              // Öğrenci numarası (ZORUNLU, boş string güvenli)
  ogrenciAdi: string;             // Öğrenci adı (ZORUNLU, boş string güvenli)
  tcKimlik?: string;              // TC Kimlik no (opsiyonel)
  sinif?: string;                 // Sınıf (opsiyonel)
  kitapcik: KitapcikTuru;         // Kitapçık türü ('A' | 'B' | 'C' | 'D')
  cinsiyet?: Cinsiyet;            // Cinsiyet ('E' | 'K', opsiyonel)
  cevaplar: CevapSecenegi[];      // Cevap dizisi (null = boş cevap)
  hatalar: (string | OptikHata)[]; // Satır içi hatalar/uyarılar
  eslesmeDurumu: EslesmeDurumu;   // 'pending' | 'matched' | 'conflict' | 'error'
  
  // ✨ YENİ: Durum işaretleri
  status?: 'ok' | 'eksik_veri' | 'gecersiz_satir';
  durumEtiketi?: string;          // Kullanıcı dostu etiket ('Eksik Veri', 'Geçersiz Satır')
}
```

### ⚠️ Önemli Garantiler

1. **String Alanlar Asla `undefined` veya `null` Değil**
   - `ogrenciNo` ve `ogrenciAdi` her zaman `string` tipindedir
   - Boş bile olsa `""` (empty string) döner
   - React'ta güvenle render edilebilir

2. **Cevaplar Dizisi Her Zaman Tam Uzunlukta**
   - `cevaplar.length === sablon.toplamSoru`
   - Boş cevaplar `null` olarak temsil edilir
   - Hiçbir durumda `undefined` içermez

3. **Status Enum Değerleri**
   - `'ok'`: Satır başarıyla parse edildi, tüm zorunlu alanlar var
   - `'eksik_veri'`: Öğrenci no veya adı eksik
   - `'gecersiz_satir'`: Satır uzunluğu şablonla uyuşmuyor

---

## 📊 Stats Objesi Detayları

### `stats.toplam`
- **Tip:** `number`
- **Tanım:** Parse edilen toplam satır sayısı
- **Garanti:** `>= 0`

### `stats.basarili`
- **Tip:** `number`
- **Tanım:** Hatasız parse edilen satır sayısı
- **İçerir:** `status === 'ok'` satırları
- **Garanti:** `<= stats.toplam`

### `stats.eksikVeri`
- **Tip:** `number`
- **Tanım:** Zorunlu alan eksik satır sayısı
- **İçerir:** `status === 'eksik_veri'` satırları
- **Garanti:** `<= stats.toplam`

### `stats.gecersizSatir`
- **Tip:** `number`
- **Tanım:** Satır uzunluğu uyuşmayan satır sayısı
- **İçerir:** `status === 'gecersiz_satir'` satırları
- **Garanti:** `<= stats.toplam`

### Toplam İlişkisi
```typescript
stats.basarili + stats.eksikVeri + stats.gecersizSatir <= stats.toplam
```
(Bazı satırlar hem eksik veri hem uyarı içerebilir, bu yüzden tam eşitlik garantisi yok)

---

## 🛡️ Hata Güvenliği (Defensive Parsing)

### 1. Satır Uzunluğu Mismatch
```typescript
if (line.length !== sablon.satirUzunlugu) {
  // Placeholder oluştur
  return {
    satirNo,
    rawData: line,
    ogrenciNo: '',           // ✅ Boş string
    ogrenciAdi: '',          // ✅ Boş string
    kitapcik: 'A',           // ✅ Default değer
    cevaplar: Array(sablon.toplamSoru).fill(null), // ✅ Tam uzunlukta
    status: 'gecersiz_satir',
    durumEtiketi: 'Geçersiz Satır',
  };
}
```

### 2. Eksik Zorunlu Alan
```typescript
if (!ogrenciNo || !ogrenciAdi) {
  // Normal parse yap ama işaretle
  return {
    ...parsedData,
    status: 'eksik_veri',
    durumEtiketi: 'Eksik Veri',
  };
}
```

### 3. Encoding Problemleri
```typescript
// Tüm string değerler sanitize edilir
const sanitizeFieldValue = (value: string): string =>
  String(value || '')
    .normalize('NFKD')                          // Unicode normalizasyon
    .replace(/[^\x20-\x7EğüşöçıİĞÜŞÖÇ]/g, '')  // İzinli karakterler
    .trim();                                     // Boşluk temizleme
```

---

## 🧪 Örnek Kullanım

```typescript
import { parseOptikData } from '@/lib/spectra-wizard/optical-parser';

const result = parseOptikData(rawText, sablon);

// Durum kontrolü
if (result.basarili) {
  console.log('Tüm satırlar başarıyla parse edildi');
} else {
  console.log(`${result.hataliSatir} hatalı satır var`);
}

// Stats kullanımı
const { toplam, basarili, eksikVeri, gecersizSatir } = result.stats!;
console.log(`
  Toplam: ${toplam}
  Başarılı: ${basarili}
  Eksik Veri: ${eksikVeri}
  Geçersiz: ${gecersizSatir}
`);

// Satır bazlı işleme
result.satirlar.forEach(satir => {
  if (satir.status === 'ok') {
    // Güvenle işle
    console.log(`${satir.ogrenciNo} - ${satir.ogrenciAdi}`);
  } else if (satir.status === 'eksik_veri') {
    // Kullanıcıya göster
    console.warn(`Satır ${satir.satirNo}: ${satir.durumEtiketi}`);
  }
});
```

---

## ✅ Contract Garantileri

1. **`parseOptikData` asla exception fırlatmaz**  
   Tüm hatalar `OptikParseResult.hatalar` içinde döner.

2. **`ParsedOptikSatir` her zaman render-safe**  
   Hiçbir alan `undefined`, `object` veya `number` olmaz (React child error #31 önlenir).

3. **`stats` objesi her zaman tanımlıdır**  
   `stats?.` yerine doğrudan `stats.toplam` kullanılabilir.

4. **Placeholder satırlar tam yapılandırılmıştır**  
   Geçersiz satırlar bile `cevaplar` dizisi ve tüm alanları içerir.

5. **String sanitizasyon deterministik**  
   Aynı girdi her zaman aynı çıktıyı üretir.

---

## 📚 İlgili Tipler

### `CevapSecenegi`
```typescript
type CevapSecenegi = 'A' | 'B' | 'C' | 'D' | 'E' | null;
```

### `KitapcikTuru`
```typescript
type KitapcikTuru = 'A' | 'B' | 'C' | 'D';
```

### `Cinsiyet`
```typescript
type Cinsiyet = 'E' | 'K';
```

### `EslesmeDurumu`
```typescript
type EslesmeDurumu = 'pending' | 'matched' | 'conflict' | 'error';
```

---

**Son Güncelleme:** 2026-01-08  
**Versiyon:** 2.1 (Hardening Release)
