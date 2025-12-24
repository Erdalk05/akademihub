/**
 * ============================================
 * AkademiHub - PDF Adapter
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Snapshot → PDF AI Opinion ViewModel dönüşümü
 * - Dashboard ve WhatsApp ile tutarlı
 * - HESAPLAMA YOK
 */

import type { AISnapshotRecord } from '../../ai/cache/types';
import type { StructuredCoachOutput } from '../../ai/types';
import type {
  PDFAIOpinionViewModel,
  PDFSection,
  PDFActionItem,
  PDFWeeklyPlan,
  PDFDayPlan,
  PDFMetadata,
  ProductAdapterInput
} from '../types';

// ==================== ANA FONKSİYON ====================

/**
 * Snapshot'ı PDF AI Opinion ViewModel'e dönüştürür
 * 
 * @param input - Adapter input
 * @returns PDF ViewModel
 */
export function toPDFViewModel(input: ProductAdapterInput): PDFAIOpinionViewModel | null {
  const { snapshot, language } = input;
  
  if (!snapshot) {
    return null;
  }
  
  const content = snapshot.content as StructuredCoachOutput;
  
  return {
    executiveSummary: buildExecutiveSummary(content),
    strengths: buildStrengthsSection(content, language),
    growthAreas: buildGrowthAreasSection(content, language),
    priorityActions: buildPriorityActions(content),
    weeklyPlan: buildWeeklyPlan(content, language),
    closingMessage: buildClosingMessage(content, language),
    metadata: buildPDFMetadata(snapshot)
  };
}

// ==================== EXECUTIVE SUMMARY ====================

function buildExecutiveSummary(content: StructuredCoachOutput): string {
  const parts: string[] = [];
  
  // Performans özeti
  if (content.performanceSummary) {
    parts.push(content.performanceSummary);
  }
  
  // Trend analizi
  if (content.trendAnalysis) {
    parts.push(content.trendAnalysis);
  }
  
  if (parts.length === 0) {
    return 'Öğrencinin sınav performansı analiz edilmiştir. Detaylı değerlendirme aşağıda sunulmaktadır.';
  }
  
  return parts.join('\n\n');
}

// ==================== STRENGTHS SECTION ====================

function buildStrengthsSection(content: StructuredCoachOutput, language: 'tr' | 'en'): PDFSection {
  const title = language === 'tr' ? 'Güçlü Yönler' : 'Strengths';
  
  if (!content.strengthsAnalysis) {
    return {
      title,
      content: language === 'tr' 
        ? 'Güçlü yönler analiz edilmektedir.'
        : 'Strengths are being analyzed.',
      bulletPoints: []
    };
  }
  
  // Madde işaretlerini ayır
  const lines = content.strengthsAnalysis.split('\n').filter(l => l.trim());
  const bulletPoints = lines
    .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
    .map(l => l.replace(/^[-•]\s*/, '').trim());
  
  // Paragraf kısmı
  const paragraphs = lines
    .filter(l => !l.trim().startsWith('-') && !l.trim().startsWith('•'))
    .join(' ');
  
  return {
    title,
    content: paragraphs || content.strengthsAnalysis,
    bulletPoints
  };
}

// ==================== GROWTH AREAS SECTION ====================

function buildGrowthAreasSection(content: StructuredCoachOutput, language: 'tr' | 'en'): PDFSection {
  const title = language === 'tr' ? 'Gelişim Alanları' : 'Areas for Improvement';
  
  if (!content.areasForImprovement) {
    return {
      title,
      content: language === 'tr'
        ? 'Gelişim alanları değerlendirilmektedir.'
        : 'Areas for improvement are being evaluated.',
      bulletPoints: []
    };
  }
  
  // Madde işaretlerini ayır
  const lines = content.areasForImprovement.split('\n').filter(l => l.trim());
  const bulletPoints = lines
    .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
    .map(l => l.replace(/^[-•]\s*/, '').trim());
  
  // Paragraf kısmı
  const paragraphs = lines
    .filter(l => !l.trim().startsWith('-') && !l.trim().startsWith('•'))
    .join(' ');
  
  return {
    title,
    content: paragraphs || content.areasForImprovement,
    bulletPoints
  };
}

