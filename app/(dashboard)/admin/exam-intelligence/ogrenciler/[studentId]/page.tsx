'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2, Printer, Trophy } from 'lucide-react'

type ApiResp = {
  data: {
    student_id: string
    ad_soyad: string
    sinif: string
    ortalama_net: number
    sinav_sayisi: number
    genel_sira: number
    sinif_sira: number
    sinif_toplam: number
    genel_toplam: number
    sinavlar: Array<{ exam_id: string; sinav_adi: string; tarih: string | null; net: number }>
  } | null
}

export default function StudentDetailPage({ params }: { params: { studentId: string } }) {
  const router = useRouter()

  const [data, setData] = useState<ApiResp['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/exam-intelligence/ogrenci/${encodeURIComponent(params.studentId)}`)
        const json = (await res.json()) as ApiResp
        setData(json.data)
      } catch (e) {
        console.error(e)
        setError('Öğrenci detayı alınamadı.')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [params.studentId])

  const history = useMemo(() => (data?.sinavlar || []).slice(0, 10), [data?.sinavlar])

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
            <h1 className="text-2xl font-black text-gray-900">{data?.ad_soyad || 'Öğrenci'}</h1>
            <p className="text-sm text-gray-600">Sınıf: {data?.sinif || '-'}</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50 font-semibold inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Yazdır
        </button>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500 font-medium">Ortalama Net</div>
          <div className="text-3xl font-black text-[#075E54] mt-2">{Number(data?.ortalama_net || 0).toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500 font-medium">Sınav Sayısı</div>
          <div className="text-3xl font-black text-gray-900 mt-2">{data?.sinav_sayisi || 0}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500 font-medium">Sıralama</div>
          <div className="mt-2 text-gray-900 font-bold">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Sınıf: {data?.sinif_sira || 0}/{data?.sinif_toplam || 0}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Trophy className="w-4 h-4 text-[#25D366]" />
              <span>Genel: {data?.genel_sira || 0}/{data?.genel_toplam || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Son Sınavlar
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Sınav</th>
                <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                <th className="text-right px-4 py-3 font-semibold">Net</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.exam_id} className="border-t">
                  <td className="px-4 py-3 font-semibold text-gray-900">{h.sinav_adi}</td>
                  <td className="px-4 py-3 text-gray-700">{h.tarih ? new Date(h.tarih).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="px-4 py-3 text-right font-black text-[#075E54]">{Number(h.net || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length === 0 ? <div className="p-6 text-center text-gray-500">Sınav geçmişi yok.</div> : null}
      </div>
    </div>
  )
}
