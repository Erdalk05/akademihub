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
  
  /** Final cevap dizisi (90 eleman) - backward compatibility */
  finalAnswers: (string | null)[];
  
  /** 
   * ═══════════════════════════════════════════════════════════════════════════
   * KRİTİK: DERS BAZLI CEVAPLAR (FORM-AGNOSTIC)
   * ═══════════════════════════════════════════════════════════════════════════
   * Her ders için ayrı cevap dizisi.
   * Key = Ders kodu (TUR, MAT, FEN, INK, DIN, ING, vb.)
   * Value = O dersin cevapları (string | null)[]
   * 
   * Scoring motoru bu map'i kullanarak kendi sırasına göre cevapları alır.
   * Böylece optik form tanımındaki ders sırası ile scoring sırası bağımsız olur.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  lessonAnswers: Record<string, (string | null)[]>;
  
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
 * Cevapları sabit genişlikli (fixed-width) slot mantığı ile çıkar.
 *
 * KRİTİK GERÇEK:
 * - Optik TXT'lerde cevap alanı çoğu zaman "90 karakterlik bir blok"tur.
 * - Bu blok içinde "boş cevap" genellikle '_' değil, SPACE ile temsil edilir.
 *
 * KURAL (GÜVENLİ):
 * - Segment içindeki HER karakter = 1 soru slotu
 * - A/B/C/D/E → cevap
 * - '_' → boş (null)
 * - SPACE veya diğer her şey → boş (null)
 *
 * Böylece 90 slot her zaman doğru sayılır; "60 cevaplandı" gibi durumlar gerçek boşları temsil eder.
 */
function extractAnswersFromFixedSegments(
  rawLine: string,
  segments: Array<{ baslangic: number; bitis: number; label: string }>,
  expectedTotalQuestions: number,
): { answers: (string | null)[]; warnings: string[]; slotCount: number } {
  const warnings: string[] = [];
  const out: (string | null)[] = [];
  let invalidCharCount = 0;

  for (const seg of segments) {
    const startIdx = (seg.baslangic ?? 1) - 1;
    const endIdx = seg.bitis ?? seg.baslangic ?? 1;
    const segLen = Math.max(0, endIdx - (seg.baslangic ?? 1) + 1);
    if (segLen <= 0) continue;
    if (startIdx < 0 || startIdx >= rawLine.length) {
      // Segment satır dışında kalıyorsa, tüm slotları boş say
      for (let i = 0; i < segLen; i++) out.push(null);
      warnings.push(`Segment satır dışında: "${seg.label}" (${seg.baslangic}-${seg.bitis})`);
      continue;
    }

    const slice = rawLine.substring(startIdx, Math.min(endIdx, rawLine.length)).toUpperCase();
    // Eksikse sağdan boşlukla tamamla (slotları koru)
    const padded = slice.padEnd(segLen, ' ');

    for (let i = 0; i < segLen; i++) {
      const ch = padded[i] ?? ' ';
      if (VALID_ANSWER_CHARS.has(ch)) {
        out.push(ch);
      } else if (ch === BLANK_CHAR) {
        out.push(null);
      } else {
        // SPACE / diğer → boş
        if (ch !== ' ' && ch !== '\t') invalidCharCount++;
        out.push(null);
      }
    }
  }

  const slotCount = out.length;
  if (slotCount !== expectedTotalQuestions) {
    warnings.push(`Cevap slot sayısı uyuşmuyor: bulunan=${slotCount}, beklenen=${expectedTotalQuestions}`);
  }
  if (invalidCharCount > 0) {
    warnings.push(`Cevap alanında ${invalidCharCount} adet beklenmeyen karakter boş sayıldı`);
  }

  // Slot sayısı azsa null ile tamamla (ama uyarı zaten var)
  while (out.length < expectedTotalQuestions) out.push(null);
  // Fazlaysa kes (ama uyarı var)
  if (out.length > expectedTotalQuestions) out.length = expectedTotalQuestions;

  return { answers: out, warnings, slotCount };
}

/**
 * Şablondaki alanlardan "cevap segmenti" olanları bul.
 * - alan='cevaplar' ise kesin cevap segmentidir
 * - veya label ders/cevap alanı içeriyorsa (TÜRKÇE, MATEMATİK, FEN, SOSYAL, vb.)
 *
 * Amaç: İsim/kitapçık gibi alanlarda geçen A-E harflerini KESİNLİKLE cevap sanmamak.
 */
