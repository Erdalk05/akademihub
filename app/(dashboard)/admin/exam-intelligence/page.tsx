'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '@/lib/store/organizationStore'
import {
  AlertTriangle,
  BarChart3,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type GradeValue = 'all' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun'

type DashboardData = {
  stats: {
    totalStudents: number
    totalExams: number
    avgNet: number
    maxNet: number
    stdDev: number
    riskCount: number
  }
  recentExams: Array<{ id: string; name: string; exam_date: string; exam_type: string; grade_level: string | null }>
  classPerformance: Array<{ name: string; avgNet: number; studentCount: number }>
  topStudents: Array<{ rank: number; studentId: string | null; name: string; class: string; net: number; score: number; initials: string }>
}

const GRADE_LEVELS: Array<{ value: GradeValue; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8 (LGS)' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12 (YKS)' },
  { value: 'mezun', label: 'Mezun' },
]

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function buildAiNotes(stats: DashboardData['stats']) {
  const notes: string[] = []
  if (stats.totalExams === 0) return ['Henüz sınav yok. İlk sınavı ekleyerek analizleri başlatın.']

  if (stats.stdDev >= 15) notes.push('Dağılım geniş: sınıflar arası seviye farkı yüksek olabilir. Gruplama + hedefli etüt önerilir.')
  if (stats.riskCount >= 1) notes.push(`Risk eşiği altındaki öğrenci sayısı: ${stats.riskCount}. Bireysel takip listesi açın.`)
  if (stats.avgNet >= 50) notes.push('Genel ortalama güçlü: kazanım bazlı derinleştirme ve hız çalışmalarıyla üst dilime çıkılabilir.')
  if (stats.avgNet > 0 && stats.avgNet < 35) notes.push('Genel ortalama düşük: temel kazanım eksiklerini (Türkçe/Mat) tarama sınavlarıyla netleştirin.')

  return notes.length ? notes : ['Veri yeterli ama belirgin bir risk/ayrışma sinyali yok. Trendleri 5 sınav üzerinden izleyin.']
}

