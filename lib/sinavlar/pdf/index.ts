/**
 * ============================================
 * AkademiHub - PDF Report Engine
 * ============================================
 * 
 * PHASE 4 - PDF Karne ve Rapor Sistemi
 * 
 * Bu modül:
 * - StudentAnalyticsOutput'u PDF'e dönüştürür
 * - Öğrenci, Veli ve Öğretmen raporları üretir
 * - @react-pdf/renderer kullanır
 * - Server-side render destekler
 * 
 * KULLANIM:
 * 
 * @example
 * import { generatePDF, PDFEngine } from '@/lib/sinavlar/pdf';
 * 
 * // Öğrenci karnesi üret
 * const result = await generatePDF({
 *   analytics: studentAnalytics,
 *   reportType: 'student'
 * });
 * 
 * if (result.success) {
 *   // Supabase Storage'a yükle
 *   await uploadToStorage(result.buffer, result.filename);
 * }
 * 
 * // Veli raporu üret
 * const parentResult = await PDFEngine.generate({
 *   analytics,
 *   reportType: 'parent',
 *   options: { showQRCode: true }
 * });
 */

// ==================== ANA FONKSİYONLAR ====================

export {
  generatePDF,
  generatePDFStream,
  generateBulkPDFs,
  bufferToBlob,
  bufferToBase64,
  bufferToDataURL
} from './pdfGenerator';

// ==================== TEMPLATES ====================

export {
  StudentReportTemplate,
  ParentReportTemplate,
  TeacherReportTemplate
} from './templates';

// ==================== SECTIONS ====================

export {
  HeaderSection,
  SummaryHeader,
  SubjectTable,
  CompactSubjectTable,
  TopicBreakdownSection,
  CompactTopicSummary,
  SubjectBarChart,
  TrendChart,
  PerformanceChartsSection,
  RiskAssessmentSection,
  ParentFriendlyRiskSection,
  StrengthsWeaknessesSection,
  ImprovementPrioritiesSection,
  StudyRecommendationsSection,
  RecommendationsSection,
  FooterSection,
  SimpleFooter,
  Watermark,
  ConfidentialBanner,
  PageBreak
} from './sections';

// ==================== UTILS ====================

export {
  // Chart Generator
  generateBarChartSVG,
  generateVerticalBarChartSVG,
  generateTrendChartSVG,
  generateRadarChartSVG,
  generateProgressBarSVG,
  generateSparklineSVG,
  generateNoDataSVG,
  generateSubjectPerformanceChart,
  svgToBase64,
  
  // Formatters
  formatDate,
  formatDateShort,
  formatTime,
  formatNet,
  formatPercent,
  formatRank,
  formatLargeNumber,
  formatChange,
  truncate,
  capitalize,
  titleCase,
  formatStudentName,
  turkishToAscii,
  toSafeFilename,
  getSubjectName,
  formatRiskLevel,
  formatTrendDirection,
  formatTopicStatus,
  formatRiskFactorForParent,
  generateAssessmentSummary
} from './utils';

// ==================== CONSTANTS ====================

export {
  // Colors
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
  getSubjectColor,
  
  // Fonts & Layout
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
  DEFAULT_PDF_METADATA,
  WATERMARK_CONFIG
} from './constants';

// ==================== TYPES ====================

export type {
  // Main types
  ReportType,
  ReportLanguage,
  PDFGeneratorInput,
  PDFOptions,
  PDFGeneratorResult,
  PDFMetadata,
  
  // Info types
  SchoolInfo,
  ExamInfo,
  
  // Style types
  ColorPalette,
  Typography,
  Spacing,
  PageStyles,
  
  // Section props
  HeaderProps,
  PerformanceChartsProps,
  TopicBreakdownProps,
  RiskAssessmentProps,
  FooterProps,
  
  // Chart types
  BarChartDataPoint,
  RadarChartDataPoint,
  LineChartDataPoint,
  ChartRenderResult,
  
  // Other types
  DataStatus,
  PlaceholderMessages,
  TranslationKeys
} from './types';

export {
  DEFAULT_PDF_OPTIONS,
  DEFAULT_PLACEHOLDER_MESSAGES,
  TR_TRANSLATIONS
} from './types';

// ==================== QUICK ACCESS ====================

import { generatePDF, generatePDFStream, generateBulkPDFs } from './pdfGenerator';
import type { PDFGeneratorInput, PDFGeneratorResult } from './types';

/**
 * PDF Engine - Quick Access
 * 
 * @example
 * import { PDFEngine } from '@/lib/sinavlar/pdf';
 * 
 * // Öğrenci raporu
 * const result = await PDFEngine.generate({ analytics, reportType: 'student' });
 * 
 * // Veli raporu
 * const parentPdf = await PDFEngine.generate({ analytics, reportType: 'parent' });
 * 
 * // Toplu üretim
 * const bulkResult = await PDFEngine.bulk(analyticsArray, 'student');
 */
export const PDFEngine = {
  /**
   * PDF üretir
   */
  generate: generatePDF,
  
  /**
   * PDF stream üretir (büyük dosyalar için)
   */
  stream: generatePDFStream,
  
  /**
   * Toplu PDF üretir
   */
  bulk: generateBulkPDFs,
  
  /**
   * Rapor tipleri
   */
  reportTypes: ['student', 'parent', 'teacher'] as const
};

// ==================== DEFAULT EXPORT ====================

export default PDFEngine;

