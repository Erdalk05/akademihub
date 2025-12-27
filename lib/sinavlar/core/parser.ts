/**
 * AkademiHub Hybrid OMR Parser
 * Motor Dairesi - Optik Veri Ayıklama Motoru
 * 
 * "Cerrah" hassasiyetinde kirli TXT verilerini temizler.
 * 
 * Özellikler:
 * - Fixed-Width parsing (sabit genişlik)
 * - Regex Fallback (tutarsız boşluklar için)
 * - Türkçe karakter düzeltme
 * - Çakışma tespiti
 * - Satır bazlı hata yönetimi
 */

import {
  ParsedStudent,
  ParseResult,
  ParseStatus,
  TemplateMap,
  BookletType,
} from './types';

import {
  normalizeText,
  normalizeName,
  extractFixedWidth,
  parseAnswers,
  parseBooklet,
  validateTC,
} from './helpers';

import {
  logParseStart,
  logParseComplete,
  logParseError,
  logConflict,
} from './audit';

// ============================================
// 📋 VARSAYILAN ŞABLONLAR
// ============================================

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SABİT KARAKTER HARİTASI - PROMPT V5.0 UYUMLU
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TXT dosyasındaki her satırı şu kesin aralıklara göre oku:
 * - Öğrenci No: [10-13] → 4 karakter
 * - TC Kimlik: [15-25] → 11 karakter
 * - Sınıf: [26-27] → 2 karakter
 * - Kitapçık: [28-28] → 1 karakter
 * - Ad Soyad: [30-54] → 25 karakter
 * - Cevaplar: [55-204] → 150 karakter (LGS için ilk 90 kullanılır)
 * 
 * MINIMUM SATIR UZUNLUĞU: 204 karakter
 * 204 karakterden kısa satırlar hatalı olarak işaretlenir.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Yaygın optik form şablonları
 * Her kurumun formatı farklı olabilir
 */
export const DEFAULT_TEMPLATES: Record<string, TemplateMap> = {
  // ═══════════════════════════════════════════════════════════════════════
  // MEB STANDART FORMAT (204 karakter) - YENİ VARSAYILAN
  // ═══════════════════════════════════════════════════════════════════════
  MEB_STANDARD: {
    studentNo: { start: 9, end: 12 },      // [10-13] 4 karakter (0-indexed: 9-12)
    tc: { start: 14, end: 24 },            // [15-25] 11 karakter (0-indexed: 14-24)
    classCode: { start: 25, end: 26 },     // [26-27] 2 karakter - Sınıf (0-indexed: 25-26)
    booklet: { start: 27, end: 27 },       // [28-28] 1 karakter (0-indexed: 27)
    name: { start: 29, end: 53 },          // [30-54] 25 karakter (0-indexed: 29-53)
    answers: { start: 54, end: 203 },      // [55-204] 150 karakter (0-indexed: 54-203)
  },
  
  // Standart LGS optik formu (eski format)
  LGS_STANDARD: {
    studentNo: { start: 0, end: 9 },      // 10 karakter
    tc: { start: 10, end: 20 },            // 11 karakter
    name: { start: 21, end: 50 },          // 30 karakter
    booklet: { start: 51, end: 51 },       // 1 karakter
    answers: { start: 52, end: 141 },      // 90 karakter (90 soru)
  },
  
  // Standart TYT optik formu
  TYT_STANDARD: {
    studentNo: { start: 0, end: 9 },
    tc: { start: 10, end: 20 },
    name: { start: 21, end: 50 },
    booklet: { start: 51, end: 51 },
    answers: { start: 52, end: 171 },      // 120 karakter (120 soru)
  },
  
  // Öğrenci numarası önce
  STUDENT_FIRST: {
    studentNo: { start: 0, end: 4 },       // 5 karakter
    name: { start: 5, end: 29 },           // 25 karakter
    tc: { start: 30, end: 40 },
    booklet: { start: 41, end: 41 },
    answers: { start: 42, end: 141 },
  },
  
  // K12Net formatı
  K12NET: {
    tc: { start: 0, end: 10 },
    studentNo: { start: 11, end: 20 },
    name: { start: 21, end: 60 },
    classCode: { start: 61, end: 65 },
    booklet: { start: 66, end: 66 },
    answers: { start: 67, end: 166 },
  },
};

/**
 * Minimum satır uzunluğu kontrolü
 * 204 karakterden kısa satırlar FAILED olarak işaretlenir
 */
