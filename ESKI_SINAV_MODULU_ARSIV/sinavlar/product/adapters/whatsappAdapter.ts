/**
 * ============================================
 * AkademiHub - WhatsApp Adapter
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Snapshot → WhatsApp ViewModel dönüşümü
 * - 160 karakter limiti
 * - Güvenli dil (tehlike, risk kelimesi YOK)
 * - HESAPLAMA YOK
 */

import type { AISnapshotRecord } from '../../ai/cache/types';
import type { StructuredCoachOutput } from '../../ai/types';
import type {
  WhatsAppViewModel,
  ProductAdapterInput
} from '../types';
import { WHATSAPP_CHAR_LIMIT } from '../types';
import { getWhatsAppTemplate, getI18n } from '../whatsapp/i18n';
import { generateSecureLink } from '../whatsapp/waLinkGenerator';

// ==================== ANA FONKSİYON ====================

/**
 * Snapshot'ı WhatsApp ViewModel'e dönüştürür
 * 
 * @param input - Adapter input
 * @returns WhatsApp ViewModel
 */
export function toWhatsAppViewModel(input: ProductAdapterInput): WhatsAppViewModel {
  const { snapshot, role, language, studentName } = input;
  
  // Snapshot yoksa boş mesaj
  if (!snapshot) {
    return createEmptyWhatsApp(role, language);
  }
  
  const content = snapshot.content as StructuredCoachOutput;
  
  // Risk seviyesi belirle (güvenli dil için)
  const riskLevel = determineRiskLevelSafe(content.riskAnalysis);
  
  // Mesaj oluştur
  const message = buildWhatsAppMessage(content, role, riskLevel, language, studentName);
  
  // Güvenli PDF link oluştur
  const linkData = generateSecureLink({
    examId: snapshot.exam_id,
    studentId: snapshot.student_id,
    snapshotId: snapshot.id
  });
  
  // Tam mesaj
  const fullMessage = buildFullMessage(message, linkData.url);
  
  return {
    message,
    pdfLink: linkData.url,
    linkToken: linkData.token,
    linkExpiresAt: linkData.expiresAt,
    fullMessage,
    characterCount: fullMessage.length,
    isValid: fullMessage.length <= WHATSAPP_CHAR_LIMIT,
    language,
    role
  };
}

// ==================== MESSAGE BUILDER ====================

function buildWhatsAppMessage(
  content: StructuredCoachOutput,
  role: string,
  riskLevel: 'low' | 'medium' | 'high',
  language: 'tr' | 'en',
  studentName?: string
): string {
  // Şablon al
  const template = getWhatsAppTemplate(role as 'student' | 'parent' | 'teacher', riskLevel, language);
  
  // Placeholder'ları doldur
  let message = template;
  
  // Öğrenci adı
  if (studentName) {
    message = message.replace('{studentName}', studentName);
  } else {
    message = message.replace('{studentName}', 'Öğrenci');
  }
  
  // Özet
  const summary = extractShortSummary(content);
  message = message.replace('{summary}', summary);
  
  // Odak alanları
  const focusAreas = extractFocusAreas(content);
  message = message.replace('{focusAreas}', focusAreas);
  
  // Öneri
  const suggestion = extractFirstSuggestion(content);
  message = message.replace('{suggestion}', suggestion);
  
  return message;
}

function extractShortSummary(content: StructuredCoachOutput): string {
  if (!content.performanceSummary) return 'analiz tamamlandı';
  
  // İlk cümlenin ilk 50 karakteri
  const firstSentence = content.performanceSummary.split('.')[0];
  if (firstSentence.length > 50) {
    return firstSentence.substring(0, 47) + '...';
  }
  return firstSentence;
}

function extractFocusAreas(content: StructuredCoachOutput): string {
  // Gelişim alanlarından ilk 2 ders/konu
  if (content.areasForImprovement) {
    const areas = content.areasForImprovement
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 2)
      .map(l => l.replace(/^[-•]\s*/, '').trim().split(' ')[0])
      .join(' ve ');
    
    if (areas) return areas;
  }
  
  return 'belirlenen konular';
}

function extractFirstSuggestion(content: StructuredCoachOutput): string {
  if (content.actionableAdvice && content.actionableAdvice.length > 0) {
    const first = content.actionableAdvice[0];
    if (first.description.length > 40) {
      return first.description.substring(0, 37) + '...';
    }
    return first.description;
  }
  
  return 'detaylar için raporu inceleyin';
}

// ==================== FULL MESSAGE BUILDER ====================

function buildFullMessage(message: string, pdfLink: string): string {
  const linkPart = `\n📄 Rapor: ${pdfLink}`;
  
  // Link için yer bırak
  const maxMessageLength = WHATSAPP_CHAR_LIMIT - linkPart.length;
  
  let finalMessage = message;
  if (message.length > maxMessageLength) {
    finalMessage = message.substring(0, maxMessageLength - 3) + '...';
  }
  
  return finalMessage + linkPart;
}

// ==================== RISK LEVEL (GÜVENLİ DİL) ====================

function determineRiskLevelSafe(riskAnalysis: string | null): 'low' | 'medium' | 'high' {
  if (!riskAnalysis) return 'low';
  
  const text = riskAnalysis.toLowerCase();
  
  // Soft keywords - agresif değil
  if (text.includes('dikkat') || text.includes('öncelik')) {
    return 'medium';
  }
  
  if (text.includes('acil') || text.includes('önemli')) {
    return 'high';
  }
  
  return 'low';
}

// ==================== EMPTY STATE ====================

function createEmptyWhatsApp(role: string, language: 'tr' | 'en'): WhatsAppViewModel {
  const i18n = getI18n(language);
  
  return {
    message: language === 'tr' 
      ? 'AkademiHub: Analiz henüz hazırlanıyor.'
      : 'AkademiHub: Analysis is being prepared.',
    pdfLink: null,
    linkToken: null,
    linkExpiresAt: null,
    fullMessage: language === 'tr'
      ? 'AkademiHub: Analiz henüz hazırlanıyor.'
      : 'AkademiHub: Analysis is being prepared.',
    characterCount: 0,
    isValid: true,
    language,
    role: role as WhatsAppViewModel['role']
  };
}

// ==================== EXPORT ====================

export default {
  toWhatsAppViewModel
};

