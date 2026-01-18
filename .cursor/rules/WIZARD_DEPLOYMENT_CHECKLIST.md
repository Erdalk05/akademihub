# 🚀 Wizard Deployment Checklist

## Supabase Migration Sırası (8 dosya)

Aşağıdaki migration'ları **sırasıyla** Supabase Dashboard > SQL Editor'de çalıştırın:

```
1. ✅ 20260118_cleanup_old_exam_tables.sql
   └─ Eski tabloları temizle

2. ✅ 20260118_ea_001_base_tables.sql
   └─ 8 temel tablo oluştur

3. ✅ 20260118_ea_002_rls_policies.sql
   └─ RLS policy'leri ekle

4. ✅ 20260118_ea_003_indexes.sql
   └─ Index'leri oluştur

5. ✅ 20260118_ea_004_triggers.sql
   └─ Trigger'ları ekle

6. ✅ 20260118_ea_005_wizard_updates.sql
   └─ Wizard için eksik tablolar ve alanlar

7. ✅ 20260118_ea_006_kazanim_tables.sql
   └─ Kazanım + Log tabloları

8. ✅ 20260118_ea_007_sinav_tipi_constraint.sql
   └─ sinav_tipi constraint güncelle

9. ✅ 20260118_ea_008_seed_dersler.sql
   └─ Varsayılan ders tanımları (TUR, MAT, FEN, SOS, INK, DIN, ING)
```

---

## Veritabanı Yapısı (15 Tablo)

| Tablo | Açıklama | Migration |
|-------|----------|-----------|
| `ea_dersler` | Ders tanımları | 001 |
| `ea_sinavlar` | Sınav tanımları | 001 |
| `ea_sinav_dersler` | Sınav-Ders ilişkisi | 001 |
| `ea_cevap_anahtarlari` | Cevap anahtarları | 001 |
| `ea_katilimcilar` | Katılımcılar (asıl/misafir) | 001 |
| `ea_katilimci_cevaplar` | Katılımcı cevapları | 001 |
| `ea_sonuclar` | Genel sonuçlar | 001 |
| `ea_ders_sonuclari` | Ders bazlı sonuçlar | 001 |
| `ea_ham_yuklemeler` | TXT dosya arşivi | 005 |
| `ea_soru_kazanimlari` | Soru-Kazanım eşleşmesi | 005 |
| `ea_optik_sablonlar` | Optik şablon tanımları | 005 |
| `ea_cevap_anahtar_sablonlari` | Cevap anahtarı şablonları | 005 |
| `ea_kazanimlar` | MEB kazanımları | 006 |
| `ea_kazanim_sonuclari` | Kazanım sonuçları | 006 |
| `ea_degisiklik_loglari` | Audit log | 006 |

---

## API Endpoints (6 Route)

| Endpoint | Method | Wizard Adımı | Dosya |
|----------|--------|--------------|-------|
| `/api/admin/exam-analytics/dersler` | GET/POST | - | `dersler/route.ts` |
| `/api/admin/exam-analytics/exams` | GET/POST | Step 1 | `exams/route.ts` |
| `/api/admin/exam-analytics/exams/[id]` | GET/PATCH/DELETE | Step 3 | `exams/[id]/route.ts` |
| `/api/admin/exam-analytics/exams/[id]/answer-key` | GET/POST | Step 2 | `exams/[id]/answer-key/route.ts` |
| `/api/admin/exam-analytics/exams/[id]/participants` | GET/POST | Step 4 | `exams/[id]/participants/route.ts` |
| `/api/admin/exam-analytics/exams/[id]/publish` | POST | Step 5 | `exams/[id]/publish/route.ts` |

---

## Wizard Sayfaları (7 Component)

| Component | Dosya | Açıklama |
|-----------|-------|----------|
| Ana Sayfa | `app/(dashboard)/admin/exam-analytics/create/page.tsx` | Wizard orchestrator |
| WizardHeader | `components/wizard/WizardHeader.tsx` | Adım göstergesi |
| Step1 | `components/wizard/Step1SinavBilgileri.tsx` | Sınav bilgileri formu |
| Step2 | `components/wizard/Step2CevapAnahtari.tsx` | Cevap anahtarı editörü |
| Step3 | `components/wizard/Step3OptikSablon.tsx` | Optik şablon seçimi |
| Step4 | `components/wizard/Step4VeriYukle.tsx` | TXT yükleme ve parse |
| Step5 | `components/wizard/Step5Onizleme.tsx` | Önizleme ve yayınlama |