export const MIN_LINE_LENGTH = 204;

// ============================================
// 🔧 PARSER MOTOR
// ============================================

/**
 * Tek satırı parse eder
 * Fixed-Width öncelikli, Regex fallback
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PROMPT V5.0 UYUMLU - SATIIR DOĞRULAMA
 * 204 karakterden kısa olan satırlar hatalı olarak işaretlenir ve atlanır.
 * ═══════════════════════════════════════════════════════════════════════════
 */
function parseLine(
  line: string,
  lineNumber: number,
  template: TemplateMap
): ParsedStudent {
  const rawLine = line;
  
  // Boş satır kontrolü
  if (!line || line.trim().length === 0) {
    return {
      lineNumber,
      rawLine,
      status: 'FAILED',
      conflictReason: 'Boş satır',
      studentNo: '',
      tc: '',
      name: '',
      booklet: null,
      answers: '',
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SATIR UZUNLUĞU KONTROLÜ (PROMPT V5.0)
  // MEB_STANDARD şablonu için minimum 204 karakter gerekli
  // ═══════════════════════════════════════════════════════════════════════
  if (template === DEFAULT_TEMPLATES.MEB_STANDARD && line.length < MIN_LINE_LENGTH) {
    return {
      lineNumber,
      rawLine,
      status: 'FAILED',
      conflictReason: `Satır çok kısa: ${line.length} karakter (minimum ${MIN_LINE_LENGTH} olmalı)`,
      studentNo: '',
      tc: '',
      name: '',
      booklet: null,
      answers: '',
    };
  }

  // === FIXED-WIDTH EXTRACTION ===
  let studentNo = extractFixedWidth(line, template.studentNo.start, template.studentNo.end);
  let tc = extractFixedWidth(line, template.tc.start, template.tc.end);
  let name = extractFixedWidth(line, template.name.start, template.name.end);
  let bookletChar = extractFixedWidth(line, template.booklet.start, template.booklet.end);
  let answers = extractFixedWidth(line, template.answers.start, template.answers.end);
  
  // Opsiyonel alanlar
  let classCode = template.classCode 
    ? extractFixedWidth(line, template.classCode.start, template.classCode.end)
    : undefined;

  // === REGEX FALLBACK (Tutarsız boşluklar için) ===
  // Eğer temel alanlar boşsa, regex ile deneyelim
  if (!studentNo || !tc || !name) {
    // Farklı formatlar için regex denemeleri
    const patterns = [
      // Format: No|TC|Ad Soyad|Kitapçık|Cevaplar
      /^(\d{1,10})\s*(\d{11})\s+([A-ZÇĞİÖŞÜa-zçğıöşü\s]{5,50})\s*([ABCD])\s*([A-E\s\-\*]+)$/i,
      // Format: TC|No|Ad Soyad|Kitapçık|Cevaplar
      /^(\d{11})\s*(\d{1,10})\s+([A-ZÇĞİÖŞÜa-zçğıöşü\s]{5,50})\s*([ABCD])\s*([A-E\s\-\*]+)$/i,
      // Sadece numaralar ve cevaplar (isimsiz)
      /^(\d{1,10})\s*(\d{11})?\s*[A-Z]?\s*([A-E\s\-\*]{20,})$/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        // İlk eşleşen pattern'e göre atama yap
        if (pattern === patterns[0]) {
          studentNo = studentNo || match[1];
          tc = tc || match[2];
          name = name || match[3];
          bookletChar = bookletChar || match[4];
          answers = answers || match[5];
        } else if (pattern === patterns[1]) {
          tc = tc || match[1];
          studentNo = studentNo || match[2];
          name = name || match[3];
          bookletChar = bookletChar || match[4];
          answers = answers || match[5];
        }
        break;
      }
    }
  }

  // === NORMALIZATION ===
  studentNo = normalizeText(studentNo).replace(/\D/g, ''); // Sadece rakamlar
  tc = normalizeText(tc).replace(/\D/g, '');
  name = normalizeName(name);
  answers = normalizeText(answers).toUpperCase();
  
  const booklet = parseBooklet(bookletChar);

  // === VALIDATION & CONFLICT DETECTION ===
  const conflicts: string[] = [];

  // Öğrenci numarası kontrolü
  if (!studentNo || studentNo.length === 0) {
    conflicts.push('Öğrenci numarası eksik');
  }

  // TC kontrolü
  if (tc && tc.length === 11) {
    if (!validateTC(tc)) {
      conflicts.push('Geçersiz TC Kimlik numarası');
    }
  } else if (tc && tc.length > 0 && tc.length !== 11) {
    conflicts.push(`TC uzunluğu hatalı: ${tc.length} karakter`);
  }

  // İsim kontrolü
  if (!name || name.length < 3) {
    conflicts.push('İsim eksik veya çok kısa');
  }

  // Cevap kontrolü
  if (!answers || answers.length < 10) {
    conflicts.push('Cevaplar eksik veya çok kısa');
  }

  // Geçersiz cevap karakterleri
  const invalidChars = answers.match(/[^A-E\s\-\*]/g);
  if (invalidChars && invalidChars.length > 0) {
    conflicts.push(`Geçersiz cevap karakterleri: ${[...new Set(invalidChars)].join(', ')}`);
  }

  // === STATUS BELİRLEME ===
  let status: ParseStatus = 'SUCCESS';
  if (conflicts.length > 0) {
    // Kritik alan eksikliği = FAILED
    if (!studentNo && !tc && !name) {
      status = 'FAILED';
    }
    // Bazı sorunlar var ama parse edilebilir = CONFLICT
    else if (conflicts.some(c => c.includes('Geçersiz TC') || c.includes('eksik'))) {
      status = 'CONFLICT';
    }
    // Küçük sorunlar = PARTIAL
    else {
      status = 'PARTIAL';
    }
  }

  return {
    lineNumber,
    rawLine,
    status,
    conflictReason: conflicts.length > 0 ? conflicts.join('; ') : undefined,
    studentNo,
    tc,
    name,
    booklet,
    answers,
    classCode,
  };
}

// ============================================
// 📦 ANA PARSER FONKSİYONU
// ============================================

/**
 * Optik TXT dosyasını parse eder
 * 
 * @param fileContent Dosya içeriği (string)
 * @param templateMap Alan pozisyonları haritası
 * @param options Opsiyonel ayarlar
 * @returns ParseResult
 */
export function parseOpticalTxt(
  fileContent: string,
  templateMap: TemplateMap = DEFAULT_TEMPLATES.LGS_STANDARD,
  options?: {
    skipEmptyLines?: boolean;
    skipHeaderLines?: number;
    fileName?: string;
    userId?: string;
    organizationId?: string;
  }
): ParseResult {
  const startTime = Date.now();
  const fileName = options?.fileName || 'unknown.txt';
  
  // Satırlara böl
  const lines = fileContent.split(/\r?\n/);
  const totalLines = lines.length;
  
  // Audit log
  logParseStart(fileName, totalLines, {
    userId: options?.userId,
    organizationId: options?.organizationId,
  });

  const students: ParsedStudent[] = [];
  const conflicts: ParsedStudent[] = [];
  const errors: string[] = [];
  
  let successCount = 0;
  let conflictCount = 0;
  let failedCount = 0;

  // Header satırlarını atla
  const startLine = options?.skipHeaderLines || 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1; // 1-indexed

    // Boş satır kontrolü
    if (options?.skipEmptyLines && (!line || line.trim().length === 0)) {
      continue;
    }

    try {
      const parsed = parseLine(line, lineNumber, templateMap);

      if (parsed.status === 'SUCCESS') {
        students.push(parsed);
        successCount++;
      } else if (parsed.status === 'CONFLICT' || parsed.status === 'PARTIAL') {
        students.push(parsed);
        conflicts.push(parsed);
        conflictCount++;
        
        // Conflict log
        logConflict(
          parsed.status,
          parsed.studentNo || `line-${lineNumber}`,
          {
            reason: parsed.conflictReason,
            lineNumber,
          },
          { userId: options?.userId, organizationId: options?.organizationId }
        );
      } else {
        conflicts.push(parsed);
        failedCount++;
        errors.push(`Satır ${lineNumber}: ${parsed.conflictReason}`);
        
        // Error log
        logParseError(fileName, parsed.conflictReason || 'Bilinmeyen hata', lineNumber, {
          userId: options?.userId,
          organizationId: options?.organizationId,
        });
      }
    } catch (error) {
      failedCount++;
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      errors.push(`Satır ${lineNumber}: ${errorMsg}`);
      
      logParseError(fileName, errorMsg, lineNumber, {
        userId: options?.userId,
        organizationId: options?.organizationId,
      });
    }
  }

  const duration = Date.now() - startTime;

  // Completion log
  logParseComplete(fileName, {
    totalLines,
    successCount,
    conflictCount,
    failedCount,
    duration,
  }, {
    userId: options?.userId,
    organizationId: options?.organizationId,
  });

  return {
    success: failedCount === 0 && errors.length === 0,
    totalLines,
    successCount,
    conflictCount,
    failedCount,
    students,
    conflicts,
    errors,
  };
}

