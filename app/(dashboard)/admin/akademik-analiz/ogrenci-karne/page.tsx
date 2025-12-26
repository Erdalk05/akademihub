'use client';

/**
 * Akademik Gelişim Takip Sayfası
 * Tüm Sınavların Karşılaştırması, Ders Bazlı Gelişim, Kazanım Analizi
 */

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Printer, Loader2, User, Calendar, BookOpen, Award,
  TrendingUp, TrendingDown, BarChart3, Target, ChevronDown, ChevronUp,
  StickyNote, GraduationCap, Clock, Star, AlertTriangle, CheckCircle,
  XCircle, Zap, Brain, Lightbulb, Trophy, Flame, Sparkles, Activity,
  PieChart, ArrowUpRight, ArrowDownRight, Minus, Eye, ThumbsUp, ThumbsDown,
  MessageSquare, Send, Medal, Crown, Rocket, Compass, Filter, Search,
  ChevronRight, LayoutGrid, List, RefreshCw, FileText, BookMarked
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

interface Sinav {
  id: string;
  sinavAdi: string;
  tarih: string;
  tip: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  toplamPuan: number;
  sira: number;
  toplamOgrenci: number;
  dersler: DersDetay[];
}

interface OgrenciProfil {
  ogrenciNo: string;
  ogrenciAdi: string;
  sinif: string;
  okul: string;
  sinavlar: Sinav[];
}

type ViewMode = 'genel' | 'dersler' | 'sinavlar' | 'kazanimlar' | 'oneriler';

// =============================================================================
// CONSTANTS
// =============================================================================

const DERS_RENKLERI: Record<string, string> = {
  'TUR': '#3B82F6', 'TURKCE': '#3B82F6',
  'MAT': '#EF4444', 'MATEMATIK': '#EF4444',
  'FEN': '#22C55E', 'FEN_BILIMLERI': '#22C55E',
  'SOS': '#F59E0B', 'SOSYAL_BILGILER': '#F59E0B',
  'ING': '#8B5CF6', 'INGILIZCE': '#8B5CF6',
  'DIN': '#F97316', 'DIN_KULTURU': '#F97316',
  'INKILAP': '#EC4899',
};

