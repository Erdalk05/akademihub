# 🎓 ÖĞRENCİ YÖNETİM MODÜLÜ - TAM DOKÜMANTASYON
osyasını öğrenciler ksımına adım adım uygula ama dikkat et bizim projeyi bozmasın bizim projey göre entegre et 
> **Proje Kalbi:** Tüm sistem öğrenci için tasarlandı. Bu modül, bir öğrenci hakkında bilinmesi gereken HER ŞEYİ içerir.

## 📋 İÇİNDEKİLER

1. [Modül Yapısı](#modül-yapısı)
2. [Sayfa Tanımları](#sayfa-tanımları)
3. [Öğrenci Kayıt Süreci](#öğrenci-kayıt-süreci)
4. [Öğrenci Profil Sayfası](#öğrenci-profil-sayfası)
5. [Sözleşme Sistemi](#sözleşme-sistemi)
6. [Veri Modeli](#veri-modeli)
7. [AI Entegrasyonu](#ai-entegrasyonu)
8. [Adım Adım Uygulama](#adım-adım-uygulama)

---

## 📁 MODÜL YAPISI
```
/src/modules/students
├── /pages
│   ├── StudentListPage.tsx          # Ana liste (mevcut)
│   ├── StudentRegistrationPage.tsx  # Çok adımlı kayıt formu
│   ├── StudentProfilePage.tsx       # 360° öğrenci profili
│   └── StudentContractPage.tsx      # Sözleşme yönetimi
│
├── /components
│   ├── /registration
│   │   ├── RegistrationWizard.tsx        # Ana wizard wrapper
│   │   ├── Step1_PersonalInfo.tsx        # Kişisel bilgiler
│   │   ├── Step2_ParentInfo.tsx          # Veli bilgileri
│   │   ├── Step3_SiblingInfo.tsx         # Kardeş bilgileri
│   │   ├── Step4_EducationInfo.tsx       # Eğitim bilgileri
│   │   ├── Step5_HealthInfo.tsx          # Sağlık bilgileri
│   │   ├── Step6_DocumentsUpload.tsx     # Belge yükleme
│   │   ├── Step7_ContractPreview.tsx     # Sözleşme önizleme
│   │   └── Step8_PaymentPlan.tsx         # Ödeme planı
│   │
│   ├── /profile
│   │   ├── ProfileHeader.tsx             # Profil başlığı (foto, ad, sınıf)
│   │   ├── ProfileTabs.tsx               # Tab navigation
│   │   ├── GeneralTab.tsx                # Genel bilgiler
│   │   ├── AcademicTab.tsx               # Akademik bilgiler
│   │   │   ├── GradeHistory.tsx          # Not geçmişi
│   │   │   ├── ExamResults.tsx           # Sınav sonuçları
│   │   │   ├── AttendanceChart.tsx       # Devamsızlık grafiği
│   │   │   └── SubjectPerformance.tsx    # Ders bazlı performans
│   │   ├── FinanceTab.tsx                # Mali bilgiler
│   │   │   ├── PaymentHistory.tsx        # Ödeme geçmişi
│   │   │   ├── InstallmentPlan.tsx       # Taksit planı
│   │   │   ├── DebtSummary.tsx           # Borç özeti
│   │   │   └── QuickPayment.tsx          # Hızlı ödeme
│   │   ├── CommunicationTab.tsx          # İletişim geçmişi
│   │   │   ├── SMSHistory.tsx            # SMS kayıtları
│   │   │   ├── EmailHistory.tsx          # Email kayıtları
│   │   │   ├── PhoneCallLog.tsx          # Telefon kayıtları
│   │   │   └── QuickMessage.tsx          # Hızlı mesaj gönder
│   │   ├── GuidanceTab.tsx               # Rehberlik
│   │   │   ├── PsychologicalNotes.tsx    # Psikolojik notlar
│   │   │   ├── CareerTests.tsx           # Meslek testleri
│   │   │   ├── BehaviorTracking.tsx      # Davranış takibi
│   │   │   └── FamilyMeetings.tsx        # Veli görüşmeleri
│   │   ├── DocumentsTab.tsx              # Belgeler
│   │   │   ├── UploadedFiles.tsx         # Yüklenen dosyalar
│   │   │   ├── Certificates.tsx          # Sertifikalar
│   │   │   └── Reports.tsx               # Raporlar
│   │   └── TimelineTab.tsx               # Zaman çizelgesi
│   │       └── ActivityTimeline.tsx      # Tüm aktiviteler
│   │
│   ├── /list
│   │   ├── StudentTable.tsx              # Ana tablo
│   │   ├── StudentCard.tsx               # Kart görünümü
│   │   ├── StudentFilters.tsx            # Filtreler
│   │   ├── QuickActions.tsx              # Hızlı işlemler
│   │   └── BulkOperations.tsx            # Toplu işlemler
│   │
│   ├── /contract
│   │   ├── ContractTemplate.tsx          # Sözleşme şablonu
│   │   ├── ContractPreview.tsx           # Önizleme
│   │   ├── SignaturePad.tsx              # İmza alanı
│   │   └── ContractPDF.tsx               # PDF oluşturma
│   │
│   └── /ai
│       ├── AIStudentInsights.tsx         # AI öğrenci analizi
│       ├── AIRecommendations.tsx         # AI önerileri
│       ├── AIRiskAssessment.tsx          # Risk değerlendirmesi
│       └── AIParentMessage.tsx           # Otomatik veli mesajı
│
├── /hooks
│   ├── useStudents.ts                    # Öğrenci CRUD
│   ├── useStudentForm.ts                 # Form yönetimi
│   ├── useStudentProfile.ts              # Profil data
│   ├── useStudentContract.ts             # Sözleşme işlemleri
│   └── useStudentAI.ts                   # AI işlemleri
│
└── /utils
    ├── studentHelpers.ts                 # Yardımcı fonksiyonlar
    ├── contractGenerator.ts              # Sözleşme oluşturma
    └── studentValidation.ts              # Validasyon kuralları
```

---

## 📄 SAYFA TANIMLARI

### 1. StudentListPage.tsx (Ana Liste)

**Dosya Yolu:** `src/modules/students/pages/StudentListPage.tsx`

**Özellikler:**
- ✅ Tablo ve kart görünümü toggle
- ✅ Gelişmiş filtreleme (sınıf, durum, borç, risk)
- ✅ Arama (ad, TC, öğrenci no, veli telefonu)
- ✅ Sıralama (ad, sınıf, tarih, borç)
- ✅ Pagination (10/20/50/100 kayıt)
- ✅ Toplu işlemler (SMS, email, export)
- ✅ Hızlı aksiyon menüsü (ödeme al, profil görüntüle, ara)
- ✅ Export (Excel, PDF, CSV)

**Mock Verisi:**
```typescript
interface StudentListItem {
  id: string;
  ogrenciNo: string;
  ad: string;
  soyad: string;
  tcKimlik: string;
  sinif: string;
  sube: string;
  durum: 'Aktif' | 'İzinli' | 'Pasif' | 'Mezun' | 'Ayrıldı';
  kayitTarihi: Date;
  fotoUrl?: string;
  
  // Özet bilgiler
  toplamBorc: number;
  gecikmisTaksit: number;
  genelOrtalama: number;
  devamsizlikGunu: number;
  riskDurumu: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
  
  // Veli iletişim
  veliTelefon: string;
  veliEmail: string;
  
  // Son aktivite
  sonOdeme?: Date;
  sonDevamsizlik?: Date;
  sonSinav?: Date;
}
```

---

### 2. StudentRegistrationPage.tsx (Kayıt Formu)

**Dosya Yolu:** `src/modules/students/pages/StudentRegistrationPage.tsx`

**8 Adımlı Wizard:**

#### ADIM 1: Kişisel Bilgiler
```typescript
interface Step1Data {
  // Temel bilgiler
  ad: string;                    // Zorunlu
  soyad: string;                 // Zorunlu
  tcKimlik: string;              // 11 hane, algoritma kontrolü
  dogumTarihi: Date;             // Zorunlu
  dogumYeri: string;
  cinsiyet: 'Erkek' | 'Kız';     // Zorunlu
  kanGrubu: BloodType;
  uyruk: string;                 // Varsayılan: T.C.
  
  // İletişim
  cepTelefonu?: string;          // Varsa (lise için)
  email?: string;                // Varsa
  
  // Adres
  ilce: string;
  il: string;
  mahalle: string;
  adres: string;
  postaKodu?: string;
  
  // Fotoğraf
  fotoUrl?: string;              // Upload edilecek
}

// Validasyon Kuralları:
- TC Kimlik algoritması kontrolü (mod 10, mod 11)
- Ad/Soyad min 2 karakter, sadece harf
- Doğum tarihi: 3-18 yaş arası
- Fotoğraf: max 2MB, jpg/png
```

#### ADIM 2: Veli Bilgileri
```typescript
interface Step2Data {
  anne: {
    ad: string;              // Zorunlu
    soyad: string;
    tcKimlik: string;
    dogumTarihi: Date;
    meslek: string;
    cepTelefonu: string;     // Zorunlu
    email?: string;
    egitimDurumu: string;
    aylikGelir?: number;
  };
  
  baba: {
    ad: string;              // Zorunlu
    soyad: string;
    tcKimlik: string;
    dogumTarihi: Date;
    meslek: string;
    cepTelefonu: string;     // Zorunlu
    email?: string;
    egitimDurumu: string;
    aylikGelir?: number;
  };
  
  // Vasi bilgisi (ihtiyaç varsa)
  vasi?: {
    ad: string;
    soyad: string;
    yakinlik: string;
    telefon: string;
  };
  
  // Acil durum
  acilDurumKisi: 'Anne' | 'Baba' | 'Vasi' | 'Diğer';
  acilDurumTelefon: string;   // Zorunlu
  
  // İletişim tercihi
  iletisimTercihi: 'SMS' | 'Email' | 'Telefon' | 'Hepsi';
}
```

#### ADIM 3: Kardeş Bilgileri
```typescript
interface Step3Data {
  kardesVarMi: boolean;
  
  kardesler: Array<{
    ad: string;
    soyad: string;
    dogumTarihi: Date;
    okuldaMi: boolean;           // Bu okulda mı?
    ogrenciNo?: string;          // Okuldaysa
    sinif?: string;              // Okuldaysa
    indirimOrani?: number;       // Kardeş indirimi
  }>;
  
  // Kardeş indirimi hesaplama
  kardesIndirimUygulansınMi: boolean;
}
```

#### ADIM 4: Eğitim Bilgileri
```typescript
interface Step4Data {
  // Sınıf yerleştirme
  sinif: string;                 // 1-12 arası
  sube?: string;                 // Şube seçimi (otomatik önerilir)
  
  // Önceki okul
  oncekiOkul?: {
    ad: string;
    tur: 'Devlet' | 'Özel';
    ilce: string;
    il: string;
    sonSinif: string;
    notOrtalamasi?: number;
    ayrilmaNedeni?: string;
  };
  
  // Nakil belgesi
  nakilBelgesiVarMi: boolean;
  nakilBelgesiUrl?: string;
  
  // Seviye belirleme
  seviyeTestiYapilsinMi: boolean;
  
  // Ders seçimi (lise için)
  dersSecimi?: {
    dil: 'İngilizce' | 'Almanca' | 'Fransızca';
    secimliler: string[];        // Seçmeli dersler
  };
}
```

#### ADIM 5: Sağlık Bilgileri
```typescript
interface Step5Data {
  // Genel sağlık
  saglikDurumu: 'İyi' | 'Kronik Hastalık' | 'Özel Durum';
  
  // Kronik hastalıklar
  kronikHastaliklar: string[];  // ["Astım", "Diyabet" vb.]
  
  // Alerjiler
  alerjiler: string[];          // ["Polen", "Fıstık" vb.]
  
  // İlaçlar
  kullanilanIlaclar: Array<{
    ad: string;
    doz: string;
    kulanimSaati: string[];     // ["08:00", "20:00"]
  }>;
  
  // Aşı bilgileri
  asiKartiVarMi: boolean;
  asiKartiUrl?: string;
  
  // Acil durum bilgileri
  acilDurumNotu?: string;       // Özel durumlar
  
  // Özel eğitim ihtiyacı
  ozelEgitimIhtiyaci: boolean;
  ozelEgitimDetay?: string;
  
  // Psikolojik destek
  psikolojikDestekAliyorMu: boolean;
  psikolojikDestekDetay?: string;
}
```

#### ADIM 6: Belge Yükleme
```typescript
interface Step6Data {
  belgeler: {
    // Zorunlu belgeler
    nufusCuzdani: {
      url: string;
      yuklemeTarihi: Date;
      onayDurumu: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
    };
    
    ikametgah: {
      url: string;
      yuklemeTarihi: Date;
      onayDurumu: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
    };
    
    saglikRaporu: {
      url: string;
      yuklemeTarihi: Date;
      onayDurumu: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
    };
    
    // Opsiyonel belgeler
    nakilBelgesi?: {
      url: string;
      yuklemeTarihi: Date;
    };
    
    asiKarti?: {
      url: string;
      yuklemeTarihi: Date;
    };
    
    velininKimlik?: {
      url: string;
      yuklemeTarihi: Date;
    };
    
    // Diğer
    digerBelgeler?: Array<{
      ad: string;
      url: string;
      kategori: string;
      yuklemeTarihi: Date;
    }>;
  };
}

// Upload kuralları:
- Max dosya boyutu: 5MB
- Kabul edilen formatlar: PDF, JPG, PNG
- Çoklu dosya yükleme desteklenir
```

#### ADIM 7: Sözleşme Önizleme & İmza
```typescript
interface Step7Data {
  // Sözleşme bilgileri
  sozlesme: {
    sablon: 'Standart' | 'İndirimli' | 'Özel';
    olusturmaTarihi: Date;
    gecerlilikTarihi: Date;
    sozlesmeNo: string;          // Otomatik oluşturulur
    
    // Sözleşme içeriği (dinamik)
    maddeler: Array<{
      no: number;
      baslik: string;
      icerik: string;
      zorunlu: boolean;
    }>;
    
    // KVKK onayı
    kvkkOnay: boolean;           // Zorunlu
    kvkkOnayTarihi?: Date;
    
    // Açık rıza metni
    acikRiza: boolean;           // Zorunlu
    acikRizaTarihi?: Date;
  };
  
  // İmzalar
  imzalar: {
    veli: {
      ad: string;
      imzaUrl?: string;          // Canvas'tan alınacak
      imzaTarihi?: Date;
      ipAdresi?: string;
    };
    
    yetkili: {
      ad: string;
      imzaUrl?: string;
      imzaTarihi?: Date;
    };
  };
  
  // PDF
  sozlesmePdfUrl?: string;       // İmzalı sözleşme PDF
}

// Sözleşme şablonu dinamik oluşturulacak:
- Öğrenci bilgileri otomatik yerleştirilecek
- Ücret bilgisi yerleştirilecek
- KVKK metinleri eklenecek
- İmza alanları hazırlanacak
```

#### ADIM 8: Ödeme Planı
```typescript
interface Step8Data {
  // Ücret bilgileri
  ucret: {
    yillikTutar: number;         // Brüt tutar
    indirim: {
      kardes: number;            // %
      erkenKayit: number;        // %
      basari: number;            // %
      ozel: number;              // %
      toplam: number;            // Toplam indirim %
    };
    netTutar: number;            // İndirimli tutar
  };
  
  // Ödeme planı
  odemePlani: {
    tip: 'Peşin' | 'Taksitli';
    
    // Peşin
    pesinOdemeMi: boolean;
    pesinIndirim?: number;       // Peşin indirimi %
    pesinTutar?: number;
    
    // Taksitli
    taksitSayisi?: number;       // 2, 4, 8, 10, 12
    taksitTutari?: number;
    ilkOdemeTarihi?: Date;
    
    // Taksit detayları
    taksitler?: Array<{
      no: number;
      tutar: number;
      vadeTarihi: Date;
      odendiMi: boolean;
      odemeTarihi?: Date;
    }>;
  };
  
  // İlk ödeme (kayıt parası)
  ilkOdeme: {
    tutar: number;
    odemeTipi: 'Nakit' | 'Kredi Kartı' | 'Havale' | 'EFT';
    odemeTarihi: Date;
    makbuzNo: string;
    tahsilatYapan: string;
  };
  
  // AI önerisi
  aiOnerisi?: {
    onerilenPlan: string;
    neden: string;
    benzerProfiller: number;     // % kaç öğrenci aynı planı seçti
  };
}

// Hesaplama Mantığı:
1. Yıllık ücret: ₺120,000
2. İndirimler:
   - Kardeş indirimi: %10
   - Erken kayıt: %5
   - Toplam indirim: %15
3. Net tutar: ₺102,000
4. Peşin ödeme indirimi: %8
5. Peşin tutar: ₺93,840
6. Taksitli: 8 taksit × ₺12,750 = ₺102,000
```

---

### 3. StudentProfilePage.tsx (360° Profil)

**Dosya Yolu:** `src/modules/students/pages/StudentProfilePage.tsx`

**Yapı:**
```typescript
// URL: /students/:id
// Örnek: /students/STU-2025-0001

interface StudentProfile {
  // Header (Sabit - Scroll etse de görünür)
  header: {
    fotoUrl: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
    sinif: string;
    durum: Status;
    
    // Quick actions
    actions: [
      'Ödeme Al',
      'SMS Gönder',
      'Veli Ara',
      'Rapor Oluştur',
      'Düzenle'
    ];
    
    // Özet kartlar
    summary: {
      genelOrtalama: number;
      devamsizlik: number;
      kalanBorc: number;
      riskSkoru: number;
    };
  };
  
  // Tabs
  tabs: [
    'Genel',
    'Akademik',
    'Finans',
    'İletişim',
    'Rehberlik',
    'Belgeler',
    'Zaman Çizelgesi'
  ];
}
```

#### TAB 1: Genel Bilgiler

**Bileşenler:**

1. **Kişisel Bilgiler Kartı**
```typescript
- TC Kimlik, Doğum Tarihi, Doğum Yeri
- Cinsiyet, Kan Grubu, Uyruk
- Cep Telefonu, Email
- Adres (tam)
- Fotoğraf güncelleme butonu
```

2. **Veli Bilgileri Kartı**
```typescript
- Anne: Ad, Telefon, Email, Meslek
- Baba: Ad, Telefon, Email, Meslek
- Acil durum kişisi
- Hızlı arama butonları
- Mesaj gönder butonları
```

3. **Kardeş Bilgileri Kartı**
```typescript
- Kardeş listesi
- Okuldaki kardeşlere link
- Kardeş indirimi durumu
```

4. **Sağlık Bilgileri Kartı**
```typescript
- Genel durum
- Kronik hastalıklar
- Alerjiler
- Kullanılan ilaçlar
- Özel notlar
- Acil durum bilgileri
```

#### TAB 2: Akademik Bilgiler

**Alt Bölümler:**

1. **Not Ortalamaları**
```typescript
// Kartlar
- Genel Ortalama (büyük, renkli)
- Bu dönem ortalaması
- Geçen dönem ortalaması
- Trend göstergesi (↗️ ↘️)

// Grafik
- Dönemlik ortalama line chart
- Son 4 dönem
```

2. **Ders Bazlı Performans**
```typescript
// Tablo
Ders       | 1.Yazılı | 2.Yazılı | Sözlü | Proje | Ortalama | Durum
-----------|----------|----------|-------|-------|----------|-------
Matematik  | 85       | 90       | 88    | 95    | 89.5     | ✅ İyi
Türkçe     | 78       | 82       | 80    | 85    | 81.25    | ⚠️ Orta
Fen        | 92       | 88       | 90    | 95    | 91.25    | ✅ Mükemmel

// Her ders için radar chart
```

3. **Sınav Sonuçları**
```typescript
// Liste (Accordion)
Sınav Adı: Matematik 1. Yazılı
Tarih: 15 Ocak 2025
Puan: 85/100
Sınıf Ortalaması: 72
Sıralama: 5/35
Yanlış Konular: [Üslü Sayılar, Köklü Sayılar]
AI Önerisi: "Üslü sayılarda çalışma yapılmalı"
```

4. **Devamsızlık Takibi**
```typescript
// Özet kartlar
- Toplam Devamsızlık: 5 gün
- Özürlü: 3 gün
- Özürsüz: 2 gün
- Devamsızlık Oranı: %2.5

//달력 Takvim görünümü
- Devamsızlık günleri işaretli
- Hover: Sebep görünsün

// Grafik
- Aylık devamsızlık bar chart
```

5. **Ödev Takibi**
```typescript
// Durum kartları
- Bekleyen Ödevler: 3
- Tamamlanan: 45
- Geciken: 2
- Tamamlama Oranı: %93

// Liste
Ders       | Ödev Adı        | Veriliş | Teslim   | Durum
-----------|-----------------|---------|----------|----------
Matematik  | Sayfa 45-50     | 20 Oca  | 25 Oca   | ⏳ Bekliyor
Türkçe     | Kompozisyon     | 18 Oca  | 22 Oca   | ✅ Teslim Edildi
Fen        | Deney Raporu    | 15 Oca  | 20 Oca   | ⚠️ Gecikti
```

#### TAB 3: Finans

**Bileşenler:**

1. **Borç Özeti**
```typescript
// Büyük kartlar
┌─────────────────────────────┐
│  Toplam Borç: ₺102,000      │
│  Ödenen: ₺50,000 (49%)      │
│  Kalan: ₺52,000             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Progress bar %49           │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Gecikmiş Taksit: 0         │
│  ✅ Ödeme durumu iyi        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Sonraki Ödeme              │
│  ₺12,750                    │
│  Vade: 5 gün sonra          │
│  [Ödeme Al] butonu          │
└─────────────────────────────┘
```

2. **Taksit Planı**
```typescript
// Tablo
Taksit | Tutar    | Vade Tarihi | Ödeme Tarihi | Durum
-------|----------|-------------|--------------|------------
1      | ₺12,750  | 15 Eyl 2024 | 14 Eyl 2024  | ✅ Ödendi
2      | ₺12,750  | 15 Eki 2024 | 13 Eki 2024  | ✅ Ödendi
3      | ₺12,750  | 15 Kas 2024 | 15 Kas 2024  | ✅ Ödendi
4      | ₺12,750  | 15 Ara 2024 | 12 Ara 2024  | ✅ Ödendi
5      | ₺12,750  | 15 Oca 2025 | -            | ⏳ Bekliyor
6      | ₺12,750  | 15 Şub 2025 | -            | 📅 Gelecek
7      | ₺12,750  | 15 Mar 2025 | -            | 📅 Gelecek
8      | ₺12,750  | 15 Nis 2025 | -            | 📅 Gelecek

// Her satırda:
- Ödendi ise: Yeşil, makbuz görüntüle butonu
- Bekliyor ise: Sarı, ödeme al butonu
- Geçmiş ise: Kırmızı, acil ödeme al butonu
```

3. **Ödeme Geçmişi**
```typescript
// Timeline görünümü
📅 15 Ara 2024 - ₺12,750
   💳 Kredi Kartı
   👤 Zeynep Hanım (Anne)
   📄 Makbuz: #2024-1245
   
📅 15 Kas 2024 - ₺12,750
   💵 Nakit
   👤 Ahmet Bey (Baba)
   📄 Makbuz: #2024-1156

// Filtreleme:
- Tarih aralığı
- Ödeme
tipi
- Ödeme yapan kişi
```

4. **Hızlı Ödeme Alma**
```typescript
// Inline form
┌────────────────────────────────────────┐
│  Hızlı Ödeme Al                        │
│                                        │
│  Tutar: [₺12,750] (Önerilen taksit)  │
│  Ödeme Tipi: [Kredi Kartı ▼]         │
│  Açıklama: [4. Taksit ödemesi]       │
│                                        │
│  [💳 Ödemeyi Kaydet] [📄 Makbuz]     │
└────────────────────────────────────────┘

// Ödeme sonrası:
- Toast notification
- Makbuz PDF otomatik oluştur
- Veli'ye SMS gönder
- Ödeme geçmişine ekle
- Taksit tablosunu güncelle
```

5. **AI Finans Önerisi**
```typescript
// Kart
┌────────────────────────────────────────┐
│  💡 AI Önerisi                         │
│                                        │
│  Bu öğrencinin ödeme geçmişi çok iyi. │
│  Son 4 taksit zamanında ödendi.       │
│                                        │
│  Öneri: Kalan taksitler için erken    │
│  ödeme indirimi (%5) teklif edilebilir│
│                                        │
│  Tahmini kazanç: ₺6,375 erken tahsilat│
│                                        │
│  [📧 Veliye Teklif Gönder]            │
└────────────────────────────────────────┘
```

#### TAB 4: İletişim

**Bileşenler:**

1. **İletişim Özeti**
```typescript
// Stat kartları
┌─────────────────┬─────────────────┬─────────────────┐
│  📱 SMS         │  📧 Email       │  📞 Telefon     │
│  45 gönderildi  │  12 gönderildi  │  8 görüşme      │
│  Son: 2 gün önce│  Son: 1 hafta   │  Son: 3 gün     │
└─────────────────┴─────────────────┴─────────────────┘
```

2. **İletişim Geçmişi Timeline**
```typescript
// Timeline (Tüm iletişim kayıtları)

📅 20 Ocak 2025, 14:30
📱 SMS Gönderildi
   Kime: Anne (0532 xxx xx xx)
   İçerik: "Sayın veli, öğrenciniz Ece'nin bu hafta matematik dersinde çok başarılı..."
   Durum: ✅ İletildi
   [Yanıtı Gör] [Tekrar Gönder]

📅 18 Ocak 2025, 10:15
📞 Telefon Görüşmesi
   Kişi: Baba (0533 xxx xx xx)
   Süre: 5 dakika
   Konu: Sınav sonuçları hakkında
   Notlar: Veli memnun, teşekkür etti
   Görüşen: Ayşe Öğretmen
   [Notu Düzenle]

📅 15 Ocak 2025, 09:00
📧 Email Gönderildi
   Kime: anne@email.com
   Konu: Aylık Gelişim Raporu
   Durum: ✅ Okundu (16 Ocak, 11:45)
   [Email'i Görüntüle]

📅 10 Ocak 2025, 16:00
🏫 Yüz Yüze Görüşme
   Katılımcılar: Anne, Baba, Rehber Öğretmen
   Süre: 30 dakika
   Konu: Kariyer planlaması
   Notlar: Üniversite tercihleri konuşuldu...
   [Detaylı Not] [PDF İndir]
```

3. **Hızlı Mesaj Gönder**
```typescript
// Inline mesaj formu
┌────────────────────────────────────────┐
│  Hızlı Mesaj                           │
│                                        │
│  Alıcı: [✓ Anne] [✓ Baba] [ ] Öğrenci│
│  Tip: [📱 SMS ▼] [📧 Email]          │
│                                        │
│  Şablon: [Seçiniz ▼]                  │
│  - Ödeme Hatırlatma                   │
│  - Başarı Tebriği                     │
│  - Devamsızlık Uyarısı                │
│  - Toplantı Daveti                    │
│  - Özel Mesaj                         │
│                                        │
│  Mesaj:                               │
│  ┌──────────────────────────────────┐ │
│  │ Sayın Zeynep Hanım,              │ │
│  │                                  │ │
│  │ Öğrenciniz Ece Kızıroğlu'nun    │ │
│  │ ...                              │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [✨ AI ile Geliştir] [📤 Gönder]    │
└────────────────────────────────────────┘

// AI ile Geliştir butonu:
- Mesajı daha profesyonel yap
- Kişiselleştir (öğrenci başarılarını ekle)
- Dil/ton ayarla (resmi, samimi, teşvik edici)
```

4. **Toplu İşlemler**
```typescript
// Toplu SMS/Email gönderimi
┌────────────────────────────────────────┐
│  Toplu Mesaj Gönder                    │
│                                        │
│  Filtreler:                           │
│  ☑ Borcu olan veliler                 │
│  ☑ Bu hafta devamsızlık yapanlar      │
│  ☐ Sınav sonucu düşenler              │
│                                        │
│  Etkilenen: 15 veli                   │
│                                        │
│  [Mesajı Özelleştir] [Gönder]        │
└────────────────────────────────────────┘
```

5. **İletişim İstatistikleri**
```typescript
// Grafikler
- Aylık iletişim sayısı (line chart)
- İletişim tipi dağılımı (pie chart)
- Yanıt oranı (bar chart)
- En aktif saatler (heatmap)
```

#### TAB 5: Rehberlik

**Bileşenler:**

1. **Psikolojik Değerlendirme**
```typescript
// Özet kart
┌────────────────────────────────────────┐
│  🧠 Psikolojik Durum                   │
│                                        │
│  Genel Durum: İyi                     │
│  Risk Seviyesi: Düşük                 │
│  Son Değerlendirme: 15 Aralık 2024    │
│                                        │
│  [Yeni Görüşme Notu Ekle]             │
└────────────────────────────────────────┘

// Görüşme kayıtları
📅 15 Aralık 2024
👨‍⚕️ Psikolog: Dr. Mehmet Yılmaz
⏱️ Süre: 45 dakika
📝 Özet: Öğrenci sosyal uyum açısından çok iyi durumda...
🎯 Öneriler:
   - Grup çalışmalarına teşvik edilmeli
   - Kendine güven artırılmalı
📄 [Tam Rapor] [PDF İndir]
```

2. **Davranış Takibi**
```typescript
// Davranış puanı
┌────────────────────────────────────────┐
│  Davranış Puanı: 85/100                │
│  ⭐⭐⭐⭐☆                              │
│                                        │
│  Güçlü Yönler:                        │
│  ✅ Saygılı                           │
│  ✅ Çalışkan                          │
│  ✅ İşbirlikçi                        │
│                                        │
│  Geliştirilmesi Gerekenler:           │
│  ⚠️ Zaman yönetimi                    │
│  ⚠️ Özgüven                           │
└────────────────────────────────────────┘

// Davranış kayıtları
📅 18 Ocak 2025 - Olumlu Davranış
   ✅ Arkadaşına yardım etti
   Öğretmen: Ayşe Demir
   
📅 10 Ocak 2025 - Gelişim Alanı
   ⚠️ Ödev gecikmesi
   Öğretmen: Mehmet Yılmaz
   Alınan Aksiyon: Veli görüşmesi yapıldı
```

3. **Kariyer Testleri**
```typescript
// Test sonuçları
┌────────────────────────────────────────┐
│  Mesleki Yönelim Testi                 │
│  Tarih: 5 Ocak 2025                    │
│                                        │
│  Sonuçlar:                            │
│  1. Mühendislik (%85)                 │
│  2. Hukuk (%78)                       │
│  3. Mimarlık (%72)                    │
│                                        │
│  Yetenek Alanları:                    │
│  • Sayısal zeka                       │
│  • Problem çözme                      │
│  • Mantıksal düşünme                  │
│                                        │
│  [Detaylı Rapor] [Veli ile Paylaş]   │
└────────────────────────────────────────┘

// Diğer testler
- Holland Meslek Tercihi Testi
- Kişilik Envanteri
- Çoklu Zeka Testi
- İlgi Envanteri
```

4. **Veli Görüşmeleri**
```typescript
// Görüşme kayıtları
📅 10 Ocak 2025, 14:00-14:30
👥 Katılımcılar: Anne, Baba, Rehber Öğretmen
📍 Konum: Rehberlik Odası

Gündem:
• Üniversite tercihleri
• Dershane ihtiyacı
• Yaz okulu planlaması

Kararlar:
☑ Matematik için destek programına katılacak
☑ Mühendislik fakülteleri gezilecek
☐ Yaz okuluna karar verilecek

Notlar:
Veli çok ilgili, öğrencinin başarısından memnun...

Sonraki Görüşme: 10 Şubat 2025

[Düzenle] [PDF İndir] [Veliye Mail At]
```

5. **Özel Destek Programları**
```typescript
// Katıldığı programlar
┌────────────────────────────────────────┐
│  Bireysel Destek Programı              │
│  Başlangıç: 15 Eylül 2024             │
│  Süre: 1 yıl                          │
│  Durum: Aktif                         │
│                                        │
│  İlerleme: ━━━━━━━━━━━━━━━░ %60      │
│                                        │
│  Hedefler:                            │
│  ✅ Matematik notunu 80'e çıkar       │
│  ⏳ Özgüven artırma                   │
│  ⏳ Zaman yönetimi                    │
│                                        │
│  [İlerleme Raporu] [Güncelle]         │
└────────────────────────────────────────┘
```

6. **AI Rehberlik Önerileri**
```typescript
┌────────────────────────────────────────┐
│  🤖 AI Analiz ve Öneriler              │
│                                        │
│  Risk Değerlendirmesi:                │
│  • Akademik Risk: ✅ Düşük            │
│  • Sosyal Risk: ✅ Düşük              │
│  • Psikolojik Risk: ✅ Düşük          │
│                                        │
│  Öneriler:                            │
│  1. Öğrenci liderlik programlarına    │
│     aday gösterilebilir               │
│  2. STEM kulübüne yönlendirilebilir   │
│  3. Akran danışmanlığı verebilir      │
│                                        │
│  Tahmin:                              │
│  Bu öğrencinin üniversite sınavında   │
│  başarılı olma ihtimali: %92          │
│                                        │
│  [Detaylı AI Raporu]                  │
└────────────────────────────────────────┘
```

#### TAB 6: Belgeler

**Bileşenler:**

1. **Belge Kategorileri**
```typescript
// Kategorili görünüm
┌─────────────────────────────────────────┐
│  📁 Kimlik Belgeleri (3)                │
│  ├─ 📄 Nüfus Cüzdanı (PDF, 2MB)        │
│  ├─ 📄 İkametgah (PDF, 1.5MB)          │
│  └─ 📄 Aile Nüfus Kayıt Örneği (PDF)   │
│                                         │
│  📁 Sağlık Belgeleri (2)                │
│  ├─ 📄 Sağlık Raporu (PDF, 3MB)        │
│  └─ 📄 Aşı Kartı (JPG, 500KB)          │
│                                         │
│  📁 Eğitim Belgeleri (4)                │
│  ├─ 📄 Nakil Belgesi (PDF, 2MB)        │
│  ├─ 📄 Diploma (PDF, 1MB)              │
│  ├─ 📄 Not Durum Belgesi (PDF)         │
│  └─ 📄 Davranış Belgesi (PDF)          │
│                                         │
│  📁 Sözleşmeler (1)                     │
│  └─ 📄 Kayıt Sözleşmesi (İmzalı)       │
│                                         │
│  📁 Sertifikalar (5)                    │
│  ├─ 🏆 Matematik Yarışması - 1.lik     │
│  ├─ 🏆 Bilim Fuarı - Birincilik        │
│  ├─ 🎨 Resim Yarışması - İkincilik     │
│  ├─ 📜 Cambridge Certificate           │
│  └─ 📜 STEM Programı Sertifikası       │
│                                         │
│  [📤 Yeni Belge Yükle]                 │
└─────────────────────────────────────────┘

// Her belge için:
- Önizleme (thumbnail)
- İndir butonu
- Sil butonu
- Paylaş butonu (veliye email at)
- Düzenle butonu
```

2. **Belge Upload**
```typescript
// Drag & drop upload
┌─────────────────────────────────────────┐
│  Dosyayı sürükleyip bırakın veya       │
│                                         │
│       📂                                │
│                                         │
│  [Dosya Seç]                            │
│                                         │
│  Kategori: [Sağlık Belgeleri ▼]       │
│  Açıklama: [___________________]        │
│                                         │
│  Kabul edilen formatlar:                │
│  PDF, JPG, PNG, DOCX                    │
│  Maksimum boyut: 10MB                   │
└─────────────────────────────────────────┘
```

3. **Belge Onay Sistemi**
```typescript
// Onay bekleyen belgeler
┌─────────────────────────────────────────┐
│  ⏳ Onay Bekleyen Belgeler (2)          │
│                                         │
│  📄 Sağlık Raporu (Güncel)              │
│     Yükleyen: Zeynep Hanım (Anne)       │
│     Tarih: 20 Ocak 2025, 14:30         │
│     [👁️ Görüntüle] [✅ Onayla] [❌ Reddet]│
│                                         │
│  📄 Aşı Kartı (Güncellenmiş)            │
│     Yükleyen: Admin                     │
│     Tarih: 18 Ocak 2025, 10:15         │
│     [👁️ Görüntüle] [✅ Onayla] [❌ Reddet]│
└─────────────────────────────────────────┘
```

#### TAB 7: Zaman Çizelgesi (Timeline)

**Tüm Aktivitelerin Kronolojik Görünümü:**

```typescript
// Filtreleme
[Tümü ▼] [Akademik] [Finans] [İletişim] [Rehberlik] [Belgeler]
[Tarih: Son 30 gün ▼]

// Timeline
═══════════════════════════════════════

📅 20 Ocak 2025, 14:30
📱 SMS GÖNDERİLDİ
   Kime: Anne
   Konu: Haftalık başarı raporu
   Durum: ✅ İletildi

─────────────────────────────────────

📅 20 Ocak 2025, 10:00
📝 SINAV GİRİLDİ
   Sınav: Matematik 2. Yazılı
   Puan: 92/100
   Sınıf Ortalaması: 75
   Sıralama: 3/35

─────────────────────────────────────

📅 18 Ocak 2025, 16:45
🏫 VELİ GÖRÜŞMESİ
   Katılımcı: Anne, Rehber Öğretmen
   Süre: 30 dakika
   Konu: Üniversite tercihleri

─────────────────────────────────────

📅 15 Ocak 2025, 09:00
💰 ÖDEME ALINDI
   Tutar: ₺12,750
   Tip: Kredi Kartı
   Ödemeyi Yapan: Ahmet Bey (Baba)
   Makbuz: #2024-1567

─────────────────────────────────────

📅 10 Ocak 2025, 14:00
📄 BELGE YÜKLENDİ
   Belge: Sağlık Raporu (Güncel)
   Yükleyen: Anne
   Durum: ⏳ Onay bekliyor

─────────────────────────────────────

📅 8 Ocak 2025, 11:30
📝 NOT GİRİLDİ
   Ders: Fizik
   Sınav: Sözlü
   Not: 88/100

─────────────────────────────────────

📅 5 Ocak 2025, 08:00
⚠️ DEVAMSIZLIK KAYDI
   Tip: Özürlü
   Sebep: Sağlık raporu
   Süre: 1 gün

═══════════════════════════════════════

[Daha Fazla Yükle]
```

---

## 📋 VERİ MODELİ (TAM)

### Student Entity (Tam Yapı)

```typescript
interface Student extends BaseEntity {
  // ==================== KİŞİSEL BİLGİLER ====================
  ogrenciNo: string;                    // Otomatik: STU-2025-0001
  tcKimlik: string;                     // 11 hane
  ad: string;
  soyad: string;
  dogumTarihi: Date;
  dogumYeri: string;
  cinsiyet: 'Erkek' | 'Kız';
  kanGrubu: BloodType;
  uyruk: string;                        // Varsayılan: T.C.
  fotoUrl?: string;
  
  // İletişim
  cepTelefonu?: string;
  email?: string;
  
  // Adres
  adres: {
    il: string;
    ilce: string;
    mahalle: string;
    sokak: string;
    binaNo: string;
    daireNo?: string;
    postaKodu?: string;
    tamAdres: string;
  };
  
  // ==================== EĞİTİM BİLGİLERİ ====================
  sinif: string;                        // 1-12
  sube: string;                         // A, B, C...
  okulNo: string;                       // Okul öğrenci numarası
  durum: 'Aktif' | 'İzinli' | 'Pasif' | 'Mezun' | 'Ayrıldı';
  kayitTarihi: Date;
  mezuniyetTarihi?: Date;
  
  // Önceki okul
  oncekiOkul?: {
    ad: string;
    tur: 'Devlet' | 'Özel';
    il: string;
    ilce: string;
    sonSinif: string;
    mezuniyetNotu?: number;
    ayrilmaNedeni?: string;
  };
  
  // Ders seçimi (lise için)
  dersSecimi?: {
    dil: 'İngilizce' | 'Almanca' | 'Fransızca';
    secimliler: string[];
  };
  
  // ==================== VELİ BİLGİLERİ ====================
  veli: {
    anne: VeliDetay;
    baba: VeliDetay;
    vasi?: VeliDetay;
    
    // Acil durum
    acilDurumKisi: 'Anne' | 'Baba' | 'Vasi' | 'Diğer';
    acilDurumTelefon: string;
    acilDurumKisiAdi?: string;
    
    // İletişim tercihi
    iletisimTercihi: 'SMS' | 'Email' | 'Telefon' | 'Hepsi';
    iletisimDili: 'Türkçe' | 'İngilizce';
  };
  
  // ==================== KARDEŞ BİLGİLERİ ====================
  kardesler: Array<{
    id: string;
    ad: string;
    soyad: string;
    dogumTarihi: Date;
    okuldaMi: boolean;
    ogrenciId?: string;                 // Okuldaysa link
    sinif?: string;
    indirimOrani?: number;
  }>;
  
  // ==================== SAĞLIK BİLGİLERİ ====================
  saglik: {
    genel Durum: 'İyi' | 'Kronik Hastalık' | 'Özel Durum';
    kronikHastaliklar: string[];
    alerjiler: string[];
    kullanilanIlaclar: Array<{
      ad: string;
      doz: string;
      kulanimSaatleri: string[];
    }>;
    asiKartiVarMi: boolean;
    asiKartiUrl?: string;
    ozelEgitimIhtiyaci: boolean;
    ozelEgitimDetay?: string;
    psikolojikDestek: boolean;
    psikolojikDestekDetay?: string;
    acilDurumNotu?: string;
  };
  
  // ==================== FİNANSAL BİLGİLER ====================
  finans: {
    yillikUcret: number;
    indirimler: {
      kardes: number;                   // %
      erkenKayit: number;
      basari: number;
      ozel: number;
      toplam: number;
    };
    netUcret: number;
    
    odemePlani: {
      tip: 'Peşin' | 'Taksitli';
      pesinIndirim?: number;
      taksitSayisi?: number;
      taksitTutari?: number;
      ilkOdemeTarihi?: Date;
    };
    
    odemeDurumu: {
      toplamBorc: number;
      odenenmiktar: number;
      kalanBorc: number;
      odemeOrani: number;
      gecikmisTaksitSayisi: number;
      sonOdemeTarihi?: Date;
    };
  };
  
  // ==================== AKADEMİK BİLGİLER ====================
  akademik: {
    genelOrtalama: number;
    donememOrtalamasi: number;
    gecenDonemOrtalamasi: number;
    
    dersler: Array<{
      dersId: string;
      dersAdi: string;
      ogretmenId: string;
      notlar: {
        yazili1?: number;
        yazili2?: number;
        yazili3?: number;
        sozlu?: number;
        proje?: number;
        performans?: number;
        ortalama: number;
      };
      devamsizlik: number;
      davranis: number;
    }>;
    
    devamsizlik: {
      toplam: number;
      ozurlu: number;
      ozursuz: number;
      oran: number;
    };
    
    odevler: {
      toplam: number;
      tamamlanan: number;
      geciken: number;
      bekleyen: number;
      tamamlamaOrani: number;
    };
  };
  
  // ==================== REHBERLİK BİLGİLERİ ====================
  rehberlik: {
    psikolojikDurum: {
      genelDurum: 'İyi' | 'Orta' | 'Risk Altında';
      riskSeviyesi: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
      sonDegerlendirme?: Date;
    };
    
    davranis: {
      puan: number;                     // 0-100
      gucluYonler: string[];
      gelisimAlanlari: string[];
    };
    
    testler: Array<{
      id: string;
      ad: string;
      tip: 'Meslek' | 'Kişilik' | 'Yetenek' | 'İlgi';
      tarih: Date;
      sonuclar: any;
      raporUrl?: string;
    }>;
    
    gorusmeler: Array<{
      id: string;
      tarih: Date;
      tur: 'Veli' | 'Öğrenci' | 'Aile';
      katilimcilar: string[];
      konu: string;
      notlar: string;
      kararlar: string[];
      sonrakiGorisme?: Date;
    }>;
    
    destekProgramlari: Array<{
      id: string;
      ad: string;
      baslangic: Date;
      bitis?: Date;
      durum: 'Aktif' | 'Tamamlandı' | 'İptal';
      hedefler: Array<{
        hedef: string;
        tamamlandi: boolean;
      }>;
      ilerleme: number;                 // %
    }>;
  };
  
  // ==================== BELGELER ====================
  belgeler: {
    zorunlu: {
      nufusCuzdani: BelgeDetay;
      ikametgah: BelgeDetay;
      saglikRaporu: BelgeDetay;
    };
    
    opsiyonel: {
      nakilBelgesi?: BelgeDetay;
      asiKarti?: BelgeDetay;
      veliKimlik?: BelgeDetay;
    };
    
    sertifikalar: BelgeDetay[];
    diger: BelgeDetay[];
  };
  
  // ==================== SÖZLEŞME ====================
  sozlesme: {
    sozlesmeNo: string;
    sablon: 'Standart' | 'İndirimli' | 'Özel';
    olusturmaTarihi: Date;
    imzaTarihi?: Date;
    gecerlilikTarihi: Date;
    
    imzalar: {
      veli: ImzaDetay;
      yetkili: ImzaDetay;
    };
    
    kvkkOnay: boolean;
    kvkkOnayTarihi?: Date;
    acikRiza: boolean;
    acikRizaTarihi?: Date;
    
    pdfUrl?: string;
  };
  
  // ==================== AI VE RİSK ANALİZİ ====================
  ai: {
    riskSkoru: number;                  // 0-100
    riskKategorisi: 'Yok' | 'Düşük' | 'Orta' | 'Yüksek';
    riskFaktorleri: string[];
    oneriler: string[];
    
    tahminler: {
      akademikBasari: number;           // % olasılık
      mezuniyetOrtalamasi: number;      // Tahmini
      universiteSinavBasarisi: number;  // % olasılık
      kariyer Yonelimi: string[];
    };
    
    sonAnalizTarihi: Date;
  };
  
  // ==================== METAVERİ ====================
  metadata: {
    kayitYapan: string;                 // User ID
    sonGuncelleyen: string;
    sonGuncellemeTarihi: Date;
    aktifMi: boolean;
    silindiMi: boolean;
    silmeTarihi?: Date;
    notlar?: string;
  };
}

// ==================== YARDIMCI TİPLER ====================

interface VeliDetay {
  ad: string;
  soyad: string;
  tcKimlik: string;
  dogumTarihi: Date;
  meslek: string;
  cepTelefonu: string;
  sabitTelefon?: string;
  email?: string;
  egitimDurumu: string;
  aylikGelir?: number;
  adres?: string;                       // Farklıysa
}

interface BelgeDetay {
  id: string;
  ad: string;
  kategori: string;
  url: string;
  format: string;                       // PDF, JPG, PNG...
  boyut: number;                        // Bytes
  yuklemeTarihi: Date;
  yukleyen: string;                     // User ID
  onayDurumu: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
  onaylayan?: string;
  onayTarihi?: Date;
  aciklama?: string;
}

interface ImzaDetay {
  ad: string;
  imzaUrl?: string;                     // Canvas'tan Base64
  imzaTarihi?: Date;
  ipAdresi?: string;
  cihazBilgisi?: string;
}
```

---

## 🎯 AI ENTEGRASYONU

### 1. AI Öğrenci Analizi

```typescript
// AI analiz endpoint
POST /api/ai/analyze-student/:id

Response:
{
  riskAnalizi: {
    akademikRisk: {
      seviye: 'Düşük' | 'Orta' | 'Yüksek',
      skor: 15,                         // 0-100
      faktorler: [
        'Not ortalaması düşüyor',
        'Devamsızlık artışı'
      ],
      oneriler: [
        'Matematik dersinde bireysel destek',
        'Veli görüşmesi yapılmalı'
      ]
    },
    
    finansalRisk: {
      seviye: 'Yok',
      skor: 5,
      faktorler: [],
      oneriler: ['Ödeme geçmişi çok iyi']
    },
    
    sosyalRisk: {
      seviye: 'Düşük',
      skor: 20,
      faktorler: ['Grup çalışmalarına katılım az'],
      oneriler: ['Kulüp aktivitelerine yönlendirilebilir']
    },
    
    psikolojikRisk: {
      seviye: 'Yok',
      skor: 10,
      faktorler: [],
      oneriler: []
    }
  },
  
  tahminler: {
    donemSonuOrtalamasi: {
      tahmini: 87.5,
      guvenAraligi: [85, 90],
      guvenSeviyesi: 0.85
    },
    
    mezuniyetOrtalamasi: {
      tahmini: 88.2,
      guvenAraligi: [86, 91],
      guvenSeviyesi: 0.78
    },
    
    universiteSinavBasarisi: {
      basariOlasiligi: 0.92,
      tahminiBolumler: [
        'Bilgisayar Mühendisliği',
        'Elektrik-Elektronik Mühendisliği',
        'Matematik'
      ]
    }
  },
  
  oneriler: {
    akademik: [
      {
        oncelik: 'Yüksek',
        konu: 'Matematik Desteği',
        detay: 'Geometri konusunda bireysel destek programına alınmalı',
        etkiBeklentisi: 'Not ortalaması 5 puan artabilir'
      }
    ],
    
    sosyal: [
      {
        oncelik: 'Orta',
        konu: 'Kulüp Aktiviteleri',
        detay: 'STEM kulübüne yönlendirilebilir',
        etkiBeklentisi: 'Sosyal gelişim desteklenir'
      }
    ],
    
    kariyer: [
      {
        oncelik: 'Orta',
        konu: 'Mühendislik Yönelimi',
        detay: 'Mühendislik fakültesi gezisi düzenlenebilir',
        etkiBeklentisi: 'Kariyer farkındalığı artar'
      }
    ]
  },
  
  karsilastirma: {
    sinifOrtalamasiIle: {
      durum: 'Ortalamanın üstünde',
      fark: +5.3
    },
    
    benzerProfillerIle: {
      profil: 'Sayısal yönelimli, başarılı öğrenciler',
      benzerlikOrani: 0.87,
      karsilastirma: 'Benzer profildeki öğrencilerle aynı seviyede'
    }
  }
}
```

### 2. AI Veli Mesaj Oluşturma

```typescript
// AI mesaj oluşturma
POST /api/ai/generate-parent-message

Request:
{
  ogrenciId: 'STU-2025-0001',
  mesajTipi: 'basari' | 'uyari' | 'bilgilendirme' | 'davet',
  ton: 'resmi' | 'samimi' | 'tesvik',
  konu: 'Haftalık rapor',
  ekBilgiler?: {
    notlar: [85, 92, 88],
    devamsizlik: 0,
    odevler: 'tamamlandı'
  }
}

Response:
{
  mesajlar: {
    sms: 'Sayın Zeynep Hanım, öğrenciniz Ece bu hafta çok başarılı bir performans gösterdi. Matematik dersinde 92 puan aldı. Tebrik ederiz!',
    
    email: {
      konu: 'Ece Kızıroğlu - Haftalık Başarı Raporu',
      icerik: `
        Sayın Zeynep Hanım,
        
        Öğrenciniz Ece Kızıroğlu'nun bu haftaki performansını sizlerle paylaşmak isteriz.
        
        📚 Akademik Başarılar:
        • Matematik sınavı: 92/100 (Sınıf ortalaması: 75)
        • Fizik ödevi: Zamanında teslim edildi
        • Kimya dersi: Aktif katılım gösterdi
        
        ⭐ Öne Çıkan Başarılar:
        • Matematik dersinde sınıf 3.sü oldu
        • Tüm ödevleri zamanında tamamladı
        • Devamsızlık: 0 gün
        
        Ece'nin bu başarısının devam etmesi için desteğinizin sürmesi önemlidir.
        
        Saygılarımızla,
        AkademiHub Öğretmen Kadrosu
      `
    },
    
    whatsapp: 'Merhaba Zeynep Hanım 👋 Ece bu hafta harika bir performans gösterdi! 📚 Matematik sınavında 92 puan aldı 🎉 Tebrikler! 🌟'
  },
  
  kiselsestirmeler: {
    ogrenciBasarilari: [
      'Matematik sınavında üstün başarı',
      'Tüm ödevleri zamanında tamamladı'
    ],
    
    veliIlgiAlanlari: [
      'Üniversite hazırlığı',
      'STEM eğitimi'
    ]
  }
}
```

### 3. AI Sözleşme Oluşturma

```typescript
// Dinamik sözleşme oluşturma
POST /api/ai/generate-contract

Request:
{
  ogrenciId: 'STU-2025-0001',
  sablon: 'Standart' | 'İndirimli' | 'Özel',
  ozelMaddeler?: string[]
}

Response:
{
  sozlesme: {
    no: 'SOZ-2025-0001',
    tarih: '2025-01-20',
    
    taraflar: {
      okul: {
        ad: 'AkademiHub Özel Eğitim Kurumları',
        adres: '...',
        vergiNo: '...'
      },
      
      veli: {
        ad: 'Zeynep Kızıroğlu',
        tcKimlik: '12345678901',
        adres: '...'
      },
      
      ogrenci: {
        ad: 'Ece Kızıroğlu',
        tcKimlik: '98765432109',
        sinif: '9-A'
      }
    },
    
    maddeler: [
      {
        no: 1,
        baslik: 'Sözleşmenin Konusu',
        icerik: 'İşbu sözleşme, Ece Kızıroğlu isimli öğrencinin 2024-2025 eğitim-öğretim yılında 9. sınıf eğitimi alması ve bunun karşılığında belirlenen ücretin ödenmesi ile ilgili tarafların hak ve yükümlülüklerini düzenler.',
        zorunlu: true
      },
      
      {
        no: 2,
        baslik: 'Eğitim Ücreti',
        icerik: `
          Yıllık eğitim ücreti: ₺120,000.00
          İndirimler:
          - Kardeş indirimi (%10): -₺12,000.00
          - Erken kayıt (%5): -₺6,000.00
          Net tutar: ₺102,000.00
          
          Ödeme planı: 8 taksit
          Taksit tutarı: ₺12,750.00
          İlk taksit: 15 Eylül 2024
        `,
        zorunlu: true
      },
      
      // ... diğer maddeler
      
      {
        no: 15,
        baslik: 'Kişisel Verilerin Korunması (KVKK)',
        icerik: 'Taraflar, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinin işlenmesine açık rıza göstermektedir.',
        zorunlu: true,
        onayGerekli: true
      }
    ],
    
    imzaAlanlari: {
      veli: {
        x: 100,
        y: 800,
        genislik: 200,
        yukseklik: 50
      },
      
      yetkili: {
        x: 400,
        y: 800,
        genislik: 200,
        yukseklik: 50
      }
    },
    
    pdfUrl: null  // İmzalandıktan sonra oluşturulacak
  }
}
```

---

## 🚀 ADIM ADIM UYGULAMA

### CURSOR İÇİN TALİMATLAR

Aşağıdaki adımları **sırayla** uygula. Her adım bittikten sonra "✅ ADIM X TAMAMLANDI" de ve bekle.

---

### ADIM 1: TYPES OLUŞTURMA

**Konum:** `src/types/student.types.ts`

**Yapılacak:**
1. Yukarıdaki tam `Student` interface'ini oluştur
2. Yardımcı type'ları ekle (`VeliDetay`, `BelgeDetay`, `ImzaDetay`)
3. Export et

**Tamamlanma Kriteri:**
- ✅ TypeScript hatası yok
- ✅ Tüm alanlar tanımlı
- ✅ Import edilebiliyor

---

### ADIM 2: MOCK DATA OLUŞTURMA

**Konum:** `src/data/students.data.ts`

**Yapılacak:**
1. En az 50 öğrenci mock datası oluştur
2. Gerçekçi Türkçe isimler kullan
3. Tüm alanları doldur (academic, finance, guidance, vb.)
4. Export et

**Mock Data Örneği:**
```typescript
export const mockStudents: Student[] = [
  {
    id: 'STU-2025-0001',
    ogrenciNo: 'STU-2025-0001',
    tcKimlik: '12345678901',
    ad: 'Ece',
    soyad: 'Kızıroğlu',
    dogumTarihi: new Date('2009-03-15'),
    dogumYeri: 'İstanbul',
    cinsiyet: 'Kız',
    kanGrubu: 'A+',
    uyruk: 'T.C.',
    fotoUrl: 'https://i.pravatar.cc/150?img=1',
    // ... diğer tüm alanlar
  },
  // ... 49 öğrenci daha
];
```

---

### ADIM 3: STUDENT LIST PAGE GÜNCELLEMESİ

**Konum:** `src/modules/students/pages/StudentListPage.tsx`

**Yapılacak:**
1. Mevcut sayfayı al
2. Gelişmiş filtreleme ekle
3. Tablo ve kart görünümü toggle ekle
4. Hızlı aksiyon menüsü ekle
5. Toplu işlemler ekle
6. Export butonları ekle

**Yeni Özellikler:**
```typescript
// Filtreler
- Sınıf filtresi
- Durum filtresi (Aktif, Pasif, vb.)
- Borç durumu filtresi
- Risk seviyesi filtresi
- Tarih aralığı filtresi

// Görünüm
- Tablo görünümü (default)
- Kart görünümü (toggle ile)

// Hızlı aksiyonlar (her satırda)
- Profil görüntüle
- Ödeme al
- SMS gönder
- Veli ara
- Düzenle

// Toplu işlemler (seçili öğrenciler için)
- Toplu SMS gönder
- Toplu email gönder
- Excel export
- PDF export
```

---

### ADIM 4: REGISTRATION WIZARD OLUŞTURMA

**Konum:** `src/modules/students/components/registration/`

**Yapılacak:**
1. `RegistrationWizard.tsx` - Ana wizard wrapper
2. 8 step componenti oluştur
3. Form validation (Zod) ekle
4. Progress bar ekle
5. Her step'te "İleri/Geri" butonları

**Wizard Yapısı:**
```typescript
const RegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Student>>({});
  
  const steps = [
    { id: 1, title: 'Kişisel Bilgiler', component: Step1_PersonalInfo },
    { id: 2, title: 'Veli Bilgileri', component: Step2_ParentInfo },
    { id: 3, title: 'Kardeş Bilgileri', component: Step3_SiblingInfo },
    { id: 4, title: 'Eğitim Bilgileri', component: Step4_EducationInfo },
    { id: 5, title: 'Sağlık Bilgileri', component: Step5_HealthInfo },
    { id: 6, title: 'Belge Yükleme', component: Step6_DocumentsUpload },
    { id: 7, title: 'Sözleşme', component: Step7_ContractPreview },
    { id: 8, title: 'Ödeme Planı', component: Step8_PaymentPlan },
  ];
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Progress Bar */}
      <ProgressSteps current={currentStep} total={8} />
      
      {/* Current Step Component */}
      <CurrentStepComponent
        data={formData}
        onNext={(data) => {
          setFormData({ ...formData, ...data });
          setCurrentStep(currentStep + 1);
        }}
        onBack={() => setCurrentStep(currentStep - 1)}
      />
    </div>
  );
};
```

---

### ADIM 5: STUDENT PROFILE PAGE OLUŞTURMA

**Konum:** `src/modules/students/pages/StudentProfilePage.tsx`

**Yapılacak:**
1. Profile header (foto, ad, özet kartlar)
2. Tab navigation
3. 7 tab componenti oluştur
4. Her tab için alt componentler

**Profile Structure:**
```typescript
<div className="min-h-screen bg-gray-50">
  {/* Header - Sabit */}
  <ProfileHeader student={student} />
  
  {/* Tabs */}
  <Tabs defaultValue="general" className="mt-6">
    <TabsList>
      <TabsTrigger value="general">Genel</TabsTrigger>
      <TabsTrigger value="academic">Akademik</TabsTrigger>
      <TabsTrigger value="finance">Finans</TabsTrigger>
      <TabsTrigger value="communication">İletişim</TabsTrigger>
      <TabsTrigger value="guidance">Rehberlik</TabsTrigger>
      <TabsTrigger value="documents">Belgeler</TabsTrigger>
      <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
    </TabsList>
    
    <TabsContent value="general">
      <GeneralTab student={student} />
    </TabsContent>
    
    {/* Diğer tab'lar */}
  </Tabs>
</div>
```

---

### ADIM 6: AI ENTEGRASYONU

**Konum:** `src/lib/ai/studentAI.ts`

**Yapılacak:**
1. AI analiz fonksiyonları
2. Risk skorlama
3. Tahmin algoritmaları
4. Mesaj oluşturma

**AI Functions:**
```typescript
export const studentAI = {
  analyzeStudent: async (studentId: string) => {
    // Risk analizi yap
    // Tahminler oluştur
    // Öneriler üret
  },
  
  generateParentMessage: async (data: MessageData) => {
    // AI ile mesaj oluştur
  },
  
  generateContract: async (studentId: string) => {
    // Dinamik sözleşme oluştur
  },
  
  predictPerformance: async (studentId: string) => {
    // Performans tahmini
  }
};
```

---

### ADIM 7: ROUTING BAĞLANTILARI

**Konum:** `src/routes/index.tsx`

**Yapılacak:**
1. Öğrenci route'larını ekle
2. Protected route kontrolü
3. Dynamic routing (/:id)

**Routes:**
```typescript
{
  path: 'students',
  children: [
    { index: true, element: <StudentListPage /> },
    { path: 'register', element: <StudentRegistrationPage /> },
    { path: ':id', element: <StudentProfilePage /> },
    { path: ':id/edit', element: <StudentEditPage /> },
    { path: ':id/contract', element: <StudentContractPage /> }
  ]
}
```

---

### ADIM 8: TEST & DEBUG

**Yapılacak:**
1. npm run dev çalıştır
2. Her sayfayı test et
3. Console hatalarını düzelt
4. Form validationlarını test et
5. AI özelliklerini test et

**Test Checklist:**
```
□ Liste sayfası açılıyor mu?
□ Filtreleme çalışıyor mu?
□ Kayıt formu açılıyor mu?
□ 8 adım ilerliyor mu?
□ Profil sayfası açılıyor mu?
□ Tüm tab'lar çalışıyor mu?
□ Hızlı ödeme çalışıyor mu?
□ AI önerileri görünüyor mu?
□ PDF oluşturuluyor mu?
□ Console'da hata var mı?
```

---

## 📌 NOTLAR

### Önemli Dikkat Noktaları:

1. **Form Validation:**
   - TC Kimlik algoritması kontrolü
   - Email format kontrolü
   - Telefon format kontrolü
   - Zorunlu alan kontrolleri

2. **File Upload:**
   - Max 10MB boyut sınırı
   - PDF, JPG, PNG formatları
   - Dosya adı temizleme
   - Güvenli upload

3. **Performance:**
   - Lazy loading (tab'lar için)
   - Pagination (liste için)
   - Memoization (ağır hesaplamalar için)
   - Debounce (arama için)

4. **Security:**
   - TC Kimlik şifreleme
   - Dosya güvenliği
   - KVKK uyumu
   - Role-based access

5. **UX:**
   - Loading states
   - Error handling
   - Toast notifications
   - Smooth animations

---

## ✅ TAMAMLANMA KRİTERLERİ

Tüm bu adımlar tamamlandığında:

✅ Öğrenci kaydı 8 adımda yapılabilmeli
✅ Kayıt sonrası sözleşme imzalanabilmeli
✅ Ödeme planı oluşturulabilmeli
✅ Öğrenci profili tüm bilgileri göstermeli
✅ Hızlı ödeme alınabilmeli
✅ Veli ile iletişim kurulabilmeli
✅ AI önerileri gösterilmeli
✅ Belgeler yüklenebilmeli
✅ Timeline görüntülenebilmeli
✅ Export yapılabilmeli (Excel, PDF)

---

## 🎯 SON SÖZ

Bu döküman, **Öğrenci Modülü**'nün tam ve eksiksiz spesifikasyonudur.

**Cursor'a şunu söyle:**

```
"ogrenciler.md dosyasındaki tüm adımları sırayla uygula.
Her adım tamamlandığında '✅ ADIM X TAMAMLANDI' de ve bekle.
Kod yazarken:
- Mevcut proje yapısına uygun yaz
- Import path'leri doğru kullan
- TypeScript strict mode uyumlu yaz
- Gerçekçi mock data oluştur
- Yorumları Türkçe yaz
- Console hatası bırakma

Başla: ADIM 1'den"
```

Hazır mısın? 🚀
```

---

Bu **ogrenciler.md** dosyasını `.cursorrules` ile aynı seviyeye kaydet ve Cursor'a "ADIM 1'i uygula" de! 

Sorularını bekliyorum! 😊
# 📝 KAYIT SÖZLEŞMESİ MODÜLÜ - TAM DOKÜMANTASYON

> Öğrenci kaydı sırasında dijital olarak doldurulup imzalanabilen, PDF olarak saklanabilen dinamik sözleşme sistemi.

---

## 📁 MODÜL YAPISI
```
/src/modules/contract
├── /pages
│   ├── ContractPreviewPage.tsx      # Sözleşme önizleme & imzalama
│   ├── ContractManagementPage.tsx   # Admin: Şablon yönetimi
│   └── ContractHistoryPage.tsx      # İmzalanan sözleşmeler
│
├── /components
│   ├── ContractTemplate.tsx         # Dinamik sözleşme şablonu
│   ├── ContractForm.tsx             # Sözleşme formu
│   ├── SignaturePad.tsx             # İmza çizim alanı
│   ├── ContractPDFGenerator.tsx     # PDF oluşturma
│   └── ContractEditor.tsx           # Admin: Şablon düzenleme
│
├── /hooks
│   ├── useContract.ts               # Sözleşme CRUD
│   ├── useSignature.ts              # İmza işlemleri
│   └── useContractPDF.ts            # PDF oluşturma
│
├── /utils
│   ├── contractTemplate.ts          # Şablon oluşturma
│   ├── contractVariables.ts         # Dinamik değişkenler
│   └── contractValidation.ts        # Validasyon
│
└── /types
    └── contract.types.ts            # TypeScript tipleri
```

---

## 📄 VERİ MODELİ

### Contract Interface
```typescript
interface Contract extends BaseEntity {
  // ==================== TEMEL BİLGİLER ====================
  contractNo: string;                   // SOZ-2025-0001
  sablon: ContractTemplate;             // Kullanılan şablon
  durum: 'Taslak' | 'Onay Bekliyor' | 'İmzalandı' | 'İptal';
  
  // ==================== ÖĞRENCI BİLGİLERİ ====================
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    tcKimlik: string;
    dogumTarihi: Date;
    sinif: string;
    program: string;
  };
  
  // ==================== VELİ BİLGİLERİ ====================
  veli: {
    ad: string;
    soyad: string;
    tcKimlik: string;
    adres: string;
    telefon: string;
    email: string;
  };
  
  // ==================== OKUL BİLGİLERİ ====================
  okul: {
    ad: string;
    vergiNo: string;
    adres: string;
    telefon: string;
    email: string;
    yetkili: {
      ad: string;
      gorev: string;
    };
  };
  
  // ==================== FİNANSAL BİLGİLER ====================
  finans: {
    brutUcret: number;                  // Yıllık brüt ücret
    indirimler: Array<{
      tip: 'Kardeş' | 'Başarı' | 'Erken Kayıt' | 'Özel';
      oran: number;                     // %
      tutar: number;                    // ₺
      aciklama: string;
    }>;
    toplamIndirim: number;              // ₺
    netUcret: number;                   // İndirimli tutar
    
    kayitBedeli: {
      tutar: number;                    // Peşin ödeme
      odemeTarihi?: Date;
      odemeYontemi?: string;
    };
    
    kalanTutar: number;                 // Taksitlendirilecek
    
    taksitPlani: Array<{
      no: number;
      vadeTarihi: Date;
      tutar: number;
      odemeYontemi?: string;
      aciklama?: string;
      odendiMi: boolean;
      odemeTarihi?: Date;
    }>;
  };
  
  // ==================== SÖZLEŞME İÇERİĞİ ====================
  maddeler: Array<{
    no: number;
    baslik: string;
    icerik: string;                     // HTML/Markdown
    zorunlu: boolean;
    duzenlenebilir: boolean;
  }>;
  
  // ==================== İNDİRİM ŞARTLARI ====================
  indirimSartlari: {
    aciklama: string;
    gecerlilikKosullari: string[];
    iptalDurumlari: string[];
  };
  
  // ==================== KVKK & AÇIK RIZA ====================
  kvkk: {
    metni: string;
    onaylandi: boolean;
    onayTarihi?: Date;
    onayIpAdresi?: string;
  };
  
  acikRiza: {
    metni: string;
    onaylandi: boolean;
    onayTarihi?: Date;
    onayIpAdresi?: string;
  };
  
  // ==================== İMZALAR ====================
  imzalar: {
    veli: {
      ad: string;
      imzaUrl?: string;               // Base64 Canvas imza
      imzaTarihi?: Date;
      ipAdresi?: string;
      cihazBilgisi?: string;
      geoKonum?: {
        lat: number;
        lng: number;
      };
    };
    
    yetkili: {
      ad: string;
      gorev: string;
      imzaUrl?: string;
      imzaTarihi?: Date;
      ipAdresi?: string;
    };
  };
  
  // ==================== EKLER ====================
  ekler: Array<{
    id: string;
    ad: string;
    tip: 'Bilgi Formu' | 'Kimlik' | 'Ödeme Dekontu' | 'İndirim Belgesi' | 'Diğer';
    url: string;
    yuklemeTarihi: Date;
  }>;
  
  // ==================== PDF ====================
  pdf: {
    url?: string;                       // İmzalı sözleşme PDF
    olusturmaTarihi?: Date;
    dosyaBoyutu?: number;               // Bytes
    hash?: string;                      // Doğrulama için
  };
  
  // ==================== TARİHLER ====================
  tarihler: {
    olusturma: Date;
    sonGuncelleme: Date;
    imzalanma?: Date;
    gecerlilikBaslangic: Date;
    gecerlilikBitis: Date;
  };
  
  // ==================== NOTLAR ====================
  notlar?: string;
  iptalNedeni?: string;
}

// ==================== ŞABLON ====================
interface ContractTemplate extends BaseEntity {
  ad: string;                           // "Standart Kayıt Sözleşmesi"
  tip: 'Standart' | 'İndirimli' | 'Özel' | 'Yabancı Uyruklu';
  aktif: boolean;
  
  icerik: {
    baslik: string;
    giris: string;                      // Giriş paragrafı
    maddeler: Array<{
      no: number;
      baslik: string;
      icerik: string;                   // {{OGRENCI_ADI}} gibi değişkenler
      zorunlu: boolean;
      duzenlenebilir: boolean;
    }>;
    sonuc: string;                      // Sonuç paragrafı
  };
  
  degiskenler: string[];                // Kullanılabilir değişkenler listesi
  
  kvkkMetni: string;
  acikRizaMetni: string;
  
  olusturan: string;
  sonGuncelleyen?: string;
}
```

---

## 🎨 COMPONENT 1: CONTRACT TEMPLATE

**Dosya:** `src/modules/contract/components/ContractTemplate.tsx`
```typescript
/**
 * Dinamik Sözleşme Şablonu
 * Öğrenci bilgileriyle otomatik doldurulur
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Contract } from '@/types';

interface ContractTemplateProps {
  contract: Contract;
  showSignatures?: boolean;
}

export const ContractTemplate: React.FC<ContractTemplateProps> = ({ 
  contract, 
  showSignatures = false 
}) => {
  return (
    <Card className="max-w-4xl mx-auto p-8 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          EĞİTİM-ÖĞRETİM HİZMET SÖZLEŞMESİ
        </h1>
        <Badge variant="outline" className="text-sm">
          Sözleşme No: {contract.contractNo}
        </Badge>
        <p className="text-sm text-gray-500 mt-2">
          Düzenleme Tarihi: {new Date(contract.tarihler.olusturma).toLocaleDateString('tr-TR')}
        </p>
      </div>

      <Separator className="my-6" />

      {/* 1. TARAF BİLGİLERİ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">
            1
          </span>
          Taraf Bilgileri
        </h2>

        {/* Okul Bilgileri */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-3">Okul Bilgileri</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Okul Adı:</span>
              <span className="ml-2 font-medium">{contract.okul.ad}</span>
            </div>
            <div>
              <span className="text-gray-600">Vergi No:</span>
              <span className="ml-2 font-medium">{contract.okul.vergiNo}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Adres:</span>
              <span className="ml-2 font-medium">{contract.okul.adres}</span>
            </div>
            <div>
              <span className="text-gray-600">Telefon:</span>
              <span className="ml-2 font-medium">{contract.okul.telefon}</span>
            </div>
            <div>
              <span className="text-gray-600">E-posta:</span>
              <span className="ml-2 font-medium">{contract.okul.email}</span>
            </div>
          </div>
        </div>

        {/* Öğrenci Bilgileri */}
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-900 mb-3">Öğrenci Bilgileri</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Ad Soyad:</span>
              <span className="ml-2 font-medium">{contract.ogrenci.ad} {contract.ogrenci.soyad}</span>
            </div>
            <div>
              <span className="text-gray-600">TC Kimlik:</span>
              <span className="ml-2 font-medium">{contract.ogrenci.tcKimlik}</span>
            </div>
            <div>
              <span className="text-gray-600">Doğum Tarihi:</span>
              <span className="ml-2 font-medium">
                {new Date(contract.ogrenci.dogumTarihi).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Sınıf / Program:</span>
              <span className="ml-2 font-medium">{contract.ogrenci.sinif} - {contract.ogrenci.program}</span>
            </div>
          </div>
        </div>

        {/* Veli Bilgileri */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Veli Bilgileri</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Ad Soyad:</span>
              <span className="ml-2 font-medium">{contract.veli.ad} {contract.veli.soyad}</span>
            </div>
            <div>
              <span className="text-gray-600">TC Kimlik:</span>
              <span className="ml-2 font-medium">{contract.veli.tcKimlik}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Adres:</span>
              <span className="ml-2 font-medium">{contract.veli.adres}</span>
            </div>
            <div>
              <span className="text-gray-600">Telefon:</span>
              <span className="ml-2 font-medium">{contract.veli.telefon}</span>
            </div>
            <div>
              <span className="text-gray-600">E-posta:</span>
              <span className="ml-2 font-medium">{contract.veli.email}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-6" />

      {/* 2. SÖZLEŞME KONUSU */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">
            2
          </span>
          Sözleşmenin Konusu
        </h2>
        <p className="text-gray-700 leading-relaxed">
          İşbu sözleşme, yukarıda bilgileri yer alan <strong>{contract.ogrenci.ad} {contract.ogrenci.soyad}</strong> isimli 
          öğrencinin <strong>{contract.okul.ad}</strong> bünyesinde <strong>{contract.ogrenci.sinif}</strong> sınıfında 
          eğitim-öğretim görmesi, bunun karşılığında ödenecek ücret, ödeme şekli, taksit planı ve tarafların 
          karşılıklı hak ve yükümlülüklerini düzenlemek amacıyla düzenlenmiştir.
        </p>
      </section>

      <Separator className="my-6" />

      {/* 3. ÜCRET VE ÖDEME PLANI */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">
            3
          </span>
          Ücret ve Ödeme Planı
        </h2>

        {/* Ücret Özeti */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Eğitim Ücreti (Brüt)</td>
                <td className="py-2 text-right font-semibold">₺{contract.finans.brutUcret.toLocaleString()}</td>
              </tr>
              
              {/* İndirimler */}
              {contract.finans.indirimler.map((indirim, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 text-gray-600">
                    {indirim.tip} İndirimi (%{indirim.oran})
                  </td>
                  <td className="py-2 text-right text-green-600 font-semibold">
                    -₺{indirim.tutar.toLocaleString()}
                  </td>
                </tr>
              ))}
              
              <tr className="border-b-2 border-gray-300">
                <td className="py-2 font-bold text-gray-900">Net Eğitim Ücreti</td>
                <td className="py-2 text-right font-bold text-blue-600 text-lg">
                  ₺{contract.finans.netUcret.toLocaleString()}
                </td>
              </tr>
              
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Kayıt Bedeli (Peşin)</td>
                <td className="py-2 text-right font-semibold">
                  ₺{contract.finans.kayitBedeli.tutar.toLocaleString()}
                </td>
              </tr>
              
              <tr>
                <td className="py-2 font-semibold text-gray-900">Kalan Tutar (Taksitli)</td>
                <td className="py-2 text-right font-semibold text-orange-600">
                  ₺{contract.finans.kalanTutar.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Taksit Planı */}
        <h3 className="font-semibold text-gray-900 mb-3">📅 Taksit Planı</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-2 text-left">Taksit No</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Ödeme Tarihi</th>
                <th className="border border-gray-200 px-4 py-2 text-right">Tutar (₺)</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Ödeme Şekli</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {contract.finans.taksitPlani.map((taksit) => (
                <tr key={taksit.no} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">{taksit.no}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    {new Date(taksit.vadeTarihi).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right font-semibold">
                    ₺{taksit.tutar.toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{taksit.odemeYontemi || '-'}</td>
                  <td className="border border-gray-200 px-4 py-2 text-xs text-gray-600">
                    {taksit.aciklama || '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td colSpan={2} className="border border-gray-200 px-4 py-2 text-right">TOPLAM</td>
                <td className="border border-gray-200 px-4 py-2 text-right text-blue-600">
                  ₺{contract.finans.taksitPlani.reduce((sum, t) => sum + t.tutar, 0).toLocaleString()}
                </td>
                <td colSpan={2} className="border border-gray-200"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="my-6" />

      {/* 4-9. DİĞER MADDELER */}
      {contract.maddeler.map((madde) => (
        <section key={madde.no} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">
              {madde.no}
            </span>
            {madde.baslik}
          </h2>
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: madde.icerik }}
          />
        </section>
      ))}

      {/* KVKK & AÇIK RIZA */}
      <section className="mb-8 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
        <h2 className="text-lg font-bold text-yellow-900 mb-4">
          ⚠️ Kişisel Verilerin Korunması (KVKK) ve Açık Rıza
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              checked={contract.kvkk.onaylandi}
              disabled
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-sm text-gray-900 mb-1">KVKK Aydınlatma Metni</p>
              <p className="text-xs text-gray-700">{contract.kvkk.metni}</p>
              {contract.kvkk.onaylandi && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Onaylandı: {new Date(contract.kvkk.onayTarihi!).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              checked={contract.acikRiza.onaylandi}
              disabled
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-sm text-gray-900 mb-1">Açık Rıza Metni</p>
              <p className="text-xs text-gray-700">{contract.acikRiza.metni}</p>
              {contract.acikRiza.onaylandi && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Onaylandı: {new Date(contract.acikRiza.onayTarihi!).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* İMZALAR */}
      {showSignatures && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            🖋️ Taraf İmzaları
          </h2>

          <div className="grid grid-cols-2 gap-8">
            {/* Veli İmzası */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">
                Veli / Ödemeyi Yapan Kişi
              </h3>
              
              {contract.imzalar.veli.imzaUrl ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-4 border-2 border-dashed border-gray-300">
                    <img 
                      src={contract.imzalar.veli.imzaUrl} 
                      alt="Veli İmzası"
                      className="h-24 mx-auto"
                    />
                  </div>
                  <div className="text-sm text-center space-y-1">
                    <p className="font-medium">{contract.imzalar.veli.ad}</p>
                    <p className="text-gray-500">
                      {new Date(contract.imzalar.veli.imzaTarihi!).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-xs text-gray-400">IP: {contract.imzalar.veli.ipAdresi}</p>
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  İmza Bekleniyor
                </div>
              )}
            </div>

            {/* Yetkili İmzası */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">
                Okul Yetkilisi
              </h3>
              
              {contract.imzalar.yetkili.imzaUrl ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-4 border-2 border-dashed border-gray-300">
                    <img 
                      src={contract.imzalar.yetkili.imzaUrl} 
                      alt="Yetkili İmzası"
                      className="h-24 mx-auto"
                    />
                  </div>
                  <div className="text-sm text-center space-y-1">
                    <p className="font-medium">{contract.imzalar.yetkili.ad}</p>
                    <p className="text-gray-500">{contract.imzalar.yetkili.gorev}</p>
                    <p className="text-gray-500">
                      {new Date(contract.imzalar.yetkili.imzaTarihi!).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  İmza Bekleniyor
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* EKLER */}
      {contract.ekler.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🧾 Ekler</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            {contract.ekler.map((ek) => (
              <li key={ek.id}>
                {ek.ad} ({ek.tip})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* YASAL NOT */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300">
        <p className="text-xs text-gray-500 text-center">
          ⚖️ Bu belge, tarafların dijital/ıslak imzalarıyla yürürlüğe girer. 
          İşbu sözleşme {contract.tarihler.gecerlilikBaslangic.toLocaleDateString('tr-TR')} - {contract.tarihler.gecerlilikBitis.toLocaleDateString('tr-TR')} 
          tarihleri arasında geçerlidir.
        </p>
      </div>
    </Card>
  );
};
```

---

## ✍️ COMPONENT 2: SIGNATURE PAD

**Dosya:** `src/modules/contract/components/SignaturePad.tsx`
```typescript
/**
 * Dijital İmza Çizim Alanı
 * Canvas ile
 * el ile imza çizilir ve Base64 olarak kaydedilir
 */

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
  signerName: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  signerName
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas ayarları
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Canvas'ı Base64'e çevir
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">İmza Atın</h3>
            <p className="text-sm text-gray-500">
              {signerName} - Aşağıdaki alana imzanızı çizin
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">
                ✍️ Burada imza atın
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={clearSignature}
            disabled={isEmpty}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Temizle
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            İptal
          </Button>
          <Button
            onClick={saveSignature}
            disabled={isEmpty}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            İmzayı Kaydet
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

---

## 📄 COMPONENT 3: CONTRACT PREVIEW PAGE

**Dosya:** `src/modules/contract/pages/ContractPreviewPage.tsx`

```typescript
/**
 * Sözleşme Önizleme & İmzalama Sayfası
 * Kayıt wizard'ın 7. adımında kullanılır
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractTemplate } from '../components/ContractTemplate';
import { SignaturePad } from '../components/SignaturePad';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileText, Download, Send, AlertCircle } from 'lucide-react';
import type { Contract } from '@/types';

export const ContractPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [contract, setContract] = useState<Contract | null>(null);
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [acikRizaChecked, setAcikRizaChecked] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [veliSignature, setVeliSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data loading
  useEffect(() => {
    // TODO: API'den contract verisi çek
    // setContract(data);
  }, [id]);

  const handleVeliSign = (signature: string) => {
    setVeliSignature(signature);
    setShowSignaturePad(false);
  };

  const handleSubmit = async () => {
    if (!kvkkChecked || !acikRizaChecked || !veliSignature) {
      alert('Lütfen tüm onayları işaretleyin ve imzanızı atın');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sözleşmeyi güncelle
      const updatedContract: Partial<Contract> = {
        ...contract,
        durum: 'İmzalandı',
        kvkk: {
          ...contract!.kvkk,
          onaylandi: true,
          onayTarihi: new Date(),
          onayIpAdresi: await getClientIP()
        },
        acikRiza: {
          ...contract!.acikRiza,
          onaylandi: true,
          onayTarihi: new Date(),
          onayIpAdresi: await getClientIP()
        },
        imzalar: {
          ...contract!.imzalar,
          veli: {
            ad: contract!.veli.ad + ' ' + contract!.veli.soyad,
            imzaUrl: veliSignature,
            imzaTarihi: new Date(),
            ipAdresi: await getClientIP(),
            cihazBilgisi: navigator.userAgent
          }
        },
        tarihler: {
          ...contract!.tarihler,
          imzalanma: new Date()
        }
      };

      // TODO: API'ye gönder
      // await api.contracts.update(id, updatedContract);

      // 2. PDF oluştur
      // await generateContractPDF(updatedContract);

      // 3. Veliye email gönder
      // await sendContractEmail(updatedContract);

      // 4. Başarı mesajı ve yönlendirme
      alert('Sözleşme başarıyla imzalandı!');
      navigate(`/students/${contract!.ogrenci.id}`);

    } catch (error) {
      console.error('Sözleşme imzalama hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contract) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Sözleşme Önizleme & İmzalama</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </Button>
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Email Gönder
            </Button>
          </div>
        </div>

        {/* Contract Template */}
        <ContractTemplate 
          contract={contract}
          showSignatures={!!veliSignature}
        />

        {/* KVKK & Açık Rıza Onayları */}
        <div className="mt-8 space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Devam etmek için aşağıdaki onayları işaretleyip imzanızı atmanız gerekmektedir.
            </AlertDescription>
          </Alert>

          {/* KVKK Onayı */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="kvkk"
                checked={kvkkChecked}
                onCheckedChange={(checked) => setKvkkChecked(checked as boolean)}
              />
              <div className="flex-1">
                <label 
                  htmlFor="kvkk" 
                  className="text-sm font-medium cursor-pointer"
                >
                  KVKK Aydınlatma Metni'ni okudum, anladım ve kabul ediyorum.
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin işlenmesine dair bilgilendirme.
                </p>
              </div>
            </div>
          </div>

          {/* Açık Rıza Onayı */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="acikRiza"
                checked={acikRizaChecked}
                onCheckedChange={(checked) => setAcikRizaChecked(checked as boolean)}
              />
              <div className="flex-1">
                <label 
                  htmlFor="acikRiza" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Açık Rıza Metni'ni okudum, anladım ve kabul ediyorum.
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Öğrencinin eğitim-öğretim faaliyetleri kapsamında kişisel verilerinin işlenmesine açık rıza veriyorum.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* İmza Bölümü */}
        <div className="mt-8 bg-white rounded-lg border-2 border-blue-200 p-6">
          <h3 className="text-lg font-semibold mb-4">✍️ Veli İmzası</h3>

          {veliSignature ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <img 
                  src={veliSignature} 
                  alt="İmza" 
                  className="h-32 mx-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSignaturePad(true)}
                  className="flex-1"
                >
                  İmzayı Değiştir
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!kvkkChecked || !acikRizaChecked || isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Sözleşmeyi Onayla'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowSignaturePad(true)}
              disabled={!kvkkChecked || !acikRizaChecked}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              İmza Atmak İçin Tıklayın
            </Button>
          )}
        </div>

        {/* Uyarı */}
        <Alert className="mt-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            İmzaladıktan sonra sözleşme PDF olarak oluşturulacak ve size email ile gönderilecektir. 
            Sözleşme üzerinde değişiklik yapmak için okul yönetimine başvurmanız gerekmektedir.
          </AlertDescription>
        </Alert>
      </div>

      {/* Signature Pad Dialog */}
      <Dialog open={showSignaturePad} onOpenChange={setShowSignaturePad}>
        <DialogContent className="max-w-3xl">
          <SignaturePad
            onSave={handleVeliSign}
            onCancel={() => setShowSignaturePad(false)}
            signerName={`${contract.veli.ad} ${contract.veli.soyad}`}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
}
```

---

## 📊 COMPONENT 4: PDF GENERATOR

**Dosya:** `src/modules/contract/utils/contractPDF.ts`

```typescript
/**
 * Sözleşme PDF Oluşturma
 * jsPDF kullanarak imzalı sözleşmeyi PDF'e çevirir
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Contract } from '@/types';

export const generateContractPDF = async (contract: Contract): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPosition = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EĞİTİM-ÖĞRETİM HİZMET SÖZLEŞMESİ', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sözleşme No: ${contract.contractNo}`, 105, yPosition, { align: 'center' });
  doc.text(`Tarih: ${new Date(contract.tarihler.olusturma).toLocaleDateString('tr-TR')}`, 105, yPosition + 5, { align: 'center' });

  yPosition += 15;

  // 1. TARAF BİLGİLERİ
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Taraf Bilgileri', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Okul Bilgileri
  doc.setFont('helvetica', 'bold');
  doc.text('Okul Bilgileri:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  doc.text(`Okul Adı: ${contract.okul.ad}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Vergi No: ${contract.okul.vergiNo}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Adres: ${contract.okul.adres}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Telefon: ${contract.okul.telefon}`, 25, yPosition);
  yPosition += 5;
  doc.text(`E-posta: ${contract.okul.email}`, 25, yPosition);
  yPosition += 8;

  // Öğrenci Bilgileri
  doc.setFont('helvetica', 'bold');
  doc.text('Öğrenci Bilgileri:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  doc.text(`Ad Soyad: ${contract.ogrenci.ad} ${contract.ogrenci.soyad}`, 25, yPosition);
  yPosition += 5;
  doc.text(`TC Kimlik: ${contract.ogrenci.tcKimlik}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Doğum Tarihi: ${new Date(contract.ogrenci.dogumTarihi).toLocaleDateString('tr-TR')}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Sınıf: ${contract.ogrenci.sinif} - ${contract.ogrenci.program}`, 25, yPosition);
  yPosition += 8;

  // Veli Bilgileri
  doc.setFont('helvetica', 'bold');
  doc.text('Veli Bilgileri:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  yPosition += 5;
  doc.text(`Ad Soyad: ${contract.veli.ad} ${contract.veli.soyad}`, 25, yPosition);
  yPosition += 5;
  doc.text(`TC Kimlik: ${contract.veli.tcKimlik}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Telefon: ${contract.veli.telefon}`, 25, yPosition);
  yPosition += 5;
  doc.text(`E-posta: ${contract.veli.email}`, 25, yPosition);
  yPosition += 10;

  // 2. SÖZLEŞME KONUSU
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Sözleşmenin Konusu', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const konuText = `İşbu sözleşme, yukarıda bilgileri yer alan ${contract.ogrenci.ad} ${contract.ogrenci.soyad} isimli öğrencinin ${contract.okul.ad} bünyesinde ${contract.ogrenci.sinif} sınıfında eğitim-öğretim görmesi, bunun karşılığında ödenecek ücret, ödeme şekli, taksit planı ve tarafların karşılıklı hak ve yükümlülüklerini düzenlemek amacıyla düzenlenmiştir.`;
  const splitText = doc.splitTextToSize(konuText, 170);
  doc.text(splitText, 20, yPosition);
  yPosition += splitText.length * 5 + 10;

  // 3. ÜCRET VE ÖDEME PLANI
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Ücret ve Ödeme Planı', 20, yPosition);
  yPosition += 7;

  // Ücret Tablosu
  const ucretData = [
    ['Eğitim Ücreti (Brüt)', `₺${contract.finans.brutUcret.toLocaleString()}`],
    ...contract.finans.indirimler.map(i => [
      `${i.tip} İndirimi (%${i.oran})`,
      `-₺${i.tutar.toLocaleString()}`
    ]),
    ['Net Eğitim Ücreti', `₺${contract.finans.netUcret.toLocaleString()}`],
    ['Kayıt Bedeli (Peşin)', `₺${contract.finans.kayitBedeli.tutar.toLocaleString()}`],
    ['Kalan Tutar', `₺${contract.finans.kalanTutar.toLocaleString()}`]
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Açıklama', 'Tutar']],
    body: ucretData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Taksit Planı
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Taksit Planı:', 20, yPosition);
  yPosition += 5;

  const taksitData = contract.finans.taksitPlani.map(t => [
    t.no.toString(),
    new Date(t.vadeTarihi).toLocaleDateString('tr-TR'),
    `₺${t.tutar.toLocaleString()}`,
    t.odemeYontemi || '-'
  ]);

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Taksit No', 'Vade Tarihi', 'Tutar', 'Ödeme Şekli']],
    body: taksitData,
    foot: [['TOPLAM', '', `₺${contract.finans.taksitPlani.reduce((sum, t) => sum + t.tutar, 0).toLocaleString()}`, '']],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // 4-9. DİĞER MADDELER
  contract.maddeler.forEach((madde) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${madde.no}. ${madde.baslik}`, 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // HTML etiketlerini temizle
    const cleanContent = madde.icerik.replace(/<[^>]*>/g, '');
    const splitContent = doc.splitTextToSize(cleanContent, 170);
    doc.text(splitContent, 20, yPosition);
    yPosition += splitContent.length * 5 + 10;
  });

  // İMZALAR
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Taraf İmzaları', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Veli İmzası
  doc.setFontSize(11);
  doc.text('Veli / Ödemeyi Yapan Kişi:', 20, yPosition);
  yPosition += 5;

  if (contract.imzalar.veli.imzaUrl) {
    doc.addImage(contract.imzalar.veli.imzaUrl, 'PNG', 20, yPosition, 60, 30);
    yPosition += 35;
  } else {
    doc.rect(20, yPosition, 60, 30);
    yPosition += 35;
  }

  doc.setFontSize(10);
  doc.text(`Ad Soyad: ${contract.imzalar.veli.ad}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Tarih: ${contract.imzalar.veli.imzaTarihi ? new Date(contract.imzalar.veli.imzaTarihi).toLocaleDateString('tr-TR') : '___________'}`, 20, yPosition);

  // Yetkili İmzası
  yPosition = 40; // Sağa geç
  doc.setFontSize(11);
  doc.text('Okul Yetkilisi:', 130, yPosition);
  yPosition += 5;

  if (contract.imzalar.yetkili.imzaUrl) {
    doc.addImage(contract.imzalar.yetkili.imzaUrl, 'PNG', 130, yPosition, 60, 30);
    yPosition += 35;
  } else {
    doc.rect(130, yPosition, 60, 30);
    yPosition += 35;
  }

  doc.setFontSize(10);
  doc.text(`Ad Soyad: ${contract.imzalar.yetkili.ad}`, 130, yPosition);
  yPosition += 5;
  doc.text(`Görev: ${contract.imzalar.yetkili.gorev}`, 130, yPosition);
  yPosition += 5;
  doc.text(`Tarih: ${contract.imzalar.yetkili.imzaTarihi ? new Date(contract.imzalar.yetkili.imzaTarihi).toLocaleDateString('tr-TR') : '___________'}`, 130, yPosition);

  // Yasal Not
  yPosition = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Bu belge dijital olarak imzalanmış olup yasal geçerliliğe sahiptir.', 105, yPosition, { align: 'center' });

  // PDF'i Base64 olarak döndür veya kaydet
  const pdfData = doc.output('dataurlstring');
  
  return pdfData;
};
```

---

## 🎯 CURSOR İÇİN ADIMLAR

### ADIM 1: TYPES OLUŞTUR
```typescript
// src/types/contract.types.ts dosyasını oluştur
// Yukarıdaki Contract ve ContractTemplate interface'lerini ekle
```

### ADIM 2: CONTRACT TEMPLATE COMPONENT
```typescript
// src/modules/contract/components/ContractTemplate.tsx
// Yukarıdaki tam kodu ekle
```

### ADIM 3: SIGNATURE PAD COMPONENT
```typescript
// src/modules/contract/components/SignaturePad.tsx
// Yukarıdaki tam kodu ekle
```

### ADIM 4: CONTRACT PREVIEW PAGE
```typescript
// src/modules/contract/pages/ContractPreviewPage.tsx
// Yukarıdaki tam kodu ekle
```

### ADIM 5: PDF GENERATOR
```typescript
// src/modules/contract/utils/contractPDF.ts
// Yukarıdaki tam kodu ekle
// jsPDF paketini yükle: npm install jspdf jspdf-autotable
```

### ADIM 6: ROUTING EKLE
```typescript
// src/routes/index.tsx içine ekle:
{
  path: 'contract',
  children: [
    { path: ':id/preview', element: <ContractPreviewPage /> },
    { path: ':id/sign', element: <ContractSignPage /> },
    { path: 'history', element: <ContractHistoryPage /> }
  ]
}
```

### ADIM 7: ÖĞRENCİ KAYIT WIZARD'A ENTEGRE ET
```typescript
// src/modules/students/components/registration/Step7_ContractPreview.tsx
// ContractTemplate componentini kullan
// SignaturePad componentini kullan
// İmza tamamlandığında PDF oluştur
```

---

## ✅ TAMAMLANMA KRİTERLERİ

✅ Sözleşme dinamik olarak öğrenci bilgileriyle dolduruluyor
✅ KVKK ve Açık Rıza onayı alınıyor
✅ Dijital imza Canvas ile çiziliyor
✅ İmza Base64 olarak kaydediliyor
✅✅ PDF otomatik oluşturuluyor
✅ İmzalı sözleşme saklanıyor
✅ Veliye email ile gönderiliyor
✅ Sözleşme geçmişi görüntülenebiliyor
✅ Admin panelinden şablon düzenlenebiliyor

---

## 📧 BONUS: EMAIL TEMPLATE

**Dosya:** `src/modules/contract/utils/contractEmail.ts`

```typescript
/**
 * Sözleşme Email Şablonu
 * İmzalanan sözleşme veliye email ile gönderilir
 */

import type { Contract } from '@/types';

export const generateContractEmail = (contract: Contract): EmailTemplate => {
  return {
    to: contract.veli.email,
    cc: contract.okul.email,
    subject: `${contract.okul.ad} - Kayıt Sözleşmesi (${contract.contractNo})`,
    
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📝 Kayıt Sözleşmeniz Hazır</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">
              ${contract.okul.ad}
            </p>
          </div>
          
          <div class="content">
            <p>Sayın <strong>${contract.veli.ad} ${contract.veli.soyad}</strong>,</p>
            
            <p>
              <strong>${contract.ogrenci.ad} ${contract.ogrenci.soyad}</strong> isimli öğrencinizin 
              kayıt sözleşmesi başarıyla imzalanmıştır. Sözleşme detayları aşağıdaki gibidir:
            </p>
            
            <div class="info-box">
              <strong>📄 Sözleşme Bilgileri</strong><br>
              Sözleşme No: ${contract.contractNo}<br>
              İmza Tarihi: ${new Date(contract.tarihler.imzalanma!).toLocaleDateString('tr-TR')}<br>
              Geçerlilik: ${new Date(contract.tarihler.gecerlilikBaslangic).toLocaleDateString('tr-TR')} - 
              ${new Date(contract.tarihler.gecerlilikBitis).toLocaleDateString('tr-TR')}
            </div>
            
            <div class="info-box">
              <strong>💰 Ödeme Bilgileri</strong><br>
              Net Eğitim Ücreti: ₺${contract.finans.netUcret.toLocaleString()}<br>
              Kayıt Bedeli: ₺${contract.finans.kayitBedeli.tutar.toLocaleString()}<br>
              Kalan Tutar: ₺${contract.finans.kalanTutar.toLocaleString()}<br>
              Taksit Sayısı: ${contract.finans.taksitPlani.length}
            </div>
            
            <div class="info-box">
              <strong>📅 İlk Taksit Tarihi</strong><br>
              ${new Date(contract.finans.taksitPlani[0]?.vadeTarihi).toLocaleDateString('tr-TR')} - 
              ₺${contract.finans.taksitPlani[0]?.tutar.toLocaleString()}
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/contract/${contract.id}/preview" class="button">
                🔍 Sözleşmeyi Görüntüle
              </a>
            </p>
            
            <p>
              <strong>📎 Ekte Bulunlar:</strong><br>
              • İmzalı Sözleşme PDF'i<br>
              • Ödeme Planı Detayı<br>
              • KVKK Aydınlatma Metni
            </p>
            
            <p style="background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
              <strong>⚠️ Önemli:</strong> Lütfen taksit ödeme tarihlerinizi takip ediniz. 
              Vade tarihinden 3 gün önce SMS ile hatırlatma yapılacaktır.
            </p>
            
            <p>
              Herhangi bir sorunuz olması durumunda bizimle iletişime geçmekten çekinmeyiniz.
            </p>
            
            <p>
              Saygılarımızla,<br>
              <strong>${contract.okul.ad}</strong><br>
              📞 ${contract.okul.telefon}<br>
              📧 ${contract.okul.email}
            </p>
          </div>
          
          <div class="footer">
            <p>
              Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.<br>
              © 2025 ${contract.okul.ad}. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    attachments: [
      {
        filename: `Sozlesme_${contract.contractNo}.pdf`,
        content: contract.pdf.url!,
        contentType: 'application/pdf'
      }
    ]
  };
};

interface EmailTemplate {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}
```

---

## 🔐 BONUS: SÖZLEŞME DOĞRULAMA

**Dosya:** `src/modules/contract/utils/contractValidation.ts`

```typescript
/**
 * Sözleşme Doğrulama ve Hash Kontrolü
 * Sözleşmenin değiştirilip değiştirilmediğini kontrol eder
 */

import CryptoJS from 'crypto-js';
import type { Contract } from '@/types';

export const generateContractHash = (contract: Contract): string => {
  // Sözleşme önemli alanlarını birleştir
  const data = {
    contractNo: contract.contractNo,
    ogrenciTC: contract.ogrenci.tcKimlik,
    veliTC: contract.veli.tcKimlik,
    netUcret: contract.finans.netUcret,
    imzaTarihi: contract.tarihler.imzalanma,
    veliImza: contract.imzalar.veli.imzaUrl,
    yetkiliImza: contract.imzalar.yetkili.imzaUrl
  };
  
  // SHA-256 hash oluştur
  const hash = CryptoJS.SHA256(JSON.stringify(data)).toString();
  
  return hash;
};

export const verifyContractIntegrity = (
  contract: Contract, 
  storedHash: string
): boolean => {
  const currentHash = generateContractHash(contract);
  return currentHash === storedHash;
};

export const validateContract = (contract: Partial<Contract>): ValidationResult => {
  const errors: string[] = [];
  
  // Öğrenci bilgileri
  if (!contract.ogrenci?.ad) errors.push('Öğrenci adı zorunludur');
  if (!contract.ogrenci?.tcKimlik) errors.push('Öğrenci TC Kimlik zorunludur');
  if (contract.ogrenci?.tcKimlik && !validateTCKimlik(contract.ogrenci.tcKimlik)) {
    errors.push('Geçersiz TC Kimlik numarası');
  }
  
  // Veli bilgileri
  if (!contract.veli?.ad) errors.push('Veli adı zorunludur');
  if (!contract.veli?.telefon) errors.push('Veli telefonu zorunludur');
  if (!contract.veli?.email) errors.push('Veli email zorunludur');
  
  // Finansal bilgiler
  if (!contract.finans?.netUcret || contract.finans.netUcret <= 0) {
    errors.push('Geçerli bir ücret girilmelidir');
  }
  if (!contract.finans?.taksitPlani || contract.finans.taksitPlani.length === 0) {
    errors.push('Taksit planı oluşturulmalıdır');
  }
  
  // KVKK & Açık Rıza
  if (!contract.kvkk?.onaylandi) errors.push('KVKK onayı alınmalıdır');
  if (!contract.acikRiza?.onaylandi) errors.push('Açık rıza onayı alınmalıdır');
  
  // İmzalar
  if (!contract.imzalar?.veli?.imzaUrl) errors.push('Veli imzası zorunludur');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// TC Kimlik Algoritması
function validateTCKimlik(tcKimlik: string): boolean {
  if (tcKimlik.length !== 11) return false;
  if (tcKimlik[0] === '0') return false;
  
  const digits = tcKimlik.split('').map(Number);
  
  // İlk 10 hane toplamının mod 10'u, 11. haneye eşit olmalı
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;
  
  // Tek hanelerin toplamının 7 katı - çift hanelerin toplamının mod 10'u, 10. haneye eşit
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  if ((oddSum * 7 - evenSum) % 10 !== digits[9]) return false;
  
  return true;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

---

## 📊 BONUS: SÖZLEŞME YÖNETİM PANELİ

**Dosya:** `src/modules/contract/pages/ContractManagementPage.tsx`

```typescript
/**
 * Admin: Sözleşme Şablon Yönetimi
 * Sözleşme şablonlarını düzenle, aktifleştir, devre dışı bırak
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash, Eye, Copy } from 'lucide-react';
import type { ContractTemplate } from '@/types';

export const ContractManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([
    {
      id: '1',
      ad: 'Standart Kayıt Sözleşmesi',
      tip: 'Standart',
      aktif: true,
      icerik: {
        baslik: 'Eğitim-Öğretim Hizmet Sözleşmesi',
        giris: 'İşbu sözleşme...',
        maddeler: [],
        sonuc: 'Taraflar...'
      },
      degiskenler: [
        '{{OGRENCI_ADI}}',
        '{{OGRENCI_TC}}',
        '{{VELI_ADI}}',
        '{{OKUL_ADI}}',
        '{{NET_UCRET}}',
        '{{TARIH}}'
      ],
      kvkkMetni: 'KVKK aydınlatma metni...',
      acikRizaMetni: 'Açık rıza metni...',
      olusturan: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Sözleşme Şablon Yönetimi</h1>
            <p className="text-gray-600 mt-1">
              Kayıt sözleşmesi şablonlarını oluşturun ve düzenleyin
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Şablon
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Tüm Şablonlar</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="inactive">Pasif</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{template.ad}</h3>
                        <Badge variant={template.aktif ? 'default' : 'secondary'}>
                          {template.aktif ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <Badge variant="outline">{template.tip}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Değişkenler: {template.degiskenler.join(', ')}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Önizle
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="w-4 h-4 mr-2" />
                          Kopyala
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash className="w-4 h-4 mr-2" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
```

---

## 🎯 SON KONTROL LİSTESİ

```
SÖZLEŞME MODÜLÜ TAMAMLANMA DURUMU:

TYPES & MODELS:
□ Contract interface tanımlandı
□ ContractTemplate interface tanımlandı
□ Yardımcı tipler eklendi

COMPONENTS:
□ ContractTemplate.tsx (görüntüleme)
□ SignaturePad.tsx (imza çizimi)
□ ContractForm.tsx (düzenleme)
□ ContractEditor.tsx (admin)

PAGES:
□ ContractPreviewPage.tsx (önizleme)
□ ContractManagementPage.tsx (admin)
□ ContractHistoryPage.tsx (geçmiş)

UTILITIES:
□ contractPDF.ts (PDF oluşturma)
□ contractEmail.ts (email gönderme)
□ contractValidation.ts (doğrulama)
□ contractTemplate.ts (şablon)

FEATURES:
□ Dinamik değişken replacement
□ Canvas ile dijital imza
□ Base64 imza kaydetme
□ KVKK & Açık Rıza onayı
□ IP adresi kaydetme
□ Geo-location kaydetme
□ PDF otomatik oluşturma
□ Email otomatik gönderme
□ Hash ile doğrulama
□ TC Kimlik validasyonu
□ Sözleşme şablon yönetimi

INTEGRATION:
□ Öğrenci kayıt wizard'a entegre
□ Finans modülüne entegre
□ İletişim modülüne entegre
□ Routing yapılandırması
```

---

## 🚀 CURSOR'A VERECEĞİN TALİMAT

```
"sozlesme.md dosyasındaki TÜM ADIMLARI sırayla uygula.

1. TYPES oluştur (contract.types.ts)
2. COMPONENTS oluştur (ContractTemplate, SignaturePad)
3. PAGES oluştur (ContractPreviewPage)
4. UTILITIES oluştur (contractPDF, contractEmail, contractValidation)
5. ROUTING ekle
6. Öğrenci kayıt wizard'ın 7. adımına entegre et

Her adım tamamlandığında '✅ ADIM X TAMAMLANDI' de.

ÖNEMLİ:
- Mevcut proje yapısına uygun kodla
- Import path'leri doğru kullan
- shadcn/ui componentlerini kullan
- TypeScript strict mode uyumlu yaz
- Gerçekçi mock data oluştur
- Yorumları Türkçe yaz
- Console hatası bırakma

Gerekli paketler:
npm install jspdf jspdf-autotable crypto-js

BAŞLA!"
```

---

## ✨ ÖZET

Bu dokümantasyon ile:

1. ✅ **Dinamik Sözleşme** - Öğrenci bilgileriyle otomatik dolar
2. ✅ **Dijital İmza** - Canvas ile çizilir, Base64 kaydedilir
3. ✅ **PDF Oluşturma** - İmzalı sözleşme otomatik PDF olur
4. ✅ **Email Gönderme** - Veliye otomatik gönderilir
5. ✅ **KVKK Uyumu** - Yasal gereklilikler karşılanır
6. ✅ **Doğrulama** - Hash ile değişiklik kontrolü
7. ✅ **Admin Panel** - Şablon yönetimi
8. ✅ **Entegrasyon** - Kayıt wizard'a tam entegre

**Şimdi ne yapmak istersin?**

A) Bu `sozlesme.md` dosyasını kaydedip Cursor'a ver
B) Önce finans modülünü tasarlayalım (`finans.md`)
C) İkisini birden yap, ben bekleyeyim

Karar senin! 🎯