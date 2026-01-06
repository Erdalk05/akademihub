/**
 * ============================================
 * AkademiHub - Dashboard Adapter
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Snapshot → Dashboard ViewModel dönüşümü
 * - HESAPLAMA YOK
 * - AI TETİKLEME YOK
 */

import type { AISnapshotRecord } from '../../ai/cache/types';
import type { StructuredCoachOutput } from '../../ai/types';
import type {
  DashboardViewModel,
  InsightPulseViewModel,
  ProductDataState,
  StatusColor,
  PriorityItem,
  CTAButton,
  DashboardMetadata,
  ProductAdapterInput
} from '../types';
import { STATUS_COLORS, CTA_ICONS, TREND_ICONS } from '../types';
import { getI18n } from '../whatsapp/i18n';

// ==================== ANA FONKSİYON ====================

/**
 * Snapshot'ı Dashboard ViewModel'e dönüştürür
 * 
 * @param input - Adapter input
 * @returns Dashboard ViewModel
 */
export function toDashboardViewModel(input: ProductAdapterInput): DashboardViewModel {
  const { snapshot, role, language, stateOverride } = input;
  const i18n = getI18n(language);
  
  // State belirleme
  const state = stateOverride || determineState(snapshot);
  
  // Snapshot yoksa empty state döndür
  if (!snapshot || state === 'empty') {
    return createEmptyDashboard(role, language, state);
  }
  
  // Snapshot'tan structured content al
  const content = snapshot.content as StructuredCoachOutput;
  
  // ViewModel oluştur
  return {
    header: buildHeader(content, snapshot),
    body: buildBody(content),
    priorityList: buildPriorityList(content),
    statusColor: determineStatusColor(snapshot),
    ctas: buildCTAs(role, language),
    isFallback: snapshot.source === 'fallback',
    state,
    metadata: buildMetadata(snapshot, role)
  };
}

/**
 * Snapshot'ı InsightPulse ViewModel'e dönüştürür
 */
export function toInsightPulseViewModel(input: ProductAdapterInput): InsightPulseViewModel {
  const { snapshot, language } = input;
  const i18n = getI18n(language);
  
  if (!snapshot) {
    return createEmptyInsightPulse(language);
  }
  
  const content = snapshot.content as StructuredCoachOutput;
  
  // Trend analizi
  const trendDirection = determineTrendDirection(content.trendAnalysis);
  const trendMessage = buildTrendMessage(content.trendAnalysis, trendDirection, language);
  
  // Risk analizi
  const riskLevel = determineRiskLevel(content.riskAnalysis);
  const riskMessage = content.riskAnalysis || null;
  
  // Pulse değeri (confidence score'dan)
  const pulseValue = Math.min(100, Math.max(0, snapshot.confidence_score));
  
  return {
    trendDirection,
    trendMessage,
    trendIcon: TREND_ICONS[trendDirection],
    riskLevel,
    riskMessage,
    pulseValue,
    pulseColor: STATUS_COLORS[riskLevel] || 'green'
  };
}

// ==================== HEADER BUILDER ====================

function buildHeader(content: StructuredCoachOutput, snapshot: AISnapshotRecord): string {
  // Greeting veya performans özetinden ilk cümle
  if (content.greeting && content.greeting.length > 10) {
    return content.greeting;
  }
  
  if (content.performanceSummary) {
    // İlk cümleyi al
    const firstSentence = content.performanceSummary.split('.')[0];
    return firstSentence + '.';
  }
  
  // Fallback
  return 'Sınav performansın değerlendirildi.';
}

// ==================== BODY BUILDER ====================

function buildBody(content: StructuredCoachOutput): string {
  const parts: string[] = [];
  
  // Performans özeti
  if (content.performanceSummary) {
    // İlk 2-3 cümle
    const sentences = content.performanceSummary.split('.').filter(s => s.trim());
    parts.push(sentences.slice(0, 2).join('. ') + '.');
  }
  
  // Body boşsa fallback
  if (parts.length === 0) {
    return 'Detaylı analiz için aşağıdaki aksiyonları inceleyebilirsin.';
  }
  
  return parts.join(' ');
}

// ==================== PRIORITY LIST BUILDER ====================

function buildPriorityList(content: StructuredCoachOutput): PriorityItem[] {
  const items: PriorityItem[] = [];
  
  // Actionable advice'dan al
  if (content.actionableAdvice && content.actionableAdvice.length > 0) {
    content.actionableAdvice.slice(0, 3).forEach((advice, index) => {
      items.push({
        priority: index + 1,
        title: advice.title,
        description: advice.description,
        category: advice.category,
        icon: getCategoryIcon(advice.category)
      });
    });
  }
  
  // Eğer advice yoksa, areas for improvement'dan çıkar
  if (items.length === 0 && content.areasForImprovement) {
    const lines = content.areasForImprovement.split('\n').filter(l => l.trim());
    lines.slice(0, 3).forEach((line, index) => {
      items.push({
        priority: index + 1,
        title: `Gelişim Alanı ${index + 1}`,
        description: line.replace(/^[-•]\s*/, '').trim(),
        category: 'focus',
        icon: '🎯'
      });
    });
  }
  
  return items;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    study: '📚',
    practice: '✍️',
    review: '🔄',
    focus: '🎯',
    rest: '😴'
  };
  return icons[category] || '📌';
}

// ==================== STATUS COLOR ====================

function determineStatusColor(snapshot: AISnapshotRecord): StatusColor {
  // Confidence score'a göre
  const score = snapshot.confidence_score;
  
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'softRed';
}

