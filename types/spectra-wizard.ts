// ============================================================================
// SPECTRA SINAV SİHİRBAZI - TYPE DEFINITIONS
// Tüm sınav türleri, cevap anahtarı, optik form ve puanlama için tipler
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// SINIF SEVİYELERİ
// ─────────────────────────────────────────────────────────────────────────────

export type SinifSeviyesi = '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun';

export interface SinifBilgisi {
  seviye: SinifSeviyesi;
  ad: string;
  kademe: 'ilkokul' | 'ortaokul' | 'lise' | 'mezun';
  varsayilanSoruSayisi: number;
  minSoruSayisi: number;
  maxSoruSayisi: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINAV TÜRLERİ
// ─────────────────────────────────────────────────────────────────────────────

export type SinavTuru = 
  | 'LGS'           // Liselere Geçiş Sınavı (8. sınıf)
  | 'TYT'           // Temel Yeterlilik Testi
  | 'AYT_SAY'       // Alan Yeterlilik - Sayısal
  | 'AYT_EA'        // Alan Yeterlilik - Eşit Ağırlık
  | 'AYT_SOZ'       // Alan Yeterlilik - Sözel
  | 'AYT_DIL'       // Alan Yeterlilik - Yabancı Dil (YDT)
  | 'DENEME'        // Kurum Denemesi (özelleştirilebilir)
  | 'YAZILI';       // Dönem Sonu Yazılı (tek ders)

export type KitapcikTuru = 'A' | 'B' | 'C' | 'D';
export type CevapSecenegi = 'A' | 'B' | 'C' | 'D' | 'E' | '' | null;

// ─────────────────────────────────────────────────────────────────────────────
// DERS YAPISI
// ─────────────────────────────────────────────────────────────────────────────

export type DersKodu = 
  | 'TUR'    // Türkçe
  | 'MAT'    // Matematik
  | 'FEN'    // Fen Bilimleri
  | 'SOS'    // Sosyal Bilgiler / T.C. İnkılap Tarihi
  | 'DIN'    // Din Kültürü ve Ahlak Bilgisi
  | 'ING'    // İngilizce
  | 'EDEB'   // Türk Dili ve Edebiyatı
  | 'TAR1'   // Tarih-1
  | 'TAR2'   // Tarih-2
  | 'COG1'   // Coğrafya-1
  | 'COG2'   // Coğrafya-2
  | 'FIZ'    // Fizik
  | 'KIM'    // Kimya
  | 'BIY'    // Biyoloji
  | 'FEL';   // Felsefe Grubu

export interface DersDagilimi {
  dersKodu: DersKodu | string;
  dersAdi: string;
  soruSayisi: number;
  baslangicSoru: number;  // 1-indexed
  bitisSoru: number;      // 1-indexed
  ppiKatsayisi?: number;  // TYT/AYT puanlama katsayısı
  renk?: string;          // UI rengi
  icon?: string;          // Emoji/icon
}

export interface SinavKonfigurasyonu {
  kod: SinavTuru;
  ad: string;
  aciklama: string;
  toplamSoru: number;
  sure: number;           // Dakika
  yanlisKatsayisi: number; // 3 = 3 yanlış 1 doğruyu götürür, 4 = 4 yanlış, 0 = götürmez
  kitapcikTurleri: KitapcikTuru[];
  uygunSiniflar: SinifSeviyesi[];
  dersDagilimi: DersDagilimi[];
  renk: string;
  icon: string;
  tabanPuan?: number;     // LGS: 100, TYT: 0
  tavanPuan?: number;     // LGS: 500, TYT: 500
}

// ─────────────────────────────────────────────────────────────────────────────
// CEVAP ANAHTARI
// ─────────────────────────────────────────────────────────────────────────────

export interface CevapAnahtariItem {
  soruNo: number;
  dogruCevap: CevapSecenegi;
  dersKodu: DersKodu | string;
  dersAdi: string;
  kazanimKodu?: string;       // MEB Kazanım Kodu (örn: T.8.3.5)
  kazanimAciklamasi?: string; // Kazanım metni
  kitapcikCevaplari?: {       // Kitapçık bazlı cevaplar
    A: CevapSecenegi;
    B?: CevapSecenegi;
    C?: CevapSecenegi;
    D?: CevapSecenegi;
  };
  iptal?: boolean;            // İptal edilen soru
  zorlukDerecesi?: 1 | 2 | 3 | 4 | 5; // 1: Kolay, 5: Çok Zor
}

export interface CevapAnahtari {
  id?: string;
  examId?: string;
  organizationId: string;
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  toplamSoru: number;
  kitapcikSayisi: number;
  aktifKitapcik: KitapcikTuru;
  items: CevapAnahtariItem[];
  dersSirasi: (DersKodu | string)[];  // Kullanıcının sürükle-bırak sırası
  createdAt?: string;
  updatedAt?: string;
}

// Cevap Anahtarı Şablonu (Kütüphane için)
export interface CevapAnahtariSablon {
  id: string;
  organizationId: string;
  ad: string;                 // "ÖZDEBİR LGS DENEME 1"
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  toplamSoru: number;
  dersDagilimi: DersDagilimi[];
  cevaplar: CevapAnahtariItem[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KAZANIM SİSTEMİ (MEB Müfredatı)
// ─────────────────────────────────────────────────────────────────────────────

// MEB Kazanım Kodu Formatı: T.8.3.5
// T = Ders Kodu (Türkçe)
// 8 = Sınıf Seviyesi
// 3 = Ünite Numarası
// 5 = Kazanım Numarası

export interface Kazanim {
  id: string;
  kod: string;                // T.8.3.5
  dersKodu: DersKodu | string;
  sinifSeviyesi: SinifSeviyesi;
  uniteNo: number;
  kazanimNo: number;
  aciklama: string;           // Kazanım metni
  uniteBesligi?: string;      // Ünite başlığı
  altKazanimlar?: string[];   // Alt kazanımlar
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTİK FORM ŞABLONU
// ─────────────────────────────────────────────────────────────────────────────

export interface OptikAlanTanimi {
  baslangic: number;  // Karakter pozisyonu (1-indexed)
  bitis: number;
}

export interface OptikFormSablonu {
  id: string;
  organizationId?: string;
  ad: string;
  yayinevi: string;
  aciklama: string;
  sinifSeviyeleri: SinifSeviyesi[];
  sinavTurleri: SinavTuru[];
  toplamSoru: number;
  satirUzunlugu: number;      // TXT satır karakter sayısı
  alanlar: {
    kurumKodu?: OptikAlanTanimi;
    ogrenciNo: OptikAlanTanimi;
    ogrenciAdi: OptikAlanTanimi;
    tcKimlik?: OptikAlanTanimi;
    sinif?: OptikAlanTanimi;
    kitapcik?: OptikAlanTanimi;
    cinsiyet?: OptikAlanTanimi;
    cevaplar: OptikAlanTanimi;
  };
  dersDagilimi?: {
    dersKodu: string;
    dersAdi: string;
    baslangic: number;        // Cevap dizisindeki index
    bitis: number;
    soruSayisi: number;
  }[];
  kitapcikDonusum?: {
    A: number[];
    B: number[];
    C?: number[];
    D?: number[];
  };
  isDefault?: boolean;        // Sistem şablonu
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTİK VERİ PARSE
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedOptikSatir {
  satirNo: number;
  rawData: string;
  kurumKodu?: string;
  ogrenciNo: string;
  ogrenciAdi: string;
  tcKimlik?: string;
  sinif?: string;
  kitapcik: KitapcikTuru;
  cinsiyet?: 'E' | 'K';
  cevaplar: CevapSecenegi[];
  hatalar: string[];
  eslesmeDurumu?: 'matched' | 'pending' | 'guest' | 'conflict';
  eslesmiStudentId?: string;
}

export interface OptikParseResult {
  basarili: boolean;
  toplamSatir: number;
  basariliSatir: number;
  hataliSatir: number;
  satirlar: ParsedOptikSatir[];
  hatalar: string[];
  uyarilar: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PUANLAMA MOTORU
// ─────────────────────────────────────────────────────────────────────────────

export interface DersSonuc {
  dersKodu: DersKodu | string;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;              // dogru - (yanlis / yanlisKatsayisi)
  yuzde: number;            // (net / soruSayisi) * 100
  ppiKatsayisi?: number;
  agirlikliPuan?: number;   // TYT/AYT için
}

export interface OgrenciSonuc {
  id?: string;
  examId: string;
  participantId?: string;
  studentId?: string;       // Kayıtlı öğrenci ise
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik: KitapcikTuru;
  tcKimlik?: string;
  
  // Toplamlar
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  
  // Ders bazlı
  dersSonuclari: DersSonuc[];
  
  // Sıralama
  kurumSirasi?: number;
  sinifSirasi?: number;
  yuzdelikDilim?: number;
  
  // Puan dönüşümü
  hamPuan?: number;         // Net'ten hesaplanan ham puan
  tahminiPuan?: number;     // LGS/TYT/AYT tahmini puan
  
  // Durum
  eslesmeDurumu: 'matched' | 'pending' | 'guest' | 'conflict';
  isMisafir: boolean;
  
  // Ham veriler
  cevaplar?: CevapSecenegi[];
  rawData?: string;
}

export interface SinavIstatistikleri {
  toplamKatilimci: number;
  asilKatilimci: number;
  misafirKatilimci: number;
  ortalamaDogru: number;
  ortalamaYanlis: number;
  ortalamaBos: number;
  ortalamaNet: number;
  enYuksekNet: number;
  enDusukNet: number;
  medyan: number;
  standartSapma: number;
  dersBazliOrtalamalar: { dersKodu: string; dersAdi: string; ortalama: number }[];
  sinifBazliOrtalamalar: { sinif: string; ortalama: number; ogrenciSayisi: number }[];
  netDagilimi: { aralik: string; sayi: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SİHİRBAZ ADIM STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardStep1Data {
  sinavAdi: string;
  sinavTarihi: string;
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  aciklama?: string;
  kitapcikTurleri: KitapcikTuru[];
  yanlisKatsayisi: number;
  ozelDersDagilimi?: DersDagilimi[]; // DENEME için özelleştirme
}

export interface WizardStep2Data {
  cevapAnahtari: CevapAnahtari;
  girisYontemi: 'manuel' | 'yapistir' | 'dosya' | 'kutuphane';
  kayitliSablonId?: string;
}

export interface WizardStep3Data {
  optikSablon: OptikFormSablonu;
  sablonKaynagi: 'kutuphane' | 'ozel';
  ozelSablonId?: string;
}

export interface WizardStep4Data {
  yuklemeTuru: 'txt' | 'dat' | 'excel' | 'manuel';
  parseResult?: OptikParseResult;
  dosyaAdi?: string;
  eslestirmeler: {
    optikOgrenciNo: string;
    dbStudentId: string | null;
    isMisafir: boolean;
  }[];
}

export interface WizardStep5Data {
  sonuclar: OgrenciSonuc[];
  istatistikler: SinavIstatistikleri;
  onayDurumu: 'bekliyor' | 'onaylandi' | 'reddedildi';
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  draftExamId: string;
  step1: WizardStep1Data | null;
  step2: WizardStep2Data | null;
  step3: WizardStep3Data | null;
  step4: WizardStep4Data | null;
  step5: WizardStep5Data | null;
  isLoading: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST/RESPONSE
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardSaveRequest {
  organizationId: string;
  academicYearId: string;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3?: WizardStep3Data;
  step4: WizardStep4Data;
  sonuclar: OgrenciSonuc[];
}

export interface WizardSaveResponse {
  success: boolean;
  examId?: string;
  message?: string;
  errors?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// KİTAPÇIK DÖNÜŞÜM
// ─────────────────────────────────────────────────────────────────────────────

export interface KitapcikDonusumTablosu {
  sinavTuru: SinavTuru;
  toplamSoru: number;
  A: number[];  // A kendi sırası (referans)
  B: number[];  // B -> A dönüşümü
  C?: number[]; // C -> A dönüşümü
  D?: number[]; // D -> A dönüşümü
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL IMPORT ŞABLONLARI
// ─────────────────────────────────────────────────────────────────────────────

export interface ExcelImportSablonu {
  tip: 'cevap_anahtari' | 'ogrenci_sonuc' | 'kazanim';
  kolonlar: {
    excel: string;        // Excel kolon adı
    veritabani: string;   // DB alan adı
    zorunlu: boolean;
    varsayilan?: any;
  }[];
}

