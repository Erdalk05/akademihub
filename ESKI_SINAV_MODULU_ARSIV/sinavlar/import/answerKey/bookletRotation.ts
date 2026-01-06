/**
 * ============================================
 * AkademiHub - Kitapçık Döndürme Sistemi
 * ============================================
 * 
 * A kitapçığından B, C, D kitapçıklarına
 * soru sırası dönüştürme
 */

import { BookletType, ExamTypeConfig, SubjectConfig } from '../templates/examTypes';
import { QuestionAnswer, BookletRotation } from './types';

/**
 * LGS için standart kitapçık rotasyonu
 * A kitapçığı baz alınır, B kitapçığı ters sıralı
 */
export function createLGSBookletRotation(): BookletRotation {
  const mapping: Record<number, number> = {};
  
  // LGS'de her ders kendi içinde ters döner
  // Türkçe: 1-20 → 20-1
  // Matematik: 21-40 → 40-21
  // vs.
  
  const subjects = [
    { start: 1, end: 20 },   // Türkçe
    { start: 21, end: 40 },  // Matematik
    { start: 41, end: 60 },  // Fen
    { start: 61, end: 70 },  // Sosyal
    { start: 71, end: 80 },  // Din
    { start: 81, end: 90 }   // İngilizce
  ];
  
  for (const subject of subjects) {
    const count = subject.end - subject.start + 1;
    for (let i = 0; i < count; i++) {
      const aQuestion = subject.start + i;
      const bQuestion = subject.end - i;
      mapping[bQuestion] = aQuestion;
    }
  }
  
  return {
    fromBooklet: 'B',
    toBooklet: 'A',
    questionMapping: mapping
  };
}

/**
 * TYT için standart kitapçık rotasyonu
 */
export function createTYTBookletRotation(): BookletRotation {
  const mapping: Record<number, number> = {};
  
  const subjects = [
    { start: 1, end: 40 },    // Türkçe
    { start: 41, end: 60 },   // Sosyal
    { start: 61, end: 100 },  // Matematik
    { start: 101, end: 120 }  // Fen
  ];
  
  for (const subject of subjects) {
    const count = subject.end - subject.start + 1;
    for (let i = 0; i < count; i++) {
      const aQuestion = subject.start + i;
      const bQuestion = subject.end - i;
      mapping[bQuestion] = aQuestion;
    }
  }
  
  return {
    fromBooklet: 'B',
    toBooklet: 'A',
    questionMapping: mapping
  };
}

/**
 * Özel rotasyon oluştur (ders bazlı ters çevirme)
 */
export function createCustomBookletRotation(
  examConfig: ExamTypeConfig,
  fromBooklet: BookletType,
  toBooklet: BookletType
): BookletRotation {
  const mapping: Record<number, number> = {};
  
  for (const subject of examConfig.subjects) {
    const count = subject.endQuestion - subject.startQuestion + 1;
    for (let i = 0; i < count; i++) {
      const fromQuestion = subject.startQuestion + i;
      const toQuestion = subject.endQuestion - i;
      mapping[fromQuestion] = toQuestion;
    }
  }
  
  return {
    fromBooklet,
    toBooklet,
    questionMapping: mapping
  };
}

/**
 * Öğrenci cevaplarını A kitapçığına dönüştür
 */
export function convertToBaseBooklet(
  studentAnswers: string,
  studentBooklet: BookletType,
  rotation: BookletRotation
): string {
  // A kitapçığı zaten base, değiştirme
  if (studentBooklet === 'A') {
    return studentAnswers;
  }
  
  // Cevapları dönüştür
  const convertedAnswers = new Array(studentAnswers.length).fill(' ');
  
  for (let i = 0; i < studentAnswers.length; i++) {
    const originalQuestion = i + 1;
    const mappedQuestion = rotation.questionMapping[originalQuestion] || originalQuestion;
    convertedAnswers[mappedQuestion - 1] = studentAnswers[i];
  }
  
  return convertedAnswers.join('');
}

/**
 * Cevap anahtarını farklı kitapçığa dönüştür
 */
export function convertAnswerKeyToBooklet(
  answerKey: QuestionAnswer[],
  targetBooklet: BookletType,
  rotation: BookletRotation
): QuestionAnswer[] {
  if (targetBooklet === 'A') {
    return answerKey;
  }
  
  const convertedKey: QuestionAnswer[] = [];
  
  for (const answer of answerKey) {
    const mappedQuestion = Object.entries(rotation.questionMapping)
      .find(([_, aQ]) => aQ === answer.questionNumber)?.[0];
    
    convertedKey.push({
      ...answer,
      questionNumber: mappedQuestion ? parseInt(mappedQuestion) : answer.questionNumber
    });
  }
  
  return convertedKey.sort((a, b) => a.questionNumber - b.questionNumber);
}

/**
 * Kitapçık türünü otomatik algıla
 */
export function detectBookletType(answers: string): BookletType | null {
  // Basit algılama - ilk karakter
  const firstChar = answers[0]?.toUpperCase();
  
  if (['A', 'B', 'C', 'D'].includes(firstChar)) {
    // Eğer ilk soru A veya B ise muhtemelen o kitapçık
    // Bu basit bir tahmin, gerçek sistemde daha sofistike olmalı
  }
  
  return null; // Algılanamadı
}

/**
 * Rotasyon bilgisini görsel olarak göster
 */
export function getRotationPreview(rotation: BookletRotation, limit: number = 10): string[] {
  const preview: string[] = [];
  const entries = Object.entries(rotation.questionMapping).slice(0, limit);
  
  for (const [from, to] of entries) {
    preview.push(`${rotation.fromBooklet}${from} → ${rotation.toBooklet}${to}`);
  }
  
  if (Object.keys(rotation.questionMapping).length > limit) {
    preview.push(`... ve ${Object.keys(rotation.questionMapping).length - limit} soru daha`);
  }
  
  return preview;
}

