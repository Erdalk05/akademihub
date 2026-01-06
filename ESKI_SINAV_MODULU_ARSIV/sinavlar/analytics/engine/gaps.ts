/**
 * ============================================
 * AkademiHub - Pure Learning Gap Detection
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * 
 * Öğrenme açığı tespiti:
 * - Konu bazlı boşluklar
 * - Kazanım eksikleri
 * - Ön koşul analizi
 * - Kritik yol tespiti
 */

// ==================== TYPES ====================

export interface LearningGapInput {
  topics: TopicPerformance[];
  outcomes?: OutcomePerformance[];
  prerequisites?: PrerequisiteMapping[];
  config?: GapDetectionConfig;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectCode: string;
  
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  
  // Opsiyonel metadata
  gradeLevel?: number;              // Sınıf seviyesi
  difficulty?: number;              // Ortalama zorluk
  importance?: number;              // Önem derecesi (0-1)
  examWeight?: number;              // Sınavdaki ağırlık
}

export interface OutcomePerformance {
  outcomeId: string;
  outcomeCode: string;              // T.8.1.2 gibi
  outcomeName: string;
  topicId: string;
  
  correct: number;
  total: number;
}

export interface PrerequisiteMapping {
  topicId: string;
  prerequisiteTopicIds: string[];
}

export interface GapDetectionConfig {
  weakThreshold: number;            // Varsayılan: 0.40
  criticalThreshold: number;        // Varsayılan: 0.25
  masteryThreshold: number;         // Varsayılan: 0.70
  minQuestionsForAnalysis: number;  // Varsayılan: 2
}

export interface LearningGapResult {
  gaps: LearningGap[];
  criticalGaps: LearningGap[];
  gapClusters: GapCluster[];
  cascadingRisks: CascadingRisk[];
  summary: GapSummary;
}

export interface LearningGap {
  type: 'topic' | 'outcome' | 'prerequisite';
  severity: 'critical' | 'moderate' | 'minor';
  
  topicId: string;
  topicName: string;
  subjectCode: string;
  
  // Performans
  successRate: number;
  correct: number;
  wrong: number;
  total: number;
  
  // Öncelik
  priority: number;                 // 1 = en yüksek
  priorityReason: string;
  
  // İlişkili kazanımlar
  relatedOutcomes?: string[];
  
  // Öneriler
  recommendation: string;
}

export interface GapCluster {
  clusterName: string;
  subjectCode: string;
  topics: string[];
  avgSuccessRate: number;
  commonPattern: string;
}

