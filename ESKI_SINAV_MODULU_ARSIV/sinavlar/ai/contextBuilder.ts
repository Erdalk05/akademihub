/**
 * ============================================
 * AkademiHub - AI Context Builder
 * ============================================
 * 
 * PHASE 5 - Analytics → LLM Context Dönüştürücü
 * 
 * BU DOSYA:
 * - StudentAnalyticsOutput'u LLM için optimize edilmiş context'e dönüştürür
 * - Markdown formatında çıktı üretir
 * - Token optimizasyonu yapar
 * - HESAPLAMA YAPMAZ, sadece format dönüşümü
 */

import type { StudentAnalyticsOutput } from '../analytics/orchestrator/types';
import type { AICoachInput, LLMContext, AIRole, ExamContext } from './types';

// ==================== ANA FONKSİYON ====================

/**
 * Analytics verisini LLM context'ine dönüştürür
 * 
 * @param input - AI Coach girdi
 * @returns LLM için optimize edilmiş context
 */
export function buildLLMContext(input: AICoachInput): LLMContext {
  const { analytics, examContext, role } = input;
  
  // Yapılandırılmış parçaları oluştur
  const summary = buildSummarySection(analytics);
  const subjects = buildSubjectsSection(analytics);
  const trends = buildTrendsSection(analytics);
  const risk = buildRiskSection(analytics);
  const strengths = buildStrengthsSection(analytics);
  const weaknesses = buildWeaknessesSection(analytics);
  
  // Markdown birleştir
  const markdown = buildFullMarkdown(input, {
    summary,
    subjects,
    trends,
    risk,
    strengths,
    weaknesses
  });
  
  // Token tahmini (yaklaşık 4 karakter = 1 token)
  const estimatedTokens = Math.ceil(markdown.length / 4);
  
  return {
    markdown,
    structured: {
      summary,
      subjects,
      trends,
      risk,
      strengths,
      weaknesses
    },
    estimatedTokens
  };
}

// ==================== SECTION BUILDERS ====================

/**
 * Özet bölümünü oluştur
 */
function buildSummarySection(analytics: StudentAnalyticsOutput): string {
  const { summary } = analytics;
  
  let text = '';
  text += `- **Toplam Net:** ${summary.total_net.toFixed(2)}\n`;
  text += `- **Doğru/Yanlış/Boş:** ${summary.total_correct}/${summary.total_wrong}/${summary.total_empty}\n`;
  
  if (summary.percentile !== null) {
    text += `- **Yüzdelik:** %${summary.percentile}\n`;
  }
  
  if (summary.rank_in_class !== null) {
    text += `- **Sınıf Sırası:** ${summary.rank_in_class}\n`;
  }
  
  if (summary.rank_in_exam !== null) {
    text += `- **Sınav Sırası:** ${summary.rank_in_exam}\n`;
  }
  
  if (summary.vs_class_avg !== null) {
    const sign = summary.vs_class_avg >= 0 ? '+' : '';
    text += `- **Sınıf Ort. Farkı:** ${sign}${summary.vs_class_avg.toFixed(2)}\n`;
  }
  
  if (summary.vs_previous_exam !== null) {
    const sign = summary.vs_previous_exam >= 0 ? '+' : '';
    text += `- **Önceki Sınav Farkı:** ${sign}${summary.vs_previous_exam.toFixed(2)}\n`;
  }
  
  if (summary.overall_assessment) {
    text += `- **Genel Değerlendirme:** ${translateAssessment(summary.overall_assessment)}\n`;
  }
  
  return text.trim();
}

/**
 * Ders bazlı performans bölümünü oluştur
 */
function buildSubjectsSection(analytics: StudentAnalyticsOutput): string {
  const { analytics: details } = analytics;
  const subjects = Object.entries(details.subject_performance);
  
  if (subjects.length === 0) {
    return 'Ders verisi bulunmuyor.';
  }
  
  let text = '';
  
  for (const [code, perf] of subjects) {
    const successRate = (perf.rate * 100).toFixed(0);
    text += `- **${perf.name || code}:** ${perf.net.toFixed(2)} net (D:${perf.correct} Y:${perf.wrong} B:${perf.empty}) - %${successRate}`;
    
    if (perf.class_avg !== undefined) {
      const diff = perf.net - perf.class_avg;
      const sign = diff >= 0 ? '+' : '';
      text += ` [Sınıf ort: ${sign}${diff.toFixed(2)}]`;
    }
    
    text += '\n';
  }
  
  return text.trim();
}

