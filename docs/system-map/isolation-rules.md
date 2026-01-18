# AkademiHub Modüller Arası İzolasyon Kuralları
**Tarih:** 2026-01-18  
**Versiyon:** 1.0  
**Amaç:** Anayasa uyumlu modül sınırlarını tanımlamak

---

## 1. TEMEL PRENSİPLER

### 1.1 Altın Kural
```
Bir modül, başka bir modülün tablosuna KESİNLİKLE YAZAMAZ.
```

### 1.2 Okuma İzinleri
```
Okuma serbesttir, ancak RLS kurallarına tabidir.
```

### 1.3 Prefix Zorunluluğu
```
Her modül kendi prefix'i ile tablo oluşturur.
Prefix kullanmayan tablolar CORE sistem tablosudur.
```

---

## 2. MODÜL TANIMLARI

### 2.1 CORE SYSTEM
**Prefix:** Yok  
**Tablolar:** `users`, `students`, `organizations`, `academic_years`  
**Sahiplik:** Platform

**Kurallar:**
- ✅ Tüm modüller okuyabilir
- ❌ Sadece platform core'u yazabilir
- ⚠️ Özel exception: `students` tablosuna sadece Öğrenci Yönetimi modülü yazar

---

### 2.2 FİNANS MODÜLÜ
**Prefix:** `finance_`  
**Tablolar:** `finance_installments`, `finance_payments`, `finance_expenses`, `finance_sales`, vb.  
**Sahiplik:** Finans Modülü

**Kurallar:**
- ✅ Finans modülü **SADECE** `finance_*` tablolarına yazar
- ✅ `students` tablosunu okuyabilir (öğrenci eşleştirme için)
- ❌ `students` tablosuna **ASLA** yazamaz
- ❌ Otomatik öğrenci oluşturma YASAK
- ✅ organization_id zorunlu

**Örnekler:**
```sql
-- ✅ İZİN VERİLEN: Ödeme kaydı
INSERT INTO finance_payments (student_id, amount, ...)
SELECT id, 1000, ...
FROM students
WHERE student_no = '2024001';

-- ❌ YASAK: Öğrenci oluşturma
INSERT INTO students (student_no, class, ...) 
VALUES ('2024999', '9-A', ...);
```

---

### 2.3 EXAM ANALYTICS MODÜLÜ (YENİ)
**Prefix:** `ea_` (Exam Analytics) veya `optik_`  
**Tablolar:** `ea_sinavlar`, `ea_katilimcilar`, `ea_sonuclar`, `optik_sablonlar`  
**Sahiplik:** Exam Analytics Modülü

**Kurallar:**
- ✅ Exam Analytics **SADECE** `ea_*` ve `optik_*` tablolarına yazar
- ✅ `students` tablosunu okuyabilir (eşleştirme için)
- ❌ `students` tablosuna **ASLA** yazamaz
- ❌ Otomatik öğrenci oluşturma YASAK
- ❌ `finance_*` tablolarına **ASLA** dokunmaz
- ✅ organization_id + academic_year_id zorunlu

**READ-ONLY Tablolar:**
- ✅ `students` (SELECT only)
- ✅ `organizations` (SELECT only)
- ✅ `academic_years` (SELECT only)

**Örnekler:**
```sql
-- ✅ İZİN VERİLEN: Sınav katılımcısı ekleme
INSERT INTO ea_katilimcilar (sinav_id, student_id, ...)
SELECT 'uuid-123', id, ...
FROM students
WHERE student_no = '2024001';

-- ❌ YASAK: Otomatik öğrenci oluşturma
INSERT INTO students (student_no, class, ...)
SELECT DISTINCT ogrenci_adi, sinif, ...
FROM optik_okuma_gecici;

-- ❌ YASAK: Finans tablosuna yazma
INSERT INTO finance_payments (...) VALUES (...);
```

---

## 3. TABLO OKUMA/YAZMA MATRİSİ

