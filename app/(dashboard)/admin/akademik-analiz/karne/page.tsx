'use client';

/**
 * Akademik Analiz - Detaylı Sınav Karnesi Sayfası
 * K12Net benzeri modern ve detaylı tasarım
 */

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  CheckCircle,
  Loader2,
  Eye,
  Printer,
  ArrowLeft,
  Users,
  Award,
  Target,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Database,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  BarChart3,
  BookOpen,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  X,
  Columns,
  Table2,
  Grid3X3,
  List,
  LayoutGrid
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface StudentResult {
  id: string;
  ogrenciNo: string;
  ogrenciAdi: string;
  sinifNo?: string;
  kitapcik?: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan: number;
  siralama: number;
  sinifSira?: number;
  dersBazli?: {
    dersKodu: string;
    dersAdi: string;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
    basariOrani: number;
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

const DERS_RENKLERI: Record<string, { bg: string; text: string; border: string }> = {
  'TUR': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'MAT': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'FEN': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'SOS': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'ING': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'DIN': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

const DERS_ISIMLERI: Record<string, string> = {
  'TUR': 'Türkçe',
  'MAT': 'Matematik',
  'FEN': 'Fen Bilimleri',
  'SOS': 'Sosyal Bilgiler',
  'ING': 'İngilizce',
  'DIN': 'Din Kültürü',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function KarneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const { currentOrganization } = useOrganizationStore();

  // States
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [allExams, setAllExams] = useState<ExamData[]>([]);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'siralama' | 'ogrenciAdi' | 'toplamNet' | 'toplamPuan'>('siralama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showColumns, setShowColumns] = useState({
    numara: true,
    sinif: true,
    kitapcik: true,
    dogru: true,
    yanlis: true,
    bos: true,
    net: true,
    puan: true,
    siralama: true,
    dersler: true
  });
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isGenerating, setIsGenerating] = useState(false);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Sınav detaylarını yükle
      if (examId) {
        const response = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
        const data = await response.json();
        
        if (response.ok && data.exam) {
          setExam(data.exam);
        }
      }
      
      // Tüm sınavları yükle
      const params = new URLSearchParams();
      if (currentOrganization?.id) {
        params.set('organizationId', currentOrganization.id);
      }
      params.set('limit', '50');
      
      const listResponse = await fetch(`/api/akademik-analiz/wizard?${params.toString()}`);
      const listData = await listResponse.json();
      
      if (listResponse.ok && listData.exams) {
        setAllExams(listData.exams);
        
        // Eğer exam yoksa ve examId varsa, listeden bul
        if (examId && !exam) {
          const found = listData.exams.find((e: ExamData) => e.id === examId);
          if (found) {
            // Öğrenci detaylarını fetch et
            const detailRes = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
            const detailData = await detailRes.json();
            if (detailRes.ok) {
              setExam(detailData.exam);
            } else {
              // Fallback: sadece özet bilgileri kullan
              setExam({
                ...found,
                ogrenciler: found.ilk20Ogrenci?.map((o: any, i: number) => ({
                  id: String(i),
                  ogrenciNo: o.ogrenciNo || String(i),
                  ogrenciAdi: o.ogrenciAdi,
                  toplamDogru: 0,
                  toplamYanlis: 0,
                  toplamBos: 0,
                  toplamNet: o.toplamNet,
                  toplamPuan: o.toplamNet * 5,
                  siralama: o.siralama || i + 1
                })) || []
              });
            }
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
  // COMPUTED VALUES
  // =============================================================================

  const filteredStudents = useMemo(() => {
    if (!exam?.ogrenciler) return [];
    
    let result = [...exam.ogrenciler];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.ogrenciAdi.toLowerCase().includes(term) ||
        s.ogrenciNo?.toLowerCase().includes(term) ||
        s.sinifNo?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [exam?.ogrenciler, searchTerm, sortField, sortDirection]);

  const stats = useMemo(() => {
    if (!exam?.ogrenciler?.length) return null;
    
    const ogrenciler = exam.ogrenciler;
    const toplamNet = ogrenciler.reduce((s, o) => s + o.toplamNet, 0);
    const toplamPuan = ogrenciler.reduce((s, o) => s + o.toplamPuan, 0);
    const maxNet = Math.max(...ogrenciler.map(o => o.toplamNet));
    const minNet = Math.min(...ogrenciler.map(o => o.toplamNet));
    
    return {
      toplamOgrenci: ogrenciler.length,
      ortalamaNet: (toplamNet / ogrenciler.length).toFixed(2),
      ortalamaPuan: (toplamPuan / ogrenciler.length).toFixed(2),
      maxNet,
      minNet
    };
  }, [exam?.ogrenciler]);

  // Ders bazlı istatistikler
  const dersStats = useMemo(() => {
    if (!exam?.ogrenciler?.length) return [];
    
    const dersMap: Record<string, { dogru: number; yanlis: number; bos: number; net: number; count: number }> = {};
    
    exam.ogrenciler.forEach(ogr => {
      ogr.dersBazli?.forEach(ders => {
        if (!dersMap[ders.dersKodu]) {
          dersMap[ders.dersKodu] = { dogru: 0, yanlis: 0, bos: 0, net: 0, count: 0 };
        }
        dersMap[ders.dersKodu].dogru += ders.dogru;
        dersMap[ders.dersKodu].yanlis += ders.yanlis;
        dersMap[ders.dersKodu].bos += ders.bos;
        dersMap[ders.dersKodu].net += ders.net;
        dersMap[ders.dersKodu].count++;
      });
    });
    
    return Object.entries(dersMap).map(([kod, vals]) => ({
      dersKodu: kod,
      dersAdi: DERS_ISIMLERI[kod] || kod,
      ortalamaNet: (vals.net / vals.count).toFixed(2),
      ortalamaDogru: (vals.dogru / vals.count).toFixed(1),
      ortalamaYanlis: (vals.yanlis / vals.count).toFixed(1)
    }));
  }, [exam?.ogrenciler]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleRowClick = (student: StudentResult) => {
    setSelectedStudentId(selectedStudentId === student.id ? null : student.id);
  };

  const handleGenerateReport = async (studentId?: string) => {
    setIsGenerating(true);
    try {
      // PDF oluşturma mantığı
      const ids = studentId ? [studentId] : Array.from(selectedStudents);
      console.log('Karne oluşturuluyor:', ids);
      
      // TODO: PDF API çağrısı
      await new Promise(r => setTimeout(r, 1000));
      
      alert(`${ids.length} öğrenci karnesi oluşturuldu!`);
    } catch (error) {
      console.error('Karne oluşturma hatası:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

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

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  const NetBadge = ({ net }: { net: number }) => {
    const color = net >= 10 ? 'text-green-600 bg-green-50' : 
                  net >= 5 ? 'text-blue-600 bg-blue-50' : 
                  net >= 0 ? 'text-amber-600 bg-amber-50' : 
                  'text-red-600 bg-red-50';
    return (
      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${color}`}>
        {net.toFixed(2)}
      </span>
    );
  };

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500">Sınav verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // NO DATA STATE
  // =============================================================================

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
          >
            <ArrowLeft size={20} />
            Geri
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Sınav Bulunamadı</h2>
            <p className="text-slate-500 mb-6">
              Henüz kayıtlı bir sınav bulunmuyor veya seçilen sınav silinmiş olabilir.
            </p>
            <button
              onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Yeni Sınav Oluştur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-slate-800">{exam.ad}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{exam.tip}</span>
                  <span>•</span>
                  <span>{formatDate(exam.tarih)}</span>
                  <span>•</span>
                  <span>{exam.ogrenciler?.length || 0} öğrenci</span>
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
                onClick={() => handleGenerateReport()}
                disabled={selectedStudents.size === 0 || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                {selectedStudents.size > 0 ? `${selectedStudents.size} Karne Oluştur` : 'Karne Oluştur'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Users size={16} />
              Öğrenci
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats?.toplamOgrenci || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Target size={16} />
              Ort. Net
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats?.ortalamaNet || '0'}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Award size={16} />
              Ort. Puan
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats?.ortalamaPuan || '0'}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <TrendingUp size={16} />
              En Yüksek
            </div>
            <div className="text-2xl font-bold text-green-600">{stats?.maxNet?.toFixed(2) || '0'}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <TrendingDown size={16} />
              En Düşük
            </div>
            <div className="text-2xl font-bold text-red-600">{stats?.minNet?.toFixed(2) || '0'}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <CheckCircle size={16} />
              Seçili
            </div>
            <div className="text-2xl font-bold text-purple-600">{selectedStudents.size}</div>
          </div>
        </div>

        {/* Ders Bazlı İstatistikler */}
        {dersStats.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-600" />
              Ders Bazlı Ortalamalar
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {dersStats.map(ders => {
                const renk = DERS_RENKLERI[ders.dersKodu] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                return (
                  <div key={ders.dersKodu} className={`p-3 rounded-lg ${renk.bg} ${renk.border} border`}>
                    <div className={`text-xs font-medium ${renk.text} mb-1`}>{ders.dersAdi}</div>
                    <div className={`text-lg font-bold ${renk.text}`}>{ders.ortalamaNet}</div>
                    <div className="text-xs text-slate-500">D:{ders.ortalamaDogru} Y:{ders.ortalamaYanlis}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara (ad, numara, sınıf)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
              >
                <Table2 size={18} className={viewMode === 'table' ? 'text-emerald-600' : 'text-slate-500'} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
              >
                <LayoutGrid size={18} className={viewMode === 'cards' ? 'text-emerald-600' : 'text-slate-500'} />
              </button>
            </div>
            
            {/* Column Toggle */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Columns size={18} className="text-slate-500" />
                <span className="text-sm text-slate-600">Sütunlar</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 p-2 hidden group-hover:block z-50">
                {Object.entries(showColumns).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => setShowColumns(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700 capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('siralama')}
                    >
                      <div className="flex items-center gap-1">
                        Sıra
                        <SortIcon field="siralama" />
                      </div>
                    </th>
                    {showColumns.numara && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Numara
                      </th>
                    )}
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('ogrenciAdi')}
                    >
                      <div className="flex items-center gap-1">
                        Öğrenci
                        <SortIcon field="ogrenciAdi" />
                      </div>
                    </th>
                    {showColumns.sinif && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Sınıf
                      </th>
                    )}
                    {showColumns.kitapcik && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Kitapçık
                      </th>
                    )}
                    {showColumns.dogru && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">
                        D
                      </th>
                    )}
                    {showColumns.yanlis && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                        Y
                      </th>
                    )}
                    {showColumns.bos && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        B
                      </th>
                    )}
                    {showColumns.net && (
                      <th 
                        className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('toplamNet')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Net
                          <SortIcon field="toplamNet" />
                        </div>
                      </th>
                    )}
                    {showColumns.puan && (
                      <th 
                        className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('toplamPuan')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Puan
                          <SortIcon field="toplamPuan" />
                        </div>
                      </th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, index) => {
                    const isSelected = selectedStudents.has(student.id);
                    const isExpanded = selectedStudentId === student.id;
                    
                    return (
                      <React.Fragment key={student.id}>
                        <tr 
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50' : ''}`}
                          onClick={() => handleRowClick(student)}
                        >
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectStudent(student.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                              ${student.siralama <= 3 ? 'bg-amber-100 text-amber-700' : 
                                student.siralama <= 10 ? 'bg-emerald-100 text-emerald-700' : 
                                'bg-slate-100 text-slate-600'}`}>
                              {student.siralama}
                            </span>
                          </td>
                          {showColumns.numara && (
                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                              {student.ogrenciNo || '-'}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{student.ogrenciAdi}</div>
                          </td>
                          {showColumns.sinif && (
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">
                                {student.sinifNo || '-'}
                              </span>
                            </td>
                          )}
                          {showColumns.kitapcik && (
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium
                                ${student.kitapcik === 'A' ? 'bg-blue-100 text-blue-700' : 
                                  student.kitapcik === 'B' ? 'bg-purple-100 text-purple-700' : 
                                  'bg-slate-100 text-slate-600'}`}>
                                {student.kitapcik || '-'}
                              </span>
                            </td>
                          )}
                          {showColumns.dogru && (
                            <td className="px-4 py-3 text-center font-semibold text-green-600">
                              {student.toplamDogru}
                            </td>
                          )}
                          {showColumns.yanlis && (
                            <td className="px-4 py-3 text-center font-semibold text-red-600">
                              {student.toplamYanlis}
                            </td>
                          )}
                          {showColumns.bos && (
                            <td className="px-4 py-3 text-center text-slate-500">
                              {student.toplamBos}
                            </td>
                          )}
                          {showColumns.net && (
                            <td className="px-4 py-3 text-center">
                              <NetBadge net={student.toplamNet} />
                            </td>
                          )}
                          {showColumns.puan && (
                            <td className="px-4 py-3 text-center">
                              <span className="font-bold text-blue-600">{student.toplamPuan.toFixed(2)}</span>
                            </td>
                          )}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedStudentId(isExpanded ? null : student.id)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Detay"
                              >
                                <Eye size={16} className="text-slate-500" />
                              </button>
                              <button
                                onClick={() => handleGenerateReport(student.id)}
                                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Karne İndir"
                              >
                                <Download size={16} className="text-emerald-600" />
                              </button>
                              <button
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Yazdır"
                              >
                                <Printer size={16} className="text-blue-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row - Ders Detayları */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={12} className="p-0 bg-slate-50">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-6 border-l-4 border-emerald-500">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                      <BookOpen size={16} className="text-emerald-600" />
                                      Ders Bazlı Sonuçlar - {student.ogrenciAdi}
                                    </h4>
                                    {student.dersBazli && student.dersBazli.length > 0 ? (
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {student.dersBazli.map(ders => {
                                          const renk = DERS_RENKLERI[ders.dersKodu] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                                          return (
                                            <div key={ders.dersKodu} className={`p-3 rounded-lg ${renk.bg} ${renk.border} border`}>
                                              <div className={`text-xs font-medium ${renk.text} mb-2`}>{ders.dersAdi}</div>
                                              <div className={`text-xl font-bold ${renk.text} mb-1`}>{ders.net.toFixed(2)}</div>
                                              <div className="flex items-center gap-2 text-xs">
                                                <span className="text-green-600">D:{ders.dogru}</span>
                                                <span className="text-red-600">Y:{ders.yanlis}</span>
                                                <span className="text-slate-500">B:{ders.bos}</span>
                                              </div>
                                              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-emerald-500 rounded-full"
                                                  style={{ width: `${ders.basariOrani || 0}%` }}
                                                />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500">Ders bazlı veri bulunmuyor.</p>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredStudents.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Öğrenci bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map(student => {
              const isSelected = selectedStudents.has(student.id);
              
              return (
                <motion.div
                  key={student.id}
                  layout
                  className={`bg-white rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-lg
                    ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                  onClick={() => handleSelectStudent(student.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-800">{student.ogrenciAdi}</div>
                      <div className="text-sm text-slate-500">{student.ogrenciNo}</div>
                    </div>
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                      ${student.siralama <= 3 ? 'bg-amber-100 text-amber-700' : 
                        student.siralama <= 10 ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-slate-100 text-slate-600'}`}>
                      {student.siralama}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                    <div>
                      <div className="text-xs text-slate-500">D</div>
                      <div className="font-bold text-green-600">{student.toplamDogru}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Y</div>
                      <div className="font-bold text-red-600">{student.toplamYanlis}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">B</div>
                      <div className="font-bold text-slate-500">{student.toplamBos}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Net</div>
                      <div className="font-bold text-emerald-600">{student.toplamNet.toFixed(1)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Puan:</span>
                      <span className="font-bold text-blue-600">{student.toplamPuan.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateReport(student.id);
                      }}
                      className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default function KarnePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <KarneContent />
    </Suspense>
  );
}
