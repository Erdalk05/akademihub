/**
 * ============================================
 * AkademiHub - AI Coach Engine Types
 * ============================================
 * 
 * PHASE 5.1.1 - AI Student Coach (Cache-Aware)
 * 
 * BU DOSYA:
 * - AI Coach için tüm tip tanımları
 * - Input/Output sözleşmeleri
 * - Role-based configuration
 * - Cache tiplemeleri
 * 
 * KIRMIZI ÇİZGİLER:
 * - AI ASLA hesaplama yapmaz
 * - TEK veri kaynağı: StudentAnalyticsOutput
 * - Yorumlar her zaman veriye referanslı
 */

import type { StudentAnalyticsOutput } from '../analytics/orchestrator/types';

// ==================== ROLE TYPES ====================

/**
 * AI Coach rolleri
 */
export type AIRole = 'student' | 'parent' | 'teacher';

/**
 * Sınav türleri
 */
export type ExamType = 'LGS' | 'TYT' | 'AYT' | 'DENEME' | 'OKUL';

/**
 * Dil seçenekleri
 */
export type AILanguage = 'tr' | 'en';

// ==================== AI INPUT ====================

/**
 * AI Coach ana girdi interface'i
 * 
 * @example
 * const input: AICoachInput = {
 *   role: 'student',
 *   analytics: studentAnalyticsOutput,
 *   examContext: { examType: 'LGS', gradeLevel: 8 },
 *   language: 'tr'
 * };
 */
export interface AICoachInput {
  // Rol (öğrenci, veli, öğretmen)
  role: AIRole;
  
  // Analytics verisi (TEK KAYNAK)
  analytics: StudentAnalyticsOutput;
  
  // Sınav bağlamı
  examContext: ExamContext;
  
  // Dil
  language: AILanguage;
  
  // Opsiyonel ayarlar
  options?: AICoachOptions;
}

/**
 * Sınav bağlamı
 */
export interface ExamContext {
  // Sınav türü
  examType: ExamType;
  
  // Sınıf seviyesi (1-12)
  gradeLevel: number;
  
  // Sınav adı (opsiyonel)
  examName?: string;
  
  // Sınav tarihi (opsiyonel)
  examDate?: string;
  
  // Sınava kalan gün (opsiyonel, LGS/TYT/AYT için)
  daysUntilExam?: number;
}

/**
 * AI Coach opsiyonları
 */
export interface AICoachOptions {
  // Streaming kullan
  streaming?: boolean;
  
  // Max token
  maxTokens?: number;
  
  // Temperature (yaratıcılık)
  temperature?: number;
  
  // Model seçimi
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-sonnet';
  
  // Detay seviyesi
  detailLevel?: 'brief' | 'standard' | 'detailed';
  
  // Özel odak alanları
  focusAreas?: FocusArea[];
  
  // Fallback kullan (API hatası durumunda)
  useFallback?: boolean;
  
  // Timeout (ms)
  timeout?: number;
}

/**
 * Odak alanları
 */
export type FocusArea = 
  | 'performance'     // Genel performans
  | 'trends'          // Trend analizi
  | 'risk'            // Risk değerlendirmesi
  | 'subjects'        // Ders bazlı analiz
  | 'topics'          // Konu bazlı analiz
  | 'motivation'      // Motivasyon
  | 'study_plan'      // Çalışma planı
  | 'strengths'       // Güçlü yönler
  | 'weaknesses';     // Zayıf yönler

// ==================== AI OUTPUT ====================

/**
 * AI Coach ana çıktı interface'i
 */
export interface AICoachOutput {
  // Başarı durumu
  success: boolean;
  
  // Ana yorum
  message: string;
  
  // Yapılandırılmış çıktı
  structured: StructuredCoachOutput;
  
  // Metadata
  metadata: AIOutputMetadata;
  
  // Hata (varsa)
  error?: string;
  
  // ========== CACHE İLE GELEN ALANLAR (PHASE 5.1.1) ==========
  
  // Cache'den geldi mi?
  cached?: boolean;
  
  // Cache durumu
  cacheStatus?: 'hit' | 'miss' | 'stale' | 'error';
  
  // Veri kalitesi skoru (0-100)
  dataQuality?: number;
  
  // Model adı (cache'den)
  model?: string;
  
  // Üretim süresi (ms)
  generationDurationMs?: number;
  
  // Token kullanımı
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Yapılandırılmış AI çıktısı
 */
export interface StructuredCoachOutput {
  // Selamlama
  greeting: string;
  
  // Performans özeti
  performanceSummary: string;
  
  // Güçlü yönler yorumu
  strengthsAnalysis: string;
  
  // Gelişim alanları yorumu
  areasForImprovement: string;
  
  // Trend yorumu
  trendAnalysis: string | null;
  
  // Risk yorumu (varsa)
  riskAnalysis: string | null;
  
  // Somut öneriler
  actionableAdvice: ActionableAdvice[];
  
  // Motivasyon mesajı
  motivationalClosing: string;
  
