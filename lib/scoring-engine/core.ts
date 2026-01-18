// ============================================================================
// SCORING ENGINE - CORE LOGIC (v1.0)
// Pure TypeScript scoring functions
// Framework-agnostic, database-agnostic, deterministic
// ============================================================================

import type {
  AnswerOption,
  BookletType,
  QuestionAnswer,
  StudentAnswer,
  ScoringPreset,
  ScoringResult,
  LessonBreakdown,
  ScoringInput,
} from '@/types/scoring-engine.types';
import { convertToMasterAnswer } from './booklet-rotation';

/**
 * ANA PUANLAMA MOTORU (Phase 1)
 * 
 * Öğrencinin cevaplarını değerlendirir ve detaylı sonuç döndürür.
 * 
 * İş Akışı:
 * 1. Öğrenci cevaplarını master (A) kitapçığına çevir
 * 2. İptal edilmiş soruları uygula (count_as_correct policy)
 * 3. Doğru/Yanlış/Boş say
 * 4. Net hesapla: correct - (wrong * wrongPenalty)
 * 5. Score hesapla
 * 6. Ders bazlı kırılım üret (varsa)
 * 
 * @param input - Puanlama giriş parametreleri
 * @returns Detaylı puanlama sonucu
 */
export function scoreExam(input: ScoringInput): ScoringResult {
  const { answerKey, studentAnswers, preset, studentId } = input;

  // Öğrencinin kitapçık tipini belirle (ilk cevaptan)
  const bookletType: BookletType = studentAnswers[0]?.bookletType ?? 'A';

  // Öğrenci cevaplarını map'e al (son duplicate geçerli)
  const studentAnswerMap = new Map<number, StudentAnswer>();
  for (const answer of studentAnswers) {
    studentAnswerMap.set(answer.questionNumber, answer);
  }

  // Cevap anahtarını map'e al (hızlı erişim)
  const answerKeyMap = new Map<number, QuestionAnswer>();
  for (const question of answerKey) {
    answerKeyMap.set(question.questionNumber, question);
  }

  // İstatistikler (overall)
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalEmpty = 0;

  // Ders bazlı veriler
  const lessonStats = new Map<string, { correct: number; wrong: number; empty: number; total: number }>();

  // Her soru için değerlendirme
  for (const question of answerKey) {
    const { questionNumber, correctAnswer, lessonCode, isCancelled } = question;

    // İptal edilmiş soru: varsayılan "exclude_from_total" (skip)
    // Not: Policy eklendikinde "count_as_correct" için özel mantık eklenecek
    if (isCancelled) {
      continue; // Total'dan düş, sayma
    }

    // Öğrenci cevabı
    const studentAnswer = studentAnswerMap.get(questionNumber);

    // Öğrenci bu soruya cevap vermemiş (boş)
    if (!studentAnswer || studentAnswer.markedAnswer === null) {
      totalEmpty++;
      
      if (!lessonStats.has(lessonCode)) {
        lessonStats.set(lessonCode, { correct: 0, wrong: 0, empty: 0, total: 0 });
      }
      const lessonStat = lessonStats.get(lessonCode)!;
      lessonStat.empty++;
      lessonStat.total++;
      continue;
    }

    // Öğrenci cevabını master'a çevir
    const normalizedStudentAnswer = convertToMasterAnswer(
      studentAnswer.markedAnswer,
      bookletType
    );

    // Master cevap (bookletAnswers varsa kullan)
    let masterCorrect: AnswerOption = correctAnswer;
    if (question.bookletAnswers && question.bookletAnswers[bookletType]) {
      masterCorrect = convertToMasterAnswer(
        question.bookletAnswers[bookletType],
        bookletType
      );
    }

    // Karşılaştır
    const isCorrect = normalizedStudentAnswer === masterCorrect;

    if (isCorrect) {
      totalCorrect++;
    } else {
      totalWrong++;
    }

    // Ders istatistiği
    if (!lessonStats.has(lessonCode)) {
      lessonStats.set(lessonCode, { correct: 0, wrong: 0, empty: 0, total: 0 });
    }
    const lessonStat = lessonStats.get(lessonCode)!;
    if (isCorrect) {
      lessonStat.correct++;
    } else {
      lessonStat.wrong++;
    }
    lessonStat.total++;
  }

  // Toplam net (yuvarlama YOK, kesin değer)
  const wrongPenalty = 1 / preset.wrongCancelsCorrect;
  const totalNet = totalCorrect - (totalWrong * wrongPenalty);

  // Toplam puan
  const totalScore = (totalCorrect * preset.correctPoints) 
                    + (totalEmpty * preset.emptyPoints) 
                    - (totalWrong * wrongPenalty * preset.correctPoints);

  // Ders bazlı kırılım
  const lessonBreakdowns: LessonBreakdown[] = [];
  for (const [lessonCode, stats] of lessonStats.entries()) {
    const lessonNet = stats.correct - (stats.wrong * wrongPenalty);
    const lessonScore = (stats.correct * preset.correctPoints) 
                      + (stats.empty * preset.emptyPoints) 
                      - (stats.wrong * wrongPenalty * preset.correctPoints);

    lessonBreakdowns.push({
      lessonCode,
      correct: stats.correct,
      wrong: stats.wrong,
      empty: stats.empty,
      net: lessonNet,
      score: lessonScore,
      totalQuestions: stats.total,
    });
  }

  // Alfabetik sırala
  lessonBreakdowns.sort((a, b) => a.lessonCode.localeCompare(b.lessonCode));

  return {
    studentId,
    bookletType,
    totalCorrect,
    totalWrong,
    totalEmpty,
    totalNet,
    totalScore,
    lessonBreakdowns,
    appliedPreset: preset.name,
  };
}