---

## Hook & Types

| Dosya | Açıklama |
|-------|----------|
| `hooks/useExamWizard.ts` | Wizard state yönetimi (580 satır) |
| `types/exam-analytics/index.ts` | TypeScript tip tanımları (428 satır) |

---

## Test Senaryosu

### 1. Sınav Oluştur (Step 1)
- [ ] LGS sınavı seç → Varsayılan dersler yükleniyor mu?
- [ ] Ders ekle/sil → Step2 senkronize oluyor mu?
- [ ] Toplam soru sayısı doğru hesaplanıyor mu?
- [ ] API'ye kayıt başarılı mı? (sinavId alınıyor mu?)

### 2. Cevap Anahtarı (Step 2)
- [ ] Tek seferde yapıştır çalışıyor mu?
- [ ] Ders bazlı cevap girişi çalışıyor mu?
- [ ] Progress doğru gösteriliyor mu?
- [ ] API'ye kayıt başarılı mı?

### 3. Optik Şablon (Step 3)
- [ ] Şablon seçimi çalışıyor mu?
- [ ] Şablonsuz devam seçeneği çalışıyor mu?
- [ ] API'ye kayıt başarılı mı?

### 4. Veri Yükle (Step 4)
- [ ] TXT dosya yükleme çalışıyor mu?
- [ ] Parse işlemi doğru mu?
- [ ] Öğrenci eşleştirme çalışıyor mu?
- [ ] Asıl/Misafir ayırımı doğru mu?
- [ ] API'ye kayıt başarılı mı?

### 5. Yayınla (Step 5)
- [ ] Kontrol listesi doğru mu?
- [ ] Sınav özeti doğru mu?
- [ ] Hesaplama ve yayınlama çalışıyor mu?
- [ ] Sonuçlar doğru hesaplanıyor mu?

---

## Bilinen Sorunlar ve Çözümler

### ❌ Sorun: Varsayılan dersler dersId olmadan oluşuyor
**Çözüm:** `ea_dersler` tablosuna seed data eklendi (migration 008)

### ❌ Sorun: Step2 senkronu bozuluyor
**Çözüm:** `useExamWizard.ts` düzeltildi, ders ekle/sil/güncelle sonrası Step2 otomatik güncelleniyor

### ❌ Sorun: Mezun (0) sınıf seviyesi null oluyor
**Çözüm:** API'de `sinifSeviyesi ?? null` yerine `sinifSeviyesi !== undefined ? sinifSeviyesi : null`

### ❌ Sorun: sinav_tipi constraint eksik
**Çözüm:** Migration 007 eklendi, `kurum_deneme`, `konu_testi`, `yazili` eklendi

### ❌ Sorun: Yanlış katsayısı 0 ise UI'da 1/Infinity
**Çözüm:** UI'de `yanlisKatsayi === 0 ? 'Yok' : '1/X'`

---

## Deployment Adımları

1. **Supabase Migration'ları Uygula**
   ```bash
   # Sırasıyla 001-008 migration'ları çalıştır
   ```

2. **Vercel Deploy**
   ```bash
   git push origin main
   # Otomatik deploy tetiklenir
   ```

3. **İlk Test**
   - `/admin/exam-analytics` → Dashboard açılıyor mu?
   - `/admin/exam-analytics/create` → Wizard açılıyor mu?
   - Step 1'de dersler yükleniyor mu?

4. **Seed Data Kontrol**
   ```sql
   SELECT * FROM ea_dersler ORDER BY sira_no;
   -- 7 ders görünmeli: TUR, MAT, FEN, SOS, INK, DIN, ING
   ```

---

## Sonraki Adımlar (FAZ 6+)

- [ ] Sınav listesi sayfası (`/admin/exam-analytics/sinavlar`)
- [ ] Sınav detay sayfası (`/admin/exam-analytics/sinavlar/[id]`)
- [ ] Öğrenci performans sayfası
- [ ] Karne sayfası
- [ ] Raporlar (PDF/Excel)
- [ ] AI analiz ve öneriler

---

**Commit:** `aec196d`  
**Son Güncelleme:** 2026-01-18  
**Durum:** ✅ Hazır (Migration + API + UI)
