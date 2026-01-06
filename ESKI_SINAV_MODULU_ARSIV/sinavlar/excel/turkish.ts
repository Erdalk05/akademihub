/**
 * 🇹🇷 Turkish Character Utilities
 * Türkçe karakter normalizasyonu ve temizleme
 */

/**
 * Normalize Turkish characters for fuzzy matching
 * İ -> I, Ş -> S, Ğ -> G, etc.
 * 
 * IMPORTANT: Use this ONLY for matching, not for display!
 */
export function turkishNormalize(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
}

/**
 * Clean text: trim + normalize whitespace
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ');  // Multiple spaces -> single space
}

/**
 * Check if text contains Turkish characters
 */
export function hasTurkishChars(text: string): boolean {
  return /[ıİşŞğĞüÜöÖçÇ]/.test(text);
}

/**
 * Fix common OCR errors in Turkish text
 */
export function fixTurkishOCRErrors(text: string): string {
  if (!text) return '';
  
  // Common OCR replacements
  const replacements: Record<string, string> = {
    // Küçük harfler
    'i̇': 'i',   // combining dot
    'ı̇': 'i',
    'ş': 'ş',   // different unicode
    'ğ': 'ğ',
    'ü': 'ü',
    'ö': 'ö',
    'ç': 'ç',
    
    // Büyük harfler  
    'İ': 'İ',
    'Ş': 'Ş',
    'Ğ': 'Ğ',
    'Ü': 'Ü',
    'Ö': 'Ö',
    'Ç': 'Ç',
    
    // Common OCR mistakes
    'l': 'I',    // lowercase L -> capital I (context dependent)
    '0': 'O',    // zero -> O (context dependent)
  };
  
  let result = text;
  
  // Apply safe replacements
  result = result
    .replace(/i̇/g, 'i')
    .replace(/ı̇/g, 'i')
    .normalize('NFC');  // Normalize unicode
  
  return result;
}

/**
 * Convert to proper Turkish title case
 */
export function turkishTitleCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      
      // Handle Turkish specific cases
      const firstChar = word[0];
      const rest = word.slice(1);
      
      // i -> İ (not I)
      if (firstChar === 'i') {
        return 'İ' + rest;
      }
      // ı -> I
      if (firstChar === 'ı') {
        return 'I' + rest;
      }
      
      return firstChar.toUpperCase() + rest;
    })
    .join(' ');
}

/**
 * Compare two Turkish strings (case-insensitive, normalized)
 */
export function turkishEquals(str1: string, str2: string): boolean {
  return turkishNormalize(cleanText(str1).toLowerCase()) === 
         turkishNormalize(cleanText(str2).toLowerCase());
}

/**
 * Sort array of strings in Turkish order
 */
export function turkishSort(arr: string[]): string[] {
  const turkishAlphabet = 'AaBbCcÇçDdEeFfGgĞğHhIıİiJjKkLlMmNnOoÖöPpRrSsŞşTtUuÜüVvYyZz';
  
  return [...arr].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    for (let i = 0; i < Math.min(aLower.length, bLower.length); i++) {
      const aIndex = turkishAlphabet.indexOf(aLower[i]);
      const bIndex = turkishAlphabet.indexOf(bLower[i]);
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
    }
    
    return aLower.length - bLower.length;
  });
}

/**
 * 🇹🇷 TÜRKÇE BÜYÜK HARF DÖNÜŞÜMÜ
 * JavaScript'in toUpperCase() fonksiyonu Türkçe karakterleri yanlış işler:
 * - i → I (yanlış, İ olmalı)
 * - ı → I (doğru)
 * 
 * Bu fonksiyon Türkçe karakterleri doğru şekilde büyük harfe çevirir:
 * - i → İ
 * - ı → I  
 * - ş → Ş
 * - ğ → Ğ
 * - ü → Ü
 * - ö → Ö
 * - ç → Ç
 */
export function turkishToUpperCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .replace(/i/g, 'İ')   // Türkçe i → İ (EN ÖNEMLİ!)
    .replace(/ı/g, 'I')   // Türkçe ı → I
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase();       // Geri kalan karakterler için standart dönüşüm
}

/**
 * 🇹🇷 TÜRKÇE KÜÇÜK HARF DÖNÜŞÜMÜ
 * JavaScript'in toLowerCase() fonksiyonu Türkçe karakterleri yanlış işler:
 * - I → i (yanlış, ı olmalı)
 * - İ → i (doğru)
 * 
 * Bu fonksiyon Türkçe karakterleri doğru şekilde küçük harfe çevirir:
 */
export function turkishToLowerCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .replace(/I/g, 'ı')   // Türkçe I → ı (EN ÖNEMLİ!)
    .replace(/İ/g, 'i')   // Türkçe İ → i
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase();       // Geri kalan karakterler için standart dönüşüm
}

/**
 * 🇹🇷 İSİM FORMATLAMA (Ad Soyad → BÜYÜK HARF)
 * Öğrenci isimlerini Türkçe büyük harfe çevirir ve temizler
 */
export function formatTurkishName(text: string | null | undefined): string {
  if (!text) return '';
  
  // Sayıları ve fazla boşlukları temizle
  const cleaned = text
    .replace(/\d+/g, '')           // Sayıları kaldır
    .replace(/\s+/g, ' ')          // Fazla boşlukları tek boşluğa indir
    .trim();                       // Baş ve sondaki boşlukları kaldır
  
  // Türkçe büyük harfe çevir
  return turkishToUpperCase(cleaned);
}

