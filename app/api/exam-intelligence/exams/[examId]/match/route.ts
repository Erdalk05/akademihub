import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { getSupabaseRls } from '../../../_utils/supabaseRls';
import { writeExamAuditLog } from '@/lib/audit/examAudit';

export const dynamic = 'force-dynamic';

/**
 * Misafir sonucu kurum öğrencisine eşleme (legacy: student_exam_results üzerinden).
 * - Güvenlik: RLS client ile kullanıcının organization_users üyeliği doğrulanır.
 * - Yazma: service role ile yapılır (tablo RLS/policy bağımlılığı yok).
 */
export async function PATCH(request: NextRequest, { params }: { params: { examId: string } }) {
  const examId = params.examId;
  const body = await request.json().catch(() => null);

  const organizationId = String(body?.organizationId || '').trim();
  const resultRowId = String(body?.resultRowId || '').trim(); // student_exam_results.id
  const studentId = String(body?.studentId || '').trim(); // students.id

  if (!organizationId) return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 });
  if (!examId) return NextResponse.json({ ok: false, error: 'examId gerekli' }, { status: 400 });
  if (!resultRowId) return NextResponse.json({ ok: false, error: 'resultRowId gerekli' }, { status: 400 });
  if (!studentId) return NextResponse.json({ ok: false, error: 'studentId gerekli' }, { status: 400 });

  // 1) RLS ile üyelik doğrula
  const rls = getSupabaseRls();
  const { data: membership, error: memErr } = await rls
    .from('organization_users')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (memErr) {
    return NextResponse.json({ ok: false, error: memErr.message }, { status: 500 });
  }
  if (!membership) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz (organization erişimi yok)' }, { status: 403 });
  }

  const supabase = getServiceRoleClient();

  // 2) Exam doğrula (examId → organizationId)
  const { data: exam, error: exErr } = await supabase
    .from('exams')
    .select('id, organization_id, name')
    .eq('id', examId)
    .eq('organization_id', organizationId)
    .single();

  if (exErr || !exam) {
    return NextResponse.json({ ok: false, error: exErr?.message || 'Sınav bulunamadı' }, { status: 404 });
  }

  // 3) Student doğrula (studentId → organizationId)
  const { data: st, error: stErr } = await supabase
    .from('students')
    .select('id, first_name, last_name, student_no, class, section, organization_id')
    .eq('id', studentId)
    .eq('organization_id', organizationId)
    .single();

  if (stErr || !st) {
    return NextResponse.json({ ok: false, error: stErr?.message || 'Öğrenci bulunamadı' }, { status: 404 });
  }

  // 4) Update: sonucu bu öğrenciye bağla
  const { data: updated, error: upErr } = await supabase
    .from('student_exam_results')
    .update({
      student_id: st.id,
      student_no: st.student_no ?? null,
      // class_name'ı öğrenci sınıfına normalize et (varsa)
      class_name: st.class ? `${st.class}${st.section ? `-${st.section}` : ''}` : null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', resultRowId)
    .eq('exam_id', examId)
    .select('id, exam_id, student_id')
    .single();

  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  writeExamAuditLog({
    action: 'UPDATE',
    entityType: 'student_exam_results',
    entityId: updated?.id || resultRowId,
    description: `Misafir sonuç eşleştirildi: resultRowId=${resultRowId} → studentId=${st.id} (${st.first_name || ''} ${st.last_name || ''})`,
    organizationId,
    examId,
    studentId: st.id,
  });

  return NextResponse.json({ ok: true, data: { updated }, meta: { organizationId, examId } }, { status: 200 });
}


