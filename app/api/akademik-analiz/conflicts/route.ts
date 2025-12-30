/**
 * Akademik Analiz - Çakışmalar API
 * Validation errors and conflict resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Çakışmaları listele
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    
    const examId = searchParams.get('examId');
    const organizationId = searchParams.get('organizationId');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = supabase
      .from('exam_validation_errors')
      .select(`
        *,
        student:students(id, student_no, first_name, last_name),
        exam:exams(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (examId) {
      query = query.eq('exam_id', examId);
    }
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    if (resolved !== null) {
      query = query.eq('is_resolved', resolved === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[API] Çakışma listesi hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ conflicts: data || [] });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yeni çakışma kaydet
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    
    const { conflicts, examId, organizationId } = body;
    
    if (!conflicts || !Array.isArray(conflicts)) {
      return NextResponse.json(
        { error: 'conflicts array gerekli' },
        { status: 400 }
      );
    }
    
    const preparedConflicts = conflicts.map((c: any) => ({
      exam_id: examId || c.examId,
      student_id: c.studentId,
      error_code: c.code || c.errorCode,
      error_type: c.type || 'error',
      error_message: c.message || c.errorMessage,
      question_no: c.questionNo,
      subject_code: c.subjectCode,
      field_name: c.fieldName,
      received_value: c.receivedValue,
      expected_value: c.expectedValue,
      is_resolved: false,
      organization_id: organizationId,
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('exam_validation_errors')
      .insert(preparedConflicts)
      .select();
    
    if (error) {
      console.error('[API] Çakışma kaydetme hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0 
    }, { status: 201 });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// PUT - Çakışmayı çöz
export async function PUT(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    
    const { conflictId, resolutionAction, resolutionNote, resolvedBy } = body;
    
    if (!conflictId) {
      return NextResponse.json(
        { error: 'conflictId gerekli' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('exam_validation_errors')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_action: resolutionAction,
        resolution_note: resolutionNote
      })
      .eq('id', conflictId)
      .select()
      .single();
    
    if (error) {
      console.error('[API] Çakışma çözme hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ conflict: data });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

