'use client';

/**
 * Akademik Analiz - Detaylı Öğrenci Karnesi
 * 4 Sekmeli Modern Tasarım
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
  Wallet,
  ShoppingCart,
  StickyNote,
  GraduationCap,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Lightbulb
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

// =============================================================================
// TAB TYPES
// =============================================================================

type TabId = 'profil' | 'sinavlar' | 'grafikler' | 'notlar';

interface Tab {
  id: TabId;
  label: string;
  icon: any;
}

const TABS: Tab[] = [
  { id: 'profil', label: 'Öğrenci Profili', icon: User },
  { id: 'sinavlar', label: 'Sınav Karşılaştırma', icon: BarChart3 },
  { id: 'grafikler', label: 'Grafikler', icon: TrendingUp },
  { id: 'notlar', label: 'Notlar & Öneriler', icon: StickyNote },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const DERS_RENKLERI: Record<string, string> = {
  'TUR': '#3B82F6',
  'TURKCE': '#3B82F6',
  'MAT': '#EF4444',
  'MATEMATIK': '#EF4444',
  'FEN': '#22C55E',
  'FEN_BILIMLERI': '#22C55E',
  'SOS': '#F59E0B',
  'SOSYAL_BILGILER': '#F59E0B',
  'ING': '#8B5CF6',
  'INGILIZCE': '#8B5CF6',
  'DIN': '#F97316',
  'DIN_KULTURU': '#F97316',
  'INKILAP': '#EC4899',
};

// =============================================================================
// TAB CONTENTS
// =============================================================================

// Tab 1: Öğrenci Profili
const ProfilTab = ({ karne }: { karne: OgrenciKarne }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-4">
          <div className="text-green-100 text-sm">Doğru</div>
          <div className="text-3xl font-bold">{karne.toplamDogru}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-4">
          <div className="text-red-100 text-sm">Yanlış</div>
          <div className="text-3xl font-bold">{karne.toplamYanlis}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-400 to-slate-500 text-white rounded-2xl p-4">
          <div className="text-slate-100 text-sm">Boş</div>
          <div className="text-3xl font-bold">{karne.toplamBos}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4">
          <div className="text-blue-100 text-sm">Toplam Net</div>
          <div className="text-3xl font-bold">{karne.toplamNet.toFixed(2)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-4">
          <div className="text-emerald-100 text-sm">{karne.sinavTipi} Puanı</div>
          <div className="text-3xl font-bold">{karne.toplamPuan.toFixed(0)}</div>
        </motion.div>
      </div>

      {/* Sıralama */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-sm text-slate-500 mb-1">Genel Sıra</div>
          <div className="text-2xl font-bold text-amber-600">{karne.genelSira}<span className="text-base text-slate-400">/{karne.toplamOgrenci}</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-sm text-slate-500 mb-1">Şube Sırası</div>
          <div className="text-2xl font-bold text-purple-600">{karne.subeSira || '-'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-sm text-slate-500 mb-1">Okul Sırası</div>
          <div className="text-2xl font-bold text-blue-600">{karne.okulSira || '-'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="text-sm text-slate-500 mb-1">Başarı Oranı</div>
          <div className="text-2xl font-bold text-emerald-600">{karne.basariOrani}%</div>
        </div>
      </div>

      {/* Ders Bazlı Sonuçlar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Ders Bazlı Sonuçlar
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {karne.dersler.map((ders, i) => {
              const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: renk }}
                  >
                    {ders.dersAdi.substring(0, 3)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-700">{ders.dersAdi}</span>
                      <span className="text-sm text-slate-500">{ders.soruSayisi} Soru</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${ders.basariOrani}%`, backgroundColor: renk }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600 font-bold">{ders.dogru}D</span>
                    <span className="text-red-500 font-bold">{ders.yanlis}Y</span>
                    <span className="text-slate-400">{ders.bos}B</span>
                    <span className="px-2 py-1 rounded-lg font-bold" style={{ backgroundColor: `${renk}20`, color: renk }}>
                      {ders.net.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab 2: Sınav Karşılaştırma
const SinavlarTab = ({ karne }: { karne: OgrenciKarne }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  };

  // Demo önceki sınavlar
  const oncekiSinavlar: SinavKarsilastirma[] = karne.oncekiSinavlar.length > 0 ? karne.oncekiSinavlar : [
    { sinavAdi: 'Deneme 1', tarih: '2025-10-15', toplamNet: karne.toplamNet - 8, puan: (karne.toplamNet - 8) * 5, sira: karne.genelSira + 5, dersler: [] },
    { sinavAdi: 'Deneme 2', tarih: '2025-11-10', toplamNet: karne.toplamNet - 4, puan: (karne.toplamNet - 4) * 5, sira: karne.genelSira + 2, dersler: [] },
    { sinavAdi: 'Deneme 3', tarih: '2025-12-01', toplamNet: karne.toplamNet - 2, puan: (karne.toplamNet - 2) * 5, sira: karne.genelSira + 1, dersler: [] },
    { sinavAdi: karne.sinavAdi + ' (Bu Sınav)', tarih: karne.sinavTarihi, toplamNet: karne.toplamNet, puan: karne.toplamPuan, sira: karne.genelSira, dersler: [] },
  ];

  const enYuksekNet = Math.max(...oncekiSinavlar.map(s => s.toplamNet));
  const enDusukNet = Math.min(...oncekiSinavlar.map(s => s.toplamNet));
  const ortalama = oncekiSinavlar.reduce((s, o) => s + o.toplamNet, 0) / oncekiSinavlar.length;

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Clock size={14} />
            Toplam Sınav
          </div>
          <div className="text-2xl font-bold text-slate-700">{oncekiSinavlar.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 mb-1">
            <TrendingUp size={14} />
            En Yüksek Net
          </div>
          <div className="text-2xl font-bold text-emerald-600">{enYuksekNet.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-red-200 p-4">
          <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
            <TrendingDown size={14} />
            En Düşük Net
          </div>
          <div className="text-2xl font-bold text-red-600">{enDusukNet.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
            <Target size={14} />
            Ortalama
          </div>
          <div className="text-2xl font-bold text-blue-600">{ortalama.toFixed(2)}</div>
        </div>
      </div>

      {/* Sınav Listesi */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Sınav Geçmişi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sınav</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase">Net</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase">Puan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase">Sıra</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Değişim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {oncekiSinavlar.map((sinav, i) => {
                const onceki = i > 0 ? oncekiSinavlar[i - 1] : null;
                const netDegisim = onceki ? sinav.toplamNet - onceki.toplamNet : 0;
                const isCurrent = i === oncekiSinavlar.length - 1;
                
                return (
                  <tr key={i} className={`${isCurrent ? 'bg-emerald-50' : ''} hover:bg-slate-50`}>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {sinav.sinavAdi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-500">
                      {formatDate(sinav.tarih)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">
                      {sinav.toplamNet.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                        {sinav.puan.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-600">
                      {sinav.sira}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {netDegisim !== 0 && (
                        <span className={`flex items-center justify-center gap-1 text-sm font-medium ${netDegisim > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {netDegisim > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
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

      {/* Gelişim Trend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Net Gelişim Trendi</h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {oncekiSinavlar.map((sinav, i) => {
            const height = (sinav.toplamNet / enYuksekNet) * 100;
            const isCurrent = i === oncekiSinavlar.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`w-full rounded-t-lg ${isCurrent ? 'bg-emerald-500' : 'bg-blue-400'}`}
                />
                <div className="text-xs text-slate-500 text-center">
                  {sinav.sinavAdi.substring(0, 8)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Tab 3: Grafikler
const GrafiklerTab = ({ karne }: { karne: OgrenciKarne }) => {
  return (
    <div className="space-y-6">
      {/* Ders Başarı Grafiği */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Ders Bazlı Başarı Oranları
        </h3>
        <div className="space-y-4">
          {karne.dersler.map((ders, i) => {
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-600">{ders.dersAdi}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ders.basariOrani}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: renk }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">
                    %{ders.basariOrani}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Doğru/Yanlış/Boş Dağılımı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Cevap Dağılımı</h3>
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Doğru */}
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="#22C55E" strokeWidth="20"
                strokeDasharray={`${(karne.toplamDogru / 90) * 251.2} 251.2`}
                strokeLinecap="round"
              />
              {/* Yanlış */}
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="#EF4444" strokeWidth="20"
                strokeDasharray={`${(karne.toplamYanlis / 90) * 251.2} 251.2`}
                strokeDashoffset={`${-(karne.toplamDogru / 90) * 251.2}`}
                strokeLinecap="round"
              />
              {/* Boş */}
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="#94A3B8" strokeWidth="20"
                strokeDasharray={`${(karne.toplamBos / 90) * 251.2} 251.2`}
                strokeDashoffset={`${-((karne.toplamDogru + karne.toplamYanlis) / 90) * 251.2}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{karne.basariOrani}%</div>
                <div className="text-sm text-slate-500">Başarı</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Doğru ({karne.toplamDogru})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Yanlış ({karne.toplamYanlis})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              <span className="text-sm text-slate-600">Boş ({karne.toplamBos})</span>
            </div>
          </div>
        </div>

        {/* Ders Karşılaştırma Radar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Ders Net Dağılımı</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {karne.dersler.map((ders, i) => {
              const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
              const size = 60 + (ders.net * 4);
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div 
                    className="rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ 
                      backgroundColor: renk, 
                      width: size, 
                      height: size,
                      boxShadow: `0 4px 20px ${renk}40`
                    }}
                  >
                    {ders.net.toFixed(1)}
                  </div>
                  <span className="text-xs text-slate-500">{ders.dersAdi.substring(0, 3)}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Güçlü ve Zayıf Alanlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Güçlü Alanlar
          </h3>
          <div className="space-y-2">
            {karne.dersler
              .filter(d => d.basariOrani >= 60)
              .sort((a, b) => b.basariOrani - a.basariOrani)
              .slice(0, 3)
              .map((ders, i) => (
                <div key={i} className="flex items-center justify-between bg-white/50 rounded-xl p-3">
                  <span className="font-medium text-green-700">{ders.dersAdi}</span>
                  <span className="text-green-600 font-bold">%{ders.basariOrani}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6">
          <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Geliştirilmesi Gereken Alanlar
          </h3>
          <div className="space-y-2">
            {karne.dersler
              .filter(d => d.basariOrani < 60)
              .sort((a, b) => a.basariOrani - b.basariOrani)
              .slice(0, 3)
              .map((ders, i) => (
                <div key={i} className="flex items-center justify-between bg-white/50 rounded-xl p-3">
                  <span className="font-medium text-red-700">{ders.dersAdi}</span>
                  <span className="text-red-600 font-bold">%{ders.basariOrani}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab 4: Notlar & Öneriler
const NotlarTab = ({ karne }: { karne: OgrenciKarne }) => {
  const zayifDersler = karne.dersler.filter(d => d.basariOrani < 50);
  const gucluDersler = karne.dersler.filter(d => d.basariOrani >= 70);

  return (
    <div className="space-y-6">
      {/* AI Önerileri */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
        <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Kişiselleştirilmiş Öneriler
        </h3>
        <div className="space-y-3">
          {zayifDersler.length > 0 && (
            <div className="bg-white/70 rounded-xl p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <div className="font-medium text-slate-800">Öncelikli Çalışma Alanları</div>
                <p className="text-sm text-slate-600 mt-1">
                  {zayifDersler.map(d => d.dersAdi).join(', ')} derslerinde ek çalışma yapmanız önerilir. 
                  Bu alanlarda günlük en az 30 dakika pratik yapın.
                </p>
              </div>
            </div>
          )}
          <div className="bg-white/70 rounded-xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-medium text-slate-800">Boş Bırakma Stratejisi</div>
              <p className="text-sm text-slate-600 mt-1">
                {karne.toplamBos} soru boş bırakılmış. Emin olmadığınız sorularda eleme yöntemiyle 
                en az 2 şıkkı eleyebiliyorsanız cevap vermeyi deneyin.
              </p>
            </div>
          </div>
          {gucluDersler.length > 0 && (
            <div className="bg-white/70 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium text-slate-800">Güçlü Yönleriniz</div>
                <p className="text-sm text-slate-600 mt-1">
                  {gucluDersler.map(d => d.dersAdi).join(', ')} derslerinde başarılısınız! 
                  Bu başarıyı korumak için düzenli tekrar yapın.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Haftalık Çalışma Planı Önerisi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Önerilen Haftalık Çalışma Planı
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((gun, i) => {
            const ders = karne.dersler[i % karne.dersler.length];
            const renk = DERS_RENKLERI[ders.dersKodu] || '#6B7280';
            return (
              <div key={i} className="text-center">
                <div className="text-xs text-slate-500 mb-2">{gun}</div>
                <div 
                  className="h-16 rounded-xl flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: renk }}
                >
                  {ders.dersAdi.substring(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Öğretmen Notları */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" />
          Öğretmen Notları
        </h3>
        <textarea
          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
          placeholder="Öğrenci hakkında notlarınızı buraya yazabilirsiniz..."
        />
        <div className="flex justify-end mt-3">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            Notu Kaydet
          </button>
        </div>
      </div>

      {/* Hedefler */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
        <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Sonraki Sınav Hedefleri
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Net</div>
            <div className="text-2xl font-bold text-emerald-600">{(karne.toplamNet + 5).toFixed(0)}</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Puan</div>
            <div className="text-2xl font-bold text-blue-600">{((karne.toplamNet + 5) * 5).toFixed(0)}</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Hedef Sıra</div>
            <div className="text-2xl font-bold text-amber-600">{Math.max(1, karne.genelSira - 3)}</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-sm text-slate-500">Boş Hedef</div>
            <div className="text-2xl font-bold text-purple-600">{Math.max(0, karne.toplamBos - 5)}</div>
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

  // Data Loading
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
          const totalSoru = 90;

          const derslerWithData = defaultDersler.map(d => {
            const ratio = d.soruSayisi / totalSoru;
            const dogru = Math.round(totalD * ratio);
            const yanlis = Math.round(totalY * ratio);
            const bos = d.soruSayisi - dogru - yanlis;
            const net = dogru - (yanlis / 3);
            return {
              ...d,
              dogru,
              yanlis,
              bos: Math.max(0, bos),
              net: parseFloat(net.toFixed(2)),
              basariOrani: Math.round((dogru / d.soruSayisi) * 100)
            };
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
            basariOrani: Math.round(((student.toplamDogru || 0) / totalSoru) * 100),
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500">Öğrenci karnesi yükleniyor...</p>
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
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
                  {karne.ogrenciAdi.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{karne.ogrenciAdi}</h1>
                  <p className="text-sm text-slate-500">
                    No: {karne.ogrenciNo} • {karne.sube} • Kitapçık: {karne.kitapcik}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                <Printer size={18} />
                <span className="hidden sm:inline">Yazdır</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                <Download size={18} />
                <span className="hidden sm:inline">PDF İndir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                  activeTab === tab.id 
                    ? 'text-emerald-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
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
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <OgrenciKarneContent />
    </Suspense>
  );
}
