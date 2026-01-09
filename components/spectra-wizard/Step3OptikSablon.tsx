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
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Ruler,
  XCircle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { WizardStep1Data, WizardStep3Data, OptikFormSablonu, OptikDersDagilimi } from '@/types/spectra-wizard';
import { OPTIK_SABLONLARI, getSablonlariByTur, validateTCKimlik } from '@/lib/spectra-wizard/optical-parser';
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

// Alan tanımları
interface AlanDefinition {
  id: string;
  label: string;
  zorunlu: boolean;
  aktif: boolean;
  baslangic: number;
  bitis: number;
}

interface OCRResult {
  success: boolean;
  cevaplar: string[];
  confidence: number;
  rawText: string;
}

// Ders tanımı (özel şablon için)
interface DersTanimi {
  id: string;
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  sira: number;
}

// Validation sonucu
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  usedChars: number;
  availableChars: number;
}

// Karakter segment (ruler için)
interface CharacterSegment {
  name: string;
  start: number;
  end: number;
  type: 'identity' | 'answers' | 'subject';
  color: string;
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

  // Alan builder state
  const [alanlar, setAlanlar] = useState<AlanDefinition[]>([
    { id: 'tcKimlik', label: 'T.C. Kimlik No', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
    { id: 'adSoyad', label: 'Ad Soyad', zorunlu: false, aktif: true, baslangic: 11, bitis: 40 },
    { id: 'kurumKodu', label: 'Kurum Kodu', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
    { id: 'cepTelefonu', label: 'Cep Telefonu', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
    { id: 'sinif', label: 'Sınıf', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
    { id: 'cinsiyet', label: 'Cinsiyet', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
    { id: 'kitapcik', label: 'Kitapçık', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
  ]);
  
  // OCR state
  const [ocrImage, setOcrImage] = useState<File | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ders yöneticisi state
  const [dersler, setDersler] = useState<DersTanimi[]>([
    { id: 'ders-1', dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, sira: 1 },
    { id: 'ders-2', dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, sira: 2 },
  ]);

  // Sınav türü preset seçimi (LGS/TYT/AYT)
  const [selectedPreset, setSelectedPreset] = useState<'LGS' | 'TYT' | 'AYT' | 'OZEL'>('OZEL');

  // Akordiyon state
  const [alanlarAcik, setAlanlarAcik] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATION HELPER
  // ─────────────────────────────────────────────────────────────────────────

  const validateTemplate = useMemo((): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const limit = ozelSablon.satirUzunlugu || 171;
    
    // Zorunlu alan kontrolleri
    if (!ozelSablon.ad.trim()) {
      errors.push('Şablon adı zorunludur');
    }
    
    if (ozelSablon.ogrenciNo.baslangic <= 0 || ozelSablon.ogrenciNo.bitis <= 0) {
      errors.push('Öğrenci No pozisyonları geçersiz');
    }
    
    if (ozelSablon.cevaplar.baslangic <= 0 || ozelSablon.cevaplar.bitis <= 0) {
      errors.push('Cevaplar pozisyonları geçersiz');
    }

    // Pozisyon çakışma kontrolü
    const allFields: { name: string; start: number; end: number }[] = [
      { name: 'Öğrenci No', start: ozelSablon.ogrenciNo.baslangic, end: ozelSablon.ogrenciNo.bitis },
      { name: 'Cevaplar', start: ozelSablon.cevaplar.baslangic, end: ozelSablon.cevaplar.bitis },
    ];
    
    alanlar.filter(a => a.aktif).forEach(alan => {
      if (alan.baslangic > 0 && alan.bitis > 0) {
        allFields.push({ name: alan.label, start: alan.baslangic, end: alan.bitis });
      }
    });

    // Çakışma kontrolü
    for (let i = 0; i < allFields.length; i++) {
      for (let j = i + 1; j < allFields.length; j++) {
        const f1 = allFields[i];
        const f2 = allFields[j];
        if (f1.start <= f2.end && f1.end >= f2.start) {
          errors.push(`"${f1.name}" ve "${f2.name}" alanları çakışıyor`);
        }
      }
    }

    // Karakter limiti kontrolü
    const maxEnd = Math.max(...allFields.map(f => f.end), 0);
    const usedChars = maxEnd;
    
    if (usedChars > limit) {
      errors.push(`Karakter limiti aşıldı: ${usedChars}/${limit} (${usedChars - limit} fazla)`);
    }

    // Uyarılar
    const hasNameField = alanlar.some(a => a.id === 'adSoyad' && a.aktif);
    if (!hasNameField) {
      warnings.push('Ad Soyad alanı eklenmesi önerilir');
    }

    if (dersler.length === 0) {
      warnings.push('En az bir ders tanımlanması önerilir');
    }

    const totalQuestions = dersler.reduce((sum, d) => sum + d.soruSayisi, 0);
    const cevapUzunluk = ozelSablon.cevaplar.bitis - ozelSablon.cevaplar.baslangic + 1;
    if (totalQuestions > cevapUzunluk) {
      warnings.push(`Toplam soru (${totalQuestions}) cevap alanından (${cevapUzunluk}) fazla`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      usedChars,
      availableChars: limit - usedChars,
    };
  }, [ozelSablon, alanlar, dersler]);

  // ─────────────────────────────────────────────────────────────────────────
  // KARAKTER SEGMENT'LERİ (Visual Ruler için)
  // ─────────────────────────────────────────────────────────────────────────

  const characterSegments = useMemo((): CharacterSegment[] => {
    const segments: CharacterSegment[] = [];
    
    // Zorunlu alanlar
    segments.push({
      name: 'Öğrenci No',
      start: ozelSablon.ogrenciNo.baslangic,
      end: ozelSablon.ogrenciNo.bitis,
      type: 'identity',
      color: 'bg-green-500',
    });
    
    segments.push({
      name: 'Cevaplar',
      start: ozelSablon.cevaplar.baslangic,
      end: ozelSablon.cevaplar.bitis,
      type: 'answers',
      color: 'bg-blue-500',
    });

    // Aktif opsiyonel alanlar
    alanlar.filter(a => a.aktif && a.baslangic > 0 && a.bitis > 0).forEach(alan => {
      segments.push({
        name: alan.label,
        start: alan.baslangic,
        end: alan.bitis,
        type: 'identity',
        color: 'bg-emerald-400',
      });
    });

    return segments.sort((a, b) => a.start - b.start);
  }, [ozelSablon, alanlar]);

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  // Sınav türüne uygun şablonlar
  const uygunSablonlar = useMemo(() => {
    return getSablonlariByTur(step1Data.sinavTuru);
  }, [step1Data.sinavTuru]);

  // Seçili şablon
  const seciliSablon = data?.optikSablon || uygunSablonlar[0];

  // Şablon filtre state
  const [sablonFiltre, setSablonFiltre] = useState<'tumu' | 'meb' | 'yayinevi'>('tumu');

  // Filtrelenmiş şablonlar
  const filtreliSablonlar = useMemo(() => {
    if (sablonFiltre === 'tumu') return uygunSablonlar;
    if (sablonFiltre === 'meb') {
      return uygunSablonlar.filter(s => 
        s.yayinevi.toLowerCase().includes('meb') || 
        s.yayinevi.toLowerCase().includes('ösym')
      );
    }
    return uygunSablonlar.filter(s => 
      !s.yayinevi.toLowerCase().includes('meb') && 
      !s.yayinevi.toLowerCase().includes('ösym')
    );
  }, [uygunSablonlar, sablonFiltre]);

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
  // DERS YÖNETİMİ
  // ─────────────────────────────────────────────────────────────────────────

  // Ders ekle
  const handleAddDers = useCallback(() => {
    const newId = `ders-${Date.now()}`;
    const newSira = dersler.length + 1;
    setDersler(prev => [...prev, {
      id: newId,
      dersKodu: `DERS${newSira}`,
      dersAdi: `Yeni Ders ${newSira}`,
      soruSayisi: 10,
      sira: newSira,
    }]);
  }, [dersler.length]);

  // Ders sil
  const handleDeleteDers = useCallback((id: string) => {
    setDersler(prev => prev.filter(d => d.id !== id).map((d, i) => ({ ...d, sira: i + 1 })));
  }, []);

  // Ders yukarı taşı
  const handleMoveDersUp = useCallback((id: string) => {
    setDersler(prev => {
      const index = prev.findIndex(d => d.id === id);
      if (index <= 0) return prev;
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList.map((d, i) => ({ ...d, sira: i + 1 }));
    });
  }, []);

  // Ders aşağı taşı
  const handleMoveDersDown = useCallback((id: string) => {
    setDersler(prev => {
      const index = prev.findIndex(d => d.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList.map((d, i) => ({ ...d, sira: i + 1 }));
    });
  }, []);

  // Ders güncelle
  const handleUpdateDers = useCallback((id: string, field: keyof DersTanimi, value: string | number) => {
    setDersler(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  }, []);

  // Preset yükle
  const handleLoadPreset = useCallback((preset: 'LGS' | 'TYT' | 'AYT' | 'OZEL') => {
    setSelectedPreset(preset);
    
    if (preset === 'LGS') {
      setDersler([
        { id: 'lgs-1', dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, sira: 1 },
        { id: 'lgs-2', dersKodu: 'INK', dersAdi: 'T.C. İnkılap Tarihi', soruSayisi: 10, sira: 2 },
        { id: 'lgs-3', dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, sira: 3 },
        { id: 'lgs-4', dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, sira: 4 },
        { id: 'lgs-5', dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, sira: 5 },
        { id: 'lgs-6', dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, sira: 6 },
      ]);
    } else if (preset === 'TYT') {
      setDersler([
        { id: 'tyt-1', dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', soruSayisi: 40, sira: 1 },
        { id: 'tyt-2', dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', soruSayisi: 20, sira: 2 },
        { id: 'tyt-3', dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', soruSayisi: 40, sira: 3 },
        { id: 'tyt-4', dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, sira: 4 },
      ]);
    } else if (preset === 'AYT') {
      setDersler([
        { id: 'ayt-1', dersKodu: 'AYT_MAT', dersAdi: 'Matematik', soruSayisi: 40, sira: 1 },
        { id: 'ayt-2', dersKodu: 'AYT_FIZ', dersAdi: 'Fizik', soruSayisi: 14, sira: 2 },
        { id: 'ayt-3', dersKodu: 'AYT_KIM', dersAdi: 'Kimya', soruSayisi: 13, sira: 3 },
        { id: 'ayt-4', dersKodu: 'AYT_BIY', dersAdi: 'Biyoloji', soruSayisi: 13, sira: 4 },
      ]);
    } else {
      // OZEL - mevcut dersleri koru
    }
    
    toast.success(`${preset} ders dağılımı yüklendi`);
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
          {/* Filtre butonları */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-600 mr-2">Filtre:</span>
            {([
              { key: 'tumu', label: 'Tümü', count: uygunSablonlar.length },
              { key: 'meb', label: 'MEB/ÖSYM Resmi', count: uygunSablonlar.filter(s => s.yayinevi.toLowerCase().includes('meb') || s.yayinevi.toLowerCase().includes('ösym')).length },
              { key: 'yayinevi', label: 'Yayınevi', count: uygunSablonlar.filter(s => !s.yayinevi.toLowerCase().includes('meb') && !s.yayinevi.toLowerCase().includes('ösym')).length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setSablonFiltre(key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  sablonFiltre === key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
                )}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {filtreliSablonlar.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Şablon Bulunamadı</h3>
              <p className="text-gray-500 mb-4">
                {sablonFiltre === 'tumu' 
                  ? 'Bu sınav türü için hazır şablon yok.' 
                  : `Seçili filtrede şablon bulunamadı.`}
              </p>
              <button
                onClick={() => handleTabChange('ozel')}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
              >
                Özel Şablon Oluştur
              </button>
            </div>
          ) : (
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {filtreliSablonlar.map((sablon) => {
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
        <div className="space-y-6">
          {/* Bilgi Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <Settings size={16} />
              <strong>Alan Builder:</strong> Optik formunuzdaki alanları tanımlayın. Aktif alanlar için karakter pozisyonlarını girin.
            </p>
          </div>

          {/* Temel Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Şablon Adı *</label>
              <input
                type="text"
                value={ozelSablon.ad}
                onChange={(e) => setOzelSablon(prev => ({ ...prev, ad: e.target.value }))}
                placeholder="Örn: Kurum Özel Şablon 2024"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Satır Uzunluğu (karakter) *</label>
              <input
                type="number"
                value={ozelSablon.satirUzunlugu}
                onChange={(e) => setOzelSablon(prev => ({ ...prev, satirUzunlugu: parseInt(e.target.value) || 0 }))}
                placeholder="171"
                style={{ MozAppearance: 'textfield' }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ALAN TANIMLAMA TABLOSU - AKORDİYON */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Akordiyon Başlık */}
            <button
              onClick={() => setAlanlarAcik(!alanlarAcik)}
              className="w-full bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Alan Tanımları ({alanlar.filter(a => a.aktif).length + 2} aktif)
              </span>
              <ChevronRight size={18} className={cn('text-gray-400 transition-transform', alanlarAcik && 'rotate-90')} />
            </button>

            {/* Tablo Başlığı */}
            {alanlarAcik && (
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase">
                <div className="col-span-3">Alan Adı</div>
                <div className="col-span-2 text-center">Başlangıç</div>
                <div className="col-span-2 text-center">Bitiş</div>
                <div className="col-span-2 text-center">Uzunluk</div>
                <div className="col-span-2 text-center">Durum</div>
                <div className="col-span-1"></div>
              </div>
            </div>
            )}

            {/* Zorunlu ve Opsiyonel Alanlar */}
            {alanlarAcik && (
            <div className="divide-y divide-gray-100">
              {/* Öğrenci No - Zorunlu */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center bg-emerald-50/50">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-800">Öğrenci No</span>
                  <span className="text-red-500 text-xs">*</span>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={ozelSablon.ogrenciNo.baslangic}
                    onChange={(e) => setOzelSablon(prev => ({ ...prev, ogrenciNo: { ...prev.ogrenciNo, baslangic: parseInt(e.target.value) || 0 } }))}
                    className="w-full px-2 py-1.5 text-center text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={ozelSablon.ogrenciNo.bitis}
                    onChange={(e) => setOzelSablon(prev => ({ ...prev, ogrenciNo: { ...prev.ogrenciNo, bitis: parseInt(e.target.value) || 0 } }))}
                    className="w-full px-2 py-1.5 text-center text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-mono text-emerald-600">{ozelSablon.ogrenciNo.bitis - ozelSablon.ogrenciNo.baslangic + 1} kar.</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Zorunlu</span>
                </div>
                <div className="col-span-1"></div>
              </div>

              {/* Cevaplar - Zorunlu */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center bg-emerald-50/50">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-800">Cevaplar</span>
                  <span className="text-red-500 text-xs">*</span>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={ozelSablon.cevaplar.baslangic}
                    onChange={(e) => setOzelSablon(prev => ({ ...prev, cevaplar: { ...prev.cevaplar, baslangic: parseInt(e.target.value) || 0 } }))}
                    className="w-full px-2 py-1.5 text-center text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={ozelSablon.cevaplar.bitis}
                    onChange={(e) => setOzelSablon(prev => ({ ...prev, cevaplar: { ...prev.cevaplar, bitis: parseInt(e.target.value) || 0 } }))}
                    className="w-full px-2 py-1.5 text-center text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-mono text-emerald-600">{ozelSablon.cevaplar.bitis - ozelSablon.cevaplar.baslangic + 1} kar.</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Zorunlu</span>
                </div>
                <div className="col-span-1"></div>
              </div>

              {/* Opsiyonel Alanlar */}
              {alanlar.map((alan, index) => (
                <div key={alan.id} className={cn(
                  'grid grid-cols-12 gap-2 px-4 py-3 items-center transition-all',
                  alan.aktif ? 'bg-sky-50/50' : 'bg-white hover:bg-gray-50'
                )}>
                  <div className="col-span-3 flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', alan.aktif ? 'bg-sky-500' : 'bg-gray-300')}></span>
                    <span className="text-sm font-medium text-gray-800">{alan.label}</span>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={alan.baslangic || ''}
                      onChange={(e) => {
                        const yeni = [...alanlar];
                        yeni[index].baslangic = parseInt(e.target.value) || 0;
                        yeni[index].aktif = true;
                        setAlanlar(yeni);
                      }}
                      disabled={!alan.aktif}
                      placeholder="—"
                      className={cn(
                        'w-full px-2 py-1.5 text-center text-sm font-mono border rounded-lg [&::-webkit-inner-spin-button]:appearance-none',
                        alan.aktif 
                          ? 'border-gray-200 bg-white focus:ring-2 focus:ring-sky-500' 
                          : 'border-gray-100 bg-gray-50 text-gray-400'
                      )}
                      style={{ MozAppearance: 'textfield' }}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={alan.bitis || ''}
                      onChange={(e) => {
                        const yeni = [...alanlar];
                        yeni[index].bitis = parseInt(e.target.value) || 0;
                        yeni[index].aktif = true;
                        setAlanlar(yeni);
                      }}
                      disabled={!alan.aktif}
                      placeholder="—"
                      className={cn(
                        'w-full px-2 py-1.5 text-center text-sm font-mono border rounded-lg [&::-webkit-inner-spin-button]:appearance-none',
                        alan.aktif 
                          ? 'border-gray-200 bg-white focus:ring-2 focus:ring-sky-500' 
                          : 'border-gray-100 bg-gray-50 text-gray-400'
                      )}
                      style={{ MozAppearance: 'textfield' }}
                    />
                  </div>
                  <div className="col-span-2 text-center">
                    {alan.aktif && alan.bitis > alan.baslangic ? (
                      <span className="text-sm font-mono text-sky-600">{alan.bitis - alan.baslangic + 1} kar.</span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <button
                      onClick={() => {
                        const yeni = [...alanlar];
                        yeni[index].aktif = !yeni[index].aktif;
                        setAlanlar(yeni);
                      }}
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full transition-all',
                        alan.aktif
                          ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      {alan.aktif ? 'Aktif' : 'Pasif'}
                    </button>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => {
                        if (index === 0) return;
                        const yeni = [...alanlar];
                        [yeni[index - 1], yeni[index]] = [yeni[index], yeni[index - 1]];
                        setAlanlar(yeni);
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (index === alanlar.length - 1) return;
                        const yeni = [...alanlar];
                        [yeni[index], yeni[index + 1]] = [yeni[index + 1], yeni[index]];
                        setAlanlar(yeni);
                      }}
                      disabled={index === alanlar.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      <ArrowDown size={12} />
                    </button>
                    {alan.aktif && (
                      <button
                        onClick={() => {
                          const yeni = [...alanlar];
                          yeni[index].aktif = false;
                          yeni[index].baslangic = 0;
                          yeni[index].bitis = 0;
                          setAlanlar(yeni);
                        }}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Satır Ekle Butonu */}
            {alanlarAcik && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  const newId = `ozel-${Date.now()}`;
                  setAlanlar(prev => [...prev, {
                    id: newId,
                    label: `Özel Alan ${prev.length + 1}`,
                    zorunlu: false,
                    aktif: true,
                    baslangic: 0,
                    bitis: 0,
                  }]);
                  toast.success('Yeni alan eklendi');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200"
              >
                <Plus size={16} />
                Satır Ekle
              </button>
            </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* DERS YÖNETİCİSİ */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Ders Dağılımı
              </h4>
              <div className="flex items-center gap-2">
                {/* Preset butonları */}
                {(['LGS', 'TYT', 'AYT', 'OZEL'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleLoadPreset(preset)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                      selectedPreset === preset
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Ders listesi */}
            <div className="space-y-2">
              {dersler.map((ders, index) => (
                <div
                  key={ders.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  {/* Sıra numarası */}
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                    {ders.sira}
                  </span>

                  {/* Ders kodu */}
                  <input
                    type="text"
                    value={ders.dersKodu}
                    onChange={(e) => handleUpdateDers(ders.id, 'dersKodu', e.target.value)}
                    placeholder="Kod"
                    className="w-20 px-2 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Ders adı */}
                  <input
                    type="text"
                    value={ders.dersAdi}
                    onChange={(e) => handleUpdateDers(ders.id, 'dersAdi', e.target.value)}
                    placeholder="Ders Adı"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Soru sayısı */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateDers(ders.id, 'soruSayisi', Math.max(1, ders.soruSayisi - 1))}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={ders.soruSayisi}
                      onChange={(e) => handleUpdateDers(ders.id, 'soruSayisi', parseInt(e.target.value) || 0)}
                      style={{ MozAppearance: 'textfield' }}
                      className="w-12 px-1 py-1.5 text-center text-sm font-mono border border-gray-200 rounded-lg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => handleUpdateDers(ders.id, 'soruSayisi', ders.soruSayisi + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-gray-500 ml-1">soru</span>
                  </div>

                  {/* Yukarı/Aşağı/Sil */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveDersUp(ders.id)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDersDown(ders.id)}
                      disabled={index === dersler.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteDers(ders.id)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ders ekle butonu ve toplam */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleAddDers}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
              >
                <Plus size={16} />
                Ders Ekle
              </button>
              <div className="text-sm text-gray-600">
                Toplam: <span className="font-bold text-indigo-600">{dersler.reduce((sum, d) => sum + d.soruSayisi, 0)}</span> soru
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VISUAL RULER (Karakter Haritası) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Ruler size={16} className="text-purple-600" />
              Karakter Haritası ({ozelSablon.satirUzunlugu} karakter limiti)
            </h4>

            {/* Visual bar */}
            <div className="mb-4">
              <div className="h-10 bg-gray-100 rounded-lg relative overflow-hidden border border-gray-200">
                {characterSegments.map((seg, i) => {
                  const limit = ozelSablon.satirUzunlugu || 171;
                  const width = ((seg.end - seg.start + 1) / limit) * 100;
                  const left = ((seg.start - 1) / limit) * 100;
                  return (
                    <div
                      key={i}
                      className={cn('absolute h-full opacity-80 border-r border-white flex items-center justify-center', seg.color)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${seg.name}: ${seg.start}-${seg.end} (${seg.end - seg.start + 1} kar.)`}
                    >
                      {width > 8 && (
                        <span className="text-[10px] font-bold text-white truncate px-1">
                          {seg.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>{Math.floor((ozelSablon.satirUzunlugu || 171) / 2)}</span>
                <span>{ozelSablon.satirUzunlugu || 171}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Kimlik Alanları</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Cevaplar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                <span>Opsiyonel Alanlar</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-800">{validateTemplate.usedChars}</p>
                <p className="text-xs text-gray-500">Kullanılan</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-800">{ozelSablon.satirUzunlugu || 171}</p>
                <p className="text-xs text-gray-500">Limit</p>
              </div>
              <div className={cn(
                'p-3 rounded-lg text-center',
                validateTemplate.availableChars < 0 ? 'bg-red-50' : 'bg-emerald-50'
              )}>
                <p className={cn(
                  'text-lg font-bold',
                  validateTemplate.availableChars < 0 ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {validateTemplate.availableChars}
                </p>
                <p className="text-xs text-gray-500">{validateTemplate.availableChars < 0 ? 'Aşım!' : 'Boş'}</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VALIDATION PANELİ */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {(validateTemplate.errors.length > 0 || validateTemplate.warnings.length > 0) && (
            <div className="space-y-3">
              {/* Hatalar */}
              {validateTemplate.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <XCircle size={16} />
                    Hatalar ({validateTemplate.errors.length})
                  </h5>
                  <ul className="space-y-1">
                    {validateTemplate.errors.map((error, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uyarılar */}
              {validateTemplate.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h5 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Uyarılar ({validateTemplate.warnings.length})
                  </h5>
                  <ul className="space-y-1">
                    {validateTemplate.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-amber-600 flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Kaydet Butonu */}
          <button
            onClick={handleOzelSablonKaydet}
            disabled={!validateTemplate.isValid}
            className={cn(
              'w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg',
              validateTemplate.isValid
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            <Save size={20} />
            {validateTemplate.isValid ? 'Şablonu Kaydet ve Kullan' : 'Hataları Düzeltin'}
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
