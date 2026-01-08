// ============================================================================
// SPECTRA SINAV KONFİGÜRASYONLARI v2.0
// LGS, TYT, AYT, Deneme, Yazılı - MEB/ÖSYM uyumlu
// ============================================================================

import type {
  SinifSeviyesi,
  SinifBilgisi,
  SinavTuru,
  SinavKonfigurasyonu,
  DersKodu,
  DersDagilimi,
  DersBilgisi,
  PuanlamaFormulu,
  IptalSoruMantigi,
  Kademe,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// SINIF BİLGİLERİ
// ─────────────────────────────────────────────────────────────────────────────

export const SINIF_BILGILERI: Record<SinifSeviyesi, SinifBilgisi> = {
  '4': { seviye: '4', ad: '4. Sınıf', kademe: 'ilkokul', varsayilanSoruSayisi: 20, minSoruSayisi: 10, maxSoruSayisi: 40 },
  '5': { seviye: '5', ad: '5. Sınıf', kademe: 'ortaokul', varsayilanSoruSayisi: 40, minSoruSayisi: 20, maxSoruSayisi: 60 },
  '6': { seviye: '6', ad: '6. Sınıf', kademe: 'ortaokul', varsayilanSoruSayisi: 40, minSoruSayisi: 20, maxSoruSayisi: 60 },
  '7': { seviye: '7', ad: '7. Sınıf', kademe: 'ortaokul', varsayilanSoruSayisi: 60, minSoruSayisi: 30, maxSoruSayisi: 80 },
  '8': { seviye: '8', ad: '8. Sınıf', kademe: 'ortaokul', varsayilanSoruSayisi: 90, minSoruSayisi: 60, maxSoruSayisi: 100 },
  '9': { seviye: '9', ad: '9. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 60, minSoruSayisi: 30, maxSoruSayisi: 100 },
  '10': { seviye: '10', ad: '10. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 80, minSoruSayisi: 40, maxSoruSayisi: 120 },
  '11': { seviye: '11', ad: '11. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 100, minSoruSayisi: 60, maxSoruSayisi: 160 },
  '12': { seviye: '12', ad: '12. Sınıf', kademe: 'lise', varsayilanSoruSayisi: 120, minSoruSayisi: 80, maxSoruSayisi: 200 },
  'mezun': { seviye: 'mezun', ad: 'Mezun', kademe: 'mezun', varsayilanSoruSayisi: 120, minSoruSayisi: 80, maxSoruSayisi: 200 },
};

// ─────────────────────────────────────────────────────────────────────────────
// DERS BİLGİLERİ (Kapsamlı)
// ─────────────────────────────────────────────────────────────────────────────

export const DERS_BILGILERI: Record<string, DersBilgisi> = {
  // Ortaokul
  TUR: { kod: 'TUR', ad: 'Türkçe', kisaAd: 'TUR', renk: '#3B82F6', icon: '📖', varsayilanSoruSayisi: 20 },
  MAT: { kod: 'MAT', ad: 'Matematik', kisaAd: 'MAT', renk: '#EF4444', icon: '📐', varsayilanSoruSayisi: 20 },
  FEN: { kod: 'FEN', ad: 'Fen Bilimleri', kisaAd: 'FEN', renk: '#22C55E', icon: '🔬', varsayilanSoruSayisi: 20 },
  SOS: { kod: 'SOS', ad: 'Sosyal Bilgiler', kisaAd: 'SOS', renk: '#F59E0B', icon: '📜', varsayilanSoruSayisi: 10 },
  INK: { kod: 'INK', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', kisaAd: 'İNK', renk: '#F59E0B', icon: '🏛️', varsayilanSoruSayisi: 10 },
  DIN: { kod: 'DIN', ad: 'Din Kültürü ve Ahlak Bilgisi', kisaAd: 'DİN', renk: '#EC4899', icon: '🕌', varsayilanSoruSayisi: 10 },
  ING: { kod: 'ING', ad: 'İngilizce', kisaAd: 'İNG', renk: '#8B5CF6', icon: '🌍', varsayilanSoruSayisi: 10 },
  // TYT
  TYT_TUR: { kod: 'TYT_TUR', ad: 'TYT Türkçe', kisaAd: 'TÜR', renk: '#3B82F6', icon: '📖', varsayilanSoruSayisi: 40 },
  TYT_SOS: { kod: 'TYT_SOS', ad: 'TYT Sosyal Bilimler', kisaAd: 'SOS', renk: '#F59E0B', icon: '📜', varsayilanSoruSayisi: 20 },
  TYT_MAT: { kod: 'TYT_MAT', ad: 'TYT Temel Matematik', kisaAd: 'MAT', renk: '#EF4444', icon: '📐', varsayilanSoruSayisi: 40 },
  TYT_FEN: { kod: 'TYT_FEN', ad: 'TYT Fen Bilimleri', kisaAd: 'FEN', renk: '#22C55E', icon: '🔬', varsayilanSoruSayisi: 20 },
  // AYT Sayısal
  AYT_MAT: { kod: 'AYT_MAT', ad: 'AYT Matematik', kisaAd: 'MAT', renk: '#EF4444', icon: '📐', varsayilanSoruSayisi: 40 },
  AYT_FIZ: { kod: 'AYT_FIZ', ad: 'Fizik', kisaAd: 'FİZ', renk: '#06B6D4', icon: '⚛️', varsayilanSoruSayisi: 14 },
  AYT_KIM: { kod: 'AYT_KIM', ad: 'Kimya', kisaAd: 'KİM', renk: '#10B981', icon: '🧪', varsayilanSoruSayisi: 13 },
  AYT_BIY: { kod: 'AYT_BIY', ad: 'Biyoloji', kisaAd: 'BİY', renk: '#84CC16', icon: '🧬', varsayilanSoruSayisi: 13 },
  // AYT Sözel
  AYT_EDE: { kod: 'AYT_EDE', ad: 'Türk Dili ve Edebiyatı', kisaAd: 'EDE', renk: '#6366F1', icon: '✍️', varsayilanSoruSayisi: 24 },
  AYT_TAR1: { kod: 'AYT_TAR1', ad: 'Tarih-1', kisaAd: 'TAR1', renk: '#D97706', icon: '📜', varsayilanSoruSayisi: 10 },
  AYT_COG1: { kod: 'AYT_COG1', ad: 'Coğrafya-1', kisaAd: 'COĞ1', renk: '#0EA5E9', icon: '🗺️', varsayilanSoruSayisi: 6 },
  AYT_TAR2: { kod: 'AYT_TAR2', ad: 'Tarih-2', kisaAd: 'TAR2', renk: '#EA580C', icon: '📜', varsayilanSoruSayisi: 11 },
  AYT_COG2: { kod: 'AYT_COG2', ad: 'Coğrafya-2', kisaAd: 'COĞ2', renk: '#0284C7', icon: '🗺️', varsayilanSoruSayisi: 11 },
  AYT_FEL: { kod: 'AYT_FEL', ad: 'Felsefe Grubu', kisaAd: 'FEL', renk: '#7C3AED', icon: '💭', varsayilanSoruSayisi: 12 },
  AYT_DIN: { kod: 'AYT_DIN', ad: 'Din Kültürü', kisaAd: 'DİN', renk: '#EC4899', icon: '🕌', varsayilanSoruSayisi: 6 },
  // YDT
  YDT_ING: { kod: 'YDT_ING', ad: 'YDT İngilizce', kisaAd: 'İNG', renk: '#8B5CF6', icon: '🇬🇧', varsayilanSoruSayisi: 80 },
  // Legacy uyumluluk
  EDEB: { kod: 'EDEB', ad: 'Türk Dili ve Edebiyatı', kisaAd: 'EDE', renk: '#6366F1', icon: '✍️', varsayilanSoruSayisi: 24 },
  TAR1: { kod: 'TAR1', ad: 'Tarih-1', kisaAd: 'TAR1', renk: '#D97706', icon: '📜', varsayilanSoruSayisi: 10 },
  TAR2: { kod: 'TAR2', ad: 'Tarih-2', kisaAd: 'TAR2', renk: '#EA580C', icon: '📜', varsayilanSoruSayisi: 11 },
  COG1: { kod: 'COG1', ad: 'Coğrafya-1', kisaAd: 'COĞ1', renk: '#0EA5E9', icon: '🗺️', varsayilanSoruSayisi: 6 },
  COG2: { kod: 'COG2', ad: 'Coğrafya-2', kisaAd: 'COĞ2', renk: '#0284C7', icon: '🗺️', varsayilanSoruSayisi: 11 },
  FIZ: { kod: 'FIZ', ad: 'Fizik', kisaAd: 'FİZ', renk: '#06B6D4', icon: '⚛️', varsayilanSoruSayisi: 14 },
  KIM: { kod: 'KIM', ad: 'Kimya', kisaAd: 'KİM', renk: '#10B981', icon: '🧪', varsayilanSoruSayisi: 13 },
  BIY: { kod: 'BIY', ad: 'Biyoloji', kisaAd: 'BİY', renk: '#84CC16', icon: '🧬', varsayilanSoruSayisi: 13 },
  FEL: { kod: 'FEL', ad: 'Felsefe Grubu', kisaAd: 'FEL', renk: '#7C3AED', icon: '💭', varsayilanSoruSayisi: 12 },
};

// ─────────────────────────────────────────────────────────────────────────────
// DERS RENKLERİ (UI için)
// ─────────────────────────────────────────────────────────────────────────────

export const DERS_RENKLERI: Record<string, { bg: string; text: string; icon: string }> = {
  TUR: { bg: 'bg-blue-500', text: 'text-blue-600', icon: '📖' },
  MAT: { bg: 'bg-red-500', text: 'text-red-600', icon: '📐' },
  FEN: { bg: 'bg-green-500', text: 'text-green-600', icon: '🔬' },
  SOS: { bg: 'bg-amber-500', text: 'text-amber-600', icon: '🏛️' },
  INK: { bg: 'bg-amber-500', text: 'text-amber-600', icon: '🏛️' },
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
  // TYT/AYT prefix
  TYT_TUR: { bg: 'bg-blue-500', text: 'text-blue-600', icon: '📖' },
  TYT_SOS: { bg: 'bg-amber-500', text: 'text-amber-600', icon: '📜' },
  TYT_MAT: { bg: 'bg-red-500', text: 'text-red-600', icon: '📐' },
  TYT_FEN: { bg: 'bg-green-500', text: 'text-green-600', icon: '🔬' },
  AYT_MAT: { bg: 'bg-red-500', text: 'text-red-600', icon: '📐' },
  AYT_FIZ: { bg: 'bg-sky-500', text: 'text-sky-600', icon: '⚛️' },
  AYT_KIM: { bg: 'bg-pink-500', text: 'text-pink-600', icon: '🧪' },
  AYT_BIY: { bg: 'bg-lime-500', text: 'text-lime-600', icon: '🧬' },
  AYT_EDE: { bg: 'bg-indigo-500', text: 'text-indigo-600', icon: '✍️' },
  AYT_TAR1: { bg: 'bg-orange-500', text: 'text-orange-600', icon: '📜' },
  AYT_TAR2: { bg: 'bg-orange-600', text: 'text-orange-700', icon: '📜' },
  AYT_COG1: { bg: 'bg-emerald-500', text: 'text-emerald-600', icon: '🗺️' },
  AYT_COG2: { bg: 'bg-emerald-600', text: 'text-emerald-700', icon: '🗺️' },
  AYT_FEL: { bg: 'bg-violet-500', text: 'text-violet-600', icon: '💭' },
  AYT_DIN: { bg: 'bg-purple-500', text: 'text-purple-600', icon: '🕌' },
  YDT_ING: { bg: 'bg-cyan-500', text: 'text-cyan-600', icon: '🇬🇧' },
};

// ─────────────────────────────────────────────────────────────────────────────
// VARSAYILAN PUANLAMA FORMÜLLERİ
// ─────────────────────────────────────────────────────────────────────────────

export const VARSAYILAN_LGS_PUANLAMA: PuanlamaFormulu = {
  netHesaplama: 'yok',
  yanlisKatsayisi: 0,
  tabanPuan: 100,
  tavanPuan: 500,
  formulTipi: 'lgs',
  dersKatsayilari: [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', katsayi: 4.0 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', katsayi: 4.0 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', katsayi: 4.0 },
    { dersKodu: 'INK', dersAdi: 'T.C. İnkılap Tarihi', katsayi: 4.0 },
    { dersKodu: 'DIN', dersAdi: 'Din Kültürü', katsayi: 4.0 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', katsayi: 4.0 },
  ],
  normalizasyon: 'yok',
  standartSapmaDahil: false,
  isDuzenlenebilir: false,
};

export const VARSAYILAN_LGS_DENEME_PUANLAMA: PuanlamaFormulu = {
  netHesaplama: 'standart_3',
  yanlisKatsayisi: 3,
  tabanPuan: 100,
  tavanPuan: 500,
  formulTipi: 'lgs',
  dersKatsayilari: [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', katsayi: 4.0 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', katsayi: 4.0 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', katsayi: 4.0 },
    { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap Tarihi', katsayi: 4.0 },
    { dersKodu: 'DIN', dersAdi: 'Din Kültürü', katsayi: 4.0 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', katsayi: 4.0 },
  ],
  normalizasyon: 'yok',
  standartSapmaDahil: false,
  isDuzenlenebilir: true,
};

export const VARSAYILAN_TYT_PUANLAMA: PuanlamaFormulu = {
  netHesaplama: 'standart_4',
  yanlisKatsayisi: 4,
  tabanPuan: 0,
  tavanPuan: 500,
  formulTipi: 'tyt',
  dersKatsayilari: [
    { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', katsayi: 1.32 },
    { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', katsayi: 1.36 },
    { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', katsayi: 1.32 },
    { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', katsayi: 1.36 },
  ],
  normalizasyon: 'standart_sapma',
  standartSapmaDahil: true,
  isDuzenlenebilir: false,
};

export const VARSAYILAN_AYT_SAY_PUANLAMA: PuanlamaFormulu = {
  netHesaplama: 'standart_4',
  yanlisKatsayisi: 4,
  tabanPuan: 0,
  tavanPuan: 500,
  formulTipi: 'ayt_say',
  dersKatsayilari: [
    { dersKodu: 'AYT_MAT', dersAdi: 'Matematik', katsayi: 3.00 },
    { dersKodu: 'AYT_FIZ', dersAdi: 'Fizik', katsayi: 2.85 },
    { dersKodu: 'AYT_KIM', dersAdi: 'Kimya', katsayi: 3.07 },
    { dersKodu: 'AYT_BIY', dersAdi: 'Biyoloji', katsayi: 3.07 },
  ],
  normalizasyon: 'standart_sapma',
  standartSapmaDahil: true,
  isDuzenlenebilir: false,
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
    kisaAd: 'LGS',
    aciklama: '8. sınıf öğrencileri için merkezi sınav',
    toplamSoru: 90,
    sure: 120,
    yanlisKatsayisi: 3,
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    uygunSiniflar: ['8'],
    tabanPuan: 100,
    tavanPuan: 500,
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: false,
    iptalSoruMantigi: 'herkese_dogru',
    puanlamaFormulu: VARSAYILAN_LGS_DENEME_PUANLAMA,
    renk: '#10B981',
    icon: '🎓',
    dersDagilimi: [
      { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, baslangicSoru: 1, bitisSoru: 20, sira: 1, renk: '#3B82F6', icon: '📖' },
      { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, baslangicSoru: 21, bitisSoru: 30, sira: 2, renk: '#F59E0B', icon: '🏛️' },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, baslangicSoru: 31, bitisSoru: 40, sira: 3, renk: '#8B5CF6', icon: '🕌' },
      { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, baslangicSoru: 41, bitisSoru: 50, sira: 4, renk: '#06B6D4', icon: '🌍' },
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, baslangicSoru: 51, bitisSoru: 70, sira: 5, renk: '#EF4444', icon: '📐' },
      { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, baslangicSoru: 71, bitisSoru: 90, sira: 6, renk: '#22C55E', icon: '🔬' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYT - Temel Yeterlilik Testi
  // ═══════════════════════════════════════════════════════════════════════════
  TYT: {
    kod: 'TYT',
    ad: 'TYT - Temel Yeterlilik Testi',
    kisaAd: 'TYT',
    aciklama: 'Üniversite sınavı birinci oturum',
    toplamSoru: 120,
    sure: 165,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: false,
    iptalSoruMantigi: 'herkese_dogru',
    puanlamaFormulu: VARSAYILAN_TYT_PUANLAMA,
    renk: '#3B82F6',
    icon: '📚',
    dersDagilimi: [
      { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', soruSayisi: 40, baslangicSoru: 1, bitisSoru: 40, sira: 1, ppiKatsayisi: 1.32, renk: '#3B82F6', icon: '📖' },
      { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', soruSayisi: 20, baslangicSoru: 41, bitisSoru: 60, sira: 2, ppiKatsayisi: 1.36, renk: '#F59E0B', icon: '🏛️' },
      { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', soruSayisi: 40, baslangicSoru: 61, bitisSoru: 100, sira: 3, ppiKatsayisi: 1.32, renk: '#EF4444', icon: '📐' },
      { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, baslangicSoru: 101, bitisSoru: 120, sira: 4, ppiKatsayisi: 1.36, renk: '#22C55E', icon: '🔬' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT SAYISAL
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_SAY: {
    kod: 'AYT_SAY',
    ad: 'AYT Sayısal',
    kisaAd: 'SAY',
    aciklama: 'Üniversite sınavı ikinci oturum - Sayısal alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: false,
    iptalSoruMantigi: 'herkese_dogru',
    puanlamaFormulu: VARSAYILAN_AYT_SAY_PUANLAMA,
    renk: '#8B5CF6',
    icon: '🔬',
    dersDagilimi: [
      { dersKodu: 'AYT_MAT', dersAdi: 'Matematik', soruSayisi: 40, baslangicSoru: 1, bitisSoru: 40, sira: 1, ppiKatsayisi: 3.00, renk: '#EF4444', icon: '📐' },
      { dersKodu: 'AYT_FIZ', dersAdi: 'Fizik', soruSayisi: 14, baslangicSoru: 41, bitisSoru: 54, sira: 2, ppiKatsayisi: 2.85, renk: '#0EA5E9', icon: '⚛️' },
      { dersKodu: 'AYT_KIM', dersAdi: 'Kimya', soruSayisi: 13, baslangicSoru: 55, bitisSoru: 67, sira: 3, ppiKatsayisi: 3.07, renk: '#EC4899', icon: '🧪' },
      { dersKodu: 'AYT_BIY', dersAdi: 'Biyoloji', soruSayisi: 13, baslangicSoru: 68, bitisSoru: 80, sira: 4, ppiKatsayisi: 3.07, renk: '#84CC16', icon: '🧬' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT EŞİT AĞIRLIK
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_EA: {
    kod: 'AYT_EA',
    ad: 'AYT Eşit Ağırlık',
    kisaAd: 'EA',
    aciklama: 'Üniversite sınavı ikinci oturum - Eşit ağırlık alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    kaynakTuru: 'KURUM',
    isResmi: false,
    iptalSoruMantigi: 'herkese_dogru',
    renk: '#F59E0B',
    icon: '⚖️',
    dersDagilimi: [
      { dersKodu: 'EDEB', dersAdi: 'Türk Dili ve Edebiyatı', soruSayisi: 24, baslangicSoru: 1, bitisSoru: 24, sira: 1, ppiKatsayisi: 3.00, renk: '#6366F1', icon: '✍️' },
      { dersKodu: 'TAR1', dersAdi: 'Tarih-1', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, sira: 2, ppiKatsayisi: 2.80, renk: '#F97316', icon: '📜' },
      { dersKodu: 'COG1', dersAdi: 'Coğrafya-1', soruSayisi: 6, baslangicSoru: 35, bitisSoru: 40, sira: 3, ppiKatsayisi: 3.33, renk: '#10B981', icon: '🗺️' },
      { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 40, baslangicSoru: 41, bitisSoru: 80, sira: 4, ppiKatsayisi: 3.00, renk: '#EF4444', icon: '📐' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT SÖZEL
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_SOZ: {
    kod: 'AYT_SOZ',
    ad: 'AYT Sözel',
    kisaAd: 'SÖZ',
    aciklama: 'Üniversite sınavı ikinci oturum - Sözel alan',
    toplamSoru: 80,
    sure: 180,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    kaynakTuru: 'KURUM',
    isResmi: false,
    iptalSoruMantigi: 'herkese_dogru',
    renk: '#EC4899',
    icon: '📖',
    dersDagilimi: [
      { dersKodu: 'EDEB', dersAdi: 'Türk Dili ve Edebiyatı', soruSayisi: 24, baslangicSoru: 1, bitisSoru: 24, sira: 1, ppiKatsayisi: 3.00, renk: '#6366F1', icon: '✍️' },
      { dersKodu: 'TAR1', dersAdi: 'Tarih-1', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, sira: 2, ppiKatsayisi: 2.80, renk: '#F97316', icon: '📜' },
      { dersKodu: 'COG1', dersAdi: 'Coğrafya-1', soruSayisi: 6, baslangicSoru: 35, bitisSoru: 40, sira: 3, ppiKatsayisi: 3.33, renk: '#10B981', icon: '🗺️' },
      { dersKodu: 'TAR2', dersAdi: 'Tarih-2', soruSayisi: 11, baslangicSoru: 41, bitisSoru: 51, sira: 4, ppiKatsayisi: 2.90, renk: '#EA580C', icon: '📜' },
      { dersKodu: 'COG2', dersAdi: 'Coğrafya-2', soruSayisi: 11, baslangicSoru: 52, bitisSoru: 62, sira: 5, ppiKatsayisi: 2.90, renk: '#059669', icon: '🗺️' },
      { dersKodu: 'FEL', dersAdi: 'Felsefe Grubu', soruSayisi: 12, baslangicSoru: 63, bitisSoru: 74, sira: 6, ppiKatsayisi: 3.00, renk: '#7C3AED', icon: '💭' },
      { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 6, baslangicSoru: 75, bitisSoru: 80, sira: 7, ppiKatsayisi: 3.33, renk: '#8B5CF6', icon: '🕌' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AYT DİL (YDT)
  // ═══════════════════════════════════════════════════════════════════════════
  AYT_DIL: {
    kod: 'AYT_DIL',
    ad: 'YDT - Yabancı Dil Testi',
    kisaAd: 'YDT',
    aciklama: 'Üniversite sınavı - Yabancı dil testi',
    toplamSoru: 80,
    sure: 120,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B'],
    uygunSiniflar: ['11', '12', 'mezun'],
    tabanPuan: 0,
    tavanPuan: 500,
    kaynakTuru: 'KURUM',
    isResmi: false,
    iptalSoruMantigi: 'herkese_dogru',
    renk: '#06B6D4',
    icon: '🌍',
    dersDagilimi: [
      { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 80, baslangicSoru: 1, bitisSoru: 80, sira: 1, ppiKatsayisi: 3.75, renk: '#06B6D4', icon: '🌍' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DENEME - Kurum Denemesi (Özelleştirilebilir)
  // ═══════════════════════════════════════════════════════════════════════════
  DENEME: {
    kod: 'DENEME',
    ad: 'Kurum Denemesi',
    kisaAd: 'DNM',
    aciklama: 'Özel yapılandırmalı kurum içi deneme sınavı',
    toplamSoru: 0,
    sure: 0,
    yanlisKatsayisi: 4,
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'mezun'],
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: false,
    iptalSoruMantigi: 'herkese_dogru',
    renk: '#64748B',
    icon: '📝',
    dersDagilimi: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // YAZILI - Dönem Sonu Yazılı (Tek Ders)
  // ═══════════════════════════════════════════════════════════════════════════
  YAZILI: {
    kod: 'YAZILI',
    ad: 'Dönem Sonu Yazılı',
    kisaAd: 'YZL',
    aciklama: 'Tek ders yazılı sınavı',
    toplamSoru: 0,
    sure: 40,
    yanlisKatsayisi: 0,
    kitapcikTurleri: ['A'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: false,
    iptalSoruMantigi: 'gecersiz_say',
    renk: '#94A3B8',
    icon: '✏️',
    dersDagilimi: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KONU TEST - Konu Tarama Testi
  // ═══════════════════════════════════════════════════════════════════════════
  KONU_TEST: {
    kod: 'KONU_TEST',
    ad: 'Konu Tarama Testi',
    kisaAd: 'KNT',
    aciklama: 'Tek konu bazlı tarama testi',
    toplamSoru: 0,
    sure: 30,
    yanlisKatsayisi: 0,
    kitapcikTurleri: ['A'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'mezun'],
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: true,
    iptalSoruMantigi: 'gecersiz_say',
    renk: '#0EA5E9',
    icon: '🎯',
    dersDagilimi: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KAZANIM TEST - Kazanım Değerlendirme Testi
  // ═══════════════════════════════════════════════════════════════════════════
  KAZANIM_TEST: {
    kod: 'KAZANIM_TEST',
    ad: 'Kazanım Değerlendirme Testi',
    kisaAd: 'KZT',
    aciklama: 'Kazanım bazlı değerlendirme testi',
    toplamSoru: 0,
    sure: 45,
    yanlisKatsayisi: 0,
    kitapcikTurleri: ['A'],
    uygunSiniflar: ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'mezun'],
    kaynakTuru: 'KURUM',
    isResmi: false,
    kilitliAlanlar: [],
    kazanimZorunlu: true,
    iptalSoruMantigi: 'gecersiz_say',
    renk: '#22C55E',
    icon: '📊',
    dersDagilimi: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4-7. SINIF DENEME ŞABLONLARI
// ─────────────────────────────────────────────────────────────────────────────

export const SINIF_DENEME_SABLONLARI: Record<string, DersDagilimi[]> = {
  '4': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 10, baslangicSoru: 1, bitisSoru: 10, sira: 1 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 10, baslangicSoru: 11, bitisSoru: 20, sira: 2 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 10, baslangicSoru: 21, bitisSoru: 30, sira: 3 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 10, baslangicSoru: 31, bitisSoru: 40, sira: 4 },
  ],
  '5': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 12, baslangicSoru: 1, bitisSoru: 12, sira: 1 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 12, baslangicSoru: 13, bitisSoru: 24, sira: 2 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 10, baslangicSoru: 25, bitisSoru: 34, sira: 3 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 8, baslangicSoru: 35, bitisSoru: 42, sira: 4 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 8, baslangicSoru: 43, bitisSoru: 50, sira: 5 },
  ],
  '6': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 14, baslangicSoru: 1, bitisSoru: 14, sira: 1 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 14, baslangicSoru: 15, bitisSoru: 28, sira: 2 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 12, baslangicSoru: 29, bitisSoru: 40, sira: 3 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 10, baslangicSoru: 41, bitisSoru: 50, sira: 4 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, baslangicSoru: 51, bitisSoru: 60, sira: 5 },
  ],
  '7': [
    { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 16, baslangicSoru: 1, bitisSoru: 16, sira: 1 },
    { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 16, baslangicSoru: 17, bitisSoru: 32, sira: 2 },
    { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 14, baslangicSoru: 33, bitisSoru: 46, sira: 3 },
    { dersKodu: 'SOS', dersAdi: 'Sosyal Bilgiler', soruSayisi: 12, baslangicSoru: 47, bitisSoru: 58, sira: 4 },
    { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 12, baslangicSoru: 59, bitisSoru: 70, sira: 5 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────────────────────────────────

export function getUygunSinavTurleri(sinifSeviyesi: SinifSeviyesi): SinavKonfigurasyonu[] {
  return Object.values(SINAV_KONFIGURASYONLARI).filter(
    sinav => sinav.uygunSiniflar.includes(sinifSeviyesi)
  );
}

export function getDersDagilimi(sinavTuru: SinavTuru, sinifSeviyesi?: SinifSeviyesi): DersDagilimi[] {
  if (sinavTuru === 'DENEME' && sinifSeviyesi) {
    if (['4', '5', '6', '7'].includes(sinifSeviyesi)) {
      return SINIF_DENEME_SABLONLARI[sinifSeviyesi] || [];
    }
    if (sinifSeviyesi === '8') {
      return SINAV_KONFIGURASYONLARI.LGS.dersDagilimi;
    }
    return SINAV_KONFIGURASYONLARI.TYT.dersDagilimi;
  }
  return SINAV_KONFIGURASYONLARI[sinavTuru]?.dersDagilimi || [];
}

export function getToplamSoruSayisi(dersDagilimi: DersDagilimi[]): number {
  return dersDagilimi.reduce((toplam, ders) => toplam + ders.soruSayisi, 0);
}

export function getSoruDersBilgisi(soruNo: number, dersDagilimi: DersDagilimi[]): DersDagilimi | null {
  return dersDagilimi.find(
    ders => soruNo >= ders.baslangicSoru && soruNo <= ders.bitisSoru
  ) || null;
}

export function recalculateDersSirasi(dersler: DersDagilimi[]): DersDagilimi[] {
  let currentSoru = 1;
  return dersler.map((ders, index) => {
    const baslangic = currentSoru;
    const bitis = currentSoru + ders.soruSayisi - 1;
    currentSoru = bitis + 1;
    return { ...ders, baslangicSoru: baslangic, bitisSoru: bitis, sira: index + 1 };
  });
}

export function getDersBilgisi(dersKodu: string): DersBilgisi | null {
  return DERS_BILGILERI[dersKodu] || null;
}

export function getDersRenk(dersKodu: string): { bg: string; text: string; icon: string } {
  return DERS_RENKLERI[dersKodu] || { bg: 'bg-gray-500', text: 'text-gray-600', icon: '📚' };
}
