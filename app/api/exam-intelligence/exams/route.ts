import { getServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ exams: [] })
  }

  try {
    const { data: exams } = await supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level, is_published')
      .eq('organization_id', organizationId)
      .order('exam_date', { ascending: false })

    const examIds = (exams || []).map((e: { id: string }) => e.id)

    if (examIds.length === 0) {
      return NextResponse.json({ exams: [] })
    }

    const { data: results } = await supabase
      .from('student_exam_results')
      .select('exam_id, total_net, student_id, student_name')
      .in('exam_id', examIds)

    const agg: Record<string, { sum: number; count: number; students: Set<string> }> = {}

    ;(results || []).forEach((r: any) => {
      const id = r.exam_id as string
      if (!agg[id]) agg[id] = { sum: 0, count: 0, students: new Set<string>() }

      const net = Number(r.total_net) || 0
      agg[id].sum += net
      agg[id].count += 1

      const sid = (r.student_id as string | null) || (r.student_name as string | null)
      if (sid) agg[id].students.add(sid)
    })

    const payload = (exams || []).map((e: any) => {
      const a = agg[e.id] || { sum: 0, count: 0, students: new Set<string>() }
      const avg = a.count > 0 ? Math.round((a.sum / a.count) * 10) / 10 : 0
      return {
        id: e.id,
        name: e.name,
        exam_date: e.exam_date,
        exam_type: e.exam_type,
        grade_level: e.grade_level,
        total_students: a.students.size,
        avg_net: avg,
        is_published: Boolean(e.is_published),
      }
    })

    return NextResponse.json({ exams: payload })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ exams: [] })
  }
}
