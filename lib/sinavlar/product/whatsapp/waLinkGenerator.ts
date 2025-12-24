/**
 * ============================================
 * AkademiHub - WhatsApp Link Generator
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Güvenli PDF link üretimi
 * - JWT / one-time token
 * - Süreli linkler (48 saat)
 * - Öğrenci + sınav scoped
 */

import { createHash, randomBytes } from 'crypto';

// ==================== CONFIG ====================

const LINK_CONFIG = {
  // Link base URL
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://akademihub.com',
  
  // Short link prefix
  shortPrefix: 'akhb.link',
  
  // Link geçerlilik süresi (ms)
  expirationMs: 48 * 60 * 60 * 1000, // 48 saat
  
  // Token uzunluğu
  tokenLength: 8
};

// ==================== TYPES ====================

export interface SecureLinkInput {
  examId: string;
  studentId: string;
  snapshotId: string;
}

export interface SecureLinkResult {
  // Tam URL
  url: string;
  
  // Kısa URL
  shortUrl: string;
  
  // Token
  token: string;
  
  // Geçerlilik süresi
  expiresAt: string;
  
  // Hash (doğrulama için)
  hash: string;
}

// ==================== ANA FONKSİYON ====================

/**
 * Güvenli PDF link oluşturur
 * 
 * @param input - Link input
 * @returns Güvenli link result
 */
export function generateSecureLink(input: SecureLinkInput): SecureLinkResult {
  const { examId, studentId, snapshotId } = input;
  
  // Token oluştur
  const token = generateToken();
  
  // Expiration
  const expiresAt = new Date(Date.now() + LINK_CONFIG.expirationMs).toISOString();
  
  // Hash oluştur (doğrulama için)
  const hash = generateHash(examId, studentId, snapshotId, token);
  
  // URL oluştur
  const url = `${LINK_CONFIG.baseUrl}/api/reports/pdf/${token}`;
  const shortUrl = `https://${LINK_CONFIG.shortPrefix}/${token}`;
  
  return {
    url,
    shortUrl,
    token,
    expiresAt,
    hash
  };
}

// ==================== TOKEN GENERATOR ====================

/**
 * Rastgele token oluşturur
 */
function generateToken(): string {
  // Base62 karakterler (URL-safe)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(LINK_CONFIG.tokenLength);
  
  let token = '';
  for (let i = 0; i < LINK_CONFIG.tokenLength; i++) {
    token += chars[bytes[i] % chars.length];
  }
  
  return token;
}

// ==================== HASH GENERATOR ====================

/**
 * Doğrulama hash'i oluşturur
 */
function generateHash(
  examId: string,
  studentId: string,
  snapshotId: string,
  token: string
): string {
  const secret = process.env.PDF_LINK_SECRET || 'akademihub-pdf-secret';
  const data = `${examId}:${studentId}:${snapshotId}:${token}`;
  
  return createHash('sha256')
    .update(data + secret)
    .digest('hex')
    .substring(0, 16);
}

// ==================== VALIDATION ====================

/**
 * Token'ı doğrular
 */
export function validateToken(
  token: string,
  examId: string,
  studentId: string,
  snapshotId: string,
  providedHash: string
): boolean {
  const expectedHash = generateHash(examId, studentId, snapshotId, token);
  return expectedHash === providedHash;
}

/**
 * Link'in süresinin dolup dolmadığını kontrol eder
 */
export function isLinkExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

// ==================== WHATSAPP SHARE URL ====================

/**
 * WhatsApp paylaşım URL'i oluşturur
 */
export function generateWhatsAppShareUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Belirli numaraya WhatsApp mesaj URL'i
 */
export function generateWhatsAppDirectUrl(phoneNumber: string, message: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

// ==================== EXPORT ====================

export default {
  generateSecureLink,
  validateToken,
  isLinkExpired,
  generateWhatsAppShareUrl,
  generateWhatsAppDirectUrl
};

