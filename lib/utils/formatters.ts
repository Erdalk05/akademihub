/**
 * Formatter Functions
 * @module lib/utils/formatters
 */

/**
 * Para formatı
 */
export const formatCurrency = (value: number, currency: string = 'TRY'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Yüzde formatı
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value).toFixed(decimals)}%`;
};

/**
 * Tarih formatı
 */
export const formatDate = (date: Date | string, locale: string = 'tr-TR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Kısa tarih formatı
 */
export const formatDateShort = (date: Date | string, locale: string = 'tr-TR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
};

/**
 * Zaman formatı
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Tarih ve zaman formatı
 */
export const formatDateTime = (date: Date | string, locale: string = 'tr-TR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Sayı formatı
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Dosya boyutu formatı
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * TC Kimlik formatı
 */
export const formatTCNumber = (value: string): string => {
  return value.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

/**
 * Telefon formatı
 */
export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (!match) return value;
  return `(${match[1]}) ${match[2]} ${match[3]}`;
};

/**
 * İlk harfler büyük
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Türkçe kelime ile katılı
 */
export const joinWithComma = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ve ${items[1]}`;
  return items.slice(0, -1).join(', ') + ' ve ' + items[items.length - 1];
};

/**
 * Başlık formatı (slug)
 */
export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Metin kesme (ellipsis)
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
};

/**
 * Saati Türkçeye çevir
 */
export const getDurationString = (minutes: number): string => {
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} saat`;
  return `${hours} saat ${mins} dakika`;
};

/**
 * Trend rengini belirle
 */
export const getTrendColor = (trend: 'up' | 'down' | 'same' | string): string => {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'same':
    default:
      return 'text-gray-600';
  }
};
