import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { saveAnswerKeySchema, validateRequest } from '@/lib/spectra/validators';

// ============================================================================
// SPECTRA - EXAM ANSWER KEY API (v2.0)
// GET: Cevap anahtarını getir
// POST: Cevap anahtarını kaydet (Step 3)
// ============================================================================

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Cevap anahtarını getir
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

    // exam_answer_keys tablosundan çek
    const { data: answerKeys, error } = await supabase
      .from('exam_answer_keys')
      .select('question_number, correct_answer, section_code, is_cancelled, booklet_answers')
      .eq('exam_id', examId)
      .order('question_number');

    if (error) {
      console.error('[ANSWER-KEY] Fetch error:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    if (!answerKeys || answerKeys.length === 0) {
      return NextResponse.json({
        success: true,
        exists: false,
        items: [],
        totalQuestions: 0,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      items: answerKeys.map((ak) => ({
        question_number: ak.question_number,
        correct_answer: ak.correct_answer,
        lesson_code: ak.section_code,
        is_cancelled: ak.is_cancelled,
        booklet_answers: ak.booklet_answers,
      })),
      totalQuestions: answerKeys.length,
    });

  } catch (error: unknown) {
    console.error('[ANSWER-KEY] GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Cevap anahtarını kaydet
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

    const validation = validateRequest(saveAnswerKeySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const { items, source } = validation.data!;

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

    // Section ID map'i oluştur
    const { data: sections } = await supabase
      .from('exam_sections')
      .select('id, code')
      .eq('exam_id', examId);

    const sectionIdMap = new Map<string, string>();
    sections?.forEach(s => sectionIdMap.set(s.code, s.id));

    // Mevcut cevap anahtarını sil
    await supabase
      .from('exam_answer_keys')
      .delete()
      .eq('exam_id', examId);

    // Yeni cevap anahtarını ekle
    const answerKeyInserts = items.map((item) => ({
      organization_id: exam.organization_id,
      exam_id: examId,
      question_number: item.question_number,
      correct_answer: item.correct_answer || '',
      section_code: item.lesson_code,
      section_id: sectionIdMap.get(item.lesson_code) || null,
      is_cancelled: item.is_cancelled || false,
      booklet_answers: item.booklet_answers ? JSON.stringify(item.booklet_answers) : null,
    }));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'answer-key/route.ts:148',message:'Answer key INSERT - full payload',data:{insertLength:answerKeyInserts.length,firstInsert:answerKeyInserts[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    const { error: insertError } = await supabase
      .from('exam_answer_keys')
      .insert(answerKeyInserts);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'answer-key/route.ts:157',message:'Answer key INSERT result',data:{success:!insertError,errorCode:insertError?.code,errorMessage:insertError?.message,errorDetails:insertError?.details},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    if (insertError) {
      console.error('[ANSWER-KEY] Insert error:', insertError);
      return NextResponse.json(
        { success: false, message: `Kayıt hatası: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Sınav güncelle
    await supabase
      .from('exams')
      .update({
        total_questions: items.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', examId);

    console.log(`[ANSWER-KEY] ✅ Saved ${items.length} answers for exam ${examId}`);

    return NextResponse.json({
      success: true,
      message: 'Cevap anahtarı kaydedildi',
      totalQuestions: items.length,
      source,
    });

  } catch (error: unknown) {
    console.error('[ANSWER-KEY] POST Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
