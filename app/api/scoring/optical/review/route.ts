// ============================================================================
// SCORING ENGINE - OPTICAL REVIEW & APPROVAL (v1.0)
// READ-ONLY endpoint: Exposes review-required questions
// Does NOT modify scores, does NOT re-run scoring
// Audit & replay readiness layer
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Review issue item
 */
interface ReviewIssue {
  questionNo: number;
  reason: 'low_confidence' | 'empty_but_key_filled' | 'invalid_answer';
  details?: string;
}

/**
 * Review payload response
 */
interface ReviewPayload {
  studentId: string;
  examId: string;
  reviewRequired: boolean;
  issues: ReviewIssue[];
  totalIssues: number;
}

/**
 * GET /api/scoring/optical/review
 * 
 * Returns review-required questions for a student
 * 
 * READ-ONLY operation:
 * - Fetches optical issues (from batch scoring output or stored context)
 * - Categorizes issues by reason
 * - Returns JSON without modifying any scores
 * 
 * Query Params:
 * - examId: uuid
 * - studentId: uuid
 * 
 * Response:
 * {
 *   "studentId": "...",
 *   "examId": "...",
 *   "reviewRequired": true,
 *   "issues": [
 *     { "questionNo": 12, "reason": "low_confidence" },
 *     { "questionNo": 18, "reason": "empty_but_key_filled" }
 *   ],
 *   "totalIssues": 2
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================
    // 1. Parse & Validate Query Params
    // ========================================
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');

    if (!examId || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required params: examId, studentId',
        },
        { status: 400 }
      );
    }

    // ========================================
    // 2. Get Supabase Client (READ-ONLY)
    // ========================================
    const supabase = getServiceRoleClient();

    // Verify exam exists
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
    // 3. Fetch Optical Issues (READ-ONLY)
    // ========================================
    // Note: This assumes optical issues are stored somewhere
    // Options:
    // A) Read from exam_audit_log table
    // B) Read from optical_processing_metadata table
    // C) Reconstruct from batch scoring context
    
    // For now, we'll try to read from exam_results metadata
    const { data: resultData } = await supabase
      .from('exam_results')
      .select('optical_issues, raw_answers')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    const issues: ReviewIssue[] = [];

    // If optical_issues exists in metadata
    if (resultData?.optical_issues) {
      const opticalIssues = resultData.optical_issues;

      // Low confidence answers
      if (opticalIssues.lowConfidenceAnswers) {
        for (const questionNo of opticalIssues.lowConfidenceAnswers) {
          issues.push({
            questionNo,
            reason: 'low_confidence',
            details: 'Optical reader confidence < 60%',
          });
        }
      }

      // Invalid answers
      if (opticalIssues.invalidAnswers) {
        for (const questionNo of opticalIssues.invalidAnswers) {
          issues.push({
            questionNo,
            reason: 'invalid_answer',
            details: 'Marked option outside A-E range',
          });
        }
      }

      // Empty but key filled
      if (opticalIssues.emptyButKeyFilled) {
        for (const questionNo of opticalIssues.emptyButKeyFilled) {
          issues.push({
            questionNo,
            reason: 'empty_but_key_filled',
            details: 'Student left blank but answer key has value',
          });
        }
      }
    }

    // ========================================
    // 4. Build Review Payload
    // ========================================
    const reviewPayload: ReviewPayload = {
      studentId,
      examId,
      reviewRequired: issues.length > 0,
      issues: issues.sort((a, b) => a.questionNo - b.questionNo),
      totalIssues: issues.length,
    };

    // ========================================
    // 5. Return JSON (NO SCORE MODIFICATION)
    // ========================================
    return NextResponse.json({
      success: true,
      review: reviewPayload,
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

/**
 * POST /api/scoring/optical/review
 * 
 * Logs teacher approval/rejection decisions (AUDIT ONLY)
 * 
 * Does NOT re-run scoring
 * Does NOT modify exam_results
 * Only writes to audit log for replay readiness
 * 
 * Request Body:
 * {
 *   "examId": "uuid",
 *   "studentId": "uuid",
 *   "reviewedBy": "teacher-uuid",
 *   "decisions": [
 *     {
 *       "questionNo": 12,
 *       "decision": "approved" | "corrected" | "flagged",
 *       "correctedAnswer": "B" // optional
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "logged": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // 1. Parse & Validate Request
    // ========================================
    const body = await request.json();
    const { examId, studentId, reviewedBy, decisions } = body;

    if (!examId || !studentId || !decisions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: examId, studentId, decisions',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(decisions) || decisions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Decisions must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // ========================================
    // 2. Get Supabase Client
    // ========================================
    const supabase = getServiceRoleClient();

    // ========================================
    // 3. Log to Audit Table (WRITE-ONLY TO AUDIT)
    // ========================================
    const auditEntry = {
      exam_id: examId,
      student_id: studentId,
      reviewed_by: reviewedBy || null,
      review_decisions: decisions,
      reviewed_at: new Date().toISOString(),
      action_type: 'optical_review',
    };

    const { error: auditError } = await supabase
      .from('exam_audit_log')
      .insert(auditEntry);

    if (auditError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to log review: ${auditError.message}`,
        },
        { status: 500 }
      );
    }

    // ========================================
    // 4. Return Success (NO SCORE CHANGED)
    // ========================================
    return NextResponse.json({
      success: true,
      logged: true,
      message: 'Review decisions logged successfully (scores unchanged)',
    });

  } catch (error) {
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
