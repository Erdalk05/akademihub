'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, FileText, Loader2, Printer, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

type StudentRow = {
  student_id: string
  ad_soyad: string
  sinif: string
  ortalama_net: number
  sinav_sayisi: number
}

type StudentsResp = { data: StudentRow[] }

type StudentDetailResp = {
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

export default function OgrenciKarnesiPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudentDetailResp['data'] | null>(null)
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
        setStudents(json.data || [])
      } catch (e) {
        console.error(e)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) {
        setDetail(null)
        return
      }

      try {
        const res = await fetch(`/api/exam-intelligence/ogrenci/${encodeURIComponent(selectedId)}`)
        const json = (await res.json()) as StudentDetailResp
        setDetail(json.data)
      } catch (e) {
        console.error(e)
        setDetail(null)
      }
    }

    run()
  }, [selectedId])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return (students || []).filter((s) => (qq ? s.ad_soyad.toLowerCase().includes(qq) : true))
  }, [q, students])

  const last5 = useMemo(() => {
    return (detail?.sinavlar || []).slice(0, 5)
  }, [detail?.sinavlar])

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
            <h1 className="text-2xl font-black text-gray-900">Öğrenci Karnesi</h1>
            <p className="text-sm text-gray-600">Hızlı çıktı (kısa karne)</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Öğrenci ara..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-gray-50"
            />
          </div>

          <div className="mt-3 max-h-[420px] overflow-auto">
            {(filtered || []).slice(0, 200).map((s) => (
              <button
                key={s.student_id}
                onClick={() => setSelectedId(s.student_id)}
                className={`w-full text-left p-3 rounded-xl border mb-2 hover:bg-[#DCF8C6] transition ${
                  selectedId === s.student_id ? 'border-[#25D366] bg-[#DCF8C6]' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-semibold text-gray-900 truncate">{s.ad_soyad}</div>
                <div className="text-xs text-gray-600">{s.sinif} • Ort: {Number(s.ortalama_net || 0).toFixed(2)}</div>
              </button>
            ))}

            {filtered.length === 0 ? <div className="text-sm text-gray-500 p-3">Sonuç yok.</div> : null}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!detail ? (
            <div className="bg-white rounded-2xl p-6 border text-gray-600">Sol taraftan bir öğrenci seçin.</div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#25D366]" />
                <div>
                  <div className="text-xl font-black text-gray-900">{detail.ad_soyad}</div>
                  <div className="text-sm text-gray-600">Sınıf: {detail.sinif}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border">
                  <div className="text-xs text-gray-500 font-semibold">Ortalama Net</div>
                  <div className="text-3xl font-black text-[#075E54] mt-1">{Number(detail.ortalama_net || 0).toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border">
                  <div className="text-xs text-gray-500 font-semibold">Sınav</div>
                  <div className="text-3xl font-black text-gray-900 mt-1">{detail.sinav_sayisi || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border">
                  <div className="text-xs text-gray-500 font-semibold">Sıralama</div>
                  <div className="text-sm font-bold text-gray-900 mt-2">
                    Sınıf: {detail.sinif_sira}/{detail.sinif_toplam}
                    <br />
                    Genel: {detail.genel_sira}/{detail.genel_toplam}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="font-black text-gray-900">Son 5 Sınav</div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Sınav</th>
                        <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                        <th className="text-right px-4 py-3 font-semibold">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {last5.map((h) => (
                        <tr key={h.exam_id} className="border-t">
                          <td className="px-4 py-3 font-semibold text-gray-900">{h.sinav_adi}</td>
                          <td className="px-4 py-3 text-gray-700">{h.tarih ? new Date(h.tarih).toLocaleDateString('tr-TR') : '-'}</td>
                          <td className="px-4 py-3 text-right font-black text-[#075E54]">{Number(h.net || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                Not: Bu sayfa “kısa karne” formatıdır. Kazanım bazlı detay için “Kazanım Takibi” sayfasını kullanın.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
