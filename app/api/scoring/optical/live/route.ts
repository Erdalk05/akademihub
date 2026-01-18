// ============================================================================
// SCORING ENGINE - OPTICAL LIVE SCORING API (v1.0)
// HTTP endpoint: Optical output → Supabase → Adapters → Core → JSON
// READ-ONLY Supabase, no UI, no writes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { buildWizardPayloadFromOpticalAndSupabase } from '@/lib/scoring-engine/adapters/optical-supabase-adapter';
import { adaptWizardPayloadToScoringInput } from '@/lib/scoring-engine/adapters/wizard-adapter';
import { scoreExam } from '@/lib/scoring-engine/core';

export const dynamic = 'force-dynamic';

/**
 * POST /api/scoring/optical/live
 * 
 * Scores an exam using optical output + Supabase exam data
 * 
 * Flow:
 * 1. Parse request body
 * 2. Merge optical output with Supabase exam data
 * 3. Adapt to ScoringInput
 * 4. Run scoring engine
 * 5. Return JSON result
 * 
 * Request Body:
 * {
 *   "examId": "uuid-string",
 *   "studentId": "uuid-string",
 *   "optical": {
 *     "type": "json" | "text",
 *     "payload": { ... } | "Q1=A\nQ2=*\n..."
 *   }
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
    const { examId, studentId, optical } = body;

    if (!examId || !studentId || !optical) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: examId, studentId, optical',
        },
        { status: 400 }
      );
    }

    if (!optical.type || !optical.payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid optical format: type and payload required',
        },
        { status: 400 }
      );
    }

    if (optical.type !== 'json' && optical.type !== 'text') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid optical type: must be "json" or "text"',
        },
        { status: 400 }
      );
    }

    // ========================================
    // 2. Get Supabase Client (READ-ONLY)
    // ========================================
    const supabase = getServiceRoleClient();

    // ========================================
    // 3. Build WizardPayload from Optical + Supabase
    // ========================================
    let wizardPayload;
    try {
      wizardPayload = await buildWizardPayloadFromOpticalAndSupabase(
        supabase,
        examId,
        studentId,
        optical
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

      // Other errors
      return NextResponse.json(
        {
          success: false,
          error: `Failed to merge optical and exam data: ${message}`,
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
      opticalType: optical.type,
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
