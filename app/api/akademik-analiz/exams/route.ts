/**
 * Akademik Analiz - Sınavlar API
 * CRUD operations for exams
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Tüm sınavları listele
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    
    const organizationId = searchParams.get('organizationId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('exams')
      .select(`
        *,
        exam_type:exam_types(id, code, name, wrong_penalty_divisor),
        academic_year:academic_years(id, name)
      `)
      .order('exam_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[API] Sınav listesi hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      exams: data || [],
      total: count || data?.length || 0
    });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yeni sınav oluştur
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    
    const {
      name,
      exam_type_id,
      academic_year_id,
      organization_id,
      exam_date,
      total_questions,
      duration_minutes,
      answer_key,
      question_mapping,
      target_classes,
      created_by
    } = body;
    
    // Validasyon
    if (!name || !exam_type_id || !exam_date || !total_questions) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik: name, exam_type_id, exam_date, total_questions' },
        { status: 400 }
      );
    }
    
    // Sınav oluştur
    const { data, error } = await supabase
      .from('exams')
      .insert({
        name,
        exam_type_id,
        academic_year_id,
        organization_id,
        exam_date,
        total_questions,
        duration_minutes,
        answer_key,
        question_mapping,
        target_classes,
        status: 'draft',
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('[API] Sınav oluşturma hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Audit log
    await supabase.from('exam_audit_log').insert({
      action: 'CREATE',
      entity_type: 'exam',
      entity_id: data.id,
      exam_id: data.id,
      new_value: data,
      description: `Sınav oluşturuldu: ${name}`,
      performed_by: created_by,
      organization_id
    });
    
    return NextResponse.json({ exam: data }, { status: 201 });
    
  } catch (error) {
    console.error('[API] Beklenmeyen hata:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

