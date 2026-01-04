'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { Calendar, FileText, Filter, Loader2, Search, Users } from 'lucide-react'

type ExamRow = {
  id: string
  name: string
  exam_date: string
  exam_type: string
  grade_level: string | null
  total_students: number
  avg_net: number
  is_published: boolean
}

type ApiResp = { exams: ExamRow[] }

type ExamTypeFilter = 'all' | 'MEB' | 'TYT' | 'AYT' | 'DIL'

type GradeFilter = 'all' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun'

export default function ExamsPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [data, setData] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExamTypeFilter>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/exam-intelligence/exams?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ApiResp
        setData(json.exams || [])
      } catch (e) {
        console.error(e)
        setError('Sınavlar alınamadı.')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()

    return (data || [])
      .filter((e) => (qq ? String(e.name || '').toLowerCase().includes(qq) : true))
      .filter((e) => (typeFilter === 'all' ? true : (e.exam_type || '').toUpperCase() === typeFilter))
      .filter((e) => (gradeFilter === 'all' ? true : String(e.grade_level || '') === gradeFilter))
  }, [data, gradeFilter, q, typeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sınavlar</h1>
          <p className="text-sm text-gray-600">Toplam: {filtered.length}</p>
        </div>
        <Link
          href="/admin/akademik-analiz/sihirbaz"
          className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold"
        >
          Yeni Sınav
        </Link>
      </div>

      {error ? (
        <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div>
      ) : null}

      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sınav adı ara..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExamTypeFilter)}
              className="w-full py-2 px-3 rounded-xl border bg-gray-50"
            >
              <option value="all">Tür: Tümü</option>
              <option value="MEB">MEB</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="DIL">DİL</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
              className="w-full py-2 px-3 rounded-xl border bg-gray-50"
            >
              <option value="all">Sınıf: Tümü</option>
              {['4','5','6','7','8','9','10','11','12','mezun'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Sınav</th>
                <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold">Tür</th>
                <th className="text-left px-4 py-3 font-semibold">Sınıf</th>
                <th className="text-right px-4 py-3 font-semibold">Öğrenci</th>
                <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-t hover:bg-[#DCF8C6] cursor-pointer"
                  onClick={() => router.push(`/admin/exam-intelligence/sinavlar/${e.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#25D366]" />
                      <span className="truncate max-w-[320px]">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {e.exam_date ? new Date(e.exam_date).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.exam_type || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{e.grade_level || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {e.total_students || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#075E54]">{Number(e.avg_net || 0).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${e.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {e.is_published ? 'Yayınlandı' : 'Taslak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Kriterlere uygun sınav bulunamadı.</div>
        ) : null}
      </div>
    </div>
  )
}