  // Veli/öğretmen için ek bilgiler (role'e göre)
  additionalInsights?: string;
}

/**
 * Somut öneri
 */
export interface ActionableAdvice {
  // Öneri başlığı
  title: string;
  
  // Açıklama
  description: string;
  
  // Öncelik (1 = en yüksek)
  priority: number;
  
  // Kategori
  category: 'study' | 'practice' | 'review' | 'rest' | 'focus';
  
  // Tahmini süre (opsiyonel)
  estimatedTime?: string;
}

/**
 * AI çıktı metadata
 */
export interface AIOutputMetadata {
  // Rol
  role: AIRole;
  
  // Model
  model: string;
  
  // Token kullanımı
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  
  // Süre (ms)
  durationMs: number;
  
  // Oluşturulma zamanı
  generatedAt: string;
  
  // Fallback kullanıldı mı
  usedFallback: boolean;
  
  // Versiyon
  version: string;
  
  // Veri kalitesi
  dataQuality: 'high' | 'medium' | 'low';
}

// ==================== PROMPT TYPES ====================

/**
 * Prompt template yapısı
 */
export interface PromptTemplate {
  // System prompt
  system: string;
  
  // User prompt template
  user: string;
  
  // Response format instructions
  responseFormat?: string;
}

/**
 * Context builder çıktısı
 */
export interface LLMContext {
  // Markdown formatında context
  markdown: string;
  
  // Yapılandırılmış veri
  structured: {
    summary: string;
    subjects: string;
    trends: string;
    risk: string;
    strengths: string;
    weaknesses: string;
  };
  
  // Token tahmini
  estimatedTokens: number;
}

// ==================== RULE TYPES ====================

/**
 * Pedagojik kurallar
 */
export interface PedagogicalRules {
  // Yasaklı ifadeler
  forbidden: ForbiddenRule[];
  
  // Zorunlu davranışlar
  required: RequiredRule[];
  
  // Ton ayarları
  tone: ToneSettings;
}

/**
 * Yasaklı kural
 */
export interface ForbiddenRule {
  // Kural adı
  name: string;
  
  // Açıklama
  description: string;
  
  // Örnekler
  examples: string[];
}

/**
 * Zorunlu kural
 */
export interface RequiredRule {
  // Kural adı
  name: string;
  
  // Açıklama
  description: string;
  
  // Kontrol fonksiyonu (opsiyonel)
  validate?: (output: string) => boolean;
}

/**
 * Ton ayarları
 */
export interface ToneSettings {
  // Resmiyet seviyesi
  formality: 'casual' | 'semi-formal' | 'formal';
  
  // Empati seviyesi
  empathy: 'low' | 'medium' | 'high';
  
  // Enerji seviyesi
  energy: 'calm' | 'balanced' | 'enthusiastic';
  
  // Zamir kullanımı
  pronoun: 'sen' | 'siz' | 'biz';
}

// ==================== GLOSSARY TYPES ====================

/**
 * Terim sözlüğü girişi
 */
export interface GlossaryEntry {
  // Terim
  term: string;
  
  // Tanım
  definition: string;
  
  // AI için açıklama
  aiContext: string;
  
  // Eş anlamlılar
  synonyms?: string[];
  
  // Kullanım örneği
  example?: string;
}

/**
 * Terim kategorisi
 */
export interface GlossaryCategory {
  // Kategori adı
  name: string;
  
  // Terimler
  entries: GlossaryEntry[];
}

// ==================== STREAMING TYPES ====================

/**
 * Streaming chunk
 */
export interface StreamChunk {
  // Chunk içeriği
  content: string;
  
  // Chunk tipi
  type: 'text' | 'json' | 'error' | 'done';
  
  // İndeks
  index: number;
}

/**
 * Streaming callback
 */
export type StreamCallback = (chunk: StreamChunk) => void;

// ==================== ERROR TYPES ====================

/**
 * AI hata tipleri
 */
export type AIErrorType = 
  | 'INVALID_INPUT'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'CONTENT_FILTER'
  | 'UNKNOWN';

/**
 * AI hata
 */
export interface AIError {
  type: AIErrorType;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

// ==================== DEFAULT VALUES ====================

export const DEFAULT_AI_OPTIONS: Required<AICoachOptions> = {
  streaming: false,
  maxTokens: 1500,
  temperature: 0.7,
  model: 'gpt-4o-mini',
  detailLevel: 'standard',
  focusAreas: ['performance', 'trends', 'study_plan'],
  useFallback: true,
  timeout: 30000
};

export const ROLE_TONE_SETTINGS: Record<AIRole, ToneSettings> = {
  student: {
    formality: 'casual',
    empathy: 'high',
    energy: 'enthusiastic',
    pronoun: 'sen'
  },
  parent: {
    formality: 'semi-formal',
    empathy: 'high',
    energy: 'calm',
    pronoun: 'biz'
  },
  teacher: {
    formality: 'formal',
    empathy: 'medium',
    energy: 'balanced',
    pronoun: 'siz'
  }
};

// ==================== EXPORTS ====================

export default {
  DEFAULT_AI_OPTIONS,
  ROLE_TONE_SETTINGS
};

