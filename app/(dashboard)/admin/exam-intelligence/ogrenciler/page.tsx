'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { Loader2, Search, Users } from 'lucide-react'

type StudentRow = {
  student_id: string
  ad_soyad: string
  sinif: string
  ortalama_net: number
  sinav_sayisi: number
}

type ApiResp = { data: StudentRow[] }

export default function StudentsPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [rows, setRows] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/exam-intelligence/ogrenci?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ApiResp
        setRows(json.data || [])
      } catch (e) {
        console.error(e)
        setError('Öğrenciler alınamadı.')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (rows || []).filter((s) => (qq ? String(s.ad_soyad || '').toLowerCase().includes(qq) : true))
  }, [q, rows])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Öğrenciler</h1>
        <p className="text-sm text-gray-600">Toplam: {filtered.length}</p>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Öğrenci ara (ad soyad)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-gray-50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
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
              {filtered.map((s) => (
                <tr
                  key={s.student_id}
                  className="border-t hover:bg-[#DCF8C6] cursor-pointer"
                  onClick={() => router.push(`/admin/exam-intelligence/ogrenciler/${s.student_id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs font-black">
                        {(s.ad_soyad || 'X')
                          .split(' ')
                          .filter(Boolean)
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="truncate max-w-[420px]">{s.ad_soyad}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.sinif || '-'}</td>
                  <td className="px-4 py-3 text-right font-black text-[#075E54]">{Number(s.ortalama_net || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {s.sinav_sayisi || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? <div className="p-6 text-center text-gray-500">Sonuç yok.</div> : null}
      </div>
    </div>
  )
}
