'use client';

/**
 * Step 3 - Optik Şablon Yönetimi
 * K12net Tarzı Modern Tasarım
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileSpreadsheet, Check, SkipForward, Settings, Plus, Trash2,
  Eye, Save, ArrowRight, Layers, Scan, Zap, Copy, AlertCircle,
  ChevronDown, GripVertical, RotateCcw, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EAOptikSablon } from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step3Props {
  wizard: UseExamWizardReturn;
  organizationId: string;
}

// Alan tipi
type AlanTipi = 
  | 'ogrenci_no' | 'tc_kimlik' | 'ad_soyad' | 'ad' | 'soyad'
  | 'sinif' | 'sube' | 'kurum_kodu' | 'okul_no'
  | 'kitapcik' | 'cinsiyet' | 'cevaplar' | 'bos';

interface AlanTanimi {
  id: string;
  tip: AlanTipi;
  etiket: string;
  baslangic: number;
  uzunluk: number;
  zorunlu: boolean;
}

// K12net standart alan tanımları
const K12NET_ALANLAR: Omit<AlanTanimi, 'id' | 'baslangic'>[] = [
  { tip: 'kurum_kodu', etiket: 'Kurum Kodu', uzunluk: 8, zorunlu: true },
  { tip: 'ogrenci_no', etiket: 'Öğrenci No', uzunluk: 10, zorunlu: true },
  { tip: 'tc_kimlik', etiket: 'T.C. Kimlik No', uzunluk: 11, zorunlu: false },
  { tip: 'ad_soyad', etiket: 'Ad Soyad', uzunluk: 30, zorunlu: true },
  { tip: 'sinif', etiket: 'Sınıf', uzunluk: 2, zorunlu: true },
  { tip: 'sube', etiket: 'Şube', uzunluk: 2, zorunlu: true },
  { tip: 'cinsiyet', etiket: 'Cinsiyet', uzunluk: 1, zorunlu: false },
  { tip: 'kitapcik', etiket: 'Kitapçık', uzunluk: 1, zorunlu: true },
  { tip: 'cevaplar', etiket: 'Cevaplar', uzunluk: 90, zorunlu: true },
];

// Alan renkleri
const ALAN_RENKLERI: Record<AlanTipi, { bg: string; text: string; border: string }> = {
  kurum_kodu: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  ogrenci_no: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  tc_kimlik: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  ad_soyad: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  ad: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  soyad: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  sinif: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  sube: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  okul_no: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  kitapcik: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
  cinsiyet: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  cevaplar: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
  bos: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' },
};

// Hazır şablon presetleri
const HAZIR_PRESETLER = [
  { id: 'k12net', adi: 'K12Net Standart', satirUzunlugu: 155, ikon: '🏫' },
  { id: 'lgs', adi: 'LGS (90 Soru)', satirUzunlugu: 150, ikon: '📝' },
  { id: 'tyt', adi: 'TYT (120 Soru)', satirUzunlugu: 180, ikon: '📚' },
  { id: 'bos', adi: 'Boş Şablon', satirUzunlugu: 200, ikon: '✨' },
];

export function Step3OptikSablon({ wizard, organizationId }: Step3Props) {
  const { state, setOptikSablon, skipOptikSablon } = wizard;
  const { step3 } = state;

  // Tab
  const [activeTab, setActiveTab] = useState<'hazir' | 'ozel' | 'ocr'>('hazir');
  
  // Hazır şablonlar
  const [sablonlar, setSablonlar] = useState<EAOptikSablon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Özel şablon
  const [sablonAdi, setSablonAdi] = useState('');
  const [satirUzunlugu, setSatirUzunlugu] = useState(155);
  const [alanlar, setAlanlar] = useState<AlanTanimi[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Şablonları yükle
  useEffect(() => {
    const fetchSablonlar = async () => {
      setYukleniyor(true);
      try {
        const res = await fetch(`/api/admin/exam-analytics/optik-sablonlar?organizationId=${organizationId}`);
        if (res.ok) {
          const json = await res.json();
          setSablonlar(json.data || []);
        }
      } catch (err) {
        // Mock fallback
        setSablonlar([
          {
            id: 'default-k12',
            organization_id: null,
            sablon_adi: 'K12Net Standart',
            aciklama: '9 alan, 155 karakter',
            format_tipi: 'fixed_width',
            satir_uzunlugu: 155,
            alan_tanimlari: K12NET_ALANLAR,
            cevap_baslangic: 65,
            cevap_uzunluk: 90,
            is_active: true,
            is_default: true,
          },
        ]);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchSablonlar();
  }, [organizationId]);

  // Hazır preset uygula
  const applyPreset = useCallback((presetId: string) => {
    const preset = HAZIR_PRESETLER.find(p => p.id === presetId);
    if (!preset) return;

    setSatirUzunlugu(preset.satirUzunlugu);
    setSablonAdi(`${preset.adi} - Özel`);

    if (presetId === 'bos') {
      setAlanlar([]);
      return;
    }

    // K12net varsayılan alanları uygula
    let baslangic = 1;
    const yeniAlanlar: AlanTanimi[] = K12NET_ALANLAR.map((alan, index) => {
      const yeniAlan: AlanTanimi = {
        id: `alan-${index}`,
        ...alan,
        baslangic,
      };
      baslangic += alan.uzunluk;
      return yeniAlan;
    });

    // LGS için cevap uzunluğunu 90 yap
    if (presetId === 'lgs') {
      const cevapIndex = yeniAlanlar.findIndex(a => a.tip === 'cevaplar');
      if (cevapIndex >= 0) {
        yeniAlanlar[cevapIndex].uzunluk = 90;
      }
    }

    // TYT için cevap uzunluğunu 120 yap
    if (presetId === 'tyt') {
      const cevapIndex = yeniAlanlar.findIndex(a => a.tip === 'cevaplar');
      if (cevapIndex >= 0) {
        yeniAlanlar[cevapIndex].uzunluk = 120;
      }
    }

    setAlanlar(yeniAlanlar);
  }, []);

  // Alan ekle
  const addAlan = useCallback((tip: AlanTipi) => {
    const defaults: Record<AlanTipi, { etiket: string; uzunluk: number; zorunlu: boolean }> = {
      kurum_kodu: { etiket: 'Kurum Kodu', uzunluk: 8, zorunlu: true },
      ogrenci_no: { etiket: 'Öğrenci No', uzunluk: 10, zorunlu: true },
      tc_kimlik: { etiket: 'T.C. Kimlik No', uzunluk: 11, zorunlu: false },
      ad_soyad: { etiket: 'Ad Soyad', uzunluk: 30, zorunlu: true },
      ad: { etiket: 'Ad', uzunluk: 15, zorunlu: false },
      soyad: { etiket: 'Soyad', uzunluk: 15, zorunlu: false },
      sinif: { etiket: 'Sınıf', uzunluk: 2, zorunlu: true },
      sube: { etiket: 'Şube', uzunluk: 2, zorunlu: true },
      okul_no: { etiket: 'Okul No', uzunluk: 6, zorunlu: false },
      kitapcik: { etiket: 'Kitapçık', uzunluk: 1, zorunlu: true },
      cinsiyet: { etiket: 'Cinsiyet', uzunluk: 1, zorunlu: false },
      cevaplar: { etiket: 'Cevaplar', uzunluk: 90, zorunlu: true },
      bos: { etiket: 'Boş Alan', uzunluk: 5, zorunlu: false },
    };

    const config = defaults[tip];
    const sonBitis = alanlar.length > 0 
      ? alanlar.reduce((max, a) => Math.max(max, a.baslangic + a.uzunluk - 1), 0)
      : 0;

    const yeniAlan: AlanTanimi = {
      id: `alan-${Date.now()}`,
      tip,
      ...config,
      baslangic: sonBitis + 1,
    };

    setAlanlar(prev => [...prev, yeniAlan]);
  }, [alanlar]);

  // Alan sil
  const deleteAlan = useCallback((id: string) => {
    setAlanlar(prev => {
      const filtered = prev.filter(a => a.id !== id);
      // Pozisyonları yeniden hesapla
      let baslangic = 1;
      return filtered.map(alan => {
        const updated = { ...alan, baslangic };
        baslangic += alan.uzunluk;
        return updated;
      });
    });
  }, []);

  // Alan güncelle
  const updateAlan = useCallback((id: string, field: keyof AlanTanimi, value: any) => {
    setAlanlar(prev => {
      const updated = prev.map(alan => 
        alan.id === id ? { ...alan, [field]: value } : alan
      );
      
      // Uzunluk değiştiyse pozisyonları yeniden hesapla
      if (field === 'uzunluk') {
        let baslangic = 1;
        return updated.map(alan => {
          const result = { ...alan, baslangic };
          baslangic += alan.uzunluk;
          return result;
        });
      }
      
      return updated;
    });
  }, []);

  // Sıfırla
  const resetAlanlar = useCallback(() => {
    setAlanlar([]);
    setSablonAdi('');
  }, []);

  // Kaydet
  const handleSave = async () => {
    if (!sablonAdi.trim()) {
      alert('Şablon adı gerekli');
      return;
    }
    if (alanlar.length === 0) {
      alert('En az 1 alan tanımlamalısınız');
      return;
    }

    setKaydediliyor(true);
    try {
      const cevapAlan = alanlar.find(a => a.tip === 'cevaplar');
      
      const res = await fetch('/api/admin/exam-analytics/optik-sablonlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sablonAdi: sablonAdi.trim(),
          formatTipi: 'fixed_width',
          satirUzunlugu: toplam,
          alanTanimlari: alanlar,
          cevapBaslangic: cevapAlan?.baslangic || 0,
          cevapUzunluk: cevapAlan?.uzunluk || 0,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setOptikSablon(json.sablonId);
        setActiveTab('hazir');
        resetAlanlar();
      } else {
        const json = await res.json();
        alert(`Hata: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKaydediliyor(false);
    }
  };

  // Toplam karakter
  const toplam = useMemo(() => {
    if (alanlar.length === 0) return 0;
    return alanlar.reduce((max, a) => Math.max(max, a.baslangic + a.uzunluk - 1), 0);
  }, [alanlar]);

  // Örnek veri
  const ornekVeri = useMemo(() => {
    const ornekler: Record<AlanTipi, string> = {
      kurum_kodu: '12345678',
      ogrenci_no: '1234567890',
      tc_kimlik: '12345678901',
      ad_soyad: 'AHMET YILMAZ',
      ad: 'AHMET',
      soyad: 'YILMAZ',
      sinif: '8',
      sube: 'A',
      okul_no: '123456',
      kitapcik: 'A',
      cinsiyet: 'E',
      cevaplar: 'ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD',
      bos: '',
    };

    return alanlar.map(alan => {
      const ornek = ornekler[alan.tip] || '';
      return ornek.padEnd(alan.uzunluk, ' ').substring(0, alan.uzunluk);
    }).join('');
  }, [alanlar]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Optik Şablon</h2>
            <p className="text-sm text-gray-500">TXT dosyası format yapısını tanımlayın</p>
          </div>
        </div>
        
        <button
          onClick={skipOptikSablon}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Atla
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { id: 'hazir', label: 'Hazır Şablonlar', icon: Layers },
          { id: 'ozel', label: 'Özel Şablon', icon: Settings },
          { id: 'ocr', label: 'OCR', icon: Scan, badge: 'Yakında' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && (
              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-xs rounded">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HAZIR ŞABLONLAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hazir' && (
        <div className="grid gap-3">
          {yukleniyor ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            sablonlar.map((sablon) => (
              <button
                key={sablon.id}
                onClick={() => setOptikSablon(sablon.id)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                  step3.optikSablonId === sablon.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 hover:border-blue-300'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  step3.optikSablonId === sablon.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                )}>
                  {step3.optikSablonId === sablon.id && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{sablon.sablon_adi}</span>
                    {sablon.is_default && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Varsayılan
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{sablon.aciklama}</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{sablon.satir_uzunlugu} karakter</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ÖZEL ŞABLON */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ozel' && (
        <div className="space-y-6">
          {/* Hızlı Başlat */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Hızlı Başlat</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {HAZIR_PRESETLER.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <span>{preset.ikon}</span>
                  <span className="font-medium text-gray-700">{preset.adi}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Şablon Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Şablon Adı *
              </label>
              <input
                type="text"
                value={sablonAdi}
                onChange={(e) => setSablonAdi(e.target.value)}
                placeholder="Örn: Dikmen Çözüm LGS"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Toplam Karakter
              </label>
              <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-mono">
                {toplam} / {satirUzunlugu}
              </div>
            </div>
          </div>

          {/* Hızlı Alan Ekleme */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">Hızlı Alan Ekle</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { tip: 'kurum_kodu' as AlanTipi, label: 'Kurum Kodu' },
                { tip: 'ogrenci_no' as AlanTipi, label: 'Öğrenci No' },
                { tip: 'tc_kimlik' as AlanTipi, label: 'TC Kimlik' },
                { tip: 'ad_soyad' as AlanTipi, label: 'Ad Soyad' },
                { tip: 'sinif' as AlanTipi, label: 'Sınıf' },
                { tip: 'sube' as AlanTipi, label: 'Şube' },
                { tip: 'cinsiyet' as AlanTipi, label: 'Cinsiyet' },
                { tip: 'kitapcik' as AlanTipi, label: 'Kitapçık' },
                { tip: 'cevaplar' as AlanTipi, label: 'Cevaplar' },
                { tip: 'bos' as AlanTipi, label: 'Boş' },
              ].map((item) => {
                const renk = ALAN_RENKLERI[item.tip];
                return (
                  <button
                    key={item.tip}
                    onClick={() => addAlan(item.tip)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:scale-105',
                      renk.bg, renk.text, renk.border
                    )}
                  >
                    + {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alan Listesi */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Alan Tanımları</span>
                <span className="text-sm text-gray-500">({alanlar.length} alan)</span>
              </div>
              {alanlar.length > 0 && (
                <button
                  onClick={resetAlanlar}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Sıfırla
                </button>
              )}
            </div>

            {alanlar.length === 0 ? (
              <div className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Yukarıdan hazır preset seçin veya alan ekleyin
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {alanlar.map((alan, index) => {
                  const renk = ALAN_RENKLERI[alan.tip];
                  const bitis = alan.baslangic + alan.uzunluk - 1;
                  
                  return (
                    <div
                      key={alan.id}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* Sıra */}
                      <div className="flex items-center gap-2 w-8">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-400">{index + 1}</span>
                      </div>

                      {/* Alan Tipi Badge */}
                      <div className={cn(
                        'px-3 py-1 rounded-lg text-sm font-medium min-w-[100px] text-center',
                        renk.bg, renk.text
                      )}>
                        {alan.etiket}
                      </div>

                      {/* Pozisyon */}
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                          <span className="text-xs text-gray-500">Pos:</span>
                          <span className="font-mono font-medium text-gray-700">
                            {alan.baslangic}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="font-mono font-medium text-gray-700">
                            {bitis}
                          </span>
                        </div>

                        {/* Uzunluk */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={alan.uzunluk}
                            onChange={(e) => updateAlan(alan.id, 'uzunluk', parseInt(e.target.value) || 1)}
                            min={1}
                            max={200}
                            className="w-16 px-2 py-1 border rounded-lg text-center font-mono text-sm"
                          />
                          <span className="text-xs text-gray-400">kar.</span>
                        </div>

                        {/* Zorunlu */}
                        {alan.zorunlu && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                            Zorunlu
                          </span>
                        )}
                      </div>

                      {/* Sil */}
                      <button
                        onClick={() => deleteAlan(alan.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Görsel Önizleme */}
          {alanlar.length > 0 && showPreview && (
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Önizleme</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  Toplam: {toplam} karakter
                </span>
              </div>
              
              {/* Renkli alan gösterimi */}
              <div className="flex mb-2">
                {alanlar.map((alan) => {
                  const renk = ALAN_RENKLERI[alan.tip];
                  return (
                    <div
                      key={alan.id}
                      className={cn(
                        'h-6 flex items-center justify-center text-xs font-medium truncate',
                        renk.bg, renk.text
                      )}
                      style={{ width: `${(alan.uzunluk / toplam) * 100}%`, minWidth: '20px' }}
                      title={`${alan.etiket} (${alan.baslangic}-${alan.baslangic + alan.uzunluk - 1})`}
                    >
                      {alan.uzunluk > 5 && alan.etiket}
                    </div>
                  );
                })}
              </div>

              {/* Örnek veri */}
              <div className="font-mono text-sm text-green-400 whitespace-pre bg-gray-800 px-3 py-2 rounded-lg overflow-x-auto">
                {ornekVeri || 'Alan ekleyin...'}
              </div>
            </div>
          )}

          {/* Kaydet */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={resetAlanlar}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Temizle
            </button>
            <button
              onClick={handleSave}
              disabled={!sablonAdi.trim() || alanlar.length === 0 || kaydediliyor}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
            >
              <Save className="w-4 h-4" />
              {kaydediliyor ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* OCR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ocr' && (
        <div className="p-16 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
          <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">OCR - Yakında</h3>
          <p className="text-gray-500">Taranmış formları otomatik okuyun</p>
        </div>
      )}

      {/* Durum */}
      <div className={cn(
        'p-4 rounded-xl flex items-center gap-3',
        step3.isCompleted 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
          : 'bg-gray-50 border-2 border-gray-200'
      )}>
        {step3.isCompleted ? (
          <>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <span className="text-green-800 font-semibold block">
                {step3.optikSablonId 
                  ? `Şablon seçildi`
                  : 'Şablonsuz devam edilecek'
                }
              </span>
              <span className="text-green-600 text-sm">İleri butonuna tıklayabilirsiniz</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <span className="text-gray-700 font-medium block">Şablon seçilmedi</span>
              <span className="text-gray-500 text-sm">Bir şablon seçin veya atlayın</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
