'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import {
  Loader2,
  Search,
  Filter,
  Plus,
  Calendar,
  Users,
  BarChart3,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';

// ============================================
// SPECTRA - SINAV LİSTESİ
// ============================================

interface Exam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  grade_level: string;
  total_questions: number;
  participant_count: number;
  avg_net: number;
  created_at: string;
}

export default function SpectraSinavlarPage() {
  const { currentOrganization } = useOrganizationStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!currentOrganization?.id) {
      setLoading(false);
      return;
    }

    // TODO: Gerçek API bağlantısı yapılacak
    // Şimdilik mock data
    const mockExams: Exam[] = [
      {
        id: '1',
        name: 'LGS Deneme #5',
        exam_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        exam_type: 'LGS',
        grade_level: '8',
        total_questions: 90,
        participant_count: 156,
        avg_net: 68.4,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'TYT Deneme #3',
        exam_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        exam_type: 'TYT',
        grade_level: '12',
        total_questions: 120,
        participant_count: 89,
        avg_net: 54.2,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'LGS Deneme #4',
        exam_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        exam_type: 'LGS',
        grade_level: '8',
        total_questions: 90,
        participant_count: 142,
        avg_net: 65.1,
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'AYT Deneme #2',
        exam_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        exam_type: 'AYT',
        grade_level: '12',
        total_questions: 160,
        participant_count: 67,
        avg_net: 42.8,
        created_at: new Date().toISOString(),
      },
    ];

    setTimeout(() => {
      setExams(mockExams);
      setLoading(false);
    }, 300);
  }, [currentOrganization?.id]);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || exam.exam_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getExamTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      LGS: 'bg-emerald-100 text-emerald-700',
      TYT: 'bg-blue-100 text-blue-700',
      AYT: 'bg-purple-100 text-purple-700',
      YKS: 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Sınavlar</h1>
            <p className="text-gray-500 mt-1">Tüm sınavları görüntüle ve yönet</p>
          </div>
          <Link
            href="/admin/spectra/sihirbaz"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Yeni Sınav
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sınav ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Tüm Tipler</option>
              <option value="LGS">LGS</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="YKS">YKS</option>
            </select>
          </div>
        </div>

        {/* Exam List */}
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Sınav Bulunamadı</h3>
            <p className="text-gray-500 mb-4">Arama kriterlerine uygun sınav yok</p>
            <Link
              href="/admin/spectra/sihirbaz"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              İlk Sınavı Ekle
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExams.map((exam) => (
              <Link
                key={exam.id}
                href={`/admin/spectra/sinavlar/${exam.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 truncate">{exam.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getExamTypeBadge(exam.exam_type)}`}>
                          {exam.exam_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(exam.exam_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {exam.participant_count} katılımcı
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          Ort. {exam.avg_net} net
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

