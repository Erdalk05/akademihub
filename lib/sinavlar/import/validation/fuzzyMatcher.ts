/**
 * ============================================
 * AkademiHub - Fuzzy Matcher
 * ============================================
 * 
 * PHASE 8.2 - UX Refinement
 * 
 * BU DOSYA:
 * - İsim benzerliği (Levenshtein Distance)
 * - Öğrenci numarası benzerliği
 * - Türkçe karakter normalizasyonu
 * - "Anne Testi" uyumlu öneriler
 * 
 * AMAÇ:
 * Öğretmen Excel'de "Ahmet Yılmaz" yazsa,
 * sistemde "AHMET YILMAZ" varsa eşleşmeli.
 */

// ==================== TYPES ====================

export interface FuzzyMatchResult {
  /** Eşleşme skoru (0-100) */
  score: number;
  
  /** Eşleşme tipi */
  matchType: 'exact' | 'high' | 'medium' | 'low' | 'no_match';
  
  /** Normalize edilmiş kaynak */
  normalizedSource: string;
  
  /** Normalize edilmiş hedef */
  normalizedTarget: string;
  
  /** Kullanıcı dostu açıklama */
  explanation: string;
}

export interface FuzzyMatchCandidate<T> {
  /** Aday item */
  item: T;
  
  /** Eşleşme sonucu */
  match: FuzzyMatchResult;
}

export interface FuzzyMatchOptions {
  /** Minimum kabul edilebilir skor (varsayılan: 60) */
  minScore?: number;
  
  /** Maximum döndürülecek aday sayısı (varsayılan: 5) */
  maxCandidates?: number;
  
  /** Büyük/küçük harf duyarlılığı (varsayılan: false) */
  caseSensitive?: boolean;
  
  /** Türkçe karakter normalizasyonu (varsayılan: true) */
  normalizeTurkish?: boolean;
}

// ==================== CONSTANTS ====================

const DEFAULT_OPTIONS: Required<FuzzyMatchOptions> = {
  minScore: 60,
  maxCandidates: 5,
  caseSensitive: false,
  normalizeTurkish: true
};

/** Türkçe karakter dönüşüm tablosu */
const TURKISH_CHAR_MAP: Record<string, string> = {
  'ı': 'i',
  'İ': 'I',
  'ğ': 'g',
  'Ğ': 'G',
  'ü': 'u',
  'Ü': 'U',
  'ş': 's',
  'Ş': 'S',
  'ö': 'o',
  'Ö': 'O',
  'ç': 'c',
  'Ç': 'C'
};

/** Yaygın isim kısaltmaları */
const NAME_ABBREVIATIONS: Record<string, string[]> = {
  'mehmet': ['mhmt', 'mhmed'],
  'ahmet': ['ahmd', 'ahmed'],
  'mustafa': ['mstf', 'mstfa'],
  'fatma': ['ftm', 'fatm'],
  'ayşe': ['ayse', 'ays'],
  'muhammed': ['mhmd', 'muhammet', 'mehmed']
};

// ==================== NORMALIZATION ====================

/**
 * Metni karşılaştırma için normalize eder
 */
export function normalizeText(
  text: string,
  options: Pick<FuzzyMatchOptions, 'caseSensitive' | 'normalizeTurkish'> = {}
): string {
  if (!text) return '';
  
  let normalized = text.trim();
  
  // Türkçe karakterleri normalize et
  if (options.normalizeTurkish !== false) {
    for (const [turkish, latin] of Object.entries(TURKISH_CHAR_MAP)) {
      normalized = normalized.replace(new RegExp(turkish, 'g'), latin);
    }
  }
  
  // Büyük/küçük harf
  if (!options.caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  
  // Fazla boşlukları temizle
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Özel karakterleri kaldır
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  return normalized;
}

/**
 * İsmi parçalara ayırır (ad, soyad)
 */
export function splitName(fullName: string): { firstName: string; lastName: string; parts: string[] } {
  const parts = normalizeText(fullName).split(' ').filter(Boolean);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '', parts: [] };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '', parts };
  }
  
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
    parts
  };
}

// ==================== LEVENSHTEIN DISTANCE ====================

/**
 * İki string arasındaki Levenshtein mesafesini hesaplar
 * (Minimum düzenleme sayısı)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  if (str1 === str2) return 0;
  if (!str1) return str2.length;
  if (!str2) return str1.length;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Optimizasyon: kısa string her zaman str1
  if (len1 > len2) {
    [str1, str2] = [str2, str1];
  }
  
  const prevRow = Array(len2 + 1).fill(0).map((_, i) => i);
  
  for (let i = 1; i <= str1.length; i++) {
    let prev = i;
    for (let j = 1; j <= str2.length; j++) {
      const curr = str1[i - 1] === str2[j - 1]
        ? prevRow[j - 1]
        : Math.min(prevRow[j - 1], prev, prevRow[j]) + 1;
      prevRow[j - 1] = prev;
      prev = curr;
    }
    prevRow[str2.length] = prev;
  }
  
  return prevRow[str2.length];
}

/**
 * İki string arasındaki benzerlik skorunu hesaplar (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100;
  if (!str1 || !str2) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  
  return Math.round((1 - distance / maxLen) * 100);
}

// ==================== NAME MATCHING ====================

/**
 * İki ismi karşılaştırır
 */
