'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

type ExamsResp = { exams: ExamRow[] }

type GradeFilter = 'all' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun'

type TypeFilter = 'all' | 'MEB' | 'TYT' | 'AYT' | 'DIL'

export default function TrendPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [all, setAll] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [grade, setGrade] = useState<GradeFilter>('all')
  const [type, setType] = useState<TypeFilter>('all')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/exam-intelligence/exams?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ExamsResp
        setAll(json.exams || [])
      } catch (e) {
        console.error(e)
        setAll([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  const series = useMemo(() => {
    return (all || [])
      .filter((e) => (grade === 'all' ? true : String(e.grade_level || '') === grade))
      .filter((e) => (type === 'all' ? true : String(e.exam_type || '').toUpperCase() === type))
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .slice(-20)
      .map((e) => ({
        date: new Date(e.exam_date).toLocaleDateString('tr-TR'),
        name: e.name,
        avg: Number(e.avg_net || 0),
        students: Number(e.total_students || 0),
      }))
  }, [all, grade, type])

  const summary = useMemo(() => {
    if (!series.length) return { first: 0, last: 0, diff: 0 }
    const first = Number(series[0].avg || 0)
    const last = Number(series[series.length - 1].avg || 0)
    const diff = Math.round((last - first) * 10) / 10
    return { first, last, diff }
  }, [series])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Trend</h1>
          <p className="text-sm text-gray-600">Zaman serisi: ortalama net ve katılım</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={grade} onChange={(e) => setGrade(e.target.value as GradeFilter)} className="py-2 px-3 rounded-xl border bg-gray-50">
          <option value="all">Kademe: Tümü</option>
          {['4','5','6','7','8','9','10','11','12','mezun'].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className="py-2 px-3 rounded-xl border bg-gray-50">
          <option value="all">Tür: Tümü</option>
          <option value="MEB">MEB</option>
          <option value="TYT">TYT</option>
          <option value="AYT">AYT</option>
          <option value="DIL">DİL</option>
        </select>
      </div>

      {series.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border text-gray-700">Bu filtre için trend verisi yok.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm">
              <h3 className="text-lg font-black text-gray-900">Ortalama Net (Son {series.length} Sınav)</h3>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={series} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(v: number) => [`${v} net`, 'Ortalama']}
                      labelFormatter={(_, p) => (p?.[0]?.payload?.name ? p[0].payload.name : '')}
                    />
                    <Line type="monotone" dataKey="avg" stroke="#25D366" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <h3 className="text-lg font-black text-gray-900">Özet</h3>
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-2xl bg-gray-50 border">
                  <div className="text-xs text-gray-500 font-semibold">İlk</div>
                  <div className="text-2xl font-black text-gray-900">{summary.first.toFixed(1)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border">
                  <div className="text-xs text-gray-500 font-semibold">Son</div>
                  <div className="text-2xl font-black text-gray-900">{summary.last.toFixed(1)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#DCF8C6] border border-[#25D366]">
                  <div className="text-xs text-gray-600 font-semibold">Değişim</div>
                  <div className={`text-2xl font-black ${summary.diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {summary.diff >= 0 ? '+' : ''}{summary.diff.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Not: Trend hesaplaması sınav listesi verilerindeki ortalama netten yapılır.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold">Sınavlar</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Sınav</th>
                    <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                    <th className="text-right px-4 py-3 font-semibold">Öğrenci</th>
                    <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                  </tr>
                </thead>
                <tbody>
                  {series.slice().reverse().map((e, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3 font-semibold text-gray-900 truncate max-w-[520px]">{e.name}</td>
                      <td className="px-4 py-3 text-gray-700">{e.date}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{e.students}</td>
                      <td className="px-4 py-3 text-right font-black text-[#075E54]">{Number(e.avg || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
