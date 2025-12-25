/**
 * SINAV KONFİGÜRASYONLARI ve ŞABLON KÜTÜPHANESİ
 * 
 * Bu dosya tüm sınav türleri, sınıf seviyeleri ve optik form şablonlarını içerir.
 * Türkiye eğitim sistemi standartlarına uygun olarak hazırlanmıştır.
 */

// ============================================================================
// SINIF SEVİYELERİ
// ============================================================================

export type SinifSeviyesi = 
  | '4' | '5' | '6' | '7' | '8'           // İlkokul/Ortaokul
  | '9' | '10' | '11' | '12' | 'mezun';   // Lise/Mezun

export interface SinifBilgisi {
  seviye: SinifSeviyesi;
  ad: string;
  kademe: 'ilkokul' | 'ortaokul' | 'lise' | 'mezun';
  varsayilanSoruSayisi: number;
  minSoruSayisi: number;
  maxSoruSayisi: number;
}

export const SINIF_BILGILERI: Record<SinifSeviyesi, SinifBilgisi> = {
  '4': { seviye: '4', ad: '4. Sınıf', kademe: 'ilkokul', varsayilanSoruSayisi: 40, minSoruSayisi: 20, maxSoruSayisi: 60 },
  '5': { seviye: '5', ad: '5. Sınıf', kademe: 'ilkokul', varsayilanSoruSayisi: 50, minSoruSayisi: 30, maxSoruSayisi: 70 },
  '6': { seviye: '6', ad: '6. Sınıf', kademe: 'ortaokul', varsayilanSoruSayisi: 60, minSoruSayisi: 40, maxSoruSayisi: 80 },
  '7': { seviye: '7', ad: '7. Sınıf', kademe: 'ortaokul', varsayilanSoruSayisi: 70, minSoruSayisi: 50, maxSoruSayisi: 90 },
  '8': { seviye: '8', ad: '8. Sınıf (LGS)', kademe: 'ortaokul', varsayilanSoruSayisi: 90, minSoruSayisi: 60, maxSoruSayisi: 100 },
  '9': { seviye: '9', ad: '9. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 80, minSoruSayisi: 40, maxSoruSayisi: 120 },
  '10': { seviye: '10', ad: '10. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 80, minSoruSayisi: 40, maxSoruSayisi: 120 },
  '11': { seviye: '11', ad: '11. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 100, minSoruSayisi: 60, maxSoruSayisi: 160 },
  '12': { seviye: '12', ad: '12. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 120, minSoruSayisi: 80, maxSoruSayisi: 200 },
  'mezun': { seviye: 'mezun', ad: 'Mezun', kademe: 'mezun', varsayilanSoruSayisi: 120, minSoruSayisi: 80, maxSoruSayisi: 200 },
};

// ============================================================================
// SINAV TÜRLERİ
// ============================================================================

export type SinavTuru = 
  | 'LGS'           // Liselere Geçiş Sınavı
  | 'TYT'           // Temel Yeterlilik Testi
  | 'AYT_SAY'       // Alan Yeterlilik - Sayısal
  | 'AYT_EA'        // Alan Yeterlilik - Eşit Ağırlık
  | 'AYT_SOZ'       // Alan Yeterlilik - Sözel
  | 'AYT_DIL'       // Alan Yeterlilik - Yabancı Dil
  | 'DENEME'        // Kurum Denemesi
  | 'YAZILI';       // Dönem Sonu Yazılı

export interface DersDagilimi {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  baslangicSoru: number;
  bitisSoru: number;
  ppiKatsayisi?: number;  // Puanlama katsayısı (TYT/AYT için)
}

export interface SinavTuruKonfigurasyonu {
  kod: SinavTuru;
  ad: string;
  aciklama: string;
  toplamSoru: number;
  sure: number;  // Dakika
  yanlisKatsayisi: number;  // 3 = 3 yanlış 1 doğruyu götürür, 4 = 4 yanlış 1 doğruyu götürür
  dersDagilimi: DersDagilimi[];
  uygunSiniflar: SinifSeviyesi[];
  kitapcikTurleri: ('A' | 'B' | 'C' | 'D')[];
  renk: string;
  icon: string;
}

export const SINAV_KONFIGURASYONLARI: Record<SinavTuru, SinavTuruKonfigurasyonu> = {
  LGS: {
    kod: 'LGS',
    ad: 'LGS - Liselere Geçiş Sınavı',
    aciklama: '8. sınıf öğrencileri için merkezi sınav',
    toplamSoru: 90,
    sure: 120,
    yanlisKatsayisi: 3,
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    uygunSiniflar: ['8'],
    renk: '#10B981',
    icon: '🎓',
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, baslangicSoru: 1, bitisSoru: 20 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, baslangicSoru: 21, bitisSoru: 40 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, baslangicSoru: 41, bitisSoru: 60 },
      { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, baslangicSoru: 61, bitisSoru: 70 },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, baslangicSoru: 71, bitisSoru: 80 },
      { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, baslangicSoru: 81, bitisSoru: 90 },
    ]
  },
  TYT: {
    kod: 'TYT',
    ad: 'TYT - Temel Yeterlilik Testi',
    aciklama: 'Üniversite sınavı birinci oturum',
    toplamSoru: 120,
    sure: 165,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    renk: '#3B82F6',
    icon: '📚',
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 40, baslangicSoru: 1, bitisSoru: 40, ppiKatsayisi: 1.32 },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilimler', soruSayisi: 20, baslangicSoru: 41, bitisSoru: 60, ppiKatsayisi: 1.36 },
      { dersKodu: 'MAT', dersAdi: 'Temel Matematik', soruSayisi: 40, baslangicSoru: 61, bitisSoru: 100, ppiKatsayisi: 1.32 },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, baslangicSoru: 101, bitisSoru: 120, ppiKatsayisi: 1.36 },
    ]
  },
  AYT_SAY: {
    kod: 'AYT_SAY',
    ad: 'AYT Sayısal',
    aciklama: 'Üniversite sınavı ikinci oturum - Sayısal alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    renk: '#8B5CF6',
    icon: '🔬',
    dersDagilimi: [
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 40, baslangicSoru: 1, bitisSoru: 40, ppiKatsayisi: 3.00 },
      { dersKodu: 'FIZ', dersAdi: 'Fizik', soruSayisi: 14, baslangicSoru: 41, bitisSoru: 54, ppiKatsayisi: 2.85 },
      { dersKodu: 'KIM', dersAdi: 'Kimya', soruSayisi: 13, baslangicSoru: 55, bitisSoru: 67, ppiKatsayisi: 3.07 },
      { dersKodu: 'BIY', dersAdi: 'Biyoloji', soruSayisi: 13, baslangicSoru: 68, bitisSoru: 80, ppiKatsayisi: 3.07 },
    ]
  },
  AYT_EA: {
    kod: 'AYT_EA',
    ad: 'AYT Eşit Ağırlık',
    aciklama: 'Üniversite sınavı ikinci oturum - Eşit ağırlık alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    renk: '#F59E0B',
    icon: '⚖️',
    dersDagilimi: [
      { dersKodu: 'EDEB', dersAdi: 'Türk Dili ve Edebiyatı', soruSayisi: 24, baslangicSoru: 1, bitisSoru: 24, ppiKatsayisi: 3.00 },
      { dersKodu: 'TAR1', dersAdi: 'Tarih-1', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, ppiKatsayisi: 2.80 },
      { dersKodu: 'COG1', dersAdi: 'Coğrafya-1', soruSayisi: 6, baslangicSoru: 35, bitisSoru: 40, ppiKatsayisi: 3.33 },
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 40, baslangicSoru: 41, bitisSoru: 80, ppiKatsayisi: 3.00 },
    ]
  },
  AYT_SOZ: {
    kod: 'AYT_SOZ',
    ad: 'AYT Sözel',
    aciklama: 'Üniversite sınavı ikinci oturum - Sözel alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    renk: '#EC4899',
    icon: '📖',
    dersDagilimi: [
      { dersKodu: 'EDEB', dersAdi: 'Türk Dili ve Edebiyatı', soruSayisi: 24, baslangicSoru: 1, bitisSoru: 24, ppiKatsayisi: 3.00 },
      { dersKodu: 'TAR1', dersAdi: 'Tarih-1', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, ppiKatsayisi: 2.80 },
      { dersKodu: 'COG1', dersAdi: 'Coğrafya-1', soruSayisi: 6, baslangicSoru: 35, bitisSoru: 40, ppiKatsayisi: 3.33 },
      { dersKodu: 'TAR2', dersAdi: 'Tarih-2', soruSayisi: 11, baslangicSoru: 41, bitisSoru: 51, ppiKatsayisi: 2.90 },
      { dersKodu: 'COG2', dersAdi: 'Coğrafya-2', soruSayisi: 11, baslangicSoru: 52, bitisSoru: 62, ppiKatsayisi: 2.90 },
      { dersKodu: 'FEL', dersAdi: 'Felsefe Grubu', soruSayisi: 12, baslangicSoru: 63, bitisSoru: 74, ppiKatsayisi: 3.00 },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 6, baslangicSoru: 75, bitisSoru: 80, ppiKatsayisi: 3.33 },
    ]
  },
  AYT_DIL: {
    kod: 'AYT_DIL',
    ad: 'AYT Yabancı Dil',
    aciklama: 'Üniversite sınavı - Yabancı dil testi',
    toplamSoru: 80,
    sure: 120,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    renk: '#06B6D4',
    icon: '🌍',
    dersDagilimi: [
      { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 80, baslangicSoru: 1, bitisSoru: 80, ppiKatsayisi: 3.75 },
    ]
  },
  DENEME: {
    kod: 'DENEME',
    ad: 'Kurum Denemesi',
    aciklama: 'Özel yapılandırmalı kurum içi deneme sınavı',
    toplamSoru: 0,  // Dinamik
    sure: 0,        // Dinamik
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'mezun'],
    renk: '#64748B',
    icon: '📝',
    dersDagilimi: []  // Dinamik
  },
  YAZILI: {
    kod: 'YAZILI',
    ad: 'Dönem Sonu Yazılı',
    aciklama: 'Tek ders yazılı sınavı',
    toplamSoru: 0,
    sure: 40,
    yanlisKatsayisi: 0,  // Yanlış götürmez
    kitapcikTurleri: ['A'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    renk: '#94A3B8',
    icon: '✏️',
    dersDagilimi: []
  }
};

