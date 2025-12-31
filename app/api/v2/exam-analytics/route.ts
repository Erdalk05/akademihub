/**
 * Exam Analytics V2 API
 * 
 * Exam-based analytics engine for scalable multi-exam analysis.
 * Uses existing tables. No schema modifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import type {
  ExamDashboardResponse,
  ExamContext,
  ComparisonContext,
  ExamSummaryKPIs,
  ClassPerformance,
  SubjectPerformance,
  ExamTrends,
  ExamTrendPoint,
  StudentSegment,
  ClassDistribution,
  ContextInsight,
} from '@/types/exam-dashboard';

export const dynamic = 'force-dynamic';

// Ders kodu -> isim mapping
const SUBJECT_NAMES: Record<string, string> = {
  TUR: 'Türkçe',
  INK: 'T.C. İnkılap',
  DIN: 'Din Kültürü',
  ING: 'İngilizce',
  MAT: 'Matematik',
  FEN: 'Fen Bilimleri',
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);

    const examId = searchParams.get('examId');
    const gradeLevel = searchParams.get('gradeLevel');
    const compareWith = searchParams.get('compareWith') as 'previous' | 'average' | null;
    const trendWindow = searchParams.get('trendWindow') ? parseInt(searchParams.get('trendWindow')!) : null;

    if (!examId || !gradeLevel) {
      return NextResponse.json(
        { error: 'examId and gradeLevel are required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 1. FETCH SELECTED EXAM
    // ========================================================================
    const { data: selectedExam, error: examError } = await supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level, total_questions, organization_id')
      .eq('id', examId)
      .single();

    if (examError || !selectedExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // ========================================================================
    // 2. FETCH EXAM RESULTS (from student_exam_results)
    // ========================================================================
    const { data: examResults } = await supabase
      .from('student_exam_results')
      .select(`
        id,
        exam_id,
        student_no,
        student_name,
        class_name,
        total_net,
        total_correct,
        total_wrong,
        total_empty,
        total_score,
        general_rank
      `)
      .eq('exam_id', examId);

    const results = examResults || [];

    // ========================================================================
    // 3. BUILD EXAM CONTEXT
    // ========================================================================
    const examContext: ExamContext = {
      examId: selectedExam.id,
      examName: selectedExam.name,
      examDate: selectedExam.exam_date || '',
      examType: selectedExam.exam_type || 'LGS',
      gradeLevel: selectedExam.grade_level || gradeLevel,
      totalQuestions: selectedExam.total_questions || 0,
      participantCount: results.length,
    };

    // ========================================================================
    // 4. COMPUTE SUMMARY KPIs
    // ========================================================================
    const totalNet = results.reduce((sum, r) => sum + (r.total_net || 0), 0);
    const totalScore = results.reduce((sum, r) => sum + (r.total_score || 0), 0);
    const avgNet = results.length > 0 ? totalNet / results.length : 0;
    const avgScore = results.length > 0 ? totalScore / results.length : 0;

    // Estimate subject averages (legacy table doesn't have subject breakdown)
    // Use simple equal distribution across 6 subjects
    const subjectCodes = Object.keys(SUBJECT_NAMES);
    const estimatedSubjectAvg = avgNet / subjectCodes.length;
    
    const subjectAverages: Record<string, number> = {};
    subjectCodes.forEach(code => {
      subjectAverages[code] = estimatedSubjectAvg;
    });

    // Find strongest/weakest
    const sortedSubjects = Object.entries(subjectAverages).sort((a, b) => b[1] - a[1]);
    const strongest = sortedSubjects[0];
    const weakest = sortedSubjects[sortedSubjects.length - 1];

    const summary: ExamSummaryKPIs = {
      totalParticipants: results.length,
      averageNet: parseFloat(avgNet.toFixed(2)),
      averageScore: parseFloat(avgScore.toFixed(2)),
      strongestSubject: strongest ? {
        code: strongest[0],
        name: SUBJECT_NAMES[strongest[0]],
        average: parseFloat(strongest[1].toFixed(2)),
      } : null,
      weakestSubject: weakest ? {
        code: weakest[0],
        name: SUBJECT_NAMES[weakest[0]],
        average: parseFloat(weakest[1].toFixed(2)),
      } : null,
      deltaParticipants: null,
      deltaAverageNet: null,
      deltaPercentage: null,
    };

    // ========================================================================
    // 5. CLASS-LEVEL ANALYSIS
    // ========================================================================
    const classSums: Record<string, { totalNet: number; totalScore: number; count: number }> = {};
    
    results.forEach(r => {
      const cls = r.class_name || 'Bilinmeyen';
      if (!classSums[cls]) classSums[cls] = { totalNet: 0, totalScore: 0, count: 0 };
      classSums[cls].totalNet += r.total_net || 0;
      classSums[cls].totalScore += r.total_score || 0;
      classSums[cls].count += 1;
    });

    const classPerformances: ClassPerformance[] = Object.entries(classSums).map(([className, data]) => ({
      className,
      participantCount: data.count,
      averageNet: parseFloat((data.totalNet / data.count).toFixed(2)),
      averageScore: parseFloat((data.totalScore / data.count).toFixed(2)),
      rank: 0, // Will be assigned after sorting
      deltaNet: null,
      deltaRank: null,
    }));

    // Sort by averageNet and assign ranks
    classPerformances.sort((a, b) => b.averageNet - a.averageNet);
    classPerformances.forEach((cls, idx) => {
      cls.rank = idx + 1;
    });

    // ========================================================================
    // 6. SUBJECT-LEVEL ANALYSIS
    // ========================================================================
    const subjectPerformances: SubjectPerformance[] = subjectCodes.map(code => {
      const avg = subjectAverages[code] || 0;
      const maxQ = selectedExam.total_questions / subjectCodes.length; // Equal distribution
      const successRate = maxQ > 0 ? (avg / maxQ) * 100 : 0;

      return {
        subjectCode: code,
        subjectName: SUBJECT_NAMES[code],
        averageNet: parseFloat(avg.toFixed(2)),
        averageCorrect: parseFloat(avg.toFixed(2)), // Approximation
        averageWrong: 0,
        averageEmpty: 0,
        maxQuestions: Math.round(maxQ),
        successRate: parseFloat(successRate.toFixed(1)),
        deltaNet: null,
        deltaSuccessRate: null,
      };
    });

    // ========================================================================
    // 7. COMPARISON (OPTIONAL)
    // ========================================================================
    let comparisonContext: ComparisonContext = { type: null };

    if (compareWith === 'previous') {
      // Find previous exam for this grade level
      const { data: prevExam } = await supabase
        .from('exams')
        .select('id, name, exam_date')
        .eq('organization_id', selectedExam.organization_id)
        .eq('grade_level', gradeLevel)
        .lt('exam_date', selectedExam.exam_date)
        .order('exam_date', { ascending: false })
        .limit(1)
        .single();

      if (prevExam) {
        comparisonContext = {
          type: 'previous',
          examId: prevExam.id,
          examName: prevExam.name,
          examDate: prevExam.exam_date,
        };

        // Fetch previous exam results for delta calculation
        const { data: prevResults } = await supabase
          .from('student_exam_results')
          .select('total_net, total_score')
          .eq('exam_id', prevExam.id);

        if (prevResults && prevResults.length > 0) {
          const prevAvgNet = prevResults.reduce((s, r) => s + (r.total_net || 0), 0) / prevResults.length;
          
          summary.deltaParticipants = results.length - prevResults.length;
          summary.deltaAverageNet = parseFloat((avgNet - prevAvgNet).toFixed(2));
          summary.deltaPercentage = prevAvgNet > 0 
            ? parseFloat((((avgNet - prevAvgNet) / prevAvgNet) * 100).toFixed(1))
            : null;
        }
      }
    } else if (compareWith === 'average') {
      comparisonContext = { type: 'average' };
      // Average comparison logic would go here (all exams of this grade level)
      // Skipped for foundation - can be added later
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    const response: ExamDashboardResponse = {
      examContext,
      comparisonContext,
      summary,
      classByClass: classPerformances,
      subjectBySubject: subjectPerformances,
      meta: {
        calculatedAt: new Date().toISOString(),
        dataSource: 'student_exam_results',
        hasComparison: comparisonContext.type !== null,
      },
    };

    // ========================================================================
    // 8. TIME DIMENSION (V2.1) - OPTIONAL TRENDS
    // ========================================================================
    if (trendWindow && trendWindow > 0) {
      // Fetch last N exams for this grade level and organization
      const { data: trendExams } = await supabase
        .from('exams')
        .select('id, name, exam_date')
        .eq('organization_id', selectedExam.organization_id)
        .eq('grade_level', gradeLevel)
        .lte('exam_date', selectedExam.exam_date) // Include current and earlier
        .order('exam_date', { ascending: false })
        .limit(trendWindow);

      const trendPoints: ExamTrendPoint[] = [];

      if (trendExams && trendExams.length > 0) {
        // For each exam, compute averageNet
        for (const exam of trendExams) {
          const { data: examResults } = await supabase
            .from('student_exam_results')
            .select('total_net')
            .eq('exam_id', exam.id);

          if (examResults && examResults.length > 0) {
            const avgNet = examResults.reduce((sum, r) => sum + (r.total_net || 0), 0) / examResults.length;
            
            trendPoints.push({
              examId: exam.id,
              examName: exam.name,
              examDate: exam.exam_date || '',
              averageNet: parseFloat(avgNet.toFixed(2)),
            });
          }
        }

        // Sort by date ascending (oldest to newest)
        trendPoints.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

        response.trends = {
          lastExams: trendPoints,
          windowSize: trendWindow,
        };
      }
    }

    // ========================================================================
    // 9. SEGMENTATION (V2.2) - STUDENT & CLASS ANALYSIS
    // ========================================================================
    
    // A) STUDENT SEGMENTATION (percentile-based)
    if (results.length >= 5) {
      // Sort by total_net descending
      const sortedStudents = [...results].sort((a, b) => (b.total_net || 0) - (a.total_net || 0));
      
      const bottom20Index = Math.floor(sortedStudents.length * 0.2);
      const top20Index = Math.floor(sortedStudents.length * 0.8);

      const studentSegments: StudentSegment[] = sortedStudents.map((r, idx) => {
        let segment: 'LOW' | 'MID' | 'HIGH';
        
        if (idx >= top20Index) {
          segment = 'LOW';
        } else if (idx < bottom20Index) {
          segment = 'HIGH';
        } else {
          segment = 'MID';
        }

        return {
          studentId: r.id || '',
          fullName: r.student_name || 'Bilinmeyen',
          className: r.class_name || 'Bilinmeyen',
          averageNet: r.total_net || 0,
          segment,
        };
      });

      response.studentSegments = studentSegments;
    }

    // B) CLASS DISTRIBUTION (quartile analysis)
    const classGroups: Record<string, number[]> = {};
    
    results.forEach(r => {
      const cls = r.class_name || 'Bilinmeyen';
      if (!classGroups[cls]) classGroups[cls] = [];
      classGroups[cls].push(r.total_net || 0);
    });

    const classDistributions: ClassDistribution[] = [];

    for (const [className, nets] of Object.entries(classGroups)) {
      if (nets.length < 5) continue; // Skip classes with < 5 students

      // Sort ascending
      const sorted = nets.sort((a, b) => a - b);
      const n = sorted.length;

      // Simple percentile calculation
      const getPercentile = (p: number): number => {
        const index = Math.floor((n - 1) * p);
        return sorted[index];
      };

      classDistributions.push({
        className,
        minNet: sorted[0],
        q1: getPercentile(0.25),
        median: getPercentile(0.50),
        q3: getPercentile(0.75),
        maxNet: sorted[n - 1],
      });
    }

    if (classDistributions.length > 0) {
      response.classDistributions = classDistributions;
    }

    // ========================================================================
    // 10. CONTEXTUAL INTELLIGENCE (V2.3) - RULE-BASED INSIGHTS
    // ========================================================================
    const insights: ContextInsight[] = [];
    const currentAvgNet = avgNet;

    // A) EXAM DIFFICULTY (compare to trend average)
    if (response.trends && response.trends.lastExams.length >= 2) {
      const trendAvg = response.trends.lastExams.reduce((sum, e) => sum + e.averageNet, 0) / response.trends.lastExams.length;
      const diffPct = ((currentAvgNet - trendAvg) / trendAvg) * 100;
      
      if (diffPct <= -5) {
        insights.push({
          type: 'DIFFICULTY',
          level: 'INFO',
          message: `Bu sınav önceki sınavlara göre %${Math.abs(diffPct).toFixed(1)} daha düşük ortalama net ile sonuçlandı.`,
        });
      }
    }

    // B) GENERAL IMPROVEMENT / DECLINE (compare to previous exam if exists)
    if (summary.deltaAverageNet !== null && summary.deltaAverageNet !== undefined) {
      const changeNet = summary.deltaAverageNet;
      const changePct = summary.deltaPercentage;
      
      if (changePct !== null && changePct !== undefined) {
        if (changePct >= 3) {
          insights.push({
            type: 'IMPROVEMENT',
            level: 'POSITIVE',
            message: `Sınav ortalaması önceki sınava göre ${changeNet.toFixed(1)} net artış gösterdi (%${changePct.toFixed(1)}).`,
          });
        } else if (changePct <= -3) {
          insights.push({
            type: 'DECLINE',
            level: 'WARNING',
            message: `Sınav ortalaması önceki sınava göre ${Math.abs(changeNet).toFixed(1)} net düşüş gösterdi (%${Math.abs(changePct).toFixed(1)}).`,
          });
        }
      }
    }

    // C) RISK ESCALATION (LOW segment ratio check)
    if (response.studentSegments && response.studentSegments.length > 0) {
      const lowCount = response.studentSegments.filter(s => s.segment === 'LOW').length;
      const lowRatio = (lowCount / response.studentSegments.length) * 100;
      
      // Expected is 20%, if significantly higher, flag it
      if (lowRatio >= 25) {
        insights.push({
          type: 'RISK',
          level: 'WARNING',
          message: `Düşük performans grubundaki öğrenci oranı beklenen %20'nin üzerinde: %${lowRatio.toFixed(1)} (${lowCount} öğrenci).`,
        });
      }
    }

    // D) CLASS OUTLIERS (median deviation)
    if (response.classDistributions && response.classDistributions.length > 0) {
      const overallMedian = response.classDistributions.reduce((sum, c) => sum + c.median, 0) / response.classDistributions.length;
      
      response.classDistributions.forEach(cls => {
        const deviationPct = ((cls.median - overallMedian) / overallMedian) * 100;
        
        if (Math.abs(deviationPct) >= 10) {
          const direction = deviationPct > 0 ? 'üzerinde' : 'altında';
          insights.push({
            type: 'OUTLIER',
            level: 'INFO',
            message: `${cls.className} sınıfı genel medyandan %${Math.abs(deviationPct).toFixed(1)} ${direction} performans gösterdi.`,
            relatedClass: cls.className,
          });
        }
      });
    }

    // E) SUBJECT IMPACT (below-average subjects)
    if (response.subjectBySubject && response.subjectBySubject.length > 0) {
      const subjectAvg = response.subjectBySubject.reduce((sum, s) => sum + s.averageNet, 0) / response.subjectBySubject.length;
      
      response.subjectBySubject.forEach(subj => {
        const deviationPct = ((subj.averageNet - subjectAvg) / subjectAvg) * 100;
        
        if (deviationPct <= -15) {
          insights.push({
            type: 'DECLINE',
            level: 'INFO',
            message: `${subj.subjectName} dersi genel ders ortalamasından %${Math.abs(deviationPct).toFixed(1)} düşük performans gösterdi.`,
            relatedSubject: subj.subjectCode,
          });
        }
      });
    }

    // Sort by severity: WARNING → POSITIVE → INFO, limit to 5
    const severityOrder = { WARNING: 1, POSITIVE: 2, INFO: 3 };
    insights.sort((a, b) => severityOrder[a.level] - severityOrder[b.level]);
    
    if (insights.length > 0) {
      response.insights = insights.slice(0, 5);
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Exam Analytics V2] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

