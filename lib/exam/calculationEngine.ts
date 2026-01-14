// ============================================================================
// EXAM CALCULATION ENGINE (Legacy Placeholder)
// Bu modül eski sınav sisteminden kalmıştır
// Yeni sistem: lib/spectra-wizard/scoring-engine.ts
// ============================================================================

export interface CalculationInput {
  examId: string;
  examType: unknown;
  answerKey: Record<number, string | null>;
  subjectRanges: Array<{
    code: string;
    name: string;
    startNo: number;
    endNo: number;
    weight?: number;
  }>;
  questionTopicMapping: Array<{
    questionNo: number;
    topicId: string;
  }>;
  studentAnswers: Array<{
    studentId: string;
    className?: string;
    answers: Array<{
      questionNo: number;
      givenAnswer: string | null;
    }>;
  }>;
}

export interface StudentResult {
  studentId: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  rankInExam: number;
  rankInClass?: number;
  percentile: number;
  subjectResults: Record<string, {
    correct: number;
    wrong: number;
    empty: number;
    net: number;
  }>;
  topicResults: Record<string, {
    correct: number;
    wrong: number;
    empty: number;
  }>;
}

export interface CalculationOutput {
  studentResults: StudentResult[];
  examStats: {
    totalStudents: number;
    averageNet: number;
    maxNet: number;
    minNet: number;
  };
}

/**
 * Sınav sonuçlarını hesaplar
 * @deprecated Yeni sistem için lib/spectra-wizard/scoring-engine.ts kullanın
 */
export function calculateFullExamResults(input: CalculationInput): CalculationOutput {
  const { answerKey, studentAnswers, subjectRanges, questionTopicMapping } = input;
  
  const studentResults: StudentResult[] = [];
  
  for (const student of studentAnswers) {
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;
    
    const subjectResults: Record<string, { correct: number; wrong: number; empty: number; net: number }> = {};
    const topicResults: Record<string, { correct: number; wrong: number; empty: number }> = {};
    
    // Initialize subject results
    for (const subject of subjectRanges) {
      subjectResults[subject.code] = { correct: 0, wrong: 0, empty: 0, net: 0 };
    }
    
    // Process each answer
    for (const answer of student.answers) {
      const correctAnswer = answerKey[answer.questionNo];
      
      // Determine which subject this question belongs to
      let subjectCode: string | null = null;
      for (const subject of subjectRanges) {
        if (answer.questionNo >= subject.startNo && answer.questionNo <= subject.endNo) {
          subjectCode = subject.code;
          break;
        }
      }
      
      // Find topic if exists
      const topicMapping = questionTopicMapping.find(t => t.questionNo === answer.questionNo);
      
      if (!answer.givenAnswer || answer.givenAnswer.trim() === '') {
        totalEmpty++;
        if (subjectCode && subjectResults[subjectCode]) {
          subjectResults[subjectCode].empty++;
        }
        if (topicMapping) {
          if (!topicResults[topicMapping.topicId]) {
            topicResults[topicMapping.topicId] = { correct: 0, wrong: 0, empty: 0 };
          }
          topicResults[topicMapping.topicId].empty++;
        }
      } else if (answer.givenAnswer.toUpperCase() === correctAnswer?.toUpperCase()) {
        totalCorrect++;
        if (subjectCode && subjectResults[subjectCode]) {
          subjectResults[subjectCode].correct++;
        }
        if (topicMapping) {
          if (!topicResults[topicMapping.topicId]) {
            topicResults[topicMapping.topicId] = { correct: 0, wrong: 0, empty: 0 };
          }
          topicResults[topicMapping.topicId].correct++;
        }
      } else {
        totalWrong++;
        if (subjectCode && subjectResults[subjectCode]) {
          subjectResults[subjectCode].wrong++;
        }
        if (topicMapping) {
          if (!topicResults[topicMapping.topicId]) {
            topicResults[topicMapping.topicId] = { correct: 0, wrong: 0, empty: 0 };
          }
          topicResults[topicMapping.topicId].wrong++;
        }
      }
    }
    
    // Calculate net for each subject
    for (const code of Object.keys(subjectResults)) {
      const sr = subjectResults[code];
      sr.net = sr.correct - (sr.wrong / 4);
    }
    
    const totalNet = totalCorrect - (totalWrong / 4);
    
    studentResults.push({
      studentId: student.studentId,
      correct: totalCorrect,
      wrong: totalWrong,
      empty: totalEmpty,
      net: totalNet,
      rankInExam: 0, // Will be calculated after sorting
      rankInClass: undefined,
      percentile: 0, // Will be calculated after sorting
      subjectResults,
      topicResults,
    });
  }
  
  // Sort by net descending and assign ranks
  studentResults.sort((a, b) => b.net - a.net);
  
  const totalStudents = studentResults.length;
  studentResults.forEach((result, index) => {
    result.rankInExam = index + 1;
    result.percentile = totalStudents > 1 
      ? Math.round((1 - (index / (totalStudents - 1))) * 100)
      : 100;
  });
  
  // Calculate stats
  const nets = studentResults.map(r => r.net);
  const examStats = {
    totalStudents,
    averageNet: totalStudents > 0 ? nets.reduce((a, b) => a + b, 0) / totalStudents : 0,
    maxNet: totalStudents > 0 ? Math.max(...nets) : 0,
    minNet: totalStudents > 0 ? Math.min(...nets) : 0,
  };
  
  return { studentResults, examStats };
}
