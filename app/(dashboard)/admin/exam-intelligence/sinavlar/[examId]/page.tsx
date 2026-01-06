'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import { ArrowLeft, BarChart3, GraduationCap, Loader2, Trophy, Users, Search, Filter, X } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExportBar } from '@/components/exam-intelligence/ExportBar'
import { ReportHeader } from '@/components/exam-intelligence/ReportHeader'
import type { ExamDetailContractV1 } from '@/types/exam-detail-contract'

type ApiResp = {
  exam: { id: string; name: string; exam_date: string; exam_type: string; grade_level?: string | null } | null
  stats: { totalStudents: number; avgNet: number; maxNet: number; stdDev: number }
  subjects?: Array<{ key: string; code: string; label: string }>
  subjectAverages?: Record<string, number>
  classComparison: Array<{ className: string; avgNet: number; studentCount: number }>
  topStudents: Array<{ id: string; name: string; class: string; net: number; rank: number; studentType?: 'asil' | 'misafir'; subjects?: Record<string, number> }>
  contract?: ExamDetailContractV1
}

export default function ExamDetailPage({ params }: { params: { examId: string } }) {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [data, setData] = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Table/filters
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'asil' | 'misafir'>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Match modal
  const [matchOpen, setMatchOpen] = useState(false)
  const [matchTargetRowId, setMatchTargetRowId] = useState<string | null>(null)
  const [matchSearch, setMatchSearch] = useState('')
  const [matchBusy, setMatchBusy] = useState(false)
  const [matchCandidates, setMatchCandidates] = useState<any[]>([])
  const [matchSelectedStudentId, setMatchSelectedStudentId] = useState<string | null>(null)

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
          `/api/exam-intelligence/exams/${params.examId}?organizationId=${currentOrganization.id}&includeStudents=1`,
          { cache: 'no-store' },
        )
        const json = await res.json()
        // Yeni standard (ok:true, data) veya eski format desteklenir
        const payload = json.data ?? json
        setData(payload as ApiResp)
      } catch (e) {
        console.error(e)
        setError('Sınav detayı alınamadı.')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentOrganization?.id, params.examId])

  // Match candidates fetch (debounced-ish)
  useEffect(() => {
    const run = async () => {
      if (!matchOpen) return
      if (!currentOrganization?.id) return
      if (matchSearch.trim().length < 2) {
        setMatchCandidates([])
        return
      }
      try {
        const res = await fetch(
          `/api/students?organization_id=${encodeURIComponent(currentOrganization.id)}&search=${encodeURIComponent(matchSearch.trim())}&limit=20`,
          { cache: 'no-store' },
        )
        const json = await res.json().catch(() => null)
        setMatchCandidates(Array.isArray(json?.data) ? json.data : [])
      } catch {
        setMatchCandidates([])
      }
    }
    const t = setTimeout(run, 250)
    return () => clearTimeout(t)
  }, [matchOpen, matchSearch, currentOrganization?.id])

  const classChart = useMemo(() => {
    return (data?.classComparison || []).slice(0, 12).map((c) => ({ name: c.className, net: Number(c.avgNet || 0) }))
  }, [data?.classComparison])

  const contract = data?.contract
  const subjects = contract?.subjects || data?.subjects || []
  const students = contract?.students || []
  const classOptions = useMemo(() => {
    const set = new Set<string>()
    ;(students || []).forEach((s: any) => {
      if (s.className) set.add(String(s.className))
    })
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))]
  }, [students])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    const out = (students || [])
      .filter((s: any) => (q ? String(s.fullName || '').toLowerCase().includes(q) : true))
      .filter((s: any) => (classFilter === 'all' ? true : String(s.className || '') === classFilter))
      .filter((s: any) => (typeFilter === 'all' ? true : s.studentType === typeFilter))
      .sort((a: any, b: any) => {
        const av = Number(a.totalNet || 0)
        const bv = Number(b.totalNet || 0)
        return sortDir === 'asc' ? av - bv : bv - av
      })
    return out
  }, [students, search, classFilter, typeFilter, sortDir])

  const classAvgBySubject = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    for (const s of filteredStudents as any[]) {
      const cn = String(s.className || 'Belirsiz')
      if (!map[cn]) map[cn] = {}
    }
    const grouped: Record<string, any[]> = {}
    ;(students || []).forEach((s: any) => {
      const cn = String(s.className || 'Belirsiz')
      if (!grouped[cn]) grouped[cn] = []
      grouped[cn].push(s)
    })
    for (const [cn, list] of Object.entries(grouped)) {
      const out: Record<string, number> = {}
      for (const sub of subjects as any[]) {
        const vals = (list as any[]).map((x) => Number(x.subjectNets?.[sub.code] || 0))
        out[sub.code] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
      }
      map[cn] = out
    }
    return map
  }, [students, subjects, filteredStudents])

  const exportId = `ei-exam-${params.examId}`
  const studentsSectionId = `ei-exam-${params.examId}-students`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  return (
    <div id={exportId} className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="print:hidden">
        <ExportBar
          title="Sınav Detay (Tüm Sayfa)"
          mode="server"
          report={{
            organizationId: currentOrganization?.id || '',
            entityType: 'exam',
            entityId: params.examId,
            section: 'full_page',
          }}
          pdf={{ filename: `Sinav_${data?.exam?.name || params.examId}_${new Date().toISOString().slice(0, 10)}.pdf`, elementId: exportId }}
          excel={{
            filename: `Sinav_${data?.exam?.name || params.examId}`,
            sheetName: 'Sınav Detay',
            rows: (filteredStudents as any[]).map((s: any, i: number) => ({
              sira: i + 1,
              ogrenci_no: s.studentNo || '',
              ad: s.fullName,
              sinif: s.className || '',
              tur: s.studentType,
              net: s.totalNet,
              finans_kalan: s.finance?.balance ?? null,
              finans_vadesi_gecen: s.finance?.overdueCount ?? null,
              ai_durum: s.ai?.status ?? null,
              ...(s.subjectNets || {}),
            })),
            headers: {
              sira: 'Sıra',
              ogrenci_no: 'No',
              ad: 'Ad Soyad',
              sinif: 'Sınıf',
              tur: 'Tür',
              net: 'Net',
              finans_kalan: 'Finans Kalan',
              finans_vadesi_gecen: 'Vadesi Geçen',
              ai_durum: 'AI Durum',
            },
          }}
        />
      </div>

      <ReportHeader
        organizationName={currentOrganization?.name || 'Kurum'}
        organizationLogoUrl={currentOrganization?.logo_url}
        title={data?.exam?.name || 'Sınav Detayı'}
        subtitle={`${data?.exam?.exam_date ? new Date(data.exam.exam_date).toLocaleDateString('tr-TR') : '-'} • ${data?.exam?.exam_type || '-'}`}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-gray-900">{data?.exam?.name || 'Sınav Detayı'}</h1>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {data?.exam?.exam_date ? new Date(data.exam.exam_date).toLocaleDateString('tr-TR') : '-'} • {data?.exam?.exam_type || '-'}
          </p>
        </div>
        <Link href="/admin/exam-intelligence/sinavlar" className="text-sm font-semibold text-[#25D366] hover:underline">
          Sınav listesine dön
        </Link>
      </div>

      {error ? <div className="bg-white border rounded-2xl p-4 text-red-600 font-semibold">{error}</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[ 
          { label: 'Öğrenci', value: data?.stats?.totalStudents || 0, icon: Users, color: '#25D366' },
          { label: 'Ort. Net', value: (data?.stats?.avgNet || 0).toFixed(1), icon: BarChart3, color: '#075E54' },
          { label: 'En Yüksek', value: (data?.stats?.maxNet || 0).toFixed(1), icon: Trophy, color: '#F59E0B' },
          { label: 'Std. Sapma', value: (data?.stats?.stdDev || 0).toFixed(1), icon: GraduationCap, color: '#06B6D4' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: k.color }}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 font-medium">{k.label}</div>
              <k.icon className="w-5 h-5" style={{ color: k.color }} />
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Öğrenci sıralama tablosu */}
      <div id={studentsSectionId} className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">Öğrenci Sıralama</h3>
            <div className="print:hidden">
              <ExportBar
                title="Öğrenci Sıralama"
                mode="server"
                report={{
                  organizationId: currentOrganization?.id || '',
                  entityType: 'exam',
                  entityId: params.examId,
                  section: 'students_table',
                }}
                pdf={{ filename: `Sinav_${data?.exam?.name || params.examId}_Ogrenciler_${new Date().toISOString().slice(0, 10)}.pdf`, elementId: studentsSectionId }}
                excel={{
                  filename: `Sinav_${data?.exam?.name || params.examId}_Ogrenciler`,
                  sheetName: 'Öğrenciler',
                  rows: (filteredStudents as any[]).map((s: any, i: number) => ({
                    sira: i + 1,
                    ogrenci_no: s.studentNo || '',
                    ad: s.fullName,
                    sinif: s.className || '',
                    tur: s.studentType,
                    net: s.totalNet,
                    finans_kalan: s.finance?.balance ?? null,
                    finans_vadesi_gecen: s.finance?.overdueCount ?? null,
                    ai_durum: s.ai?.status ?? null,
                    ...(s.subjectNets || {}),
                  })),
                  headers: {
                    sira: 'Sıra',
                    ogrenci_no: 'No',
                    ad: 'Ad Soyad',
                    sinif: 'Sınıf',
                    tur: 'Tür',
                    net: 'Net',
                    finans_kalan: 'Finans Kalan',
                    finans_vadesi_gecen: 'Vadesi Geçen',
                    ai_durum: 'AI Durum',
                  },
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara (ad soyad)..."
                className="pl-9 pr-3 py-2 rounded-xl border bg-gray-50 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="py-2 px-3 rounded-xl border bg-gray-50 text-sm">
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Sınıf: Tümü' : c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="py-2 px-3 rounded-xl border bg-gray-50 text-sm">
                <option value="all">Tip: Tümü</option>
                <option value="asil">Asil</option>
                <option value="misafir">Misafir</option>
              </select>
            </div>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="py-2 px-3 rounded-xl border bg-gray-50 text-sm font-semibold"
              title="Net sıralamasını değiştir"
            >
              Sırala: Net {sortDir === 'asc' ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {typeFilter !== 'misafir' && (contract?.summary?.misafirCount || 0) > 0 ? (
          <div className="mt-4 rounded-xl border bg-amber-50 text-amber-800 px-4 py-3 text-sm font-semibold">
            ⚠️ Bu sınavda <span className="font-black">{contract?.summary?.misafirCount}</span> misafir/eşleşmemiş kayıt var. “Tip: Misafir” filtresiyle listeleyip eşleştirebilirsiniz.
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-gray-50 z-10">Sıra</th>
                <th className="text-left px-4 py-3 font-semibold sticky left-[72px] bg-gray-50 z-10">No</th>
                <th className="text-left px-4 py-3 font-semibold sticky left-[160px] bg-gray-50 z-10">Öğrenci</th>
                <th className="text-left px-4 py-3 font-semibold">Sınıf</th>
                <th className="text-left px-4 py-3 font-semibold">Tip</th>
                {(subjects || []).map((s: any) => (
                  <th key={s.code} className="text-right px-4 py-3 font-semibold whitespace-nowrap">
                    {s.label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-semibold">Toplam Net</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {(filteredStudents as any[]).map((s: any, idx: number) => {
                const top3 = idx < 3
                const isOpen = expandedRowId === s.rowId
                return (
                  <>
                    <tr
                      key={s.rowId}
                      className={`border-t cursor-pointer hover:bg-emerald-50 ${top3 ? 'bg-gradient-to-r from-emerald-50 to-white' : ''}`}
                      onClick={() => setExpandedRowId((cur) => (cur === s.rowId ? null : s.rowId))}
                    >
                      <td className="px-4 py-3 font-black text-gray-900 sticky left-0 bg-white z-10">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-700 sticky left-[72px] bg-white z-10">{s.studentNo || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 sticky left-[160px] bg-white z-10 whitespace-nowrap">
                        {s.fullName}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.className || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.studentType === 'misafir' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {s.studentType === 'misafir' ? 'Misafir' : 'Asil'}
                        </span>
                      </td>
                      {(subjects || []).map((sub: any) => (
                        <td key={sub.code} className="px-4 py-3 text-right font-bold text-[#075E54]">
                          {Number(s.subjectNets?.[sub.code] || 0).toFixed(1)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-black text-[#25D366]">{Number(s.totalNet || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        {s.studentType === 'misafir' ? (
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation()
                              setMatchOpen(true)
                              setMatchTargetRowId(s.rowId)
                              setMatchSearch(s.fullName || '')
                              setMatchSelectedStudentId(null)
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                            title="Misafir kaydı kurum öğrencisine eşleştir"
                          >
                            Eşleştir
                          </button>
                        ) : (
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation()
                              if (s.studentId) router.push(`/admin/exam-intelligence/ogrenciler/${encodeURIComponent(s.studentId)}`)
                            }}
                            className="px-3 py-2 rounded-xl bg-white border font-semibold hover:bg-gray-50"
                            title="Öğrenci detayına git"
                          >
                            Detay
                          </button>
                        )}
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className="border-t bg-gray-50">
                        <td colSpan={6 + (subjects || []).length} className="px-4 py-4">
                          <div className="bg-white rounded-2xl border p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="font-black text-gray-900">{s.fullName} - Detay</div>
                              <button
                                onClick={() => setExpandedRowId(null)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                              >
                                <X className="w-4 h-4" /> Kapat
                              </button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="rounded-xl border p-3 bg-white">
                                <div className="text-xs text-gray-500 font-semibold">Net</div>
                                <div className="text-2xl font-black text-[#25D366]">{Number(s.totalNet || 0).toFixed(2)}</div>
                              </div>
                              <div className="rounded-xl border p-3 bg-white">
                                <div className="text-xs text-gray-500 font-semibold">Sınıf</div>
                                <div className="text-lg font-black text-gray-900">{s.className || '-'}</div>
                              </div>
                              <div className="rounded-xl border p-3 bg-white">
                                <div className="text-xs text-gray-500 font-semibold">Tür</div>
                                <div className="text-lg font-black text-gray-900">{s.studentType === 'misafir' ? 'Misafir' : 'Asil'}</div>
                              </div>
                            </div>

                            {/* Finans özeti (Asil) */}
                            {s.studentType === 'asil' && s.finance ? (
                              <div className="mt-4 rounded-2xl border p-4 bg-white">
                                <div className="text-sm font-black text-gray-900">Finans Özeti</div>
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
                                  <div className="rounded-xl border p-3 bg-gray-50">
                                    <div className="text-xs text-gray-500 font-semibold">Toplam</div>
                                    <div className="text-lg font-black text-gray-900">₺{Number(s.finance.totalAmount || 0).toLocaleString('tr-TR')}</div>
                                  </div>
                                  <div className="rounded-xl border p-3 bg-gray-50">
                                    <div className="text-xs text-gray-500 font-semibold">Ödenen</div>
                                    <div className="text-lg font-black text-emerald-700">₺{Number(s.finance.paidAmount || 0).toLocaleString('tr-TR')}</div>
                                  </div>
                                  <div className="rounded-xl border p-3 bg-gray-50">
                                    <div className="text-xs text-gray-500 font-semibold">Kalan</div>
                                    <div className="text-lg font-black text-red-700">₺{Number(s.finance.balance || 0).toLocaleString('tr-TR')}</div>
                                  </div>
                                  <div className="rounded-xl border p-3 bg-gray-50">
                                    <div className="text-xs text-gray-500 font-semibold">Vadesi Geçen</div>
                                    <div className="text-lg font-black text-amber-700">{Number(s.finance.overdueCount || 0)}</div>
                                  </div>
                                  <div className="rounded-xl border p-3 bg-gray-50">
                                    <div className="text-xs text-gray-500 font-semibold">Bekleyen</div>
                                    <div className="text-lg font-black text-gray-900">{Number(s.finance.pendingCount || 0)}</div>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {/* AI özeti (Asil) */}
                            {s.studentType === 'asil' && s.ai ? (
                              <div className="mt-4 rounded-2xl border p-4 bg-white">
                                <div className="text-sm font-black text-gray-900">AI Notu</div>
                                <div className="mt-2 text-sm text-gray-700">
                                  {s.ai.status === 'ready' ? (
                                    <div>
                                      <div className="font-semibold">{s.ai.summary || 'AI raporu hazır.'}</div>
                                      {s.ai.source ? <div className="mt-1 text-xs text-gray-500">Kaynak: {s.ai.source}</div> : null}
                                    </div>
                                  ) : s.ai.status === 'pending' ? (
                                    'AI raporu hazırlanıyor...'
                                  ) : s.ai.status === 'failed' ? (
                                    'AI raporu üretilemedi (failed).'
                                  ) : (
                                    'AI raporu henüz üretilmedi.'
                                  )}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-4 overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                  <tr>
                                    <th className="text-left px-3 py-2 font-semibold">Ders</th>
                                    <th className="text-right px-3 py-2 font-semibold">Net</th>
                                    <th className="text-right px-3 py-2 font-semibold">Sınıf Ort.</th>
                                    <th className="text-right px-3 py-2 font-semibold">Fark</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(subjects || []).map((sub: any) => {
                                    const net = Number(s.subjectNets?.[sub.code] || 0)
                                    const clsAvg = Number(classAvgBySubject?.[String(s.className || 'Belirsiz')]?.[sub.code] || 0)
                                    const diff = Math.round((net - clsAvg) * 10) / 10
                                    const diffCls = diff > 0 ? 'text-emerald-700 bg-emerald-50' : diff < 0 ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50'
                                    return (
                                      <tr key={sub.code} className="border-t">
                                        <td className="px-3 py-2 font-semibold text-gray-900">{sub.label}</td>
                                        <td className="px-3 py-2 text-right font-black text-[#075E54]">{net.toFixed(1)}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-700">{clsAvg.toFixed(1)}</td>
                                        <td className="px-3 py-2 text-right">
                                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${diffCls}`}>
                                            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 ? <div className="mt-4 text-center text-gray-500">Kriterlere uygun öğrenci yok.</div> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold text-gray-900">Sınıf Karşılaştırması</h3>
          {classChart.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classChart} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip formatter={(value: number) => [`${value} net`, 'Ortalama']} />
                  <Bar dataKey="net" fill="#25D366" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 text-gray-500">Sınıf verisi yok.</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold text-gray-900">Top 10 Öğrenci (Asil/Misafir)</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {(data?.topStudents || []).slice(0, 10).map((s) => (
              <div key={s.rank} className="p-3 rounded-xl bg-gray-50 border text-center">
                <div className="text-xs font-bold text-gray-500">#{s.rank}</div>
                <div className="mt-2 text-xs font-semibold text-gray-900 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-600 truncate">{s.class}</div>
                <div className={`mt-1 text-[11px] font-bold ${s.studentType === 'misafir' ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {s.studentType === 'misafir' ? 'Misafir' : 'Asil'}
                </div>
                <div className="mt-1 text-sm font-black text-[#25D366]">{Number(s.net || 0).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900">Sınıf Tablosu</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Sınıf</th>
                <th className="text-right px-4 py-3 font-semibold">Ort. Net</th>
                <th className="text-right px-4 py-3 font-semibold">Öğrenci</th>
              </tr>
            </thead>
            <tbody>
              {(data?.classComparison || []).map((c) => (
                <tr key={c.className} className="border-t">
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.className}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#075E54]">{Number(c.avgNet || 0).toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{c.studentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Modal */}
      {matchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-black text-gray-900">Misafir Kaydı Eşleştir</div>
              <button
                onClick={() => {
                  setMatchOpen(false)
                  setMatchTargetRowId(null)
                  setMatchCandidates([])
                  setMatchSelectedStudentId(null)
                  setMatchSearch('')
                }}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-600">
                Amaç: misafir kaydı, kurumdaki gerçek öğrenciye bağlamak. Bu işlem ilgili satırın <span className="font-bold">student_id</span> alanını günceller.
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  placeholder="Öğrenci ara (ad, soyad, numara)... (en az 2 karakter)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-gray-50"
                />
              </div>
              <div className="max-h-[320px] overflow-auto border rounded-xl">
                {(matchCandidates || []).length ? (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Öğrenci</th>
                        <th className="text-left px-3 py-2 font-semibold">No</th>
                        <th className="text-left px-3 py-2 font-semibold">Sınıf</th>
                        <th className="text-right px-3 py-2 font-semibold">Seç</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchCandidates.map((c: any) => {
                        const id = String(c.id)
                        const name = `${c.first_name || ''} ${c.last_name || ''}`.trim()
                        const cls = c.class ? `${c.class}${c.section ? `-${c.section}` : ''}` : '-'
                        return (
                          <tr key={id} className="border-t hover:bg-emerald-50">
                            <td className="px-3 py-2 font-semibold text-gray-900">{name || 'Bilinmiyor'}</td>
                            <td className="px-3 py-2 text-gray-700">{c.student_no || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{cls}</td>
                            <td className="px-3 py-2 text-right">
                              <input type="radio" checked={matchSelectedStudentId === id} onChange={() => setMatchSelectedStudentId(id)} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-sm text-gray-500">Arama yapın (en az 2 karakter).</div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setMatchOpen(false)}
                disabled={matchBusy}
                className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50 font-semibold"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!currentOrganization?.id) return
                  if (!matchTargetRowId || !matchSelectedStudentId) return
                  setMatchBusy(true)
                  try {
                    const res = await fetch(`/api/exam-intelligence/exams/${encodeURIComponent(params.examId)}/match`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        organizationId: currentOrganization.id,
                        resultRowId: matchTargetRowId,
                        studentId: matchSelectedStudentId,
                      }),
                    })
                    const json = await res.json().catch(() => null)
                    if (!res.ok || !json?.ok) {
                      alert(json?.error || `Eşleştirme başarısız (HTTP ${res.status})`)
                      return
                    }
                    // Refresh exam data
                    const r2 = await fetch(
                      `/api/exam-intelligence/exams/${params.examId}?organizationId=${currentOrganization.id}&includeStudents=1&_ts=${Date.now()}`,
                      { cache: 'no-store' },
                    )
                    const j2 = await r2.json()
                    setData((j2.data ?? j2) as ApiResp)
                    setMatchOpen(false)
                  } catch (e) {
                    console.error(e)
                    alert('Eşleştirme sırasında hata oluştu.')
                  } finally {
                    setMatchBusy(false)
                  }
                }}
                disabled={matchBusy || !matchSelectedStudentId || !matchTargetRowId}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-50"
              >
                {matchBusy ? 'Eşleştiriliyor...' : 'Eşleştir'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
