// ============================================================================
// AI TAHMİN MOTORU
// LGS/YKS Puan Tahmini, Risk Skoru, Performans Analizi
// ============================================================================

import type { StudentTableRow, ExamStatistics } from '@/types/spectra-detail';

// ============================================================================
// TİPLER
// ============================================================================

export interface PredictionResult {
  predictedScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  confidencePercent: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface RiskAssessment {
  dropoutRisk: number; // 0-1
  performanceRisk: number; // 0-1
  attendanceRisk: number; // 0-1
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
}

export interface StrengthWeakness {
  strengths: { subject: string; score: number; reason: string }[];
  weaknesses: { subject: string; score: number; reason: string }[];
  improvementPotential: number; // 0-100
}

export interface StudyRecommendation {
  subject: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  reason: string;
}

// ============================================================================
// LGS PUAN TAHMİNİ
// ============================================================================

/**
 * LGS Puan Tahmini
 * Formül: Baz puan + (Net × Katsayı) + Trend bonusu
 */
export function predictLGSScore(
  currentNet: number,
  recentNets: number[], // Son 5 sınav netleri
  classAverage: number,
  organizationAverage: number
): PredictionResult {
  // Temel LGS hesaplama (yaklaşık formül)
  // Gerçek ÖSYM formülü daha karmaşık, bu yaklaşık tahmin
  const baseScore = 200;
  const netMultiplier = 4.5;
  const baseCalculation = baseScore + currentNet * netMultiplier;

  // Trend analizi
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendValue = 0;

  if (recentNets.length >= 2) {
    const recentAvg = recentNets.slice(-3).reduce((a, b) => a + b, 0) / Math.min(recentNets.length, 3);
    const olderAvg = recentNets.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(recentNets.length - 3, 1);
    
    trendValue = recentAvg - olderAvg;
    
    if (trendValue > 2) trend = 'up';
    else if (trendValue < -2) trend = 'down';
  }

  // Trend bonusu/cezası
  const trendBonus = trend === 'up' ? trendValue * 2 : trend === 'down' ? trendValue * 1.5 : 0;

  // Sınıf ve kurum karşılaştırması
  const classComparison = currentNet - classAverage;
  const orgComparison = currentNet - organizationAverage;

  // Final puan
  let predictedScore = Math.round(baseCalculation + trendBonus);

  // Min-Max sınırları
  predictedScore = Math.max(200, Math.min(500, predictedScore));

  // Güven seviyesi
  let confidencePercent = 70;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';

  if (recentNets.length >= 5) {
    // Varyans kontrolü
    const variance = calculateVariance(recentNets);
    if (variance < 25) {
      confidencePercent = 85;
      confidenceLevel = 'high';
    } else if (variance > 100) {
      confidencePercent = 50;
      confidenceLevel = 'low';
    }
  } else if (recentNets.length < 3) {
    confidencePercent = 40;
    confidenceLevel = 'low';
  }

  return {
    predictedScore,
    confidenceLevel,
    confidencePercent,
    trend,
    trendValue: Math.round(trendValue * 10) / 10,
  };
}

/**
 * YKS (TYT+AYT) Puan Tahmini
 */
export function predictYKSScore(
  tytNet: number,
  aytNet: number,
  recentTytNets: number[],
  recentAytNets: number[]
): { tyt: PredictionResult; ayt: PredictionResult; combined: number } {
  // TYT hesaplama
  const tytBase = 100;
  const tytMultiplier = 3.3;
  const tytScore = tytBase + tytNet * tytMultiplier;

  // AYT hesaplama (alan bazlı farklı katsayılar olabilir)
  const aytBase = 100;
  const aytMultiplier = 3.0;
  const aytScore = aytBase + aytNet * aytMultiplier;

  // Trend analizi
  const tytTrend = analyzeTrend(recentTytNets);
  const aytTrend = analyzeTrend(recentAytNets);

  return {
    tyt: {
      predictedScore: Math.round(Math.max(100, Math.min(500, tytScore))),
      confidenceLevel: recentTytNets.length >= 3 ? 'medium' : 'low',
      confidencePercent: recentTytNets.length >= 5 ? 75 : 50,
      trend: tytTrend.direction,
      trendValue: tytTrend.value,
    },
    ayt: {
      predictedScore: Math.round(Math.max(100, Math.min(500, aytScore))),
      confidenceLevel: recentAytNets.length >= 3 ? 'medium' : 'low',
      confidencePercent: recentAytNets.length >= 5 ? 75 : 50,
      trend: aytTrend.direction,
      trendValue: aytTrend.value,
    },
    combined: Math.round((tytScore * 0.4 + aytScore * 0.6)),
  };
}

// ============================================================================
// RİSK ANALİZİ
// ============================================================================

/**
 * Öğrenci risk değerlendirmesi
 */
export function assessRisk(
  student: {
    currentNet: number;
    recentNets: number[];
    attendanceRate?: number;
    lastLoginDays?: number;
    missedExams?: number;
    classAverage: number;
  }
): RiskAssessment {
  const factors: string[] = [];
  const recommendations: string[] = [];

  // 1. Performans Riski
  let performanceRisk = 0;
  
  // Son 3 sınavda düşüş
  if (student.recentNets.length >= 3) {
    const last3 = student.recentNets.slice(-3);
    const isDecreasing = last3[2] < last3[1] && last3[1] < last3[0];
    if (isDecreasing) {
      performanceRisk += 0.3;
      factors.push('Son 3 sınavda sürekli düşüş');
      recommendations.push('Birebir görüşme yapılmalı');
    }
  }

  // Sınıf ortalamasının altında
  if (student.currentNet < student.classAverage * 0.7) {
    performanceRisk += 0.3;
    factors.push('Sınıf ortalamasının %70 altında');
    recommendations.push('Ek ders desteği verilmeli');
  }

  // Net 40'ın altında (LGS için kritik)
  if (student.currentNet < 40) {
    performanceRisk += 0.2;
    factors.push('Net 40\'ın altında');
  }

  // 2. Devamsızlık Riski
  let attendanceRisk = 0;
  if (student.attendanceRate !== undefined) {
    if (student.attendanceRate < 0.7) {
      attendanceRisk = 0.8;
      factors.push('Devamsızlık oranı %70 altında');
      recommendations.push('Veli ile iletişime geçilmeli');
    } else if (student.attendanceRate < 0.85) {
      attendanceRisk = 0.4;
      factors.push('Devamsızlık oranı %85 altında');
    }
  }

  // 3. Terk Etme Riski
  let dropoutRisk = 0;
  
  // Sisteme uzun süredir giriş yapmamış
  if (student.lastLoginDays !== undefined && student.lastLoginDays > 14) {
    dropoutRisk += 0.4;
    factors.push('14 günden fazla sisteme giriş yok');
    recommendations.push('Telefon ile aranmalı');
  }

  // Sınavları kaçırma
  if (student.missedExams !== undefined && student.missedExams >= 2) {
    dropoutRisk += 0.3;
    factors.push('Son dönemde 2+ sınav kaçırıldı');
  }

  // Çok düşük performans + düşüş
  if (performanceRisk > 0.5 && student.recentNets.length >= 3) {
    const trend = analyzeTrend(student.recentNets);
    if (trend.direction === 'down' && trend.value < -5) {
      dropoutRisk += 0.2;
      factors.push('Ciddi performans düşüşü');
    }
  }

  // Normalize et
  performanceRisk = Math.min(1, performanceRisk);
  attendanceRisk = Math.min(1, attendanceRisk);
  dropoutRisk = Math.min(1, dropoutRisk);

  // Genel risk
  const avgRisk = (performanceRisk * 0.4 + attendanceRisk * 0.3 + dropoutRisk * 0.3);
  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (avgRisk >= 0.7) overallRisk = 'critical';
  else if (avgRisk >= 0.5) overallRisk = 'high';
  else if (avgRisk >= 0.3) overallRisk = 'medium';

  // Öneriler ekle
  if (recommendations.length === 0 && overallRisk !== 'low') {
    recommendations.push('Düzenli takip yapılmalı');
  }

  return {
    dropoutRisk: Math.round(dropoutRisk * 100) / 100,
    performanceRisk: Math.round(performanceRisk * 100) / 100,
    attendanceRisk: Math.round(attendanceRisk * 100) / 100,
    overallRisk,
    factors,
    recommendations,
  };
}

// ============================================================================
// GÜÇLÜ/ZAYIF ALAN ANALİZİ
// ============================================================================

/**
 * Öğrencinin güçlü ve zayıf alanlarını tespit et
 */
export function analyzeStrengthsWeaknesses(
  sections: { sectionName: string; net: number; maxNet: number; classAverage: number }[]
): StrengthWeakness {
  const strengths: { subject: string; score: number; reason: string }[] = [];
  const weaknesses: { subject: string; score: number; reason: string }[] = [];

  sections.forEach((section) => {
    const percentage = (section.net / section.maxNet) * 100;
    const vsClass = section.net - section.classAverage;

    if (percentage >= 80 && vsClass >= 3) {
      strengths.push({
        subject: section.sectionName,
        score: Math.round(percentage),
        reason: `%${Math.round(percentage)} başarı, sınıf ortalamasının ${vsClass.toFixed(1)} üstünde`,
      });
    } else if (percentage < 50 || vsClass < -5) {
      weaknesses.push({
        subject: section.sectionName,
        score: Math.round(percentage),
        reason: percentage < 50
          ? `%${Math.round(percentage)} başarı oranı düşük`
          : `Sınıf ortalamasının ${Math.abs(vsClass).toFixed(1)} altında`,
      });
    }
  });

  // Gelişim potansiyeli
  const totalPotential = weaknesses.reduce((sum, w) => sum + (100 - w.score), 0);
  const improvementPotential = weaknesses.length > 0 
    ? Math.round(totalPotential / weaknesses.length) 
    : 0;

  return {
    strengths: strengths.sort((a, b) => b.score - a.score),
    weaknesses: weaknesses.sort((a, b) => a.score - b.score),
    improvementPotential,
  };
}

// ============================================================================
// ÇALIŞMA ÖNERİLERİ
// ============================================================================

/**
 * Kişiselleştirilmiş çalışma önerileri oluştur
 */
export function generateStudyRecommendations(
  weaknesses: { subject: string; score: number }[],
  topicMastery?: { subject: string; topic: string; mastery: number }[]
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];

