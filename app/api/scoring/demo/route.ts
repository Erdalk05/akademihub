// ============================================================================
// SCORING ENGINE - DEMO API ENDPOINT (v1.0)
// HTTP endpoint for scoring engine (JSON in / JSON out)
// No UI, No Supabase, No FAZ 1 modifications
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { adaptWizardPayloadToScoringInput } from '@/lib/scoring-engine/adapters/wizard-adapter';
import { scoreExam } from '@/lib/scoring-engine/core';

export const dynamic = 'force-dynamic';

/**
 * POST /api/scoring/demo
 * 
 * Scores an exam using the scoring engine
 * 
 * Request Body (WizardPayload):
 * {
 *   "presetName": "LGS" | "TYT" | "AYT_SAY" | ...,
 *   "bookletType": "A" | "B" | "C" | "D",
 *   "answerKey": [
 *     { "questionNo": 1, "correctOption": "A", "lessonCode": "MAT" }
 *   ],
 *   "studentAnswers": [
 *     { "questionNo": 1, "markedOption": "B" }
 *   ],
 *   "cancelledQuestions": [
 *     { "questionNo": 5, "policy": "exclude_from_total" }
 *   ],
 *   "studentId": "optional-student-id"
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
    // Parse request body
    const payload = await request.json();

    // Validate basic shape
    if (!payload.presetName || !payload.bookletType || !payload.answerKey || !payload.studentAnswers) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: presetName, bookletType, answerKey, studentAnswers',
        },
        { status: 400 }
      );
    }

    // Adapt payload to ScoringInput
    let scoringInput;
    try {
      scoringInput = adaptWizardPayloadToScoringInput(payload);
    } catch (error) {
      // Invalid preset name or adaptation error
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid payload format',
        },
        { status: 400 }
      );
    }

    // Run scoring engine
    const result = scoreExam(scoringInput);

    // Return result
    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    // Unexpected error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
