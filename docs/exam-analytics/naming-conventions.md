# Exam Analytics İsimlendirme Kuralları
**Tarih:** 2026-01-18  
**Versiyon:** 1.0  
**Amaç:** Tutarlı ve anlaşılır kod standartları

---

## 1. TABLO İSİMLERİ

### 1.1 Prefix Kuralı
**Zorunlu:** Tüm tablolar `ea_` veya `optik_` ile başlar

```sql
-- ✅ DOĞRU
CREATE TABLE ea_sinavlar (...);
CREATE TABLE ea_katilimcilar (...);
CREATE TABLE optik_sablonlar (...);

-- ❌ YANLIŞ
CREATE TABLE sinavlar (...);           -- prefix yok
CREATE TABLE exam_analytics_sinavlar (...); -- prefix çok uzun
```

### 1.2 Tablo İsimlendirme
**Format:** `{prefix}_{isim}_`çoğul_`

```sql
ea_sinavlar          -- ✅ Sınav tanımları
ea_katilimcilar      -- ✅ Sınav katılımcıları
ea_sonuclar          -- ✅ Sınav sonuçları
ea_cevap_anahtarlari -- ✅ Cevap anahtarları
ea_dersler           -- ✅ Ders tanımları

optik_sablonlar      -- ✅ Optik form şablonları
optik_okuma_gecici   -- ✅ Geçici okuma verileri
optik_log            -- ✅ Okuma logları
```

### 1.3 İlişki Tabloları
**Format:** `{prefix}_{tablo1}_{tablo2}`

```sql
ea_sinav_dersler     -- ✅ Sınav-ders ilişkisi
ea_katilimci_cevaplar -- ✅ Katılımcı cevapları
```

---

## 2. KOLON İSİMLERİ

### 2.1 Primary Key
**Zorunlu:** Her tablo `id UUID PRIMARY KEY`

```sql
CREATE TABLE ea_sinavlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ✅
  ...
);

-- ❌ YANLIŞ
sinav_id INT PRIMARY KEY AUTO_INCREMENT  -- INT yerine UUID
exam_id UUID PRIMARY KEY                 -- "id" yerine başka isim
```

### 2.2 Foreign Key
**Format:** `{tablo_adi}_id`

```sql
CREATE TABLE ea_katilimcilar (
  id UUID PRIMARY KEY,
  sinav_id UUID REFERENCES ea_sinavlar(id),      -- ✅
  student_id UUID REFERENCES students(id),       -- ✅
  organization_id UUID REFERENCES organizations(id), -- ✅
  ...
);
```

### 2.3 Multi-Tenant Kolonları
**Zorunlu:** Her tabloda

```sql
organization_id UUID NOT NULL REFERENCES organizations(id)  -- ✅ Zorunlu
academic_year_id UUID REFERENCES academic_years(id)         -- ✅ Opsiyonel ama önerilen
```

### 2.4 Timestamps
**Zorunlu:** Her tabloda

```sql
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL  -- ✅
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL  -- ✅

