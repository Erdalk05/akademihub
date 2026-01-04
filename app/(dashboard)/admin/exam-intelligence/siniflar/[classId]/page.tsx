'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, BarChart3, Loader2, Users } from 'lucide-react'
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

type StudentRow = {
  student_id: string
  ad_soyad: string
  ortalama_net: number
  sinav_sayisi: number
}

type SubjectDef = { key: string; code: string; label: string }
type TimelineRow = {
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

type OverviewResp = {
  subjects: SubjectDef[]
  selectedClass: {
    className: string
    asil_count: number
    misafir_count: number
    exams_count: number
    avg_net: number
    avg_score: number
    subject_averages: Record<string, number>
    timeline: TimelineRow[]
    top_students: Array<{
      student_id: string | null
      student_no: string | null
      student_name: string
      student_type: 'asil' | 'misafir'
      avg_net: number
      avg_score: number
      exam_count: number
    }>
  } | null
}

type StudentsResp = {
  data: {
    sinif: string
    ogrenci_sayisi: number
    ortalama_net: number
    ogrenciler: StudentRow[]
  }
}

export default function ClassDetailPage({ params }: { params: { classId: string } }) {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [subjects, setSubjects] = useState<SubjectDef[]>([])
  const [overview, setOverview] = useState<OverviewResp['selectedClass'] | null>(null)
  const [studentsData, setStudentsData] = useState<StudentsResp['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'genel' | 'sinavlar' | 'dersler' | 'ogrenciler'>('genel')
  const [selectedSubject, setSelectedSubject] = useState<string>('TUR')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [ovRes, stRes] = await Promise.all([
          fetch(
            `/api/exam-intelligence/classes/overview?organizationId=${currentOrganization.id}&classId=${encodeURIComponent(params.classId)}`
          ),
          fetch(`/api/exam-intelligence/sinif/${encodeURIComponent(params.classId)}?organizationId=${currentOrganization.id}`),
        ])

        const ovJson = (await ovRes.json()) as OverviewResp
        const stJson = (await stRes.json()) as StudentsResp

        setSubjects(ovJson.subjects || [])
        setOverview(ovJson.selectedClass || null)
        setStudentsData(stJson.data || null)

        // varsayılan ders
        const first = (ovJson.subjects || [])[0]
        if (first?.code) setSelectedSubject(first.code)
      } catch (e) {
        console.error(e)
        setError('Sınıf detayı alınamadı.')
        setSubjects([])
        setOverview(null)
        setStudentsData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, params.classId])

  const sortedStudents = useMemo(() => {
    return [...(studentsData?.ogrenciler || [])].sort((a, b) => (b.ortalama_net || 0) - (a.ortalama_net || 0))
  }, [studentsData?.ogrenciler])

  const timeline = useMemo(() => {
    return (overview?.timeline || []).slice(-10) // çok kalabalık olmasın
  }, [overview?.timeline])

  const lastFive = useMemo(() => {
    const t = overview?.timeline || []
    return t.slice(-5)
  }, [overview?.timeline])

  const subjectTrend = useMemo(() => {
    const t = overview?.timeline || []
    return t.map((x) => ({
      name: (x.name || '').split(' ').slice(0, 2).join(' '),
      value: Number(x.subjects?.[selectedSubject] || 0),
    }))
  }, [overview?.timeline, selectedSubject])

  const scoreTrend = useMemo(() => {
    const t = overview?.timeline || []
    return t.map((x) => ({
      name: (x.name || '').split(' ').slice(0, 2).join(' '),
      avgScore: Number(x.avg_score || 0),
    }))
  }, [overview?.timeline])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" id="ei-class-detail">
      <ExportBar
        data={overview?.timeline || []}
        filename={`sinif_${decodeURIComponent(params.classId)}_analiz`}
        sheetName="Sınavlar"
        elementIdToPrint="ei-class-detail"
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Sınıf: {overview?.className || studentsData?.sinif || decodeURIComponent(params.classId)}</h1>
            <p className="text-sm text-gray-600">
              Ort. Net: <span className="font-bold text-[#075E54]">{Number(overview?.avg_net || studentsData?.ortalama_net || 0).toFixed(1)}</span> •{' '}
              <span className="inline-flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" />{studentsData?.ogrenci_sayisi || 0} öğrenci</span>
              {typeof overview?.asil_count === 'number' ? (
                <>
                  {' '}• <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">Asil: {overview.asil_count}</span>{' '}
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">Misafir: {overview.misafir_count}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      {/* Tabs */}
      <div className="bg-white rounded-3xl border shadow-sm p-2 flex flex-wrap gap-2">
        {[
          { id: 'genel', label: 'Genel' },
          { id: 'sinavlar', label: 'Sınavlar' },
          { id: 'dersler', label: 'Dersler' },
          { id: 'ogrenciler', label: 'Öğrenciler' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-2xl text-sm font-black transition ${
              activeTab === (t.id as any) ? 'bg-[#DCF8C6] text-[#075E54]' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Genel */}
      {activeTab === 'genel' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white font-black flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Son 5 Sınavın Ders Bazlı Ortalamaları
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
                  {lastFive.map((e, idx) => (
                    <tr key={e.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#DCF8C6]/40`}>
                      <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-black">
                            {idx + 1}
                          </span>
                          <div className="min-w-[180px]">
                            <div className="truncate">{e.name}</div>
                            <div className="text-xs text-gray-500">{e.exam_date ? new Date(e.exam_date).toLocaleDateString('tr-TR') : ''}</div>
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
            {lastFive.length === 0 ? <div className="p-6 text-center text-gray-500">Bu sınıf için sınav bulunamadı.</div> : null}
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <div className="font-black text-gray-900 mb-2">Sınıf Puan Trendi</div>
            <div className="text-xs text-gray-500 mb-4">Sınavlar sırasıyla ortalama puan değişimi</div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrend}>
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
      ) : null}

      {/* Sınavlar */}
      {activeTab === 'sinavlar' ? (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white font-black">Sınıfın Tüm Sınavları</div>
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
                {timeline.map((e, idx) => (
                  <tr key={e.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#DCF8C6]/40`}>
                    <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap">{e.name}</td>
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
          {timeline.length === 0 ? <div className="p-6 text-center text-gray-500">Sınav bulunamadı.</div> : null}
        </div>
      ) : null}

      {/* Dersler */}
      {activeTab === 'dersler' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border shadow-sm p-5">
            <div className="font-black text-gray-900 mb-3">Ders Seç</div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setSelectedSubject(s.code)}
                  className={`px-3 py-2 rounded-2xl text-sm font-black transition ${
                    selectedSubject === s.code ? 'bg-[#DCF8C6] text-[#075E54]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="font-black text-gray-900 mb-2">Ders Ortalaması (Genel)</div>
              <div className="text-3xl font-black text-[#075E54]">
                {Number(overview?.subject_averages?.[selectedSubject] || 0).toFixed(1)}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm p-5">
            <div className="font-black text-gray-900 mb-2">Ders Trend Grafiği</div>
            <div className="text-xs text-gray-500 mb-4">Seçilen dersin sınavlara göre değişimi</div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subjectTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#128C7E" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {/* Öğrenciler */}
      {activeTab === 'ogrenciler' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold">Kurum Öğrencileri (Asil) – Sınıf Listesi</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Öğrenci</th>
                    <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                    <th className="text-right px-4 py-3 font-semibold">Sınav</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((s, idx) => (
                    <tr
                      key={s.student_id}
                      className="border-t hover:bg-[#DCF8C6] cursor-pointer"
                      onClick={() => router.push(`/admin/exam-intelligence/ogrenciler/${s.student_id}`)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs font-black">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[360px]">{s.ad_soyad}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[#075E54]">{Number(s.ortalama_net || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{s.sinav_sayisi || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedStudents.length === 0 ? <div className="p-6 text-center text-gray-500">Bu sınıfta kurum öğrencisi bulunamadı.</div> : null}
          </div>

          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold">Sınav Sonuçlarından Gelen (Asil + Misafir) Top 50</div>
            <div className="divide-y">
              {(overview?.top_students || []).slice(0, 50).map((s, i) => (
                <div key={`${s.student_type}-${s.student_id || s.student_name}-${i}`} className="p-4 hover:bg-[#DCF8C6]/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-gray-900 truncate">{s.student_name}</div>
                      <div className="text-xs text-gray-500">
                        {s.student_type === 'asil' ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">Asil</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">Misafir</span>
                        )}
                        <span className="ml-2">Sınav: {s.exam_count}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#075E54]">{Number(s.avg_net || 0).toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Puan: {Number(s.avg_score || 0).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(overview?.top_students || []).length === 0 ? <div className="p-6 text-center text-gray-500">Veri yok.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
