# 🔁 Replay Engine

**Puanın nasıl hesaplandığını adım adım yeniden oynatır (deterministic)**

## 🎯 Amaç

Replay Engine, bir öğrencinin puanının **NASIL, HANGİ VERİYLE, HANGİ MOTORLA** hesaplandığını %100 doğrulukla yeniden oynatabilen deterministik bir sistemdir.

Bu sistem:
- ✅ Hukuki itirazlarda
- ✅ Kurumsal denetimlerde  
- ✅ Öğretmen/veli sorgularında

**Tek gerçek açıklama kaynağı** olarak kullanılır.

---

## 🔒 Temel Prensipler

1. **Replay Engine YENİ BİR HESAPLAMA YAPMAZ**
2. Sadece `scoring_snapshot` + `scoreExam()` kullanarak sonucu **YENİDEN ÜRETİR**
3. Replay sonucu ile DB'deki sonuç **%100 birebir** çıkmalıdır
4. Fark varsa → `INCONSISTENT` durumu raporlanır

---

## 📦 Modül Yapısı

```
lib/replay-engine/
├── index.ts              # Public API
├── replayEngine.ts       # Core replay logic
├── replayTypes.ts        # Type definitions
├── replayErrors.ts       # Custom errors
└── README.md            # Bu dosya
```

---

## 🔄 Replay Akışı

```
1. exam_results kaydını al
   ↓
2. scoring_snapshot var mı kontrol et
   ↓
3. snapshot.input_payload → ScoringInput
   ↓
4. scoreExam(scoringInput) çalıştır
   ↓
5. replayedResult ile DB sonucu karşılaştır
   ↓
6. Fark varsa: status = "INCONSISTENT"
   Aynıysa: status = "OK"
```

---

## 🧩 Kullanım

### TypeScript Kullanımı

```typescript
import { replayScore } from '@/lib/replay-engine';
import type { ExamResultRow } from '@/lib/replay-engine';

// exam_results kaydı
const result: ExamResultRow = await supabase
  .from('exam_results')
  .select('*')
  .eq('id', resultId)
  .single();

// Replay çalıştır
const replayResult = replayScore(result, {
  includeSteps: true,      // Adım adım detay
  validateVersion: false,  // Version kontrolü
});

// Sonuç kontrol
if (replayResult.status === 'OK') {
  console.log('✅ Replay başarılı, sonuçlar %100 eşleşiyor');
} else if (replayResult.status === 'INCONSISTENT') {
  console.error('❌ Tutarsızlık tespit edildi');
  console.log(replayResult.diff);
}
```

### API Kullanımı

```bash
# Replay çalıştır
GET /api/spectra/exams/{examId}/results/{resultId}/replay

# Query params (opsiyonel)
?include_steps=true       # Adım detayları dahil et
&validate_version=true    # Engine version kontrolü yap
```

**Response:**

```json
{
  "success": true,
  "replay": {
    "status": "OK",
    "message": "Replay başarılı, sonuçlar %100 eşleşiyor",
    "original": {
      "total_correct": 75,
      "total_wrong": 10,
      "total_empty": 5,
      "total_net": 72.5,
      "total_score": 362.5
    },
    "replayed": {
      "total_correct": 75,
      "total_wrong": 10,
      "total_empty": 5,
      "total_net": 72.5,
      "total_score": 362.5
    },
    "steps": [
      {
        "step": 1,
        "name": "SNAPSHOT_LOAD",
        "description": "Scoring snapshot yüklendi",
        "timestamp": "2026-01-15T...",
        "duration_ms": 2
      },
      ...
    ],
    "metadata": {
      "engine_version": "1.0",
      "preset": "LGS",
      "booklet": "A",
      "calculated_at": "2026-01-15T10:30:00Z",
      "replayed_at": "2026-01-15T14:20:00Z"
    }
  },
  "processing_time_ms": 45
}
```

**Tutarsızlık Durumu:**

```json
{
  "success": true,
  "replay": {
    "status": "INCONSISTENT",
    "message": "Replay sonucu DB ile uyuşmuyor (2 fark)",
    "diff": {
      "hasDifference": true,
      "fields": [
        {
          "field": "total_net",
          "original": 72.5,
          "replayed": 70.0,
          "difference": -2.5,
          "percentDiff": 3.45
        },
        {
          "field": "total_score",
          "original": 362.5,
          "replayed": 350.0,
          "difference": -12.5,
          "percentDiff": 3.45
        }
      ],
      "summary": "2 alanda tutarsızlık tespit edildi"
    }
  }
}
```

