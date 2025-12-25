'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Save,
  Upload,
  Eye,
  Trash2,
  Plus,
  Check,
  X,
  FileText,
  Layers,
  ArrowRight,
  Grid3X3,
  Ruler,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  MousePointer2,
  Type,
  Hash,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { OptikAlanTanimi, OptikSablon, CevapAnahtariSatir, DERS_ISIMLERI } from './types';

interface OptikSablonEditorProps {
  onSave?: (sablon: Omit<OptikSablon, 'id'>) => void;
  onLoad?: () => Promise<OptikSablon[]>;
  initialSablon?: OptikSablon;
  sampleData?: string;
  cevapAnahtari?: CevapAnahtariSatir[]; // Cevap anahtarından yapı al
}

// Alan tipleri ve renkleri
const ALAN_TIPLERI = [
  { id: 'ogrenci_no', label: 'Öğrenci No', icon: '🔢', color: '#F59E0B', shortcut: '1' },
  { id: 'ogrenci_adi', label: 'Öğrenci Adı', icon: '👤', color: '#10B981', shortcut: '2' },
  { id: 'tc', label: 'TC Kimlik', icon: '🆔', color: '#3B82F6', shortcut: '3' },
  { id: 'sinif', label: 'Sınıf', icon: '🏫', color: '#8B5CF6', shortcut: '4' },
  { id: 'kitapcik', label: 'Kitapçık', icon: '📖', color: '#EC4899', shortcut: '5' },
  { id: 'cevaplar', label: 'Cevaplar', icon: '✅', color: '#25D366', shortcut: '6' },
  { id: 'bos', label: 'Boş/Atla', icon: '⬜', color: '#9CA3AF', shortcut: '0' },
];

