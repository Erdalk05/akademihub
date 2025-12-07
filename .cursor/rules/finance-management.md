# 💰 AKADEMİHUB - FİNANS MODÜLÜ TAM DOKÜMANTASYON

> **En Gelişmiş Okul Finans Yönetim Sistemi** - AI destekli, otomatik tahsilat, akıllı tahminler, tam muhasebe entegrasyonu

---

## 📋 İÇİNDEKİLER

1. [Modül Genel Bakış](#modül-genel-bakış)
2. [Veri Modeli](#veri-modeli)
3. [Dashboard & Analytics](#dashboard--analytics)
4. [Ödeme Yönetimi](#ödeme-yönetimi)
5. [Gider Yönetimi](#gider-yönetimi)
6. [Satış & Stok](#satış--stok)
7. [Kasa & Banka](#kasa--banka)
8. [Muhasebe Entegrasyonu](#muhasebe-entegrasyonu)
9. [AI Özellikleri](#ai-özellikleri)
10. [Raporlama Sistemi](#raporlama-sistemi)
11. [Cursor Uygulama Adımları](#cursor-uygulama-adımları)

---

## 🎯 MODÜL GENEL BAKIŞ

### Temel Özellikler

```
┌─────────────────────────────────────────────────────────┐
│                  FİNANS MODÜLÜ ÖZETİ                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 DASHBOARD                                           │
│  • Gerçek zamanlı gelir-gider takibi                   │
│  • AI destekli nakit akış tahmini                       │
│  • Borçlu öğrenci erken uyarı sistemi                  │
│  • Karlılık analizi & trendler                         │
│                                                         │
│  💳 ÖDEME YÖNETİMİ                                      │
│  • Hızlı ödeme alma (nakit, kart, havale, çek)        │
│  • Esnek taksit planı yönetimi                         │
│  • Otomatik gecikme faizi hesaplama                    │
│  • SMS/Email ödeme hatırlatma                          │
│  • Otomatik tahsilat (kredi kartı)                     │
│                                                         │
│  📤 GİDER YÖNETİMİ                                      │
│  • Kategori bazlı gider takibi                         │
│  • Fatura/fiş kayıt & onay sistemi                     │
│  • Maaş bordrosu yönetimi                              │
│  • Bütçe kontrolü & aşım uyarıları                     │
│  • Tedarikçi yönetimi                                  │
│                                                         │
│  🛒 SATIŞ & STOK                                        │
│  • Kitap satış yönetimi                                │
│  • Kıyafet/üniforma satışı                             │
│  • Kantin işletme takibi                               │
│  • Stok yönetimi & minimum stok uyarısı                │
│  • e-Fatura entegrasyonu                               │
│                                                         │
│  🏦 KASA & BANKA                                        │
│  • Çoklu kasa yönetimi                                 │
│  • Banka hesap hareketleri                             │
│  • Çek/senet takibi                                    │
│  • Virman işlemleri                                    │
│  • Gün sonu kasa sayımı                                │
│                                                         │
│  📈 MUHASEBE                                            │
│  • Otomatik fiş kesme                                  │
│  • Hesap planı yönetimi                                │
│  • Mizan & bilanço                                     │
│  • KDV & muhtasar beyanname                            │
│  • e-Defter entegrasyonu                               │
│                                                         │
│  🤖 AI ÖZELLİKLERİ                                      │
│  • Ödeme yapma olasılığı tahmini                       │
│  • 3 aylık nakit akış projeksiyonu                     │
│  • Gider optimizasyon önerileri                        │
│  • Risk analizi & erken uyarı                          │
│  • Otomatik kategori eşleştirme                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 MODÜL YAPISI

```
/src/modules/finance
├── /pages
│   ├── FinanceDashboardPage.tsx          # Ana dashboard
│   ├── PaymentManagementPage.tsx         # Ödeme yönetimi
│   ├── ExpenseManagementPage.tsx         # Gider yönetimi
│   ├── SalesManagementPage.tsx           # Satış yönetimi
│   ├── CashBankPage.tsx                  # Kasa & banka
│   ├── AccountingPage.tsx                # Muhasebe
│   └── ReportsPage.tsx                   # Raporlar
│
├── /components
│   ├── /dashboard
│   │   ├── FinanceOverview.tsx           # Genel bakış kartları
│   │   ├── CashFlowChart.tsx             # Nakit akış grafiği
│   │   ├── IncomeExpenseChart.tsx        # Gelir-gider grafiği
│   │   ├── DebtorsList.tsx               # Borçlu listesi
│   │   ├── PendingPayments.tsx           # Bekleyen ödemeler
│   │   └── AIInsights.tsx                # AI öngörüleri
│   │
│   ├── /payment
│   │   ├── QuickPayment.tsx              # Hızlı ödeme alma
│   │   ├── PaymentForm.tsx               # Ödeme formu
│   │   ├── InstallmentPlan.tsx           # Taksit planı
│   │   ├── PaymentHistory.tsx            # Ödeme geçmişi
│   │   ├── BulkPaymentReminder.tsx       # Toplu hatırlatma
│   │   └── AutoPaymentSetup.tsx          # Otomatik ödeme
│   │
│   ├── /expense
│   │   ├── ExpenseForm.tsx               # Gider formu
│   │   ├── ExpenseList.tsx               # Gider listesi
│   │   ├── ExpenseApproval.tsx           # Gider onay
│   │   ├── SalaryPayroll.tsx             # Maaş bordrosu
│   │   ├── BudgetControl.tsx             # Bütçe kontrolü
│   │   └── SupplierManagement.tsx        # Tedarikçi yönetimi
│   │
│   ├── /sales
│   │   ├── SalesForm.tsx                 # Satış formu
│   │   ├── ProductCatalog.tsx            # Ürün kataloğu
│   │   ├── StockManagement.tsx           # Stok yönetimi
│   │   ├── InvoiceGenerator.tsx          # Fatura oluşturma
│   │   └── SalesReport.tsx               # Satış raporu
│   │
│   ├── /cash-bank
│   │   ├── CashRegister.tsx              # Kasa işlemleri
│   │   ├── BankAccounts.tsx              # Banka hesapları
│   │   ├── CheckManagement.tsx           # Çek yönetimi
│   │   ├── TransferForm.tsx              # Virman formu
│   │   └── DailyClosing.tsx              # Gün sonu
│   │
│   ├── /accounting
│   │   ├── JournalEntry.tsx              # Yevmiye kaydı
│   │   ├── GeneralLedger.tsx             # Büyük defter
│   │   ├── TrialBalance.tsx              # Mizan
│   │   ├── BalanceSheet.tsx              # Bilanço
│   │   └── TaxReports.tsx                # Vergi raporları
│   │
│   └── /ai
│       ├── PaymentPrediction.tsx         # Ödeme tahmini
│       ├── CashFlowForecast.tsx          # Nakit akış tahmini
│       ├── ExpenseOptimization.tsx       # Gider optimizasyonu
│       └── RiskAssessment.tsx            # Risk değerlendirmesi
│
├── /hooks
│   ├── usePayments.ts                    # Ödeme işlemleri
│   ├── useExpenses.ts                    # Gider işlemleri
│   ├── useSales.ts                       # Satış işlemleri
│   ├── useCashBank.ts                    # Kasa/banka işlemleri
│   ├── useAccounting.ts                  # Muhasebe işlemleri
│   └── useFinanceAI.ts                   # AI işlemleri
│
├── /services
│   ├── paymentService.ts                 # Ödeme servisi
│   ├── expenseService.ts                 # Gider servisi
│   ├── salesService.ts                   # Satış servisi
│   ├── accountingService.ts              # Muhasebe servisi
│   └── financeAI.ts                      # AI servisi
│
├── /utils
│   ├── financeCalculations.ts            # Finansal hesaplamalar
│   ├── taxCalculations.ts                # Vergi hesaplamaları
│   ├── installmentGenerator.ts           # Taksit oluşturma
│   ├── receiptGenerator.ts               # Makbuz oluşturma
│   └── invoiceGenerator.ts               # Fatura oluşturma
│
└── /types
    ├── payment.types.ts                  # Ödeme tipleri
    ├── expense.types.ts                  # Gider tipleri
    ├── sales.types.ts                    # Satış tipleri
    ├── accounting.types.ts               # Muhasebe tipleri
    └── finance.types.ts                  # Genel finans tipleri
```

---

## 📊 VERİ MODELİ

### 1. Payment (Ödeme)

```typescript
interface Payment extends BaseEntity {
  // ==================== TEMEL BİLGİLER ====================
  odemeno: string;                        // ODE-2025-0001
  tip: PaymentType;
  durum: PaymentStatus;
  
  // ==================== ÖĞRENCI BİLGİSİ ====================
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    sinif: string;
    ogrenciNo: string;
  };
  
  // ==================== TUTAR BİLGİLERİ ====================
  tutar: {
    toplam: number;                       // Ana tutar
    indirim: number;                      // İndirim varsa
    gecikmeUcreti: number;                // Gecikme ücreti varsa
    net: number;                          // Ödenen net tutar
  };
  
  // ==================== ÖDEME DETAYI ====================
  odemeDetay: {
    yontem: PaymentMethod;
    
    // Nakit
    nakit?: {
      alinan: number;
      paraUstu: number;
    };
    
    // Kredi Kartı
    krediKarti?: {
      kartSahibi: string;
      sonDortHane: string;
      taksitSayisi: number;
      taksitTutari: number;
      komisyon: number;
      posIslemNo: string;
      banka: string;
    };
    
    // Havale/EFT
    havale?: {
      bankaAdi: string;
      hesapNo: string;
      referansNo: string;
      dekontUrl?: string;
    };
    
    // Çek
    cek?: {
      cekNo: string;
      bankaAdi: string;
      subeAdi: string;
      vadeTarihi: Date;
      durum: CheckStatus;
    };
    
    // Senet
    senet?: {
      senetNo: string;
      vadeTarihi: Date;
      durum: 'Beklemede' | 'Tahsil Edildi' | 'İade';
    };
  };
  
  // ==================== TARİH BİLGİLERİ ====================
  tarihler: {
    odeme: Date;                          // Ödeme tarihi
    vade: Date;                           // Vade tarihi (taksit için)
    kayit: Date;                          // Kayıt tarihi
    iptal?: Date;                         // İptal tarihi
  };
  
  // ==================== KATEGORI ====================
  kategori: PaymentCategory;
  altKategori?: string;
  
  // ==================== ÖDEMEYE İLİŞKİN ====================
  iliskili: {
    sozlesmeId?: string;                  // Hangi sözleşme
    taksitNo?: number;                    // Kaçıncı taksit
    faturaId?: string;                    // Fatura varsa
    makbuzNo?: string;                    // Makbuz numarası
  };
  
  // ==================== ÖDEME YAPAN ====================
  odemeYapan: {
    tip: 'Veli' | 'Öğrenci' | 'Diğer';
    ad: string;
    soyad: string;
    tcKimlik?: string;
    telefon?: string;
  };
  
  // ==================== TAHSİLAT ====================
  tahsilat: {
    yapan: string;                        // User ID (tahsilat yapan personel)
    kasaId: string;                       // Hangi kasaya
    bankaId?: string;                     // Hangi banka hesabına
  };
  
  // ==================== NOTLAR & AÇIKLAMA ====================
  aciklama?: string;
  notlar?: string;
  
  // ==================== MUHASEBE ====================
  muhasebe: {
    fisNo?: string;
    fisKesildi: boolean;
    faturaDurumu: 'Beklemede' | 'Kesildi' | 'İptal';
    faturaNo?: string;
    faturaUrl?: string;
  };
  
  // ==================== İPTAL ====================
  iptal?: {
    neden: string;
    yapan: string;
    tarih: Date;
    iadeTutari: number;
    iadeSekli: PaymentMethod;
  };
}

// ==================== ENUMs ====================
type PaymentType = 
  | 'Eğitim Ücreti'
  | 'Kayıt Ücreti'
  | 'Servis Ücreti'
  | 'Yemek Ücreti'
  | 'Kitap Satışı'
  | 'Kıyafet Satışı'
  | 'Etüt Ücreti'
  | 'Kurs Ücreti'
  | 'Diğer';

type PaymentStatus = 
  | 'Tamamlandı'
  | 'Beklemede'
  | 'İptal'
  | 'İade';

type PaymentMethod = 
  | 'Nakit'
  | 'Kredi Kartı'
  | 'Havale/EFT'
  | 'Çek'
  | 'Senet'
  | 'Döviz'
  | 'Karma';  // Birden fazla yöntem

type PaymentCategory = 
  | 'Gelir'
  | 'İade';

type CheckStatus = 
  | 'Portföyde'
  | 'Tahsil Edildi'
  | 'Ciro Edildi'
  | 'Karşılıksız'
  | 'İade';
```

---

### 2. Expense (Gider)

```typescript
interface Expense extends BaseEntity {
  // ==================== TEMEL BİLGİLER ====================
  giderNo: string;                        // GID-2025-0001
  tip: ExpenseType;
  durum: ExpenseStatus;
  
  // ==================== KATEGORİ ====================
  kategori: ExpenseCategory;
  altKategori?: string;
  
  // ==================== TUTAR ====================
  tutar: {
    brut: number;
    kdv: number;
    kdvOrani: number;
    stopaj: number;
    stopajOrani: number;
    net: number;
  };
  
  // ==================== FATURA BİLGİSİ ====================
  fatura: {
    faturaNo?: string;
    faturaTarihi?: Date;
    faturaUrl?: string;
    faturaVarMi: boolean;
  };
  
  // ==================== TEDARİKÇİ ====================
  tedarikci?: {
    id: string;
    ad: string;
    vergiNo: string;
    telefon: string;
  };
  
  // ==================== TARİHLER ====================
  tarihler: {
    giderTarihi: Date;
    vadeTarihi?: Date;
    odemeTarihi?: Date;
    kayitTarihi: Date;
  };
  
  // ==================== ÖDEME DETAYI ====================
  odeme: {
    yapildiMi: boolean;
    yontem?: PaymentMethod;
    kasaId?: string;
    bankaId?: string;
    odemeNo?: string;
  };
  
  // ==================== ONAY SİSTEMİ ====================
  onay: {
    durumu: 'Beklemede' | 'Onaylandı' | 'Reddedildi';
    onaylayan?: string;
    onayTarihi?: Date;
    redNedeni?: string;
  };
  
  // ==================== BÜTÇE ====================
  butce: {
    butceId?: string;
    butceKalani?: number;
    butceyiAsti: boolean;
  };
  
  // ==================== AÇIKLAMA ====================
  aciklama: string;
  notlar?: string;
  
  // ==================== MUHASEBE ====================
  muhasebe: {
    fisNo?: string;
    hesapKodu?: string;
    fisKesildi: boolean;
  };
  
  // ==================== TALEPLENİŞ ====================
  talep: {
    talep Eden: string;                    // User ID
    departman: string;
    aciliyet: 'Düşük' | 'Normal' | 'Yüksek' | 'Acil';
  };
}

// ==================== ENUMs ====================
type ExpenseType = 
  | 'Sabit Gider'
  | 'Değişken Gider'
  | 'Yatırım'
  | 'Personel'
  | 'İşletme';

type ExpenseStatus = 
  | 'Beklemede'
  | 'Onaylandı'
  | 'Ödendi'
  | 'Reddedildi'
  | 'İptal';

type ExpenseCategory = 
  | 'Personel Maaşları'
  | 'Kira'
  | 'Elektrik'
  | 'Su'
  | 'Doğalgaz'
  | 'İnternet/Telefon'
  | 'Kırtasiye'
  | 'Temizlik'
  | 'Yemek'
  | 'Yakıt'
  | 'Bakım/Onarım'
  | 'Reklam/Tanıtım'
  | 'Vergi/Harç'
  | 'Sigorta'
  | 'Eğitim Materyali'
  | 'Teknoloji'
  | 'Danışmanlık'
  | 'Banka Masrafları'
  | 'Diğer';
```

---

### 3. Sale (Satış)

```typescript
interface Sale extends BaseEntity {
  // ==================== TEMEL BİLGİLER ====================
  satisNo: string;                        // SAT-2025-0001
  tip: SaleType;
  durum: SaleStatus;
  
  // ==================== MÜŞTERİ ====================
  musteri: {
    tip: 'Öğrenci' | 'Veli' | 'Personel' | 'Dış Müşteri';
    id?: string;                          // Öğrenci/Personel ID
    ad: string;
    soyad: string;
    telefon?: string;
    tcKimlik?: string;                    // Fatura için
  };
  
  // ==================== ÜRÜNLER ====================
  urunler: Array<{
    urunId: string;
    urunAdi: string;
    kategori: ProductCategory;
    miktar: number;
    birimFiyat: number;
    indirim: number;                      // %
    kdvOrani: number;                     // %
    toplamTutar: number;
  }>;
  
  // ==================== TUTAR DETAYI ====================
  tutar: {
    araTop lam: number;
    genelIndirim: number;                 // %
    indirimTutari: number;
    kdvToplam: number;
    genelToplam: number;
  };
  
  // ==================== ÖDEME ====================
  odeme: {
    yontem: PaymentMethod;
    tahsilatDurumu: 'Ödendi' | 'Bekliyor' | 'Kısmi';
    odenecekTutar: number;
    odenenTutar: number;
    kalanBorc: number;
    odemeReferansNo?: string;
  };
  
  // ==================== FATURA ====================
  fatura: {
    kesildiMi: boolean;
    tip?: 'e-Fatura' | 'e-Arşiv' | 'Fatura' | 'İrsaliye';
    faturaNo?: string;
    faturaUrl?: string;
    faturaTarihi?: Date;
  };
  
  // ==================== TARİHLER ====================
  tarihler: {
    satis: Date;
    teslim?: Date;
    kayit: Date;
  };
  
  // ==================== SATIŞ YAPAN ====================
  satisYapan: {
    userId: string;
    ad: string;
    departman: string;
  };
  
  // ==================== STOK ====================
  stok: {
    cikisYapildi: boolean;
    depoId?: string;
  };
  
  // ==================== İADE ====================
  iade?: {
    iadeMi: boolean;
    iadeTarihi?: Date;
    iadeNedeni?: string;
    iadeTutari?: number;
    iadeYontemi?: PaymentMethod;
  };
  
  // ==================== NOTLAR ====================
  notlar?: string;
}

// ==================== ENUMs ====================
type SaleType = 
  | 'Kitap'
  | 'Kıyafet'
  | 'Kırtasiye'
  | 'Kantin'
  | 'Diğer';

type SaleStatus = 
  | 'Tamamlandı'
  | 'Beklemede'
  | 'İptal'
  | 'İade';

type ProductCategory = 
  | 'Ders Kitabı'
  | 'Yardımcı Kitap'
  | 'Üniforma'
  | 'Spor Kıyafeti'
  | 'Defter/Kalem'
  | 'Yiyecek/İçecek'
  | 'Diğer';
```

---

### 4. CashRegister (Kasa)

```typescript
interface CashRegister extends BaseEntity {
  // ==================== TEMEL BİLGİLER ====================
  kasaAdi: string;                        // "Ana Kasa", "Kantin Kasası"
  kasaKodu: string;                       // KAS-001
  tip: 'Ana Kasa' | 'Alt Kasa' | 'Kantin' | 'Sekreterlik';
  durum: 'Aktif' | 'Kapalı';
  
  // ==================== BAKİYE ====================
  bakiye: {
    nakit: number;
    cek: number;
    senet: number;
    toplam: number;
  };
  
  // ==================== GÜNLÜK İŞLEMLER ====================
  gunlukIslemler: Array<{
    id: string;
    tip: 'Giriş' | 'Çıkış';
    tutar: number;
    kategori: string;
    aciklama: string;
    referansNo: string;                   // Ödeme/Gider no
    tarih: Date;
    yapan: string;                        // User ID
  }>;
  
  // ==================== GÜN SONU ====================
  gunSonu: {
    sonSayimTarihi?: Date;
    beklenenBakiye?: number;
    gercekBakiye?: number;
    fark?: number;
    sayimYapan?: string;
    onaylayan?: string;
    aciklama?: string;
  };
  
  // ==================== SORUMLU ====================
  sorumlu: {
    userId: string;
    ad: string;
    soyad: string;
  };
  
  // ==================== LOKASYON ====================
  lokasyon?: string;                      // "Giriş Katı", "1. Kat Müdür Odası"
}
```

---

### 5. BankAccount (Banka Hesabı)

```typescript
interface BankAccount extends BaseEntity {
  // ==================== BANKA BİLGİLERİ ====================
  bankaAdi: string;
  subeAdi: string;
  subeKodu: string;
  hesapNo: string;
  iban: string;
  
  // ==================== HESAP TİPİ ====================
  hesapTipi: 'Vadesiz' | 'Vadeli' | 'Döviz' | 'Kredi';
  parabirimi: 'TRY' | 'USD' | 'EUR' | 'GBP';
  
  // ==================== BAKİYE ====================
  bakiye: number;
  kullanilabilirBakiye: number;
  blokajliBakiye: number;
  
  // ==================== HAREKETler ====================
  hareketler: Array<{
    id: string;
    tarih: Date;
    tip: 'Giren' | 'Çıkan';
    tutar: number;
    aciklama: string;
    referansNo: string;
    dekontUrl?: string;
  }>;
  
  // ==================== KREDİ BİLGİSİ ====================
  kredi?: {
    krediLimiti: number;
    kullanilanKredi: number;
    kalanLimit: number;
    faizOrani: number;
    vadeTarihi: Date;
  };
  
  // ==================== DURUM ====================
  durum: 'Aktif' | 'Pasif' | 'Donduruldu';
  
  // ==================== SORUMLU ====================
  sorumlu: {
    userId: string;
    ad: string;
  };
}
```

---

### 6. Budget (Bütçe)

```typescript
interface Budget extends BaseEntity {
  // ==================== TEMEL BİLGİLER ====================
  ad: string;                             // "2025 Yıllık Bütçe"
  tip: 'Yıllık' | 'Aylık' | 'Proje';
  donem: {
    baslangic: Date;
    bitis: Date;
  };
  durum: 'Taslak' | 'Onaylandı' | 'Aktif' | 'Kapalı';
  
  // ==================== KATEGORİ BAZLI BÜTÇE ====================
  kategoriler: Array<{
    kategori: ExpenseCategory;
    planlananTutar: number;
    harcananTutar: number;
    kalanTutar: number;
    kullanimOrani: number;                // %
    asim: boolean;
  }>;
  
  // ==================== TOPLAM ====================
  toplam: {
    planlanan: number;
    harcanan: number;
    kalan: number;
    kullanimOrani: number;
  };
  
  // ==================== ONAY ====================
  onay: {
    onaylayan?: string;
    onayTarihi?: Date;
    aciklama?: string;
  };
  
  // ==================== UYARILAR ====================
  uyarilar: {
    uyariEsigi: number;                   // % kaç olunca uyarı
    kritikEsik: number;                   // % kaç olunca kritik
  };
}
```

---

## 📊 COMPONENT 1: FINANCE DASHBOARD

**Dosya:** `src/modules/finance/pages/FinanceDashboardPage.tsx`

```typescript
/**
 * Finans Ana Dashboard
 * Gelir-gider özeti, nakit akış, AI öngörüler
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  Download,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  Area,
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  Y
  Axis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const FinanceDashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<FinanceData | null>(null);

  useEffect(() => {
    // TODO: API'den veri çek
    loadFinanceData(timeRange);
  }, [timeRange]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finans Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Gelir-gider takibi ve finansal analiz
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Zaman Aralığı Seçici */}
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
              <Button
                variant={timeRange === 'today' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('today')}
              >
                Bugün
              </Button>
              <Button
                variant={timeRange === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                Hafta
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                Ay
              </Button>
              <Button
                variant={timeRange === 'year' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('year')}
              >
                Yıl
              </Button>
            </div>

            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Tarih Seç
            </Button>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Rapor İndir
            </Button>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Toplam Gelir */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Toplam Gelir</p>
                <h3 className="text-3xl font-bold text-green-900 mt-2">
                  ₺{data?.income.total.toLocaleString() || '0'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    +{data?.income.growth || '0'}%
                  </span>
                  <span className="text-xs text-green-700">önceki döneme göre</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Toplam Gider */}
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Toplam Gider</p>
                <h3 className="text-3xl font-bold text-red-900 mt-2">
                  ₺{data?.expense.total.toLocaleString() || '0'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">
                    +{data?.expense.growth || '0'}%
                  </span>
                  <span className="text-xs text-red-700">önceki döneme göre</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Net Kâr */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Net Kâr</p>
                <h3 className="text-3xl font-bold text-blue-900 mt-2">
                  ₺{data?.profit.net.toLocaleString() || '0'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">
                    {data?.profit.margin || '0'}% kar marjı
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Bekleyen Tahsilat */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Bekleyen Tahsilat</p>
                <h3 className="text-3xl font-bold text-orange-900 mt-2">
                  ₺{data?.pending.total.toLocaleString() || '0'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">
                    {data?.pending.count || '0'} ödeme
                  </span>
                  <span className="text-xs text-orange-700">beklemede</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Ana İçerik - Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="income">Gelir Analizi</TabsTrigger>
            <TabsTrigger value="expense">Gider Analizi</TabsTrigger>
            <TabsTrigger value="cashflow">Nakit Akışı</TabsTrigger>
            <TabsTrigger value="ai">AI Öngörüler</TabsTrigger>
          </TabsList>

          {/* GENEL BAKIŞ TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gelir-Gider Grafiği */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Gelir vs Gider (Son 12 Ay)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
                    <Bar dataKey="gider" fill="#ef4444" name="Gider" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Gelir Dağılımı */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Gelir Dağılımı</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.incomeDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(data?.incomeDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Nakit Akış Trendi */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Nakit Akış Trendi</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.cashFlowData || []}>
                  <defs>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                  <Area 
                    type="monotone" 
                    dataKey="bakiye" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorCash)"
                    name="Bakiye"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Borçlu Öğrenci Listesi */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">⚠️ Borçlu Öğrenciler (Acil)</h3>
                <Badge variant="destructive">
                  {data?.debtors.urgent.length || 0} öğrenci
                </Badge>
              </div>
              
              <div className="space-y-3">
                {(data?.debtors.urgent || []).slice(0, 5).map((debtor) => (
                  <div 
                    key={debtor.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {debtor.ad[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {debtor.ad} {debtor.soyad}
                        </p>
                        <p className="text-sm text-gray-600">
                          {debtor.sinif} - {debtor.gecikmeGunu} gün gecikme
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        ₺{debtor.borc.toLocaleString()}
                      </p>
                      <Button size="sm" variant="outline" className="mt-1">
                        Ödeme Al
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="link" className="w-full mt-3">
                Tüm Borçlu Listeyi Gör ({data?.debtors.total || 0})
              </Button>
            </Card>
          </TabsContent>

          {/* GELİR ANALİZİ TAB */}
          <TabsContent value="income" className="space-y-6">
            {/* Gelir Kategori Detayı */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Kategori Bazlı Gelir Analizi</h3>
              <div className="space-y-4">
                {(data?.incomeCategories || []).map((category) => (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-sm font-bold text-green-600">
                        ₺{category.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{category.count} işlem</span>
                      <span>%{category.percentage.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ödeme Yöntemi Dağılımı */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Ödeme Yöntemi Dağılımı</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data?.paymentMethods || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {(data?.paymentMethods || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Tahsilat Performansı */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tahsilat Performansı</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Zamanında Ödenen</span>
                    <span className="text-lg font-bold text-green-600">
                      %{data?.collectionRate.onTime || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Gecikmeli Ödenen</span>
                    <span className="text-lg font-bold text-yellow-600">
                      %{data?.collectionRate.late || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Ödenmemiş</span>
                    <span className="text-lg font-bold text-red-600">
                      %{data?.collectionRate.unpaid || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* GİDER ANALİZİ TAB */}
          <TabsContent value="expense" className="space-y-6">
            {/* Gider Kategori Analizi */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gider Kategorileri</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={data?.expenseCategories || []}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Bütçe Kontrolü */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bütçe Kullanım Durumu</h3>
              <div className="space-y-4">
                {(data?.budgetStatus || []).map((budget) => (
                  <div key={budget.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{budget.category}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold">
                          ₺{budget.spent.toLocaleString()} / ₺{budget.planned.toLocaleString()}
                        </span>
                        <Badge 
                          variant={budget.percentage > 100 ? 'destructive' : budget.percentage > 80 ? 'warning' : 'default'}
                          className="ml-2"
                        >
                          %{budget.percentage.toFixed(0)}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          budget.percentage > 100 ? 'bg-red-500' :
                          budget.percentage > 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* En Yüksek Giderler */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">En Yüksek Giderler (Bu Ay)</h3>
              <div className="space-y-3">
                {(data?.topExpenses || []).map((expense, index) => (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-gray-500">{expense.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">
                      ₺{expense.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* NAKİT AKIŞI TAB */}
          <TabsContent value="cashflow" className="space-y-6">
            {/* Nakit Akış Özeti */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                <p className="text-sm font-medium text-blue-700">Kasadaki Nakit</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-2">
                  ₺{data?.cash.register.toLocaleString() || '0'}
                </h3>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                <p className="text-sm font-medium text-purple-700">Bankadaki Tutar</p>
                <h3 className="text-2xl font-bold text-purple-900 mt-2">
                  ₺{data?.cash.bank.toLocaleString() || '0'}
                </h3>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                <p className="text-sm font-medium text-green-700">Toplam Likit</p>
                <h3 className="text-2xl font-bold text-green-900 mt-2">
                  ₺{data?.cash.total.toLocaleString() || '0'}
                </h3>
              </Card>
            </div>

            {/* Nakit Akış Projeksiyonu */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Nakit Akış Projeksiyonu (3 Ay)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data?.cashFlowForecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₺${value.toLocaleString()}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="gercekGelir" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Gerçek Gelir"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tahminGelir" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Tahmini Gelir"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gercekGider" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Gerçek Gider"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tahminGider" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Tahmini Gider"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netNakit" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Net Nakit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Çek & Senet Takibi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">📋 Portföydeki Çekler</h3>
                <div className="space-y-3">
                  {(data?.checks || []).map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{check.bank}</p>
                        <p className="text-xs text-gray-500">Vade: {check.dueDate}</p>
                      </div>
                      <span className="font-bold">₺{check.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">📝 Portföydeki Senetler</h3>
                <div className="space-y-3">
                  {(data?.promissoryNotes || []).map((note) => (
                    <div key={note.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Senet No: {note.number}</p>
                        <p className="text-xs text-gray-500">Vade: {note.dueDate}</p>
                      </div>
                      <span className="font-bold">₺{note.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* AI ÖNGÖRÜLER TAB */}
          <TabsContent value="ai" className="space-y-6">
            {/* AI Özet Kartı */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl">
                  🤖
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    AI Finans Asistanı
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Yapay zeka analiz sistemimiz finansal verilerinizi sürekli izleyerek 
                    risk tespiti, nakit akış tahmini ve optimizasyon önerileri sunmaktadır.
                  </p>
                </div>
              </div>
            </Card>

            {/* Risk Skorları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Likidite Riski</h4>
                  <Badge variant={data?.aiInsights.liquidityRisk.level === 'Düşük' ? 'default' : 'destructive'}>
                    {data?.aiInsights.liquidityRisk.level || 'Düşük'}
                  </Badge>
                </div>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-green-600">
                    {data?.aiInsights.liquidityRisk.score || 85}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Risk Skoru</p>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  {data?.aiInsights.liquidityRisk.message || 'Nakit akışınız sağlıklı görünüyor'}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Tahsilat Riski</h4>
                  <Badge variant="warning">
                    {data?.aiInsights.collectionRisk.level || 'Orta'}
                  </Badge>
                </div>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-yellow-600">
                    {data?.aiInsights.collectionRisk.score || 65}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Risk Skoru</p>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  {data?.aiInsights.collectionRisk.message || '15 öğrenci ödeme yapmayabilir'}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font
                  ---

## 💳 COMPONENT 2: QUICK PAYMENT

**Dosya:** `src/modules/finance/components/payment/QuickPayment.tsx`
```typescript
/**
 * Hızlı Ödeme Alma Componenti
 * Öğrenci arama, borç görüntüleme, anında ödeme alma
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CreditCard, Printer, Send } from 'lucide-react';
import type { Student, Payment } from '@/types';

export const QuickPayment: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);

  const handleSearch = async (query: string) => {
    // TODO: API'den öğrenci ara
    // Öğrenci adı, TC, öğrenci no ile arama
  };

  const handlePayment = async () => {
    // TODO: Ödeme kaydet
    // Makbuz oluştur
    // SMS/Email gönder
    setShowReceipt(true);
  };

  return (
    <div className="space-y-6">
      {/* Öğrenci Arama */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Öğrenci Ara</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Öğrenci adı, TC Kimlik veya öğrenci numarası..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
          <Button>
            <Search className="w-4 h-4 mr-2" />
            Ara
          </Button>
        </div>

        {/* Arama Sonuçları */}
        {searchQuery && (
          <div className="mt-4 space-y-2">
            {/* Mock sonuçlar */}
            <div 
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedStudent(mockStudent)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    E
                  </div>
                  <div>
                    <p className="font-medium">Ece Kızıroğlu</p>
                    <p className="text-sm text-gray-600">9-A • STU-2025-0001</p>
                  </div>
                </div>
                <Badge variant="destructive">Borçlu</Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Seçili Öğrenci - Borç Detayı */}
      {selectedStudent && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Borç Durumu</h3>
          
          {/* Öğrenci Bilgisi */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {selectedStudent.ad[0]}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">
                {selectedStudent.ad} {selectedStudent.soyad}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedStudent.sinif} • {selectedStudent.ogrenciNo}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Profili Görüntüle
            </Button>
          </div>

          {/* Borç Özeti */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 mb-1">Toplam Borç</p>
              <p className="text-2xl font-bold text-red-900">
                ₺{selectedStudent.finans.odemeDurumu.toplamBorc.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">Ödenen</p>
              <p className="text-2xl font-bold text-green-900">
                ₺{selectedStudent.finans.odemeDurumu.odenenMiktar.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 mb-1">Kalan</p>
              <p className="text-2xl font-bold text-orange-900">
                ₺{selectedStudent.finans.odemeDurumu.kalanBorc.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Taksit Tablosu */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Taksit Planı</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Taksit</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Vade</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Tutar</th>
                    <th className="px-4 py-2 text-center text-sm font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.finans.odemePlani.taksitler.map((taksit) => (
                    <tr key={taksit.no} className="border-t">
                      <td className="px-4 py-3">{taksit.no}. Taksit</td>
                      <td className="px-4 py-3">
                        {new Date(taksit.vadeTarihi).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₺{taksit.tutar.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {taksit.odendiMi ? (
                          <Badge variant="default">✓ Ödendi</Badge>
                        ) : new Date(taksit.vadeTarihi) < new Date() ? (
                          <Badge variant="destructive">Gecikmiş</Badge>
                        ) : (
                          <Badge variant="secondary">Bekliyor</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ödeme Formu */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <h4 className="font-semibold mb-4">💳 Ödeme Al</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ödeme Tutarı</label>
                <Input
                  type="number"
                  placeholder="Tutar girin"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                />
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setPaymentAmount(12750)}
                  >
                    Taksit (₺12,750)
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setPaymentAmount(selectedStudent.finans.odemeDurumu.kalanBorc)}
                  >
                    Tümü
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ödeme Yöntemi</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nakit">💵 Nakit</SelectItem>
                    <SelectItem value="krediKarti">💳 Kredi Kartı</SelectItem>
                    <SelectItem value="havale">🏦 Havale/EFT</SelectItem>
                    <SelectItem value="cek">📋 Çek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Açıklama (Opsiyonel)</label>
              <Input placeholder="Ödeme açıklaması..." />
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handlePayment}
                disabled={!paymentAmount || !paymentMethod}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Ödemeyi Kaydet ve Makbuz Yazdır
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Makbuz Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ödeme Makbuzu</DialogTitle>
          </DialogHeader>
          
          <div className="p-8 bg-white border-2 border-dashed border-gray-300">
            {/* Makbuz içeriği */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">ÖDEME MAKBUZU</h2>
              <p className="text-sm text-gray-600">AkademiHub Özel Eğitim Kurumları</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Makbuz No:</span>
                <span className="font-semibold">MAK-2025-0001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tarih:</span>
                <span className="font-semibold">{new Date().toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Öğrenci:</span>
                <span className="font-semibold">
                  {selectedStudent?.ad} {selectedStudent?.soyad}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sınıf:</span>
                <span className="font-semibold">{selectedStudent?.sinif}</span>
              </div>
            </div>

            <div className="border-t border-b py-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Ödenen Tutar:</span>
                <span className="font-bold text-green-600">₺{paymentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Ödeme Yöntemi:</span>
                <span>{paymentMethod}</span>
              </div>
            </div>

            <p className="text-xs text-center text-gray-500">
              Bu makbuz ödeme işleminizin kanıtıdır. Lütfen saklayınız.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Yazdır
            </Button>
            <Button variant="outline" className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Email Gönder
            </Button>
            <Button className="flex-1" onClick={() => setShowReceipt(false)}>
              Tamam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Mock data
const mockStudent: Student = {
  id: 'STU-2025-0001',
  ad: 'Ece',
  soyad: 'Kızıroğlu',
  sinif: '9-A',
  ogrenciNo: 'STU-2025-0001',
  finans: {
    odemeDurumu: {
      toplamBorc: 102000,
      odenenMiktar: 50000,
      kalanBorc: 52000,
      odemeOrani: 49,
      gecikmisTaksitSayisi: 0
    },
    odemePlani: {
      tip: 'Taksitli',
      taksitSayisi: 8,
      taksitTutari: 12750,
      taksitler: [
        { no: 1, tutar: 12750, vadeTarihi: new Date('2024-09-15'), odendiMi: true },
        { no: 2, tutar: 12750, vadeTarihi: new Date('2024-10-15'), odendiMi: true },
        { no: 3, tutar: 12750, vadeTarihi: new Date('2024-11-15'), odendiMi: true },
        { no: 4, tutar: 12750, vadeTarihi: new Date('2024-12-15'), odendiMi: true },
        { no: 5, tutar: 12750, vadeTarihi: new Date('2025-01-15'), odendiMi: false },
        { no: 6, tutar: 12750, vadeTarihi: new Date('2025-02-15'), odendiMi: false },
        { no: 7, tutar: 12750, vadeTarihi: new Date('2025-03-15'), odendiMi: false },
        { no: 8, tutar: 12750, vadeTarihi: new Date('2025-04-15'), odendiMi: false },
      ]
    }
  }
} as any;
```

---

## 🤖 AI SERVICE

**Dosya:** `src/modules/finance/services/financeAI.ts`
```typescript
/**
 * Finans AI Servisi
 * Tahminler, risk analizi, optimizasyon önerileri
 */

import type { Student, Payment, Expense } from '@/types';

export const financeAI = {
  /**
   * Ödeme Yapma Olasılığı Tahmini
   * Öğrencinin geçmiş ödeme davranışlarına göre tahmin yapar
   */
  predictPaymentProbability: async (studentId: string): Promise<PaymentPrediction> => {
    // TODO: AI model ile tahmin
    // Faktörler:
    // - Geçmiş ödeme geçmişi
    // - Gecikme sıklığı
    // - Veli ile iletişim sıklığı
    // - Öğrenci akademik performansı
    // - Ekonomik göstergeler (ebeveyn mesleği, gelir durumu)
    
    return {
      probability: 75,
      risk: 'Düşük',
      factors: [
        'Son 4 taksit zamanında ödendi',
        'Veli ile iletişim sıklığı yüksek',
        'Öğrenci başarılı, devamsızlık yok'
      ],
      recommendations: [
        'Vade 3 gün önce hatırlatma SMS gönder',
        'Erken ödeme indirimi
        teklif et (%3)'
      ]
    };
  },

  /**
   * 3 Aylık Nakit Akış Tahmini
   * Geçmiş verilerle gelecek nakit akışını tahmin eder
   */
  forecastCashFlow: async (months: number = 3): Promise<CashFlowForecast[]> => {
    // TODO: AI model ile tahmin
    // Faktörler:
    // - Mevsimsel trendler
    // - Geçmiş yıl verileri
    // - Kayıtlı öğrenci sayısı
    // - Beklenen taksit ödemeleri
    // - Planlı giderler
    
    const forecasts: CashFlowForecast[] = [];
    const today = new Date();
    
    for (let i = 0; i < months; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
      
      forecasts.push({
        month: month.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        predictedIncome: 450000 + (Math.random() * 50000),
        predictedExpense: 320000 + (Math.random() * 30000),
        predictedCash: 130000 + (Math.random() * 20000),
        confidence: 0.85,
        bestCase: 500000,
        worstCase: 400000
      });
    }
    
    return forecasts;
  },

  /**
   * Risk Skorlama
   * Likidite, tahsilat ve bütçe risklerini analiz eder
   */
  calculateRiskScores: async (): Promise<RiskScores> => {
    // TODO: Risk hesaplamaları
    
    return {
      liquidity: {
        score: 85,
        level: 'Düşük',
        factors: [
          'Nakit rezervi yeterli',
          'Bekleyen tahsilatlar normal seviyede',
          'Acil gider karşılama kapasitesi yüksek'
        ],
        recommendations: [
          'Mevcut durumu koruyun',
          'Nakit rezervini %10 artırın'
        ]
      },
      collection: {
        score: 65,
        level: 'Orta',
        factors: [
          '15 öğrenci 30+ gün gecikmiş',
          'Tahsilat oranı %92 (hedef %95)',
          'Mevsimsel düşüş bekleniyor'
        ],
        recommendations: [
          'Gecikmiş ödemeler için yoğun takip başlatın',
          'Erken ödeme kampanyası düzenleyin',
          'Otomatik ödeme sistemini teşvik edin'
        ]
      },
      budget: {
        score: 45,
        level: 'Yüksek',
        factors: [
          'Personel giderleri bütçeyi %8 aştı',
          'Elektrik faturası beklenenden yüksek',
          'Bakım-onarım giderleri kontrol dışı'
        ],
        recommendations: [
          'Personel ek ödemelerini gözden geçirin',
          'Enerji tasarrufu önlemleri alın',
          'Bakım-onarım için ihale süreci başlatın'
        ]
      }
    };
  },

  /**
   * Gider Optimizasyonu
   * Giderleri analiz ederek tasarruf önerileri sunar
   */
  optimizeExpenses: async (): Promise<ExpenseOptimization[]> => {
    // TODO: Gider analizi ve optimizasyon
    
    return [
      {
        category: 'Elektrik',
        currentSpending: 45000,
        optimizedSpending: 38000,
        savings: 7000,
        savingsPercentage: 15.6,
        suggestions: [
          'LED aydınlatmaya geçiş',
          'Zaman ayarlı termostat kullanımı',
          'Solar panel yatırımı değerlendirmesi'
        ],
        priority: 'Yüksek',
        paybackPeriod: '8 ay'
      },
      {
        category: 'Kırtasiye',
        currentSpending: 12000,
        optimizedSpending: 9500,
        savings: 2500,
        savingsPercentage: 20.8,
        suggestions: [
          'Toplu alım anlaşması yap',
          'Dijital materyale geçiş',
          'Tedarikçi değişikliği'
        ],
        priority: 'Orta',
        paybackPeriod: 'Anında'
      },
      {
        category: 'İnternet',
        currentSpending: 8000,
        optimizedSpending: 6000,
        savings: 2000,
        savingsPercentage: 25,
        suggestions: [
          'Fiber hat yerine 5G kullanımı',
          'Paket değişikliği',
          'Alternatif sağlayıcı araştırması'
        ],
        priority: 'Düşük',
        paybackPeriod: '2 ay'
      }
    ];
  },

  /**
   * Otomatik Kategori Eşleştirme
   * Gider açıklamalarından kategori tahmini
   */
  categorizeExpense: async (description: string): Promise<CategorySuggestion> => {
    // TODO: NLP ile kategori tahmini
    
    const keywords: Record<string, string[]> = {
      'Elektrik': ['elektrik', 'edaş', 'enerji'],
      'Su': ['su', 'aski', 'iski'],
      'Kırtasiye': ['kırtasiye', 'kalem', 'defter', 'kağıt'],
      'Yakıt': ['yakıt', 'benzin', 'motorin', 'shell', 'opet'],
      'Yemek': ['yemek', 'catering', 'gıda'],
      'Temizlik': ['temizlik', 'deterjan', 'çöp']
    };
    
    const lowerDesc = description.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerDesc.includes(word))) {
        return {
          category,
          confidence: 0.92,
          alternatives: []
        };
      }
    }
    
    return {
      category: 'Diğer',
      confidence: 0.3,
      alternatives: ['İşletme Gideri', 'Genel Gider']
    };
  },

  /**
   * Tahsilat Stratejisi Önerisi
   * Borçlu öğrenciler için en etkili tahsilat yöntemini önerir
   */
  suggestCollectionStrategy: async (studentId: string): Promise<CollectionStrategy> => {
    // TODO: Öğrenci profili analizi
    
    return {
      strategy: 'Kademeli İletişim',
      steps: [
        {
          day: 0,
          action: 'SMS hatırlatma',
          expectedSuccess: 45
        },
        {
          day: 3,
          action: 'Telefon araması',
          expectedSuccess: 30
        },
        {
          day: 7,
          action: 'Yüz yüze görüşme',
          expectedSuccess: 20
        },
        {
          day: 14,
          action: 'Taksit yeniden yapılandırma teklifi',
          expectedSuccess: 5
        }
      ],
      estimatedRecovery: 87,
      alternatives: [
        {
          name: 'Erken Ödeme İndirimi',
          description: '%5 indirim ile tüm borcun ödenmesi',
          successProbability: 65
        }
      ]
    };
  },

  /**
   * Bütçe Tahmin Doğruluğu
   * Geçmiş bütçe tahminlerinin doğruluğunu ölçer
   */
  calculateBudgetAccuracy: async (budgetId: string): Promise<BudgetAccuracy> => {
    // TODO: Bütçe gerçekleşme analizi
    
    return {
      overallAccuracy: 87.5,
      categories: [
        {
          category: 'Personel Maaşları',
          planned: 250000,
          actual: 248000,
          accuracy: 99.2,
          variance: -2000
        },
        {
          category: 'Elektrik',
          planned: 40000,
          actual: 45000,
          accuracy: 88.9,
          variance: 5000
        }
      ],
      recommendations: [
        'Elektrik bütçesi %15 artırılmalı',
        'Kırtasiye bütçesi %10 azaltılabilir'
      ]
    };
  }
};

// ==================== INTERFACES ====================

interface PaymentPrediction {
  probability: number;              // 0-100
  risk: 'Düşük' | 'Orta' | 'Yüksek';
  factors: string[];
  recommendations: string[];
}

interface CashFlowForecast {
  month: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedCash: number;
  confidence: number;               // 0-1
  bestCase: number;
  worstCase: number;
}

interface RiskScores {
  liquidity: RiskScore;
  collection: RiskScore;
  budget: RiskScore;
}

interface RiskScore {
  score: number;                    // 0-100
  level: 'Düşük' | 'Orta' | 'Yüksek';
  factors: string[];
  recommendations: string[];
}

interface ExpenseOptimization {
  category: string;
  currentSpending: number;
  optimizedSpending: number;
  savings: number;
  savingsPercentage: number;
  suggestions: string[];
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  paybackPeriod: string;
}

interface CategorySuggestion {
  category: string;
  confidence: number;               // 0-1
  alternatives: string[];
}

interface CollectionStrategy {
  strategy: string;
  steps: Array<{
    day: number;
    action: string;
    expectedSuccess: number;
  }>;
  estimatedRecovery: number;        // %
  alternatives: Array<{
    name: string;
    description: string;
    successProbability: number;
  }>;
}

interface BudgetAccuracy {
  overallAccuracy: number;          // %
  categories: Array<{
    category: string;
    planned: number;
    actual: number;
    accuracy: number;
    variance: number;
  }>;
  recommendations: string[];
}
```

---

## 📊 CURSOR UYGULAMA ADIMLARI

### ADIM 1: TYPES OLUŞTUR

```bash
# src/types/finance.types.ts
# Payment, Expense, Sale, CashRegister, BankAccount, Budget interface'lerini ekle
```

**Yapılacaklar:**
- ✅ Payment interface (tam yapı)
- ✅ Expense interface (tam yapı)
- ✅ Sale interface (tam yapı)
- ✅ CashRegister interface
- ✅ BankAccount interface
- ✅ Budget interface
- ✅ Tüm enum'lar (PaymentType, PaymentStatus, PaymentMethod vb.)

---

### ADIM 2: MOCK DATA OLUŞTUR

```bash
# src/data/finance.data.ts
```

**Yapılacaklar:**
- ✅ 100+ ödeme kaydı (farklı tipler, yöntemler)
- ✅ 50+ gider kaydı (kategorize)
- ✅ 30+ satış kaydı (kitap, kıyafet, kırtasiye)
- ✅ 3 kasa tanımı
- ✅ 2 banka hesabı
- ✅ 1 yıllık bütçe

---

### ADIM 3: FINANCE DASHBOARD

```bash
# src/modules/finance/pages/FinanceDashboardPage.tsx
```

**Yapılacaklar:**
- ✅ Özet kartları (gelir, gider, kar, bekleyen)
- ✅ Gelir-gider bar chart
- ✅ Nakit akış area chart
- ✅ Gelir dağılımı pie chart
- ✅ Borçlu öğrenci listesi
- ✅ Zaman aralığı seçici (bugün, hafta, ay, yıl)
- ✅ 5 tab (Genel, Gelir, Gider, Nakit Akış, AI)

---

### ADIM 4: QUICK PAYMENT COMPONENT

```bash
# src/modules/finance/components/payment/QuickPayment.tsx
```

**Yapılacaklar:**
- ✅ Öğrenci arama (ad, TC, no)
- ✅ Borç durumu görüntüleme
- ✅ Taksit tablosu
- ✅ Hızlı ödeme formu
- ✅ Ödeme yöntemi seçimi
- ✅ Makbuz oluşturma ve yazdırma
- ✅ SMS/Email gönderme

---

### ADIM 5: PAYMENT MANAGEMENT PAGE

```bash
# src/modules/finance/pages/PaymentManagementPage.tsx
```

**Yapılacaklar:**
- ✅ Ödeme listesi (tablo)
- ✅ Filtreleme (tarih, tip, yöntem, durum)
- ✅ Arama
- ✅ Pagination
- ✅ Detay görüntüleme
- ✅ İptal/İade işlemleri
- ✅ Toplu hatırlatma gönderme
- ✅ Excel/PDF export

---

### ADIM 6: EXPENSE MANAGEMENT PAGE

```bash
# src/modules/finance/pages/ExpenseManagementPage.tsx
```

**Yapılacaklar:**
- ✅ Gider kayıt formu
- ✅ Gider listesi
- ✅ Kategori bazlı filtreleme
- ✅ Onay sistemi
- ✅ Fatura yükleme
- ✅ Bütçe kontrolü
- ✅ Maaş bordrosu modülü

---

### ADIM 7: SALES MANAGEMENT PAGE

```bash
# src/modules/finance/pages/SalesManagementPage.tsx
```

**Yapılacaklar:**
- ✅ Satış formu
- ✅ Ürün kataloğu
- ✅ Stok yönetimi
- ✅ Fatura oluşturma
- ✅ İade işlemleri
- ✅ Satış raporları

---

### ADIM 8: CASH & BANK PAGE

```bash
# src/modules/finance/pages/CashBankPage.tsx
```

**Yapılacaklar:**
- ✅ Kasa işlemleri
- ✅ Gün sonu kasa sayımı
- ✅ Banka hareketleri
- ✅ Çek yönetimi
- ✅ Virman işlemleri
- ✅ Banka mutabakatı

---

### ADIM 9: AI SERVICE

```bash
# src/modules/finance/services/financeAI.ts
```

**Yapılacaklar:**
- ✅ Ödeme tahmini algoritması
- ✅ Nakit akış projeksiyonu
- ✅ Risk skorlama
- ✅ Gider optimizasyonu
- ✅ Otomatik kategorilendirme
- ✅ Tahsilat stratejisi

---

### ADIM 10: ACCOUNTING PAGE

```bash
# src/modules/finance/pages/AccountingPage.tsx
```

**Yapılacaklar:**
- ✅ Yevmiye defteri
- ✅ Büyük defter
- ✅ Mizan
- ✅ Bilanço
- ✅ Gelir tablosu
- ✅ KDV beyannamesi
- ✅ Muhtasar beyanname

---

### ADIM 11: REPORTS PAGE

```bash
# src/modules/finance/pages/ReportsPage.tsx
```

**Yapılacaklar:**
- ✅ Günlük kasa raporu
- ✅ Aylık gelir-gider raporu
- ✅ Borçlu öğrenci raporu
- ✅ Tahsilat performansı
- ✅ Gider analizi
- ✅ Karlılık raporu
- ✅ Özel rapor oluşturucu

---

### ADIM 12: UTILITIES & HELPERS

```bash
# src/modules/finance/utils/
```

**Yapılacaklar:**
- ✅ Finansal hesaplamalar (faiz, kdv, stopaj)
- ✅ Taksit planı oluşturma
- ✅ Makbuz PDF oluşturma
- ✅ Fatura PDF oluşturma
- ✅ Excel export fonksiyonları
- ✅ Tarih ve para formatlayıcılar

---

### ADIM 13: ROUTING SETUP

```bash
# src/routes/index.tsx
```

**Yapılacaklar:**
```typescript
{
  path: 'finance',
  children: [
    { index: true, element: <FinanceDashboardPage /> },
    { path: 'payments', element: <PaymentManagementPage /> },
    { path: 'expenses', element: <ExpenseManagementPage /> },
    { path: 'sales', element: <SalesManagementPage /> },
    { path: 'cash-bank', element: <CashBankPage /> },
    { path: 'accounting', element: <AccountingPage /> },
    { path: 'reports', element: <ReportsPage /> }
  ]
}
```

---

### ADIM 14: INTEGRATION

**Öğrenci Modülü ile:**
- ✅ Öğrenci kaydında sözleşme → Ödeme planı oluştur
- ✅ Öğrenci profilinde finans tab → Ödeme geçmişi göster
- ✅ Hızlı ödeme → Öğrenci ara ve öde

**İletişim Modülü ile:**
- ✅ Ödeme hatırlatma SMS/Email
- ✅ Makbuz email gönderimi
- ✅ Toplu hatırlatma

**Rehberlik Modülü ile:**
- ✅ Ödeme durumu → Psikolojik risk faktörü

---

## ✅ TAMAMLANMA KRİTERLERİ

```
FİNANS MODÜLÜ KONTROL LİSTESİ:

TYPES & DATA:
□ Tüm interface'ler tanımlandı
□ Mock veriler oluşturuldu
□ Enum'lar eksiksiz

PAGES:
□ FinanceDashboardPage (5 tab)
□ PaymentManagementPage
□ ExpenseManagementPage
□ SalesManagementPage
□ CashBankPage
□ AccountingPage
□ ReportsPage

COMPONENTS:
□ QuickPayment (hızlı ödeme)
□ PaymentForm (detaylı ödeme)
□ ExpenseForm (gider kaydı)
□ SalesForm (satış kaydı)
□ Charts (gelir, gider, nakit akış)
□ AI Insights (tahminler, öneriler)

AI FEATURES:
□ Ödeme tahmini
□ Nakit akış projeksiyonu
□ Risk skorlama
□ Gider optimizasyonu
□ Otomatik kategorilendirme
□ Tahsilat stratejisi

MUHASEBE:
□ Otomatik fiş kesme
□ Mizan/Bilanço
□ Vergi raporları
□ e-Fatura entegrasyonu

RAPORLAR:
□ Günlük kasa raporu
□ Aylık gelir-gider
□ Borçlu listesi
□ Karlılık analizi
□ Excel/PDF export

ENTEGRASYON:
□ Öğrenci modülü
□ İletişim modülü
□ Sözleşme sistemi
```

---

## 🚀 CURSOR TALİMATI

```
"finans.md dosyasındaki TÜM ADIMLARI sırayla uygula.

SIRA:
1. TYPES oluştur (finance.types.ts)
2. MOCK DATA oluştur (finance.data.ts)
3. DASHBOARD page oluştur
4. PAYMENT components ve pages
5. EXPENSE components ve pages
6. SALES components ve pages
7. CASH/BANK components ve pages
8. AI SERVICE oluştur
9. ACCOUNTING page
10. REPORTS page
11. UTILITIES oluştur
12. ROUTING ekle
13. INTEGRATION (öğrenci, iletişim)

Her adım tamamlandığında '✅ ADIM X TAMAMLANDI' de.

ÖNEMLİ:
- Recharts kullan (grafik için)
- shadcn/ui componentleri
- Gerçekçi Türkçe mock data
- TypeScript strict mode
- Responsive tasarım
- Console hatası yok

Gerekli paketler:
npm install recharts date-fns

BAŞLA: ADIM 1"
```

---

## 📌 BONUS ÖZELLİKLER

### 1. Otomatik Tahsilat Sistemi
- Kredi kartından otomatik çekim
- Hatırlatma ve tahsilat süreci
- Başarısız denemeler için yedek plan

### 2. Çoklu Para Birimi
- Döviz kurları otomatik güncelleme
- Yabancı öğrenci ödemeleri
- Kur farkı hesaplama

### 3. Komisyon Yönetimi
- Kredi kartı komisyonları
- Banka transfer ücretleri
- Otomatik maliyet hesaplama

### 4. Gelir Tahmini
- Kayıt trendlerine göre gelir tahmini
- Sezonsal analiz
- Hedef belirleme

### 5. Tedarikçi Yönetimi
- Tedarikçi performans takibi
- Ödeme vadeleri
- Toplu ödeme planlaması

---

## 🎯 SONUÇ

Bu **finans.md** dosyası ile:

1. ✅ **Tam Teşekküllü Finans Sistemi**
2. ✅ **AI Destekli Tahminler**
3. ✅ **Otomatik Muhasebe**
4. ✅ **Risk Yönetimi**
5. ✅ **Kapsamlı Raporlama**
6. ✅ **Entegre Modüller**

**Dosyayı kaydet ve Cursor'a ver!** 🚀

Hazır mısın? 💰
/finance/cash-bank → Kasa işlemleri aktif mi?
   - ✅ /finance/accounting → Muhasebe kayıtları var mı?
   - ✅ /finance/reports → Raporlar oluşuyor mu?

2. **Console Kontrolü:**
   - ✅ Hiç error yok mu?
   - ✅ Warning'ler temizlendi mi?
   - ✅ Network hataları yok mu?

3. **Responsive Test:**
   - ✅ Mobil görünüm (375px)
   - ✅ Tablet görünüm (768px)
   - ✅ Desktop görünüm (1920px)

4. **Fonksiyonelite Test:**
   - ✅ Ödeme alma çalışıyor
   - ✅ Gider kaydı yapılabiliyor
   - ✅ Satış gerçekleştiriliyor
   - ✅ Filtreler çalışıyor
   - ✅ Chart'lar render oluyor
   - ✅ AI önerileri gösteriliyor
   - ✅ Export fonksiyonları aktif

5. **TypeScript Kontrolü:**
```bash
npx tsc --noEmit
```
   - ✅ Hiç tip hatası yok mu?

6. **Build Kontrolü:**
```bash
npm run build
```
   - ✅ Build başarılı mı?
   - ✅ Warning yok mu?

**Tamamlandığında yaz:**
```
✅ ADIM 19 TAMAMLANDI - FİNAL TEST
- Tüm sayfalar açılıyor ✓
- Console temiz ✓
- Responsive çalışıyor ✓
- Tüm fonksiyonlar aktif ✓
- TypeScript hatasız ✓
- Build başarılı ✓
```

---

### ADIM 20: DOKÜMANTASYON

**Dosya:** `src/modules/finance/README.md`

**Yapılacaklar:**

```markdown
# 💰 Finans Modülü

## Özellikler
- ✅ Gelir-gider takibi
- ✅ Hızlı ödeme alma
- ✅ Gider yönetimi
- ✅ Satış & stok
- ✅ Kasa & banka
- ✅ Muhasebe entegrasyonu
- ✅ AI tahminler
- ✅ Raporlama

## Kullanım

### Hızlı Ödeme Alma
1. Finans > Dashboard > Hızlı Ödeme
2. Öğrenci ara
3. Tutar gir
4. Ödeme yöntemi seç
5. Kaydet

### Gider Kaydı
1. Finans > Gider Yönetimi
2. Yeni Gider
3. Form doldur
4. Fatura yükle
5. Kaydet

### AI Önerileri
1. Finans > Dashboard > AI Öngörüler tab
2. Risk skorlarını gör
3. Önerileri incele
4. Aksiyonları uygula

## API Entegrasyonu

### Ödeme Alma
```typescript
POST /api/payments
{
  ogrenciId: string,
  tutar: number,
  yontem: PaymentMethod
}
```

## Yapılacaklar (TODO)
- [ ] e-Fatura entegrasyonu
- [ ] Otomatik tahsilat sistemi
- [ ] Döviz kuru API
- [ ] Banka mutabakatı
```

**Tamamlandığında yaz:**
```
✅ ADIM 20 TAMAMLANDI
- README.md oluşturuldu
- Kullanım kılavuzu yazıldı
- API dokümantasyonu eklendi
- TODO listesi hazır
```

---

## 🎯 SON KONTROL LİSTESİ

Her adım tamamlandıkça bu listeyi işaretle:

```
□ ADIM 1: Paketler yüklendi
□ ADIM 2: Type definitions tamam
□ ADIM 3: Mock data oluşturuldu
□ ADIM 4: Dashboard component'leri hazır
□ ADIM 5: Dashboard page tamamlandı
□ ADIM 6: QuickPayment component'i çalışıyor
□ ADIM 7: PaymentManagement page hazır
□ ADIM 8: ExpenseManagement page tamam
□ ADIM 9: SalesManagement page aktif
□ ADIM 10: CashBank page oluşturuldu
□ ADIM 11: AI service implementasyonu OK
□ ADIM 12: Accounting page hazır
□ ADIM 13: Reports page tamamlandı
□ ADIM 14: Utility fonksiyonları çalışıyor
□ ADIM 15: Routing yapılandırıldı
□ ADIM 16: Navigation menü eklendi
□ ADIM 17: Öğrenci entegrasyonu tamam
□ ADIM 18: İletişim entegrasyonu OK
□ ADIM 19: Final test başarılı
□ ADIM 20: Dokümantasyon hazır
```

---

## 🚨 HATA DURUMUNDA

Eğer bir adımda hata alırsan:

1. **Hatayı tam olarak yaz:** 
   ```
   ❌ HATA - ADIM X
   Error: [tam hata mesajı]
   Dosya: [hangi dosya]
   Satır: [kaçıncı satır]
   ```

2. **Hatayı düzelt**

3. **Düzeltmeyi bildir:**
   ```
   ✅ HATA DÜZELTİLDİ - ADIM X
   Çözüm: [ne yaptın]
   ```

4. **Devam et**

---

## 📊 İLERLEME RAPORU

Her 5 adımda bir özet rapor ver:

```
📊 İLERLEME RAPORU - ADIM 1-5

Tamamlanan:
✅ Paketler yüklendi
✅ Type definitions oluşturuldu
✅ Mock data hazırlandı
✅ Dashboard component'leri yapıldı
✅ Dashboard page tamamlandı

Sorunlar:
- Yok

Sonraki Adımlar:
- QuickPayment component
- PaymentManagement page
- ExpenseManagement page
```

---

## 🎨 TASARIM KURALLARI

**Renkler:**
- Gelir: `bg-green-50`, `text-green-600`, `border-green-200`
- Gider: `bg-red-50`, `text-red-600`, `border-red-200`
- Kar: `bg-blue-50`, `text-blue-600`, `border-blue-200`
- Bekleyen: `bg-orange-50`, `text-orange-600`, `border-orange-200`
- AI: `bg-purple-50`, `text-purple-600`, `border-purple-200`

**Typography:**
- Başlık: `text-3xl font-bold`
- Alt başlık: `text-lg font-semibold`
- Açıklama: `text-sm text-gray-600`
- Vurgu: `font-medium`

**Spacing:**
- Section arası: `space-y-6`
- Card padding: `p-6`
- Grid gap: `gap-6`

**Responsive:**
- Mobil: `grid-cols-1`
- Tablet: `md:grid-cols-2`
- Desktop: `lg:grid-cols-4`

---

## 🔥 PRİORİTE SIRASI

Eğer zaman kısıtlı ise bu sırayı takip et:

1. **KRİTİK (Önce bunlar):**
   - ✅ Type definitions
   - ✅ Mock data
   - ✅ Dashboard
   - ✅ QuickPayment
   - ✅ PaymentManagement

2. **ÖNEMLİ (Sonra bunlar):**
   - ✅ ExpenseManagement
   - ✅ AI Service
   - ✅ Reports

3. **İYİ OLUR (Zamanın varsa):**
   - ✅ SalesManagement
   - ✅ CashBank
   - ✅ Accounting

---

## ✅ BİTİRME KRİTERLERİ

Şu kriterler sağlandığında modül tamamdır:

1. ✅ Tüm 20 adım tamamlandı
2. ✅ Console'da hata/warning yok
3. ✅ TypeScript hatası yok
4. ✅ Build başarılı
5. ✅ Tüm sayfalar açılıyor
6. ✅ Mock data görünüyor
7. ✅ Chart'lar render oluyor
8. ✅ Formlar çalışıyor
9. ✅ Responsive tasarım OK
10. ✅ README.md hazır

---

## 🎉 TAMAMLANDIĞINDA

```
🎉🎉🎉 FİNANS MODÜLÜ TAMAMLANDI! 🎉🎉🎉

ÖZET:
✅ 7 sayfa oluşturuldu
✅ 15+ component implementasyonu
✅ AI servisi entegre edildi
✅ Öğrenci modülü ile entegre
✅ İletişim modülü ile entegre
✅ 100+ mock veri
✅ Tam tip güvenliği
✅ Responsive tasarım
✅ Dokümantasyon hazır

İSTATİSTİKLER:
- Toplam Dosya: ~30
- Toplam Satır: ~5000+
- Component: 20+
- Page: 7
- Service: 1 (AI)
- Utility: 4

TEST SONUÇLARI:
✅ Tüm sayfalar çalışıyor
✅ Console temiz
✅ TypeScript hatasız
✅ Build başarılı
✅ Responsive OK

SONRAKI ADIMLAR:
1. Backend API entegrasyonu
2. e-Fatura sistemi
3. Otomatik tahsilat
4. Gerçek AI modeli
5. Banka API entegrasyonu

Harika iş çıkardın! 🚀
```

---

## 🆘 YARDIM

Eğer takıldığın bir yer varsa:

1. **@finance.md dosyasını tekrar oku**
2. **İlgili bölümü bul**
3. **Kodu kopyala-yapıştır**
4. **Proje yapısına uyarla**
5. **Test et**

Başarılar! 💪
```

---

Bu prompt'u kullanarak Cursor'a şunu söyle:

```
@finance.md dosyasını oku ve yukarıdaki prompt'a göre adım adım uygula. 
Her adım tamamlandığında rapor ver. ADIM 1'den başla.
```

🚀 Hazır mısın? Başlayalım! 💰
---

## 📚 SONRAKI ADIMLAR (NEXT STEPS) - DEVAM EDIN

### 🧭 STEP 1: Dashboard'a Finance Tab Ekle
**Dosya:** `app/finance/page.tsx` (TAMAMLANDI ✅)

**Yapılanlar:**
- ✅ Finance Dashboard page oluşturuldu
- ✅ 4 summary card'lar (Income, Expense, Profit, Pending)
- ✅ 5 tab sistem (Overview, Income, Expense, CashFlow, AI)
- ✅ Mock data entegrasyonu
- ✅ Recharts visualizations

---

### 📱 STEP 2: Student Profile Finance Tab
**Dosya:** `app/students/[id]/page.tsx`

**Yapılacaklar:**
- [ ] 8. TAB olarak Finans tab'ı ekle
- [ ] Finansal özet kartları (Ödenen/Borç/Kalan)
- [ ] Ödeme oranı progress bar
- [ ] AI Risk analizi bölümü
- [ ] Hızlı işlemler butonları (Ödeme Al, Makbuz, AI Öneri)
- [ ] Taksit tablosu

---

### 🔔 STEP 3: Real-time Notifications (TAMAMLANDI ✅)

**Yapılanlar:**
- ✅ `lib/services/notificationService.ts` oluşturuldu
- ✅ 4 bildirim tipi (Gecikmiş, Yaklaşan, Başarılı, Risk)
- ✅ SMS/Email şablonları
- ✅ Notification listing page

---

### 📊 STEP 4: PDF/Excel Export (TAMAMLANDI ✅)

**Yapılanlar:**
- ✅ `lib/services/exportService.ts` oluşturuldu
- ✅ Excel export fonksiyonları
- ✅ PDF export fonksiyonları
- ✅ Export butonları Finance Dashboard'a eklendi

---

### 🤖 STEP 5: Dashboard Analytics - AI (TAMAMLANDI ✅)

**Yapılanlar:**
- ✅ AI TAB oluşturuldu
- ✅ Risk skorlama (Likidite, Tahsilat, Bütçe)
- ✅ Nakit akış tahmini
- ✅ Gider optimizasyon önerileri

---

### 🚀 STEP 6: Production Deploy Hazırlığı (TAMAMLANDI ✅)

**Dosyalar:**
- ✅ `PRODUCTION_CHECKLIST.md` 
- ✅ `DEPLOYMENT_GUIDE.md`
- ✅ `.env.example`
- ✅ `PROJECT_SUMMARY.md`

---

## 🧭 MODERN NAVIGATION SYSTEM - ENTEGRASYON

### ✅ COMPLETED - Navigation Components

**Yapılanlar:**
1. ✅ **Sidebar.tsx** - Left navigation (10+ menu items)
2. ✅ **TopBar.tsx** - Top navigation
3. ✅ **QuickAccessPanel.tsx** - Dashboard shortcuts
4. ✅ **MainLayout.tsx** - Layout wrapper
5. ✅ **app/layout.tsx** - Integration complete
6. ✅ **NAVIGATION_GUIDE.md** - Full documentation

**Features:**
- ✅ Responsive (Mobile/Tablet/Desktop)
- ✅ Search functionality
- ✅ Theme toggle (Dark/Light)
- ✅ Notifications badge
- ✅ User menu
- ✅ Quick access panel

---

## 📌 FİNANS MODÜLÜ - STATUS

### Tamamlanan Sayfalar ✅

| Sayfa | Status | Features |
|-------|--------|----------|
| `/finance` | ✅ | Dashboard, 5 tabs, Charts, AI |
| `/finance/payments` | ✅ | List, Filter, Export |
| `/finance/expenses` | ✅ | Form, List, Budget |
| `/finance/sales` | ✅ | Form, Catalog |
| `/finance/cash-bank` | ✅ | Registers, Accounts |
| `/finance/accounting` | ✅ | Journal, Ledger |
| `/finance/reports` | ✅ | Analytics, Export |

---

## 🎯 READY TO CONTINUE - KALDI\u011fIMIZ YERDEN

**Devam edecek adımlar:**

### ✅ STEP 1: Dashboard'a QuickAccessPanel entegre et
- [ ] `/app/page.tsx` güncelle
- [ ] QuickAccessPanel import & render
- [ ] Test et

### ✅ STEP 2: Search Functionality hazırla
- [ ] TopBar search'ü aktive et
- [ ] Global arama API'si
- [ ] Debounce & filtering

### ✅ STEP 3: Theme Toggle aktive et
- [ ] Dark mode CSS
- [ ] LocalStorage persistence
- [ ] Transitions

### ✅ STEP 4: Notification Center
- [ ] Service'i connect et
- [ ] Real-time updates
- [ ] Mark as read

### ✅ STEP 5: Mobile Optimization
- [ ] Responsive testing
- [ ] Touch-friendly UI
- [ ] Performance

---

🚀 **DEVAM ETMEYE HAZIR! BAŞLAYALIM!** 💪

