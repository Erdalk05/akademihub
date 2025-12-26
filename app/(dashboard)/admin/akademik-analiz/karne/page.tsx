'use client';

/**
 * Akademik Analiz - K12Net Benzeri Detaylı Sınav Sonuçları
 * Yatay kaydırma, sabit sütunlar, kompakt tasarım
 */

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Download,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronDown,
  Filter,
  FileText,
  Printer,
  X,
  Check,
  Eye,
  BarChart3,
  Users,
  Settings
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
  sayisalKitapcik?: string;
  sozelKitapcik?: string;
  kitapcik?: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  hataliSayisi?: number;
  toplamNet: number;
  netYuzdesi?: number;
  toplamPuan: number;
  siralama: number;
  subeSira?: number;
  okulSira?: number;
  subeNetSira?: number;
  okulNetSira?: number;
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
  sinifSeviyesi?: string;
  toplamSoru: number;
  toplamOgrenci: number;
  ortalamaNet: number;
  ogrenciler: StudentResult[];
}

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
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    cevapAnahtari: true,
    sube: true,
    sayisalKitapcik: true,
    sozelKitapcik: true,
    dogru: true,
    yanlis: true,
    bos: true,
    hatali: true,
    net: true,
    netYuzdesi: true,
    puan: true,
    subeSira: true,
    okulSira: true,
    subeNetSira: true,
    okulNetSira: true
  });

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (examId) {
        const response = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
        const data = await response.json();
        
        if (response.ok && data.exam) {
          // Verileri zenginleştir
          const enrichedStudents = data.exam.ogrenciler.map((s: StudentResult, i: number) => ({
            ...s,
            sayisalKitapcik: s.kitapcik || 'A',
            sozelKitapcik: s.kitapcik || 'A',
            hataliSayisi: 0,
            netYuzdesi: s.toplamNet > 0 ? parseFloat(((s.toplamNet / (data.exam.toplamSoru || 90)) * 100).toFixed(1)) : 0,
            subeSira: Math.ceil((i + 1) / 10),
            okulSira: i + 1,
            subeNetSira: `${Math.ceil((i + 1) / 10)}/${Math.ceil(data.exam.ogrenciler.length / 10)}`,
            okulNetSira: `${i + 1}/${data.exam.ogrenciler.length}`
          }));
          
          setExam({
            ...data.exam,
            ogrenciler: enrichedStudents
          });
        }
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =============================================================================
  // COMPUTED
  // =============================================================================

  const filteredStudents = useMemo(() => {
    if (!exam?.ogrenciler) return [];
    
    let result = [...exam.ogrenciler];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.ogrenciAdi.toLowerCase().includes(term) ||
        s.ogrenciNo?.toLowerCase().includes(term)
      );
    }
    
    return result.slice(0, pageSize);
  }, [exam?.ogrenciler, searchTerm, pageSize]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedRows.size === filteredStudents.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // =============================================================================
  // LOADING
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#00a0e3] mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Sınav Bulunamadı</h2>
          <button
            onClick={() => router.push('/admin/akademik-analiz')}
            className="text-[#00a0e3] hover:underline"
          >
            ← Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-[#f0f4f7]">
      {/* Header - K12Net Style */}
      <div className="bg-[#00a0e3] text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-white/10 p-1 rounded">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-semibold">{currentOrganization?.name || 'Dikmen Çözüm Kurs'} Merkezi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar + Content Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 bg-white border-r border-slate-200 min-h-[calc(100vh-44px)]">
          <div className="p-3 border-b border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase">Sınav ve Uygulama</h3>
          </div>
          
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Uygulama Adı</div>
            <div className="text-sm font-semibold text-slate-800">{exam.ad}</div>
            <div className="text-xs text-slate-500">{exam.tip}</div>
          </div>
          
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Uygulama Zamanı</div>
            <div className="text-sm font-semibold text-slate-800">{formatDate(exam.tarih)}</div>
          </div>
          
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Eğitim Yılı</div>
            <div className="text-sm font-semibold text-slate-800">2025-2026</div>
          </div>

          <div className="mt-4">
            <button className="w-full text-left px-3 py-2 bg-[#00a0e3] text-white text-sm font-medium">
              Öğrenciler
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm text-slate-600">
              Sorular
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm text-slate-600">
              Şubeler
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm text-slate-600">
              Kazanımlar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center gap-3 flex-wrap">
            {/* Dropdown Filters */}
            <div className="relative">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded border border-slate-300">
                Alt Testler
                <ChevronDown size={14} />
              </button>
            </div>
            
            <div className="relative">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded border border-slate-300">
                Sütunlar
                <ChevronDown size={14} />
              </button>
            </div>
            
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#f0a030] hover:bg-[#e09020] text-white rounded">
              Puanlar
              <ChevronDown size={14} />
            </button>
            
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#40a060] hover:bg-[#309050] text-white rounded">
              Sıralar
              <ChevronDown size={14} />
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-600">Sayfada Öğrenci Sayısı :</span>
              <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-slate-300 rounded"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>Tümü</option>
              </select>
            </div>

            <button className="px-3 py-1.5 text-sm bg-[#00a0e3] hover:bg-[#0090d0] text-white rounded">
              Etüt Oluştur
            </button>
            
            <button className="px-3 py-1.5 text-sm bg-[#e05050] hover:bg-[#d04040] text-white rounded">
              Ödev Oluştur
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  {/* Header Row 1 - Groups */}
                  <tr className="bg-[#e8f4fc]">
                    <th colSpan={4} className="border border-slate-200 px-2 py-1 text-center text-xs font-semibold text-slate-600"></th>
                    <th colSpan={2} className="border border-slate-200 px-2 py-1 text-center text-xs font-semibold text-slate-600 bg-[#ffe0e0]">
                      Kitapçık
                    </th>
                    <th colSpan={8} className="border border-slate-200 px-2 py-1 text-center text-xs font-semibold text-slate-600 bg-[#e0ffe0]">
                      LGS Puanlar
                    </th>
                    <th colSpan={4} className="border border-slate-200 px-2 py-1 text-center text-xs font-semibold text-slate-600 bg-[#e0e0ff]">
                      LGS Sıralar
                    </th>
                    <th className="border border-slate-200 px-2 py-1 w-8"></th>
                  </tr>
                  
                  {/* Header Row 2 - Columns */}
                  <tr className="bg-[#d0e8f8]">
                    <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-700 whitespace-nowrap sticky left-0 bg-[#d0e8f8] z-10">
                      {exam.ogrenciler?.length || 0}
                    </th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 w-8">▶</th>
                    <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Numara</th>
                    <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[180px]">Öğrenci</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#fff0f0]">Sayısal<br/>Kitapçık</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#fff0f0]">Sözel<br/>Kitapçık</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">Doğru<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">Yanlış<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">Boş<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">Hatalı<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">Net<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">Net<br/>Yüzdesi</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0fff0]">LGS</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0f0ff]">Şube-LGS</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0f0ff]">Okul-LGS</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0f0ff]">Şube-Net<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 whitespace-nowrap bg-[#f0f0ff]">Okul-Net<br/>Sayısı</th>
                    <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-700 w-8">
                      <X size={14} className="text-red-500 mx-auto" />
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const isSelected = selectedRows.has(student.id);
                    const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                    
                    return (
                      <tr 
                        key={student.id} 
                        className={`${rowBg} hover:bg-[#e8f4fc] transition-colors cursor-pointer ${isSelected ? '!bg-[#d0e8f8]' : ''}`}
                        onClick={() => toggleRow(student.id)}
                      >
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 sticky left-0 z-10" style={{ backgroundColor: isSelected ? '#d0e8f8' : index % 2 === 0 ? 'white' : '#f8fafc' }}>
                          {index + 1}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                          <button className="text-slate-400 hover:text-[#00a0e3]">▶</button>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-slate-700 font-mono text-xs">
                          {student.ogrenciNo || '-'}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-slate-800 font-medium whitespace-nowrap">
                          {student.ogrenciAdi}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center bg-[#fffafa]">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            student.sayisalKitapcik === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {student.sayisalKitapcik || '-'}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center bg-[#fffafa]">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            student.sozelKitapcik === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {student.sozelKitapcik || '-'}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-green-600 bg-[#fafffa]">
                          {student.toplamDogru}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-red-600 bg-[#fafffa]">
                          {student.toplamYanlis}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-500 bg-[#fafffa]">
                          {student.toplamBos}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-500 bg-[#fafffa]">
                          {student.hataliSayisi || 0}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-emerald-700 bg-[#fafffa]">
                          {student.toplamNet.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 bg-[#fafffa]">
                          {student.netYuzdesi?.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-blue-700 bg-[#fafffa]">
                          {student.toplamPuan.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 bg-[#fafaff]">
                          {student.subeSira}/{Math.ceil((exam.ogrenciler?.length || 1) / 10)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 bg-[#fafaff]">
                          {student.siralama}/{exam.ogrenciler?.length || 0}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 bg-[#fafaff]">
                          {student.subeSira}/{Math.ceil((exam.ogrenciler?.length || 1) / 10)}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 bg-[#fafaff]">
                          {student.siralama}/{exam.ogrenciler?.length || 0}
                        </td>
                        <td className="border border-slate-200 px-2 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                            title="Kaldır"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredStudents.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Öğrenci bulunamadı</p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-4 bg-white rounded-lg shadow-sm p-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Toplam: <strong>{exam.ogrenciler?.length || 0}</strong> öğrenci | 
              Ort. Net: <strong className="text-emerald-600">{exam.ortalamaNet?.toFixed(2) || '0'}</strong> | 
              Seçili: <strong className="text-[#00a0e3]">{selectedRows.size}</strong>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded"
              >
                <RefreshCw size={14} />
                Yenile
              </button>
              
              <button
                disabled={selectedRows.size === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#00a0e3] hover:bg-[#0090d0] disabled:bg-slate-300 text-white rounded"
              >
                <Download size={14} />
                Karne İndir ({selectedRows.size})
              </button>
              
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded"
              >
                <Printer size={14} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
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
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00a0e3]" />
      </div>
    }>
      <KarneContent />
    </Suspense>
  );
}
