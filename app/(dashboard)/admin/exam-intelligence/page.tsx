'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import Link from 'next/link';
import { 
  Users, FileText, Target, Trophy, TrendingUp, TrendingDown,
  BarChart3, AlertTriangle, GraduationCap, RefreshCw, 
  ChevronRight, Award, Activity, Zap, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// ==================== TYPE TANIMLARI ====================
interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  avgNet: number;
  maxNet: number;
  stdDev: number;
  riskCount: number;
}

interface RecentExam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level: string;
}

interface ClassPerformance {
  name: string;
  avgNet: number;
  studentCount: number;
}

interface TopStudent {
  rank: number;
  name: string;
  class: string;
  net: number;
  score: number;
  initials: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentExams: RecentExam[];
  classPerformance: ClassPerformance[];
  topStudents: TopStudent[];
}

// ==================== KADEME SEÇENEKLERİ ====================
const GRADE_LEVELS = [
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
];

// ==================== HELPER FONKSİYONLAR ====================
const getHealthScore = (stats: DashboardStats | null): number => {
  if (!stats || stats.totalExams === 0) return 0;
  const avgNetScore = Math.min((stats.avgNet / 80) * 40, 40);
  const consistencyScore = Math.max(30 - stats.stdDev, 0);
  const riskScore = Math.max(30 - (stats.riskCount * 3), 0);
  return Math.round(avgNetScore + consistencyScore + riskScore);
};

const getHealthColor = (score: number): string => {
  if (score >= 80) return '#25D366';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
};

const getHealthLabel = (score: number): string => {
  if (score >= 80) return 'İyi';
  if (score >= 60) return 'Orta';
  return 'Risk';
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRankBadge = (rank: number): string | null => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
};

