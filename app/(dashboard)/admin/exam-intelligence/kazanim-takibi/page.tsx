'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, BookOpen, Filter, Loader2 } from 'lucide-react'
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

type KazanimRow = {
  kazanim_kodu: string
  ders_kodu: string | null
  ders_adi: string | null
  konu_adi: string | null
  kazanim_metni: string | null
  toplam_soru: number
  dogru: number
  yanlis: number
  bos: number
  basari_orani: number
}

type OverviewResp = {
  overview: { totalKazanım: number; totalSoru: number }
  weakest: KazanimRow[]
  strongest: KazanimRow[]
}

export default function KazanimTakibiPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [exams, setExams] = useState<ExamRow[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [dersKodu, setDersKodu] = useState<string>('')

  const [data, setData] = useState<OverviewResp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/exam-intelligence/exams?organizationId=${currentOrganization.id}`)
        const json = (await res.json()) as ExamsResp
        const list = json.exams || []
        setExams(list)
        if (!selectedExamId && list[0]?.id) setSelectedExamId(list[0].id)
      } catch (e) {
        console.error(e)
        setExams([])
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id])

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) return

      setLoading(true)
      try {
        const examParam = selectedExamId ? `&examId=${encodeURIComponent(selectedExamId)}` : ''
        const dersParam = dersKodu ? `&dersKodu=${encodeURIComponent(dersKodu)}` : ''
        const res = await fetch(`/api/exam-intelligence/kazanim/overview?organizationId=${currentOrganization.id}${examParam}${dersParam}`)
        const json = (await res.json()) as OverviewResp
        setData(json)
      } catch (e) {
        console.error(e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, dersKodu, selectedExamId])

  const weakestChart = useMemo(() => {
    return (data?.weakest || []).slice(0, 12).map((k) => ({
      name: (k.konu_adi || k.kazanim_kodu).slice(0, 24),
      value: Number(k.basari_orani || 0),
    }))
  }, [data?.weakest])

  const strongestChart = useMemo(() => {
    return (data?.strongest || []).slice(0, 12).map((k) => ({
      name: (k.konu_adi || k.kazanim_kodu).slice(0, 24),
      value: Number(k.basari_orani || 0),
    }))
  }, [data?.strongest])

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
            <h1 className="text-2xl font-black text-gray-900">Kazanım Takibi</h1>
            <p className="text-sm text-gray-600">Konu/kazanım başarısı • gerçek cevap anahtarı + kazanım sonuçlarından</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border bg-gray-50"
          >
            <option value="">Tüm sınavlar</option>
            {exams.slice(0, 50).map((e) => (
              <option key={e.id} value={e.id}>
                {new Date(e.exam_date).toLocaleDateString('tr-TR')} • {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={dersKodu}
            onChange={(e) => setDersKodu(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border bg-gray-50"
          >
            <option value="">Tüm dersler</option>
            <option value="TUR">Türkçe (TUR)</option>
            <option value="MAT">Matematik (MAT)</option>
            <option value="FEN">Fen (FEN)</option>
            <option value="SOS">Sosyal (SOS)</option>
            <option value="ING">İngilizce (ING)</option>
            <option value="DIN">Din (DIN)</option>
          </select>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#25D366]" />
          <div className="text-sm text-gray-700 font-semibold">
            Kazanım: {data?.overview?.totalKazanım || 0} • Soru: {data?.overview?.totalSoru || 0}
          </div>
        </div>
      </div>

      {!data || ((data.weakest || []).length === 0 && (data.strongest || []).length === 0) ? (
        <div className="bg-white rounded-2xl p-6 border text-gray-700">
          Kazanım verisi bulunamadı.
          <div className="text-sm text-gray-600 mt-2">
            Bu ekran için <code>sinav_cevap_anahtari</code> ve <code>ogrenci_kazanim_sonuclari</code> tablolarında veri olmalı.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-black text-gray-900">En Zayıf Konu/Kazanımlar (Top 12)</h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weakestChart} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip formatter={(v: number) => [`%${v}`, 'Başarı']} />
                  <Bar dataKey="value" fill="#EF4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-black text-gray-900">En Güçlü Konu/Kazanımlar (Top 12)</h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={strongestChart} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip formatter={(v: number) => [`%${v}`, 'Başarı']} />
                  <Bar dataKey="value" fill="#25D366" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-black text-gray-900">Detay Tablo (En Zayıf 20)</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Kazanım</th>
                    <th className="text-left px-4 py-3 font-semibold">Ders</th>
                    <th className="text-left px-4 py-3 font-semibold">Konu</th>
                    <th className="text-right px-4 py-3 font-semibold">Soru</th>
                    <th className="text-right px-4 py-3 font-semibold">Başarı</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.weakest || []).slice(0, 20).map((k) => (
                    <tr key={k.kazanim_kodu} className="border-t">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <div className="truncate max-w-[420px]">{k.kazanim_metni || k.kazanim_kodu}</div>
                        <div className="text-xs text-gray-500">{k.kazanim_kodu}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{k.ders_adi || k.ders_kodu || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{k.konu_adi || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{k.toplam_soru || 0}</td>
                      <td className="px-4 py-3 text-right font-black text-red-600">%{Number(k.basari_orani || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
