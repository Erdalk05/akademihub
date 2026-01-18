/**
 * Exam Analytics - TypeScript Types
 * Wizard ve tüm modül için tip tanımları
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUM TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SinavTipi = 'lgs' | 'tyt' | 'ayt' | 'kurum_deneme' | 'konu_testi' | 'yazili' | 'diger';

export type SinavDurum = 
  | 'taslak' 
  | 'cevap_girildi' 
  | 'veri_yuklendi' 
  | 'hesaplaniyor' 
  | 'yayinlandi' 
  | 'zamanli_yayin' 
  | 'hata' 
  | 'arsivlendi' 
  | 'silindi';

export type KatilimciTipi = 'asil' | 'misafir';

export type EslesmeDurumu = 'eslesti' | 'bulunamadi' | 'manuel_bekliyor' | 'otomatik' | 'manuel' | 'beklemede';

export type Kitapcik = 'A' | 'B' | 'C' | 'D';

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD STEP TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardStepInfo {
  step: WizardStep;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DERS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EADers {
  id: string;
  organization_id: string;
  ders_kodu: string;
  ders_adi: string;
  ders_kategori?: string;
  renk_kodu: string;
  sira_no: number;
  max_soru_sayisi: number;
  min_soru_sayisi: number;
  aciklama?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SinavDers {
  id?: string;
  dersId: string;
  dersKodu: string;
  dersAdi: string;
  renkKodu: string;
  soruSayisi: number;
  siraNo: number;
  baslangicSoru: number;
  bitisSoru: number;
  dogruPuan?: number;
  yanlisPuan?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINAV TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EASinav {
  id: string;
  organization_id: string;
  academic_year_id?: string;
  sinav_kodu: string;
  sinav_adi: string;
  sinav_tipi: SinavTipi;
  sinav_tarihi?: string;
  sinif_seviyesi?: number;
  toplam_soru: number;
  sure_dakika: number;
  yanlis_katsayi: number;
  katilimci_sayisi: number;
  optik_sablon_id?: string;
  durum: SinavDurum;
  is_active: boolean;
  is_published: boolean;
  yayinlanma_tarihi?: string;
  hesaplama_tarihi?: string;
  aciklama?: string;
  created_at: string;
  updated_at: string;
  // Relations
  ea_sinav_dersler?: EASinavDers[];
  ea_cevap_anahtarlari?: EACevapAnahtari[];
}

export interface EASinavDers {
  id: string;
  sinav_id: string;
  ders_id: string;
  ders_kodu?: string;
  soru_sayisi: number;
  sira_no: number;
  baslangic_soru?: number;
  bitis_soru?: number;
  dogru_puan: number;
  yanlis_puan: number;
  // Relations
  ea_dersler?: EADers;
}

// ═══════════════════════════════════════════════════════════════════════════
// CEVAP ANAHTARI TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EACevapAnahtari {
  id: string;
  sinav_id: string;
  ders_id: string;
  kitapcik: Kitapcik;
  cevaplar: string[];
  cevap_dizisi?: string;
  soru_sayisi?: number;
  is_active: boolean;
  created_at: string;
}

export interface DersCevapGirisi {
  dersId: string;
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  cevapDizisi: string;
  girilenCevap: number;
  tamamlandi: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// KATILIMCI TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EAKatilimci {
  id: string;
  sinav_id: string;
  organization_id: string;
  student_id?: string;
  katilimci_tipi: KatilimciTipi;
  katilimci_adi?: string;
  ogrenci_no?: string;
  misafir_ogrenci_no?: string;
  misafir_tc_no?: string;
  misafir_ad_soyad?: string;
  misafir_sinif?: string;
  misafir_sube?: string;
  kitapcik: Kitapcik;
  katildi: boolean;
  eslesme_durumu: EslesmeDurumu;
  ham_satir_no?: number;
  sira?: number;
  // Relations
  students?: {
    id: string;
    student_no: string;
    first_name: string;
    last_name: string;
    class?: string;
    section?: string;
  };
}

export interface ParsedKatilimci {
  satirNo: number;
  ogrenciNo?: string;
  tcNo?: string;
  adSoyad?: string;
  sinif?: string;
  sube?: string;
  kitapcik?: Kitapcik;
  cevaplar: string;
  // Eşleştirme sonucu
  studentId?: string;
  katilimciTipi: KatilimciTipi;
  eslestirmeDurumu: EslesmeDurumu;
}

// ═══════════════════════════════════════════════════════════════════════════
// SONUÇ TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EASonuc {
  id: string;
  sinav_id: string;
  katilimci_id: string;
  student_id?: string;
  organization_id: string;
  toplam_soru: number;
  toplam_dogru: number;
  toplam_yanlis: number;
  toplam_bos: number;
  toplam_net: number;
  basari_yuzdesi: number;
  sozel_net: number;
  sozel_dogru: number;
  sozel_yanlis: number;
  sayisal_net: number;
  sayisal_dogru: number;
  sayisal_yanlis: number;
  lgs_puan?: number;
  tyt_puan?: number;
  ayt_puan?: number;
  sira?: number;
  sinif_sirasi?: number;
  sube_sirasi?: number;
  yuzdelik?: number;
  hesaplandi: boolean;
  is_published: boolean;
}

export interface EADersSonuc {
  id: string;
  sinav_id?: string;
  sonuc_id?: string;
  katilimci_id: string;
  ders_id: string;
  soru_sayisi: number;
  dogru_sayisi: number;
  yanlis_sayisi: number;
  bos_sayisi: number;
  net: number;
  basari_yuzdesi: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTİK ŞABLON TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EAOptikSablon {
  id: string;
  organization_id: string;
  sablon_adi: string;
  aciklama?: string;
  format_tipi: 'fixed_width' | 'csv' | 'custom';
  satir_uzunlugu?: number;
  alan_tanimlari: OptikAlanTanimi[];
  cevap_baslangic?: number;
  cevap_uzunluk?: number;
  is_active: boolean;
  is_default: boolean;
}

export interface OptikAlanTanimi {
  alan: string;
  baslangic: number;
  uzunluk: number;
  zorunlu?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface WizardState {
  currentStep: WizardStep;
  sinavId?: string;
  sinavKodu?: string;
  
  // Step 1 - Sınav Bilgileri
  step1: {
    sinavAdi: string;
    sinavTarihi?: Date;
    sinifSeviyesi?: number;
    sinavTuru: SinavTipi | '';
    sureDakika: number;
    yanlisKatsayi: number;
    dersler: SinavDers[];
    toplamSoru: number;
    isCompleted: boolean;
  };
  
  // Step 2 - Cevap Anahtarı
  step2: {
    kitapcik: Kitapcik;
    cevaplar: DersCevapGirisi[];
    toplamCevap: number;
    girilenCevap: number;
    isCompleted: boolean;
  };
  
  // Step 3 - Optik Şablon
  step3: {
    optikSablonId?: string;
    sablonSecildi: boolean;
    isCompleted: boolean;
  };
  
  // Step 4 - Veri Yükle
  step4: {
    dosyaAdi?: string;
    dosyaIcerik?: string;
    katilimcilar: ParsedKatilimci[];
    toplamKatilimci: number;
    eslesen: number;
    eslesemeyen: number;
    isCompleted: boolean;
  };
  
  // Step 5 - Önizleme & Yayınla
  step5: {
    hazirMi: boolean;
    kontrolListesi: {
      sinavBilgileri: boolean;
      cevapAnahtari: boolean;
      katilimcilar: boolean;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SINAV TÜRLERİ VARSAYILAN DEĞERLERİ
// ═══════════════════════════════════════════════════════════════════════════

export interface SinavTuruConfig {
  ad: string;
  siniflar: (number | 'mezun')[];
  varsayilanDersler: {
    kod: string;
    ad: string;
    soru: number;
  }[];
  toplamSoru: number | null;
  sure: number | null;
  yanlisKatsayi: number;
}

export const SINAV_TURLERI: Record<string, SinavTuruConfig> = {
  lgs: {
    ad: 'LGS',
    siniflar: [8],
    varsayilanDersler: [
      { kod: 'TUR', ad: 'Türkçe', soru: 20 },
      { kod: 'INK', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soru: 10 },
      { kod: 'DIN', ad: 'Din Kültürü ve Ahlak Bilgisi', soru: 10 },
      { kod: 'ING', ad: 'İngilizce', soru: 10 },
      { kod: 'MAT', ad: 'Matematik', soru: 20 },
      { kod: 'FEN', ad: 'Fen Bilimleri', soru: 20 },
    ],
    toplamSoru: 90,
    sure: 120,
    yanlisKatsayi: 0.333,
  },
  tyt: {
    ad: 'TYT',
    siniflar: [11, 12, 'mezun'],
    varsayilanDersler: [
      { kod: 'TUR', ad: 'Türkçe', soru: 40 },
      { kod: 'SOS', ad: 'Sosyal Bilimler', soru: 20 },
      { kod: 'MAT', ad: 'Temel Matematik', soru: 40 },
      { kod: 'FEN', ad: 'Fen Bilimleri', soru: 20 },
    ],
    toplamSoru: 120,
    sure: 165,
    yanlisKatsayi: 0.25,
  },
  ayt: {
    ad: 'AYT',
    siniflar: [11, 12, 'mezun'],
    varsayilanDersler: [],
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayi: 0.25,
  },
  kurum_deneme: {
    ad: 'Kurum Denemesi',
    siniflar: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    varsayilanDersler: [],
    toplamSoru: null,
    sure: null,
    yanlisKatsayi: 0.333,
  },
  konu_testi: {
    ad: 'Konu Testi',
    siniflar: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    varsayilanDersler: [],
    toplamSoru: null,
    sure: null,
    yanlisKatsayi: 0,
  },
  yazili: {
    ad: 'Yazılı',
    siniflar: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    varsayilanDersler: [],
    toplamSoru: null,
    sure: null,
    yanlisKatsayi: 0,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DERS RENK PALETİ
// ═══════════════════════════════════════════════════════════════════════════

export const DERS_RENKLERI: Record<string, string> = {
  TUR: '#EF4444', // Kırmızı
  MAT: '#3B82F6', // Mavi
  FEN: '#10B981', // Yeşil
  SOS: '#F59E0B', // Turuncu
  INK: '#8B5CF6', // Mor
  DIN: '#06B6D4', // Cyan
  ING: '#EC4899', // Pembe
  DEFAULT: '#6B7280', // Gri
};

export function getDersRenk(dersKodu: string): string {
  return DERS_RENKLERI[dersKodu?.toUpperCase()] || DERS_RENKLERI.DEFAULT;
}
