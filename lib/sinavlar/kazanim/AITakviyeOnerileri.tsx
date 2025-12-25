'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Target,
  Clock,
  Calendar,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Play,
  RefreshCw,
  Download,
  Share2,
  ChevronRight,
  Loader2,
  Star,
  Zap
} from 'lucide-react';
import { DERS_ISIMLERI, DERS_RENKLERI } from './types';

// Öneri Tipi
interface TakviyeOneri {
  id: string;
  tip: 'konu' | 'video' | 'soru' | 'deneme';
  ders: string;
  baslik: string;
  aciklama: string;
  sure: string;
  oncelik: 'yuksek' | 'orta' | 'dusuk';
  kaynak?: string;
  link?: string;
}

// Günlük Plan Tipi
interface GunlukPlan {
  gun: string;
  tarih: string;
  gorevler: {
    saat: string;
    ders: string;
    konu: string;
    aktivite: string;
    sure: number; // dakika
  }[];
  toplamSure: number;
}

// Analiz Verisi
interface OgrenciAnaliz {
  ad: string;
  soyad: string;
  sinif: string;
  sonSinavlar: {
    ad: string;
    tarih: string;
    netler: Record<string, number>;
  }[];
  zayifKonular: {
    ders: string;
    konu: string;
    basariOrani: number;
    soruSayisi: number;
  }[];
  gucluKonular: {
    ders: string;
    konu: string;
    basariOrani: number;
  }[];
  trendler: {
    ders: string;
    trend: 'yukseliyor' | 'dusuyor' | 'stabil';
    degisim: number;
  }[];
}

interface AITakviyeOnerileriProps {
  ogrenciAnaliz: OgrenciAnaliz;
  onPlanOlustur?: (plan: GunlukPlan[]) => void;
}