---

## 🚨 Hata Durumları

### 1. Snapshot Eksik

```json
{
  "success": false,
  "error": "SNAPSHOT_MISSING",
  "message": "Bu sonuç için scoring snapshot bulunamadı. Replay yapılamaz."
}
```

**Sebep:** Eski sistem ile hesaplanmış sonuçlarda `scoring_snapshot` yok.

**Çözüm:** Sonucu yeniden hesaplat (optical upload veya manuel recalculation).

### 2. Engine Version Uyumsuzluğu

```json
{
  "success": false,
  "error": "VERSION_MISMATCH",
  "message": "Engine version uyuşmazlığı tespit edildi.",
  "detail": "beklenen=1.0, bulunan=0.9"
}
```

**Sebep:** Snapshot farklı engine versiyonu ile oluşturulmuş.

**Çözüm:** `validate_version=false` ile replay çalıştır (uyarı ile devam eder).

### 3. Geçersiz Snapshot

```json
{
  "success": false,
  "error": "INVALID_SNAPSHOT",
  "message": "Snapshot formatı geçersiz.",
  "detail": "input_payload eksik"
}
```

**Sebep:** Snapshot yapısı bozuk veya eksik.

**Çözüm:** Sonucu yeniden hesaplat.

---

## 📊 Snapshot Yapısı

Replay Engine, `exam_results.scoring_snapshot` alanını kullanır:

```typescript
interface ScoringSnapshot {
  engine_version: string;          // "1.0"
  preset: string;                  // "LGS" | "TYT" | "AYT"
  booklet?: string | null;         // "A" | "B" | "C" | "D"
  input_payload: WizardPayload;    // Hesaplama için kullanılan input
  output_result: ScoringResult;    // Hesaplama sonucu
  calculated_at: string;           // ISO timestamp
}
```

**Önemli:** Bu snapshot **immutable**'dır (değiştirilemez). Sonuç değişirse yeni snapshot oluşturulur.

---

## 🧾 Audit Log

Her replay çalıştırıldığında `exam_audit_log` tablosuna kayıt atılır:

```sql
INSERT INTO exam_audit_log (
  action,
  entity_type,
  entity_id,
  exam_id,
  student_id,
  description,
  metadata
) VALUES (
  'RECALC',
  'exam_result',
  '<result_id>',
  '<exam_id>',
  '<student_id>',
  'Replay executed: OK',
  '{
    "status": "OK",
    "engine_version": "1.0",
    "preset": "LGS",
    "hasDiff": false,
    "processing_time_ms": 45
  }'
);
```

---

## ✅ Kabul Kriterleri

- [x] Aynı snapshot → aynı sonuç (deterministic)
- [x] Replay sadece OKUR ve KARŞILAŞTIRIR (UPSERT YOK)
- [x] Fark varsa net diff gösteriliyor
- [x] Replay sonucu UI'da gösterilebilir formatta
- [x] Hukuki açıklama üretilebilir
- [x] Audit log entegrasyonu

---

## 🎯 Gelecek Adımlar

Bu Replay Engine üzerine kurulabilecek modüller:

1. **Audit Dashboard**
   - Tüm replay loglarını görselleştir
   - Tutarsızlık raporları
   - Sistem sağlık metrikleri

2. **İtiraz Modülü**
   - Öğrenci/veli itiraz formu
   - Replay sonucunu otomatik ekle
   - Hukuki rapor üret

3. **Batch Replay**
   - Tüm sonuçları toplu kontrol et
   - Migrasyon sonrası doğrulama
   - Data integrity check

---

## 📚 İlgili Modüller

- **Scoring Engine:** `lib/scoring-engine/`
- **Audit Log:** `lib/audit/examAudit.ts`
- **Optical Upload:** `app/api/spectra/exams/[examId]/optical/upload/`

---

## 🔒 Güvenlik Notu

Replay Engine **READ-ONLY** bir sistemdir:
- ❌ DB'ye yazma yapmaz
- ❌ Sonuçları değiştirmez
- ❌ Snapshot'ı modifiye etmez
- ✅ Sadece okur ve karşılaştırır

---

**Son Güncelleme:** 2026-01-15  
**Engine Version:** 1.0
