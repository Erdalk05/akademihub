/**
 * API Validation Utilities
 * 
 * API isteklerinde input validasyonu için yardımcı fonksiyonlar
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Email formatı kontrolü
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Telefon numarası kontrolü (Türkiye formatı)
 */
export function isValidPhone(phone: string): boolean {
  // +90, 0, veya 5 ile başlayabilir
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleaned);
}

/**
 * TC Kimlik numarası kontrolü
 */
export function isValidTCKN(tckn: string): boolean {
  if (!tckn || tckn.length !== 11) return false;
  if (!/^[1-9][0-9]{10}$/.test(tckn)) return false;
  
  const digits = tckn.split('').map(Number);
  
  // İlk 10 hanenin toplamının mod 10'u = 11. hane
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;
  
  // Tek hanelerin toplamı * 7 - Çift hanelerin toplamı mod 10 = 10. hane
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  if ((oddSum * 7 - evenSum) % 10 !== digits[9]) return false;
  
  return true;
}

/**
 * Tarih formatı kontrolü (YYYY-MM-DD)
 */
export function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Pozitif sayı kontrolü
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * String uzunluk kontrolü
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Required alan kontrolü
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Öğrenci verisi validasyonu
 */
export function validateStudentData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Zorunlu alanlar
  if (!isRequired(data.first_name)) {
    errors.push({ field: 'first_name', message: 'Ad zorunludur' });
  } else if (!isValidLength(data.first_name, 2, 50)) {
    errors.push({ field: 'first_name', message: 'Ad 2-50 karakter arasında olmalıdır' });
  }
  
  if (!isRequired(data.last_name)) {
    errors.push({ field: 'last_name', message: 'Soyad zorunludur' });
  } else if (!isValidLength(data.last_name, 2, 50)) {
    errors.push({ field: 'last_name', message: 'Soyad 2-50 karakter arasında olmalıdır' });
  }
  
  // TC Kimlik (opsiyonel ama varsa geçerli olmalı)
  if (data.tc_no && !isValidTCKN(data.tc_no)) {
    errors.push({ field: 'tc_no', message: 'Geçersiz TC Kimlik numarası' });
  }
  
  // Email (opsiyonel ama varsa geçerli olmalı)
  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Geçersiz email formatı' });
  }
  
  // Telefon (opsiyonel ama varsa geçerli olmalı)
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Geçersiz telefon numarası' });
  }
  
  // Doğum tarihi (opsiyonel ama varsa geçerli olmalı)
  if (data.birth_date && !isValidDate(data.birth_date)) {
    errors.push({ field: 'birth_date', message: 'Geçersiz tarih formatı (YYYY-MM-DD)' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Taksit verisi validasyonu
 */
export function validateInstallmentData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isRequired(data.student_id)) {
    errors.push({ field: 'student_id', message: 'Öğrenci ID zorunludur' });
  }
  
  if (!isRequired(data.amount)) {
    errors.push({ field: 'amount', message: 'Tutar zorunludur' });
  } else if (!isPositiveNumber(data.amount)) {
    errors.push({ field: 'amount', message: 'Tutar pozitif bir sayı olmalıdır' });
  }
  
  if (!isRequired(data.due_date)) {
    errors.push({ field: 'due_date', message: 'Vade tarihi zorunludur' });
  } else if (!isValidDate(data.due_date)) {
    errors.push({ field: 'due_date', message: 'Geçersiz tarih formatı' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Ödeme verisi validasyonu
 */
export function validatePaymentData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isRequired(data.installment_id)) {
    errors.push({ field: 'installment_id', message: 'Taksit ID zorunludur' });
  }
  
  if (!isRequired(data.amount)) {
    errors.push({ field: 'amount', message: 'Ödeme tutarı zorunludur' });
  } else if (!isPositiveNumber(data.amount)) {
    errors.push({ field: 'amount', message: 'Ödeme tutarı pozitif bir sayı olmalıdır' });
  }
  
  if (data.payment_method && !['cash', 'card', 'transfer', 'check'].includes(data.payment_method)) {
    errors.push({ field: 'payment_method', message: 'Geçersiz ödeme yöntemi' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gider verisi validasyonu
 */
export function validateExpenseData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isRequired(data.title)) {
    errors.push({ field: 'title', message: 'Başlık zorunludur' });
  }
  
  if (!isRequired(data.amount)) {
    errors.push({ field: 'amount', message: 'Tutar zorunludur' });
  } else if (!isPositiveNumber(data.amount)) {
    errors.push({ field: 'amount', message: 'Tutar pozitif bir sayı olmalıdır' });
  }
  
  if (!isRequired(data.category)) {
    errors.push({ field: 'category', message: 'Kategori zorunludur' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Kullanıcı verisi validasyonu
 */
export function validateUserData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: 'Ad Soyad zorunludur' });
  }
  
  if (!isRequired(data.email)) {
    errors.push({ field: 'email', message: 'Email zorunludur' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Geçersiz email formatı' });
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Geçersiz telefon numarası' });
  }
  
  if (!isRequired(data.role)) {
    errors.push({ field: 'role', message: 'Rol zorunludur' });
  } else if (!['admin', 'accountant', 'registrar'].includes(data.role)) {
    errors.push({ field: 'role', message: 'Geçersiz rol' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string - XSS koruması
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Sanitize object - Tüm string alanları sanitize et
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