function isAnswerSegmentField(alan: { alan: string; label: string }): boolean {
  // ⚠️ Türkçe 'İ' harfi toLowerCase() sonrası "i̇" (i + combining dot) üretebilir.
  // Bu da "ingilizce/inkilap/din" gibi contains kontrollerini BOZAR.
  // Çözüm: normalize + diacritic temizle + lowercase ile karşılaştır.
  const normalizeForMatch = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // combining marks (örn: i̇ → i)

  const a = normalizeForMatch(alan.alan || '');
  const l = normalizeForMatch(alan.label || '');

  // Kimlik/TC alanı asla cevap segmenti değildir
  if (a === 'tc' || l.includes('kimlik')) return false;

  if (a === 'cevaplar' || a.includes('cevap')) return true;

  // Ders alanları (kullanıcı ders ders tanımlayabiliyor)
  const dersKeywords = [
    'turkce',
    'matematik',
    'fen',
    'inkilap', 'ataturk',
    'din',
    'ingilizce', 'yabanci', 'dil',
    'sosyal',
    'tarih',
    'cografya',
    'fizik',
    'kimya',
    'biyoloji',
    'edebiyat',
    'felsefe',
    // Bazı kurumlar ders adını "T.C." diye kısaltabiliyor
    't.c', 't.c.', 'tc.',
  ];
  return dersKeywords.some(k => l.includes(k));
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DERS KODU TESPİTİ (FORM-AGNOSTIC)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Optik form tanımındaki label'dan ders kodunu çıkar.
 * Böylece "Türkçe", "TÜRKÇE", "turkce" hepsi → "TUR" olur.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
function extractLessonCodeFromLabel(label: string): string | null {
  const normalized = (label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, ''); // sadece ASCII harfler

  // ✅ Özel durum: UI'da "T.C." dersi çoğu yerde sadece "TC" / "T.C" diye kısaltılıyor.
  // Bu alan TC KİMLİK değildir (tc kimlik alanı isAnswerSegmentField ile dışarıda tutulur).
  // Bu yüzden "tc" tek başına geldiğinde INK kabul ediyoruz.
  if (normalized === 'tc' || normalized === 'tctarihi' || normalized.includes('tcink')) {
    return 'INK';
  }

  // Ders eşleştirme tablosu
  const mappings: [string[], string][] = [
    [['turkce', 'turk'], 'TUR'],
    [['matematik', 'mat'], 'MAT'],
    [['fen', 'fenbilimleri', 'fenbilgisi'], 'FEN'],
    [['inkilap', 'ataturk', 'tcinkilap'], 'INK'],
    [['din', 'dinkulturu', 'dinkulturuvea'], 'DIN'],
    [['ingilizce', 'yabancidil', 'ing'], 'ING'],
    [['sosyal', 'sosyalbilgiler'], 'SOS'],
    [['tarih'], 'TAR'],
    [['cografya', 'cograf'], 'COG'],
    [['fizik'], 'FIZ'],
    [['kimya'], 'KIM'],
    [['biyoloji', 'biyo'], 'BIY'],
    [['edebiyat'], 'EDE'],
    [['felsefe'], 'FEL'],
  ];

  for (const [keywords, code] of mappings) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        return code;
      }
    }
  }

  return null;
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
    lessonAnswers: {},
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
  // CEVAPLARI ÇIKAR (FORM-AGNOSTIC ENDÜSTRİ STANDARDI)
  // ═══════════════════════════════════════════════════════════════════════════════
  // KRİTİK PRENSIP:
  // - Her optik formun ders sırası FARKLI olabilir
  // - SABİT slicing YASAK
  // - Her ders için AYRI slice yapılır ve lessonAnswers map'ine atılır
  // - Scoring motoru bu map'i kullanarak kendi sırasına göre cevapları alır
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const answerSegments = template.alanTanimlari.filter(isAnswerSegmentField);

  if (answerSegments.length === 0) {
    hatalar.push('Şablonda cevap alanı tanımlı değil (CEVAP/CEVAPLAR veya ders alanları yok)');
    result.alignmentWarnings = ['Şablonda cevap alanı bulunamadı; güvenli puanlama için işlem durduruldu'];
    result.finalAnswers = Array.from({ length: expectedTotalQuestions }, () => null);
    result.lessonAnswers = {};
    result.detectedAnswerCount = 0;
    result.cleanedString = ''.padEnd(expectedTotalQuestions, '_');
    result.lessonBlocks = buildLessonBlocks(result.finalAnswers, LGS_EXAM_STRUCTURE);
    result.alignmentConfidence = 'CRITICAL';
    result.reviewStatus = 'REJECTED';
    result.isValid = false;
    result.hatalar = hatalar;
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DERS BAZLI SLICE (KRİTİK)
  // ═══════════════════════════════════════════════════════════════════════════════
  const lessonAnswers: Record<string, (string | null)[]> = {};
  const allAnswers: (string | null)[] = [];
  const segmentWarnings: string[] = [];
  
  // [OPTIK-FORM] LOG BAŞLANGIÇ
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('[OPTIK-FORM] DERS BAZLI SLICE');
  console.log('═══════════════════════════════════════════════════════════════');

  for (const seg of answerSegments) {
    const startIdx = (seg.baslangic ?? 1) - 1;
    const endIdx = seg.bitis ?? seg.baslangic ?? 1;
    const segLen = Math.max(0, endIdx - (seg.baslangic ?? 1) + 1);
    
    if (segLen <= 0) continue;
    
    // Ders kodunu label'dan çıkar
    const lessonCode = extractLessonCodeFromLabel(seg.label);
    
    // Segment cevaplarını çıkar
    const segAnswers: (string | null)[] = [];
    
    if (startIdx >= 0 && startIdx < rawLine.length) {
      const slice = rawLine.substring(startIdx, Math.min(endIdx, rawLine.length)).toUpperCase();
      const padded = slice.padEnd(segLen, ' ');
      
      for (let i = 0; i < segLen; i++) {
        const ch = padded[i] ?? ' ';
        if (VALID_ANSWER_CHARS.has(ch)) {
          segAnswers.push(ch);
        } else if (ch === BLANK_CHAR) {
          segAnswers.push(null);
        } else {
          segAnswers.push(null); // SPACE veya diğer → boş
        }
      }
    } else {
      // Segment satır dışında
      for (let i = 0; i < segLen; i++) segAnswers.push(null);
      segmentWarnings.push(`Segment satır dışında: "${seg.label}" (${seg.baslangic}-${seg.bitis})`);
    }
    
    // Ders koduna göre kaydet
    if (lessonCode) {
      // ✅ Aynı ders birden fazla segmentte gelebilir (örn: TUR 10 + TUR 10).
      // Overwrite etmek yerine CONCAT yapıyoruz; aksi halde TUR=10 gibi eksik okuma olur.
      const prev = lessonAnswers[lessonCode] || [];
      lessonAnswers[lessonCode] = [...prev, ...segAnswers];
      console.log(
        `   ${lessonCode}=${lessonAnswers[lessonCode].length} (+${segLen}) (${seg.label}: ${seg.baslangic}-${seg.bitis})`,
      );
    } else {
      // Ders kodu bulunamadı - genel cevaplar alanı olabilir
      console.log(`   ???=${segLen} (${seg.label}: ${seg.baslangic}-${seg.bitis}) - Ders kodu tespit edilemedi`);
    }
    
    // Genel diziye ekle (backward compatibility için)
    allAnswers.push(...segAnswers);
  }
  
  // Toplam soru sayısı kontrolü
  const totalSlots = Object.values(lessonAnswers).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`   TOTAL=${totalSlots}`);
  
  if (totalSlots !== expectedTotalQuestions) {
    segmentWarnings.push(`Cevap slot sayısı uyuşmuyor: bulunan=${totalSlots}, beklenen=${expectedTotalQuestions}`);
    console.warn(`[OPTIK-FORM] ⚠️ SLOT MISMATCH: ${totalSlots} ≠ ${expectedTotalQuestions}`);
  }
  console.log('═══════════════════════════════════════════════════════════════');

  // finalAnswers için pad/trim
  let finalAnswers = allAnswers.slice(0, expectedTotalQuestions);
  while (finalAnswers.length < expectedTotalQuestions) finalAnswers.push(null);

  result.finalAnswers = finalAnswers;
  result.lessonAnswers = lessonAnswers;
  result.detectedAnswerCount = finalAnswers.filter(a => a !== null).length;
  result.cleanedString = finalAnswers.map(a => a || '_').join('');
  
  // Ders bloklarını oluştur
  result.lessonBlocks = buildLessonBlocks(result.finalAnswers, LGS_EXAM_STRUCTURE);
  
  // Kalite değerlendirmesi
  const warnings: string[] = [];
  
  if (result.detectedAnswerCount < 50) {
    warnings.push(`Çok az cevap tespit edildi: ${result.detectedAnswerCount}/90`);
  }
  if (segmentWarnings.length > 0) {
    segmentWarnings.forEach(w => warnings.push(w));
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
  if (totalSlots !== expectedTotalQuestions) {
    console.warn(`   ⚠️ SLOT UYARI: slotCount=${totalSlots} expected=${expectedTotalQuestions}`);
  }
  if (segmentWarnings.length > 0) {
    console.warn(`   ⚠️ CEVAP ALANI UYARILARI: ${segmentWarnings.join(' | ')}`);
  }
  // Ders bazlı cevapları göster (lessonAnswers kullan)
  const turAnswers = result.lessonAnswers['TUR'] || result.finalAnswers.slice(0, 20);
  const matAnswers = result.lessonAnswers['MAT'] || result.finalAnswers.slice(50, 70);
  console.log(`   📋 Türkçe: ${turAnswers.map(a => a || '_').join('')}`);
  console.log(`   📋 Matematik: ${matAnswers.map(a => a || '_').join('')}`);
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
    // ═══════════════════════════════════════════════════════════════════════════
    // FORM-AGNOSTIC: DERS BAZLI CEVAPLAR
    // ═══════════════════════════════════════════════════════════════════════════
    lessonAnswers: Object.keys(result.lessonAnswers).length > 0 ? result.lessonAnswers : undefined,
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
