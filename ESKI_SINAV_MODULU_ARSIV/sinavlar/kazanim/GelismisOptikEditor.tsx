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
  Library,
  RefreshCw,
  Sparkles,
  MousePointer2,
  GripHorizontal
} from 'lucide-react';
import { OptikAlanTanimi, OptikSablon, ALAN_RENKLERI } from './types';

// Hazır Şablon Kütüphanesi
const SABLON_KUTUPHANESI: Omit<OptikSablon, 'id'>[] = [
  {
    sablonAdi: 'LGS 2024 Standart',
    aciklama: 'MEB LGS 90 soruluk standart format',
    alanTanimlari: [
      { alan: 'ogrenci_no', baslangic: 1, bitis: 6, label: 'Öğrenci No', color: '#F59E0B' },
      { alan: 'ogrenci_adi', baslangic: 7, bitis: 30, label: 'Ad Soyad', color: '#10B981' },
      { alan: 'sinif_no', baslangic: 31, bitis: 34, label: 'Sınıf', color: '#EF4444' },
      { alan: 'kitapcik', baslangic: 35, bitis: 35, label: 'Kitapçık', color: '#8B5CF6' },
      { alan: 'cevaplar', baslangic: 36, bitis: 125, label: 'Cevaplar', color: '#25D366' },
    ],
    cevapBaslangic: 36,
    toplamSoru: 90,
    isDefault: true,
    isActive: true
  },
  {
    sablonAdi: 'TYT 2024 Standart',
    aciklama: 'ÖSYM TYT 120 soruluk format',
    alanTanimlari: [
      { alan: 'tc', baslangic: 1, bitis: 11, label: 'TC Kimlik', color: '#3B82F6' },
      { alan: 'ogrenci_adi', baslangic: 12, bitis: 40, label: 'Ad Soyad', color: '#10B981' },
      { alan: 'kitapcik', baslangic: 41, bitis: 41, label: 'Kitapçık', color: '#8B5CF6' },
      { alan: 'cevaplar', baslangic: 42, bitis: 161, label: 'Cevaplar', color: '#25D366' },
    ],
    cevapBaslangic: 42,
    toplamSoru: 120,
    isDefault: false,
    isActive: true
  },
  {
    sablonAdi: 'Kurum Deneme 50 Soru',
    aciklama: 'Kurum içi 50 soruluk deneme sınavı',
    alanTanimlari: [
      { alan: 'ogrenci_no', baslangic: 1, bitis: 4, label: 'Öğrenci No', color: '#F59E0B' },
      { alan: 'ogrenci_adi', baslangic: 5, bitis: 25, label: 'Ad Soyad', color: '#10B981' },
      { alan: 'sinif_no', baslangic: 26, bitis: 28, label: 'Sınıf', color: '#EF4444' },
      { alan: 'cevaplar', baslangic: 29, bitis: 78, label: 'Cevaplar', color: '#25D366' },
    ],
    cevapBaslangic: 29,
    toplamSoru: 50,
    isDefault: false,
    isActive: true
  }
];

// Alan tipleri
const ALAN_TIPLERI = [
  { id: 'sinif_no', label: 'Sınıf No', icon: '🏫', color: '#EF4444', shortcut: 'S' },
  { id: 'ogrenci_no', label: 'Öğrenci No', icon: '🔢', color: '#F59E0B', shortcut: 'N' },
  { id: 'ogrenci_adi', label: 'Öğrenci Adı', icon: '👤', color: '#10B981', shortcut: 'A' },
  { id: 'tc', label: 'TC Kimlik', icon: '🆔', color: '#3B82F6', shortcut: 'T' },
  { id: 'kitapcik', label: 'Kitapçık', icon: '📖', color: '#8B5CF6', shortcut: 'K' },
  { id: 'cevaplar', label: 'Cevaplar', icon: '✅', color: '#25D366', shortcut: 'C' },
  { id: 'bos', label: 'Boş/Atla', icon: '⬜', color: '#9CA3AF', shortcut: 'B' },
];

interface GelismisOptikEditorProps {
  onSave?: (sablon: Omit<OptikSablon, 'id'>) => void;
  onLoad?: () => Promise<OptikSablon[]>;
  initialSablon?: OptikSablon;
  sampleData?: string;
}

