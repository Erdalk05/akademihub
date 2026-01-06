/**
 * ============================================
 * AkademiHub - Executive Adapter
 * ============================================
 * 
 * PHASE 8.2 - Founder Command Center
 * 
 * BU DOSYA:
 * - Snapshot → Yönetici ViewModel dönüşümü
 * - Kriz tespiti
 * - AI kurumsal özet oluşturma
 * 
 * PRENSİP:
 * Kurucu tek bakışta "nerede problem var?" sorusuna cevap almalı!
 */

import { createClient } from '@/lib/supabase/client';
import type {
  FounderDashboardData,
  ExecutiveViewModel,
  AcademicCrisisAlert,
  ParticipationAnalysis,
  ClassComparison,
  AIInstitutionalSummary,
  InsightFeedItem,
  QuickStat,
  AbsentStudent,
  CriticalFinding,
  RecommendedAction
} from '../types';

// ==================== CONFIG ====================

const CRISIS_THRESHOLDS = {
  /** Kritik düşüş eşiği (%) */
  criticalDropThreshold: -15,
  
  /** Uyarı düşüş eşiği (%) */
  warningDropThreshold: -10,
  
  /** Minimum kabul edilebilir başarı (%) */
  minAcceptableRate: 40,
  
  /** Düşük katılım eşiği (%) */
  lowParticipationThreshold: 80
};

// ==================== MAIN ADAPTER ====================

/**
 * Kurucu dashboard verisini oluşturur
 */
