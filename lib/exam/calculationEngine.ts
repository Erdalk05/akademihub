/**
 * ============================================
 * AkademiHub - Exam Calculation Engine
 * ============================================
 * 
 * Sınav sonuçları için merkezi hesaplama motoru.
 * LGS, TYT, AYT için net ve puan hesaplama.
 * 
 * TASARIM PRENSİPLERİ:
 * 1. Pure functions - yan etkisiz
 * 2. Type-safe - tam tip güvenliği
 * 3. Performant - binlerce öğrenci için optimize
 * 4. Testable - birim test edilebilir
 */

import type {
  AnswerOption,
  NetCalculation,
  SubjectResult,
  TopicResult,
  ExamQuestion,
  ExamStudentAnswer,
  ExamStudentResult,
  ExamType
} from '@/types/exam.types';

// ==================== NET HESAPLAMA ====================

/**
 * Tek bir bölüm için net hesaplar
 * LGS: Net = Doğru - (Yanlış / 3)
 * TYT/AYT: Net = Doğru - (Yanlış / 4)
 */
export function calculateNet(
  correct: number,
  wrong: number,
  empty: number,
  wrongPenaltyDivisor: number = 4
): NetCalculation {
  // Güvenlik kontrolü
  if (correct < 0 || wrong < 0 || empty < 0) {
    throw new Error('Değerler negatif olamaz');
  }
  
  const penalty = wrong / wrongPenaltyDivisor;
  const net = correct - penalty;
  
  return {
    correct,
    wrong,
    empty,
    net: Math.round(net * 100) / 100, // 2 ondalık
    wrongPenaltyDivisor,
    formula: `${correct} - (${wrong} / ${wrongPenaltyDivisor}) = ${net.toFixed(2)}`
  };
}

/**
 * Cevap anahtarına göre doğru/yanlış/boş sayılarını hesaplar
 */
export function evaluateAnswers(
  answers: Array<{ questionNo: number; givenAnswer: AnswerOption }>,
  answerKey: Record<number, AnswerOption>
): { correct: number; wrong: number; empty: number; details: EvaluationDetail[] } {
  let correct = 0;
  let wrong = 0;
  let empty = 0;
  const details: EvaluationDetail[] = [];
  
  // Tüm soruları değerlendir
  const allQuestionNos = Object.keys(answerKey).map(Number);
  
  for (const qNo of allQuestionNos) {
    const studentAnswer = answers.find(a => a.questionNo === qNo);
    const correctAnswer = answerKey[qNo];
    
    const givenAnswer = studentAnswer?.givenAnswer ?? null;
    
    let isCorrect: boolean | null = null;
    let isEmpty = false;
    
    if (!givenAnswer || givenAnswer === null) {
      // Boş bırakılmış
      empty++;
      isEmpty = true;
    } else if (givenAnswer === correctAnswer) {
      // Doğru
      correct++;
      isCorrect = true;
    } else {
      // Yanlış
      wrong++;
      isCorrect = false;
    }
    
    details.push({
      questionNo: qNo,
      givenAnswer,
      correctAnswer,
      isCorrect,
      isEmpty
    });
  }
  
  return { correct, wrong, empty, details };
}

export interface EvaluationDetail {
  questionNo: number;
  givenAnswer: AnswerOption;
  correctAnswer: AnswerOption;
  isCorrect: boolean | null;
  isEmpty: boolean;
}

// ==================== DERS BAZLI HESAPLAMA ====================

export interface SubjectRange {
  code: string;
  name: string;
  startNo: number;
  endNo: number;
  weight?: number;
}

/**
 * Ders bazlı sonuçları hesaplar
 */
export function calculateSubjectResults(
  evaluationDetails: EvaluationDetail[],
  subjectRanges: SubjectRange[],
  wrongPenaltyDivisor: number = 4
): SubjectResult {
  const results: SubjectResult = {};
  
  for (const subject of subjectRanges) {
    // Bu derse ait soruları filtrele
    const subjectDetails = evaluationDetails.filter(
      d => d.questionNo >= subject.startNo && d.questionNo <= subject.endNo
    );
    
    const correct = subjectDetails.filter(d => d.isCorrect === true).length;
    const wrong = subjectDetails.filter(d => d.isCorrect === false).length;
    const empty = subjectDetails.filter(d => d.isEmpty).length;
    
    const netCalc = calculateNet(correct, wrong, empty, wrongPenaltyDivisor);
    
    results[subject.code] = {
      correct,
      wrong,
      empty,
      net: netCalc.net
    };
  }
  
  return results;
}

