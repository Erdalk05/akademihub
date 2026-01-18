import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { resultsQuerySchema, validateRequest } from '@/lib/spectra/validators';
import type { ResultsRow, LessonBreakdown } from '@/lib/spectra/types';

// ============================================================================
// SPECTRA - EXAM RESULTS API (v2.0)
// GET: Paginated, sortable, searchable results list
// ============================================================================

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;
    const { searchParams } = new URL(request.url);

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    // Parse query params
    const queryData = {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '25',
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'rank',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      className: searchParams.get('className') || undefined,
      participantType: searchParams.get('participantType') || 'all',
    };

    const validation = validateRequest(resultsQuerySchema, queryData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const { page, pageSize, search, sortBy, sortOrder, className, participantType } = validation.data!;

    const supabase = getServiceRoleClient();

    // 1. Sınav bilgilerini al
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, name, exam_date, organization_id, organizations(name)')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { success: false, message: 'Sınav bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Dersleri al (lesson_breakdown için mapping)
    const { data: sections } = await supabase
      .from('exam_sections')
      .select('id, code, name')
      .eq('exam_id', examId)
      .order('sort_order');

    const lessons = sections?.map(s => ({ code: s.code, name: s.name })) || [];

    // 3. Sonuçları al (exam_results + exam_participants join)
    let query = supabase
      .from('exam_results')
      .select(`
        id,
        exam_participant_id,
        total_correct,
        total_wrong,
        total_empty,
        total_cancelled,
        total_net,
        total_score,
        lesson_breakdown,
        calculated_at,
        exam_participants!inner (
          id,
          exam_id,
          participant_name,
          participant_type,
          class_name,
          guest_name,
          guest_class,
          student_id
        )
      `, { count: 'exact' })
      .eq('exam_participants.exam_id', examId);

    // Filters
    if (search) {
      query = query.ilike('exam_participants.participant_name', `%${search}%`);
    }

    if (className) {
      query = query.eq('exam_participants.class_name', className);
    }

    if (participantType && participantType !== 'all') {
      query = query.eq('exam_participants.participant_type', participantType);
    }

    // Sorting
    const sortColumn = sortBy === 'name' ? 'exam_participants.participant_name' :
                       sortBy === 'correct' ? 'total_correct' :
                       sortBy === 'score' ? 'total_score' :
                       sortBy === 'net' ? 'total_net' : 'total_net';
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: results, error: resultsError, count } = await query;

    if (resultsError) {
      console.error('[RESULTS] Query error:', resultsError);
      return NextResponse.json(
        { success: false, message: `Sonuç alınamadı: ${resultsError.message}` },
        { status: 500 }
      );
    }

    // 4. Format rows with rank
    const rows: ResultsRow[] = (results || []).map((r, index) => {
      const participant = r.exam_participants as any;
      
      return {
        rank: from + index + 1,
        participantId: r.exam_participant_id,
        resultId: r.id, // exam_results.id for replay
        participantName: participant?.participant_name || participant?.guest_name || 'İsimsiz',
        className: participant?.class_name || participant?.guest_class || undefined,
        participantType: participant?.participant_type || 'guest',
        totalCorrect: r.total_correct,
        totalWrong: r.total_wrong,
        totalEmpty: r.total_empty,
        totalNet: Number(r.total_net),
        totalScore: Number(r.total_score),
        lessonBreakdown: r.lesson_breakdown as LessonBreakdown[] || [],
      };
    });

    // 5. Katılımcı sayısı
    const { count: participantCount } = await supabase
      .from('exam_participants')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    // 6. Organization bilgisi
    const organization = exam.organizations as unknown as { name: string } | null;

    return NextResponse.json({
      success: true,
      rows,
      lessons,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      meta: {
        examId: exam.id,
        examName: exam.name,
        examDate: exam.exam_date,
        organizationName: organization?.name || 'Bilinmeyen Kurum',
        participantCount: participantCount || 0,
      },
    });

  } catch (error: unknown) {
    console.error('[RESULTS] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
