/**
 * ============================================
 * AkademiHub - Ultimate Optik Form Mapper v4.0
 * ============================================
 * 
 * LGS & TYT/AYT Tam Destek
 * 5 Satır Karakter Haritası
 * Kompakt Alan Kartları
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Eye, Save, RotateCcw, CheckCircle, AlertCircle, 
  Sparkles, Zap, Target, Users, Hash, CreditCard, School, BookOpen, FileText
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

const FIELD_TYPES: { type: FieldType; label: string; color: string; icon: React.ReactNode }[] = [
  { type: 'ogrenci_no', label: 'Öğrenci No', color: '#3B82F6', icon: <Hash className="w-3 h-3" /> },
  { type: 'tc', label: 'TC Kimlik', color: '#8B5CF6', icon: <CreditCard className="w-3 h-3" /> },
  { type: 'ad', label: 'Ad', color: '#10B981', icon: <Users className="w-3 h-3" /> },
  { type: 'soyad', label: 'Soyad', color: '#14B8A6', icon: <Users className="w-3 h-3" /> },
  { type: 'sinif', label: 'Sınıf', color: '#F59E0B', icon: <School className="w-3 h-3" /> },
  { type: 'kitapcik', label: 'Kitapçık', color: '#EC4899', icon: <BookOpen className="w-3 h-3" /> },
  { type: 'cevaplar', label: 'Cevaplar', color: '#EF4444', icon: <FileText className="w-3 h-3" /> },
];

// ==================== AUTO DETECT ====================

function autoDetectFields(line: string): FieldDefinition[] {
  const fields: FieldDefinition[] = [];
  let id = 1;
  
  const studentNoMatch = line.match(/^(\d{5,6})/);
  if (studentNoMatch) {
    fields.push({ id: `auto-${id++}`, type: 'ogrenci_no', label: 'Öğrenci No', start: 1, end: studentNoMatch[1].length });
  }
  
  const tcMatch = line.match(/(\d{11})/);
  if (tcMatch) {
    const tcStart = line.indexOf(tcMatch[1]) + 1;
    fields.push({ id: `auto-${id++}`, type: 'tc', label: 'TC Kimlik', start: tcStart, end: tcStart + 10 });
  }
  
  const answerMatch = line.match(/[ABCDE]{20,}/i);
  if (answerMatch) {
    const answerStart = line.indexOf(answerMatch[0]) + 1;
    fields.push({ id: `auto-${id++}`, type: 'cevaplar', label: 'Cevaplar', start: answerStart, end: answerStart + answerMatch[0].length - 1 });
  }
  
  const classMatch = line.match(/\b(\d{1,2}[A-Z])\b/i);
  if (classMatch) {
    const classStart = line.indexOf(classMatch[1]) + 1;
    fields.push({ id: `auto-${id++}`, type: 'sinif', label: 'Sınıf', start: classStart, end: classStart + classMatch[1].length - 1 });
  }
  
  return fields.sort((a, b) => a.start - b.start);
}

// ==================== MAIN COMPONENT ====================

interface FixedWidthMapperProps {
  rawLines: string[];
  onComplete: (fields: FieldDefinition[], parsedStudents: ParsedStudent[]) => void;
  onBack: () => void;
}

export function FixedWidthMapper({ rawLines, onComplete, onBack }: FixedWidthMapperProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAutoDetect, setShowAutoDetect] = useState(true);
  
  const sampleLines = useMemo(() => {
    return rawLines.slice(0, 5).map(line => correctOCRErrors(line));
  }, [rawLines]);
  
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length)), [rawLines]);
  const autoFields = useMemo(() => autoDetectFields(sampleLines[0] || ''), [sampleLines]);
  
  const handleAutoDetect = useCallback(() => {
    setFields(autoFields);
    setShowAutoDetect(false);
  }, [autoFields]);
  
  const handleAddField = useCallback((type: FieldType) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    if (!fieldType) return;
    const lastEnd = fields.length > 0 ? Math.max(...fields.map(f => f.end)) : 0;
    setFields(prev => [...prev, {
      id: `field-${Date.now()}`,
      type,
      label: fieldType.label,
      start: lastEnd + 1,
      end: Math.min(lastEnd + 10, maxLength)
    }]);
    setShowAutoDetect(false);
  }, [fields, maxLength]);
  
  const handleUpdateField = useCallback((id: string, updates: Partial<FieldDefinition>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);
  
  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);
  
  const handleReset = useCallback(() => {
    setFields([]);
    setShowAutoDetect(true);
  }, []);
  
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
  
  const isValid = useMemo(() => {
    const hasIdentity = fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad');
    const hasAnswers = fields.some(f => f.type === 'cevaplar');
    return hasIdentity && hasAnswers;
  }, [fields]);

  const getCharColor = useCallback((index: number): string | null => {
    const field = fields.find(f => index >= f.start - 1 && index < f.end);
    if (field) {
      const fieldType = FIELD_TYPES.find(t => t.type === field.type);
      return fieldType?.color || null;
    }
    return null;
  }, [fields]);

  if (previewMode) {
    return (
      <PreviewScreen 
        students={parsedStudents.slice(0, 15)} 
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
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5" /> Optik Form Tanımları
        </h2>
        <p className="text-purple-200 text-sm">{rawLines.length} satır • Alanları tanımlayın</p>
      </div>
      
      {/* Otomatik Algılama */}
      {showAutoDetect && autoFields.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">{autoFields.length} alan otomatik tespit edildi</span>
          </div>
          <button onClick={handleAutoDetect} className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600">
            ⚡ Uygula
          </button>
        </div>
      )}
      
      {/* 5 SATIR KARAKTER HARİTASI */}
      <div className="bg-white border-2 border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-700">Karakter Haritası</span>
            <span className="text-xs text-gray-500">(İlk 5 öğrenci)</span>
          </div>
          <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Sıfırla
          </button>
        </div>
        
        <div className="p-3 overflow-x-auto" style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
          {/* Pozisyon Cetveli */}
          <div className="flex mb-1">
            <div className="w-8 flex-shrink-0" />
            {Array.from({ length: Math.ceil(Math.min(maxLength, 100) / 10) }).map((_, i) => (
              <div key={i} className="text-xs font-bold text-blue-600" style={{ width: '120px' }}>
                {(i * 10) + 1}
              </div>
            ))}
          </div>
          
          {/* 5 Satır Öğrenci */}
          {sampleLines.map((line, rowIdx) => (
            <div key={rowIdx} className="flex items-center mb-0.5">
              <div className="w-8 flex-shrink-0 text-xs font-bold text-gray-400 text-right pr-1">
                {rowIdx + 1}
              </div>
              <div className="flex">
                {Array.from({ length: Math.min(maxLength, 100) }).map((_, i) => {
                  const char = line[i] || '';
                  const fieldColor = getCharColor(i);
                  
                  return (
                    <div
                      key={i}
                      className={`w-3 h-5 flex items-center justify-center text-[11px] font-bold border-r border-b first:border-l ${rowIdx === 0 ? 'border-t' : ''} ${
                        fieldColor ? 'text-white' : 'text-gray-700 border-gray-200 bg-gray-50'
                      }`}
                      style={fieldColor ? { backgroundColor: fieldColor, borderColor: fieldColor } : undefined}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {maxLength > 100 && (
            <div className="mt-2 text-xs text-amber-600">⚠️ İlk 100 karakter ({maxLength} toplam)</div>
          )}
        </div>
      </div>
      
      {/* ALAN TANIMLARI */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="bg-emerald-50 px-4 py-2 border-b">
          <span className="font-bold text-emerald-700">Alan Tanımları ({fields.length})</span>
        </div>
        
        <div className="p-3">
          {fields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">Henüz alan eklenmedi</div>
          ) : (
            <div className="space-y-1.5">
              {fields.map((field) => {
                const fieldType = FIELD_TYPES.find(t => t.type === field.type);
                const previewValue = sampleLines[0]?.substring(field.start - 1, field.end).trim() || '';
                
                return (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg"
                    style={{ backgroundColor: fieldType?.color + '15', borderLeft: `3px solid ${fieldType?.color}` }}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="p-1.5 rounded text-white" style={{ backgroundColor: fieldType?.color }}>
                        {fieldType?.icon}
                      </div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded text-sm font-medium bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={field.start}
                        onChange={(e) => handleUpdateField(field.id, { start: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border rounded text-center font-mono text-sm bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={field.end}
                        onChange={(e) => handleUpdateField(field.id, { end: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border rounded text-center font-mono text-sm bg-white"
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="px-2 py-1 rounded text-xs font-mono truncate" style={{ backgroundColor: fieldType?.color + '20', color: fieldType?.color }}>
                        {previewValue || '—'}
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <button onClick={() => handleRemoveField(field.id)} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* KOMPAKT ALAN EKLEME BUTONLARI (%80 küçük) */}
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-gray-500 mb-2">+ Alan Ekle:</div>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_TYPES.map((fieldType) => {
                const isAdded = fields.some(f => f.type === fieldType.type);
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => handleAddField(fieldType.type)}
                    disabled={isAdded && fieldType.type !== 'cevaplar'}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                      isAdded && fieldType.type !== 'cevaplar'
                        ? 'bg-gray-100 text-gray-400'
                        : 'text-white hover:opacity-80'
                    }`}
                    style={!isAdded || fieldType.type === 'cevaplar' ? { backgroundColor: fieldType.color } : undefined}
                  >
                    {fieldType.icon}
                    {fieldType.label}
                    {isAdded && fieldType.type !== 'cevaplar' && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Validasyon */}
      <div className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${isValid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        {isValid ? (
          <>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Hazır!</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 text-sm">
              {!fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad')
                ? 'Öğrenci No/TC/Ad gerekli'
                : 'Cevaplar alanı gerekli'}
            </span>
          </>
        )}
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500 hover:text-gray-700">← Geri</button>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(true)}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${isValid ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
          >
            <Eye className="w-4 h-4" /> Önizleme
          </button>
          <button
            onClick={() => onComplete(fields, parsedStudents)}
            disabled={!isValid}
            className={`px-6 py-2 rounded-lg font-bold ${isValid ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-200 text-gray-400'}`}
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5" /> Veri Önizleme
        </h2>
        <p className="text-purple-100 text-sm">{totalCount} öğrenci • İlk 15 gösteriliyor</p>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-1.5">
        {fields.map(field => {
          const fieldType = FIELD_TYPES.find(t => t.type === field.type);
          return (
            <span key={field.id} className="inline-flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-medium" style={{ backgroundColor: fieldType?.color }}>
              {fieldType?.icon} {field.label} ({field.start}-{field.end})
            </span>
          );
        })}
      </div>
      
      <div className="bg-white border rounded-xl overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                {fields.some(f => f.type === 'ogrenci_no') && <th className="px-3 py-2 text-left text-blue-600">Öğrenci No</th>}
                {fields.some(f => f.type === 'tc') && <th className="px-3 py-2 text-left text-purple-600">TC</th>}
                {fields.some(f => f.type === 'ad') && <th className="px-3 py-2 text-left text-emerald-600">Ad</th>}
                {fields.some(f => f.type === 'soyad') && <th className="px-3 py-2 text-left text-teal-600">Soyad</th>}
                {fields.some(f => f.type === 'sinif') && <th className="px-3 py-2 text-left text-amber-600">Sınıf</th>}
                {fields.some(f => f.type === 'kitapcik') && <th className="px-3 py-2 text-left text-pink-600">Kit.</th>}
                {fields.some(f => f.type === 'cevaplar') && <th className="px-3 py-2 text-left text-red-600">Cevaplar</th>}
                <th className="px-3 py-2 text-center">✓</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const isComplete = (s.ogrenciNo || s.tc || s.ad) && s.cevaplar;
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    {fields.some(f => f.type === 'ogrenci_no') && <td className="px-3 py-2 font-mono font-bold text-blue-700">{s.ogrenciNo || '—'}</td>}
                    {fields.some(f => f.type === 'tc') && <td className="px-3 py-2 font-mono">{s.tc || '—'}</td>}
                    {fields.some(f => f.type === 'ad') && <td className="px-3 py-2 font-semibold">{s.ad || '—'}</td>}
                    {fields.some(f => f.type === 'soyad') && <td className="px-3 py-2 font-semibold">{s.soyad || '—'}</td>}
                    {fields.some(f => f.type === 'sinif') && <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">{s.sinif || '—'}</span></td>}
                    {fields.some(f => f.type === 'kitapcik') && <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded text-xs font-bold">{s.kitapcik || '—'}</span></td>}
                    {fields.some(f => f.type === 'cevaplar') && <td className="px-3 py-2 font-mono text-xs max-w-[150px] truncate">{s.cevaplar ? s.cevaplar.substring(0, 20) + '...' : '—'}</td>}
                    <td className="px-3 py-2 text-center">
                      {isComplete ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertCircle className="w-4 h-4 text-amber-500 mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500 hover:text-gray-700">← Düzenle</button>
        <button onClick={onConfirm} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 flex items-center gap-2">
          <Save className="w-5 h-5" /> Onayla ve Devam
        </button>
      </div>
    </div>
  );
}

export default FixedWidthMapper;
