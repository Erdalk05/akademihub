'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Target,
  Grid3X3,
  Upload,
  Users,
  BarChart3,
  Settings,
  Save,
  AlertCircle,
  Loader2,
  Calendar,
  BookOpen,
  ListChecks
} from 'lucide-react';

import KazanimCevapAnahtari from './KazanimCevapAnahtari';
import OptikSablonEditor from './OptikSablonEditor';
import OptikVeriParser from './OptikVeriParser';
import SablonKutuphanesi from './SablonKutuphanesi';
import { CevapAnahtariSatir, OptikSablon, ParsedOptikSatir, DERS_ISIMLERI } from './types';
import { SINAV_KONFIGURASYONLARI, SINIF_BILGILERI, SinavTuru, SinifSeviyesi } from './sinavKonfigurasyonlari';
import { 
  cevapAnahtarindanYapilandirmaOlustur, 
  topluEsnekDegerlendir, 
  esnekIstatistikHesapla,
  EsnekDegerlendirmeSonucu,
  EsnekSinavYapilandirmasi 
} from './PuanlamaMotoru';

interface SinavSihirbaziProps {
  organizationId: string;
  academicYearId: string;
  ogrenciListesi?: { id: string; ogrenciNo: string; ad: string; soyad: string; sinif: string }[];
  savedSablonlar?: OptikSablon[];
  onComplete?: (data: {
    sinavBilgisi: SinavBilgisi;
    cevapAnahtari: CevapAnahtariSatir[];
    ogrenciSonuclari: any[];
  }) => void;
}

interface SinavBilgisi {
  ad: string;
  tarih: string;
  tip: SinavTuru;
  sinifSeviyesi: SinifSeviyesi;
  aciklama?: string;
  // Özelleştirilebilir alanlar
  toplamSoru?: number;           // Varsayılan: 90 (LGS)
  yanlisKatsayisi?: number;      // Varsayılan: 3 (LGS) veya 4 (TYT/AYT)
  tekDers?: boolean;             // Sadece tek ders sınavı mı?
  seciliDers?: string;           // Tek ders ise hangi ders
  kitapcikTurleri?: string[];    // ['A', 'B', 'C', 'D']
}

// Adımlar
const STEPS = [
  { id: 1, title: 'Sınav Bilgisi', icon: FileText, description: 'Ad, tarih ve tür' },
  { id: 2, title: 'Cevap Anahtarı', icon: Target, description: 'Kazanım bazlı' },
  { id: 3, title: 'Optik Şablon', icon: Grid3X3, description: 'Alan tanımları' },
  { id: 4, title: 'Veri Yükle', icon: Upload, description: 'Öğrenci cevapları' },
  { id: 5, title: 'Önizleme', icon: BarChart3, description: 'Sonuçları gör' },
];

// Öğrenci adını temizle - sayıları kaldır
const cleanName = (name: string): string => {
  if (!name) return '';
  // Baştaki sayıları kaldır
  let cleaned = name.replace(/^[\d\s]+/, '').trim();
  // Ortadaki sayıları da kaldır
  cleaned = cleaned.replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
  // Başharfleri büyük yap
  return cleaned.split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || name;
};

