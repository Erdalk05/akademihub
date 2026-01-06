import { getServiceRoleClient } from '@/lib/supabase/server';

export type ExamAuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RECALC'
  | 'EXPORT_PDF'
  | 'EXPORT_XLSX'
  | 'AI_REQUEST'
  | 'AI_READY'
  | 'AI_FAILED';

/**
 * Exam audit log yazımı (best-effort).
 * - Tablo yoksa / RLS / policy sorunu varsa ana akışı bozmaz.
 */
export async function writeExamAuditLog(input: {
  action: ExamAuditAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  organizationId?: string | null;
  examId?: string | null;
  studentId?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    const supabase = getServiceRoleClient();
    await supabase.from('exam_audit_log').insert({
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      exam_id: input.examId ?? null,
      student_id: input.studentId ?? null,
      description: input.description,
      organization_id: input.organizationId ?? null,
      metadata: input.metadata ?? null,
      performed_at: new Date().toISOString(),
    } as any);
  } catch {
    // sessiz geç: audit logging hiçbir zaman ana akışı kırmamalı
  }
}


