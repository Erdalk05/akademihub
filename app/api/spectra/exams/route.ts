// ============================================================================
// SPECTRA - EXAMS API (POST: Create, GET: List)
// Route: /api/spectra/exams
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { createExamSchema, validateRequest } from '@/lib/spectra/validators';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// POST: Yeni Sınav Oluştur (status=draft)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    const validation = validateRequest(createExamSchema, body);
    console.log('[API] validation.success:', validation.success);
    console.log('[API] validation.data:', validation.data);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const {
      name,
      exam_type,
      exam_date,
      grade_level,
      description,
      organization_id,
      academic_year_id,
      total_questions,
    } = validation.data!;

    console.log('[API] VALIDATED exam payload:', validation.data);

    const supabase = getServiceRoleClient();

    // Sınav oluştur (draft status)
    const examData: Record<string, unknown> = {
      name,
      exam_type,
      exam_date,
      total_questions,
      organization_id,
      status: 'draft',
      source: 'wizard',
    };

    if (grade_level) examData.grade_level = grade_level;
    if (description) examData.description = description;
    if (academic_year_id) examData.academic_year_id = academic_year_id;

    console.log('[API] Insert payload (exams):', examData);

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert(examData)
      .select('id, name, exam_type, exam_date, status')
      .single();

    if (examError) {
      console.error('[SPECTRA/EXAMS] Insert error:', examError);
      return NextResponse.json(
        { success: false, message: `Sınav oluşturulamadı: ${examError.message}` },
        { status: 500 }
      );
    }

    console.log(`[SPECTRA/EXAMS] ✅ Created exam: ${exam.id} - ${exam.name}`);

    return NextResponse.json({
      success: true,
      examId: exam.id,
      exam,
    });

  } catch (error: unknown) {
    console.error('[SPECTRA/EXAMS] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Sınav Listesi
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'organization_id gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    let query = supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level, total_questions, status, participant_count, average_net, created_at', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('exam_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: exams, error, count } = await query;

    if (error) {
      console.error('[SPECTRA/EXAMS] List error:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exams || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });

  } catch (error: unknown) {
    console.error('[SPECTRA/EXAMS] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
