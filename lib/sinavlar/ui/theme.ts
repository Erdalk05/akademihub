/**
 * AkademiHub UI Theme
 * WhatsApp-Green & Slate-Blue Tema
 * 
 * "İlkokul çocuğu bile kullanabilir" sadeliğinde tasarım
 */

// ============================================
// 🎨 RENKLER
// ============================================

export const colors = {
  // Ana Renkler
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#25D366', // WhatsApp Green
    600: '#1FAA52',
    700: '#1B8A44',
    800: '#166E37',
    900: '#0F4D26',
  },
  
  secondary: {
    50: '#ECEFF1',
    100: '#CFD8DC',
    200: '#B0BEC5',
    300: '#90A4AE',
    400: '#78909C',
    500: '#607D8B', // Slate Blue
    600: '#546E7A',
    700: '#455A64',
    800: '#37474F',
    900: '#263238',
  },
  
  // Durum Renkleri
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Arka Plan
  background: {
    light: '#FFFFFF',
    subtle: '#F8FAFC',
    muted: '#F1F5F9',
  },
  
  // Metin
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
  
  // Çakışma Renkleri
  conflict: {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#CA8A04',
    background: '#FEF3C7',
  },
};

// ============================================
// 📏 BOYUTLAR
// ============================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
};

// ============================================
// 🔤 TİPOGRAFİ
// ============================================

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, "Fira Code", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ============================================
// 🎭 GÖLGELER
// ============================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// ============================================
// 🎬 ANİMASYONLAR
// ============================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// ============================================
// 📊 CHART COLORS
// ============================================

export const chartColors = {
  subjects: [
    '#25D366', // Türkçe - Yeşil
    '#3B82F6', // Matematik - Mavi
    '#8B5CF6', // Fen - Mor
    '#F59E0B', // Sosyal - Turuncu
    '#EC4899', // İngilizce - Pembe
    '#14B8A6', // Din Kültürü - Teal
  ],
  
  performance: {
    excellent: '#22C55E',
    good: '#84CC16',
    average: '#F59E0B',
    belowAverage: '#F97316',
    poor: '#EF4444',
  },
  
  gradient: {
    primary: 'linear-gradient(135deg, #25D366 0%, #1FAA52 100%)',
    secondary: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
  },
};

// ============================================
// 🎯 BİLEŞEN STİLLERİ
// ============================================

export const componentStyles = {
  card: {
    base: `
      background: white;
      border-radius: ${borderRadius.xl};
      box-shadow: ${shadows.md};
      padding: ${spacing.lg};
    `,
    hover: `
      transition: all ${animations.duration.normal} ${animations.easing.ease};
      &:hover {
        box-shadow: ${shadows.lg};
        transform: translateY(-2px);
      }
    `,
  },
  
  button: {
    primary: `
      background: ${colors.primary[500]};
      color: white;
      border-radius: ${borderRadius.lg};
      padding: ${spacing.sm} ${spacing.lg};
      font-weight: ${typography.fontWeight.semibold};
      transition: all ${animations.duration.fast} ${animations.easing.ease};
      &:hover {
        background: ${colors.primary[600]};
      }
    `,
    secondary: `
      background: ${colors.secondary[100]};
      color: ${colors.secondary[700]};
      border-radius: ${borderRadius.lg};
      padding: ${spacing.sm} ${spacing.lg};
    `,
  },
  
  input: `
    border: 2px solid ${colors.secondary[200]};
    border-radius: ${borderRadius.lg};
    padding: ${spacing.sm} ${spacing.md};
    font-size: ${typography.fontSize.base};
    transition: border-color ${animations.duration.fast};
    &:focus {
      border-color: ${colors.primary[500]};
      outline: none;
    }
  `,
};

// ============================================
// 📱 RESPONSIVE BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

