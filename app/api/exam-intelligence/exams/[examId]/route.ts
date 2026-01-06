import { NextRequest, NextResponse } from 'next/server'
import { buildStudentIndex, classifyStudent } from '../../_utils/studentMatch'
import { inferSubjectsFromKeys, pickSubjectNetKeys } from '../../_utils/subjects'
import { getSupabaseRls } from '../../_utils/supabaseRls'
import type { ExamDetailContractV1, NetHistogramBucket } from '@/types/exam-detail-contract'

export const dynamic = 'force-dynamic'

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function histogram5(values: number[]): NetHistogramBucket[] {
  const buckets: Array<{ label: string; min: number; max: number | null }> = [
    { label: '0-20', min: 0, max: 20 },
    { label: '20-40', min: 20, max: 40 },
    { label: '40-60', min: 40, max: 60 },
    { label: '60-80', min: 60, max: 80 },
    { label: '80+', min: 80, max: null },
  ]
  const total = values.length || 1
  return buckets.map((b) => {
    const count =
      b.max === null
        ? values.filter((v) => v >= b.min).length
        : values.filter((v) => v >= b.min && v < b.max).length
    return {
      ...b,
      count,
      percentage: Math.round((count / total) * 100),
    }
  })
}

function stdDev(values: number[]) {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / values.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}