export interface CascadingRisk {
  prerequisiteTopic: string;
  prerequisiteSuccess: number;
  affectedTopics: string[];
  riskLevel: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface GapSummary {
  totalTopics: number;
  masteredTopics: number;
  weakTopics: number;
  criticalTopics: number;
  overallHealthScore: number;       // 0-100
  subjectBreakdown: Record<string, {
    mastered: number;
    weak: number;
    critical: number;
  }>;
}

// ==================== DEFAULT CONFIG ====================

const DEFAULT_CONFIG: GapDetectionConfig = {
  weakThreshold: 0.40,
  criticalThreshold: 0.25,
  masteryThreshold: 0.70,
  minQuestionsForAnalysis: 2
};

// ==================== ANA ANALİZ FONKSİYONU ====================

/**
 * Öğrenme açıklarını tespit eder
 * 
 * @param input - Öğrenme açığı girdisi
 * @returns Öğrenme açığı analiz sonucu
 */
export function detectLearningGaps(input: LearningGapInput): LearningGapResult {
  const config = { ...DEFAULT_CONFIG, ...input.config };
  
  // Filtreleme: minimum soru sayısı
  const validTopics = input.topics.filter(t => t.total >= config.minQuestionsForAnalysis);
  
  if (validTopics.length === 0) {
    return createEmptyResult();
  }
  
  // 1. Konu bazlı açıkları tespit et
  const topicGaps = detectTopicGaps(validTopics, config);
  
  // 2. Kazanım bazlı açıkları tespit et
  const outcomeGaps = input.outcomes 
    ? detectOutcomeGaps(input.outcomes, config)
    : [];
  
  // 3. Ön koşul risklerini tespit et
  const cascadingRisks = input.prerequisites
    ? detectCascadingRisks(validTopics, input.prerequisites, config)
    : [];
  
  // 4. Tüm açıkları birleştir ve önceliklendir
  const allGaps = [...topicGaps, ...outcomeGaps]
    .sort((a, b) => a.priority - b.priority);
  
  // 5. Kritik açıkları ayır
  const criticalGaps = allGaps.filter(g => g.severity === 'critical');
  
  // 6. Açık kümelerini tespit et
  const gapClusters = detectGapClusters(topicGaps);
  
  // 7. Özet oluştur
  const summary = generateGapSummary(validTopics, config);
  
  return {
    gaps: allGaps,
    criticalGaps,
    gapClusters,
    cascadingRisks,
    summary
  };
}

// ==================== KONU AÇIĞI TESPİTİ ====================

function detectTopicGaps(
  topics: TopicPerformance[],
  config: GapDetectionConfig
): LearningGap[] {
  const gaps: LearningGap[] = [];
  
  for (const topic of topics) {
    const successRate = topic.total > 0 ? topic.correct / topic.total : 0;
    
    // Sadece zayıf konuları ekle
    if (successRate >= config.masteryThreshold) continue;
    
    const severity = determineSeverity(successRate, config);
    const priority = calculatePriority(topic, successRate, config);
    
    gaps.push({
      type: 'topic',
      severity,
      topicId: topic.topicId,
      topicName: topic.topicName,
      subjectCode: topic.subjectCode,
      successRate: round(successRate, 4),
      correct: topic.correct,
      wrong: topic.wrong,
      total: topic.total,
      priority,
      priorityReason: generatePriorityReason(topic, successRate, severity),
      recommendation: generateRecommendation(topic, successRate, severity)
    });
  }
  
  // Önceliğe göre sırala
  return gaps.sort((a, b) => a.priority - b.priority);
}

function determineSeverity(
  successRate: number,
  config: GapDetectionConfig
): 'critical' | 'moderate' | 'minor' {
  if (successRate < config.criticalThreshold) return 'critical';
  if (successRate < config.weakThreshold) return 'moderate';
  return 'minor';
}

function calculatePriority(
  topic: TopicPerformance,
  successRate: number,
  config: GapDetectionConfig
): number {
  // Öncelik faktörleri (düşük = daha önemli)
  let priority = 100;
  
  // 1. Düşük başarı oranı → yüksek öncelik
  priority -= (1 - successRate) * 40;
  
  // 2. Yüksek önem → yüksek öncelik
  if (topic.importance) {
    priority -= topic.importance * 20;
  }
  
  // 3. Yüksek sınav ağırlığı → yüksek öncelik
  if (topic.examWeight) {
    priority -= topic.examWeight * 20;
  }
  
  // 4. Daha fazla soru → daha güvenilir veri → yüksek öncelik
  priority -= Math.min(10, topic.total) * 2;
  
  // 1-100 arasına normalize et
  return Math.max(1, Math.min(100, Math.round(priority)));
}

function generatePriorityReason(
  topic: TopicPerformance,
  successRate: number,
  severity: string
): string {
  const percent = Math.round(successRate * 100);
  
  if (severity === 'critical') {
    return `Kritik seviyede (%${percent}) - Acil müdahale gerekli`;
  }
  
  if (topic.examWeight && topic.examWeight > 0.1) {
    return `Zayıf performans (%${percent}) + Yüksek sınav ağırlığı`;
  }
  
  if (topic.wrong > topic.correct) {
    return `Yanlış sayısı doğrudan fazla (${topic.wrong}/${topic.correct})`;
  }
  
  return `Düşük başarı oranı (%${percent})`;
}

function generateRecommendation(
  topic: TopicPerformance,
  successRate: number,
  severity: string
): string {
  const percent = Math.round(successRate * 100);
  
  if (severity === 'critical') {
    return `${topic.topicName} konusunu baştan gözden geçirin. Video ders izleme + konu anlatımı önerilir.`;
  }
  
  if (topic.wrong > topic.empty) {
    return `${topic.topicName} konusunda kavram karmaşası var. Yanlış sorularınızı analiz edin.`;
  }
  
  if (topic.empty > 0) {
    return `${topic.topicName} konusunda boş bırakma var. Soru tiplerini tanıyın, pratik yapın.`;
  }
  
  return `${topic.topicName} konusunda düzenli tekrar ve soru çözümü önerilir.`;
}

// ==================== KAZANIM AÇIĞI TESPİTİ ====================

function detectOutcomeGaps(
  outcomes: OutcomePerformance[],
  config: GapDetectionConfig
): LearningGap[] {
  const gaps: LearningGap[] = [];
  
  for (const outcome of outcomes) {
    const successRate = outcome.total > 0 ? outcome.correct / outcome.total : 0;
    
    if (successRate >= config.masteryThreshold) continue;
    
    const severity = determineSeverity(successRate, config);
    
    gaps.push({
      type: 'outcome',
      severity,
      topicId: outcome.topicId,
      topicName: outcome.outcomeName,
      subjectCode: outcome.outcomeCode.split('.')[0] || '',
      successRate: round(successRate, 4),
      correct: outcome.correct,
      wrong: outcome.total - outcome.correct,
      total: outcome.total,
      priority: severity === 'critical' ? 1 : severity === 'moderate' ? 2 : 3,
      priorityReason: `Kazanım: ${outcome.outcomeCode}`,
      recommendation: `"${outcome.outcomeName}" kazanımı için ek çalışma gerekli.`
    });
  }
  
  return gaps;
}

// ==================== ÖN KOŞUL RİSKİ TESPİTİ ====================

function detectCascadingRisks(
  topics: TopicPerformance[],
  prerequisites: PrerequisiteMapping[],
  config: GapDetectionConfig
): CascadingRisk[] {
  const risks: CascadingRisk[] = [];
  const topicMap = new Map(topics.map(t => [t.topicId, t]));
  
  for (const prereq of prerequisites) {
    const prerequisiteTopic = topicMap.get(prereq.topicId);
    if (!prerequisiteTopic) continue;
    
    const successRate = prerequisiteTopic.total > 0 
      ? prerequisiteTopic.correct / prerequisiteTopic.total 
      : 0;
    
    // Ön koşul konusu zayıfsa, bağımlı konular risk altında
    if (successRate < config.weakThreshold) {
      const affectedTopics = prereq.prerequisiteTopicIds
        .map(id => topicMap.get(id)?.topicName)
        .filter(Boolean) as string[];
      
      if (affectedTopics.length > 0) {
        risks.push({
          prerequisiteTopic: prerequisiteTopic.topicName,
          prerequisiteSuccess: round(successRate, 4),
          affectedTopics,
          riskLevel: successRate < config.criticalThreshold ? 'high' : 'medium',
          explanation: `"${prerequisiteTopic.topicName}" konusundaki eksiklik, ${affectedTopics.length} ileri konuyu olumsuz etkileyebilir.`
        });
      }
    }
  }
  
  return risks.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 };
    return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
  });
}

