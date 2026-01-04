'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, GraduationCap, Loader2, Printer } from 'lucide-react'
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

type ClassRow = { sinif: string; ogrenci_sayisi: number; ortalama_net: number }

type ClassesResp = { data: ClassRow[] }

type StudentRow = { student_id: string; ad_soyad: string; ortalama_net: number; sinav_sayisi: number }

type ClassDetailResp = {
  data: {
    sinif: string
    ogrenci_sayisi: number
    ortalama_net: number
    ogrenciler: StudentRow[]
  }
}

export default function SinifRaporuPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [detail, setDetail] = useState<ClassDetailResp['data'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/exam-intelligence/sinif?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ClassesResp
        const list = json.data || []
        setClasses(list)
        if (!selectedClass && list[0]?.sinif) setSelectedClass(list[0].sinif)
      } catch (e) {
        console.error(e)
        setClasses([])
      } finally {
        setLoading(false)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id])

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id || !selectedClass) {
        setDetail(null)
        return
      }

      try {
        const res = await fetch(`/api/exam-intelligence/sinif/${encodeURIComponent(selectedClass)}?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ClassDetailResp
        setDetail(json.data)
      } catch (e) {
        console.error(e)
        setDetail(null)
      }
    }

    run()
  }, [currentOrganization?.id, selectedClass])

  const studentsSorted = useMemo(() => {
    return [...(detail?.ogrenciler || [])].sort((a, b) => (b.ortalama_net || 0) - (a.ortalama_net || 0))
  }, [detail?.ogrenciler])

  const distribution = useMemo(() => {
    // Ortalama neti 10'luk dilimlere böl
    const bins = Array.from({ length: 9 }).map((_, i) => ({
      label: `${i * 10}-${i * 10 + 9}`,
      count: 0,
    }))

    for (const s of studentsSorted) {
      const v = Number(s.ortalama_net) || 0
      const idx = Math.min(8, Math.max(0, Math.floor(v / 10)))
      bins[idx].count += 1
    }

    return bins
  }, [studentsSorted])

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
            <h1 className="text-2xl font-black text-gray-900">Sınıf Raporu</h1>
            <p className="text-sm text-gray-600">Sınıf seçin, dağılım ve listeyi yazdırın</p>
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

      <div className="bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3">
        <GraduationCap className="w-5 h-5 text-[#25D366]" />
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="py-2 px-3 rounded-xl border bg-gray-50"
        >
          {classes.map((c) => (
            <option key={c.sinif} value={c.sinif}>
              {c.sinif} (Öğrenci: {c.ogrenci_sayisi}, Ort: {Number(c.ortalama_net || 0).toFixed(1)})
            </option>
          ))}
        </select>
      </div>

      {!detail ? (
        <div className="bg-white rounded-2xl p-6 border text-gray-600">Seçili sınıf için veri yok.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <h3 className="text-lg font-black text-gray-900">Özet</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border">
                  <div className="text-xs text-gray-500 font-semibold">Öğrenci</div>
                  <div className="text-3xl font-black text-gray-900 mt-1">{detail.ogrenci_sayisi}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border">
                  <div className="text-xs text-gray-500 font-semibold">Ortalama Net</div>
                  <div className="text-3xl font-black text-[#075E54] mt-1">{Number(detail.ortalama_net || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <h3 className="text-lg font-black text-gray-900">Net Dağılımı (10'luk dilimler)</h3>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={distribution} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} öğrenci`, 'Sayı']} />
                    <Bar dataKey="count" fill="#25D366" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

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
                  {studentsSorted.map((s, idx) => (
                    <tr key={s.student_id} className="border-t hover:bg-[#DCF8C6]">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs font-black">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[440px]">{s.ad_soyad}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[#075E54]">{Number(s.ortalama_net || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{s.sinav_sayisi || 0}</td>
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