export async function GET(request: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = getSupabaseRls()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const includeAnswerKey = url.searchParams.get('includeAnswerKey') === '1'
  const includeStudents = url.searchParams.get('includeStudents') !== '0'
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
    const select = includeAnswerKey
      ? 'id, name, exam_date, exam_type, grade_level, booklets, answer_key'
      : 'id, name, exam_date, exam_type, grade_level'

    const { data: exam } = await supabase
      .from('exams')
      .select(select)
      .eq('organization_id', organizationId)
      .eq('id', examId)
      .single()

    if (!exam) {
      return NextResponse.json({ ok: false, error: 'Sınav bulunamadı' }, { status: 404 })
    }

    // Drawer için opsiyonel: kitapçıklar + cevap anahtarı
    const bookletsRaw = includeAnswerKey && Array.isArray((exam as any)?.booklets) ? (exam as any).booklets : []
    const booklets = bookletsRaw
      .map((b: any) => String(b).toUpperCase())
      .filter((b: string) => b === 'A' || b === 'B' || b === 'C' || b === 'D')

    const answerKey = includeAnswerKey && Array.isArray((exam as any)?.answer_key) ? (exam as any).answer_key : []

    const { data: results } = await supabase
      .from('student_exam_results')
      .select('*')
      .eq('exam_id', examId)

    const rows = results || []
    const nets = rows.map((r: any) => Number(r.total_net) || 0)
    const corrects = rows.map((r: any) => Number(r.total_correct ?? r.correct ?? 0) || 0)
    const wrongs = rows.map((r: any) => Number(r.total_wrong ?? r.wrong ?? 0) || 0)
    const blanks = rows.map((r: any) => Number(r.total_empty ?? r.total_blank ?? 0) || 0)

    // öğrenci index (asil/misafir)
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'deleted')
      .limit(2000)
    const studentIndex = buildStudentIndex(students || [])

    // Snapshot (exam_student_analytics) varsa asil öğrenciler için prefer et (hesapla-oku modeli)
    // Misafirler legacy student_exam_results üzerinden devam eder.
    const { data: snapshots } = await supabase
      .from('exam_student_analytics')
      .select('student_id, student_no, student_name, class_name, total_net, total_correct, total_wrong, total_empty, rank_in_exam, rank_in_class, percentile, subject_performance')
      .eq('exam_id', examId)
      .eq('organization_id', organizationId)
      .limit(5000)

    const snapRows = (snapshots as any[]) || []

    // ders kolonları (legacy veya snapshot üzerinden)
    const subjectNetKeys = pickSubjectNetKeys(rows[0])
    let subjects = inferSubjectsFromKeys(subjectNetKeys)
    if ((!subjects || subjects.length === 0) && snapRows.length > 0) {
      const first = snapRows[0]?.subject_performance || {}
      const codes = Object.keys(first)
      subjects = codes.map((code) => ({ code, label: code, key: `${code}_net` })) as any
    }

    const unique = new Set<string>()
    rows.forEach((r: any) => {
      const sid = (r.student_id as string | null) || (r.student_name as string | null)
      if (sid) unique.add(sid)
    })

    const avgNet = nets.length ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 10) / 10 : 0
    const maxNet = nets.length ? Math.max(...nets) : 0
    const minNet = nets.length ? Math.min(...nets) : 0

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

    // Yeni tek sözleşme (contract) — UI + export için stabilize
    const warnings: string[] = []
    if (!includeStudents) warnings.push('includeStudents=0: öğrenci listesi istemciye gönderilmedi')

    const studentRows = includeStudents
      ? [...rows]
          .sort((a: any, b: any) => (Number(b.total_net) || 0) - (Number(a.total_net) || 0))
          .map((r: any, idx: number) => {
            const cls = classifyStudent(studentIndex, {
              student_id: r.student_id,
              student_no: r.student_no,
              student_name: r.student_name,
              tc: r.tc_no || r.tc_id || r.tckn || null,
            })
            return {
              rowId: String(r.id || r.student_id || r.student_no || `${idx}`),
              studentId: r.student_id ? String(r.student_id) : null,
              studentNo: r.student_no ? String(r.student_no) : null,
              fullName: String(r.student_name || 'Bilinmiyor'),
              className: r.class_name ? String(r.class_name) : null,
              studentType: cls.studentType,
              totalCorrect: Number(r.total_correct ?? r.totalDogru ?? 0) || 0,
              totalWrong: Number(r.total_wrong ?? r.totalYanlis ?? 0) || 0,
              totalBlank: Number(r.total_empty ?? r.totalBos ?? 0) || 0,
              totalNet: Number(r.total_net) || 0,
              totalScore: r.total_score !== null && r.total_score !== undefined ? Number(r.total_score) : null,
              rankSchool: typeof r.general_rank === 'number' ? Number(r.general_rank) : idx + 1,
              rankClass: r.class_rank !== null && r.class_rank !== undefined ? Number(r.class_rank) : null,
              subjectNets: Object.fromEntries(subjects.map((sub) => [sub.code, Number(r[sub.key]) || 0])),
            }
          })
      : []

    // Snapshot asil öğrencileri ile legacy misafirleri merge et
    let finalStudentRows = studentRows as any[]
    let contractSource: ExamDetailContractV1['meta']['source'] = 'legacy_student_exam_results'

    if (includeStudents && snapRows.length > 0) {
      const byStudentId = new Map<string, any>()
      for (const s of studentRows as any[]) {
        if (s.studentId) byStudentId.set(String(s.studentId), s)
      }
      for (const sr of snapRows) {
        const sid = String(sr.student_id || '')
        if (!sid) continue
        // legacy’de aynı studentId varsa onu override et (daha doğru source: snapshot)
        const subjectPerf = sr.subject_performance || {}
        const subjectNets = Object.fromEntries(
          (subjects as any[]).map((sub) => [sub.code, Number(subjectPerf?.[sub.code]?.net ?? 0)]),
        )
        const row = {
          rowId: sid,
          studentId: sid,
          studentNo: sr.student_no ? String(sr.student_no) : null,
          fullName: String(sr.student_name || 'Bilinmiyor'),
          className: sr.class_name ? String(sr.class_name) : null,
          studentType: 'asil',
          totalCorrect: Number(sr.total_correct ?? 0) || 0,
          totalWrong: Number(sr.total_wrong ?? 0) || 0,
          totalBlank: Number(sr.total_empty ?? 0) || 0,
          totalNet: Number(sr.total_net ?? 0) || 0,
          totalScore: null,
          rankSchool: sr.rank_in_exam !== null && sr.rank_in_exam !== undefined ? Number(sr.rank_in_exam) : null,
          rankClass: sr.rank_in_class !== null && sr.rank_in_class !== undefined ? Number(sr.rank_in_class) : null,
          subjectNets,
        }
        byStudentId.set(sid, row)
      }
      // final: map values + misafirleri de dahil (legacy misafirlerde studentId null)
      const misafir = (studentRows as any[]).filter((s) => s.studentType === 'misafir')
      const asil = Array.from(byStudentId.values())
      finalStudentRows = [...asil, ...misafir]
      contractSource = misafir.length ? 'mixed' : 'exam_student_analytics'
    }

    // Finans özeti (asil öğrenciler için) — finance_installments
    const asilStudentIds = Array.from(
      new Set(
        (finalStudentRows as any[])
          .filter((s) => s.studentType === 'asil' && s.studentId)
          .map((s) => String(s.studentId)),
      ),
    )

    const financeByStudentId: Record<
      string,
      { totalAmount: number; paidAmount: number; balance: number; overdueCount: number; pendingCount: number }
    > = {}

    if (asilStudentIds.length > 0) {
      const today = new Date().toISOString().slice(0, 10)

      const { data: instRows } = await supabase
        .from('finance_installments')
        .select('student_id, amount, paid_amount, is_paid, due_date, status')
        .eq('organization_id', organizationId)
        .in('student_id', asilStudentIds)

      for (const row of (instRows as any[]) || []) {
        const sid = String(row.student_id || '')
        if (!sid) continue
        if (!financeByStudentId[sid]) {
          financeByStudentId[sid] = { totalAmount: 0, paidAmount: 0, balance: 0, overdueCount: 0, pendingCount: 0 }
        }
        const amount = Number(row.amount) || 0
        const paidAmount = row.paid_amount !== null && row.paid_amount !== undefined ? Number(row.paid_amount) : (row.is_paid ? amount : 0)
        financeByStudentId[sid].totalAmount += amount
        financeByStudentId[sid].paidAmount += paidAmount

        const isPaid = Boolean(row.is_paid)
        if (!isPaid) {
          financeByStudentId[sid].pendingCount += 1
          const status = String(row.status || 'active')
          const dueDate = row.due_date ? String(row.due_date) : null
          const isCancelled = status === 'cancelled' || status === 'void' || status === 'deleted'
          if (!isCancelled && dueDate && dueDate < today) {
            financeByStudentId[sid].overdueCount += 1
          }
        }
      }

      // finalize balance
      for (const sid of Object.keys(financeByStudentId)) {
        financeByStudentId[sid].balance = financeByStudentId[sid].totalAmount - financeByStudentId[sid].paidAmount
      }

      // attach to student rows
      for (const s of finalStudentRows as any[]) {
        if (s.studentType !== 'asil' || !s.studentId) continue
        const fin = financeByStudentId[String(s.studentId)]
        if (fin) s.finance = fin
      }
    }

    // AI snapshot (role=teacher) — hazırsa oku, değilse pending/failed durumunu yansıt
    if (includeStudents) {
      const asilIds = Array.from(
        new Set((finalStudentRows as any[]).filter((s) => s.studentType === 'asil' && s.studentId).map((s) => String(s.studentId))),
      );
      if (asilIds.length > 0) {
        const { data: aiRows } = await supabase
          .from('exam_student_ai_snapshots')
          .select('student_id, status, message, confidence_score, source, updated_at')
          .eq('exam_id', examId)
          .eq('role', 'teacher')
          .in('student_id', asilIds);

        const aiByStudentId: Record<string, any> = {};
        for (const r of (aiRows as any[]) || []) {
          const sid = String(r.student_id || '');
          if (!sid) continue;
          aiByStudentId[sid] = r;
        }

        for (const s of finalStudentRows as any[]) {
          if (s.studentType !== 'asil' || !s.studentId) continue;
          const a = aiByStudentId[String(s.studentId)];
          if (!a) {
            s.ai = { status: 'not_configured' };
            continue;
          }
          if (a.status === 'ready') {
            s.ai = { status: 'ready', summary: a.message || undefined, confidenceScore: a.confidence_score ?? undefined, source: a.source ?? undefined, updatedAt: a.updated_at ?? undefined };
          } else if (a.status === 'computing') {
            s.ai = { status: 'pending' };
          } else if (a.status === 'failed') {
            s.ai = { status: 'failed' };
          } else {
            s.ai = { status: 'not_configured' };
          }
        }
      }
    }

    const contract: ExamDetailContractV1 = {
      version: 'v1',
      meta: {
        organizationId,
        examId,
        generatedAt: new Date().toISOString(),
        source: contractSource,
        warnings,
      },
      exam: {
        id: (exam as any).id,
        name: (exam as any).name,
        examDate: (exam as any).exam_date ?? null,
        examType: (exam as any).exam_type ?? null,
        gradeLevel: (exam as any).grade_level ?? null,
        ...(includeAnswerKey ? { booklets } : {}),
      },
      summary: {
        participantCount: includeStudents ? finalStudentRows.length : unique.size,
        asilCount: finalStudentRows.filter((s: any) => s.studentType === 'asil').length,
        misafirCount: finalStudentRows.filter((s: any) => s.studentType === 'misafir').length,
        avgNet,
        minNet,
        maxNet,
        medianNet: Math.round(median(nets) * 10) / 10,
        stdDev: stdDev(nets),
      },
      distributions: {
        netHistogram: histogram5(nets),
        avgCorrect: corrects.length ? Math.round((corrects.reduce((a, b) => a + b, 0) / corrects.length) * 10) / 10 : 0,
        avgWrong: wrongs.length ? Math.round((wrongs.reduce((a, b) => a + b, 0) / wrongs.length) * 10) / 10 : 0,
        avgBlank: blanks.length ? Math.round((blanks.reduce((a, b) => a + b, 0) / blanks.length) * 10) / 10 : 0,
      },
      subjects,
      classComparison,
      students: finalStudentRows as any,
    }

    // Backward compatibility: eski UI alanları + yeni contract birlikte
    return NextResponse.json({
      ok: true,
      data: {
        // legacy shape (mevcut UI bozmayalım)
        exam: {
          id: (exam as any).id,
          name: (exam as any).name,
          exam_date: (exam as any).exam_date,
          exam_type: (exam as any).exam_type,
          grade_level: (exam as any).grade_level,
          ...(includeAnswerKey ? { booklets } : {}),
        },
        ...(includeAnswerKey ? { answerKey } : {}),
        stats: { totalStudents: unique.size, avgNet, maxNet, stdDev: stdDev(nets) },
        subjects,
        subjectAverages,
        classComparison,
        topStudents,
        // new contract
        contract,
      },
      meta: { organizationId, examId },
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 })
  }
}
