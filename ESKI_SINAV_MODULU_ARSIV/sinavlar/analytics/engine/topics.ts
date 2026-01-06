/**
 * ============================================
 * AkademiHub - Pure Topic Analysis Functions
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * Sadece input → output
 */

import type {
  TopicAnalysisInput,
  TopicAnalysisResult,
  TopicInput,
  TopicResultItem,
  StrengthItem,
  WeaknessItem,
  ImprovementPriority,
  TopicStatus,
  TopicAnalysisConfig
} from './types';
import { DEFAULT_TOPIC_CONFIG } from './types';

// ==================== KONU ANALİZİ ====================

/**
 * Konu bazlı analiz yapar
 * Güçlü/zayıf yönleri belirler, önerileri oluşturur
 * 
 * @param input - Konu analizi girdisi
 * @returns Konu analizi sonucu
 */
export function analyzeTopics(input: TopicAnalysisInput): TopicAnalysisResult {
  const { topics } = input;
  const config = { ...DEFAULT_TOPIC_CONFIG, ...input.config };
  
  if (!topics || topics.length === 0) {
    return createEmptyResult();
  }
  
  // Her konu için sonuç hesapla
  const topicResults = topics
    .filter(t => t.total >= config.minQuestionsForAnalysis)
    .map(t => calculateTopicResult(t, config));
  
  // Güçlü yönleri belirle
  const strengths = identifyStrengths(topicResults);
  
  // Zayıf yönleri belirle
  const weaknesses = identifyWeaknesses(topicResults);
  
  // İyileştirme önceliklerini belirle
  const improvementPriorities = calculateImprovementPriorities(topicResults, weaknesses);
  
  // Çalışma önerilerini oluştur
  const studyRecommendations = generateStudyRecommendations(weaknesses, improvementPriorities);
  
  return {
    topics: topicResults,
    strengths,
    weaknesses,
    improvementPriorities,
    studyRecommendations
  };
}

// ==================== KONU SONUCU HESAPLAMA ====================

/**
 * Tek bir konu için sonuç hesaplar
 */
function calculateTopicResult(
  topic: TopicInput,
  config: TopicAnalysisConfig
): TopicResultItem {
  const { correct, wrong, empty, total } = topic;
  
  // Başarı oranı
  const rate = total > 0 ? correct / total : 0;
  
  // Durum belirleme
  const status = determineStatus(rate, config);
  
  return {
    topicId: topic.topicId,
    topicName: topic.topicName,
    subjectCode: topic.subjectCode,
    correct,
    wrong,
    empty,
    total,
    rate: round(rate, 4),
    status
  };
}

/**
 * Başarı oranına göre durum belirler
 */
function determineStatus(rate: number, config: TopicAnalysisConfig): TopicStatus {
  if (rate >= config.excellentThreshold) return 'excellent';
  if (rate >= config.goodThreshold) return 'good';
  if (rate >= config.averageThreshold) return 'average';
  if (rate >= config.weakThreshold) return 'weak';
  return 'critical';
}

// ==================== GÜÇLÜ YÖNLER ====================

/**
 * Güçlü yönleri belirler
 */
function identifyStrengths(topics: TopicResultItem[]): StrengthItem[] {
  // Rate'e göre sırala (yüksekten düşüğe)
  const sorted = [...topics].sort((a, b) => b.rate - a.rate);
  
  // En iyi performans gösterilen konular
  const strengths: StrengthItem[] = [];
  
  for (let i = 0; i < sorted.length && strengths.length < 5; i++) {
    const topic = sorted[i];
    
    // Sadece 'excellent' veya 'good' olanları al
    if (topic.status === 'excellent' || topic.status === 'good') {
      strengths.push({
        topic: topic.topicName,
        topicId: topic.topicId,
        subject: topic.subjectCode,
        rate: topic.rate,
        rank: i + 1,
        description: getStrengthDescription(topic)
      });
    }
  }
  
  return strengths;
}

/**
 * Güçlü yön açıklaması oluşturur
 */
function getStrengthDescription(topic: TopicResultItem): string {
  const percent = Math.round(topic.rate * 100);
  
  if (topic.status === 'excellent') {
    return `${topic.topicName} konusunda %${percent} başarı ile mükemmel performans`;
  }
  
  return `${topic.topicName} konusunda %${percent} başarı oranı`;
}

