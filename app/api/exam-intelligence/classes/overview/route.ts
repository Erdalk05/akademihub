import { getServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { buildStudentIndex, classifyStudent } from '../../_utils/studentMatch'
import { inferSubjectsFromKeys, pickSubjectNetKeys } from '../../_utils/subjects'

export const dynamic = 'force-dynamic'

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const grade = url.searchParams.get('grade') // optional
  const examType = url.searchParams.get('examType') // optional
  const classId = url.searchParams.get('classId') // optional (detay için)

  const empty = {
    subjects: [],
    exams: [],
    classes: [],
    selectedClass: null,
  }

  if (!organizationId) return NextResponse.json(empty)

  try {
    // 1) exams
    let exQ = supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level, is_published')
      .eq('organization_id', organizationId)
      .order('exam_date', { ascending: true })

    if (grade && grade !== 'all') exQ = exQ.eq('grade_level', grade)
    if (examType && examType !== 'all') exQ = exQ.eq('exam_type', examType)

    const { data: exams } = await exQ
    const examIds = (exams || []).map((e: any) => e.id)

    if (examIds.length === 0) return NextResponse.json(empty)

    // 2) students (asil/misafir için)
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'deleted')
      .limit(3000)
    const studentIndex = buildStudentIndex(students || [])

    // 3) results (select * -> ders kolonları için)
    let resQ = supabase
      .from('student_exam_results')
      .select('*')
      .in('exam_id', examIds)

    if (classId) {
      // classId route paramı sınıf adı gibi geliyor (örn 8-A)
      resQ = resQ.eq('class_name', decodeURIComponent(classId))
    }

    const { data: resultsRaw } = await resQ
    const results = (resultsRaw as any[]) || []

    const subjectNetKeys = pickSubjectNetKeys(results[0])
    const subjects = inferSubjectsFromKeys(subjectNetKeys)

    // helpers
    const studentKey = (r: any) => String(r.student_id || r.student_no || r.student_name || '')

    // 4) exam aggregations
    const byExam: Record<string, { count: number; sumNet: number; sumScore: number; subjects: Record<string, { sum: number; count: number }> }> = {}
    for (const r of results) {
      const eid = r.exam_id as string
      if (!eid) continue
      if (!byExam[eid]) byExam[eid] = { count: 0, sumNet: 0, sumScore: 0, subjects: {} }
      byExam[eid].count += 1
      byExam[eid].sumNet += Number(r.total_net) || 0
      byExam[eid].sumScore += Number(r.total_score) || 0
      for (const s of subjects) {
        const v = Number(r[s.key]) || 0
        if (!byExam[eid].subjects[s.code]) byExam[eid].subjects[s.code] = { sum: 0, count: 0 }
        byExam[eid].subjects[s.code].sum += v
        byExam[eid].subjects[s.code].count += 1
      }
    }

    const examsOut = (exams || []).map((e: any) => {
      const a = byExam[e.id] || { count: 0, sumNet: 0, sumScore: 0, subjects: {} }
      const avgNet = a.count ? round1(a.sumNet / a.count) : 0
      const avgScore = a.count ? round1(a.sumScore / a.count) : 0
      const subj: Record<string, number> = {}
      for (const s of subjects) {
        const x = a.subjects[s.code] || { sum: 0, count: 0 }
        subj[s.code] = x.count ? round1(x.sum / x.count) : 0
      }
      return {
        id: e.id,
        name: e.name,
        exam_date: e.exam_date,
        exam_type: e.exam_type,
        grade_level: e.grade_level,
        is_published: Boolean(e.is_published),
        avg_net: avgNet,
        avg_score: avgScore,
        student_count: a.count,
        subjects: subj,
      }
    })

    // 5) class aggregations (global only if classId not provided)
    let classesOut: any[] = []
    if (!classId) {
      const byClass: Record<string, { count: number; sumNet: number; sumScore: number; subjects: Record<string, { sum: number; count: number }>; asil: Set<string>; misafir: Set<string> }> = {}
      for (const r of resultsRaw as any[]) {
        const cn = String(r.class_name || 'Belirsiz')
        if (!byClass[cn]) byClass[cn] = { count: 0, sumNet: 0, sumScore: 0, subjects: {}, asil: new Set(), misafir: new Set() }
        byClass[cn].count += 1
        byClass[cn].sumNet += Number(r.total_net) || 0
        byClass[cn].sumScore += Number(r.total_score) || 0

        const sid = studentKey(r)
        const cls = classifyStudent(studentIndex, { student_id: r.student_id, student_no: r.student_no, student_name: r.student_name, tc: r.tc_no || r.tc_id || null })
        if (sid) {
          if (cls.studentType === 'asil') byClass[cn].asil.add(sid)
          else byClass[cn].misafir.add(sid)
        }

        for (const s of subjects) {
          const v = Number(r[s.key]) || 0
          if (!byClass[cn].subjects[s.code]) byClass[cn].subjects[s.code] = { sum: 0, count: 0 }
          byClass[cn].subjects[s.code].sum += v
          byClass[cn].subjects[s.code].count += 1
        }
      }

      classesOut = Object.entries(byClass)
        .map(([className, a]) => {
          const subj: Record<string, number> = {}
          for (const s of subjects) {
            const x = a.subjects[s.code] || { sum: 0, count: 0 }
            subj[s.code] = x.count ? round1(x.sum / x.count) : 0
          }
          return {
            className,
            student_count: a.count,
            asil_count: a.asil.size,
            misafir_count: a.misafir.size,
            avg_net: a.count ? round1(a.sumNet / a.count) : 0,
            avg_score: a.count ? round1(a.sumScore / a.count) : 0,
            subjects: subj,
          }
        })
        .sort((a, b) => (b.avg_net || 0) - (a.avg_net || 0))
    }

    // 6) selectedClass (detay)
    let selectedClassOut: any = null
    if (classId) {
      const className = decodeURIComponent(classId)
      // asil/misafir counts in this class
      const asil = new Set<string>()
      const misafir = new Set<string>()
      const perStudent: Record<
        string,
        {
          key: string
          student_id: string | null
          student_no: string | null
          student_name: string | null
          type: 'asil' | 'misafir'
          sumNet: number
          sumScore: number
          count: number
        }
      > = {}
      for (const r of results) {
        const sid = studentKey(r)
        const cls = classifyStudent(studentIndex, { student_id: r.student_id, student_no: r.student_no, student_name: r.student_name, tc: r.tc_no || r.tc_id || null })
        if (sid) {
          if (cls.studentType === 'asil') asil.add(sid)
          else misafir.add(sid)
        }

        const k = sid || `${r.student_name || 'Bilinmiyor'}`
        if (!perStudent[k]) {
          perStudent[k] = {
            key: k,
            student_id: r.student_id ? String(r.student_id) : null,
            student_no: r.student_no ? String(r.student_no) : null,
            student_name: r.student_name ? String(r.student_name) : null,
            type: cls.studentType,
            sumNet: 0,
            sumScore: 0,
            count: 0,
          }
        }
        perStudent[k].sumNet += Number(r.total_net) || 0
        perStudent[k].sumScore += Number(r.total_score) || 0
        perStudent[k].count += 1
      }

      // per exam for this class
      const byExamLocal: Record<string, { count: number; sumNet: number; sumScore: number; subjects: Record<string, { sum: number; count: number }> }> = {}
      for (const r of results) {
        const eid = r.exam_id as string
        if (!eid) continue
        if (!byExamLocal[eid]) byExamLocal[eid] = { count: 0, sumNet: 0, sumScore: 0, subjects: {} }
        byExamLocal[eid].count += 1
        byExamLocal[eid].sumNet += Number(r.total_net) || 0
        byExamLocal[eid].sumScore += Number(r.total_score) || 0
        for (const s of subjects) {
          const v = Number(r[s.key]) || 0
          if (!byExamLocal[eid].subjects[s.code]) byExamLocal[eid].subjects[s.code] = { sum: 0, count: 0 }
          byExamLocal[eid].subjects[s.code].sum += v
          byExamLocal[eid].subjects[s.code].count += 1
        }
      }

      const timeline = (exams || [])
        .map((e: any) => {
          const a = byExamLocal[e.id] || { count: 0, sumNet: 0, sumScore: 0, subjects: {} }
          const subj: Record<string, number> = {}
          for (const s of subjects) {
            const x = a.subjects[s.code] || { sum: 0, count: 0 }
            subj[s.code] = x.count ? round1(x.sum / x.count) : 0
          }
          return {
            id: e.id,
            name: e.name,
            exam_date: e.exam_date,
            exam_type: e.exam_type,
            grade_level: e.grade_level,
            avg_net: a.count ? round1(a.sumNet / a.count) : 0,
            avg_score: a.count ? round1(a.sumScore / a.count) : 0,
            student_count: a.count,
            subjects: subj,
          }
        })
        .filter((x) => x.student_count > 0)

      // overall subject averages for class
      const subjOverall: Record<string, number> = {}
      for (const s of subjects) {
        const vals = results.map((r) => Number(r[s.key]) || 0)
        subjOverall[s.code] = vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      }

      selectedClassOut = {
        className,
        asil_count: asil.size,
        misafir_count: misafir.size,
        exams_count: timeline.length,
        avg_net: results.length ? round1(results.reduce((a, r) => a + (Number(r.total_net) || 0), 0) / results.length) : 0,
        avg_score: results.length ? round1(results.reduce((a, r) => a + (Number(r.total_score) || 0), 0) / results.length) : 0,
        subject_averages: subjOverall,
        timeline,
        top_students: Object.values(perStudent)
          .map((s) => ({
            student_id: s.student_id,
            student_no: s.student_no,
            student_name: s.student_name || 'Bilinmiyor',
            student_type: s.type,
            avg_net: s.count ? round1(s.sumNet / s.count) : 0,
            avg_score: s.count ? round1(s.sumScore / s.count) : 0,
            exam_count: s.count,
          }))
          .sort((a, b) => (b.avg_net || 0) - (a.avg_net || 0))
          .slice(0, 50),
      }
    }

    return NextResponse.json({ subjects, exams: examsOut, classes: classesOut, selectedClass: selectedClassOut })
  } catch (e) {
    console.error(e)
    return NextResponse.json(empty)
  }
}
