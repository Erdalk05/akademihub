'use client';

// ============================================================================
// STEP 3: OPTİK FORM ŞABLONU + OCR PIPELINE v2.0
// Hazır şablonlar, özel şablon oluşturma, OCR fotoğraf tanıma
// ============================================================================

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Grid3X3,
  Check,
  Settings,
  Save,
  Upload,
  Camera,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { WizardStep1Data, WizardStep3Data, OptikFormSablonu } from '@/types/spectra-wizard';
import { OPTIK_SABLONLARI, getSablonlariByTur } from '@/lib/spectra-wizard/optical-parser';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Step3Props {
  step1Data: WizardStep1Data;
  data: WizardStep3Data | null;
  onChange: (data: WizardStep3Data) => void;
}

type TabType = 'kutuphane' | 'ozel' | 'ocr';

interface OzelSablonForm {
  ad: string;
  satirUzunlugu: number;
  ogrenciNo: { baslangic: number; bitis: number };
  ogrenciAdi: { baslangic: number; bitis: number };
  cevaplar: { baslangic: number; bitis: number };
  kitapcik?: { baslangic: number; bitis: number };
  sinif?: { baslangic: number; bitis: number };
}

interface OCRResult {
  success: boolean;
  cevaplar: string[];
  confidence: number;
  rawText: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Step3OptikSablon({ step1Data, data, onChange }: Step3Props) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  const [activeTab, setActiveTab] = useState<TabType>(data?.sablonKaynagi === 'ozel' ? 'ozel' : 'kutuphane');
  
  // Özel şablon state
  const [ozelSablon, setOzelSablon] = useState<OzelSablonForm>({
    ad: '',
    satirUzunlugu: 171,
    ogrenciNo: { baslangic: 1, bitis: 10 },
    ogrenciAdi: { baslangic: 11, bitis: 40 },
    cevaplar: { baslangic: 41, bitis: 130 },
  });
  
  // OCR state
  const [ocrImage, setOcrImage] = useState<File | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  // Sınav türüne uygun şablonlar
  const uygunSablonlar = useMemo(() => {
    return getSablonlariByTur(step1Data.sinavTuru);
  }, [step1Data.sinavTuru]);

  // Seçili şablon
  const seciliSablon = data?.optikSablon || uygunSablonlar[0];

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // Şablon seç
  const handleSablonSec = useCallback((sablon: OptikFormSablonu) => {
    onChange({
      optikSablon: sablon,
      sablonKaynagi: 'kutuphane',
    });
    toast.success(`${sablon.ad} şablonu seçildi.`);
  }, [onChange]);

  // Özel şablon kaydet
  const handleOzelSablonKaydet = useCallback(() => {
    if (!ozelSablon.ad.trim()) {
      toast.error('Lütfen şablon adı girin.');
      return;
    }

    const yeniSablon: OptikFormSablonu = {
      id: `ozel-${Date.now()}`,
      ad: ozelSablon.ad,
      sinavTuru: step1Data.sinavTuru,
      yayinevi: 'Özel',
      toplamSoru: ozelSablon.cevaplar.bitis - ozelSablon.cevaplar.baslangic + 1,
      satirUzunlugu: ozelSablon.satirUzunlugu,
      alanlar: {
        ogrenciNo: ozelSablon.ogrenciNo,
        ogrenciAdi: ozelSablon.ogrenciAdi,
        cevaplar: ozelSablon.cevaplar,
        kitapcik: ozelSablon.kitapcik,
        sinif: ozelSablon.sinif,
      },
      aciklama: 'Özel oluşturulmuş şablon',
    };

    onChange({
      optikSablon: yeniSablon,
      sablonKaynagi: 'ozel',
    });

    toast.success('Özel şablon kaydedildi.');
  }, [ozelSablon, step1Data.sinavTuru, onChange]);

  // OCR fotoğraf yükle
  const handleOcrImageUpload = useCallback((file: File) => {
    setOcrImage(file);
    
    // Preview oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setOcrImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setOcrResult(null);
  }, []);

