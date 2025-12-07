/**
 * Rate Limiter - API isteklerini sınırlandırma
 * 
 * Belirli bir süre içinde maksimum istek sayısını kontrol eder
 */

interface RateLimitConfig {
  windowMs: number;      // Zaman penceresi (ms)
  maxRequests: number;   // Maksimum istek sayısı
  message?: string;      // Hata mesajı
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Varsayılan konfigürasyonlar
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Genel API istekleri
  default: {
    windowMs: 60 * 1000, // 1 dakika
    maxRequests: 100,
    message: 'Çok fazla istek. Lütfen bir dakika bekleyin.',
  },
  // Login istekleri (brute force koruması)
  login: {
    windowMs: 15 * 60 * 1000, // 15 dakika
    maxRequests: 5,
    message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  },
  // SMS gönderimi
  sms: {
    windowMs: 60 * 60 * 1000, // 1 saat
    maxRequests: 50,
    message: 'SMS limiti aşıldı. 1 saat sonra tekrar deneyin.',
  },
  // Email gönderimi
  email: {
    windowMs: 60 * 60 * 1000, // 1 saat
    maxRequests: 100,
    message: 'Email limiti aşıldı. 1 saat sonra tekrar deneyin.',
  },
  // Export işlemleri
  export: {
    windowMs: 5 * 60 * 1000, // 5 dakika
    maxRequests: 10,
    message: 'Export limiti aşıldı. 5 dakika sonra tekrar deneyin.',
  },
  // Yükleme işlemleri
  upload: {
    windowMs: 60 * 1000, // 1 dakika
    maxRequests: 20,
    message: 'Yükleme limiti aşıldı. 1 dakika sonra tekrar deneyin.',
  },
};

/**
 * Rate limit kontrolü yap
 * @param identifier - Benzersiz tanımlayıcı (IP, userId, vb.)
 * @param configKey - Kullanılacak konfigürasyon anahtarı
 * @returns { allowed: boolean, remaining: number, resetTime: number, message?: string }
 */
export function checkRateLimit(
  identifier: string,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'default'
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
} {
  const config = RATE_LIMIT_CONFIGS[configKey] || RATE_LIMIT_CONFIGS.default;
  const key = `${configKey}:${identifier}`;
  const now = Date.now();

  // Mevcut entry'yi al veya yeni oluştur
  let entry = rateLimitStore.get(key);

  // Süre dolmuşsa sıfırla
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // İstek sayısını artır
  entry.count++;
  rateLimitStore.set(key, entry);

  // Limit kontrolü
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    message: allowed ? undefined : config.message,
  };
}

/**
 * Rate limit store'u temizle (eski entry'leri kaldır)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Belirli bir identifier için rate limit'i sıfırla
 */
export function resetRateLimit(identifier: string, configKey: string = 'default'): void {
  const key = `${configKey}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Rate limit header'larını döndür
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
    'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
  };
}

// Her 5 dakikada bir eski entry'leri temizle
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