export default function SinavSihirbazi({
  organizationId,
  academicYearId,
  ogrenciListesi = [],
  savedSablonlar = [],
  onComplete
}: SinavSihirbaziProps) {
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [sinavBilgisi, setSinavBilgisi] = useState<SinavBilgisi>({
    ad: '',
    tarih: new Date().toISOString().split('T')[0],
    tip: 'LGS',
    sinifSeviyesi: '8'
  });
  const [sablonModu, setSablonModu] = useState<'kutuphane' | 'ozel'>('kutuphane');
  const [cevapAnahtari, setCevapAnahtari] = useState<CevapAnahtariSatir[]>([]);
  const [selectedSablon, setSelectedSablon] = useState<OptikSablon | null>(savedSablonlar[0] || null);
  const [customSablon, setCustomSablon] = useState<Omit<OptikSablon, 'id'> | null>(null);
  const [parsedOgrenciler, setParsedOgrenciler] = useState<ParsedOptikSatir[]>([]);
  const [matchedData, setMatchedData] = useState<any[]>([]);
  const [sonuclar, setSonuclar] = useState<any[]>([]);

  // Adım geçişi
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return sinavBilgisi.ad.trim().length > 0 && sinavBilgisi.tarih;
      case 2:
        return cevapAnahtari.length > 0;
      case 3:
        return selectedSablon !== null || customSablon !== null;
      case 4:
        return parsedOgrenciler.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, sinavBilgisi, cevapAnahtari, selectedSablon, customSablon, parsedOgrenciler]);

  const goNext = () => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Sonuçları hesapla - YENİ ESNEK MOTOR
  const calculateResults = useCallback(() => {
    if (cevapAnahtari.length === 0 || parsedOgrenciler.length === 0) return;

    // Yanlış katsayısını belirle
    let yanlisKatsayisi = 4; // Varsayılan
    if (sinavBilgisi.tip === 'LGS') {
      yanlisKatsayisi = 3;
    } else if (sinavBilgisi.tip === 'DENEME' && sinavBilgisi.yanlisKatsayisi !== undefined) {
      yanlisKatsayisi = sinavBilgisi.yanlisKatsayisi;
    }

    // Esnek yapılandırma oluştur
    const yapilandirma = cevapAnahtarindanYapilandirmaOlustur(
      cevapAnahtari,
      sinavBilgisi.ad,
      sinavBilgisi.sinifSeviyesi || '8',
      yanlisKatsayisi
    );

    console.log('📊 Esnek Sınav Yapılandırması:', yapilandirma);

    // Esnek puanlama motorunu kullan
    const esnekSonuclar = topluEsnekDegerlendir(parsedOgrenciler, yapilandirma);
    
    console.log('✅ Esnek Değerlendirme Tamamlandı:', esnekSonuclar.length, 'öğrenci');

    // Sonuçları eski formata dönüştür (geriye uyumluluk)
    const results = esnekSonuclar.map(sonuc => ({
      ogrenciNo: sonuc.ogrenciNo,
      ogrenciAdi: sonuc.ogrenciAdi,
      sinifNo: sonuc.sinif,
      kitapcik: sonuc.kitapcik,
      toplamDogru: sonuc.toplamDogru,
      toplamYanlis: sonuc.toplamYanlis,
      toplamBos: sonuc.toplamBos,
      toplamNet: sonuc.toplamNet,
      toplamPuan: sonuc.toplamKatsayiliPuan,
      siralama: sonuc.genelSira || 0,
      sinifSira: sonuc.sinifSira || 0,
      // Test bazlı sonuçlar (yeni!)
      testSonuclari: sonuc.testSonuclari,
      dersBazli: sonuc.testSonuclari.map(t => ({
        dersKodu: t.dersKodu,
        dersAdi: t.testAdi,
        dogru: t.dogru,
        yanlis: t.yanlis,
        bos: t.bos,
        net: t.net,
        basariOrani: t.basariOrani,
        katsayi: t.katsayi,
        katsayiliPuan: t.katsayiliPuan
      }))
    }));

    // İstatistikler
    const istatistikler = esnekIstatistikHesapla(esnekSonuclar);
    console.log('📈 İstatistikler:', istatistikler);

    setSonuclar(results);
  }, [cevapAnahtari, parsedOgrenciler, sinavBilgisi]);

  // Adım 4'ten 5'e geçerken sonuçları hesapla
  useEffect(() => {
    if (currentStep === 5) {
      calculateResults();
    }
  }, [currentStep, calculateResults]);

  // Sihirbazı tamamla - Esnek Motor Entegreli
  const handleComplete = async () => {
    setIsLoading(true);
    
    console.log('🔍 Kaydetme başladı:', {
      sinavBilgisi,
      cevapAnahtariLength: cevapAnahtari.length,
      parsedOgrencilerLength: parsedOgrenciler.length,
      sonuclarLength: sonuclar.length
    });
    
    let finalSonuclar = sonuclar;
    
    // Eğer sonuçlar henüz hesaplanmadıysa, esnek motor ile hesapla
    if (sonuclar.length === 0 && parsedOgrenciler.length > 0) {
      console.log('⚠️ Sonuçlar boş, esnek motor ile hesaplanıyor...');
      
      // Yanlış katsayısını belirle
      let yanlisKatsayisi = 4;
      if (sinavBilgisi.tip === 'LGS') {
        yanlisKatsayisi = 3;
      } else if (sinavBilgisi.tip === 'DENEME' && sinavBilgisi.yanlisKatsayisi !== undefined) {
        yanlisKatsayisi = sinavBilgisi.yanlisKatsayisi;
      }
      
      // Esnek yapılandırma oluştur
      const yapilandirma = cevapAnahtarindanYapilandirmaOlustur(
        cevapAnahtari,
        sinavBilgisi.ad,
        sinavBilgisi.sinifSeviyesi || '8',
        yanlisKatsayisi
      );
      
      // Esnek puanlama
      const esnekSonuclar = topluEsnekDegerlendir(parsedOgrenciler, yapilandirma);
      
      // Dönüştür
      finalSonuclar = esnekSonuclar.map(sonuc => ({
        ogrenciNo: sonuc.ogrenciNo,
        ogrenciAdi: sonuc.ogrenciAdi,
        sinifNo: sonuc.sinif,
        kitapcik: sonuc.kitapcik,
        toplamDogru: sonuc.toplamDogru,
        toplamYanlis: sonuc.toplamYanlis,
        toplamBos: sonuc.toplamBos,
        toplamNet: sonuc.toplamNet,
        toplamPuan: sonuc.toplamKatsayiliPuan,
        siralama: sonuc.genelSira || 0,
        sinifSira: sonuc.sinifSira || 0,
        testSonuclari: sonuc.testSonuclari,
        dersBazli: sonuc.testSonuclari.map(t => ({
          dersKodu: t.dersKodu,
          dersAdi: t.testAdi,
          dogru: t.dogru,
          yanlis: t.yanlis,
          bos: t.bos,
          net: t.net,
          basariOrani: t.basariOrani
        }))
      }));
    }
    
    console.log('✅ Kaydetme tamamlandı:', finalSonuclar.length, 'öğrenci');
    
    try {
      onComplete?.({
        sinavBilgisi,
        cevapAnahtari,
        ogrenciSonuclari: finalSonuclar
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Sınav Sihirbazı</h1>
                <p className="text-sm text-slate-500">Adım {currentStep} / {STEPS.length}</p>
              </div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    step.id === currentStep
                      ? 'bg-emerald-100 text-emerald-700'
                      : step.id < currentStep
                        ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.id < currentStep ? 'bg-white text-emerald-600' : ''
                  }`}>
                    {step.id < currentStep ? <Check size={14} /> : step.id}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* ADIM 1: Sınav Bilgisi */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Sınav Bilgilerini Girin
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sınav Adı *
                    </label>
                    <input
                      type="text"
                      value={sinavBilgisi.ad}
                      onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, ad: e.target.value })}
                      placeholder="Örn: 8. Sınıf LGS Deneme 1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sınav Tarihi *
                    </label>
                    <input
                      type="date"
                      value={sinavBilgisi.tarih}
                      onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, tarih: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sınav Tipi *
                    </label>
                    <select
                      value={sinavBilgisi.tip}
                      onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, tip: e.target.value as any })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    >
                      <option value="LGS">LGS (8. Sınıf)</option>
                      <option value="TYT">TYT (11-12. Sınıf)</option>
                      <option value="AYT">AYT (11-12. Sınıf)</option>
                      <option value="DENEME">Kurum Denemesi (Özelleştir)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Açıklama (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={sinavBilgisi.aciklama || ''}
                      onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, aciklama: e.target.value })}
                      placeholder="Ek notlar..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>
                </div>

                {/* Özelleştirme Paneli - Kurum Denemesi için */}
                {sinavBilgisi.tip === 'DENEME' && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
                      ⚙️ Sınav Özelleştirme
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {/* Sınıf Seviyesi */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Sınıf Seviyesi
                        </label>
                        <select
                          value={sinavBilgisi.sinifSeviyesi || '8'}
                          onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, sinifSeviyesi: e.target.value as any })}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 outline-none bg-white"
                        >
                          <option value="4">4. Sınıf</option>
                          <option value="5">5. Sınıf</option>
                          <option value="6">6. Sınıf</option>
                          <option value="7">7. Sınıf</option>
                          <option value="8">8. Sınıf</option>
                          <option value="9">9. Sınıf</option>
                          <option value="10">10. Sınıf</option>
                          <option value="11">11. Sınıf</option>
                          <option value="12">12. Sınıf</option>
                          <option value="mezun">Mezun</option>
                        </select>
                      </div>

                      {/* Toplam Soru */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Toplam Soru Sayısı
                        </label>
                        <input
                          type="number"
                          value={sinavBilgisi.toplamSoru || 90}
                          onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, toplamSoru: parseInt(e.target.value) || 90 })}
                          min={1}
                          max={200}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 outline-none bg-white"
                        />
                      </div>

                      {/* Yanlış Katsayısı */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Yanlış Katsayısı
                        </label>
                        <select
                          value={sinavBilgisi.yanlisKatsayisi || 3}
                          onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, yanlisKatsayisi: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 outline-none bg-white"
                        >
                          <option value="3">3 yanlış = 1 doğru götürür</option>
                          <option value="4">4 yanlış = 1 doğru götürür</option>
                          <option value="0">Yanlış ceza yok</option>
                        </select>
                      </div>
                    </div>

                    {/* Tek Ders Sınavı */}
                    <div className="mt-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sinavBilgisi.tekDers || false}
                          onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, tekDers: e.target.checked })}
                          className="w-5 h-5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Tek Ders Sınavı (Sadece Matematik, Türkçe, vb.)
                        </span>
                      </label>
                      
                      {sinavBilgisi.tekDers && (
                        <select
                          value={sinavBilgisi.seciliDers || 'MAT'}
                          onChange={(e) => setSinavBilgisi({ ...sinavBilgisi, seciliDers: e.target.value })}
                          className="mt-2 w-48 px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 outline-none bg-white"
                        >
                          <option value="TUR">Türkçe</option>
                          <option value="MAT">Matematik</option>
                          <option value="FEN">Fen Bilimleri</option>
                          <option value="SOS">Sosyal Bilgiler</option>
                          <option value="ING">İngilizce</option>
                          <option value="DIN">Din Kültürü</option>
                        </select>
                      )}
                    </div>

                    {/* Kitapçık Türleri */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Kitapçık Türleri
                      </label>
                      <div className="flex gap-4">
                        {['A', 'B', 'C', 'D'].map(kit => (
                          <label key={kit} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(sinavBilgisi.kitapcikTurleri || ['A']).includes(kit)}
                              onChange={(e) => {
                                const current = sinavBilgisi.kitapcikTurleri || ['A'];
                                const updated = e.target.checked
                                  ? [...current, kit]
                                  : current.filter(k => k !== kit);
                                setSinavBilgisi({ ...sinavBilgisi, kitapcikTurleri: updated.length > 0 ? updated : ['A'] });
                              }}
                              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                            />
                            <span className="font-medium">{kit}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        Farklı kitapçıkların cevap anahtarları cevap anahtarı adımında yüklenecek
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ADIM 2: Cevap Anahtarı */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <KazanimCevapAnahtari
                  examType={sinavBilgisi.tip}
                  onSave={(data) => setCevapAnahtari(data)}
                  initialData={cevapAnahtari}
                />
              </div>
            </motion.div>
          )}

          {/* ADIM 3: Optik Şablon */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Mod Seçimi */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setSablonModu('kutuphane')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    sablonModu === 'kutuphane'
                      ? 'bg-white shadow-md text-purple-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ListChecks size={18} />
                  Hazır Şablonlar
                </button>
                <button
                  onClick={() => setSablonModu('ozel')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    sablonModu === 'ozel'
                      ? 'bg-white shadow-md text-emerald-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Grid3X3 size={18} />
                  Özel Şablon Oluştur
                </button>
              </div>

              {/* Şablon Kütüphanesi Modu */}
              {sablonModu === 'kutuphane' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <SablonKutuphanesi
                    sinifSeviyesi={sinavBilgisi.sinifSeviyesi}
                    sinavTuru={sinavBilgisi.tip}
                    onSelect={(sablon) => {
                      console.log('📦 Kütüphaneden şablon seçildi:', sablon.sablonAdi);
                      setSelectedSablon(sablon);
                      setCustomSablon(null);
                      // OTOMATİK OLARAK SONRAKİ ADIMA GEÇ
                      setTimeout(() => setCurrentStep(4), 500);
                    }}
                    onCustom={() => setSablonModu('ozel')}
                  />
                </div>
              )}

              {/* Özel Şablon Modu */}
              {sablonModu === 'ozel' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <OptikSablonEditor
                    initialSablon={selectedSablon || undefined}
                    cevapAnahtari={cevapAnahtari}
                    onSave={(sablon) => {
                      console.log('🔧 Özel şablon kaydedildi, sonraki adıma geçiliyor...');
                      setCustomSablon(sablon);
                      setSelectedSablon(null);
                      // OTOMATİK OLARAK SONRAKİ ADIMA GEÇ
                      setCurrentStep(4);
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* ADIM 4: Veri Yükle */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <OptikVeriParser
                  sablon={selectedSablon || (customSablon ? { ...customSablon, id: 'temp' } as OptikSablon : null)}
                  ogrenciListesi={ogrenciListesi}
                  onParsed={(data) => setParsedOgrenciler(data)}
                  onMatchStudents={(matches) => setMatchedData(matches)}
                  onContinue={() => {
                    console.log('✅ Adım 5\'e geçiliyor...');
                    setCurrentStep(5);
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* ADIM 5: Önizleme */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Özet */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Sınav Özeti
                </h2>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-700">{sonuclar.length}</div>
                    <div className="text-sm text-slate-500">Öğrenci</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-600">{cevapAnahtari.length}</div>
                    <div className="text-sm text-slate-500">Soru</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">
                      {sonuclar.length > 0 ? (sonuclar.reduce((a, b) => a + b.toplamNet, 0) / sonuclar.length).toFixed(2) : 0}
                    </div>
                    <div className="text-sm text-slate-500">Ortalama Net</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">
                      {sonuclar.length > 0 ? Math.max(...sonuclar.map(s => s.toplamNet)).toFixed(2) : 0}
                    </div>
                    <div className="text-sm text-slate-500">En Yüksek Net</div>
                  </div>
                </div>

                {/* Test/Ders Bazlı İstatistikler */}
                {sonuclar.length > 0 && sonuclar[0]?.dersBazli && (
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      📊 Ders Bazlı Ortalamalar
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {(() => {
                        // Tüm öğrencilerin ders sonuçlarını topla
                        const dersOrtalama: Record<string, { toplamNet: number; toplamBasari: number; sayi: number; dersAdi: string }> = {};
                        
                        sonuclar.forEach(s => {
                          s.dersBazli?.forEach((d: any) => {
                            if (!dersOrtalama[d.dersKodu]) {
                              dersOrtalama[d.dersKodu] = { toplamNet: 0, toplamBasari: 0, sayi: 0, dersAdi: d.dersAdi };
                            }
                            dersOrtalama[d.dersKodu].toplamNet += d.net;
                            dersOrtalama[d.dersKodu].toplamBasari += d.basariOrani || 0;
                            dersOrtalama[d.dersKodu].sayi++;
                          });
                        });

                        return Object.entries(dersOrtalama).map(([kod, veri]) => (
                          <div key={kod} className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                            <div className="text-xs font-semibold text-slate-500 mb-1">{veri.dersAdi}</div>
                            <div className="text-lg font-bold text-slate-800">
                              {(veri.toplamNet / veri.sayi).toFixed(2)}
                            </div>
                            <div className="text-xs text-emerald-600">
                              %{Math.round(veri.toplamBasari / veri.sayi)} başarı
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* İlk 5 Öğrenci */}
                {sonuclar.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      🏆 İlk 5 Öğrenci
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Sıra</th>
                            <th className="px-4 py-3 text-left font-semibold">Öğrenci</th>
                            <th className="px-4 py-3 text-center font-semibold">D</th>
                            <th className="px-4 py-3 text-center font-semibold">Y</th>
                            <th className="px-4 py-3 text-center font-semibold">B</th>
                            <th className="px-4 py-3 text-center font-semibold">Net</th>
                            <th className="px-4 py-3 text-center font-semibold">Puan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sonuclar.slice(0, 5).map((sonuc, i) => (
                            <tr key={i} className={`border-t border-slate-100 ${i === 0 ? 'bg-yellow-50' : i === 1 ? 'bg-slate-50' : i === 2 ? 'bg-amber-50' : ''}`}>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                  i === 0 ? 'bg-yellow-400 text-yellow-900' :
                                  i === 1 ? 'bg-slate-300 text-slate-700' :
                                  i === 2 ? 'bg-amber-300 text-amber-900' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {sonuc.siralama}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium">{cleanName(sonuc.ogrenciAdi) || sonuc.ogrenciNo}</td>
                              <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{sonuc.toplamDogru}</td>
                              <td className="px-4 py-3 text-center text-red-500 font-semibold">{sonuc.toplamYanlis}</td>
                              <td className="px-4 py-3 text-center text-slate-400">{sonuc.toplamBos}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">{sonuc.toplamNet.toFixed(2)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                                  {(sonuc.toplamPuan || sonuc.toplamNet * 5).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Kaydet */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Her Şey Hazır!</h3>
                    <p className="text-emerald-100">Sınavı kaydetmek için butona tıklayın</p>
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Sınavı Kaydet ve Sonuçları Görüntüle
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Geri
          </button>

          <div className="text-sm text-slate-500">
            {STEPS[currentStep - 1].description}
          </div>

          {currentStep < STEPS.length ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
            >
              Devam Et
              <ChevronRight size={20} />
            </button>
          ) : (
            <div /> // Placeholder
          )}
        </div>
      </div>
    </div>
  );
}

