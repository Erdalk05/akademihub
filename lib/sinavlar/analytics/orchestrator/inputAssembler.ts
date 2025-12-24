/**
 * ============================================
 * AkademiHub - Analytics Input Assembler
 * ============================================
 * 
 * PHASE 3.3 - Veri toplama katmanı
 * 
 * SORUMLULUKLAR:
 * - Supabase'den ham veri çekme
 * - Veriyi Pure Engine formatına dönüştürme
 * - Trend için geçmiş verileri toplama
 * 
 * KURALLAR:
 * - HESAPLAMA YAPMA
 * - Sadece veri topla ve haritalandır
 * - Null-safe işlemler
 * - Eksik veri durumunda varsayılan değerler kullan
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  FullAnalyticsInput, 
  SubjectResultInput, 
  TopicInput,
  PreviousExamInput
} from '../engine/types';
import type { AssembledInput, OrchestratorConfig, DEFAULT_ORCHESTRATOR_CONFIG } from './types';

// ==================== LGS DERS YAPILANDIRMASI ====================

const LGS_SUBJECT_CONFIG = [
  { code: 'TUR', name: 'Türkçe', start_no: 1, end_no: 20, weight: 4.0 },
  { code: 'MAT', name: 'Matematik', start_no: 21, end_no: 40, weight: 4.0 },
  { code: 'FEN', name: 'Fen Bilimleri', start_no: 41, end_no: 60, weight: 4.0 },
  { code: 'INK', name: 'İnkılap Tarihi', start_no: 61, end_no: 70, weight: 1.0 },
  { code: 'DIN', name: 'Din Kültürü', start_no: 71, end_no: 80, weight: 1.0 },
  { code: 'ING', name: 'İngilizce', start_no: 81, end_no: 90, weight: 1.0 }
];

const TYT_SUBJECT_CONFIG = [
  { code: 'TUR', name: 'Türkçe', start_no: 1, end_no: 40, weight: 1.32 },
  { code: 'SOS', name: 'Sosyal Bilimler', start_no: 41, end_no: 60, weight: 1.36 },
  { code: 'MAT', name: 'Temel Matematik', start_no: 61, end_no: 100, weight: 1.32 },
  { code: 'FEN', name: 'Fen Bilimleri', start_no: 101, end_no: 120, weight: 1.36 }
];

// ==================== ANA TOPLAMA FONKSİYONU ====================

/**
 * Bir öğrenci ve sınav için tüm gerekli verileri toplar
 * 
 * Bu fonksiyon:
 * 1. Sınav meta verisini çeker
 * 2. Öğrenci bilgilerini çeker
 * 3. Cevapları çeker
 * 4. Sonuç varsa çeker
 * 5. Sınıf/okul ortalamalarını çeker
 * 6. Trend için geçmiş sınavları çeker
 * 
 * @param examId - Sınav ID
 * @param studentId - Öğrenci ID
 * @param config - Orchestrator config
 * @returns AssembledInput veya null (kritik veri eksikse)
 */
