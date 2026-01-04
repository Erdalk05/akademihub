'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, Filter, Loader2 } from 'lucide-react'
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

type KonuRow = {
  ders_kodu: string | null
  ders_adi: string | null
  konu_adi: string | null
  toplam_soru: number
  basari_orani: number
}

type KonuResp = { konular: KonuRow[] }

export default function KonuAnaliziPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [exams, setExams] = useState<ExamRow[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [dersKodu, setDersKodu] = useState<string>('')

  const [rows, setRows] = useState<KonuRow[]>([])
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
        const res = await fetch(`/api/exam-intelligence/kazanim/konu?organizationId=${currentOrganization.id}${examParam}${dersParam}`)
        const json = (await res.json()) as KonuResp
        setRows(json.konular || [])
      } catch (e) {
        console.error(e)
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, dersKodu, selectedExamId])

  const weakest = useMemo(() => (rows || []).slice(0, 12), [rows])
  const weakestChart = useMemo(() => {
    return weakest.map((k) => ({
      name: (k.konu_adi || 'Belirsiz').slice(0, 26),
      value: Number(k.basari_orani || 0),
    }))
  }, [weakest])

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
          <h1 className="text-2xl font-black text-gray-900">Konu Analizi</h1>
          <p className="text-sm text-gray-600">Konu başarısı (cevap anahtarı + kazanım sonuçları)</p>
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

        <div className="p-3 rounded-xl bg-gray-50 border text-sm text-gray-700 font-semibold">
          Konu sayısı: {rows.length}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border text-gray-700">
          Konu analizi verisi bulunamadı.
          <div className="text-sm text-gray-600 mt-2">
            Bu ekran için <code>sinav_cevap_anahtari</code> (konu_adi) ve <code>ogrenci_kazanim_sonuclari</code> verisi gereklidir.
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h3 className="text-lg font-black text-gray-900">En Zayıf Konular (Top 12)</h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weakestChart} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip formatter={(v: number) => [`%${v}`, 'Başarı']} />
                  <Bar dataKey="value" fill="#EF4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold">Konu Tablosu (Zayıftan Güçlüye)</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Ders</th>
                    <th className="text-left px-4 py-3 font-semibold">Konu</th>
                    <th className="text-right px-4 py-3 font-semibold">Soru</th>
                    <th className="text-right px-4 py-3 font-semibold">Başarı</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((k, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3 text-gray-700">{k.ders_adi || k.ders_kodu || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 truncate max-w-[520px]">{k.konu_adi || 'Belirsiz'}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{k.toplam_soru || 0}</td>
                      <td className={`px-4 py-3 text-right font-black ${Number(k.basari_orani || 0) < 40 ? 'text-red-600' : Number(k.basari_orani || 0) < 60 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        %{Number(k.basari_orani || 0).toFixed(1)}
                      </td>
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
