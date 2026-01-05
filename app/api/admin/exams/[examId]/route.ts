import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/exams/:examId
// Not: Service role ile çalışır. Exam Intelligence tarafında hızlı silme için.
export async function DELETE(_request: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = getServiceRoleClient()
  const examId = params.examId

  if (!examId) {
    return NextResponse.json({ ok: false, error: 'examId gerekli' }, { status: 400 })
  }

  try {
    // 1) student_exam_results
    const r1 = await supabase.from('student_exam_results').delete().eq('exam_id', examId)
    if (r1.error) {
      console.error('[admin exam delete] student_exam_results delete error:', r1.error)
      return NextResponse.json({ ok: false, error: 'Öğrenci sınav sonuçları silinemedi' }, { status: 500 })
    }

    // 2) student_test_results (varsa)
    const r2 = await supabase.from('student_test_results').delete().eq('exam_id', examId)
    if (r2.error) {
      console.error('[admin exam delete] student_test_results delete error:', r2.error)
      return NextResponse.json({ ok: false, error: 'Öğrenci test sonuçları silinemedi' }, { status: 500 })
    }

    // 3) booklet_answer_keys (yeni mimari)
    const r3 = await supabase.from('booklet_answer_keys').delete().eq('exam_id', examId)
    if (r3.error) {
      console.error('[admin exam delete] booklet_answer_keys delete error:', r3.error)
      return NextResponse.json({ ok: false, error: 'Cevap anahtarları silinemedi' }, { status: 500 })
    }

    // 4) exam_tests
    const r4 = await supabase.from('exam_tests').delete().eq('exam_id', examId)
    if (r4.error) {
      console.error('[admin exam delete] exam_tests delete error:', r4.error)
      return NextResponse.json({ ok: false, error: 'Sınav testleri silinemedi' }, { status: 500 })
    }

    // 5) exam_audit_log (opsiyonel)
    const r5 = await supabase.from('exam_audit_log').delete().eq('exam_id', examId)
    if (r5.error) {
      console.warn('[admin exam delete] exam_audit_log delete error:', r5.error)
      // audit log kritik değil, devam
    }

    // 6) exams
    const { error: examError } = await supabase.from('exams').delete().eq('id', examId)

    if (examError) {
      console.error('[admin exam delete] exam delete error:', examError)
      return NextResponse.json({ ok: false, error: 'Sınav silinemedi' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('[admin exam delete] unexpected:', e)
    return NextResponse.json({ ok: false, error: 'Beklenmeyen hata' }, { status: 500 })
  }
}
