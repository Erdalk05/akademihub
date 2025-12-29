/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AKADEMİHUB – RESMÎ OPTİK PARSE MOTORU (FINAL)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Bu dosya AkademiHub'ın "tek doğru" parse referansıdır.
 * 
 * ENDÜSTRİ STANDARDI:
 * - Sadece A B C D E _ geçerli cevap karakterleridir
 * - Diğer tüm karakterler (space, tab, rakam, harf) ÇÖP'tür, atlanır
 * - İlk 90 geçerli karakter = sınav cevapları
 * - Dersler INDEX'e göre bölünür (pozisyona değil)
 * 
 * YASAKLI YAKLAŞIMLAR:
 * - ❌ START aramak
 * - ❌ Boşluk/separator analizi
 * - ❌ Pozisyon bazlı okuma
 * - ❌ Regex ile ders ayırma
 * - ❌ İsim satırından cevap okuma
 * 
 * BU DOSYA BİR DAHA DEĞİŞTİRİLMEZ.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { ParsedOptikSatir } from '../kazanim/types';

// ════════════════════════════════════════════════════════════════════════════════
// SABİTLER
// ════════════════════════════════════════════════════════════════════════════════

/** Geçerli cevap karakterleri */
const VALID_ANSWER_CHARS = new Set(['A', 'B', 'C', 'D', 'E']);

/** Boş cevap karakteri */
const BLANK_CHAR = '_';

/** Tüm geçerli karakterler (cevap + boş) */
const ALL_VALID_CHARS = new Set(['A', 'B', 'C', 'D', 'E', '_']);

/** Varsayılan toplam soru sayısı (LGS) */
const DEFAULT_TOTAL_QUESTIONS = 90;

// ════════════════════════════════════════════════════════════════════════════════
// DERS YAPILANDIRMASI (LGS)
// ════════════════════════════════════════════════════════════════════════════════

export interface LessonBlock {
  kod: string;
  ad: string;
  soruSayisi: number;
  baslangic: number;  // 0-indexed
  bitis: number;      // exclusive
}

export interface ExamStructure {
  toplamSoru: number;
  dersler: LessonBlock[];
}

export const LGS_EXAM_STRUCTURE: ExamStructure = {
  toplamSoru: 90,
  dersler: [
    { kod: 'TUR', ad: 'Türkçe', soruSayisi: 20, baslangic: 0, bitis: 20 },
    { kod: 'INK', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10, baslangic: 20, bitis: 30 },
    { kod: 'DIN', ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10, baslangic: 30, bitis: 40 },
    { kod: 'ING', ad: 'Yabancı Dil (İngilizce)', soruSayisi: 10, baslangic: 40, bitis: 50 },
    { kod: 'MAT', ad: 'Matematik', soruSayisi: 20, baslangic: 50, bitis: 70 },
    { kod: 'FEN', ad: 'Fen Bilimleri', soruSayisi: 20, baslangic: 70, bitis: 90 },
  ],
};

// ════════════════════════════════════════════════════════════════════════════════
// TİP TANIMLARI
// ════════════════════════════════════════════════════════════════════════════════

export interface ParsedStudentResult {
  ogrenciNo: string;
  ogrenciAdi: string;
  tc?: string;
  sinifNo?: string;
  kitapcik: 'A' | 'B' | 'C' | 'D' | null;
  
  rawString: string;
  cleanedString: string;
  
  /** Tespit edilen geçerli cevap sayısı */
  detectedAnswerCount: number;
  
  /** Final cevap dizisi (90 eleman) */
  finalAnswers: (string | null)[];
  
  /** Ders bazlı sonuçlar */
  lessonBlocks: LessonBlockResult[];
  
  /** Parse kalitesi */
  alignmentConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  reviewStatus: 'OK' | 'NEEDS_REVIEW' | 'REJECTED';
  alignmentWarnings: string[];
  
  satırNo: number;
  isValid: boolean;
  hatalar: string[];
}

export interface LessonBlockResult {
  dersKodu: string;
  dersAdi: string;
  expectedCount: number;
  actualCount: number;
  cevaplar: (string | null)[];
  isComplete: boolean;
  warnings: string[];
}

