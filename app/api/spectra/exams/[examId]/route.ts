// ============================================================================
// SPECTRA - EXAM DETAIL API (GET, PATCH, DELETE)
// Route: /api/spectra/exams/[examId]
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { updateExamSchema, validateRequest } from '@/lib/spectra/validators';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Sınav Detayı
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

    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (error || !exam) {
      return NextResponse.json(
        { success: false, message: 'Sınav bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exam,
    });

  } catch (error: unknown) {
    console.error('[SPECTRA/EXAM] GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH: Sınav Güncelle
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;
    const body = await request.json();

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    const validation = validateRequest(updateExamSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // ─────────────────────────────────────────────────────────────────────────
    // BACKEND GUARD: status='active' veya 'ready' yapılmadan önce doğrulama
    // ─────────────────────────────────────────────────────────────────────────
    const targetStatus = validation.data?.status;
    if (targetStatus === 'active' || targetStatus === 'ready') {
      // 1. Sınav var mı ve organization bağlı mı?
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('id, organization_id, name')
        .eq('id', examId)
        .single();

      if (examError || !exam) {
        return NextResponse.json(
          { success: false, message: 'Sınav bulunamadı' },
          { status: 404 }
        );
      }

      if (!exam.organization_id) {
        return NextResponse.json(
          { success: false, message: 'Sınav bir kuruma bağlı değil' },
          { status: 422 }
        );
      }

      // 2. En az 1 ders (exam_sections) var mı?
      const { count: sectionCount } = await supabase
        .from('exam_sections')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId);

      if (!sectionCount || sectionCount === 0) {
        return NextResponse.json(
          { success: false, message: 'En az 1 ders tanımlanmalı' },
          { status: 422 }
        );
      }

      // 3. Cevap anahtarı var mı?
      const { count: answerKeyCount } = await supabase
        .from('exam_answer_keys')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId);

      if (!answerKeyCount || answerKeyCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Cevap anahtarı tanımlanmalı' },
          { status: 422 }
        );
      }

      // 4. total_questions kontrolü
      const { data: sections } = await supabase
        .from('exam_sections')
        .select('question_count')
        .eq('exam_id', examId);

      const totalQuestions = sections?.reduce((sum, s) => sum + (s.question_count || 0), 0) || 0;
      if (totalQuestions === 0) {
        return NextResponse.json(
          { success: false, message: 'Toplam soru sayısı 0 olamaz' },
          { status: 422 }
        );
      }

      // 5. Cevap anahtarı tam mı?
      if (answerKeyCount < totalQuestions) {
        return NextResponse.json(
          { success: false, message: `Cevap anahtarı eksik: ${answerKeyCount}/${totalQuestions}` },
          { status: 422 }
        );
      }

      console.log(`[SPECTRA/EXAM] ✅ Backend guard passed for exam: ${examId}`);
    }

    const updateData = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    const { data: exam, error } = await supabase
      .from('exams')
      .update(updateData)
      .eq('id', examId)
      .select('id, name, status')
      .single();

    if (error) {
      console.error('[SPECTRA/EXAM] PATCH Error:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    console.log(`[SPECTRA/EXAM] ✅ Updated exam: ${examId} -> status: ${exam.status}`);

    return NextResponse.json({
      success: true,
      exam,
    });

  } catch (error: unknown) {
    console.error('[SPECTRA/EXAM] PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Sınav Sil
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Soft delete (status = archived) veya hard delete
    const { error } = await supabase
      .from('exams')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', examId);

    if (error) {
      console.error('[SPECTRA/EXAM] DELETE Error:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    console.log(`[SPECTRA/EXAM] ✅ Archived exam: ${examId}`);

    return NextResponse.json({
      success: true,
      message: 'Sınav arşivlendi',
    });

  } catch (error: unknown) {
    console.error('[SPECTRA/EXAM] DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
