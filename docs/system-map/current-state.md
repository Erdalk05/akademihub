# AkademiHub Mevcut Sistem Haritası
**Tarih:** 2026-01-18  
**Versiyon:** 1.0  
**Amaç:** Exam Analytics modülü öncesi mevcut sistem durumu

---

## 1. CORE TABLOLAR (DOKUNULMAZ)

### 1.1 students
**Sahip:** Öğrenci Yönetimi Modülü  
**Amaç:** Öğrenci ana tablosu

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  student_no TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  section TEXT,
  status TEXT DEFAULT 'active',
  
  -- Multi-tenant
  organization_id UUID NOT NULL REFERENCES organizations(id),
  academic_year_id UUID REFERENCES academic_years(id),
  
  -- Kişisel bilgiler
  first_name TEXT,
  last_name TEXT,
  tc_id TEXT UNIQUE,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  
  -- Finans
  total_fee NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0
);
```

**Kısıtlamalar:**
- ✅ Okuma: Tüm modüller
- ❌ Yazma: **SADECE** Öğrenci Yönetimi modülü
- ❌ Otomatik öğrenci oluşturma YASAK
- ✅ RLS aktif
- ✅ organization_id NOT NULL

---

### 1.2 organizations
**Sahip:** Core System  
**Amaç:** Multi-tenant kurum/şube yönetimi

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB,
  is_active BOOLEAN DEFAULT true
);
```

**Kısıtlamalar:**
- ✅ Okuma: Tüm modüller
- ❌ Yazma: **SADECE** Super Admin
- ✅ Her kayıt organization_id taşımalı

---

### 1.3 academic_years
**Sahip:** Core System  
**Amaç:** Akademik yıl yönetimi (2024-2025 vb.)

```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(20) NOT NULL, -- '2024-2025'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false
);
```

**Kısıtlamalar:**
- ✅ Okuma: Tüm modüller
- ❌ Yazma: **SADECE** Admin
- ✅ Bir kurumda bir aktif yıl (trigger ile garanti)

---

### 1.4 finance_* tabloları
**Sahip:** Finans Modülü  
**Prefix:** `finance_`

**Tablolar:**
- `finance_installments` - Taksit planları
- `finance_payments` - Ödemeler
- `finance_expenses` - Giderler
- `finance_sales` - Satışlar
- `finance_products` - Ürünler

**Kısıtlamalar:**
- ✅ Okuma: Admin, Muhasebe
- ❌ Yazma: **SADECE** Finans modülü
- ❌ Diğer modüller KESİNLİKLE yazamaz
- ✅ Tümü organization_id bazlı

---

## 2. PORTAL YAPISI

### 2.1 Admin Portal
**Route:** `/dashboard`, `/students`, `/finance`, `/settings`

**Sayfalar:**
```
/dashboard
├── Genel istatistikler
├── Son ödemeler
└── Borçlu öğrenciler

/students
├── /students (liste)
├── /students/[id] (detay)
├── /students/[id]/edit
├── /students/[id]/ledger (cari)
├── /enrollment (yeni kayıt)
└── /students/import

/finance
├── / (dashboard)
├── /payments
├── /expenses
├── /other-income
├── /sales
├── /reports
│   ├── /founder
│   ├── /contracts
│   └── /builder
└── /cash-bank

/settings
├── Genel ayarlar
├── Kullanıcılar
├── Organizasyonlar
└── Akademik yıllar
```

---

### 2.2 Franchise Portal
**Route:** `/franchise`  
**Yetki:** Super Admin only

**Özellikler:**
- Tüm kurumları görüntüleme
- Kurum bazlı raporlar
- Genel istatistikler

---

## 3. API ENDPOINTS

### 3.1 Students API
**Base:** `/api/students`

```
GET  /api/students          → Öğrenci listesi (pagination + filter)
GET  /api/students/[id]     → Öğrenci detay
POST /api/students          → Yeni öğrenci (SADECE bu endpoint yazabilir)
PUT  /api/students/[id]     → Öğrenci güncelle
GET  /api/students/list     → RPC (hızlı liste)
```

**RLS Kuralı:**
```sql
-- Kullanıcı sadece kendi organization_id'sine ait öğrencileri görebilir
```

---

### 3.2 Finance API
**Base:** `/api/finance/*`

```
/api/finance/dashboard      → Dashboard özeti
/api/finance/payments       → Ödeme listesi
/api/finance/installments   → Taksit yönetimi
/api/finance/expenses       → Gider yönetimi
/api/finance/reports/*      → Raporlar
```

**İzolasyon:**
- Finance API **SADECE** `finance_*` tablolarına yazar
- `students` tablosunu sadece okur

---

### 3.3 Academic Years API
**Base:** `/api/academic-years`

