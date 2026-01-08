// ============================================================================
// SPECTRA SINAV KONFİGÜRASYONLARI
// LGS, TYT, AYT, Deneme, Yazılı tüm sınav türleri
// ============================================================================

import type {
  SinifSeviyesi,
  SinifBilgisi,
  SinavTuru,
  SinavKonfigurasyonu,
  DersKodu,
  DersDagilimi,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// SINIF BİLGİLERİ
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// DERS RENKLERİ VE İKONLARI
// ─────────────────────────────────────────────────────────────────────────────

export const DERS_RENKLERI: Record<string, { bg: string; text: string; icon: string }> = {
  TUR: { bg: 'bg-blue-500', text: 'text-blue-600', icon: '📖' },
  MAT: { bg: 'bg-red-500', text: 'text-red-600', icon: '📐' },
  FEN: { bg: 'bg-green-500', text: 'text-green-600', icon: '🔬' },
  SOS: { bg: 'bg-amber-500', text: 'text-amber-600', icon: '🏛️' },
  DIN: { bg: 'bg-purple-500', text: 'text-purple-600', icon: '🕌' },
  ING: { bg: 'bg-cyan-500', text: 'text-cyan-600', icon: '🌍' },
  EDEB: { bg: 'bg-indigo-500', text: 'text-indigo-600', icon: '✍️' },
  TAR1: { bg: 'bg-orange-500', text: 'text-orange-600', icon: '📜' },
  TAR2: { bg: 'bg-orange-600', text: 'text-orange-700', icon: '📜' },
  COG1: { bg: 'bg-emerald-500', text: 'text-emerald-600', icon: '🗺️' },
  COG2: { bg: 'bg-emerald-600', text: 'text-emerald-700', icon: '🗺️' },
  FIZ: { bg: 'bg-sky-500', text: 'text-sky-600', icon: '⚛️' },
  KIM: { bg: 'bg-pink-500', text: 'text-pink-600', icon: '🧪' },
  BIY: { bg: 'bg-lime-500', text: 'text-lime-600', icon: '🧬' },
  FEL: { bg: 'bg-violet-500', text: 'text-violet-600', icon: '💭' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SINAV KONFİGÜRASYONLARI
// ─────────────────────────────────────────────────────────────────────────────

export const SINAV_KONFIGURASYONLARI: Record<SinavTuru, SinavKonfigurasyonu> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // LGS - Liselere Geçiş Sınavı (8. Sınıf)
  // ═══════════════════════════════════════════════════════════════════════════
  LGS: {
    kod: 'LGS',
    ad: 'LGS - Liselere Geçiş Sınavı',
    aciklama: '8. sınıf öğrencileri için merkezi sınav',
    toplamSoru: 90,
    sure: 120, // dakika
    yanlisKatsayisi: 3, // 3 yanlış = 1 doğru
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    uygunSiniflar: ['8'],
    tabanPuan: 100,
    tavanPuan: 500,
    renk: '#10B981',
    icon: '🎓',
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, baslangicSoru: 1, bitisSoru: 20, renk: '#3B82F6', icon: '📖' },
      { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, baslangicSoru: 21, bitisSoru: 30, renk: '#F59E0B', icon: '🏛️' },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, baslangicSoru: 31, bitisSoru: 40, renk: '#8B5CF6', icon: '🕌' },
      { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, baslangicSoru: 41, bitisSoru: 50, renk: '#06B6D4', icon: '🌍' },
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, baslangicSoru: 51, bitisSoru: 70, renk: '#EF4444', icon: '📐' },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, baslangicSoru: 71, bitisSoru: 90, renk: '#22C55E', icon: '🔬' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYT - Temel Yeterlilik Testi
  // ═══════════════════════════════════════════════════════════════════════════
  TYT: {
    kod: 'TYT',
    ad: 'TYT - Temel Yeterlilik Testi',
    aciklama: 'Üniversite sınavı birinci oturum',
    toplamSoru: 120,
    sure: 165,
    yanlisKatsayisi: 4, // 4 yanlış = 1 doğru
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    renk: '#3B82F6',
    icon: '📚',
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 40, baslangicSoru: 1, bitisSoru: 40, ppiKatsayisi: 1.32, renk: '#3B82F6', icon: '📖' },
      { dersKodu: 'SOS', dersAdi: 'Sosyal Bilimler', soruSayisi: 20, baslangicSoru: 41, bitisSoru: 60, ppiKatsayisi: 1.36, renk: '#F59E0B', icon: '🏛️' },
      { dersKodu: 'MAT', dersAdi: 'Temel Matematik', soruSayisi: 40, baslangicSoru: 61, bitisSoru: 100, ppiKatsayisi: 1.32, renk: '#EF4444', icon: '📐' },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, baslangicSoru: 101, bitisSoru: 120, ppiKatsayisi: 1.36, renk: '#22C55E', icon: '🔬' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT SAYISAL
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_SAY: {
    kod: 'AYT_SAY',
    ad: 'AYT Sayısal',
    aciklama: 'Üniversite sınavı ikinci oturum - Sayısal alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    renk: '#8B5CF6',
    icon: '🔬',
    dersDagilimi: [
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 40, baslangicSoru: 1, bitisSoru: 40, ppiKatsayisi: 3.00, renk: '#EF4444', icon: '📐' },
      { dersKodu: 'FIZ', dersAdi: 'Fizik', soruSayisi: 14, baslangicSoru: 41, bitisSoru: 54, ppiKatsayisi: 2.85, renk: '#0EA5E9', icon: '⚛️' },
      { dersKodu: 'KIM', dersAdi: 'Kimya', soruSayisi: 13, baslangicSoru: 55, bitisSoru: 67, ppiKatsayisi: 3.07, renk: '#EC4899', icon: '🧪' },
      { dersKodu: 'BIY', dersAdi: 'Biyoloji', soruSayisi: 13, baslangicSoru: 68, bitisSoru: 80, ppiKatsayisi: 3.07, renk: '#84CC16', icon: '🧬' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT EŞİT AĞIRLIK
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_EA: {
    kod: 'AYT_EA',
    ad: 'AYT Eşit Ağırlık',
    aciklama: 'Üniversite sınavı ikinci oturum - Eşit ağırlık alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    renk: '#F59E0B',
    icon: '⚖️',
    dersDagilimi: [
      { dersKodu: 'EDEB', dersAdi: 'Türk Dili ve Edebiyatı', soruSayisi: 24, baslangicSoru: 1, bitisSoru: 24, ppiKatsayisi: 3.00, renk: '#6366F1', icon: '✍️' },
      { dersKodu: 'TAR1', dersAdi: 'Tarih-1', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, ppiKatsayisi: 2.80, renk: '#F97316', icon: '📜' },
      { dersKodu: 'COG1', dersAdi: 'Coğrafya-1', soruSayisi: 6, baslangicSoru: 35, bitisSoru: 40, ppiKatsayisi: 3.33, renk: '#10B981', icon: '🗺️' },
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 40, baslangicSoru: 41, bitisSoru: 80, ppiKatsayisi: 3.00, renk: '#EF4444', icon: '📐' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT SÖZEL
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_SOZ: {
    kod: 'AYT_SOZ',
    ad: 'AYT Sözel',
    aciklama: 'Üniversite sınavı ikinci oturum - Sözel alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    renk: '#EC4899',
    icon: '📖',
    dersDagilimi: [
      { dersKodu: 'EDEB', dersAdi: 'Türk Dili ve Edebiyatı', soruSayisi: 24, baslangicSoru: 1, bitisSoru: 24, ppiKatsayisi: 3.00, renk: '#6366F1', icon: '✍️' },
      { dersKodu: 'TAR1', dersAdi: 'Tarih-1', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, ppiKatsayisi: 2.80, renk: '#F97316', icon: '📜' },
      { dersKodu: 'COG1', dersAdi: 'Coğrafya-1', soruSayisi: 6, baslangicSoru: 35, bitisSoru: 40, ppiKatsayisi: 3.33, renk: '#10B981', icon: '🗺️' },
      { dersKodu: 'TAR2', dersAdi: 'Tarih-2', soruSayisi: 11, baslangicSoru: 41, bitisSoru: 51, ppiKatsayisi: 2.90, renk: '#EA580C', icon: '📜' },
      { dersKodu: 'COG2', dersAdi: 'Coğrafya-2', soruSayisi: 11, baslangicSoru: 52, bitisSoru: 62, ppiKatsayisi: 2.90, renk: '#059669', icon: '🗺️' },
      { dersKodu: 'FEL', dersAdi: 'Felsefe Grubu', soruSayisi: 12, baslangicSoru: 63, bitisSoru: 74, ppiKatsayisi: 3.00, renk: '#7C3AED', icon: '💭' },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 6, baslangicSoru: 75, bitisSoru: 80, ppiKatsayisi: 3.33, renk: '#8B5CF6', icon: '🕌' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT DİL (YDT)
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_DIL: {
    kod: 'AYT_DIL',
    ad: 'YDT - Yabancı Dil Testi',
    aciklama: 'Üniversite sınavı - Yabancı dil testi',
    toplamSoru: 80,
    sure: 120,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    renk: '#06B6D4',
    icon: '🌍',
    dersDagilimi: [
      { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 80, baslangicSoru: 1, bitisSoru: 80, ppiKatsayisi: 3.75, renk: '#06B6D4', icon: '🌍' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DENEME - Kurum Denemesi (Özelleştirilebilir)
  // ═══════════════════════════════════════════════════════════════════════════
  DENEME: {
    kod: 'DENEME',
    ad: 'Kurum Denemesi',
    aciklama: 'Özel yapılandırmalı kurum içi deneme sınavı',
    toplamSoru: 0, // Dinamik
    sure: 0,       // Dinamik
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'mezun'],
    renk: '#64748B',
    icon: '📝',
    dersDagilimi: [], // Dinamik - kullanıcı belirler
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // YAZILI - Dönem Sonu Yazılı (Tek Ders)
  // ═══════════════════════════════════════════════════════════════════════════
  YAZILI: {
    kod: 'YAZILI',
    ad: 'Dönem Sonu Yazılı',
    aciklama: 'Tek ders yazılı sınavı',
    toplamSoru: 0, // Dinamik
    sure: 40,
    yanlisKatsayisi: 0, // Yanlış götürmez
    kitapcikTurleri: ['A'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    renk: '#94A3B8',
    icon: '✏️',
    dersDagilimi: [], // Tek ders seçilir
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4-7. SINIF DENEME ŞABLONLARI
// ─────────────────────────────────────────────────────────────────────────────

export const SINIF_DENEME_SABLONLARI: Record<string, DersDagilimi[]> = {
  // 4. Sınıf Deneme (40 Soru)
  '4': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 10, baslangicSoru: 1, bitisSoru: 10 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 10, baslangicSoru: 11, bitisSoru: 20 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 10, baslangicSoru: 21, bitisSoru: 30 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 10, baslangicSoru: 31, bitisSoru: 40 },
  ],
  // 5. Sınıf Deneme (50 Soru)
  '5': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 12, baslangicSoru: 1, bitisSoru: 12 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 12, baslangicSoru: 13, bitisSoru: 24 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 8, baslangicSoru: 35, bitisSoru: 42 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 8, baslangicSoru: 43, bitisSoru: 50 },
  ],
  // 6. Sınıf Deneme (60 Soru)
  '6': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 14, baslangicSoru: 1, bitisSoru: 14 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 14, baslangicSoru: 15, bitisSoru: 28 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 12, baslangicSoru: 29, bitisSoru: 40 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 10, baslangicSoru: 41, bitisSoru: 50 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, baslangicSoru: 51, bitisSoru: 60 },
  ],
  // 7. Sınıf Deneme (70 Soru)
  '7': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 16, baslangicSoru: 1, bitisSoru: 16 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 16, baslangicSoru: 17, bitisSoru: 32 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 14, baslangicSoru: 33, bitisSoru: 46 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 12, baslangicSoru: 47, bitisSoru: 58 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 12, baslangicSoru: 59, bitisSoru: 70 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sınıf seviyesine göre uygun sınav türlerini getir
 */
export function getUygunSinavTurleri(sinifSeviyesi: SinifSeviyesi): SinavKonfigurasyonu[] {
  return Object.values(SINAV_KONFIGURASYONLARI).filter(
    sinav => sinav.uygunSiniflar.includes(sinifSeviyesi)
  );
}

/**
 * Sınav türüne göre varsayılan ders dağılımını getir
 * DENEME için sınıf seviyesine göre şablon döner
 */
export function getDersDagilimi(sinavTuru: SinavTuru, sinifSeviyesi?: SinifSeviyesi): DersDagilimi[] {
  if (sinavTuru === 'DENEME' && sinifSeviyesi) {
    // 4-7. sınıf için hazır şablon
    if (['4', '5', '6', '7'].includes(sinifSeviyesi)) {
      return SINIF_DENEME_SABLONLARI[sinifSeviyesi] || [];
    }
    // 8. sınıf için LGS formatı
    if (sinifSeviyesi === '8') {
      return SINAV_KONFIGURASYONLARI.LGS.dersDagilimi;
    }
    // 9-12 / mezun için TYT formatı
    return SINAV_KONFIGURASYONLARI.TYT.dersDagilimi;
  }
  return SINAV_KONFIGURASYONLARI[sinavTuru]?.dersDagilimi || [];
}

/**
 * Toplam soru sayısını hesapla
 */
export function getToplamSoruSayisi(dersDagilimi: DersDagilimi[]): number {
  return dersDagilimi.reduce((toplam, ders) => toplam + ders.soruSayisi, 0);
}

/**
 * Soru numarasından ders bilgisini getir
 */
export function getSoruDersBilgisi(soruNo: number, dersDagilimi: DersDagilimi[]): DersDagilimi | null {
  return dersDagilimi.find(
    ders => soruNo >= ders.baslangicSoru && soruNo <= ders.bitisSoru
  ) || null;
}

/**
 * Ders sırasını yeniden hesapla (sürükle-bırak sonrası)
 */
export function recalculateDersSirasi(dersler: DersDagilimi[]): DersDagilimi[] {
  let currentSoru = 1;
  return dersler.map(ders => {
    const baslangic = currentSoru;
    const bitis = currentSoru + ders.soruSayisi - 1;
    currentSoru = bitis + 1;
    return { ...ders, baslangicSoru: baslangic, bitisSoru: bitis };
  });
}

