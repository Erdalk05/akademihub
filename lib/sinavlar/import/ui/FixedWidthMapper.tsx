/**
 * ============================================
 * AkademiHub - Fixed Width Character Mapper v2.0
 * ============================================
 * 
 * K12Net benzeri manuel başlangıç-bitiş girişli
 * Türkçe karakter destekli
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Eye, Save, RotateCcw, CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';
import { correctOCRErrors } from '../txt/ocrCorrection';

// ==================== TYPES ====================

type FieldType = 'ogrenci_no' | 'tc' | 'ad' | 'soyad' | 'sinif' | 'kitapcik' | 'cevaplar';

interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  start: number;
  end: number;
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

const FIELD_TYPES: { type: FieldType; label: string; color: string }[] = [
  { type: 'ogrenci_no', label: 'Öğrenci No', color: '#3B82F6' },
  { type: 'tc', label: 'TC Kimlik', color: '#8B5CF6' },
  { type: 'ad', label: 'Ad', color: '#10B981' },
  { type: 'soyad', label: 'Soyad', color: '#14B8A6' },
  { type: 'sinif', label: 'Sınıf', color: '#F59E0B' },
  { type: 'kitapcik', label: 'Kitapçık', color: '#EC4899' },
  { type: 'cevaplar', label: 'Cevaplar', color: '#EF4444' },
];

// ==================== MAIN COMPONENT ====================

interface FixedWidthMapperProps {
  rawLines: string[];
  onComplete: (fields: FieldDefinition[], parsedStudents: ParsedStudent[]) => void;
  onBack: () => void;
}

export function FixedWidthMapper({ rawLines, onComplete, onBack }: FixedWidthMapperProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  
  // Örnek satır
  const sampleLine = useMemo(() => {
    const line = rawLines[currentRow] || '';
    return correctOCRErrors(line);
  }, [rawLines, currentRow]);
  
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length)), [rawLines]);
  
  // Alan ekle
  const handleAddField = useCallback((type: FieldType) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    if (!fieldType) return;
    
    // Son alanın bitişinden başla
    const lastEnd = fields.length > 0 ? Math.max(...fields.map(f => f.end)) : 0;
    
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      type,
      label: fieldType.label,
      start: lastEnd + 1,
      end: Math.min(lastEnd + 10, maxLength)
    };
    
    setFields(prev => [...prev, newField]);
  }, [fields, maxLength]);
  
  // Alan güncelle
  const handleUpdateField = useCallback((id: string, updates: Partial<FieldDefinition>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);
  
  // Alan sil
  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);
  
  // Tümünü sıfırla
  const handleReset = useCallback(() => {
    setFields([]);
  }, []);
  
  // Parse edilmiş öğrenciler
  const parsedStudents = useMemo((): ParsedStudent[] => {
    return rawLines.map(line => {
      const corrected = correctOCRErrors(line);
      const student: ParsedStudent = {};
      
      fields.forEach(f => {
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
  
  // Karakter için renk bul
  const getCharColor = useCallback((index: number): string | null => {
    const field = fields.find(f => index >= f.start - 1 && index < f.end);
    if (field) {
      const fieldType = FIELD_TYPES.find(t => t.type === field.type);
      return fieldType?.color || null;
    }
    return null;
  }, [fields]);

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
    <div className="min-h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Optik Form Tanımları
        </h2>
        <p className="text-emerald-100 text-sm mt-1">
          Her alan için başlangıç ve bitiş pozisyonlarını girin
        </p>
      </div>
      
      {/* Karakter Haritası */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 rounded-xl mb-6 overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-bold text-gray-700 dark:text-gray-200">📐 Karakter Haritası</span>
            <select 
              value={currentRow}
              onChange={(e) => setCurrentRow(Number(e.target.value))}
              className="px-3 py-1 border rounded-lg text-sm bg-white"
            >
              {rawLines.slice(0, 10).map((_, i) => (
                <option key={i} value={i}>Satır {i + 1}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500">({rawLines.length} satır toplam)</span>
          </div>
          <button 
            onClick={handleReset}
            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4" /> Sıfırla
          </button>
        </div>
        
        <div className="p-4 overflow-x-auto">
          {/* Pozisyon Numaraları (10'arlı) */}
          <div className="flex mb-1" style={{ fontFamily: 'monospace' }}>
            <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-gray-400">#</div>
            {Array.from({ length: Math.ceil(Math.min(maxLength, 150) / 10) }).map((_, i) => (
              <div key={i} className="text-xs text-gray-500 font-bold" style={{ width: '100px', textAlign: 'left' }}>
                {(i * 10) + 1}
              </div>
            ))}
          </div>
          
          {/* Pozisyon Numaraları (Her biri) */}
          <div className="flex mb-2" style={{ fontFamily: 'monospace' }}>
            <div className="w-12 flex-shrink-0" />
            {Array.from({ length: Math.min(maxLength, 150) }).map((_, i) => (
              <div 
                key={i} 
                className="w-[10px] text-center text-[8px] text-gray-400"
              >
                {(i + 1) % 10}
              </div>
            ))}
          </div>
          
          {/* Karakter Satırı */}
          <div className="flex" style={{ fontFamily: 'monospace' }}>
            <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-gray-500 pt-1">
              {currentRow + 1}
            </div>
            {Array.from({ length: Math.min(maxLength, 150) }).map((_, i) => {
              const char = sampleLine[i] || ' ';
              const fieldColor = getCharColor(i);
              
              return (
                <div
                  key={i}
                  className={`w-[10px] h-6 flex items-center justify-center text-xs font-medium border-y border-r first:border-l ${
                    fieldColor ? 'text-white' : 'text-gray-800 dark:text-gray-200 border-gray-200'
                  }`}
                  style={fieldColor ? { backgroundColor: fieldColor, borderColor: fieldColor } : undefined}
                  title={`Pozisyon: ${i + 1}, Karakter: "${char}"`}
                >
                  {char === ' ' ? '' : char}
                </div>
              );
            })}
          </div>
          
          {maxLength > 150 && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded inline-block">
              ⚠️ İlk 150 karakter gösteriliyor (Toplam: {maxLength})
            </div>
          )}
        </div>
      </div>
      
      {/* Alan Tanımları - K12Net Tarzı */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 rounded-xl overflow-hidden mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-3 border-b">
          <span className="font-bold text-blue-700 dark:text-blue-300">📋 Alan Tanımları</span>
        </div>
        
        <div className="p-4">
          {/* Tablo Başlığı */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-2">
            <div className="col-span-4 text-xs font-bold text-gray-500 uppercase">Alan Adı</div>
            <div className="col-span-3 text-xs font-bold text-gray-500 uppercase text-center">Başlangıç</div>
            <div className="col-span-3 text-xs font-bold text-gray-500 uppercase text-center">Bitiş</div>
            <div className="col-span-2 text-xs font-bold text-gray-500 uppercase text-center">Önizleme</div>
          </div>
          
          {/* Mevcut Alanlar */}
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz alan eklenmedi. Aşağıdan ekleyebilirsiniz.
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => {
                const fieldType = FIELD_TYPES.find(t => t.type === field.type);
                const previewValue = sampleLine.substring(field.start - 1, field.end).trim();
                
                return (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg"
                    style={{ backgroundColor: fieldType?.color + '15' }}
                  >
                    {/* Alan Adı */}
                    <div className="col-span-4 flex items-center gap-2">
                      <div 
                        className="w-3 h-8 rounded"
                        style={{ backgroundColor: fieldType?.color }}
                      />
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 font-medium"
                      />
                    </div>
                    
                    {/* Başlangıç */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={field.start}
                        onChange={(e) => handleUpdateField(field.id, { start: parseInt(e.target.value) || 1 })}
                        min={1}
                        max={maxLength}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-center font-mono"
                      />
                    </div>
                    
                    {/* Bitiş */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={field.end}
                        onChange={(e) => handleUpdateField(field.id, { end: parseInt(e.target.value) || 1 })}
                        min={field.start}
                        max={maxLength}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-center font-mono"
                      />
                    </div>
                    
                    {/* Önizleme & Sil */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div 
                        className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs font-mono truncate"
                        title={previewValue}
                      >
                        {previewValue || '-'}
                      </div>
                      <button 
                        onClick={() => handleRemoveField(field.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Alan Ekleme Butonları */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Alan Ekle:</div>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((fieldType) => {
                const isAdded = fields.some(f => f.type === fieldType.type);
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => handleAddField(fieldType.type)}
                    disabled={isAdded && fieldType.type !== 'cevaplar'}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                      isAdded && fieldType.type !== 'cevaplar'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-white hover:opacity-80'
                    }`}
                    style={!isAdded || fieldType.type === 'cevaplar' ? { backgroundColor: fieldType.color } : undefined}
                  >
                    <Plus className="w-4 h-4" />
                    {fieldType.label}
                    {isAdded && fieldType.type !== 'cevaplar' && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Validasyon Mesajı */}
      <div className={`p-4 rounded-xl mb-4 ${isValid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">✅ Hazır! Önizleme yapabilir veya devam edebilirsiniz.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700">
                ⚠️ {!fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad')
                  ? 'Öğrenci No, TC veya Ad alanı ekleyin'
                  : 'Cevaplar alanı ekleyin'}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500 hover:text-gray-700">
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
  fields: FieldDefinition[];
  totalCount: number;
  onBack: () => void;
  onConfirm: () => void;
}

function PreviewScreen({ students, fields, totalCount, onBack, onConfirm }: PreviewScreenProps) {
  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5" /> Veri Önizleme
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {totalCount} öğrenci bulundu • İlk 10 gösteriliyor
        </p>
      </div>
      
      {/* Alan Özeti */}
      <div className="mb-4 flex flex-wrap gap-2">
        {fields.map(field => {
          const fieldType = FIELD_TYPES.find(t => t.type === field.type);
          return (
            <span
              key={field.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: fieldType?.color }}
            >
              {field.label}
              <span className="text-xs opacity-75">({field.start}-{field.end})</span>
            </span>
          );
        })}
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
