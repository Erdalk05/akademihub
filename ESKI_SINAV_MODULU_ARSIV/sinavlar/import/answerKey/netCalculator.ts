/**
 * ============================================
 * AkademiHub - Net Hesaplama Motoru
 * ============================================
 * 
 * Türkiye sınav sistemine uygun net hesaplama
 * - 4 yanlış = 1 doğru silme
 * - Ders bazlı net
 * - Sınıf ortalaması
 */

import { ExamTypeConfig, SubjectCode, SubjectConfig } from '../templates/examTypes';
import { QuestionAnswer, StudentAnswerAnalysis, NetCalculationResult } from './types';

/**
 * Tek bir öğrencinin netini hesapla
 */
export function calculateStudentNet(
  studentAnswers: string,
  answerKey: QuestionAnswer[],
  examConfig: ExamTypeConfig
): NetCalculationResult {
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalBlank = 0;
  
  const subjectResults: Record<string, { correct: number; wrong: number; blank: number; total: number }> = {};
  
  // Ders bazlı sonuçları başlat
  for (const subject of examConfig.subjects) {
    subjectResults[subject.code] = { correct: 0, wrong: 0, blank: 0, total: subject.questionCount };
  }
  
  // Her soruyu kontrol et
  for (let i = 0; i < answerKey.length; i++) {
    const keyAnswer = answerKey[i];
    const studentAnswer = studentAnswers[i]?.toUpperCase() || '';
    
    // Hangi derse ait?
    const subject = findSubjectForQuestion(i + 1, examConfig);
    const subjectCode = subject?.code || 'UNKNOWN';
    
    // İptal edilen soru
    if (keyAnswer.correctAnswer === 'X') {
      continue;
    }
    
    // Boş cevap
    if (!studentAnswer || studentAnswer === ' ' || studentAnswer === '-') {
      totalBlank++;
      if (subjectResults[subjectCode]) {
        subjectResults[subjectCode].blank++;
      }
      continue;
    }
    
    // Doğru cevap
    if (studentAnswer === keyAnswer.correctAnswer) {
      totalCorrect++;
      if (subjectResults[subjectCode]) {
        subjectResults[subjectCode].correct++;
      }
    } else {
      // Yanlış cevap
      totalWrong++;
      if (subjectResults[subjectCode]) {
        subjectResults[subjectCode].wrong++;
      }
    }
  }
  
  // Net hesapla (4 yanlış = 1 doğru silme)
  const totalNet = totalCorrect - (totalWrong / 4);
  
  // Ders bazlı netler
  const subjectNets: Record<string, number> = {};
  for (const [code, result] of Object.entries(subjectResults)) {
    subjectNets[code] = result.correct - (result.wrong / 4);
  }
  
  // Yüzde hesapla
  const maxPossible = answerKey.filter(a => a.correctAnswer !== 'X').length;
  const percentage = maxPossible > 0 ? (totalNet / maxPossible) * 100 : 0;
  
  return {
    totalNet: Math.round(totalNet * 100) / 100,
    totalCorrect,
    totalWrong,
    totalBlank,
    percentage: Math.round(percentage * 100) / 100,
    subjectNets: subjectNets as Record<SubjectCode, number>
  };
}

/**
 * Soru numarasından dersi bul
 */
function findSubjectForQuestion(questionNumber: number, config: ExamTypeConfig): SubjectConfig | null {
  for (const subject of config.subjects) {
    if (questionNumber >= subject.startQuestion && questionNumber <= subject.endQuestion) {
      return subject;
    }
  }
  return null;
}

/**
 * Tüm sınıfın netlerini hesapla
 */
