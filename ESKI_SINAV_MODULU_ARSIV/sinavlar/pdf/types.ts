/**
 * ============================================
 * AkademiHub - PDF Report Engine Types
 * ============================================
 * 
 * PHASE 4 - PDF Karne Sistemi
 * 
 * Bu dosya:
 * - PDF üretimi için tüm tip tanımlarını içerir
 * - StudentAnalyticsOutput'u tek veri kaynağı olarak kullanır
 * - Stil ve görsel konfigürasyonları tanımlar
 * 
 * KURALLAR:
 * - PDF katmanı HESAPLAMA YAPMAZ
 * - Sadece render işlemi yapar
 * - Analytics çıktısını olduğu gibi kullanır
 */

import type { StudentAnalyticsOutput } from '../analytics/orchestrator/types';

// ==================== REPORT TYPES ====================

export type ReportType = 'student' | 'parent' | 'teacher';
export type ReportLanguage = 'tr' | 'en';

// ==================== PDF INPUT ====================

/**
 * PDF üretimi için ana girdi
 */
export interface PDFGeneratorInput {
  // Veri kaynağı (TEK KAYNAK)
  analytics: StudentAnalyticsOutput;
  
  // Rapor tipi
  reportType: ReportType;
  
  // Opsiyonel ayarlar
  options?: PDFOptions;
  
  // Ek bilgiler (opsiyonel)
  schoolInfo?: SchoolInfo;
  examInfo?: ExamInfo;
}

/**
 * PDF üretim ayarları
 */
export interface PDFOptions {
  // Dil
  language?: ReportLanguage;
  
  // Sayfa boyutu
  pageSize?: 'A4' | 'LETTER';
  
  // Yönlendirme
  orientation?: 'portrait' | 'landscape';
  
  // Watermark göster
  showWatermark?: boolean;
  
  // QR kod göster
  showQRCode?: boolean;
  
  // Grafik göster
  showCharts?: boolean;
  
  // Detay seviyesi
  detailLevel?: 'summary' | 'detailed' | 'full';
  
  // Renk modu (baskı için)
  colorMode?: 'color' | 'grayscale';
  
  // Logo URL
  logoUrl?: string;
}

export const DEFAULT_PDF_OPTIONS: PDFOptions = {
  language: 'tr',
  pageSize: 'A4',
  orientation: 'portrait',
  showWatermark: true,
  showQRCode: true,
  showCharts: true,
  detailLevel: 'detailed',
  colorMode: 'color'
};

// ==================== SCHOOL & EXAM INFO ====================

export interface SchoolInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export interface ExamInfo {
  name: string;
  date: string;
  type: string;
  totalStudents?: number;
  classSize?: number;
}

// ==================== STYLE TYPES ====================

/**
 * Renk paleti
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  background: {
    primary: string;
    secondary: string;
    accent: string;
  };
  border: string;
}

/**
 * Tipografi ayarları
 */
export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Boşluk ayarları
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

/**
 * Sayfa stil ayarları
 */
export interface PageStyles {
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// ==================== SECTION PROPS ====================

/**
 * Header bileşeni props
 */
export interface HeaderProps {
  studentName: string;
  studentNo?: string;
  className?: string;
  examName: string;
  examDate: string;
  schoolInfo?: SchoolInfo;
  logoUrl?: string;
}

/**
 * Performance charts props
 */
export interface PerformanceChartsProps {
  // Ders bazlı performans
  subjectPerformance: Record<string, {
    code: string;
    name?: string;
    net: number;
    correct: number;
    wrong: number;
    empty: number;
    rate: number;
    class_avg?: number;
  }>;
  
  // Trend verileri
  trends: {
    direction: 'up' | 'down' | 'stable' | null;
    net_trend: number[] | null;
    velocity?: number;
    consistency?: number;
    trend_score?: number;
    explanation?: string;
  };
  
  // Genel net
  totalNet: number;
  
  // Sınıf ortalaması
  classAvg?: number | null;
}

/**
 * Topic breakdown props
 */
export interface TopicBreakdownProps {
  topicPerformance: Record<string, {
    id: string;
    name: string;
    subject_code?: string;
    correct: number;
    total: number;
    rate: number;
    status: string;
  }>;
  
