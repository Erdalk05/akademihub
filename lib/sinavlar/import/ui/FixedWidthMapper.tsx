/**
 * ============================================
 * AkademiHub - Premium Optik Form Mapper v3.0
 * ============================================
 * 
 * Modern, hızlı, estetik tasarım
 * Otomatik alan algılama
 * Animasyonlu geçişler
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

const FIELD_TYPES: { type: FieldType; label: string; color: string; gradient: string; icon: React.ReactNode; hint: string }[] = [
  { type: 'ogrenci_no', label: 'Öğrenci No', color: '#3B82F6', gradient: 'from-blue-500 to-blue-600', icon: <Hash className="w-4 h-4" />, hint: '6 haneli numara' },
  { type: 'tc', label: 'TC Kimlik', color: '#8B5CF6', gradient: 'from-violet-500 to-purple-600', icon: <CreditCard className="w-4 h-4" />, hint: '11 haneli TC' },
  { type: 'ad', label: 'Ad', color: '#10B981', gradient: 'from-emerald-500 to-green-600', icon: <Users className="w-4 h-4" />, hint: 'Öğrenci adı' },
  { type: 'soyad', label: 'Soyad', color: '#14B8A6', gradient: 'from-teal-500 to-cyan-600', icon: <Users className="w-4 h-4" />, hint: 'Öğrenci soyadı' },
  { type: 'sinif', label: 'Sınıf', color: '#F59E0B', gradient: 'from-amber-500 to-orange-600', icon: <School className="w-4 h-4" />, hint: '8A, 8C gibi' },
  { type: 'kitapcik', label: 'Kitapçık', color: '#EC4899', gradient: 'from-pink-500 to-rose-600', icon: <BookOpen className="w-4 h-4" />, hint: 'A, B, C, D' },
  { type: 'cevaplar', label: 'Cevaplar', color: '#EF4444', gradient: 'from-red-500 to-rose-600', icon: <FileText className="w-4 h-4" />, hint: 'Sınav cevapları' },
];

// ==================== AUTO DETECT ====================

function autoDetectFields(line: string): FieldDefinition[] {
  const fields: FieldDefinition[] = [];
  let id = 1;
  
  // Öğrenci No (ilk 6 haneli sayı bloğu)
  const studentNoMatch = line.match(/^(\d{5,6})/);
  if (studentNoMatch) {
    fields.push({
      id: `auto-${id++}`,
      type: 'ogrenci_no',
      label: 'Öğrenci No',
      start: 1,
      end: studentNoMatch[1].length
    });
  }
  
  // TC Kimlik (11 haneli sayı bloğu)
  const tcMatch = line.match(/(\d{11})/);
  if (tcMatch) {
    const tcStart = line.indexOf(tcMatch[1]) + 1;
    fields.push({
      id: `auto-${id++}`,
      type: 'tc',
      label: 'TC Kimlik',
      start: tcStart,
      end: tcStart + 10
    });
  }
  
  // Cevaplar (uzun ABCDE bloğu)
  const answerMatch = line.match(/[ABCDE]{20,}/i);
  if (answerMatch) {
    const answerStart = line.indexOf(answerMatch[0]) + 1;
    fields.push({
      id: `auto-${id++}`,
      type: 'cevaplar',
      label: 'Cevaplar',
      start: answerStart,
      end: answerStart + answerMatch[0].length - 1
    });
  }
  
  // Sınıf (1-2 hane sayı + harf)
  const classMatch = line.match(/\b(\d{1,2}[A-Z])\b/i);
  if (classMatch) {
    const classStart = line.indexOf(classMatch[1]) + 1;
    fields.push({
      id: `auto-${id++}`,
      type: 'sinif',
      label: 'Sınıf',
      start: classStart,
      end: classStart + classMatch[1].length - 1
    });
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
  const [currentRow, setCurrentRow] = useState(0);
  const [showAutoDetect, setShowAutoDetect] = useState(true);
  
  // Örnek satır
  const sampleLine = useMemo(() => {
    const line = rawLines[currentRow] || '';
    return correctOCRErrors(line);
  }, [rawLines, currentRow]);
  
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length)), [rawLines]);
  
  // Otomatik algılama
  const autoFields = useMemo(() => autoDetectFields(sampleLine), [sampleLine]);
  
  // Otomatik algılamayı uygula
  const handleAutoDetect = useCallback(() => {
    setFields(autoFields);
    setShowAutoDetect(false);
  }, [autoFields]);
  
  // Alan ekle
  const handleAddField = useCallback((type: FieldType) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    if (!fieldType) return;
    
    const lastEnd = fields.length > 0 ? Math.max(...fields.map(f => f.end)) : 0;
    
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      type,
      label: fieldType.label,
      start: lastEnd + 1,
      end: Math.min(lastEnd + 10, maxLength)
    };
    
    setFields(prev => [...prev, newField]);
    setShowAutoDetect(false);
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
    setShowAutoDetect(true);
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

  // ==================== RENDER ====================
  
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
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 -mx-6 -mt-6 px-6 py-5 mb-6 rounded-t-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
              <Target className="w-6 h-6" />
            </div>
            Optik Form Tanımları
          </h2>
          <p className="text-purple-200 text-sm mt-2 ml-12">
            {rawLines.length} satır yüklendi • Alanları tanımlayın
          </p>
        </div>
      </div>
      
      {/* Otomatik Algılama Banner */}
      {showAutoDetect && autoFields.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-bold text-amber-800">🎯 Otomatik Algılama</div>
                <div className="text-sm text-amber-600">{autoFields.length} alan otomatik tespit edildi</div>
              </div>
            </div>
            <button
              onClick={handleAutoDetect}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ⚡ Uygula
            </button>
          </div>
        </div>
      )}
      
      {/* Karakter Haritası - Premium */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 rounded-2xl mb-6 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-5 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-gray-800 dark:text-gray-200">Karakter Haritası</span>
              <div className="text-xs text-gray-500 mt-0.5">Pozisyonları görsel olarak takip edin</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={currentRow}
              onChange={(e) => setCurrentRow(Number(e.target.value))}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {rawLines.slice(0, 10).map((_, i) => (
                <option key={i} value={i}>Satır {i + 1}</option>
              ))}
            </select>
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-sm text-red-500 hover:text-red-700 flex items-center gap-2 rounded-xl hover:bg-red-50 transition-all font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Sıfırla
            </button>
          </div>
        </div>
        
        <div className="p-5 overflow-x-auto bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-800">
          {/* Pozisyon Cetveli */}
          <div className="mb-3 flex" style={{ fontFamily: 'ui-monospace, monospace' }}>
            <div className="w-10 flex-shrink-0" />
            {Array.from({ length: Math.ceil(Math.min(maxLength, 120) / 10) }).map((_, i) => (
              <div key={i} className="text-xs font-bold text-blue-600 dark:text-blue-400" style={{ width: '100px' }}>
                {(i * 10) + 1}
              </div>
            ))}
          </div>
          
          {/* Karakter Kutuları */}
          <div className="flex items-center" style={{ fontFamily: 'ui-monospace, monospace' }}>
            <div className="w-10 flex-shrink-0 text-xs font-bold text-gray-400 text-right pr-2">
              #{currentRow + 1}
            </div>
            <div className="flex">
              {Array.from({ length: Math.min(maxLength, 120) }).map((_, i) => {
                const char = sampleLine[i] || '';
                const field = fields.find(f => i >= f.start - 1 && i < f.end);
                const fieldType = field ? FIELD_TYPES.find(t => t.type === field.type) : null;
                
                return (
                  <div
                    key={i}
                    className={`w-[10px] h-8 flex items-center justify-center text-[10px] font-bold border-y border-r first:border-l first:rounded-l-lg last:rounded-r-lg transition-all ${
                      fieldType 
                        ? 'text-white shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                    style={fieldType ? { 
                      backgroundColor: fieldType.color, 
                      borderColor: fieldType.color 
                    } : undefined}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          </div>
          
          {maxLength > 120 && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-xl inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              İlk 120 karakter gösteriliyor (Toplam: {maxLength})
            </div>
          )}
        </div>
      </div>
      
      {/* Alan Tanımları - Premium Tablo */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-lg">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-200">Alan Tanımları</span>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                {fields.length} alan tanımlı
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          {/* Tablo Başlığı */}
          <div className="grid grid-cols-12 gap-3 mb-3 px-3">
            <div className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Alan Adı</div>
            <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Başlangıç</div>
            <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Bitiş</div>
            <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Önizleme</div>
            <div className="col-span-1"></div>
          </div>
          
          {/* Mevcut Alanlar */}
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 font-medium">Henüz alan eklenmedi</div>
              <div className="text-gray-400 text-sm mt-1">Aşağıdaki butonlardan ekleyin</div>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, idx) => {
                const fieldType = FIELD_TYPES.find(t => t.type === field.type);
                const previewValue = sampleLine.substring(field.start - 1, field.end).trim();
                
                return (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: fieldType?.color + '10',
                      borderLeft: `4px solid ${fieldType?.color}`
                    }}
                  >
                    {/* Alan Adı */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div 
                        className={`p-2 rounded-lg bg-gradient-to-br ${fieldType?.gradient} text-white shadow-sm`}
                      >
                        {fieldType?.icon}
                      </div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                    
                    {/* Başlangıç */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={field.start}
                        onChange={(e) => handleUpdateField(field.id, { start: parseInt(e.target.value) || 1 })}
                        min={1}
                        max={maxLength}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-700 text-center font-mono text-lg font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                    
                    {/* Bitiş */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={field.end}
                        onChange={(e) => handleUpdateField(field.id, { end: parseInt(e.target.value) || 1 })}
                        min={field.start}
                        max={maxLength}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-700 text-center font-mono text-lg font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                    
                    {/* Önizleme */}
                    <div className="col-span-3">
                      <div 
                        className="px-3 py-2 rounded-lg font-mono text-sm truncate font-medium"
                        style={{ backgroundColor: fieldType?.color + '20', color: fieldType?.color }}
                        title={previewValue}
                      >
                        {previewValue || '—'}
                      </div>
                    </div>
                    
                    {/* Sil */}
                    <div className="col-span-1 flex justify-center">
                      <button 
                        onClick={() => handleRemoveField(field.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Alan Ekleme Butonları */}
          <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">+ Alan Ekle</div>
            <div className="grid grid-cols-4 gap-3">
              {FIELD_TYPES.map((fieldType) => {
                const isAdded = fields.some(f => f.type === fieldType.type);
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => handleAddField(fieldType.type)}
                    disabled={isAdded && fieldType.type !== 'cevaplar'}
                    className={`p-4 rounded-xl font-medium flex flex-col items-center gap-2 transition-all ${
                      isAdded && fieldType.type !== 'cevaplar'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `bg-gradient-to-br ${fieldType.gradient} text-white hover:shadow-lg transform hover:scale-105`
                    }`}
                  >
                    <div className="p-2 bg-white/20 rounded-lg">
                      {fieldType.icon}
                    </div>
                    <span className="text-sm">{fieldType.label}</span>
                    {isAdded && fieldType.type !== 'cevaplar' && (
                      <span className="text-xs opacity-75">✓ Eklendi</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Validasyon Mesajı */}
      <div className={`p-5 rounded-2xl mb-6 flex items-center gap-4 ${
        isValid 
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200' 
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'
      }`}>
        {isValid ? (
          <>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-emerald-800">Hazır!</div>
              <div className="text-sm text-emerald-600">Önizleme yapabilir veya devam edebilirsiniz</div>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="font-bold text-amber-800">Eksik Alan</div>
              <div className="text-sm text-amber-600">
                {!fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad')
                  ? 'Öğrenci No, TC veya Ad alanı ekleyin'
                  : 'Cevaplar alanı ekleyin'}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack} 
          className="px-5 py-3 text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 rounded-xl hover:bg-gray-100 transition-all"
        >
          ← Geri
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setPreviewMode(true)}
            disabled={!isValid}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isValid
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Eye className="w-5 h-5" /> Önizleme
          </button>
          <button
            onClick={() => onComplete(fields, parsedStudents)}
            disabled={!isValid}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isValid
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Devam <span className="text-lg">→</span>
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
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 -mx-6 -mt-6 px-6 py-5 mb-6 rounded-t-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
              <Eye className="w-6 h-6" />
            </div>
            Veri Önizleme
          </h2>
          <p className="text-purple-100 text-sm mt-2 ml-12">
            {totalCount} öğrenci bulundu • İlk 15 gösteriliyor
          </p>
        </div>
      </div>
      
      {/* Alan Özeti */}
      <div className="mb-6 flex flex-wrap gap-2">
        {fields.map(field => {
          const fieldType = FIELD_TYPES.find(t => t.type === field.type);
          return (
            <span
              key={field.id}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-gradient-to-r ${fieldType?.gradient} shadow-md`}
            >
              {fieldType?.icon}
              {field.label}
              <span className="text-xs opacity-75 bg-white/20 px-2 py-0.5 rounded-full">{field.start}-{field.end}</span>
            </span>
          );
        })}
      </div>
      
      {/* Öğrenci Tablosu */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-4 py-4 text-left font-bold text-gray-600">#</th>
                {fields.some(f => f.type === 'ogrenci_no') && <th className="px-4 py-4 text-left font-bold text-blue-600">Öğrenci No</th>}
                {fields.some(f => f.type === 'tc') && <th className="px-4 py-4 text-left font-bold text-purple-600">TC</th>}
                {fields.some(f => f.type === 'ad') && <th className="px-4 py-4 text-left font-bold text-emerald-600">Ad</th>}
                {fields.some(f => f.type === 'soyad') && <th className="px-4 py-4 text-left font-bold text-teal-600">Soyad</th>}
                {fields.some(f => f.type === 'sinif') && <th className="px-4 py-4 text-left font-bold text-amber-600">Sınıf</th>}
                {fields.some(f => f.type === 'kitapcik') && <th className="px-4 py-4 text-left font-bold text-pink-600">Kit.</th>}
                {fields.some(f => f.type === 'cevaplar') && <th className="px-4 py-4 text-left font-bold text-red-600">Cevaplar</th>}
                <th className="px-4 py-4 text-center font-bold text-gray-600">Durum</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const isComplete = (s.ogrenciNo || s.tc || s.ad) && s.cevaplar;
                return (
                  <tr key={idx} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-400">{idx + 1}</td>
                    {fields.some(f => f.type === 'ogrenci_no') && (
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{s.ogrenciNo || '—'}</td>
                    )}
                    {fields.some(f => f.type === 'tc') && (
                      <td className="px-4 py-3 font-mono">{s.tc || '—'}</td>
                    )}
                    {fields.some(f => f.type === 'ad') && (
                      <td className="px-4 py-3 font-semibold text-gray-800">{s.ad || '—'}</td>
                    )}
                    {fields.some(f => f.type === 'soyad') && (
                      <td className="px-4 py-3 font-semibold text-gray-800">{s.soyad || '—'}</td>
                    )}
                    {fields.some(f => f.type === 'sinif') && (
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">{s.sinif || '—'}</span>
                      </td>
                    )}
                    {fields.some(f => f.type === 'kitapcik') && (
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-bold">{s.kitapcik || '—'}</span>
                      </td>
                    )}
                    {fields.some(f => f.type === 'cevaplar') && (
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate text-gray-600" title={s.cevaplar}>
                        {s.cevaplar ? s.cevaplar.substring(0, 25) + '...' : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                          <CheckCircle className="w-4 h-4" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                          <AlertCircle className="w-4 h-4" /> Eksik
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack} 
          className="px-5 py-3 text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 rounded-xl hover:bg-gray-100 transition-all"
        >
          ← Düzenle
        </button>
        <button
          onClick={onConfirm}
          className="px-10 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl font-bold flex items-center gap-3 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          <Save className="w-6 h-6" />
          <span className="text-lg">Onayla ve Devam</span>
        </button>
      </div>
    </div>
  );
}

export default FixedWidthMapper;
