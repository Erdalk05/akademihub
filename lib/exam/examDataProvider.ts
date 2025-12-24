/**
 * ============================================
 * AkademiHub - Exam Data Provider
 * ============================================
 * 
 * Supabase ile sınav verilerini yönetir.
 * CRUD operasyonları ve cache yönetimi.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Exam,
  ExamType,
  ExamSubject,
  ExamTopic,
  ExamQuestion,
  ExamStudentAnswer,
  ExamStudentResult,
  ExamClassAnalytics,
  CreateExamInput,
  UpdateExamInput,
  BulkAnswerInput,
  AnswerOption
} from '@/types/exam.types';

const supabase = createClient();

// ==================== EXAM TYPES ====================

export async function getExamTypes(organizationId?: string): Promise<ExamType[]> {
  let query = supabase
    .from('exam_types')
    .select('*')
    .eq('is_active', true)
    .order('code');
  
  if (organizationId) {
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data?.map(mapExamType) ?? [];
}

export async function getExamTypeByCode(code: string): Promise<ExamType | null> {
  const { data, error } = await supabase
    .from('exam_types')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error) return null;
  return mapExamType(data);
}

// ==================== SUBJECTS ====================

export async function getSubjectsByExamType(examTypeId: string): Promise<ExamSubject[]> {
  const { data, error } = await supabase
    .from('exam_subjects')
    .select('*')
    .eq('exam_type_id', examTypeId)
    .order('display_order');
  
  if (error) throw error;
  return data?.map(mapExamSubject) ?? [];
}

// ==================== TOPICS ====================

export async function getTopicsBySubject(subjectId: string): Promise<ExamTopic[]> {
  const { data, error } = await supabase
    .from('exam_topics')
    .select(`
      *,
      learning_outcomes:exam_learning_outcomes(*)
    `)
    .eq('subject_id', subjectId)
    .order('display_order');
  
  if (error) throw error;
  return data?.map(mapExamTopic) ?? [];
}

export async function getAllTopicsForExamType(examTypeId: string): Promise<ExamTopic[]> {
  const { data, error } = await supabase
    .from('exam_topics')
    .select(`
      *,
      subject:exam_subjects!inner(exam_type_id)
    `)
    .eq('subject.exam_type_id', examTypeId)
    .order('display_order');
  
  if (error) throw error;
  return data?.map(mapExamTopic) ?? [];
}

// ==================== EXAMS ====================

export async function getExams(
  organizationId: string,
  filters?: {
    examTypeId?: string;
    status?: string;
    academicYearId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Exam[]; count: number }> {
  let query = supabase
    .from('exams')
    .select('*, exam_type:exam_types(*)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('exam_date', { ascending: false });
  
  if (filters?.examTypeId) {
    query = query.eq('exam_type_id', filters.examTypeId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.academicYearId) {
    query = query.eq('academic_year_id', filters.academicYearId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  return {
    data: data?.map(mapExam) ?? [],
    count: count ?? 0
  };
}

export async function getExamById(examId: string): Promise<Exam | null> {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      exam_type:exam_types(*),
      questions:exam_questions(*)
    `)
    .eq('id', examId)
    .single();
  
  if (error) return null;
  return mapExam(data);
}

export async function createExam(input: CreateExamInput): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .insert({
      exam_type_id: input.examTypeId,
      academic_year_id: input.academicYearId,
      name: input.name,
      code: input.code,
      description: input.description,
      exam_date: input.examDate,
      start_time: input.startTime,
      end_time: input.endTime,
      total_questions: input.totalQuestions,
      duration_minutes: input.durationMinutes,
      target_classes: input.targetClasses,
      organization_id: input.organizationId,
      status: 'draft'
    })
    .select()
    .single();
  
  if (error) throw error;
  return mapExam(data);
}

export async function updateExam(examId: string, input: UpdateExamInput): Promise<Exam> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  if (input.name !== undefined) updateData.name = input.name;
  if (input.code !== undefined) updateData.code = input.code;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.examDate !== undefined) updateData.exam_date = input.examDate;
  if (input.startTime !== undefined) updateData.start_time = input.startTime;
  if (input.endTime !== undefined) updateData.end_time = input.endTime;
  if (input.totalQuestions !== undefined) updateData.total_questions = input.totalQuestions;
  if (input.durationMinutes !== undefined) updateData.duration_minutes = input.durationMinutes;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.targetClasses !== undefined) updateData.target_classes = input.targetClasses;
  if (input.answerKey !== undefined) updateData.answer_key = input.answerKey;
  if (input.questionMapping !== undefined) updateData.question_mapping = input.questionMapping;
  
  const { data, error } = await supabase
    .from('exams')
    .update(updateData)
    .eq('id', examId)
    .select()
    .single();
  
  if (error) throw error;
  return mapExam(data);
}

export async function publishExam(examId: string): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .update({
      status: 'scheduled',
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', examId)
    .select()
    .single();
  
  if (error) throw error;
  return mapExam(data);
}

// ==================== ANSWER KEY ====================

export async function setAnswerKey(
  examId: string,
  answerKey: Record<number, AnswerOption>
): Promise<void> {
  const { error } = await supabase
    .from('exams')
    .update({
      answer_key: answerKey,
      updated_at: new Date().toISOString()
    })
    .eq('id', examId);
  
  if (error) throw error;
}

// ==================== QUESTIONS ====================

export async function createExamQuestions(
  examId: string,
  questions: Array<{
    questionNo: number;
    correctAnswer: AnswerOption;
    subjectId?: string;
    topicId?: string;
    difficulty?: number;
  }>,
  organizationId: string
): Promise<ExamQuestion[]> {
  const insertData = questions.map(q => ({
    exam_id: examId,
    question_no: q.questionNo,
    correct_answer: q.correctAnswer,
    subject_id: q.subjectId,
    topic_id: q.topicId,
    difficulty: q.difficulty ?? 0.5,
    organization_id: organizationId
  }));
  
  const { data, error } = await supabase
    .from('exam_questions')
    .insert(insertData)
    .select();
  
  if (error) throw error;
  return data?.map(mapExamQuestion) ?? [];
}

export async function getExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const { data, error } = await supabase
    .from('exam_questions')
    .select(`
      *,
      subject:exam_subjects(*),
      topic:exam_topics(*)
    `)
    .eq('exam_id', examId)
    .order('question_no');
  
  if (error) throw error;
  return data?.map(mapExamQuestion) ?? [];
}

// ==================== STUDENT ANSWERS ====================

export async function saveStudentAnswers(input: BulkAnswerInput): Promise<void> {
  // Önce mevcut cevapları sil
  await supabase
    .from('exam_student_answers')
    .delete()
    .eq('exam_id', input.examId)
    .eq('student_id', input.studentId);
  
  // Yeni cevapları ekle
  const insertData = input.answers.map(a => ({
    exam_id: input.examId,
    student_id: input.studentId,
    question_no: a.questionNo,
    given_answer: a.answer,
    is_empty: !a.answer
  }));
  
  const { error } = await supabase
    .from('exam_student_answers')
    .insert(insertData);
  
  if (error) throw error;
  
  // Answer sheet'i de kaydet
  const answersJson: Record<number, AnswerOption> = {};
  input.answers.forEach(a => {
    answersJson[a.questionNo] = a.answer;
  });
  
  await supabase
    .from('exam_answer_sheets')
    .upsert({
      exam_id: input.examId,
      student_id: input.studentId,
      answers_json: answersJson,
      entry_method: input.entryMethod ?? 'manual',
      is_processed: false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'exam_id,student_id' });
}

export async function getStudentAnswers(
  examId: string,
  studentId: string
): Promise<ExamStudentAnswer[]> {
  const { data, error } = await supabase
    .from('exam_student_answers')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .order('question_no');
  
  if (error) throw error;
  return data?.map(mapExamStudentAnswer) ?? [];
}

export async function getAllStudentAnswersForExam(
  examId: string
): Promise<Map<string, ExamStudentAnswer[]>> {
  const { data, error } = await supabase
    .from('exam_student_answers')
    .select('*')
    .eq('exam_id', examId)
    .order('student_id')
    .order('question_no');
  
  if (error) throw error;
  
  const result = new Map<string, ExamStudentAnswer[]>();
  
  for (const row of data ?? []) {
    const answer = mapExamStudentAnswer(row);
    if (!result.has(answer.studentId)) {
      result.set(answer.studentId, []);
    }
    result.get(answer.studentId)!.push(answer);
  }
  
  return result;
}

// ==================== RESULTS ====================

export async function saveStudentResult(
  result: Omit<ExamStudentResult, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExamStudentResult> {
  const { data, error } = await supabase
    .from('exam_student_results')
    .upsert({
      exam_id: result.examId,
      student_id: result.studentId,
      total_correct: result.totalCorrect,
      total_wrong: result.totalWrong,
      total_empty: result.totalEmpty,
      total_net: result.totalNet,
      raw_score: result.rawScore,
      scaled_score: result.scaledScore,
      rank_in_exam: result.rankInExam,
      rank_in_class: result.rankInClass,
      rank_in_school: result.rankInSchool,
      percentile: result.percentile,
      subject_results: result.subjectResults,
      topic_results: result.topicResults,
      learning_outcome_results: result.learningOutcomeResults,
      ai_analysis: result.aiAnalysis,
      calculated_at: new Date().toISOString(),
      organization_id: result.organizationId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'exam_id,student_id' })
    .select()
    .single();
  
  if (error) throw error;
  return mapExamStudentResult(data);
}

export async function getStudentResult(
  examId: string,
  studentId: string
): Promise<ExamStudentResult | null> {
  const { data, error } = await supabase
    .from('exam_student_results')
    .select(`
      *,
      student:students(id, student_no, first_name, last_name, enrolled_class)
    `)
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .single();
  
  if (error) return null;
  return mapExamStudentResult(data);
}

export async function getExamResults(
  examId: string,
  options?: {
    className?: string;
    orderBy?: 'rank' | 'net' | 'name';
    limit?: number;
  }
): Promise<ExamStudentResult[]> {
  let query = supabase
    .from('exam_student_results')
    .select(`
      *,
      student:students(id, student_no, first_name, last_name, enrolled_class)
    `)
    .eq('exam_id', examId);
  
  // Sınıf filtresi
  if (options?.className) {
    query = query.eq('student.enrolled_class', options.className);
  }
  
  // Sıralama
  if (options?.orderBy === 'rank') {
    query = query.order('rank_in_exam', { ascending: true });
  } else if (options?.orderBy === 'net') {
    query = query.order('total_net', { ascending: false });
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data?.map(mapExamStudentResult) ?? [];
}

// ==================== CLASS ANALYTICS ====================

export async function saveClassAnalytics(
  analytics: Omit<ExamClassAnalytics, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const { error } = await supabase
    .from('exam_class_analytics')
    .upsert({
      exam_id: analytics.examId,
      class_name: analytics.className,
      total_students: analytics.totalStudents,
      participated_students: analytics.participatedStudents,
      participation_rate: analytics.participationRate,
      avg_correct: analytics.avgCorrect,
      avg_wrong: analytics.avgWrong,
      avg_empty: analytics.avgEmpty,
      avg_net: analytics.avgNet,
      avg_score: analytics.avgScore,
      min_net: analytics.minNet,
      max_net: analytics.maxNet,
      median_net: analytics.medianNet,
      std_deviation: analytics.stdDeviation,
      subject_averages: analytics.subjectAverages,
      topic_success_rates: analytics.topicSuccessRates,
      difficulty_analysis: analytics.difficultyAnalysis,
      calculated_at: new Date().toISOString(),
      organization_id: analytics.organizationId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'exam_id,class_name' });
  
  if (error) throw error;
}

export async function getClassAnalytics(
  examId: string,
  className?: string
): Promise<ExamClassAnalytics[]> {
  let query = supabase
    .from('exam_class_analytics')
    .select('*')
    .eq('exam_id', examId);
  
  if (className) {
    query = query.eq('class_name', className);
  }
  
  const { data, error } = await query.order('class_name');
  
  if (error) throw error;
  return data?.map(mapExamClassAnalytics) ?? [];
}

// ==================== MAPPERS ====================

function mapExamType(row: any): ExamType {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    wrongPenaltyDivisor: parseFloat(row.wrong_penalty_divisor),
    scoreWeights: row.score_weights,
    totalQuestions: row.total_questions,
    totalDurationMinutes: row.total_duration_minutes,
    isActive: row.is_active,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function mapExamSubject(row: any): ExamSubject {
  return {
    id: row.id,
    examTypeId: row.exam_type_id,
    code: row.code,
    name: row.name,
    shortName: row.short_name,
    questionCount: row.question_count,
    questionStartNo: row.question_start_no,
    questionEndNo: row.question_end_no,
    weight: parseFloat(row.weight),
    displayOrder: row.display_order,
    color: row.color,
    icon: row.icon,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function mapExamTopic(row: any): ExamTopic {
  return {
    id: row.id,
    subjectId: row.subject_id,
    parentId: row.parent_id,
    code: row.code,
    name: row.name,
    description: row.description,
    level: row.level,
    gradeLevel: row.grade_level,
    displayOrder: row.display_order,
    avgDifficulty: row.avg_difficulty ? parseFloat(row.avg_difficulty) : undefined,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    learningOutcomes: row.learning_outcomes?.map((lo: any) => ({
      id: lo.id,
      topicId: lo.topic_id,
      code: lo.code,
      name: lo.name,
      description: lo.description,
      cognitiveLevel: lo.cognitive_level,
      displayOrder: lo.display_order,
      organizationId: lo.organization_id,
      createdAt: new Date(lo.created_at),
      updatedAt: new Date(lo.updated_at)
    }))
  };
}

function mapExam(row: any): Exam {
  return {
    id: row.id,
    examTypeId: row.exam_type_id,
    academicYearId: row.academic_year_id,
    name: row.name,
    code: row.code,
    description: row.description,
    examDate: new Date(row.exam_date),
    startTime: row.start_time,
    endTime: row.end_time,
    totalQuestions: row.total_questions,
    durationMinutes: row.duration_minutes,
    answerKey: row.answer_key,
    questionMapping: row.question_mapping,
    status: row.status,
    isPublished: row.is_published,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    statsCalculatedAt: row.stats_calculated_at ? new Date(row.stats_calculated_at) : undefined,
    statsCache: row.stats_cache,
    targetClasses: row.target_classes,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    examType: row.exam_type ? mapExamType(row.exam_type) : undefined,
    questions: row.questions?.map(mapExamQuestion)
  };
}

function mapExamQuestion(row: any): ExamQuestion {
  return {
    id: row.id,
    examId: row.exam_id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    learningOutcomeId: row.learning_outcome_id,
    questionNo: row.question_no,
    correctAnswer: row.correct_answer,
    difficulty: parseFloat(row.difficulty),
    discrimination: row.discrimination ? parseFloat(row.discrimination) : undefined,
    questionText: row.question_text,
    questionImageUrl: row.question_image_url,
    options: row.options,
    totalAnswers: row.total_answers || 0,
    correctCount: row.correct_count || 0,
    wrongCount: row.wrong_count || 0,
    emptyCount: row.empty_count || 0,
    optionDistribution: row.option_distribution,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    subject: row.subject ? mapExamSubject(row.subject) : undefined,
    topic: row.topic ? mapExamTopic(row.topic) : undefined
  };
}

function mapExamStudentAnswer(row: any): ExamStudentAnswer {
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    questionId: row.question_id,
    questionNo: row.question_no,
    givenAnswer: row.given_answer,
    isCorrect: row.is_correct,
    isEmpty: row.is_empty,
    answerTimeSeconds: row.answer_time_seconds,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at)
  };
}

function mapExamStudentResult(row: any): ExamStudentResult {
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    totalCorrect: row.total_correct,
    totalWrong: row.total_wrong,
    totalEmpty: row.total_empty,
    totalNet: parseFloat(row.total_net),
    rawScore: row.raw_score ? parseFloat(row.raw_score) : undefined,
    scaledScore: row.scaled_score ? parseFloat(row.scaled_score) : undefined,
    rankInExam: row.rank_in_exam,
    rankInClass: row.rank_in_class,
    rankInSchool: row.rank_in_school,
    percentile: row.percentile ? parseFloat(row.percentile) : undefined,
    subjectResults: row.subject_results,
    topicResults: row.topic_results,
    learningOutcomeResults: row.learning_outcome_results,
    aiAnalysis: row.ai_analysis,
    calculatedAt: new Date(row.calculated_at),
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    student: row.student ? {
      id: row.student.id,
      studentNo: row.student.student_no,
      firstName: row.student.first_name,
      lastName: row.student.last_name,
      enrolledClass: row.student.enrolled_class
    } : undefined
  };
}

function mapExamClassAnalytics(row: any): ExamClassAnalytics {
  return {
    id: row.id,
    examId: row.exam_id,
    className: row.class_name,
    totalStudents: row.total_students,
    participatedStudents: row.participated_students,
    participationRate: parseFloat(row.participation_rate),
    avgCorrect: parseFloat(row.avg_correct),
    avgWrong: parseFloat(row.avg_wrong),
    avgEmpty: parseFloat(row.avg_empty),
    avgNet: parseFloat(row.avg_net),
    avgScore: row.avg_score ? parseFloat(row.avg_score) : undefined,
    minNet: parseFloat(row.min_net),
    maxNet: parseFloat(row.max_net),
    medianNet: parseFloat(row.median_net),
    stdDeviation: parseFloat(row.std_deviation),
    subjectAverages: row.subject_averages,
    topicSuccessRates: row.topic_success_rates,
    difficultyAnalysis: row.difficulty_analysis,
    calculatedAt: new Date(row.calculated_at),
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

// ==================== EXPORT ====================

export default {
  getExamTypes,
  getExamTypeByCode,
  getSubjectsByExamType,
  getTopicsBySubject,
  getAllTopicsForExamType,
  getExams,
  getExamById,
  createExam,
  updateExam,
  publishExam,
  setAnswerKey,
  createExamQuestions,
  getExamQuestions,
  saveStudentAnswers,
  getStudentAnswers,
  getAllStudentAnswersForExam,
  saveStudentResult,
  getStudentResult,
  getExamResults,
  saveClassAnalytics,
  getClassAnalytics
};