export default function GelismisOptikEditor({
  onSave,
  onLoad,
  initialSablon,
  sampleData
}: GelismisOptikEditorProps) {
  // States
  const [sablonAdi, setSablonAdi] = useState(initialSablon?.sablonAdi || '');
  const [alanlar, setAlanlar] = useState<OptikAlanTanimi[]>(initialSablon?.alanTanimlari || []);
  const [cevapBaslangic, setCevapBaslangic] = useState(initialSablon?.cevapBaslangic || 0);
  const [toplamSoru, setToplamSoru] = useState(initialSablon?.toplamSoru || 90);
  const [ornekSatir, setOrnekSatir] = useState(sampleData || '');
  
  // Selection states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [activeAlanTipi, setActiveAlanTipi] = useState<string | null>(null);
  
  // UI states
  const [showRuler, setShowRuler] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const alan = ALAN_TIPLERI.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (alan) {
        setActiveAlanTipi(alan.id);
      }
      
      if (e.key === 'Escape') {
        setActiveAlanTipi(null);
        setDragStart(null);
        setDragEnd(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((index: number) => {
    if (!activeAlanTipi) return;
    setIsDragging(true);
    setDragStart(index);
    setDragEnd(index);
  }, [activeAlanTipi]);

  const handleMouseEnter = useCallback((index: number) => {
    if (isDragging) {
      setDragEnd(index);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null && activeAlanTipi) {
      const start = Math.min(dragStart, dragEnd) + 1;
      const end = Math.max(dragStart, dragEnd) + 1;
      
      const alanTipi = ALAN_TIPLERI.find(t => t.id === activeAlanTipi);
      if (!alanTipi) return;

      // Örtüşen alanları kontrol et
      const overlapping = alanlar.filter(a => 
        (start <= a.bitis && end >= a.baslangic)
      );

      if (overlapping.length > 0) {
        // Örtüşen alanları kaldır
        setAlanlar(prev => prev.filter(a => !overlapping.includes(a)));
      }

      const yeniAlan: OptikAlanTanimi = {
        alan: activeAlanTipi as any,
        baslangic: start,
        bitis: end,
        label: alanTipi.label,
        color: alanTipi.color
      };

      setAlanlar(prev => [...prev, yeniAlan].sort((a, b) => (a?.baslangic || 0) - (b?.baslangic || 0)));

      // Cevaplar alanı ise başlangıç pozisyonunu güncelle
      if (activeAlanTipi === 'cevaplar') {
        setCevapBaslangic(start);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, activeAlanTipi, alanlar]);

  // Karakter hangi alanda?
  const getCharField = useCallback((charIndex: number): OptikAlanTanimi | null => {
    const pos = charIndex + 1;
    return alanlar.find(a => pos >= a.baslangic && pos <= a.bitis) || null;
  }, [alanlar]);

  // Drag selection içinde mi?
  const isInDragSelection = useCallback((charIndex: number): boolean => {
    if (!isDragging || dragStart === null || dragEnd === null) return false;
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);
    return charIndex >= min && charIndex <= max;
  }, [isDragging, dragStart, dragEnd]);

  // Şablonu test et
  const testTemplate = useCallback(() => {
    if (!ornekSatir || alanlar.length === 0) return;

    const results: Record<string, string> = {};
    alanlar.forEach(alan => {
      const value = ornekSatir.substring(alan.baslangic - 1, alan.bitis);
      results[alan.alan] = value.trim();
    });

    setTestResults(results);
    setTestMode(true);
  }, [ornekSatir, alanlar]);

  // Şablonu yükle
  const loadTemplate = useCallback((sablon: Omit<OptikSablon, 'id'>) => {
    setSablonAdi(sablon.sablonAdi);
    setAlanlar(sablon.alanTanimlari);
    setCevapBaslangic(sablon.cevapBaslangic);
    setToplamSoru(sablon.toplamSoru);
    setShowLibrary(false);
  }, []);

  // Alan sil
  const removeField = useCallback((index: number) => {
    setAlanlar(prev => prev.filter((_, i) => i !== index));
  }, []);

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

    const sablon: Omit<OptikSablon, 'id'> = {
      sablonAdi,
      alanTanimlari: alanlar,
      cevapBaslangic,
      toplamSoru,
      isDefault: false,
      isActive: true
    };

    onSave?.(sablon);
  };

  // İstatistikler
  const stats = useMemo(() => {
    const totalChars = ornekSatir.length;
    // GÜVENLİ ERİŞİM: baslangic veya bitis undefined olabilir
    const mappedChars = alanlar.reduce((sum, a) => {
      if (typeof a?.baslangic === 'number' && typeof a?.bitis === 'number') {
        return sum + (a.bitis - a.baslangic + 1);
      }
      return sum;
    }, 0);
    return {
      totalChars,
      mappedChars,
      unmappedChars: totalChars - mappedChars,
      fieldCount: alanlar.length,
      coverage: totalChars > 0 ? ((mappedChars / totalChars) * 100).toFixed(1) : '0'
    };
  }, [ornekSatir, alanlar]);

  // Ruler oluştur
  const renderRuler = () => {
    const chars = ornekSatir.length || 100;
    const markers = [];
    
    for (let i = 0; i <= chars; i += 10) {
      markers.push(
        <div
          key={i}
          className="absolute text-[10px] text-slate-400 transform -translate-x-1/2"
          style={{ left: `${i * 24}px` }}
        >
          <div className="h-3 w-px bg-slate-300 mx-auto mb-0.5" />
          {i}
        </div>
      );
    }
    
    return markers;
  };

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Grid3X3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gelişmiş Optik Şablon Editörü</h2>
            <p className="text-sm text-slate-500">Sürükle-seç ile alan tanımlayın</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showLibrary ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Library size={18} />
            Şablon Kütüphanesi
          </button>
          <button
            onClick={() => setShowRuler(!showRuler)}
            className={`p-2 rounded-lg transition-colors ${
              showRuler ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}
            title="Cetvel"
          >
            <Ruler size={20} />
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
            title="Yardım"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Şablon Kütüphanesi */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Library size={18} className="text-indigo-600" />
              <h4 className="font-semibold text-indigo-800">Hazır Şablonlar</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SABLON_KUTUPHANESI.map((sablon, index) => (
                <button
                  key={index}
                  onClick={() => loadTemplate(sablon)}
                  className="p-4 bg-white rounded-xl border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all text-left"
                >
                  <p className="font-semibold text-slate-700">{sablon.sablonAdi}</p>
                  <p className="text-xs text-slate-500 mt-1">{sablon.aciklama}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-indigo-600">
                    <span>{sablon.toplamSoru} soru</span>
                    <span>•</span>
                    <span>{sablon.alanTanimlari.length} alan</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yardım Paneli */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <h4 className="font-semibold text-blue-800 mb-3">Nasıl Kullanılır?</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p className="font-medium mb-2">🖱️ Fare ile:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Alan tipi butonuna tıklayın</li>
                  <li>Karakterler üzerinde sürükleyin</li>
                  <li>Bırakınca alan oluşur</li>
                </ol>
              </div>
              <div>
                <p className="font-medium mb-2">⌨️ Klavye Kısayolları:</p>
                <ul className="space-y-1">
                  {ALAN_TIPLERI.map(t => (
                    <li key={t.id}>
                      <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">{t.shortcut}</kbd>
                      <span className="ml-2">{t.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Şablon Ayarları */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı *</label>
          <input
            type="text"
            value={sablonAdi}
            onChange={(e) => setSablonAdi(e.target.value)}
            placeholder="Örn: Dikmen Çözüm LGS 2024"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Toplam Soru Sayısı</label>
          <input
            type="number"
            value={toplamSoru}
            onChange={(e) => setToplamSoru(parseInt(e.target.value) || 90)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cevap Başlangıç Pozisyonu</label>
          <input
            type="number"
            value={cevapBaslangic}
            onChange={(e) => setCevapBaslangic(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            min={0}
          />
        </div>
      </div>

      {/* Örnek Veri */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Örnek Optik Satırı Yapıştırın
        </label>
        <textarea
          value={ornekSatir}
          onChange={(e) => setOrnekSatir(e.target.value.split('\n')[0] || '')}
          placeholder="Optik okuyucudan gelen örnek bir satırı buraya yapıştırın..."
          className="w-full h-20 px-4 py-3 font-mono text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Alan Tipi Seçici */}
      {ornekSatir && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Alan Tipi Seçin ve Karakterleri Sürükleyerek İşaretleyin
          </label>
          <div className="flex flex-wrap gap-2">
            {ALAN_TIPLERI.map((tip) => (
              <button
                key={tip.id}
                onClick={() => setActiveAlanTipi(activeAlanTipi === tip.id ? null : tip.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                  activeAlanTipi === tip.id
                    ? 'shadow-lg scale-105'
                    : 'border-transparent bg-slate-100 hover:bg-slate-200'
                }`}
                style={{
                  borderColor: activeAlanTipi === tip.id ? tip.color : undefined,
                  backgroundColor: activeAlanTipi === tip.id ? `${tip.color}15` : undefined,
                  color: activeAlanTipi === tip.id ? tip.color : undefined
                }}
              >
                <span className="text-lg">{tip.icon}</span>
                <span className="font-medium">{tip.label}</span>
                <kbd className="px-1.5 py-0.5 bg-white/50 rounded text-[10px] font-mono opacity-60">{tip.shortcut}</kbd>
              </button>
            ))}
          </div>
          
          {activeAlanTipi && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg"
            >
              <MousePointer2 size={16} />
              <span>
                <strong>{ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.label}</strong> seçili. 
                Aşağıdaki karakterler üzerinde sürükleyerek alan oluşturun.
              </span>
            </motion.div>
          )}
        </div>
      )}

      {/* Görsel Editör */}
      {ornekSatir && (
        <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
          {/* Cetvel */}
          {showRuler && (
            <div className="relative h-8 overflow-x-auto mb-2" style={{ minWidth: `${ornekSatir.length * 24}px` }}>
              {renderRuler()}
            </div>
          )}

          {/* Karakter Haritası */}
          <div 
            ref={containerRef}
            className="overflow-x-auto pb-4"
            style={{ cursor: activeAlanTipi ? 'crosshair' : 'default' }}
          >
            <div className="flex font-mono text-sm select-none" style={{ minWidth: `${ornekSatir.length * 24}px` }}>
              {Array.from(ornekSatir).map((char, i) => {
                const field = getCharField(i);
                const inSelection = isInDragSelection(i);
                
                return (
                  <div
                    key={i}
                    onMouseDown={() => handleMouseDown(i)}
                    onMouseEnter={() => handleMouseEnter(i)}
                    className={`w-6 h-10 flex items-center justify-center rounded transition-all text-sm font-medium ${
                      inSelection
                        ? 'ring-2 ring-offset-1 scale-110 z-10'
                        : ''
                    } ${activeAlanTipi && !field ? 'hover:bg-slate-300 cursor-crosshair' : ''}`}
                    style={{
                      backgroundColor: inSelection 
                        ? ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.color 
                        : (field?.color || '#E2E8F0'),
                      color: inSelection || field ? 'white' : '#475569',
                      ringColor: inSelection ? ALAN_TIPLERI.find(t => t.id === activeAlanTipi)?.color : undefined,
                      textShadow: (inSelection || field) ? '0 1px 2px rgba(0,0,0,0.3)' : undefined
                    }}
                    title={`Pos ${i + 1}: "${char}" ${field ? `(${field.label})` : ''}`}
                  >
                    {char === ' ' ? '·' : char}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seçim Bilgisi */}
          {isDragging && dragStart !== null && dragEnd !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border">
              <GripHorizontal size={16} />
              <span>
                Seçili: <strong>{Math.min(dragStart, dragEnd) + 1}</strong> - <strong>{Math.max(dragStart, dragEnd) + 1}</strong>
                ({Math.abs(dragEnd - dragStart) + 1} karakter)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tanımlı Alanlar */}
      {alanlar.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              Tanımlı Alanlar ({alanlar.length})
            </label>
            <button
              onClick={testTemplate}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition-colors"
            >
              <Sparkles size={14} />
              Şablonu Test Et
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {alanlar.map((alan, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-3 rounded-xl border-2"
                style={{
                  backgroundColor: `${alan.color}10`,
                  borderColor: `${alan.color}40`
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: alan.color }}
                  />
                  <div>
                    <p className="font-medium text-slate-700">{alan.label}</p>
                    <p className="text-xs text-slate-500">
                      {alan.baslangic} - {alan.bitis} ({alan.bitis - alan.baslangic + 1} kr)
                    </p>
                    {ornekSatir && (
                      <p className="text-xs font-mono text-slate-400 mt-0.5 truncate max-w-[150px]">
                        "{ornekSatir.substring(alan.baslangic - 1, alan.bitis)}"
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeField(index)}
                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Test Sonuçları */}
      <AnimatePresence>
        {testMode && Object.keys(testResults).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                <Check size={18} />
                Test Sonuçları
              </h4>
              <button
                onClick={() => setTestMode(false)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(testResults).map(([alan, deger]) => {
                const alanInfo = ALAN_TIPLERI.find(t => t.id === alan);
                return (
                  <div key={alan} className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">{alanInfo?.label || alan}</p>
                    <p className="font-mono font-medium text-slate-800 truncate">{deger || '(boş)'}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* İstatistikler */}
      {ornekSatir && (
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-3 bg-slate-100 rounded-xl">
            <div className="text-xl font-bold text-slate-700">{stats.totalChars}</div>
            <div className="text-xs text-slate-500">Toplam Karakter</div>
          </div>
          <div className="text-center p-3 bg-emerald-100 rounded-xl">
            <div className="text-xl font-bold text-emerald-600">{stats.mappedChars}</div>
            <div className="text-xs text-slate-500">Eşlenen</div>
          </div>
          <div className="text-center p-3 bg-amber-100 rounded-xl">
            <div className="text-xl font-bold text-amber-600">{stats.unmappedChars}</div>
            <div className="text-xs text-slate-500">Eşlenmemiş</div>
          </div>
          <div className="text-center p-3 bg-blue-100 rounded-xl">
            <div className="text-xl font-bold text-blue-600">{stats.fieldCount}</div>
            <div className="text-xs text-slate-500">Alan Sayısı</div>
          </div>
          <div className="text-center p-3 bg-purple-100 rounded-xl">
            <div className="text-xl font-bold text-purple-600">%{stats.coverage}</div>
            <div className="text-xs text-slate-500">Kapsam</div>
          </div>
        </div>
      )}

      {/* Kaydet Butonu */}
      {alanlar.length > 0 && (
        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={20} />
          Şablonu Kaydet
        </button>
      )}
    </div>
  );
}

