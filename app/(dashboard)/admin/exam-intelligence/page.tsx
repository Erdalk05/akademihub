'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import Link from 'next/link';
import {
  Users, BookOpen, Target, Trophy, TrendingUp, AlertTriangle,
  RefreshCw, Loader2, GraduationCap, BarChart3, FileText, Trash2, Bot
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardData {
  kpis: { totalExams: number; totalStudents: number; avgNet: number; maxNet: number; stdDev: number; riskCount: number };
  healthScore: number;
  classPerformance: { name: string; avgNet: number; studentCount: number; subjects: Record<string, number> }[];
  subjectAverages: Record<string, number>;
  top5Students: { rank: number; name: string; class: string; net: number; initials: string; subjects: Record<string, number> }[];
  examTimeline: { id: string; name: string; date: string; type: string; subjects: Record<string, number> }[];
  aiComments: string[];
  risks: { name: string; class: string; net: number }[];
}

const ADMIN_PIN = '1234';

export default function ExamIntelligenceDashboard() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'all' | 'institution' | 'guest'>('all');

  const fetchData = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/summary?organizationId=${currentOrganization.id}&scope=${scope}`);
      setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentOrganization?.id, scope]);

  const handleDeleteExam = async (examId: string, examName: string) => {
    const pin = window.prompt(`"${examName}" sınavını silmek için ADMIN PIN giriniz:`);
    if (pin !== ADMIN_PIN) {
      if (pin !== null) alert('Hatalı PIN!');
      return;
    }
    const confirm = window.confirm(`"${examName}" sınavı kalıcı olarak silinecek. Emin misiniz?`);
    if (!confirm) return;
    try {
      await fetch(`/api/admin/exams/${examId}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#25D366]" /></div>;

  const k = data?.kpis || { totalExams: 0, totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0, riskCount: 0 };
  const health = data?.healthScore || 0;
  const subjectData = Object.entries(data?.subjectAverages || {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fullMark: 20 }));
  const radarData = subjectData.map(s => ({ subject: s.name.slice(0, 3).toUpperCase(), A: s.value, fullMark: 20 }));
  const healthPieData = [{ value: health }, { value: 100 - health }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-3xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Exam Intelligence</h1>
            <p className="text-white/80 mt-1">{currentOrganization?.name || 'Dashboard'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/20 rounded-full p-1">
              {(['all', 'institution', 'guest'] as const).map(s => (
                <button key={s} onClick={() => setScope(s)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${scope === s ? 'bg-white text-[#075E54] shadow' : 'text-white/80 hover:text-white'}`}>
                  {s === 'all' ? 'Tümü' : s === 'institution' ? 'Kurum' : 'Misafir'}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"><RefreshCw className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Aktif Öğrenci', value: k.totalStudents, icon: Users, color: '#25D366' },
          { label: 'Toplam Sınav', value: k.totalExams, icon: BookOpen, color: '#128C7E' },
          { label: 'Genel Ort.', value: k.avgNet, icon: Target, color: '#075E54' },
          { label: 'En Yüksek', value: k.maxNet, icon: Trophy, color: '#FFC107' },
          { label: 'Std. Sapma', value: k.stdDev, icon: TrendingUp, color: '#6366F1' },
          { label: 'Risk', value: k.riskCount, icon: AlertTriangle, color: '#EF4444' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-lg border-b-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" style={{ borderColor: kpi.color }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">{kpi.label}</p>
                <p className="text-3xl font-black text-gray-800 mt-1">{kpi.value}</p>
              </div>
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${kpi.color}15` }}>
                <kpi.icon size={26} style={{ color: kpi.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Health Score + Subject Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Akademik Sağlık Skoru</h3>
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={healthPieData} innerRadius={60} outerRadius={80} startAngle={180} endAngle={0} dataKey="value" stroke="none">
                  <Cell fill="#25D366" />
                  <Cell fill="#E5E7EB" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
              <span className="text-5xl font-black text-[#075E54]">{health}</span>
              <span className="text-[#25D366] text-sm font-bold">{health >= 70 ? 'İYİ' : health >= 50 ? 'ORTA' : 'DİKKAT'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Ders Ortalamaları</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 20]} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#25D366" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Cards (Horizontal) */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Trophy className="text-yellow-500" /> Sınıf Performans Liderleri
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(data?.classPerformance || []).slice(0, 8).map((c, i) => (
            <div key={c.name} onClick={() => router.push(`/admin/exam-intelligence/siniflar/${c.name}`)} className="min-w-[200px] p-4 rounded-2xl border-2 border-gray-100 hover:border-[#25D366] hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-300'}`}>{i + 1}</span>
                <span className="font-bold text-gray-800">{c.name}</span>
              </div>
              <p className="text-3xl font-black text-[#25D366]">{c.avgNet}</p>
              <p className="text-xs text-gray-500 mb-3">{c.studentCount} sonuç</p>
              <div className="flex gap-1">
                {Object.entries(c.subjects || {}).slice(0, 5).map(([subj, val]) => (
                  <div key={subj} className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-[#25D366]" style={{ width: `${(val / 20) * 100}%` }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Timeline */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Son 5 Sınav</h3>
        <div className="space-y-3">
          {(data?.examTimeline || []).map(exam => (
            <div key={exam.id} className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-[#25D366] transition group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#25D366]/10 flex flex-col items-center justify-center">
                  <span className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                  <span className="text-xl font-black text-[#075E54]">{new Date(exam.date).getDate()}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">{exam.name}</p>
                  <p className="text-xs text-gray-500">{exam.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Object.entries(exam.subjects || {}).map(([subj, val]) => (
                  <span key={subj} className={`px-3 py-1 rounded-full text-xs font-bold ${val >= 15 ? 'bg-green-100 text-green-700' : val >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {subj.slice(0, 3).toUpperCase()}: {val}
                  </span>
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id, exam.name); }} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-100 text-red-500 transition">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Students + Radar + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Zirve 5 Öğrenci</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {(data?.top5Students || []).map(st => (
              <div key={st.rank} className="rounded-2xl border-2 border-gray-100 p-4 text-center hover:border-[#25D366] hover:shadow-lg transition cursor-pointer" onClick={() => router.push(`/admin/exam-intelligence/ogrenciler/${st.name}`)}>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {st.initials}
                </div>
                <p className="mt-3 font-bold text-gray-800 truncate">{st.name}</p>
                <p className="text-sm text-gray-500">{st.class}</p>
                <p className="text-2xl font-black text-[#25D366] mt-2">{st.net}</p>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {Object.entries(st.subjects || {}).slice(0, 4).map(([s, v]) => (
                    <div key={s} className="flex justify-between">
                      <span>{s.slice(0, 3).toUpperCase()}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Rehberlik Radarı</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 10 }} />
                <Radar name="Ortalama" dataKey="A" stroke="#25D366" fill="#25D366" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-[#075E54] to-[#128C7E] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={24} />
              <span className="font-bold">AkademiHub AI</span>
            </div>
            <ul className="space-y-2 text-sm text-white/90 italic">
              {(data?.aiComments || []).length > 0 ? data?.aiComments.map((c, i) => (
                <li key={i}>• {c}</li>
              )) : <li>• Henüz yeterli veri yok.</li>}
            </ul>
            <div className="absolute -bottom-4 -right-4 text-8xl font-black opacity-10">AI</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/exam-intelligence/siniflar', label: 'Sınıf Analizi', icon: GraduationCap, color: '#25D366' },
          { href: '/admin/exam-intelligence/ogrenciler', label: 'Öğrenci Analizi', icon: Users, color: '#128C7E' },
          { href: '/admin/exam-intelligence/sinavlar', label: 'Sınav Sonuçları', icon: BarChart3, color: '#6366F1' },
          { href: '/admin/akademik-analiz/sihirbaz', label: 'Yeni Sınav', icon: FileText, color: '#FFC107' },
        ].map((l, i) => (
          <Link key={i} href={l.href} className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${l.color}15` }}>
              <l.icon size={22} style={{ color: l.color }} />
            </div>
            <span className="font-bold text-gray-700 group-hover:text-[#25D366] transition">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
