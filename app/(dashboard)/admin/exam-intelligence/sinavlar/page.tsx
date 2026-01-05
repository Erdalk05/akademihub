'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { Calendar, FileText, Filter, Loader2, Search, Trash2, Users, Wrench } from 'lucide-react'
import { ExportBar } from '@/components/exam-intelligence/ExportBar'

type ExamRow = {
  id: string
  name: string
  exam_date: string
  exam_type: string
  grade_level: string | null
  total_students: number
  asil_students?: number
  misafir_students?: number
  avg_net: number
  is_published: boolean
}

type ApiResp = { exams: ExamRow[] }

type ExamTypeFilter = 'all' | 'MEB' | 'TYT' | 'AYT' | 'DIL'

type GradeFilter = 'all' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun'

export default function ExamsPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [data, setData] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repairOpen, setRepairOpen] = useState(false)
  const [repairLoading, setRepairLoading] = useState(false)
  const [repairError, setRepairError] = useState<string | null>(null)
  const [repairCandidates, setRepairCandidates] = useState<any[]>([])
  const [repairSelected, setRepairSelected] = useState<Record<string, boolean>>({})
  const [repairDoneMsg, setRepairDoneMsg] = useState<string | null>(null)
  const [repairMode, setRepairMode] = useState<'null' | 'search'>('null')
  const [repairQuery, setRepairQuery] = useState('')

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExamTypeFilter>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')

  useEffect(() => {
    const run = async () => {
      if (!currentOrganization?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/exam-intelligence/exams?organizationId=${currentOrganization.id}&_ts=${Date.now()}`,
          { cache: 'no-store' }
        )
        const json = (await res.json()) as ApiResp
        setData(json.exams || [])
      } catch (e) {
        console.error(e)
        setError('Sınavlar alınamadı.')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id])

  const refreshList = async () => {
    if (!currentOrganization?.id) return
    try {
      const res = await fetch(
        `/api/exam-intelligence/exams?organizationId=${currentOrganization.id}&_ts=${Date.now()}`,
        { cache: 'no-store' }
      )
      const json = (await res.json()) as ApiResp
      setData(json.exams || [])
    } catch (e) {
      console.error(e)
    }
  }

  const deleteExam = async (examId: string, examName: string) => {
    const ok = window.confirm(`\"${examName}\" sınavı kalıcı olarak silinecek. Emin misiniz?`)
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/exams/${examId}?_ts=${Date.now()}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok || !json?.ok) {
        alert(json?.error || `Silme başarısız. (HTTP ${res.status})`)
        return
      }

      // ✅ Anında UI güncelle (optimistic)
      setData((prev) => prev.filter((x) => x.id !== examId))

      // ✅ Gerçeği doğrula (cache'e takılmasın diye ts + no-store)
      await refreshList()
    } catch (e) {
      console.error(e)
      alert('Silme sırasında hata oluştu.')
    }
  }

  const loadRepairCandidates = async () => {
    setRepairLoading(true)
    setRepairError(null)
    setRepairDoneMsg(null)
    try {
      const qs =
        repairMode === 'search'
          ? `/api/admin/exams/repair-null-organization?mode=search&organizationId=${encodeURIComponent(
              currentOrganization?.id || ''
            )}&q=${encodeURIComponent(repairQuery)}&limit=200`
          : '/api/admin/exams/repair-null-organization?limit=200'
      const res = await fetch(qs)
      const json = await res.json()
      const exams = (json?.exams || []) as any[]
      setRepairCandidates(exams)
      const init: Record<string, boolean> = {}
      exams.forEach((e) => {
        init[String(e.id)] = true // default: seçili
      })
      setRepairSelected(init)
    } catch (e) {
      console.error(e)
      setRepairError('Kayıp sınavlar alınamadı.')
      setRepairCandidates([])
      setRepairSelected({})
    } finally {
      setRepairLoading(false)
    }
  }

  const runRepair = async (force: boolean) => {
    if (!currentOrganization?.id) return
    const examIds = Object.entries(repairSelected)
      .filter(([, v]) => v)
      .map(([id]) => id)
    if (examIds.length === 0) {
      setRepairError('En az 1 sınav seçmelisiniz.')
      return
    }
    const ok = window.confirm(
      force
        ? `Seçilen ${examIds.length} sınav ZORLA bu kuruma TAŞINACAK. (Başka kuruma bağlı olabilir!) Emin misiniz?`
        : `Seçilen ${examIds.length} sınav bu kuruma bağlanacak. (Sadece organization_id=null olanlara uygulanır.) Emin misiniz?`
    )
    if (!ok) return
    if (force) {
      const pin = window.prompt('Zorla taşıma için ONAR yazın:')
      if (pin !== 'ONAR') {
        setRepairError('İşlem iptal edildi.')
        return
      }
    }

    setRepairLoading(true)
    setRepairError(null)
    setRepairDoneMsg(null)
    try {
      const res = await fetch('/api/admin/exams/repair-null-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id, examIds, force }),
      })
      const json = await res.json()
      if (!json?.ok) {
        setRepairError(json?.error || 'Onarım başarısız.')
      } else {
        setRepairDoneMsg(`✅ Onarım tamamlandı. Güncellenen sınav: ${json.updatedCount || 0}`)
        await refreshList()
        await loadRepairCandidates()
      }
    } catch (e) {
      console.error(e)
      setRepairError('Onarım sırasında hata oluştu.')
    } finally {
      setRepairLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()

    return (data || [])
      .filter((e) => (qq ? String(e.name || '').toLowerCase().includes(qq) : true))
      .filter((e) => (typeFilter === 'all' ? true : (e.exam_type || '').toUpperCase() === typeFilter))
      .filter((e) => (gradeFilter === 'all' ? true : String(e.grade_level || '') === gradeFilter))
  }, [data, gradeFilter, q, typeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  const exportId = 'ei-exams-export'

  return (
    <div id={exportId} className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ExportBar
        title="Sınavlar"
        pdf={{ filename: `Exam_Intelligence_Sinavlar_${new Date().toISOString().slice(0, 10)}.pdf`, elementId: exportId }}
        excel={{
          filename: 'Exam_Intelligence_Sinavlar',
          sheetName: 'Sınavlar',
          rows: filtered.map((e) => ({
            sinav: e.name,
            tarih: e.exam_date,
            tur: e.exam_type,
            kademe: e.grade_level,
            ogrenci: e.total_students,
            asil: e.asil_students ?? '',
            misafir: e.misafir_students ?? '',
            ortalama_net: e.avg_net,
            durum: e.is_published ? 'Yayınlandı' : 'Taslak',
          })),
          headers: {
            sinav: 'Sınav',
            tarih: 'Tarih',
            tur: 'Tür',
            kademe: 'Kademe',
            ogrenci: 'Öğrenci',
            asil: 'Asil',
            misafir: 'Misafir',
            ortalama_net: 'Ort. Net',
            durum: 'Durum',
          },
        }}
      />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sınavlar</h1>
          <p className="text-sm text-gray-600">Toplam: {filtered.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRepairOpen(true)
              loadRepairCandidates()
            }}
            className="px-4 py-2 rounded-xl bg-white border font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            title="organization_id boş kaydedilmiş sınavları bu kuruma bağla"
          >
            <Wrench className="w-4 h-4 text-[#075E54]" />
            Kayıp Sınavları Onar
          </button>
          <Link href="/admin/exam-intelligence/wizard" className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold">
            Yeni Sınav
          </Link>
        </div>
      </div>

      {/* Repair Modal (simple) */}
      {repairOpen ? (
        <div className="bg-white rounded-3xl border shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-black text-gray-900">Kayıp Sınav Onarımı</div>
              <div className="text-xs text-gray-500">
                Mod <span className="font-bold">{repairMode === 'null' ? 'Null org' : 'Arama'}</span>:{' '}
                {repairMode === 'null'
                  ? 'organization_id=null olan sınavları gösterir.'
                  : 'adı ile arar ve mevcut kuruma ait olmayanları listeler.'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRepairOpen(false)}
                className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
              >
                Kapat
              </button>
              <button
                disabled={repairLoading}
                onClick={() => runRepair(false)}
                className="px-3 py-2 rounded-xl bg-[#075E54] text-white font-bold hover:bg-[#128C7E] disabled:opacity-60"
              >
                Seçileni Onar
              </button>
              <button
                disabled={repairLoading}
                onClick={() => runRepair(true)}
                className="px-3 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-60"
                title="Başka kuruma bağlı olsa bile seçilen sınavları bu kuruma taşır (dikkat)"
              >
                Zorla Taşı
              </button>
            </div>
          </div>

          {repairError ? <div className="mt-4 p-3 rounded-2xl bg-red-50 text-red-700 font-semibold">{repairError}</div> : null}
          {repairDoneMsg ? <div className="mt-4 p-3 rounded-2xl bg-emerald-50 text-emerald-800 font-semibold">{repairDoneMsg}</div> : null}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRepairMode('null')}
              className={`px-3 py-2 rounded-xl font-bold border ${
                repairMode === 'null' ? 'bg-[#DCF8C6] text-[#075E54] border-[#25D366]' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Null Org
            </button>
            <button
              onClick={() => setRepairMode('search')}
              className={`px-3 py-2 rounded-xl font-bold border ${
                repairMode === 'search' ? 'bg-[#DCF8C6] text-[#075E54] border-[#25D366]' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Ara
            </button>
            {repairMode === 'search' ? (
              <input
                value={repairQuery}
                onChange={(e) => setRepairQuery(e.target.value)}
                placeholder="Sınav adı (örn: ÖZDEBİR)"
                className="px-3 py-2 rounded-xl border bg-gray-50 min-w-[220px]"
              />
            ) : null}
            <button
              disabled={repairLoading}
              onClick={loadRepairCandidates}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-60"
            >
              Tara
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                const next: Record<string, boolean> = {}
                repairCandidates.forEach((e) => (next[String(e.id)] = true))
                setRepairSelected(next)
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
            >
              Tümünü Seç
            </button>
            <button
              onClick={() => {
                const next: Record<string, boolean> = {}
                repairCandidates.forEach((e) => (next[String(e.id)] = false))
                setRepairSelected(next)
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
            >
              Tümünü Kaldır
            </button>
            <button
              disabled={repairLoading}
              onClick={loadRepairCandidates}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-60"
            >
              Yenile
            </button>
          </div>

          <div className="mt-4 bg-gray-50 rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold">Seç</th>
                    <th className="text-left px-4 py-3 font-bold">Sınav</th>
                    <th className="text-left px-4 py-3 font-bold">Tarih</th>
                    <th className="text-left px-4 py-3 font-bold">Tür</th>
                    <th className="text-left px-4 py-3 font-bold">Sınıf</th>
                    <th className="text-left px-4 py-3 font-bold">Durum</th>
                    <th className="text-left px-4 py-3 font-bold">Org</th>
                    <th className="text-left px-4 py-3 font-bold">Oluşturma</th>
                  </tr>
                </thead>
                <tbody>
                  {repairCandidates.map((e) => {
                    const id = String(e.id)
                    return (
                      <tr key={id} className="border-t hover:bg-white">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={Boolean(repairSelected[id])}
                            onChange={(ev) => setRepairSelected((p) => ({ ...p, [id]: ev.target.checked }))}
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">{e.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{e.exam_date ? new Date(e.exam_date).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{e.exam_type || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{e.grade_level || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{e.status || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">{String(e.organization_id || 'null')}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {e.created_at ? new Date(e.created_at).toLocaleString('tr-TR') : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {repairLoading ? <div className="p-4 text-center text-gray-500">Yükleniyor...</div> : null}
            {!repairLoading && repairCandidates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Onarım adayı sınav bulunamadı.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div>
      ) : null}

      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sınav adı ara..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExamTypeFilter)}
              className="w-full py-2 px-3 rounded-xl border bg-gray-50"
            >
              <option value="all">Tür: Tümü</option>
              <option value="MEB">MEB</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="DIL">DİL</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
              className="w-full py-2 px-3 rounded-xl border bg-gray-50"
            >
              <option value="all">Sınıf: Tümü</option>
              {['4','5','6','7','8','9','10','11','12','mezun'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Sınav</th>
                <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold">Tür</th>
                <th className="text-left px-4 py-3 font-semibold">Sınıf</th>
                <th className="text-right px-4 py-3 font-semibold">Öğrenci</th>
                <th className="text-right px-4 py-3 font-semibold">Asil</th>
                <th className="text-right px-4 py-3 font-semibold">Misafir</th>
                <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-t hover:bg-[#DCF8C6] cursor-pointer"
                  onClick={() => router.push(`/admin/exam-intelligence/sinavlar/${e.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#25D366]" />
                      <span className="truncate max-w-[320px]">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {e.exam_date ? new Date(e.exam_date).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.exam_type || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{e.grade_level || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {e.total_students || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{e.asil_students ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{e.misafir_students ?? '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#075E54]">{Number(e.avg_net || 0).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${e.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {e.is_published ? 'Yayınlandı' : 'Taslak'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation()
                        deleteExam(e.id, e.name)
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 font-bold hover:bg-red-100"
                      title="Sınavı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Kriterlere uygun sınav bulunamadı.</div>
        ) : null}
      </div>
    </div>
  )
}
