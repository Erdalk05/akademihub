'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { GraduationCap, Loader2, TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExportBar } from '@/components/exam-intelligence/ExportBar'
import { ReportHeader } from '@/components/exam-intelligence/ReportHeader'

type SubjectDef = { key: string; code: string; label: string }
type ExamRow = {
  id: string
  name: string
  exam_date: string | null
  exam_type: string | null
  grade_level: string | null
  avg_net: number
  avg_score: number
  student_count: number
  subjects: Record<string, number>
}
type ClassRow = {
  className: string
  student_count: number
  asil_count: number
  misafir_count: number
  avg_net: number
  avg_score: number
  subjects: Record<string, number>
}

type ApiResp = { subjects: SubjectDef[]; exams: ExamRow[]; classes: ClassRow[] }

export default function ClassesPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [subjects, setSubjects] = useState<SubjectDef[]>([])
  const [exams, setExams] = useState<ExamRow[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExamType, setSelectedExamType] = useState<string>('all')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/exam-intelligence/classes/overview?organizationId=${currentOrganization.id}&examType=${encodeURIComponent(selectedExamType)}`
        )
        const json = (await res.json()) as ApiResp
        setSubjects(json.subjects || [])
        setExams(json.exams || [])
        setClasses(json.classes || [])
      } catch (e) {
        console.error(e)
        setError('Sınıf analiz verileri alınamadı.')
        setSubjects([])
        setExams([])
        setClasses([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, selectedExamType])

  const examTypeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const e of exams) if (e.exam_type) set.add(String(e.exam_type))
    const list = Array.from(set)
    // En sık görülenleri öne alalım
    const order = ['LGS', 'TYT', 'AYT', 'DİL', 'DIL', 'MEB']
    list.sort((a, b) => {
      const ai = order.indexOf(a.toUpperCase())
      const bi = order.indexOf(b.toUpperCase())
      if (ai === -1 && bi === -1) return a.localeCompare(b, 'tr')
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    return ['all', ...list]
  }, [exams])

  const classSorted = useMemo(() => {
    return [...(classes || [])].sort((a, b) => (b.avg_net || 0) - (a.avg_net || 0))
  }, [classes])

  const examTrend = useMemo(() => {
    return (exams || []).map((e) => ({
      name: (e.name || '').split(' ').slice(0, 2).join(' '),
      avgScore: Number(e.avg_score || 0),
      avgNet: Number(e.avg_net || 0),
    }))
  }, [exams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" id="ei-class-analytics">
      <div className="print:hidden">
        <ExportBar
          title="Sınıf Analizleri (Tüm Sayfa)"
          mode="server"
          report={{
            organizationId: currentOrganization?.id || '',
            entityType: 'class_list',
            entityId: null,
            section: 'full_page',
          }}
          pdf={{ filename: `Sinif_Analizleri_${new Date().toISOString().slice(0, 10)}.pdf`, elementId: 'ei-class-analytics' }}
          excel={{
            filename: `sinif-analizleri_${currentOrganization?.name || 'kurum'}`,
            sheetName: 'Sınıflar',
            rows: (classSorted || []).map((c: any, i: number) => ({
              sira: i + 1,
              sinif: c.className,
              ogrenci: c.student_count,
              asil: c.asil_count,
              misafir: c.misafir_count,
              ort_net: c.avg_net,
              ort_puan: c.avg_score,
              ...(c.subjects || {}),
            })),
            headers: {
              sira: 'Sıra',
              sinif: 'Sınıf',
              ogrenci: 'Öğrenci',
              asil: 'Asil',
              misafir: 'Misafir',
              ort_net: 'Ort. Net',
              ort_puan: 'Ort. Puan',
            },
          }}
        />
      </div>

      <ReportHeader
        organizationName={currentOrganization?.name || 'Kurum'}
        organizationLogoUrl={currentOrganization?.logo_url}
        title="Sınıf Analizleri"
        subtitle={`${classSorted.length} sınıf • ${exams.length} sınav`}
      />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sınıf Analizleri</h1>
          <p className="text-sm text-gray-600">
            {classSorted.length} sınıf • {exams.length} sınav
          </p>
        </div>

        {/* Exam Type filter */}
        <div className="flex items-center gap-2 bg-white border rounded-2xl p-2">
          {examTypeOptions.slice(0, 6).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedExamType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                selectedExamType === t ? 'bg-[#DCF8C6] text-[#075E54]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'Tümü' : t}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      {/* 1) Sınav dağılımı + trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white font-black flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Sınav Dağılımı (Tüm Sınavlar)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">Sınav</th>
                  {subjects.map((s) => (
                    <th key={s.code} className="text-center px-3 py-3 font-bold whitespace-nowrap">
                      {s.label.toUpperCase()}
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 font-bold whitespace-nowrap">TOPLAM NET</th>
                  <th className="text-center px-3 py-3 font-bold whitespace-nowrap">PUAN ORT.</th>
                </tr>
              </thead>
              <tbody>
                {(exams || []).map((e, idx) => (
                  <tr key={e.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#DCF8C6]/40`}>
                    <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                        <div className="min-w-[180px]">
                          <div className="truncate">{e.name}</div>
                          <div className="text-xs text-gray-500">
                            {(e.exam_type || '-') + ' • ' + (e.exam_date ? new Date(e.exam_date).toLocaleDateString('tr-TR') : '')}
                          </div>
                        </div>
                      </div>
                    </td>
                    {subjects.map((s) => (
                      <td key={s.code} className="px-3 py-3 text-center">
                        <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 font-black text-gray-800">
                          {Number(e.subjects?.[s.code] || 0).toFixed(1)}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black">
                        {Number(e.avg_net || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black">
                        {Number(e.avg_score || 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {exams.length === 0 ? <div className="p-6 text-center text-gray-500">Bu filtrede sınav bulunamadı.</div> : null}
        </div>

        <div className="bg-white rounded-3xl border shadow-sm p-5">
          <div className="font-black text-gray-900 mb-2">Sınav Puan Trendi</div>
          <div className="text-xs text-gray-500 mb-4">Sınavlar sırasıyla ortalama puan değişimi</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} height={55} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#25D366" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2) Sınıf karşılaştırma (ders bazında) */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white font-black flex items-center gap-2">
          <GraduationCap className="w-5 h-5" /> Sınıfların Ders Bazlı Karşılaştırması
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-bold">Sınıf</th>
                {subjects.map((s) => (
                  <th key={s.code} className="text-center px-3 py-3 font-bold whitespace-nowrap">
                    {s.label.toUpperCase()}
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-bold whitespace-nowrap">TOPLAM NET</th>
                <th className="text-center px-3 py-3 font-bold whitespace-nowrap">PUAN ORT.</th>
                <th className="text-center px-3 py-3 font-bold whitespace-nowrap">ASİL/MİSAFİR</th>
              </tr>
            </thead>
            <tbody>
              {classSorted.map((c, idx) => (
                <tr
                  key={c.className}
                  className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#DCF8C6]/50 cursor-pointer`}
                  onClick={() => router.push(`/admin/exam-intelligence/siniflar/${encodeURIComponent(c.className)}`)}
                >
                  <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-black">
                        {idx + 1}
                      </span>
                      <span>{c.className}</span>
                    </div>
                  </td>
                  {subjects.map((s) => (
                    <td key={s.code} className="px-3 py-3 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 font-black text-gray-800">
                        {Number(c.subjects?.[s.code] || 0).toFixed(1)}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black">
                      {Number(c.avg_net || 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black">
                      {Number(c.avg_score || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-xs">Asil: {c.asil_count || 0}</span>
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-black text-xs">Misafir: {c.misafir_count || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {classSorted.length === 0 ? <div className="p-6 text-center text-gray-500">Sınıf verisi bulunamadı.</div> : null}
      </div>
    </div>
  )
}
