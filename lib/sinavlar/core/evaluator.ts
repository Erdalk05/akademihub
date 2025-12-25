/**
 * AkademiHub Vectorized Mass Evaluator
 * Motor Dairesi - Süper Hızlı Puanlama Motoru
 * 
 * "Matematikçi" hızında binlerce öğrenciyi saniyeler içinde puanlar.
 * 
 * Özellikler:
 * - Array-based vektörize hesaplama (NO nested loops)
 * - LGS (1/3) ve YKS (1/4) net kuralları
 * - Ders bazlı katsayılı puanlama
 * - Otomatik sıralama ve yüzdelik dilim
 * - Ders bazlı istatistikler
 */

import {
  ExamType,
  ExamConfig,
  AnswerKey,
  AnswerKeyItem,
  ParsedStudent,
  StudentResult,
  SubjectResult,
  EvaluationResult,
  EXAM_CONFIGS,
  BookletType,
} from './types';

import {
  calculateNet,
  calculatePercentile,
  calculateStandardDeviation,
} from './helpers';

import {
  logEvaluateStart,
  logEvaluateComplete,
} from './audit';

// ============================================
// 📊 CEVAP KARŞILAŞTIRMA
// ============================================

/**
 * Tek bir cevabı değerlendirir
 */
function evaluateAnswer(
  studentAnswer: string | null,
  correctAnswer: string | null
): 'correct' | 'wrong' | 'empty' {
  // Boş cevap
  if (!studentAnswer || studentAnswer === '' || studentAnswer === ' ' || studentAnswer === '-' || studentAnswer === '*') {
    return 'empty';
  }
  
  // Doğru cevap yoksa (hatalı anahtar)
  if (!correctAnswer) {
    return 'empty';
  }
  
  // Karşılaştır
  return studentAnswer.toUpperCase() === correctAnswer.toUpperCase() ? 'correct' : 'wrong';
}

/**
 * Tüm cevapları vektörize olarak değerlendirir
 * NOT: Bu fonksiyon nested loop kullanmadan çalışır
 */
function evaluateAllAnswers(
  studentAnswers: string,
  answerKey: AnswerKeyItem[]
): { correct: number; wrong: number; empty: number; details: ('correct' | 'wrong' | 'empty')[] } {
  const answerArray = studentAnswers.split('');
  const details: ('correct' | 'wrong' | 'empty')[] = [];
  
  // Vektörize map işlemi
  const results = answerKey.map((keyItem, index) => {
    const studentAnswer = answerArray[index] || null;
    const result = evaluateAnswer(studentAnswer, keyItem.correctAnswer);
    details.push(result);
    return result;
  });
  
  // Reduce ile toplam hesaplama
  const counts = results.reduce(
    (acc, result) => {
      acc[result]++;
      return acc;
    },
    { correct: 0, wrong: 0, empty: 0 }
  );
  
  return { ...counts, details };
}

// ============================================
// 📈 DERS BAZLI DEĞERLENDİRME
// ============================================

/**
 * Ders bazlı sonuçları hesaplar
 */
function evaluateBySubject(
  studentAnswers: string,
  answerKey: AnswerKeyItem[],
  examConfig: ExamConfig
): SubjectResult[] {
  const results: SubjectResult[] = [];
  const answerArray = studentAnswers.split('');
  
  for (const subject of examConfig.subjects) {
    // Bu derse ait cevapları filtrele
    const subjectAnswers = answerKey.filter(
      item => item.subjectId === subject.id
    );
    
    let correct = 0;
    let wrong = 0;
    let empty = 0;
    
    // Ders cevaplarını değerlendir
    subjectAnswers.forEach((keyItem, idx) => {
      const questionIndex = subject.startIndex + idx;
      const studentAnswer = answerArray[questionIndex] || null;
      const result = evaluateAnswer(studentAnswer, keyItem.correctAnswer);
      
      if (result === 'correct') correct++;
      else if (result === 'wrong') wrong++;
      else empty++;
    });
    
    // Net ve ağırlıklı puan hesapla
    const net = calculateNet(correct, wrong, examConfig.wrongPenalty);
    const weightedScore = net * subject.coefficient;
    const percentage = subject.questionCount > 0 
      ? Math.round((correct / subject.questionCount) * 100) 
      : 0;
    
    results.push({
      subjectId: subject.id,
      subjectName: subject.name,
      correct,
      wrong,
      empty,
      net,
      weightedScore: Math.round(weightedScore * 100) / 100,
      percentage,
    });
  }
  
  return results;
}

// ============================================
// 🎯 ANA DEĞERLENDİRME FONKSİYONU
// ============================================

/**
 * Sınavı değerlendirir
 * 
 * @param examId Sınav ID
 * @param students Parse edilmiş öğrenci listesi
 * @param answerKey Cevap anahtarı
 * @param examConfig Sınav yapılandırması
 * @param options Opsiyonel ayarlar
 */
