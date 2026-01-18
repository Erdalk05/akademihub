// ============================================================================
// SCORING ENGINE - OPTICAL ADAPTER (v1.0)
// Converts optical raw output to StudentAnswer format
// Pure TypeScript, no scoring logic, no Supabase, no HTTP
// ============================================================================

import type { StudentAnswer, BookletType } from '@/types/scoring-engine.types';

/**
 * Optical JSON payload structure (mock optical output)
 */
interface OpticalJsonPayload {
  bookletType: 'A' | 'B' | 'C' | 'D';
  answers: Array<{
    questionNo: number;
    markedOption: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    confidence?: number; // 0-1 (not used in scoring, just transported)
  }>;
}

/**
 * Parsed optical result
 */
interface ParsedOpticalResult {
  bookletType: BookletType;
  studentAnswers: StudentAnswer[];
}

/**
 * Parses optical JSON output to StudentAnswer format
 * 
 * Validation:
 * - questionNo must be positive (ignore if invalid)
 * - duplicate questionNo: last one wins
 * - markedOption outside A-E: converted to null
 * - confidence is ignored (passed through but not used)
 * 
 * @param payload - Optical JSON payload
 * @returns Booklet type and student answers
 */
export function parseOpticalJson(payload: OpticalJsonPayload): ParsedOpticalResult {
  const bookletType = payload.bookletType || 'A';
  
  // Use Map to handle duplicates (last one wins)
  const answerMap = new Map<number, StudentAnswer>();

  for (const item of payload.answers) {
    const questionNo = item.questionNo;

    // Validate questionNo (must be positive)
    if (!questionNo || questionNo <= 0) {
      continue; // Ignore invalid question numbers
    }

    // Normalize markedOption
    const markedOption = normalizeMarkedOption(item.markedOption);

    // Store in map (overwrites if duplicate)
    answerMap.set(questionNo, {
      questionNumber: questionNo,
      markedAnswer: markedOption,
      bookletType,
    });
  }

  // Convert map to array, sorted by questionNo
  const studentAnswers = Array.from(answerMap.values()).sort(
    (a, b) => a.questionNumber - b.questionNumber
  );

  return {
    bookletType,
    studentAnswers,
  };
}

/**
 * Parses optical text/DAT format to StudentAnswer format
 * 
 * Text format:
 * Q1=A
 * Q2=C
 * Q3=*
 * Q4=B
 * 
 * Rules:
 * - Each line: Q{number}={option}
 * - * means empty (null)
 * - Booklet type extracted from header (if present) or defaults to A
 * - Lines without Q{n}= are ignored
 * - duplicate questionNo: last one wins
 * 
 * @param rawText - Raw optical text output
 * @returns Booklet type and student answers
 */
export function parseOpticalText(rawText: string): ParsedOpticalResult {
  let bookletType: BookletType = 'A'; // Default
  const answerMap = new Map<number, StudentAnswer>();

  // Split by lines
  const lines = rawText.split('\n').map(line => line.trim());

  for (const line of lines) {
    if (!line) continue; // Skip empty lines

    // Check for booklet header (e.g., "BOOKLET=B" or "KITAPCIK=C")
    if (line.toUpperCase().includes('BOOKLET=') || line.toUpperCase().includes('KITAPCIK=')) {
      const match = line.match(/[=:]([ABCD])/i);
      if (match && match[1]) {
        bookletType = match[1].toUpperCase() as BookletType;
      }
      continue;
    }

    // Parse answer line: Q{number}={option}
    const answerMatch = line.match(/Q(\d+)\s*[=:]\s*([A-E*]|\*|null)?/i);
    if (!answerMatch) continue; // Not a valid answer line

    const questionNo = parseInt(answerMatch[1], 10);
    const rawOption = answerMatch[2];

    // Validate questionNo
    if (!questionNo || questionNo <= 0) continue;

    // Normalize option
    let markedOption: 'A' | 'B' | 'C' | 'D' | 'E' | null = null;
    if (rawOption && rawOption !== '*' && rawOption.toLowerCase() !== 'null') {
      markedOption = normalizeMarkedOption(rawOption);
    }

    // Store (overwrites duplicate)
    answerMap.set(questionNo, {
      questionNumber: questionNo,
      markedAnswer: markedOption,
      bookletType,
    });
  }

  // Convert to sorted array
  const studentAnswers = Array.from(answerMap.values()).sort(
    (a, b) => a.questionNumber - b.questionNumber
  );

  return {
    bookletType,
    studentAnswers,
  };
}

/**
 * Normalizes marked option to valid AnswerOption type
 * 
 * @param option - Raw option (string, null, undefined)
 * @returns Normalized answer option (A-E or null)
 */
function normalizeMarkedOption(
  option: string | null | undefined
): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  if (!option || option === '*' || option.toLowerCase() === 'null') {
    return null;
  }

  const normalized = option.toUpperCase().trim();

  if (['A', 'B', 'C', 'D', 'E'].includes(normalized)) {
    return normalized as 'A' | 'B' | 'C' | 'D' | 'E';
  }

  // Invalid option → null
  return null;
}