-- Opsiyonel (audit için)
created_by UUID REFERENCES users(id)
updated_by UUID REFERENCES users(id)
```

### 2.5 Boolean Kolonları
**Format:** `is_{durum}` veya `has_{ozellik}`

```sql
is_active BOOLEAN DEFAULT true          -- ✅
is_published BOOLEAN DEFAULT false      -- ✅
is_deleted BOOLEAN DEFAULT false        -- ✅ Soft delete
has_answer_key BOOLEAN DEFAULT false    -- ✅
```

### 2.6 Enum/Status Kolonları
**Format:** `{isim}` (TEXT type)

```sql
durum TEXT CHECK (durum IN ('tasla

k', 'aktif', 'tamamlandi', 'arsivlendi')) -- ✅
sinav_tipi TEXT CHECK (sinav_tipi IN ('lgs', 'tyt', 'ayt', 'deneme'))    -- ✅
katilimci_turu TEXT CHECK (katilimci_turu IN ('asil', 'misafir'))       -- ✅
```

### 2.7 JSON Kolonları
**Format:** `{isim}_json` veya `{isim}_data`

```sql
ayarlar JSONB DEFAULT '{}'::jsonb       -- ✅ Genel ayarlar
metadata JSONB                           -- ✅ Ekstra bilgiler
optik_data JSONB                         -- ✅ Optik okuma verisi
cevaplar JSONB                           -- ✅ Cevap verileri
```

---

## 3. INDEX İSİMLERİ

### 3.1 Format
**Format:** `idx_{tablo}_{kolon(lar)}`

```sql
CREATE INDEX idx_sinavlar_organization ON ea_sinavlar(organization_id);          -- ✅
CREATE INDEX idx_sinavlar_org_year ON ea_sinavlar(organization_id, academic_year_id); -- ✅
CREATE INDEX idx_katilimcilar_student ON ea_katilimcilar(student_id);           -- ✅
CREATE INDEX idx_sonuclar_sinav ON ea_sonuclar(sinav_id);                       -- ✅
```

### 3.2 Unique Index
**Format:** `unq_{tablo}_{kolon(lar)}`

```sql
CREATE UNIQUE INDEX unq_sinavlar_kod ON ea_sinavlar(sinav_kodu, organization_id); -- ✅
CREATE UNIQUE INDEX unq_katilimci_sinav ON ea_katilimcilar(sinav_id, student_id); -- ✅
```

---

## 4. CONSTRAINT İSİMLERİ

### 4.1 Foreign Key
**Format:** `fk_{tablo}_{ref_tablo}`

```sql
CONSTRAINT fk_katilimcilar_sinavlar 
  FOREIGN KEY (sinav_id) REFERENCES ea_sinavlar(id)  -- ✅

CONSTRAINT fk_katilimcilar_students 
  FOREIGN KEY (student_id) REFERENCES students(id)   -- ✅
```

### 4.2 Check Constraint
**Format:** `chk_{tablo}_{kolon}_{aciklama}`

```sql
CONSTRAINT chk_sinavlar_tarih 
  CHECK (exam_date >= created_at)  -- ✅

CONSTRAINT chk_sonuclar_dogru_pozitif 
  CHECK (dogru_sayisi >= 0)  -- ✅

CONSTRAINT chk_sonuclar_yanlis_pozitif 
  CHECK (yanlis_sayisi >= 0)  -- ✅
```

---

## 5. RLS POLICY İSİMLERİ

### 5.1 Format
**Format:** `{tablo}_{operation}_{aciklama}`

```sql
-- Organization izolasyonu
CREATE POLICY "sinavlar_select_org_isolation" ON ea_sinavlar
  FOR SELECT USING (organization_id = current_setting('app.organization_id')::uuid);

CREATE POLICY "sinavlar_insert_org_isolation" ON ea_sinavlar
  FOR INSERT WITH CHECK (organization_id = current_setting('app.organization_id')::uuid);

-- Rol bazlı
CREATE POLICY "sinavlar_insert_admin_only" ON ea_sinavlar
  FOR INSERT WITH CHECK (
    current_setting('app.user_role') IN ('admin', 'super_admin')
  );

CREATE POLICY "sonuclar_select_published_only" ON ea_sonuclar
  FOR SELECT USING (is_published = true OR created_by = current_setting('app.user_id')::uuid);
```

---

## 6. FUNCTION İSİMLERİ

### 6.1 RPC Functions
**Format:** `{prefix}_{isim}_`fiil_`

```sql
-- ✅ Veri getirme
CREATE FUNCTION ea_get_sinav_istatistikleri(p_sinav_id UUID) ...
CREATE FUNCTION ea_list_aktif_sinavlar(p_organization_id UUID) ...
CREATE FUNCTION optik_validate_form_data(p_data JSONB) ...

-- ✅ Veri işleme
CREATE FUNCTION ea_calculate_exam_results(p_sinav_id UUID) ...
CREATE FUNCTION ea_publish_exam(p_sinav_id UUID) ...
CREATE FUNCTION ea_match_participants() ...

-- ✅ Trigger functions
CREATE FUNCTION trg_ea_update_timestamp() ...
CREATE FUNCTION trg_ea_validate_before_insert() ...
```

### 6.2 Parametre İsimleri
**Format:** `p_{isim}` (procedure parameter)

```sql
CREATE FUNCTION ea_get_sinav_detay(
  p_sinav_id UUID,           -- ✅
  p_organization_id UUID,    -- ✅
  p_include_results BOOLEAN DEFAULT false  -- ✅
) RETURNS TABLE (...);
```

---

## 7. TRIGGER İSİMLERİ

### 7.1 Format
**Format:** `trg_{tablo}_{event}_{aciklama}`

```sql
-- ✅ Timestamp güncelleme
CREATE TRIGGER trg_sinavlar_update_timestamp
  BEFORE UPDATE ON ea_sinavlar
  FOR EACH ROW EXECUTE FUNCTION trg_ea_update_timestamp();

-- ✅ Validation
CREATE TRIGGER trg_sonuclar_validate_scores
  BEFORE INSERT OR UPDATE ON ea_sonuclar
  FOR EACH ROW EXECUTE FUNCTION trg_ea_validate_scores();

-- ✅ Audit
CREATE TRIGGER trg_sinavlar_audit
  AFTER INSERT OR UPDATE OR DELETE ON ea_sinavlar
  FOR EACH ROW EXECUTE FUNCTION trg_ea_audit_log();
```

---

## 8. VIEW İSİMLERİ

### 8.1 Format
**Format:** `v_{prefix}_{aciklama}`

```sql
-- ✅ Özet view'lar
CREATE VIEW v_ea_sinav_istatistikleri AS ...
CREATE VIEW v_ea_ogrenci_performans AS ...
CREATE VIEW v_ea_kurum_analiz AS ...

-- ✅ Denormalized view'lar
CREATE VIEW v_ea_sinav_detay_full AS ...
CREATE VIEW v_ea_katilimci_sonuclar AS ...
```

---

## 9. MIGRATION DOSYALARI

### 9.1 Format
**Format:** `YYYYMMDD_ea_NNN_aciklama.sql`

```sql
20260118_ea_001_base_tables.sql          -- ✅ Temel tablolar
20260118_ea_002_rls_policies.sql         -- ✅ Güvenlik
20260118_ea_003_indexes.sql              -- ✅ Performans
20260118_ea_004_functions.sql            -- ✅ RPC fonksiyonlar
20260118_ea_005_triggers.sql             -- ✅ Trigger'lar
20260118_ea_006_seed_data.sql            -- ✅ İlk veri

20260118_optik_001_templates.sql         -- ✅ Optik şablonlar
20260118_optik_002_rls_policies.sql      -- ✅ Optik güvenlik
```

### 9.2 İçerik Yapısı
```sql
-- =============================================
-- EXAM ANALYTICS - BASE TABLES
-- Migration: 20260118_ea_001_base_tables.sql
-- =============================================

-- 1. SINAVLAR TABLOSU
-- =============================================
DROP TABLE IF EXISTS ea_sinavlar CASCADE;

CREATE TABLE ea_sinavlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- Index'ler
CREATE INDEX idx_sinavlar_organization ON ea_sinavlar(organization_id);

-- RLS
ALTER TABLE ea_sinavlar ENABLE ROW LEVEL SECURITY;

-- Yorum
COMMENT ON TABLE ea_sinavlar IS 'Sınav tanımları - Exam Analytics modülü';
COMMENT ON COLUMN ea_sinavlar.sinav_tipi IS 'LGS, TYT, AYT, Deneme';
```

---

## 10. API ROUTE İSİMLERİ

### 10.1 Endpoint Yapısı
**Format:** `/api/exam-analytics/{resource}/{action}`

```typescript
// ✅ RESTful
GET    /api/exam-analytics/sinavlar           // Liste
GET    /api/exam-analytics/sinavlar/[id]      // Detay
POST   /api/exam-analytics/sinavlar           // Oluştur
PUT    /api/exam-analytics/sinavlar/[id]      // Güncelle
DELETE /api/exam-analytics/sinavlar/[id]      // Sil

// ✅ RPC-style actions
POST   /api/exam-analytics/sinavlar/[id]/publish       // Yayınla
POST   /api/exam-analytics/sinavlar/[id]/calculate     // Hesapla
POST   /api/exam-analytics/optik/upload                // Optik yükle
POST   /api/exam-analytics/optik/validate              // Doğrula
```

---

## 11. DOSYA/KLASÖR YAPISI

### 11.1 Backend (API Routes)
```
app/api/exam-analytics/
├── sinavlar/
│   ├── route.ts                    # GET, POST
│   ├── [id]/
│   │   ├── route.ts                # GET, PUT, DELETE
│   │   ├── publish/route.ts        # POST
│   │   └── calculate/route.ts      # POST
├── katilimcilar/
│   └── route.ts
├── sonuclar/
│   └── route.ts
└── optik/
    ├── upload/route.ts
    └── validate/route.ts
```

### 11.2 Frontend (Pages)
```
app/(dashboard)/admin/exam-analytics/
├── page.tsx                        # Dashboard
├── sinavlar/
│   ├── page.tsx                    # Liste
│   ├── yeni/page.tsx               # Yeni sınav
│   └── [id]/
│       ├── page.tsx                # Detay
│       ├── duzenle/page.tsx        # Düzenle
│       └── sonuclar/page.tsx       # Sonuçlar
└── ayarlar/
    └── page.tsx                    # Ayarlar
```

### 11.3 Components
```
components/exam-analytics/
├── SinavCard.tsx
├── SinavTable.tsx
├── SinavForm.tsx
├── KatilimciTable.tsx
├── SonucChart.tsx
├── OptikUploadModal.tsx
└── shared/
    ├── ExamDatePicker.tsx
    └── ExamTypeSelector.tsx
```

### 11.4 Types
```
types/exam-analytics/
├── index.ts
├── sinav.types.ts
├── katilimci.types.ts
├── sonuc.types.ts
└── optik.types.ts
```

---

## 12. TYPESCRIPT TYPES

### 12.1 Database Types
**Format:** PascalCase + Row/Insert/Update

```typescript
// ✅ Database row
export interface EaSinavlarRow {
  id: string;
  organization_id: string;
  sinav_kodu: string;
  sinav_adi: string;
  sinav_tipi: 'lgs' | 'tyt' | 'ayt' | 'deneme';
  sinav_tarihi: string;
  durum: 'taslak' | 'aktif' | 'tamamlandi';
  created_at: string;
  updated_at: string;
}

// ✅ Insert type
export interface EaSinavlarInsert {
  organization_id: string;
  sinav_kodu: string;
  sinav_adi: string;
  sinav_tipi: 'lgs' | 'tyt' | 'ayt' | 'deneme';
  sinav_tarihi: string;
}

// ✅ Update type
export type EaSinavlarUpdate = Partial<EaSinavlarInsert>;
```

### 12.2 Frontend Types
**Format:** PascalCase

```typescript
// ✅ Component props
export interface SinavCardProps {
  sinav: EaSinavlarRow;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ✅ Form data
export interface SinavFormData {
  sinavAdi: string;
  sinavTipi: SinavTipi;
  sinavTarihi: Date;
  dersler: DersInput[];
}

// ✅ API response
export interface SinavListResponse {
  data: EaSinavlarRow[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 13. YORUM STANDARTLARI

### 13.1 Tablo Yorumları
```sql
COMMENT ON TABLE ea_sinavlar IS 'Sınav tanımları - tüm sınav türleri için ana tablo';
COMMENT ON COLUMN ea_sinavlar.sinav_tipi IS 'Sınav türü: lgs, tyt, ayt, deneme';
COMMENT ON COLUMN ea_sinavlar.durum IS 'Sınav durumu: taslak, aktif, tamamlandi, arsivlendi';
```

### 13.2 Function Yorumları
```sql
-- Sınav istatistiklerini hesaplar ve döner
-- @param p_sinav_id Sınav UUID
-- @return TABLE katilimci_sayisi, ortalama_net, max_net
CREATE FUNCTION ea_get_sinav_istatistikleri(p_sinav_id UUID) ...
```

---

## 14. GIT COMMIT MESAJLARI

### 14.1 Format
**Format:** `[EA] {tip}: {kısa açıklama}`

```bash
git commit -m "[EA] feat: ea_sinavlar tablosu eklendi"
git commit -m "[EA] fix: sonuç hesaplama hatası düzeltildi"
git commit -m "[EA] refactor: optik upload API'si yeniden yapılandırıldı"
git commit -m "[EA] docs: isimlendirme kuralları güncellendi"
git commit -m "[EA] test: katılımcı eşleştirme testleri eklendi"
```

**Tip'ler:**
- `feat` - Yeni özellik
- `fix` - Hata düzeltme
- `refactor` - Yeniden yapılandırma
- `docs` - Dokümantasyon
- `test` - Test
- `perf` - Performans iyileştirme
- `chore` - Rutin işler

---

## 15. ÖZET - HIZLI REFERANS

### Tablo
```sql
CREATE TABLE ea_{isim}_cogul (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  {kolon}_id UUID REFERENCES {tablo}(id),
  is_{durum} BOOLEAN DEFAULT true,
  {enum}_type TEXT CHECK (...),
  {data}_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Index
```sql
CREATE INDEX idx_{tablo}_{kolon} ON ea_{tablo}({kolon});
CREATE UNIQUE INDEX unq_{tablo}_{kolon} ON ea_{tablo}({kolon});
```

### RLS
```sql
CREATE POLICY "{tablo}_{op}_org_isolation" ON ea_{tablo}
  FOR {SELECT|INSERT|UPDATE|DELETE}
  USING (organization_id = current_setting('app.organization_id')::uuid);
```

### Function
```sql
CREATE FUNCTION ea_{fiil}_{isim}(p_{param} TYPE) RETURNS TYPE AS $$ ... $$ LANGUAGE plpgsql;
```

### Migration
```
YYYYMMDD_ea_NNN_aciklama.sql
```

### API
```
/api/exam-analytics/{resource}/{action}
```

---

**Doküman Sonu**  
*Bu standartlar FAZ 2'den itibaren uygulanacaktır.*
