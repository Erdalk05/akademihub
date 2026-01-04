'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, BarChart3, GraduationCap, Loader2, Trophy, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ApiResp = {
  exam: { id: string; name: string; exam_date: string; exam_type: string; grade_level?: string | null } | null
  stats: { totalStudents: number; avgNet: number; maxNet: number; stdDev: number }
  subjectAverages: { turkce: number; matematik: number; fen: number; sosyal: number; ingilizce: number }
  classComparison: Array<{ className: string; avgNet: number; studentCount: number }>
  topStudents: Array<{ id: string; name: string; class: string; net: number; rank: number }>
}

export default function ExamDetailPage({ params }: { params: { examId: string } }) {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [data, setData] = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/exam-intelligence/exams/${params.examId}?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ApiResp
        setData(json)
      } catch (e) {
        console.error(e)
        setError('Sınav detayı alınamadı.')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, params.examId])

  const classChart = useMemo(() => {
    return (data?.classComparison || []).slice(0, 12).map((c) => ({ name: c.className, net: Number(c.avgNet || 0) }))
  }, [data?.classComparison])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-gray-900">{data?.exam?.name || 'Sınav Detayı'}</h1>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {data?.exam?.exam_date ? new Date(data.exam.exam_date).toLocaleDateString('tr-TR') : '-'} • {data?.exam?.exam_type || '-'}
          </p>
        </div>
        <Link href="/admin/exam-intelligence/sinavlar" className="text-sm font-semibold text-[#25D366] hover:underline">
          Sınav listesine dön
        </Link>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[ 
          { label: 'Öğrenci', value: data?.stats?.totalStudents || 0, icon: Users, color: '#25D366' },
          { label: 'Ort. Net', value: (data?.stats?.avgNet || 0).toFixed(1), icon: BarChart3, color: '#075E54' },
          { label: 'En Yüksek', value: (data?.stats?.maxNet || 0).toFixed(1), icon: Trophy, color: '#F59E0B' },
          { label: 'Std. Sapma', value: (data?.stats?.stdDev || 0).toFixed(1), icon: GraduationCap, color: '#06B6D4' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: k.color }}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 font-medium">{k.label}</div>
              <k.icon className="w-5 h-5" style={{ color: k.color }} />
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold text-gray-900">Sınıf Karşılaştırması</h3>
          {classChart.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classChart} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip formatter={(value: number) => [`${value} net`, 'Ortalama']} />
                  <Bar dataKey="net" fill="#25D366" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 text-gray-500">Sınıf verisi yok.</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold text-gray-900">Top 10 Öğrenci</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {(data?.topStudents || []).slice(0, 10).map((s) => (
              <div key={s.rank} className="p-3 rounded-xl bg-gray-50 border text-center">
                <div className="text-xs font-bold text-gray-500">#{s.rank}</div>
                <div className="mt-2 text-xs font-semibold text-gray-900 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-600 truncate">{s.class}</div>
                <div className="mt-1 text-sm font-black text-[#25D366]">{Number(s.net || 0).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900">Sınıf Tablosu</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Sınıf</th>
                <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                <th className="text-right px-4 py-3 font-semibold">Öğrenci</th>
              </tr>
            </thead>
            <tbody>
              {(data?.classComparison || []).map((c) => (
                <tr key={c.className} className="border-t">
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.className}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#075E54]">{Number(c.avgNet || 0).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{c.studentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
