/**
 * Validation Utilities
 * 
 * Kayıt formu için validation fonksiyonları
 */

/**
 * Türk telefon numarası validation
 * Kabul edilen formatlar:
 * - 05XX XXX XX XX
 * - 5XX XXX XX XX
 * - +90 5XX XXX XX XX
 * - +905XXXXXXXXX
 */
export function validateTurkishPhone(phone: string): { isValid: boolean; message?: string } {
  if (!phone) {
    return { isValid: false, message: 'Telefon numarası gerekli' };
  }

  // Remove all spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Pattern 1: +905XXXXXXXXX (13 digits)
  if (/^\+905\d{9}$/.test(cleaned)) {
    return { isValid: true };
  }

  // Pattern 2: 05XXXXXXXXX (11 digits)
  if (/^05\d{9}$/.test(cleaned)) {
    return { isValid: true };
  }

  // Pattern 3: 5XXXXXXXXX (10 digits)
  if (/^5\d{9}$/.test(cleaned)) {
    return { isValid: true };
  }

  return { 
    isValid: false, 
    message: 'Geçerli bir Türk telefon numarası girin (örn: 0555 123 45 67)' 
  };
}

/**
 * Telefon numarasını otomatik formatla
 * Çıktı: 0555 123 45 67
 */
export function formatTurkishPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Remove +90 prefix if exists
  let digits = cleaned.replace(/^\+90/, '');

  // Add leading 0 if not exists
  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  // Format: 0XXX XXX XX XX
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }

  return phone; // Return original if can't format
}

/**
 * Email validation
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email) {
    return { isValid: false, message: 'E-posta adresi gerekli' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return { 
      isValid: false, 
      message: 'Geçerli bir e-posta adresi girin (örn: ornek@email.com)' 
    };
  }

  return { isValid: true };
}

/**
 * TC Kimlik No validation (algorithm)
 * 
 * Rules:
 * 1. Must be exactly 11 digits
 * 2. First digit cannot be 0
 * 3. Sum of first 10 digits mod 10 must equal the 11th digit
 * 4. (sum of odd-positioned digits * 7 - sum of even-positioned digits) mod 10 must equal 10th digit
 */
export function validateTCKimlik(tcId: string): { isValid: boolean; message?: string } {
  if (!tcId) {
    return { isValid: false, message: 'TC Kimlik No gerekli' };
  }

  // Remove all non-digit characters
  const cleaned = tcId.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 11) {
    return { isValid: false, message: 'TC Kimlik No 11 haneli olmalıdır' };
  }

  // Check if first digit is 0
  if (cleaned[0] === '0') {
    return { isValid: false, message: 'TC Kimlik No 0 ile başlayamaz' };
  }

  // Convert to array of numbers
  const digits = cleaned.split('').map(Number);

  // Rule 1: Sum of first 10 digits mod 10 = 11th digit
  const sumFirst10 = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0);
  if (sumFirst10 % 10 !== digits[10]) {
    return { isValid: false, message: 'Geçersiz TC Kimlik No' };
  }

  // Rule 2: (sum of odd positions * 7 - sum of even positions) mod 10 = 10th digit
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const checkDigit = (sumOdd * 7 - sumEven) % 10;

  if (checkDigit < 0 || checkDigit !== digits[9]) {
    return { isValid: false, message: 'Geçersiz TC Kimlik No' };
  }

  return { isValid: true };
}

/**
 * IBAN validation (Turkish IBAN)
 * Format: TR + 2 check digits + 5 digits (bank code) + 1 digit (reserved) + 16 digits (account number)
 * Total: 26 characters
 */
export function validateIBAN(iban: string): { isValid: boolean; message?: string } {
  if (!iban) {
    return { isValid: false, message: 'IBAN gerekli' };
  }

  // Remove spaces
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Check if starts with TR
  if (!cleaned.startsWith('TR')) {
    return { isValid: false, message: 'Türk IBAN numarası TR ile başlamalıdır' };
  }

  // Check length (26 characters)
  if (cleaned.length !== 26) {
    return { isValid: false, message: 'IBAN 26 karakter olmalıdır (TR dahil)' };
  }

  // Check if all characters after TR are digits
  const digits = cleaned.slice(2);
  if (!/^\d{24}$/.test(digits)) {
    return { isValid: false, message: 'IBAN sadece TR ve rakamlardan oluşmalıdır' };
  }

  // IBAN check digit algorithm (mod 97)
  // Move first 4 characters to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  let numeric = '';
  for (const char of rearranged) {
    if (/\d/.test(char)) {
      numeric += char;
    } else {
      numeric += (char.charCodeAt(0) - 55).toString();
    }
  }

  // Calculate mod 97
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + parseInt(digit)) % 97;
  }

  if (remainder !== 1) {
    return { isValid: false, message: 'Geçersiz IBAN numarası' };
  }

  return { isValid: true };
}

/**
 * Format IBAN for display
 * TR00 0000 0000 0000 0000 0000 00
 */
export function formatIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  if (cleaned.length !== 26) {
    return iban;
  }

  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)} ${cleaned.slice(16, 20)} ${cleaned.slice(20, 24)} ${cleaned.slice(24, 26)}`;
}

/**
 * Age calculation from birth date
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get next business day (skip weekends)
 */
export function getNextBusinessDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Generate installment dates
 * @param startDate - First installment date
 * @param count - Number of installments
 * @param dayOfMonth - Preferred day of month (e.g., 5 for 5th of each month)
 */
export function generateInstallmentDates(
  startDate: string,
  count: number,
  dayOfMonth: number = 5
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const installmentDate = new Date(start);
    installmentDate.setMonth(installmentDate.getMonth() + i);
    
    // Set to preferred day of month
    installmentDate.setDate(dayOfMonth);

    // Skip weekends
    if (isWeekend(installmentDate)) {
      const nextBusinessDay = getNextBusinessDay(installmentDate);
      dates.push(nextBusinessDay.toISOString().slice(0, 10));
    } else {
      dates.push(installmentDate.toISOString().slice(0, 10));
    }
  }

  return dates;
}

