# 🎯 AKADEMİHUB EXAM spectraE MODULE
## Tam Entegre Mimari & Cursor İnşa Rehberi
### Versiyon 2.0 | Ocak 2026

---

# 📋 İÇİNDEKİLER

1. [Modül Amacı & Kapsamı](#1-modül-amacı--kapsamı)
2. [Mevcut Sistemle Entegrasyon](#2-mevcut-sistemle-entegrasyon)
3. [Veritabanı Şeması & İlişkiler](#3-veritabanı-şeması--i̇lişkiler)
4. [Dosya Mimarisi](#4-dosya-mimarisi)
5. [Sayfa Yapısı & Bileşenler](#5-sayfa-yapısı--bileşenler)
6. [Veri Akışı & API](#6-veri-akışı--api)
7. [Cursor İnşa Adımları](#7-cursor-i̇nşa-adımları)
8. [Kontrol Listesi](#8-kontrol-listesi)

---

# 1. MODÜL AMACI & KAPSAMI

## 1.1 Ne Yapıyoruz?

**Sayfa:** `/admin/exam-intelligence/sinavlar/[examId]`

Bu sayfa, sınav listesinden tıklanan bir sınavın **derin analiz merkezi**dir.

## 1.2 Temel İşlevler

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXAM INTELLIGENCE DASHBOARD - TEMEL İŞLEVLER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 VERİ GÖSTERİMİ                                                         │
│  ├── Sınav genel istatistikleri (özet kartlar)                             │
│  ├── Öğrenci sıralama tablosu (K12Net benzeri)                             │
│  ├── Ders bazlı performans analizi                                         │
│  ├── Sınıf karşılaştırması                                                 │
│  └── Net dağılım grafikleri                                                │
│                                                                             │
│  🔗 ASİL ÖĞRENCİ ENTEGRASYONU                                              │
│  ├── Finans modülündeki öğrencilerle eşleştirme                            │
│  ├── Misafir vs Asil ayrımı                                                │
│  ├── Eşleşme bekleyen öğrenci uyarısı                                      │
│  └── Manuel eşleştirme modalı                                              │
│                                                                             │
│  🤖 AI ANALİZ                                                               │
│  ├── Risk skorları (dropout_risk)                                          │
│  ├── LGS/YKS tahminleri                                                    │
│  ├── Konu bazlı zayıf alan tespiti                                         │
│  └── Kişiselleştirilmiş öneriler                                           │
│                                                                             │
│  📤 EXPORT                                                                  │
│  ├── PDF rapor (kurum logolu)                                              │
│  ├── Excel export (çoklu sheet)                                            │
│  └── Öğrenci bazlı rapor kartı                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. MEVCUT SİSTEMLE ENTEGRASYON

## 2.1 AkademiHub Mevcut Modüller

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MEVCUT AKADEMİHUB MODÜLLER (Entegre Olacak)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💰 FİNANS MODÜLÜ                                                          │
│  ├── /admin/students → Öğrenci kayıt & listeleme                           │
│  ├── /admin/finance → Tahsilat & taksit                                    │
│  └── students tablosu → Asil öğrenci verileri                              │
│                                                                             │
│  📊 EXAM INTELLIGENCE (Mevcut)                                             │
│  ├── /admin/exam-intelligence → Ana dashboard                              │
│  ├── /admin/exam-intelligence/sinavlar → Sınav listesi                     │
│  ├── /admin/exam-intelligence/sihirbaz → Sınav yükleme                     │
│  └── exams, exam_sections, exam_participants tabloları                      │
│                                                                             │
│  👤 KİMLİK & AUTH                                                          │
│  ├── persons tablosu → TC, isim, iletişim                                  │
│  ├── users tablosu → Giriş yapan kullanıcılar                              │
│  └── organizations tablosu → Kurum bilgileri (logo, renk)                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Veri Bağlantı Haritası

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERİ BAĞLANTI HARİTASI                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  exam_participants ←──────────────────────────────────────────────┐        │
│       │                                                           │        │
│       ├── person_id ──────→ persons (TC, isim)                   │        │
│       │                                                           │        │
│       ├── student_id ─────→ students (ASİL öğrenci)              │        │
│       │                          │                                │        │
│       │                          ├── class_id → classes          │        │
│       │                          ├── contracts → finans          │        │
│       │                          └── person_id → persons         │        │
│       │                                                           │        │
│       ├── exam_id ────────→ exams                                │        │
│       │                          │                                │        │
│       │                          └── exam_sections (dersler)     │        │
│       │                                                           │        │
│       └── organization_id ─→ organizations (logo, renk)          │        │
│                                                                             │
│  exam_results ←── exam_participant_id                                       │
│       │                                                                     │
│       └── exam_result_sections ←── exam_section_id                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Tasarım Sistemi (Mevcut AkademiHub)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AKADEMİHUB TASARIM SİSTEMİ                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎨 RENKLER                                                                │
│  ──────────────────────────────────────────────────────────────────        │
│  Primary:     #10B981 (Emerald - Ana tema rengi)                           │
│  Secondary:   #059669 (Koyu Emerald)                                       │
│  Background:  #F8FAFC (Açık gri arka plan)                                 │
│  Card:        #FFFFFF (Beyaz kartlar)                                      │
│  Border:      #E5E7EB (Gri çizgiler)                                       │
│                                                                             │
│  Danger:      #EF4444 (Kırmızı - hata, risk)                              │
│  Warning:     #F59E0B (Amber - uyarı)                                      │
│  Success:     #22C55E (Yeşil - başarı)                                     │
│  Info:        #3B82F6 (Mavi - bilgi)                                       │
│                                                                             │
│  DERS RENKLERİ                                                             │
│  ──────────────────────────────────────────────────────────────────        │
│  Türkçe:          #3B82F6 (Blue)                                           │
│  Matematik:       #EF4444 (Red)                                            │
│  Fen Bilimleri:   #22C55E (Green)                                          │
│  Sosyal Bilgiler: #F59E0B (Amber)                                          │
│  İngilizce:       #8B5CF6 (Purple)                                         │
│  Din Kültürü:     #EC4899 (Pink)                                           │
│                                                                             │
│  📐 COMPONENT'LER (Shadcn/UI + Custom)                                     │
│  ──────────────────────────────────────────────────────────────────        │
│  - Card, Button, Badge, Table → Shadcn/UI                                  │
│  - StatCard → Özel özet kartları                                           │
│  - DataTable → TanStack Table tabanlı                                      │
│  - Charts → Recharts                                                        │
│                                                                             │
│  🔤 TİPOGRAFİ                                                              │
│  ──────────────────────────────────────────────────────────────────        │
│  Font: Inter (varsayılan Next.js)                                          │
│  Headings: font-semibold (600)                                             │
│  Body: font-normal (400)                                                    │
│  Numbers: tabular-nums, font-medium (500)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. VERİTABANI ŞEMASI & İLİŞKİLER

## 3.1 Kullanılacak Tablolar

```sql
-- ═══════════════════════════════════════════════════════════════
-- MEVCUT TABLOLAR (Değişiklik yok, sadece kullan)
-- ═══════════════════════════════════════════════════════════════

-- 1. organizations (Kurum bilgileri)
-- Önemli alanlar: id, name, logo_url, primary_color

-- 2. persons (Kişi bilgileri)
-- Önemli alanlar: id, tc_no, first_name, last_name

-- 3. students (Asil öğrenciler - Finans modülünden)
-- Önemli alanlar: id, person_id, organization_id, student_no, class_id, status

-- 4. classes (Sınıflar)
-- Önemli alanlar: id, name, grade_level

-- ═══════════════════════════════════════════════════════════════
-- EXAM INTELLIGENCE TABLOLARI
-- ═══════════════════════════════════════════════════════════════

-- 5. exams (Sınavlar)
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- 'LGS', 'YKS', 'TYT', 'AYT', 'deneme'
    exam_date DATE,
    total_questions INTEGER,
    source VARCHAR(50), -- 'optik', 'manual', 'import'
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. exam_sections (Sınav dersleri)
CREATE TABLE exam_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'Türkçe', 'Matematik'
    code VARCHAR(10), -- 'TUR', 'MAT', 'FEN', 'SOS', 'ING', 'DIN'
    question_count INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 7. exam_participants (Sınav katılımcıları - MERKEZ TABLO)
CREATE TABLE exam_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    
    -- KİMLİK BAĞLANTISI
    person_id UUID REFERENCES persons(id),
    student_id UUID REFERENCES students(id), -- NULL = Misafir
    
    -- KATILIMCI TİPİ
    participant_type VARCHAR(20) DEFAULT 'guest', -- 'institution' | 'guest'
    -- student_id doluysa 'institution', boşsa 'guest'
    
    -- MİSAFİR BİLGİLERİ (student_id NULL ise)
    guest_name VARCHAR(200),
    guest_school VARCHAR(255),
    guest_class VARCHAR(50),
    
    -- EŞLEŞTIRME DURUMU
    match_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'matched' | 'guest' | 'conflict'
    match_confidence DECIMAL(3,2), -- 0.00 - 1.00
    
    -- OPTİK FORM VERİSİ
    optical_student_no VARCHAR(50),
    optical_name VARCHAR(200),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. exam_results (Genel sonuçlar)
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_participant_id UUID REFERENCES exam_participants(id) ON DELETE CASCADE,
    
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_blank INTEGER DEFAULT 0,
    total_net DECIMAL(6,2) DEFAULT 0,
    
    -- Sıralama (hesaplanacak)
    class_rank INTEGER,
    organization_rank INTEGER,
    percentile DECIMAL(5,2),
    
    -- AI Analiz (opsiyonel, sonra eklenecek)
    ai_analysis JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. exam_result_sections (Ders bazlı sonuçlar)
CREATE TABLE exam_result_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_result_id UUID REFERENCES exam_results(id) ON DELETE CASCADE,
    exam_section_id UUID REFERENCES exam_sections(id),
    
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    blank_count INTEGER DEFAULT 0,
    net DECIMAL(6,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3.2 Kritik İş Kuralları

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  KRİTİK İŞ KURALLARI                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ ASİL vs MİSAFİR AYIRIMI                                               │
│  ─────────────────────────────────────────────────────────────              │
│  IF exam_participants.student_id IS NOT NULL THEN                          │
│      participant_type = 'institution' (ASİL)                               │
│      Öğrenci bilgileri students + persons tablosundan gelir               │
│  ELSE                                                                       │
│      participant_type = 'guest' (MİSAFİR)                                  │
│      Öğrenci bilgileri guest_name, guest_school alanlarından gelir        │
│  END IF                                                                     │
│                                                                             │
│  2️⃣ NET HESAPLAMA                                                          │
│  ─────────────────────────────────────────────────────────────              │
│  net = correct_count - (wrong_count / 4)                                   │
│  -- Her 4 yanlış 1 doğruyu götürür (LGS/YKS standardı)                    │
│                                                                             │
│  3️⃣ SIRALAMA                                                               │
│  ─────────────────────────────────────────────────────────────              │
│  organization_rank = total_net'e göre DESC sıralama                        │
│  class_rank = Aynı class_id içinde total_net'e göre DESC                   │
│  percentile = (rank / total_count) * 100                                   │
│                                                                             │
│  4️⃣ EŞLEŞTIRME DURUMU                                                      │
│  ─────────────────────────────────────────────────────────────              │
│  'pending' = Optik formdan geldi, henüz eşleştirilmedi                     │
│  'matched' = Asil öğrenciyle eşleştirildi                                  │
│  'guest' = Misafir olarak kalacak (eşleştirme yok)                        │
│  'conflict' = Birden fazla eşleşme adayı var                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. DOSYA MİMARİSİ

## 4.1 Oluşturulacak Dosyalar

```
src/
├── app/
│   └── admin/
│       └── exam-intelligence/
│           └── sinavlar/
│               └── [examId]/
│                   ├── page.tsx              # ✅ ANA SAYFA
│                   ├── loading.tsx           # ✅ Loading skeleton
│                   ├── error.tsx             # ✅ Error boundary
│                   └── not-found.tsx         # ✅ 404 sayfası
│
├── components/
│   └── exam-detail/                          # ✅ YENİ KLASÖR
│       ├── ExamDetailHeader.tsx              # Header + geri butonu
│       ├── SummaryCards.tsx                  # 6 özet kartı
│       ├── MatchWarningBanner.tsx            # Eşleşme bekleyen uyarısı
│       ├── DistributionCharts.tsx            # Histogram + Donut
│       ├── StudentRankingTable.tsx           # Ana öğrenci tablosu
│       ├── StudentAccordion.tsx              # Satır detayı
│       ├── ClassComparison.tsx               # Sınıf karşılaştırma
│       ├── ExportButtons.tsx                 # PDF/Excel butonları
│       └── MatchingModal.tsx                 # Manuel eşleştirme modalı
│
├── hooks/
│   └── exam-detail/                          # ✅ YENİ KLASÖR
│       ├── useExamDetail.ts                  # Ana veri hook'u
│       ├── useExamStatistics.ts              # İstatistik hesaplama
│       ├── useStudentFilters.ts              # Filtreleme
│       └── useExamExport.ts                  # Export işlemleri
│
├── lib/
│   └── exam-detail/                          # ✅ YENİ KLASÖR
│       ├── calculations.ts                   # Net, sıralama hesaplamaları
│       ├── export-pdf.ts                     # PDF oluşturma
│       ├── export-excel.ts                   # Excel oluşturma
│       └── constants.ts                      # Sabitler, ders renkleri
│
└── types/
    └── exam-detail.ts                        # ✅ YENİ DOSYA - Tipler
```

## 4.2 Type Tanımları

```typescript
// types/exam-detail.ts

// Sınav bilgisi
export interface Exam {
  id: string;
  organization_id: string;
  name: string;
  exam_type: string;
  exam_date: string | null;
  total_questions: number;
  source: string;
  is_published: boolean;
  created_at: string;
}

// Sınav bölümü (ders)
export interface ExamSection {
  id: string;
  exam_id: string;
  name: string;
  code: string;
  question_count: number;
  sort_order: number;
}

// Katılımcı
export interface ExamParticipant {
  id: string;
  exam_id: string;
  organization_id: string;
  person_id: string | null;
  student_id: string | null;
  participant_type: 'institution' | 'guest';
  guest_name: string | null;
  guest_school: string | null;
  guest_class: string | null;
  match_status: 'pending' | 'matched' | 'guest' | 'conflict';
  match_confidence: number | null;
  optical_student_no: string | null;
  optical_name: string | null;
  
  // İlişkili veriler (join)
  person?: {
    first_name: string;
    last_name: string;
    tc_no: string;
  };
  student?: {
    student_no: string;
    class?: {
      id: string;
      name: string;
    };
  };
  exam_results?: ExamResult[];
}

// Sonuç
export interface ExamResult {
  id: string;
  exam_participant_id: string;
  total_correct: number;
  total_wrong: number;
  total_blank: number;
  total_net: number;
  class_rank: number | null;
  organization_rank: number | null;
  percentile: number | null;
  ai_analysis: any | null;
  
  // İlişkili veriler
  exam_result_sections?: ExamResultSection[];
}

// Ders bazlı sonuç
export interface ExamResultSection {
  id: string;
  exam_result_id: string;
  exam_section_id: string;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  net: number;
  
  // İlişkili
  exam_section?: ExamSection;
}

// Tablo satırı (birleştirilmiş veri)
export interface StudentTableRow {
  rank: number;
  participantId: string;
  studentId: string | null;
  studentNo: string;
  name: string;
  className: string;
  participantType: 'institution' | 'guest';
  matchStatus: string;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalNet: number;
  lgsScore: number; // Hesaplanmış
  percentile: number;
  sections: {
    sectionId: string;
    sectionName: string;
    sectionCode: string;
    correct: number;
    wrong: number;
    blank: number;
    net: number;
  }[];
}

// İstatistikler
export interface ExamStatistics {
  totalParticipants: number;
  institutionCount: number;
  guestCount: number;
  pendingMatchCount: number;
  
  averageNet: number;
  maxNet: number;
  minNet: number;
  medianNet: number;
  stdDeviation: number;
  
  maxNetStudent: { name: string; net: number };
  minNetStudent: { name: string; net: number };
  
  sectionAverages: {
    sectionId: string;
    sectionName: string;
    averageNet: number;
    averageCorrect: number;
    averageWrong: number;
  }[];
  
  classAverages: {
    classId: string;
    className: string;
    studentCount: number;
    averageNet: number;
  }[];
  
  netDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

// Filtreler
export interface StudentFilters {
  search: string;
  classId: string | null;
  participantType: 'all' | 'institution' | 'guest';
  sortBy: 'rank' | 'name' | 'net' | 'class';
  sortOrder: 'asc' | 'desc';
}
```

---

# 5. SAYFA YAPISI & BİLEŞENLER

## 5.1 Sayfa Layout'u

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1️⃣ HEADER (Sticky)                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ← Geri  │  [SINAV ADI] - [TARİH]  │  [🔄] [📊 Excel] [📄 PDF] [⚙️]    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2️⃣ MATCH WARNING BANNER (Koşullu - pending varsa)                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Eşleşme bekleyen 5 öğrenci var. [Eşleştirmeyi Tamamla]              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3️⃣ ÖZET KARTLARI (6 Grid)                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │Öğrenci   │ │Ort.Net   │ │En Yüksek │ │En Düşük  │ │Std.Sapma │ │Medyan  ││
│ │52        │ │67.3      │ │84.0      │ │17.6      │ │12.8      │ │68.5    ││
│ │48A • 4M  │ │↑+2.1     │ │Ad Soyad  │ │Ad Soyad  │ │Normal    │ │26.sıra ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ 4️⃣ DAĞILIM GRAFİKLERİ (2 Kolon)                                            │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ 📊 NET DAĞILIMI (Histogram)     │ │ 🍩 D/Y/B DAĞILIMI (Donut)          │ │
│ │ ┌───────────────────────────┐   │ │ ┌───────────────────────────────┐   │ │
│ │ │    ▓▓                     │   │ │ │         ╭───────╮             │   │ │
│ │ │    ▓▓ ▓▓                  │   │ │ │     ╭───╯ %68   ╰───╮         │   │ │
│ │ │ ▓▓ ▓▓ ▓▓ ▓▓              │   │ │ │    │   67.3 Net    │         │   │ │
│ │ │ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓           │   │ │ │     ╰───╮ %18 ╭───╯         │   │ │
│ │ └───────────────────────────┘   │ │ │         ╰──%14─╯             │   │ │
│ │ 0-20 20-40 40-60 60-80 80+      │ │ └───────────────────────────────┘   │ │
│ │                      [PDF][XLS] │ │ ■Doğru ■Yanlış ■Boş    [PDF][XLS] │ │
│ └─────────────────────────────────┘ └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5️⃣ ÖĞRENCİ SIRALAMA TABLOSU                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 [Ara...] │ Sınıf:[▼] │ Tip:[▼] │ Sırala:[Net ▼] │ [Export ▼]       │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Sıra │ No  │ Öğrenci        │ Sınıf │ Tip  │ TÜR │ MAT │ FEN │...│ NET │ │
│ ├──────┼─────┼────────────────┼───────┼──────┼─────┼─────┼─────┼───┼─────┤ │
│ │ 🥇   │ 248 │ YUSUF YAKUP Y. │ 8/801 │ Asil │ 18  │ 17  │ 16  │...│84.0 │ │
│ │ ─────┴─────┴────────────────┴───────┴──────┴─────┴─────┴─────┴───┴─────│ │
│ │ ▼ AKORDİYON AÇIK                                               [PDF] X │ │
│ │ ┌───────────────────────────────────────────────────────────────────┐   │ │
│ │ │ Özet Bilgiler        │  Son 5 Sınav Trendi (Grafik)              │   │ │
│ │ │ Net: 84.0            │  ╭────────────────────╮                   │   │ │
│ │ │ Sınıf Sırası: 1/28   │  │     ╱╲   ╱╲        │                   │   │ │
│ │ │ Kurum Sırası: 1/52   │  │    ╱  ╲ ╱  ╲       │                   │   │ │
│ │ │ Tahmini LGS: 468,000 │  ╰────────────────────╯                   │   │ │
│ │ ├───────────────────────────────────────────────────────────────────┤   │ │
│ │ │ DERS BAZLI PERFORMANS                                            │   │ │
│ │ │ Ders     │ Soru │ D  │ Y │ B │ Net   │ Sınıf │ Fark             │   │ │
│ │ │ Türkçe   │  20  │ 18 │ 1 │ 1 │ 17.75 │ 14.2  │ ✅ +3.55         │   │ │
│ │ │ Mat      │  20  │ 17 │ 2 │ 1 │ 16.50 │ 11.8  │ ✅ +4.70         │   │ │
│ │ │ ...      │      │    │   │   │       │       │                   │   │ │
│ │ ├───────────────────────────────────────────────────────────────────┤   │ │
│ │ │ ✅ Güçlü Alanlar        │ ⚠️ Geliştirilmesi Gereken             │   │ │
│ │ │ • Türkçe - Paragraf     │ • İngilizce - Gramer                   │   │ │
│ │ └───────────────────────────────────────────────────────────────────┘   │ │
│ ├──────┼─────┼────────────────┼───────┼──────┼─────┼─────┼─────┼───┼─────┤ │
│ │ 🥈   │ 785 │ KAAN ULUSOY    │ 8/801 │ Asil │ 17  │ 15  │ 15  │...│79.0 │ │
│ │ 🥉   │ 021 │ BERİK C.       │ 8/801 │ Asil │ 15  │ 14  │ 14  │...│70.0 │ │
│ │ ...                                                                     │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ ‹ Önceki    Sayfa 1/3    Sonraki ›          Toplam: 52 | Sayfa: [20▼] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6️⃣ SINIF KARŞILAŞTIRMA                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🏫 SINIF KARŞILAŞTIRMASI                                  [PDF] [XLS] │ │
│ ├───────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┤ │
│ │ Sınıf     │ Öğrenci  │ Ort.Net  │ Türkçe   │ Matematik│ Performans      │ │
│ ├───────────┼──────────┼──────────┼──────────┼──────────┼─────────────────┤ │
│ │ 🥇 8/801  │    28    │   72.4   │   14.2   │   12.5   │ ████████████░░░ │ │
│ │ 🥈 8/802  │    24    │   65.2   │   12.8   │   10.8   │ ██████████░░░░░ │ │
│ └───────────┴──────────┴──────────┴──────────┴──────────┴─────────────────┘ │
│                                                                             │
│ KURUM ORTALAMASI: 67.3 Net                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Component Detayları

### ExamDetailHeader.tsx
```
Props:
- exam: Exam
- onRefresh: () => void
- onExportPDF: () => void
- onExportExcel: () => void

Özellikler:
- Sticky pozisyon
- Geri butonu → router.push('/admin/exam-intelligence/sinavlar')
- Sınav adı + tarih
- Export butonları
```

### MatchWarningBanner.tsx
```
Props:
- pendingCount: number
- onOpenModal: () => void

Koşul:
- pendingCount > 0 ise göster
- Amber arka plan, uyarı ikonu
- "Eşleştirmeyi Tamamla" butonu
```

### SummaryCards.tsx
```
Props:
- statistics: ExamStatistics

6 Kart:
1. Öğrenci Sayısı (institution + guest ayrımı)
2. Ortalama Net
3. En Yüksek Net (+ öğrenci adı)
4. En Düşük Net (+ öğrenci adı)
5. Standart Sapma
6. Medyan (+ sıra)
```

### DistributionCharts.tsx
```
Props:
- netDistribution: ExamStatistics['netDistribution']
- totalCorrect: number
- totalWrong: number
- totalBlank: number
- averageNet: number

Sol: Recharts BarChart (Histogram)
Sağ: Recharts PieChart (Donut)
```

### StudentRankingTable.tsx
```
Props:
- students: StudentTableRow[]
- sections: ExamSection[]
- filters: StudentFilters
- onFiltersChange: (filters) => void
- onRowClick: (studentId) => void
- expandedStudentId: string | null

Özellikler:
- Yatay scroll (sol 3 kolon sabit)
- Filtreleme barı
- Sıralanabilir kolonlar
- Satır tıklanınca akordiyon
- Pagination
```

### StudentAccordion.tsx
```
Props:
- student: StudentTableRow
- classAverage: number
- sectionAverages: Map<string, number>
- onClose: () => void
- onExportPDF: () => void

Bölümler:
1. Özet bilgiler (sol)
2. Trend grafiği (sağ) - Eğer geçmiş sınav varsa
3. Ders bazlı performans tablosu
4. Güçlü/Zayıf alanlar
```

### ClassComparison.tsx
```
Props:
- classAverages: ExamStatistics['classAverages']
- sectionAverages: Map<string, Map<string, number>>
- organizationAverage: number

Özellikler:
- Sınıf sıralama tablosu
- Performans barları
- Opsiyonel: Radar chart
```

---

# 6. VERİ AKIŞI & API

## 6.1 Supabase Query

```typescript
// hooks/exam-detail/useExamDetail.ts

export async function fetchExamDetail(examId: string) {
  const supabase = createClient();
  
  // 1. Sınav ve bölümleri çek
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select(`
      *,
      exam_sections (
        id,
        name,
        code,
        question_count,
        sort_order
      )
    `)
    .eq('id', examId)
    .single();
  
  if (examError) throw examError;
  
  // 2. Katılımcılar ve sonuçları çek
  const { data: participants, error: participantsError } = await supabase
    .from('exam_participants')
    .select(`
      *,
      person:persons (
        first_name,
        last_name,
        tc_no
      ),
      student:students (
        id,
        student_no,
        class:classes (
          id,
          name
        )
      ),
      exam_results (
        *,
        exam_result_sections (
          *,
          exam_section:exam_sections (
            id,
            name,
            code
          )
        )
      )
    `)
    .eq('exam_id', examId)
    .order('created_at', { ascending: true });
  
  if (participantsError) throw participantsError;
  
  return { exam, participants };
}
```

## 6.2 İstatistik Hesaplama

```typescript
// lib/exam-detail/calculations.ts

export function calculateStatistics(
  participants: ExamParticipant[]
): ExamStatistics {
  
  // Sonuçları filtrele (exam_results olan katılımcılar)
  const resultsData = participants
    .filter(p => p.exam_results && p.exam_results.length > 0)
    .map(p => ({
      participant: p,
      result: p.exam_results![0]
    }));
  
  // Net değerleri
  const nets = resultsData.map(r => r.result.total_net);
  
  // Temel istatistikler
  const stats: ExamStatistics = {
    totalParticipants: participants.length,
    institutionCount: participants.filter(p => p.participant_type === 'institution').length,
    guestCount: participants.filter(p => p.participant_type === 'guest').length,
    pendingMatchCount: participants.filter(p => p.match_status === 'pending').length,
    
    averageNet: average(nets),
    maxNet: Math.max(...nets),
    minNet: Math.min(...nets),
    medianNet: median(nets),
    stdDeviation: standardDeviation(nets),
    
    // ... diğer hesaplamalar
  };
  
  return stats;
}

// Yardımcı fonksiyonlar
function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function standardDeviation(arr: number[]): number {
  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

// Net hesaplama (4 yanlış 1 doğruyu götürür)
export function calculateNet(correct: number, wrong: number): number {
  return correct - (wrong / 4);
}

// LGS puan tahmini (yaklaşık formül)
export function estimateLGSScore(totalNet: number): number {
  // Not: Gerçek ÖSYM formülü daha karmaşık
  // Bu basitleştirilmiş tahmin
  return Math.round(200 + (totalNet * 4.5));
}
```

---

# 7. CURSOR İNŞA ADIMLARI

## 7.1 ADIM 1: Dosya Yapısını Oluştur

```bash
# Terminal'de çalıştır
mkdir -p src/app/admin/exam-intelligence/sinavlar/\[examId\]
mkdir -p src/components/exam-detail
mkdir -p src/hooks/exam-detail
mkdir -p src/lib/exam-detail

# Boş dosyaları oluştur
touch src/app/admin/exam-intelligence/sinavlar/\[examId\]/page.tsx
touch src/app/admin/exam-intelligence/sinavlar/\[examId\]/loading.tsx
touch src/app/admin/exam-intelligence/sinavlar/\[examId\]/error.tsx
touch src/types/exam-detail.ts
```

## 7.2 ADIM 2: Type Dosyasını Yaz

**Cursor'a söyle:**
```
types/exam-detail.ts dosyasını oluştur.
Bu dokümandaki "Type Tanımları" bölümünü kullan.
Tüm interface'leri ekle: Exam, ExamSection, ExamParticipant, 
ExamResult, ExamResultSection, StudentTableRow, ExamStatistics, StudentFilters
```

## 7.3 ADIM 3: Yardımcı Fonksiyonları Yaz

**Cursor'a söyle:**
```
lib/exam-detail/calculations.ts dosyasını oluştur.
- calculateNet(correct, wrong) → net
- estimateLGSScore(totalNet) → lgsScore
- calculateStatistics(participants) → ExamStatistics
- average, median, standardDeviation yardımcı fonksiyonları
```

**Cursor'a söyle:**
```
lib/exam-detail/constants.ts dosyasını oluştur.
- SECTION_COLORS: Ders renkleri (Türkçe:#3B82F6, Matematik:#EF4444...)
- NET_RANGES: [0-20, 20-40, 40-60, 60-80, 80+]
- PAGE_SIZES: [10, 20, 50, 100]
```

## 7.4 ADIM 4: Hook'ları Yaz

**Cursor'a söyle:**
```
hooks/exam-detail/useExamDetail.ts dosyasını oluştur.
- fetchExamDetail(examId) fonksiyonu
- Supabase'den exam + exam_sections + exam_participants + exam_results çek
- Bu dokümandaki Supabase Query örneğini kullan
- React Query veya SWR ile cache'le
```

**Cursor'a söyle:**
```
hooks/exam-detail/useExamStatistics.ts dosyasını oluştur.
- participants verisini al
- calculateStatistics fonksiyonunu çağır
- useMemo ile optimize et
```

## 7.5 ADIM 5: Component'leri Yaz (Sırayla)

### 5.1 SummaryCards.tsx
**Cursor'a söyle:**
```
components/exam-detail/SummaryCards.tsx oluştur.
- Props: statistics: ExamStatistics
- 6 kart grid (responsive: 6/3/2 kolon)
- Her kart: icon, başlık, değer, alt bilgi
- Mevcut projede Card component varsa kullan
- Tailwind: bg-white rounded-xl shadow-sm
- Primary renk: #10B981
```

### 5.2 DistributionCharts.tsx
**Cursor'a söyle:**
```
components/exam-detail/DistributionCharts.tsx oluştur.
- Recharts kullan (BarChart + PieChart)
- Sol: Net dağılım histogramı (0-20, 20-40...)
- Sağ: Donut chart (Doğru/Yanlış/Boş yüzdeleri)
- Her grafiğin köşesinde küçük PDF/Excel butonu
- Responsive: 2 kolon desktop, 1 kolon mobile
```

### 5.3 StudentRankingTable.tsx
**Cursor'a söyle:**
```
components/exam-detail/StudentRankingTable.tsx oluştur.
- TanStack Table kullan (projede varsa)
- Yatay scroll, sol 3 kolon sticky
- Filtre barı: search, class dropdown, type dropdown, sort
- Sıra kolonu: 1-2-3 için madalya emojisi
- Satır hover: bg-emerald-50
- Satır tıklama: expandedStudentId state güncelle
- Pagination: sayfa, sayfa boyutu seçimi
```

### 5.4 StudentAccordion.tsx
**Cursor'a söyle:**
```
components/exam-detail/StudentAccordion.tsx oluştur.
- Satırın altında açılan detay paneli
- Smooth animasyon (max-height transition)
- İçerik:
  1. Sol: Özet bilgiler (net, sıra, LGS tahmini)
  2. Sağ: Trend grafiği (varsa)
  3. Alt: Ders bazlı performans tablosu
  4. En alt: Güçlü/Zayıf alanlar (2 kolon)
- Fark renkleri: pozitif yeşil, negatif kırmızı
- Sağ üstte PDF butonu
```

### 5.5 ClassComparison.tsx
**Cursor'a söyle:**
```
components/exam-detail/ClassComparison.tsx oluştur.
- Sınıfları sıralayan tablo
- Her sınıf: öğrenci sayısı, ort.net, ders netleri
- Performans barı (görsel)
- En altta kurum ortalaması
```

### 5.6 ExamDetailHeader.tsx
**Cursor'a söyle:**
```
components/exam-detail/ExamDetailHeader.tsx oluştur.
- Sticky header
- Sol: Geri butonu (← Sınavlar)
- Orta: Sınav adı + tarih
- Sağ: Refresh, Excel, PDF, Ayarlar butonları
```

### 5.7 MatchWarningBanner.tsx
**Cursor'a söyle:**
```
components/exam-detail/MatchWarningBanner.tsx oluştur.
- Koşullu render (pendingCount > 0)
- Amber arka plan, uyarı ikonu
- "X öğrenci eşleşme bekliyor" mesajı
- "Eşleştirmeyi Tamamla" butonu
```

## 7.6 ADIM 6: Ana Sayfayı Birleştir

**Cursor'a söyle:**
```
app/admin/exam-intelligence/sinavlar/[examId]/page.tsx oluştur.
- Server component olarak başla
- examId'yi params'tan al
- useExamDetail hook ile veri çek
- Tüm component'leri sırayla yerleştir:
  1. ExamDetailHeader
  2. MatchWarningBanner (koşullu)
  3. SummaryCards
  4. DistributionCharts
  5. StudentRankingTable + StudentAccordion
  6. ClassComparison
- Loading ve error state'leri handle et
```

## 7.7 ADIM 7: Loading ve Error Sayfaları

**Cursor'a söyle:**
```
loading.tsx: Skeleton loader
- Özet kartları için 6 skeleton
- Tablo için satır skeleton'ları

error.tsx: Error boundary
- Hata mesajı
- "Tekrar Dene" butonu
- "Sınavlara Dön" linki
```

## 7.8 ADIM 8: Export Fonksiyonları

**Cursor'a söyle:**
```
lib/exam-detail/export-excel.ts oluştur.
- ExcelJS kullan
- Sheet 1: Genel Özet
- Sheet 2: Öğrenci Listesi (tüm kolonlar)
- Sheet 3: Sınıf Karşılaştırma
- Kurum logosu ve tarih header'da
```

**Cursor'a söyle:**
```
lib/exam-detail/export-pdf.ts oluştur.
- jsPDF veya @react-pdf/renderer kullan
- Kurum logosu header'da
- Tarih ve sayfa numarası footer'da
- Özet + tablo + grafikler
```

---

# 8. KONTROL LİSTESİ

## Cursor Her Adımda Kontrol Etsin:

### Dosya Yapısı
- [ ] `[examId]/page.tsx` oluşturuldu
- [ ] `[examId]/loading.tsx` oluşturuldu
- [ ] `[examId]/error.tsx` oluşturuldu
- [ ] `types/exam-detail.ts` oluşturuldu
- [ ] `components/exam-detail/` klasörü oluşturuldu
- [ ] `hooks/exam-detail/` klasörü oluşturuldu
- [ ] `lib/exam-detail/` klasörü oluşturuldu

### Veri Çekme
- [ ] Supabase'den exam verisi çekiliyor
- [ ] exam_sections join edildi
- [ ] exam_participants join edildi
- [ ] exam_results join edildi
- [ ] exam_result_sections join edildi
- [ ] persons ve students ilişkilendirildi

### İstatistikler
- [ ] Toplam katılımcı sayısı hesaplanıyor
- [ ] Asil/Misafir ayrımı yapılıyor
- [ ] Ortalama net hesaplanıyor
- [ ] En yüksek/düşük net bulunuyor
- [ ] Standart sapma hesaplanıyor
- [ ] Medyan hesaplanıyor
- [ ] Net dağılımı hesaplanıyor
- [ ] Sınıf ortalamaları hesaplanıyor

### UI Bileşenleri
- [ ] Header çalışıyor (geri butonu, export)
- [ ] Özet kartları gösteriliyor
- [ ] Match warning banner koşullu gösteriliyor
- [ ] Histogram grafiği çalışıyor
- [ ] Donut chart çalışıyor
- [ ] Öğrenci tablosu yatay scroll ile çalışıyor
- [ ] Filtreleme çalışıyor
- [ ] Sıralama çalışıyor
- [ ] Akordiyon açılıp kapanıyor
- [ ] Sınıf karşılaştırma tablosu çalışıyor

### Export
- [ ] Excel export çalışıyor
- [ ] PDF export çalışıyor
- [ ] Kurum logosu PDF'te görünüyor

### Stil & UX
- [ ] Primary renk #10B981 kullanılıyor
- [ ] Mevcut Card/Button/Badge component'leri kullanılıyor
- [ ] Responsive tasarım çalışıyor (mobile/tablet/desktop)
- [ ] Loading state var
- [ ] Error state var
- [ ] Boş veri state'i var

---

# 🚀 BAŞLANGIÇ KOMUTU

Terminal'de bu komutu çalıştır:
```bash
mkdir -p src/app/admin/exam-intelligence/sinavlar/\[examId\]
mkdir -p src/components/exam-detail
mkdir -p src/hooks/exam-detail
mkdir -p src/lib/exam-detail
touch src/types/exam-detail.ts
```

Sonra Cursor'a şunu söyle:
```
"Bu dokümanı oku ve ADIM 2'den başlayarak sırayla ilerle.
Her adımı tamamladığında bana bildir, sonraki adıma geçelim."
```

---

**Doküman Sonu**

Bu doküman AkademiHub Exam Intelligence Module'ün tam entegre mimarisini içerir.
Cursor bu dokümanı referans alarak adım adım inşa edecektir.