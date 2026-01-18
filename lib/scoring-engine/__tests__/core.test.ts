// ============================================================================
// SCORING ENGINE - CORE TESTS (v1.0)
// Pure TypeScript tests for scoring logic
// Framework: Vitest (or Jest compatible)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { scoreExam } from '../core';
import { LGS_PRESET, TYT_PRESET } from '../presets';
import type { QuestionAnswer, StudentAnswer, ScoringInput } from '@/types/scoring-engine.types';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Helper: Basit cevap anahtarı oluştur
 */
function createAnswerKey(count: number, lessonCode: string = 'MAT'): QuestionAnswer[] {
  return Array.from({ length: count }, (_, i) => ({
    questionNumber: i + 1,
    correctAnswer: 'A',
    lessonCode,
    isCancelled: false,
  }));
}

/**
 * Helper: Öğrenci cevapları oluştur
 */
function createStudentAnswers(
  answers: Array<{ questionNumber: number; markedAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | null }>,
  bookletType: 'A' | 'B' | 'C' | 'D' = 'A'
): StudentAnswer[] {
  return answers.map(a => ({
    questionNumber: a.questionNumber,
    markedAnswer: a.markedAnswer,
    bookletType,
  }));
}

// ============================================================================
// TEST 1: FULL CORRECT
// ============================================================================

describe('Scoring Engine - Full Correct', () => {
  it('should return net = total when all answers are correct', () => {
    const answerKey = createAnswerKey(10, 'MAT');
    const studentAnswers = createStudentAnswers(
      Array.from({ length: 10 }, (_, i) => ({ questionNumber: i + 1, markedAnswer: 'A' }))
    );

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: LGS_PRESET,
      studentId: 'student-1',
    };

    const result = scoreExam(input);

    expect(result.totalCorrect).toBe(10);
    expect(result.totalWrong).toBe(0);
    expect(result.totalEmpty).toBe(0);
    expect(result.totalNet).toBe(10);
    expect(result.totalScore).toBe(10);
    expect(result.appliedPreset).toBe('LGS');
  });
});

// ============================================================================
// TEST 2: FULL WRONG
// ============================================================================

describe('Scoring Engine - Full Wrong', () => {
  it('should apply penalty correctly for all wrong answers (LGS: 3 wrong = -1)', () => {
    const answerKey = createAnswerKey(12, 'TUR'); // Tüm cevaplar 'A'
    const studentAnswers = createStudentAnswers(
      Array.from({ length: 12 }, (_, i) => ({ questionNumber: i + 1, markedAnswer: 'B' })) // Hepsi yanlış
    );

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: LGS_PRESET, // 3 yanlış = 1 doğru götürür
    };

    const result = scoreExam(input);

    expect(result.totalCorrect).toBe(0);
    expect(result.totalWrong).toBe(12);
    expect(result.totalEmpty).toBe(0);
    // Net: 0 - (12 * 1/3) = 0 - 4 = -4
    expect(result.totalNet).toBe(-4);
    // Score: (0 * 1) + (0 * 0) - (12 * 1/3 * 1) = -4
    expect(result.totalScore).toBe(-4);
  });

  it('should apply penalty correctly for all wrong answers (TYT: 4 wrong = -1)', () => {
    const answerKey = createAnswerKey(20, 'FEN');
    const studentAnswers = createStudentAnswers(
      Array.from({ length: 20 }, (_, i) => ({ questionNumber: i + 1, markedAnswer: 'C' }))
    );

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: TYT_PRESET, // 4 yanlış = 1 doğru götürür
    };

    const result = scoreExam(input);

    expect(result.totalCorrect).toBe(0);
    expect(result.totalWrong).toBe(20);
    expect(result.totalEmpty).toBe(0);
    // Net: 0 - (20 * 1/4) = 0 - 5 = -5
    expect(result.totalNet).toBe(-5);
    expect(result.totalScore).toBe(-5);
  });
});

// ============================================================================
// TEST 3: MIXED ANSWERS
// ============================================================================

