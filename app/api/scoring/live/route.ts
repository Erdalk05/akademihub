// ============================================================================
// SCORING ENGINE - LIVE SCORING API (v1.0)
// READ-ONLY Supabase → Adapters → Core → JSON
// Real exam scoring with actual database data
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { buildWizardPayloadFromSupabaseExam } from '@/lib/scoring-engine/adapters/supabase-exam-adapter';
import { adaptWizardPayloadToScoringInput } from '@/lib/scoring-engine/adapters/wizard-adapter';
import { scoreExam } from '@/lib/scoring-engine/core';

export const dynamic = 'force-dynamic';

/**
 * POST /api/scoring/live
 * 
 * Scores a student's exam using real Supabase data
 * 
 * Flow:
 * 1. Read exam data from Supabase (READ-ONLY)
 * 2. Build WizardPayload
 * 3. Adapt to ScoringInput
 * 4. Run scoring engine
 * 5. Return JSON result
 * 
 * Request Body:
 * {
 *   "examId": "uuid-string",
 *   "studentId": "uuid-string"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "result": ScoringResult
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // 1. Parse & Validate Request
    // ========================================
    const body = await request.json();
    const { examId, studentId } = body;

    if (!examId || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: examId, studentId',
        },
        { status: 400 }
      );
    }

    // ========================================
    // 2. Get Supabase Client (READ-ONLY)
    // ========================================
    const supabase = getServiceRoleClient();

    // ========================================
    // 3. Build WizardPayload from Supabase
    // ========================================
    let wizardPayload;
    try {
      wizardPayload = await buildWizardPayloadFromSupabaseExam(
        supabase,
        examId,
        studentId
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Exam not found or answer key missing → 404
      if (message.includes('not found') || message.includes('missing')) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 404 }
        );
      }

      // Other fetch errors
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch exam data: ${message}`,
        },
        { status: 500 }
      );
    }

    // ========================================
    // 4. Adapt to ScoringInput
    // ========================================
    let scoringInput;
    try {
      scoringInput = adaptWizardPayloadToScoringInput(wizardPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Invalid preset name → 400
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 }
      );
    }

    // ========================================
    // 5. Run Scoring Engine
    // ========================================
    const result = scoreExam(scoringInput);

    // ========================================
    // 6. Return JSON Response
    // ========================================
    return NextResponse.json({
      success: true,
      examId,
      studentId,
      result,
    });

  } catch (error) {
    // Unexpected error → 500
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