export default function OptikSablonEditor({
  onSave,
  onLoad,
  initialSablon,
  sampleData,
  cevapAnahtari = []
}: OptikSablonEditorProps) {
  // States
  const [sablonAdi, setSablonAdi] = useState(initialSablon?.sablonAdi || '');
  const [alanlar, setAlanlar] = useState<OptikAlanTanimi[]>(initialSablon?.alanTanimlari || []);
  const [toplamSoru, setToplamSoru] = useState(initialSablon?.toplamSoru || cevapAnahtari.length || 90);
  const [ornekSatir, setOrnekSatir] = useState(sampleData || '');
  
  // Seçim states
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [activeAlanTipi, setActiveAlanTipi] = useState<string | null>(null);
  
  // UI states
  const [inputMode, setInputMode] = useState<'visual' | 'manual' | 'auto'>('visual');
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Cevap anahtarından bilgi al
  const cevapAnahtariInfo = useMemo(() => {
    if (!cevapAnahtari.length) return null;
    
    const dersler = [...new Set(cevapAnahtari.map(c => c.dersKodu))];
    const dersBazliSayilar = dersler.map(d => ({
      dersKodu: d,
      dersAdi: DERS_ISIMLERI[d] || d,
      soruSayisi: cevapAnahtari.filter(c => c.dersKodu === d).length
    }));
    
    return {
      toplamSoru: cevapAnahtari.length,
      dersSayisi: dersler.length,
      dersBazliSayilar
    };
  }, [cevapAnahtari]);

  // Toplam soru sayısını cevap anahtarından güncelle
  useEffect(() => {
    if (cevapAnahtariInfo) {
      setToplamSoru(cevapAnahtariInfo.toplamSoru);
    }
  }, [cevapAnahtariInfo]);

  // Seçim aralığı
  const selectedRange = useMemo(() => {
    if (selectionStart === null) return null;
    const end = selectionEnd ?? selectionStart;
    return {
      start: Math.min(selectionStart, end),
      end: Math.max(selectionStart, end)
    };
  }, [selectionStart, selectionEnd]);

  // Mouse olayları - Seçim scroll sırasında korunuyor
  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    if (!activeAlanTipi) return;
    e.preventDefault(); // Scroll ile çakışmayı önle
    setIsSelecting(true);
    setSelectionStart(index);
    setSelectionEnd(index);
  }, [activeAlanTipi]);

  const handleMouseMove = useCallback((index: number) => {
    if (isSelecting && selectionStart !== null) {
      setSelectionEnd(index);
    }
  }, [isSelecting, selectionStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Sadece seçim modunu kapat, seçimi silme!
    if (isSelecting) {
      setIsSelecting(false);
    }
  }, [isSelecting]);

  // Seçimi temizle - sadece kullanıcı istediğinde
  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setActiveAlanTipi(null);
  }, []);

  // Seçimi alan olarak ekle
  const addSelectedAsField = useCallback(() => {
    if (!selectedRange || !activeAlanTipi) return;

    const alanTipi = ALAN_TIPLERI.find(t => t.id === activeAlanTipi);
    if (!alanTipi) return;

    const yeniAlan: OptikAlanTanimi = {
      alan: activeAlanTipi as any,
      baslangic: selectedRange.start + 1, // 1-indexed
      bitis: selectedRange.end + 1,
      label: alanTipi.label,
      color: alanTipi.color
    };

    // Örtüşen alanları kontrol et ve kaldır
    setAlanlar(prev => {
      const filtered = prev.filter(a => 
        !(yeniAlan.baslangic <= a.bitis && yeniAlan.bitis >= a.baslangic)
      );
      return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
    });

    // Seçimi temizle
    setSelectionStart(null);
    setSelectionEnd(null);
    setActiveAlanTipi(null);
  }, [selectedRange, activeAlanTipi]);

  // Manuel alan ekleme
  const addManualField = useCallback((tipId: string, baslangic: number, bitis: number) => {
    const alanTipi = ALAN_TIPLERI.find(t => t.id === tipId);
    if (!alanTipi || baslangic > bitis || baslangic < 1) return;

    const yeniAlan: OptikAlanTanimi = {
      alan: tipId as any,
      baslangic,
      bitis,
      label: alanTipi.label,
      color: alanTipi.color
    };

    setAlanlar(prev => {
      const filtered = prev.filter(a => a.alan !== tipId);
      return [...filtered, yeniAlan].sort((a, b) => a.baslangic - b.baslangic);
    });
  }, []);

  // Alan sil
  const removeField = useCallback((index: number) => {
    setAlanlar(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Karakter hangi alanda?
  const getCharField = useCallback((charIndex: number): OptikAlanTanimi | null => {
    const pos = charIndex + 1; // 1-indexed
    return alanlar.find(a => pos >= a.baslangic && pos <= a.bitis) || null;
  }, [alanlar]);

  // Karakter seçili mi?
  const isCharSelected = useCallback((charIndex: number): boolean => {
    if (!selectedRange) return false;
    return charIndex >= selectedRange.start && charIndex <= selectedRange.end;
  }, [selectedRange]);

  // Şablonu kaydet
  const handleSave = () => {
    if (!sablonAdi.trim()) {
      alert('Lütfen şablon adı girin');
      return;
    }
    if (alanlar.length === 0) {
      alert('En az bir alan tanımlamalısınız');
      return;
    }

    const cevaplarAlani = alanlar.find(a => a.alan === 'cevaplar');

    const sablon: Omit<OptikSablon, 'id'> = {
      sablonAdi,
      alanTanimlari: alanlar,
      cevapBaslangic: cevaplarAlani?.baslangic || 0,
      toplamSoru,
      isDefault: false,
      isActive: true
    };

    onSave?.(sablon);
  };

  // İstatistikler
  const stats = useMemo(() => {
    const totalChars = ornekSatir.length;
    const mappedChars = alanlar.reduce((sum, a) => sum + (a.bitis - a.baslangic + 1), 0);
    return {
      totalChars,
      mappedChars,
      unmappedChars: totalChars - mappedChars,
      fieldCount: alanlar.length
    };
  }, [ornekSatir, alanlar]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Sayı tuşları ile alan tipi seçimi
      const alanTipi = ALAN_TIPLERI.find(t => t.shortcut === key);
      if (alanTipi && ornekSatir) {
        e.preventDefault();
        setActiveAlanTipi(alanTipi.id);
      }
      
      // ESC ile seçimi temizle
      if (key === 'Escape') {
        e.preventDefault();
        clearSelection();
      }
      
      // Enter ile seçimi onayla
      if (key === 'Enter' && selectedRange && activeAlanTipi) {
        e.preventDefault();
        addSelectedAsField();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ornekSatir, selectedRange, activeAlanTipi, addSelectedAsField, clearSelection]);

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp} onMouseLeave={() => setIsSelecting(false)}>
      {/* Başlık ve Modlar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Grid3X3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Optik Şablon Editörü</h2>
            <p className="text-sm text-slate-500">Karakterleri seçerek alan tanımlayın</p>
          </div>
        </div>
        
        {/* Mod Seçici */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'visual', label: 'Görsel Seçim', icon: MousePointer2 },
            { id: 'manual', label: 'Manuel Giriş', icon: Type },
            { id: 'auto', label: 'Otomatik', icon: Sparkles },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setInputMode(mode.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === mode.id
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cevap Anahtarı Bilgisi */}
      {cevapAnahtariInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Cevap Anahtarı Algılandı</p>
                <p className="text-sm text-emerald-600">
                  {cevapAnahtariInfo.toplamSoru} soru, {cevapAnahtariInfo.dersSayisi} ders
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {cevapAnahtariInfo.dersBazliSayilar.map(d => (
                <span key={d.dersKodu} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  {d.dersAdi}: {d.soruSayisi}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Şablon Adı ve Soru Sayısı */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı</label>
          <input
            type="text"
            value={sablonAdi}
            onChange={(e) => setSablonAdi(e.target.value)}
            placeholder="Örn: LGS 90 Soru Şablonu"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Toplam Soru Sayısı</label>
          <input
            type="number"
            value={toplamSoru}
            onChange={(e) => setToplamSoru(parseInt(e.target.value) || 90)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            min={1}
          />
        </div>
      </div>

      {/* Örnek Satır Girişi */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Örnek Optik Satırı <span className="text-slate-400">(TXT dosyasından bir satır yapıştırın)</span>
        </label>
        <textarea
          value={ornekSatir}
          onChange={(e) => {
            const firstLine = e.target.value.split('\n')[0] || '';
            setOrnekSatir(firstLine);
          }}
          placeholder="Optik okuyucudan gelen örnek bir satırı buraya yapıştırın..."
          className="w-full h-20 px-4 py-3 font-mono text-sm border-2 border-dashed border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-slate-500">
          Toplam: <strong>{ornekSatir.length}</strong> karakter
        </p>
      </div>

      {/* GÖRSEL SEÇİM MODU */}
      {inputMode === 'visual' && ornekSatir && (
        <div className="space-y-4">
          {/* Alan Tipi Seçici */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                1️⃣ Alan tipi seçin, 2️⃣ Aşağıda karakterleri sürükleyerek seçin
              </label>
              {activeAlanTipi && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded"
                >
                  ✕ Seçimi Temizle (ESC)
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ALAN_TIPLERI.map((tip) => {
                const existingField = alanlar.find(a => a.alan === tip.id);
                return (
                  <button
                    key={tip.id}
                    onClick={() => setActiveAlanTipi(activeAlanTipi === tip.id ? null : tip.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                      activeAlanTipi === tip.id
                        ? 'border-current shadow-lg scale-105'
                        : existingField
                          ? 'border-current opacity-60'
                          : 'border-transparent bg-white hover:shadow-md'
                    }`}
                    style={{
                      borderColor: activeAlanTipi === tip.id || existingField ? tip.color : undefined,
                      backgroundColor: activeAlanTipi === tip.id ? `${tip.color}15` : undefined,
                      color: activeAlanTipi === tip.id || existingField ? tip.color : undefined
                    }}
                  >
                    <span className="text-lg">{tip.icon}</span>
                    <span className="font-medium">{tip.label}</span>
                    <span className="text-xs opacity-60">({tip.shortcut})</span>
                    {existingField && (
                      <span className="text-xs bg-current/20 px-1.5 py-0.5 rounded">
                        {existingField.baslangic}-{existingField.bitis}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Karakter Haritası - TEK SATIR YATAY */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Karakter Haritası</span>
                {selectedRange && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Seçili: {selectedRange.start + 1} - {selectedRange.end + 1} ({selectedRange.end - selectedRange.start + 1} karakter)
                  </span>
                )}
              </div>
              {activeAlanTipi && (
                <span className="text-sm text-slate-500">
                  🖱️ Sürükleyerek seçin, sonra Enter veya "Ekle" butonuna tıklayın
                </span>
              )}
            </div>
            
            {/* Cetvel */}
            <div 
              className="overflow-x-auto"
              style={{ cursor: activeAlanTipi ? 'crosshair' : 'default' }}
            >
              {/* Numara cetveli */}
              <div className="flex border-b border-slate-100 bg-slate-50 min-w-max">
                {Array.from({ length: ornekSatir.length }, (_, i) => (
                  <div
                    key={i}
                    className="w-7 h-5 flex-shrink-0 text-center text-[10px] text-slate-400"
                  >
                    {(i + 1) % 10 === 0 ? (i + 1) : ((i + 1) % 5 === 0 ? '·' : '')}
                  </div>
                ))}
              </div>
              
              {/* Karakterler - TEK SATIR */}
              <div 
                ref={containerRef}
                className="flex min-w-max p-2 select-none"
              >
                {Array.from(ornekSatir).map((char, i) => {
                  const field = getCharField(i);
                  const isSelected = isCharSelected(i);
                  
                  return (
                    <div
                      key={i}
                      onMouseDown={(e) => handleMouseDown(i, e)}
                      onMouseEnter={() => handleMouseMove(i)}
                      className={`w-7 h-9 flex items-center justify-center font-mono text-sm rounded transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110 z-10'
                          : field
                            ? 'text-white'
                            : activeAlanTipi
                              ? 'hover:bg-slate-200 cursor-crosshair'
                              : 'hover:bg-slate-100'
                      }`}
                      style={{
                        backgroundColor: isSelected ? undefined : (field?.color || undefined),
                      }}
                      title={`${i + 1}: "${char}" ${field ? `(${field.label})` : ''}`}
                    >
                      {char === ' ' ? '·' : char}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Seçim Onay Butonu */}
            {selectedRange && activeAlanTipi && (
              <div className="p-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.icon}</span>
                  <div>
                    <p className="font-medium text-blue-800">
                      {ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.label}
                    </p>
                    <p className="text-sm text-blue-600">
                      Karakter {selectedRange.start + 1} - {selectedRange.end + 1} 
                      <span className="ml-2 font-mono bg-blue-100 px-2 py-0.5 rounded">
                        "{ornekSatir.substring(selectedRange.start, selectedRange.end + 1)}"
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    İptal (ESC)
                  </button>
                  <button
                    onClick={addSelectedAsField}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <Plus size={18} />
                    Bu Alanı Ekle (Enter)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANUEL GİRİŞ MODU */}
      {inputMode === 'manual' && ornekSatir && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Type size={18} />
            Manuel Alan Tanımlama
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {ALAN_TIPLERI.filter(t => t.id !== 'bos').map((tip) => {
              const existingField = alanlar.find(a => a.alan === tip.id);
              return (
                <div 
                  key={tip.id} 
                  className="p-3 rounded-xl border"
                  style={{ 
                    backgroundColor: existingField ? `${tip.color}10` : undefined,
                    borderColor: existingField ? tip.color : '#e2e8f0'
                  }}
                >
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: tip.color }}>
                    <span className="text-lg">{tip.icon}</span>
                    {tip.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Başlangıç"
                      min={1}
                      max={ornekSatir.length}
                      defaultValue={existingField?.baslangic || ''}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2"
                      id={`manual-start-${tip.id}`}
                    />
                    <span className="text-slate-400 self-center">—</span>
                    <input
                      type="number"
                      placeholder="Bitiş"
                      min={1}
                      max={ornekSatir.length}
                      defaultValue={existingField?.bitis || ''}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2"
                      id={`manual-end-${tip.id}`}
                    />
                    <button
                      onClick={() => {
                        const startEl = document.getElementById(`manual-start-${tip.id}`) as HTMLInputElement;
                        const endEl = document.getElementById(`manual-end-${tip.id}`) as HTMLInputElement;
                        const start = parseInt(startEl?.value);
                        const end = parseInt(endEl?.value);
                        if (start && end) {
                          addManualField(tip.id, start, end);
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                  {existingField && (
                    <p className="text-xs mt-2 font-mono truncate" style={{ color: tip.color }}>
                      "{ornekSatir.substring(existingField.baslangic - 1, existingField.bitis)}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OTOMATİK MOD */}
      {inputMode === 'auto' && ornekSatir && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-purple-700 flex items-center gap-2">
              <Sparkles size={18} />
              Otomatik Algılama
            </h3>
            <button
              onClick={() => {
                // Basit otomatik algılama
                const patterns = [
                  { pattern: /^\d{6}/, field: 'ogrenci_no' },
                  { pattern: /[A-ZÇĞİÖŞÜ]{2,}/, field: 'ogrenci_adi' },
                  { pattern: /\d{11}/, field: 'tc' },
                  { pattern: /\d[A-Z]/, field: 'sinif' },
                ];
                // TODO: Gelişmiş otomatik algılama
                alert('Otomatik algılama geliştirme aşamasında. Lütfen manuel veya görsel seçim kullanın.');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <RefreshCw size={16} />
              Algıla
            </button>
          </div>
          
          <div className="text-sm text-purple-600 bg-white/50 rounded-lg p-3">
            <p>⚠️ Bu özellik geliştirme aşamasındadır.</p>
            <p className="mt-1">Şimdilik <strong>Görsel Seçim</strong> veya <strong>Manuel Giriş</strong> modlarını kullanın.</p>
          </div>
        </div>
      )}

      {/* Tanımlı Alanlar Özeti */}
      {alanlar.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Layers size={16} />
              Tanımlı Alanlar ({alanlar.length})
            </h3>
            <div className="text-sm text-slate-500">
              {stats.mappedChars} / {stats.totalChars} karakter eşlendi
            </div>
          </div>
          
          <div className="p-3 space-y-2">
            {alanlar.map((alan, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: `${alan.color}10` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ALAN_TIPLERI.find(t => t.id === alan.alan)?.icon}</span>
                  <div>
                    <p className="font-medium" style={{ color: alan.color }}>{alan.label}</p>
                    <p className="text-xs text-slate-500">
                      Karakter {alan.baslangic} - {alan.bitis} ({alan.bitis - alan.baslangic + 1} karakter)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ornekSatir && (
                    <code className="text-xs bg-white px-2 py-1 rounded border max-w-xs truncate">
                      {ornekSatir.substring(alan.baslangic - 1, alan.bitis)}
                    </code>
                  )}
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İstatistikler */}
      {ornekSatir && (
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-700">{stats.totalChars}</div>
            <div className="text-xs text-slate-500">Toplam Karakter</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">{stats.mappedChars}</div>
            <div className="text-xs text-slate-500">Eşlenen</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="text-2xl font-bold text-amber-600">{stats.unmappedChars}</div>
            <div className="text-xs text-slate-500">Eşlenmemiş</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{stats.fieldCount}</div>
            <div className="text-xs text-slate-500">Alan Sayısı</div>
          </div>
        </div>
      )}

      {/* Kaydet Butonu */}
      {alanlar.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={20} />
          Şablonu Kaydet ve Devam Et
        </button>
      )}
    </div>
  );
}
