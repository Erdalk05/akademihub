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
  // MEB STANDART FORMAT (205 karakter) - ALIGNMENT FIX UYGULANMIŞ
  // ═══════════════════════════════════════════════════════════════════════
  // NOT: Bu format Özdebir ile aynı yapıyı kullanır
  // Kurum kodu olmayan kurumlar için school alanı opsiyonel
  // ═══════════════════════════════════════════════════════════════════════
  MEB_STANDARD: {
    school: { start: 0, end: 9 },          // line.substring(0, 10).trim() → kurum_kodu (10 kr)
    studentNo: { start: 10, end: 13 },     // line.substring(10, 14).trim() → ogrenci_no (4 kr)
    tc: { start: 14, end: 24 },            // line.substring(14, 25).trim() → tc_kimlik (11 kr)
    classCode: { start: 25, end: 26 },     // line.substring(25, 27).trim() → sinif_sube (2 kr)
    booklet: { start: 27, end: 27 },       // line.substring(27, 28).trim() → kitapcik_turu (1 kr)
    gender: { start: 28, end: 28 },        // line.substring(28, 29).trim() → cinsiyet (1 kr)
    name: { start: 29, end: 53 },          // line.substring(29, 54).trim() → ad_soyad (25 kr)
    // BUFFER: index 54 = boşluk (ad soyad ile cevaplar arası)
    answers: { start: 55, end: 204 },      // line.substring(55, 205) → cevaplar (150 kr)
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // ÖZDEBİR FORMATI (205 karakter) - ALIGNMENT FIX
  // ═══════════════════════════════════════════════════════════════════════
  // Özdebir yayıncılık LGS optik form formatı
  // 150 cevap karakteri içerir (90 soru + boşluklar)
  // 
  // STRICT KARAKTER HARİTASI (TASK: ALIGNMENT FIX):
  // ┌──────────────────────────────────────────────────────────────────────┐
  // │ ALAN           │ substring()       │ KARAKTER │ AÇIKLAMA              │
  // ├──────────────────────────────────────────────────────────────────────┤
  // │ institution    │ (0, 10)           │ 10 kr    │ Kurum Kodu            │
  // │ student_no     │ (10, 14)          │ 4 kr     │ Öğrenci No            │
  // │ tc_no          │ (14, 25)          │ 11 kr    │ TC Kimlik             │
  // │ class_name     │ (25, 27)          │ 2 kr     │ Sınıf/Şube            │
  // │ booklet_type   │ (27, 28)          │ 1 kr     │ Kitapçık (A/B)        │
  // │ gender         │ (28, 29)          │ 1 kr     │ Cinsiyet (E/K)        │
  // │ full_name      │ (29, 54)          │ 25 kr    │ Ad Soyad              │
  // │ --- BUFFER --- │ (54, 55)          │ 1 kr     │ Boşluk (ad-cevap arası)│
  // │ raw_answers    │ (55, 205)         │ 150 kr   │ Cevaplar              │
  // └──────────────────────────────────────────────────────────────────────┘
  //
  // ÖNEMLİ: Ad Soyad (29-53) ile Cevaplar (55-204) arasında 1 karakterlik
  //         buffer (index 54) var. Bu karakter sızıntısını önler!
  //
  // DERS SIRALAMASI (Özdebir LGS - cevaplar içinde):
  // - Türkçe: [0-20] 20 soru
  // - Sosyal: [20-30] 10 soru
  // - Din: [30-40] 10 soru
  // - İngilizce: [40-50] 10 soru
  // - Matematik: [50-70] 20 soru
  // - Fen: [70-90] 20 soru
  // ═══════════════════════════════════════════════════════════════════════
  OZDEBIR: {
    school: { start: 0, end: 9 },          // line.substring(0, 10).trim() → kurum_kodu (10 kr)
    studentNo: { start: 10, end: 13 },     // line.substring(10, 14).trim() → ogrenci_no (4 kr)
    tc: { start: 14, end: 24 },            // line.substring(14, 25).trim() → tc_kimlik (11 kr)
    classCode: { start: 25, end: 26 },     // line.substring(25, 27).trim() → sinif_sube (2 kr)
    booklet: { start: 27, end: 27 },       // line.substring(27, 28).trim() → kitapcik_turu (1 kr)
    gender: { start: 28, end: 28 },        // line.substring(28, 29).trim() → cinsiyet (1 kr)
    name: { start: 29, end: 53 },          // line.substring(29, 54).trim() → ad_soyad (25 kr)
    // BUFFER: index 54 = boşluk (ad soyad ile cevaplar arası)
    answers: { start: 55, end: 204 },      // line.substring(55, 205) → cevaplar (150 kr)
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
// Minimum satır uzunluğu: 205 karakter (55 meta + 150 cevap)
export const MIN_LINE_LENGTH = 205;

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
  // MEB_STANDARD ve OZDEBIR şablonları için minimum 204 karakter gerekli
  // ═══════════════════════════════════════════════════════════════════════
  const requires204Chars = template === DEFAULT_TEMPLATES.MEB_STANDARD || 
                           template === DEFAULT_TEMPLATES.OZDEBIR;
  
  if (requires204Chars && line.length < MIN_LINE_LENGTH) {
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

  // ═══════════════════════════════════════════════════════════════════════
  // ROBUST FIXED-WIDTH EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════
  // KURAL 1: ASLA split() kullanma, sadece substring(start, end) kullan
  // KURAL 2: Her alanı trim() ile temizle, boşsa NULL/"Tanımsız"
  // KURAL 3: Ad Soyad OCR temizliği yap ama 25 karakter koru
  // KURAL 4: Cevaplarda boşluk = "soru boş bırakıldı"
  // ═══════════════════════════════════════════════════════════════════════
  
  // Okul/Kurum Kodu (opsiyonel)
  let school = template.school
    ? line.substring(template.school.start, template.school.end + 1).trim()
    : undefined;
  if (school === '') school = undefined;
  
  // Öğrenci Numarası - sadece rakamları al
  let studentNo = line.substring(template.studentNo.start, template.studentNo.end + 1).trim();
  studentNo = studentNo.replace(/\D/g, ''); // Sadece rakamlar
  if (studentNo === '') studentNo = 'Tanımsız';
  
  // TC Kimlik Numarası - sadece rakamları al
  let tc = line.substring(template.tc.start, template.tc.end + 1).trim();
  tc = tc.replace(/\D/g, ''); // Sadece rakamlar
  if (tc === '') tc = '';  // Boş bırakılabilir
  
  // Sınıf/Şube Kodu (opsiyonel)
  let classCode = template.classCode 
    ? line.substring(template.classCode.start, template.classCode.end + 1).trim()
    : undefined;
  if (classCode === '') classCode = undefined;
  
  // Kitapçık Türü
  let bookletChar = line.substring(template.booklet.start, template.booklet.end + 1).trim();
  if (bookletChar === '') bookletChar = 'A'; // Varsayılan A
  
  // Cinsiyet (opsiyonel - Özdebir formatı)
  let gender = template.gender
    ? line.substring(template.gender.start, template.gender.end + 1).trim()
    : undefined;
  if (gender === '') gender = undefined;
    
  // ═══════════════════════════════════════════════════════════════════════
  // AD SOYAD - OCR TEMİZLİĞİ (25 karakter korunur)
  // ═══════════════════════════════════════════════════════════════════════
  // OCR bozukluklarını temizle: ı→I, «→C, ÷→O
  // ═══════════════════════════════════════════════════════════════════════
  let nameRaw = line.substring(template.name.start, template.name.end + 1);
  // OCR karakter düzeltmeleri
  let name = nameRaw
    .replace(/ı/g, 'I')
    .replace(/«/g, 'C')
    .replace(/»/g, '')
    .replace(/÷/g, 'O')
    .replace(/×/g, '')
    .replace(/\?/g, '')
    .replace(/\*/g, '')
    .trim();
  // Boşsa varsayılan değer
  if (name === '') name = 'Tanımsız';
  // İsmi normalize et (ilk harfler büyük)
  name = normalizeName(name);
  
  // ═══════════════════════════════════════════════════════════════════════
  // CEVAPLAR BLOĞU - BOŞLUK = BOŞ CEVAP
  // ═══════════════════════════════════════════════════════════════════════
  // Karakterleri atlama! Boşluk = soru boş bırakıldı
  // A, B, C, D, E = geçerli cevaplar
  // Boşluk, -, * = boş cevap (korunur)
  // ═══════════════════════════════════════════════════════════════════════
  let answers = line.substring(template.answers.start, template.answers.end + 1);
  // TRIM YAPMA! Cevaplardaki boşluklar önemli
  // Sadece büyük harfe çevir, karakterleri koru
  answers = answers.toUpperCase();
  
  const booklet = parseBooklet(bookletChar);

  // ═══════════════════════════════════════════════════════════════════════
  // VALIDATION & CONFLICT DETECTION
  // ═══════════════════════════════════════════════════════════════════════
  const conflicts: string[] = [];

  // Öğrenci numarası kontrolü
  if (!studentNo || studentNo === 'Tanımsız' || studentNo.length === 0) {
    conflicts.push('Öğrenci numarası eksik veya okunamadı');
  }

  // TC kontrolü (opsiyonel - boş olabilir)
  if (tc && tc.length > 0 && tc.length !== 11) {
    conflicts.push(`TC uzunluğu hatalı: ${tc.length} karakter (11 olmalı)`);
  } else if (tc && tc.length === 11 && !validateTC(tc)) {
    // TC var ve 11 karakter ama geçersiz
    conflicts.push('TC Kimlik algoritma hatası');
  }

  // İsim kontrolü
  if (!name || name === 'Tanımsız' || name.length < 2) {
    conflicts.push('İsim eksik veya okunamadı');
  }

  // Cevap kontrolü
  if (!answers || answers.length < 10) {
    conflicts.push('Cevaplar eksik veya çok kısa');
  }

  // Geçersiz cevap karakterleri (boşluk hariç - boşluk geçerli)
  const validAnswerChars = /^[A-E\s\-\*]+$/;
  if (answers && !validAnswerChars.test(answers)) {
    const invalidChars = answers.match(/[^A-E\s\-\*]/g);
    if (invalidChars && invalidChars.length > 0) {
      // Sadece uyarı - parse devam eder
      conflicts.push(`Beklenmeyen karakterler (görmezden geliniyor): ${[...new Set(invalidChars)].slice(0, 5).join(', ')}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS BELİRLEME
  // ═══════════════════════════════════════════════════════════════════════
  let status: ParseStatus = 'SUCCESS';
  if (conflicts.length > 0) {
    // Kritik alan eksikliği = FAILED
    const hasStudentNo = studentNo && studentNo !== 'Tanımsız';
    const hasName = name && name !== 'Tanımsız';
    const hasAnswers = answers && answers.length >= 10;
    
    if (!hasStudentNo && !hasName && !hasAnswers) {
      status = 'FAILED';
    }
    // TC veya öğrenci no eksik ama diğerleri var = CONFLICT
    else if (conflicts.some(c => c.includes('eksik') || c.includes('okunamadı'))) {
      status = 'CONFLICT';
    }
    // Sadece uyarılar = PARTIAL
    else {
      status = 'PARTIAL';
    }
  }

  return {
    lineNumber,
    rawLine,
    status,
    conflictReason: conflicts.length > 0 ? conflicts.join('; ') : undefined,
    studentNo: studentNo === 'Tanımsız' ? '' : studentNo,
    tc: tc || '',
    name: name === 'Tanımsız' ? '' : name,
    booklet,
    answers,
    classCode,
    school,   // Kurum kodu (Özdebir formatı için)
    gender,   // Cinsiyet (E/K) - Özdebir formatı için
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