```
GET  /api/academic-years    → Yıl listesi
POST /api/academic-years    → Yeni yıl (admin only)
```

---

## 4. SIDEBAR NAVİGASYON

**Dosya:** `components/layout/Sidebar.tsx`

**Mevcut Menüler:**
1. Dashboard
2. Öğrenciler
   - Tüm Öğrenciler
   - Yeni Kayıt
3. Finans
   - Genel Bakış
   - Tahsilatlar
   - Diğer Gelirler
   - Giderler
   - Kasa & Banka
4. Raporlar
   - Kurucu Raporu (admin only)
   - Finansal Raporlar
   - Sözleşmeler
   - Rapor Oluşturucu
5. Franchise Paneli (super admin only)
6. Ayarlar (admin only)

**Exam Analytics için yer:**
- Raporlar ile Franchise arasına eklenebilir
- Veya Öğrenciler altına alt menü olarak

---

## 5. AUTHENTICATION & AUTHORIZATION

### Roller
```typescript
type UserRole = 
  | 'super_admin'    // Tüm yetkilere sahip
  | 'admin'          // Kurum admini
  | 'accounting'     // Muhasebe
  | 'teacher'        // Öğretmen
  | 'parent'         // Veli
  | 'student';       // Öğrenci
```

### İzin Sistemi
**Dosya:** `lib/hooks/usePermission.ts`

```typescript
const permission = usePermission();
permission.isSuperAdmin  // franchise sahip
permission.isAdmin       // kurum admin
permission.isAccounting  // muhasebe
```

---

## 6. MEVCUT MIGRATION YAPISI

**Klasör:** `supabase/migrations/`

**Önemli Migration'lar:**
```
001_init_schema.sql                     → Temel tablolar (temizlendi)
002_akademihub_complete.sql             → Finans tabloları
20250128_create_organizations.sql       → Multi-tenant
20250128_create_academic_years.sql      → Akademik yıllar
20250128_add_org_year_to_tables.sql     → organization_id ekleme
20251115_000001_finance_core.sql        → Finans v2
role_based_policies.sql                 → RLS policy'leri
```

---

## 7. GELIŞTIRME KURALLARI

### 7.1 Prefix Sistemi
Her modül kendi prefix'ini kullanır:
- `students` → Core (prefix yok)
- `finance_*` → Finans modülü
- `ea_*` → **Exam Analytics (YENİ)**
- `optik_*` → **Optik okuma (YENİ)**

### 7.2 Multi-Tenant Zorunluluğu
**HER** yeni tablo:
```sql
organization_id UUID NOT NULL REFERENCES organizations(id)
```

### 7.3 RLS Zorunluluğu
**HER** yeni tablo:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name" ON table_name
  FOR SELECT
  USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 7.4 Audit Trail
Önemli tablolar için:
```sql
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
updated_by UUID REFERENCES users(id)
```

---

## 8. PERFORMANS OPTİMİZASYONLARI

### Index'ler
```sql
CREATE INDEX idx_students_organization ON students(organization_id);
CREATE INDEX idx_students_academic_year ON students(academic_year_id);
CREATE INDEX idx_students_org_year ON students(organization_id, academic_year_id);
```

### RPC Fonksiyonlar
**Hızlı sorgular için:**
- `get_students_list()` → Sayfalı öğrenci listesi
- `get_finance_dashboard()` → Finans özeti
- `get_founder_report()` → Kurucu raporu

---

## 9. KULLANILMAYAN/SİLİNEN ÖĞELİLER

### 9.1 Eski Exam Tabloları (SİLİNDİ - 2026-01-18)
- ❌ `exams` → Eski sınav tablosu
- ❌ `questions` → Eski soru tablosu
- ❌ `exam_results` → Eski sonuç tablosu

**Neden silindi:**
- Spectra modülü ile birlikte kullanılmıyordu
- Yeni Exam Analytics için temiz zemin gerekiyordu
- Hiçbir bağımlılık yoktu

---

## 10. SONRAKI ADIMLAR

### Exam Analytics için hazır olan şeyler:
✅ Multi-tenant altyapı (organizations)  
✅ Akademik yıl sistemi (academic_years)  
✅ Öğrenci tablosu (read-only)  
✅ Sidebar navigasyon sistemi  
✅ RLS policy framework  
✅ API routing yapısı  

### Exam Analytics'in oluşturması gerekenler:
- `ea_sinavlar` → Sınav tanımları
- `ea_katilimcilar` → Sınav katılımcıları
- `ea_sonuclar` → Sınav sonuçları
- `optik_sablonlar` → Optik form şablonları
- API endpoints (`/api/exam-analytics/*`)
- Admin sayfaları (`/admin/exam-analytics/*`)

---

**Doküman Sonu**  
*Bu harita FAZ 2 öncesi referans belgedir.*
