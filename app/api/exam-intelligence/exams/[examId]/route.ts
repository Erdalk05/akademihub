import { getServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  const empty = {
    exam: null,
    stats: { totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0 },
    subjectAverages: { turkce: 0, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0 },
    classComparison: [],
    topStudents: [],
  }

  if (!organizationId) return NextResponse.json(empty)

  try {
    const { data: exam } = await supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level')
      .eq('organization_id', organizationId)
      .eq('id', examId)
      .single()

    if (!exam) return NextResponse.json(empty)

    const { data: results } = await supabase
      .from('student_exam_results')
      .select('student_id, student_name, class_name, total_net')
      .eq('exam_id', examId)

    const rows = results || []
    const nets = rows.map((r: any) => Number(r.total_net) || 0)

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
      }))

    return NextResponse.json({
      exam,
      stats: { totalStudents: unique.size, avgNet, maxNet, stdDev: stdDev(nets) },
      subjectAverages: { turkce: 0, matematik: 0, fen: 0, sosyal: 0, ingilizce: 0 },
      classComparison,
      topStudents,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(empty)
  }
}