// ============================================
// 🔍 OTOMATİK ŞABLON TESPİTİ
// ============================================

/**
 * Dosya içeriğine göre en uygun şablonu tespit eder
 * İlk birkaç satırı analiz ederek format belirler
 */
export function detectTemplate(fileContent: string): TemplateMap {
  const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  if (lines.length === 0) {
    return DEFAULT_TEMPLATES.LGS_STANDARD;
  }

  // İlk geçerli satırı al (header olmayan)
  const sampleLine = lines.find(line => {
    // Sayı içeren satır = veri satırı
    return /\d{5,}/.test(line);
  }) || lines[0];

  const lineLength = sampleLine.length;

  // TC ile başlıyor mu?
  const startsWithTC = /^\d{11}/.test(sampleLine);
  
  // Satır uzunluğuna göre tahmin
  if (lineLength > 160) {
    // Uzun satır = TYT veya AYT
    return startsWithTC ? DEFAULT_TEMPLATES.K12NET : DEFAULT_TEMPLATES.TYT_STANDARD;
  } else if (lineLength > 100) {
    // Orta uzunluk = LGS
    return startsWithTC ? DEFAULT_TEMPLATES.K12NET : DEFAULT_TEMPLATES.LGS_STANDARD;
  } else {
    // Kısa satır = basit format
    return DEFAULT_TEMPLATES.STUDENT_FIRST;
  }
}

