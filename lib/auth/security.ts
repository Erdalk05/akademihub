import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT Secret - Production'da environment variable kullanın
const JWT_SECRET = process.env.JWT_SECRET || 'akademihub_secure_secret_key_2025_!@#$%';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 12;

// Rate limiting için basit in-memory store
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 dakika

/**
 * Şifreyi hashle
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Şifreyi doğrula
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Eğer hash düz metin ise (geçiş dönemi için)
  if (!hash.startsWith('$2')) {
    return password === hash;
  }
  return bcrypt.compare(password, hash);
}

/**
 * JWT Token oluştur
 */
export function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * JWT Token doğrula
 */
export function verifyToken(token: string): {
  valid: boolean;
  payload?: { userId: string; email: string; role: string };
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      valid: true,
      payload: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message === 'jwt expired' ? 'Token süresi dolmuş' : 'Geçersiz token',
    };
  }
}

/**
 * Rate Limiting - Giriş denemelerini kontrol et
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemaining?: number;
} {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Lockout süresi geçtiyse sıfırla
  if (now - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Maksimum deneme aşıldı mı?
  if (attempt.count >= MAX_ATTEMPTS) {
    const lockoutRemaining = LOCKOUT_DURATION - (now - attempt.lastAttempt);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemaining: Math.ceil(lockoutRemaining / 1000 / 60), // dakika
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - attempt.count,
  };
}

/**
 * Başarısız giriş denemesi kaydet
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(identifier, {
      count: attempt.count + 1,
      lastAttempt: now,
    });
  }
}

/**
 * Başarılı girişte denemeleri sıfırla
 */
export function clearAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Güvenli rastgele string oluştur (refresh token vb. için)
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * E-posta formatı doğrula
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Şifre gücünü kontrol et
 */
export function checkPasswordStrength(password: string): {
  valid: boolean;
  score: number;
  message: string;
} {
  let score = 0;
  const messages: string[] = [];

  if (password.length >= 8) score++;
  else messages.push('En az 8 karakter');

  if (/[a-z]/.test(password)) score++;
  else messages.push('Küçük harf');

  if (/[A-Z]/.test(password)) score++;
  else messages.push('Büyük harf');

  if (/[0-9]/.test(password)) score++;
  else messages.push('Rakam');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else messages.push('Özel karakter');

  return {
    valid: score >= 3,
    score,
    message: messages.length > 0 ? `Eksik: ${messages.join(', ')}` : 'Güçlü şifre',
  };
}

