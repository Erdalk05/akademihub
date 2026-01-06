import { NextRequest, NextResponse } from 'next/server'
import { buildStudentIndex, classifyStudent } from '../_utils/studentMatch'
import { getSupabaseRls } from '../_utils/supabaseRls'

// ✅ Cache tamamen kapalı
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const supabase = getSupabaseRls()
  const url = new URL(request.url)
  // ✅ Sadece query param'dan al, başka yerden override yok
  const organizationId = url.searchParams.get('organizationId')

  // 🔍 DEBUG: gelen organizationId
  console.log('[exam-intelligence/exams] organizationId:', organizationId)

  if (!organizationId) {
    console.log('[exam-intelligence/exams] organizationId yok')
    return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 })
  }

  try {
    // ✅ TÜM FİLTRELER KALDIRILDI - Sadece organization_id eşleşmesi
    // status, is_published, is_deleted, academic_year vs. YOK
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*')  // Tüm kolonları al (debug için)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    console.log('[exam-intelligence/exams] exams count:', exams?.length ?? 0)
    if (examsError) {
      console.error('[exam-intelligence/exams] exams query error:', examsError)
      return NextResponse.json({ ok: false, error: examsError.message }, { status: 500 })
    }

    // Erken dönüş: sınav yoksa
    if (!exams || exams.length === 0) {
      console.log('[exam-intelligence/exams] Sınav bulunamadı')
      return NextResponse.json({ 
        ok: true, 
        data: { exams: [] }, 
        meta: { organizationId, count: 0 } 
      })
    }

    // Öğrenci listesi (asil/misafir sınıflandırması için)
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'deleted')
      .limit(2000)
    const studentIndex = buildStudentIndex(students || [])

    const examIds = exams.map((e: { id: string }) => e.id)

    const { data: results } = await supabase
      .from('student_exam_results')
      .select('exam_id, total_net, student_id, student_name')
      .in('exam_id', examIds)

    const agg: Record<string, { sum: number; count: number; students: Set<string> }> = {}
    const aggAsil: Record<string, { students: Set<string> }> = {}
    const aggMisafir: Record<string, { students: Set<string> }> = {}

    ;(results || []).forEach((r: any) => {
      const id = r.exam_id as string
      if (!agg[id]) agg[id] = { sum: 0, count: 0, students: new Set<string>() }
      if (!aggAsil[id]) aggAsil[id] = { students: new Set<string>() }
      if (!aggMisafir[id]) aggMisafir[id] = { students: new Set<string>() }

      const net = Number(r.total_net) || 0
      agg[id].sum += net
      agg[id].count += 1

      const sid = (r.student_id as string | null) || (r.student_name as string | null)
      if (sid) agg[id].students.add(sid)

      const cls = classifyStudent(studentIndex, { student_id: r.student_id, student_name: r.student_name })
      if (sid) {
        if (cls.studentType === 'asil') aggAsil[id].students.add(sid)
        else aggMisafir[id].students.add(sid)
      }
    })

    const payload = exams.map((e: any) => {
      const a = agg[e.id] || { sum: 0, count: 0, students: new Set<string>() }
      const avg = a.count > 0 ? Math.round((a.sum / a.count) * 10) / 10 : 0
      const asilCount = (aggAsil[e.id]?.students.size || 0)
      const misafirCount = (aggMisafir[e.id]?.students.size || 0)

      const bookletsRaw = Array.isArray(e.booklets) ? e.booklets : []
      const booklets = bookletsRaw
        .map((b: any) => String(b).toUpperCase())
        .filter((b: string) => b === 'A' || b === 'B' || b === 'C' || b === 'D')

      return {
        id: e.id,
        name: e.name,
        exam_date: e.exam_date,
        exam_type: e.exam_type,
        grade_level: e.grade_level,
        booklets,
        total_students: a.students.size,
        asil_students: asilCount,
        misafir_students: misafirCount,
        avg_net: avg,
        is_published: Boolean(e.is_published),
      }
    })

    console.log('[exam-intelligence/exams] Sonuç:', payload.length, 'sınav')

    return NextResponse.json({ 
      ok: true,
      data: { exams: payload },
      meta: { organizationId, count: payload.length }
    })
  } catch (e: any) {
    console.error('[exam-intelligence/exams] HATA:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
  }
}
