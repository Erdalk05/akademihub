/**
 * AkademiHub Exam Intelligence API
 * Enterprise-grade sınav analiz endpoint'i
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  ExamIntelligenceResponse,
  ExamDetails,
  StudentResult,
  OverallStats,
  ClassStats,
  SubjectStats,
  StatisticalDistributions,
  TrendAnalysis,
  RiskAnalysis,
  OpportunityAnalysis,
  AIRecommendation,
  RiskLevel,
  TrendDirection,
  DistributionBucket,
} from '@/types/exam-intelligence';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

function calculateQuartiles(values: number[]): { q1: number; q3: number } {
  if (values.length < 4) return { q1: 0, q3: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const q1Idx = Math.floor(sorted.length * 0.25);
  const q3Idx = Math.floor(sorted.length * 0.75);
  return { q1: sorted[q1Idx], q3: sorted[q3Idx] };
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function calculatePercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  const below = sortedValues.filter((v) => v < value).length;
  return Math.round((below / sortedValues.length) * 100);
}

function determineRiskLevel(
  net: number,
  percentile: number,
  trend: TrendDirection
): RiskLevel {
  if (percentile < 10 || net < 20) return 'critical';
  if (percentile < 25 || (net < 35 && trend === 'down')) return 'high';
  if (percentile < 40 || trend === 'down') return 'medium';
  if (percentile < 60) return 'low';
  return 'none';
}

function determineTrendDirection(
  currentNet: number,
  previousNet: number | null
): TrendDirection {
  if (previousNet === null) return 'stable';
  const change = currentNet - previousNet;
  if (Math.abs(change) < 2) return 'stable';
  return change > 0 ? 'up' : 'down';
}

function createDistributionBuckets(values: number[], bucketCount: number = 10): DistributionBucket[] {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const bucketSize = range / bucketCount;
  
  const buckets: DistributionBucket[] = [];
  
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = i === bucketCount - 1 ? max : min + (i + 1) * bucketSize;
    const count = values.filter((v) => v >= bucketMin && v <= bucketMax).length;
    
    buckets.push({
      range: `${bucketMin.toFixed(1)}-${bucketMax.toFixed(1)}`,
      min: bucketMin,
      max: bucketMax,
      count,
      percentage: Math.round((count / values.length) * 100),
    });
  }
  
  return buckets;
}

// ============================================================================
// LGS SUBJECT MAPPING
// ============================================================================

const LGS_SUBJECTS: Record<string, string> = {
  TUR: 'Türkçe',
  TC: 'T.C. İnkılap Tarihi',
  DIN: 'Din Kültürü',
  ING: 'İngilizce',
  MAT: 'Matematik',
  FEN: 'Fen Bilimleri',
};

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const body = await request.json();
    const { examId, options } = body;

    if (!examId) {
      return NextResponse.json({ error: 'examId gerekli' }, { status: 400 });
    }

    const depth = options?.depth || 'detailed';
    const includeHistorical = options?.includeHistorical ?? true;
    const includePredictions = options?.includePredictions ?? true;

    // ========================================================================
    // 1. FETCH EXAM DETAILS
    // ========================================================================

    const { data: examRow, error: examError } = await supabase
      .from('exams')
      .select('*, organization:organizations(id, name)')
      .eq('id', examId)
      .single();

    if (examError || !examRow) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    const exam: ExamDetails = {
      id: examRow.id,
      name: examRow.name,
      examDate: examRow.exam_date,
      examType: examRow.exam_type || 'LGS',
      gradeLevel: examRow.grade_level || 8,
      totalQuestions: examRow.total_questions || 90,
      totalParticipants: 0,
      organizationId: examRow.organization_id,
      organizationName: examRow.organization?.name || '',
      createdAt: examRow.created_at,
    };

    // ========================================================================
    // 2. FETCH STUDENT RESULTS
    // ========================================================================

    const { data: rawResults, error: resultsError } = await supabase
      .from('student_exam_results')
      .select(`
        id,
        exam_id,
        student_no,
        student_name,
        class_name,
        booklet_type,
        total_correct,
        total_wrong,
        total_empty,
        total_net,
        total_score,
        general_rank,
        class_rank,
        subject_results,
        created_at
      `)
      .eq('exam_id', examId)
      .order('total_net', { ascending: false });

    if (resultsError) {
      warnings.push(`Sonuç sorgusu hatası: ${resultsError.message}`);
    }

    const results = rawResults || [];
    exam.totalParticipants = results.length;

    // ========================================================================
    // 3. FETCH HISTORICAL DATA (for trends)
    // ========================================================================

    let historicalData: Map<string, number> = new Map();

    if (includeHistorical) {
      const { data: previousExams } = await supabase
        .from('exams')
        .select('id, exam_date')
        .eq('organization_id', exam.organizationId)
        .eq('grade_level', exam.gradeLevel)
        .lt('exam_date', exam.examDate)
        .order('exam_date', { ascending: false })
        .limit(1);

      if (previousExams && previousExams.length > 0) {
        const prevExamId = previousExams[0].id;
        const { data: prevResults } = await supabase
          .from('student_exam_results')
          .select('student_no, total_net')
          .eq('exam_id', prevExamId);

        if (prevResults) {
          prevResults.forEach((r: any) => {
            historicalData.set(r.student_no, r.total_net);
          });
        }
      }
    }

    // ========================================================================
    // 4. COMPUTE OVERALL STATISTICS
    // ========================================================================

    const netValues = results.map((r: any) => r.total_net || 0);
    const scoreValues = results.map((r: any) => r.total_score || 0);
    const sortedNets = [...netValues].sort((a, b) => a - b);

    const overallMean = calculateMean(netValues);
    const overallStdDev = calculateStandardDeviation(netValues, overallMean);
    const { q1, q3 } = calculateQuartiles(netValues);

    const overallStats: OverallStats = {
      participantCount: results.length,
      averageNet: Math.round(overallMean * 100) / 100,
      averageScore: Math.round(calculateMean(scoreValues) * 100) / 100,
      medianNet: calculateMedian(netValues),
      standardDeviation: Math.round(overallStdDev * 100) / 100,
      variance: Math.round(overallStdDev * overallStdDev * 100) / 100,
      minNet: netValues.length > 0 ? Math.min(...netValues) : 0,
      maxNet: netValues.length > 0 ? Math.max(...netValues) : 0,
      range: netValues.length > 0 ? Math.max(...netValues) - Math.min(...netValues) : 0,
      q1,
      q3,
      iqr: q3 - q1,
      skewness: 0, // Simplified
      kurtosis: 0, // Simplified
    };

    // ========================================================================
    // 5. TRANSFORM STUDENT RESULTS
    // ========================================================================

    const students: StudentResult[] = results.map((r: any, idx: number) => {
      const previousNet = historicalData.get(r.student_no) ?? null;
      const trendDirection = determineTrendDirection(r.total_net || 0, previousNet);
      const percentile = calculatePercentile(r.total_net || 0, sortedNets);
      const zScore = calculateZScore(r.total_net || 0, overallMean, overallStdDev);
      const riskLevel = determineRiskLevel(r.total_net || 0, percentile, trendDirection);

      // Parse subject results
      const subjectResults = r.subject_results || {};
      const subjects = Object.entries(LGS_SUBJECTS).map(([code, name]) => {
        const sr = subjectResults[code] || {};
        return {
          subjectCode: code,
          subjectName: name,
          questionCount: sr.max || 0,
          correct: sr.correct || 0,
          wrong: sr.wrong || 0,
          empty: sr.empty || 0,
          net: sr.net || 0,
          successRate: sr.max > 0 ? Math.round((sr.correct / sr.max) * 100) : 0,
        };
      });

      return {
        studentId: r.id,
        studentNo: r.student_no || '',
        fullName: r.student_name || '',
        className: r.class_name || '',
        bookletType: r.booklet_type || 'A',
        totalCorrect: r.total_correct || 0,
        totalWrong: r.total_wrong || 0,
        totalEmpty: r.total_empty || 0,
        totalNet: r.total_net || 0,
        totalScore: r.total_score || 0,
        classRank: r.class_rank || 0,
        schoolRank: idx + 1,
        percentile,
        zScore: Math.round(zScore * 100) / 100,
        subjects,
        riskLevel,
        trendDirection,
        previousExamNet: previousNet ?? undefined,
        netChange: previousNet !== null ? Math.round((r.total_net - previousNet) * 10) / 10 : undefined,
      };
    });

    // ========================================================================
    // 6. CLASS STATISTICS
    // ========================================================================

    const classMap = new Map<string, StudentResult[]>();
    students.forEach((s) => {
      if (!classMap.has(s.className)) classMap.set(s.className, []);
      classMap.get(s.className)!.push(s);
    });

    const classStats: ClassStats[] = Array.from(classMap.entries())
      .map(([className, classStudents]) => {
        const nets = classStudents.map((s) => s.totalNet);
        const scores = classStudents.map((s) => s.totalScore);
        const mean = calculateMean(nets);
        const { q1: cq1, q3: cq3 } = calculateQuartiles(nets);

        return {
          className,
          studentCount: classStudents.length,
          averageNet: Math.round(mean * 100) / 100,
          averageScore: Math.round(calculateMean(scores) * 100) / 100,
          medianNet: calculateMedian(nets),
          standardDeviation: Math.round(calculateStandardDeviation(nets, mean) * 100) / 100,
          minNet: nets.length > 0 ? Math.min(...nets) : 0,
          maxNet: nets.length > 0 ? Math.max(...nets) : 0,
          q1: cq1,
          q3: cq3,
          schoolRank: 0,
          comparedToSchool: Math.round(((mean - overallMean) / (overallMean || 1)) * 100),
        };
      })
      .sort((a, b) => b.averageNet - a.averageNet)
      .map((cs, idx) => ({ ...cs, schoolRank: idx + 1 }));

    // ========================================================================
    // 7. SUBJECT STATISTICS
    // ========================================================================

    const subjectStats: SubjectStats[] = Object.entries(LGS_SUBJECTS).map(([code, name]) => {
      const subjectData = students
        .map((s) => s.subjects.find((sub) => sub.subjectCode === code))
        .filter(Boolean) as any[];

      const nets = subjectData.map((sd) => sd.net);
      const corrects = subjectData.map((sd) => sd.correct);
      const wrongs = subjectData.map((sd) => sd.wrong);
      const empties = subjectData.map((sd) => sd.empty);
      const maxQ = subjectData[0]?.questionCount || 0;

      const avgNet = calculateMean(nets);
      const avgCorrect = calculateMean(corrects);
      const successRate = maxQ > 0 ? Math.round((avgCorrect / maxQ) * 100) : 0;

      return {
        subjectCode: code,
        subjectName: name,
        questionCount: maxQ,
        averageNet: Math.round(avgNet * 100) / 100,
        averageCorrect: Math.round(avgCorrect * 100) / 100,
        averageWrong: Math.round(calculateMean(wrongs) * 100) / 100,
        averageEmpty: Math.round(calculateMean(empties) * 100) / 100,
        successRate,
        standardDeviation: Math.round(calculateStandardDeviation(nets, avgNet) * 100) / 100,
        difficultyIndex: successRate / 100,
        discriminationIndex: 0.5, // Placeholder
      };
    });

    // ========================================================================
    // 8. DISTRIBUTIONS
    // ========================================================================

    const distributions: StatisticalDistributions = {
      netDistribution: createDistributionBuckets(netValues, 10),
      scoreDistribution: createDistributionBuckets(scoreValues, 10),
      subjectDistributions: {},
    };

    Object.keys(LGS_SUBJECTS).forEach((code) => {
      const subjectNets = students
        .map((s) => s.subjects.find((sub) => sub.subjectCode === code)?.net || 0);
      distributions.subjectDistributions[code] = createDistributionBuckets(subjectNets, 5);
    });

    // ========================================================================
    // 9. TREND ANALYSIS
    // ========================================================================

    const trends: TrendAnalysis[] = [];

    if (includeHistorical) {
      const { data: allExams } = await supabase
        .from('exams')
        .select('id, name, exam_date')
        .eq('organization_id', exam.organizationId)
        .eq('grade_level', exam.gradeLevel)
        .order('exam_date', { ascending: true })
        .limit(10);

      if (allExams) {
        for (const ex of allExams) {
          const { data: exResults } = await supabase
            .from('student_exam_results')
            .select('total_net')
            .eq('exam_id', ex.id);

          if (exResults && exResults.length > 0) {
            const avgNet = calculateMean(exResults.map((r: any) => r.total_net || 0));
            trends.push({
              examId: ex.id,
              examName: ex.name,
              examDate: ex.exam_date,
              averageNet: Math.round(avgNet * 100) / 100,
              participantCount: exResults.length,
            });
          }
        }

        // Calculate changes
        for (let i = 1; i < trends.length; i++) {
          trends[i].changeFromPrevious = Math.round((trends[i].averageNet - trends[i - 1].averageNet) * 100) / 100;
          trends[i].percentageChange = Math.round(
            ((trends[i].averageNet - trends[i - 1].averageNet) / (trends[i - 1].averageNet || 1)) * 100
          );
        }
      }
    }

    // ========================================================================
    // 10. RISK ANALYSIS
    // ========================================================================

    const riskStudents: RiskAnalysis[] = students
      .filter((s) => s.riskLevel === 'critical' || s.riskLevel === 'high')
      .slice(0, 20)
      .map((s) => {
        const riskFactors: string[] = [];
        const suggestedActions: string[] = [];

        if (s.percentile < 15) {
          riskFactors.push('Sınıf sıralamasında alt %15');
          suggestedActions.push('Birebir destek programı');
        }
        if (s.trendDirection === 'down') {
          riskFactors.push('Düşüş trendi');
          suggestedActions.push('Veli görüşmesi');
        }
        if (s.totalNet < 25) {
          riskFactors.push('Kritik düşük net');
          suggestedActions.push('Etüt programı');
        }

        // Subject weaknesses
        s.subjects.forEach((sub) => {
          if (sub.successRate < 30) {
            riskFactors.push(`${sub.subjectName} zayıf`);
            suggestedActions.push(`${sub.subjectName} takviye dersi`);
          }
        });

        return {
          studentId: s.studentId,
          fullName: s.fullName,
          className: s.className,
          riskLevel: s.riskLevel,
          riskScore: 100 - s.percentile,
          riskFactors: riskFactors.slice(0, 5),
          suggestedActions: suggestedActions.slice(0, 3),
          urgency: s.riskLevel === 'critical' ? 'immediate' : 'soon',
        };
      });

    // ========================================================================
    // 11. OPPORTUNITY ANALYSIS
    // ========================================================================

    const opportunities: OpportunityAnalysis[] = students
      .filter((s) => s.riskLevel === 'low' || s.riskLevel === 'none')
      .filter((s) => s.percentile >= 50 && s.percentile < 90)
      .slice(0, 10)
      .map((s) => {
        const strengths = s.subjects
          .filter((sub) => sub.successRate >= 70)
          .map((sub) => sub.subjectName);

        const focusAreas = s.subjects
          .filter((sub) => sub.successRate < 50)
          .map((sub) => sub.subjectName);

        return {
          studentId: s.studentId,
          fullName: s.fullName,
          className: s.className,
          potentialScore: s.totalScore * 1.15,
          currentScore: s.totalScore,
          growthPotential: 15,
          strengths,
          focusAreas,
        };
      });

    // ========================================================================
    // 12. AI RECOMMENDATIONS
    // ========================================================================

    const recommendations: AIRecommendation[] = [];

    // Class-level recommendations
    classStats.forEach((cs) => {
      if (cs.comparedToSchool < -10) {
        recommendations.push({
          type: 'class',
          targetId: cs.className,
          targetName: cs.className,
          priority: 'high',
          recommendation: `${cs.className} sınıfı okul ortalamasının ${Math.abs(cs.comparedToSchool)}% altında. Acil müdahale gerekli.`,
          expectedImpact: 'Sınıf ortalamasını %10 artırabilir',
          difficulty: 'medium',
        });
      }
    });

    // Subject-level recommendations
    subjectStats.forEach((ss) => {
      if (ss.successRate < 40) {
        recommendations.push({
          type: 'subject',
          targetId: ss.subjectCode,
          targetName: ss.subjectName,
          priority: 'high',
          recommendation: `${ss.subjectName} dersinde başarı oranı %${ss.successRate}. Konu takviyesi önerilir.`,
          expectedImpact: 'Genel net ortalamasını 2-3 puan artırabilir',
          difficulty: 'medium',
        });
      }
    });

    // ========================================================================
    // 13. BUILD RESPONSE
    // ========================================================================

    const processingTime = Date.now() - startTime;

    const response: ExamIntelligenceResponse = {
      exam,
      students,
      statistics: {
        overall: overallStats,
        byClass: classStats,
        bySubject: subjectStats,
        distributions,
        trends,
      },
      insights: {
        riskStudents,
        opportunities,
        recommendations,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: processingTime,
        dataQuality: warnings.length === 0 ? 100 : Math.max(50, 100 - warnings.length * 10),
        warnings,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Exam Intelligence API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET METHOD (for simple fetches)
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('examId');

  if (!examId) {
    return NextResponse.json({ error: 'examId gerekli' }, { status: 400 });
  }

  // Redirect to POST with default options
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      examId,
      options: {
        includeHistorical: true,
        includePredictions: true,
        includeComparisons: true,
        depth: 'detailed',
      },
    }),
  });

  return POST(fakeRequest);
}