export async function assembleInput(
  examId: string,
  studentId: string,
  config: Partial<OrchestratorConfig> = {}
): Promise<AssembledInput | null> {
  const trendWindowSize = config.trend_window_size ?? 5;
  
  try {
    const supabase = createClient();
    
    // Paralel sorgular
    const [
      examData,
      studentData,
      answersData,
      resultData,
      classDataResult,
      previousExamsData
    ] = await Promise.all([
      fetchExam(supabase, examId),
      fetchStudent(supabase, studentId),
      fetchAnswers(supabase, examId, studentId),
      fetchResult(supabase, examId, studentId),
      fetchClassData(supabase, examId, studentId),
      fetchPreviousExams(supabase, studentId, examId, trendWindowSize)
    ]);
    
    // Kritik veri kontrolü
    if (!examData) {
      console.error('[InputAssembler] Exam not found:', examId);
      return null;
    }
    
    if (!studentData) {
      console.error('[InputAssembler] Student not found:', studentId);
      return null;
    }
    
    // Ders yapılandırmasını belirle
    const subjectConfig = getSubjectConfig(examData.exam_type_code);
    
    // Cevap anahtarını parse et
    const answerKey = parseAnswerKey(examData.answer_key);
    
    // Topic config (varsa)
    const topicConfig = await fetchTopicConfig(supabase, examData.exam_type_id);
    
    // Mevcut AI metadata (varsa)
    const existingAiMetadata = await fetchExistingAiMetadata(supabase, examId, studentId);
    
    return {
      student: {
        id: studentId,
        student_no: studentData.student_no,
        name: `${studentData.first_name ?? ''} ${studentData.last_name ?? ''}`.trim(),
        class_name: studentData.enrolled_class
      },
      
      exam: {
        id: examId,
        name: examData.name ?? 'Sınav',
        exam_type_code: examData.exam_type_code ?? 'LGS',
        total_questions: examData.total_questions ?? 90,
        wrong_penalty_divisor: examData.wrong_penalty_divisor ?? 3,
        exam_date: examData.exam_date,
        answer_key: answerKey
      },
      
      answers: answersData.map(a => ({
        question_no: a.question_no,
        given_answer: a.given_answer,
        is_correct: a.is_correct
      })),
      
      result: resultData ? {
        total_correct: resultData.total_correct,
        total_wrong: resultData.total_wrong,
        total_empty: resultData.total_empty,
        total_net: resultData.total_net,
        rank_in_exam: resultData.rank_in_exam,
        rank_in_class: resultData.rank_in_class,
        subject_results: resultData.subject_results
      } : undefined,
      
      class_data: classDataResult,
      
      school_data: classDataResult ? {
        avg_net: classDataResult.avg_net,
        student_count: classDataResult.student_count
      } : undefined,
      
      subject_config: subjectConfig,
      topic_config: topicConfig,
      previous_exams: previousExamsData,
      existing_ai_metadata: existingAiMetadata
    };
  } catch (error) {
    console.error('[InputAssembler] Unexpected error:', error);
    return null;
  }
}

// ==================== VERİ ÇEKME FONKSİYONLARI ====================

