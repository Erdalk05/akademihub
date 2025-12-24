/**
 * ============================================
 * AkademiHub - PDF Color Constants
 * ============================================
 * 
 * PHASE 4 - Pedagojik Renk Paleti
 * 
 * TASARIM İLKELERİ:
 * - Baskı dostu renkler (CMYK uyumlu)
 * - Eğitim odaklı, motivasyonel
 * - Agresif kırmızı YOK (öğrenci stresini artırır)
 * - Renk körlüğü dostu kontrastlar
 */

import type { ColorPalette } from '../types';

// ==================== ANA PALET ====================

/**
 * AkademiHub Ana Renk Paleti
 * Print-friendly ve pedagojik açıdan optimize edilmiş
 */
export const COLORS: ColorPalette = {
  // Ana renkler
  primary: '#1E40AF',      // Koyu mavi - güven ve profesyonellik
  secondary: '#6366F1',    // İndigo - modern ve dinamik
  
  // Durum renkleri (Pedagojik)
  success: '#059669',      // Zümrüt yeşil - başarı (agresif değil)
  warning: '#D97706',      // Amber - dikkat (altın sarısı)
  danger: '#DC2626',       // Kırmızı - sadece kritik durumlar
  info: '#0284C7',         // Gökyüzü mavi - bilgi
  
  // Metin renkleri
  text: {
    primary: '#111827',    // Neredeyse siyah - ana metin
    secondary: '#4B5563',  // Koyu gri - ikincil metin
    muted: '#9CA3AF',      // Açık gri - deaktif/placeholder
    inverse: '#FFFFFF'     // Beyaz - koyu arka plan üzerinde
  },
  
  // Arka plan renkleri
  background: {
    primary: '#FFFFFF',    // Beyaz - ana arka plan
    secondary: '#F9FAFB',  // Açık gri - bölüm arka planları
    accent: '#EEF2FF'      // Çok açık indigo - vurgulama
  },
  
  // Çerçeve rengi
  border: '#E5E7EB'        // Gri - çerçeveler ve ayırıcılar
};

// ==================== BAŞARI SEVİYESİ RENKLERİ ====================

/**
 * Başarı oranına göre renk seçimi
 * Pedagojik açıdan optimize edilmiş
 */
export const SUCCESS_COLORS = {
  // Mükemmel: %80+
  excellent: {
    bg: '#ECFDF5',         // Çok açık yeşil
    text: '#047857',       // Koyu yeşil
    accent: '#10B981',     // Orta yeşil
    label: 'Mükemmel'
  },
  
  // İyi: %60-80
  good: {
    bg: '#F0FDF4',         // Açık yeşil
    text: '#15803D',       // Yeşil
    accent: '#22C55E',     // Canlı yeşil
    label: 'İyi'
  },
  
  // Orta: %40-60
  average: {
    bg: '#FFFBEB',         // Açık amber
    text: '#B45309',       // Koyu amber
    accent: '#F59E0B',     // Amber
    label: 'Geliştirilmeli'
  },
  
  // Zayıf: %20-40
  weak: {
    bg: '#FFF7ED',         // Açık turuncu
    text: '#C2410C',       // Koyu turuncu
    accent: '#F97316',     // Turuncu
    label: 'Zayıf'
  },
  
  // Kritik: <%20
  critical: {
    bg: '#FEF2F2',         // Çok açık kırmızı
    text: '#B91C1C',       // Koyu kırmızı (yumuşatılmış)
    accent: '#EF4444',     // Kırmızı (yumuşatılmış)
    label: 'Acil Destek'
  }
};

/**
 * Başarı oranına göre renk döndürür
 * @param rate - Başarı oranı (0-1)
 */
export function getSuccessColor(rate: number): typeof SUCCESS_COLORS.excellent {
  if (rate >= 0.8) return SUCCESS_COLORS.excellent;
  if (rate >= 0.6) return SUCCESS_COLORS.good;
  if (rate >= 0.4) return SUCCESS_COLORS.average;
  if (rate >= 0.2) return SUCCESS_COLORS.weak;
  return SUCCESS_COLORS.critical;
}

// ==================== RİSK SEVİYESİ RENKLERİ ====================

/**
 * Risk seviyesi renkleri
 * Veli bilgilendirmesi için optimize edilmiş
 */
