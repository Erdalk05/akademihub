'use client';

// ============================================================================
// SPECTRA - SINAV DETAY SAYFASI (v3.0 - Geçici Sade Versiyon)
// Eksik component bağımlılıkları kaldırıldı
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { getBrowserClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ExamDetail {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level?: string;
  total_questions?: number;
  description?: string;
  status?: string;
}

interface ExamStats {
  participantCount: number;
  averageNet: number;
  maxNet: number;
  minNet: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const { currentOrganization, _hasHydrated } = useOrganizationStore();

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId || !currentOrganization?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const supabase = getBrowserClient();

        // Fetch exam
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .eq('organization_id', currentOrganization.id)
          .single();

        if (examError) {
          setError('Sınav bulunamadı');
          setExam(null);
          return;
        }

        setExam(examData);

        // Fetch basic stats (participant count)
        const { count } = await supabase
          .from('exam_participants')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);

        setStats({
          participantCount: count || 0,
          averageNet: 0,
          maxNet: 0,
          minNet: 0,
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Bağlantı hatası');
      } finally {
        setIsLoading(false);
      }
    };

    if (_hasHydrated) {
      fetchExam();
    }
  }, [examId, currentOrganization?.id, _hasHydrated]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-gray-500">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Error
  // ─────────────────────────────────────────────────────────────────────────

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sınav Bulunamadı</h2>
        <p className="text-gray-500 mb-4 text-center">
          {error || 'Bu sınav mevcut değil veya silinmiş olabilir.'}
        </p>
        <Link
          href="/admin/spectra/sinavlar"
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Sınavlara Dön
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Success
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black">{exam.name}</h1>
              <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                </span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                  {exam.exam_type}
                </span>
                {exam.grade_level && (
                  <span>{exam.grade_level}. Sınıf</span>
                )}
              </div>
            </div>
          </div>

          {/* Organization Badge */}
          {currentOrganization && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Building2 className="w-4 h-4" />
              {currentOrganization.name}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Katılımcı"
            value={stats?.participantCount || 0}
            color="emerald"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            label="Ortalama Net"
            value={stats?.averageNet.toFixed(1) || '—'}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="En Yüksek"
            value={stats?.maxNet.toFixed(1) || '—'}
            color="green"
          />
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Soru Sayısı"
            value={exam.total_questions || '—'}
            color="purple"
          />
        </div>

        {/* Placeholder for detailed content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Detaylı Analiz Bileşenleri Bekleniyor
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Bu sayfa şu anda temel bilgileri göstermektedir. Ders bazlı analiz,
            öğrenci sıralaması ve dağılım grafikleri yakında eklenecektir.
          </p>
          <Link
            href="/admin/spectra/sinavlar"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Sınavlara Dön
          </Link>
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-gray-100 rounded-xl text-xs font-mono text-gray-600">
          <p><strong>Debug:</strong></p>
          <p>Exam ID: {exam.id}</p>
          <p>Organization ID: {currentOrganization?.id}</p>
          <p>Exam Data: {JSON.stringify(exam, null, 2)}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'emerald' | 'blue' | 'green' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