### Core Tablolar

| Tablo | Core | Finans | Exam Analytics | Açıklama |
|-------|------|--------|----------------|----------|
| `users` | RW | R | R | Kullanıcı yönetimi |
| `students` | RW | R | R | **Sadece Core/Öğrenci modülü yazar** |
| `organizations` | RW | R | R | Multi-tenant |
| `academic_years` | RW | R | R | Akademik dönem |

**R** = Read (Okuma)  
**W** = Write (Yazma)  
**RW** = Read + Write

---

### Finans Tabloları

| Tablo | Core | Finans | Exam Analytics | Açıklama |
|-------|------|--------|----------------|----------|
| `finance_installments` | R | RW | - | Taksitler |
| `finance_payments` | R | RW | - | Ödemeler |
| `finance_expenses` | R | RW | - | Giderler |
| `finance_sales` | R | RW | - | Satışlar |

**-** = Hiçbir erişim yok

---

### Exam Analytics Tabloları

| Tablo | Core | Finans | Exam Analytics | Açıklama |
|-------|------|--------|----------------|----------|
| `ea_sinavlar` | R | - | RW | Sınav tanımları |
| `ea_katilimcilar` | R | - | RW | Sınav katılımcıları |
| `ea_sonuclar` | R | - | RW | Sınav sonuçları |
| `optik_sablonlar` | R | - | RW | Optik form şablonları |

---

## 4. API ENDPOINT İZOLASYONU

### 4.1 Finans API
**Base:** `/api/finance/*`

**İzin verilen:**
- ✅ `SELECT` from `students`
- ✅ `INSERT/UPDATE/DELETE` on `finance_*`
- ✅ RPC calls to `finance_*` functions

**Yasak:**
- ❌ `INSERT/UPDATE/DELETE` on `students`
- ❌ Any operation on `ea_*` or `optik_*`

---

### 4.2 Exam Analytics API
**Base:** `/api/exam-analytics/*`

**İzin verilen:**
- ✅ `SELECT` from `students`, `organizations`, `academic_years`
- ✅ `INSERT/UPDATE/DELETE` on `ea_*` ve `optik_*`
- ✅ RPC calls to `ea_*` functions

**Yasak:**
- ❌ `INSERT/UPDATE/DELETE` on `students`
- ❌ Any operation on `finance_*`
- ❌ Automatic student creation

---

## 5. ÖĞRENCİ EŞLEŞTİRME PROTOKOLÜ

### 5.1 Problem
Optik formlardan gelen öğrenci isimleri sistemdeki öğrencilerle eşleştirilmeli.

### 5.2 YANLIŞ Yaklaşım (YASAK)
```sql
-- ❌ ASLA BÖYLE YAPMA
INSERT INTO students (student_no, first_name, ...)
SELECT DISTINCT ogrenci_no, ad, ...
FROM optik_okuma_gecici
WHERE NOT EXISTS (
  SELECT 1 FROM students WHERE student_no = optik_okuma_gecici.ogrenci_no
);
```

### 5.3 DOĞRU Yaklaşım
```sql
-- ✅ 1. Eşleşen öğrencileri bul
SELECT 
  o.ogrenci_adi,
  o.ogrenci_no,
  s.id as student_id,
  CASE 
    WHEN s.id IS NULL THEN 'MİSAFİR'
    ELSE 'ASİL'
  END as durum
FROM optik_okuma_gecici o
LEFT JOIN students s ON s.student_no = o.ogrenci_no
  AND s.organization_id = current_setting('app.organization_id')::uuid;

-- ✅ 2. Sadece eşleşenleri kaydet
INSERT INTO ea_katilimcilar (sinav_id, student_id, katilimci_adi, durum, ...)
SELECT 
  'sinav-uuid',
  s.id,
  o.ogrenci_adi,
  'asil',
  ...
FROM optik_okuma_gecici o
INNER JOIN students s ON s.student_no = o.ogrenci_no
WHERE s.organization_id = current_setting('app.organization_id')::uuid;

-- ✅ 3. Eşleşmeyenleri misafir olarak kaydet (student_id = NULL)
INSERT INTO ea_katilimcilar (sinav_id, student_id, katilimci_adi, durum, ...)
SELECT 
  'sinav-uuid',
  NULL, -- misafir öğrenci
  o.ogrenci_adi,
  'misafir',
  ...
FROM optik_okuma_gecici o
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.student_no = o.ogrenci_no 
    AND s.organization_id = current_setting('app.organization_id')::uuid
);
```

