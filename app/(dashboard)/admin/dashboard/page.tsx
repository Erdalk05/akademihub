'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RecentExam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level: string;
}

interface ClassPerf {
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
  stats: {
    totalExams: number;
    totalStudents: number;
    avgNet: number;
    maxNet: number;
    stdDev: number;
    riskCount: number;
  };
  recentExams: RecentExam[];
  classPerformance: ClassPerf[];
  topStudents: TopStudent[];
}

export default function AdminDashboardPage() {
  // Exam Intelligence kaldırıldı; bu sayfayı yeni modül gelene kadar ana dashboard'a yönlendiriyoruz.
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;

  const { currentOrganization } = useOrganizationStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/dashboard/stats?organization_id=${currentOrganization.id}`)
      .then(res => res.json())
      .then(json => {
        // Yeni standard (ok:true, data) veya eski format desteklenir
        const d = json.data ?? json;
        setData(d);
        if (d.recentExams?.length > 0 && !selectedExam) {
          setSelectedExam(d.recentExams[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentOrganization?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (!data || !data.recentExams || data.recentExams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Henüz sınav verisi yok</p>
          <a href="/admin/akademik-analiz/sihirbaz" className="text-[#25D366] hover:underline mt-2 inline-block">
            İlk sınavı ekle →
          </a>
        </div>
      </div>
    );
  }

  const chartData = data.classPerformance.slice(0, 8).map(c => ({
    name: c.name,
    net: c.avgNet,
    ogrenci: c.studentCount
  }));

  const examChartData = data.recentExams.map(e => ({
    name: e.name.length > 10 ? e.name.slice(0, 10) + '...' : e.name,
    tarih: new Date(e.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  })).reverse();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black">Sınav Sonuçları Merkezi</h1>
              <p className="text-white/80 mt-1">{currentOrganization?.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-black">{data.stats.totalExams}</p>
                <p className="text-sm text-white/70">Sınav</p>
              </div>
              <div>
                <p className="text-3xl font-black">{data.stats.totalStudents}</p>
                <p className="text-sm text-white/70">Öğrenci</p>
              </div>
              <div>
                <p className="text-3xl font-black">{data.stats.avgNet}</p>
                <p className="text-sm text-white/70">Ort. Net</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-sm text-gray-500 mb-3 font-medium">Son 5 Sınav</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.recentExams.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam.id)}
                className={`min-w-[160px] p-4 rounded-xl border-2 transition-all ${
                  selectedExam === exam.id
                    ? 'border-[#25D366] bg-[#25D366]/10'
                    : 'border-gray-200 hover:border-[#25D366]/50'
                }`}
              >
                <p className="font-bold text-gray-800 truncate">{exam.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-[#25D366]/20 text-[#075E54] rounded-lg font-medium">
                  {exam.exam_type || 'LGS'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Sınıf Performansları</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 'auto']} />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value} net`, 'Ortalama']}
                />
                <Bar dataKey="net" fill="#25D366" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800 mb-4">İstatistikler</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">En Yüksek Net</span>
                <span className="text-xl font-black text-[#25D366]">{data.stats.maxNet}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Standart Sapma</span>
                <span className="text-xl font-black text-[#128C7E]">{data.stats.stdDev}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <span className="text-gray-600">Risk Altında</span>
                <span className="text-xl font-black text-red-500">{data.stats.riskCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sınıf × Performans Tablosu</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">#</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Sınıf</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Öğrenci</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Ort. Net</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Performans</th>
                </tr>
              </thead>
              <tbody>
                {data.classPerformance.slice(0, 10).map((cls, i) => (
                  <tr key={cls.name} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-800">{cls.name}</td>
                    <td className="py-3 px-2 text-center text-gray-600">{cls.studentCount}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        cls.avgNet >= 50 ? 'bg-green-100 text-green-700' :
                        cls.avgNet >= 35 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {cls.avgNet}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#25D366] rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (cls.avgNet / 80) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏆 Top 5 Öğrenci</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data.topStudents.slice(0, 5).map((student, i) => (
              <div
                key={student.rank}
                className={`rounded-2xl p-4 text-center border-2 transition-all hover:shadow-lg ${
                  i === 0 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' :
                  i === 1 ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-white' :
                  i === 2 ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-white' :
                  'border-gray-200'
                }`}
              >
                <div className="text-2xl mb-2">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
                </div>
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                  i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                  'bg-gradient-to-br from-[#25D366] to-[#128C7E]'
                }`}>
                  {student.initials}
                </div>
                <p className="mt-3 font-bold text-gray-800 truncate">{student.name}</p>
                <p className="text-sm text-gray-500">{student.class}</p>
                <p className="text-3xl font-black text-[#25D366] mt-2">{student.net}</p>
                <p className="text-xs text-gray-400">net</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