export interface BatchParseResult {
  students: ParsedStudentResult[];
  stats: {
    totalLines: number;
    successCount: number;
    needsReviewCount: number;
    rejectedCount: number;
    averageConfidence: number;
  };
  warnings: string[];
}

export interface ParseTemplate {
  sablonAdi: string;
  toplamSoru: number;
  alanTanimlari: {
    alan: string;
    baslangic: number;
    bitis: number;
    label: string;
  }[];
}

// ════════════════════════════════════════════════════════════════════════════════
// ANA PARSE FONKSİYONU
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tek bir satırdan sadece geçerli cevap karakterlerini çıkar.
 * 
 * ENDÜSTRİ STANDARDI:
 * - Sadece A B C D E _ geçerli
 * - Diğer her şey atlanır
 * - İlk 90 geçerli karakter = cevaplar
 */
function extractValidAnswers(rawText: string, totalQuestions: number): (string | null)[] {
  const answers: (string | null)[] = [];
  const upperText = rawText.toUpperCase();
  
  for (const ch of upperText) {
    if (answers.length >= totalQuestions) break;
    
    if (VALID_ANSWER_CHARS.has(ch)) {
      answers.push(ch);
    } else if (ch === BLANK_CHAR) {
      answers.push(null); // _ = boş cevap
    }
    // Diğer karakterler (space, tab, rakam, vs.) → ATLA
  }
  
  // Eksik cevapları null ile doldur
  while (answers.length < totalQuestions) {
    answers.push(null);
  }
  
  return answers;
}

/**
 * Şablondaki alanlardan "cevap segmenti" olanları bul.
 * - alan='cevaplar' ise kesin cevap segmentidir
 * - veya label ders/cevap alanı içeriyorsa (TÜRKÇE, MATEMATİK, FEN, SOSYAL, vb.)
 *
 * Amaç: İsim/kitapçık gibi alanlarda geçen A-E harflerini KESİNLİKLE cevap sanmamak.
 */
function isAnswerSegmentField(alan: { alan: string; label: string }): boolean {
  const a = (alan.alan || '').toLowerCase();
  const l = (alan.label || '').toLowerCase();

  if (a === 'cevaplar' || a.includes('cevap')) return true;

  // Ders alanları (kullanıcı ders ders tanımlayabiliyor)
  const dersKeywords = [
    'türkçe', 'turkce',
    'matematik',
    'fen',
    'inkılap', 'inkilap', 'atatürk', 'ataturk',
    'din',
    'ingilizce', 'yabancı', 'yabanci', 'dil',
    'sosyal',
    'tarih',
    'coğrafya', 'cografya',
    'fizik',
    'kimya',
    'biyoloji',
    'edebiyat',
    'felsefe',
  ];
  return dersKeywords.some(k => l.includes(k));
}

/**
 * Türkçe karakter düzeltme
 */
function fixTurkishChars(text: string): string {
  if (!text) return '';
  return text
    .replace(/ı/g, 'I')
    .replace(/i/g, 'İ')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç');
}

/**
 * İsim temizleme
 */
function cleanStudentName(name: string): string {
  if (!name) return '';
  return fixTurkishChars(name.trim()).toUpperCase();
}

/**
 * Kitapçık parse
 */
function parseBooklet(char: string): 'A' | 'B' | 'C' | 'D' | null {
  const upper = (char || '').toUpperCase().trim();
  if (['A', 'B', 'C', 'D'].includes(upper)) {
    return upper as 'A' | 'B' | 'C' | 'D';
  }
  // Bazı optik formatlarda kitapçık alanı 2 karakterdir (örn: "AB", "DB", "AA").
  // Burada KRİTİK kural: "son görülen" A/B/C/D harfini kitapçık kabul et.
  // Çünkü "DB" gibi durumlarda ilk harfi almak kitapçığı D diye yanlış okutur,
  // gerçek kitapçık ise B olabilir (son karakter).
  const matches = upper.match(/[ABCD]/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1] as 'A' | 'B' | 'C' | 'D';
}

/**
 * Ders bloklarını oluştur
 */