/**
 * Trend bölümünü oluştur
 */
function buildTrendsSection(analytics: StudentAnalyticsOutput): string {
  const { trends } = analytics;
  
  // Trend verisi var mı kontrol et
  const hasTrend = trends.net_trend && trends.net_trend.length >= 2;
  
  if (!hasTrend) {
    return 'Trend için yeterli sınav verisi bulunmuyor (en az 2 sınav gerekli).';
  }
  
  let text = '';
  
  text += `- **Trend Yönü:** ${translateTrendDirection(trends.direction)}\n`;
  
  if (trends.net_trend) {
    text += `- **Son Sınavlar:** ${trends.net_trend.map(n => n.toFixed(1)).join(' → ')}\n`;
  }
  
  if (trends.velocity !== undefined) {
    const sign = trends.velocity >= 0 ? '+' : '';
    text += `- **Velocity:** ${sign}${trends.velocity.toFixed(2)} net/sınav\n`;
  }
  
  if (trends.consistency !== undefined) {
    text += `- **Tutarlılık:** %${(trends.consistency * 100).toFixed(0)}\n`;
  }
  
  if (trends.trend_score !== undefined) {
    text += `- **Trend Skoru:** ${trends.trend_score}\n`;
  }
  
  if (trends.explanation) {
    text += `- **Açıklama:** ${trends.explanation}\n`;
  }
  
  return text.trim();
}

/**
 * Risk bölümünü oluştur
 */
function buildRiskSection(analytics: StudentAnalyticsOutput): string {
  const { risk } = analytics;
  
  if (!risk.level || risk.level === 'low') {
    return 'Önemli risk faktörü tespit edilmedi. ✓';
  }
  
  let text = '';
  
  text += `- **Risk Seviyesi:** ${translateRiskLevel(risk.level)}\n`;
  
  if (risk.score !== null) {
    text += `- **Risk Skoru:** ${risk.score}/100\n`;
  }
  
  if (risk.action_required) {
    text += `- **Aksiyon Gerekli:** Evet\n`;
  }
  
  if (risk.primary_concern) {
    text += `- **Ana Odak:** ${risk.primary_concern}\n`;
  }
  
  if (risk.factors && risk.factors.length > 0) {
    text += `- **Faktörler:**\n`;
    for (const factor of risk.factors) {
      if (typeof factor === 'string') {
        text += `  - ${factor}\n`;
      } else if (factor.explanation) {
        text += `  - ${factor.explanation}\n`;
      }
    }
  }
  
  if (risk.summary) {
    text += `- **Özet:** ${risk.summary}\n`;
  }
  
  return text.trim();
}

/**
 * Güçlü yönler bölümünü oluştur
 */
function buildStrengthsSection(analytics: StudentAnalyticsOutput): string {
  const { strengths } = analytics;
  
  if (!strengths || strengths.length === 0) {
    return 'Güçlü yön verisi bulunmuyor.';
  }
  
  return strengths.map(s => {
    if (typeof s === 'string') return `- ${s}`;
    if (s.topic) return `- ${s.topic}`;
    return `- ${JSON.stringify(s)}`;
  }).join('\n');
}

/**
 * Zayıf yönler bölümünü oluştur
 */