export function matchNames(
  source: string,
  target: string,
  options: FuzzyMatchOptions = {}
): FuzzyMatchResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const normalizedSource = normalizeText(source, opts);
  const normalizedTarget = normalizeText(target, opts);
  
  // Tam eşleşme
  if (normalizedSource === normalizedTarget) {
    return {
      score: 100,
      matchType: 'exact',
      normalizedSource,
      normalizedTarget,
      explanation: 'Tam eşleşme'
    };
  }
  
  // Parçalara ayır
  const sourceParts = splitName(source);
  const targetParts = splitName(target);
  
  // İsim parçalarını karşılaştır
  let totalScore = 0;
  let matchCount = 0;
  
  // Ad eşleşmesi
  if (sourceParts.firstName && targetParts.firstName) {
    const firstNameScore = calculateSimilarity(sourceParts.firstName, targetParts.firstName);
    totalScore += firstNameScore * 0.5; // %50 ağırlık
    matchCount++;
    
    // Kısaltma kontrolü
    if (firstNameScore < 70) {
      const abbreviations = NAME_ABBREVIATIONS[targetParts.firstName] || [];
      if (abbreviations.some(abbr => sourceParts.firstName.includes(abbr))) {
        totalScore += 20;
      }
    }
  }
  
  // Soyad eşleşmesi
  if (sourceParts.lastName && targetParts.lastName) {
    const lastNameScore = calculateSimilarity(sourceParts.lastName, targetParts.lastName);
    totalScore += lastNameScore * 0.5; // %50 ağırlık
    matchCount++;
  }
  
  // Genel benzerlik (yedek)
  if (matchCount === 0) {
    totalScore = calculateSimilarity(normalizedSource, normalizedTarget);
  }
  
  const score = Math.round(Math.min(totalScore, 100));
  
  return {
    score,
    matchType: getMatchType(score),
    normalizedSource,
    normalizedTarget,
    explanation: getMatchExplanation(score, sourceParts, targetParts)
  };
}

// ==================== NUMBER MATCHING ====================

/**
 * İki numarayı karşılaştırır (öğrenci no, TC no)
 */
export function matchNumbers(
  source: string,
  target: string
): FuzzyMatchResult {
  // Sadece rakamları al
  const sourceDigits = source.replace(/\D/g, '');
  const targetDigits = target.replace(/\D/g, '');
  
  // Tam eşleşme
  if (sourceDigits === targetDigits) {
    return {
      score: 100,
      matchType: 'exact',
      normalizedSource: sourceDigits,
      normalizedTarget: targetDigits,
      explanation: 'Tam eşleşme'
    };
  }
  
  // Başlangıç/bitiş kontrolü
  if (sourceDigits.startsWith(targetDigits) || targetDigits.startsWith(sourceDigits)) {
    const shorter = Math.min(sourceDigits.length, targetDigits.length);
    const longer = Math.max(sourceDigits.length, targetDigits.length);
    const score = Math.round((shorter / longer) * 100);
    
    return {
      score,
      matchType: getMatchType(score),
      normalizedSource: sourceDigits,
      normalizedTarget: targetDigits,
      explanation: 'Kısmi eşleşme (başlangıç)'
    };
  }
  
  // Levenshtein
  const score = calculateSimilarity(sourceDigits, targetDigits);
  
  return {
    score,
    matchType: getMatchType(score),
    normalizedSource: sourceDigits,
    normalizedTarget: targetDigits,
    explanation: score >= 80 ? 'Yazım hatası olabilir' : 'Düşük benzerlik'
  };
}

// ==================== CANDIDATE FINDING ====================

/**
 * Bir listeden en benzer adayları bulur
 */
export function findBestMatches<T>(
  source: string,
  candidates: T[],
  getTargetValue: (item: T) => string,
  matchFn: (source: string, target: string) => FuzzyMatchResult,
  options: FuzzyMatchOptions = {}
): FuzzyMatchCandidate<T>[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const results: FuzzyMatchCandidate<T>[] = [];
  
  for (const item of candidates) {
    const targetValue = getTargetValue(item);
    const match = matchFn(source, targetValue);
    
    if (match.score >= opts.minScore) {
      results.push({ item, match });
    }
  }
  
  // Skora göre sırala
  results.sort((a, b) => b.match.score - a.match.score);
  
  // Max sayıya göre kes
  return results.slice(0, opts.maxCandidates);
}

