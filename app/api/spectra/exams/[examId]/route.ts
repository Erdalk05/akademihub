// ============================================================================
// SPECTRA - EXAM DETAIL API (GET, PATCH, DELETE)
// Route: /api/spectra/exams/[examId]
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { updateExamSchema, validateRequest } from '@/lib/spectra/validators';
import { validateExamReadiness } from '@/lib/spectra/examReadiness';

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
    // BACKEND GUARD: status='active' veya 'ready' yapılmadan önce DB-backed validation
    // ─────────────────────────────────────────────────────────────────────────
    const targetStatus = validation.data?.status;
    if (targetStatus === 'active' || targetStatus === 'ready') {
      console.log(`[SPECTRA/EXAM] Validating readiness for exam: ${examId}`);
      
      const readiness = await validateExamReadiness(examId);
      
      if (!readiness.ready) {
        console.error(`[SPECTRA/EXAM] ❌ Readiness check failed:`, readiness.blockingErrors);
        return NextResponse.json(
          { 
            success: false, 
            message: readiness.blockingErrors[0] || 'Sınav aktif edilemiyor',
            blockingErrors: readiness.blockingErrors,
            checks: readiness.checks,
          },
          { status: 422 }
        );
      }

      console.log(`[SPECTRA/EXAM] ✅ Readiness check passed for exam: ${examId}`);
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
