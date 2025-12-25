/**
 * AkademiHub - Batch PDF Generator
 * Toplu Karne Üretim Motoru
 * 
 * Özellikler:
 * - Tüm öğrenciler için tek tıkla PDF üretimi
 * - ZIP dosyası olarak indirme
 * - İlerleme takibi
 * - Hata yönetimi
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { ExamReportCard, ExamReportCardProps } from './templates/examReportCard';
import type { StudentResult } from '../core/types';
import { logAction } from '../core/audit';

// ============================================
// 📋 TİPLER
// ============================================

export interface BatchGeneratorInput {
  // Öğrenci sonuçları
  students: StudentResult[];
  
  // Sınav bilgileri
  examInfo: {
    name: string;
    date: string;
    type: string;
    totalStudents: number;
  };
  
  // Okul bilgileri
  schoolInfo: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
  };
  
  // Opsiyonel
  options?: {
    includeTeacherNotes?: boolean;
    generateAINotes?: boolean;
    onProgress?: (current: number, total: number, studentName: string) => void;
  };
}

export interface BatchGeneratorResult {
  success: boolean;
  zipBlob?: Blob;
  zipBuffer?: Buffer;
  filename: string;
  totalGenerated: number;
  failedCount: number;
  errors: { studentNo: string; error: string }[];
  durationMs: number;
}

export interface SinglePDFResult {
  success: boolean;
  buffer?: Buffer;
  blob?: Blob;
  filename: string;
  error?: string;
}

// ============================================
// 📄 TEK PDF ÜRETİMİ
// ============================================

/**
 * Tek öğrenci için PDF üretir
 */
export async function generateSinglePDF(
  student: StudentResult,
  examInfo: BatchGeneratorInput['examInfo'],
  schoolInfo: BatchGeneratorInput['schoolInfo'],
  options?: {
    teacherNote?: string;
    classRank?: number;
    classSize?: number;
  }
): Promise<SinglePDFResult> {
  try {
    const props: ExamReportCardProps = {
      student,
      examInfo,
      schoolInfo,
      classRank: options?.classRank,
      classSize: options?.classSize,
      teacherNote: options?.teacherNote,
    };

    const buffer = await renderToBuffer(
      React.createElement(ExamReportCard, props)
    );

    // Dosya adını güvenli hale getir
    const safeName = student.name
      .replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9]/g, '_')
      .substring(0, 30);
    
    const filename = `${student.studentNo}_${safeName}.pdf`;

    return {
      success: true,
      buffer,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      filename: `${student.studentNo}_error.pdf`,
      error: error instanceof Error ? error.message : 'PDF üretilemedi',
    };
  }
}

// ============================================
// 📦 TOPLU PDF ÜRETİMİ
// ============================================

/**
 * Tüm öğrenciler için PDF üretir ve ZIP olarak paketler
 */