// ==================== AÇIK KÜMELERİ TESPİTİ ====================

function detectGapClusters(gaps: LearningGap[]): GapCluster[] {
  const clusters: GapCluster[] = [];
  
  // Derse göre grupla
  const bySubject = new Map<string, LearningGap[]>();
  for (const gap of gaps) {
    if (!bySubject.has(gap.subjectCode)) {
      bySubject.set(gap.subjectCode, []);
    }
    bySubject.get(gap.subjectCode)!.push(gap);
  }
  
  // Her ders için küme oluştur
  for (const [subjectCode, subjectGaps] of bySubject) {
    if (subjectGaps.length < 2) continue;
    
    const avgSuccessRate = subjectGaps.reduce((sum, g) => sum + g.successRate, 0) / subjectGaps.length;
    
    // Pattern tespiti
    const hasManyCritical = subjectGaps.filter(g => g.severity === 'critical').length >= 2;
    const hasHighWrong = subjectGaps.some(g => g.wrong > g.correct);
    
    let commonPattern = 'Genel eksiklik';
    if (hasManyCritical) {
      commonPattern = 'Çoklu kritik eksiklik - Temel kavram sorunu';
    } else if (hasHighWrong) {
      commonPattern = 'Kavram karmaşası - Yanlış öğrenme';
    }
    
    clusters.push({
      clusterName: `${subjectCode} Eksiklik Kümesi`,
      subjectCode,
      topics: subjectGaps.map(g => g.topicName),
      avgSuccessRate: round(avgSuccessRate, 4),
      commonPattern
    });
  }
  
  return clusters;
}

// ==================== ÖZET OLUŞTURMA ====================

function generateGapSummary(
  topics: TopicPerformance[],
  config: GapDetectionConfig
): GapSummary {
  const subjectBreakdown: GapSummary['subjectBreakdown'] = {};
  
  let masteredTopics = 0;
  let weakTopics = 0;
  let criticalTopics = 0;
  
  for (const topic of topics) {
    const successRate = topic.total > 0 ? topic.correct / topic.total : 0;
    
    // Ders bazlı breakdown
    if (!subjectBreakdown[topic.subjectCode]) {
      subjectBreakdown[topic.subjectCode] = { mastered: 0, weak: 0, critical: 0 };
    }
    
    if (successRate >= config.masteryThreshold) {
      masteredTopics++;
      subjectBreakdown[topic.subjectCode].mastered++;
    } else if (successRate < config.criticalThreshold) {
      criticalTopics++;
      subjectBreakdown[topic.subjectCode].critical++;
    } else if (successRate < config.weakThreshold) {
      weakTopics++;
      subjectBreakdown[topic.subjectCode].weak++;
    }
  }
  
  // Sağlık skoru hesapla (0-100)
  const healthScore = topics.length > 0
    ? ((masteredTopics / topics.length) * 60) + 
      (((topics.length - criticalTopics) / topics.length) * 40)
    : 50;
  
  return {
    totalTopics: topics.length,
    masteredTopics,
    weakTopics,
    criticalTopics,
    overallHealthScore: round(healthScore, 1),
    subjectBreakdown
  };
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function createEmptyResult(): LearningGapResult {
  return {
    gaps: [],
    criticalGaps: [],
    gapClusters: [],
    cascadingRisks: [],
    summary: {
      totalTopics: 0,
      masteredTopics: 0,
      weakTopics: 0,
      criticalTopics: 0,
      overallHealthScore: 50,
      subjectBreakdown: {}
    }
  };
}

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  detectLearningGaps,
  DEFAULT_CONFIG
};