export function evaluateExam(
  examId: string,
  students: ParsedStudent[],
  answerKey: AnswerKey,
  examConfig?: ExamConfig,
  options?: {
    userId?: string;
    organizationId?: string;
  }
): EvaluationResult {
  const startTime = Date.now();
  
  // Exam config yoksa default kullan
  const config = examConfig || EXAM_CONFIGS[answerKey.examType] || EXAM_CONFIGS.LGS;
  
  // Audit log
  logEvaluateStart(examId, students.length, {
    userId: options?.userId,
    organizationId: options?.organizationId,
  });

  // ========== VEKTÖRİZE DEĞERLENDİRME ==========
  const studentResults: StudentResult[] = students
    .filter(s => s.status !== 'FAILED') // Başarısız parse'ları atla
    .map(student => {
      // Kitapçık rotasyonu uygula (eğer varsa)
      const effectiveAnswerKey = applyBookletRotation(
        answerKey.answers,
        student.booklet,
        config.bookletRotation
      );
      
      // Tüm cevapları değerlendir
      const overall = evaluateAllAnswers(student.answers, effectiveAnswerKey);
      
      // Ders bazlı değerlendir
      const subjects = evaluateBySubject(student.answers, effectiveAnswerKey, config);
      
      // Toplam net ve puan
      const totalNet = subjects.reduce((sum, s) => sum + s.net, 0);
      const totalScore = subjects.reduce((sum, s) => sum + s.weightedScore, 0);
      
      return {
        studentNo: student.studentNo,
        tc: student.tc,
        name: student.name,
        booklet: student.booklet,
        totalCorrect: overall.correct,
        totalWrong: overall.wrong,
        totalEmpty: overall.empty,
        totalNet: Math.round(totalNet * 100) / 100,
        totalScore: Math.round(totalScore * 100) / 100,
        subjects,
        rank: 0, // Sonra hesaplanacak
        percentile: 0, // Sonra hesaplanacak
        evaluatedAt: new Date(),
        examId,
      };
    });

  // ========== SIRALAMA (Vektörize) ==========
  // Score'a göre sırala
  studentResults.sort((a, b) => b.totalScore - a.totalScore);
  
  // Rank ve percentile ata
  studentResults.forEach((result, index) => {
    // Aynı puana sahip öğrenciler aynı sırayı alır
    if (index > 0 && result.totalScore === studentResults[index - 1].totalScore) {
      result.rank = studentResults[index - 1].rank;
    } else {
      result.rank = index + 1;
    }
    result.percentile = calculatePercentile(result.rank, studentResults.length);
  });

  // ========== İSTATİSTİKLER ==========
  const scores = studentResults.map(r => r.totalScore);
  const nets = studentResults.map(r => r.totalNet);
  
  const averageScore = scores.length > 0 
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 
    : 0;
  
  const averageNet = nets.length > 0 
    ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100 
    : 0;

  // Ders bazlı istatistikler
  const subjectStats = config.subjects.map(subject => {
    const subjectNets = studentResults.map(r => 
      r.subjects.find(s => s.subjectId === subject.id)?.net || 0
    );
    const subjectPercentages = studentResults.map(r => 
      r.subjects.find(s => s.subjectId === subject.id)?.percentage || 0
    );
    
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      averageNet: subjectNets.length > 0 
        ? Math.round((subjectNets.reduce((a, b) => a + b, 0) / subjectNets.length) * 100) / 100 
        : 0,
      averagePercentage: subjectPercentages.length > 0 
        ? Math.round(subjectPercentages.reduce((a, b) => a + b, 0) / subjectPercentages.length) 
        : 0,
      hardestQuestions: [], // İleride hesaplanabilir
    };
  });

  const duration = Date.now() - startTime;

  // Audit log
  logEvaluateComplete(examId, {
    studentCount: studentResults.length,
    averageScore,
    duration,
  }, {
    userId: options?.userId,
    organizationId: options?.organizationId,
  });

  return {
    examId,
    examType: answerKey.examType,
    examName: config.name,
    evaluatedAt: new Date(),
    totalStudents: studentResults.length,
    averageNet,
    averageScore,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    standardDeviation: calculateStandardDeviation(scores),
    results: studentResults,
    subjectStats,
  };
}

// ============================================
// 📚 KİTAPÇIK ROTASYONU
// ============================================

/**
 * Kitapçık tipine göre cevap anahtarını döndürür
 * A kitapçığı referans, diğerleri rotasyonlu
 */
