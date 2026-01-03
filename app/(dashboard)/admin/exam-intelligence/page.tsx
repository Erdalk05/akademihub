'use client';

import { useEffect, useState } from 'react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Users, Target, TrendingUp, BarChart3, FileText, GraduationCap, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: { totalExams: number; totalStudents: number; avgNet: number; maxNet: number; stdDev: number };
  recentExams: { id: string; name: string; exam_date: string; exam_type: string; grade_level: string }[];
  classPerformance: { name: string; avgNet: number; studentCount: number }[];
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
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentOrganization?.id]);

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  const stats = data?.stats || { totalExams: 0, totalStudents: 0, avgNet: 0, maxNet: 0, stdDev: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Exam Intelligence</h1><p className="text-emerald-100">{currentOrganization?.name}</p></div>
        <button onClick={fetchData} className="p-2 bg-white/20 rounded-lg hover:bg-white/30"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Sınav', value: stats.totalExams, icon: FileText, color: 'blue' },
          { label: 'Öğrenci', value: stats.totalStudents, icon: Users, color: 'indigo' },
          { label: 'Ort. Net', value: stats.avgNet, icon: Target, color: 'emerald' },
          { label: 'Max Net', value: stats.maxNet, icon: TrendingUp, color: 'purple' },
          { label: 'Std. Sapma', value: stats.stdDev, icon: BarChart3, color: 'amber' },
        ].map((s, i) => (
          <div key={i} className={`bg-white rounded-xl p-4 shadow border-l-4 border-${s.color}-500`}>
            <div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-500">{s.label}</span><s.icon className={`w-5 h-5 text-${s.color}-500`} /></div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/exam-intelligence/siniflar', label: 'Sınıf Analizi', icon: GraduationCap },
          { href: '/admin/exam-intelligence/ogrenciler', label: 'Öğrenci Analizi', icon: Users },
          { href: '/admin/exam-intelligence/sinavlar', label: 'Sınav Sonuçları', icon: BarChart3 },
          { href: '/admin/akademik-analiz/sihirbaz', label: 'Yeni Sınav', icon: FileText },
        ].map((l, i) => (
          <Link key={i} href={l.href} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100"><l.icon className="w-5 h-5 text-emerald-600" /><span>{l.label}</span></Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold mb-4">Son Sınavlar</h3>
          {(data?.recentExams || []).length === 0 ? <p className="text-gray-400 text-center py-8">Henüz sınav yok</p> : (
            <div className="space-y-2">{data?.recentExams.map(e => (
              <Link key={e.id} href={`/admin/exam-intelligence/sinavlar/${e.id}`} className="flex justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div><p className="font-medium">{e.name}</p><p className="text-xs text-gray-500">{e.exam_type}</p></div>
                <span className="text-sm text-gray-400">{new Date(e.exam_date).toLocaleDateString('tr-TR')}</span>
              </Link>
            ))}</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold mb-4">Sınıf Performansı</h3>
          {(data?.classPerformance || []).length === 0 ? <p className="text-gray-400 text-center py-8">Veri yok</p> : (
            <div className="space-y-2">{data?.classPerformance.slice(0, 8).map((c, i) => (
              <div key={c.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>{i + 1}</span>
                  <span className="font-medium">{c.name}</span>
                </div>
                <div className="text-right"><p className="font-bold text-emerald-600">{c.avgNet}</p><p className="text-xs text-gray-500">{c.studentCount} sonuç</p></div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}