// ==================== PRIORITY ACTIONS ====================

function buildPriorityActions(content: StructuredCoachOutput): PDFActionItem[] {
  if (!content.actionableAdvice || content.actionableAdvice.length === 0) {
    return [
      {
        priority: 1,
        title: 'Düzenli Tekrar',
        description: 'Öğrenilen konuları düzenli aralıklarla tekrar edin.',
        estimatedTime: 'Günlük 30 dk'
      }
    ];
  }
  
  return content.actionableAdvice.map((advice, index) => ({
    priority: index + 1,
    title: advice.title,
    description: advice.description,
    estimatedTime: advice.estimatedTime
  }));
}

// ==================== WEEKLY PLAN ====================

function buildWeeklyPlan(content: StructuredCoachOutput, language: 'tr' | 'en'): PDFWeeklyPlan {
  const title = language === 'tr' ? 'Haftalık Mini Öğrenme Planı' : 'Weekly Mini Learning Path';
  
  // Varsayılan plan
  const defaultDays: PDFDayPlan[] = [
    {
      day: language === 'tr' ? 'Pazartesi-Salı' : 'Monday-Tuesday',
      activities: [
        language === 'tr' ? 'Zayıf konuları gözden geçir' : 'Review weak topics',
        language === 'tr' ? 'Kavram haritası oluştur' : 'Create concept maps'
      ]
    },
    {
      day: language === 'tr' ? 'Çarşamba-Perşembe' : 'Wednesday-Thursday',
      activities: [
        language === 'tr' ? 'Pratik sorular çöz' : 'Solve practice questions',
        language === 'tr' ? 'Yanlışları analiz et' : 'Analyze mistakes'
      ]
    },
    {
      day: language === 'tr' ? 'Cuma-Cumartesi' : 'Friday-Saturday',
      activities: [
        language === 'tr' ? 'Mini deneme sınavı' : 'Mini mock exam',
        language === 'tr' ? 'Güçlü yönleri pekiştir' : 'Reinforce strengths'
      ]
    },
    {
      day: language === 'tr' ? 'Pazar' : 'Sunday',
      activities: [
        language === 'tr' ? 'Haftalık özet' : 'Weekly summary',
        language === 'tr' ? 'Dinlenme ve hobi' : 'Rest and hobbies'
      ]
    }
  ];
  
  // Actionable advice'a göre özelleştir
  if (content.actionableAdvice && content.actionableAdvice.length > 0) {
    const advice = content.actionableAdvice[0];
    if (advice.description) {
      defaultDays[0].activities[0] = advice.description.substring(0, 50);
    }
  }
  
  return {
    title,
    days: defaultDays
  };
}

// ==================== CLOSING MESSAGE ====================

function buildClosingMessage(content: StructuredCoachOutput, language: 'tr' | 'en'): string {
  if (content.motivationalClosing) {
    return content.motivationalClosing;
  }
  
  return language === 'tr'
    ? 'Düzenli çalışma ve doğru strateji ile hedeflerine ulaşabilirsin. Her adım seni ileriye taşır!'
    : 'With regular study and the right strategy, you can reach your goals. Every step moves you forward!';
}

// ==================== PDF METADATA ====================

function buildPDFMetadata(snapshot: AISnapshotRecord): PDFMetadata {
  return {
    snapshotId: snapshot.id,
    generatedAt: snapshot.created_at,
    model: snapshot.model,
    dataQuality: mapConfidenceToQuality(snapshot.confidence_score),
    version: '6.0.0'
  };
}

function mapConfidenceToQuality(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ==================== EXPORT ====================

export default {
  toPDFViewModel
};

