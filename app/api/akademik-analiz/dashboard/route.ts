/**
 * Akademik Analiz - Dashboard API
 * Executive summary metrics and charts data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    
    const organizationId = searchParams.get('organizationId');
    const academicYearId = searchParams.get('academicYearId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId gerekli' },
        { status: 400 }
      );
    }
    
    // 1. Toplam sınav sayısı ve son sınavlar
    let examsQuery = supabase
      .from('exams')
      .select('id, name, exam_date, status, stats_cache, total_questions')
      .eq('organization_id', organizationId)
      .order('exam_date', { ascending: false })
      .limit(10);
    
    if (academicYearId) {
      examsQuery = examsQuery.eq('academic_year_id', academicYearId);
    }
    
    const { data: recentExams } = await examsQuery;
    
    // 2. Toplam öğrenci sayısı (sınava giren)
    const { count: totalParticipants } = await supabase
      .from('exam_student_results')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    // 3. Genel ortalama net
    const { data: avgData } = await supabase
      .from('exam_student_results')
      .select('total_net')
      .eq('organization_id', organizationId);
    
    const avgNet = avgData && avgData.length > 0
      ? (avgData.reduce((sum, r) => sum + (r.total_net || 0), 0) / avgData.length).toFixed(2)
      : '0';
    
    // 4. Çakışma sayısı (validation errors)
    const { count: conflictCount } = await supabase
      .from('exam_validation_errors')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_resolved', false);
    
    // 5. En başarılı öğrenciler (Top 5)
    const { data: topPerformers } = await supabase
      .from('exam_student_results')
      .select(`
        total_net,
        percentile,
        student:students(id, first_name, last_name, class_name),
        exam:exams(id, name, exam_date)
      `)
      .eq('organization_id', organizationId)
      .order('total_net', { ascending: false })
      .limit(5);
    
    // 6. Ders bazlı ortalamalar (son sınavdan)
    let subjectAverages: Record<string, number> = {};
    if (recentExams && recentExams.length > 0) {
      const lastExamId = recentExams[0].id;
      
      const { data: lastExamResults } = await supabase
        .from('exam_student_results')
        .select('subject_results')
        .eq('exam_id', lastExamId);
      
      if (lastExamResults && lastExamResults.length > 0) {
        const subjectTotals: Record<string, { sum: number; count: number }> = {};
        
        lastExamResults.forEach(r => {
          if (r.subject_results && typeof r.subject_results === 'object') {
            Object.entries(r.subject_results).forEach(([subj, data]: [string, any]) => {
              if (!subjectTotals[subj]) {
                subjectTotals[subj] = { sum: 0, count: 0 };
              }
              subjectTotals[subj].sum += data.net || 0;
              subjectTotals[subj].count += 1;
            });
          }
        });
        
        Object.entries(subjectTotals).forEach(([subj, { sum, count }]) => {
          subjectAverages[subj] = parseFloat((sum / count).toFixed(2));
        });
      }
    }
    
    // 7. Skor dağılımı (son sınavdan)
    let scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };
    
    if (recentExams && recentExams.length > 0) {
      const lastExamId = recentExams[0].id;
      
      const { data: scores } = await supabase
        .from('exam_student_results')
        .select('total_net')
        .eq('exam_id', lastExamId);
      
      if (scores) {
        const maxNet = recentExams[0].total_questions || 100;
        
        scores.forEach(s => {
          const pct = (s.total_net / maxNet) * 100;
          if (pct <= 20) scoreDistribution['0-20']++;
          else if (pct <= 40) scoreDistribution['21-40']++;
          else if (pct <= 60) scoreDistribution['41-60']++;
          else if (pct <= 80) scoreDistribution['61-80']++;
          else scoreDistribution['81-100']++;
        });
      }
    }
    
    return NextResponse.json({
      metrics: {
        totalExams: recentExams?.length || 0,
        totalParticipants: totalParticipants || 0,
        avgNet: parseFloat(avgNet),
        conflicts: conflictCount || 0
      },
      recentExams: recentExams || [],
      topPerformers: topPerformers || [],
      subjectAverages,
      scoreDistribution
    });
    
  } catch (error) {
    console.error('[API] Dashboard hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