function buildLessonBlocks(
  answers: (string | null)[],
  structure: ExamStructure
): LessonBlockResult[] {
  return structure.dersler.map(ders => {
    const dersAnswers = answers.slice(ders.baslangic, ders.bitis);
    const actualCount = dersAnswers.filter(a => a !== null).length;
    
    return {
      dersKodu: ders.kod,
      dersAdi: ders.ad,
      expectedCount: ders.soruSayisi,
      actualCount,
      cevaplar: dersAnswers,
      isComplete: actualCount >= ders.soruSayisi * 0.8, // %80 yeterli
      warnings: actualCount < ders.soruSayisi * 0.5 
        ? [`${ders.ad}: Çok az cevap (${actualCount}/${ders.soruSayisi})`]
        : [],
    };
  });
}

/**
 * Tek bir öğrenci satırını parse et
 */
function parseStudentLine(
  rawLine: string,
  template: ParseTemplate,
  lineNumber: number,
  expectedTotalQuestions: number,
): ParsedStudentResult {
  const hatalar: string[] = [];
  
  // Varsayılan sonuç
  const result: ParsedStudentResult = {
    ogrenciNo: '',
    ogrenciAdi: '',
    tc: undefined,
    sinifNo: undefined,
    kitapcik: null,
    rawString: rawLine,
    cleanedString: '',
    detectedAnswerCount: 0,
    finalAnswers: [],
    lessonBlocks: [],
    alignmentConfidence: 'CRITICAL',
    reviewStatus: 'REJECTED',
    alignmentWarnings: [],
    satırNo: lineNumber,
    isValid: false,
    hatalar: [],
  };
  
  // Boş satır kontrolü
  if (!rawLine || rawLine.trim().length === 0) {
    hatalar.push('Boş satır');
    result.hatalar = hatalar;
    return result;
  }
  
  // Şablondan öğrenci bilgilerini çıkar
  for (const alan of template.alanTanimlari) {
    const startIdx = alan.baslangic - 1; // 1-indexed to 0-indexed
    const endIdx = alan.bitis;
    
    if (startIdx >= rawLine.length) continue;
    
    const rawValue = rawLine.substring(startIdx, Math.min(endIdx, rawLine.length));
    const trimmedValue = rawValue.trim();
    const fixedValue = fixTurkishChars(trimmedValue);
    
    const alanLower = (alan.alan || '').toLowerCase();
    const labelLower = (alan.label || '').toLowerCase();
    
    if (alanLower.includes('ogrenci_no') || alanLower === 'numara' || labelLower.includes('öğrenci no')) {
      result.ogrenciNo = fixedValue.replace(/\D/g, '') || fixedValue;
    } else if (alanLower.includes('ogrenci_adi') || alanLower.includes('ad_soyad') || labelLower.includes('ad')) {
      result.ogrenciAdi = cleanStudentName(rawValue);
    } else if (alanLower === 'tc' || alanLower.includes('kimlik')) {
      result.tc = fixedValue.replace(/\D/g, '');
    } else if (alanLower.includes('sinif') || labelLower.includes('sınıf')) {
      result.sinifNo = fixedValue;
    } else if (alanLower.includes('kitapcik') || labelLower.includes('kitapçık')) {
      result.kitapcik = parseBooklet(rawValue);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CEVAPLARI ÇIKAR (ENDÜSTRİ STANDARDI)
  // ═══════════════════════════════════════════════════════════════════════════════
  // KRİTİK GÜVENLİK:
  // - Cevapları RAW satırın tamamından okumak YANLIŞ sonuç üretir
  //   (isim/kitapçık alanında geçen A-E harfleri cevap sanılabilir).
  // - Bu yüzden cevapları SADECE şablonda tanımlı cevap alan(lar)ından okuruz.
  //
  // ENDÜSTRİ STANDARDI:
  // - Sadece A B C D E _ geçerli
  // - Diğer her şey atlanır
  // - İlk N geçerli karakter = cevaplar (N = expectedTotalQuestions)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Cevap segmentlerini birleştir (birden fazla ders alanı tanımlanmış olabilir)
  // ⚠️ ÖNEMLİ: Segmentleri başlangıca göre SIRALAMAYIZ.
  // Kullanıcı wizard'da ders sırasını sürükle-bırak ile belirler.
  // Şablonda alanların sırası = cevapların sınav içi sırası kabul edilir.
  // Böylece "Türkçe 52-72, Matematik 112-132" gibi dağınık pozisyonlar olsa bile,
  // kullanıcı hangi dersi önce istiyorsa o sırayla cevap dizisi oluşur.
  const answerSegments = template.alanTanimlari.filter(isAnswerSegmentField);

  if (answerSegments.length === 0) {
    hatalar.push('Şablonda cevap alanı tanımlı değil (CEVAP/CEVAPLAR veya ders alanları yok)');
    result.alignmentWarnings = ['Şablonda cevap alanı bulunamadı; güvenli puanlama için işlem durduruldu'];
    result.finalAnswers = Array.from({ length: expectedTotalQuestions }, () => null);
    result.detectedAnswerCount = 0;
    result.cleanedString = ''.padEnd(expectedTotalQuestions, '_');
    result.lessonBlocks = buildLessonBlocks(result.finalAnswers, LGS_EXAM_STRUCTURE);
    result.alignmentConfidence = 'CRITICAL';
    result.reviewStatus = 'REJECTED';
    result.isValid = false;
    result.hatalar = hatalar;
    return result;
  }

  let mergedAnswerText = '';
  for (const seg of answerSegments) {
    const startIdx = (seg.baslangic ?? 1) - 1;
    const endIdx = seg.bitis ?? seg.baslangic ?? 1;
    if (startIdx < 0 || startIdx >= rawLine.length) continue;
    mergedAnswerText += rawLine.substring(startIdx, Math.min(endIdx, rawLine.length));
    mergedAnswerText += ' '; // segment ayırıcı (ignored)
  }

  result.finalAnswers = extractValidAnswers(mergedAnswerText, expectedTotalQuestions);
  result.detectedAnswerCount = result.finalAnswers.filter(a => a !== null).length;
  result.cleanedString = result.finalAnswers.map(a => a || '_').join('');
  
  // Ders bloklarını oluştur
  result.lessonBlocks = buildLessonBlocks(result.finalAnswers, LGS_EXAM_STRUCTURE);
  
  // Kalite değerlendirmesi
  const warnings: string[] = [];
  
  if (result.detectedAnswerCount < 50) {
    warnings.push(`Çok az cevap tespit edildi: ${result.detectedAnswerCount}/90`);
  }
  if (!result.kitapcik) {
    warnings.push('Kitapçık bilgisi eksik');
  }
  if (!result.ogrenciNo) {
    warnings.push('Öğrenci numarası eksik');
    hatalar.push('Öğrenci numarası eksik');
  }
  if (!result.ogrenciAdi) {
    warnings.push('Öğrenci adı eksik');
    hatalar.push('Öğrenci adı eksik');
  }
  
  result.alignmentWarnings = warnings;
  
  // Confidence ve Status
  if (result.detectedAnswerCount >= 80 && result.kitapcik && result.ogrenciNo && result.ogrenciAdi) {
    result.alignmentConfidence = 'HIGH';
    result.reviewStatus = 'OK';
  } else if (result.detectedAnswerCount >= 60 && result.ogrenciNo) {
    result.alignmentConfidence = 'MEDIUM';
    result.reviewStatus = 'OK';
  } else if (result.detectedAnswerCount >= 40) {
    result.alignmentConfidence = 'LOW';
    result.reviewStatus = 'NEEDS_REVIEW';
  } else {
    result.alignmentConfidence = 'CRITICAL';
    result.reviewStatus = 'REJECTED';
  }
  
  result.isValid = result.reviewStatus !== 'REJECTED' && result.ogrenciNo.length > 0;
  result.hatalar = hatalar;
  
  // Console log
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`📝 Öğrenci ${lineNumber}: ${result.ogrenciNo} (${result.ogrenciAdi})`);
  console.log(`   📊 Tespit: ${result.detectedAnswerCount}/90 | Kitapçık: ${result.kitapcik || '❌'}`);
  console.log(`   📋 Türkçe: ${result.finalAnswers.slice(0, 20).map(a => a || '_').join('')}`);
  console.log(`   📋 Matematik: ${result.finalAnswers.slice(50, 70).map(a => a || '_').join('')}`);
  console.log(`   ✅ Status: ${result.reviewStatus} (${result.alignmentConfidence})`);
  
  return result;
}

// ════════════════════════════════════════════════════════════════════════════════
// ANA EXPORT FONKSİYONLARI
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tüm TXT dosyasını parse et
 * 
 * ENDÜSTRİ STANDARDI UYGULANIR:
 * - Sadece A B C D E _ geçerli
 * - İlk 90 geçerli karakter = cevaplar
 * - Dersler INDEX'e göre bölünür
 */
export function parseOpticalFile(
  fileContent: string,
  template: ParseTemplate,
  examStructure: ExamStructure = LGS_EXAM_STRUCTURE,
): BatchParseResult {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 AKADEMİHUB OPTİK PARSE MOTORU (FINAL)');
  console.log('   ✨ Endüstri Standardı: Sadece A B C D E _ geçerli');
  console.log('   ✨ İlk 90 geçerli karakter = sınav cevapları');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const lines = fileContent.replace(/\r\n/g, '\n').split('\n');
  const validLines = lines.filter(l => l && l.trim().length > 0);
  
  console.log(`📋 Şablon: ${template.sablonAdi}`);
  console.log(`📊 Toplam Satır: ${validLines.length}`);
  const expectedTotal = Number(examStructure?.toplamSoru || template.toplamSoru || DEFAULT_TOTAL_QUESTIONS);
  console.log(`🎯 Beklenen Soru: ${expectedTotal}`);
  
  // Her satırı parse et
  const students: ParsedStudentResult[] = [];
  
  for (let i = 0; i < validLines.length; i++) {
    const line = validLines[i];
    const result = parseStudentLine(line, template, i + 1, expectedTotal);
    students.push(result);
  }
  
  // İstatistikler
  const successCount = students.filter(s => s.reviewStatus === 'OK').length;
  const needsReviewCount = students.filter(s => s.reviewStatus === 'NEEDS_REVIEW').length;
  const rejectedCount = students.filter(s => s.reviewStatus === 'REJECTED').length;
  const avgConfidence = students.length > 0
    ? students.reduce((sum, s) => {
        const conf = s.alignmentConfidence === 'HIGH' ? 1 : 
                     s.alignmentConfidence === 'MEDIUM' ? 0.75 :
                     s.alignmentConfidence === 'LOW' ? 0.5 : 0.25;
        return sum + conf;
      }, 0) / students.length
    : 0;
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log('📊 PARSE SONUÇLARI');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`✅ Başarılı (AUTO): ${successCount}`);
  console.log(`🟡 İnceleme Gerekli (REVIEW): ${needsReviewCount}`);
  console.log(`❌ Reddedildi (REJECT): ${rejectedCount}`);
  console.log(`📈 Ortalama Güven: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  const batchWarnings: string[] = [];
  if (rejectedCount > 0) {
    batchWarnings.push(`${rejectedCount} öğrenci puanlamaya dahil edilmeyecek (REJECTED)`);
  }
  
  return {
    students,
    stats: {
      totalLines: validLines.length,
      successCount,
      needsReviewCount,
      rejectedCount,
      averageConfidence: avgConfidence,
    },
    warnings: batchWarnings,
  };
}

/**
 * Yeni format sonucunu eski ParsedOptikSatir formatına dönüştür
 */
export function toOptikSatir(result: ParsedStudentResult): ParsedOptikSatir {
  return {
    satırNo: result.satırNo,
    hamVeri: result.rawString,
    sinifNo: result.sinifNo,
    ogrenciNo: result.ogrenciNo,
    ogrenciAdi: result.ogrenciAdi,
    tc: result.tc,
    kitapcik: result.kitapcik || undefined,
    cevaplar: result.finalAnswers,
    hatalar: result.hatalar,
    isValid: result.isValid,
  };
}

/**
 * Batch sonucu eski formata dönüştür
 */
export function toBatchOptikSatir(batchResult: BatchParseResult): ParsedOptikSatir[] {
  return batchResult.students.map(toOptikSatir);
}
