import { getServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { buildStudentIndex, classifyStudent } from '../../_utils/studentMatch'
import { inferSubjectsFromKeys, pickSubjectNetKeys } from '../../_utils/subjects'

export const dynamic = 'force-dynamic'

function stdDev(values: number[]) {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / values.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}

export async function GET(request: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const examId = params.examId

  const emptyData = {
    exam: null,
    stats: { totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0 },
    subjects: [],
    subjectAverages: {},
    classComparison: [],
    topStudents: [],
  }

  if (!organizationId) {
    return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 })
  }

  try {
    const { data: exam } = await supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level')
      .eq('organization_id', organizationId)
      .eq('id', examId)
      .single()

    if (!exam) {
      return NextResponse.json({ ok: false, error: 'Sınav bulunamadı' }, { status: 404 })
    }

    const { data: results } = await supabase
      .from('student_exam_results')
      .select('*')
      .eq('exam_id', examId)

    const rows = results || []
    const nets = rows.map((r: any) => Number(r.total_net) || 0)

    // öğrenci index (asil/misafir)
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'deleted')
      .limit(2000)
    const studentIndex = buildStudentIndex(students || [])

    // ders kolonları
    const subjectNetKeys = pickSubjectNetKeys(rows[0])
    const subjects = inferSubjectsFromKeys(subjectNetKeys)

    const unique = new Set<string>()
    rows.forEach((r: any) => {
      const sid = (r.student_id as string | null) || (r.student_name as string | null)
      if (sid) unique.add(sid)
    })

    const avgNet = nets.length ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 10) / 10 : 0
    const maxNet = nets.length ? Math.max(...nets) : 0

    const classAgg: Record<string, { sum: number; count: number }> = {}
    rows.forEach((r: any) => {
      const cn = r.class_name || 'Belirsiz'
      if (!classAgg[cn]) classAgg[cn] = { sum: 0, count: 0 }
      classAgg[cn].sum += Number(r.total_net) || 0
      classAgg[cn].count += 1
    })

    const classComparison = Object.entries(classAgg)
      .map(([className, a]) => ({
        className,
        avgNet: a.count ? Math.round((a.sum / a.count) * 10) / 10 : 0,
        studentCount: a.count,
      }))
      .sort((a, b) => b.avgNet - a.avgNet)

    const topStudents = [...rows]
      .sort((a: any, b: any) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0))
      .slice(0, 10)
      .map((r: any, i: number) => ({
        id: r.student_id || r.student_name || String(i),
        name: r.student_name || 'Bilinmiyor',
        class: r.class_name || '-',
        net: Number(r.total_net) || 0,
        rank: i + 1,
        studentType: classifyStudent(studentIndex, { student_id: r.student_id, student_no: r.student_no, student_name: r.student_name, tc: r.tc_no || r.tc_id || null }).studentType,
        subjects: Object.fromEntries(subjects.map((sub) => [sub.code, Number(r[sub.key]) || 0])),
      }))

    const subjectAverages: Record<string, number> = {}
    for (const sub of subjects) {
      const vals = rows.map((r: any) => Number(r[sub.key]) || 0)
      subjectAverages[sub.code] = vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0
    }

    return NextResponse.json({
      ok: true,
      data: {
        exam,
        stats: { totalStudents: unique.size, avgNet, maxNet, stdDev: stdDev(nets) },
        subjects,
        subjectAverages,
        classComparison,
        topStudents,
      },
      meta: { organizationId, examId }
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
  }
}
