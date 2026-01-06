'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  Lightbulb,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  Star,
  Sparkles,
  GraduationCap,
  MessageCircle
} from 'lucide-react';
import { DERS_ISIMLERI, DERS_RENKLERI } from './types';

// Veli Paneli Veri Tipi
interface VeliPaneliData {
  ogrenci: {
    ad: string;
    soyad: string;
    sinif: string;
    foto?: string;
  };
  sonSinav: {
    ad: string;
    tarih: string;
    toplamNet: number;
    siralama: number;
    katilimci: number;
  };
  genelDurum: 'cok_iyi' | 'iyi' | 'orta' | 'dikkat' | 'acil';
  trend: 'yukseliyor' | 'dusuyor' | 'stabil';
  gucluYonler: {
    dersKodu: string;
    basariOrani: number;
  }[];
  zayifYonler: {
    dersKodu: string;
    konu: string;
    basariOrani: number;
  }[];
  buHaftaYapilacaklar: {
    id: string;
    metin: string;
    sure: string;
    oncelik: 'yuksek' | 'orta' | 'dusuk';
    tamamlandi?: boolean;
  }[];
  mesajlar?: {
    id: string;
    gonderen: string;
    metin: string;
    tarih: string;
  }[];
}

interface VeliPaneliProps {
  data: VeliPaneliData;
  onGorevTamamla?: (gorevId: string) => void;
}

// Durum bilgileri
const DURUM_BILGILERI = {
  cok_iyi: { emoji: '🌟', renk: '#10B981', metin: 'Mükemmel', aciklama: 'Çocuğunuz çok başarılı!' },
  iyi: { emoji: '😊', renk: '#3B82F6', metin: 'İyi', aciklama: 'Güzel ilerleme kaydediyor' },
  orta: { emoji: '📚', renk: '#F59E0B', metin: 'Gelişiyor', aciklama: 'Biraz daha çalışma gerekli' },
  dikkat: { emoji: '⚠️', renk: '#EF4444', metin: 'Dikkat', aciklama: 'Ekstra destek gerekebilir' },
  acil: { emoji: '🆘', renk: '#DC2626', metin: 'Acil Destek', aciklama: 'Öğretmenle görüşün' }
};

const TREND_BILGILERI = {
  yukseliyor: { emoji: '📈', renk: '#10B981', metin: 'Yükseliyor' },
  dusuyor: { emoji: '📉', renk: '#EF4444', metin: 'Düşüyor' },
  stabil: { emoji: '➡️', renk: '#6B7280', metin: 'Stabil' }
};

export default function VeliPaneli({ data, onGorevTamamla }: VeliPaneliProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const durum = DURUM_BILGILERI[data.genelDurum];
  const trend = TREND_BILGILERI[data.trend];

  // Yüzdelik dilim hesapla
  const yuzdelik = useMemo(() => {
    return ((data.sonSinav.katilimci - data.sonSinav.siralama) / data.sonSinav.katilimci * 100).toFixed(0);
  }, [data.sonSinav]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Başlık Kartı */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-pink-400 rounded-2xl flex items-center justify-center text-2xl shadow-md">
              {data.ogrenci.foto ? (
                <img src={data.ogrenci.foto} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                '👨‍🎓'
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-800">
                {data.ogrenci.ad} {data.ogrenci.soyad}
              </h1>
              <p className="text-slate-500">{data.ogrenci.sinif}</p>
            </div>
            <Heart className="w-8 h-8 text-pink-400" />
          </div>
        </motion.div>

        {/* Genel Durum */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
          style={{ borderLeft: `4px solid ${durum.renk}` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">{durum.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold" style={{ color: durum.renk }}>
                  {durum.metin}
                </h2>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${trend.renk}20`, color: trend.renk }}
                >
                  {trend.emoji} {trend.metin}
                </span>
              </div>
              <p className="text-slate-600 mt-1">{durum.aciklama}</p>
            </div>
          </div>
        </motion.div>

        {/* Son Sınav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-violet-200 text-sm">Son Sınav</p>
              <h3 className="text-xl font-bold">{data.sonSinav.ad}</h3>
            </div>
            <div className="text-right">
              <p className="text-violet-200 text-sm">
                <Calendar className="inline w-4 h-4 mr-1" />
                {new Date(data.sonSinav.tarih).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold">{data.sonSinav.toplamNet.toFixed(1)}</p>
              <p className="text-violet-200 text-sm">Net</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold">{data.sonSinav.siralama}.</p>
              <p className="text-violet-200 text-sm">Sıralama</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold">%{yuzdelik}</p>
              <p className="text-violet-200 text-sm">Yüzdelik</p>
            </div>
          </div>
        </motion.div>

        {/* Güçlü Yönler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            <h3 className="text-lg font-bold text-slate-800">Güçlü Yönler</h3>
          </div>
          <div className="space-y-3">
            {data.gucluYonler.map((ders, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: `${DERS_RENKLERI[ders.dersKodu]}15` }}
              >
                <span className="text-xl">🌟</span>
                <span 
                  className="font-medium"
                  style={{ color: DERS_RENKLERI[ders.dersKodu] }}
                >
                  {DERS_ISIMLERI[ders.dersKodu]}
                </span>
                <div className="flex-1" />
                <span 
                  className="font-bold text-lg"
                  style={{ color: DERS_RENKLERI[ders.dersKodu] }}
                >
                  %{ders.basariOrani}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dikkat Edilmesi Gerekenler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-bold text-slate-800">Dikkat Edilmesi Gerekenler</h3>
          </div>
          <div className="space-y-3">
            {data.zayifYonler.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl"
              >
                <span className="text-xl">📌</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-700">
                    {DERS_ISIMLERI[item.dersKodu]} - {item.konu}
                  </p>
                </div>
                <span className="font-bold text-red-600">%{item.basariOrani}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bu Hafta Yapılacaklar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-bold text-slate-800">Bu Hafta Yapılacaklar</h3>
          </div>
          <div className="space-y-3">
            {data.buHaftaYapilacaklar.map((gorev, i) => (
              <motion.button
                key={gorev.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onGorevTamamla?.(gorev.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all ${
                  gorev.tamamlandi 
                    ? 'bg-emerald-50 border-2 border-emerald-200' 
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="mt-0.5">
                  {gorev.tamamlandi ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : gorev.oncelik === 'yuksek' ? (
                    <span className="text-xl">🔴</span>
                  ) : gorev.oncelik === 'orta' ? (
                    <span className="text-xl">🟡</span>
                  ) : (
                    <span className="text-xl">🟢</span>
                  )}
                </span>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${gorev.tamamlandi ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {gorev.metin}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {gorev.sure}
                  </p>
                </div>
                {!gorev.tamamlandi && (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Motivasyon Kartı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-4">
            <Sparkles className="w-10 h-10" />
            <div>
              <h3 className="text-lg font-bold">Motivasyon Sözü</h3>
              <p className="text-amber-100 mt-1">
                "Başarı, her gün küçük adımlar atarak büyük hedeflere ulaşmaktır." 🎯
              </p>
            </div>
          </div>
        </motion.div>

        {/* İletişim */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-6 h-6 text-violet-500" />
            <h3 className="text-lg font-bold text-slate-800">Öğretmenle İletişim</h3>
          </div>
          <button className="w-full py-4 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Mesaj Gönder
          </button>
        </motion.div>

        {/* Alt Bilgi */}
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm">
            <GraduationCap className="inline w-4 h-4 mr-1" />
            AkademiHub Veli Paneli
          </p>
        </div>
      </div>
    </div>
  );
}

