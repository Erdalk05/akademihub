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
  GripVertical,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { WizardStep1Data, WizardStep3Data, OptikFormSablonu, OptikDersDagilimi } from '@/types/spectra-wizard';
import { OPTIK_SABLONLARI, getSablonlariByTur, validateTCKimlik } from '@/lib/spectra-wizard/optical-parser';
import { cn } from '@/lib/utils';
import { Step3OptikSablonV2 } from './Step3OptikSablonV2';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Step3Props {
  step1Data: WizardStep1Data;
  data: WizardStep3Data | null;
  organizationId?: string;
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
  baslangic: number;
  bitis: number;
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

const normalizeRange = (start: number, end: number) => ({
  start: Math.min(start, end),
  end: Math.max(start, end),
});

const isFieldActive = (field: AlanDefinition) => field?.aktif !== false;

const formatOverlapMessage = (a: { label: string; start: number; end: number }, b: { label: string; start: number; end: number }) =>
  `${a.label} (${a.start}-${a.end}) ile ${b.label} (${b.start}-${b.end}) aynı karakterleri kullanıyor olabilir.`;

const focusNextInput = (current: HTMLInputElement | null) => {
  if (!current) return;
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.alan-input'))
    .filter(inp => inp.tabIndex !== -1);
  const index = inputs.indexOf(current);
  if (index >= 0 && index < inputs.length - 1) {
    inputs[index + 1].focus();
  }
};

const handleArrowKeys = (
  e: React.KeyboardEvent<HTMLInputElement>,
  value: number,
  callback: (val: number) => void
) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const delta = e.key === 'ArrowUp' ? 1 : -1;
    const nextValue = Math.max(0, value + delta);
    callback(nextValue);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    focusNextInput(e.currentTarget);
  }
};

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
    { id: 'ogrenciNo', label: 'ÖĞRENCİ NO (Kimlik Alanı)', zorunlu: false, aktif: true, baslangic: 1, bitis: 10 },
    { id: 'cevaplar', label: 'CEVAPLAR (Optik Yanıt Alanı)', zorunlu: false, aktif: true, baslangic: 41, bitis: 130 },
    { id: 'tcKimlik', label: 'T.C. Kimlik No', zorunlu: false, aktif: false, baslangic: 0, bitis: 0 },
    { id: 'adSoyad', label: 'AD SOYAD (Kişisel Bilgi)', zorunlu: false, aktif: true, baslangic: 11, bitis: 40 },
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
    { id: 'ders-1', dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, sira: 1, baslangic: 0, bitis: 0 },
    { id: 'ders-2', dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, sira: 2, baslangic: 0, bitis: 0 },
  ]);

  // Sınav türü preset seçimi (LGS/TYT/AYT)
  const [selectedPreset, setSelectedPreset] = useState<'LGS' | 'TYT' | 'AYT' | 'OZEL'>('OZEL');

  // Akordiyon state
  const [alanlarAcik, setAlanlarAcik] = useState(true);

  const updateFieldRange = useCallback((index: number, startValue: number, endValue: number) => {
    const yeni = [...alanlar];
    const { start, end } = normalizeRange(startValue, endValue);
    yeni[index].baslangic = start;
    yeni[index].bitis = end;
    yeni[index].aktif = true;
    setAlanlar(yeni);
  }, [alanlar]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS - LocalStorage'dan yükleme
  // ─────────────────────────────────────────────────────────────────────────

  // Sayfa yüklendiğinde kayıtlı şablonu yükle
  React.useEffect(() => {
    if (data?.optikSablon && data.sablonKaynagi === 'ozel') {
      // Mevcut wizard data varsa onu kullan
      setOzelSablon({
        ad: data.optikSablon.ad,
        satirUzunlugu: data.optikSablon.satirUzunlugu || 171,
        ogrenciNo: data.optikSablon.alanlar.ogrenciNo,
        ogrenciAdi: data.optikSablon.alanlar.ogrenciAdi,
        cevaplar: data.optikSablon.alanlar.cevaplar,
        kitapcik: data.optikSablon.alanlar.kitapcik,
        sinif: data.optikSablon.alanlar.sinif,
      });
      if (data.alanlar) setAlanlar(data.alanlar);
      if (data.dersler) setDersler(data.dersler);
    } else {
      // LocalStorage'dan son kaydedilen şablonu yükle
      try {
        const kayitliSablonlar = JSON.parse(localStorage.getItem('ozel_sablonlar') || '[]');
        if (kayitliSablonlar.length > 0) {
          const sonSablon = kayitliSablonlar[kayitliSablonlar.length - 1];
          setOzelSablon({
            ad: sonSablon.ad,
            satirUzunlugu: sonSablon.satirUzunlugu || 171,
            ogrenciNo: sonSablon.alanlar.ogrenciNo,
            ogrenciAdi: sonSablon.alanlar.ogrenciAdi,
            cevaplar: sonSablon.alanlar.cevaplar,
            kitapcik: sonSablon.alanlar.kitapcik,
            sinif: sonSablon.alanlar.sinif,
          });
        }
      } catch (err) {
        console.warn('LocalStorage okuma hatası:', err);
      }
    }
  }, [data]);

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
    
    const ogrenciNoAlan = alanlar.find(a => a.id === 'ogrenciNo' && a.aktif);
    const cevaplarAlan = alanlar.find(a => a.id === 'cevaplar' && a.aktif);
    
    if (ogrenciNoAlan && (ogrenciNoAlan.baslangic <= 0 || ogrenciNoAlan.bitis <= 0)) {
      warnings.push('Öğrenci No pozisyonları eksik');
    }
    
    if (cevaplarAlan && (cevaplarAlan.baslangic <= 0 || cevaplarAlan.bitis <= 0)) {
      warnings.push('Cevaplar pozisyonları eksik');
    }

    // Pozisyon çakışma kontrolü
    const allFields = alanlar
      .filter(a => isFieldActive(a))
      .map(field => ({
        id: field.id,
        label: field.label,
        start: field.baslangic,
        end: field.bitis,
        aktif: field.aktif,
      }))
      .filter(field => {
        const { start, end } = field;
        return (
          Number.isFinite(start) &&
          Number.isFinite(end) &&
          start > 0 &&
          end > 0
        );
      });

    // Çakışma kontrolü
    let overlapFound = false;
    outer: for (let i = 0; i < allFields.length; i++) {
      const f1 = allFields[i];
      if (!isFieldActive(f1)) continue;
      if (!Number.isFinite(f1.start) || !Number.isFinite(f1.end)) continue;
      if (f1.start <= 0 || f1.end <= 0) continue;
      for (let j = i + 1; j < allFields.length; j++) {
        const f2 = allFields[j];
        if (!isFieldActive(f2)) continue;
        if (f1.id === f2.id) continue;
        if (!Number.isFinite(f2.start) || !Number.isFinite(f2.end)) continue;
        if (f2.start <= 0 || f2.end <= 0) continue;
        if (f1.start <= f2.end && f1.end >= f2.start) {
          errors.push(formatOverlapMessage(f1, f2));
          overlapFound = true;
          break outer;
        }
      }
    }

    // Karakter limiti kontrolü
    const maxEnd = allFields.length ? Math.max(...allFields.map(f => f.end)) : 0;
    const usedChars = maxEnd;
    
    if (usedChars > limit) {
      errors.push(`Karakter limiti aşıldı: ${usedChars}/${limit} (${usedChars - limit} fazla)`);
    }

    // Uyarılar
    const hasNameField = alanlar.some(a => (a.id === 'adSoyad' || a.id === 'ogrenciNo') && a.aktif);
    if (!hasNameField) {
      warnings.push('En az bir kimlik alanı (Ad Soyad veya Öğrenci No) eklenmesi önerilir');
    }

    if (dersler.length === 0) {
      warnings.push('En az bir ders tanımlanması önerilir');
    }

    const totalQuestions = dersler.reduce((sum, d) => sum + d.soruSayisi, 0);
    if (cevaplarAlan) {
      const cevapUzunluk = cevaplarAlan.bitis - cevaplarAlan.baslangic + 1;
      if (totalQuestions > cevapUzunluk) {
        warnings.push(`Toplam soru (${totalQuestions}) cevap alanından (${cevapUzunluk}) fazla`);
      }
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
    
    // Tüm aktif alanları ekle
    alanlar.filter(a => a.aktif && a.baslangic > 0 && a.bitis > 0).forEach(alan => {
      segments.push({
        name: alan.label,
        start: alan.baslangic,
        end: alan.bitis,
        type: alan.id === 'cevaplar' ? 'answers' : 'identity',
        color: alan.id === 'cevaplar' ? 'bg-blue-500' : alan.id === 'ogrenciNo' ? 'bg-green-500' : 'bg-emerald-400',
      });
    });

    return segments.sort((a, b) => a.start - b.start);
  }, [alanlar]);

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

  // Şablon sil (sadece özel şablonlar için)
  const handleSablonSil = useCallback((sablonId: string) => {
    try {
      const mevcutSablonlar = JSON.parse(localStorage.getItem('ozel_sablonlar') || '[]');
      const yeniSablonlar = mevcutSablonlar.filter((s: any) => s.id !== sablonId);
      localStorage.setItem('ozel_sablonlar', JSON.stringify(yeniSablonlar));
      toast.success('Şablon silindi');
      // Sayfa yenileyerek listeyi güncelle
      window.location.reload();
    } catch (err) {
      console.error('Şablon silme hatası:', err);
      toast.error('Şablon silinemedi');
    }
  }, []);

  // Şablon düzenle (özel şablona geç ve verileri yükle)
  const handleSablonDuzenle = useCallback((sablon: OptikFormSablonu) => {
    setActiveTab('ozel');
    setOzelSablon({
      ad: sablon.ad,
      satirUzunlugu: sablon.satirUzunlugu || 171,
      ogrenciNo: sablon.alanlar.ogrenciNo,
      ogrenciAdi: sablon.alanlar.ogrenciAdi,
      cevaplar: sablon.alanlar.cevaplar,
      kitapcik: sablon.alanlar.kitapcik,
      sinif: sablon.alanlar.sinif,
    });
    toast.info('Şablon düzenleme moduna alındı - Özel Şablon sekmesini kontrol edin');
  }, []);

  // Özel şablon kaydet
  const handleOzelSablonKaydet = useCallback(() => {
    if (!ozelSablon.ad.trim()) {
      toast.error('Lütfen şablon adı girin.');
      return;
    }

    // Alanlardan Öğrenci No ve Cevaplar'ı al
    const ogrenciNoAlan = alanlar.find(a => a.id === 'ogrenciNo');
    const cevaplarAlan = alanlar.find(a => a.id === 'cevaplar');
    const adSoyadAlan = alanlar.find(a => a.id === 'adSoyad');

    const yeniSablon: OptikFormSablonu = {
      id: `ozel-${Date.now()}`,
      ad: ozelSablon.ad,
      sinavTuru: step1Data.sinavTuru,
      yayinevi: 'Özel',
      toplamSoru: cevaplarAlan ? (cevaplarAlan.bitis - cevaplarAlan.baslangic + 1) : 90,
      satirUzunlugu: ozelSablon.satirUzunlugu,
      alanlar: {
        ogrenciNo: ogrenciNoAlan ? { baslangic: ogrenciNoAlan.baslangic, bitis: ogrenciNoAlan.bitis } : { baslangic: 1, bitis: 10 },
        ogrenciAdi: adSoyadAlan ? { baslangic: adSoyadAlan.baslangic, bitis: adSoyadAlan.bitis } : { baslangic: 11, bitis: 40 },
        cevaplar: cevaplarAlan ? { baslangic: cevaplarAlan.baslangic, bitis: cevaplarAlan.bitis } : { baslangic: 41, bitis: 130 },
        kitapcik: ozelSablon.kitapcik,
        sinif: ozelSablon.sinif,
      },
      aciklama: 'Özel oluşturulmuş şablon',
    };

    // LocalStorage'a kaydet (persist için)
    try {
      const mevcutSablonlar = JSON.parse(localStorage.getItem('ozel_sablonlar') || '[]');
      const varOlanIndex = mevcutSablonlar.findIndex((s: any) => s.id === yeniSablon.id);
      if (varOlanIndex >= 0) {
        mevcutSablonlar[varOlanIndex] = yeniSablon;
      } else {
        mevcutSablonlar.push(yeniSablon);
      }
      localStorage.setItem('ozel_sablonlar', JSON.stringify(mevcutSablonlar));
    } catch (err) {
      console.error('LocalStorage kayıt hatası:', err);
    }

    // Wizard state'ini güncelle (KRİTİK - Bu satır eksikti!)
    onChange({
      optikSablon: yeniSablon,
      sablonKaynagi: 'ozel',
      alanlar: alanlar,
      dersler: dersler,
    });

    toast.success('Özel şablon kaydedildi ve wizard state\'i güncellendi.');
  }, [ozelSablon, step1Data.sinavTuru, alanlar, dersler, onChange]);

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
      dersKodu: '',
      dersAdi: '',
      soruSayisi: 10,
      sira: newSira,
      baslangic: 0,
      bitis: 0,
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
        { id: 'lgs-1', dersKodu: 'TUR', dersAdi: 'Türkçe', soruSayisi: 20, sira: 1, baslangic: 65, bitis: 84 },
        { id: 'lgs-2', dersKodu: 'INK', dersAdi: 'T.C. İnkılap Tarihi', soruSayisi: 10, sira: 2, baslangic: 85, bitis: 94 },
        { id: 'lgs-3', dersKodu: 'DIN', dersAdi: 'Din Kültürü', soruSayisi: 10, sira: 3, baslangic: 95, bitis: 104 },
        { id: 'lgs-4', dersKodu: 'ING', dersAdi: 'İngilizce', soruSayisi: 10, sira: 4, baslangic: 105, bitis: 114 },
        { id: 'lgs-5', dersKodu: 'MAT', dersAdi: 'Matematik', soruSayisi: 20, sira: 5, baslangic: 115, bitis: 134 },
        { id: 'lgs-6', dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, sira: 6, baslangic: 135, bitis: 154 },
      ]);
    } else if (preset === 'TYT') {
      setDersler([
        { id: 'tyt-1', dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', soruSayisi: 40, sira: 1, baslangic: 60, bitis: 99 },
        { id: 'tyt-2', dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', soruSayisi: 20, sira: 2, baslangic: 100, bitis: 119 },
        { id: 'tyt-3', dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', soruSayisi: 40, sira: 3, baslangic: 120, bitis: 159 },
        { id: 'tyt-4', dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', soruSayisi: 20, sira: 4, baslangic: 160, bitis: 179 },
      ]);
    } else if (preset === 'AYT') {
      setDersler([
        { id: 'ayt-1', dersKodu: 'AYT_MAT', dersAdi: 'Matematik', soruSayisi: 40, sira: 1, baslangic: 55, bitis: 94 },
        { id: 'ayt-2', dersKodu: 'AYT_FIZ', dersAdi: 'Fizik', soruSayisi: 14, sira: 2, baslangic: 95, bitis: 108 },
        { id: 'ayt-3', dersKodu: 'AYT_KIM', dersAdi: 'Kimya', soruSayisi: 13, sira: 3, baslangic: 109, bitis: 121 },
        { id: 'ayt-4', dersKodu: 'AYT_BIY', dersAdi: 'Biyoloji', soruSayisi: 13, sira: 4, baslangic: 122, bitis: 134 },
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
                const isOzel = sablon.yayinevi === 'Özel';
                return (
                  <div
                    key={sablon.id}
                    className={cn(
                      'w-full p-2 rounded-lg border transition-all',
                      isSecili
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSablonSec(sablon)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <FileText className={cn('w-4 h-4 flex-shrink-0', isSecili ? 'text-emerald-600' : 'text-gray-400')} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{sablon.ad}</h4>
                          <p className="text-xs text-gray-500">{sablon.yayinevi}</p>
                        </div>
                      </button>
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
                        
                        {/* Düzenle butonu (sadece özel şablonlar için) */}
                        {isOzel && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSablonDuzenle(sablon); }}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        
                        {/* Sil butonu (sadece özel şablonlar için) */}
                        {isOzel && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) handleSablonSil(sablon.id); }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        
                        {isSecili && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ÖZEL ŞABLON - V2 COMPONENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ozel' && (
        <Step3OptikSablonV2 
          step1Data={step1Data} 
          data={data} 
          onChange={onChange} 
        />
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
