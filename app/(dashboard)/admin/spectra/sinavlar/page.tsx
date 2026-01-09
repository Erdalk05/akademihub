'use client';

// ============================================================================
// SPECTRA - SINAVLAR SAYFASI (v2.0)
// Profesyonel sınav listesi + accordion detaylar
// ============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { getBrowserClient } from '@/lib/supabase/client';
import { ExamTable } from '@/components/exam';
import type {
  ExamListItem,
  ExamExpandedDetails,
  ExamListFilters,
  ExamType,
  RiskStatus,
  GradeLevel,
} from '@/types/exam-list';
import { GRADE_LEVELS } from '@/types/exam-list';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Risk durumunu hesapla (örnek logic)
 */
function calculateRiskStatus(avgNet: number, participantCount: number): RiskStatus {
  if (participantCount === 0) return 'high';
  if (avgNet < 30) return 'high';
  if (avgNet < 50) return 'medium';
  return 'low';
}

/**
 * Supabase verisini ExamListItem'a dönüştür
 */
function mapToExamListItem(exam: any, stats: any): ExamListItem {
  const avgNet = stats.avgNet || 0;
  const totalParticipants = stats.totalParticipants || 0;

  return {
    id: exam.id,
    name: exam.name || 'İsimsiz Sınav',
    examType: (exam.exam_type || 'DENEME') as ExamType,
    examDate: exam.exam_date || exam.created_at,
    createdAt: exam.created_at,
    totalQuestions: exam.total_questions || 0,
    totalParticipants,
    institutionCount: stats.institutionCount || 0,
    guestCount: stats.guestCount || 0,
    averageNet: avgNet,
    maxNet: stats.maxNet || 0,
    riskStatus: calculateRiskStatus(avgNet, totalParticipants),
    analysisStatus: totalParticipants > 0 ? 'completed' : 'pending',
    isPublished: exam.is_published || false,
    gradeLevel: exam.grade_level,
    description: exam.description,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraSinavlarPage() {
  const { currentOrganization } = useOrganizationStore();
  
  // State
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExamListFilters>({
    search: '',
    examType: 'all',
    riskStatus: 'all',
    analysisStatus: 'all',
    gradeLevel: 'all',
    dateRange: { from: null, to: null },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────

  const fetchExams = useCallback(async () => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = getBrowserClient();

    try {
      // Sınavları çek
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('exam_date', { ascending: false });

      if (examsError) {
        console.error('Sınav çekme hatası:', examsError);
        setExams([]);
        return;
      }

      // Her sınav için istatistikleri hesapla
      const examsWithStats = await Promise.all(
        (examsData || []).map(async (exam: any) => {
          // Katılımcı istatistikleri
          const { data: participants } = await supabase
            .from('exam_participants')
            .select('id, participant_type, net, correct_count')
            .eq('exam_id', exam.id);

          const participantList = participants || [];
          const totalParticipants = participantList.length;
          const institutionCount = participantList.filter((p: any) => p.participant_type === 'institution').length;
          const guestCount = participantList.filter((p: any) => p.participant_type === 'guest').length;
          
          const nets = participantList.map((p: any) => p.net || 0).filter((n: number) => n > 0);
          const avgNet = nets.length > 0 ? nets.reduce((a: number, b: number) => a + b, 0) / nets.length : 0;
          const maxNet = nets.length > 0 ? Math.max(...nets) : 0;

          return mapToExamListItem(exam, {
            totalParticipants,
            institutionCount,
            guestCount,
            avgNet: Math.round(avgNet * 10) / 10,
            maxNet: Math.round(maxNet * 10) / 10,
          });
        })
      );

      setExams(examsWithStats);
    } catch (err) {
      console.error('Sınav listesi hatası:', err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  // İlk yüklemede ve organization değiştiğinde verileri çek
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE EXAM
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteExam = useCallback(async (examId: string, examName: string) => {
    // Onay iste
    const confirmed = window.confirm(`"${examName}" sınavını silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve tüm sınav verileri (katılımcılar, sonuçlar) silinecektir.`);
    if (!confirmed) return;

    const supabase = getBrowserClient();
    const toastId = toast.loading(`"${examName}" siliniyor...`);

    try {
      // İlgili verileri sil (cascade yoksa manuel sil)
      // 1. exam_result_sections
      await supabase
        .from('exam_result_sections')
        .delete()
        .eq('exam_id', examId);

      // 2. exam_results
      await supabase
        .from('exam_results')
        .delete()
        .eq('exam_id', examId);

      // 3. exam_participants
      await supabase
        .from('exam_participants')
        .delete()
        .eq('exam_id', examId);

      // 4. exam_answer_keys
      await supabase
        .from('exam_answer_keys')
        .delete()
        .eq('exam_id', examId);

      // 5. exam_sections
      await supabase
        .from('exam_sections')
        .delete()
        .eq('exam_id', examId);

      // 6. Son olarak exam'ı sil
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) {
        throw error;
      }

      // State'den kaldır
      setExams(prev => prev.filter(e => e.id !== examId));
      toast.success(`"${examName}" başarıyla silindi`, { id: toastId });

    } catch (err: any) {
      console.error('Sınav silme hatası:', err);
      toast.error(`Silme hatası: ${err.message || 'Bilinmeyen hata'}`, { id: toastId });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD EXAM DETAILS (for accordion)
  // ─────────────────────────────────────────────────────────────────────────

  const loadExamDetails = useCallback(async (examId: string): Promise<ExamExpandedDetails> => {
    const supabase = getBrowserClient();

    // Katılımcıları çek
    const { data: participants } = await supabase
      .from('exam_participants')
      .select('*')
      .eq('exam_id', examId);

    const participantList = participants || [];
    const totalParticipants = participantList.length;
    const institutionCount = participantList.filter((p: any) => p.participant_type === 'institution').length;
    const guestCount = participantList.filter((p: any) => p.participant_type === 'guest').length;
    const matchedCount = participantList.filter((p: any) => p.student_id).length;

    // Net hesaplamaları
    const nets = participantList.map((p: any) => p.net || 0);
    const avgNet = nets.length > 0 ? nets.reduce((a: number, b: number) => a + b, 0) / nets.length : 0;
    const maxNet = nets.length > 0 ? Math.max(...nets) : 0;
    const minNet = nets.length > 0 ? Math.min(...nets) : 0;

    // Standart sapma
    const variance = nets.length > 0
      ? nets.reduce((sum: number, n: number) => sum + Math.pow(n - avgNet, 2), 0) / nets.length
      : 0;
    const stdDev = Math.sqrt(variance);

    // Homojenlik oranı (düşük std sapma = yüksek homojenlik)
    const homogeneity = maxNet > 0 ? Math.max(0, 100 - (stdDev / maxNet) * 100) : 0;

    // Ders bölümlerini çek
    const { data: sections } = await supabase
      .from('exam_sections')
      .select('*')
      .eq('exam_id', examId)
      .order('sort_order');

    const branches = (sections || []).map((s: any) => ({
      branchName: s.name || s.code,
      branchCode: s.code,
      questionCount: s.question_count || 0,
      averageNet: 0, // Detaylı hesaplama gerekli
      averageCorrect: 0,
      averageWrong: 0,
      successRate: 0,
    }));

    return {
      examId,
      participation: {
        totalParticipants,
        institutionCount,
        guestCount,
        absentCount: 0, // Katılmayan hesaplaması için öğrenci listesi gerekli
        matchedCount,
        unmatchedCount: totalParticipants - matchedCount,
      },
      stats: {
        averageNet: Math.round(avgNet * 100) / 100,
        maxNet: Math.round(maxNet * 100) / 100,
        minNet: Math.round(minNet * 100) / 100,
        medianNet: Math.round(avgNet * 100) / 100, // Gerçek median hesaplaması eklenebilir
        standardDeviation: Math.round(stdDev * 100) / 100,
        homogeneityRate: Math.round(homogeneity),
        averageCorrect: 0,
        averageWrong: 0,
        averageBlank: 0,
      },
      branches,
      aiComment: 'Bu sınavda genel performans değerlendirilmektedir. Detaylı AI analizi için "AI Analiz" butonuna tıklayın.',
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERING
  // ─────────────────────────────────────────────────────────────────────────

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // Arama filtresi
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!exam.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Sınav türü filtresi
      if (filters.examType !== 'all' && exam.examType !== filters.examType) {
        return false;
      }

      // Risk durumu filtresi
      if (filters.riskStatus !== 'all' && exam.riskStatus !== filters.riskStatus) {
        return false;
      }

      // Sınıf filtresi
      if (filters.gradeLevel !== 'all') {
        const examGrade = exam.gradeLevel?.toString().toLowerCase().replace('. sınıf', '').trim();
        if (examGrade !== filters.gradeLevel) {
          return false;
        }
      }

      return true;
    });
  }, [exams, filters]);

  // ─────────────────────────────────────────────────────────────────────────
  // STATS SUMMARY
  // ─────────────────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const totalExams = exams.length;
    const totalParticipants = exams.reduce((sum, e) => sum + e.totalParticipants, 0);
    const avgNetOverall = exams.length > 0
      ? exams.reduce((sum, e) => sum + e.averageNet, 0) / exams.length
      : 0;
    const highRiskCount = exams.filter(e => e.riskStatus === 'high').length;

    return {
      totalExams,
      totalParticipants,
      avgNetOverall: Math.round(avgNetOverall * 10) / 10,
      highRiskCount,
    };
  }, [exams]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-emerald-500" />
                Sınavlar
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Tüm sınavları görüntüle ve yönet
              </p>
            </div>
            <Link
              href="/admin/spectra/sihirbaz"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Sınav
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Özet Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Calendar size={18} />
              <span className="text-xs font-medium uppercase tracking-wide">Toplam Sınav</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalExams}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users size={18} />
              <span className="text-xs font-medium uppercase tracking-wide">Katılımcı</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalParticipants}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <TrendingUp size={18} />
              <span className="text-xs font-medium uppercase tracking-wide">Ort. Net</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.avgNetOverall}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle size={18} />
              <span className="text-xs font-medium uppercase tracking-wide">Yüksek Risk</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.highRiskCount}</p>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
          {/* Arama */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sınav ara..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Sınav Türü */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.examType}
              onChange={(e) => setFilters(prev => ({ ...prev, examType: e.target.value as any }))}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="all">Tüm Tipler</option>
              <option value="LGS">LGS</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="YDT">YDT</option>
              <option value="ARA_SINAV">Ara Sınav</option>
              <option value="DENEME">Deneme</option>
            </select>
          </div>

          {/* Sınıf Seviyesi */}
          <select
            value={filters.gradeLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, gradeLevel: e.target.value as GradeLevel }))}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            {GRADE_LEVELS.map((grade) => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </select>

          {/* Risk Durumu */}
          <select
            value={filters.riskStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, riskStatus: e.target.value as any }))}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="all">Tüm Risk</option>
            <option value="low">Düşük Risk</option>
            <option value="medium">Orta Risk</option>
            <option value="high">Yüksek Risk</option>
          </select>

          {/* Yenile */}
          <button
            onClick={fetchExams}
            disabled={loading}
            className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={cn('w-5 h-5 text-gray-500', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Sınav Tablosu */}
        <ExamTable
          exams={filteredExams}
          isLoading={loading}
          onLoadDetails={loadExamDetails}
          onDelete={handleDeleteExam}
        />
      </div>
    </div>
  );
}
