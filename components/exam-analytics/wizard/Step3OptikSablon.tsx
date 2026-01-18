'use client';

/**
 * Step 3 - Optik Şablon Yönetimi
 * YARATICI MODERN TASARIM
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileSpreadsheet, Check, SkipForward, Settings, Plus, Trash2,
  Eye, Save, ArrowRight, Layers, Scan, Zap, Copy, AlertCircle,
  ChevronDown, ChevronRight, GripVertical, RotateCcw, Sparkles,
  Download, Upload, Palette, Grid3X3, BookOpen, Target, Edit3
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
  | 'kitapcik' | 'cinsiyet' | 'cevaplar' | 'cep_tel' | 'bos';

interface AlanTanimi {
  id: string;
  tip: AlanTipi;
  etiket: string;
  baslangic: number;
  uzunluk: number;
  zorunlu: boolean;
  ikon: string;
}

// Alan konfigürasyonları
const ALAN_CONFIG: Record<AlanTipi, { etiket: string; uzunluk: number; zorunlu: boolean; ikon: string; renk: string }> = {
  tc_kimlik: { etiket: 'T.C. Kimlik No', uzunluk: 11, zorunlu: true, ikon: '🆔', renk: 'from-violet-500 to-purple-600' },
  ogrenci_no: { etiket: 'Öğrenci No', uzunluk: 10, zorunlu: true, ikon: '🎓', renk: 'from-blue-500 to-cyan-600' },
  ad_soyad: { etiket: 'Ad Soyad', uzunluk: 25, zorunlu: true, ikon: '👤', renk: 'from-emerald-500 to-teal-600' },
  ad: { etiket: 'Ad', uzunluk: 15, zorunlu: false, ikon: '📝', renk: 'from-green-500 to-emerald-600' },
  soyad: { etiket: 'Soyad', uzunluk: 15, zorunlu: false, ikon: '📝', renk: 'from-teal-500 to-green-600' },
  sinif: { etiket: 'Sınıf', uzunluk: 2, zorunlu: true, ikon: '🏫', renk: 'from-amber-500 to-orange-600' },
  sube: { etiket: 'Şube', uzunluk: 1, zorunlu: true, ikon: '🔤', renk: 'from-orange-500 to-red-600' },
  kurum_kodu: { etiket: 'Kurum Kodu', uzunluk: 8, zorunlu: true, ikon: '🏢', renk: 'from-indigo-500 to-blue-600' },
  okul_no: { etiket: 'Okul No', uzunluk: 6, zorunlu: false, ikon: '🔢', renk: 'from-cyan-500 to-blue-600' },
  cep_tel: { etiket: 'Cep Telefonu', uzunluk: 11, zorunlu: false, ikon: '📱', renk: 'from-pink-500 to-rose-600' },
  kitapcik: { etiket: 'Kitapçık', uzunluk: 1, zorunlu: true, ikon: '📖', renk: 'from-rose-500 to-pink-600' },
  cinsiyet: { etiket: 'Cinsiyet', uzunluk: 1, zorunlu: false, ikon: '⚧', renk: 'from-fuchsia-500 to-purple-600' },
  cevaplar: { etiket: 'Cevaplar', uzunluk: 90, zorunlu: true, ikon: '✅', renk: 'from-sky-500 to-blue-600' },
  bos: { etiket: 'Boş Alan', uzunluk: 5, zorunlu: false, ikon: '⬜', renk: 'from-gray-400 to-gray-500' },
};

// Sınıf bazlı hazır şablonlar
const SINIF_SABLONLARI = [
  { id: '4', label: '4. Sınıf', soruSayisi: 40 },
  { id: '5', label: '5. Sınıf', soruSayisi: 40 },
  { id: '6', label: '6. Sınıf', soruSayisi: 60 },
  { id: '7', label: '7. Sınıf', soruSayisi: 60 },
  { id: '8-lgs', label: '8. Sınıf (LGS)', soruSayisi: 90, vurgulu: true },
  { id: '9', label: '9. Sınıf', soruSayisi: 80 },
  { id: '10', label: '10. Sınıf', soruSayisi: 80 },
  { id: '11', label: '11. Sınıf', soruSayisi: 80 },
  { id: '12-tyt', label: '12. Sınıf (TYT)', soruSayisi: 120 },
  { id: '12-ayt', label: '12. Sınıf (AYT)', soruSayisi: 80 },
];

export function Step3OptikSablon({ wizard, organizationId }: Step3Props) {
  const { state, setOptikSablon, skipOptikSablon } = wizard;
  const { step3 } = state;

  // Tab
  const [activeTab, setActiveTab] = useState<'hazir' | 'ozel' | 'ocr'>('ozel');
  
  // Hazır şablonlar
  const [sablonlar, setSablonlar] = useState<EAOptikSablon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Özel şablon
  const [sablonAdi, setSablonAdi] = useState('');
  const [satirUzunlugu, setSatirUzunlugu] = useState(200);
  const [soruSayisi, setSoruSayisi] = useState(90);
  const [alanlar, setAlanlar] = useState<AlanTanimi[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [secilenSinif, setSecilenSinif] = useState<string | null>(null);
  const [editingAlan, setEditingAlan] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(true);

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
      } catch {
        setSablonlar([]);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchSablonlar();
  }, [organizationId]);

  // Sınıf seçildiğinde varsayılan alanları yükle
  const handleSinifSelect = useCallback((sinifId: string) => {
    setSecilenSinif(sinifId);
    const sinif = SINIF_SABLONLARI.find(s => s.id === sinifId);
    if (!sinif) return;

    setSoruSayisi(sinif.soruSayisi);
    setSablonAdi(`${sinif.label} Şablonu`);

    // Varsayılan alanları oluştur
    const varsayilanAlanlar: AlanTanimi[] = [
      { id: 'tc', tip: 'tc_kimlik', ...ALAN_CONFIG.tc_kimlik, baslangic: 1 },
      { id: 'ogrno', tip: 'ogrenci_no', ...ALAN_CONFIG.ogrenci_no, baslangic: 12 },
      { id: 'adsoyad', tip: 'ad_soyad', ...ALAN_CONFIG.ad_soyad, baslangic: 22, uzunluk: 20 },
      { id: 'sinif', tip: 'sinif', ...ALAN_CONFIG.sinif, baslangic: 42 },
      { id: 'sube', tip: 'sube', ...ALAN_CONFIG.sube, baslangic: 44 },
      { id: 'kurum', tip: 'kurum_kodu', ...ALAN_CONFIG.kurum_kodu, baslangic: 45 },
      { id: 'tel', tip: 'cep_tel', ...ALAN_CONFIG.cep_tel, baslangic: 53 },
      { id: 'cins', tip: 'cinsiyet', ...ALAN_CONFIG.cinsiyet, baslangic: 64 },
      { id: 'kit', tip: 'kitapcik', ...ALAN_CONFIG.kitapcik, baslangic: 65 },
      { id: 'cevap', tip: 'cevaplar', ...ALAN_CONFIG.cevaplar, baslangic: 66, uzunluk: sinif.soruSayisi },
    ];

    setAlanlar(varsayilanAlanlar);
  }, []);

  // Alan ekle
  const addAlan = useCallback((tip: AlanTipi) => {
    const config = ALAN_CONFIG[tip];
    const sonBitis = alanlar.length > 0 
      ? Math.max(...alanlar.map(a => a.baslangic + a.uzunluk - 1))
      : 0;

    const yeniAlan: AlanTanimi = {
      id: `alan-${Date.now()}`,
      tip,
      etiket: config.etiket,
      ikon: config.ikon,
      zorunlu: config.zorunlu,
      uzunluk: config.uzunluk,
      baslangic: sonBitis + 1,
    };

    setAlanlar(prev => [...prev, yeniAlan]);
  }, [alanlar]);

  // Alan sil
  const deleteAlan = useCallback((id: string) => {
    setAlanlar(prev => prev.filter(a => a.id !== id));
  }, []);

  // Alan güncelle
  const updateAlan = useCallback((id: string, updates: Partial<AlanTanimi>) => {
    setAlanlar(prev => prev.map(alan => 
      alan.id === id ? { ...alan, ...updates } : alan
    ));
  }, []);

  // Pozisyonları yeniden hesapla
  const recalculatePositions = useCallback(() => {
    setAlanlar(prev => {
      let baslangic = 1;
      return prev.map(alan => {
        const updated = { ...alan, baslangic };
        baslangic += alan.uzunluk;
        return updated;
      });
    });
  }, []);

  // Toplam karakter
  const toplam = useMemo(() => {
    if (alanlar.length === 0) return 0;
    return Math.max(...alanlar.map(a => a.baslangic + a.uzunluk - 1));
  }, [alanlar]);

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
        alert('✅ Şablon kaydedildi!');
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

  return (
    <div className="min-h-[600px] bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Grid3X3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Yeni Sınav Ekle
              </h2>
              <p className="text-sm text-gray-500">Optik Şablon Tasarımı</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Otomatik Kaydetme */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
              autoSave ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                autoSave ? 'bg-green-500' : 'bg-gray-400'
              )} />
              {autoSave ? 'Otomatik kaydediliyor' : 'Manuel kayıt'}
            </div>

            <button
              onClick={skipOptikSablon}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <SkipForward className="w-4 h-4" />
              Atla
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 p-1.5 bg-gray-100/80 rounded-2xl w-fit">
          {[
            { id: 'hazir', label: 'Hazır Şablonlar', icon: Layers },
            { id: 'ozel', label: 'Özel Şablon', icon: Settings },
            { id: 'ocr', label: 'OCR (Fotoğraf)', icon: Scan, badge: 'Yakında' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ÖZEL ŞABLON - ANA İÇERİK */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ozel' && (
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="grid grid-cols-12 gap-6">
            
            {/* SOL PANEL - Sınıf Seçimi */}
            <div className="col-span-3 space-y-4">
              {/* Şablon Bilgileri */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <input
                    type="text"
                    value={sablonAdi}
                    onChange={(e) => setSablonAdi(e.target.value)}
                    placeholder="Şablon adı girin..."
                    className="flex-1 bg-transparent border-none focus:outline-none font-medium text-gray-800"
                  />
                </div>

                <div className="flex gap-4 text-sm">
                  <button className="text-blue-600 hover:underline">Kaydet</button>
                  <button className="text-gray-500 hover:underline">Düzenle</button>
                  <button className="text-red-500 hover:underline">Sil</button>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Satır:</span>
                    <input
                      type="number"
                      value={satirUzunlugu}
                      onChange={(e) => setSatirUzunlugu(parseInt(e.target.value) || 200)}
                      className="w-16 px-2 py-1 bg-gray-50 border rounded-lg text-center font-bold text-blue-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Soru:</span>
                    <input
                      type="number"
                      value={soruSayisi}
                      onChange={(e) => setSoruSayisi(parseInt(e.target.value) || 90)}
                      className="w-16 px-2 py-1 bg-gray-50 border rounded-lg text-center font-bold text-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Sınıf / Sınav Türü */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Sınıf / Sınav Türü
                  </div>
                </div>
                
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {SINIF_SABLONLARI.map((sinif) => (
                    <button
                      key={sinif.id}
                      onClick={() => handleSinifSelect(sinif.id)}
                      className={cn(
                        'w-full px-4 py-3 text-left flex items-center justify-between transition-all',
                        secilenSinif === sinif.id
                          ? sinif.vurgulu 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <span className={cn(
                        'font-medium',
                        secilenSinif === sinif.id && sinif.vurgulu && 'text-white'
                      )}>
                        {sinif.label}
                      </span>
                      <ChevronRight className={cn(
                        'w-4 h-4',
                        secilenSinif === sinif.id 
                          ? sinif.vurgulu ? 'text-white' : 'text-blue-500' 
                          : 'text-gray-300'
                      )} />
                    </button>
                  ))}
                </div>

                {/* Hazır Şablonlar Dropdown */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                    Hazır Şablonlar:
                  </div>
                  <select className="w-full px-3 py-2 border rounded-xl bg-white text-sm">
                    <option>SEÇİNİZ</option>
                    <option>K12Net Standart</option>
                    <option>MEB Standart</option>
                    <option>Özel Format 1</option>
                  </select>
                </div>

                {/* Seçili sınıf detayları */}
                {secilenSinif && (
                  <div className="p-4 border-t bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
                      Ders Alanları
                    </div>
                    <div className="space-y-2">
                      {['Türkçe', 'Matematik', 'Fen Bilimleri', 'İnkılap', 'İngilizce', 'Din Kültürü'].map((ders, i) => (
                        <div key={ders} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                          <span className="flex-1">{ders}</span>
                          <span className="text-gray-400 font-mono text-xs">
                            {i * 15 + 1}-{(i + 1) * 15}
                          </span>
                          <span className="text-gray-400 font-mono text-xs">15</span>
                          <button className="text-red-400 hover:text-red-600">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SAĞ PANEL - Alan Tanımları */}
            <div className="col-span-9 space-y-4">
              {/* Hızlı Alan Ekleme */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    ŞABLON ALANLARI
                  </h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                      <span className="w-4 h-4">⬜</span>
                      Boşluk
                    </button>
                    <button 
                      onClick={() => addAlan('ad_soyad')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                      Alan Ekle
                    </button>
                  </div>
                </div>

                {/* Alan Tablosu */}
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3 font-semibold">Alan Adı</th>
                        <th className="px-4 py-3 font-semibold text-center">Başlangıç</th>
                        <th className="px-4 py-3 font-semibold text-center">Bitiş</th>
                        <th className="px-4 py-3 font-semibold text-center">Uzunluk</th>
                        <th className="px-4 py-3 font-semibold w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {alanlar.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            Sol menüden sınıf seçin veya alan ekleyin
                          </td>
                        </tr>
                      ) : (
                        alanlar.map((alan) => {
                          const config = ALAN_CONFIG[alan.tip];
                          const bitis = alan.baslangic + alan.uzunluk - 1;
                          
                          return (
                            <tr key={alan.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{config.ikon}</span>
                                  <span className="font-medium text-gray-800">{alan.etiket}</span>
                                  {alan.zorunlu && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                                      Zorunlu
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={alan.baslangic}
                                  onChange={(e) => updateAlan(alan.id, { baslangic: parseInt(e.target.value) || 1 })}
                                  className="w-16 px-2 py-1.5 border rounded-lg text-center font-mono text-blue-600 bg-blue-50"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-mono">
                                  {bitis}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={alan.uzunluk}
                                  onChange={(e) => updateAlan(alan.id, { uzunluk: parseInt(e.target.value) || 1 })}
                                  className="w-16 px-2 py-1.5 border rounded-lg text-center font-mono"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => deleteAlan(alan.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Görsel Harita */}
              {alanlar.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Görsel Harita
                    </h3>
                    <span className="text-sm text-gray-500 font-mono">
                      Toplam: {toplam} karakter
                    </span>
                  </div>

                  {/* Renkli bloklar */}
                  <div className="flex rounded-xl overflow-hidden h-12 mb-3">
                    {alanlar.map((alan) => {
                      const config = ALAN_CONFIG[alan.tip];
                      const width = Math.max((alan.uzunluk / toplam) * 100, 2);
                      
                      return (
                        <div
                          key={alan.id}
                          className={cn(
                            'flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-90 cursor-pointer',
                            `bg-gradient-to-r ${config.renk}`
                          )}
                          style={{ width: `${width}%` }}
                          title={`${alan.etiket}: ${alan.baslangic}-${alan.baslangic + alan.uzunluk - 1}`}
                        >
                          {width > 8 && (
                            <span className="truncate px-1">
                              {config.ikon} {alan.uzunluk > 10 && alan.etiket}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pozisyon cetveli */}
                  <div className="flex text-[10px] text-gray-400 font-mono">
                    {[1, 25, 50, 75, 100, 125, 150, 175, 200].filter(n => n <= toplam + 20).map(n => (
                      <div 
                        key={n} 
                        className="flex-1 text-center border-l border-gray-200 first:border-l-0"
                      >
                        {n}
                      </div>
                    ))}
                  </div>

                  {/* Örnek satır */}
                  <div className="mt-4 p-3 bg-gray-900 rounded-xl overflow-x-auto">
                    <div className="font-mono text-xs text-green-400 whitespace-pre">
                      {alanlar.map(alan => {
                        const ornekler: Record<AlanTipi, string> = {
                          tc_kimlik: '12345678901',
                          ogrenci_no: '1234567890',
                          ad_soyad: 'AHMET YILMAZ',
                          ad: 'AHMET',
                          soyad: 'YILMAZ',
                          sinif: '08',
                          sube: 'A',
                          kurum_kodu: '12345678',
                          okul_no: '123456',
                          cep_tel: '05321234567',
                          kitapcik: 'A',
                          cinsiyet: 'E',
                          cevaplar: 'ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD',
                          bos: '',
                        };
                        return (ornekler[alan.tip] || '').padEnd(alan.uzunluk, alan.tip === 'bos' ? ' ' : '█').substring(0, alan.uzunluk);
                      }).join('')}
                    </div>
                  </div>
                </div>
              )}

              {/* Alt Butonlar */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={recalculatePositions}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Pozisyonları Yeniden Hesapla
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAlanlar([])}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Temizle
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!sablonAdi.trim() || alanlar.length === 0 || kaydediliyor}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                  >
                    <Save className="w-4 h-4" />
                    {kaydediliyor ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HAZIR ŞABLONLAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hazir' && (
        <div className="max-w-4xl mx-auto px-6 pb-8">
          <div className="grid gap-3">
            {yukleniyor ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : sablonlar.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Henüz hazır şablon yok</p>
                <button 
                  onClick={() => setActiveTab('ozel')}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl"
                >
                  Özel Şablon Oluştur
                </button>
              </div>
            ) : (
              sablonlar.map((sablon) => (
                <button
                  key={sablon.id}
                  onClick={() => setOptikSablon(sablon.id)}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4',
                    step3.optikSablonId === sablon.id
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300'
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
                    <div className="font-semibold text-gray-900">{sablon.sablon_adi}</div>
                    <div className="text-sm text-gray-500">{sablon.aciklama}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* OCR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ocr' && (
        <div className="max-w-2xl mx-auto px-6 pb-8">
          <div className="p-16 text-center bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl border-2 border-dashed border-rose-200">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
              <Scan className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">OCR - Yakında</h3>
            <p className="text-gray-500 mb-6">Taranmış optik formları otomatik olarak okuyun</p>
            <div className="flex justify-center gap-4">
              <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600">
                📷 Fotoğraf yükle
              </div>
              <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600">
                🔍 Otomatik algıla
              </div>
              <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-600">
                ✨ AI destekli
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Durum */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className={cn(
          'p-4 rounded-2xl flex items-center gap-3',
          step3.isCompleted 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
            : 'bg-gray-50 border-2 border-gray-200'
        )}>
          {step3.isCompleted ? (
            <>
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-green-800 font-semibold block">
                  {step3.optikSablonId ? 'Şablon seçildi' : 'Şablonsuz devam edilecek'}
                </span>
                <span className="text-green-600 text-sm">İleri butonuna tıklayabilirsiniz</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
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
    </div>
  );
}
