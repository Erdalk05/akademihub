/**
 * ============================================
 * AkademiHub - OCR Error Correction Engine
 * ============================================
 * 
 * Optik okuyucuların Türkçe karakter hatalarını düzeltir
 * 
 * GERÇEK ÖRNEKLER:
 * - wİNAR → İNAR (w = İ)
 * - KIL+O → KILIÇO (+ = Ç)
 * - +ZCAN → ÖZCAN (+ = Ö başta)
 * - TA$DEMİR → TAŞDEMİR ($ = Ş)
 * - O6UZ → OĞUZ (6 = Ğ)
 * 
 * PRENSİP: Context-aware düzeltme
 * - + kelime başında → Ö
 * - + kelime ortasında → Ç
 */

// ==================== CHARACTER MAPS ====================

/**
 * OCR hata haritası - Optik okuyucunun yanlış okuduğu karakterler
 */
export const OCR_ERROR_MAP: Record<string, string> = {
  // Kesin değişimler
  'w': 'İ',      // wİNAR → İNAR
  'W': 'İ',      // WİNAR → İNAR
  '$': 'Ş',      // TA$DEMİR → TAŞDEMİR
  '6': 'Ğ',      // O6UZ → OĞUZ
  '«': 'İ',      // «NAR → İNAR (encoding hatası)
  '»': 'İ',      // encoding hatası
  'ı': 'I',      // Küçük ı → Büyük I (isimler büyük harf)
};

/**
 * Context-aware karakterler - Pozisyona göre değişir
 */
export const CONTEXT_AWARE_CHARS: Record<string, { start: string; middle: string; end: string }> = {
  '+': { start: 'Ö', middle: 'Ç', end: 'Ç' },  // +ZCAN → ÖZCAN, KIL+O → KILIÇO
  '0': { start: 'O', middle: 'O', end: 'O' },  // Context'e göre O veya Ö
  '1': { start: 'İ', middle: 'I', end: 'I' },  // 1NAR → İNAR, ERDA1 → ERDAL? (dikkat!)
};

/**
 * Türkçe isim düzeltmeleri - Yaygın OCR hataları
 */
export const COMMON_NAME_FIXES: Record<string, string> = {
  // Yaygın hatalar
  'KILI+O': 'KILIÇO',
  'KIL+': 'KILIÇ',
  '+ZCAN': 'ÖZCAN',
  '+ZEL': 'ÖZEL',
  '+ZTÜRK': 'ÖZTÜRK',
  '+ZMEN': 'ÖZMEN',
  '+ZDEM+R': 'ÖZDEMİR',
  'TA$': 'TAŞ',
  '$AH+N': 'ŞAHİN',
  '$EKER': 'ŞEKER',
  'O6LU': 'OĞLU',
  'O6UZ': 'OĞUZ',
  'DO6AN': 'DOĞAN',
  'ERDO6AN': 'ERDOĞAN',
  'G+NE$': 'GÜNEŞ',
  '+NAL': 'ÜNAL',
  '+M+T': 'ÜMIT',
};

// ==================== MAIN FUNCTIONS ====================

/**
 * Ana OCR düzeltme fonksiyonu
 * Tüm Türkçe karakter hatalarını düzeltir
 */
export function correctOCRErrors(text: string): string {
  if (!text) return text;
  
  let corrected = text.trim();
  
  // 1. Önce yaygın isimleri düzelt (tam eşleşme)
  for (const [wrong, correct] of Object.entries(COMMON_NAME_FIXES)) {
    corrected = corrected.replace(new RegExp(escapeRegex(wrong), 'gi'), correct);
  }
  
  // 2. Basit karakter değişimleri
  for (const [wrong, correct] of Object.entries(OCR_ERROR_MAP)) {
    corrected = corrected.replace(new RegExp(escapeRegex(wrong), 'g'), correct);
  }
  
  // 3. Context-aware düzeltmeler
  corrected = applyContextAwareCorrections(corrected);
  
  // 4. Son temizlik
  corrected = finalCleanup(corrected);
  
  return corrected;
}