const TABS = [
  { id: 'genel' as ViewMode, label: 'Genel Bakış', icon: LayoutGrid },
  { id: 'sinavlar' as ViewMode, label: 'Sınav Karşılaştırma', icon: BarChart3 },
  { id: 'dersler' as ViewMode, label: 'Ders Bazlı Gelişim', icon: BookOpen },
  { id: 'kazanimlar' as ViewMode, label: 'Kazanım Analizi', icon: Target },
  { id: 'oneriler' as ViewMode, label: 'AI Öneriler', icon: Brain },
];

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const ProgressRing = ({ value, size = 80, color = '#22C55E' }: { value: number; size?: number; color?: string }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="#E5E7EB" strokeWidth="6" fill="none" />
        <motion.circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="6" fill="none"
          strokeLinecap="round" initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1 }}
          style={{ strokeDasharray: circumference }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

const TrendIndicator = ({ current, previous }: { current: number; previous: number }) => {
  const diff = current - previous;
  if (diff === 0) return <Minus className="text-slate-400" size={16} />;
  return diff > 0 
    ? <span className="flex items-center text-green-600 text-sm font-bold"><ArrowUpRight size={16} />+{diff.toFixed(2)}</span>
    : <span className="flex items-center text-red-500 text-sm font-bold"><ArrowDownRight size={16} />{diff.toFixed(2)}</span>;
};

// =============================================================================
// TAB 1: GENEL BAKIŞ
// =============================================================================

const GenelBakisTab = ({ profil }: { profil: OgrenciProfil }) => {
  const sinavlar = profil.sinavlar;
  const sonSinav = sinavlar[sinavlar.length - 1];
  const ilkSinav = sinavlar[0];
  
  const toplamGelisim = sonSinav.toplamNet - ilkSinav.toplamNet;
  const ortalamaNet = sinavlar.reduce((s, x) => s + x.toplamNet, 0) / sinavlar.length;
  const enYuksekNet = Math.max(...sinavlar.map(s => s.toplamNet));
  const enDusukNet = Math.min(...sinavlar.map(s => s.toplamNet));

  // Ders bazlı trend hesapla
  const dersGelisim = sonSinav.dersler.map(ders => {
    const ilkDers = ilkSinav.dersler.find(d => d.dersKodu === ders.dersKodu);
    return {
      ...ders,
      gelisim: ilkDers ? ders.net - ilkDers.net : 0,
      ilkNet: ilkDers?.net || 0
    };
  });

  const enCokGelisen = dersGelisim.sort((a, b) => b.gelisim - a.gelisim)[0];
  const enAzGelisen = dersGelisim.sort((a, b) => a.gelisim - b.gelisim)[0];

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-4">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-blue-100 text-sm">Toplam Sınav</div>
          <div className="text-3xl font-bold">{sinavlar.length}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-emerald-100 text-sm">Toplam Gelişim</div>
          <div className="text-3xl font-bold">+{toplamGelisim.toFixed(2)}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl p-4">
          <Target className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-purple-100 text-sm">Ortalama Net</div>
          <div className="text-3xl font-bold">{ortalamaNet.toFixed(2)}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4">
          <Trophy className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-amber-100 text-sm">En Yüksek Net</div>
          <div className="text-3xl font-bold">{enYuksekNet.toFixed(2)}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-4">
          <Award className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-pink-100 text-sm">Son Sıralama</div>
          <div className="text-3xl font-bold">{sonSinav.sira}.</div>
        </motion.div>
      </div>

      {/* Net Gelişim Grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="text-blue-600" size={20} />
          Net Gelişim Grafiği
        </h3>
        <div className="relative h-48">
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="border-t border-dashed border-slate-100 w-full" />)}
          </div>
          <div className="relative h-full flex items-end justify-around gap-2 pb-8">
            {sinavlar.map((sinav, i) => {
              const height = (sinav.toplamNet / enYuksekNet) * 100;
              const isLast = i === sinavlar.length - 1;
              const prev = i > 0 ? sinavlar[i - 1] : null;
              const trend = prev ? sinav.toplamNet - prev.toplamNet : 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`w-full max-w-12 rounded-t-lg relative ${
                      isLast ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' :
                      trend >= 0 ? 'bg-gradient-to-t from-blue-400 to-blue-300' :
                      'bg-gradient-to-t from-red-400 to-red-300'
                    }`}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {sinav.toplamNet.toFixed(2)} Net
                      {trend !== 0 && <span className={trend > 0 ? 'text-green-300' : 'text-red-300'}> ({trend > 0 ? '+' : ''}{trend.toFixed(2)})</span>}
                    </div>
                  </motion.div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${isLast ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {sinav.sinavAdi.length > 8 ? sinav.sinavAdi.substring(0, 8) + '...' : sinav.sinavAdi}
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

      {/* Ders Gelişim Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            En Çok Gelişen Ders
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: DERS_RENKLERI[enCokGelisen.dersKodu] || '#6B7280' }}>
              {enCokGelisen.dersAdi.substring(0, 3)}
            </div>
            <div>
              <div className="text-xl font-bold text-green-800">{enCokGelisen.dersAdi}</div>
              <div className="text-green-600 font-medium">
                {enCokGelisen.ilkNet.toFixed(2)} → {enCokGelisen.net.toFixed(2)} Net
              </div>
              <div className="text-2xl font-bold text-green-600">+{enCokGelisen.gelisim.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6">
          <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            En Az Gelişen Ders
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: DERS_RENKLERI[enAzGelisen.dersKodu] || '#6B7280' }}>
              {enAzGelisen.dersAdi.substring(0, 3)}
            </div>
            <div>
              <div className="text-xl font-bold text-red-800">{enAzGelisen.dersAdi}</div>
              <div className="text-red-600 font-medium">
                {enAzGelisen.ilkNet.toFixed(2)} → {enAzGelisen.net.toFixed(2)} Net
              </div>
              <div className="text-2xl font-bold text-red-600">{enAzGelisen.gelisim.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Son Sınav Özeti */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="text-amber-500" size={20} />
          Son Sınav: {sonSinav.sinavAdi}
        </h3>
        <div className="grid grid-cols-6 gap-4">
          {sonSinav.dersler.map((ders, i) => {
            const ilkDers = ilkSinav.dersler.find(d => d.dersKodu === ders.dersKodu);
            const gelisim = ilkDers ? ders.net - ilkDers.net : 0;
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white font-bold mb-2"
                  style={{ backgroundColor: renk }}>
                  {ders.net.toFixed(1)}
                </div>
                <div className="text-sm font-medium text-slate-700">{ders.dersAdi}</div>
                <div className={`text-xs font-bold ${gelisim >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {gelisim >= 0 ? '+' : ''}{gelisim.toFixed(2)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 2: SINAV KARŞILAŞTIRMA
// =============================================================================

const SinavKarsilastirmaTab = ({ profil }: { profil: OgrenciProfil }) => {
  const [selectedSinavlar, setSelectedSinavlar] = useState<string[]>([]);
  const sinavlar = profil.sinavlar;

  const toggleSinav = (id: string) => {
    setSelectedSinavlar(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const karsilastirma = selectedSinavlar.length >= 2 
    ? sinavlar.filter(s => selectedSinavlar.includes(s.id))
    : sinavlar.slice(-4);

  return (
    <div className="space-y-6">
      {/* Sınav Seçici */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Filter size={18} />
          Karşılaştırılacak Sınavları Seçin
        </h3>
        <div className="flex flex-wrap gap-2">
          {sinavlar.map((sinav) => (
            <button
              key={sinav.id}
              onClick={() => toggleSinav(sinav.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSinavlar.includes(sinav.id) || (selectedSinavlar.length === 0 && sinavlar.slice(-4).includes(sinav))
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sinav.sinavAdi}
            </button>
          ))}
        </div>
      </div>

      {/* Karşılaştırma Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Detaylı Karşılaştırma</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50">Sınav</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase">Doğru</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">Yanlış</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Boş</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase">Net</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase">Puan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase">Sıra</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-purple-600 uppercase">Değişim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {karsilastirma.map((sinav, i) => {
                const prev = i > 0 ? karsilastirma[i - 1] : null;
                const netDegisim = prev ? sinav.toplamNet - prev.toplamNet : 0;
                const isLast = i === karsilastirma.length - 1;
                
                return (
                  <tr key={i} className={`${isLast ? 'bg-emerald-50/50' : ''} hover:bg-slate-50`}>
                    <td className="px-4 py-3 sticky left-0 bg-inherit">
                      <div className="flex items-center gap-2">
                        {isLast && <Sparkles size={14} className="text-amber-500" />}
                        <span className={`font-medium ${isLast ? 'text-emerald-700' : 'text-slate-700'}`}>{sinav.sinavAdi}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-500">
                      {new Date(sinav.tarih).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{sinav.toplamDogru}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-500">{sinav.toplamYanlis}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{sinav.toplamBos}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{sinav.toplamNet.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                        {sinav.toplamPuan.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-amber-600">{sinav.sira}/{sinav.toplamOgrenci}</td>
                    <td className="px-4 py-3 text-center">
                      {prev && <TrendIndicator current={sinav.toplamNet} previous={prev.toplamNet} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ders Bazlı Karşılaştırma Grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Ders Bazlı Net Karşılaştırması</h3>
        <div className="space-y-4">
          {karsilastirma[0]?.dersler.map((ders, di) => {
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            
            return (
              <div key={di} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{ders.dersAdi}</span>
                </div>
                <div className="flex items-center gap-2 h-8">
                  {karsilastirma.map((sinav, si) => {
                    const sinavDers = sinav.dersler.find(d => d.dersKodu === ders.dersKodu);
                    const net = sinavDers?.net || 0;
                    const maxNet = ders.soruSayisi;
                    const width = (net / maxNet) * 100;
                    
                    return (
                      <div key={si} className="flex-1 relative">
                        <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${width}%` }}
                            transition={{ delay: si * 0.1 + di * 0.05 }}
                            className="h-full flex items-center justify-end pr-2 rounded-lg"
                            style={{ backgroundColor: renk, opacity: 0.5 + si * 0.15 }}
                          >
                            <span className="text-white text-xs font-bold">{net.toFixed(1)}</span>
                          </motion.div>
                        </div>
                        <div className="text-xs text-slate-400 text-center mt-1">
                          {sinav.sinavAdi.substring(0, 6)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 3: DERS BAZLI GELİŞİM
// =============================================================================

const DersBazliGelisimTab = ({ profil }: { profil: OgrenciProfil }) => {
  const [selectedDers, setSelectedDers] = useState<string | null>(null);
  const sinavlar = profil.sinavlar;
  const dersler = sinavlar[0].dersler;

  // Her ders için tüm sınavlardaki verileri topla
  const dersVerileri = dersler.map(ders => {
    const sinavVerileri = sinavlar.map(sinav => {
      const sinavDers = sinav.dersler.find(d => d.dersKodu === ders.dersKodu);
      return {
        sinavAdi: sinav.sinavAdi,
        tarih: sinav.tarih,
        ...sinavDers
      };
    });
    
    const ilk = sinavVerileri[0];
    const son = sinavVerileri[sinavVerileri.length - 1];
    const gelisim = (son?.net || 0) - (ilk?.net || 0);
    const ortalama = sinavVerileri.reduce((s, x) => s + (x?.net || 0), 0) / sinavVerileri.length;
    const enYuksek = Math.max(...sinavVerileri.map(x => x?.net || 0));
    
    return {
      ...ders,
      sinavVerileri,
      gelisim,
      ortalama,
      enYuksek,
      ilkNet: ilk?.net || 0,
      sonNet: son?.net || 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Ders Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {dersVerileri.map((ders, i) => {
          const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
          const isSelected = selectedDers === ders.dersKodu;
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedDers(isSelected ? null : ders.dersKodu)}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
                isSelected ? 'border-emerald-500 shadow-lg' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white font-bold mb-3"
                style={{ backgroundColor: renk }}>
                {ders.dersAdi.substring(0, 3)}
              </div>
              <div className="text-center">
                <div className="font-semibold text-slate-800 text-sm">{ders.dersAdi}</div>
                <div className="text-lg font-bold" style={{ color: renk }}>{ders.sonNet.toFixed(2)}</div>
                <div className={`text-xs font-bold ${ders.gelisim >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {ders.gelisim >= 0 ? '↑' : '↓'} {Math.abs(ders.gelisim).toFixed(2)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Seçili Ders Detayı */}
      {selectedDers && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          {(() => {
            const ders = dersVerileri.find(d => d.dersKodu === selectedDers)!;
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            
            return (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: renk }}>
                    {ders.dersAdi.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{ders.dersAdi}</h3>
                    <p className="text-slate-500">{sinavlar.length} sınavda analiz</p>
                  </div>
                  <div className="ml-auto grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-sm text-slate-500">Ortalama</div>
                      <div className="text-xl font-bold" style={{ color: renk }}>{ders.ortalama.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-sm text-slate-500">En Yüksek</div>
                      <div className="text-xl font-bold text-emerald-600">{ders.enYuksek.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-sm text-slate-500">Gelişim</div>
                      <div className={`text-xl font-bold ${ders.gelisim >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {ders.gelisim >= 0 ? '+' : ''}{ders.gelisim.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gelişim Grafiği */}
                <div className="relative h-48 mb-6">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3].map(i => <div key={i} className="border-t border-dashed border-slate-100 w-full" />)}
                  </div>
                  <div className="relative h-full flex items-end justify-around gap-2 pb-8">
                    {ders.sinavVerileri.map((sv: any, i: number) => {
                      const height = (sv.net / ders.soruSayisi) * 100;
                      const prev = i > 0 ? ders.sinavVerileri[i - 1] : null;
                      const trend = prev ? sv.net - prev.net : 0;
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group">
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.1 }}
                            className="w-full max-w-10 rounded-t-lg"
                            style={{ backgroundColor: renk, opacity: 0.5 + i * (0.5 / ders.sinavVerileri.length) }}
                          />
                          <div className="mt-2 text-center">
                            <div className="text-sm font-bold" style={{ color: renk }}>{sv.net?.toFixed(1)}</div>
                            <div className="text-xs text-slate-400">{sv.sinavAdi.substring(0, 6)}</div>
                            {trend !== 0 && (
                              <div className={`text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detay Tablosu */}
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Sınav</th>
                      <th className="px-3 py-2 text-center text-green-600">Doğru</th>
                      <th className="px-3 py-2 text-center text-red-600">Yanlış</th>
                      <th className="px-3 py-2 text-center">Boş</th>
                      <th className="px-3 py-2 text-center text-blue-600">Net</th>
                      <th className="px-3 py-2 text-center">Değişim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ders.sinavVerileri.map((sv: any, i: number) => {
                      const prev = i > 0 ? ders.sinavVerileri[i - 1] : null;
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium">{sv.sinavAdi}</td>
                          <td className="px-3 py-2 text-center text-green-600 font-bold">{sv.dogru}</td>
                          <td className="px-3 py-2 text-center text-red-500 font-bold">{sv.yanlis}</td>
                          <td className="px-3 py-2 text-center text-slate-500">{sv.bos}</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: renk }}>{sv.net?.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            {prev && <TrendIndicator current={sv.net || 0} previous={prev.net || 0} />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Tüm Dersler Karşılaştırma */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Tüm Dersler - Gelişim Karşılaştırması</h3>
        <div className="space-y-3">
          {dersVerileri.sort((a, b) => b.gelisim - a.gelisim).map((ders, i) => {
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-600">{ders.dersAdi}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.abs(ders.gelisim) * 10}%` }}
                    className={`h-full rounded-lg ${ders.gelisim >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ maxWidth: '100%' }}
                  />
                </div>
                <div className={`w-20 text-right font-bold ${ders.gelisim >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {ders.gelisim >= 0 ? '+' : ''}{ders.gelisim.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 4: KAZANIM ANALİZİ
// =============================================================================

const KazanimAnaliziTab = ({ profil }: { profil: OgrenciProfil }) => {
  const sinavlar = profil.sinavlar;
  const sonSinav = sinavlar[sinavlar.length - 1];

  // Demo kazanım verileri
  const kazanimlar = sonSinav.dersler.flatMap(ders => {
    const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
    return [
      { kod: `${ders.dersKodu}.K1`, metin: 'Temel kavramları anlama', ders: ders.dersAdi, dersKodu: ders.dersKodu, basari: Math.round(ders.basariOrani * 1.1), renk },
      { kod: `${ders.dersKodu}.K2`, metin: 'Problem çözme becerileri', ders: ders.dersAdi, dersKodu: ders.dersKodu, basari: Math.round(ders.basariOrani * 0.9), renk },
      { kod: `${ders.dersKodu}.K3`, metin: 'Analiz ve yorumlama', ders: ders.dersAdi, dersKodu: ders.dersKodu, basari: Math.round(ders.basariOrani * 0.85), renk },
    ];
  });

  const gucluKazanimlar = kazanimlar.filter(k => k.basari >= 70).sort((a, b) => b.basari - a.basari);
  const zayifKazanimlar = kazanimlar.filter(k => k.basari < 50).sort((a, b) => a.basari - b.basari);

  return (
    <div className="space-y-6">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-5">
          <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-green-100">Güçlü Kazanımlar</div>
          <div className="text-3xl font-bold">{gucluKazanimlar.length}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-5">
          <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-amber-100">Orta Düzey</div>
          <div className="text-3xl font-bold">{kazanimlar.filter(k => k.basari >= 50 && k.basari < 70).length}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-5">
          <XCircle className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-red-100">Geliştirilmeli</div>
          <div className="text-3xl font-bold">{zayifKazanimlar.length}</div>
        </div>
      </div>

      {/* Güçlü Kazanımlar */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
        <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
          <Star size={20} />
          Güçlü Kazanımlar (İlk 6)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gucluKazanimlar.slice(0, 6).map((kaz, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/70 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: kaz.renk }}>
                {kaz.basari}%
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">{kaz.kod} • {kaz.ders}</div>
                <div className="font-medium text-green-800">{kaz.metin}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zayıf Kazanımlar */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6">
        <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          Geliştirilmesi Gereken Kazanımlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {zayifKazanimlar.slice(0, 6).map((kaz, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/70 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold bg-red-400">
                {kaz.basari}%
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">{kaz.kod} • {kaz.ders}</div>
                <div className="font-medium text-red-800">{kaz.metin}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TAB 5: AI ÖNERİLER
// =============================================================================

const AIOnerilerTab = ({ profil }: { profil: OgrenciProfil }) => {
  const sinavlar = profil.sinavlar;
  const sonSinav = sinavlar[sinavlar.length - 1];
  
  const zayifDersler = sonSinav.dersler.filter(d => d.basariOrani < 50);
  const gucluDersler = sonSinav.dersler.filter(d => d.basariOrani >= 60);
  const toplamGelisim = sonSinav.toplamNet - sinavlar[0].toplamNet;

  return (
    <div className="space-y-6">
      {/* AI Durum Analizi */}
      <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Brain size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Yapay Zeka Analiz Raporu</h3>
            <p className="text-white/80">{sinavlar.length} sınav verisi analiz edildi</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-white/70 text-sm">Genel Değerlendirme</div>
            <div className="text-xl font-bold">
              {toplamGelisim > 5 ? 'Çok İyi' : toplamGelisim > 0 ? 'İyi' : 'Gelişmeli'}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-white/70 text-sm">Trend</div>
            <div className="text-xl font-bold flex items-center gap-2">
              {toplamGelisim > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {toplamGelisim > 0 ? 'Yükseliş' : 'Düşüş'}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-white/70 text-sm">Potansiyel</div>
            <div className="text-xl font-bold">Yüksek</div>
          </div>
        </div>
      </div>

      {/* Kişiselleştirilmiş Öneriler */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lightbulb className="text-amber-500" size={20} />
          Kişiselleştirilmiş Öneriler
        </h3>
        <div className="space-y-4">
          {zayifDersler.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border-l-4 border-red-400">
              <div className="flex items-start gap-3">
                <Zap className="text-red-500 mt-1" size={20} />
                <div>
                  <div className="font-semibold text-red-800">Öncelikli Çalışma Alanları</div>
                  <p className="text-sm text-red-600 mt-1">
                    {zayifDersler.map(d => d.dersAdi).join(', ')} derslerinde başarı oranınız %50'nin altında. 
                    Bu derslere günlük en az 1 saat ayırmanız önerilir.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
            <div className="flex items-start gap-3">
              <Target className="text-blue-500 mt-1" size={20} />
              <div>
                <div className="font-semibold text-blue-800">Boş Soru Stratejisi</div>
                <p className="text-sm text-blue-600 mt-1">
                  Son sınavda {sonSinav.toplamBos} soru boş bıraktınız. 
                  Emin olmadığınız sorularda bile 2 şık eleyebildiğinizde cevap vermeniz, net artışı sağlayabilir.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <Clock className="text-amber-500 mt-1" size={20} />
              <div>
                <div className="font-semibold text-amber-800">Zaman Yönetimi</div>
                <p className="text-sm text-amber-600 mt-1">
                  LGS'de soru başına ortalama 1.5 dakika süreniz var. 
                  Zor sorularda takılmak yerine işaretleyip geçin ve sonra dönün.
                </p>
              </div>
            </div>
          </div>

          {gucluDersler.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-400">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1" size={20} />
                <div>
                  <div className="font-semibold text-green-800">Güçlü Yönleriniz</div>
                  <p className="text-sm text-green-600 mt-1">
                    {gucluDersler.map(d => d.dersAdi).join(', ')} derslerinde başarılısınız! 
                    Bu başarıyı korumak için haftalık tekrar yapın.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hedefler */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
        <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <Rocket size={20} />
          Sonraki Sınav Hedefleri
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Net</div>
            <div className="text-3xl font-bold text-emerald-600">{Math.round(sonSinav.toplamNet + 5)}</div>
            <div className="text-xs text-emerald-500">+5 net artış</div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Puan</div>
            <div className="text-3xl font-bold text-blue-600">{Math.round(sonSinav.toplamPuan + 25)}</div>
            <div className="text-xs text-blue-500">+25 puan</div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Sıra</div>
            <div className="text-3xl font-bold text-amber-600">{Math.max(1, sonSinav.sira - 5)}.</div>
            <div className="text-xs text-amber-500">5 sıra yukarı</div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Boş</div>
            <div className="text-3xl font-bold text-purple-600">{Math.max(0, sonSinav.toplamBos - 10)}</div>
            <div className="text-xs text-purple-500">-10 boş azalt</div>
          </div>
        </div>
      </div>

      {/* Motivasyon */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white text-center">
        <Sparkles size={40} className="mx-auto mb-3 opacity-80" />
        <h3 className="text-2xl font-bold mb-2">Başarıya Bir Adım Daha!</h3>
        <p className="text-white/80 max-w-lg mx-auto">
          {sinavlar.length} sınavda {toplamGelisim > 0 ? `+${toplamGelisim.toFixed(2)} net gelişim gösterdiniz` : 'deneyim kazandınız'}. 
          Düzenli çalışma ile hedeflerinize ulaşacaksınız!
        </p>
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
  const [profil, setProfil] = useState<OgrenciProfil | null>(null);
  const [activeTab, setActiveTab] = useState<ViewMode>('genel');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Demo data - gerçek implementasyonda tüm sınavlar API'den gelecek
      const demoSinavlar: Sinav[] = [
        { id: '1', sinavAdi: 'Deneme 1', tarih: '2025-09-15', tip: 'LGS', toplamDogru: 25, toplamYanlis: 40, toplamBos: 25, toplamNet: 11.67, toplamPuan: 58, sira: 45, toplamOgrenci: 73, dersler: [
          { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, dogru: 8, yanlis: 8, bos: 4, net: 5.33, basariOrani: 40 },
          { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, dogru: 4, yanlis: 10, bos: 6, net: 0.67, basariOrani: 20 },
          { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 5, yanlis: 8, bos: 7, net: 2.33, basariOrani: 25 },
          { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap', soruSayisi: 10, dogru: 3, yanlis: 5, bos: 2, net: 1.33, basariOrani: 30 },
          { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, dogru: 3, yanlis: 4, bos: 3, net: 1.67, basariOrani: 30 },
          { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
        ]},
        { id: '2', sinavAdi: 'Deneme 2', tarih: '2025-10-15', tip: 'LGS', toplamDogru: 30, toplamYanlis: 35, toplamBos: 25, toplamNet: 18.33, toplamPuan: 92, sira: 35, toplamOgrenci: 73, dersler: [
          { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, dogru: 10, yanlis: 6, bos: 4, net: 8.00, basariOrani: 50 },
          { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, dogru: 6, yanlis: 8, bos: 6, net: 3.33, basariOrani: 30 },
          { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 6, yanlis: 7, bos: 7, net: 3.67, basariOrani: 30 },
          { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap', soruSayisi: 10, dogru: 4, yanlis: 4, bos: 2, net: 2.67, basariOrani: 40 },
          { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
          { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
        ]},
        { id: '3', sinavAdi: 'Deneme 3', tarih: '2025-11-15', tip: 'LGS', toplamDogru: 35, toplamYanlis: 30, toplamBos: 25, toplamNet: 25.00, toplamPuan: 125, sira: 20, toplamOgrenci: 73, dersler: [
          { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, dogru: 12, yanlis: 4, bos: 4, net: 10.67, basariOrani: 60 },
          { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, dogru: 8, yanlis: 6, bos: 6, net: 6.00, basariOrani: 40 },
          { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 7, yanlis: 6, bos: 7, net: 5.00, basariOrani: 35 },
          { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap', soruSayisi: 10, dogru: 4, yanlis: 4, bos: 2, net: 2.67, basariOrani: 40 },
          { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
          { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
        ]},
        { id: '4', sinavAdi: 'Deneme 4', tarih: '2025-12-01', tip: 'LGS', toplamDogru: 40, toplamYanlis: 28, toplamBos: 22, toplamNet: 30.67, toplamPuan: 153, sira: 10, toplamOgrenci: 73, dersler: [
          { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, dogru: 14, yanlis: 3, bos: 3, net: 13.00, basariOrani: 70 },
          { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, dogru: 10, yanlis: 5, bos: 5, net: 8.33, basariOrani: 50 },
          { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 8, yanlis: 5, bos: 7, net: 6.33, basariOrani: 40 },
          { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap', soruSayisi: 10, dogru: 4, yanlis: 5, bos: 1, net: 2.33, basariOrani: 40 },
          { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
          { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, dogru: 2, yanlis: 5, bos: 3, net: 0.33, basariOrani: 20 },
        ]},
        { id: '5', sinavAdi: 'DENEME', tarih: '2025-12-26', tip: 'LGS', toplamDogru: 21, toplamYanlis: 34, toplamBos: 35, toplamNet: 9.67, toplamPuan: 48, sira: 1, toplamOgrenci: 73, dersler: [
          { dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, dogru: 5, yanlis: 8, bos: 7, net: 2.33, basariOrani: 25 },
          { dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, dogru: 4, yanlis: 7, bos: 9, net: 1.67, basariOrani: 20 },
          { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, dogru: 5, yanlis: 6, bos: 9, net: 3.00, basariOrani: 25 },
          { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap', soruSayisi: 10, dogru: 3, yanlis: 5, bos: 2, net: 1.33, basariOrani: 30 },
          { dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, dogru: 2, yanlis: 4, bos: 4, net: 0.67, basariOrani: 20 },
          { dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, dogru: 2, yanlis: 4, bos: 4, net: 0.67, basariOrani: 20 },
        ]},
      ];

      setProfil({
        ogrenciNo: studentNo || '00243',
        ogrenciAdi: 'Beşorak Berrak',
        sinif: '8B',
        okul: currentOrganization?.name || 'Dikmen Çözüm Kurs',
        sinavlar: demoSinavlar
      });
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [studentNo, currentOrganization?.name]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500">Akademik profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!profil) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
                  {profil.ogrenciAdi.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{profil.ogrenciAdi}</h1>
                  <p className="text-sm text-slate-500">No: {profil.ogrenciNo} • {profil.sinif} • {profil.sinavlar.length} Sınav</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadData} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                <RefreshCw size={18} className="text-slate-600" />
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">
                <Printer size={18} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                }`}>
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'genel' && <GenelBakisTab profil={profil} />}
            {activeTab === 'sinavlar' && <SinavKarsilastirmaTab profil={profil} />}
            {activeTab === 'dersler' && <DersBazliGelisimTab profil={profil} />}
            {activeTab === 'kazanimlar' && <KazanimAnaliziTab profil={profil} />}
            {activeTab === 'oneriler' && <AIOnerilerTab profil={profil} />}
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