  // Zayıf derslere göre öneri
  weaknesses.forEach((weakness, index) => {
    const priority: 'high' | 'medium' | 'low' = 
      index === 0 ? 'high' : index === 1 ? 'medium' : 'low';

    // Varsayılan konular (gerçek sistemde topic_mastery'den gelir)
    const defaultTopics: Record<string, string[]> = {
      'Matematik': ['Denklemler', 'Geometri', 'Olasılık'],
      'Türkçe': ['Paragraf', 'Dil Bilgisi', 'Anlam Bilgisi'],
      'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji'],
      'Sosyal Bilgiler': ['Tarih', 'Coğrafya', 'Vatandaşlık'],
      'İngilizce': ['Grammar', 'Vocabulary', 'Reading'],
    };

    const topics = defaultTopics[weakness.subject] || ['Genel Tekrar'];

    // Topic mastery varsa en zayıf konuyu bul
    let targetTopic = topics[0];
    if (topicMastery) {
      const subjectTopics = topicMastery
        .filter((t) => t.subject === weakness.subject)
        .sort((a, b) => a.mastery - b.mastery);
      if (subjectTopics.length > 0) {
        targetTopic = subjectTopics[0].topic;
      }
    }

    recommendations.push({
      subject: weakness.subject,
      topic: targetTopic,
      priority,
      estimatedHours: priority === 'high' ? 8 : priority === 'medium' ? 5 : 3,
      reason: `${weakness.subject} dersi %${weakness.score} seviyesinde, ${targetTopic} konusuna odaklanılmalı`,
    });
  });

  return recommendations;
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