// ============================================
// 🛠️ YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Parse sonucunu özet olarak döndürür
 */
export function getParseStats(result: ParseResult): {
  successRate: number;
  conflictRate: number;
  failedRate: number;
  message: string;
} {
  const total = result.totalLines;
  
  return {
    successRate: total > 0 ? Math.round((result.successCount / total) * 100) : 0,
    conflictRate: total > 0 ? Math.round((result.conflictCount / total) * 100) : 0,
    failedRate: total > 0 ? Math.round((result.failedCount / total) * 100) : 0,
    message: result.success 
      ? `✅ ${result.successCount} öğrenci başarıyla parse edildi`
      : `⚠️ ${result.conflictCount} çakışma, ${result.failedCount} hata tespit edildi`,
  };
}

/**
 * Birden fazla dosyayı birleştirerek parse eder
 */
export function parseMultipleFiles(
  files: { name: string; content: string }[],
  templateMap?: TemplateMap,
  options?: {
    userId?: string;
    organizationId?: string;
  }
): ParseResult {
  const allStudents: ParsedStudent[] = [];
  const allConflicts: ParsedStudent[] = [];
  const allErrors: string[] = [];
  
  let totalLines = 0;
  let successCount = 0;
  let conflictCount = 0;
  let failedCount = 0;

  for (const file of files) {
    const template = templateMap || detectTemplate(file.content);
    const result = parseOpticalTxt(file.content, template, {
      ...options,
      fileName: file.name,
      skipEmptyLines: true,
    });

    totalLines += result.totalLines;
    successCount += result.successCount;
    conflictCount += result.conflictCount;
    failedCount += result.failedCount;
    
    allStudents.push(...result.students);
    allConflicts.push(...result.conflicts);
    allErrors.push(...result.errors.map(e => `[${file.name}] ${e}`));
  }

  return {
    success: failedCount === 0 && allErrors.length === 0,
    totalLines,
    successCount,
    conflictCount,
    failedCount,
    students: allStudents,
    conflicts: allConflicts,
    errors: allErrors,
  };
}

/**
 * Cevapları soru numaralarına göre ayırır
 */
export function splitAnswersBySubject(
  answers: string,
  subjects: { id: string; startIndex: number; endIndex: number }[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const answerArray = parseAnswers(answers);

  for (const subject of subjects) {
    result[subject.id] = answerArray
      .slice(subject.startIndex, subject.endIndex + 1)
      .map(a => a || '');
  }

  return result;
}

