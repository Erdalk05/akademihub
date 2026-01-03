'use client';

import { useEffect, useState } from 'react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Users, BookOpen, Target, Trophy, TrendingUp, AlertTriangle, RefreshCw, Loader2, GraduationCap, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: { totalExams: number; totalStudents: number; avgNet: number; maxNet: number; stdDev: number; riskCount: number };
  recentExams: { id: string; name: string; exam_date: string; exam_type: string }[];
  classPerformance: { name: string; avgNet: number; studentCount: number }[];
  topStudents: { rank: number; name: string; class: string; net: number; score: number; initials: string }[];
}

export default function ExamIntelligenceDashboard() {
  const { currentOrganization } = useOrganizationStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exam-intelligence/dashboard?organizationId=${currentOrganization.id}`);
      setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentOrganization?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#25D366]" /></div>;

  const s = data?.stats || { totalExams: 0, totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0, riskCount: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">Exam Intelligence</h1>
            <p className="text-white/80">{currentOrganization?.name || 'Dashboard'}</p>
          </div>
          <button onClick={fetchData} className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Aktif Öğrenci', value: s.totalStudents, icon: Users, color: '#25D366' },
          { label: 'Toplam Sınav', value: s.totalExams, icon: BookOpen, color: '#128C7E' },
          { label: 'Genel Ort.', value: s.avgNet, icon: Target, color: '#075E54' },
          { label: 'En Yüksek', value: s.maxNet, icon: Trophy, color: '#FFC107' },
          { label: 'Std. Sapma', value: s.stdDev, icon: TrendingUp, color: '#6366F1' },
          { label: 'Risk', value: s.riskCount, icon: AlertTriangle, color: '#EF4444' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-md border-b-4 hover:shadow-lg transition" style={{ borderColor: k.color }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">{k.label}</p>
                <p className="text-3xl font-black text-gray-800 mt-1">{k.value}</p>
              </div>
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${k.color}20` }}>
                <k.icon size={24} style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/exam-intelligence/siniflar', label: 'Sınıf Analizi', icon: GraduationCap, color: '#25D366' },
          { href: '/admin/exam-intelligence/ogrenciler', label: 'Öğrenci Analizi', icon: Users, color: '#128C7E' },
          { href: '/admin/exam-intelligence/sinavlar', label: 'Sınav Sonuçları', icon: BarChart3, color: '#6366F1' },
          { href: '/admin/akademik-analiz/sihirbaz', label: 'Yeni Sınav', icon: FileText, color: '#FFC107' },
        ].map((l, i) => (
          <Link key={i} href={l.href} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-md transition group">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${l.color}20` }}>
              <l.icon size={20} style={{ color: l.color }} />
            </div>
            <span className="font-semibold text-gray-700 group-hover:text-[#25D366] transition">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sınıf Liderliği */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-500" /> Sınıf Performans Liderleri
          </h3>
          {(data?.classPerformance || []).length === 0 ? (
            <p className="text-gray-400 text-center py-8">Henüz veri yok</p>
          ) : (
            <div className="space-y-2">
              {data?.classPerformance.slice(0, 8).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-300'}`}>
                      {i + 1}
                    </span>
                    <span className="font-semibold text-gray-800">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#25D366] text-lg">{c.avgNet}</p>
                    <p className="text-xs text-gray-500">{c.studentCount} sonuç</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son Sınavlar */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Son Sınavlar</h3>
          {(data?.recentExams || []).length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Henüz sınav yok</p>
              <Link href="/admin/akademik-analiz/sihirbaz" className="text-[#25D366] hover:underline text-sm mt-2 inline-block">İlk sınavı ekle →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.recentExams.map(e => (
                <Link key={e.id} href={`/admin/exam-intelligence/sinavlar/${e.id}`} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 hover:bg-[#25D366]/10 transition">
                  <div>
                    <p className="font-semibold text-gray-800">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.exam_type}</p>
                  </div>
                  <span className="text-sm text-gray-400">{new Date(e.exam_date).toLocaleDateString('tr-TR')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Öğrenciler */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top 10 Öğrenci</h3>
        {(data?.topStudents || []).length === 0 ? (
          <p className="text-gray-400 text-center py-8">Henüz veri yok</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data?.topStudents.map((st) => (
              <div key={st.rank} className="rounded-2xl border-2 border-gray-100 p-4 text-center hover:border-[#25D366] hover:shadow-md transition">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-lg shadow">
                  {st.initials}
                </div>
                <p className="mt-3 font-semibold text-gray-800 truncate">{st.name}</p>
                <p className="text-sm text-gray-500">{st.class}</p>
                <p className="text-2xl font-black text-[#25D366] mt-2">{st.net}</p>
                <p className="text-xs text-gray-400">net</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
