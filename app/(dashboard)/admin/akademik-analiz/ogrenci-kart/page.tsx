'use client';

/**
 * Öğrenci Kartı - Tek Öğrenci Odaklı Akademik Profil
 * Suspense uyumlu, sadece studentId ile çalışan final sürüm
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Info,
  User,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

/* ========================================================= */
/* CONTENT COMPONENT — useSearchParams SADECE BURADA */
/* ========================================================= */

function OgrenciKartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization } = useOrganizationStore();

  const studentId = searchParams.get('studentId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!studentId) {
      setError('studentId parametresi eksik');
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        const params = new URLSearchParams();
        params.set('studentId', studentId);
        if (currentOrganization?.id) {
          params.set('organizationId', currentOrganization.id);
        }

        const res = await fetch(`/api/akademik-analiz/student-profile?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Öğrenci bulunamadı');
        }

        setStudentData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, currentOrganization?.id]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error || !studentData?.student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 mb-4">{error || 'Öğrenci bulunamadı'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-emerald-600 text-white rounded"
          >
            Geri
          </button>
        </div>
      </div>
    );
  }

  const { student, examHistory = [], subjectAverages = {}, stats = {} } = studentData;

  /* ================= HELPERS ================= */
  const trendData = examHistory
    .map((r: any) => ({
      name: r.exam?.name || 'Sınav',
      net: r.total_net || 0,
      date: r.exam?.exam_date,
    }))
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const trendComment = (() => {
    if (trendData.length < 2) return null;
    const diff = trendData.at(-1).net - trendData.at(-2).net;
    if (diff >= 3) return { icon: TrendingUp, text: 'Yükseliş', color: 'text-emerald-600' };
    if (diff <= -3) return { icon: TrendingDown, text: 'Düşüş', color: 'text-red-600' };
    return { icon: Minus, text: 'Stabil', color: 'text-slate-600' };
  })();

  const subjectChartData = Object.entries(subjectAverages).map(([k, v]: any) => ({
    name: k,
    ogrenci: v.avgNet || 0,
  }));

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* HEADER */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600">
          <ArrowLeft size={18} /> Geri
        </button>

        {/* STUDENT */}
        <div className="bg-white p-6 rounded-xl border flex gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
            <User />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {student.full_name || `${student.first_name} ${student.last_name}`}
            </h1>
            <div className="text-sm text-slate-500">
              Öğrenci No: {student.student_no}
            </div>
          </div>
        </div>

        {/* TREND */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold mb-4">Zaman İçinde Gidişat</h3>
          {trendData.length >= 2 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="net" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
              {trendComment && (
                <div className={`mt-2 flex items-center gap-2 ${trendComment.color}`}>
                  <trendComment.icon size={16} /> {trendComment.text}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-400">Yeterli sınav yok</div>
          )}
        </div>

        {/* SUBJECTS */}
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold mb-4">Ders Profili</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectChartData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="ogrenci" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

/* ========================================================= */
/* PAGE — SADECE SUSPENSE */
/* ========================================================= */

export default function OgrenciKartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <OgrenciKartContent />
    </Suspense>
  );
}
