/**
 * ============================================
 * AkademiHub - PDF Generator Core
 * ============================================
 * 
 * PHASE 4 - Ana PDF Üretim Orchestrator'ı
 * 
 * BU DOSYA:
 * - Tek giriş noktası (Single Entry Point)
 * - Template seçimi
 * - PDF render ve buffer üretimi
 * - Metadata ekleme
 * - Hata yönetimi
 * 
 * KURALLAR:
 * - HESAPLAMA YAPMAZ
 * - Analytics çıktısını olduğu gibi kullanır
 * - Fail-safe: Eksik veri durumunda placeholder gösterir
 */

import React from 'react';
import { renderToBuffer, renderToStream } from '@react-pdf/renderer';
import { StudentReportTemplate } from './templates/studentReport';
import { ParentReportTemplate } from './templates/parentReport';
import { TeacherReportTemplate } from './templates/teacherReport';
import { toSafeFilename, formatDate } from './utils/formatters';
import type { 
  PDFGeneratorInput, 
  PDFGeneratorResult, 
  PDFMetadata,
  PDFOptions,
  ReportType 
} from './types';
import { DEFAULT_PDF_OPTIONS } from './types';
import type { StudentAnalyticsOutput } from '../analytics/orchestrator/types';

// ==================== ANA FONKSİYON ====================

/**
 * PDF üretir
 * 
 * Bu fonksiyon Analytics çıktısını alır ve seçilen rapor tipine göre
 * PDF buffer'ı döndürür. Cloud Storage'a direkt upload edilebilir.
 * 
 * @param input - PDF üretim girdisi
 * @returns PDF buffer ve metadata
 * 
 * @example
 * const result = await generatePDF({
 *   analytics: studentAnalytics,
 *   reportType: 'student',
 *   options: { showWatermark: true }
 * });
 * 
 * if (result.success) {
 *   // Supabase Storage'a yükle
 *   await uploadToStorage(result.buffer, result.filename);
 * }
 */
