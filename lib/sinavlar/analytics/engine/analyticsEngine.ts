/**
 * ============================================
 * AkademiHub - Pure Analytics Engine
 * ============================================
 * 
 * Ana analytics hesaplama motoru
 * Tüm pure function'ları birleştirir
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * Sadece input → output
 * 
 * Çıktı exam_student_analytics formatına %100 uyumlu
 */

import type {
  FullAnalyticsInput,
  FullAnalyticsResult,
  TopicInput,
  RiskLevel,
  TrendDirection,
  OverallAssessment
} from './types';

import {
  calculateStandardDeviation,
  calculatePercentile,
  calculateConsistencyScore,
  calculateStatistics
} from './statistics';

import { calculateTrend, calculateSimpleTrend } from './trend';
import { calculateRiskScore } from './risk';
import { analyzeTopics, calculateOverallAssessment } from './topics';

// ==================== ANA ANALİTİK HESAPLAMA ====================

/**
 * Tam analytics hesaplar
 * exam_student_analytics tablosuna %100 uyumlu çıktı üretir
 * 
 * @param input - Tam analytics girdisi
 * @returns exam_student_analytics formatında sonuç
 */
export function calculateFullAnalytics(input: FullAnalyticsInput): FullAnalyticsResult {
  const startTime = Date.now();
  
  // 1. Percentile hesapla
  const percentile = input.totalStudentsInExam && input.rankInExam
    ? calculatePercentile(input.rankInExam, input.totalStudentsInExam)
    : null;
  
  // 2. Subject performance formatla
  const subjectPerformance = formatSubjectPerformance(input);
  
  // 3. Topic performance hesapla
  const topicAnalysis = analyzeTopics({
    topics: input.topicResults,
    config: input.topicConfig
  });
  
  const topicPerformance = formatTopicPerformance(topicAnalysis.topics);
  
  // 4. Outcome performance hesapla
  const outcomePerformance = formatOutcomePerformance(input.outcomeResults);
  
  // 5. Difficulty performance hesapla
  const difficultyPerformance = formatDifficultyPerformance(input.difficultyResults);
  
  // 6. Consistency hesapla
  const previousNets = input.previousExams?.map(e => e.totalNet) ?? [];
  const allNets = [...previousNets, input.totalNet];
  const consistencyScore = allNets.length >= 2
    ? calculateConsistencyScore(allNets)
    : null;
  
  // 7. Trend hesapla
  const trendResult = allNets.length >= 2
    ? calculateSimpleTrend(allNets)
    : null;
  
  const rankTrend = input.previousExams
    ?.filter(e => e.rankInExam !== undefined)
    .map(e => e.rankInExam!)
    .concat(input.rankInExam ? [input.rankInExam] : []);
  
  // 8. Risk hesapla
  const riskInput = {
    currentNet: input.totalNet,
    previousNet: previousNets.length > 0 ? previousNets[previousNets.length - 1] : undefined,
    classAvgNet: input.classAvgNet,
    schoolAvgNet: input.schoolAvgNet,
    consistencyScore: consistencyScore ?? undefined,
    weakTopicCount: topicAnalysis.weaknesses.length,
    totalTopicCount: topicAnalysis.topics.length,
    easySuccessRate: difficultyPerformance.easy.rate,
    hardSuccessRate: difficultyPerformance.hard.rate,
    currentRank: input.rankInExam,
    previousRank: input.previousExams?.[input.previousExams.length - 1]?.rankInExam,
    totalStudents: input.totalStudentsInExam,
    emptyRate: input.totalEmpty / (input.totalCorrect + input.totalWrong + input.totalEmpty),
    ...input.riskConfig
  };
  
  const riskResult = calculateRiskScore(riskInput);
  
  // 9. Karşılaştırmalar
  const vsClassAvg = input.classAvgNet !== undefined
    ? round(input.totalNet - input.classAvgNet)
    : null;
  
  const vsSchoolAvg = input.schoolAvgNet !== undefined
    ? round(input.totalNet - input.schoolAvgNet)
    : null;
  
  const vsPreviousExam = previousNets.length > 0
    ? round(input.totalNet - previousNets[previousNets.length - 1])
    : null;
  
  // 10. Genel değerlendirme
  const { assessment, summary } = calculateOverallAssessment(topicAnalysis.topics);
  
  // Hesaplama süresi
  const calculationDurationMs = Date.now() - startTime;
  
  return {
    // Temel metrikler
    totalNet: input.totalNet,
    totalCorrect: input.totalCorrect,
    totalWrong: input.totalWrong,
    totalEmpty: input.totalEmpty,
    
    // Sıralama
    rankInExam: input.rankInExam ?? null,
    rankInClass: input.rankInClass ?? null,
    rankInSchool: input.rankInSchool ?? null,
    percentile,
    
    // Performans
    subjectPerformance,
    topicPerformance,
    outcomePerformance,
    difficultyPerformance,
    
    // Tutarlılık
    consistencyScore,
    
    // AI-ready alanlar
    strengths: topicAnalysis.strengths,
    weaknesses: topicAnalysis.weaknesses,
    improvementPriorities: topicAnalysis.improvementPriorities,
    studyRecommendations: topicAnalysis.studyRecommendations,
    
    // Risk
    riskLevel: riskResult.level,
    riskScore: riskResult.score,
    riskFactors: riskResult.factors.map(f => f.description),
    
    // Karşılaştırmalar
    vsClassAvg,
    vsSchoolAvg,
    vsPreviousExam,
    
    // Trend
    netTrend: allNets.length >= 2 ? allNets : null,
    rankTrend: rankTrend && rankTrend.length >= 2 ? rankTrend : null,
    trendDirection: trendResult?.direction ?? null,
    trendChange: trendResult?.change ?? null,
    
    // Genel değerlendirme
    overallAssessment: assessment,
    assessmentSummary: summary,
    
    // Metadata
    aiMetadata: {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      modelReady: true
    },
    calculationMetadata: {
      calculationVersion: '1.0',
      calculationDurationMs,
      inputExamId: input.examId,
      inputStudentId: input.studentId,
      examTypeCode: input.examTypeCode,
      wrongPenaltyDivisor: input.wrongPenaltyDivisor,
      topicCount: topicAnalysis.topics.length,
      previousExamCount: previousNets.length
    }
  };
}

