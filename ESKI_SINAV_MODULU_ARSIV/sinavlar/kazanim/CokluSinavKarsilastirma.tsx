'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  LineChart,
  Target,
  Users,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Search,
  User,
  BookOpen
} from 'lucide-react';
import { DERS_RENKLERI, DERS_ISIMLERI } from './types';

// Sınav Sonuç Tipi
interface SinavSonuc {
  id: string;
  sinavAdi: string;
  sinavTarihi: string;
  toplamNet: number;
  toplamDogru: number;
  toplamYanlis: number;
  siralama: number;
  katilimci: number;
  dersler: {
    dersKodu: string;
    dogru: number;
    yanlis: number;
    net: number;
  }[];
}

// Öğrenci Tipi
interface Ogrenci {
  id: string;
  ad: string;
  soyad: string;
  sinif: string;
  sinavlar: SinavSonuc[];
}

interface CokluSinavKarsilastirmaProps {
  ogrenciler: Ogrenci[];
  selectedOgrenciId?: string;
  onOgrenciSelect?: (id: string) => void;
}

export default function CokluSinavKarsilastirma({
  ogrenciler,
  selectedOgrenciId,
  onOgrenciSelect
}: CokluSinavKarsilastirmaProps) {
  const [selectedOgrenci, setSelectedOgrenci] = useState<Ogrenci | null>(
    ogrenciler.find(o => o.id === selectedOgrenciId) || ogrenciler[0] || null
  );
  const [viewMode, setViewMode] = useState<'trend' | 'comparison' | 'subjects'>('trend');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOgrenciList, setShowOgrenciList] = useState(false);

  // Trend hesapla
  const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const lastValue = values[values.length - 1];
    const diff = lastValue - avg;
    if (diff > 1) return 'up';
    if (diff < -1) return 'down';
    return 'stable';
  };

  // Seçili öğrenci için analiz
  const analysis = useMemo(() => {
    if (!selectedOgrenci || selectedOgrenci.sinavlar.length === 0) return null;

    const sinavlar = selectedOgrenci.sinavlar.sort(
      (a, b) => new Date(a.sinavTarihi).getTime() - new Date(b.sinavTarihi).getTime()
    );

    const netler = sinavlar.map(s => s.toplamNet);
    const trend = calculateTrend(netler);
    
    // Ders bazlı trend
    const dersler = new Map<string, number[]>();
    sinavlar.forEach(sinav => {
      sinav.dersler.forEach(ders => {
        if (!dersler.has(ders.dersKodu)) {
          dersler.set(ders.dersKodu, []);
        }
        dersler.get(ders.dersKodu)!.push(ders.net);
      });
    });

    const dersTrendleri = Array.from(dersler.entries()).map(([kod, netler]) => ({
      dersKodu: kod,
      dersAdi: DERS_ISIMLERI[kod] || kod,
      netler,
      trend: calculateTrend(netler),
      sonNet: netler[netler.length - 1] || 0,
      ortalama: netler.reduce((a, b) => a + b, 0) / netler.length,
      degisim: netler.length > 1 ? netler[netler.length - 1] - netler[0] : 0
    }));

    // En iyi ve en kötü performans
    const enYuksekNet = Math.max(...netler);
    const enDusukNet = Math.min(...netler);
    const ortalamaNet = netler.reduce((a, b) => a + b, 0) / netler.length;

    return {
      sinavlar,
      netler,
      trend,
      dersTrendleri,
      enYuksekNet,
      enDusukNet,
      ortalamaNet,
      sinavSayisi: sinavlar.length
    };
  }, [selectedOgrenci]);

  // Filtrelenmiş öğrenci listesi
  const filteredOgrenciler = useMemo(() => {
    if (!searchTerm) return ogrenciler;
    const term = searchTerm.toLowerCase();
    return ogrenciler.filter(o => 
      `${o.ad} ${o.soyad}`.toLowerCase().includes(term) ||
      o.sinif.toLowerCase().includes(term)
    );
  }, [ogrenciler, searchTerm]);

  // Trend ikonu
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Çoklu Sınav Karşılaştırma</h2>
            <p className="text-sm text-slate-500">İlerleme ve trend analizi</p>
          </div>
        </div>
      </div>

      {/* Öğrenci Seçici */}
      <div className="relative">
        <button
          onClick={() => setShowOgrenciList(!showOgrenciList)}
          className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-violet-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            {selectedOgrenci ? (
              <div className="text-left">
                <p className="font-semibold text-slate-800">
                  {selectedOgrenci.ad} {selectedOgrenci.soyad}
                </p>
                <p className="text-sm text-slate-500">{selectedOgrenci.sinif}</p>
              </div>
            ) : (
              <span className="text-slate-500">Öğrenci seçin...</span>
            )}
          </div>
          {showOgrenciList ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <AnimatePresence>
          {showOgrenciList && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden"
            >
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Öğrenci ara..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredOgrenciler.map(ogrenci => (
                  <button
                    key={ogrenci.id}
                    onClick={() => {
                      setSelectedOgrenci(ogrenci);
                      setShowOgrenciList(false);
                      onOgrenciSelect?.(ogrenci.id);
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors ${
                      selectedOgrenci?.id === ogrenci.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                      {ogrenci.ad[0]}{ogrenci.soyad[0]}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-slate-700">{ogrenci.ad} {ogrenci.soyad}</p>
                      <p className="text-xs text-slate-500">{ogrenci.sinif} • {ogrenci.sinavlar.length} sınav</p>
                    </div>
                    {selectedOgrenci?.id === ogrenci.id && (
                      <div className="w-2 h-2 bg-violet-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Görünüm Seçici */}
      {selectedOgrenci && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'trend', label: 'Trend Analizi', icon: LineChart },
            { id: 'comparison', label: 'Sınav Karşılaştırma', icon: BarChart3 },
            { id: 'subjects', label: 'Ders Bazlı', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as typeof viewMode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                viewMode === tab.id
                  ? 'bg-white shadow-md text-violet-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* İçerik */}
      {analysis && (
        <AnimatePresence mode="wait">
          {/* TREND ANALİZİ */}
          {viewMode === 'trend' && (
            <motion.div
              key="trend"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Özet Kartları */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Genel Trend</span>
                    <TrendIcon trend={analysis.trend} />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {analysis.trend === 'up' ? 'Yükseliyor 📈' : analysis.trend === 'down' ? 'Düşüyor 📉' : 'Stabil ➡️'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-sm text-slate-500">Ortalama Net</span>
                  <p className="text-2xl font-bold text-blue-600">{analysis.ortalamaNet.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-sm text-slate-500">En Yüksek</span>
                  <p className="text-2xl font-bold text-emerald-600">{analysis.enYuksekNet.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-sm text-slate-500">Sınav Sayısı</span>
                  <p className="text-2xl font-bold text-violet-600">{analysis.sinavSayisi}</p>
                </div>
              </div>

              {/* Net Grafiği (Basit Bar Chart) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-4">Net Gelişimi</h4>
                <div className="flex items-end gap-2 h-48">
                  {analysis.sinavlar.map((sinav, i) => {
                    const maxNet = Math.max(...analysis.netler);
                    const height = maxNet > 0 ? (sinav.toplamNet / maxNet) * 100 : 0;
                    const isLast = i === analysis.sinavlar.length - 1;
                    
                    return (
                      <div key={sinav.id} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex justify-center">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 5)}%` }}
                            transition={{ delay: i * 0.1 }}
                            className={`w-full max-w-[60px] rounded-t-lg ${
                              isLast ? 'bg-gradient-to-t from-violet-500 to-purple-500' : 'bg-slate-300'
                            }`}
                            style={{ minHeight: '10px' }}
                          />
                          <span className="absolute -top-6 text-sm font-bold text-slate-700">
                            {sinav.toplamNet.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 truncate max-w-[80px]" title={sinav.sinavAdi}>
                            {sinav.sinavAdi.length > 10 ? sinav.sinavAdi.substring(0, 10) + '...' : sinav.sinavAdi}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(sinav.sinavTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ders Trendleri */}
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-4">Ders Bazlı Trend</h4>
                <div className="space-y-3">
                  {analysis.dersTrendleri.map(ders => (
                    <div key={ders.dersKodu} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DERS_RENKLERI[ders.dersKodu] || '#6B7280' }}
                      />
                      <span className="font-medium text-slate-700 w-32">{ders.dersAdi}</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (ders.sonNet / 20) * 100)}%`,
                            backgroundColor: DERS_RENKLERI[ders.dersKodu] || '#6B7280'
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 w-16 text-right">{ders.sonNet.toFixed(2)}</span>
                      <TrendIcon trend={ders.trend} />
                      <span className={`text-sm font-medium w-20 text-right ${
                        ders.degisim > 0 ? 'text-emerald-600' : ders.degisim < 0 ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {ders.degisim > 0 ? '+' : ''}{ders.degisim.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SINAV KARŞILAŞTIRMA */}
          {viewMode === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Sınav</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Tarih</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Doğru</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Yanlış</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Net</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Sıralama</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Değişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.sinavlar.map((sinav, i) => {
                      const prevNet = i > 0 ? analysis.sinavlar[i - 1].toplamNet : sinav.toplamNet;
                      const degisim = sinav.toplamNet - prevNet;
                      
                      return (
                        <tr key={sinav.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">{sinav.sinavAdi}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(sinav.sinavTarihi).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{sinav.toplamDogru}</td>
                          <td className="px-4 py-3 text-center text-red-600 font-semibold">{sinav.toplamYanlis}</td>
                          <td className="px-4 py-3 text-center font-bold text-violet-600">{sinav.toplamNet.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                              {sinav.siralama}/{sinav.katilimci}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {i > 0 && (
                              <span className={`flex items-center justify-center gap-1 ${
                                degisim > 0 ? 'text-emerald-600' : degisim < 0 ? 'text-red-600' : 'text-slate-500'
                              }`}>
                                {degisim > 0 ? <TrendingUp size={14} /> : degisim < 0 ? <TrendingDown size={14} /> : null}
                                {degisim > 0 ? '+' : ''}{degisim.toFixed(2)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* DERS BAZLI */}
          {viewMode === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-4"
            >
              {analysis.dersTrendleri.map(ders => (
                <div
                  key={ders.dersKodu}
                  className="bg-white p-4 rounded-xl border border-slate-200"
                  style={{ borderLeftWidth: '4px', borderLeftColor: DERS_RENKLERI[ders.dersKodu] || '#6B7280' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-700">{ders.dersAdi}</h4>
                    <TrendIcon trend={ders.trend} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Ortalama</p>
                      <p className="font-bold text-slate-700">{ders.ortalama.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Son Net</p>
                      <p className="font-bold" style={{ color: DERS_RENKLERI[ders.dersKodu] }}>{ders.sonNet.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Değişim</p>
                      <p className={`font-bold ${ders.degisim > 0 ? 'text-emerald-600' : ders.degisim < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {ders.degisim > 0 ? '+' : ''}{ders.degisim.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="flex items-end gap-1 h-16">
                    {ders.netler.map((net, i) => {
                      const maxNet = Math.max(...ders.netler);
                      const height = maxNet > 0 ? (net / maxNet) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${Math.max(height, 5)}%`,
                            backgroundColor: i === ders.netler.length - 1 
                              ? DERS_RENKLERI[ders.dersKodu] 
                              : `${DERS_RENKLERI[ders.dersKodu]}40`
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Veri yoksa */}
      {!selectedOgrenci && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Lütfen bir öğrenci seçin</p>
        </div>
      )}
    </div>
  );
}