// ============================================================================
// OPTİK FORM ŞABLONLARI - HAZIR KÜTÜPHANE
// ============================================================================

export interface OptikFormSablonu {
  id: string;
  ad: string;
  yayinevi: string;
  aciklama: string;
  sinifSeviyeleri: SinifSeviyesi[];
  sinavTurleri: SinavTuru[];
  toplamSoru: number;
  satirUzunlugu: number;  // Optik formdan gelen satır karakter sayısı
  alanlar: {
    ogrenciNo: { baslangic: number; bitis: number };
    ogrenciAdi: { baslangic: number; bitis: number };
    tcKimlik?: { baslangic: number; bitis: number };
    sinif?: { baslangic: number; bitis: number };
    kitapcik?: { baslangic: number; bitis: number };
    cevaplar: { baslangic: number; bitis: number };
  };
  kitapcikDonusum?: {
    A: number[];  // A kitapçığı soru sıralaması
    B: number[];  // B kitapçığı soru sıralaması
    C?: number[];
    D?: number[];
  };
  onerilenIcon: string;
  renk: string;
}

export const OPTIK_FORM_SABLONLARI: OptikFormSablonu[] = [
  // ============= LGS ŞABLONLARI =============
  {
    id: 'nar-lgs-90',
    ad: 'NAR Yayınları - LGS 90 Soru',
    yayinevi: 'NAR Yayınları',
    aciklama: 'NAR Yayınları standart LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 173,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 8 },
      ogrenciAdi: { baslangic: 9, bitis: 28 },
      tcKimlik: { baslangic: 29, bitis: 40 },
      kitapcik: { baslangic: 41, bitis: 41 },
      sinif: { baslangic: 42, bitis: 42 },
      cevaplar: { baslangic: 53, bitis: 142 },
    },
    onerilenIcon: '📗',
    renk: '#10B981'
  },
  {
    id: 'netbil-lgs-90',
    ad: 'Netbil - LGS 90 Soru',
    yayinevi: 'Netbil Yayınları',
    aciklama: 'Netbil standart LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 160,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 6 },
      ogrenciAdi: { baslangic: 7, bitis: 30 },
      kitapcik: { baslangic: 31, bitis: 31 },
      cevaplar: { baslangic: 40, bitis: 129 },
    },
    onerilenIcon: '📘',
    renk: '#3B82F6'
  },
  {
    id: 'tonguc-lgs-90',
    ad: 'Tonguç Akademi - LGS 90 Soru',
    yayinevi: 'Tonguç Akademi',
    aciklama: 'Tonguç Akademi LGS deneme optik formu',
    sinifSeviyeleri: ['8'],
    sinavTurleri: ['LGS', 'DENEME'],
    toplamSoru: 90,
    satirUzunlugu: 155,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 7 },
      ogrenciAdi: { baslangic: 8, bitis: 28 },
      kitapcik: { baslangic: 29, bitis: 29 },
      sinif: { baslangic: 30, bitis: 32 },
      cevaplar: { baslangic: 35, bitis: 124 },
    },
    onerilenIcon: '🐝',
    renk: '#F59E0B'
  },
  
  // ============= 7. SINIF ŞABLONLARI =============
  {
    id: 'nar-7sinif-80',
    ad: 'NAR Yayınları - 7. Sınıf 80 Soru',
    yayinevi: 'NAR Yayınları',
    aciklama: '7. Sınıf genel deneme sınavı optik formu',
    sinifSeviyeleri: ['7'],
    sinavTurleri: ['DENEME'],
    toplamSoru: 80,
    satirUzunlugu: 160,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 8 },
      ogrenciAdi: { baslangic: 9, bitis: 28 },
      kitapcik: { baslangic: 29, bitis: 29 },
      sinif: { baslangic: 30, bitis: 32 },
      cevaplar: { baslangic: 40, bitis: 119 },
    },
    onerilenIcon: '📗',
    renk: '#10B981'
  },
  {
    id: 'genel-7sinif-70',
    ad: 'Genel - 7. Sınıf 70 Soru',
    yayinevi: 'Genel',
    aciklama: '7. Sınıf 70 soruluk deneme optik formu',
    sinifSeviyeleri: ['7'],
    sinavTurleri: ['DENEME'],
    toplamSoru: 70,
    satirUzunlugu: 145,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 6 },
      ogrenciAdi: { baslangic: 7, bitis: 26 },
      kitapcik: { baslangic: 27, bitis: 27 },
      sinif: { baslangic: 28, bitis: 30 },
      cevaplar: { baslangic: 35, bitis: 104 },
    },
    onerilenIcon: '📓',
    renk: '#8B5CF6'
  },

  // ============= TYT ŞABLONLARI =============
  {
    id: '3d-tyt-120',
    ad: '3D Yayınları - TYT 120 Soru',
    yayinevi: '3D Yayınları',
    aciklama: 'TYT tam deneme optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['TYT'],
    toplamSoru: 120,
    satirUzunlugu: 200,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      tcKimlik: { baslangic: 36, bitis: 46 },
      kitapcik: { baslangic: 47, bitis: 47 },
      cevaplar: { baslangic: 50, bitis: 169 },
    },
    onerilenIcon: '📕',
    renk: '#EF4444'
  },
  {
    id: 'limit-tyt-120',
    ad: 'Limit Yayınları - TYT 120 Soru',
    yayinevi: 'Limit Yayınları',
    aciklama: 'Limit TYT deneme optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['TYT'],
    toplamSoru: 120,
    satirUzunlugu: 195,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 8 },
      ogrenciAdi: { baslangic: 9, bitis: 32 },
      tcKimlik: { baslangic: 33, bitis: 43 },
      kitapcik: { baslangic: 44, bitis: 44 },
      cevaplar: { baslangic: 48, bitis: 167 },
    },
    onerilenIcon: '🎯',
    renk: '#6366F1'
  },

  // ============= AYT ŞABLONLARI =============
  {
    id: '3d-ayt-80',
    ad: '3D Yayınları - AYT 80 Soru',
    yayinevi: '3D Yayınları',
    aciklama: 'AYT alan sınavı optik formu',
    sinifSeviyeleri: ['11', '12', 'mezun'],
    sinavTurleri: ['AYT_SAY', 'AYT_EA', 'AYT_SOZ'],
    toplamSoru: 80,
    satirUzunlugu: 165,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 10 },
      ogrenciAdi: { baslangic: 11, bitis: 35 },
      tcKimlik: { baslangic: 36, bitis: 46 },
      kitapcik: { baslangic: 47, bitis: 47 },
      cevaplar: { baslangic: 50, bitis: 129 },
    },
    onerilenIcon: '📕',
    renk: '#EF4444'
  },

  // ============= İLKOKUL ŞABLONLARI =============
  {
    id: 'genel-4sinif-40',
    ad: 'Genel - 4. Sınıf 40 Soru',
    yayinevi: 'Genel',
    aciklama: '4. Sınıf genel değerlendirme optik formu',
    sinifSeviyeleri: ['4'],
    sinavTurleri: ['DENEME'],
    toplamSoru: 40,
    satirUzunlugu: 100,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 4 },
      ogrenciAdi: { baslangic: 5, bitis: 24 },
      sinif: { baslangic: 25, bitis: 26 },
      cevaplar: { baslangic: 30, bitis: 69 },
    },
    onerilenIcon: '🌟',
    renk: '#F59E0B'
  },
  {
    id: 'genel-5sinif-50',
    ad: 'Genel - 5. Sınıf 50 Soru',
    yayinevi: 'Genel',
    aciklama: '5. Sınıf genel değerlendirme optik formu',
    sinifSeviyeleri: ['5'],
    sinavTurleri: ['DENEME'],
    toplamSoru: 50,
    satirUzunlugu: 115,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 5 },
      ogrenciAdi: { baslangic: 6, bitis: 25 },
      sinif: { baslangic: 26, bitis: 27 },
      cevaplar: { baslangic: 32, bitis: 81 },
    },
    onerilenIcon: '⭐',
    renk: '#10B981'
  },
  {
    id: 'genel-6sinif-60',
    ad: 'Genel - 6. Sınıf 60 Soru',
    yayinevi: 'Genel',
    aciklama: '6. Sınıf genel değerlendirme optik formu',
    sinifSeviyeleri: ['6'],
    sinavTurleri: ['DENEME'],
    toplamSoru: 60,
    satirUzunlugu: 130,
    alanlar: {
      ogrenciNo: { baslangic: 1, bitis: 6 },
      ogrenciAdi: { baslangic: 7, bitis: 26 },
      sinif: { baslangic: 27, bitis: 28 },
      cevaplar: { baslangic: 35, bitis: 94 },
    },
    onerilenIcon: '💫',
    renk: '#3B82F6'
  }
];

