'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, Loader2, Users } from 'lucide-react'

type StudentRow = {
  student_id: string
  ad_soyad: string
  ortalama_net: number
  sinav_sayisi: number
}

type ApiResp = {
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

  const [data, setData] = useState<ApiResp['data'] | null>(null)
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
        const res = await fetch(`/api/exam-intelligence/sinif/${encodeURIComponent(params.classId)}?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ApiResp
        setData(json.data)
      } catch (e) {
        console.error(e)
        setError('Sınıf detayı alınamadı.')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, params.classId])

  const sortedStudents = useMemo(() => {
    return [...(data?.ogrenciler || [])].sort((a, b) => (b.ortalama_net || 0) - (a.ortalama_net || 0))
  }, [data?.ogrenciler])

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
            <h1 className="text-2xl font-black text-gray-900">Sınıf: {data?.sinif || params.classId}</h1>
            <p className="text-sm text-gray-600">
              Ort. Net: <span className="font-bold text-[#075E54]">{Number(data?.ortalama_net || 0).toFixed(1)}</span> •{' '}
              <span className="inline-flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" />{data?.ogrenci_sayisi || 0} öğrenci</span>
            </p>
          </div>
        </div>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold">Öğrenci Listesi</div>
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

        {sortedStudents.length === 0 ? <div className="p-6 text-center text-gray-500">Bu sınıfta öğrenci bulunamadı.</div> : null}
      </div>
    </div>
  )
}
