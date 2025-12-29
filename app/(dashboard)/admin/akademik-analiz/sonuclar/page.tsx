'use client';

/**
 * Akademik Analiz - Sınav Sonuçları
 * Modern, Temiz, Eğitim Odaklı Tasarım
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  Users,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  BookOpen,
  Calendar,
  GraduationCap,
  Medal,
  Sparkles
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface StudentResult {
  sira: number;
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif?: string;
  kitapcik?: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  puan: number | null;       // Puan (varsa)
  basariOrani: number;
  durum: 'cok-iyi' | 'iyi' | 'orta' | 'gelismeli';
  dersBazli?: Array<{
    dersKodu: string;
    dersAdi: string;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
  }>;
}

const DersCard = ({ ders }: { ders: NonNullable<StudentResult['dersBazli']>[number] }) => {
  const total = Math.max(1, ders.dogru + ders.yanlis + ders.bos);
  const rate = Math.round((ders.dogru / total) * 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-800">{ders.dersAdi}</div>
        <div className="text-sm font-bold text-blue-700">{Number(ders.net).toFixed(2)} net</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center">
          <div className="text-xs text-emerald-700">Doğru</div>
          <div className="text-lg font-bold text-emerald-700">{ders.dogru}</div>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-center">
          <div className="text-xs text-red-700">Yanlış</div>
          <div className="text-lg font-bold text-red-700">{ders.yanlis}</div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
          <div className="text-xs text-slate-600">Boş</div>
          <div className="text-lg font-bold text-slate-700">{ders.bos}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-2 bg-emerald-500" style={{ width: `${rate}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">Başarı: %{rate}</div>
      </div>
    </div>
  );
};

interface ExamData {
  id: string;
  ad: string;
  tarih: string;
  tip: string;
  toplamSoru: number;
  toplamOgrenci: number;
  ortalamaNet: number;
  enYuksekNet: number;
  enDusukNet: number;
  ortalamaPuan: number | null;
  enYuksekPuan: number | null;
  dersOrtalamalari?: Array<{
    dersKodu: string;
    dersAdi: string;
    ortDogru: number;
    ortYanlis: number;
    ortBos: number;
    ortNet: number;
  }>;
  ogrenciler: StudentResult[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getDurum = (basariOrani: number): StudentResult['durum'] => {
  if (basariOrani >= 75) return 'cok-iyi';
  if (basariOrani >= 50) return 'iyi';
  if (basariOrani >= 25) return 'orta';
  return 'gelismeli';
};

const getDurumStyle = (durum: StudentResult['durum']) => {
  switch (durum) {
    case 'cok-iyi': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'iyi': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'orta': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'gelismeli': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  }
};

const getDurumLabel = (durum: StudentResult['durum']) => {
  switch (durum) {
    case 'cok-iyi': return 'Çok İyi';
    case 'iyi': return 'İyi';
    case 'orta': return 'Orta';
    case 'gelismeli': return 'Gelişmeli';
  }
};

// =============================================================================
// COMPONENTS
// =============================================================================

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'emerald',
  trend
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color?: string;
  trend?: 'up' | 'down';
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-slate-500">{label}</span>
      <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
    </div>
    <div className="flex items-end gap-2">
      <span className={`text-3xl font-bold text-${color}-600`}>{value}</span>
      {trend && (
        <span className={`flex items-center text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </span>
      )}
    </div>
  </motion.div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SonuclarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const { currentOrganization } = useOrganizationStore();
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'sira' | 'net' | 'puan'>('sira');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDurum, setFilterDurum] = useState<string>('all');
  const [expandedStudentNo, setExpandedStudentNo] = useState<string | null>(null);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let examData = null;
      
      if (examId) {
        const response = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
        const data = await response.json();
        if (response.ok && data.exam) {
          examData = data.exam;
        }
      } else {
        const params = new URLSearchParams();
        if (currentOrganization?.id) {
          params.set('organizationId', currentOrganization.id);
        }
        params.set('limit', '1');
        
        const response = await fetch(`/api/akademik-analiz/wizard?${params.toString()}`);
        const data = await response.json();
        
        if (response.ok && data.exams?.[0]) {
          const detailRes = await fetch(`/api/akademik-analiz/exam-results?examId=${data.exams[0].id}`);
          const detailData = await detailRes.json();
          if (detailRes.ok && detailData.exam) {
            examData = detailData.exam;
          }
        }
      }

      if (examData) {
        const ogrenciler: StudentResult[] = (examData.ogrenciler || []).map((o: any, i: number) => {
          const dogru = o.toplamDogru || 0;
          const yanlis = o.toplamYanlis || 0;
          const bos = o.toplamBos || 0;
          const net = o.toplamNet || 0;
          const basariOrani = Math.round((dogru / 90) * 100);
          const puan = typeof o.toplamPuan === 'number' ? o.toplamPuan : null;
          
          return {
            sira: i + 1,
            ogrenciNo: o.ogrenciNo || String(i + 1),
            ogrenciAdi: o.ogrenciAdi || 'Bilinmeyen',
            sinif: o.sinifNo || '8',
            kitapcik: o.kitapcik || 'A',
            dogru,
            yanlis,
            bos,
            net,
            puan,
            basariOrani,
            durum: getDurum(basariOrani),
            dersBazli: Array.isArray(o.dersBazli) ? o.dersBazli : []
          };
        });

        const transformed: ExamData = {
          id: examData.id,
          ad: examData.ad,
          tarih: examData.tarih,
          tip: examData.tip || 'LGS',
          toplamSoru: examData.toplamSoru || 90,
          toplamOgrenci: ogrenciler.length,
          ortalamaNet: ogrenciler.length > 0 
            ? ogrenciler.reduce((s, o) => s + o.net, 0) / ogrenciler.length 
            : 0,
          enYuksekNet: ogrenciler.length > 0 
            ? Math.max(...ogrenciler.map(o => o.net)) 
            : 0,
          enDusukNet: ogrenciler.length > 0 
            ? Math.min(...ogrenciler.map(o => o.net)) 
            : 0,
          // Puan alanı her sınavda olmayabilir (null olabilir). Güvenli hesapla.
          ortalamaPuan: (() => {
            const puanli = ogrenciler.filter(o => typeof o.puan === 'number') as Array<StudentResult & { puan: number }>;
            if (puanli.length === 0) return null;
            const avg = puanli.reduce((s, o) => s + o.puan, 0) / puanli.length;
            return Math.round(avg * 100) / 100;
          })(),
          enYuksekPuan: (() => {
            const puanli = ogrenciler.filter(o => typeof o.puan === 'number') as Array<StudentResult & { puan: number }>;
            if (puanli.length === 0) return null;
            return Math.max(...puanli.map(o => o.puan));
          })(),
          dersOrtalamalari: examData.dersOrtalamalari || [],
          ogrenciler
        };

        setExam(transformed);
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

  const filteredStudents = React.useMemo(() => {
    if (!exam?.ogrenciler) return [];
    
    let result = [...exam.ogrenciler];
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.ogrenciAdi.toLowerCase().includes(term) ||
        s.ogrenciNo.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (filterDurum !== 'all') {
      result = result.filter(s => s.durum === filterDurum);
    }
    
    // Sort
    result.sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    
    return result;
  }, [exam?.ogrenciler, searchTerm, filterDurum, sortField, sortOrder]);

  const dersOrtalamalari = React.useMemo(() => {
    const rows = exam?.dersOrtalamalari || [];
    const byCode = new Map<string, any>();
    for (const r of rows) byCode.set(String(r.dersKodu).toUpperCase(), r);
    const get = (code: string) => byCode.get(code) || null;

    const tur = get('TUR');
    const ink = get('INK');
    const din = get('DIN');
    const ing = get('ING');
    const mat = get('MAT');
    const fen = get('FEN');

    const sozel = (tur?.ortNet || 0) + (ink?.ortNet || 0) + (din?.ortNet || 0) + (ing?.ortNet || 0);
    const sayisal = (mat?.ortNet || 0) + (fen?.ortNet || 0);
    const lgs90 = sozel + sayisal;

    return {
      tur, ink, din, ing, mat, fen,
      sozel: Math.round(sozel * 100) / 100,
      sayisal: Math.round(sayisal * 100) / 100,
      lgs90: Math.round(lgs90 * 100) / 100,
      hasAny: rows.length > 0,
    };
  }, [exam?.dersOrtalamalari]);

  // Distribution stats
  const distribution = React.useMemo(() => {
    if (!exam?.ogrenciler) return { cokIyi: 0, iyi: 0, orta: 0, gelismeli: 0 };
    return {
      cokIyi: exam.ogrenciler.filter(o => o.durum === 'cok-iyi').length,
      iyi: exam.ogrenciler.filter(o => o.durum === 'iyi').length,
      orta: exam.ogrenciler.filter(o => o.durum === 'orta').length,
      gelismeli: exam.ogrenciler.filter(o => o.durum === 'gelismeli').length
    };
  }, [exam?.ogrenciler]);

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

  // =============================================================================
  // LOADING
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-12 rounded-3xl shadow-sm border border-slate-200 max-w-md"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Sınav Bulunamadı</h2>
          <p className="text-slate-500 mb-6">Henüz analiz edilmiş bir sınav bulunmuyor.</p>
          <button
            onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Yeni Sınav Oluştur
          </button>
        </motion.div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/admin/akademik-analiz')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">{exam.ad}</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar size={14} />
                      {formatDate(exam.tarih)} • {exam.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                title="Yenile"
              >
                <RefreshCw size={18} className="text-slate-600" />
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Yazdır</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                <Download size={18} />
                <span className="hidden sm:inline">PDF İndir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard 
            icon={Users} 
            label="Toplam Öğrenci" 
            value={exam.toplamOgrenci}
            color="slate"
          />
          <StatCard 
            icon={Target} 
            label="Ortalama Net" 
            value={exam.ortalamaNet.toFixed(2)}
            color="blue"
          />
          <StatCard 
            icon={Award} 
            label="En Yüksek Net" 
            value={exam.enYuksekNet.toFixed(2)}
            color="emerald"
          />
          <StatCard 
            icon={Medal} 
            label="Toplam Soru" 
            value={exam.toplamSoru}
            color="slate"
          />
          {/* MEB LGS Puanı */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-amber-700 font-medium">Ort. LGS Puanı</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles size={20} className="text-amber-600" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-amber-600">
                {typeof exam.ortalamaPuan === 'number' ? exam.ortalamaPuan.toFixed(2) : '—'}
              </span>
            </div>
            <div className="text-xs text-amber-500 mt-1">100-500 MEB Skalası</div>
          </motion.div>
        </div>

        {/* Performance Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Başarı Dağılımı
          </h3>
          <div className="flex items-center gap-4">
            {/* Progress Bar */}
            <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(distribution.cokIyi / exam.toplamOgrenci) * 100}%` }}
              />
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(distribution.iyi / exam.toplamOgrenci) * 100}%` }}
              />
              <div 
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${(distribution.orta / exam.toplamOgrenci) * 100}%` }}
              />
              <div 
                className="h-full bg-red-400 transition-all duration-500"
                style={{ width: `${(distribution.gelismeli / exam.toplamOgrenci) * 100}%` }}
              />
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600">Çok İyi ({distribution.cokIyi})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600">İyi ({distribution.iyi})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-slate-600">Orta ({distribution.orta})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-slate-600">Gelişmeli ({distribution.gelismeli})</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ana Ders Ortalamaları (3. foto) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-600" />
              Ana Ders Listesi (Ortalamalar)
            </h3>
            <span className="text-xs text-slate-400">Net ortalamaları</span>
          </div>

          {!dersOrtalamalari.hasAny ? (
            <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
              Ders ortalamaları bulunamadı. (Bu sınavda `exam_student_results.subject_results` boş olabilir.)
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">Tür</th>
                    <th className="text-center py-2 px-3">(90) LGS</th>
                    <th className="text-center py-2 px-3">(50) Sözel</th>
                    <th className="text-center py-2 px-3">(40) Sayısal</th>
                    <th className="text-center py-2 px-3">(20) Türkçe</th>
                    <th className="text-center py-2 px-3">(10) T.C.</th>
                    <th className="text-center py-2 px-3">(10) Din</th>
                    <th className="text-center py-2 px-3">(10) Yabancı</th>
                    <th className="text-center py-2 px-3">(20) Mat</th>
                    <th className="text-center py-2 pl-3">(20) Fen</th>
                  </tr>
                </thead>
                <tbody className="border-t border-slate-200">
                  <tr className="font-medium">
                    <td className="py-3 pr-3 text-slate-700">Ortalama</td>
                    <td className="text-center py-3 px-3 text-emerald-700">{dersOrtalamalari.lgs90.toFixed(2)}</td>
                    <td className="text-center py-3 px-3 text-slate-700">{dersOrtalamalari.sozel.toFixed(2)}</td>
                    <td className="text-center py-3 px-3 text-slate-700">{dersOrtalamalari.sayisal.toFixed(2)}</td>
                    <td className="text-center py-3 px-3">{(dersOrtalamalari.tur?.ortNet ?? 0).toFixed(2)}</td>
                    <td className="text-center py-3 px-3">{(dersOrtalamalari.ink?.ortNet ?? 0).toFixed(2)}</td>
                    <td className="text-center py-3 px-3">{(dersOrtalamalari.din?.ortNet ?? 0).toFixed(2)}</td>
                    <td className="text-center py-3 px-3">{(dersOrtalamalari.ing?.ortNet ?? 0).toFixed(2)}</td>
                    <td className="text-center py-3 px-3">{(dersOrtalamalari.mat?.ortNet ?? 0).toFixed(2)}</td>
                    <td className="text-center py-3 pl-3">{(dersOrtalamalari.fen?.ortNet ?? 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara (ad veya numara)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            
            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterDurum('all')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filterDurum === 'all' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilterDurum('cok-iyi')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filterDurum === 'cok-iyi' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Çok İyi
              </button>
              <button
                onClick={() => setFilterDurum('gelismeli')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filterDurum === 'gelismeli' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Gelişmeli
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                    Sıra
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sınıf
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">
                    Doğru
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                    Yanlış
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Boş
                  </th>
                  <th 
                    className="px-4 py-4 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                      if (sortField === 'net') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                      else { setSortField('net'); setSortOrder('desc'); }
                    }}
                  >
                    Net {sortField === 'net' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-4 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                      if (sortField === 'puan') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                      else { setSortField('puan'); setSortOrder('desc'); }
                    }}
                  >
                    Puan {sortField === 'puan' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
                    Detay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, index) => {
                  const durumStyle = getDurumStyle(student.durum);
                  const isOpen = expandedStudentNo === student.ogrenciNo;
                  const dersler = (student.dersBazli || []).filter(d => d && d.dersKodu);

                  return (
                    <React.Fragment key={`${student.ogrenciNo}-${index}`}>
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                      <td className="px-4 py-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          student.sira <= 3 
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200' 
                            : student.sira <= 10 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {student.sira}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                            {student.ogrenciAdi.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                              {student.ogrenciAdi}
                            </div>
                            <div className="text-xs text-slate-400">No: {student.ogrenciNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-sm text-slate-600 font-medium">
                          {student.sinif}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold text-green-600">{student.dogru}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold text-red-500">{student.yanlis}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg text-slate-400">{student.bos}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold text-blue-600">{student.net.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {typeof student.puan === 'number' ? (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-full text-sm font-bold border border-amber-200">
                            {student.puan.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${durumStyle.bg} ${durumStyle.text}`}>
                          {getDurumLabel(student.durum)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setExpandedStudentNo(prev => (prev === student.ogrenciNo ? null : student.ogrenciNo))}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                            title={isOpen ? 'Kapat' : 'Detay aç'}
                          >
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <button
                            onClick={() => router.push(`/admin/akademik-analiz/ogrenci-karne?examId=${exam.id}&studentNo=${student.ogrenciNo}`)}
                            className="p-2 hover:bg-emerald-100 rounded-xl transition-colors text-slate-600 hover:text-emerald-700"
                            title="Karneyi görüntüle"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                      </motion.tr>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={10} className="px-4 pb-5">
                              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <BookOpen size={16} className="text-emerald-600" />
                                    Ders Detayları
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {dersler.length > 0 ? `${dersler.length} ders` : 'Ders detayı bulunamadı'}
                                  </div>
                                </div>

                                {dersler.length === 0 ? (
                                  <div className="text-sm text-slate-500">
                                    Bu sınavda ders detayları yok. (Beklenen: `exam_student_results.subject_results`)
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {dersler.map((d, idx2) => (
                                      <DersCard key={`${d.dersKodu}-${idx2}`} ders={d} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
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
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aramanızla eşleşen öğrenci bulunamadı</p>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>{filteredStudents.length} öğrenci gösteriliyor</span>
          <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
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
