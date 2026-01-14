'use client';

// ============================================================================
// SPECTRA - SINAVLAR SAYFASI (v3.0 - Geçici Sade Versiyon)
// Eski modül bağımlılıkları kaldırıldı
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  RefreshCw,
  Calendar,
  BarChart3,
  Users,
  ChevronRight,
  FileText,
  Loader2,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { getBrowserClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ExamListItem {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level?: string;
  total_questions?: number;
  participant_count?: number;
  avg_net?: number;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraSinavlarPage() {
  const { currentOrganization, _hasHydrated } = useOrganizationStore();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────

  const fetchExams = useCallback(async () => {
    if (!currentOrganization?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = getBrowserClient();

      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          name,
          exam_date,
          exam_type,
          grade_level,
          total_questions,
          status
        `)
        .eq('organization_id', currentOrganization.id)
        .order('exam_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Sınav listesi hatası:', error);
        toast.error('Sınavlar yüklenemedi');
        setExams([]);
      } else {
        setExams(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Bağlantı hatası');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (_hasHydrated) {
      fetchExams();
    }
  }, [_hasHydrated, fetchExams]);

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERED EXAMS
  // ─────────────────────────────────────────────────────────────────────────

  const filteredExams = exams.filter((exam) =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Kurum Seçilmedi</h2>
          <p className="text-gray-500">Sınavları görmek için bir kurum seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Sınavlar</h1>
                <p className="text-white/80">
                  {currentOrganization.name} - {exams.length} sınav
                </p>
              </div>
            </div>
            <Link
              href="/admin/spectra/sihirbaz"
              className="px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Yeni Sınav
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Sınav ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchExams}
              disabled={isLoading}
              className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Exam List */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-500">Sınavlar yükleniyor...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">Sınav Bulunamadı</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Arama kriterlerine uygun sınav yok' : 'Henüz sınav eklenmemiş'}
            </p>
            <Link
              href="/admin/spectra/sihirbaz"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              İlk Sınavı Ekle
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredExams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/admin/spectra/sinavlar/${exam.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {exam.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {exam.exam_type}
                        </span>
                        {exam.grade_level && (
                          <span className="text-gray-400">
                            {exam.grade_level}. Sınıf
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
