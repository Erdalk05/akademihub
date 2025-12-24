/**
 * ============================================
 * AkademiHub - WhatsApp Templates
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Rol + risk bazlı mesaj şablonları
 * - Güvenli dil kuralları
 * - Placeholder yönetimi
 */

import type { AIRole } from '../../ai/types';
import type { WhatsAppTemplate } from '../types';

// ==================== YASAKLI KELİMELER ====================

/**
 * WhatsApp mesajlarında ASLA kullanılmayacak kelimeler
 * Bu kelimeler velilerde panik yaratabilir
 */
export const FORBIDDEN_WORDS = [
  'tehlike',
  'tehlikeli',
  'riskli',
  'başarısız',
  'kötü',
  'felaket',
  'korkunç',
  'endişe verici',
  'alarm',
  'acil müdahale',
  'kritik durum',
  'çok kötü',
  'yetersiz',
  'zayıf performans'
];

/**
 * Güvenli alternatifler
 */
export const SAFE_ALTERNATIVES: Record<string, string> = {
  'tehlike': 'dikkat alanı',
  'tehlikeli': 'öncelikli',
  'riskli': 'gelişime açık',
  'başarısız': 'gelişim gösteren',
  'kötü': 'gelişebilir',
  'yetersiz': 'pekiştirilmeli',
  'zayıf': 'desteklenmeli'
};

// ==================== PLACEHOLDER'LAR ====================

export const PLACEHOLDERS = {
  STUDENT_NAME: '{studentName}',
  FOCUS_AREAS: '{focusAreas}',
  SUMMARY: '{summary}',
  SUGGESTION: '{suggestion}',
  EXAM_NAME: '{examName}',
  SUBJECT: '{subject}'
} as const;

// ==================== TEMPLATE BUILDER ====================

export interface TemplateConfig {
  role: AIRole;
  riskLevel: 'low' | 'medium' | 'high';
  language: 'tr' | 'en';
  includeEmoji?: boolean;
}

/**
 * Dinamik template oluşturur
 */
export function buildTemplate(config: TemplateConfig): string {
  const { role, riskLevel, language, includeEmoji = true } = config;
  
  if (language === 'en') {
    return buildEnglishTemplate(role, riskLevel, includeEmoji);
  }
  
  return buildTurkishTemplate(role, riskLevel, includeEmoji);
}

// ==================== TÜRKÇE TEMPLATES ====================

function buildTurkishTemplate(
  role: AIRole,
  riskLevel: 'low' | 'medium' | 'high',
  includeEmoji: boolean
): string {
  const emoji = includeEmoji ? getEmoji(riskLevel) : '';
  
  switch (role) {
    case 'student':
      return buildStudentTemplateTR(riskLevel, emoji);
    case 'parent':
      return buildParentTemplateTR(riskLevel, emoji);
    case 'teacher':
      return buildTeacherTemplateTR(riskLevel, emoji);
    default:
      return `AkademiHub: Analiz raporu hazır. ${emoji}`;
  }
}

function buildStudentTemplateTR(riskLevel: string, emoji: string): string {
  switch (riskLevel) {
    case 'low':
      return `AkademiHub: Harika gidiyorsun! ${emoji} {focusAreas} alanlarında güçlenmeye devam et.`;
    case 'medium':
      return `AkademiHub: {focusAreas} konularına odaklanarak ilerleyebilirsin. ${emoji}`;
    case 'high':
      return `AkademiHub: Bu hafta {focusAreas} odaklı küçük ama etkili adımlar öneriyoruz. ${emoji}`;
    default:
      return `AkademiHub: Analiz raporun hazır. ${emoji}`;
  }
}

