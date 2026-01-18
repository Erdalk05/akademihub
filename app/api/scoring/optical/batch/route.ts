// ============================================================================
// SCORING ENGINE - BATCH OPTICAL SCORING + ERROR REPORT (v1.0)
// Processes multiple optical outputs with confidence/error reporting
// READ-ONLY Supabase, no scoring logic changes, no UI
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { buildWizardPayloadFromOpticalAndSupabase } from '@/lib/scoring-engine/adapters/optical-supabase-adapter';
import { adaptWizardPayloadToScoringInput } from '@/lib/scoring-engine/adapters/wizard-adapter';
import { scoreExam } from '@/lib/scoring-engine/core';
import type { ScoringResult } from '@/types/scoring-engine.types';

export const dynamic = 'force-dynamic';

/**
 * Error/confidence report for a single student
 */
interface StudentIssueReport {
  studentId: string;
  lowConfidenceAnswers: number[];   // confidence < 0.6
  invalidAnswers: number[];         // ignored / malformed
  emptyButKeyFilled: number[];      // blank but answer key exists
}

/**
 * Single student result with score + issues
 */
interface StudentResult {
  studentId: string;
  score: ScoringResult | null;
  issues: StudentIssueReport;
  error?: string;
}

/**
 * POST /api/scoring/optical/batch
 * 
 * Batch scoring for multiple students with optical data
 * 
 * Flow (per student):
 * 1. Parse optical payload
 * 2. Merge with Supabase exam data
 * 3. Adapt to ScoringInput
 * 4. Run scoring engine
 * 5. Generate error/confidence report
 * 
 * Request Body:
 * {
 *   "examId": "uuid",
 *   "students": [
 *     {
 *       "studentId": "uuid",
 *       "optical": {
 *         "type": "json" | "text",
 *         "payload": { ... } | "Q1=A\nQ2=*"
 *       }
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "examId": "...",
 *   "results": [
 *     {
 *       "studentId": "...",
 *       "score": ScoringResult,
 *       "issues": StudentIssueReport
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // 1. Parse & Validate Request
    // ========================================
    const body = await request.json();
    const { examId, students } = body;

    if (!examId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: examId',
        },
        { status: 400 }
      );
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or empty students array',
        },
        { status: 400 }
      );
    }

    // ========================================
    // 2. Get Supabase Client (READ-ONLY)
    // ========================================
    const supabase = getServiceRoleClient();

    // Verify exam exists (early check)
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Exam not found',
        },
        { status: 404 }
      );
    }

    // ========================================
    // 3. Process Each Student
    // ========================================
    const results: StudentResult[] = [];

    for (const student of students) {
      const { studentId, optical } = student;

      if (!studentId || !optical) {
        // Skip invalid entries but don't fail entire batch
        results.push({
          studentId: studentId || 'unknown',
          score: null,
          issues: {
            studentId: studentId || 'unknown',
            lowConfidenceAnswers: [],
            invalidAnswers: [],
            emptyButKeyFilled: [],
          },
          error: 'Missing studentId or optical data',
        });
        continue;
      }

      try {
        // ========================================
        // 3.1. Build WizardPayload
        // ========================================
        const wizardPayload = await buildWizardPayloadFromOpticalAndSupabase(
          supabase,
          examId,
          studentId,
          optical
        );

        // ========================================
        // 3.2. Generate Issues Report (BEFORE scoring)
        // ========================================
        const issues = generateIssuesReport(
          studentId,
          optical.payload,
          optical.type,
          wizardPayload.answerKey
        );

        // ========================================
        // 3.3. Adapt to ScoringInput
        // ========================================
        const scoringInput = adaptWizardPayloadToScoringInput(wizardPayload);

        // ========================================
        // 3.4. Run Scoring Engine
        // ========================================
        const score = scoreExam(scoringInput);

        // Add to results
        results.push({
          studentId,
          score,
          issues,
        });

      } catch (error) {
        // Student-level error: log but continue with other students
        const message = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          studentId,
          score: null,
          issues: {
            studentId,
            lowConfidenceAnswers: [],
            invalidAnswers: [],
            emptyButKeyFilled: [],
          },
          error: message,
        });
      }
    }

    // ========================================
    // 4. Return Batch Results
    // ========================================
    return NextResponse.json({
      success: true,
      examId,
      totalStudents: students.length,
      successfulScores: results.filter(r => r.score !== null).length,
      results,
    });

  } catch (error) {
    // Global error → 500
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

/**
 * Generates error/confidence report for a single student
 * 
 * Checks:
 * - Low confidence answers (< 0.6)
 * - Invalid/malformed answers
 * - Empty answers when answer key has value
 * 
 * @param studentId - Student UUID
 * @param opticalPayload - Raw optical payload
 * @param opticalType - "json" or "text"
 * @param answerKey - Exam answer key
 * @returns Issue report
 */
function generateIssuesReport(
  studentId: string,
  opticalPayload: any,
  opticalType: 'json' | 'text',
  answerKey: Array<{ questionNo: number; correctOption: string }>
): StudentIssueReport {
  const lowConfidenceAnswers: number[] = [];
  const invalidAnswers: number[] = [];
  const emptyButKeyFilled: number[] = [];

  // Build answer key map
  const answerKeyMap = new Map(
    answerKey.map(item => [item.questionNo, item.correctOption])
  );

  // Parse optical payload based on type
  if (opticalType === 'json' && opticalPayload.answers) {
    for (const answer of opticalPayload.answers) {
      const { questionNo, markedOption, confidence } = answer;

      // Check confidence (if provided)
      if (confidence !== undefined && confidence < 0.6) {
        lowConfidenceAnswers.push(questionNo);
      }

      // Check if marked option is invalid
      if (markedOption && !['A', 'B', 'C', 'D', 'E'].includes(markedOption)) {
        invalidAnswers.push(questionNo);
      }

      // Check if empty but answer key exists
      if (
        (markedOption === null || markedOption === undefined) &&
        answerKeyMap.has(questionNo)
      ) {
        emptyButKeyFilled.push(questionNo);
      }
    }
  } else if (opticalType === 'text' && typeof opticalPayload === 'string') {
    // Parse text format
    const lines = opticalPayload.split('\n');
    for (const line of lines) {
      const match = line.match(/Q(\d+)\s*[=:]\s*([A-E*]|\*)?/i);
      if (match) {
        const questionNo = parseInt(match[1], 10);
        const markedOption = match[2];

        // Check if empty
        if (
          (!markedOption || markedOption === '*') &&
          answerKeyMap.has(questionNo)
        ) {
          emptyButKeyFilled.push(questionNo);
        }

        // Check if invalid (not A-E or *)
        if (
          markedOption &&
          markedOption !== '*' &&
          !['A', 'B', 'C', 'D', 'E'].includes(markedOption.toUpperCase())
        ) {
          invalidAnswers.push(questionNo);
        }
      }
    }
  }

  return {
    studentId,
    lowConfidenceAnswers,
    invalidAnswers,
    emptyButKeyFilled,
  };
}
