# AkademiHub – Mega JSON Contract v1 (Akademik Analiz)

Bu doküman, AkademiHub akademik analiz ekranlarının tükettiği veriyi **tek bir sözleşmede** (contract) toplamak için hazırlanmıştır.

## Amaç

- UI katmanının **tek format** tüketmesi (legacy/new farkını API çözer)
- “Sessiz yanlış sonuç” riskini düşürmek
- AI/trend/anomali gibi gelecekteki modüllere hazır veri zemini kurmak

## Guard İlkesi (Bu Projeye Uygun)

### 🔴 Sert Guard (Dur / Sor)
Bu alanlarda **fallback / varsayım yasak**. Eksik veri varsa dur ve kullanıcıdan karar iste:

- Optik TXT parse
- Format tespiti (OPTIC_RAW vs REPORT_EXPORT)
- START tespiti / boş-separator ayrımı
- Cevap dizisi üretimi (answers[0]=1. soru)
- Ders slicing (Türkçe/Mat/Fen vs.)
- Booklet tespiti & answer key seçimi
- Net/puan hesaplama
- DB sonuç yazımı & overwrite
- Recalculate işlemleri

Log formatı:

`🛑 GUARD: [Alan] - [Sebep]`

### 🟢 Hafif Guard (Devam)
Analiz/görselleştirme katmanında hızlı ilerlenebilir:

- Dashboard UI, tablo/kart tasarımı
- Filtre/sıralama
- Grafikler
- Export (PDF/Excel)

## Contract Dosyası

- TypeScript: `types/akademik-analiz.contract.ts`
- Export: `types/index.ts`

## Mega JSON Contract v1 – Kapsam

Contract alanları 3 ana bölüme ayrılır:

1. `exam`: Sınav özeti + öğrenci sonuçları + ders ortalamaları
2. `meta.sources`: Hangi tablo/kaynaktan geldiğini şeffaf belirtir
3. `meta.warnings/guards`: Eksik/şüpheli veri veya guard tetiklenmelerini listeler

## Source of Truth Matrisi (v1)

| Alan | Source of Truth | Alternatif/Enrichment | Eksikse Ne Olur? | Guard? |
|---|---|---|---|---|
| `exam.*` | `exams` tablosu | — | **Dur** (sınav yoksa) | 🔴 |
| `ogrenciler[].ogrenciAdi` | `students.full_name` veya `students.first_name+last_name` | legacy `student_name` | “Bilinmeyen” gösterilebilir ama `warnings` yaz | 🟢 |
| `ogrenciler[].dersBazli` | `exam_student_results.subject_results` | `exam_student_analytics.subject_performance` veya legacy kolon algılama | Boş liste + `warnings` | 🟢 (analiz katmanı) |
| `ogrenciler[].veli/veliler` | `guardians` tablosu | `students.parent_name/parent_phone` | Boş ise “Veli bulunamadı” | 🟢 |
| `dersOrtalamalari` | `ogrenciler[].dersBazli` agregasyonu | — | Boş ise üst uyarı | 🟢 |

### Not
Analiz katmanında legacy veri göstermek için “enrichment” yapılabilir; ancak:
- `meta.sources.tables` ve `meta.sources.note` ile şeffaf yazılmalı
- Sessiz “puanlama/kitapçık/cevap anahtarı” fallback’i yapılmamalı (🔴 alan)

## API Entegrasyon Planı (Kademeli)

1) Mevcut endpoint’leri kırmadan kontratı projeye ekle (tamamlandı)  
2) `GET /api/akademik-analiz/exam-results` içine opsiyonel `contract=v1` ekle  
3) UI sayfaları kademeli olarak `AkademikAnalizContractV1` tüketmeye taşınır  
4) Trend/Kazanım/Soru analizleri için v1 üzerine `v1.1` genişletmesi yapılır (breaking değil)


