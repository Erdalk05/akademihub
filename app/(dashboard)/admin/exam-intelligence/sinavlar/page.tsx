'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { useAuthStore } from '@/lib/store/authStore'
import { Calendar, FileText, Filter, Loader2, Search, Trash2, Users } from 'lucide-react'
import { ExportBar } from '@/components/exam-intelligence/ExportBar'
import { ReportHeader } from '@/components/exam-intelligence/ReportHeader'
import { AnswerKeyDrawer, type AnswerKeyExam, type AnswerKeyRow } from '@/components/exam-intelligence/AnswerKeyDrawer'

type ExamRow = {
  id: string
  name: string
  exam_date: string
  exam_type: string
  grade_level: string | null
  booklets?: string[]
  total_students: number
  asil_students?: number
  misafir_students?: number
  avg_net: number
  is_published: boolean
}

type ApiResp = { ok?: boolean; data?: { exams: ExamRow[] }; exams?: ExamRow[] }

type ExamTypeFilter = 'all' | 'LGS' | 'TYT' | 'AYT_SAY' | 'AYT_EA' | 'AYT_SOZ' | 'AYT_DIL' | 'DENEME' | 'YAZILI'

type GradeFilter = 'all' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun'

type StatusFilter = 'all' | 'published' | 'draft'

type SortKey =
  | 'name'
  | 'exam_date'
  | 'grade_level'
  | 'booklets'
  | 'exam_type'
  | 'total_students'
  | 'asil_students'
  | 'misafir_students'
  | 'avg_net'
  | 'is_published'

type SortDir = 'asc' | 'desc'