export const RISK_COLORS = {
  low: {
    bg: '#F0FDF4',
    text: '#166534',
    accent: '#22C55E',
    icon: '✓',
    label: 'Düşük Risk'
  },
  
  medium: {
    bg: '#FFFBEB',
    text: '#92400E',
    accent: '#F59E0B',
    icon: '!',
    label: 'Orta Risk'
  },
  
  high: {
    bg: '#FFF7ED',
    text: '#9A3412',
    accent: '#F97316',
    icon: '!!',
    label: 'Yüksek Risk'
  },
  
  critical: {
    bg: '#FEF2F2',
    text: '#991B1B',
    accent: '#EF4444',
    icon: '⚠',
    label: 'Kritik Risk'
  }
};

/**
 * Risk seviyesine göre renk döndürür
 */
export function getRiskColor(level: string | null): typeof RISK_COLORS.low {
  if (!level) return RISK_COLORS.low;
  return RISK_COLORS[level as keyof typeof RISK_COLORS] ?? RISK_COLORS.low;
}

// ==================== TREND RENKLERİ ====================

/**
 * Trend yönü renkleri
 */
export const TREND_COLORS = {
  up: {
    bg: '#ECFDF5',
    text: '#047857',
    accent: '#10B981',
    icon: '↑',
    label: 'Yükseliyor'
  },
  
  down: {
    bg: '#FEF2F2',
    text: '#991B1B',
    accent: '#EF4444',
    icon: '↓',
    label: 'Düşüyor'
  },
  
  stable: {
    bg: '#F3F4F6',
    text: '#374151',
    accent: '#6B7280',
    icon: '→',
    label: 'Stabil'
  }
};

/**
 * Trend yönüne göre renk döndürür
 */
export function getTrendColor(direction: string | null): typeof TREND_COLORS.stable {
  if (!direction) return TREND_COLORS.stable;
  return TREND_COLORS[direction as keyof typeof TREND_COLORS] ?? TREND_COLORS.stable;
}

// ==================== DERS RENKLERİ ====================

/**
 * Ders bazlı renkler (grafiklerde kullanılır)
 */
export const SUBJECT_COLORS: Record<string, string> = {
  TUR: '#3B82F6',   // Mavi - Türkçe
  MAT: '#10B981',   // Yeşil - Matematik
  FEN: '#8B5CF6',   // Mor - Fen Bilimleri
  SOS: '#F59E0B',   // Amber - Sosyal Bilimler
  INK: '#EF4444',   // Kırmızı - İnkılap Tarihi
  DIN: '#6366F1',   // İndigo - Din Kültürü
  ING: '#EC4899',   // Pembe - İngilizce
  
  // TYT/AYT için ek renkler
  COG: '#14B8A6',   // Teal - Coğrafya
  TAR: '#F97316',   // Turuncu - Tarih
  FEL: '#A855F7',   // Violet - Felsefe
  FIZ: '#0EA5E9',   // Sky - Fizik
  KIM: '#84CC16',   // Lime - Kimya
  BIY: '#22D3EE'    // Cyan - Biyoloji
};

/**
 * Ders koduna göre renk döndürür
 */
export function getSubjectColor(code: string): string {
  return SUBJECT_COLORS[code.toUpperCase()] ?? COLORS.primary;
}

// ==================== CHART RENKLERİ ====================

/**
 * Grafik renk paleti
 */
export const CHART_COLORS = {
  // Bar chart
  bar: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    background: '#DBEAFE'
  },
  
  // Line chart
  line: {
    primary: '#10B981',
    secondary: '#6EE7B7',
    area: 'rgba(16, 185, 129, 0.1)'
  },
  
  // Radar chart
  radar: {
    fill: 'rgba(99, 102, 241, 0.2)',
    stroke: '#6366F1',
    grid: '#E5E7EB'
  },
  
  // Grid ve axis
  grid: '#F3F4F6',
  axis: '#9CA3AF',
  label: '#6B7280'
};

// ==================== GÖLGE VE EFEKTLER ====================

/**
 * Kutu gölgeleri (CSS box-shadow formatı)
 */
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};

// ==================== OPACITY ====================

/**
 * Opacity değerleri
 */
export const OPACITY = {
  disabled: 0.5,
  hover: 0.8,
  watermark: 0.05,
  overlay: 0.7
};

// ==================== EXPORT ====================

export default {
  COLORS,
  SUCCESS_COLORS,
  RISK_COLORS,
  TREND_COLORS,
  SUBJECT_COLORS,
  CHART_COLORS,
  SHADOWS,
  OPACITY,
  getSuccessColor,
  getRiskColor,
  getTrendColor,
  getSubjectColor
};

