// ============================================================================
// SPECTRA - EXAM READINESS VALIDATION API
// Route: /api/spectra/exams/[examId]/validate
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateExamReadiness } from '@/lib/spectra/examReadiness';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

/**
 * GET /api/spectra/exams/[examId]/validate
 * 
 * Returns DB-backed readiness validation for exam activation
 * SINGLE SOURCE OF TRUTH - uses only DB state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { success: false, message: 'examId gerekli' },
        { status: 400 }
      );
    }

    const validation = await validateExamReadiness(examId);

    return NextResponse.json({
      success: true,
      ...validation,
    });

  } catch (error: unknown) {
    console.error('[VALIDATION] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