// ==================== FORMAT HELPERS ====================

function formatSubjectPerformance(input: FullAnalyticsInput): FullAnalyticsResult['subjectPerformance'] {
  const result: FullAnalyticsResult['subjectPerformance'] = {};
  
  for (const subject of input.subjectResults) {
    const total = subject.correct + subject.wrong + subject.empty;
    const rate = total > 0 ? subject.correct / total : 0;
    
    result[subject.subjectCode] = {
      net: subject.net,
      correct: subject.correct,
      wrong: subject.wrong,
      empty: subject.empty,
      rate: round(rate, 4),
      rank: subject.rank
    };
  }
  
  return result;
}

function formatTopicPerformance(topics: ReturnType<typeof analyzeTopics>['topics']): FullAnalyticsResult['topicPerformance'] {
  const result: FullAnalyticsResult['topicPerformance'] = {};
  
  for (const topic of topics) {
    result[topic.topicId] = {
      name: topic.topicName,
      correct: topic.correct,
      total: topic.total,
      rate: topic.rate,
      status: topic.status
    };
  }
  
  return result;
}

function formatOutcomePerformance(outcomes?: FullAnalyticsInput['outcomeResults']): FullAnalyticsResult['outcomePerformance'] {
  const result: FullAnalyticsResult['outcomePerformance'] = {};
  
  if (!outcomes) return result;
  
  for (const outcome of outcomes) {
    const rate = outcome.total > 0 ? outcome.correct / outcome.total : 0;
    
    result[outcome.outcomeId] = {
      name: outcome.outcomeName,
      achieved: rate >= 0.5, // %50 üstü = kazanım sağlandı
      rate: round(rate, 4)
    };
  }
  
  return result;
}

function formatDifficultyPerformance(difficulty?: FullAnalyticsInput['difficultyResults']): FullAnalyticsResult['difficultyPerformance'] {
  if (!difficulty) {
    return {
      easy: { correct: 0, total: 0, rate: 0 },
      medium: { correct: 0, total: 0, rate: 0 },
      hard: { correct: 0, total: 0, rate: 0 }
    };
  }
  
  return {
    easy: {
      correct: difficulty.easy.correct,
      total: difficulty.easy.total,
      rate: difficulty.easy.total > 0
        ? round(difficulty.easy.correct / difficulty.easy.total, 4)
        : 0
    },
    medium: {
      correct: difficulty.medium.correct,
      total: difficulty.medium.total,
      rate: difficulty.medium.total > 0
        ? round(difficulty.medium.correct / difficulty.medium.total, 4)
        : 0
    },
    hard: {
      correct: difficulty.hard.correct,
      total: difficulty.hard.total,
      rate: difficulty.hard.total > 0
        ? round(difficulty.hard.correct / difficulty.hard.total, 4)
        : 0
    }
  };
}

// ==================== YARDIMCI ====================

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export {
  // Ana fonksiyon
  calculateFullAnalytics,
  
  // Alt fonksiyonlar (test için export)
  formatSubjectPerformance,
  formatTopicPerformance,
  formatOutcomePerformance,
  formatDifficultyPerformance
};

export default {
  calculateFullAnalytics
};
