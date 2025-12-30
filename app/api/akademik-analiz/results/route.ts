/**
 * Akademik Analiz - Sınav Sonuçları API
 * Toplu sonuç kaydetme ve sorgulama
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Sonuçları listele
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!examId && !studentId) {
      return NextResponse.json(
        { error: 'examId veya studentId gerekli' },
        { status: 400 }
      );
    }
    
    let query = supabase
      .from('exam_student_results')
      .select(`
        *,
        student:students(id, student_no, first_name, last_name),
        exam:exams(id, name, exam_date, total_questions)
      `)
      .range(offset, offset + limit - 1);
    
    if (examId) {
      query = query.eq('exam_id', examId).order('rank_in_exam', { ascending: true });
    }
    
    if (studentId) {
      query = query.eq('student_id', studentId).order('calculated_at', { ascending: false });
    }
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[API] Sonuç listesi hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ results: data || [] });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Toplu sonuç kaydet (Batch insert)
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    
    const { examId, results, organizationId, performedBy } = body;
    
    if (!examId || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'examId ve results array gerekli' },
        { status: 400 }
      );
    }
    
    // Mevcut sonuçları temizle (upsert için)
    await supabase
      .from('exam_student_results')
      .delete()
      .eq('exam_id', examId);
    
    // Sonuçları hazırla
    const now = new Date().toISOString();
    const preparedResults = results.map((r: any, index: number) => ({
      exam_id: examId,
      student_id: r.studentId,
      total_correct: r.totalCorrect || 0,
      total_wrong: r.totalWrong || 0,
      total_empty: r.totalEmpty || 0,
      total_net: r.totalNet || 0,
      raw_score: r.rawScore || 0,
      scaled_score: r.scaledScore || null,
      rank_in_exam: r.rankInExam || index + 1,
      rank_in_class: r.rankInClass || null,
      rank_in_school: r.rankInSchool || null,
      percentile: r.percentile || null,
      subject_results: r.subjectResults || {},
      topic_results: r.topicResults || {},
      learning_outcome_results: r.learningOutcomeResults || {},
      ai_analysis: r.aiAnalysis || null,
      calculated_at: now,
      organization_id: organizationId,
      created_at: now,
      updated_at: now
    }));
    
    // Batch insert
    const { data, error } = await supabase
      .from('exam_student_results')
      .insert(preparedResults)
      .select();
    
    if (error) {
      console.error('[API] Sonuç kaydetme hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Sınav istatistiklerini güncelle
    const avgNet = results.reduce((sum: number, r: any) => sum + (r.totalNet || 0), 0) / results.length;
    
    await supabase
      .from('exams')
      .update({
        status: 'completed',
        stats_calculated_at: now,
        stats_cache: {
          totalStudents: results.length,
          avgNet: avgNet.toFixed(2),
          calculatedAt: now
        },
        updated_at: now
      })
      .eq('id', examId);
    
    // Audit log
    await supabase.from('exam_audit_log').insert({
      action: 'CALCULATE',
      entity_type: 'result',
      exam_id: examId,
      new_value: { count: results.length, avgNet },
      description: `${results.length} öğrenci sonucu hesaplandı`,
      performed_by: performedBy,
      organization_id: organizationId
    });
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0 
    }, { status: 201 });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