export async function generatePDF(input: PDFGeneratorInput): Promise<PDFGeneratorResult> {
  const startTime = Date.now();
  
  try {
    // Opsiyon birleştirme
    const options: PDFOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...input.options
    };
    
    // Veri validasyonu
    const validationResult = validateInput(input);
    if (!validationResult.valid) {
      return {
        success: false,
        filename: '',
        metadata: createEmptyMetadata(),
        error: validationResult.error,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime
      };
    }
    
    // Template seç ve render et
    const document = selectTemplate(input.analytics, input.reportType, options, input.schoolInfo, input.examInfo);
    
    // PDF buffer üret
    const buffer = await renderToBuffer(document);
    
    // Dosya adı oluştur
    const filename = generateFilename(input.analytics, input.reportType);
    
    // Metadata oluştur
    const metadata = createMetadata(input.analytics, input.reportType);
    
    return {
      success: true,
      buffer,
      filename,
      metadata,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('[PDFGenerator] Error:', error);
    
    return {
      success: false,
      filename: '',
      metadata: createEmptyMetadata(),
      error: error instanceof Error ? error.message : 'PDF üretim hatası',
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * PDF stream üretir (büyük dosyalar için)
 */
export async function generatePDFStream(input: PDFGeneratorInput): Promise<{
  success: boolean;
  stream?: NodeJS.ReadableStream;
  filename: string;
  error?: string;
}> {
  try {
    const options: PDFOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...input.options
    };
    
    const validationResult = validateInput(input);
    if (!validationResult.valid) {
      return {
        success: false,
        filename: '',
        error: validationResult.error
      };
    }
    
    const document = selectTemplate(input.analytics, input.reportType, options, input.schoolInfo, input.examInfo);
    const stream = await renderToStream(document);
    const filename = generateFilename(input.analytics, input.reportType);
    
    return {
      success: true,
      stream: stream as unknown as NodeJS.ReadableStream,
      filename
    };
    
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'PDF stream hatası'
    };
  }
}

// ==================== TOPLU PDF ÜRETİMİ ====================

/**
 * Birden fazla öğrenci için PDF üretir
 */
export async function generateBulkPDFs(
  analyticsArray: StudentAnalyticsOutput[],
  reportType: ReportType,
  options?: PDFOptions
): Promise<{
  success: boolean;
  results: PDFGeneratorResult[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    totalDurationMs: number;
  };
}> {
  const startTime = Date.now();
  const results: PDFGeneratorResult[] = [];
  let successful = 0;
  let failed = 0;
  
  for (const analytics of analyticsArray) {
    const result = await generatePDF({
      analytics,
      reportType,
      options
    });
    
    results.push(result);
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }
  
  return {
    success: failed === 0,
    results,
    stats: {
      total: analyticsArray.length,
      successful,
      failed,
      totalDurationMs: Date.now() - startTime
    }
  };
}

// ==================== TEMPLATE SEÇİMİ ====================

/**
 * Rapor tipine göre template seçer
 */
function selectTemplate(
  analytics: StudentAnalyticsOutput,
  reportType: ReportType,
  options: PDFOptions,
  schoolInfo?: PDFGeneratorInput['schoolInfo'],
  examInfo?: PDFGeneratorInput['examInfo']
): React.ReactElement {
  const props = {
    analytics,
    options,
    schoolInfo,
    examInfo
  };
  
  switch (reportType) {
    case 'student':
      return React.createElement(StudentReportTemplate, props);
    
    case 'parent':
      return React.createElement(ParentReportTemplate, props);
    
    case 'teacher':
      return React.createElement(TeacherReportTemplate, props);
    
    default:
      // Varsayılan: öğrenci raporu
      return React.createElement(StudentReportTemplate, props);
  }
}

// ==================== VALİDASYON ====================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Girdi validasyonu
 */
function validateInput(input: PDFGeneratorInput): ValidationResult {
  if (!input.analytics) {
    return {
      valid: false,
      error: 'Analytics verisi eksik'
    };
  }
  
  if (!input.analytics.summary) {
    return {
      valid: false,
      error: 'Analytics summary eksik'
    };
  }
  
  if (!input.reportType) {
    return {
      valid: false,
      error: 'Rapor tipi belirtilmedi'
    };
  }
  
  const validTypes: ReportType[] = ['student', 'parent', 'teacher'];
  if (!validTypes.includes(input.reportType)) {
    return {
      valid: false,
      error: `Geçersiz rapor tipi: ${input.reportType}`
    };
  }
  
  return { valid: true };
}

// ==================== DOSYA ADI ====================

/**
 * PDF dosya adı oluşturur
 */
function generateFilename(analytics: StudentAnalyticsOutput, reportType: ReportType): string {
  const studentName = analytics.ai_metadata?.student_name || 'ogrenci';
  const examName = analytics.ai_metadata?.exam_name || 'sinav';
  const date = new Date().toISOString().split('T')[0];
  
  const reportTypeLabel = {
    student: 'karne',
    parent: 'veli_raporu',
    teacher: 'ogretmen_raporu'
  }[reportType];
  
  const safeName = toSafeFilename(studentName);
  const safeExam = toSafeFilename(examName);
  
  return `${safeName}_${safeExam}_${reportTypeLabel}_${date}.pdf`;
}

// ==================== METADATA ====================

/**
 * PDF metadata oluşturur
 */
function createMetadata(analytics: StudentAnalyticsOutput, reportType: ReportType): PDFMetadata {
  const studentName = analytics.ai_metadata?.student_name || 'Öğrenci';
  
  const titles = {
    student: `Öğrenci Karnesi - ${studentName}`,
    parent: `Veli Bilgilendirme - ${studentName}`,
    teacher: `Öğretmen Analizi - ${studentName}`
  };
  
  const subjects = {
    student: 'Sınav Performans Analizi ve Kişisel Gelişim Raporu',
    parent: 'Veli Bilgilendirme ve Öğrenci Durum Raporu',
    teacher: 'Detaylı Öğrenci Analiz ve Karşılaştırma Raporu'
  };
  
  return {
    title: titles[reportType],
    author: 'AkademiHub',
    subject: subjects[reportType],
    keywords: ['sınav', 'analiz', 'karne', 'LGS', 'TYT', 'AYT', studentName],
    creator: 'AkademiHub Analiz Sistemi',
    producer: 'AkademiHub PDF Engine v1.0',
    creationDate: new Date()
  };
}

/**
 * Boş metadata oluşturur (hata durumları için)
 */
function createEmptyMetadata(): PDFMetadata {
  return {
    title: 'Hata',
    author: 'AkademiHub',
    subject: 'PDF Üretim Hatası',
    keywords: [],
    creator: 'AkademiHub',
    producer: 'AkademiHub PDF Engine',
    creationDate: new Date()
  };
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Buffer'ı Blob'a dönüştürür (browser için)
 */
export function bufferToBlob(buffer: Buffer, mimeType: string = 'application/pdf'): Blob {
  return new Blob([new Uint8Array(buffer)], { type: mimeType });
}

/**
 * Buffer'ı Base64'e dönüştürür
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Buffer'ı data URL'e dönüştürür
 */
export function bufferToDataURL(buffer: Buffer): string {
  const base64 = bufferToBase64(buffer);
  return `data:application/pdf;base64,${base64}`;
}

// ==================== EXPORT ====================

export default {
  generatePDF,
  generatePDFStream,
  generateBulkPDFs,
  bufferToBlob,
  bufferToBase64,
  bufferToDataURL
};