// ==================== ZAYIF YÖNLER ====================

/**
 * Zayıf yönleri belirler
 */
function identifyWeaknesses(topics: TopicResultItem[]): WeaknessItem[] {
  // Rate'e göre sırala (düşükten yükseğe)
  const sorted = [...topics].sort((a, b) => a.rate - b.rate);
  
  const weaknesses: WeaknessItem[] = [];
  
  for (let i = 0; i < sorted.length && weaknesses.length < 5; i++) {
    const topic = sorted[i];
    
    // Sadece 'weak' veya 'critical' olanları al
    if (topic.status === 'weak' || topic.status === 'critical') {
      weaknesses.push({
        topic: topic.topicName,
        topicId: topic.topicId,
        subject: topic.subjectCode,
        rate: topic.rate,
        priority: determinePriority(topic),
        description: getWeaknessDescription(topic)
      });
    }
  }
  
  return weaknesses;
}

/**
 * Zayıf yön önceliği belirler
 */
function determinePriority(topic: TopicResultItem): 'high' | 'medium' | 'low' {
  if (topic.status === 'critical') return 'high';
  if (topic.rate < 0.3) return 'high';
  if (topic.rate < 0.4) return 'medium';
  return 'low';
}

/**
 * Zayıf yön açıklaması oluşturur
 */
function getWeaknessDescription(topic: TopicResultItem): string {
  const percent = Math.round(topic.rate * 100);
  const wrongCount = topic.wrong;
  
  if (topic.status === 'critical') {
    return `${topic.topicName} konusunda %${percent} başarı - ACİL iyileştirme gerekli`;
  }
  
  return `${topic.topicName} konusunda ${wrongCount} yanlış, %${percent} başarı`;
}

// ==================== İYİLEŞTİRME ÖNCELİKLERİ ====================

/**
 * İyileştirme önceliklerini hesaplar
 */
function calculateImprovementPriorities(
  topics: TopicResultItem[],
  weaknesses: WeaknessItem[]
): ImprovementPriority[] {
  const priorities: ImprovementPriority[] = [];
  
  // Zayıf konuları öncelik sırasına koy
  const weakTopics = topics.filter(t => 
    t.status === 'weak' || t.status === 'critical' || t.status === 'average'
  );
  
  // Soru sayısı ve başarı oranına göre impact hesapla
  const topicsWithImpact = weakTopics.map(topic => {
    // Soru ağırlığı (daha fazla soru = daha önemli)
    const questionWeight = topic.total / Math.max(1, topics.reduce((sum, t) => sum + t.total, 0));
    
    // Potansiyel iyileşme (düşük rate = daha fazla potansiyel)
    const improvementPotential = 1 - topic.rate;
    
    // Tahmini net artışı
    const estimatedImpact = questionWeight * improvementPotential * topic.total;
    
    return {
      topic,
      impact: estimatedImpact
    };
  });
  
  // Impact'e göre sırala
  topicsWithImpact.sort((a, b) => b.impact - a.impact);
  
  // İlk 5 tanesini öncelik olarak belirle
  for (let i = 0; i < topicsWithImpact.length && i < 5; i++) {
    const { topic, impact } = topicsWithImpact[i];
    
    priorities.push({
      topic: topic.topicName,
      topicId: topic.topicId,
      priority: i + 1,
      reason: generatePriorityReason(topic, impact),
      estimatedImpact: round(impact, 2)
    });
  }
  
  return priorities;
}

/**
 * Öncelik nedeni oluşturur
 */
function generatePriorityReason(topic: TopicResultItem, impact: number): string {
  const percent = Math.round(topic.rate * 100);
  
  if (topic.status === 'critical') {
    return `Kritik seviyede (%${percent}), ${topic.total} soru - yüksek etki potansiyeli`;
  }
  
  if (topic.status === 'weak') {
    return `Zayıf performans (%${percent}), iyileştirme ile ~${impact.toFixed(1)} net artışı beklenir`;
  }
  
  return `Ortalama performans (%${percent}), geliştirilebilir alan`;
}

// ==================== ÇALIŞMA ÖNERİLERİ ====================

/**
 * Çalışma önerileri oluşturur
 */
