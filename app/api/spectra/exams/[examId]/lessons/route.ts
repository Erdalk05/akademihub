import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { saveLessonsSchema, validateRequest } from '@/lib/spectra/validators';

// ============================================================================
// SPECTRA - EXAM LESSONS API (v2.0)
// GET: Ders listesini getir
// POST: Ders dağılımını kaydet (Step 2)
// ============================================================================

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Sınav derslerini getir
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Önce exam_sections tablosundan dene
    const { data: sections, error: sectionsError } = await supabase
      .from('exam_sections')
      .select('id, code, name, question_count, sort_order')
      .eq('exam_id', examId)
      .order('sort_order');

    if (!sectionsError && sections && sections.length > 0) {
      const totalQuestions = sections.reduce((sum, s) => sum + (s.question_count || 0), 0);

      return NextResponse.json({
        success: true,
        lessons: sections.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          question_count: s.question_count,
          sort_order: s.sort_order,
        })),
        totalQuestions,
      });
    }

    // exam_lessons tablosundan dene (eski format)
    const { data: lessons, error: lessonsError } = await supabase
      .from('exam_lessons')
      .select('id, lesson_code, lesson_name, question_count, sort_order')
      .eq('exam_id', examId)
      .order('sort_order');

    if (!lessonsError && lessons && lessons.length > 0) {
      const totalQuestions = lessons.reduce((sum, l) => sum + (l.question_count || 0), 0);

      return NextResponse.json({
        success: true,
        lessons: lessons.map((l) => ({
          id: l.id,
          code: l.lesson_code,
          name: l.lesson_name,
          question_count: l.question_count,
          sort_order: l.sort_order,
        })),
        totalQuestions,
      });
    }

    // Hiç ders yok
    return NextResponse.json({
      success: true,
      lessons: [],
      totalQuestions: 0,
      message: 'Bu sınav için ders tanımlanmamış',
    });

  } catch (error: unknown) {
    console.error('[LESSONS] GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Ders dağılımını kaydet
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;
    const body = await request.json();

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    const validation = validateRequest(saveLessonsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const { lessons, total_questions } = validation.data!;

    const supabase = getServiceRoleClient();

    // Sınav bilgisini al
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, organization_id')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { success: false, message: 'Sınav bulunamadı' },
        { status: 404 }
      );
    }

    // Mevcut section'ları sil
    await supabase
      .from('exam_sections')
      .delete()
      .eq('exam_id', examId);

    // Yeni section'ları ekle
    const sectionInserts = lessons.map((lesson, index) => ({
      exam_id: examId,
      code: lesson.code,
      name: lesson.name,
      question_count: lesson.question_count,
      sort_order: index,
    }));

    const { data: insertedSections, error: insertError } = await supabase
      .from('exam_sections')
      .insert(sectionInserts)
      .select('id, code, name');

    if (insertError) {
      console.error('[LESSONS] Insert error:', insertError);
      return NextResponse.json(
        { success: false, message: `Kayıt hatası: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Sınav total_questions güncelle
    await supabase
      .from('exams')
      .update({ 
        total_questions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', examId);

    console.log(`[LESSONS] ✅ Saved ${insertedSections?.length || 0} lessons for exam ${examId}`);

    return NextResponse.json({
      success: true,
      lessonCount: insertedSections?.length || 0,
      totalQuestions: total_questions,
    });

  } catch (error: unknown) {
    console.error('[LESSONS] POST Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
