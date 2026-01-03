'use client';

import { useEffect, useState } from 'react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ExamMeta {
  examType: string;
  gradeGroup: string;
  year: number;
}

interface Exam {
  id: string;
  name: string;
  date: string;
  lessonAverages: Record<string, number>;
}

interface ExamComparison {
  examId: string;
  examName: string;
  avgNet: number;
  studentCount: number;
  lessons: Record<string, number>;
}

interface TopStudent {
  id: string;
  name: string;
  classOrGroup: string;
  net: number;
  badges: string[];
  initials: string;
  last5ExamAvg: number;
  last5ExamLessons: Record<string, number>;
}

interface DashboardData {
  examMeta: ExamMeta;
  exams: Exam[];
  selectedExamId: string;
  last5ExamComparisons: ExamComparison[];
  topStudents: TopStudent[];
}

export default function AdminDashboardPage() {
  const { currentOrganization } = useOrganizationStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    const examParam = selectedExam ? `&selectedExamId=${selectedExam}` : '';
    fetch(`/api/admin/dashboard/summary?organizationId=${currentOrganization.id}${examParam}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (!selectedExam && d.selectedExamId) setSelectedExam(d.selectedExamId);
      })
      .finally(() => setLoading(false));
  }, [currentOrganization?.id, selectedExam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (!data || data.exams.length === 0) {
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

  const chartData = data.last5ExamComparisons.map(e => ({
    name: e.examName.length > 12 ? e.examName.slice(0, 12) + '...' : e.examName,
    net: e.avgNet,
    ogrenci: e.studentCount
  })).reverse();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Sınav Sonuçları Merkezi</h1>
              <p className="text-white/80 mt-1">
                {data.examMeta.examType} • {data.examMeta.gradeGroup}. Sınıf • {data.examMeta.year}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Toplam Sınav</p>
              <p className="text-3xl font-black">{data.exams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow">
          <p className="text-sm text-gray-500 mb-3 font-medium">Son 5 Sınav</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam.id)}
                className={`min-w-[140px] p-4 rounded-xl border-2 transition-all ${
                  selectedExam === exam.id
                    ? 'border-[#25D366] bg-[#25D366]/10'
                    : 'border-gray-200 hover:border-[#25D366]/50'
                }`}
              >
                <p className="font-bold text-gray-800 truncate">{exam.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xl font-black text-[#25D366] mt-2">{exam.lessonAverages.turkce}</p>
                <p className="text-xs text-gray-400">ort. net</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800 mb-4">5 Sınav Karşılaştırması</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [value, name === 'net' ? 'Ort. Net' : 'Öğrenci']}
                />
                <Bar dataKey="net" fill="#25D366" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trend</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="net" stroke="#25D366" strokeWidth={3} dot={{ fill: '#25D366', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sınav × Performans Tablosu</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Sınav</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Tarih</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Öğrenci</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-600">Ort. Net</th>
                </tr>
              </thead>
              <tbody>
                {data.last5ExamComparisons.map((exam, i) => (
                  <tr key={exam.examId} className={`border-b last:border-0 ${selectedExam === exam.examId ? 'bg-[#25D366]/5' : ''}`}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          i === 0 ? 'bg-[#25D366]' : 'bg-gray-300'
                        }`}>{i + 1}</span>
                        <span className="font-medium text-gray-800">{exam.examName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {data.exams.find(e => e.id === exam.examId)?.date 
                        ? new Date(data.exams.find(e => e.id === exam.examId)!.date).toLocaleDateString('tr-TR')
                        : '-'}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">{exam.studentCount}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        exam.avgNet >= 50 ? 'bg-green-100 text-green-700' :
                        exam.avgNet >= 35 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {exam.avgNet}
                      </span>
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
            {data.topStudents.map((student, i) => (
              <div
                key={student.id}
                className={`rounded-2xl p-4 text-center border-2 ${
                  i === 0 ? 'border-yellow-400 bg-yellow-50' :
                  i === 1 ? 'border-gray-300 bg-gray-50' :
                  i === 2 ? 'border-orange-300 bg-orange-50' :
                  'border-gray-200'
                }`}
              >
                <div className="text-2xl mb-2">{student.badges[0] || ''}</div>
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-[#25D366]'
                }`}>
                  {student.initials}
                </div>
                <p className="mt-3 font-bold text-gray-800 truncate">{student.name}</p>
                <p className="text-sm text-gray-500">{student.classOrGroup}</p>
                <p className="text-2xl font-black text-[#25D366] mt-2">{student.net}</p>
                <p className="text-xs text-gray-400 mb-3">net</p>
                <div className="bg-gray-100 rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1">5 Sınav Ort.</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#25D366] rounded-full" 
                      style={{ width: `${Math.min(100, (student.last5ExamAvg / 80) * 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-[#075E54] mt-1">{student.last5ExamAvg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

