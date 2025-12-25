/**
 * Akademik Analiz - Öğrenci Profili API
 * Longitudinal progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    
    const studentId = searchParams.get('studentId');
    const academicYearId = searchParams.get('academicYearId');
    const organizationId = searchParams.get('organizationId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId gerekli' },
        { status: 400 }
      );
    }
    
    // 1. Öğrenci bilgileri
    const { data: student } = await supabase
      .from('students')
      .select('id, student_number, first_name, last_name, class_name, tc_no')
      .eq('id', studentId)
      .single();
    
    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 });
    }
    
    // 2. Tüm sınav sonuçları (gelişim trendi için)
    let resultsQuery = supabase
      .from('exam_student_results')
      .select(`
        id,
        total_correct,
        total_wrong,
        total_empty,
        total_net,
        raw_score,
        rank_in_exam,
        rank_in_class,
        percentile,
        subject_results,
        topic_results,
        ai_analysis,
        calculated_at,
        exam:exams(id, name, exam_date, total_questions, exam_type:exam_types(code, name))
      `)
      .eq('student_id', studentId)
      .order('calculated_at', { ascending: true });
    
    if (organizationId) {
      resultsQuery = resultsQuery.eq('organization_id', organizationId);
    }
    
    const { data: examResults } = await resultsQuery;
    
    // 3. Ders bazlı ortalamalar hesapla
    const subjectAverages: Record<string, { 
      totalNet: number; 
      count: number; 
      avgNet: number;
      trend: number;
    }> = {};
    
    if (examResults) {
      examResults.forEach(r => {
        if (r.subject_results && typeof r.subject_results === 'object') {
          Object.entries(r.subject_results).forEach(([subj, data]: [string, any]) => {
            if (!subjectAverages[subj]) {
              subjectAverages[subj] = { totalNet: 0, count: 0, avgNet: 0, trend: 0 };
            }
            subjectAverages[subj].totalNet += data.net || 0;
            subjectAverages[subj].count += 1;
          });
        }
      });
      
      Object.keys(subjectAverages).forEach(subj => {
        subjectAverages[subj].avgNet = 
          subjectAverages[subj].totalNet / subjectAverages[subj].count;
      });
    }
    
    // 4. Zayıf konular (son 3 sınavda %50 altı)
    const weakTopics: { topicId: string; topicName: string; successRate: number }[] = [];
    const recentResults = (examResults || []).slice(-3);
    
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    
    recentResults.forEach(r => {
      if (r.topic_results && typeof r.topic_results === 'object') {
        Object.entries(r.topic_results).forEach(([topicId, data]: [string, any]) => {
          if (!topicPerformance[topicId]) {
            topicPerformance[topicId] = { correct: 0, total: 0 };
          }
          topicPerformance[topicId].correct += data.correct || 0;
          topicPerformance[topicId].total += data.total || 0;
        });
      }
    });
    
    Object.entries(topicPerformance).forEach(([topicId, { correct, total }]) => {
      if (total > 0) {
        const rate = correct / total;
        if (rate < 0.5) {
          weakTopics.push({
            topicId,
            topicName: topicId, // Gerçek isim için topic tablosundan çekilebilir
            successRate: parseFloat((rate * 100).toFixed(1))
          });
        }
      }
    });
    
    // 5. Gelişim trendi
    const trendData = (examResults || []).map(r => ({
      examId: r.exam?.id,
      examName: r.exam?.name,
      examDate: r.exam?.exam_date,
      totalNet: r.total_net,
      percentile: r.percentile,
      rank: r.rank_in_exam
    }));
    
    // 6. Genel istatistikler
    const stats = {
      totalExams: examResults?.length || 0,
      avgNet: examResults && examResults.length > 0
        ? (examResults.reduce((sum, r) => sum + (r.total_net || 0), 0) / examResults.length).toFixed(2)
        : '0',
      avgPercentile: examResults && examResults.length > 0
        ? (examResults.reduce((sum, r) => sum + (r.percentile || 0), 0) / examResults.length).toFixed(1)
        : '0',
      bestRank: examResults && examResults.length > 0
        ? Math.min(...examResults.map(r => r.rank_in_exam || 999))
        : null
    };
    
    return NextResponse.json({
      student,
      examHistory: examResults || [],
      subjectAverages,
      weakTopics: weakTopics.sort((a, b) => a.successRate - b.successRate).slice(0, 5),
      trendData,
      stats
    });
    
  } catch (error) {
    console.error('[API] Öğrenci profili hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