  strengths: string[];
  weaknesses: string[];
  improvementPriorities: string[];
}

/**
 * Risk assessment props
 */
export interface RiskAssessmentProps {
  level: 'low' | 'medium' | 'high' | 'critical' | null;
  score: number | null;
  factors: Array<{
    factor?: string;
    factor_name?: string;
    explanation?: string;
    severity?: string;
  }> | string[];
  primaryConcern: string | null;
  summary?: string;
  actionRequired: boolean;
}

/**
 * Footer props
 */
export interface FooterProps {
  pageNumber: number;
  totalPages: number;
  generatedAt: string;
  version: string;
  showQRCode?: boolean;
  qrData?: string;
}

// ==================== CHART DATA ====================

/**
 * Bar chart veri noktası
 */
export interface BarChartDataPoint {
  label: string;
  value: number;
  color: string;
  maxValue?: number;
}

/**
 * Radar chart veri noktası
 */
export interface RadarChartDataPoint {
  label: string;
  value: number;
  maxValue: number;
}

/**
 * Line chart veri noktası
 */
export interface LineChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

/**
 * Chart render sonucu
 */
export interface ChartRenderResult {
  svg: string;
  base64?: string;
  width: number;
  height: number;
}

// ==================== PDF OUTPUT ====================

/**
 * PDF üretim sonucu
 */
export interface PDFGeneratorResult {
  success: boolean;
  buffer?: Buffer;
  blob?: Blob;
  filename: string;
  metadata: PDFMetadata;
  error?: string;
  generatedAt: string;
  durationMs: number;
}

/**
 * PDF metadata
 */
export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate: Date;
}

// ==================== PLACEHOLDER STATES ====================

/**
 * Veri durumu
 */
export type DataStatus = 'ready' | 'gathering' | 'insufficient' | 'error';

/**
 * Placeholder mesajları
 */
export interface PlaceholderMessages {
  gathering: string;
  insufficient: string;
  error: string;
  noData: string;
}

export const DEFAULT_PLACEHOLDER_MESSAGES: PlaceholderMessages = {
  gathering: 'Veri toplanıyor...',
  insufficient: 'Yeterli veri yok',
  error: 'Veri yüklenemedi',
  noData: 'Henüz veri bulunmuyor'
};

// ==================== TRANSLATION TYPES ====================

/**
 * Çeviri anahtarları
 */
export interface TranslationKeys {
  // Başlıklar
  reportTitle: string;
  studentReport: string;
  parentReport: string;
  teacherReport: string;
  
  // Bölümler
  summary: string;
  performance: string;
  subjects: string;
  topics: string;
  trends: string;
  risk: string;
  recommendations: string;
  
  // Tablolar
  subject: string;
  correct: string;
  wrong: string;
  empty: string;
  net: string;
  classAverage: string;
  successRate: string;
  
  // Risk seviyeleri
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;
  
  // Trend yönleri
  trendUp: string;
  trendDown: string;
  trendStable: string;
  
  // Genel
  page: string;
  of: string;
  generatedAt: string;
  confidential: string;
}

export const TR_TRANSLATIONS: TranslationKeys = {
  reportTitle: 'Sınav Analiz Raporu',
  studentReport: 'Öğrenci Karnesi',
  parentReport: 'Veli Bilgilendirme Raporu',
  teacherReport: 'Öğretmen Analiz Raporu',
  
  summary: 'Özet',
  performance: 'Performans',
  subjects: 'Ders Bazlı Analiz',
  topics: 'Konu Bazlı Analiz',
  trends: 'Gelişim Trendi',
  risk: 'Risk Değerlendirmesi',
  recommendations: 'Öneriler',
  
  subject: 'Ders',
  correct: 'Doğru',
  wrong: 'Yanlış',
  empty: 'Boş',
  net: 'Net',
  classAverage: 'Sınıf Ort.',
  successRate: 'Başarı %',
  
  riskLow: 'Düşük Risk',
  riskMedium: 'Orta Risk',
  riskHigh: 'Yüksek Risk',
  riskCritical: 'Kritik Risk',
  
  trendUp: 'Yükseliyor',
  trendDown: 'Düşüyor',
  trendStable: 'Stabil',
  
  page: 'Sayfa',
  of: '/',
  generatedAt: 'Oluşturulma Tarihi',
  confidential: 'Bu belge gizlidir.'
};

// ==================== EXPORTS ====================

export default {
  DEFAULT_PDF_OPTIONS,
  DEFAULT_PLACEHOLDER_MESSAGES,
  TR_TRANSLATIONS
};