export async function generateBatchPDFs(
  input: BatchGeneratorInput
): Promise<BatchGeneratorResult> {
  const startTime = Date.now();
  const zip = new JSZip();
  const errors: { studentNo: string; error: string }[] = [];
  let generatedCount = 0;

  const { students, examInfo, schoolInfo, options } = input;

  // Audit log - başlangıç
  logAction('BATCH_SAVE', {
    action: 'PDF_BATCH_START',
    studentCount: students.length,
    examName: examInfo.name,
  });

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    
    // İlerleme callback
    options?.onProgress?.(i + 1, students.length, student.name);

    try {
      // AI notu oluştur (opsiyonel)
      let teacherNote: string | undefined;
      if (options?.generateAINotes) {
        teacherNote = generateAINote(student);
      }

      // PDF üret
      const result = await generateSinglePDF(student, examInfo, schoolInfo, {
        teacherNote,
      });

      if (result.success && result.buffer) {
        zip.file(result.filename, result.buffer);
        generatedCount++;
      } else {
        errors.push({
          studentNo: student.studentNo,
          error: result.error || 'Bilinmeyen hata',
        });
      }
    } catch (error) {
      errors.push({
        studentNo: student.studentNo,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    }
  }

  // ZIP oluştur
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const zipBlob = new Blob([zipBuffer], { type: 'application/zip' });

  // Dosya adı
  const safeExamName = examInfo.name
    .replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9]/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${safeExamName}_Karneler_${dateStr}.zip`;

  const durationMs = Date.now() - startTime;

  // Audit log - tamamlandı
  logAction('BATCH_SAVE', {
    action: 'PDF_BATCH_COMPLETE',
    generatedCount,
    failedCount: errors.length,
    durationMs,
    examName: examInfo.name,
  });

  return {
    success: errors.length === 0,
    zipBlob,
    zipBuffer,
    filename,
    totalGenerated: generatedCount,
    failedCount: errors.length,
    errors,
    durationMs,
  };
}

// ============================================
// 🤖 AI NOT ÜRETİCİ
// ============================================

/**
 * Öğrenci performansına göre otomatik not üretir
 */
function generateAINote(student: StudentResult): string {
  const { totalNet, totalScore, percentile, subjects } = student;
  
  // En güçlü ders
  const sortedSubjects = [...subjects].sort((a, b) => b.percentage - a.percentage);
  const strongest = sortedSubjects[0];
  const weakest = sortedSubjects[sortedSubjects.length - 1];
  
  // Performans seviyesi
  let performanceLevel: 'excellent' | 'good' | 'average' | 'needsWork';
  if (percentile >= 90) performanceLevel = 'excellent';
  else if (percentile >= 70) performanceLevel = 'good';
  else if (percentile >= 40) performanceLevel = 'average';
  else performanceLevel = 'needsWork';
  
  // Notlar
  const notes: Record<string, string[]> = {
    excellent: [
      `${student.name} bu sınavda üstün bir performans sergiledi.`,
      `%${percentile} dilimde yer alarak akranlarının büyük çoğunluğunun önünde.`,
      `Özellikle ${strongest.subjectName} dersinde gösterdiği %${strongest.percentage} başarı takdire şayan.`,
      `Bu başarıyı sürdürmesi için çalışmalarına aynı motivasyonla devam etmesi önerilir.`,
    ],
    good: [
      `${student.name} genel olarak iyi bir performans gösterdi.`,
      `${totalNet.toFixed(1)} net ile sağlam bir temel oluşturmuş durumda.`,
      `${strongest.subjectName} dersindeki başarısı (%${strongest.percentage}) öne çıkıyor.`,
      `${weakest.subjectName} dersinde (%${weakest.percentage}) ek çalışma yapması faydalı olacaktır.`,
    ],
    average: [
      `${student.name} ortalama düzeyde bir performans sergiledi.`,
      `${totalNet.toFixed(1)} net ile gelişim potansiyeli mevcut.`,
      `${strongest.subjectName} dersinde görece daha başarılı (%${strongest.percentage}).`,
      `${weakest.subjectName} dersine (%${weakest.percentage}) öncelik vererek genel başarısını artırabilir.`,
    ],
    needsWork: [
      `${student.name} bu sınavda beklenilen seviyenin altında kaldı.`,
      `Ancak ${strongest.subjectName} dersindeki %${strongest.percentage} başarısı umut verici.`,
      `${weakest.subjectName} başta olmak üzere temel konularda destek alması önerilir.`,
      `Düzenli çalışma programı ve birebir rehberlik ile kısa sürede gelişim gösterebilir.`,
    ],
  };
  
  return notes[performanceLevel].join(' ');
}

// ============================================
// 📊 YARDIMCI FONKSİYONLAR
// ============================================

/**
 * PDF boyutunu tahmin eder (KB)
 */
export function estimatePDFSize(studentCount: number): number {
  // Ortalama 150KB per PDF
  return studentCount * 150;
}

/**
 * Tahmini süreyi hesaplar (saniye)
 */
export function estimateDuration(studentCount: number): number {
  // Ortalama 0.5 saniye per PDF
  return Math.ceil(studentCount * 0.5);
}

/**
 * İnsan okunabilir dosya boyutu
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