function calculateVariance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
}

function analyzeTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; value: number } {
  if (values.length < 2) return { direction: 'stable', value: 0 };

  const n = values.length;
  const recentHalf = values.slice(Math.floor(n / 2));
  const olderHalf = values.slice(0, Math.floor(n / 2));

  const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
  const olderAvg = olderHalf.length > 0 
    ? olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length 
    : recentAvg;

  const diff = recentAvg - olderAvg;

  if (diff > 2) return { direction: 'up', value: Math.round(diff * 10) / 10 };
  if (diff < -2) return { direction: 'down', value: Math.round(diff * 10) / 10 };
  return { direction: 'stable', value: 0 };
}

// ============================================================================
// BATCH ANALİZ
// ============================================================================

/**
 * Tüm öğrenciler için toplu AI analiz
 */
export function batchAnalyzeStudents(
  students: {
    id: string;
    currentNet: number;
    recentNets: number[];
    sections: { sectionName: string; net: number; maxNet: number; classAverage: number }[];
    classAverage: number;
    organizationAverage: number;
    attendanceRate?: number;
    lastLoginDays?: number;
  }[]
): Map<string, {
  prediction: PredictionResult;
  risk: RiskAssessment;
  analysis: StrengthWeakness;
  recommendations: StudyRecommendation[];
}> {
  const results = new Map();

  students.forEach((student) => {
    const prediction = predictLGSScore(
      student.currentNet,
      student.recentNets,
      student.classAverage,
      student.organizationAverage
    );

    const risk = assessRisk({
      currentNet: student.currentNet,
      recentNets: student.recentNets,
      classAverage: student.classAverage,
      attendanceRate: student.attendanceRate,
      lastLoginDays: student.lastLoginDays,
    });

    const analysis = analyzeStrengthsWeaknesses(student.sections);

    const recommendations = generateStudyRecommendations(analysis.weaknesses);

    results.set(student.id, {
      prediction,
      risk,
      analysis,
      recommendations,
    });
  });

  return results;
}