function buildWeaknessesSection(analytics: StudentAnalyticsOutput): string {
  const { weaknesses, improvement_priorities } = analytics;
  
  let text = '';
  
  if (weaknesses && weaknesses.length > 0) {
    text += weaknesses.map(w => {
      if (typeof w === 'string') return `- ${w}`;
      if (w.topic) return `- ${w.topic}`;
      return `- ${JSON.stringify(w)}`;
    }).join('\n');
  }
  
  if (improvement_priorities && improvement_priorities.length > 0) {
    if (text) text += '\n\n**Öncelikler:**\n';
    text += improvement_priorities.slice(0, 5).map((p, i) => {
      if (typeof p === 'string') return `${i + 1}. ${p}`;
      if (p.topic) return `${i + 1}. ${p.topic}`;
      return `${i + 1}. ${JSON.stringify(p)}`;
    }).join('\n');
  }
  
  return text || 'Belirgin zayıf yön tespit edilmedi.';
}

// ==================== FULL MARKDOWN BUILDER ====================

interface StructuredSections {
  summary: string;
  subjects: string;
  trends: string;
  risk: string;
  strengths: string;
  weaknesses: string;
}

/**
 * Tam markdown çıktısını oluştur
 */
function buildFullMarkdown(
  input: AICoachInput,
  sections: StructuredSections
): string {
  const { examContext, analytics } = input;
  
  let md = '';
  
  // Header
  md += `## 📋 ÖĞRENCİ ANALİZ VERİLERİ\n\n`;
  
  // Exam context
  md += `**Sınav Türü:** ${examContext.examType}\n`;
  md += `**Sınıf:** ${examContext.gradeLevel}. Sınıf\n`;
  
  if (examContext.examName) {
    md += `**Sınav Adı:** ${examContext.examName}\n`;
  }
  
  if (examContext.daysUntilExam !== undefined) {
    md += `**Sınava Kalan Gün:** ${examContext.daysUntilExam}\n`;
  }
  
  md += '\n';
  
  // Summary
  md += `### 📊 ÖZET\n${sections.summary}\n\n`;
  
  // Subjects
  md += `### 📚 DERS BAZLI PERFORMANS\n${sections.subjects}\n\n`;
  
  // Trends
  md += `### 📈 TREND ANALİZİ\n${sections.trends}\n\n`;
  
  // Risk
  md += `### ⚠️ RİSK DEĞERLENDİRMESİ\n${sections.risk}\n\n`;
  
  // Strengths
  md += `### 💪 GÜÇLÜ YÖNLER\n${sections.strengths}\n\n`;
  
  // Weaknesses
  md += `### 🎯 GELİŞİM ALANLARI\n${sections.weaknesses}\n\n`;
  
  // Study recommendations (varsa)
  if (analytics.study_recommendations && analytics.study_recommendations.length > 0) {
    md += `### 📚 ÇALIŞMA ÖNERİLERİ\n`;
    md += analytics.study_recommendations.map(r => `- ${r}`).join('\n');
    md += '\n\n';
  }
  
  return md.trim();
}

// ==================== ÇEVİRİ YARDIMCILARI ====================

function translateAssessment(assessment: string): string {
  const map: Record<string, string> = {
    excellent: 'Mükemmel',
    good: 'İyi',
    average: 'Orta',
    below_average: 'Ortalamanın Altı',
    needs_improvement: 'Geliştirilmeli'
  };
  return map[assessment] ?? assessment;
}

function translateTrendDirection(direction: string | null): string {
  if (!direction) return 'Belirsiz';
  const map: Record<string, string> = {
    up: 'Yükseliyor ↑',
    down: 'Düşüyor ↓',
    stable: 'Stabil →'
  };
  return map[direction] ?? direction;
}

function translateRiskLevel(level: string): string {
  const map: Record<string, string> = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik'
  };
  return map[level] ?? level;
}

// ==================== TEMPLATE VARIABLES ====================

/**
 * Template değişkenlerini oluştur
 */