**Mantık:**
1. ✅ Eşleşen → `student_id` dolu, `durum = 'asil'`
2. ✅ Eşleşmeyen → `student_id = NULL`, `durum = 'misafir'`
3. ❌ Otomatik öğrenci oluşturma YOK

---

## 6. MULTI-TENANT İZOLASYON

### 6.1 RLS Policy Şablonu
**Her tablo için zorunlu:**

```sql
-- SELECT policy
CREATE POLICY "org_isolation_select" ON table_name
  FOR SELECT
  USING (organization_id = current_setting('app.organization_id')::uuid);

-- INSERT policy
CREATE POLICY "org_isolation_insert" ON table_name
  FOR INSERT
  WITH CHECK (organization_id = current_setting('app.organization_id')::uuid);

-- UPDATE policy
CREATE POLICY "org_isolation_update" ON table_name
  FOR UPDATE
  USING (organization_id = current_setting('app.organization_id')::uuid)
  WITH CHECK (organization_id = current_setting('app.organization_id')::uuid);

-- DELETE policy
CREATE POLICY "org_isolation_delete" ON table_name
  FOR DELETE
  USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 6.2 Connection String
API her request'te:
```typescript
const { data, error } = await supabaseClient
  .rpc('set_config', {
    setting: 'app.organization_id',
    value: currentOrganization.id
  })
  .then(() => supabaseClient.from('table_name').select());
```

---

## 7. CROSS-MODULE COMMUNICATION

### 7.1 İzin Verilen Yöntemler

#### A. View'lar
```sql
-- ✅ Read-only view ile veri paylaşımı
CREATE VIEW v_student_summary AS
SELECT 
  s.id,
  s.student_no,
  s.first_name,
  s.organization_id,
  COUNT(DISTINCT fp.id) as payment_count,
  COUNT(DISTINCT ek.id) as exam_count
