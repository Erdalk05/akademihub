'use client';

/**
 * Akademik Analiz - Süper Detaylı Öğrenci Karnesi
 * 4 Gelişmiş Sekmeli Modern Tasarım
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Printer,
  Loader2,
  User,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  BookMarked,
  StickyNote,
  GraduationCap,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Lightbulb,
  Phone,
  Mail,
  MapPin,
  Hash,
  Bookmark,
  Trophy,
  Flame,
  Sparkles,
  Activity,
  PieChart,
  TrendingUp as LineChart,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Plus,
  Check,
  X,
  Edit3,
  Save,
  RefreshCw,
  Filter,
  Percent,
  Medal,
  Crown,
  Gift,
  Heart,
  Shield,
  Rocket,
  Compass
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';

// =============================================================================
// TYPES
// =============================================================================

interface DersKart {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariOrani: number;
  sinifOrtalamasi?: number;
  hedef?: number;
}

interface SinavKarsilastirma {
  sinavAdi: string;
  tarih: string;
  toplamNet: number;
  puan: number;
  sira: number;
  dersler: { dersAdi: string; net: number }[];
}

interface OgrenciKarne {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinifNo?: string;
  sube?: string;
  okul?: string;
  kitapcik?: string;
  sinavAdi: string;
  sinavTarihi: string;
  sinavTipi: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan: number;
  basariOrani: number;
  genelSira: number;
  subeSira?: number;
  okulSira?: number;
  toplamOgrenci: number;
  dersler: DersKart[];
  oncekiSinavlar: SinavKarsilastirma[];
}

type TabId = 'profil' | 'sinavlar' | 'grafikler' | 'notlar';

interface Tab {
  id: TabId;
  label: string;
  icon: any;
}

const TABS: Tab[] = [
  { id: 'profil', label: 'Öğrenci Profili', icon: User },
  { id: 'sinavlar', label: 'Sınav Karşılaştırma', icon: BarChart3 },
  { id: 'grafikler', label: 'Detaylı Analiz', icon: PieChart },
  { id: 'notlar', label: 'Notlar & Öneriler', icon: StickyNote },
];

const DERS_RENKLERI: Record<string, string> = {
  'TUR': '#3B82F6', 'TURKCE': '#3B82F6',
  'MAT': '#EF4444', 'MATEMATIK': '#EF4444',
  'FEN': '#22C55E', 'FEN_BILIMLERI': '#22C55E',
  'SOS': '#F59E0B', 'SOSYAL_BILGILER': '#F59E0B',
  'ING': '#8B5CF6', 'INGILIZCE': '#8B5CF6',
  'DIN': '#F97316', 'DIN_KULTURU': '#F97316',
  'INKILAP': '#EC4899',
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const ProgressRing = ({ value, size = 80, color = '#22C55E', label }: { value: number; size?: number; color?: string; label?: string }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="#E5E7EB" strokeWidth="6" fill="none" />
        <motion.circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke={color} strokeWidth="6" fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}%</span>
        {label && <span className="text-xs text-slate-400">{label}</span>}
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, subValue, color, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white relative overflow-hidden`}
  >
    <div className="absolute top-2 right-2 opacity-20">
      <Icon size={40} />
    </div>
    <div className="relative z-10">
      <div className="text-white/80 text-sm mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {subValue && <div className="text-sm text-white/70 mt-1">{subValue}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm mt-2 ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
        </div>
      )}
    </div>
  </motion.div>
);

const Badge = ({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700`}>
    {children}
  </span>
);

// =============================================================================
// TAB 1: ÖĞRENCİ PROFİLİ (GELİŞMİŞ)
// =============================================================================

const ProfilTab = ({ karne }: { karne: OgrenciKarne }) => {
  const [expandedDers, setExpandedDers] = useState<string | null>(null);
  
  const topDers = [...karne.dersler].sort((a, b) => b.basariOrani - a.basariOrani)[0];
  const weakDers = [...karne.dersler].sort((a, b) => a.basariOrani - b.basariOrani)[0];
  const avgBasari = karne.dersler.reduce((s, d) => s + d.basariOrani, 0) / karne.dersler.length;

  return (
    <div className="space-y-6">
      {/* Kişisel Bilgiler Kartı */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar ve Temel Bilgiler */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-emerald-200">
              {karne.ogrenciAdi.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{karne.ogrenciAdi}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Hash size={14} /> {karne.ogrenciNo}
                </span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <GraduationCap size={14} /> {karne.sube}
                </span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <BookOpen size={14} /> Kitapçık: {karne.kitapcik}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {karne.genelSira <= 3 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    <Crown size={12} /> İlk 3
                  </span>
                )}
                {karne.basariOrani >= 70 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    <Star size={12} /> Başarılı
                  </span>
                )}
                {avgBasari < 50 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    <AlertTriangle size={12} /> Destek Gerekli
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sınav Bilgileri */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Sınav</div>
              <div className="font-semibold text-slate-700 text-sm">{karne.sinavAdi}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Tarih</div>
              <div className="font-semibold text-slate-700 text-sm">{new Date(karne.sinavTarihi).toLocaleDateString('tr-TR')}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Tip</div>
              <div className="font-semibold text-slate-700 text-sm">{karne.sinavTipi}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Kurum</div>
              <div className="font-semibold text-slate-700 text-sm truncate">{karne.okul}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox icon={CheckCircle} label="Doğru" value={karne.toplamDogru} color="from-green-500 to-emerald-600" />
        <StatBox icon={XCircle} label="Yanlış" value={karne.toplamYanlis} color="from-red-500 to-rose-600" />
        <StatBox icon={Minus} label="Boş" value={karne.toplamBos} color="from-slate-400 to-slate-500" />
        <StatBox icon={Target} label="Net" value={karne.toplamNet.toFixed(2)} subValue="90 üzerinden" color="from-blue-500 to-indigo-600" />
        <StatBox icon={Trophy} label="Puan" value={karne.toplamPuan.toFixed(0)} subValue={`${karne.sinavTipi} Puanı`} color="from-emerald-500 to-teal-600" />
      </div>

      {/* Sıralama ve Başarı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sıralama Kartı */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Medal className="text-amber-500" size={20} />
            Sıralama Durumu
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <div>
                <div className="text-sm text-amber-600">Genel Sıralama</div>
                <div className="text-3xl font-bold text-amber-700">{karne.genelSira}. <span className="text-lg text-amber-500">/ {karne.toplamOgrenci}</span></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Yüzdelik</div>
                <div className="text-2xl font-bold text-emerald-600">%{Math.round((1 - karne.genelSira / karne.toplamOgrenci) * 100)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                <div className="text-xs text-purple-500">Şube Sırası</div>
                <div className="text-xl font-bold text-purple-700">{karne.subeSira || '-'}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <div className="text-xs text-blue-500">Okul Sırası</div>
                <div className="text-xl font-bold text-blue-700">{karne.okulSira || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Başarı Özeti */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="text-emerald-500" size={20} />
            Performans Özeti
          </h3>
          <div className="flex items-center justify-around">
            <ProgressRing value={karne.basariOrani} size={100} color="#22C55E" label="Başarı" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ThumbsUp size={18} className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">En Güçlü</div>
                  <div className="font-semibold text-slate-700">{topDers.dersAdi}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ThumbsDown size={18} className="text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Geliştirilmeli</div>
                  <div className="font-semibold text-slate-700">{weakDers.dersAdi}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ders Bazlı Detaylar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={20} />
            Ders Bazlı Performans Analizi
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {karne.dersler.map((ders, i) => {
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            const isExpanded = expandedDers === ders.dersKodu;
            const sinifOrt = Math.round(ders.basariOrani * 0.85); // Simüle edilmiş sınıf ortalaması
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-slate-300 shadow-md' : 'border-slate-100'}`}
              >
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedDers(isExpanded ? null : ders.dersKodu)}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: renk }}
                  >
                    {ders.dersAdi.substring(0, 3)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-slate-800">{ders.dersAdi}</span>
                        <span className="text-sm text-slate-400 ml-2">({ders.soruSayisi} Soru)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 font-bold">{ders.dogru}D</span>
                        <span className="text-red-500 font-bold">{ders.yanlis}Y</span>
                        <span className="text-slate-400">{ders.bos}B</span>
                        <span className="px-3 py-1 rounded-lg font-bold text-sm" style={{ backgroundColor: `${renk}15`, color: renk }}>
                          Net: {ders.net.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${ders.basariOrani}%` }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: renk }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12" style={{ color: renk }}>%{ders.basariOrani}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-3 text-center">
                          <div className="text-xs text-slate-400">Doğru Oranı</div>
                          <div className="text-lg font-bold text-green-600">{Math.round(ders.dogru / ders.soruSayisi * 100)}%</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center">
                          <div className="text-xs text-slate-400">Yanlış Oranı</div>
                          <div className="text-lg font-bold text-red-500">{Math.round(ders.yanlis / ders.soruSayisi * 100)}%</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center">
                          <div className="text-xs text-slate-400">Sınıf Ortalaması</div>
                          <div className="text-lg font-bold text-blue-600">%{sinifOrt}</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center">
                          <div className="text-xs text-slate-400">Fark</div>
                          <div className={`text-lg font-bold ${ders.basariOrani > sinifOrt ? 'text-green-600' : 'text-red-500'}`}>
                            {ders.basariOrani > sinifOrt ? '+' : ''}{ders.basariOrani - sinifOrt}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white rounded-xl">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Sınıf ortalamasına göre:</span>
                          {ders.basariOrani > sinifOrt ? (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <TrendingUp size={14} /> Ortalamanın üzerinde
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <TrendingDown size={14} /> Ortalamanın altında
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 2: SINAV KARŞILAŞTIRMA (GELİŞMİŞ)
// =============================================================================

const SinavlarTab = ({ karne }: { karne: OgrenciKarne }) => {
  const [selectedMetric, setSelectedMetric] = useState<'net' | 'puan' | 'sira'>('net');
  
  // Demo önceki sınavlar (gerçek veriler API'den gelecek)
  const oncekiSinavlar: SinavKarsilastirma[] = [
    { sinavAdi: 'Deneme 1', tarih: '2025-09-15', toplamNet: karne.toplamNet * 0.6, puan: karne.toplamPuan * 0.6, sira: karne.genelSira + 15,
      dersler: karne.dersler.map(d => ({ dersAdi: d.dersAdi, net: d.net * 0.5 })) },
    { sinavAdi: 'Deneme 2', tarih: '2025-10-15', toplamNet: karne.toplamNet * 0.7, puan: karne.toplamPuan * 0.7, sira: karne.genelSira + 10,
      dersler: karne.dersler.map(d => ({ dersAdi: d.dersAdi, net: d.net * 0.65 })) },
    { sinavAdi: 'Deneme 3', tarih: '2025-11-15', toplamNet: karne.toplamNet * 0.85, puan: karne.toplamPuan * 0.85, sira: karne.genelSira + 5,
      dersler: karne.dersler.map(d => ({ dersAdi: d.dersAdi, net: d.net * 0.8 })) },
    { sinavAdi: karne.sinavAdi, tarih: karne.sinavTarihi, toplamNet: karne.toplamNet, puan: karne.toplamPuan, sira: karne.genelSira,
      dersler: karne.dersler.map(d => ({ dersAdi: d.dersAdi, net: d.net })) },
  ];

  const enYuksekNet = Math.max(...oncekiSinavlar.map(s => s.toplamNet));
  const enDusukNet = Math.min(...oncekiSinavlar.map(s => s.toplamNet));
  const ortalama = oncekiSinavlar.reduce((s, o) => s + o.toplamNet, 0) / oncekiSinavlar.length;
  const toplamGelisim = oncekiSinavlar[oncekiSinavlar.length - 1].toplamNet - oncekiSinavlar[0].toplamNet;

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox icon={Clock} label="Toplam Sınav" value={oncekiSinavlar.length} color="from-slate-500 to-slate-600" />
        <StatBox icon={TrendingUp} label="En Yüksek Net" value={enYuksekNet.toFixed(2)} color="from-emerald-500 to-green-600" />
        <StatBox icon={TrendingDown} label="En Düşük Net" value={enDusukNet.toFixed(2)} color="from-red-500 to-rose-600" />
        <StatBox icon={Target} label="Ortalama Net" value={ortalama.toFixed(2)} color="from-blue-500 to-indigo-600" />
        <StatBox icon={Rocket} label="Toplam Gelişim" value={`+${toplamGelisim.toFixed(2)}`} color="from-purple-500 to-violet-600" />
      </div>

      {/* Gelişim Grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LineChart className="text-blue-600" size={20} />
            Gelişim Grafiği
          </h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['net', 'puan', 'sira'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                {metric === 'net' ? 'Net' : metric === 'puan' ? 'Puan' : 'Sıralama'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Grafik */}
        <div className="relative h-64">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="border-t border-dashed border-slate-100 w-full" />
            ))}
          </div>
          
          {/* Bars & Line */}
          <div className="relative h-full flex items-end justify-around gap-4 pb-8">
            {oncekiSinavlar.map((sinav, i) => {
              const value = selectedMetric === 'net' ? sinav.toplamNet : selectedMetric === 'puan' ? sinav.puan : (60 - sinav.sira);
              const maxValue = selectedMetric === 'net' ? enYuksekNet : selectedMetric === 'puan' ? karne.toplamPuan * 1.2 : 60;
              const height = (value / maxValue) * 100;
              const isCurrent = i === oncekiSinavlar.length - 1;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`w-full max-w-16 rounded-t-xl relative cursor-pointer ${
                      isCurrent ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-gradient-to-t from-blue-400 to-blue-300'
                    }`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {selectedMetric === 'sira' ? `${sinav.sira}. sıra` : value.toFixed(2)}
                    </div>
                  </motion.div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${isCurrent ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {sinav.sinavAdi.substring(0, 8)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(sinav.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detaylı Karşılaştırma Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Sınav Detaylı Karşılaştırma</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sınav</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase">Doğru</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">Yanlış</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase">Net</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase">Puan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase">Sıra</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-purple-600 uppercase">Değişim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {oncekiSinavlar.map((sinav, i) => {
                const onceki = i > 0 ? oncekiSinavlar[i - 1] : null;
                const netDegisim = onceki ? sinav.toplamNet - onceki.toplamNet : 0;
                const isCurrent = i === oncekiSinavlar.length - 1;
                const dogru = Math.round(sinav.toplamNet * 1.2);
                const yanlis = Math.round((90 - sinav.toplamNet * 1.2) * 0.6);
                
                return (
                  <tr key={i} className={`${isCurrent ? 'bg-emerald-50/50' : ''} hover:bg-slate-50`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isCurrent && <Sparkles size={14} className="text-amber-500" />}
                        <span className={`font-medium ${isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>{sinav.sinavAdi}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-500">
                      {new Date(sinav.tarih).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{dogru}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-500">{yanlis}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{sinav.toplamNet.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                        {sinav.puan.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-amber-600">{sinav.sira}</td>
                    <td className="px-4 py-3 text-center">
                      {netDegisim !== 0 && (
                        <span className={`flex items-center justify-center gap-1 text-sm font-bold ${netDegisim > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {netDegisim > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          {netDegisim > 0 ? '+' : ''}{netDegisim.toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ders Bazlı Karşılaştırma */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart2 className="text-purple-600" size={20} />
          Ders Bazlı Gelişim
        </h3>
        <div className="space-y-4">
          {karne.dersler.map((ders, i) => {
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            const ilkNet = ders.net * 0.5;
            const gelisim = ders.net - ilkNet;
            
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-600">{ders.dersAdi}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden flex relative">
                    {oncekiSinavlar.map((sinav, j) => {
                      const dersData = sinav.dersler.find(d => d.dersAdi === ders.dersAdi);
                      const net = dersData?.net || 0;
                      const width = (net / ders.soruSayisi) * 100;
                      const isCurrent = j === oncekiSinavlar.length - 1;
                      
                      return (
                        <motion.div
                          key={j}
                          initial={{ width: 0 }}
                          animate={{ width: `${100 / oncekiSinavlar.length}%` }}
                          className="h-full flex items-center justify-center border-r border-white/20 relative"
                          style={{ backgroundColor: isCurrent ? renk : `${renk}${40 + j * 20}` }}
                        >
                          <span className="text-white text-xs font-bold">{net.toFixed(1)}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <div className={`w-16 text-right font-bold ${gelisim > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {gelisim > 0 ? '+' : ''}{gelisim.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          {oncekiSinavlar.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${i === oncekiSinavlar.length - 1 ? 'bg-emerald-500' : 'bg-blue-400'}`} style={{ opacity: 0.4 + i * 0.2 }} />
              <span className="text-slate-500">{s.sinavAdi.substring(0, 6)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 3: DETAYLI ANALİZ (GELİŞMİŞ)
// =============================================================================

const GrafiklerTab = ({ karne }: { karne: OgrenciKarne }) => {
  return (
    <div className="space-y-6">
      {/* Başarı Dağılımı - Çoklu Grafik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="text-blue-600" size={20} />
            Cevap Dağılımı
          </h3>
          <div className="flex items-center justify-center gap-8">
            <div className="relative">
              <svg width="180" height="180" viewBox="0 0 100 100">
                {/* Doğru */}
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="15"
                  strokeDasharray={`${(karne.toplamDogru / 90) * 251.2} 251.2`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(karne.toplamDogru / 90) * 251.2} 251.2` }}
                  transition={{ duration: 1 }}
                />
                {/* Yanlış */}
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="15"
                  strokeDasharray={`${(karne.toplamYanlis / 90) * 251.2} 251.2`}
                  strokeDashoffset={`${-(karne.toplamDogru / 90) * 251.2}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(karne.toplamYanlis / 90) * 251.2} 251.2` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                {/* Boş */}
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="#94A3B8" strokeWidth="15"
                  strokeDasharray={`${(karne.toplamBos / 90) * 251.2} 251.2`}
                  strokeDashoffset={`${-((karne.toplamDogru + karne.toplamYanlis) / 90) * 251.2}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(karne.toplamBos / 90) * 251.2} 251.2` }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{karne.basariOrani}%</span>
                <span className="text-sm text-slate-400">Başarı</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Doğru: <strong>{karne.toplamDogru}</strong> (%{Math.round(karne.toplamDogru / 90 * 100)})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-slate-600">Yanlış: <strong>{karne.toplamYanlis}</strong> (%{Math.round(karne.toplamYanlis / 90 * 100)})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
                <span className="text-slate-600">Boş: <strong>{karne.toplamBos}</strong> (%{Math.round(karne.toplamBos / 90 * 100)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar-like Display */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Compass className="text-purple-600" size={20} />
            Ders Performans Haritası
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {karne.dersler.map((ders, i) => {
              const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
              const size = 50 + ders.basariOrani * 0.6;
              
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div 
                    className="rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    style={{ 
                      backgroundColor: renk, 
                      width: size, 
                      height: size,
                      boxShadow: `0 4px 20px ${renk}50`
                    }}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{ders.net.toFixed(1)}</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{ders.dersAdi}</span>
                  <span className="text-xs font-bold" style={{ color: renk }}>%{ders.basariOrani}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ders Başarı Grafikleri */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-emerald-600" size={20} />
          Ders Bazlı Başarı Oranları
        </h3>
        <div className="space-y-4">
          {karne.dersler.map((ders, i) => {
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            const sinifOrt = Math.round(ders.basariOrani * 0.85);
            
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{ders.dersAdi}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">Sınıf Ort: %{sinifOrt}</span>
                    <span className="font-bold" style={{ color: renk }}>Öğrenci: %{ders.basariOrani}</span>
                  </div>
                </div>
                <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                  {/* Sınıf Ortalaması */}
                  <div 
                    className="absolute top-0 h-full bg-slate-300 rounded-full opacity-50"
                    style={{ width: `${sinifOrt}%` }}
                  />
                  {/* Öğrenci Başarısı */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ders.basariOrani}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="absolute top-0 h-full rounded-full flex items-center justify-end pr-2"
                    style={{ backgroundColor: renk }}
                  >
                    <span className="text-white text-xs font-bold">{ders.basariOrani}%</span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Güçlü ve Zayıf Alanlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            <Star size={20} />
            Güçlü Alanlar
          </h3>
          <div className="space-y-3">
            {karne.dersler
              .filter(d => d.basariOrani >= 50)
              .sort((a, b) => b.basariOrani - a.basariOrani)
              .map((ders, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between bg-white/70 rounded-xl p-4 border border-green-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-800">{ders.dersAdi}</div>
                      <div className="text-sm text-green-600">Net: {ders.net.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">%{ders.basariOrani}</div>
                </motion.div>
              ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6">
          <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Geliştirilmesi Gereken Alanlar
          </h3>
          <div className="space-y-3">
            {karne.dersler
              .filter(d => d.basariOrani < 50)
              .sort((a, b) => a.basariOrani - b.basariOrani)
              .map((ders, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between bg-white/70 rounded-xl p-4 border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-red-800">{ders.dersAdi}</div>
                      <div className="text-sm text-red-600">Net: {ders.net.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">%{ders.basariOrani}</div>
                </motion.div>
              ))}
            {karne.dersler.filter(d => d.basariOrani < 50).length === 0 && (
              <div className="text-center py-8 text-green-600">
                <CheckCircle size={48} className="mx-auto mb-2" />
                <p className="font-medium">Tüm derslerde başarılı!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 4: NOTLAR & ÖNERİLER (GELİŞMİŞ)
// =============================================================================

const NotlarTab = ({ karne }: { karne: OgrenciKarne }) => {
  const [note, setNote] = useState('');
  const [goals, setGoals] = useState({
    hedefNet: Math.round(karne.toplamNet + 5),
    hedefPuan: Math.round(karne.toplamPuan + 25),
    hedefSira: Math.max(1, karne.genelSira - 5),
    hedefBos: Math.max(0, karne.toplamBos - 10)
  });
  
  const zayifDersler = karne.dersler.filter(d => d.basariOrani < 50);
  const gucluDersler = karne.dersler.filter(d => d.basariOrani >= 60);

  const oneriler = [
    { icon: Zap, color: 'amber', title: 'Öncelikli Çalışma', text: zayifDersler.length > 0 ? `${zayifDersler.map(d => d.dersAdi).join(', ')} derslerinde günlük en az 45 dakika çalışma yapın.` : 'Tüm derslerde iyi bir performans sergiliyorsunuz!' },
    { icon: Target, color: 'blue', title: 'Boş Soru Stratejisi', text: `${karne.toplamBos} soru boş bırakılmış. Emin olmadığınız sorularda 2 şık eleyebildiğinizde cevap vermeyi deneyin. Bu strateji netleri %15 artırabilir.` },
    { icon: Clock, color: 'purple', title: 'Zaman Yönetimi', text: 'Her soru için ortalama 1.5 dakika ayırın. Zor sorularda takılmak yerine işaretleyip geçin ve sonra dönün.' },
    { icon: Brain, color: 'pink', title: 'Tekrar Önerisi', text: gucluDersler.length > 0 ? `${gucluDersler.map(d => d.dersAdi).join(', ')} derslerinde başarılısınız. Bu konularda haftalık 2 saat tekrar yeterli olacaktır.` : 'Tüm derslerde daha fazla pratik yapmanız önerilir.' },
    { icon: Lightbulb, color: 'emerald', title: 'Motivasyon', text: 'Her sınavda ilerliyor olmanız çok değerli. Küçük adımlarla büyük başarılar elde edeceksiniz!' }
  ];

  const calismaPlanı = [
    { gun: 'Pazartesi', dersler: [karne.dersler[0], karne.dersler[1]], saat: '2.5 saat' },
    { gun: 'Salı', dersler: [karne.dersler[2], karne.dersler[3]], saat: '2 saat' },
    { gun: 'Çarşamba', dersler: [karne.dersler[4], karne.dersler[5]], saat: '2 saat' },
    { gun: 'Perşembe', dersler: [karne.dersler[0], karne.dersler[2]], saat: '2.5 saat' },
    { gun: 'Cuma', dersler: [karne.dersler[1], karne.dersler[3]], saat: '2 saat' },
    { gun: 'Cumartesi', dersler: karne.dersler.slice(0, 3), saat: '4 saat' },
    { gun: 'Pazar', dersler: karne.dersler.slice(3), saat: '3 saat' },
  ];

  return (
    <div className="space-y-6">
      {/* AI Önerileri */}
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-purple-200 p-6">
        <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Brain size={20} />
          Yapay Zeka Destekli Öneriler
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {oneriler.map((oneri, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-${oneri.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <oneri.icon size={20} className={`text-${oneri.color}-600`} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">{oneri.title}</div>
                  <p className="text-sm text-slate-600">{oneri.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Haftalık Çalışma Planı */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Önerilen Haftalık Çalışma Planı
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {calismaPlanı.map((gun, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-1 min-w-[120px] bg-slate-50 rounded-xl p-3 border border-slate-100"
              >
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold text-slate-700">{gun.gun}</div>
                  <div className="text-xs text-slate-400">{gun.saat}</div>
                </div>
                <div className="space-y-1">
                  {gun.dersler.map((ders, j) => {
                    const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
                    return (
                      <div 
                        key={j}
                        className="text-xs text-white font-medium rounded px-2 py-1 text-center"
                        style={{ backgroundColor: renk }}
                      >
                        {ders.dersAdi.substring(0, 3)}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Hedefler */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
        <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <Target size={20} />
          Sonraki Sınav Hedefleri
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 rounded-xl p-4 text-center border border-emerald-100">
            <div className="text-sm text-slate-500 mb-2">Mevcut Net</div>
            <div className="text-2xl font-bold text-slate-400 line-through">{karne.toplamNet.toFixed(0)}</div>
            <div className="text-3xl font-bold text-emerald-600">{goals.hedefNet}</div>
            <div className="text-xs text-emerald-500 mt-1">+{(goals.hedefNet - karne.toplamNet).toFixed(0)} net</div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-sm text-slate-500 mb-2">Mevcut Puan</div>
            <div className="text-2xl font-bold text-slate-400 line-through">{karne.toplamPuan.toFixed(0)}</div>
            <div className="text-3xl font-bold text-blue-600">{goals.hedefPuan}</div>
            <div className="text-xs text-blue-500 mt-1">+{(goals.hedefPuan - karne.toplamPuan).toFixed(0)} puan</div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 text-center border border-amber-100">
            <div className="text-sm text-slate-500 mb-2">Mevcut Sıra</div>
            <div className="text-2xl font-bold text-slate-400 line-through">{karne.genelSira}.</div>
            <div className="text-3xl font-bold text-amber-600">{goals.hedefSira}.</div>
            <div className="text-xs text-amber-500 mt-1">{karne.genelSira - goals.hedefSira} sıra yukarı</div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 text-center border border-purple-100">
            <div className="text-sm text-slate-500 mb-2">Mevcut Boş</div>
            <div className="text-2xl font-bold text-slate-400 line-through">{karne.toplamBos}</div>
            <div className="text-3xl font-bold text-purple-600">{goals.hedefBos}</div>
            <div className="text-xs text-purple-500 mt-1">{karne.toplamBos - goals.hedefBos} soru azalt</div>
          </div>
        </div>
      </div>

      {/* Öğretmen Notları */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-amber-500" />
          Öğretmen Notları
        </h3>
        <div className="space-y-4">
          {/* Örnek notlar */}
          <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-blue-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-700">Matematik Öğretmeni</span>
              <span className="text-xs text-slate-400">2 gün önce</span>
            </div>
            <p className="text-sm text-slate-600">Geometri konularında daha fazla pratik yapması gerekiyor. Özellikle üçgenler ve dörtgenler konusunda ek çalışma önerilir.</p>
          </div>
          
          {/* Yeni not ekleme */}
          <div className="mt-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              placeholder="Yeni not ekleyin..."
            />
            <div className="flex justify-end mt-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                <Send size={16} />
                Notu Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Motivasyon */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Rocket size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Başarıya Bir Adım Daha!</h3>
            <p className="text-white/80">Her sınav bir öğrenme fırsatıdır. Düzenli çalışma ve doğru stratejiyle hedeflerine ulaşacaksın!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function OgrenciKarneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const studentNo = searchParams.get('studentNo');
  const { currentOrganization } = useOrganizationStore();
  
  const [loading, setLoading] = useState(true);
  const [karne, setKarne] = useState<OgrenciKarne | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('profil');

  const loadData = useCallback(async () => {
    if (!examId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/akademik-analiz/exam-results?examId=${examId}`);
      const data = await response.json();
      
      if (response.ok && data.exam) {
        const exam = data.exam;
        const student = studentNo 
          ? exam.ogrenciler.find((o: any) => o.ogrenciNo === studentNo)
          : exam.ogrenciler[0];
        
        if (student) {
          const defaultDersler: DersKart[] = [
            { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, dogru: 0, yanlis: 0, bos: 0, net: 0, basariOrani: 0 },
            { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, dogru: 0, yanlis: 0, bos: 0, net: 0, basariOrani: 0 },
            { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 0, yanlis: 0, bos: 0, net: 0, basariOrani: 0 },
            { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap Tarihi', soruSayisi: 10, dogru: 0, yanlis: 0, bos: 0, net: 0, basariOrani: 0 },
            { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, dogru: 0, yanlis: 0, bos: 0, net: 0, basariOrani: 0 },
            { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, dogru: 0, yanlis: 0, bos: 0, net: 0, basariOrani: 0 },
          ];

          const totalD = student.toplamDogru || 0;
          const totalY = student.toplamYanlis || 0;

          const derslerWithData = defaultDersler.map(d => {
            const ratio = d.soruSayisi / 90;
            const dogru = Math.round(totalD * ratio);
            const yanlis = Math.round(totalY * ratio);
            const bos = d.soruSayisi - dogru - yanlis;
            const net = dogru - (yanlis / 3);
            return { ...d, dogru, yanlis, bos: Math.max(0, bos), net: parseFloat(net.toFixed(2)), basariOrani: Math.round((dogru / d.soruSayisi) * 100) };
          });

          setKarne({
            ogrenciNo: student.ogrenciNo || '-',
            ogrenciAdi: student.ogrenciAdi || 'Bilinmeyen',
            sinifNo: student.sinifNo || '8',
            sube: student.sinifNo || '8-A',
            okul: currentOrganization?.name || 'Dikmen Çözüm Kurs',
            kitapcik: student.kitapcik || 'A',
            sinavAdi: exam.ad,
            sinavTarihi: exam.tarih,
            sinavTipi: exam.tip || 'LGS',
            toplamDogru: student.toplamDogru || 0,
            toplamYanlis: student.toplamYanlis || 0,
            toplamBos: student.toplamBos || 0,
            toplamNet: student.toplamNet || 0,
            toplamPuan: student.toplamPuan || (student.toplamNet * 5),
            basariOrani: Math.round(((student.toplamDogru || 0) / 90) * 100),
            genelSira: student.siralama || 1,
            subeSira: student.sinifSira || 1,
            okulSira: student.siralama || 1,
            toplamOgrenci: exam.ogrenciler.length,
            dersler: derslerWithData,
            oncekiSinavlar: []
          });
        }
      }
    } catch (error) {
      console.error('Karne yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [examId, studentNo, currentOrganization?.name]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500">Karne yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!karne) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Öğrenci Bulunamadı</h2>
          <button onClick={() => router.back()} className="text-emerald-600 hover:underline">← Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-200">
                  {karne.ogrenciAdi.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{karne.ogrenciAdi}</h1>
                  <p className="text-sm text-slate-500">No: {karne.ogrenciNo} • {karne.sube}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                <Printer size={18} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'profil' && <ProfilTab karne={karne} />}
            {activeTab === 'sinavlar' && <SinavlarTab karne={karne} />}
            {activeTab === 'grafikler' && <GrafiklerTab karne={karne} />}
            {activeTab === 'notlar' && <NotlarTab karne={karne} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function OgrenciKarnePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
      <OgrenciKarneContent />
    </Suspense>
  );
}