export function buildTemplateVariables(input: AICoachInput): Record<string, string | number | boolean> {
  const { analytics, examContext } = input;
  const { summary, trends, risk } = analytics;
  
  return {
    // Exam context
    examType: examContext.examType,
    gradeLevel: examContext.gradeLevel,
    daysUntilExam: examContext.daysUntilExam ?? '',
    
    // Summary
    totalNet: summary.total_net.toFixed(2),
    correct: summary.total_correct,
    wrong: summary.total_wrong,
    empty: summary.total_empty,
    percentile: summary.percentile ?? '',
    rankInClass: summary.rank_in_class ?? '',
    rankInExam: summary.rank_in_exam ?? '',
    vsClassAvg: summary.vs_class_avg !== null 
      ? `${summary.vs_class_avg >= 0 ? '+' : ''}${summary.vs_class_avg.toFixed(2)}` 
      : '',
    vsPreviousExam: summary.vs_previous_exam !== null
      ? `${summary.vs_previous_exam >= 0 ? '+' : ''}${summary.vs_previous_exam.toFixed(2)}`
      : '',
    
    // Trends
    hasTrend: !!(trends.net_trend && trends.net_trend.length >= 2),
    trendDirection: translateTrendDirection(trends.direction),
    netTrend: trends.net_trend?.map(n => n.toFixed(1)).join(' → ') ?? '',
    trendScore: trends.trend_score ?? '',
    velocity: trends.velocity?.toFixed(2) ?? '',
    consistency: trends.consistency !== undefined ? `%${(trends.consistency * 100).toFixed(0)}` : '',
    trendExplanation: trends.explanation ?? '',
    examCount: trends.net_trend?.length ?? 0,
    
    // Risk
    hasRisk: !!(risk.level && risk.level !== 'low'),
    riskLevel: translateRiskLevel(risk.level ?? 'low'),
    riskScore: risk.score ?? '',
    actionRequired: risk.action_required,
    primaryConcern: risk.primary_concern ?? '',
    riskSummary: risk.summary ?? '',
    riskFactors: risk.factors?.map(f => 
      typeof f === 'string' ? f : f.explanation ?? ''
    ).filter(Boolean).join('\n- ') ?? '',
    
    // Subjects
    subjectPerformance: buildSubjectsSection(analytics),
    subjectPerformanceDetailed: buildSubjectsSection(analytics),
    
    // Strengths/Weaknesses
    strengths: buildStrengthsSection(analytics),
    weaknesses: buildWeaknessesSection(analytics),
    improvementPriorities: analytics.improvement_priorities?.slice(0, 5).map((p, i) => {
      if (typeof p === 'string') return `${i + 1}. ${p}`;
      return `${i + 1}. ${JSON.stringify(p)}`;
    }).join('\n') ?? '',
    studyRecommendations: analytics.study_recommendations?.join('\n- ') ?? '',
    
    // Difficulty (varsa)
    hasDifficultyData: !!analytics.analytics?.difficulty_performance,
    easyCorrect: analytics.analytics?.difficulty_performance?.easy?.correct ?? 0,
    easyTotal: analytics.analytics?.difficulty_performance?.easy?.total ?? 0,
    easyRate: ((analytics.analytics?.difficulty_performance?.easy?.rate ?? 0) * 100).toFixed(0),
    mediumCorrect: analytics.analytics?.difficulty_performance?.medium?.correct ?? 0,
    mediumTotal: analytics.analytics?.difficulty_performance?.medium?.total ?? 0,
    mediumRate: ((analytics.analytics?.difficulty_performance?.medium?.rate ?? 0) * 100).toFixed(0),
    hardCorrect: analytics.analytics?.difficulty_performance?.hard?.correct ?? 0,
    hardTotal: analytics.analytics?.difficulty_performance?.hard?.total ?? 0,
    hardRate: ((analytics.analytics?.difficulty_performance?.hard?.rate ?? 0) * 100).toFixed(0),
    
    // Meta
    dataCompleteness: `%${((analytics.calculation_metadata?.data_completeness ?? 0) * 100).toFixed(0)}`,
    confidenceScore: `%${((analytics.calculation_metadata?.confidence_score ?? 0) * 100).toFixed(0)}`,
    calculatedAt: analytics.calculation_metadata?.calculated_at ?? new Date().toISOString()
  };
}

// ==================== EXPORT ====================

export default {
  buildLLMContext,
  buildTemplateVariables,
  buildSummarySection,
  buildSubjectsSection,
  buildTrendsSection,
  buildRiskSection,
  buildStrengthsSection,
  buildWeaknessesSection
};

