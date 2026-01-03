'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExamSummary {
  exam: { id: string; name: string; date: string };
  averages: { turkce: number; matematik: number; fen: number; ingilizce: number; sosyal: number };
  topStudents: { id: string; name: string; net: number; class: string }[];
}

export default function ExamDetailPage() {
  const params = useParams();
  const [data, setData] = useState<ExamSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.examId) {
      fetch(`/api/admin/exams/${params.examId}/summary`)
        .then(res => res.json())
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [params.examId]);

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  if (!data) {
    return <div className="p-6">Veri bulunamadı</div>;
  }

  const chartData = [
    { name: 'Türkçe', value: data.averages?.turkce || 0 },
    { name: 'Matematik', value: data.averages?.matematik || 0 },
    { name: 'Fen', value: data.averages?.fen || 0 },
    { name: 'İngilizce', value: data.averages?.ingilizce || 0 },
    { name: 'Sosyal', value: data.averages?.sosyal || 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{data.exam?.name || 'Sınav Detayı'}</h1>

      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Ders Ortalamaları</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#25D366" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">En Başarılı Öğrenciler</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Sıra</th>
              <th className="text-left py-2">Ad Soyad</th>
              <th className="text-left py-2">Sınıf</th>
              <th className="text-right py-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {(data.topStudents || []).map((student, index) => (
              <tr key={student.id} className="border-b last:border-0">
                <td className="py-2">{index + 1}</td>
                <td className="py-2">{student.name}</td>
                <td className="py-2">{student.class}</td>
                <td className="py-2 text-right font-semibold">{student.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

