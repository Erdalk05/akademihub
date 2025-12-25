/**
 * AkademiHub Core Helpers
 * Motor Dairesi - Yardımcı Fonksiyonlar
 * 
 * Tüm core modülleri tarafından kullanılan yardımcı fonksiyonlar.
 */

// ============================================
// 🔤 METİN NORMALİZASYONU
// ============================================

/**
 * Türkçe karakter düzeltme haritası
 * OCR ve optik okuyucu hatalarını düzeltir
 */
const TURKISH_CHAR_MAP: Record<string, string> = {
  // Yaygın OCR hataları
  '◆': 'İ',
  '': 'İ',
  '\u0000': '',
  '\ufffd': '',
  
  // Küçük harfler
  'i̇': 'i',
  'ı̇': 'i',
  
  // Büyük harfler
  'I': 'I', // Türkçe'de I -> I kalır, büyük ı
  
  // Özel karakterler
  'Ý': 'İ',
  'Þ': 'Ş',
  'ý': 'ı',
  'þ': 'ş',
  'Ð': 'Ğ',
  'ð': 'ğ',
  'Ç': 'Ç',
  'ç': 'ç',
  'Ö': 'Ö',
  'ö': 'ö',
  'Ü': 'Ü',
  'ü': 'ü',
  
  // Latin-1 hataları
  '\xc7': 'Ç',
  '\xe7': 'ç',
  '\xd6': 'Ö',
  '\xf6': 'ö',
  '\xdc': 'Ü',
  '\xfc': 'ü',
  '\xde': 'Ş',
  '\xfe': 'ş',
  '\xd0': 'Ğ',
  '\xf0': 'ğ',
  '\xdd': 'İ',
  '\xfd': 'ı',
};

/**
 * Metni Türkçe karakterler için normalleştirir
 * OCR hatalarını düzeltir ve tutarlı format sağlar
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Karakter haritası ile düzeltme
  for (const [wrong, correct] of Object.entries(TURKISH_CHAR_MAP)) {
    result = result.split(wrong).join(correct);
  }
  
  // Fazla boşlukları temizle
  result = result.replace(/\s+/g, ' ').trim();
  
  // Kontrol karakterlerini temizle
  result = result.replace(/[\x00-\x1F\x7F]/g, '');
  
  return result;
}

/**
 * İsim normalleştirme - OCR hatalarını düzeltir ve formatlar
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  let result = normalizeText(name);
  
  // Her kelimenin ilk harfini büyük yap (Türkçe kurallarına uygun)
  result = result
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      
      // Türkçe özel karakterler için büyük harf dönüşümü
      const firstChar = word.charAt(0);
      let upperFirst = firstChar.toUpperCase();
      
      // i -> İ dönüşümü
      if (firstChar === 'i') upperFirst = 'İ';
      // ı -> I dönüşümü
      if (firstChar === 'ı') upperFirst = 'I';
      
      return upperFirst + word.slice(1);
    })
    .join(' ');
  
  return result;
}

// ============================================
// 🔢 TC KİMLİK DOĞRULAMA
// ============================================

/**
 * TC Kimlik numarası doğrulama algoritması
 * Türkiye Cumhuriyeti kimlik numarası için resmi algoritma
 */
export function validateTC(tc: string): boolean {
  // Temel kontroller
  if (!tc || tc.length !== 11) return false;
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc.startsWith('0')) return false;
  
  const digits = tc.split('').map(Number);
  
  // 10. hane kontrolü
  // (1, 3, 5, 7, 9. hanelerin toplamı × 7) - (2, 4, 6, 8. hanelerin toplamı) mod 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = ((oddSum * 7) - evenSum) % 10;
  
  if (check10 < 0 ? check10 + 10 : check10 !== digits[9]) return false;
  
  // 11. hane kontrolü
  // İlk 10 hanenin toplamı mod 10
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;
  
  return true;
}

/**
 * TC'yi formatlı string'e çevirir (gizlilik için)
 * Örnek: 12345678901 -> 123****8901
 */
export function maskTC(tc: string): string {
  if (!tc || tc.length !== 11) return tc;
  return tc.slice(0, 3) + '****' + tc.slice(7);
}

// ============================================
// 📏 FIXED-WIDTH PARSING
// ============================================

/**
 * Sabit genişlikli alandan veri çıkarır
 * Optik okuyucu çıktıları için optimize edilmiş
 */
export function extractFixedWidth(line: string, start: number, end: number): string {
  if (!line) return '';
  
  // 0-indexed olarak al
  const startIndex = Math.max(0, start);
  const endIndex = Math.min(line.length, end + 1);
  
  if (startIndex >= line.length) return '';
  
  return line.substring(startIndex, endIndex).trim();
}

/**
 * Regex ile fallback extraction
 * Tutarsız boşluklar için alternatif yöntem
 */
export function extractWithRegex(line: string, pattern: RegExp): string | null {
  const match = line.match(pattern);
  return match ? match[1]?.trim() || null : null;
}

// ============================================
// 📊 CEVAP İŞLEME
// ============================================

/**
 * Cevap string'ini array'e çevirir
 * Geçersiz karakterleri boş olarak işaretler
 */
export function parseAnswers(answerString: string): (string | null)[] {
  if (!answerString) return [];
  
  const validAnswers = new Set(['A', 'B', 'C', 'D', 'E', ' ', '-', '*', '']);
  
  return answerString
    .toUpperCase()
    .split('')
    .map(char => {
      if (char === ' ' || char === '-' || char === '*' || char === '') {
        return null; // Boş cevap
      }
      if (validAnswers.has(char)) {
        return char;
      }
      return null; // Geçersiz karakter
    });
}

/**
 * Kitapçık tipini belirler
 */
export function parseBooklet(bookletChar: string): 'A' | 'B' | 'C' | 'D' | null {
  const normalized = bookletChar?.toUpperCase()?.trim();
  if (['A', 'B', 'C', 'D'].includes(normalized)) {
    return normalized as 'A' | 'B' | 'C' | 'D';
  }
  return null;
}

// ============================================
// 📈 HESAPLAMA YARDIMCILARI
// ============================================

/**
 * Net hesaplama
 * @param correct Doğru sayısı
 * @param wrong Yanlış sayısı
 * @param penalty Kaç yanlış 1 doğruyu götürür (LGS: 3, YKS: 4)
 */
export function calculateNet(correct: number, wrong: number, penalty: number): number {
  if (penalty <= 0) return correct;
  const net = correct - (wrong / penalty);
  return Math.round(net * 100) / 100; // 2 ondalık
}

/**
 * Yüzdelik dilim hesaplama
 */
export function calculatePercentile(rank: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((total - rank) / total) * 100);
}

/**
 * Standart sapma hesaplama
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

// ============================================
// 🔧 GENEL YARDIMCILAR
// ============================================

/**
 * Benzersiz ID oluşturur
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Tarih formatlama (Türkçe)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Sayı formatlama (Türkçe)
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Levenshtein mesafesi hesaplama
 * İsim eşleştirme için kullanılır
 */
export function levenshteinDistance(a: string, b: string): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * İsim benzerlik skoru (0-100)
 */
export function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  if (n1 === n2) return 100;
  
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(n1, n2);
  return Math.round((1 - distance / maxLen) * 100);
}