// ==================== MAIN COMPONENT ====================
export default function ExamIntelligenceDashboard() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');

  // ==================== VERİ ÇEKME ====================
  const fetchData = async (showRefresh = false) => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true);
    
    try {
      const gradeParam = selectedGrade !== 'all' ? `&grade=${selectedGrade}` : '';
      const res = await fetch(
        `/api/exam-intelligence/dashboard?organizationId=${currentOrganization.id}${gradeParam}`
      );
      
      if (!res.ok) throw new Error('API error');
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrganization?.id, selectedGrade]);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    );
  }

  // ==================== EMPTY STATE ====================
  if (!data || (data?.recentExams || []).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg mb-2">Henüz sınav verisi yok</p>
          <Link 
            href="/admin/akademik-analiz/sihirbaz" 
            className="text-[#25D366] hover:underline font-medium"
          >
            İlk sınavı ekle →
          </Link>
        </div>
      </div>
    );
  }

  // ==================== VERİ HAZIRLIĞI ====================
  const stats = data?.stats || {
    totalStudents: 0,
    totalExams: 0,
    avgNet: 0,
    maxNet: 0,
    stdDev: 0,
    riskCount: 0
  };

  const healthScore = getHealthScore(stats);
  const healthColor = getHealthColor(healthScore);

  // Grafik verisi
  const chartData = (data?.classPerformance || []).slice(0, 8).map(c => ({
    name: c.name,
    net: Number(c.avgNet.toFixed(1))
  }));

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* ==================== HEADER ==================== */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exam Intelligence</h1>
            <p className="text-white/80 mt-1">
              {currentOrganization?.name || 'Kurum'} - Sınav Analiz Merkezi
            </p>
          </div>
          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ==================== KADEME SEÇİCİ ==================== */}
      <div className="flex flex-wrap gap-2">
        {GRADE_LEVELS.map((grade) => (
          <button
            key={grade.value}
            onClick={() => setSelectedGrade(grade.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedGrade === grade.value
                ? 'bg-[#25D366] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-[#DCF8C6] hover:text-[#075E54] border border-gray-200'
            }`}
          >
            {grade.label}
          </button>
        ))}
      </div>

      {/* ==================== İSTATİSTİK KARTLARI ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Aktif Öğrenci */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#25D366]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Aktif Öğrenci</span>
            <Users className="w-5 h-5 text-[#25D366]" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
        </div>

        {/* Toplam Sınav */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#128C7E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Toplam Sınav</span>
            <FileText className="w-5 h-5 text-[#128C7E]" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalExams}</div>
        </div>

        {/* Genel Ortalama */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#075E54]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Genel Ort.</span>
            <Target className="w-5 h-5 text-[#075E54]" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.avgNet.toFixed(1)}</div>
        </div>

        {/* En Yüksek */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">En Yüksek</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.maxNet}</div>
        </div>

        {/* Std. Sapma */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-cyan-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Std. Sapma</span>
            <BarChart3 className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.stdDev.toFixed(1)}</div>
        </div>

        {/* Risk */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Risk</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.riskCount}</div>
        </div>
      </div>

      {/* ==================== SAĞLIK SKORU & GRAFİK ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Akademik Sağlık Skoru */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#25D366]" />
            Akademik Sağlık Skoru
          </h3>
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96" cy="96" r="88"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96" cy="96" r="88"
                  stroke={healthColor}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(healthScore / 100) * 553} 553`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold" style={{ color: healthColor }}>
                  {healthScore}
                </span>
                <span className="text-lg font-medium" style={{ color: healthColor }}>
                  {getHealthLabel(healthScore)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sınıf Ortalamaları Grafiği */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#25D366]" />
            Sınıf Ortalamaları
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 'auto']} />
                <YAxis type="category" dataKey="name" width={50} />
                <Tooltip 
                  formatter={(value: number) => [`${value} net`, 'Ortalama']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="net" fill="#25D366" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Grafik verisi yok
            </div>
          )}
        </div>
      </div>

      {/* ==================== SINIF LİDERLERİ ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Sınıf Performans Liderleri
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {(data?.classPerformance || []).slice(0, 7).map((cls, index) => (
            <div 
              key={cls.name}
              onClick={() => router.push(`/admin/exam-intelligence/siniflar/${encodeURIComponent(cls.name)}`)}
              className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:bg-[#DCF8C6] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'}`}>
                  {index + 1}
                </span>
                <span className="font-semibold text-gray-800">{cls.name}</span>
              </div>
              <div className="text-2xl font-bold text-[#25D366]">{cls.avgNet.toFixed(1)}</div>
              <div className="text-xs text-gray-500">{cls.studentCount} sonuç</div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== SON SINAVLAR & TOP ÖĞRENCİLER ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Son Sınavlar */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#25D366]" />
              Son Sınavlar
            </h3>
            <Link 
              href="/admin/exam-intelligence/sinavlar" 
              className="text-sm text-[#25D366] hover:underline flex items-center gap-1"
            >
              Tümü <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.recentExams || []).slice(0, 5).map((exam) => (
              <div 
                key={exam.id}
                onClick={() => router.push(`/admin/exam-intelligence/sinavlar/${exam.id}`)}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#DCF8C6] rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xs text-gray-500">
                      {new Date(exam.exam_date).toLocaleDateString('tr-TR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-[#25D366]">
                      {new Date(exam.exam_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{exam.name}</p>
                    <p className="text-sm text-gray-500">{exam.exam_type}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Öğrenci */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top 10 Öğrenci
            </h3>
            <Link 
              href="/admin/exam-intelligence/ogrenciler" 
              className="text-sm text-[#25D366] hover:underline flex items-center gap-1"
            >
              Tümü <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(data?.topStudents || []).slice(0, 10).map((student, index) => (
              <div
                key={student.rank}
                onClick={() => router.push(`/admin/exam-intelligence/ogrenciler/${encodeURIComponent(student.name)}`)}
                className={`relative p-3 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg
                  ${index < 3 
                    ? 'bg-gradient-to-br from-[#DCF8C6] to-white border-2 border-[#25D366]' 
                    : 'bg-gray-50 hover:bg-[#DCF8C6]'
                  }`}
              >
                {getRankBadge(index + 1) && (
                  <span className="absolute -top-2 -right-2 text-xl">{getRankBadge(index + 1)}</span>
                )}
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-bold mb-2
                  ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-[#25D366]'}`}>
                  {student.initials || getInitials(student.name)}
                </div>
                <p className="font-medium text-gray-900 text-xs truncate">{student.name}</p>
                <p className="text-xs text-gray-500">{student.class}</p>
                <p className="text-lg font-bold text-[#25D366] mt-1">{student.net}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== HIZLI ERİŞİM ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link 
          href="/admin/exam-intelligence/siniflar" 
          className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-[#25D366] hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[#075E54]" />
          </div>
          <div>
            <span className="font-medium text-gray-900">Sınıf Analizi</span>
            <p className="text-sm text-gray-500">Detaylı raporlar</p>
          </div>
        </Link>

        <Link 
          href="/admin/exam-intelligence/ogrenciler"
          className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-[#25D366] hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-[#075E54]" />
          </div>
          <div>
            <span className="font-medium text-gray-900">Öğrenci Analizi</span>
            <p className="text-sm text-gray-500">Bireysel performans</p>
          </div>
        </Link>

        <Link 
          href="/admin/exam-intelligence/sinavlar"
          className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-[#25D366] hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[#075E54]" />
          </div>
          <div>
            <span className="font-medium text-gray-900">Sınav Sonuçları</span>
            <p className="text-sm text-gray-500">Tüm sınavlar</p>
          </div>
        </Link>

        <Link 
          href="/admin/akademik-analiz/sihirbaz"
          className="flex items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 hover:border-[#25D366] hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#075E54]" />
          </div>
          <div>
            <span className="font-medium text-gray-900">Yeni Sınav</span>
            <p className="text-sm text-gray-500">Sınav oluştur</p>
          </div>
        </Link>
      </div>
    </div>
  );
}