// ==================== KONU BAZLI HESAPLAMA ====================

export interface QuestionTopicMapping {
  questionNo: number;
  topicId: string;
  topicName?: string;
}

/**
 * Konu bazlı sonuçları hesaplar
 */
export function calculateTopicResults(
  evaluationDetails: EvaluationDetail[],
  questionTopicMapping: QuestionTopicMapping[]
): TopicResult {
  const results: TopicResult = {};
  
  // Konu bazında grupla
  const topicGroups = new Map<string, EvaluationDetail[]>();
  
  for (const detail of evaluationDetails) {
    const mapping = questionTopicMapping.find(m => m.questionNo === detail.questionNo);
    if (!mapping) continue;
    
    if (!topicGroups.has(mapping.topicId)) {
      topicGroups.set(mapping.topicId, []);
    }
    topicGroups.get(mapping.topicId)!.push(detail);
  }
  
  // Her konu için sonuç hesapla
  for (const [topicId, details] of topicGroups) {
    const correct = details.filter(d => d.isCorrect === true).length;
    const wrong = details.filter(d => d.isCorrect === false).length;
    const total = details.length;
    const rate = total > 0 ? correct / total : 0;
    
    // Başarı durumu belirleme
    let status: 'excellent' | 'good' | 'average' | 'weak' | 'critical';
    if (rate >= 0.8) status = 'excellent';
    else if (rate >= 0.6) status = 'good';
    else if (rate >= 0.4) status = 'average';
    else if (rate >= 0.2) status = 'weak';
    else status = 'critical';
    
    results[topicId] = {
      correct,
      wrong,
      total,
      rate: Math.round(rate * 100) / 100,
      status
    };
  }
  
  return results;
}

// ==================== SIRALAMA ====================

export interface RankingInput {
  studentId: string;
  net: number;
  className?: string;
}

export interface RankingResult {
  studentId: string;
  rankInExam: number;
  rankInClass?: number;
  percentile: number;
}

/**
 * Sınav içi sıralamaları hesaplar
 */
export function calculateRankings(students: RankingInput[]): RankingResult[] {
  if (students.length === 0) return [];
  
  // Net'e göre sırala (büyükten küçüğe)
  const sorted = [...students].sort((a, b) => b.net - a.net);
  
  const totalStudents = sorted.length;
  const results: RankingResult[] = [];
  
  // Sınıf bazlı gruplama
  const classGroups = new Map<string, RankingInput[]>();
  for (const student of sorted) {
    if (student.className) {
      if (!classGroups.has(student.className)) {
        classGroups.set(student.className, []);
      }
      classGroups.get(student.className)!.push(student);
    }
  }
  
  // Her öğrenci için sıralama hesapla
  for (let i = 0; i < sorted.length; i++) {
    const student = sorted[i];
    
    // Aynı net'e sahip öğrenciler için aynı sıra
    let rank = i + 1;
    if (i > 0 && sorted[i - 1].net === student.net) {
      // Önceki öğrenciyle aynı sıra
      const prevResult = results.find(r => r.studentId === sorted[i - 1].studentId);
      if (prevResult) rank = prevResult.rankInExam;
    }
    
    // Sınıf içi sıralama
    let rankInClass: number | undefined;
    if (student.className) {
      const classStudents = classGroups.get(student.className)!;
      const classIndex = classStudents.findIndex(s => s.studentId === student.studentId);
      
      // Aynı mantık sınıf için de
      rankInClass = classIndex + 1;
      if (classIndex > 0 && classStudents[classIndex - 1].net === student.net) {
        const prevClassResult = results.find(
          r => r.studentId === classStudents[classIndex - 1].studentId
        );
        if (prevClassResult?.rankInClass) rankInClass = prevClassResult.rankInClass;
      }
    }
    
    // Yüzdelik dilim (100 - (sıra-1) * 100 / toplam)
    const percentile = Math.round((1 - (rank - 1) / totalStudents) * 10000) / 100;
    
    results.push({
      studentId: student.studentId,
      rankInExam: rank,
      rankInClass,
      percentile
    });
  }
  
  return results;
}

