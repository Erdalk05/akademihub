# Optical Parser Test Fixtures

Bu dizin, `optical-parser.ts` için test fixture dosyalarını içerir.

## Dosyalar

### 1. `clean.txt`
**Amaç:** Temiz, geçerli optik form verileri  
**İçerik:** 3 geçerli öğrenci satırı (100 karakter)  
**Beklenen sonuç:** 
- `stats.toplam: 3`
- `stats.basarili: 3`
- `stats.gecersizSatir: 0`
- `stats.eksikVeri: 0`

### 2. `too_short.txt`
**Amaç:** Beklenen uzunluktan kısa satırlar  
**İçerik:** 3 satır, her biri ~10 karakter (beklenen: 100)  
**Beklenen sonuç:**
- `stats.toplam: 3`
- `stats.gecersizSatir: 3`
- Her satır için `status: 'gecersiz_satir'`

### 3. `too_long.txt`
**Amaç:** Beklenen uzunluktan uzun satırlar  
**İçerik:** 3 satır, her biri ~150 karakter (beklenen: 100)  
**Beklenen sonuç:**
- `stats.toplam: 3`
- `stats.gecersizSatir: 3`
- Satırlar güvenli bir şekilde parse edilir

### 4. `missing_fields.txt`
**Amaç:** Zorunlu alanlar eksik  
**İçerik:**
- Satır 1: Öğrenci no eksik
- Satır 2: Öğrenci adı eksik
- Satır 3: Cevaplar eksik  
**Beklenen sonuç:**
- `stats.toplam: 3`
- `stats.eksikVeri: >=2`
- Eksik alanlı satırlar için `status: 'eksik_veri'`

### 5. `weird_unicode.txt`
**Amaç:** Unicode/encoding sorunları  
**İçerik:** Null byte, control char içeren satırlar  
**Beklenen sonuç:**
- Parser çökmez
- Tüm alanlar string olarak dolu
- Garbled karakterler temizlenir

### 6. `mixed_bad_lines.txt`
**Amaç:** Karışık geçerli/geçersiz satırlar  
**İçerik:**
- 1 geçerli
- 1 çok kısa
- 1 geçerli
- 1 boş
- 1 geçerli
- 1 çok uzun
- 1 eksik alan  
**Beklenen sonuç:**
- `stats.toplam: 7`
- `stats.basarili: >=3`
- `stats.gecersizSatir: >=2`
- `stats.eksikVeri: >=1`

## Kullanım

```typescript
import fs from 'fs';
import { parseOptikData } from '@/lib/spectra-wizard/optical-parser';

const fixture = fs.readFileSync('tests/fixtures/optical/clean.txt', 'utf-8');
const result = parseOptikData(fixture, mockSablon);
```
