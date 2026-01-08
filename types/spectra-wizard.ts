// ============================================================================
// SPECTRA SINAV SİHİRBAZI - TYPE DEFINITIONS v2.0 FINAL
// Production-ready, MEB/ÖSYM uyumlu, tam özellikli sınav motoru
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// TEMEL TİPLER VE UTILITY
// ─────────────────────────────────────────────────────────────────────────────

/** ISO 8601 tarih formatı */
export type ISODate = string;

/** UUID formatı */
export type UUID = string;

/** Özel ders kodu (kurum tanımlı) */
export type CustomDersKodu = string;

/** Versiyon formatı (semver) */
export type SemVer = `${number}.${number}.${number}`;

// ─────────────────────────────────────────────────────────────────────────────
// SINIF SEVİYELERİ
// ─────────────────────────────────────────────────────────────────────────────

export type SinifSeviyesi = '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun';

export type Kademe = 'ilkokul' | 'ortaokul' | 'lise' | 'mezun';

export interface SinifBilgisi {
  seviye: SinifSeviyesi;
  ad: string;
  kademe: Kademe;
  varsayilanSoruSayisi: number;
  minSoruSayisi: number;
  maxSoruSayisi: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINAV TÜRLERİ VE KAYNAK
// ─────────────────────────────────────────────────────────────────────────────

export type SinavTuru = 
  | 'LGS'           // Liselere Geçiş Sınavı (8. sınıf)
  | 'TYT'           // Temel Yeterlilik Testi
  | 'AYT_SAY'       // Alan Yeterlilik - Sayısal
  | 'AYT_EA'        // Alan Yeterlilik - Eşit Ağırlık
  | 'AYT_SOZ'       // Alan Yeterlilik - Sözel
  | 'AYT_DIL'       // Alan Yeterlilik - Yabancı Dil (YDT)
  | 'DENEME'        // Kurum Denemesi (özelleştirilebilir)
  | 'YAZILI'        // Dönem Sonu Yazılı (tek ders)
  | 'KONU_TEST'     // Konu Tarama Testi
  | 'KAZANIM_TEST'; // Kazanım Değerlendirme Testi

/** Sınav kaynağı - Resmi vs Kurum ayrımı için kritik */
export type SinavKaynakTuru = 
  | 'MEB'           // Milli Eğitim Bakanlığı (resmi)
  | 'OSYM'          // ÖSYM (resmi)
  | 'KURUM'         // Kurum kendi denemesi
  | 'YAYINEVI';     // Yayınevi denemesi (Özdebir, FEM, vb.)

/** Kilitlenebilir alanlar - Resmi sınavlarda değiştirilemez */
export type KilitliAlan = 
  | 'toplamSoru'
  | 'dersDagilimi'
  | 'yanlisKatsayisi'
  | 'tabanPuan'
  | 'tavanPuan'
  | 'dersKatsayilari'
  | 'sure';

export type KitapcikTuru = 'A' | 'B' | 'C' | 'D';
export type CevapSecenegi = 'A' | 'B' | 'C' | 'D' | 'E' | '' | null;
export type Cinsiyet = 'E' | 'K';

// ─────────────────────────────────────────────────────────────────────────────
// DERS KODLARI (Kapsamlı)
// ─────────────────────────────────────────────────────────────────────────────

export type DersKodu = 
  // ORTAOKUL (LGS)
  | 'TUR' | 'MAT' | 'FEN' | 'SOS' | 'INK' | 'DIN' | 'ING'
  // TYT
  | 'TYT_TUR' | 'TYT_SOS' | 'TYT_MAT' | 'TYT_FEN'
  // AYT SAYISAL
  | 'AYT_MAT' | 'AYT_FIZ' | 'AYT_KIM' | 'AYT_BIY'
  // AYT SÖZEL
  | 'AYT_EDE' | 'AYT_TAR1' | 'AYT_COG1' | 'AYT_TAR2' | 'AYT_COG2' | 'AYT_FEL' | 'AYT_DIN'
  // FELSEFE GRUBU ALT
  | 'FEL_MANT' | 'FEL_PSI' | 'FEL_SOS' | 'FEL_FEL'
  // AYT EŞİT AĞIRLIK
  | 'AYT_EA_MAT' | 'AYT_EA_EDE' | 'AYT_EA_TAR' | 'AYT_EA_COG'
  // YDT
  | 'YDT_ING' | 'YDT_ALM' | 'YDT_FRA' | 'YDT_ARA' | 'YDT_RUS'
  // Legacy uyumluluk
  | 'EDEB' | 'TAR1' | 'TAR2' | 'COG1' | 'COG2' | 'FIZ' | 'KIM' | 'BIY' | 'FEL';

export interface DersBilgisi {
  kod: DersKodu;
  ad: string;
  kisaAd: string;
  renk: string;
  icon: string;
  varsayilanSoruSayisi: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DERS DAĞILIMI
// ─────────────────────────────────────────────────────────────────────────────

export interface DersDagilimi {
  dersKodu: DersKodu | CustomDersKodu;
  dersAdi: string;
  soruSayisi: number;
  baslangicSoru: number;    // 1-indexed
  bitisSoru: number;        // 1-indexed
  sira?: number;
  ppiKatsayisi?: number;    // TYT/AYT puanlama katsayısı
  renk?: string;
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 PUANLAMA KURALLARI - SCORING RULE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/** Net hesaplama yöntemi */
export type NetHesaplamaYontemi = 
  | 'standart_4'     // dogru - (yanlis / 4) → TYT/AYT
  | 'standart_3'     // dogru - (yanlis / 3) → LGS Deneme
  | 'yok'            // dogru (yanlış götürmez) → Resmi LGS
  | 'ozel';          // Özel formül

/** Puan hesaplama formülü */
export type PuanFormuluTipi = 
  | 'lgs'            // LGS: 100 + (net * 4.444)
  | 'tyt'            // TYT: Ağırlıklı standart puan
  | 'ayt_say'        // AYT Sayısal
  | 'ayt_soz'        // AYT Sözel
  | 'ayt_ea'         // AYT Eşit Ağırlık
  | 'ydt'            // Yabancı Dil
  | 'linear'         // Doğrusal: (net/toplam) * 100
  | 'ozel';          // Özel formül

/** Normalizasyon yöntemi (ÖSYM tipi hesaplamalar için) */
export type NormalizasyonYontemi = 
  | 'yok'            // Normalizasyon yok
  | 'linear'         // Doğrusal normalizasyon
  | 'standart_sapma' // Standart sapma bazlı (ÖSYM)
  | 'percentile';    // Yüzdelik dilim

/** Ders bazlı katsayı */
export interface DersKatsayisi {
  dersKodu: DersKodu | CustomDersKodu;
  dersAdi: string;
  katsayi: number;
  ozelAgirlik?: number;
}

/** 
 * 🎯 PUANLAMA FORMÜLÜ
 * Tüm puanlama kurallarını tek bir yerde toplar
 */
export interface PuanlamaFormulu {
  netHesaplama: NetHesaplamaYontemi;
  yanlisKatsayisi: number;
  tabanPuan: number;
  tavanPuan: number;
  formulTipi: PuanFormuluTipi;
  dersKatsayilari: DersKatsayisi[];
  normalizasyon: NormalizasyonYontemi;
  standartSapmaDahil: boolean;
  ozelFormul?: string;
  isDuzenlenebilir: boolean;
}

/** İptal edilen soru için puan dağıtım mantığı */
export type IptalSoruMantigi = 
  | 'herkese_dogru'        // Herkes için doğru kabul edilir (ÖSYM)
  | 'puani_dagit'          // Puan diğer sorulara dağıtılır (MEB)
  | 'cevaplayana_dogru'    // Sadece cevap verenler için doğru
  | 'gecersiz_say';        // Puanlamaya dahil edilmez

/**
 * 🔒 PUANLAMA KURALI SNAPSHOT
 * Sınav oluşturulduğunda TÜM kuralların değişmez kopyası
 */
export interface ScoringRuleSnapshot {
  id: UUID;
  version: SemVer;
  sinavTuru: SinavTuru;
  puanlamaFormulu: PuanlamaFormulu;
  dersDagilimi: DersDagilimi[];
  iptalSoruMantigi: IptalSoruMantigi;
  createdAt: ISODate;
  createdBy?: UUID;
  configHash: string;
}

/**
 * 📊 PUAN HESAPLAMA ADIMI
 */
export interface PuanHesaplamaAdimi {
  adim: number;
  aciklama: string;
  islem: string;
  oncekiDeger?: number;
  sonrakiDeger: number;
  birim?: string;
}

/**
 * 📈 PUAN HESAPLAMA DETAYI
 */
export interface PuanHesaplamaDetayi {
  adimlar: PuanHesaplamaAdimi[];
  hamNet: number;
  agirlikliNet?: number;
  hamPuan: number;
  normalizePuan?: number;
  finalPuan: number;
  kullanilanFormul: string;
  hesaplamaTarihi: ISODate;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 SINAV KONFİGÜRASYONU
// ═══════════════════════════════════════════════════════════════════════════

export interface SinavKonfigurasyonu {
  kod: SinavTuru;
  ad: string;
  kisaAd?: string;
  aciklama: string;
  toplamSoru: number;
  sure: number;
  kitapcikTurleri: KitapcikTuru[];
  uygunSiniflar: SinifSeviyesi[];
  dersDagilimi: DersDagilimi[];
  puanlamaFormulu?: PuanlamaFormulu;
  iptalSoruMantigi?: IptalSoruMantigi;
  kaynakTuru?: SinavKaynakTuru;
  isResmi?: boolean;
  kilitliAlanlar?: KilitliAlan[];
  kazanimZorunlu?: boolean;
  renk: string;
  icon: string;
  tabanPuan?: number;
  tavanPuan?: number;
  yanlisKatsayisi?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 EXAM ENTITY
// ═══════════════════════════════════════════════════════════════════════════

export type ExamDurum = 
  | 'taslak'
  | 'hazir'
  | 'yayinda'
  | 'arsiv';

export interface Exam {
  id: UUID;
  organizationId: UUID;
  academicYearId: UUID;
  ad: string;
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  sinavTarihi: ISODate;
  aciklama?: string;
  konfigurasyonKodu: SinavTuru;
  scoringSnapshot?: ScoringRuleSnapshot;
  cevapAnahtariId?: UUID;
  toplamKatilimci?: number;
  durum: ExamDurum;
  createdBy: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
  publishedAt?: ISODate;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 CEVAP ANAHTARI
// ═══════════════════════════════════════════════════════════════════════════

export interface CevapAnahtariItem {
  soruNo: number;
  dogruCevap: CevapSecenegi;
  dersKodu: DersKodu | CustomDersKodu;
  dersAdi: string;
  kazanimKodu?: string;
  kazanimAciklamasi?: string;
  konuAdi?: string;
  altKonuAdi?: string;
  kitapcikCevaplari?: Record<KitapcikTuru, CevapSecenegi>;
  iptal?: boolean;
  iptalNedeni?: string;
  iptalPuanDagitimi?: IptalSoruMantigi;
  zorlukDerecesi?: 1 | 2 | 3 | 4 | 5;
  cozumVideoUrl?: string;
}

export interface CevapAnahtari {
  id?: UUID;
  examId?: UUID;
  organizationId: string;
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  toplamSoru: number;
  kitapcikSayisi: number;
  aktifKitapcik: KitapcikTuru;
  items: CevapAnahtariItem[];
  dersSirasi: (DersKodu | CustomDersKodu)[];
  tamamlanmaOrani?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CevapAnahtariSablon {
  id: string;
  organizationId: string;
  ad: string;
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  toplamSoru: number;
  dersDagilimi: DersDagilimi[];
  cevaplar: CevapAnahtariItem[];
  kullanimSayisi?: number;
  sonKullanimTarihi?: ISODate;
  etiketler?: string[];
  aciklama?: string;
  createdBy?: UUID;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 KAZANIM SİSTEMİ
// ═══════════════════════════════════════════════════════════════════════════

export interface Kazanim {
  id: string;
  kod: string;
  dersKodu: DersKodu | CustomDersKodu;
  sinifSeviyesi: SinifSeviyesi;
  uniteNo: number;
  kazanimNo: number;
  aciklama: string;
  kisaAciklama?: string;
  uniteBasligi?: string;
  konuBasligi?: string;
  altKazanimlar?: string[];
  zorlukDerecesi?: 1 | 2 | 3 | 4 | 5;
  mufredatYili?: number;
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 OPTİK FORM
// ═══════════════════════════════════════════════════════════════════════════

export type OptikEncoding = 'utf-8' | 'windows-1254' | 'iso-8859-9';
export type SatirSonu = 'LF' | 'CRLF';

export interface OptikAlanTanimi {
  baslangic: number;
  bitis: number;
  uzunluk?: number;
}

export interface OptikDersDagilimi {
  dersKodu: DersKodu | CustomDersKodu;
  dersAdi: string;
  baslangic: number;
  bitis: number;
  soruSayisi: number;
}

export interface OptikFormSablonu {
  id: string;
  organizationId?: string;
  ad: string;
  yayinevi: string;
  aciklama?: string;
  sinifSeviyeleri: SinifSeviyesi[];
  sinavTurleri: SinavTuru[];
  toplamSoru: number;
  secenekSayisi?: number;
  satirUzunlugu: number;
  encoding?: OptikEncoding;
  satirSonu?: SatirSonu;
  alanlar: {
    kurumKodu?: OptikAlanTanimi;
    ogrenciNo: OptikAlanTanimi;
    ogrenciAdi?: OptikAlanTanimi;
    tcKimlik?: OptikAlanTanimi;
    sinif?: OptikAlanTanimi;
    kitapcik?: OptikAlanTanimi;
    cinsiyet?: OptikAlanTanimi;
    cevaplar: OptikAlanTanimi;
  };
  dersDagilimi?: OptikDersDagilimi[];
  kitapcikDonusum?: Record<KitapcikTuru, number[]>;
  isDefault?: boolean;
  isActive?: boolean;
  createdBy?: UUID;
  createdAt?: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 OPTİK PARSE - TİPLİ HATALAR
// ═══════════════════════════════════════════════════════════════════════════

export type OptikHataTuru = 
  | 'FORMAT'
  | 'UZUNLUK'
  | 'KITAPCIK'
  | 'CEVAP'
  | 'OGRENCI_NO'
  | 'OGRENCI_ESLESME'
  | 'KARAKTER'
  | 'EKSIK_ALAN';

export type HataSeviyesi = 'error' | 'warning' | 'info';

export interface OptikHata {
  tur: OptikHataTuru;
  seviye: HataSeviyesi;
  mesaj: string;
  satirNo?: number;
  alan?: string;
  ogrenciNo?: string;
  rawData?: string;
  oneri?: string;
}

export type EslesmeDurumu = 'matched' | 'pending' | 'guest' | 'conflict' | 'error';

export interface ParsedOptikSatir {
  satirNo: number;
  rawData: string;
  kurumKodu?: string;
  ogrenciNo: string;
  ogrenciAdi?: string;
  tcKimlik?: string;
  sinif?: string;
  kitapcik: KitapcikTuru;
  cinsiyet?: Cinsiyet;
  cevaplar: CevapSecenegi[];
  hatalar: (string | OptikHata)[];
  eslesmeDurumu?: EslesmeDurumu;
  eslesmiStudentId?: string;
  eslesmiStudentAdi?: string;
}

export interface OptikParseResult {
  basarili: boolean;
  dosyaAdi?: string;
  sablonAdi?: string;
  toplamSatir: number;
  basariliSatir: number;
  hataliSatir: number;
  uyariSatir?: number;
  satirlar: ParsedOptikSatir[];
  hatalar: (string | OptikHata)[];
  uyarilar: (string | OptikHata)[];
  parseBaslangic?: ISODate;
  parseBitis?: ISODate;
  sureMilisaniye?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 SONUÇLAR VE İSTATİSTİKLER
// ═══════════════════════════════════════════════════════════════════════════

export interface DersSonuc {
  dersKodu: DersKodu | CustomDersKodu;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  yuzde: number;
  sinifOrtalamasi?: number;
  kurumOrtalamasi?: number;
  fark?: number;
  ppiKatsayisi?: number;
  agirlikliPuan?: number;
}

export interface OgrenciSonuc {
  id?: string;
  examId: string;
  participantId?: string;
  studentId?: string;
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik: KitapcikTuru;
  tcKimlik?: string;
  
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  
  dersSonuclari: DersSonuc[];
  
  kurumSirasi?: number;
  kurumToplamKatilimci?: number;
  sinifSirasi?: number;
  sinifToplamKatilimci?: number;
  yuzdelikDilim?: number;
  
  hamPuan?: number;
  tahminiPuan?: number;
  hedefPuan?: number;
  hedefFark?: number;
  
  puanDetaylari?: PuanHesaplamaDetayi;
  scoringSnapshotId?: UUID;
  
  eslesmeDurumu: EslesmeDurumu | 'matched' | 'pending' | 'guest' | 'conflict';
  isMisafir: boolean;
  
  cevaplar?: CevapSecenegi[];
  rawData?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface NetDagilimi {
  aralik: string;
  minNet?: number;
  maxNet?: number;
  sayi: number;
  yuzde?: number;
}

export interface DersBazliOrtalama {
  dersKodu: DersKodu | CustomDersKodu;
  dersAdi: string;
  ortalamaDogru?: number;
  ortalamaYanlis?: number;
  ortalamaBos?: number;
  ortalama: number;
  enYuksekNet?: number;
  enDusukNet?: number;
}

export interface SinifBazliOrtalama {
  sinif: string;
  ogrenciSayisi: number;
  ortalamaDogru?: number;
  ortalamaYanlis?: number;
  ortalamaBos?: number;
  ortalama: number;
  enYuksekNet?: number;
  enDusukNet?: number;
}

export interface SinavIstatistikleri {
  toplamKatilimci: number;
  asilKatilimci: number;
  misafirKatilimci: number;
  bekleyenEslestirme?: number;
  ortalamaDogru: number;
  ortalamaYanlis: number;
  ortalamaBos: number;
  ortalamaNet: number;
  enYuksekNet: number;
  enDusukNet: number;
  medyan: number;
  standartSapma: number;
  enBasarili?: { ogrenciNo: string; ogrenciAdi: string; net: number };
  enBasarisiz?: { ogrenciNo: string; ogrenciAdi: string; net: number };
  dersBazliOrtalamalar: (DersBazliOrtalama | { dersKodu: string; dersAdi: string; ortalama: number })[];
  sinifBazliOrtalamalar: (SinifBazliOrtalama | { sinif: string; ortalama: number; ogrenciSayisi: number })[];
  netDagilimi: NetDagilimi[];
  cevapDagilimi?: {
    toplamDogru: number;
    toplamYanlis: number;
    toplamBos: number;
    dogruYuzde: number;
    yanlisYuzde: number;
    bosYuzde: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 PUAN SİMÜLASYONU (What-If Analysis)
// ═══════════════════════════════════════════════════════════════════════════

export interface PuanSimulasyonInput {
  dersNetleri: {
    dersKodu: DersKodu | CustomDersKodu;
    net: number;
  }[];
  kuralOverride?: Partial<PuanlamaFormulu>;
  sinavTuru: SinavTuru;
}

export interface PuanSimulasyonOutput {
  tahminiPuan: number;
  hesaplamaDetayi: PuanHesaplamaDetayi;
  karsilastirma?: {
    varsayilanKuralPuan: number;
    fark: number;
    farkYuzde: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 WIZARD STATE
// ═══════════════════════════════════════════════════════════════════════════

export type CevapGirisYontemi = 'manuel' | 'yapistir' | 'toplu' | 'dosya' | 'foto' | 'kutuphane';
export type VeriYuklemeYontemi = 'txt' | 'dat' | 'excel' | 'csv' | 'manuel';
export type SablonKaynagi = 'sistem' | 'kutuphane' | 'ozel';
export type CevapKaynagi = 'manual' | 'paste' | 'excel' | 'photo' | 'library';

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL PREVIEW TİPLERİ
// ─────────────────────────────────────────────────────────────────────────────

/** Excel önizleme satırı */
export interface ExcelPreviewRow {
  rowIndex: number;
  soruNo: number;
  dersKodu?: string;
  dersAdi?: string;
  dogruCevap?: string;
  kitapcik?: KitapcikTuru;
  kazanimKodu?: string;
  kazanimMetni?: string;
  hasError: boolean;
  errorMessage?: string;
  isEditing?: boolean;
}

/** Excel önizleme verisi */
export interface ExcelPreviewData {
  fileName: string;
  rows: ExcelPreviewRow[];
  columns: string[];
  mappedColumns: Record<string, string>;
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
}

/** Toplu yapıştırma parse sonucu */
export interface TopluYapistirResult {
  cevaplar: CevapSecenegi[];
  hatalar: string[];
  uyarilar: string[];
  girilmisSayi: number;
  beklenenSayi: number;
  isValid: boolean;
  formatTipi: 'continuous' | 'spaced' | 'numbered' | 'multiline' | 'mixed';
}

export interface WizardStep1Data {
  sinavAdi: string;
  sinavTarihi: string;
  sinavTuru: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  aciklama?: string;
  academicYearId?: UUID;
  branchId?: UUID;
  kitapcikTurleri: KitapcikTuru[];
  yanlisKatsayisi: number;
  sure?: number;
  ozelDersDagilimi?: DersDagilimi[];
  ozelPuanlama?: boolean;
  puanlamaAyarlari?: PuanlamaFormulu;
  iptalSoruMantigi?: IptalSoruMantigi;
}

export interface WizardStep2Data {
  cevapAnahtari: CevapAnahtari;
  girisYontemi: CevapGirisYontemi;
  source?: CevapKaynagi; // Opsiyonel - backward compatibility için
  rawInput?: string;
  excelPreview?: ExcelPreviewData;
  previewErrors?: string[];
  previewWarnings?: string[];
  kayitliSablonId?: string;
  yeniSablonOlarakKaydet?: boolean;
  yeniSablonAdi?: string;
  selectedRows?: number[];
  lastModified?: ISODate;
}

export interface WizardStep3Data {
  optikSablon: OptikFormSablonu;
  sablonKaynagi: SablonKaynagi | 'kutuphane' | 'ozel';
  sablonId?: string;
  ozelSablonId?: string;
  ozelEslestirme?: OptikDersDagilimi[];
}

export interface WizardStep4Data {
  yuklemeTuru: VeriYuklemeYontemi | 'txt' | 'dat' | 'excel' | 'manuel';
  parseResult?: OptikParseResult;
  dosyaAdi?: string;
  eslestirmeler: {
    satirNo?: number;
    optikOgrenciNo: string;
    optikOgrenciAdi?: string;
    dbStudentId: string | null;
    dbStudentAdi?: string;
    isMisafir: boolean;
    eslesmeDurumu?: EslesmeDurumu;
  }[];
  otomatikEslestirmeYapildi?: boolean;
}

export interface WizardStep5Data {
  sonuclar: OgrenciSonuc[];
  istatistikler: SinavIstatistikleri;
  uyarilar?: string[];
  onayDurumu: 'bekliyor' | 'onaylandi' | 'reddedildi';
  kayitSecenekleri?: {
    hemenHesapla: boolean;
    taslakKaydet: boolean;
    portaldeGoster: boolean;
  };
  scoringSnapshot?: ScoringRuleSnapshot;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  maxReachedStep?: 1 | 2 | 3 | 4 | 5;
  draftExamId: string;
  step1: WizardStep1Data | null;
  step2: WizardStep2Data | null;
  step3: WizardStep3Data | null;
  step4: WizardStep4Data | null;
  step5: WizardStep5Data | null;
  isLoading: boolean;
  isSaving?: boolean;
  error: string | null;
  lastSavedAt?: ISODate;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 WIZARD ACTIONS (Reducer)
// ═══════════════════════════════════════════════════════════════════════════

export type WizardAction =
  | { type: 'SET_STEP'; payload: 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_STEP1_DATA'; payload: WizardStep1Data }
  | { type: 'SET_STEP2_DATA'; payload: WizardStep2Data }
  | { type: 'SET_STEP3_DATA'; payload: WizardStep3Data }
  | { type: 'SET_STEP4_DATA'; payload: WizardStep4Data }
  | { type: 'SET_STEP5_DATA'; payload: WizardStep5Data }
  | { type: 'UPDATE_PUANLAMA_FORMULU'; payload: Partial<PuanlamaFormulu> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DRAFT_EXAM_ID'; payload: string }
  | { type: 'RESET_WIZARD' };

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 API REQUEST/RESPONSE
// ═══════════════════════════════════════════════════════════════════════════

export interface WizardSaveRequest {
  organizationId: string;
  academicYearId: string;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3?: WizardStep3Data;
  step4: WizardStep4Data;
  sonuclar?: OgrenciSonuc[];
  cevapAnahtariSnapshot?: CevapAnahtariItem[];
  scoringRuleSnapshot?: ScoringRuleSnapshot;
}

export interface WizardSaveResponse {
  success: boolean;
  examId?: string;
  message?: string;
  errors?: string[];
  warnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════════════════════

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ExportSecenekleri {
  format: ExportFormat;
  icerik: {
    ozetBilgiler: boolean;
    ogrenciListesi: boolean;
    dersBazliAnaliz: boolean;
    sinifKarsilastirma: boolean;
    grafikler: boolean;
    puanHesaplamaDetayi: boolean;
  };
  siralama: 'net' | 'isim' | 'numara' | 'sinif';
  filtreler?: {
    siniflar?: string[];
    minNet?: number;
    maxNet?: number;
    sadeceMisafir?: boolean;
    sadeceAsil?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 COMPLIANCE CHECK (Uyumluluk Kontrolü)
// ═══════════════════════════════════════════════════════════════════════════

export type ComplianceStatus = 'uyumlu' | 'uyari' | 'uyumsuz';

export interface ComplianceCheckResult {
  status: ComplianceStatus;
  sinavTuru: SinavTuru;
  kontroller: {
    alan: string;
    beklenen: string | number;
    mevcut: string | number;
    durum: ComplianceStatus;
    mesaj: string;
  }[];
  genelMesaj: string;
  standartDisiEtiketi: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 KİTAPÇIK DÖNÜŞÜM
// ═══════════════════════════════════════════════════════════════════════════

export interface KitapcikDonusumTablosu {
  sinavTuru: SinavTuru;
  toplamSoru: number;
  A: number[];
  B: number[];
  C?: number[];
  D?: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 EXCEL IMPORT ŞABLONLARI
// ═══════════════════════════════════════════════════════════════════════════

export interface ExcelImportSablonu {
  tip: 'cevap_anahtari' | 'ogrenci_sonuc' | 'kazanim';
  kolonlar: {
    excel: string;
    veritabani: string;
    zorunlu: boolean;
    varsayilan?: any;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 HELPER FUNCTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type NetHesaplamaFn = (
  dogru: number,
  yanlis: number,
  yanlisKatsayisi: number
) => number;

export type PuanHesaplamaFn = (
  dersNetleri: Record<string, number>,
  puanlamaFormulu: PuanlamaFormulu
) => PuanHesaplamaDetayi;

export type ComplianceCheckFn = (
  konfigurasyon: SinavKonfigurasyonu,
  ozelAyarlar: Partial<WizardStep1Data>
) => ComplianceCheckResult;

export type CreateScoringSnapshotFn = (
  sinavTuru: SinavTuru,
  puanlamaFormulu: PuanlamaFormulu,
  dersDagilimi: DersDagilimi[],
  iptalMantigi: IptalSoruMantigi
) => ScoringRuleSnapshot;