/**
 * Context-aware düzeltmeler
 * Karakterin pozisyonuna göre farklı düzeltme yapar
 */
function applyContextAwareCorrections(text: string): string {
  let result = '';
  const words = text.split(/\s+/);
  
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    let correctedWord = '';
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const contextChar = CONTEXT_AWARE_CHARS[char];
      
      if (contextChar) {
        if (i === 0) {
          // Kelime başı
          correctedWord += contextChar.start;
        } else if (i === word.length - 1) {
          // Kelime sonu
          correctedWord += contextChar.end;
        } else {
          // Kelime ortası
          correctedWord += contextChar.middle;
        }
      } else {
        correctedWord += char;
      }
    }
    
    result += (w > 0 ? ' ' : '') + correctedWord;
  }
  
  return result;
}

/**
 * Son temizlik - Kalan hataları düzelt
 */
function finalCleanup(text: string): string {
  let result = text;
  
  // Çift boşlukları tek boşluk yap
  result = result.replace(/\s+/g, ' ');
  
  // Başta ve sonda boşlukları kaldır
  result = result.trim();
  
  // Ardışık aynı karakterleri düzelt (örn: ŞŞAHİN → ŞAHİN)
  result = result.replace(/(.)\1{2,}/g, '$1$1');
  
  // Türkçe karakter düzeltmeleri
  result = result
    .replace(/İİ/g, 'İ')
    .replace(/ÇÇ/g, 'Ç')
    .replace(/ŞŞ/g, 'Ş')
    .replace(/ĞĞ/g, 'Ğ')
    .replace(/ÖÖ/g, 'Ö')
    .replace(/ÜÜ/g, 'Ü');
  
  return result;
}

/**
 * Regex için özel karakterleri escape et
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== HELPER FUNCTIONS ====================

/**
 * İki isim arasındaki benzerliği hesapla (Türkçe destekli)
 */
export function calculateTurkishSimilarity(name1: string, name2: string): number {
  // Önce OCR düzeltmesi yap
  const corrected1 = correctOCRErrors(name1).toUpperCase();
  const corrected2 = correctOCRErrors(name2).toUpperCase();
  
  // Türkçe karakter normalizasyonu
  const normalized1 = normalizeTurkish(corrected1);
  const normalized2 = normalizeTurkish(corrected2);
  
  // Levenshtein distance hesapla
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 1;
  
  const similarity = 1 - (distance / maxLength);
  return Math.round(similarity * 100) / 100;
}

/**
 * Türkçe karakterleri normalize et (karşılaştırma için)
 */
export function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * Levenshtein distance hesapla
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Silme
        dp[i][j - 1] + 1,      // Ekleme
        dp[i - 1][j - 1] + cost // Değiştirme
      );
    }
  }
  
  return dp[m][n];
}

// ==================== BATCH PROCESSING ====================

/**
 * Birden fazla satırı düzelt
 */
export function correctOCRBatch(lines: string[]): { original: string; corrected: string; changed: boolean }[] {
  return lines.map(line => {
    const corrected = correctOCRErrors(line);
    return {
      original: line,
      corrected,
      changed: line !== corrected
    };
  });
}

/**
 * OCR düzeltme istatistikleri
 */
export function getOCRCorrectionStats(lines: string[]): {
  total: number;
  corrected: number;
  unchanged: number;
  percentage: number;
} {
  const results = correctOCRBatch(lines);
  const corrected = results.filter(r => r.changed).length;
  
  return {
    total: lines.length,
    corrected,
    unchanged: lines.length - corrected,
    percentage: Math.round((corrected / lines.length) * 100)
  };
}

// ==================== EXPORTS ====================

export default {
  correctOCRErrors,
  calculateTurkishSimilarity,
  normalizeTurkish,
  levenshteinDistance,
  correctOCRBatch,
  getOCRCorrectionStats,
  OCR_ERROR_MAP,
  COMMON_NAME_FIXES
};

