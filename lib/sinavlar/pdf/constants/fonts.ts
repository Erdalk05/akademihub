/**
 * ============================================
 * AkademiHub - PDF Font Configuration
 * ============================================
 * 
 * PHASE 4 - Türkçe Karakter Destekli Font Ayarları
 * 
 * FONT SEÇİMİ:
 * - Inter: Modern, okunabilir, geniş Unicode desteği
 * - Roboto: Google tarafından, mükemmel Latin-5 (Türkçe)
 * - Source Code Pro: Sayılar ve tablolar için
 * 
 * ÖNEMLİ:
 * - Tüm fontlar Türkçe karakterleri desteklemelidir (ş, ğ, ı, ö, ü, ç, İ)
 * - PDF/A uyumluluğu için font embedding gerekli
 */

import type { Typography, Spacing } from '../types';

// ==================== FONT AİLELERİ ====================

/**
 * Font aileleri
 */
export const FONT_FAMILIES = {
  // Ana başlık fontu
  heading: 'Inter',
  
  // Metin fontu
  body: 'Inter',
  
  // Sayı ve tablo fontu
  mono: 'Roboto Mono',
  
  // Fallback
  fallback: 'Helvetica, Arial, sans-serif'
};

/**
 * Font URL'leri (Google Fonts CDN)
 * react-pdf için registerFont ile kullanılır
 */
export const FONT_SOURCES = {
  Inter: {
    family: 'Inter',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
        fontWeight: 400,
        fontStyle: 'normal'
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
        fontWeight: 500,
        fontStyle: 'normal'
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
        fontWeight: 600,
        fontStyle: 'normal'
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
        fontWeight: 700,
        fontStyle: 'normal'
      }
    ]
  },
  
  Roboto: {
    family: 'Roboto',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
        fontWeight: 400,
        fontStyle: 'normal'
      },
      {
        src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
        fontWeight: 500,
        fontStyle: 'normal'
      },
      {
        src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
        fontWeight: 700,
        fontStyle: 'normal'
      }
    ]
  }
};

// ==================== TİPOGRAFİ SİSTEMİ ====================

/**
 * Tipografi ayarları
 */
export const TYPOGRAPHY: Typography = {
  fontFamily: {
    heading: FONT_FAMILIES.heading,
    body: FONT_FAMILIES.body,
    mono: FONT_FAMILIES.mono
  },
  
  fontSize: {
    xs: 8,       // Dipnot, küçük etiketler
    sm: 10,      // Tablo içeriği, ikincil metin
    base: 11,    // Ana metin
    lg: 12,      // Vurgulu metin
    xl: 14,      // Alt başlıklar
    '2xl': 16,   // Bölüm başlıkları
    '3xl': 20    // Ana başlık
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  lineHeight: {
    tight: 1.2,   // Başlıklar
    normal: 1.5,  // Normal metin
    relaxed: 1.75 // Uzun paragraflar
  }
};

// ==================== BOŞLUK SİSTEMİ ====================

/**
 * Boşluk değerleri (pt cinsinden)
 */
export const SPACING: Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32
};

// ==================== SAYFA BOYUTLARI ====================

/**
 * A4 sayfa boyutu (pt cinsinden)
 */
export const PAGE_SIZES = {
  A4: {
    width: 595.28,
    height: 841.89
  },
  LETTER: {
    width: 612,
    height: 792
  }
};

/**
 * Sayfa kenar boşlukları
 */
export const PAGE_MARGINS = {
  // Normal (varsayılan)
  normal: {
    top: 40,
    right: 40,
    bottom: 50,
    left: 40
  },
  
  // Dar (daha fazla içerik)
  narrow: {
    top: 30,
    right: 30,
    bottom: 40,
    left: 30
  },
  
  // Geniş (daha profesyonel)
  wide: {
    top: 50,
    right: 50,
    bottom: 60,
    left: 50
  }
};

// ==================== TABLO STİLLERİ ====================

/**
 * Tablo stilleri
 */
export const TABLE_STYLES = {
  // Hücre yükseklikleri
  headerHeight: 28,
  rowHeight: 24,
  
  // Hücre padding
  cellPadding: {
    vertical: 4,
    horizontal: 6
  },
  
  // Border
  borderWidth: 0.5,
  borderRadius: 2
};

// ==================== CHART BOYUTLARI ====================

/**
 * Grafik boyutları
 */
export const CHART_DIMENSIONS = {
  // Bar chart
  barChart: {
    width: 240,
    height: 160,
    barWidth: 24,
    barGap: 8
  },
  
  // Radar chart
  radarChart: {
    width: 180,
    height: 180,
    radius: 70
  },
  
  // Line chart (trend)
  lineChart: {
    width: 280,
    height: 120,
    pointRadius: 4
  },
  
  // Mini sparkline
  sparkline: {
    width: 80,
    height: 24
  }
};

// ==================== KÖŞELİK VE ÇERÇEVE ====================

/**
 * Border radius değerleri
 */
export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  full: 9999
};

/**
 * Border genişlikleri
 */
export const BORDER_WIDTH = {
  thin: 0.5,
  normal: 1,
  thick: 2
};

// ==================== Z-INDEX (React-PDF için kullanılmaz ama referans) ====================

export const Z_INDEX = {
  watermark: 0,
  content: 1,
  header: 2,
  footer: 2
};

// ==================== PDF METAVERİ ====================

/**
 * Varsayılan PDF metadata
 */
export const DEFAULT_PDF_METADATA = {
  author: 'AkademiHub',
  creator: 'AkademiHub Analiz Sistemi',
  producer: 'AkademiHub PDF Engine v1.0',
  keywords: ['sınav', 'analiz', 'karne', 'LGS', 'TYT', 'AYT']
};

// ==================== WATERMARK ====================

/**
 * Watermark ayarları
 */
export const WATERMARK_CONFIG = {
  text: 'AkademiHub Analiz Sistemi',
  opacity: 0.04,
  fontSize: 48,
  rotation: -30, // derece
  color: '#6B7280'
};

// ==================== EXPORT ====================

export default {
  FONT_FAMILIES,
  FONT_SOURCES,
  TYPOGRAPHY,
  SPACING,
  PAGE_SIZES,
  PAGE_MARGINS,
  TABLE_STYLES,
  CHART_DIMENSIONS,
  BORDER_RADIUS,
  BORDER_WIDTH,
  Z_INDEX,
  DEFAULT_PDF_METADATA,
  WATERMARK_CONFIG
};