function buildParentTemplateTR(riskLevel: string, emoji: string): string {
  switch (riskLevel) {
    case 'low':
      return `AkademiHub: {studentName} harika bir performans sergiliyor! ${emoji}`;
    case 'medium':
      return `AkademiHub: {studentName} için {focusAreas} alanlarında birlikte çalışabiliriz. ${emoji}`;
    case 'high':
      return `AkademiHub: {studentName} için bu hafta {focusAreas} odaklı destek öneriyoruz. ${emoji}`;
    default:
      return `AkademiHub: {studentName} için analiz raporu hazır. ${emoji}`;
  }
}

function buildTeacherTemplateTR(riskLevel: string, emoji: string): string {
  switch (riskLevel) {
    case 'low':
      return `AkademiHub: Öğrenci analizi hazır. Genel performans iyi durumda. ${emoji}`;
    case 'medium':
      return `AkademiHub: Öğrenci analizi hazır. {focusAreas} alanlarında müdahale önerileri mevcut. ${emoji}`;
    case 'high':
      return `AkademiHub: Öğrenci analizi hazır. Öncelikli müdahale alanları belirlendi. ${emoji}`;
    default:
      return `AkademiHub: Öğrenci analizi hazır. ${emoji}`;
  }
}

// ==================== ENGLISH TEMPLATES ====================

function buildEnglishTemplate(
  role: AIRole,
  riskLevel: 'low' | 'medium' | 'high',
  includeEmoji: boolean
): string {
  const emoji = includeEmoji ? getEmoji(riskLevel) : '';
  
  switch (role) {
    case 'student':
      switch (riskLevel) {
        case 'low':
          return `AkademiHub: Great job! ${emoji} Keep strengthening your {focusAreas} skills.`;
        case 'medium':
          return `AkademiHub: Focus on {focusAreas} to progress. ${emoji}`;
        case 'high':
          return `AkademiHub: This week focus on {focusAreas} with small but effective steps. ${emoji}`;
        default:
          return `AkademiHub: Your analysis report is ready. ${emoji}`;
      }
    
    case 'parent':
      switch (riskLevel) {
        case 'low':
          return `AkademiHub: {studentName} is showing great performance! ${emoji}`;
        case 'medium':
          return `AkademiHub: We can work together on {focusAreas} for {studentName}. ${emoji}`;
        case 'high':
          return `AkademiHub: This week we suggest {focusAreas} focused support for {studentName}. ${emoji}`;
        default:
          return `AkademiHub: Analysis report for {studentName} is ready. ${emoji}`;
      }
    
    case 'teacher':
      switch (riskLevel) {
        case 'low':
          return `AkademiHub: Student analysis ready. Overall performance is good. ${emoji}`;
        case 'medium':
          return `AkademiHub: Student analysis ready. Intervention suggestions for {focusAreas}. ${emoji}`;
        case 'high':
          return `AkademiHub: Student analysis ready. Priority intervention areas identified. ${emoji}`;
        default:
          return `AkademiHub: Student analysis ready. ${emoji}`;
      }
    
    default:
      return `AkademiHub: Analysis report is ready. ${emoji}`;
  }
}

// ==================== EMOJI ====================

function getEmoji(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low':
      return '🌟';
    case 'medium':
      return '💪';
    case 'high':
      return '📚';
    default:
      return '📊';
  }
}

// ==================== MESSAGE SANITIZER ====================

/**
 * Mesajı yasaklı kelimelerden temizler
 */
export function sanitizeMessage(message: string): string {
  let sanitized = message;
  
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(word, 'gi');
    const replacement = SAFE_ALTERNATIVES[word.toLowerCase()] || 'gelişim alanı';
    sanitized = sanitized.replace(regex, replacement);
  }
  
  return sanitized;
}

/**
 * Mesajın güvenli olup olmadığını kontrol eder
 */
export function isMessageSafe(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return !FORBIDDEN_WORDS.some(word => lowerMessage.includes(word.toLowerCase()));
}

// ==================== EXPORT ====================

export default {
  FORBIDDEN_WORDS,
  SAFE_ALTERNATIVES,
  PLACEHOLDERS,
  buildTemplate,
  sanitizeMessage,
  isMessageSafe
};