export function calculateClassNets(
  students: { id: string; name: string; answers: string }[],
  answerKey: QuestionAnswer[],
  examConfig: ExamTypeConfig
): StudentAnswerAnalysis[] {
  return students.map(student => {
    const result = calculateStudentNet(student.answers, answerKey, examConfig);
    
    const subjectResults: Record<string, { correct: number; wrong: number; blank: number; net: number; total: number }> = {};
    
    for (const subject of examConfig.subjects) {
      const subjectNet = result.subjectNets[subject.code] || 0;
      subjectResults[subject.code] = {
        correct: 0, // TODO: Detaylı hesapla
        wrong: 0,
        blank: 0,
        net: subjectNet,
        total: subject.questionCount
      };
    }
    
    return {
      studentId: student.id,
      studentName: student.name,
      bookletType: 'A',
      answers: student.answers,
      results: {
        correct: result.totalCorrect,
        wrong: result.totalWrong,
        blank: result.totalBlank,
        net: result.totalNet
      },
      subjectResults: subjectResults as Record<SubjectCode, { correct: number; wrong: number; blank: number; net: number; total: number }>
    };
  });
}

/**
 * Sınıf istatistikleri
 */
export function calculateClassStats(analyses: StudentAnswerAnalysis[]): {
  average: number;
  highest: { name: string; net: number };
  lowest: { name: string; net: number };
  median: number;
  subjectAverages: Record<string, number>;
} {
  if (analyses.length === 0) {
    return {
      average: 0,
      highest: { name: '', net: 0 },
      lowest: { name: '', net: 0 },
      median: 0,
      subjectAverages: {}
    };
  }
  
  // Sırala
  const sorted = [...analyses].sort((a, b) => b.results.net - a.results.net);
  
  // Ortalama
  const totalNet = analyses.reduce((sum, a) => sum + a.results.net, 0);
  const average = totalNet / analyses.length;
  
  // En yüksek ve en düşük
  const highest = { name: sorted[0].studentName, net: sorted[0].results.net };
  const lowest = { name: sorted[sorted.length - 1].studentName, net: sorted[sorted.length - 1].results.net };
  
  // Medyan
  const midIndex = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[midIndex - 1].results.net + sorted[midIndex].results.net) / 2
    : sorted[midIndex].results.net;
  
  // Ders ortalamaları
  const subjectAverages: Record<string, number> = {};
  const subjectCodes = Object.keys(analyses[0]?.subjectResults || {});
  
  for (const code of subjectCodes) {
    const subjectTotal = analyses.reduce((sum, a) => sum + (a.subjectResults[code as SubjectCode]?.net || 0), 0);
    subjectAverages[code] = Math.round((subjectTotal / analyses.length) * 100) / 100;
  }
  
  return {
    average: Math.round(average * 100) / 100,
    highest,
    lowest,
    median: Math.round(median * 100) / 100,
    subjectAverages
  };
}

/**
 * Cevap stringinden cevap anahtarı oluştur
 */
export function parseAnswerKeyString(answerString: string, examConfig: ExamTypeConfig): QuestionAnswer[] {
  const answers: QuestionAnswer[] = [];
  const cleanedAnswers = answerString.toUpperCase().replace(/[^ABCDEX]/g, '');
  
  for (let i = 0; i < cleanedAnswers.length; i++) {
    const answer = cleanedAnswers[i] as 'A' | 'B' | 'C' | 'D' | 'E' | 'X';
    const subject = findSubjectForQuestion(i + 1, examConfig);
    
    answers.push({
      questionNumber: i + 1,
      correctAnswer: answer,
      subjectCode: subject?.code
    });
  }
  
  return answers;
}

/**
 * Cevap anahtarını doğrula
 */
export function validateAnswerKey(answers: QuestionAnswer[], examConfig: ExamTypeConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Soru sayısı kontrolü
  if (answers.length !== examConfig.totalQuestions) {
    errors.push(`${examConfig.totalQuestions} soru bekleniyor, ${answers.length} soru girildi.`);
  }
  
  // Geçerli cevap kontrolü
  for (const answer of answers) {
    if (!['A', 'B', 'C', 'D', 'E', 'X'].includes(answer.correctAnswer)) {
      errors.push(`Soru ${answer.questionNumber}: Geçersiz cevap "${answer.correctAnswer}"`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