// ==================== İSTATİSTİKLER ====================

export interface StatisticsResult {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  stdDeviation: number;
}

/**
 * Standart sapma hesaplar (Pure Function)
 * Population standard deviation kullanır
 * @param values - Sayı dizisi
 * @param mean - Ortalama (opsiyonel, verilmezse hesaplanır)
 * @returns Standart sapma değeri (2 ondalık)
 */
export function calculateStandardDeviation(values: number[], mean?: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return 0;
  
  const avg = mean ?? values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.round(stdDev * 100) / 100;
}

/**
 * Yüzdelik dilim hesaplar (Pure Function)
 * Verilen değerin dizideki yüzdelik konumunu bulur
 * @param value - Yüzdeliği hesaplanacak değer
 * @param allValues - Tüm değerler dizisi
 * @returns 0-100 arası yüzdelik dilim
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  if (allValues.length === 1) return 100;
  
  const sorted = [...allValues].sort((a, b) => a - b);
  
  // Değerden küçük olanları say
  const belowCount = sorted.filter(v => v < value).length;
  const equalCount = sorted.filter(v => v === value).length;
  
  // Yüzdelik dilim formülü: (L + 0.5 * S) / N * 100
  // L = daha düşük değer sayısı, S = eşit değer sayısı, N = toplam
  const percentile = ((belowCount + 0.5 * equalCount) / sorted.length) * 100;
  
  return Math.round(percentile * 100) / 100;
}

/**
 * Belirli bir yüzdelik dilime karşılık gelen değeri bulur (Pure Function)
 * @param percentile - Yüzdelik dilim (0-100)
 * @param values - Değerler dizisi
 * @returns O yüzdeliğe karşılık gelen değer
 */
export function getValueAtPercentile(percentile: number, values: number[]): number {
  if (values.length === 0) return 0;
  if (percentile <= 0) return Math.min(...values);
  if (percentile >= 100) return Math.max(...values);
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  // Interpolasyon
  const fraction = index - lower;
  return Math.round((sorted[lower] + fraction * (sorted[upper] - sorted[lower])) * 100) / 100;
}

/**
 * Temel istatistikleri hesaplar
 */
export function calculateStatistics(values: number[]): StatisticsResult {
  if (values.length === 0) {
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      median: 0,
      stdDeviation: 0
    };
  }
  
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / count;
  
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  // Medyan
  let median: number;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }
  
  // Standart sapma (pure function kullan)
  const stdDeviation = calculateStandardDeviation(values, avg);
  
  return {
    count,
    sum: Math.round(sum * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDeviation
  };
}

// ==================== ZORLUK ANALİZİ ====================

/**
 * Soru zorluğunu doğruluk oranına göre hesaplar
 */
export function calculateDifficultyIndex(
  correctCount: number,
  totalAnswers: number
): { index: number; level: 'easy' | 'medium' | 'hard' } {
  if (totalAnswers === 0) {
    return { index: 0.5, level: 'medium' };
  }
  
  const index = correctCount / totalAnswers;
  
  // Zorluk seviyesi (düşük index = zor soru)
  let level: 'easy' | 'medium' | 'hard';
  if (index >= 0.7) level = 'easy';
  else if (index >= 0.3) level = 'medium';
  else level = 'hard';
  
  return {
    index: Math.round(index * 1000) / 1000,
    level
  };
}

/**
 * Ayırt edicilik indeksi hesaplar
 * Üst %27 ile alt %27 farkı
 */
export function calculateDiscriminationIndex(
  studentResults: Array<{ studentId: string; totalNet: number; questionCorrect: boolean }>
): number {
  if (studentResults.length < 4) return 0;
  
  // Net'e göre sırala
  const sorted = [...studentResults].sort((a, b) => b.totalNet - a.totalNet);
  
  // Üst ve alt %27
  const n27 = Math.max(1, Math.floor(sorted.length * 0.27));
  
  const topGroup = sorted.slice(0, n27);
  const bottomGroup = sorted.slice(-n27);
  
  const topCorrectRate = topGroup.filter(s => s.questionCorrect).length / topGroup.length;
  const bottomCorrectRate = bottomGroup.filter(s => s.questionCorrect).length / bottomGroup.length;
  
  // Ayırt edicilik = üst grup doğruluk - alt grup doğruluk
  const discrimination = topCorrectRate - bottomCorrectRate;
  
  return Math.round(discrimination * 1000) / 1000;
}