FROM students s
LEFT JOIN finance_payments fp ON fp.student_id = s.id
LEFT JOIN ea_katilimcilar ek ON ek.student_id = s.id
GROUP BY s.id;
```

#### B. RPC Functions
```sql
-- ✅ Read-only RPC
CREATE OR REPLACE FUNCTION get_student_exam_stats(p_student_id UUID)
RETURNS TABLE (
  exam_count INT,
  avg_score NUMERIC,
  last_exam_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT,
    AVG(es.total_net),
    MAX(e.exam_date)::DATE
  FROM ea_sonuclar es
  JOIN ea_sinavlar e ON e.id = es.sinav_id
  WHERE es.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.2 YASAK Yöntemler

#### ❌ Trigger ile Cross-Module Write
```sql
-- ❌ ASLA BÖYLE YAPMA
CREATE TRIGGER auto_create_payment
AFTER INSERT ON ea_katilimcilar
FOR EACH ROW
EXECUTE FUNCTION create_exam_payment(); -- finance tablosuna yazıyor
```

#### ❌ Foreign Key Cross-Module
```sql
-- ❌ ASLA BÖYLE YAPMA
ALTER TABLE ea_katilimcilar
ADD CONSTRAINT fk_payment 
FOREIGN KEY (auto_payment_id) REFERENCES finance_payments(id);
```

---

## 8. HATA SENARYOLARI

### 8.1 Senaryo: Optik okumada yeni öğrenci
**Yanlış:**
```typescript
// ❌ Otomatik öğrenci oluştur
await supabase.from('students').insert({
  student_no: 'AUTO-2024-999',
  first_name: 'Ahmet',
  class: '9-A'
});
```

**Doğru:**
```typescript
// ✅ Misafir olarak işaretle
await supabase.from('ea_katilimcilar').insert({
  sinav_id: examId,
  student_id: null,       // ← NULL = misafir
  katilimci_adi: 'Ahmet Yılmaz',
  durum: 'misafir',
  eslesme_durumu: 'beklemede'
});

// ✅ Admin'e bildirim gönder
await notifyAdmin({
  message: '1 eşleşmemiş katılımcı var',
  action: 'Manuel eşleştirme yap'
});
```

### 8.2 Senaryo: Sınav ücreti tahsil edilecek
**Yanlış:**
```typescript
// ❌ Exam Analytics'ten ödeme oluştur
await supabase.from('finance_payments').insert({
  student_id: studentId,
  amount: 100,
  description: 'Sınav ücreti'
});
```

**Doğru:**
```typescript
// ✅ Finans API'sine istek gönder
await fetch('/api/finance/payments/create', {
  method: 'POST',
  body: JSON.stringify({
    student_id: studentId,
    amount: 100,
    description: 'Sınav ücreti - LGS Denemesi #1'
  })
});
```

---

## 9. EXCEPTION HANDLING

### 9.1 RLS Violation
```typescript
try {
  await supabase.from('students').insert({ ... });
} catch (error) {
  if (error.code === '42501') {
    // RLS policy ihlali
    console.error('İzolasyon ihlali: Students tablosuna yazma yasak');
  }
}
```

### 9.2 Foreign Key Violation
```typescript
try {
  await supabase.from('ea_katilimcilar').insert({
    student_id: 'non-existent-uuid',
    ...
  });
} catch (error) {
  if (error.code === '23503') {
    // Foreign key hatası
    console.error('Öğrenci bulunamadı');
  }
}
```

---

## 10. DENETİM (AUDIT)

### 10.1 İzolasyon İhlali Tespiti
```sql
-- Finans modülünden students tablosuna yazma var mı?
SELECT 
  schemaname,
  tablename,
  usename,
  query
FROM pg_stat_statements
WHERE query ILIKE '%INSERT INTO students%'
  AND query ILIKE '%finance%';
```

### 10.2 Otomatik Kontrol
```sql
-- Trigger ile izolasyon ihlalini engelle
CREATE OR REPLACE FUNCTION prevent_cross_module_write()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.current_module', true) != 'core' THEN
    RAISE EXCEPTION 'İzolasyon ihlali: Students tablosuna sadece Core modül yazabilir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_student_write
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION prevent_cross_module_write();
```

---

## 11. ÖZET - HIZLI REFERANS

### Exam Analytics için İzin Matrisi

| İşlem | students | finance_* | ea_* | optik_* |
|-------|----------|-----------|------|---------|
| SELECT | ✅ | ❌ | ✅ | ✅ |
| INSERT | ❌ | ❌ | ✅ | ✅ |
| UPDATE | ❌ | ❌ | ✅ | ✅ |
| DELETE | ❌ | ❌ | ✅ | ✅ |

### Temel Kurallar
1. ✅ **Kendi prefix'li tablolara** tam yetki
2. ✅ **Core tablolardan** okuma serbestisi
3. ❌ **Başka modül tablolarına** yazma YASAK
4. ❌ **Otomatik öğrenci oluşturma** YASAK
5. ✅ **Misafir sistemi** kullan
6. ✅ **organization_id** her zaman zorunlu
7. ✅ **RLS** her zaman aktif

---

**Doküman Sonu**  
*Bu kurallar Platform Anayasası'nın operasyonel uygulamasıdır.*
