/**
 * Kazanım Bazlı Değerlendirme - Tip Tanımları
 */

// Kazanım (MEB Müfredatı)
export interface Kazanim {
  id: string;
  dersKodu: string;        // 'TUR', 'MAT', 'FEN', 'SOS', 'ING', 'DIN'
  dersAdi: string;
  sinifSeviyesi?: string;
  uniteNo?: number;
  uniteAdi?: string;
  kazanimKodu: string;     // 'T.8.1.2'
  kazanimMetni: string;
  kisaAciklama?: string;
  bloomSeviyesi?: number;  // 1-6
  zorlukSeviyesi?: 'kolay' | 'orta' | 'zor';
}

// Cevap Anahtarı Satırı (Excel'den)
export interface CevapAnahtariSatir {
  soruNo: number;                          // Ana soru numarası
  dogruCevap: 'A' | 'B' | 'C' | 'D' | 'E';
  dersKodu: string;
  dersAdi?: string;                        // Ders adı (Excel'den)
  testKodu?: string;                       // Test kodu (Excel'den)
  
  // Kitapçık bazlı soru numaraları
  kitapcikSoruNo?: {
    A?: number;
    B?: number;
    C?: number;
    D?: number;
  };
  
  kazanimKodu?: string;
  kazanimMetni?: string;
  konuAdi?: string;
  zorluk?: number;
}

// Optik Şablon Alan Tanımı
export interface OptikAlanTanimi {
  alan: 'sinif_no' | 'ogrenci_no' | 'ogrenci_adi' | 'tc' | 'kitapcik' | 'cevaplar' | 'bos' | 'ozel';
  baslangic: number;       // Karakter başlangıç (1-indexed)
  bitis: number;           // Karakter bitiş
  label: string;           // Görüntülenecek isim
  color?: string;          // UI renk kodu
  customLabel?: string;    // Özel alan için kullanıcı tanımlı isim (telefon, veli adı, vs.)
}

// Özel Alan Tipleri - Sık kullanılan ekstra alanlar
export const OZEL_ALAN_ONERILERI = [
  { id: 'telefon', label: 'Cep Telefonu', icon: '📱', color: '#8B5CF6' },
  { id: 'veli_adi', label: 'Veli Adı', icon: '👨‍👩‍👧', color: '#EC4899' },
  { id: 'email', label: 'E-posta', icon: '📧', color: '#06B6D4' },
  { id: 'sube', label: 'Şube', icon: '🏢', color: '#F59E0B' },
  { id: 'kurum_kodu', label: 'Kurum Kodu', icon: '🏫', color: '#64748B' },
  { id: 'ogrenci_id', label: 'Öğrenci ID', icon: '🔢', color: '#10B981' },
  { id: 'dogum_tarihi', label: 'Doğum Tarihi', icon: '📅', color: '#EF4444' },
  { id: 'cinsiyet', label: 'Cinsiyet', icon: '⚧️', color: '#A855F7' },
  { id: 'diger', label: 'Diğer (Özel)', icon: '✏️', color: '#6B7280' },
];

// Optik Şablon
export interface OptikSablon {
  id: string;
  sablonAdi: string;
  aciklama?: string;
  alanTanimlari: OptikAlanTanimi[];
  cevapBaslangic: number;
  toplamSoru: number;
  kitapcikPozisyon?: number;
  isDefault: boolean;
  isActive: boolean;
}

// Parse Edilmiş Optik Satır
export interface ParsedOptikSatir {
  satırNo: number;
  hamVeri: string;
  sinifNo?: string;
  ogrenciNo?: string;
  ogrenciAdi?: string;
  tc?: string;
  kitapcik?: 'A' | 'B' | 'C' | 'D';
  cevaplar: (string | null)[];
  hatalar: string[];
  isValid: boolean;
}

// Öğrenci Kazanım Sonucu
export interface OgrenciKazanimSonuc {
  kazanimKodu: string;
  kazanimMetni: string;
  dersKodu: string;
  dersAdi: string;
  toplamSoru: number;
  dogru: number;
  yanlis: number;
  bos: number;
  basariOrani: number;     // 0-100
}

// Kazanım Bazlı Karne Verisi
export interface KazanimKarnesi {
  ogrenciId: string;
  ogrenciAdi: string;
  sinif: string;
  sinavId: string;
  sinavAdi: string;
  sinavTarihi: string;
  
  // Genel sonuçlar
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  genelSiralama: number;
  sinifSiralamasi: number;
  
  // Ders bazlı
  dersler: {
    dersKodu: string;
    dersAdi: string;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
    basariOrani: number;
    cevapAnahtari: string;  // 'BDABCDCB8AD'
    ogrenciCevabi: string;  // 'BDA8BDCBA'
    kazanimlar: OgrenciKazanimSonuc[];
  }[];
  
  // Zayıf kazanımlar (< %50)
  zayifKazanimlar: OgrenciKazanimSonuc[];
  
  // Güçlü kazanımlar (>= %80)
  gucluKazanimlar: OgrenciKazanimSonuc[];
}

// Excel Import Formatı
export interface ExcelCevapAnahtari {
  headers: string[];
  rows: {
    soruNo: number;
    dersKodu: string;
    dersAdi: string;
    kazanimKodu: string;
    kazanimMetni: string;
    dogruCevap: string;
    [key: string]: any;
  }[];
}

// Ders Renkleri
export const DERS_RENKLERI: Record<string, string> = {
  TUR: '#25D366',
  MAT: '#3B82F6',
  FEN: '#8B5CF6',
  SOS: '#F59E0B',
  ING: '#EC4899',
  DIN: '#14B8A6',
  TAR: '#EF4444',
  COG: '#06B6D4',
  FEL: '#6366F1',
  FIZ: '#10B981',
  KIM: '#F97316',
  BIY: '#84CC16',
};

// Ders İsimleri
export const DERS_ISIMLERI: Record<string, string> = {
  TUR: 'Türkçe',
  MAT: 'Matematik',
  FEN: 'Fen Bilimleri',
  SOS: 'Sosyal Bilimler',
  ING: 'İngilizce',
  DIN: 'Din Kültürü',
  TAR: 'T.C. İnkılap Tarihi',
  COG: 'Coğrafya',
  FEL: 'Felsefe',
  FIZ: 'Fizik',
  KIM: 'Kimya',
  BIY: 'Biyoloji',
};

// Optik Alan Renkleri
export const ALAN_RENKLERI: Record<string, string> = {
  sinif_no: '#EF4444',
  ogrenci_no: '#F59E0B',
  ogrenci_adi: '#10B981',
  tc: '#3B82F6',
  kitapcik: '#8B5CF6',
  cevaplar: '#25D366',
  bos: '#9CA3AF',
};

// Bloom Seviyeleri
export const BLOOM_SEVIYELERI = [
  { seviye: 1, ad: 'Hatırlama', renk: '#10B981' },
  { seviye: 2, ad: 'Anlama', renk: '#3B82F6' },
  { seviye: 3, ad: 'Uygulama', renk: '#F59E0B' },
  { seviye: 4, ad: 'Analiz', renk: '#8B5CF6' },
  { seviye: 5, ad: 'Değerlendirme', renk: '#EC4899' },
  { seviye: 6, ad: 'Oluşturma', renk: '#EF4444' },
];

