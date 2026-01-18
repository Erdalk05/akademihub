// ============================================================================
// SCORING ENGINE - BOOKLET ROTATION LOGIC (v1.0)
// Pure TypeScript functions for converting booklet answers to master key
// Framework-agnostic, database-agnostic
// ============================================================================

import type { AnswerOption, BookletType } from '@/types/scoring-engine.types';

/**
 * Kitapçık rotasyon haritası (varsayılan)
 * A kitapçığı master olarak kabul edilir
 * Her kitapçık için cevap şıkları nasıl döner
 */
const DEFAULT_ROTATION_MAP: Record<BookletType, Record<AnswerOption, AnswerOption>> = {
  A: {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
    null: null,
  },
  B: {
    A: 'B',
    B: 'C',
    C: 'D',
    D: 'E',
    E: 'A',
    null: null,
  },
  C: {
    A: 'C',
    B: 'D',
    C: 'E',
    D: 'A',
    E: 'B',
    null: null,
  },
  D: {
    A: 'D',
    B: 'E',
    C: 'A',
    D: 'B',
    E: 'C',
    null: null,
  },
};

/**
 * Ters rotasyon haritası (master'dan kitapçığa)
 * Master cevap anahtarından belirli bir kitapçığa çeviri yapar
 */
const REVERSE_ROTATION_MAP: Record<BookletType, Record<AnswerOption, AnswerOption>> = {
  A: {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
    null: null,
  },
  B: {
    A: 'E',
    B: 'A',
    C: 'B',
    D: 'C',
    E: 'D',
    null: null,
  },
  C: {
    A: 'D',
    B: 'E',
    C: 'A',
    D: 'B',
    E: 'C',
    null: null,
  },
  D: {
    A: 'C',
    B: 'D',
    C: 'E',
    D: 'A',
    E: 'B',
    null: null,
  },
};

/**
 * Öğrenci cevabını master kitapçık (A) cevabına çevirir
 * 
 * Örnek:
 * - Öğrenci B kitapçığında "C" işaretlemiş
 * - Master cevap anahtarına göre bu "D" demektir
 * 
 * @param studentAnswer - Öğrencinin işaretlediği cevap
 * @param bookletType - Öğrencinin kitapçık tipi
 * @returns Master (A) kitapçığına göre eşdeğer cevap
 */
export function convertToMasterAnswer(
  studentAnswer: AnswerOption,
  bookletType: BookletType
): AnswerOption {
  if (studentAnswer === null) return null;
  
  const rotationMap = DEFAULT_ROTATION_MAP[bookletType];
  return rotationMap[studentAnswer] ?? null;
}

/**
 * Master cevap anahtarını belirli bir kitapçığa çevirir
 * 
 * Örnek:
 * - Master (A) cevabı "D"
 * - B kitapçığı için bu "C" olur
 * 
 * @param masterAnswer - Master kitapçıktaki doğru cevap
 * @param targetBooklet - Hedef kitapçık tipi
 * @returns Hedef kitapçık için eşdeğer cevap
 */
export function convertFromMasterAnswer(
  masterAnswer: AnswerOption,
  targetBooklet: BookletType
): AnswerOption {
  if (masterAnswer === null) return null;
  
  const reverseMap = REVERSE_ROTATION_MAP[targetBooklet];
  return reverseMap[masterAnswer] ?? null;
}

/**
 * Belirli bir kitapçık için tam cevap anahtarı oluşturur
 * 
 * @param masterAnswers - Master (A) kitapçığı cevap anahtarı
 * @param targetBooklet - Hedef kitapçık tipi
 * @returns Hedef kitapçık için cevap anahtarı array
 */
export function generateBookletAnswerKey(
  masterAnswers: AnswerOption[],
  targetBooklet: BookletType
): AnswerOption[] {
  return masterAnswers.map(answer => convertFromMasterAnswer(answer, targetBooklet));
}

/**
 * Kitapçık rotasyonunu doğrular (A→B→C→D→E→A döngüsü)
 * 
 * @param bookletType - Kontrol edilecek kitapçık
 * @returns Kitapçık tipi geçerli mi?
 */
export function isValidBookletType(bookletType: string): bookletType is BookletType {
  return ['A', 'B', 'C', 'D'].includes(bookletType);
}

/**
 * İki cevabın farklı kitapçıklarda eşdeğer olup olmadığını kontrol eder
 * 
 * Örnek:
 * - A kitapçığında "B" ile B kitapçığında "C" eşdeğerdir (her ikisi de master'da "B")
 * 
 * @param answer1 - Birinci cevap
 * @param booklet1 - Birinci kitapçık
 * @param answer2 - İkinci cevap
 * @param booklet2 - İkinci kitapçık
 * @returns İki cevap eşdeğer mi?
 */
export function areAnswersEquivalent(
  answer1: AnswerOption,
  booklet1: BookletType,
  answer2: AnswerOption,
  booklet2: BookletType
): boolean {
  const master1 = convertToMasterAnswer(answer1, booklet1);
  const master2 = convertToMasterAnswer(answer2, booklet2);
  return master1 === master2;
}

/**
 * Rotasyon haritasını dışa aktarır (debug/test için)
 */
export function getRotationMap(bookletType: BookletType): Record<AnswerOption, AnswerOption> {
  return { ...DEFAULT_ROTATION_MAP[bookletType] };
}

/**
 * Ters rotasyon haritasını dışa aktarır (debug/test için)
 */
export function getReverseRotationMap(bookletType: BookletType): Record<AnswerOption, AnswerOption> {
  return { ...REVERSE_ROTATION_MAP[bookletType] };
}