function applyBookletRotation(
  answerKey: AnswerKeyItem[],
  booklet: BookletType | null,
  rotationTable?: Record<BookletType, number[]>
): AnswerKeyItem[] {
  // A kitapçığı veya rotasyon tablosu yoksa olduğu gibi dön
  if (!booklet || booklet === 'A' || !rotationTable) {
    return answerKey;
  }
  
  const rotation = rotationTable[booklet];
  if (!rotation) {
    return answerKey;
  }
  
  // Rotasyonu uygula
  return rotation.map((originalIndex, newIndex) => ({
    ...answerKey[originalIndex],
    questionNo: newIndex + 1,
  }));
}

// ============================================
// 📊 HIZLI TOPLU İŞLEMLER
// ============================================

/**
 * Sadece net hesabı yapar (hızlı önizleme için)
 */
export function quickNetCalculation(
  answers: string,
  correctAnswers: string,
  wrongPenalty: number = 4
): { correct: number; wrong: number; empty: number; net: number } {
  const studentArray = answers.split('');
  const keyArray = correctAnswers.split('');
  
  let correct = 0;
  let wrong = 0;
  let empty = 0;
  
  const maxLen = Math.max(studentArray.length, keyArray.length);
  
  for (let i = 0; i < maxLen; i++) {
    const student = studentArray[i] || '';
    const key = keyArray[i] || '';
    
    if (!student || student === ' ' || student === '-' || student === '*') {
      empty++;
    } else if (student.toUpperCase() === key.toUpperCase()) {
      correct++;
    } else {
      wrong++;
    }
  }
  
  return {
    correct,
    wrong,
    empty,
    net: calculateNet(correct, wrong, wrongPenalty),
  };
}

/**
 * Toplu net hesabı (preview için)
 */
export function batchQuickNet(
  students: { answers: string }[],
  correctAnswers: string,
  wrongPenalty: number = 4
): { correct: number; wrong: number; empty: number; net: number }[] {
  return students.map(s => quickNetCalculation(s.answers, correctAnswers, wrongPenalty));
}

// ============================================
// 📈 SINIF KARŞILAŞTIRMASI
// ============================================

/**
 * Sınıfları karşılaştırır
 */
export function compareClasses(
  evaluationResult: EvaluationResult,
  classField: 'classCode' | 'school' = 'classCode'
): {
  className: string;
  studentCount: number;
  averageScore: number;
  averageNet: number;
  highestScore: number;
  lowestScore: number;
}[] {
  // Sınıflara göre grupla
  const classGroups: Record<string, StudentResult[]> = {};
  
  for (const result of evaluationResult.results) {
    // classCode bilgisi parsed student'tan gelecek
    // Şimdilik studentNo'nun ilk 2 karakterini sınıf olarak kullan
    const className = result.studentNo.substring(0, 2) || 'Bilinmeyen';
    
    if (!classGroups[className]) {
      classGroups[className] = [];
    }
    classGroups[className].push(result);
  }
  
  // Her sınıf için istatistik hesapla
  return Object.entries(classGroups).map(([className, students]) => {
    const scores = students.map(s => s.totalScore);
    const nets = students.map(s => s.totalNet);
    
    return {
      className,
      studentCount: students.length,
      averageScore: scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 
        : 0,
      averageNet: nets.length > 0 
        ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 100) / 100 
        : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
}

// ============================================
// 🎯 EN ZOR SORULAR
// ============================================

/**
 * En çok yanlış yapılan soruları bulur
 */
export function findHardestQuestions(
  students: ParsedStudent[],
  answerKey: AnswerKeyItem[],
  topN: number = 10
): { questionNo: number; subjectId: string; wrongCount: number; wrongPercentage: number }[] {
  const questionStats: Record<number, { wrong: number; total: number; subjectId: string }> = {};
  
  // Her soru için yanlış sayısını hesapla
  for (const student of students) {
    const answers = student.answers.split('');
    
    answerKey.forEach((keyItem, index) => {
      if (!questionStats[keyItem.questionNo]) {
        questionStats[keyItem.questionNo] = { wrong: 0, total: 0, subjectId: keyItem.subjectId };
      }
      
      const studentAnswer = answers[index] || '';
      const isWrong = studentAnswer && 
                      studentAnswer !== ' ' && 
                      studentAnswer !== '-' && 
                      studentAnswer.toUpperCase() !== keyItem.correctAnswer?.toUpperCase();
      
      if (isWrong) {
        questionStats[keyItem.questionNo].wrong++;
      }
      questionStats[keyItem.questionNo].total++;
    });
  }
  
  // Yanlış yüzdesine göre sırala
  return Object.entries(questionStats)
    .map(([questionNo, stats]) => ({
      questionNo: parseInt(questionNo),
      subjectId: stats.subjectId,
      wrongCount: stats.wrong,
      wrongPercentage: stats.total > 0 ? Math.round((stats.wrong / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.wrongPercentage - a.wrongPercentage)
    .slice(0, topN);
}

