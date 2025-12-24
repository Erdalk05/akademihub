/**
 * ============================================
 * AkademiHub - Fixed Width Character Mapper
 * ============================================
 * 
 * OPTİK OKUYUCU ÇIKTILARI İÇİN
 * KARAKTER POZİSYONUNA DAYALI ALAN EŞLEŞTİRME
 * 
 * Her satır = 1 öğrenci
 * Her karakter = 1 pozisyon
 * Alanlar = Başlangıç-Bitiş pozisyonları
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  CheckCircle, AlertCircle, RotateCcw, ChevronRight,
  User, Hash, School, BookOpen, FileText, SkipForward,
  Sparkles, Eye, Save
} from 'lucide-react';
import { correctOCRErrors } from '../txt/ocrCorrection';

// ==================== TYPES ====================

type FieldType = 'ogrenci_no' | 'tc' | 'ad' | 'soyad' | 'sinif' | 'kitapcik' | 'cevaplar' | 'atla';

interface FixedWidthField {
  id: string;
  type: FieldType;
  start: number; // 1-based
  end: number;   // inclusive
  color: string;
}

interface ParsedStudent {
  ogrenciNo?: string;
  tc?: string;
  ad?: string;
  soyad?: string;
  sinif?: string;
  kitapcik?: string;
  cevaplar?: string;
}

// ==================== CONSTANTS ====================

const FIELD_CONFIG: Record<FieldType, { label: string; emoji: string; color: string; description: string }> = {
  ogrenci_no: { label: 'Öğrenci No', emoji: '🔢', color: '#3B82F6', description: 'Okul numarası' },
  tc: { label: 'TC Kimlik', emoji: '🪪', color: '#8B5CF6', description: '11 haneli TC' },
  ad: { label: 'Ad', emoji: '👤', color: '#10B981', description: 'Öğrenci adı' },
  soyad: { label: 'Soyad', emoji: '👥', color: '#14B8A6', description: 'Öğrenci soyadı' },
  sinif: { label: 'Sınıf', emoji: '🏫', color: '#F59E0B', description: '8A, 8C...' },
  kitapcik: { label: 'Kitapçık', emoji: '📖', color: '#EC4899', description: 'A, B, C, D' },
  cevaplar: { label: 'Cevaplar', emoji: '✍️', color: '#EF4444', description: 'Sınav cevapları' },
  atla: { label: 'Atla', emoji: '⏭️', color: '#6B7280', description: 'Bu alanı kullanma' }
};

// ==================== MAIN COMPONENT ====================

interface FixedWidthMapperProps {
  rawLines: string[];
  onComplete: (fields: FixedWidthField[], parsedStudents: ParsedStudent[]) => void;
  onBack: () => void;
}

export function FixedWidthMapper({ rawLines, onComplete, onBack }: FixedWidthMapperProps) {
  const [fields, setFields] = useState<FixedWidthField[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Örnek satır (ilk satır)
  const sampleLine = useMemo(() => {
    const line = rawLines[currentRow] || '';
    return correctOCRErrors(line);
  }, [rawLines, currentRow]);
  
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length)), [rawLines]);
  
  // Karakter dizisi
  const characters = useMemo(() => {
    return Array.from({ length: maxLength }, (_, i) => sampleLine[i] || ' ');
  }, [sampleLine, maxLength]);
  
  // Seçim başlat
  const handleMouseDown = useCallback((index: number) => {
    // Zaten tanımlı bir alanda mı?
    const existingField = fields.find(f => index >= f.start - 1 && index <= f.end - 1);
    if (existingField) return;
    
    setIsSelecting(true);
    setSelection({ start: index, end: index });
  }, [fields]);
  
  // Seçim devam
  const handleMouseMove = useCallback((index: number) => {
    if (!isSelecting || !selection) return;
    setSelection(prev => prev ? { ...prev, end: index } : null);
  }, [isSelecting, selection]);
  
  // Seçim bitir
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);
  
  // Alan tipi ata
  const handleAssignField = useCallback((type: FieldType) => {
    if (!selection) return;
    
    const start = Math.min(selection.start, selection.end) + 1; // 1-based
    const end = Math.max(selection.start, selection.end) + 1;
    
    // Çakışma kontrolü
    const hasOverlap = fields.some(f => {
      const fStart = f.start;
      const fEnd = f.end;
      return (start <= fEnd && end >= fStart);
    });
    
    if (hasOverlap) {
      alert('Bu alan başka bir alanla çakışıyor!');
      return;
    }
    
    const newField: FixedWidthField = {
      id: `field-${Date.now()}`,
      type,
      start,
      end,
      color: FIELD_CONFIG[type].color
    };
    
    setFields(prev => [...prev, newField].sort((a, b) => a.start - b.start));
    setSelection(null);
  }, [selection, fields]);
  
  // Alan sil
  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);
  
  // Tümünü sıfırla
  const handleReset = useCallback(() => {
    setFields([]);
    setSelection(null);
  }, []);
  
  // Karakter için renk bul
  const getCharColor = useCallback((index: number): string | null => {
    const field = fields.find(f => index >= f.start - 1 && index <= f.end - 1);
    return field ? field.color : null;
  }, [fields]);
  
  // Seçim aralığında mı?
  const isInSelection = useCallback((index: number): boolean => {
    if (!selection) return false;
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    return index >= start && index <= end;
  }, [selection]);
  
  // Parse edilmiş öğrenciler
  const parsedStudents = useMemo((): ParsedStudent[] => {
    return rawLines.map(line => {
      const corrected = correctOCRErrors(line);
      const student: ParsedStudent = {};
      
      fields.forEach(f => {
        if (f.type === 'atla') return;
        const value = corrected.substring(f.start - 1, f.end).trim();
        if (f.type === 'ogrenci_no') student.ogrenciNo = value;
        if (f.type === 'tc') student.tc = value;
        if (f.type === 'ad') student.ad = value;
        if (f.type === 'soyad') student.soyad = value;
        if (f.type === 'sinif') student.sinif = value;
        if (f.type === 'kitapcik') student.kitapcik = value;
        if (f.type === 'cevaplar') student.cevaplar = value;
      });
      
      return student;
    });
  }, [rawLines, fields]);
  
  // Validasyon
  const isValid = useMemo(() => {
    const hasIdentity = fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad');
    const hasAnswers = fields.some(f => f.type === 'cevaplar');
    return hasIdentity && hasAnswers;
  }, [fields]);
  
  // Otomatik öneri
  const suggestion = useMemo((): FieldType | null => {
    if (!selection) return null;
    
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const selectedText = sampleLine.substring(start, end + 1);
    const length = end - start + 1;
    
    // 11 hane ve sadece rakam → TC
    if (length === 11 && /^\d+$/.test(selectedText)) return 'tc';
    
    // 5-6 hane ve rakam → Öğrenci No
    if (length <= 6 && /^\d+$/.test(selectedText)) return 'ogrenci_no';
    
    // Sadece harf ve boşluk → Ad veya Soyad
    if (/^[A-ZÇĞİÖŞÜa-zçğıöşü\s]+$/.test(selectedText)) {
      if (!fields.some(f => f.type === 'ad')) return 'ad';
      if (!fields.some(f => f.type === 'soyad')) return 'soyad';
    }
    
    // ABCDE karakterleri ve uzun → Cevaplar
    if (/^[ABCDE\s]+$/i.test(selectedText) && length > 10) return 'cevaplar';
    
    // 1-2 karakter ve harf+rakam → Sınıf
    if (length <= 3 && /^\d+[A-Z]?$/i.test(selectedText)) return 'sinif';
    
    // Tek karakter ABCD → Kitapçık
    if (length === 1 && /^[ABCD]$/i.test(selectedText)) return 'kitapcik';
    
    return null;
  }, [selection, sampleLine, fields]);

  // ==================== RENDER ====================
  
  if (previewMode) {
    return (
      <PreviewScreen 
        students={parsedStudents.slice(0, 10)} 
        fields={fields}
        totalCount={parsedStudents.length}
        onBack={() => setPreviewMode(false)}
        onConfirm={() => onComplete(fields, parsedStudents)}
      />
    );
  }

  return (
    <div className="min-h-[600px]" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Karakter Bazlı Alan Eşleştirme
        </h2>
        <p className="text-emerald-100 text-sm mt-1">
          Karakterleri sürükleyerek seçin, ardından alan tipini belirleyin
        </p>
      </div>
      
      {/* Satır Seçici */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm text-gray-600">Örnek Satır:</span>
        <select 
          value={currentRow}
          onChange={(e) => setCurrentRow(Number(e.target.value))}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          {rawLines.slice(0, 10).map((_, i) => (
            <option key={i} value={i}>Satır {i + 1}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">({rawLines.length} satır toplam)</span>
      </div>
      
      {/* Karakter Cetveli + Grid */}
      <div className="bg-white dark:bg-gray-800 border rounded-xl overflow-hidden mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b flex justify-between items-center">
          <span className="font-semibold text-gray-700 dark:text-gray-200">📐 Karakter Haritası</span>
          <button 
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" /> Sıfırla
          </button>
        </div>
        
        <div ref={containerRef} className="overflow-x-auto p-4">
          {/* Pozisyon Numaraları (10'ar) */}
          <div className="flex mb-1 select-none" style={{ fontFamily: 'monospace' }}>
            <div className="w-8 flex-shrink-0" />
            {Array.from({ length: Math.ceil(maxLength / 10) }).map((_, i) => (
              <div key={i} className="text-xs text-gray-400 text-center" style={{ width: '200px' }}>
                {(i * 10) + 1}
              </div>
            ))}
          </div>
          
          {/* Pozisyon Numaraları (Her biri) */}
          <div className="flex mb-2 select-none" style={{ fontFamily: 'monospace' }}>
            <div className="w-8 flex-shrink-0 text-xs text-gray-400 text-right pr-1">#</div>
            {characters.map((_, i) => (
              <div 
                key={i} 
                className="w-5 text-center text-[9px] text-gray-400"
              >
                {(i + 1) % 10 === 0 ? '0' : (i + 1) % 10}
              </div>
            ))}
          </div>
          
          {/* Karakter Satırı */}
          <div className="flex" style={{ fontFamily: 'monospace' }}>
            <div className="w-8 flex-shrink-0 text-xs text-gray-500 text-right pr-2 pt-1">
              {currentRow + 1}
            </div>
            {characters.map((char, i) => {
              const fieldColor = getCharColor(i);
              const inSelection = isInSelection(i);
              
              return (
                <div
                  key={i}
                  onMouseDown={() => handleMouseDown(i)}
                  onMouseMove={() => handleMouseMove(i)}
                  className={`
                    w-5 h-8 flex items-center justify-center text-sm font-medium cursor-pointer
                    border-y border-r first:border-l first:rounded-l last:rounded-r
                    transition-all select-none
                    ${inSelection ? 'bg-blue-200 border-blue-400 scale-110 z-10' : ''}
                    ${fieldColor && !inSelection ? 'text-white' : 'text-gray-800 dark:text-gray-200'}
                    ${!fieldColor && !inSelection ? 'hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200' : ''}
                  `}
                  style={fieldColor && !inSelection ? { backgroundColor: fieldColor, borderColor: fieldColor } : undefined}
                  title={`Pozisyon: ${i + 1}, Karakter: "${char}"`}
                >
                  {char === ' ' ? '␣' : char}
                </div>
              );
            })}
          </div>
          
          {/* Alan Etiketleri */}
          <div className="flex mt-2" style={{ fontFamily: 'monospace' }}>
            <div className="w-8 flex-shrink-0" />
            {fields.map(field => {
              const width = (field.end - field.start + 1) * 20; // 20px per char
              const left = (field.start - 1) * 20;
              
              return (
                <div
                  key={field.id}
                  className="absolute h-6 flex items-center justify-center text-xs text-white font-medium rounded cursor-pointer hover:opacity-80"
                  style={{
                    width: `${width}px`,
                    marginLeft: `${left}px`,
                    backgroundColor: field.color,
                    position: 'relative',
                    left: 0
                  }}
                  onClick={() => handleRemoveField(field.id)}
                  title="Kaldırmak için tıklayın"
                >
                  {FIELD_CONFIG[field.type].emoji} {field.start}-{field.end}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tanımlı Alanlar Listesi */}
        {fields.length > 0 && (
          <div className="border-t px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tanımlı Alanlar:</div>
            <div className="flex flex-wrap gap-2">
              {fields.map(field => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: field.color }}
                  onClick={() => handleRemoveField(field.id)}
                >
                  {FIELD_CONFIG[field.type].emoji} {FIELD_CONFIG[field.type].label}
                  <span className="text-xs opacity-75">({field.start}-{field.end})</span>
                  <span className="ml-1 opacity-75">×</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Sağ Panel - Alan Seçimi */}
      {selection && (
        <div className="fixed right-8 top-1/3 w-72 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-xl shadow-2xl p-4 z-50">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.min(selection.start, selection.end) + 1} → {Math.max(selection.start, selection.end) + 1}
            </div>
            <div className="text-sm text-gray-500">
              ({Math.abs(selection.end - selection.start) + 1} karakter)
            </div>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm break-all">
              "{sampleLine.substring(Math.min(selection.start, selection.end), Math.max(selection.start, selection.end) + 1)}"
            </div>
          </div>
          
          {suggestion && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Öneri: {FIELD_CONFIG[suggestion].label}</span>
              </div>
              <button
                onClick={() => handleAssignField(suggestion)}
                className="mt-2 w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium"
              >
                ✓ Onayla
              </button>
            </div>
          )}
          
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Bu alan ne?</div>
          <div className="space-y-1">
            {Object.entries(FIELD_CONFIG).map(([type, config]) => (
              <button
                key={type}
                onClick={() => handleAssignField(type as FieldType)}
                className="w-full text-left p-2 rounded-lg border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center gap-2"
                style={{ borderColor: config.color + '40' }}
              >
                <span className="text-lg">{config.emoji}</span>
                <div>
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setSelection(null)}
            className="mt-3 w-full py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm hover:bg-gray-300"
          >
            İptal
          </button>
        </div>
      )}
      
      {/* Alt Bilgi */}
      <div className={`p-4 rounded-xl mb-4 ${isValid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Hazır! Önizleme yapabilirsiniz.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700">
                {!fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad')
                  ? 'Öğrenci No, TC veya Ad alanı gerekli'
                  : 'Cevaplar alanı gerekli'}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          ← Geri
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setPreviewMode(true)}
            disabled={!isValid}
            className={`px-6 py-2 rounded-xl font-semibold flex items-center gap-2 ${
              isValid
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Eye className="w-4 h-4" /> Önizleme
          </button>
          <button
            onClick={() => onComplete(fields, parsedStudents)}
            disabled={!isValid}
            className={`px-6 py-2 rounded-xl font-semibold ${
              isValid
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Devam →
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PREVIEW SCREEN ====================

interface PreviewScreenProps {
  students: ParsedStudent[];
  fields: FixedWidthField[];
  totalCount: number;
  onBack: () => void;
  onConfirm: () => void;
}

function PreviewScreen({ students, fields, totalCount, onBack, onConfirm }: PreviewScreenProps) {
  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5" /> Önizleme
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {totalCount} öğrenci bulundu • İlk 10 gösteriliyor
        </p>
      </div>
      
      {/* Alan Özeti */}
      <div className="mb-4 flex flex-wrap gap-2">
        {fields.filter(f => f.type !== 'atla').map(field => (
          <span
            key={field.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm"
            style={{ backgroundColor: FIELD_CONFIG[field.type].color }}
          >
            {FIELD_CONFIG[field.type].emoji} {FIELD_CONFIG[field.type].label}
            <span className="text-xs opacity-75">({field.start}-{field.end})</span>
          </span>
        ))}
      </div>
      
      {/* Öğrenci Tablosu */}
      <div className="bg-white dark:bg-gray-800 border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              {fields.some(f => f.type === 'ogrenci_no') && <th className="px-3 py-2 text-left">Öğrenci No</th>}
              {fields.some(f => f.type === 'tc') && <th className="px-3 py-2 text-left">TC</th>}
              {fields.some(f => f.type === 'ad') && <th className="px-3 py-2 text-left">Ad</th>}
              {fields.some(f => f.type === 'soyad') && <th className="px-3 py-2 text-left">Soyad</th>}
              {fields.some(f => f.type === 'sinif') && <th className="px-3 py-2 text-left">Sınıf</th>}
              {fields.some(f => f.type === 'kitapcik') && <th className="px-3 py-2 text-left">Kit.</th>}
              {fields.some(f => f.type === 'cevaplar') && <th className="px-3 py-2 text-left">Cevaplar</th>}
              <th className="px-3 py-2 text-center">✓</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => {
              const isComplete = (s.ogrenciNo || s.tc || s.ad) && s.cevaplar;
              return (
                <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                  {fields.some(f => f.type === 'ogrenci_no') && (
                    <td className="px-3 py-2 font-mono">{s.ogrenciNo || '-'}</td>
                  )}
                  {fields.some(f => f.type === 'tc') && (
                    <td className="px-3 py-2 font-mono">{s.tc || '-'}</td>
                  )}
                  {fields.some(f => f.type === 'ad') && (
                    <td className="px-3 py-2 font-medium">{s.ad || '-'}</td>
                  )}
                  {fields.some(f => f.type === 'soyad') && (
                    <td className="px-3 py-2 font-medium">{s.soyad || '-'}</td>
                  )}
                  {fields.some(f => f.type === 'sinif') && (
                    <td className="px-3 py-2">{s.sinif || '-'}</td>
                  )}
                  {fields.some(f => f.type === 'kitapcik') && (
                    <td className="px-3 py-2">{s.kitapcik || '-'}</td>
                  )}
                  {fields.some(f => f.type === 'cevaplar') && (
                    <td className="px-3 py-2 font-mono text-xs max-w-[200px] truncate" title={s.cevaplar}>
                      {s.cevaplar ? s.cevaplar.substring(0, 20) + '...' : '-'}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center">
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Düzenle
        </button>
        <button
          onClick={onConfirm}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> Onayla ve Devam
        </button>
      </div>
    </div>
  );
}

export default FixedWidthMapper;