// ============================================================================
// KİTAPÇIK DÖNÜŞÜM TABLOSU
// ============================================================================

/**
 * Kitapçık dönüşüm mantığı:
 * A kitapçığı referans alınır, diğer kitapçıklar A'ya dönüştürülür.
 * 
 * Örnek: B kitapçığında Soru 1 = A kitapçığında Soru 20
 * kitapcikDonusumTablosu['B'][0] = 19 (0-indexed, yani A'nın 20. sorusu)
 */
export interface KitapcikDonusumTablosu {
  sinavTuru: SinavTuru;
  toplamSoru: number;
  A: number[];  // A kitapçığı kendi sıralaması (1,2,3...)
  B: number[];  // B kitapçığı -> A dönüşümü
  C?: number[]; // C kitapçığı -> A dönüşümü
  D?: number[]; // D kitapçığı -> A dönüşümü
}

// LGS için standart kitapçık dönüşüm tablosu oluştur
export function createLGSKitapcikDonusum(): KitapcikDonusumTablosu {
  const toplamSoru = 90;
  const A = Array.from({ length: toplamSoru }, (_, i) => i);
  
  // B kitapçığı: Her 20 soruluk blok ters sırada
  const B: number[] = [];
  for (let block = 0; block < 5; block++) {
    const start = block * 20;
    const end = Math.min(start + 20, toplamSoru);
    for (let i = end - 1; i >= start; i--) {
      B.push(i);
    }
  }
  
  // C ve D kitapçıkları: Bloklar karışık
  const C = [...A].sort(() => Math.random() - 0.5);  // Rastgele (gerçekte sabit tablo olmalı)
  const D = [...A].sort(() => Math.random() - 0.5);
  
  return { sinavTuru: 'LGS', toplamSoru, A, B, C, D };
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

/**
 * Sınıf seviyesine göre uygun sınav türlerini getir
 */
export function getUygunSinavTurleri(sinifSeviyesi: SinifSeviyesi): SinavTuruKonfigurasyonu[] {
  return Object.values(SINAV_KONFIGURASYONLARI).filter(
    sinav => sinav.uygunSiniflar.includes(sinifSeviyesi)
  );
}

/**
 * Sınav türüne göre uygun optik form şablonlarını getir
 */
export function getUygunOptikSablonlar(sinavTuru: SinavTuru): OptikFormSablonu[] {
  return OPTIK_FORM_SABLONLARI.filter(
    sablon => sablon.sinavTurleri.includes(sinavTuru)
  );
}

/**
 * Sınıf seviyesine göre optik form şablonlarını getir
 */
export function getSinifOptikSablonlari(sinifSeviyesi: SinifSeviyesi): OptikFormSablonu[] {
  return OPTIK_FORM_SABLONLARI.filter(
    sablon => sablon.sinifSeviyeleri.includes(sinifSeviyesi)
  );
}

/**
 * Soru numarasından ders bilgisini getir
 */
export function getSoruDersBilgisi(sinavTuru: SinavTuru, soruNo: number): DersDagilimi | null {
  const konfig = SINAV_KONFIGURASYONLARI[sinavTuru];
  if (!konfig) return null;
  
  return konfig.dersDagilimi.find(
    ders => soruNo >= ders.baslangicSoru && soruNo <= ders.bitisSoru
  ) || null;
}

/**
 * Kitapçık cevabını A kitapçığına dönüştür
 */
export function donusturKitapcikCevabi(
  kitapcik: 'A' | 'B' | 'C' | 'D',
  soruNo: number,
  cevap: string,
  donusumTablosu: KitapcikDonusumTablosu
): { aSoruNo: number; cevap: string } {
  if (kitapcik === 'A') {
    return { aSoruNo: soruNo, cevap };
  }
  
  const tabloKey = kitapcik as keyof typeof donusumTablosu;
  const tablo = donusumTablosu[tabloKey];
  
  if (!tablo || typeof tablo === 'string' || typeof tablo === 'number') {
    return { aSoruNo: soruNo, cevap };
  }
  
  const aSoruNo = (tablo as number[])[soruNo - 1] + 1;  // 1-indexed
  return { aSoruNo, cevap };
}


