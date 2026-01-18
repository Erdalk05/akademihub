'use client';

/**
 * Step 3 - Optik Şablon Yönetimi
 * 
 * 3 Ana Bölüm:
 * 1. Hazır Şablonlar - Sistem ve kurum şablonları
 * 2. Özel Şablon Oluştur - K12net tarzı alan tanımlama
 * 3. OCR - Optik karakter tanıma (gelecek)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileSpreadsheet, Check, SkipForward, Settings, Info, Plus, Trash2,
  GripVertical, Eye, Save, ArrowRight, ArrowLeft, Layers, Scan,
  ChevronDown, ChevronRight, Edit2, Copy, AlertCircle, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EAOptikSablon } from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step3Props {
  wizard: UseExamWizardReturn;
  organizationId: string;
}

// Alan türleri
type AlanTipi = 
  | 'ogrenci_no' 
  | 'tc_kimlik' 
  | 'ad_soyad' 
  | 'ad' 
  | 'soyad'
  | 'sinif' 
  | 'sube' 
  | 'kurum_kodu'
  | 'cep_no'
  | 'kitapcik'
  | 'cinsiyet'
  | 'cevaplar'
  | 'ders_cevap'
  | 'bos'
  | 'ozel';

interface AlanTanimi {
  id: string;
  tip: AlanTipi;
  etiket: string;
  baslangic: number;
  uzunluk: number;
  bitis: number; // Computed: baslangic + uzunluk - 1
  zorunlu: boolean;
  varsayilan?: string;
  dersKodu?: string; // Ders cevapları için
  aciklama?: string;
}

// Alan tipi seçenekleri
const ALAN_TIPLERI: { tip: AlanTipi; etiket: string; varsayilanUzunluk: number; aciklama: string }[] = [
  { tip: 'ogrenci_no', etiket: 'Öğrenci No', varsayilanUzunluk: 10, aciklama: 'Öğrenci numarası' },
  { tip: 'tc_kimlik', etiket: 'T.C. Kimlik No', varsayilanUzunluk: 11, aciklama: '11 haneli TC kimlik' },
  { tip: 'ad_soyad', etiket: 'Ad Soyad', varsayilanUzunluk: 30, aciklama: 'Ad ve soyad birlikte' },
  { tip: 'ad', etiket: 'Ad', varsayilanUzunluk: 15, aciklama: 'Sadece ad' },
  { tip: 'soyad', etiket: 'Soyad', varsayilanUzunluk: 15, aciklama: 'Sadece soyad' },
  { tip: 'sinif', etiket: 'Sınıf', varsayilanUzunluk: 2, aciklama: 'Sınıf seviyesi (8, 12 vb.)' },
  { tip: 'sube', etiket: 'Şube', varsayilanUzunluk: 2, aciklama: 'Şube (A, B, C vb.)' },
  { tip: 'kurum_kodu', etiket: 'Kurum Kodu', varsayilanUzunluk: 8, aciklama: 'MEB kurum kodu' },
  { tip: 'cep_no', etiket: 'Cep Telefonu', varsayilanUzunluk: 11, aciklama: 'Telefon numarası' },
  { tip: 'kitapcik', etiket: 'Kitapçık', varsayilanUzunluk: 1, aciklama: 'Kitapçık türü (A/B/C/D)' },
  { tip: 'cinsiyet', etiket: 'Cinsiyet', varsayilanUzunluk: 1, aciklama: 'E/K veya 1/2' },
  { tip: 'cevaplar', etiket: 'Tüm Cevaplar', varsayilanUzunluk: 90, aciklama: 'Tüm ders cevapları' },
  { tip: 'ders_cevap', etiket: 'Ders Cevapları', varsayilanUzunluk: 20, aciklama: 'Tek ders cevapları' },
  { tip: 'bos', etiket: 'Boş Alan', varsayilanUzunluk: 5, aciklama: 'Atlanacak alan' },
  { tip: 'ozel', etiket: 'Özel Alan', varsayilanUzunluk: 10, aciklama: 'Özel tanımlı alan' },
];

// Renk paleti
const ALAN_RENKLERI: Record<AlanTipi, string> = {
  ogrenci_no: '#3B82F6',
  tc_kimlik: '#8B5CF6',
  ad_soyad: '#10B981',
  ad: '#10B981',
  soyad: '#059669',
  sinif: '#F59E0B',
  sube: '#F97316',
  kurum_kodu: '#6366F1',
  cep_no: '#EC4899',
  kitapcik: '#EF4444',
  cinsiyet: '#14B8A6',
  cevaplar: '#06B6D4',
  ders_cevap: '#0EA5E9',
  bos: '#9CA3AF',
  ozel: '#78716C',
};

export function Step3OptikSablon({ wizard, organizationId }: Step3Props) {
  const { state, setOptikSablon, skipOptikSablon } = wizard;
  const { step3, step1 } = state;

  // Tab seçimi
  const [activeTab, setActiveTab] = useState<'hazir' | 'ozel' | 'ocr'>('hazir');
  
  // Hazır şablonlar
  const [sablonlar, setSablonlar] = useState<EAOptikSablon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Özel şablon state
  const [sablonAdi, setSablonAdi] = useState('');
  const [satirUzunlugu, setSatirUzunlugu] = useState(200);
  const [alanlar, setAlanlar] = useState<AlanTanimi[]>([]);
  const [secilenAlan, setSecilenAlan] = useState<string | null>(null);
  const [onizlemeText, setOnizlemeText] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  
  // Yeni alan ekleme modal
  const [showAddAlan, setShowAddAlan] = useState(false);
  const [yeniAlanTip, setYeniAlanTip] = useState<AlanTipi>('ogrenci_no');

  // Şablonları yükle
  const fetchSablonlar = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/admin/exam-analytics/optik-sablonlar?organizationId=${organizationId}`);
      if (res.ok) {
        const json = await res.json();
        setSablonlar(json.data || []);
      }
    } catch (err) {
      console.error('Şablon yükleme hatası:', err);
      // Mock data fallback
      setSablonlar([
        {
          id: 'default-k12',
          organization_id: null,
          sablon_adi: 'K12Net Standart',
          aciklama: '15 alan, 200 karakter',
          format_tipi: 'fixed_width',
          satir_uzunlugu: 200,
          alan_tanimlari: [],
          cevap_baslangic: 100,
          cevap_uzunluk: 90,
          is_active: true,
          is_default: true,
        },
        {
          id: 'lgs-format',
          organization_id: null,
          sablon_adi: 'LGS Formatı (90 Soru)',
          aciklama: '10 alan, 150 karakter',
          format_tipi: 'fixed_width',
          satir_uzunlugu: 150,
          alan_tanimlari: [],
          cevap_baslangic: 60,
          cevap_uzunluk: 90,
          is_active: true,
          is_default: false,
        },
      ]);
    } finally {
      setYukleniyor(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSablonlar();
  }, [fetchSablonlar]);

  // Örnek TXT satırı oluştur
  useEffect(() => {
    // Varsayılan örnek
    const ornek = '12345678901234567890AHMET YILMAZ                    8 A 1234567805001234567AABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD';
    setOnizlemeText(ornek.padEnd(satirUzunlugu, ' ').substring(0, satirUzunlugu));
  }, [satirUzunlugu]);

  // Yeni alan ekle
  const handleAddAlan = useCallback(() => {
    const config = ALAN_TIPLERI.find(a => a.tip === yeniAlanTip);
    if (!config) return;

    // Son alanın bitişinden başla
    const sonBitis = alanlar.length > 0 
      ? Math.max(...alanlar.map(a => a.bitis)) 
      : 0;

    const yeniAlan: AlanTanimi = {
      id: `alan-${Date.now()}`,
      tip: yeniAlanTip,
      etiket: config.etiket,
      baslangic: sonBitis + 1,
      uzunluk: config.varsayilanUzunluk,
      bitis: sonBitis + config.varsayilanUzunluk,
      zorunlu: ['ogrenci_no', 'cevaplar'].includes(yeniAlanTip),
      aciklama: config.aciklama,
    };

    setAlanlar(prev => [...prev, yeniAlan]);
    setShowAddAlan(false);
    setSecilenAlan(yeniAlan.id);
  }, [yeniAlanTip, alanlar]);

  // Alan güncelle
  const handleUpdateAlan = useCallback((id: string, updates: Partial<AlanTanimi>) => {
    setAlanlar(prev => prev.map(alan => {
      if (alan.id === id) {
        const updated = { ...alan, ...updates };
        // Bitişi yeniden hesapla
        updated.bitis = updated.baslangic + updated.uzunluk - 1;
        return updated;
      }
      return alan;
    }));
  }, []);

  // Alan sil
  const handleDeleteAlan = useCallback((id: string) => {
    setAlanlar(prev => prev.filter(a => a.id !== id));
    if (secilenAlan === id) setSecilenAlan(null);
  }, [secilenAlan]);

  // Şablon kaydet
  const handleSaveTemplate = async () => {
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
      const res = await fetch('/api/admin/exam-analytics/optik-sablonlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sablonAdi: sablonAdi.trim(),
          formatTipi: 'fixed_width',
          satirUzunlugu,
          alanTanimlari: alanlar,
          cevapBaslangic: alanlar.find(a => a.tip === 'cevaplar')?.baslangic || 0,
          cevapUzunluk: alanlar.find(a => a.tip === 'cevaplar')?.uzunluk || 0,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Şablonu seç ve hazır şablonlara geç
        setOptikSablon(json.sablonId);
        fetchSablonlar();
        setActiveTab('hazir');
        setSablonAdi('');
        setAlanlar([]);
      } else {
        const json = await res.json();
        alert(`Hata: ${json.error}`);
      }
    } catch (err) {
      console.error('Şablon kaydetme hatası:', err);
    } finally {
      setKaydediliyor(false);
    }
  };

  // Toplam kullanılan karakter
  const kullanilanKarakter = useMemo(() => {
    if (alanlar.length === 0) return 0;
    return Math.max(...alanlar.map(a => a.bitis));
  }, [alanlar]);

  // Çakışma kontrolü
  const cakisanAlanlar = useMemo(() => {
    const cakisanlar: string[] = [];
    for (let i = 0; i < alanlar.length; i++) {
      for (let j = i + 1; j < alanlar.length; j++) {
        const a1 = alanlar[i];
        const a2 = alanlar[j];
        if (a1.baslangic <= a2.bitis && a2.baslangic <= a1.bitis) {
          if (!cakisanlar.includes(a1.id)) cakisanlar.push(a1.id);
          if (!cakisanlar.includes(a2.id)) cakisanlar.push(a2.id);
        }
      }
    }
    return cakisanlar;
  }, [alanlar]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Optik Şablon</h2>
            <p className="text-sm text-gray-500">TXT dosyasının format yapısını tanımlayın</p>
          </div>
        </div>
        
        <button
          onClick={skipOptikSablon}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Şablonsuz Devam Et
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('hazir')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium',
            activeTab === 'hazir'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Layers className="w-4 h-4" />
          Hazır Şablonlar
        </button>
        <button
          onClick={() => setActiveTab('ozel')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium',
            activeTab === 'ozel'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Settings className="w-4 h-4" />
          Özel Şablon Oluştur
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium',
            activeTab === 'ocr'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Scan className="w-4 h-4" />
          OCR
          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">Yakında</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: HAZIR ŞABLONLAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hazir' && (
        <div className="space-y-4">
          {yukleniyor ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Şablonlar yükleniyor...</p>
            </div>
          ) : sablonlar.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-lg border-2 border-dashed">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Henüz şablon yok</h3>
              <p className="text-gray-500 mb-4">Özel şablon oluşturarak başlayın</p>
              <button
                onClick={() => setActiveTab('ozel')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Şablon Oluştur
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sablonlar.map((sablon) => (
                <button
                  key={sablon.id}
                  onClick={() => setOptikSablon(sablon.id)}
                  className={cn(
                    'w-full p-5 rounded-xl border-2 text-left transition-all',
                    step3.optikSablonId === sablon.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                        step3.optikSablonId === sablon.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      )}>
                        {step3.optikSablonId === sablon.id && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{sablon.sablon_adi}</span>
                          {sablon.is_default && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Varsayılan
                            </span>
                          )}
                          {!sablon.organization_id && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              Sistem
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{sablon.aciklama}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          <span>📏 {sablon.satir_uzunlugu} karakter</span>
                          <span>📝 Cevap: {sablon.cevap_baslangic}-{sablon.cevap_baslangic + sablon.cevap_uzunluk - 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ÖZEL ŞABLON OLUŞTUR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ozel' && (
        <div className="space-y-6">
          {/* Şablon Bilgileri */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Şablon Ayarları
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şablon Adı *
                </label>
                <input
                  type="text"
                  value={sablonAdi}
                  onChange={(e) => setSablonAdi(e.target.value)}
                  placeholder="Örn: Dikmen Çözüm LGS Formatı"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satır Uzunluğu (karakter)
                </label>
                <input
                  type="number"
                  value={satirUzunlugu}
                  onChange={(e) => setSatirUzunlugu(parseInt(e.target.value) || 200)}
                  min={50}
                  max={500}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Alan Tanımları */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                📋 Alan Tanımları
                <span className="text-sm font-normal text-gray-500">
                  ({alanlar.length} alan, {kullanilanKarakter}/{satirUzunlugu} karakter)
                </span>
              </h3>
              <button
                onClick={() => setShowAddAlan(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Alan Ekle
              </button>
            </div>

            {/* Alan Listesi */}
            {alanlar.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Henüz alan eklenmedi</h4>
                <p className="text-gray-500 mb-4">
                  TXT dosyasındaki verilerin pozisyonlarını tanımlamak için alan ekleyin
                </p>
                <button
                  onClick={() => setShowAddAlan(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  İlk Alanı Ekle
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {alanlar.map((alan, index) => (
                  <div
                    key={alan.id}
                    className={cn(
                      'px-4 py-3 flex items-center gap-4 transition-colors',
                      secilenAlan === alan.id && 'bg-blue-50',
                      cakisanAlanlar.includes(alan.id) && 'bg-red-50'
                    )}
                  >
                    {/* Sıra ve Renk */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: ALAN_RENKLERI[alan.tip] }}
                      />
                      <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    </div>

                    {/* Alan Bilgileri */}
                    <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                      <div>
                        <span className="font-medium text-gray-900">{alan.etiket}</span>
                        {alan.zorunlu && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={alan.baslangic}
                          onChange={(e) => handleUpdateAlan(alan.id, { baslangic: parseInt(e.target.value) || 1 })}
                          min={1}
                          max={satirUzunlugu}
                          className="w-20 px-2 py-1 border rounded text-center text-sm"
                        />
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="w-20 px-2 py-1 bg-gray-100 rounded text-center text-sm">
                          {alan.bitis}
                        </span>
                      </div>
                      
                      <div>
                        <input
                          type="number"
                          value={alan.uzunluk}
                          onChange={(e) => handleUpdateAlan(alan.id, { uzunluk: parseInt(e.target.value) || 1 })}
                          min={1}
                          max={satirUzunlugu}
                          className="w-20 px-2 py-1 border rounded text-center text-sm"
                        />
                        <span className="text-xs text-gray-500 ml-2">karakter</span>
                      </div>

                      {/* Ders kodu (ders cevapları için) */}
                      {alan.tip === 'ders_cevap' && (
                        <input
                          type="text"
                          value={alan.dersKodu || ''}
                          onChange={(e) => handleUpdateAlan(alan.id, { dersKodu: e.target.value })}
                          placeholder="Ders kodu"
                          className="px-2 py-1 border rounded text-sm"
                        />
                      )}
                    </div>

                    {/* Çakışma Uyarısı */}
                    {cakisanAlanlar.includes(alan.id) && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}

                    {/* Sil Butonu */}
                    <button
                      onClick={() => handleDeleteAlan(alan.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Görsel Önizleme */}
          <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Görsel Önizleme</span>
            </div>
            
            {/* Pozisyon cetveli */}
            <div className="font-mono text-xs text-gray-600 mb-1 whitespace-pre">
              {Array.from({ length: Math.ceil(satirUzunlugu / 10) }).map((_, i) => (
                <span key={i} className="inline-block w-[80px] text-center">
                  {(i + 1) * 10}
                </span>
              ))}
            </div>
            
            {/* Örnek satır */}
            <div className="font-mono text-sm whitespace-pre relative">
              {alanlar.map((alan) => {
                const left = (alan.baslangic - 1) * 8; // Her karakter ~8px
                const width = alan.uzunluk * 8;
                return (
                  <div
                    key={alan.id}
                    className="absolute top-0 h-6 opacity-40 rounded"
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: ALAN_RENKLERI[alan.tip],
                    }}
                  />
                );
              })}
              <span className="text-green-400 relative z-10">
                {onizlemeText}
              </span>
            </div>

            {/* Alan etiketleri */}
            <div className="font-mono text-xs mt-2 relative h-6">
              {alanlar.map((alan) => (
                <div
                  key={alan.id}
                  className="absolute text-white px-1 rounded truncate"
                  style={{
                    left: `${(alan.baslangic - 1) * 8}px`,
                    maxWidth: `${alan.uzunluk * 8}px`,
                    backgroundColor: ALAN_RENKLERI[alan.tip],
                  }}
                >
                  {alan.etiket}
                </div>
              ))}
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex items-center justify-between pt-4 border-t">
            {cakisanAlanlar.length > 0 && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Çakışan alanlar var, lütfen düzeltin
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => {
                  setSablonAdi('');
                  setAlanlar([]);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Temizle
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!sablonAdi.trim() || alanlar.length === 0 || cakisanAlanlar.length > 0 || kaydediliyor}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {kaydediliyor ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: OCR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ocr' && (
        <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed">
          <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            OCR - Optik Karakter Tanıma
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Taranmış optik formları otomatik olarak okuyun. 
            Bu özellik yakında eklenecek.
          </p>
          <button
            onClick={() => setActiveTab('hazir')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Hazır Şablonlara Dön
          </button>
        </div>
      )}

      {/* Alan Ekleme Modal */}
      {showAddAlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Alan Ekle</h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {ALAN_TIPLERI.map((tip) => (
                <button
                  key={tip.tip}
                  onClick={() => setYeniAlanTip(tip.tip)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3',
                    yeniAlanTip === tip.tip
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: ALAN_RENKLERI[tip.tip] }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{tip.etiket}</div>
                    <div className="text-sm text-gray-500">{tip.aciklama}</div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {tip.varsayilanUzunluk} kar.
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAlan(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleAddAlan}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Durum */}
      <div className={cn(
        'p-4 rounded-xl flex items-center gap-3',
        step3.isCompleted 
          ? 'bg-green-50 border-2 border-green-200' 
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
                  ? `Şablon seçildi: ${sablonlar.find(s => s.id === step3.optikSablonId)?.sablon_adi || 'Özel Şablon'}`
                  : 'Şablonsuz devam edilecek'
                }
              </span>
              <span className="text-green-600 text-sm">
                Sonraki adıma geçebilirsiniz
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <SkipForward className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <span className="text-gray-700 font-semibold block">
                Şablon seçimi yapılmadı
              </span>
              <span className="text-gray-500 text-sm">
                Bir şablon seçin veya şablonsuz devam edin
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
