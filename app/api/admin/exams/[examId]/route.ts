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
    await supabase.from('student_exam_results').delete().eq('exam_id', examId)

    // 2) student_test_results (varsa)
    await supabase.from('student_test_results').delete().eq('exam_id', examId)

    // 3) booklet_answer_keys (yeni mimari)
    await supabase.from('booklet_answer_keys').delete().eq('exam_id', examId)

    // 4) exam_tests
    await supabase.from('exam_tests').delete().eq('exam_id', examId)

    // 5) exam_audit_log (opsiyonel)
    await supabase.from('exam_audit_log').delete().eq('exam_id', examId)

    // 6) exams
    const { error: examError } = await supabase.from('exams').delete().eq('id', examId)

    if (examError) {
      console.error('[admin exam delete] exam delete error:', examError)
      return NextResponse.json({ ok: false, error: 'Sınav silinemedi' }, { status: 200 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('[admin exam delete] unexpected:', e)
    return NextResponse.json({ ok: false, error: 'Beklenmeyen hata' }, { status: 200 })
  }
}
