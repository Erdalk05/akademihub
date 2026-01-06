import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRls } from '../_utils/supabaseRls'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getSupabaseRls()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')

  // org opsiyonel; schema görmek için allow
  try {
    const out: any = {
      students: { sampleKeys: [], sample: null },
      student_exam_results: { sampleKeys: [], sample: null },
      detected: { studentTcKeys: [] as string[], studentNoKeys: [] as string[], examSubjectNetKeys: [] as string[] },
    }

    // students sample
    {
      let q = supabase.from('students').select('*').limit(1)
      if (organizationId) q = q.eq('organization_id', organizationId)
      const { data } = await q
      const row = (data || [])[0] || null
      out.students.sample = row
      out.students.sampleKeys = row ? Object.keys(row) : []

      const keys = out.students.sampleKeys as string[]
      out.detected.studentTcKeys = keys.filter((k) => /(^tc(_|)id$)|(^tc(_|)no$)|tckn|kimlik/i.test(k))
      out.detected.studentNoKeys = keys.filter((k) => /student_no|ogrenci_no|ogrenciNo|school_no|okulNo/i.test(k))
    }

    // student_exam_results sample
    {
      // Not: student_exam_results tablosunda organization_id olmayabilir. Bu yüzden orgId varsa önce org'a ait 1 exam bulup onun üzerinden sample alıyoruz.
      let examId: string | null = null
      if (organizationId) {
        const { data: ex } = await supabase
          .from('exams')
          .select('id')
          .eq('organization_id', organizationId)
          .order('exam_date', { ascending: false })
          .limit(1)
        examId = (ex || [])[0]?.id || null
      }

      let q = supabase.from('student_exam_results').select('*').limit(1)
      if (examId) q = q.eq('exam_id', examId)
      const { data } = await q
      const row = (data || [])[0] || null
      out.student_exam_results.sample = row
      out.student_exam_results.sampleKeys = row ? Object.keys(row) : []

      const keys = out.student_exam_results.sampleKeys as string[]
      // Ders netlerini tespit: *_net ama total_net hariç
      out.detected.examSubjectNetKeys = keys
        .filter((k) => /net/i.test(k))
        .filter((k) => k !== 'total_net')
        .filter((k) => /_net$/.test(k) || /(turk|mat|fen|sos|ing|din|ink)/i.test(k))
    }

    return NextResponse.json(out)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ students: { sampleKeys: [] }, student_exam_results: { sampleKeys: [] } })
  }
}