describe('Scoring Engine - Mixed Answers', () => {
  it('should calculate net correctly with mixed correct/wrong/empty (LGS)', () => {
    const answerKey = createAnswerKey(15, 'MAT');
    const studentAnswers = createStudentAnswers([
      { questionNumber: 1, markedAnswer: 'A' },  // Doğru
      { questionNumber: 2, markedAnswer: 'A' },  // Doğru
      { questionNumber: 3, markedAnswer: 'A' },  // Doğru
      { questionNumber: 4, markedAnswer: 'A' },  // Doğru
      { questionNumber: 5, markedAnswer: 'A' },  // Doğru
      { questionNumber: 6, markedAnswer: 'B' },  // Yanlış
      { questionNumber: 7, markedAnswer: 'B' },  // Yanlış
      { questionNumber: 8, markedAnswer: 'B' },  // Yanlış
      { questionNumber: 9, markedAnswer: null }, // Boş
      { questionNumber: 10, markedAnswer: null }, // Boş
      // 11-15 boş (cevap verilmemiş)
    ]);

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: LGS_PRESET,
    };

    const result = scoreExam(input);

    expect(result.totalCorrect).toBe(5);
    expect(result.totalWrong).toBe(3);
    expect(result.totalEmpty).toBe(7); // 2 + 5 (cevap verilmeyen)
    // Net: 5 - (3 * 1/3) = 5 - 1 = 4
    expect(result.totalNet).toBe(4);
    // Score: (5 * 1) + (7 * 0) - (3 * 1/3 * 1) = 5 - 1 = 4
    expect(result.totalScore).toBe(4);
  });

  it('should calculate net correctly with mixed answers (TYT)', () => {
    const answerKey = createAnswerKey(20, 'FEN');
    const studentAnswers = createStudentAnswers([
      { questionNumber: 1, markedAnswer: 'A' },  // Doğru
      { questionNumber: 2, markedAnswer: 'A' },  // Doğru
      { questionNumber: 3, markedAnswer: 'A' },  // Doğru
      { questionNumber: 4, markedAnswer: 'A' },  // Doğru
      { questionNumber: 5, markedAnswer: 'A' },  // Doğru
      { questionNumber: 6, markedAnswer: 'A' },  // Doğru
      { questionNumber: 7, markedAnswer: 'A' },  // Doğru
      { questionNumber: 8, markedAnswer: 'A' },  // Doğru
      { questionNumber: 9, markedAnswer: 'B' },  // Yanlış
      { questionNumber: 10, markedAnswer: 'B' }, // Yanlış
      { questionNumber: 11, markedAnswer: 'B' }, // Yanlış
      { questionNumber: 12, markedAnswer: 'B' }, // Yanlış
      // 13-20 boş
    ]);

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: TYT_PRESET, // 4 yanlış = 1 doğru götürür
    };

    const result = scoreExam(input);

    expect(result.totalCorrect).toBe(8);
    expect(result.totalWrong).toBe(4);
    expect(result.totalEmpty).toBe(8);
    // Net: 8 - (4 * 1/4) = 8 - 1 = 7
    expect(result.totalNet).toBe(7);
    expect(result.totalScore).toBe(7);
  });
});

// ============================================================================
// TEST 4: CANCELLED QUESTIONS
// ============================================================================

describe('Scoring Engine - Cancelled Questions', () => {
  it('should exclude cancelled questions from total (default policy)', () => {
    const answerKey: QuestionAnswer[] = [
      { questionNumber: 1, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: false },
      { questionNumber: 2, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: true }, // İPTAL
      { questionNumber: 3, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: false },
      { questionNumber: 4, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: true }, // İPTAL
      { questionNumber: 5, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: false },
    ];

    const studentAnswers = createStudentAnswers([
      { questionNumber: 1, markedAnswer: 'A' }, // Doğru
      { questionNumber: 2, markedAnswer: 'B' }, // İptal (sayılmaz)
      { questionNumber: 3, markedAnswer: 'B' }, // Yanlış
      { questionNumber: 4, markedAnswer: 'A' }, // İptal (sayılmaz)
      { questionNumber: 5, markedAnswer: 'A' }, // Doğru
    ]);

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: LGS_PRESET,
    };

    const result = scoreExam(input);

    // İptal sorular toplam dışında, sadece 1,3,5 sayılır
    expect(result.totalCorrect).toBe(2); // Soru 1, 5
    expect(result.totalWrong).toBe(1);   // Soru 3
    expect(result.totalEmpty).toBe(0);
    // Net: 2 - (1 * 1/3) = 2 - 0.333... ≈ 1.666...
    expect(result.totalNet).toBeCloseTo(1.6666666666666667, 10);
  });
});

// ============================================================================
// TEST 5: DIFFERENT BOOKLETS
// ============================================================================