// ==================== CTA BUILDER ====================

function buildCTAs(role: string, language: 'tr' | 'en'): CTAButton[] {
  const i18n = getI18n(language);
  
  const ctas: CTAButton[] = [
    {
      label: i18n.cta.downloadPdf,
      action: 'download_pdf',
      icon: CTA_ICONS.download_pdf,
      enabled: true
    },
    {
      label: i18n.cta.viewDetails,
      action: 'view_details',
      icon: CTA_ICONS.view_details,
      enabled: true
    }
  ];
  
  // Öğrenci için öğretmene sor
  if (role === 'student') {
    ctas.push({
      label: i18n.cta.askTeacher,
      action: 'ask_teacher',
      icon: CTA_ICONS.ask_teacher,
      enabled: true
    });
  }
  
  // Veli için WhatsApp paylaş
  if (role === 'parent') {
    ctas.push({
      label: i18n.cta.shareWhatsapp,
      action: 'share_whatsapp',
      icon: CTA_ICONS.share_whatsapp,
      enabled: true
    });
  }
  
  return ctas;
}

// ==================== METADATA BUILDER ====================

function buildMetadata(snapshot: AISnapshotRecord, role: string): DashboardMetadata {
  return {
    snapshotId: snapshot.id,
    generatedAt: snapshot.created_at,
    model: snapshot.model,
    role: role as DashboardMetadata['role'],
    dataQuality: mapConfidenceToQuality(snapshot.confidence_score),
    lastUpdated: snapshot.updated_at
  };
}

function mapConfidenceToQuality(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ==================== STATE DETERMINATION ====================

function determineState(snapshot: AISnapshotRecord | null): ProductDataState {
  if (!snapshot) return 'empty';
  
  switch (snapshot.status) {
    case 'ready':
      // Yaş kontrolü - 7 günden eski ise stale
      const age = Date.now() - new Date(snapshot.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (age > sevenDays) return 'stale';
      return 'ready';
    
    case 'computing':
      return 'generating';
    
    case 'failed':
      return 'error';
    
    default:
      return 'empty';
  }
}

// ==================== TREND HELPERS ====================

function determineTrendDirection(trendAnalysis: string | null): InsightPulseViewModel['trendDirection'] {
  if (!trendAnalysis) return 'unknown';
  
  const text = trendAnalysis.toLowerCase();
  
  if (text.includes('yüksel') || text.includes('artı') || text.includes('ilerle') || text.includes('gelişim')) {
    return 'up';
  }
  
  if (text.includes('düş') || text.includes('azal') || text.includes('gerileme')) {
    return 'down';
  }
  
  if (text.includes('stabil') || text.includes('sabit') || text.includes('aynı')) {
    return 'stable';
  }
  
  return 'unknown';
}

function buildTrendMessage(
  trendAnalysis: string | null,
  direction: InsightPulseViewModel['trendDirection'],
  language: 'tr' | 'en'
): string {
  const i18n = getI18n(language);
  
  if (trendAnalysis) {
    // İlk cümleyi al
    return trendAnalysis.split('.')[0] + '.';
  }
  
  return i18n.trend[direction];
}

// ==================== RISK HELPERS ====================

function determineRiskLevel(riskAnalysis: string | null): InsightPulseViewModel['riskLevel'] {
  if (!riskAnalysis) return 'unknown';
  
  const text = riskAnalysis.toLowerCase();
  
  if (text.includes('yüksek risk') || text.includes('acil') || text.includes('kritik')) {
    return 'high';
  }
  
  if (text.includes('orta') || text.includes('dikkat')) {
    return 'medium';
  }
  
  if (text.includes('düşük') || text.includes('iyi') || text.includes('stabil')) {
    return 'low';
  }
  
  return 'unknown';
}

// ==================== EMPTY STATES ====================

function createEmptyDashboard(
  role: string,
  language: 'tr' | 'en',
  state: ProductDataState
): DashboardViewModel {
  const i18n = getI18n(language);
  
  let header = i18n.dashboard.empty;
  let body = '';
  
  switch (state) {
    case 'generating':
      header = i18n.dashboard.generating;
      body = 'Koçunuz analiz yapıyor, lütfen bekleyin...';
      break;
    case 'stale':
      header = i18n.dashboard.stale;
      body = 'Yeni analiz hazırlanıyor, mevcut yorum gösteriliyor.';
      break;
    case 'error':
      header = i18n.dashboard.error;
      body = 'Analiz yüklenirken bir hata oluştu.';
      break;
    default:
      header = i18n.dashboard.empty;
      body = 'Henüz AI koç yorumu oluşturulmadı.';
  }
  
  return {
    header,
    body,
    priorityList: [],
    statusColor: 'amber',
    ctas: buildCTAs(role, language),
    isFallback: false,
    state,
    metadata: {
      snapshotId: null,
      generatedAt: null,
      model: null,
      role: role as DashboardMetadata['role'],
      dataQuality: 'low',
      lastUpdated: null
    }
  };
}

function createEmptyInsightPulse(language: 'tr' | 'en'): InsightPulseViewModel {
  const i18n = getI18n(language);
  
  return {
    trendDirection: 'unknown',
    trendMessage: i18n.trend.unknown,
    trendIcon: TREND_ICONS.unknown,
    riskLevel: 'unknown',
    riskMessage: null,
    pulseValue: 50,
    pulseColor: 'amber'
  };
}

// ==================== EXPORT ====================

export default {
  toDashboardViewModel,
  toInsightPulseViewModel
};

