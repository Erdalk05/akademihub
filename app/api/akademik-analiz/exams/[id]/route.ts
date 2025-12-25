/**
 * Akademik Analiz - Tek Sınav API
 * GET, PUT, DELETE for single exam
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Tek sınav detayı
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceRoleClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        exam_type:exam_types(*),
        academic_year:academic_years(id, name),
        questions:exam_questions(*),
        results:exam_student_results(
          id,
          student_id,
          total_correct,
          total_wrong,
          total_empty,
          total_net,
          raw_score,
          rank_in_exam,
          percentile,
          subject_results
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('[API] Sınav getirme hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ exam: data });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// PUT - Sınav güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceRoleClient();
    const { id } = await params;
    const body = await req.json();
    
    // Mevcut veriyi al (audit için)
    const { data: oldData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    
    // Güncelle
    const { data, error } = await supabase
      .from('exams')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[API] Sınav güncelleme hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Audit log
    await supabase.from('exam_audit_log').insert({
      action: 'UPDATE',
      entity_type: 'exam',
      entity_id: id,
      exam_id: id,
      old_value: oldData,
      new_value: data,
      changed_fields: Object.keys(body),
      description: `Sınav güncellendi: ${data.name}`,
      organization_id: data.organization_id
    });
    
    return NextResponse.json({ exam: data });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// DELETE - Sınav sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceRoleClient();
    const { id } = await params;
    
    // Mevcut veriyi al (audit için)
    const { data: oldData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!oldData) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }
    
    // Sil
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[API] Sınav silme hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Audit log
    await supabase.from('exam_audit_log').insert({
      action: 'DELETE',
      entity_type: 'exam',
      entity_id: id,
      old_value: oldData,
      description: `Sınav silindi: ${oldData.name}`,
      organization_id: oldData.organization_id
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

