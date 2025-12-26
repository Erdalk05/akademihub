'use client';

/**
 * Akademik Analiz - Sonuçlar
 * SUPABASE'den sınav sonuçlarını görüntüleme
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  ArrowLeft,
  FileDown,
  Search,
  SortAsc,
  SortDesc,
  Award,
  Target,
  ChevronDown,
  FileSpreadsheet,
  RefreshCw,
  Database
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

interface SavedExam {
  id: string;
  ad: string;
  tarih: string;
  tip: string;
  toplamSoru: number;
  toplamOgrenci: number;
  ortalamaNet: string | number;
  ilk20Ogrenci?: { ogrenciNo: string; ogrenciAdi: string; toplamNet: number; siralama: number }[];
  createdAt: string;
}

function SonuclarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const { currentOrganization } = useOrganizationStore();
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<SavedExam | null>(null);
  const [allExams, setAllExams] = useState<SavedExam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Supabase'den verileri yükle
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentOrganization?.id) {
        params.set('organizationId', currentOrganization.id);
      }
      params.set('limit', '20');
      
      const response = await fetch(`/api/akademik-analiz/wizard?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok && data.exams) {
        setAllExams(data.exams);
        
        if (examId) {
          const found = data.exams.find((e: SavedExam) => e.id === examId);
          setExam(found || null);
        }
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [examId, currentOrganization?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Öğrenci adını temizle
  const cleanName = (name: string): string => {
    if (!name) return 'Bilinmeyen';
    let cleaned = name.replace(/^[\d\s]+/, '').trim();
    cleaned = cleaned.replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || name;
  };

  // Tarihi formatla
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filtrelenmiş ve sıralanmış öğrenciler
  const filteredStudents = exam?.ilk20Ogrenci
    ?.filter(s => 
      cleanName(s.ogrenciAdi).toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ogrenciNo.includes(searchTerm)
    )
    ?.sort((a, b) => 
      sortOrder === 'desc' ? b.toplamNet - a.toplamNet : a.toplamNet - b.toplamNet
    ) || [];

  // Yükleniyor
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-500 flex items-center gap-2 justify-center">
            <Database size={16} />
            Supabase'den yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  // Sınav seçilmedi - tüm sınavları göster
  if (!examId || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/akademik-analiz')}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Sınav Sonuçları</h1>
                <p className="text-slate-500 flex items-center gap-1">
                  <Database size={14} />
                  Supabase'den {allExams.length} sınav yüklendi
                </p>
              </div>
            </div>
            
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Yenile
            </button>
          </motion.div>

          {allExams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Henüz kayıtlı sınav yok</p>
              <button
                onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                İlk Sınavınızı Oluşturun
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {allExams.map((e, idx) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => router.push(`/admin/akademik-analiz/sonuclar?examId=${e.id}`)}
                  className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg hover:border-emerald-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                        {e.ad || 'İsimsiz Sınav'}
                      </h3>
                      <p className="text-sm text-slate-500">{formatDate(e.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-700">{e.toplamOgrenci || 0}</p>
                        <p className="text-xs text-slate-400">Öğrenci</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{e.ortalamaNet}</p>
                        <p className="text-xs text-slate-400">Ort. Net</p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90 group-hover:text-emerald-600" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Seçili sınav sonuçları
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{exam.ad}</h1>
              <p className="text-slate-500">{formatDate(exam.createdAt)} • {exam.tip}</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/admin/akademik-analiz/karne?examId=${exam.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <FileDown size={18} />
            PDF Karne
          </button>
        </motion.div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white rounded-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Toplam Öğrenci</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{exam.toplamOgrenci || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white rounded-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Toplam Soru</span>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{exam.toplamSoru || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white rounded-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Ortalama Net</span>
              <BarChart3 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">{exam.ortalamaNet}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white rounded-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">En Yüksek Net</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {exam.ilk20Ogrenci?.[0]?.toplamNet?.toFixed(2) || '0'}
            </p>
          </motion.div>
        </div>

        {/* Arama ve Sıralama */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            {sortOrder === 'desc' ? 'En Yüksek' : 'En Düşük'}
          </button>
        </motion.div>

        {/* Öğrenci Tablosu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Sıra</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Öğrenci No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Ad Soyad</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Net</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Öğrenci verisi yok'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50 transition-colors ${
                        idx === 0 && sortOrder === 'desc' ? 'bg-yellow-50' :
                        idx === 1 && sortOrder === 'desc' ? 'bg-slate-50' :
                        idx === 2 && sortOrder === 'desc' ? 'bg-amber-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          student.siralama === 1 ? 'bg-yellow-400 text-yellow-900' :
                          student.siralama === 2 ? 'bg-slate-300 text-slate-700' :
                          student.siralama === 3 ? 'bg-amber-300 text-amber-900' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {student.siralama}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{student.ogrenciNo}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{cleanName(student.ogrenciAdi)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-lg text-slate-800">
                          {student.toplamNet?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                          {(student.toplamNet * 5).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Alt Bilgi */}
        <div className="mt-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          <Database size={14} />
          Gösterilen: {filteredStudents.length} / {exam.ilk20Ogrenci?.length || 0} öğrenci (Supabase'den)
          {(exam.ilk20Ogrenci?.length || 0) < (exam.toplamOgrenci || 0) && (
            <span className="ml-2 text-amber-600">
              (İlk {exam.ilk20Ogrenci?.length} öğrenci gösteriliyor)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Suspense ile sarmalama
export default function SonuclarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <SonuclarContent />
    </Suspense>
  );
}