// ==================== TOPLU HESAPLAMA ====================

export interface FullCalculationInput {
  examId: string;
  examType: ExamType;
  answerKey: Record<number, AnswerOption>;
  subjectRanges: SubjectRange[];
  questionTopicMapping: QuestionTopicMapping[];
  studentAnswers: Array<{
    studentId: string;
    className?: string;
    answers: Array<{ questionNo: number; givenAnswer: AnswerOption }>;
  }>;
}

export interface FullCalculationResult {
  studentResults: Array<{
    studentId: string;
    correct: number;
    wrong: number;
    empty: number;
    net: number;
    subjectResults: SubjectResult;
    topicResults: TopicResult;
    rankInExam: number;
    rankInClass?: number;
    percentile: number;
    evaluationDetails: EvaluationDetail[];
  }>;
  examStats: StatisticsResult;
  classStats: Record<string, StatisticsResult>;
}

/**
 * Tüm öğrenciler için tam hesaplama yapar
 * Bu fonksiyon binlerce öğrenci için optimize edilmiştir
 */
export function calculateFullExamResults(input: FullCalculationInput): FullCalculationResult {
  const wrongPenaltyDivisor = input.examType.wrongPenaltyDivisor;
  
  // 1. Her öğrenci için temel hesaplamalar
  const studentCalcs = input.studentAnswers.map(student => {
    const evaluation = evaluateAnswers(student.answers, input.answerKey);
    const netCalc = calculateNet(
      evaluation.correct,
      evaluation.wrong,
      evaluation.empty,
      wrongPenaltyDivisor
    );
    
    const subjectResults = calculateSubjectResults(
      evaluation.details,
      input.subjectRanges,
      wrongPenaltyDivisor
    );
    
    const topicResults = calculateTopicResults(
      evaluation.details,
      input.questionTopicMapping
    );
    
    return {
      studentId: student.studentId,
      className: student.className,
      correct: evaluation.correct,
      wrong: evaluation.wrong,
      empty: evaluation.empty,
      net: netCalc.net,
      subjectResults,
      topicResults,
      evaluationDetails: evaluation.details
    };
  });
  
  // 2. Sıralamaları hesapla
  const rankingInputs: RankingInput[] = studentCalcs.map(s => ({
    studentId: s.studentId,
    net: s.net,
    className: s.className
  }));
  
  const rankings = calculateRankings(rankingInputs);
  
  // 3. Sonuçları birleştir
  const studentResults = studentCalcs.map(calc => {
    const ranking = rankings.find(r => r.studentId === calc.studentId)!;
    return {
      ...calc,
      rankInExam: ranking.rankInExam,
      rankInClass: ranking.rankInClass,
      percentile: ranking.percentile
    };
  });
  
  // 4. Sınav istatistikleri
  const allNets = studentCalcs.map(s => s.net);
  const examStats = calculateStatistics(allNets);
  
  // 5. Sınıf bazlı istatistikler
  const classStats: Record<string, StatisticsResult> = {};
  const classGroups = new Map<string, number[]>();
  
  for (const calc of studentCalcs) {
    if (calc.className) {
      if (!classGroups.has(calc.className)) {
        classGroups.set(calc.className, []);
      }
      classGroups.get(calc.className)!.push(calc.net);
    }
  }
  
  for (const [className, nets] of classGroups) {
    classStats[className] = calculateStatistics(nets);
  }
  
  return {
    studentResults,
    examStats,
    classStats
  };
}

// ==================== EXPORT ====================

export default {
  calculateNet,
  evaluateAnswers,
  calculateSubjectResults,
  calculateTopicResults,
  calculateRankings,
  calculateStatistics,
  calculateStandardDeviation,
  calculatePercentile,
  getValueAtPercentile,
  calculateDifficultyIndex,
  calculateDiscriminationIndex,
  calculateFullExamResults
};