  // OCR işlemi başlat (Placeholder)
  const handleStartOcr = useCallback(async () => {
    if (!ocrImage) {
      toast.error('Lütfen önce bir fotoğraf yükleyin.');
      return;
    }

    setIsProcessingOcr(true);
    
    // Simülasyon - gerçek OCR API'si buraya gelecek
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Placeholder sonuç
    setOcrResult({
      success: true,
      cevaplar: [],
      confidence: 0,
      rawText: '',
    });
    
    setIsProcessingOcr(false);
    toast('OCR özelliği yakında aktif olacak!', { icon: '🚧' });
  }, [ocrImage]);

  // Fotoğraf temizle
  const handleClearOcrImage = useCallback(() => {
    setOcrImage(null);
    setOcrImagePreview(null);
    setOcrResult(null);
  }, []);

  // Tab değiştir
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'kutuphane' as const, label: 'Hazır Şablonlar', icon: <Grid3X3 size={16} /> },
    { id: 'ozel' as const, label: 'Özel Şablon', icon: <Settings size={16} /> },
    { id: 'ocr' as const, label: 'OCR (Fotoğraf)', icon: <Camera size={16} />, badge: 'Yakında' },
  ];

  return (
    <div className="space-y-6">
      
      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all relative',
              activeTab === tab.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: HAZIR ŞABLONLAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kutuphane' && (
        <div className="space-y-4">
          {uygunSablonlar.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Şablon Bulunamadı</h3>
              <p className="text-gray-500 mb-4">Bu sınav türü için hazır şablon yok.</p>
              <button
                onClick={() => handleTabChange('ozel')}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
              >
                Özel Şablon Oluştur
              </button>
            </div>
          ) : (
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {uygunSablonlar.map((sablon) => {
                const isSecili = seciliSablon?.id === sablon.id;
                return (
                  <button
                    key={sablon.id}
                    onClick={() => handleSablonSec(sablon)}
                    className={cn(
                      'w-full p-2 rounded-lg border transition-all text-left',
                      isSecili
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className={cn('w-4 h-4 flex-shrink-0', isSecili ? 'text-emerald-600' : 'text-gray-400')} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{sablon.ad}</h4>
                          <p className="text-xs text-gray-500">{sablon.yayinevi}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-gray-500">
                          ÖğNo:{sablon.alanlar.ogrenciNo.baslangic}-{sablon.alanlar.ogrenciNo.bitis}
                        </span>
                        <span className="text-xs font-mono text-gray-500">
                          Ad:{sablon.alanlar.ogrenciAdi.baslangic}-{sablon.alanlar.ogrenciAdi.bitis}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {sablon.toplamSoru}S
                        </span>
                        {isSecili && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ÖZEL ŞABLON */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ozel' && (
        <div className="space-y-4">
          {/* Bilgi Banner */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>⚙️ Şablon Builder:</strong> TXT/DAT dosyanızdaki alanların karakter pozisyonlarını tanımlayın.
            </p>
          </div>

          {/* Temel Bilgiler - Kompakt */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Şablon Adı *</label>
              <input
                type="text"
                value={ozelSablon.ad}
                onChange={(e) => setOzelSablon(prev => ({ ...prev, ad: e.target.value }))}
                placeholder="Örn: Kurum Şablon"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Satır Uzunluğu *</label>
              <input
                type="number"
                value={ozelSablon.satirUzunlugu}
                onChange={(e) => setOzelSablon(prev => ({ ...prev, satirUzunlugu: parseInt(e.target.value) || 0 }))}
                placeholder="171"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Alan Kartları - Modern Grid */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Settings size={14} />
              Karakter Pozisyonları
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { id: 'ogrenciNo', label: 'Öğrenci No', zorunlu: true },
                { id: 'ogrenciAdi', label: 'Öğrenci Adı', zorunlu: true },
                { id: 'cevaplar', label: 'Cevaplar', zorunlu: true },
                { id: 'kitapcik', label: 'Kitapçık', zorunlu: false },
                { id: 'sinif', label: 'Sınıf', zorunlu: false },
              ].map((alan) => {
                const fieldKey = alan.id as keyof OzelSablonForm;
                const fieldValue = ozelSablon[fieldKey] as { baslangic: number; bitis: number } | undefined;
                
                return (
                  <div key={alan.id} className="bg-white p-2 rounded-lg border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {alan.label} {alan.zorunlu && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={fieldValue?.baslangic || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setOzelSablon(prev => ({
                            ...prev,
                            [alan.id]: { ...(prev[fieldKey as keyof OzelSablonForm] as any || {}), baslangic: val }
                          }));
                        }}
                        placeholder="1"
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-400 self-center">-</span>
                      <input
                        type="number"
                        value={fieldValue?.bitis || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setOzelSablon(prev => ({
                            ...prev,
                            [alan.id]: { ...(prev[fieldKey as keyof OzelSablonForm] as any || {}), bitis: val }
                          }));
                        }}
                        placeholder="10"
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kaydet Butonu - Kompakt */}
          <button
            onClick={handleOzelSablonKaydet}
            className="w-full py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Şablonu Kaydet ve Kullan
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: OCR (FOTOĞRAF TARAMA) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ocr' && (
        <div className="space-y-5">
          {/* OCR Açıklama */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-purple-700 mb-1">AI Destekli OCR</h4>
                <p className="text-sm text-purple-600">
                  Cevap anahtarı fotoğrafını yükleyin, yapay zeka otomatik olarak cevapları tanıyacak.
                  Bu özellik yakında aktif olacak!
                </p>
              </div>
            </div>
          </div>

          {/* Fotoğraf Yükleme Alanı */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              ocrImagePreview
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
            )}
          >
            {ocrImagePreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={ocrImagePreview}
                    alt="Yüklenen fotoğraf"
                    className="max-h-64 rounded-lg shadow-md mx-auto"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearOcrImage(); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-purple-600 font-medium">{ocrImage?.name}</p>
              </div>
            ) : (
              <>
                <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-sm text-gray-400">veya sürükleyip bırakın</p>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG (max 10MB)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleOcrImageUpload(file);
              }}
            />
          </div>

          {/* OCR Başlat Butonu */}
          {ocrImagePreview && (
            <button
              onClick={handleStartOcr}
              disabled={isProcessingOcr}
              className={cn(
                'w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                isProcessingOcr
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-md'
              )}
            >
              {isProcessingOcr ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Cevapları Tanı (OCR)
                </>
              )}
            </button>
          )}

          {/* OCR Sonucu Placeholder */}
          {ocrResult && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle size={18} />
                <p className="text-sm font-medium">
                  OCR özelliği geliştirme aşamasında. Yakında aktif olacak!
                </p>
              </div>
            </div>
          )}

          {/* Desteklenen Formatlar */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Desteklenen Format Örnekleri:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="font-medium">📋 Optik Form</span>
                <p className="text-gray-400 mt-1">Barkodlu optik formlar</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="font-medium">📝 Elle Yazılmış</span>
                <p className="text-gray-400 mt-1">El yazısı cevap kağıtları</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="font-medium">🖨️ Basılı Anahtar</span>
                <p className="text-gray-400 mt-1">Basılı cevap anahtarları</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SEÇİLİ ŞABLON ÖZETİ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {seciliSablon && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <div>
              <p className="font-semibold text-emerald-700">{seciliSablon.ad}</p>
              <p className="text-sm text-emerald-600">
                {seciliSablon.toplamSoru} soru • Satır: {seciliSablon.satirUzunlugu} karakter • {seciliSablon.yayinevi}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
            Hazır
          </span>
        </div>
      )}
    </div>
  );
}

export default Step3OptikSablon;