async function fetchExam(supabase: any, examId: string) {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      id,
      name,
      exam_type_id,
      exam_date,
      total_questions,
      answer_key,
      status,
      exam_types (
        code,
        wrong_penalty_divisor
      )
    `)
    .eq('id', examId)
    .single();
  
  if (error || !data) return null;
  
  return {
    ...data,
    exam_type_code: data.exam_types?.code ?? 'LGS',
    wrong_penalty_divisor: data.exam_types?.wrong_penalty_divisor ?? 3
  };
}

async function fetchStudent(supabase: any, studentId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('id, student_no, first_name, last_name, enrolled_class')
    .eq('id', studentId)
    .single();
  
  return error ? null : data;
}

async function fetchAnswers(supabase: any, examId: string, studentId: string) {
  const { data, error } = await supabase
    .from('exam_student_answers')
    .select('question_no, given_answer, is_correct')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .order('question_no', { ascending: true });
  
  return error ? [] : (data ?? []);
}

async function fetchResult(supabase: any, examId: string, studentId: string) {
  const { data, error } = await supabase
    .from('exam_student_results')
    .select(`
      total_correct,
      total_wrong,
      total_empty,
      total_net,
      rank_in_exam,
      rank_in_class,
      subject_results
    `)
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .single();
  
  return error ? null : data;
}

async function fetchClassData(
  supabase: any, 
  examId: string, 
  studentId: string
): Promise<AssembledInput['class_data'] | undefined> {
  // Önce öğrencinin sınıfını bul
  const { data: student } = await supabase
    .from('students')
    .select('enrolled_class')
    .eq('id', studentId)
    .single();
  
  if (!student?.enrolled_class) return undefined;
  
  // Sınıftaki tüm sonuçları çek
  const { data: classResults } = await supabase
    .from('exam_student_results')
    .select(`
      total_net,
      student_id,
      students!inner (
        enrolled_class
      )
    `)
    .eq('exam_id', examId)
    .eq('students.enrolled_class', student.enrolled_class);
  
  if (!classResults || classResults.length === 0) return undefined;
  
  const nets = classResults.map((r: any) => r.total_net ?? 0);
  const avgNet = nets.reduce((a: number, b: number) => a + b, 0) / nets.length;
  
  return {
    class_name: student.enrolled_class,
    avg_net: round(avgNet),
    student_count: nets.length,
    all_nets: nets
  };
}

async function fetchPreviousExams(
  supabase: any,
  studentId: string,
  currentExamId: string,
  limit: number
): Promise<PreviousExamInput[]> {
  const { data, error } = await supabase
    .from('exam_student_results')
    .select(`
      exam_id,
      total_net,
      rank_in_exam,
      rank_in_class,
      exams!inner (
        exam_date
      )
    `)
    .eq('student_id', studentId)
    .neq('exam_id', currentExamId)
    .order('exams(exam_date)', { ascending: false })
    .limit(limit);
  
  if (error || !data) return [];
  
  return data.map((r: any) => ({
    exam_id: r.exam_id,
    exam_date: r.exams?.exam_date,
    total_net: r.total_net ?? 0,
    rank_in_exam: r.rank_in_exam,
    rank_in_class: r.rank_in_class
  }));
}

async function fetchTopicConfig(
  supabase: any,
  examTypeId: string
): Promise<AssembledInput['topic_config']> {
  const { data, error } = await supabase
    .from('exam_question_topic_config')
    .select('question_ranges')
    .eq('exam_type_id', examTypeId)
    .eq('is_active', true)
    .eq('is_default', true)
    .single();
  
  if (error || !data?.question_ranges) return undefined;
  
  // JSONB'yi parse et
  const ranges = data.question_ranges;
  if (!Array.isArray(ranges)) return undefined;
  
  return ranges.map((r: any) => ({
    topic_id: r.topic_id ?? r.topic_code ?? '',
    topic_name: r.topic_name ?? '',
    subject_code: r.subject_code ?? '',
    question_range: {
      start: r.start ?? 0,
      end: r.end ?? 0
    }
  }));
}

async function fetchExistingAiMetadata(
  supabase: any,
  examId: string,
  studentId: string
): Promise<Record<string, any> | undefined> {
  const { data, error } = await supabase
    .from('exam_student_analytics')
    .select('ai_metadata')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .single();
  
  if (error || !data) return undefined;
  
  return data.ai_metadata ?? {};
}

// ==================== DÖNÜŞÜM FONKSİYONLARI ====================

/**
 * AssembledInput'u FullAnalyticsInput'a dönüştürür
 * Bu, Pure Engine'e verilecek nihai format
 */
export function toEngineInput(assembled: AssembledInput): FullAnalyticsInput {
  // Subject results oluştur
  const subjectResults = buildSubjectResults(assembled);
  
  // Topic results oluştur
  const topicResults = buildTopicResults(assembled);
  
  // Previous exams
  const previousExams = assembled.previous_exams?.map(pe => ({
    examId: pe.exam_id,
    examDate: pe.exam_date,
    totalNet: pe.total_net,
    rankInExam: pe.rank_in_exam,
    rankInClass: pe.rank_in_class
  }));
  
  return {
    studentId: assembled.student.id,
    studentNo: assembled.student.student_no,
    studentName: assembled.student.name,
    className: assembled.student.class_name,
    
    examId: assembled.exam.id,
    examTypeCode: assembled.exam.exam_type_code,
    wrongPenaltyDivisor: assembled.exam.wrong_penalty_divisor,
    
    totalCorrect: assembled.result?.total_correct ?? calculateCorrect(assembled),
    totalWrong: assembled.result?.total_wrong ?? calculateWrong(assembled),
    totalEmpty: assembled.result?.total_empty ?? calculateEmpty(assembled),
    totalNet: assembled.result?.total_net ?? calculateNet(assembled),
    
    rankInExam: assembled.result?.rank_in_exam,
    rankInClass: assembled.result?.rank_in_class,
    totalStudentsInExam: assembled.class_data?.student_count,
    totalStudentsInClass: assembled.class_data?.student_count,
    
    subjectResults,
    topicResults,
    
    previousExams,
    
    classAvgNet: assembled.class_data?.avg_net,
    schoolAvgNet: assembled.school_data?.avg_net
  };
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function getSubjectConfig(examTypeCode: string): AssembledInput['subject_config'] {
  switch (examTypeCode) {
    case 'TYT':
      return TYT_SUBJECT_CONFIG;
    case 'LGS':
    default:
      return LGS_SUBJECT_CONFIG;
  }
}

function parseAnswerKey(answerKey: any): Record<number, string> {
  if (!answerKey) return {};
  
  if (typeof answerKey === 'object') {
    const result: Record<number, string> = {};
    for (const [key, value] of Object.entries(answerKey)) {
      const num = parseInt(key, 10);
      if (!isNaN(num) && typeof value === 'string') {
        result[num] = value;
      }
    }
    return result;
  }
  
  return {};
}

function buildSubjectResults(assembled: AssembledInput): SubjectResultInput[] {
  const results: SubjectResultInput[] = [];
  const answerKey = assembled.exam.answer_key;
  
  for (const subject of assembled.subject_config) {
    let correct = 0;
    let wrong = 0;
    let empty = 0;
    
    for (let qNo = subject.start_no; qNo <= subject.end_no; qNo++) {
      const answer = assembled.answers.find(a => a.question_no === qNo);
      const correctAnswer = answerKey[qNo];
      
      if (!answer || !answer.given_answer) {
        empty++;
      } else if (answer.given_answer === correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    }
    
    const penalty = assembled.exam.wrong_penalty_divisor;
    const net = correct - (wrong / penalty);
    
    results.push({
      subjectCode: subject.code,
      subjectName: subject.name,
      correct,
      wrong,
      empty,
      net: round(net),
      classAvg: assembled.class_data?.avg_net
    });
  }
  
  return results;
}

function buildTopicResults(assembled: AssembledInput): TopicInput[] {
  if (!assembled.topic_config || assembled.topic_config.length === 0) {
    return [];
  }
  
  const results: TopicInput[] = [];
  const answerKey = assembled.exam.answer_key;
  
  for (const topic of assembled.topic_config) {
    let correct = 0;
    let wrong = 0;
    let empty = 0;
    
    for (let qNo = topic.question_range.start; qNo <= topic.question_range.end; qNo++) {
      const answer = assembled.answers.find(a => a.question_no === qNo);
      const correctAnswer = answerKey[qNo];
      
      if (!answer || !answer.given_answer) {
        empty++;
      } else if (answer.given_answer === correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    }
    
    const total = correct + wrong + empty;
    
    results.push({
      topicId: topic.topic_id,
      topicName: topic.topic_name,
      subjectCode: topic.subject_code,
      correct,
      wrong,
      empty,
      total
    });
  }
  
  return results;
}

function calculateCorrect(assembled: AssembledInput): number {
  const answerKey = assembled.exam.answer_key;
  return assembled.answers.filter(a => 
    a.given_answer && a.given_answer === answerKey[a.question_no]
  ).length;
}

function calculateWrong(assembled: AssembledInput): number {
  const answerKey = assembled.exam.answer_key;
  return assembled.answers.filter(a => 
    a.given_answer && a.given_answer !== answerKey[a.question_no]
  ).length;
}

function calculateEmpty(assembled: AssembledInput): number {
  const totalQuestions = assembled.exam.total_questions;
  const answered = assembled.answers.filter(a => a.given_answer).length;
  return totalQuestions - answered;
}

function calculateNet(assembled: AssembledInput): number {
  const correct = calculateCorrect(assembled);
  const wrong = calculateWrong(assembled);
  const penalty = assembled.exam.wrong_penalty_divisor;
  return round(correct - (wrong / penalty));
}

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  assembleInput,
  toEngineInput
};
