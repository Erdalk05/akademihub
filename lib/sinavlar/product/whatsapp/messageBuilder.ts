/**
 * ============================================
 * AkademiHub - WhatsApp Message Builder
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Snapshot + template birleştirme
 * - Placeholder değiştirme
 * - Karakter limiti kontrolü
 */

import type { AISnapshotRecord } from '../../ai/cache/types';
import type { StructuredCoachOutput } from '../../ai/types';
import type { AIRole } from '../../ai/types';
import type { WhatsAppViewModel } from '../types';
import { WHATSAPP_CHAR_LIMIT } from '../types';
import { buildTemplate, sanitizeMessage, PLACEHOLDERS } from './templates';
import { generateSecureLink, generateWhatsAppShareUrl } from './waLinkGenerator';

// ==================== TYPES ====================

export interface MessageBuilderInput {
  snapshot: AISnapshotRecord;
  role: AIRole;
  language: 'tr' | 'en';
  studentName?: string;
  examName?: string;
  includeLink?: boolean;
}

export interface BuiltMessage {
  // Ana mesaj (link hariç)
  message: string;
  
  // Link dahil tam mesaj
  fullMessage: string;
  
  // PDF linki
  pdfLink: string | null;
  
  // Karakter sayısı
  characterCount: number;
  
  // Geçerli mi?
  isValid: boolean;
  
  // WhatsApp share URL
  shareUrl: string;
}

// ==================== ANA FONKSİYON ====================

/**
 * Snapshot'tan WhatsApp mesajı oluşturur
 */
export function buildWhatsAppMessage(input: MessageBuilderInput): BuiltMessage {
  const { snapshot, role, language, studentName, examName, includeLink = true } = input;
  
  const content = snapshot.content as StructuredCoachOutput;
  
  // Risk seviyesi belirle
  const riskLevel = determineRiskLevel(content, snapshot.confidence_score);
  
  // Template al
  const template = buildTemplate({ role, riskLevel, language, includeEmoji: true });
  
  // Placeholder'ları doldur
  let message = fillPlaceholders(template, {
    studentName: studentName || 'Öğrenci',
    focusAreas: extractFocusAreas(content),
    summary: extractSummary(content),
    suggestion: extractSuggestion(content),
    examName: examName || 'Sınav',
    subject: extractMainSubject(content)
  });
  
  // Yasaklı kelimeleri temizle
  message = sanitizeMessage(message);
  
  // Link oluştur
  let pdfLink: string | null = null;
  let linkPart = '';
  
  if (includeLink) {
    const linkResult = generateSecureLink({
      examId: snapshot.exam_id,
      studentId: snapshot.student_id,
      snapshotId: snapshot.id
    });
    pdfLink = linkResult.shortUrl;
    linkPart = `\n📄 ${pdfLink}`;
  }
  
  // Tam mesaj
  const fullMessage = truncateMessage(message, linkPart);
  
  // Share URL
  const shareUrl = generateWhatsAppShareUrl(fullMessage);
  
  return {
    message,
    fullMessage,
    pdfLink,
    characterCount: fullMessage.length,
    isValid: fullMessage.length <= WHATSAPP_CHAR_LIMIT,
    shareUrl
  };
}

// ==================== PLACEHOLDER FILLER ====================

interface PlaceholderValues {
  studentName: string;
  focusAreas: string;
  summary: string;
  suggestion: string;
  examName: string;
  subject: string;
}

function fillPlaceholders(template: string, values: PlaceholderValues): string {
  let result = template;
  
  result = result.replace(PLACEHOLDERS.STUDENT_NAME, values.studentName);
  result = result.replace(PLACEHOLDERS.FOCUS_AREAS, values.focusAreas);
  result = result.replace(PLACEHOLDERS.SUMMARY, values.summary);
  result = result.replace(PLACEHOLDERS.SUGGESTION, values.suggestion);
  result = result.replace(PLACEHOLDERS.EXAM_NAME, values.examName);
  result = result.replace(PLACEHOLDERS.SUBJECT, values.subject);
  
  return result;
}

// ==================== CONTENT EXTRACTORS ====================

function extractFocusAreas(content: StructuredCoachOutput): string {
  if (content.areasForImprovement) {
    const areas = content.areasForImprovement
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 2)
      .map(l => {
        const clean = l.replace(/^[-•]\s*/, '').trim();
        // İlk kelimeyi al (genellikle ders adı)
        return clean.split(' ')[0];
      })
      .filter(a => a.length > 2);
    
    if (areas.length > 0) {
      return areas.join(' ve ');
    }
  }
  
  return 'belirlenen konular';
}

function extractSummary(content: StructuredCoachOutput): string {
  if (content.performanceSummary) {
    const firstSentence = content.performanceSummary.split('.')[0];
    if (firstSentence.length > 40) {
      return firstSentence.substring(0, 37) + '...';
    }
    return firstSentence;
  }
  
  return 'analiz tamamlandı';
}

function extractSuggestion(content: StructuredCoachOutput): string {
  if (content.actionableAdvice && content.actionableAdvice.length > 0) {
    const first = content.actionableAdvice[0];
    if (first.description.length > 30) {
      return first.description.substring(0, 27) + '...';
    }
    return first.description;
  }
  
  return 'detaylar için raporu inceleyin';
}

function extractMainSubject(content: StructuredCoachOutput): string {
  // Güçlü veya zayıf alanlardan ana dersi çıkar
  const text = content.strengthsAnalysis || content.areasForImprovement || '';
  
  const subjects = ['Matematik', 'Türkçe', 'Fen', 'Sosyal', 'İngilizce'];
  
  for (const subject of subjects) {
    if (text.includes(subject)) {
      return subject;
    }
  }
  
  return 'dersler';
}

// ==================== RISK LEVEL ====================

function determineRiskLevel(
  content: StructuredCoachOutput,
  confidenceScore: number
): 'low' | 'medium' | 'high' {
  // Confidence score'a göre
  if (confidenceScore >= 70) return 'low';
  if (confidenceScore >= 40) return 'medium';
  
  // Risk analysis'e göre
  if (content.riskAnalysis) {
    const text = content.riskAnalysis.toLowerCase();
    if (text.includes('acil') || text.includes('önemli')) return 'high';
    if (text.includes('dikkat') || text.includes('orta')) return 'medium';
  }
  
  return 'high';
}

// ==================== TRUNCATION ====================

function truncateMessage(message: string, linkPart: string): string {
  const maxMessageLength = WHATSAPP_CHAR_LIMIT - linkPart.length;
  
  if (message.length > maxMessageLength) {
    return message.substring(0, maxMessageLength - 3) + '...' + linkPart;
  }
  
  return message + linkPart;
}

// ==================== BATCH BUILDER ====================

/**
 * Birden fazla öğrenci için mesaj oluşturur
 */
export function buildBatchMessages(
  snapshots: AISnapshotRecord[],
  role: AIRole,
  language: 'tr' | 'en',
  studentNames?: Map<string, string>
): Map<string, BuiltMessage> {
  const results = new Map<string, BuiltMessage>();
  
  for (const snapshot of snapshots) {
    const studentName = studentNames?.get(snapshot.student_id);
    
    const message = buildWhatsAppMessage({
      snapshot,
      role,
      language,
      studentName
    });
    
    results.set(snapshot.student_id, message);
  }
  
  return results;
}

// ==================== EXPORT ====================

export default {
  buildWhatsAppMessage,
  buildBatchMessages
};