/**
 * İsim ile en benzer öğrencileri bulur
 */
export function findStudentsByName<T extends { fullName: string }>(
  searchName: string,
  students: T[],
  options: FuzzyMatchOptions = {}
): FuzzyMatchCandidate<T>[] {
  return findBestMatches(
    searchName,
    students,
    (s) => s.fullName,
    matchNames,
    options
  );
}

/**
 * Numara ile en benzer öğrencileri bulur
 */
export function findStudentsByNumber<T extends { studentNo: string }>(
  searchNumber: string,
  students: T[],
  options: FuzzyMatchOptions = {}
): FuzzyMatchCandidate<T>[] {
  return findBestMatches(
    searchNumber,
    students,
    (s) => s.studentNo,
    matchNumbers,
    options
  );
}

// ==================== HELPERS ====================

function getMatchType(score: number): FuzzyMatchResult['matchType'] {
  if (score >= 100) return 'exact';
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  if (score >= 50) return 'low';
  return 'no_match';
}

function getMatchExplanation(
  score: number,
  source: ReturnType<typeof splitName>,
  target: ReturnType<typeof splitName>
): string {
  if (score >= 100) return 'Tam eşleşme';
  if (score >= 90) return 'Çok yüksek benzerlik';
  if (score >= 80) return 'Muhtemelen aynı kişi';
  if (score >= 70) return 'Benzer isim bulundu';
  if (score >= 60) return 'Kısmi benzerlik';
  return 'Düşük benzerlik';
}

// ==================== COLUMN NAME MATCHING ====================

/** Kolon ismi için bilinen alias'lar */
const COLUMN_ALIASES: Record<string, string[]> = {
  'student_no': ['no', 'numara', 'öğrenci no', 'ogrenci no', 'student no', 'okul no', 'sıra no', 'sira no'],
  'full_name': ['ad', 'isim', 'ad soyad', 'adsoyad', 'isim soyisim', 'öğrenci adı', 'name'],
  'first_name': ['ad', 'isim', 'first name', 'adi'],
  'last_name': ['soyad', 'soyisim', 'soyadı', 'last name'],
  'class': ['sınıf', 'sinif', 'class', 'şube'],
  'tc_no': ['tc', 'tc no', 'tc kimlik', 'kimlik no', 'tckn'],
  'booklet_type': ['kitapçık', 'kitapcik', 'booklet', 'tip', 'tür']
};

/**
 * Kolon ismini eşleştirir
 * "Anne Testi" uyumlu - öğretmenin anlaması gereken dil
 */
export function matchColumnName(
  columnName: string
): { type: string; confidence: number; suggestion: string } | null {
  const normalized = normalizeText(columnName);
  
  for (const [type, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      
      // Tam eşleşme
      if (normalized === normalizedAlias) {
        return {
          type,
          confidence: 100,
          suggestion: getColumnSuggestion(type)
        };
      }
      
      // İçerme
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        return {
          type,
          confidence: 85,
          suggestion: getColumnSuggestion(type)
        };
      }
      
      // Fuzzy
      const score = calculateSimilarity(normalized, normalizedAlias);
      if (score >= 75) {
        return {
          type,
          confidence: score,
          suggestion: getColumnSuggestion(type)
        };
      }
    }
  }
  
  // Soru numarası kontrolü
  const questionMatch = normalized.match(/^(?:s|soru\s*)?(\d+)$/);
  if (questionMatch) {
    return {
      type: 'answer',
      confidence: 95,
      suggestion: `${questionMatch[1]}. soru cevabı`
    };
  }
  
  return null;
}

function getColumnSuggestion(type: string): string {
  const suggestions: Record<string, string> = {
    'student_no': 'Öğrenci numarası olarak kullanılacak',
    'full_name': 'Öğrenci adı soyadı olarak kullanılacak',
    'first_name': 'Öğrenci adı olarak kullanılacak',
    'last_name': 'Öğrenci soyadı olarak kullanılacak',
    'class': 'Sınıf bilgisi olarak kullanılacak',
    'tc_no': 'TC Kimlik numarası olarak kullanılacak',
    'booklet_type': 'Kitapçık tipi olarak kullanılacak',
    'answer': 'Soru cevabı olarak kullanılacak'
  };
  
  return suggestions[type] || 'Bilinmeyen tip';
}

// ==================== EXPORT ====================

export default {
  // Normalization
  normalizeText,
  splitName,
  
  // Distance
  levenshteinDistance,
  calculateSimilarity,
  
  // Matching
  matchNames,
  matchNumbers,
  matchColumnName,
  
  // Candidate finding
  findBestMatches,
  findStudentsByName,
  findStudentsByNumber
};