function generateStudyRecommendations(
  weaknesses: WeaknessItem[],
  priorities: ImprovementPriority[]
): string[] {
  const recommendations: string[] = [];
  
  if (weaknesses.length === 0) {
    recommendations.push('Tebrikler! Tüm konularda iyi performans gösteriyorsunuz. Mevcut seviyeyi korumak için düzenli tekrar yapın.');
    return recommendations;
  }
  
  // Genel öneri
  if (weaknesses.length >= 3) {
    recommendations.push(`${weaknesses.length} konuda iyileştirme gerekiyor. Öncelikli konulara odaklanarak başlayın.`);
  }
  
  // En öncelikli konular için özel öneriler
  for (let i = 0; i < Math.min(3, priorities.length); i++) {
    const priority = priorities[i];
    const weakness = weaknesses.find(w => w.topicId === priority.topicId);
    
    if (weakness?.priority === 'high') {
      recommendations.push(`📌 ${priority.topic}: Günlük 20-30 dk çalışma + bol soru çözümü önerilir.`);
    } else {
      recommendations.push(`📝 ${priority.topic}: Konu tekrarı ve test çözümü ile güçlendirebilirsiniz.`);
    }
  }
  
  // Ders bazlı öneri
  const subjectCounts = new Map<string, number>();
  weaknesses.forEach(w => {
    if (w.subject) {
      subjectCounts.set(w.subject, (subjectCounts.get(w.subject) || 0) + 1);
    }
  });
  
  // En çok zayıf konusu olan ders
  let maxSubject = '';
  let maxCount = 0;
  subjectCounts.forEach((count, subject) => {
    if (count > maxCount) {
      maxCount = count;
      maxSubject = subject;
    }
  });
  
  if (maxSubject && maxCount >= 2) {
    recommendations.push(`⚠️ ${maxSubject} dersinde ${maxCount} zayıf konu var. Bu derse ek çalışma zamanı ayırın.`);
  }
  
  return recommendations;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function createEmptyResult(): TopicAnalysisResult {
  return {
    topics: [],
    strengths: [],
    weaknesses: [],
    improvementPriorities: [],
    studyRecommendations: ['Analiz için yeterli konu verisi yok.']
  };
}

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== GENEL DEĞERLENDİRME ====================

import type { OverallAssessment } from './types';

/**
 * Genel değerlendirme yapar
 */
export function calculateOverallAssessment(
  topicResults: TopicResultItem[]
): { assessment: OverallAssessment; summary: string } {
  if (topicResults.length === 0) {
    return { assessment: 'average', summary: 'Değerlendirme için yeterli veri yok.' };
  }
  
  // Status dağılımı
  const statusCounts = {
    excellent: topicResults.filter(t => t.status === 'excellent').length,
    good: topicResults.filter(t => t.status === 'good').length,
    average: topicResults.filter(t => t.status === 'average').length,
    weak: topicResults.filter(t => t.status === 'weak').length,
    critical: topicResults.filter(t => t.status === 'critical').length
  };
  
  const total = topicResults.length;
  
  // Ortalama rate
  const avgRate = topicResults.reduce((sum, t) => sum + t.rate, 0) / total;
  
  // Değerlendirme
  let assessment: OverallAssessment;
  let summary: string;
  
  if (statusCounts.critical >= total * 0.3 || avgRate < 0.3) {
    assessment = 'needs_improvement';
    summary = 'Acil iyileştirme gerekiyor. Temel konuların tekrar edilmesi önerilir.';
  } else if (statusCounts.weak + statusCounts.critical >= total * 0.4 || avgRate < 0.5) {
    assessment = 'below_average';
    summary = 'Ortalamanın altında performans. Zayıf konulara odaklanılması gerekiyor.';
  } else if (statusCounts.excellent + statusCounts.good >= total * 0.7 && avgRate >= 0.75) {
    assessment = 'excellent';
    summary = 'Mükemmel performans! Tüm konularda yüksek başarı gösterildi.';
  } else if (statusCounts.excellent + statusCounts.good >= total * 0.5 || avgRate >= 0.65) {
    assessment = 'good';
    summary = 'İyi performans. Bazı konularda iyileştirme ile daha da yükselilebilir.';
  } else {
    assessment = 'average';
    summary = 'Ortalama performans. Düzenli çalışma ile gelişim sağlanabilir.';
  }
  
  return { assessment, summary };
}

// ==================== EXPORT ====================

export default {
  analyzeTopics,
  calculateOverallAssessment
};
