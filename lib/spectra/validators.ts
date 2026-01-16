// ============================================================================
// SPECTRA - ZOD VALIDATORS (v2.0)
// API request validation schemas
// ============================================================================

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// COMMON SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const examTypeSchema = z.enum(['LGS', 'TYT', 'AYT', 'DENEME', 'KONU_TEST', 'YAZILI']);
export const examStatusSchema = z.enum(['draft', 'ready', 'active', 'archived']);
export const gradeLevelSchema = z.union([
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
  z.literal('mezun'),
]);
export const answerOptionSchema = z.enum(['A', 'B', 'C', 'D', 'E']).nullable();

// ─────────────────────────────────────────────────────────────────────────────
// CREATE EXAM (POST /api/spectra/exams)
// ─────────────────────────────────────────────────────────────────────────────

export const createExamSchema = z.object({
  name: z.string().min(1, 'Sınav adı gerekli').max(200),
  exam_type: examTypeSchema,
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli tarih formatı: YYYY-MM-DD'),
  grade_level: gradeLevelSchema.optional(),
  description: z.string().max(1000).optional(),
  organization_id: z.string().uuid('Geçerli organization_id gerekli'),
  academic_year_id: z.string().uuid().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE EXAM (PATCH /api/spectra/exams/[examId])
// ─────────────────────────────────────────────────────────────────────────────

export const updateExamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  exam_type: examTypeSchema.optional(),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  grade_level: gradeLevelSchema.optional(),
  description: z.string().max(1000).optional(),
  status: examStatusSchema.optional(),
  total_questions: z.number().int().min(1).max(500).optional(),
});

export type UpdateExamInput = z.infer<typeof updateExamSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS (POST /api/spectra/exams/[examId]/lessons)
// ─────────────────────────────────────────────────────────────────────────────

export const lessonConfigSchema = z.object({
  lesson_id: z.string().uuid().optional(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  question_count: z.number().int().min(1).max(200),
  start_index: z.number().int().min(0),
  end_index: z.number().int().min(1),
  weight: z.number().min(0).max(10).optional(),
});

export const saveLessonsSchema = z.object({
  lessons: z.array(lessonConfigSchema).min(1, 'En az bir ders gerekli'),
  total_questions: z.number().int().min(1),
});

export type SaveLessonsInput = z.infer<typeof saveLessonsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER KEY (POST /api/spectra/exams/[examId]/answer-key)
// ─────────────────────────────────────────────────────────────────────────────

export const answerKeyItemSchema = z.object({
  question_number: z.number().int().min(1),
  correct_answer: answerOptionSchema,
  lesson_code: z.string().min(1).max(20),
  is_cancelled: z.boolean().optional(),
  booklet_answers: z.record(z.string(), answerOptionSchema).optional(),
});

export const saveAnswerKeySchema = z.object({
  items: z.array(answerKeyItemSchema).min(1, 'En az bir cevap gerekli'),
  source: z.enum(['manual', 'template', 'excel']).optional(),
  template_id: z.string().uuid().optional(),
});

export type SaveAnswerKeyInput = z.infer<typeof saveAnswerKeySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS QUERY (GET /api/spectra/exams/[examId]/results)
// ─────────────────────────────────────────────────────────────────────────────

export const resultsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['rank', 'name', 'net', 'score', 'correct']).default('rank'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  className: z.string().max(50).optional(),
  participantType: z.enum(['institution', 'guest', 'all']).default('all'),
});

export type ResultsQueryInput = z.infer<typeof resultsQuerySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// OPTICAL UPLOAD (POST /api/spectra/exams/[examId]/optical/upload)
// ─────────────────────────────────────────────────────────────────────────────

export const opticalUploadSchema = z.object({
  template_id: z.string().optional(),
  auto_detect: z.boolean().default(true),
  match_students: z.boolean().default(true),
  recalculate_results: z.boolean().default(true),
});

export type OpticalUploadInput = z.infer<typeof opticalUploadSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: errorMessage };
}
