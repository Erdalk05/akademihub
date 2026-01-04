'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, AlertTriangle, Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type StudentRow = {
  student_id: string
  ad_soyad: string
  sinif: string
  ortalama_net: number
  sinav_sayisi: number
}

type StudentsResp = { data: StudentRow[] }

export default function RiskTakibiPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [rows, setRows] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(20)
  const [q, setQ] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/exam-intelligence/ogrenci?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as StudentsResp
        setRows(json.data || [])
      } catch (e) {
        console.error(e)
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  const riskList = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (rows || [])
      .filter((s) => (qq ? s.ad_soyad.toLowerCase().includes(qq) : true))
      .filter((s) => (Number(s.ortalama_net) || 0) < threshold)
      .sort((a, b) => (Number(a.ortalama_net) || 0) - (Number(b.ortalama_net) || 0))
  }, [q, rows, threshold])

  const byClass = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of riskList) {
      const c = s.sinif || 'Belirsiz'
      map[c] = (map[c] || 0) + 1
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [riskList])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Risk Takibi</h1>
            <p className="text-sm text-gray-600">Eşik altı öğrenciler • erken uyarı listesi</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-gray-700">Eşik: {threshold} net</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Öğrenci ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-gray-50"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={80}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="text-lg font-black text-gray-900">Sınıf Bazlı Risk Yoğunluğu (Top 12)</h3>
          {byClass.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byClass} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip formatter={(v: number) => [`${v} öğrenci`, 'Risk']} />
                  <Bar dataKey="count" fill="#EF4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 text-gray-600">Bu eşikte riskli öğrenci yok.</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="text-lg font-black text-gray-900">Risk Listesi</h3>
          <p className="text-sm text-gray-600 mt-1">Toplam: {riskList.length}</p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Öğrenci</th>
                  <th className="text-left px-4 py-3 font-semibold">Sınıf</th>
                  <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                  <th className="text-right px-4 py-3 font-semibold">Sınav</th>
                </tr>
              </thead>
              <tbody>
                {riskList.slice(0, 100).map((s) => (
                  <tr
                    key={s.student_id}
                    className="border-t hover:bg-[#DCF8C6] cursor-pointer"
                    onClick={() => router.push(`/admin/exam-intelligence/ogrenciler/${s.student_id}`)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 truncate max-w-[260px]">{s.ad_soyad}</td>
                    <td className="px-4 py-3 text-gray-700">{s.sinif || '-'}</td>
                    <td className="px-4 py-3 text-right font-black text-red-600">{Number(s.ortalama_net || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{s.sinav_sayisi || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {riskList.length === 0 ? <div className="mt-4 text-gray-600">Bu eşikte riskli öğrenci yok.</div> : null}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border text-sm text-gray-600">
        Öneri: Risk eşiğini sınıf seviyesine göre farklılaştırabilirsiniz (örn. 4-5 için 15, 8/LGS için 25, TYT/AYT için 30).
      </div>
    </div>
  )
}
