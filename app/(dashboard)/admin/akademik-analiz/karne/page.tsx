'use client';

/**
 * Akademik Analiz - K12Net Benzeri Sınav Sonuçları
 * Detaylı öğrenci listesi ve ders bazlı analiz
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  Users,
  FileSpreadsheet,
  BookOpen,
  X,
  RefreshCw,
  Download,
  Printer,
  Search,
  Filter,
  BarChart3,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface DersDetay {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariOrani: number;
}

interface StudentResult {
  id: string;
  ogrenciNo: string;
  ogrenciAdi: string;
  sinifNo?: string;
  sube?: string;
  sayisalKitapcik?: string;
  sozelKitapcik?: string;
  kitapcik?: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamHatali: number;
  toplamNet: number;
  netYuzdesi: number;
  lgsPuani: number;
  subeLgsSira: string;
  okulLgsSira: string;
  subeNetSira: string;
  okulNetSira: string;
  dersler?: DersDetay[];
}

interface ExamData {
  id: string;
  ad: string;
  tarih: string;
  tip: string;
  toplamSoru: number;
  egitimYili: string;
  ogrenciler: StudentResult[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DERS_RENKLERI: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'TUR': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: '📘' },
  'TURKCE': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: '📘' },
  'MAT': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: '📐' },
  'MATEMATIK': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: '📐' },
  'FEN': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: '🔬' },
  'FEN_BILIMLERI': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: '🔬' },
  'SOS': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: '🌍' },
  'SOSYAL': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: '🌍' },
  'ING': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', icon: '🇬🇧' },
  'INGILIZCE': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', icon: '🇬🇧' },
  'DIN': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', icon: '📿' },
  'DIN_KULTURU': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', icon: '📿' },
  'INKILAP': { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', icon: '🏛️' },
};

const getDersRenk = (kod: string) => {
  return DERS_RENKLERI[kod] || { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', icon: '📚' };
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);

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
          // Veriyi formatla
          const formattedExam: ExamData = {
            id: data.exam.id,
            ad: data.exam.ad,
            tarih: data.exam.tarih,
            tip: data.exam.tip || 'LGS',
            toplamSoru: data.exam.toplamSoru || 90,
            egitimYili: '2025-2026',
            ogrenciler: (data.exam.ogrenciler || []).map((o: any, idx: number) => {
              const totalQ = data.exam.toplamSoru || 90;
              const netYuzdesi = totalQ > 0 ? (o.toplamNet / totalQ) * 100 : 0;
              const lgsPuani = calculateLGSPuan(o.toplamNet);
              
              return {
                id: o.id || String(idx),
                ogrenciNo: o.ogrenciNo || String(idx + 1),
                ogrenciAdi: o.ogrenciAdi || 'Bilinmeyen',
                sinifNo: o.sinifNo || '8',
                sube: o.sinifNo || 'A',
                sayisalKitapcik: o.kitapcik || 'A',
                sozelKitapcik: o.kitapcik || 'A',
                kitapcik: o.kitapcik,
                toplamDogru: o.toplamDogru || 0,
                toplamYanlis: o.toplamYanlis || 0,
                toplamBos: o.toplamBos || 0,
                toplamHatali: 0,
                toplamNet: o.toplamNet || 0,
                netYuzdesi: netYuzdesi,
                lgsPuani: lgsPuani,
                subeLgsSira: `${o.siralama || idx + 1}/59`,
                okulLgsSira: `${o.siralama || idx + 1}/59`,
                subeNetSira: `${o.siralama || idx + 1}/59`,
                okulNetSira: `${o.siralama || idx + 1}/59`,
                dersler: o.dersBazli || generateDefaultDersler(o, totalQ)
              };
            })
          };
          
          setExam(formattedExam);
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
            const exam = detailData.exam;
            const formattedExam: ExamData = {
              id: exam.id,
              ad: exam.ad,
              tarih: exam.tarih,
              tip: exam.tip || 'LGS',
              toplamSoru: exam.toplamSoru || 90,
              egitimYili: '2025-2026',
              ogrenciler: (exam.ogrenciler || []).map((o: any, idx: number) => {
                const totalQ = exam.toplamSoru || 90;
                const netYuzdesi = totalQ > 0 ? (o.toplamNet / totalQ) * 100 : 0;
                const lgsPuani = calculateLGSPuan(o.toplamNet);
                
                return {
                  id: o.id || String(idx),
                  ogrenciNo: o.ogrenciNo || String(idx + 1),
                  ogrenciAdi: o.ogrenciAdi || 'Bilinmeyen',
                  sinifNo: o.sinifNo || '8',
                  sube: o.sinifNo || 'A',
                  sayisalKitapcik: o.kitapcik || 'A',
                  sozelKitapcik: o.kitapcik || 'A',
                  kitapcik: o.kitapcik,
                  toplamDogru: o.toplamDogru || 0,
                  toplamYanlis: o.toplamYanlis || 0,
                  toplamBos: o.toplamBos || 0,
                  toplamHatali: 0,
                  toplamNet: o.toplamNet || 0,
                  netYuzdesi: netYuzdesi,
                  lgsPuani: lgsPuani,
                  subeLgsSira: `${o.siralama || idx + 1}/59`,
                  okulLgsSira: `${o.siralama || idx + 1}/59`,
                  subeNetSira: `${o.siralama || idx + 1}/59`,
                  okulNetSira: `${o.siralama || idx + 1}/59`,
                  dersler: o.dersBazli || generateDefaultDersler(o, totalQ)
                };
              })
            };
            
            setExam(formattedExam);
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

  // LGS puanı hesapla
  function calculateLGSPuan(net: number): number {
    // Basit formül: 100 + (net * 5)
    return Math.round((100 + net * 5) * 100) / 100;
  }

  // Default ders dağılımı
  function generateDefaultDersler(student: any, toplamSoru: number): DersDetay[] {
    const distribution = [
      { kod: 'TUR', adi: 'Türkçe', soru: 20 },
      { kod: 'MAT', adi: 'Matematik', soru: 20 },
      { kod: 'FEN', adi: 'Fen Bilimleri', soru: 20 },
      { kod: 'SOS', adi: 'Sosyal Bilgiler', soru: 10 },
      { kod: 'DIN', adi: 'Din Kültürü', soru: 10 },
      { kod: 'ING', adi: 'İngilizce', soru: 10 },
    ];
    
    const totalQ = toplamSoru || 90;
    const totalD = student.toplamDogru || 0;
    const totalY = student.toplamYanlis || 0;
    
    return distribution.map(d => {
      const ratio = d.soru / totalQ;
      const dogru = Math.round(totalD * ratio);
      const yanlis = Math.round(totalY * ratio);
      const bos = d.soru - dogru - yanlis;
      const net = dogru - (yanlis / 3);
      
      return {
        dersKodu: d.kod,
        dersAdi: d.adi,
        soruSayisi: d.soru,
        dogru,
        yanlis,
        bos: Math.max(0, bos),
        net: parseFloat(net.toFixed(2)),
        basariOrani: Math.round((dogru / d.soru) * 100)
      };
    });
  }

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
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

  // Filtrelenmiş öğrenciler
  const filteredStudents = exam?.ogrenciler.filter(o => 
    !searchTerm || 
    o.ogrenciAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.ogrenciNo.includes(searchTerm)
  ).slice(0, pageSize) || [];

  // =============================================================================
  // LOADING
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#00a0e3] mx-auto mb-3" />
          <p className="text-slate-500">Sınav sonuçları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Sınav Bulunamadı</h2>
          <button
            onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
    <div className="min-h-screen bg-slate-100 flex">
      
      {/* Sol Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0">
        {/* Header */}
        <div className="bg-[#00a0e3] text-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-sm font-bold">
              DC
            </div>
            <span className="font-semibold">{currentOrganization?.name || 'Dikmen Çözüm Kurs'}</span>
          </div>
        </div>
        
        {/* Sınav Bilgileri */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sınav ve Uygulama</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-slate-400">Uygulama Adı</label>
              <p className="font-semibold text-slate-800">{exam.ad}</p>
              <span className="text-xs text-slate-500">{exam.tip}</span>
            </div>
            
            <div>
              <label className="text-xs text-slate-400">Uygulama Zamanı</label>
              <p className="text-slate-700">{formatDate(exam.tarih)}</p>
            </div>
            
            <div>
              <label className="text-xs text-slate-400">Eğitim Yılı</label>
              <p className="text-slate-700">{exam.egitimYili}</p>
            </div>
          </div>
        </div>
        
        {/* Menü */}
        <div className="p-4">
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
              <Users size={18} />
              Öğrenciler
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
              <FileSpreadsheet size={18} />
              Sorular
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
              <BookOpen size={18} />
              Şubeler
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
              <Target size={18} />
              Kazanımlar
            </button>
          </nav>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Dropdown'lar */}
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option>Alt Testler</option>
            </select>
            
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option>Sütunlar</option>
            </select>
            
            <select className="px-3 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
              <option>Puanlar ▼</option>
            </select>
            
            <select className="px-3 py-2 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
              <option>Sıralar ▼</option>
            </select>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sayfada Öğrenci Sayısı:</span>
              <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-slate-200 rounded text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={999}>Tümü</option>
              </select>
            </div>
            
            <div className="flex-1"></div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Etüt Oluştur
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
              Ödev Oluştur
            </button>
          </div>
        </div>

        {/* Tablo Container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-[1600px]">
            <thead className="sticky top-0 z-20">
              {/* Grup Başlıkları */}
              <tr className="bg-slate-50">
                <th colSpan={6} className="py-2 px-2 text-left text-xs font-semibold text-slate-500 border-b border-r border-slate-200">
                  
                </th>
                <th colSpan={2} className="py-2 px-2 text-center text-xs font-semibold text-purple-600 bg-purple-50 border-b border-r border-slate-200">
                  Kitapçık
                </th>
                <th colSpan={7} className="py-2 px-2 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 border-b border-r border-slate-200">
                  LGS Puanlar
                </th>
                <th colSpan={4} className="py-2 px-2 text-center text-xs font-semibold text-blue-600 bg-blue-50 border-b border-slate-200">
                  LGS Sıralar
                </th>
              </tr>
              
              {/* Sütun Başlıkları */}
              <tr className="bg-white text-xs">
                <th className="py-3 px-2 text-center font-semibold text-slate-600 border-b border-slate-200 w-12">
                  {exam.ogrenciler.length}
                </th>
                <th className="py-3 px-2 text-center font-semibold text-slate-600 border-b border-slate-200 w-8">▶</th>
                <th className="py-3 px-2 text-left font-semibold text-emerald-600 border-b border-slate-200 w-24">Numara</th>
                <th className="py-3 px-2 text-left font-semibold text-emerald-600 border-b border-slate-200 min-w-[200px]">Öğrenci</th>
                <th className="py-3 px-2 text-center font-semibold text-slate-600 border-b border-slate-200 w-28">Cevap Anahtarı</th>
                <th className="py-3 px-2 text-center font-semibold text-slate-600 border-b border-r border-slate-200 w-16">Şube</th>
                
                <th className="py-3 px-2 text-center font-semibold text-purple-600 bg-purple-50/50 border-b border-slate-200 w-20">Sayısal</th>
                <th className="py-3 px-2 text-center font-semibold text-purple-600 bg-purple-50/50 border-b border-r border-slate-200 w-20">Sözel</th>
                
                <th className="py-3 px-2 text-center font-semibold text-green-600 bg-emerald-50/50 border-b border-slate-200 w-16">Doğru</th>
                <th className="py-3 px-2 text-center font-semibold text-red-600 bg-emerald-50/50 border-b border-slate-200 w-16">Yanlış</th>
                <th className="py-3 px-2 text-center font-semibold text-slate-500 bg-emerald-50/50 border-b border-slate-200 w-14">Boş</th>
                <th className="py-3 px-2 text-center font-semibold text-orange-600 bg-emerald-50/50 border-b border-slate-200 w-16">Hatalı</th>
                <th className="py-3 px-2 text-center font-semibold text-emerald-600 bg-emerald-50/50 border-b border-slate-200 w-20">Net</th>
                <th className="py-3 px-2 text-center font-semibold text-blue-600 bg-emerald-50/50 border-b border-slate-200 w-20">Net %</th>
                <th className="py-3 px-2 text-center font-semibold text-emerald-700 bg-emerald-50/50 border-b border-r border-slate-200 w-24">LGS</th>
                
                <th className="py-3 px-2 text-center font-semibold text-blue-600 bg-blue-50/50 border-b border-slate-200 w-20">Şube-LGS</th>
                <th className="py-3 px-2 text-center font-semibold text-blue-600 bg-blue-50/50 border-b border-slate-200 w-20">Okul-LGS</th>
                <th className="py-3 px-2 text-center font-semibold text-blue-600 bg-blue-50/50 border-b border-slate-200 w-24">Şube-Net</th>
                <th className="py-3 px-2 text-center font-semibold text-blue-600 bg-blue-50/50 border-b border-slate-200 w-24">Okul-Net</th>
              </tr>
            </thead>
            
            <tbody>
              {filteredStudents.map((student, idx) => {
                const isExpanded = expandedRows.has(student.id);
                const isSelected = selectedRows.has(student.id);
                const rowBg = isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                
                return (
                  <React.Fragment key={student.id}>
                    {/* Ana Satır */}
                    <tr 
                      className={`${rowBg} hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-slate-100`}
                      onClick={() => toggleSelect(student.id)}
                    >
                      <td className="py-2 px-2 text-center text-sm font-semibold text-slate-600">{idx + 1}</td>
                      <td className="py-2 px-2 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleExpand(student.id); }}
                          className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 rounded"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="py-2 px-2 text-sm text-slate-600">{student.ogrenciNo}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{student.ogrenciAdi}</span>
                          <span className="text-emerald-500">📊</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center text-xs text-slate-500">8/B05</td>
                      <td className="py-2 px-2 text-center text-sm border-r border-slate-200">{student.sube}</td>
                      
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          student.sayisalKitapcik === 'A' ? 'bg-blue-100 text-blue-700' :
                          student.sayisalKitapcik === 'B' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {student.sayisalKitapcik || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          student.sozelKitapcik === 'A' ? 'bg-blue-100 text-blue-700' :
                          student.sozelKitapcik === 'B' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {student.sozelKitapcik || '-'}
                        </span>
                      </td>
                      
                      <td className="py-2 px-2 text-center text-sm font-semibold text-green-600">{student.toplamDogru}</td>
                      <td className="py-2 px-2 text-center text-sm font-semibold text-red-600">{student.toplamYanlis}</td>
                      <td className="py-2 px-2 text-center text-sm text-slate-500">{student.toplamBos}</td>
                      <td className="py-2 px-2 text-center text-sm text-orange-500">{student.toplamHatali}</td>
                      <td className="py-2 px-2 text-center text-sm font-bold text-emerald-700">{student.toplamNet.toFixed(2)}</td>
                      <td className="py-2 px-2 text-center text-sm font-semibold text-blue-600">{student.netYuzdesi.toFixed(0)}%</td>
                      <td className="py-2 px-2 text-center text-sm font-bold text-emerald-800 border-r border-slate-200">
                        {student.lgsPuani.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                      </td>
                      
                      <td className="py-2 px-2 text-center text-sm text-blue-600">{student.subeLgsSira}</td>
                      <td className="py-2 px-2 text-center text-sm text-blue-600">{student.okulLgsSira}</td>
                      <td className="py-2 px-2 text-center text-sm text-blue-600">{student.subeNetSira}</td>
                      <td className="py-2 px-2 text-center text-sm text-blue-600">{student.okulNetSira}</td>
                    </tr>
                    
                    {/* Genişletilmiş Ders Kartları */}
                    {isExpanded && student.dersler && (
                      <tr>
                        <td colSpan={20} className="bg-slate-100 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {student.dersler.map((ders, di) => {
                              const renk = getDersRenk(ders.dersKodu);
                              return (
                                <div 
                                  key={di}
                                  className={`${renk.bg} border ${renk.border} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">{renk.icon}</span>
                                    <h4 className={`font-bold ${renk.text}`}>{ders.dersAdi}</h4>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-500">Soru:</span>
                                      <span className="font-semibold text-slate-700">{ders.soruSayisi}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-green-600">Doğru:</span>
                                      <span className="font-bold text-green-600">{ders.dogru}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-red-600">Yanlış:</span>
                                      <span className="font-bold text-red-600">{ders.yanlis}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">Boş:</span>
                                      <span className="text-slate-500">{ders.bos}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 mt-2">
                                      <div className="flex justify-between items-center">
                                        <span className={`font-semibold ${renk.text}`}>Net:</span>
                                        <span className={`font-bold text-lg ${renk.text}`}>{ders.net.toFixed(2)}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Başarı Barı */}
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Başarı</span>
                                        <span className={renk.text}>{ders.basariOrani}%</span>
                                      </div>
                                      <div className="h-2 bg-white rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all ${
                                            ders.basariOrani >= 70 ? 'bg-green-500' :
                                            ders.basariOrani >= 50 ? 'bg-amber-500' :
                                            'bg-red-500'
                                          }`}
                                          style={{ width: `${ders.basariOrani}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Öğrenci Karnesi Butonu */}
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => router.push(`/admin/akademik-analiz/ogrenci-karne?examId=${exam.id}&studentNo=${student.ogrenciNo}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <BarChart3 size={16} />
                              Detaylı Karne Görüntüle
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-500">
                Toplam: <strong>{exam.ogrenciler.length}</strong> öğrenci
              </span>
              <span className="text-slate-500">
                Ortalama: <strong>{(exam.ogrenciler.reduce((s, o) => s + o.toplamNet, 0) / exam.ogrenciler.length).toFixed(2)}</strong> net
              </span>
              {selectedRows.size > 0 && (
                <span className="text-blue-600">
                  Seçili: <strong>{selectedRows.size}</strong>
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={loadData}
                className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
              >
                <RefreshCw size={14} />
                Yenile
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                <Download size={14} />
                Karne İndir
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded"
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00a0e3]" />
      </div>
    }>
      <KarneContent />
    </Suspense>
  );
}
