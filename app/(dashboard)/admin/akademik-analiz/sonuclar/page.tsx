'use client';

/**
 * Akademik Analiz - Sınav Sonuçları
 * K12Net benzeri detaylı sonuç görüntüleme
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
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  Database,
  Loader2,
  Eye,
  Download,
  Printer,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface StudentResult {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinifNo?: string;
  kitapcik?: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan?: number;
  siralama: number;
  dersBazli?: {
    dersKodu: string;
    dersAdi: string;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
  }[];
}

interface ExamData {
  id: string;
  ad: string;
  tarih: string;
  tip: string;
  toplamSoru: number;
  toplamOgrenci: number;
  ortalamaNet: number;
  ogrenciler: StudentResult[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DERS_RENKLERI: Record<string, { bg: string; text: string }> = {
  'TUR': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'MAT': { bg: 'bg-red-100', text: 'text-red-700' },
  'FEN': { bg: 'bg-green-100', text: 'text-green-700' },
  'SOS': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'ING': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'DIN': { bg: 'bg-orange-100', text: 'text-orange-700' },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SonuclarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const { currentOrganization } = useOrganizationStore();
  
  // States
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'siralama' | 'toplamNet' | 'ogrenciAdi'>('siralama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (examId) {
        // Detaylı sonuçları yükle
        const response = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
        const data = await response.json();
        
        if (response.ok && data.exam) {
          setExam(data.exam);
        }
      } else {
        // Sınav listesinden en son sınavı yükle
        const params = new URLSearchParams();
        if (currentOrganization?.id) {
          params.set('organizationId', currentOrganization.id);
        }
        params.set('limit', '1');
        
        const response = await fetch(`/api/akademik-analiz/wizard?${params.toString()}`);
        const data = await response.json();
        
        if (response.ok && data.exams?.[0]) {
          const firstExam = data.exams[0];
          // Detaylı sonuçları yükle
          const detailRes = await fetch(`/api/akademik-analiz/exam-results?examId=${firstExam.id}`);
          const detailData = await detailRes.json();
          
          if (detailRes.ok && detailData.exam) {
            setExam(detailData.exam);
          } else {
            // Fallback
            setExam({
              id: firstExam.id,
              ad: firstExam.ad,
              tarih: firstExam.tarih,
              tip: firstExam.tip || 'LGS',
              toplamSoru: firstExam.toplamSoru || 90,
              toplamOgrenci: firstExam.toplamOgrenci || 0,
              ortalamaNet: parseFloat(firstExam.ortalamaNet) || 0,
              ogrenciler: (firstExam.ilk20Ogrenci || []).map((o: any, i: number) => ({
                ogrenciNo: o.ogrenciNo || String(i + 1),
                ogrenciAdi: o.ogrenciAdi || 'Bilinmeyen',
                toplamDogru: 0,
                toplamYanlis: 0,
                toplamBos: 0,
                toplamNet: o.toplamNet || 0,
                toplamPuan: (o.toplamNet || 0) * 5,
                siralama: o.siralama || i + 1
              }))
            });
          }
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

  // =============================================================================
  // COMPUTED
  // =============================================================================

  const sortedStudents = React.useMemo(() => {
    if (!exam?.ogrenciler) return [];
    
    let result = [...exam.ogrenciler];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.ogrenciAdi?.toLowerCase().includes(term) ||
        s.ogrenciNo?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [exam?.ogrenciler, searchTerm, sortField, sortOrder]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getNetColor = (net: number) => {
    if (net >= 15) return 'text-green-600 bg-green-50';
    if (net >= 10) return 'text-emerald-600 bg-emerald-50';
    if (net >= 5) return 'text-blue-600 bg-blue-50';
    if (net >= 0) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // =============================================================================
  // LOADING
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500">Sınav sonuçları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl p-12 shadow-sm">
          <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Sınav Bulunamadı</h2>
          <p className="text-slate-500 mb-6">Henüz kayıtlı bir sınav bulunmuyor.</p>
          <button
            onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Yeni Sınav Oluştur
          </button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/admin/akademik-analiz')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{exam.ad}</h1>
                  <p className="text-sm text-slate-500">{formatDate(exam.tarih)} • {exam.tip}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Yenile"
              >
                <RefreshCw size={20} className="text-slate-600" />
              </button>
              
              <button
                onClick={() => router.push(`/admin/akademik-analiz/karne?examId=${exam.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <FileDown size={18} />
                PDF Karne
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Toplam Öğrenci</span>
              <Users size={20} className="text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-800">{exam.ogrenciler?.length || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Toplam Soru</span>
              <Target size={20} className="text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{exam.toplamSoru || 90}</div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Ortalama Net</span>
              <BarChart3 size={20} className="text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{exam.ortalamaNet?.toFixed(2) || '0'}</div>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">En Yüksek Net</span>
              <Award size={20} className="text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {exam.ogrenciler?.length > 0 
                ? Math.max(...exam.ogrenciler.map(o => o.toplamNet)).toFixed(2) 
                : '0'}
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSort('toplamNet')}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  sortField === 'toplamNet' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                En Yüksek
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('siralama')}
                >
                  Sıra
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Öğrenci No
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('ogrenciAdi')}
                >
                  Ad Soyad
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sınıf
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Kitapçık
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">
                  D
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                  Y
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  B
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('toplamNet')}
                >
                  Net
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Puan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStudents.map((student, index) => (
                <tr 
                  key={index}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedStudent(selectedStudent?.ogrenciNo === student.ogrenciNo ? null : student)}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      student.siralama <= 3 ? 'bg-amber-100 text-amber-700' :
                      student.siralama <= 10 ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {student.siralama}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {student.ogrenciNo || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{student.ogrenciAdi}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">
                      {student.sinifNo || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      student.kitapcik === 'A' ? 'bg-blue-100 text-blue-700' :
                      student.kitapcik === 'B' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {student.kitapcik || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-green-600">
                    {student.toplamDogru}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-red-600">
                    {student.toplamYanlis}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">
                    {student.toplamBos}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getNetColor(student.toplamNet)}`}>
                      {student.toplamNet.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-blue-600">
                      {(student.toplamPuan || student.toplamNet * 5).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(`/admin/akademik-analiz/ogrenci-karne?examId=${exam.id}&studentNo=${student.ogrenciNo}`)}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Karne Görüntüle"
                      >
                        <Eye size={16} className="text-emerald-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="PDF İndir"
                      >
                        <Download size={16} className="text-blue-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Öğrenci bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default function SonuclarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SonuclarContent />
    </Suspense>
  );
}
