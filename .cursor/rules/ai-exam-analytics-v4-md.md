# 🏗️ AI EXAM ANALYTICS SYSTEM (SPECTRA)
## Türkiye'nin En Gelişmiş Sınav Analiz Sistemi
### MASTER MİMARİ PLAN v4.0 | Ocak 2026

---

# 📋 İÇİNDEKİLER

1. [Sistem Nedir?](#bölüm-1-sistem-nedir)
2. [Sidebar ve Navigasyon](#bölüm-2-sidebar-navigasyon)
3. [Dashboard Tasarımı](#bölüm-3-dashboard)
4. [Sayfa Haritası](#bölüm-4-sayfa-haritası)
5. [Veritabanı (Supabase SQL)](#bölüm-5-veritabanı)
6. [Dosya Yapısı](#bölüm-6-dosya-yapısı)
7. [Component Detayları](#bölüm-7-componentler)
8. [Altın Kurallar](#bölüm-8-altın-kurallar)

---

# BÖLÜM 1: SİSTEM NEDİR?

## 1.1 Basit Anlatım

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SPECTRA - AI EXAM ANALYTICS                            │
│                 "Sınav Yönetiminin Beyni"                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 NE YAPAR?                                                             │
│   ─────────────────────────────────────────────────────────                │
│                                                                             │
│   1. 📝 SINAV TANIMLA                                                      │
│      → LGS, TYT, AYT, Deneme seç                                           │
│      → Dersleri ve soru sayılarını belirle                                 │
│      → Cevap anahtarını gir                                                │
│                                                                             │
│   2. 📄 OPTİK FORM OLUŞTUR                                                 │
│      → Hazır şablonlardan seç (LGS 90 soru, TYT 120 soru...)              │
│      → Veya kendi şablonunu tasarla                                        │
│      → Kitapçık türlerini ayarla (A-B-C-D)                                │
│                                                                             │
│   3. 📊 VERİ YÜKLE                                                         │
│      → Optik okuyucudan TXT dosyası al                                     │
│      → Sistem otomatik ayrıştırır                                          │
│      → Önizleme gösterir, onay bekler                                      │
│                                                                             │
│   4. 🧮 PUAN HESAPLA                                                       │
│      → Net = Doğru - (Yanlış / 4)                                          │
│      → Ders bazlı analiz                                                   │
│      → Sıralama ve yüzdelik                                                │
│                                                                             │
│   5. 📢 YAYINLA                                                            │
│      → Öğrenci/veli portalına aç                                           │
│      → PDF rapor üret                                                      │
│      → Excel export                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# BÖLÜM 2: SIDEBAR NAVİGASYON

## 2.1 Sidebar Yapısı

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           SIDEBAR TASARIMI                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────────────────┐                                             │
│   │  📊 Spectra              │  ← Logo ve Başlık                           │
│   │     Sınav Analiz         │                                             │
│   └──────────────────────────┘                                             │
│                                                                            │
│   ┌──────────────────────────┐                                             │
│   │ 📊 Dashboard        ●    │  ← Aktif menü (vurgulu)                     │
│   │ 📝 Sınavlar              │                                             │
│   │ 👨‍🎓 Öğrenciler            │                                             │
│   │ 👥 Misafirler             │                                             │
│   │ 📋 Optik Şablonlar        │                                             │
│   │ 📈 Raporlar               │                                             │
│   │ ⚙️ Ayarlar               │                                             │
│   └──────────────────────────┘                                             │
│                                                                            │
│   ┌──────────────────────────┐                                             │
│   │     ◀ Daralt             │  ← Toggle butonu                            │
│   └──────────────────────────┘                                             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Sidebar Menü Öğeleri

| ID | İkon | Label | Path | Açıklama |
|----|------|-------|------|----------|
| `dashboard` | 📊 | Dashboard | `/admin/spectra` | Ana sayfa, istatistikler |
| `sinavlar` | 📝 | Sınavlar | `/admin/spectra/sinavlar` | Sınav listesi ve detay |
| `ogrenciler` | 👨‍🎓 | Öğrenciler | `/admin/spectra/ogrenciler` | Asil öğrenci analizleri |
| `misafirler` | 👥 | Misafirler | `/admin/spectra/misafirler` | Misafir eşleştirme |
| `sablonlar` | 📋 | Optik Şablonlar | `/admin/spectra/sablonlar` | Şablon kütüphanesi |
| `raporlar` | 📈 | Raporlar | `/admin/spectra/raporlar` | PDF/Excel raporlar |
| `ayarlar` | ⚙️ | Ayarlar | `/admin/spectra/ayarlar` | Modül ayarları |

## 2.3 Sidebar Stil Özellikleri

```typescript
// Sidebar stilleri
const SIDEBAR_STYLES = {
  // Genişlik
  expanded: '240px',
  collapsed: '72px',
  
  // Renkler
  background: 'linear-gradient(180deg, #059669 0%, #10b981 100%)',
  textColor: 'white',
  activeItemBg: 'rgba(255,255,255,0.2)',
  hoverItemBg: 'rgba(255,255,255,0.1)',
  
  // Animasyon
  transition: 'width 0.3s ease',
  
  // Z-index
  zIndex: 100
};
```

---

# BÖLÜM 3: DASHBOARD

## 3.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DASHBOARD LAYOUT                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                       │
│ ┌────────────────┐  ┌──────────────────┐    ┌─────────────┐ ┌─────────────┐ │
│ │ 🔍 Öğrenci Ara │  │ 🏫 Kurum Adı     │    │ 📅 2025-26  │ │ 👤 Admin    │ │
│ └────────────────┘  └──────────────────┘    └─────────────┘ └─────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ÜST İSTATİSTİK KARTLARI (6 adet, yeşil gradient)                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │Toplam   │ │Toplam   │ │Ort.     │ │En İyi   │ │Son      │ │⚠️Bekleyen│    │
│ │Sınav    │ │Katılımcı│ │Net      │ │Performns│ │Sınav    │ │Eşleşme   │    │
│ │   24    │ │  1.247  │ │  67.3   │ │  8/A    │ │3 gün    │ │   12    │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ANA MENÜ KARTLARI (4x3 grid)                                                 │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│ │📝 Yeni     │ │📋 Sınavlar │ │👨‍🎓 Öğrenci │ │👥 Misafir  │                 │
│ │Sınav Ekle  │ │Listesi     │ │Performans  │ │Öğrenciler  │                 │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                 │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│ │📄 Karneler │ │🏫 Sınıf    │ │📈 Trend    │ │🎯 Hedef    │                 │
│ │            │ │Karşılaştır │ │Analizi     │ │Takibi      │                 │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                 │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│ │⚠️ Risk     │ │🤖 AI       │ │📊 Raporlar │ │⚙️ Ayarlar  │                 │
│ │Öğrenciler  │ │Öneriler    │ │            │ │            │                 │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ALT İSTATİSTİK KARTLARI (4 adet, beyaz)                                      │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│ │ASİL ÖĞRENCİ│ │MİSAFİR     │ │ORT. BAŞARI │ │BU AY SINAV │                 │
│ │    113     │ │    34      │ │   %72.4    │ │     5      │                 │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Dashboard Kartları Tanımı

```typescript
const DASHBOARD_CARDS = [
  // Satır 1 - Ana İşlemler
  { id: 'yeni-sinav', icon: '📝', title: 'Yeni Sınav Ekle', desc: 'Sınav yükle ve analiz et', color: '#10b981', path: '/admin/spectra/sihirbaz' },
  { id: 'sinavlar', icon: '📋', title: 'Sınavlar Listesi', desc: 'Tüm sınavları görüntüle', color: '#10b981', path: '/admin/spectra/sinavlar' },
  { id: 'performans', icon: '👨‍🎓', title: 'Öğrenciler Performans', desc: 'Asil öğrenci analizleri', color: '#10b981', path: '/admin/spectra/ogrenciler' },
  { id: 'misafir', icon: '👥', title: 'Misafir Öğrenciler', desc: 'Misafir liste ve eşleştirme', color: '#10b981', path: '/admin/spectra/misafirler' },
  
  // Satır 2 - Raporlar
  { id: 'karneler', icon: '📄', title: 'Karneler', desc: 'Öğrenci karne raporları', color: '#22c55e', path: '/admin/spectra/karneler' },
  { id: 'sinif-karsilastirma', icon: '🏫', title: 'Sınıf Karşılaştırma', desc: 'Sınıflar arası performans', color: '#22c55e', path: '/admin/spectra/sinif-karsilastirma' },
  { id: 'trend', icon: '📈', title: 'Trend Analizi', desc: 'Zaman serisi analizleri', color: '#22c55e', path: '/admin/spectra/trend' },
  { id: 'hedef', icon: '🎯', title: 'Hedef Takibi', desc: 'LGS/YKS hedef takip', color: '#f97316', path: '/admin/spectra/hedef' },
  
  // Satır 3 - Gelişmiş
  { id: 'risk', icon: '⚠️', title: 'Risk Öğrenciler', desc: 'Düşüş riski olanlar', color: '#ef4444', path: '/admin/spectra/risk' },
  { id: 'ai', icon: '🤖', title: 'AI Öneriler', desc: 'Akıllı analiz ve öneriler', color: '#8b5cf6', path: '/admin/spectra/ai' },
  { id: 'raporlar', icon: '📊', title: 'Raporlar', desc: 'PDF/Excel raporları', color: '#3b82f6', path: '/admin/spectra/raporlar' },
  { id: 'ayarlar', icon: '⚙️', title: 'Ayarlar', desc: 'Modül ayarları', color: '#64748b', path: '/admin/spectra/ayarlar' },
];
```

## 3.3 İstatistik Kartları

### Üst Kartlar (6 adet - Yeşil/Turuncu Gradient)

| Kart | İkon | Değer | Alt Metin | Renk |
|------|------|-------|-----------|------|
| Toplam Sınav | 📊 | 24 | Bu dönem | Yeşil |
| Toplam Katılımcı | 👥 | 1.247 | 113 asil | Yeşil |
| Ort. Net | 📈 | 67.3 | ↑+2.1 | Yeşil |
| En İyi Performans | 🏆 | 8/A | 72.4 net | Yeşil |
| Son Sınav | 🕐 | 3 gün önce | LGS Deneme #5 | Yeşil |
| Bekleyen Eşleşme | ⚠️ | 12 | öğrenci | Turuncu |

### Alt Kartlar (4 adet - Beyaz)

| Kart | Değer | İkon |
|------|-------|------|
| Asil Öğrenci | 113 | 👨‍🎓 |
| Misafir | 34 | 👥 |
| Ort. Başarı | %72.4 | 📈 |
| Bu Ay Sınav | 5 | 📅 |

---

# BÖLÜM 4: SAYFA HARİTASI

## 4.1 Tam Sayfa Yapısı

```
/admin/spectra/                             ← Ana Dashboard
│
├── /sihirbaz                               ← Yeni Sınav Oluştur (5 Adım)
│   ├── Adım 1: Sınav Bilgileri
│   ├── Adım 2: Optik Şablon Seç
│   ├── Adım 3: Cevap Anahtarı
│   ├── Adım 4: Veri Yükle (TXT)
│   └── Adım 5: Önizle & Yayınla
│
├── /sinavlar                               ← Sınav Listesi
│   └── /[examId]                           ← Sınav Detay & Analiz
│       ├── Özet Kartlar
│       ├── Öğrenci Sıralaması
│       ├── Ders Analizi
│       └── Sınıf Karşılaştırma
│
├── /ogrenciler                             ← Asil Öğrenci Listesi
│   └── /[studentId]                        ← Öğrenci Detay
│       ├── Tüm Sınavları
│       ├── Trend Grafiği
│       └── Karne
│
├── /misafirler                             ← Misafir Öğrenci Listesi
│   └── Eşleştirme İşlemleri
│
├── /sablonlar                              ← Optik Şablon Kütüphanesi
│   ├── Hazır Şablonlar (LGS, TYT, AYT)
│   └── /tasarimci                          ← Yeni Şablon Oluştur
│
├── /sinif-karsilastirma                    ← Sınıf Bazlı Analiz
│
├── /trend                                  ← Zaman Serisi Analizi
│
├── /hedef                                  ← Hedef Takip
│
├── /risk                                   ← Risk Altındaki Öğrenciler
│
├── /ai                                     ← AI Öneriler (Gelecek)
│
├── /raporlar                               ← Rapor Merkezi
│   ├── PDF Raporlar
│   └── Excel Export
│
├── /karneler                               ← Karne Oluşturma
│
└── /ayarlar                                ← Modül Ayarları
    └── Puanlama Kuralları
```

## 4.2 Her Sayfa İçin Detaylı Açıklama

### 📊 Dashboard (`/admin/spectra`)

**Amaç:** Modülün ana giriş noktası, tüm özet istatistikler

**İçerik:**
- Header (arama, kurum seçici, yıl seçici, kullanıcı menüsü)
- 6 üst istatistik kartı
- 12 navigasyon kartı (4x3 grid)
- 4 alt istatistik kartı

---

### 📝 Yeni Sınav Ekle (`/admin/spectra/sihirbaz`)

**Amaç:** 5 adımlı sınav oluşturma sihirbazı

**Adımlar:**

1. **Sınav Bilgileri**
   - Sınav adı (zorunlu)
   - Sınav türü (LGS/TYT/AYT/Deneme)
   - Tarih
   - Açıklama

2. **Optik Şablon Seç**
   - Hazır şablonlar
   - Özel şablon oluştur
   - Şablon önizleme

3. **Cevap Anahtarı**
   - Manuel giriş (A-B-C-D-E)
   - Toplu yapıştır
   - İptal soru işaretle

4. **Veri Yükle**
   - TXT/DAT/CSV yükle
   - Otomatik parse
   - Hata kontrolü
   - Önizleme

5. **Önizle & Yayınla**
   - Tüm bilgiler özet
   - İstatistik önizleme
   - Onay ve yayınla

---

### 📋 Sınavlar Listesi (`/admin/spectra/sinavlar`)

**Amaç:** Tüm sınavları listele ve yönet

**Özellikler:**
- Tablo görünümü
- Filtreleme (durum, tür, tarih)
- Arama
- Sıralama
- İşlemler (düzenle, sil, kopyala)

**Tablo Kolonları:**
| Kolon | Açıklama |
|-------|----------|
| Sınav Adı | Tıklanabilir → detay |
| Tür | Badge (LGS/TYT/AYT) |
| Tarih | Format: 15 Ocak 2026 |
| Katılımcı | Sayı |
| Ortalama | Net değer |
| Durum | Badge (Taslak/Aktif/Yayında) |
| İşlemler | Dropdown menü |

---

### 📊 Sınav Detay (`/admin/spectra/sinavlar/[examId]`)

**Amaç:** Tek sınavın tam analizi

**Bölümler:**

1. **Header**
   - Geri butonu
   - Sınav adı, tarih
   - Refresh, Excel, PDF butonları

2. **Özet Kartlar (6 adet)**
   - Katılımcı sayısı
   - Ortalama net
   - En yüksek net
   - En düşük net
   - Standart sapma
   - Medyan

3. **Grafikler**
   - Net dağılım histogramı
   - Doğru/Yanlış/Boş pasta grafiği

4. **Öğrenci Tablosu**
   - Sıralama (madalya emojileri)
   - Öğrenci no, ad soyad
   - Ders bazlı netler
   - Toplam net
   - Akordiyon detay

5. **Sınıf Karşılaştırma**
   - Sınıf ortalamaları tablosu
   - Performans barları

---

### 👨‍🎓 Öğrenci Performans (`/admin/spectra/ogrenciler`)

**Amaç:** Asil öğrencilerin tüm sınav performansları

**Özellikler:**
- Öğrenci listesi
- Tüm sınavlardaki performans
- Trend grafiği
- Karşılaştırma

---

### 👥 Misafir Öğrenciler (`/admin/spectra/misafirler`)

**Amaç:** Misafir öğrenci yönetimi ve eşleştirme

**Özellikler:**
- Bekleyen eşleştirmeler
- Manuel eşleştirme arayüzü
- Toplu eşleştirme
- Misafir olarak bırak

---

### 📋 Optik Şablonlar (`/admin/spectra/sablonlar`)

**Amaç:** Şablon kütüphanesi yönetimi

**Özellikler:**
- Hazır şablonlar (LGS, TYT, AYT)
- Özel şablon oluşturma
- Şablon düzenleme
- Şablon kopyalama

---

# BÖLÜM 5: VERİTABANI

## 5.1 Tablo Listesi (Özet)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TABLO LİSTESİ                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KURUM BAZLI (Paylaşımlı)                                                  │
│  ───────────────────────────────────────────────────────                   │
│  1. optik_sablonlar        → Optik form şablonları                         │
│  2. puanlama_kurallari     → Net hesaplama kuralları                       │
│                                                                             │
│  SINAV BAZLI (Her sınava özel)                                             │
│  ───────────────────────────────────────────────────────                   │
│  3. ea_sinavlar            → Ana sınav kaydı                               │
│  4. ea_sinav_dersleri      → Sınavdaki dersler                             │
│  5. ea_cevap_anahtarlari   → Doğru cevaplar                                │
│  6. ea_kitapcik_eslestirme → A-B-C-D soru eşleşmesi                        │
│  7. ea_ham_yuklemeler      → Yüklenen TXT dosyaları                        │
│  8. ea_katilimcilar        → ⭐ MERKEZ TABLO                               │
│  9. ea_onizleme_sonuclari  → Onay bekleyen sonuçlar                        │
│  10. ea_sinav_sonuclari    → Onaylanmış sonuçlar                           │
│  11. ea_ders_sonuclari     → Ders bazlı sonuçlar                           │
│  12. ea_degisiklik_loglari → Audit trail                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# BÖLÜM 6: DOSYA YAPISI

## 6.1 Tam Klasör Yapısı

```
📁 src/
│
├── 📁 app/
│   └── 📁 (dashboard)/
│       └── 📁 admin/
│           └── 📁 spectra/                  ← 🆕 ANA MODÜL (exam-analytics yerine)
│               │
│               ├── 📄 page.tsx              ← Dashboard
│               ├── 📄 layout.tsx            ← Layout + Sidebar
│               │
│               ├── 📁 sihirbaz/             ← Wizard
│               │   ├── 📄 page.tsx
│               │   └── 📁 _steps/
│               │       ├── 📄 Step1SinavBilgileri.tsx
│               │       ├── 📄 Step2OptikSablon.tsx
│               │       ├── 📄 Step3CevapAnahtari.tsx
│               │       ├── 📄 Step4VeriYukle.tsx
│               │       └── 📄 Step5OnizleYayinla.tsx
│               │
│               ├── 📁 sinavlar/
│               │   ├── 📄 page.tsx
│               │   └── 📁 [examId]/
│               │       └── 📄 page.tsx
│               │
│               ├── 📁 ogrenciler/
│               │   ├── 📄 page.tsx
│               │   └── 📁 [studentId]/
│               │       └── 📄 page.tsx
│               │
│               ├── 📁 misafirler/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 sablonlar/
│               │   ├── 📄 page.tsx
│               │   └── 📁 tasarimci/
│               │       └── 📄 page.tsx
│               │
│               ├── 📁 sinif-karsilastirma/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 trend/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 hedef/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 risk/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 ai/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 raporlar/
│               │   └── 📄 page.tsx
│               │
│               ├── 📁 karneler/
│               │   └── 📄 page.tsx
│               │
│               └── 📁 ayarlar/
│                   └── 📄 page.tsx
│
├── 📁 components/
│   └── 📁 spectra/                          ← 🆕 MODÜL COMPONENTLERİ
│       │
│       ├── 📁 layout/                       ← ⭐ YENİ: Layout componentleri
│       │   ├── 📄 SpectraSidebar.tsx
│       │   ├── 📄 SpectraHeader.tsx
│       │   └── 📄 SpectraLayout.tsx
│       │
│       ├── 📁 dashboard/                    ← ⭐ YENİ: Dashboard componentleri
│       │   ├── 📄 StatCard.tsx
│       │   ├── 📄 NavCard.tsx
│       │   ├── 📄 StatsGrid.tsx
│       │   └── 📄 QuickActions.tsx
│       │
│       ├── 📁 wizard/
│       │   ├── 📄 WizardShell.tsx
│       │   ├── 📄 WizardProgress.tsx
│       │   └── 📄 WizardNavigation.tsx
│       │
│       ├── 📁 sablon/
│       │   ├── 📄 SablonKart.tsx
│       │   ├── 📄 SablonSecici.tsx
│       │   ├── 📄 SablonTasarimci.tsx
│       │   └── 📄 SablonOnizleme.tsx
│       │
│       ├── 📁 cevap-anahtari/
│       │   ├── 📄 CevapGirisi.tsx
│       │   ├── 📄 CevapTablo.tsx
│       │   └── 📄 TopluCevapYukle.tsx
│       │
│       ├── 📁 veri-yukle/
│       │   ├── 📄 DosyaYukleyici.tsx
│       │   ├── 📄 VeriOnizleme.tsx
│       │   └── 📄 HataListesi.tsx
│       │
│       ├── 📁 analiz/
│       │   ├── 📄 OzetKartlar.tsx
│       │   ├── 📄 OgrenciTablosu.tsx
│       │   ├── 📄 DersAnalizi.tsx
│       │   ├── 📄 SinifKarsilastirma.tsx
│       │   ├── 📄 NetDagilimi.tsx
│       │   └── 📄 OgrenciDetay.tsx
│       │
│       └── 📁 export/
│           ├── 📄 ExcelExport.tsx
│           └── 📄 PdfRapor.tsx
│
├── 📁 hooks/
│   └── 📁 spectra/
│       ├── 📄 useSinavlar.ts
│       ├── 📄 useSablonlar.ts
│       ├── 📄 useKatilimcilar.ts
│       ├── 📄 useSonuclar.ts
│       └── 📄 useIstatistikler.ts
│
├── 📁 lib/
│   └── 📁 spectra/
│       ├── 📄 hesaplamalar.ts
│       ├── 📄 txt-parser.ts
│       ├── 📄 eslestirme.ts
│       ├── 📄 export-excel.ts
│       ├── 📄 export-pdf.ts
│       └── 📄 sabitler.ts
│
└── 📁 types/
    └── 📄 spectra.types.ts
```

---

# BÖLÜM 7: COMPONENTLER

## 7.1 Layout Componentleri

### SpectraSidebar.tsx

```typescript
// Props
interface SpectraSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
}

// Menü yapısı
const SIDEBAR_MENU = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/admin/spectra' },
  { id: 'sinavlar', icon: '📝', label: 'Sınavlar', path: '/admin/spectra/sinavlar' },
  { id: 'ogrenciler', icon: '👨‍🎓', label: 'Öğrenciler', path: '/admin/spectra/ogrenciler' },
  { id: 'misafirler', icon: '👥', label: 'Misafirler', path: '/admin/spectra/misafirler' },
  { id: 'sablonlar', icon: '📋', label: 'Optik Şablonlar', path: '/admin/spectra/sablonlar' },
  { id: 'raporlar', icon: '📈', label: 'Raporlar', path: '/admin/spectra/raporlar' },
  { id: 'ayarlar', icon: '⚙️', label: 'Ayarlar', path: '/admin/spectra/ayarlar' },
];
```

### SpectraHeader.tsx

```typescript
// Props
interface SpectraHeaderProps {
  kurum: Kurum;
  selectedYear: string;
  onYearChange: (year: string) => void;
  user: User;
}

// Özellikler
- Öğrenci arama (⌘K shortcut)
- Kurum seçici
- Yıl seçici
- Kullanıcı menüsü
```

### SpectraLayout.tsx

```typescript
// Ana layout wrapper
// Sidebar + Header + Content

export default function SpectraLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex min-h-screen">
      <SpectraSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1" style={{ marginLeft: sidebarOpen ? '240px' : '72px' }}>
        <SpectraHeader />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

## 7.2 Dashboard Componentleri

### StatCard.tsx

```typescript
interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  variant: 'primary' | 'warning' | 'white';
  trend?: { value: number; direction: 'up' | 'down' };
}
```

### NavCard.tsx

```typescript
interface NavCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  path: string;
  onClick?: () => void;
}
```

---

# BÖLÜM 8: ALTIN KURALLAR

## 🚨 DEĞİŞTİRİLEMEZ KURALLAR

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🚨 ALTIN KURALLAR (ANAYASA)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ MODÜL İZOLASYONU                                                       │
│  ────────────────────────────────────────────────────────────────          │
│  Spectra modülü kendi kendine yeterli olmalı.                              │
│  ❌ Ana sistemin layout'unu değiştirme                                     │
│  ❌ Başka modüllere bağımlılık                                             │
│  ✅ /admin/spectra altında izole çalışma                                   │
│                                                                             │
│  2️⃣ YAZMA YASAĞI                                                           │
│  ────────────────────────────────────────────────────────────────          │
│  Bu modül aşağıdaki tablolara ASLA YAZAMAZ:                                │
│  ❌ students    ❌ persons    ❌ users                                       │
│  ➡️ Sadece OKUR, veri BOZMAZ                                               │
│                                                                             │
│  3️⃣ MERKEZ TABLO                                                           │
│  ────────────────────────────────────────────────────────────────          │
│  ea_katilimcilar bu modülün TEK MERKEZİDİR.                                │
│  ❌ Alternatif katılımcı tablosu oluşturulamaz                             │
│                                                                             │
│  4️⃣ SIDEBAR KURALLARI                                                      │
│  ────────────────────────────────────────────────────────────────          │
│  ✅ Sadece Spectra sayfalarında görünür                                    │
│  ✅ Ana sistemin sidebar'ını değiştirmez                                   │
│  ✅ Toggle ile daraltılabilir/genişletilebilir                             │
│                                                                             │
│  5️⃣ RENK KODLARI                                                           │
│  ────────────────────────────────────────────────────────────────          │
│  Primary: #10b981 (emerald-500)                                            │
│  Primary Dark: #059669 (emerald-600)                                       │
│  Warning: #f97316 (orange-500)                                             │
│  Danger: #ef4444 (red-500)                                                 │
│  Info: #3b82f6 (blue-500)                                                  │
│  AI/Special: #8b5cf6 (violet-500)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 HIZLI BAŞLANGIÇ

### Adım 1: Cursor'a şunu söyle:

```
Bu SPECTRA dokümanını oku. AI Exam Analytics modülünü 
/admin/spectra altında inşa edeceğiz.

Önce layout ve sidebar oluştur:
1. src/app/(dashboard)/admin/spectra/layout.tsx
2. src/components/spectra/layout/SpectraSidebar.tsx
3. src/components/spectra/layout/SpectraHeader.tsx

Sidebar yeşil gradient olacak (emerald), 
toggle ile daraltılabilir olacak.
```

### Adım 2: Dashboard

```
Şimdi dashboard sayfasını oluştur:
src/app/(dashboard)/admin/spectra/page.tsx

- 6 üst istatistik kartı (yeşil gradient)
- 12 navigasyon kartı (4x3 grid)
- 4 alt istatistik kartı (beyaz)

Ekran görüntüsündeki tasarımı baz al.
```

---

**📄 DOKÜMAN SONU - v4.0**
