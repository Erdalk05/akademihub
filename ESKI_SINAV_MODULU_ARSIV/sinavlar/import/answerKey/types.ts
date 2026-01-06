/**
 * ============================================
 * AkademiHub - Cevap Anahtarı Tipleri
 * ============================================
 */

import { SubjectCode, BookletType, ExamTypeConfig } from '../templates/examTypes';

// Tek bir soru cevabı
export interface QuestionAnswer {
  questionNumber: number;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | 'X'; // X = iptal
  subjectCode?: SubjectCode;
}

// Cevap anahtarı
export interface AnswerKey {
  id: string;
  examId: string;
  examType: string;
  bookletType: BookletType;
  totalQuestions: number;
  answers: QuestionAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

// Kitapçık rotasyonu
export interface BookletRotation {
  fromBooklet: BookletType;
  toBooklet: BookletType;
  questionMapping: Record<number, number>; // fromQuestion -> toQuestion
}

// Öğrenci cevap analizi
export interface StudentAnswerAnalysis {
  studentId: string;
  studentName: string;
  bookletType: BookletType;
  answers: string; // Raw answer string
  results: {
    correct: number;
    wrong: number;
    blank: number;
    net: number;
  };
  subjectResults: Record<SubjectCode, {
    correct: number;
    wrong: number;
    blank: number;
    net: number;
    total: number;
  }>;
}

// Net hesaplama sonucu
export interface NetCalculationResult {
  totalNet: number;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  percentage: number;
  subjectNets: Record<SubjectCode, number>;
  rank?: number;
  classAverage?: number;
}

// Cevap anahtarı input modu
export type AnswerKeyInputMode = 'manual' | 'excel' | 'text';

// Cevap anahtarı state
export interface AnswerKeyState {
  mode: AnswerKeyInputMode;
  examType: ExamTypeConfig | null;
  bookletType: BookletType;
  answers: QuestionAnswer[];
  isValid: boolean;
  errors: string[];
}