export default function AITakviyeOnerileri({
  ogrenciAnaliz,
  onPlanOlustur
}: AITakviyeOnerileriProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [oneriler, setOneriler] = useState<TakviyeOneri[]>([]);
  const [haftalikPlan, setHaftalikPlan] = useState<GunlukPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'oneriler' | 'plan'>('oneriler');
  const [selectedGun, setSelectedGun] = useState<number>(0);

  // AI ile öneri oluştur (simüle)
  const generateRecommendations = useCallback(async () => {
    setIsGenerating(true);
    
    // Simüle edilmiş gecikme
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Zayıf konulara göre öneri oluştur
    const yeniOneriler: TakviyeOneri[] = [];
    
    ogrenciAnaliz.zayifKonular.forEach((zayif, index) => {
      // Konu çalışma önerisi
      yeniOneriler.push({
        id: `konu-${index}`,
        tip: 'konu',
        ders: zayif.ders,
        baslik: `${zayif.konu} konusunu tekrar et`,
        aciklama: `Bu konuda %${zayif.basariOrani} başarı oranın var. Temel kavramları tekrar gözden geçir.`,
        sure: '30 dk',
        oncelik: zayif.basariOrani < 40 ? 'yuksek' : 'orta'
      });

      // Soru çözme önerisi
      yeniOneriler.push({
        id: `soru-${index}`,
        tip: 'soru',
        ders: zayif.ders,
        baslik: `${zayif.konu} - 20 soru çöz`,
        aciklama: 'Kolay sorulardan başlayarak zorlaştır. Yanlışlarını not al.',
        sure: '45 dk',
        oncelik: zayif.basariOrani < 40 ? 'yuksek' : 'orta',
        kaynak: 'Tonguç Akademi'
      });

      // Video önerisi
      if (zayif.basariOrani < 50) {
        yeniOneriler.push({
          id: `video-${index}`,
          tip: 'video',
          ders: zayif.ders,
          baslik: `${zayif.konu} konu anlatım videosu`,
          aciklama: 'Konuyu en baştan öğrenmek için video izle.',
          sure: '20 dk',
          oncelik: 'yuksek',
          kaynak: 'YouTube',
          link: '#'
        });
      }
    });

    // Deneme önerisi
    yeniOneriler.push({
      id: 'deneme-1',
      tip: 'deneme',
      ders: 'GENEL',
      baslik: 'Haftalık Mini Deneme',
      aciklama: 'Tüm dersleri kapsayan 30 soruluk deneme çöz.',
      sure: '45 dk',
      oncelik: 'orta'
    });

    setOneriler(yeniOneriler);

    // Haftalık plan oluştur
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const bugun = new Date();
    
    const plan: GunlukPlan[] = gunler.map((gun, index) => {
      const tarih = new Date(bugun);
      tarih.setDate(bugun.getDate() + index);
      
      const gorevler = [];
      let toplamSure = 0;

      // Her gün için farklı dersler ve konular
      const zayifIndex = index % ogrenciAnaliz.zayifKonular.length;
      const zayifKonu = ogrenciAnaliz.zayifKonular[zayifIndex];

      if (zayifKonu) {
        gorevler.push({
          saat: '16:00',
          ders: zayifKonu.ders,
          konu: zayifKonu.konu,
          aktivite: 'Konu Tekrarı',
          sure: 30
        });
        toplamSure += 30;

        gorevler.push({
          saat: '16:30',
          ders: zayifKonu.ders,
          konu: zayifKonu.konu,
          aktivite: 'Soru Çözümü (20 soru)',
          sure: 45
        });
        toplamSure += 45;
      }

      // Hafta sonu deneme
      if (index >= 5) {
        gorevler.push({
          saat: '10:00',
          ders: 'GENEL',
          konu: 'Tüm Konular',
          aktivite: 'Deneme Sınavı',
          sure: 135
        });
        toplamSure += 135;
      }

      return {
        gun,
        tarih: tarih.toISOString().split('T')[0],
        gorevler,
        toplamSure
      };
    });

    setHaftalikPlan(plan);
    onPlanOlustur?.(plan);
    setIsGenerating(false);
  }, [ogrenciAnaliz, onPlanOlustur]);

  // Öncelik rengi
  const getOncelikRenk = (oncelik: string) => {
    switch (oncelik) {
      case 'yuksek': return '#EF4444';
      case 'orta': return '#F59E0B';
      case 'dusuk': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Tip ikonu
  const getTipIcon = (tip: string) => {
    switch (tip) {
      case 'konu': return <BookOpen className="w-5 h-5" />;
      case 'video': return <Play className="w-5 h-5" />;
      case 'soru': return <Target className="w-5 h-5" />;
      case 'deneme': return <Star className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Takviye Önerileri</h2>
            <p className="text-sm text-slate-500">{ogrenciAnaliz.ad} {ogrenciAnaliz.soyad} için kişiselleştirilmiş plan</p>
          </div>
        </div>
      </div>

      {/* Öğrenci Analiz Özeti */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-violet-800">Analiz Özeti</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-slate-500">Zayıf Konu</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{ogrenciAnaliz.zayifKonular.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-500">Güçlü Konu</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{ogrenciAnaliz.gucluKonular.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-500">Yükselen Ders</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {ogrenciAnaliz.trendler.filter(t => t.trend === 'yukseliyor').length}
            </p>
          </div>
        </div>

        {/* En Zayıf Konular */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Öncelikli Çalışılacak Konular:</p>
          <div className="flex flex-wrap gap-2">
            {ogrenciAnaliz.zayifKonular.slice(0, 5).map((konu, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${DERS_RENKLERI[konu.ders]}20`,
                  color: DERS_RENKLERI[konu.ders]
                }}
              >
                {konu.konu} (%{konu.basariOrani})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Öneri Oluştur Butonu */}
      {oneriler.length === 0 && (
        <button
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl font-medium transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Analiz Yapıyor...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Kişiselleştirilmiş Plan Oluştur
            </>
          )}
        </button>
      )}

      {/* Tab Seçici */}
      {oneriler.length > 0 && (
        <>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('oneriler')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'oneriler'
                  ? 'bg-white shadow-md text-violet-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Lightbulb size={18} />
              Öneriler ({oneriler.length})
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'plan'
                  ? 'bg-white shadow-md text-violet-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={18} />
              Haftalık Plan
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ÖNERİLER */}
            {activeTab === 'oneriler' && (
              <motion.div
                key="oneriler"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {oneriler.map((oneri, i) => (
                  <motion.div
                    key={oneri.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="p-2.5 rounded-xl"
                        style={{
                          backgroundColor: oneri.ders === 'GENEL' 
                            ? '#8B5CF620' 
                            : `${DERS_RENKLERI[oneri.ders]}20`,
                          color: oneri.ders === 'GENEL' 
                            ? '#8B5CF6' 
                            : DERS_RENKLERI[oneri.ders]
                        }}
                      >
                        {getTipIcon(oneri.tip)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800">{oneri.baslik}</h4>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getOncelikRenk(oneri.oncelik) }}
                          />
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{oneri.aciklama}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {oneri.sure}
                          </span>
                          {oneri.kaynak && (
                            <span className="flex items-center gap-1">
                              <BookOpen size={12} />
                              {oneri.kaynak}
                            </span>
                          )}
                          <span
                            className="px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${getOncelikRenk(oneri.oncelik)}20`,
                              color: getOncelikRenk(oneri.oncelik)
                            }}
                          >
                            {oneri.oncelik === 'yuksek' ? 'Öncelikli' : oneri.oncelik === 'orta' ? 'Normal' : 'Opsiyonel'}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={generateRecommendations}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Yeniden Oluştur
                </button>
              </motion.div>
            )}

            {/* HAFTALIK PLAN */}
            {activeTab === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Gün Seçici */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {haftalikPlan.map((gun, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedGun(i)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                        selectedGun === i
                          ? 'bg-violet-600 text-white shadow-lg'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'
                      }`}
                    >
                      <p className="font-medium">{gun.gun}</p>
                      <p className="text-xs opacity-70">
                        {new Date(gun.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Seçili Gün Planı */}
                {haftalikPlan[selectedGun] && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-violet-50 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-violet-800">
                            {haftalikPlan[selectedGun].gun}
                          </h4>
                          <p className="text-sm text-violet-600">
                            {new Date(haftalikPlan[selectedGun].tarih).toLocaleDateString('tr-TR', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-violet-600">
                            {haftalikPlan[selectedGun].toplamSure}
                          </p>
                          <p className="text-sm text-violet-500">dakika</p>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {haftalikPlan[selectedGun].gorevler.map((gorev, i) => (
                        <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-slate-700">{gorev.saat}</p>
                              <p className="text-xs text-slate-400">{gorev.sure} dk</p>
                            </div>
                            <div
                              className="w-1 h-12 rounded-full"
                              style={{
                                backgroundColor: gorev.ders === 'GENEL' 
                                  ? '#8B5CF6' 
                                  : DERS_RENKLERI[gorev.ders] || '#6B7280'
                              }}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{gorev.aktivite}</p>
                              <p className="text-sm text-slate-500">
                                {DERS_ISIMLERI[gorev.ders] || gorev.ders} - {gorev.konu}
                              </p>
                            </div>
                            <CheckCircle2 className="w-6 h-6 text-slate-300 hover:text-emerald-500 cursor-pointer transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aksiyon Butonları */}
                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-violet-100 text-violet-700 rounded-xl font-medium hover:bg-violet-200 transition-colors flex items-center justify-center gap-2">
                    <Download size={18} />
                    PDF İndir
                  </button>
                  <button className="flex-1 py-3 bg-violet-100 text-violet-700 rounded-xl font-medium hover:bg-violet-200 transition-colors flex items-center justify-center gap-2">
                    <Share2 size={18} />
                    Veliye Gönder
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