export default function ExamsPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [data, setData] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters (tamamı filterable hedefi için deterministik tek yer)
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExamTypeFilter>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [bookletFilter, setBookletFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [studentsMin, setStudentsMin] = useState('')
  const [studentsMax, setStudentsMax] = useState('')
  const [asilMin, setAsilMin] = useState('')
  const [asilMax, setAsilMax] = useState('')
  const [misafirMin, setMisafirMin] = useState('')
  const [misafirMax, setMisafirMax] = useState('')
  const [avgNetMin, setAvgNetMin] = useState('')
  const [avgNetMax, setAvgNetMax] = useState('')

  const [sortKey, setSortKey] = useState<SortKey>('exam_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Answer key drawer
  const [akOpen, setAkOpen] = useState(false)
  const [akLoading, setAkLoading] = useState(false)
  const [akError, setAkError] = useState<string | null>(null)
  const [akExam, setAkExam] = useState<AnswerKeyExam | null>(null)
  const [akRows, setAkRows] = useState<AnswerKeyRow[]>([])
  const [akBooklet, setAkBooklet] = useState<'A' | 'B' | 'C' | 'D'>('A')

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
        // Yeni standard (ok:true, data) veya eski format (exams) desteklenir
        setData(json.data?.exams ?? json.exams ?? [])
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
      // Yeni standard (ok:true, data) veya eski format (exams) desteklenir
      setData(json.data?.exams ?? json.exams ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
      return
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  const deleteExam = async (examId: string, examName: string) => {
    const ok = window.confirm(`\"${examName}\" sınavı kalıcı olarak silinecek. Emin misiniz?`)
    if (!ok) return
    try {
      const pwd = window.prompt('Silme işlemi için yetkili şifre girin:')
      if (!pwd) return

      const auth = useAuthStore.getState()
      const token = auth?.token || ''
      // Email: RoleContext + localStorage üzerinden tutuluyor
      let email: string | null = null
      try {
        const raw = localStorage.getItem('akademi_current_user')
        email = raw ? (JSON.parse(raw)?.email as string) : null
      } catch {
        email = null
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'UI-DEL-A',
          location: 'admin/exam-intelligence/sinavlar/page.tsx:deleteExam:start',
          message: 'deleteExam start',
          data: { examId, hasOrg: Boolean(currentOrganization?.id), hasToken: Boolean(token), hasEmail: Boolean(email) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const res = await fetch(`/api/admin/exams/${examId}?_ts=${Date.now()}&debug=1`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: pwd, email }),
      })

      const json = await res.json().catch(() => ({} as any))

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'UI-DEL-B',
          location: 'admin/exam-intelligence/sinavlar/page.tsx:deleteExam:resp',
          message: 'deleteExam response',
          data: { examId, status: res.status, ok: res.ok, jsonOk: Boolean((json as any)?.ok), error: (json as any)?.error || null, meta: (json as any)?.meta || null },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() : null
    const minStudents = studentsMin.trim() ? Number(studentsMin) : null
    const maxStudents = studentsMax.trim() ? Number(studentsMax) : null
    const minAsil = asilMin.trim() ? Number(asilMin) : null
    const maxAsil = asilMax.trim() ? Number(asilMax) : null
    const minMisafir = misafirMin.trim() ? Number(misafirMin) : null
    const maxMisafir = misafirMax.trim() ? Number(misafirMax) : null
    const minAvg = avgNetMin.trim() ? Number(avgNetMin) : null
    const maxAvg = avgNetMax.trim() ? Number(avgNetMax) : null

    const out = (data || [])
      .filter((e) => (qq ? String(e.name || '').toLowerCase().includes(qq) : true))
      .filter((e) => (typeFilter === 'all' ? true : String(e.exam_type || '').toUpperCase() === typeFilter))
      .filter((e) => (gradeFilter === 'all' ? true : String(e.grade_level || '') === gradeFilter))
      .filter((e) =>
        statusFilter === 'all' ? true : statusFilter === 'published' ? Boolean(e.is_published) : !Boolean(e.is_published),
      )
      .filter((e) => (bookletFilter === 'all' ? true : (e.booklets || []).includes(bookletFilter)))
      .filter((e) => {
        if (!from && !to) return true
        const t = e.exam_date ? new Date(e.exam_date).getTime() : 0
        if (from && t < from) return false
        if (to && t > to) return false
        return true
      })
      .filter((e) => {
        const n = Number(e.total_students || 0)
        if (minStudents != null && n < minStudents) return false
        if (maxStudents != null && n > maxStudents) return false
        return true
      })
      .filter((e) => {
        const n = Number(e.asil_students || 0)
        if (minAsil != null && n < minAsil) return false
        if (maxAsil != null && n > maxAsil) return false
        return true
      })
      .filter((e) => {
        const n = Number(e.misafir_students || 0)
        if (minMisafir != null && n < minMisafir) return false
        if (maxMisafir != null && n > maxMisafir) return false
        return true
      })
      .filter((e) => {
        const n = Number(e.avg_net || 0)
        if (minAvg != null && n < minAvg) return false
        if (maxAvg != null && n > maxAvg) return false
        return true
      })

    const dirMul = sortDir === 'asc' ? 1 : -1
    out.sort((a, b) => {
      const av: any = (a as any)[sortKey]
      const bv: any = (b as any)[sortKey]
      if (sortKey === 'booklets') {
        const as = (a.booklets || []).join('')
        const bs = (b.booklets || []).join('')
        return as.localeCompare(bs, 'tr') * dirMul
      }
      if (sortKey === 'exam_date') {
        const at = av ? new Date(av).getTime() : 0
        const bt = bv ? new Date(bv).getTime() : 0
        return (at - bt) * dirMul
      }
      if (sortKey === 'is_published') {
        return (Number(Boolean(av)) - Number(Boolean(bv))) * dirMul
      }
      if (typeof av === 'number' || typeof bv === 'number') {
        return (Number(av || 0) - Number(bv || 0)) * dirMul
      }
      return String(av || '').localeCompare(String(bv || ''), 'tr') * dirMul
    })

    return out
  }, [
    avgNetMax,
    avgNetMin,
    asilMax,
    asilMin,
    bookletFilter,
    data,
    dateFrom,
    dateTo,
    gradeFilter,
    misafirMax,
    misafirMin,
    q,
    sortDir,
    sortKey,
    statusFilter,
    studentsMax,
    studentsMin,
    typeFilter,
  ])

  const summary = useMemo(() => {
    const examsCount = filtered.length
    const totalStudents = filtered.reduce((s, e) => s + Number(e.total_students || 0), 0)
    const asil = filtered.reduce((s, e) => s + Number(e.asil_students || 0), 0)
    const misafir = filtered.reduce((s, e) => s + Number(e.misafir_students || 0), 0)
    const avgNet = examsCount ? Math.round((filtered.reduce((s, e) => s + Number(e.avg_net || 0), 0) / examsCount) * 10) / 10 : 0
    return { examsCount, totalStudents, asil, misafir, avgNet }
  }, [filtered])

  const openAnswerKey = async (examId: string, booklet: 'A' | 'B' | 'C' | 'D') => {
    if (!currentOrganization?.id) return
    setAkOpen(true)
    setAkLoading(true)
    setAkError(null)
    setAkRows([])
    setAkExam(null)
    setAkBooklet(booklet)
    try {
      const res = await fetch(
        `/api/exam-intelligence/exams/${encodeURIComponent(examId)}?organizationId=${encodeURIComponent(currentOrganization.id)}&includeAnswerKey=1&_ts=${Date.now()}`,
        { cache: 'no-store' },
      )
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        setAkError(json?.error || `Cevap anahtarı alınamadı (HTTP ${res.status})`)
        return
      }
      setAkExam(json.data?.exam || null)
      setAkRows(Array.isArray(json.data?.answerKey) ? (json.data.answerKey as AnswerKeyRow[]) : [])
    } catch (e) {
      console.error(e)
      setAkError('Cevap anahtarı alınamadı.')
    } finally {
      setAkLoading(false)
    }
  }

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
      <div className="print:hidden">
        <ExportBar
          title="Sınavlar (Tüm Sayfa)"
          mode="server"
          report={{
            organizationId: currentOrganization?.id || '',
            entityType: 'exam_list',
            entityId: null,
            section: 'full_page',
          }}
          pdf={{ filename: `Exam_Intelligence_Sinavlar_${new Date().toISOString().slice(0, 10)}.pdf`, elementId: exportId }}
          excel={{
            filename: 'Exam_Intelligence_Sinavlar',
            sheetName: 'Sınavlar',
            rows: filtered.map((e, i) => ({
              sira: i + 1,
              sinav: e.name,
              tarih: e.exam_date,
              tur: e.exam_type,
              kademe: e.grade_level,
              kitapciklar: (e.booklets || []).join('-'),
              ogrenci: e.total_students,
              asil: e.asil_students ?? '',
              misafir: e.misafir_students ?? '',
              ortalama_net: e.avg_net,
              durum: e.is_published ? 'Yayınlandı' : 'Taslak',
            })),
            headers: {
              sira: 'Sıra',
              sinav: 'Sınav',
              tarih: 'Tarih',
              tur: 'Tür',
              kademe: 'Kademe',
              kitapciklar: 'Kitapçıklar',
              ogrenci: 'Öğrenci',
              asil: 'Asil',
              misafir: 'Misafir',
              ortalama_net: 'Ort. Net',
              durum: 'Durum',
            },
          }}
        />
      </div>

      <ReportHeader
        organizationName={currentOrganization?.name || 'Kurum'}
        organizationLogoUrl={currentOrganization?.logo_url}
        title="Sınavlar"
        subtitle="Filtreli liste"
      />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sınavlar</h1>
          <p className="text-sm text-gray-600">Toplam: {summary.examsCount}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/exam-intelligence/wizard" className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-bold">
            Yeni Sınav
          </Link>
        </div>
      </div>

      {error ? (
        <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div>
      ) : null}

      {/* GENEL ÖZET */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#25D366' }}>
          <div className="text-sm text-gray-500 font-medium">Sınav</div>
          <div className="text-3xl font-black text-gray-900 mt-2">{summary.examsCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#075E54' }}>
          <div className="text-sm text-gray-500 font-medium">Öğrenci (Toplam)</div>
          <div className="text-3xl font-black text-gray-900 mt-2">{summary.totalStudents}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#F59E0B' }}>
          <div className="text-sm text-gray-500 font-medium">Asil / Misafir</div>
          <div className="text-2xl font-black text-gray-900 mt-2">
            {summary.asil} / {summary.misafir}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#06B6D4' }}>
          <div className="text-sm text-gray-500 font-medium">Ort. Net (Sınav ort.)</div>
          <div className="text-3xl font-black text-gray-900 mt-2">{summary.avgNet.toFixed(1)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              {['LGS','TYT','AYT_SAY','AYT_EA','AYT_SOZ','AYT_DIL','DENEME','YAZILI'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full py-2 px-3 rounded-xl border bg-gray-50"
            >
              <option value="all">Durum: Tümü</option>
              <option value="published">Yayınlandı</option>
              <option value="draft">Taslak</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-semibold w-14">Tarih</div>
            <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} type="date" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
            <span className="text-xs text-gray-400">→</span>
            <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} type="date" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-semibold w-14">Kitapçık</div>
            <select
              value={bookletFilter}
              onChange={(e) => setBookletFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border bg-gray-50"
            >
              <option value="all">Tümü</option>
              {(['A','B','C','D'] as const).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-semibold w-14">Öğrenci</div>
            <input value={studentsMin} onChange={(e) => setStudentsMin(e.target.value)} inputMode="numeric" placeholder="min" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
            <span className="text-xs text-gray-400">→</span>
            <input value={studentsMax} onChange={(e) => setStudentsMax(e.target.value)} inputMode="numeric" placeholder="max" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-semibold w-14">Ort.Net</div>
            <input value={avgNetMin} onChange={(e) => setAvgNetMin(e.target.value)} inputMode="decimal" placeholder="min" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
            <span className="text-xs text-gray-400">→</span>
            <input value={avgNetMax} onChange={(e) => setAvgNetMax(e.target.value)} inputMode="decimal" placeholder="max" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-semibold w-14">Asil</div>
            <input value={asilMin} onChange={(e) => setAsilMin(e.target.value)} inputMode="numeric" placeholder="min" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
            <span className="text-xs text-gray-400">→</span>
            <input value={asilMax} onChange={(e) => setAsilMax(e.target.value)} inputMode="numeric" placeholder="max" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-semibold w-14">Misafir</div>
            <input value={misafirMin} onChange={(e) => setMisafirMin(e.target.value)} inputMode="numeric" placeholder="min" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
            <span className="text-xs text-gray-400">→</span>
            <input value={misafirMax} onChange={(e) => setMisafirMax(e.target.value)} inputMode="numeric" placeholder="max" className="w-full py-2 px-3 rounded-xl border bg-gray-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('name')}>Sınav Adı</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('exam_date')}>Uygulama Tarihi</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('grade_level')}>Uygulanan Sınıf</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('booklets')}>Kitapçık Türleri</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('exam_type')}>Tür</th>
                <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('total_students')}>Öğrenci</th>
                <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('asil_students')}>Asil</th>
                <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('misafir_students')}>Misafir</th>
                <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('avg_net')}>Ort. Net</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => toggleSort('is_published')}>Durum</th>
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
                  <td className="px-4 py-3 text-gray-700">{e.grade_level || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(e.booklets || []).length ? (
                        (e.booklets || []).map((b) => (
                          <button
                            key={b}
                            onClick={(ev) => {
                              ev.stopPropagation()
                              openAnswerKey(e.id, (b as any) || 'A')
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-black bg-white border hover:bg-gray-50"
                            title="Cevap anahtarını gör"
                          >
                            {b}
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.exam_type || '-'}</td>
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
      <AnswerKeyDrawer
        open={akOpen}
        loading={akLoading}
        error={akError}
        exam={akExam}
        rows={akRows}
        initialBooklet={akBooklet}
        onClose={() => setAkOpen(false)}
      />
    </div>
  )
}