export default function ExamIntelligenceDashboard() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationStore()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradeValue>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (showRefresh = false) => {
    if (!currentOrganization?.id) {
      setLoading(false)
      return
    }

    if (showRefresh) setRefreshing(true)
    setError(null)

    try {
      const gradeParam = selectedGrade !== 'all' ? `&grade=${encodeURIComponent(selectedGrade)}` : ''
      const res = await fetch(`/api/exam-intelligence/dashboard?organizationId=${currentOrganization.id}${gradeParam}`)
      const json = (await res.json()) as DashboardData
      setData(json)
    } catch (e) {
      console.error(e)
      setError('Veriler alınamadı. Lütfen tekrar deneyin.')
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id, selectedGrade])

  const stats = data?.stats || { totalStudents: 0, totalExams: 0, avgNet: 0, maxNet: 0, stdDev: 0, riskCount: 0 }

  const healthScore = useMemo(() => {
    if (stats.totalExams === 0) return 0
    const avgScore = clamp((stats.avgNet / 80) * 45, 0, 45)
    const consistency = clamp(30 - stats.stdDev, 0, 30)
    const risk = clamp(25 - stats.riskCount * 2.5, 0, 25)
    return Math.round(avgScore + consistency + risk)
  }, [stats.avgNet, stats.riskCount, stats.stdDev, stats.totalExams])

  const healthColor = healthScore >= 75 ? '#25D366' : healthScore >= 55 ? '#F59E0B' : '#EF4444'
  const healthLabel = healthScore >= 75 ? 'İyi' : healthScore >= 55 ? 'Orta' : 'Risk'

  const chartData = useMemo(() => {
    return (data?.classPerformance || []).slice(0, 10).map((c) => ({ name: c.name, net: Number((c.avgNet ?? 0).toFixed(1)) }))
  }, [data?.classPerformance])

  const aiNotes = useMemo(() => buildAiNotes(stats), [stats])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 text-red-600 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Hata
          </div>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="mt-4 w-full rounded-xl bg-[#25D366] text-white py-2 font-semibold"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  if (!data || (data?.recentExams || []).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-lg">
          <FileText className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-700 text-lg font-semibold mb-1">Henüz sınav verisi yok</p>
          <p className="text-gray-500 text-sm mb-4">Sihirbazdan sınav ekleyin, ardından sınıf/öğrenci analizleri otomatik oluşur.</p>
          <Link
            href="/admin/akademik-analiz/sihirbaz"
            className="inline-flex items-center justify-center rounded-xl bg-[#25D366] text-white px-5 py-2 font-semibold"
          >
            Yeni Sınav
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Sınav Sonuçları Merkezi</h1>
            <p className="text-white/80 mt-1">{currentOrganization?.name || 'Kurum'} • 4-12 & Mezun</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/admin/akademik-analiz/sihirbaz"
              className="px-4 py-2 rounded-xl bg-white text-[#075E54] font-bold"
            >
              Yeni Sınav
            </Link>
          </div>
        </div>
      </div>

      {/* Grade selector */}
      <div className="flex flex-wrap gap-2">
        {GRADE_LEVELS.map((g) => (
          <button
            key={g.value}
            onClick={() => setSelectedGrade(g.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedGrade === g.value
                ? 'bg-[#25D366] text-white shadow'
                : 'bg-white text-gray-700 hover:bg-[#DCF8C6] border border-gray-200'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Aktif Öğrenci', value: stats.totalStudents, icon: Users, color: '#25D366' },
          { label: 'Toplam Sınav', value: stats.totalExams, icon: FileText, color: '#128C7E' },
          { label: 'Genel Ort.', value: stats.avgNet.toFixed(1), icon: Target, color: '#075E54' },
          { label: 'En Yüksek', value: stats.maxNet.toFixed(1), icon: Trophy, color: '#F59E0B' },
          { label: 'Std. Sapma', value: stats.stdDev.toFixed(1), icon: BarChart3, color: '#06B6D4' },
          { label: 'Risk', value: stats.riskCount, icon: AlertTriangle, color: '#EF4444' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: kpi.color }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 font-medium">{kpi.label}</span>
              <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
            </div>
            <div className="text-3xl font-black text-gray-900">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Health + Class chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#25D366]" />
            Akademik Sağlık Skoru
          </h3>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle cx="88" cy="88" r="78" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  stroke={healthColor}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(healthScore / 100) * 490} 490`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black" style={{ color: healthColor }}>
                  {healthScore}
                </span>
                <span className="text-sm font-bold" style={{ color: healthColor }}>
                  {healthLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Skor; genel ortalama, standart sapma ve riskli öğrenci yoğunluğundan hesaplanır.
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#25D366]" />
              Sınıf Ortalamaları (Net)
            </h3>
            <Link href="/admin/exam-intelligence/siniflar" className="text-sm text-[#25D366] font-semibold hover:underline">
              Tümü
            </Link>
          </div>

          {chartData.length > 0 ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip formatter={(value: number) => [`${value} net`, 'Ortalama']} />
                  <Bar dataKey="net" fill="#25D366" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6 text-center text-gray-400">Grafik verisi yok</div>
          )}
        </div>
      </div>

      {/* Recent exams + Top students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Son Sınavlar</h3>
            <Link href="/admin/exam-intelligence/sinavlar" className="text-sm text-[#25D366] font-semibold hover:underline">
              Tümü
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {(data?.recentExams || []).slice(0, 5).map((exam) => (
              <button
                key={exam.id}
                onClick={() => router.push(`/admin/exam-intelligence/sinavlar/${exam.id}`)}
                className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-[#DCF8C6] transition"
              >
                <div>
                  <div className="font-semibold text-gray-900">{exam.name}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(exam.exam_date).toLocaleDateString('tr-TR')} • {exam.exam_type} • {exam.grade_level || '-'}
                  </div>
                </div>
                <div className="text-xs font-bold text-[#075E54]">Detay</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Başarı Rozetleri (Top 10)</h3>
            <Link href="/admin/exam-intelligence/ogrenciler" className="text-sm text-[#25D366] font-semibold hover:underline">
              Tümü
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {(data?.topStudents || []).slice(0, 10).map((s, idx) => (
              <button
                key={`${s.rank}-${s.name}`}
                onClick={() =>
                  s.studentId
                    ? router.push(`/admin/exam-intelligence/ogrenciler/${encodeURIComponent(s.studentId)}`)
                    : router.push('/admin/exam-intelligence/ogrenciler')
                }
                className={`relative p-3 rounded-xl text-center border transition hover:shadow ${
                  idx < 3 ? 'bg-gradient-to-br from-[#DCF8C6] to-white border-[#25D366]' : 'bg-gray-50 border-gray-200 hover:bg-[#DCF8C6]'
                }`}
              >
                <div className="text-xs font-bold text-gray-500">#{s.rank}</div>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-black mt-2 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-[#25D366]'}`}>
                  {s.initials || '??'}
                </div>
                <div className="mt-2 text-[11px] font-semibold text-gray-900 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-600 truncate">{s.class}</div>
                <div className="mt-1 text-sm font-black text-[#25D366]">{Number(s.net || 0).toFixed(1)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI notes + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Öneriler (Kural Tabanlı)</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {aiNotes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#25D366]" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Hızlı Erişim</h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <Link href="/admin/exam-intelligence/sinavlar" className="p-3 rounded-xl border bg-gray-50 hover:bg-[#DCF8C6] transition font-semibold text-gray-900">
              Sınavlar
            </Link>
            <Link href="/admin/exam-intelligence/siniflar" className="p-3 rounded-xl border bg-gray-50 hover:bg-[#DCF8C6] transition font-semibold text-gray-900">
              Sınıflar
            </Link>
            <Link href="/admin/exam-intelligence/ogrenciler" className="p-3 rounded-xl border bg-gray-50 hover:bg-[#DCF8C6] transition font-semibold text-gray-900">
              Öğrenciler
            </Link>
            <Link href="/admin/akademik-analiz/sihirbaz" className="p-3 rounded-xl border bg-gray-50 hover:bg-[#DCF8C6] transition font-semibold text-gray-900">
              Yeni Sınav (Sihirbaz)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