describe('Scoring Engine - Different Booklets', () => {
  it('should produce same net for different booklets (A vs B)', () => {
    // Master (A) cevap anahtarı: tüm cevaplar 'A'
    const answerKey = createAnswerKey(10, 'MAT');

    // Öğrenci A: A kitapçığında tüm soruları 'A' işaretlemiş (hepsi doğru)
    const studentAAnswers = createStudentAnswers(
      Array.from({ length: 10 }, (_, i) => ({ questionNumber: i + 1, markedAnswer: 'A' })),
      'A'
    );

    // Öğrenci B: B kitapçığında tüm soruları 'E' işaretlemiş
    // B kitapçığında 'E' → Master'da 'A' (rotation: A→B→C→D→E→A, yani E→A)
    const studentBAnswers = createStudentAnswers(
      Array.from({ length: 10 }, (_, i) => ({ questionNumber: i + 1, markedAnswer: 'E' })),
      'B'
    );

    const inputA: ScoringInput = {
      answerKey,
      studentAnswers: studentAAnswers,
      preset: TYT_PRESET,
      studentId: 'student-A',
    };

    const inputB: ScoringInput = {
      answerKey,
      studentAnswers: studentBAnswers,
      preset: TYT_PRESET,
      studentId: 'student-B',
    };

    const resultA = scoreExam(inputA);
    const resultB = scoreExam(inputB);

    // Her ikisi de 10 doğru yapmalı
    expect(resultA.totalCorrect).toBe(10);
    expect(resultB.totalCorrect).toBe(10);
    expect(resultA.totalNet).toBe(resultB.totalNet);
    expect(resultA.totalNet).toBe(10);
    expect(resultB.totalNet).toBe(10);
  });

  it('should produce same net for different booklets (A vs C vs D)', () => {
    const answerKey = createAnswerKey(5, 'FEN');

    // A kitapçığı: A,A,A,A,A (hepsi doğru)
    const studentAAnswers = createStudentAnswers(
      [
        { questionNumber: 1, markedAnswer: 'A' },
        { questionNumber: 2, markedAnswer: 'A' },
        { questionNumber: 3, markedAnswer: 'A' },
        { questionNumber: 4, markedAnswer: 'A' },
        { questionNumber: 5, markedAnswer: 'A' },
      ],
      'A'
    );

    // C kitapçığı: C,C,C,C,C (rotation: C→A, yani master'da A)
    const studentCAnswers = createStudentAnswers(
      [
        { questionNumber: 1, markedAnswer: 'C' },
        { questionNumber: 2, markedAnswer: 'C' },
        { questionNumber: 3, markedAnswer: 'C' },
        { questionNumber: 4, markedAnswer: 'C' },
        { questionNumber: 5, markedAnswer: 'C' },
      ],
      'C'
    );

    // D kitapçığı: D,D,D,D,D (rotation: D→A)
    const studentDAnswers = createStudentAnswers(
      [
        { questionNumber: 1, markedAnswer: 'D' },
        { questionNumber: 2, markedAnswer: 'D' },
        { questionNumber: 3, markedAnswer: 'D' },
        { questionNumber: 4, markedAnswer: 'D' },
        { questionNumber: 5, markedAnswer: 'D' },
      ],
      'D'
    );

    const resultA = scoreExam({ answerKey, studentAnswers: studentAAnswers, preset: LGS_PRESET });
    const resultC = scoreExam({ answerKey, studentAnswers: studentCAnswers, preset: LGS_PRESET });
    const resultD = scoreExam({ answerKey, studentAnswers: studentDAnswers, preset: LGS_PRESET });

    // Hepsi 5 doğru yapmalı
    expect(resultA.totalCorrect).toBe(5);
    expect(resultC.totalCorrect).toBe(5);
    expect(resultD.totalCorrect).toBe(5);

    expect(resultA.totalNet).toBe(5);
    expect(resultC.totalNet).toBe(5);
    expect(resultD.totalNet).toBe(5);
  });
});

// ============================================================================
// TEST 6: LESSON BREAKDOWN
// ============================================================================

describe('Scoring Engine - Lesson Breakdown', () => {
  it('should calculate lesson breakdown correctly', () => {
    const answerKey: QuestionAnswer[] = [
      { questionNumber: 1, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: false },
      { questionNumber: 2, correctAnswer: 'A', lessonCode: 'MAT', isCancelled: false },
      { questionNumber: 3, correctAnswer: 'A', lessonCode: 'FEN', isCancelled: false },
      { questionNumber: 4, correctAnswer: 'A', lessonCode: 'FEN', isCancelled: false },
      { questionNumber: 5, correctAnswer: 'A', lessonCode: 'TUR', isCancelled: false },
    ];

    const studentAnswers = createStudentAnswers([
      { questionNumber: 1, markedAnswer: 'A' }, // MAT: Doğru
      { questionNumber: 2, markedAnswer: 'B' }, // MAT: Yanlış
      { questionNumber: 3, markedAnswer: 'A' }, // FEN: Doğru
      { questionNumber: 4, markedAnswer: 'A' }, // FEN: Doğru
      { questionNumber: 5, markedAnswer: null }, // TUR: Boş
    ]);

    const input: ScoringInput = {
      answerKey,
      studentAnswers,
      preset: LGS_PRESET,
    };

    const result = scoreExam(input);

    expect(result.lessonBreakdowns).toHaveLength(3);

    // MAT: 1D 1Y → Net: 1 - 1/3 = 0.666...
    const matLesson = result.lessonBreakdowns.find(l => l.lessonCode === 'MAT');
    expect(matLesson?.correct).toBe(1);
    expect(matLesson?.wrong).toBe(1);
    expect(matLesson?.empty).toBe(0);
    expect(matLesson?.net).toBeCloseTo(0.6666666666666667, 10);

    // FEN: 2D 0Y → Net: 2
    const fenLesson = result.lessonBreakdowns.find(l => l.lessonCode === 'FEN');
    expect(fenLesson?.correct).toBe(2);
    expect(fenLesson?.wrong).toBe(0);
    expect(fenLesson?.empty).toBe(0);
    expect(fenLesson?.net).toBe(2);

    // TUR: 0D 0Y 1B → Net: 0
    const turLesson = result.lessonBreakdowns.find(l => l.lessonCode === 'TUR');
    expect(turLesson?.correct).toBe(0);
    expect(turLesson?.wrong).toBe(0);
    expect(turLesson?.empty).toBe(1);
    expect(turLesson?.net).toBe(0);
  });
});
