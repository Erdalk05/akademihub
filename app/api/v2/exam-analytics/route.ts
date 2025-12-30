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

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Exam Analytics V2] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