export async function createExecutiveViewModel(
  organizationId: string,
  examId?: string
): Promise<ExecutiveViewModel> {
  try {
    const supabase = createClient();
    
    // 1. Kurum bilgisi
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();
    
    if (orgError) throw orgError;
    
    // 2. Öğrenci sayısı
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    
    // 3. Sınıf sayısı
    const { data: classData } = await supabase
      .from('students')
      .select('class')
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    
    const uniqueClasses = new Set((classData || []).map((s: { class: string }) => s.class));
    
    // 4. Son sınav
    let targetExamId = examId;
    if (!targetExamId) {
      const { data: lastExam } = await supabase
        .from('exams')
        .select('id, name, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      targetExamId = lastExam?.id;
    }
    
    // 5. Analytics snapshot'larını çek
    let analytics: any[] = [];
    if (targetExamId) {
      const { data } = await supabase
        .from('exam_student_analytics')
        .select('*')
        .eq('exam_id', targetExamId);
      
      analytics = data || [];
    }
    
    // 6. Kriz uyarıları oluştur
    const crisisAlerts = detectCrisisAlerts(analytics);
    
    // 7. Katılım analizi
    const participation = await analyzeParticipation(
      supabase,
      organizationId,
      targetExamId || '',
      analytics
    );
    
    // 8. Sınıf karşılaştırma
    const classComparison = createClassComparison(analytics);
    
    // 9. AI kurumsal özet
    const aiSummary = createAISummary(
      orgData.name,
      crisisAlerts,
      participation,
      classComparison
    );
    
    // 10. Insight feed
    const insights = createInsightFeed(crisisAlerts, participation, aiSummary);
    
    // 11. Quick stats
    const quickStats = createQuickStats(analytics, participation, crisisAlerts);
    
    // Dashboard data
    const dashboard: FounderDashboardData = {
      lastUpdated: new Date().toISOString(),
      organization: {
        id: organizationId,
        name: orgData.name,
        studentCount: studentCount || 0,
        teacherCount: 0, // TODO: Teacher count
        classCount: uniqueClasses.size
      },
      lastExam: targetExamId ? {
        id: targetExamId,
        name: 'Son Sınav',
        date: new Date().toISOString(),
        participationRate: participation.participationRate,
        averageScore: calculateAverageScore(analytics)
      } : null,
      crisisAlerts,
      participation,
      classComparison,
      aiSummary,
      trends: [] // TODO: Historical trends
    };
    
    return {
      dashboard,
      insights,
      quickStats,
      state: 'ready'
    };
    
  } catch (error) {
    console.error('[ExecutiveAdapter] Error:', error);
    return {
      dashboard: createEmptyDashboard(),
      insights: [],
      quickStats: [],
      state: 'error',
      errorMessage: error instanceof Error ? error.message : 'Veri yüklenemedi'
    };
  }
}

// ==================== CRISIS DETECTION ====================

function detectCrisisAlerts(analytics: any[]): AcademicCrisisAlert[] {
  const alerts: AcademicCrisisAlert[] = [];
  
  // Ders bazlı analiz
  const subjectStats = new Map<string, { scores: number[]; subject: string }>();
  
  for (const student of analytics) {
    const output = student.output || {};
    const subjects = output.subjects || [];
    
    for (const subject of subjects) {
      if (!subjectStats.has(subject.subject_code)) {
        subjectStats.set(subject.subject_code, { 
          scores: [], 
          subject: subject.subject_name || subject.subject_code 
        });
      }
      subjectStats.get(subject.subject_code)!.scores.push(subject.percentage || 0);
    }
  }
  
  // Düşük başarı tespiti
  let priority = 1;
  for (const [code, data] of subjectStats) {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    
    if (avgScore < CRISIS_THRESHOLDS.minAcceptableRate) {
      alerts.push({
        id: `crisis-${code}`,
        level: avgScore < 30 ? 'critical' : 'warning',
        subject: data.subject,
        subjectCode: code,
        currentRate: Math.round(avgScore),
        previousRate: 0,
        change: 0,
        affectedStudents: data.scores.filter(s => s < CRISIS_THRESHOLDS.minAcceptableRate).length,
        message: avgScore < 30 
          ? `${data.subject} dersinde kritik düşüş! Başarı oranı %${Math.round(avgScore)}`
          : `${data.subject} dersinde başarı oranı beklenenin altında: %${Math.round(avgScore)}`,
        suggestedAction: 'Zümre toplantısı düzenleyin ve telafi programı oluşturun.',
        priority: priority++
      });
    }
  }
  
  // Önceliğe göre sırala
  return alerts.sort((a, b) => a.priority - b.priority);
}

// ==================== PARTICIPATION ANALYSIS ====================

async function analyzeParticipation(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  examId: string,
  analytics: any[]
): Promise<ParticipationAnalysis> {
  // Tüm öğrenciler
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, student_no, class, user:users(name, surname)')
    .eq('organization_id', organizationId)
    .eq('status', 'active');
  
  const participatedIds = new Set(analytics.map(a => a.student_id));
  
  const absentStudents: AbsentStudent[] = [];
  const classCounts = new Map<string, { total: number; participated: number }>();
  
  for (const student of allStudents || []) {
    const className = student.class;
    
    if (!classCounts.has(className)) {
      classCounts.set(className, { total: 0, participated: 0 });
    }
    
    classCounts.get(className)!.total++;
    
    if (participatedIds.has(student.id)) {
      classCounts.get(className)!.participated++;
    } else {
      absentStudents.push({
        id: student.id,
        studentNo: student.student_no,
        fullName: student.user ? `${student.user.name || ''} ${student.user.surname || ''}`.trim() : 'İsimsiz',
        className: student.class
      });
    }
  }
  
  const totalStudents = allStudents?.length || 0;
  const participatedCount = participatedIds.size;
  
  return {
    totalStudents,
    participatedCount,
    absentCount: absentStudents.length,
    participationRate: totalStudents > 0 ? Math.round((participatedCount / totalStudents) * 100) : 0,
    absentStudents,
    byClass: Array.from(classCounts.entries()).map(([className, counts]) => ({
      className,
      totalStudents: counts.total,
      participatedCount: counts.participated,
      participationRate: counts.total > 0 ? Math.round((counts.participated / counts.total) * 100) : 0
    }))
  };
}

// ==================== CLASS COMPARISON ====================

function createClassComparison(analytics: any[]): ClassComparison[] {
  const classData = new Map<string, { scores: number[]; subjects: Map<string, number[]> }>();
  
  for (const student of analytics) {
    const className = student.class || 'Bilinmiyor';
    const output = student.output || {};
    const overallScore = output.overall?.percentage || 0;
    
    if (!classData.has(className)) {
      classData.set(className, { scores: [], subjects: new Map() });
    }
    
    classData.get(className)!.scores.push(overallScore);
    
    // Ders bazlı
    for (const subject of output.subjects || []) {
      const subjectMap = classData.get(className)!.subjects;
      if (!subjectMap.has(subject.subject_code)) {
        subjectMap.set(subject.subject_code, []);
      }
      subjectMap.get(subject.subject_code)!.push(subject.percentage || 0);
    }
  }
  
  return Array.from(classData.entries()).map(([className, data]) => {
    const scores = data.scores;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return {
      className,
      studentCount: scores.length,
      averageScore: Math.round(avg * 10) / 10,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      standardDeviation: calculateStdDev(scores),
      bySubject: Array.from(data.subjects.entries()).map(([code, subjScores]) => ({
        subject: code,
        subjectCode: code,
        averageScore: Math.round((subjScores.reduce((a, b) => a + b, 0) / subjScores.length) * 10) / 10,
        netAverage: 0
      })),
      trend: 'stable' as const,
      changeFromPrevious: 0
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
}

// ==================== AI SUMMARY ====================

function createAISummary(
  orgName: string,
  crisisAlerts: AcademicCrisisAlert[],
  participation: ParticipationAnalysis,
  classComparison: ClassComparison[]
): AIInstitutionalSummary {
  const criticalFindings: CriticalFinding[] = [];
  const recommendedActions: RecommendedAction[] = [];
  
  // Kriz bulgular
  for (const alert of crisisAlerts.slice(0, 3)) {
    criticalFindings.push({
      type: 'academic',
      priority: alert.level === 'critical' ? 'high' : 'medium',
      description: alert.message,
      dataReference: `${alert.subject}: %${alert.currentRate}`,
      emoji: alert.level === 'critical' ? '🔴' : '🟡'
    });
  }
  
  // Katılım sorunu
  if (participation.participationRate < CRISIS_THRESHOLDS.lowParticipationThreshold) {
    criticalFindings.push({
      type: 'participation',
      priority: 'medium',
      description: `${participation.absentCount} öğrenci sınava katılmadı`,
      dataReference: `Katılım: %${participation.participationRate}`,
      emoji: '📋'
    });
  }
  
  // Önerilen aksiyonlar
  if (crisisAlerts.length > 0) {
    recommendedActions.push({
      type: 'meeting',
      description: 'Zümre toplantısı düzenleyerek başarı analizi yapın',
      target: 'teachers',
      emoji: '👥'
    });
  }
  
  if (participation.absentCount > 0) {
    recommendedActions.push({
      type: 'communication',
      description: 'Devamsız öğrenci velileri ile iletişime geçin',
      target: 'parents',
      emoji: '📞'
    });
  }
  
  // Sınıf performans farkı
  if (classComparison.length > 1) {
    const highest = classComparison[0];
    const lowest = classComparison[classComparison.length - 1];
    
    if (highest.averageScore - lowest.averageScore > 20) {
      criticalFindings.push({
        type: 'trend',
        priority: 'medium',
        description: `${highest.className} ve ${lowest.className} arasında %${Math.round(highest.averageScore - lowest.averageScore)} fark var`,
        dataReference: `En yüksek: ${highest.className} (%${highest.averageScore})`,
        emoji: '📊'
      });
    }
  }
  
  // Genel değerlendirme
  const avgScore = classComparison.length > 0 
    ? classComparison.reduce((sum, c) => sum + c.averageScore, 0) / classComparison.length
    : 0;
  
  let overallAssessment = '';
  if (crisisAlerts.filter(a => a.level === 'critical').length > 0) {
    overallAssessment = 'Acil müdahale gerektiren durumlar tespit edildi. Aşağıdaki bulgulara öncelik verilmesi önerilir.';
  } else if (crisisAlerts.length > 0) {
    overallAssessment = 'Bazı alanlarda iyileştirme fırsatları mevcut. Haftalık takip önerilir.';
  } else if (avgScore >= 70) {
    overallAssessment = 'Genel performans tatmin edici seviyede. Mevcut çalışmalara devam ediniz.';
  } else {
    overallAssessment = 'Genel başarı ortalaması beklenenin altında. Sistematik iyileştirme önerilir.';
  }
  
  return {
    id: `summary-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    salutation: 'Sayın Kurucu,',
    overallAssessment,
    criticalFindings,
    recommendedActions,
    weeklyPriorities: [
      {
        order: 1,
        description: crisisAlerts[0]?.suggestedAction || 'Sınav sonuçlarını detaylı inceleyin',
        responsible: 'Müdür Yardımcısı'
      },
      {
        order: 2,
        description: 'Öğretmenlerle birebir görüşmeler yapın',
        responsible: 'Kurucu'
      }
    ],
    closingNote: 'Detaylı raporlar ve sınıf bazlı analizler dashboard üzerinden incelenebilir.'
  };
}

// ==================== INSIGHT FEED ====================

function createInsightFeed(
  crisisAlerts: AcademicCrisisAlert[],
  participation: ParticipationAnalysis,
  aiSummary: AIInstitutionalSummary
): InsightFeedItem[] {
  const insights: InsightFeedItem[] = [];
  
  // Kriz uyarıları
  for (const alert of crisisAlerts) {
    insights.push({
      id: `insight-${alert.id}`,
      type: 'crisis',
      title: alert.level === 'critical' ? '🔴 Kritik Uyarı' : '🟡 Dikkat',
      description: alert.message,
      timestamp: new Date().toISOString(),
      emoji: alert.level === 'critical' ? '🔴' : '🟡',
      colorClass: alert.level === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
      actionRequired: true,
      actionText: 'Detayları Gör',
      actionLink: `/admin/exams?crisis=${alert.id}`
    });
  }
  
  // AI önerileri
  for (const action of aiSummary.recommendedActions) {
    insights.push({
      id: `insight-action-${action.type}`,
      type: 'action',
      title: `${action.emoji} Önerilen Aksiyon`,
      description: action.description,
      timestamp: new Date().toISOString(),
      emoji: action.emoji,
      colorClass: 'bg-blue-50 border-blue-200',
      actionRequired: true,
      actionText: 'Planla'
    });
  }
  
  return insights.slice(0, 10);
}

// ==================== QUICK STATS ====================

function createQuickStats(
  analytics: any[],
  participation: ParticipationAnalysis,
  crisisAlerts: AcademicCrisisAlert[]
): QuickStat[] {
  const avgScore = calculateAverageScore(analytics);
  
  return [
    {
      label: 'Toplam Öğrenci',
      value: participation.totalStudents,
      emoji: '👥',
      colorClass: 'bg-blue-50 text-blue-700'
    },
    {
      label: 'Katılım',
      value: `%${participation.participationRate}`,
      change: participation.participationRate >= 90 ? 1 : -1,
      emoji: '📋',
      colorClass: participation.participationRate >= 90 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
    },
    {
      label: 'Ortalama Başarı',
      value: `%${Math.round(avgScore)}`,
      emoji: '📊',
      colorClass: avgScore >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    },
    {
      label: 'Uyarı',
      value: crisisAlerts.length,
      emoji: crisisAlerts.length > 0 ? '⚠️' : '✅',
      colorClass: crisisAlerts.length > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
    }
  ];
}

// ==================== HELPERS ====================

function calculateAverageScore(analytics: any[]): number {
  if (analytics.length === 0) return 0;
  
  const scores = analytics
    .map(a => a.output?.overall?.percentage || 0)
    .filter(s => s > 0);
  
  if (scores.length === 0) return 0;
  
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  
  return Math.round(Math.sqrt(avgSquaredDiff) * 10) / 10;
}

function createEmptyDashboard(): FounderDashboardData {
  return {
    lastUpdated: new Date().toISOString(),
    organization: {
      id: '',
      name: '',
      studentCount: 0,
      teacherCount: 0,
      classCount: 0
    },
    lastExam: null,
    crisisAlerts: [],
    participation: {
      totalStudents: 0,
      participatedCount: 0,
      absentCount: 0,
      participationRate: 0,
      absentStudents: [],
      byClass: []
    },
    classComparison: [],
    aiSummary: null,
    trends: []
  };
}

// ==================== EXPORT ====================

export default {
  createExecutiveViewModel
};

