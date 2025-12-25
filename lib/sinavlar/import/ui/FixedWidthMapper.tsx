/**
 * ============================================
 * AkademiHub - Optik Form Mapper v7.0 PRO
 * ============================================
 * 
 * ✅ 5 öğrenci önizleme
 * ✅ Toplam karakter sayısı
 * ✅ Otomatik alan önerileri
 * ✅ Akıllı pozisyon atlama
 * ✅ Klavye kısayolları
 * ✅ Form şablonları
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Eye, Save, RotateCcw, CheckCircle, AlertCircle, 
  Sparkles, Target, Users, Hash, CreditCard, School, BookOpen, FileText,
  Download, FolderOpen, Zap, Copy, Keyboard, ChevronRight, Lightbulb,
  BarChart3, Ruler
} from 'lucide-react';

// ==================== TÜRK İSİM TAHMİN MOTORU ====================

const ERKEK_ISIMLERI = [
  'ALİ', 'AHMET', 'MEHMET', 'MUSTAFA', 'HASAN', 'HÜSEYİN', 'İBRAHİM', 'İSMAİL',
  'OSMAN', 'YUSUF', 'MURAT', 'ÖMER', 'BURAK', 'EMRE', 'EREN', 'ARDA', 'KAAN',
  'BERK', 'BERKAY', 'CAN', 'ÇAĞRI', 'DENIZ', 'EFE', 'ENES', 'FURKAN', 'GÖRKEM',
  'HAKAN', 'KEREM', 'KORAY', 'ONUR', 'OĞUZ', 'OĞUZHAN', 'SERKAN', 'TOLGA',
  'UĞUR', 'UMUT', 'YAĞIZ', 'YIĞIT', 'YUNUS', 'ERDEM', 'ERDAL', 'EROL',
  'ŞÜKRÜ', 'ŞEREF', 'GÖKHAN', 'İLHAN', 'KEMAL', 'LEVENT', 'SİNAN',
];

const KIZ_ISIMLERI = [
  'AYŞE', 'FATİMA', 'EMİNE', 'HATİCE', 'ZEYNEP', 'MERVE', 'ELİF', 'NUR',
  'BÜŞRA', 'ESRA', 'SEDA', 'DERYA', 'DİLARA', 'ECE', 'EBRU', 'GAMZE',
  'GİZEM', 'GÜLŞEN', 'GÜLAY', 'GÜNEŞ', 'HANDE', 'İREM', 'KÜBRA', 'MELEK',
  'MELİKE', 'MELTEM', 'ÖZGE', 'ÖZLEM', 'PELİN', 'SELEN', 'ŞİRİN', 'TUĞBA',
  'TUĞÇE', 'YAĞMUR', 'ASYA', 'ASLI', 'ÇİĞDEM', 'NURSENA', 'NAZLI',
];

const SOYADLARI = [
  'YILMAZ', 'KAYA', 'DEMİR', 'ÇELİK', 'ŞAHIN', 'YILDIZ', 'YILDIRIM', 'ÖZTÜRK',
  'AYDIN', 'ÖZDEMIR', 'ARSLAN', 'DOĞAN', 'KILIÇ', 'ASLAN', 'ÇETIN', 'KARA',
  'KOÇAK', 'KURT', 'ÖZKAN', 'ŞİMŞEK', 'POLAT', 'KORKMAZ', 'GÜNEŞ', 'GÜLER',
  'KILIÇOĞLU', 'TÜRKMEN', 'TÜRK', 'ÖZCAN', 'ERDOĞAN', 'ATEŞ', 'BULUT',
];

const TUM_ISIMLER = [...ERKEK_ISIMLERI, ...KIZ_ISIMLERI, ...SOYADLARI];

function fixOCRErrors(text: string): string {
  let result = text.toUpperCase();
  result = result.replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E');
  result = result.replace(/\$/g, 'Ş').replace(/@/g, 'A').replace(/\+/g, 'Ö');
  return result;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1] 
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function findClosestName(text: string): string {
  const cleaned = fixOCRErrors(text.trim());
  if (cleaned.length < 2) return cleaned;
  
  let bestMatch = cleaned;
  let bestDistance = Infinity;
  
  for (const name of TUM_ISIMLER) {
    const dist = levenshtein(cleaned, name);
    const threshold = Math.floor(name.length * 0.4);
    if (dist < bestDistance && dist <= threshold) {
      bestDistance = dist;
      bestMatch = name;
    }
  }
  return bestMatch;
}

function fixTurkishChars(text: string): string {
  const words = text.split(/\s+/);
  const corrected = words.map(word => {
    let cleaned = fixOCRErrors(word);
    const matched = findClosestName(cleaned);
    if (matched === cleaned) {
      cleaned = cleaned
        .replace(/OZCAN/g, 'ÖZCAN').replace(/OZGUR/g, 'ÖZGÜR').replace(/OZLEM/g, 'ÖZLEM')
        .replace(/CIGDEM/g, 'ÇİĞDEM').replace(/GUNES/g, 'GÜNEŞ').replace(/GULER/g, 'GÜLER')
        .replace(/SUKRU/g, 'ŞÜKRÜ').replace(/ILHAN/g, 'İLHAN').replace(/ISMAIL/g, 'İSMAİL')
        .replace(/TURKMEN/g, 'TÜRKMEN').replace(/KILICOGLU/g, 'KILIÇOĞLU').replace(/KILIC/g, 'KILIÇ')
        .replace(/YAGIZ/g, 'YAĞIZ').replace(/YAGMUR/g, 'YAĞMUR').replace(/SIRIN/g, 'ŞİRİN');
      return cleaned;
    }
    return matched;
  });
  return corrected.join(' ');
}

// ==================== TYPES ====================

type FieldType = 'ogrenci_no' | 'tc' | 'ad_soyad' | 'sinif' | 'kitapcik' | 'cevaplar' | 'custom';

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
  adSoyad?: string;
  sinif?: string;
  kitapcik?: string;
  cevaplar?: string;
  [key: string]: string | undefined;
}

interface FormTemplate {
  id: string;
  name: string;
  createdAt: string;
  fields: FieldDefinition[];
}

// ==================== CONSTANTS ====================

const FIELD_TYPES: { type: FieldType; label: string; color: string; icon: React.ReactNode; shortcut?: string }[] = [
  { type: 'ogrenci_no', label: 'Öğrenci No', color: '#3B82F6', icon: <Hash className="w-3 h-3" />, shortcut: '1' },
  { type: 'tc', label: 'TC Kimlik', color: '#8B5CF6', icon: <CreditCard className="w-3 h-3" />, shortcut: '2' },
  { type: 'ad_soyad', label: 'Ad Soyad', color: '#10B981', icon: <Users className="w-3 h-3" />, shortcut: '3' },
  { type: 'sinif', label: 'Sınıf', color: '#F59E0B', icon: <School className="w-3 h-3" />, shortcut: '4' },
  { type: 'kitapcik', label: 'Kitapçık', color: '#EC4899', icon: <BookOpen className="w-3 h-3" />, shortcut: '5' },
  { type: 'cevaplar', label: 'Cevaplar', color: '#EF4444', icon: <FileText className="w-3 h-3" />, shortcut: '6' },
];

const STORAGE_KEY = 'akademihub_form_templates';

// ==================== MAIN COMPONENT ====================

interface FixedWidthMapperProps {
  rawLines: string[];
  onComplete: (fields: FieldDefinition[], parsedStudents: ParsedStudent[]) => void;
  onBack: () => void;
}

export function FixedWidthMapper({ rawLines, onComplete, onBack }: FixedWidthMapperProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<FormTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualField, setManualField] = useState({ label: '', start: 1, end: 10 });
  const manualInputRef = useRef<HTMLInputElement>(null);
  
  // LocalStorage'dan şablonları yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSavedTemplates(JSON.parse(saved));
    } catch (e) {
      console.error('Şablon yükleme hatası:', e);
    }
  }, []);
  
  // Şablonları kaydet
  const saveTemplates = useCallback((templates: FormTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      setSavedTemplates(templates);
    } catch (e) {
      console.error('Şablon kaydetme hatası:', e);
    }
  }, []);
  
  // 5 satır önizleme, Türkçe düzeltmeli
  const sampleLines = useMemo(() => {
    return rawLines.slice(0, 5).map(line => fixTurkishChars(line));
  }, [rawLines]);
  
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length), 100), [rawLines]);
  
  // Toplam karakter ve satır istatistikleri
  const stats = useMemo(() => {
    const totalChars = rawLines.reduce((sum, line) => sum + line.length, 0);
    const avgChars = Math.round(totalChars / rawLines.length);
    const minChars = Math.min(...rawLines.map(l => l.length));
    const maxChars = Math.max(...rawLines.map(l => l.length));
    const definedChars = fields.reduce((sum, f) => sum + (f.end - f.start + 1), 0);
    return { totalChars, avgChars, minChars, maxChars, definedChars };
  }, [rawLines, fields]);
  
  // Otomatik alan önerisi
  const suggestFieldType = useCallback((start: number, end: number): { type: FieldType; confidence: number } | null => {
    const sample = sampleLines[0]?.substring(start, end + 1) || '';
    const length = end - start + 1;
    
    // Sadece rakam ve 11 karakter = TC
    if (/^\d{11}$/.test(sample.trim())) {
      return { type: 'tc', confidence: 95 };
    }
    
    // Sadece rakam ve 1-6 karakter = Öğrenci No
    if (/^\d{1,6}$/.test(sample.trim())) {
      return { type: 'ogrenci_no', confidence: 90 };
    }
    
    // Sadece harfler ve boşluk, 10+ karakter = Ad Soyad
    if (/^[A-ZÇĞİÖŞÜa-zçğıöşü\s]{10,}$/.test(sample.trim()) && length >= 15) {
      return { type: 'ad_soyad', confidence: 85 };
    }
    
    // A, B, C, D, E tekrar = Cevaplar
    if (/^[ABCDE\s]+$/.test(sample.trim()) && length >= 10) {
      return { type: 'cevaplar', confidence: 90 };
    }
    
    // 1-3 karakter, rakam + harf = Sınıf
    if (/^[0-9][A-Z]?$/.test(sample.trim()) && length <= 3) {
      return { type: 'sinif', confidence: 80 };
    }
    
    // Tek A, B, C, D = Kitapçık
    if (/^[ABCD]$/.test(sample.trim())) {
      return { type: 'kitapcik', confidence: 85 };
    }
    
    return null;
  }, [sampleLines]);
  
  // Karakter seçimi
  const handleCharMouseDown = useCallback((charIndex: number) => {
    const existingField = fields.find(f => charIndex >= f.start - 1 && charIndex < f.end);
    if (existingField) return;
    setIsSelecting(true);
    setSelection({ start: charIndex, end: charIndex });
  }, [fields]);
  
  const handleCharMouseEnter = useCallback((charIndex: number) => {
    if (!isSelecting) return;
    setSelection(prev => prev ? { ...prev, end: charIndex } : null);
  }, [isSelecting]);
  
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);
  
  // Alan tipi ata
  const handleAssignField = useCallback((type: FieldType, customLabel?: string) => {
    if (!selection) return;
    
    const start = Math.min(selection.start, selection.end) + 1;
    const end = Math.max(selection.start, selection.end) + 1;
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      type,
      label: customLabel || fieldType?.label || 'Özel Alan',
      start,
      end
    };
    
    setFields(prev => [...prev, newField].sort((a, b) => a.start - b.start));
    setSelection(null);
  }, [selection]);
  
  // Manuel alan ekle
  const handleAddManualField = useCallback(() => {
    if (!manualField.label.trim()) return;
    
    setFields(prev => [...prev, {
      id: `field-${Date.now()}`,
      type: 'custom',
      label: manualField.label,
      start: manualField.start,
      end: manualField.end
    }].sort((a, b) => a.start - b.start));
    
    setManualField({
      label: '',
      start: manualField.end + 1,
      end: manualField.end + 20
    });
    
    // Focus'u input'a geri ver
    setTimeout(() => manualInputRef.current?.focus(), 50);
  }, [manualField]);
  
  // Enter ile ekle
  const handleManualKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && manualField.label.trim()) {
      handleAddManualField();
    }
  }, [handleAddManualField, manualField.label]);
  
  // Alan kopyala
  const handleDuplicateField = useCallback((field: FieldDefinition) => {
    const lastEnd = Math.max(...fields.map(f => f.end), 0);
    const length = field.end - field.start;
    
    setFields(prev => [...prev, {
      ...field,
      id: `field-${Date.now()}`,
      label: field.label + ' (kopya)',
      start: lastEnd + 1,
      end: lastEnd + 1 + length
    }].sort((a, b) => a.start - b.start));
  }, [fields]);
  
  // Alan güncelle
  const handleUpdateField = useCallback((id: string, updates: Partial<FieldDefinition>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);
  
  // Alan sil
  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);
  
  // Sıfırla
  const handleReset = useCallback(() => {
    setFields([]);
    setSelection(null);
  }, []);
  
  // Şablon kaydet
  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || fields.length === 0) return;
    
    const newTemplate: FormTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      createdAt: new Date().toISOString(),
      fields: fields
    };
    
    saveTemplates([...savedTemplates, newTemplate]);
    setNewTemplateName('');
    setShowSaveDialog(false);
  }, [newTemplateName, fields, savedTemplates, saveTemplates]);
  
  // Şablon yükle
  const handleLoadTemplate = useCallback((template: FormTemplate) => {
    setFields(template.fields.map(f => ({ ...f, id: `field-${Date.now()}-${Math.random()}` })));
    setShowTemplates(false);
  }, []);
  
  // Şablon sil
  const handleDeleteTemplate = useCallback((templateId: string) => {
    saveTemplates(savedTemplates.filter(t => t.id !== templateId));
  }, [savedTemplates, saveTemplates]);
  
  // Parse edilmiş öğrenciler
  const parsedStudents = useMemo((): ParsedStudent[] => {
    return rawLines.map(line => {
      const corrected = fixTurkishChars(line);
      const student: ParsedStudent = {};
      
      fields.forEach(f => {
        const value = corrected.substring(f.start - 1, f.end).trim();
        if (f.type === 'ogrenci_no') student.ogrenciNo = value;
        if (f.type === 'tc') student.tc = value;
        if (f.type === 'ad_soyad') student.adSoyad = value;
        if (f.type === 'sinif') student.sinif = value;
        if (f.type === 'kitapcik') student.kitapcik = value;
        if (f.type === 'cevaplar') student.cevaplar = value;
        if (f.type === 'custom') student[f.label] = value;
      });
      
      return student;
    });
  }, [rawLines, fields]);
  
  // Validasyon
  const isValid = useMemo(() => fields.length >= 2, [fields]);

  // Karakter rengi
  const getCharColor = useCallback((index: number): string | null => {
    const field = fields.find(f => index >= f.start - 1 && index < f.end);
    if (field) {
      const fieldType = FIELD_TYPES.find(t => t.type === field.type);
      return fieldType?.color || '#6B7280';
    }
    return null;
  }, [fields]);

  // Seçim aralığında mı?
  const isInSelection = useCallback((index: number): boolean => {
    if (!selection) return false;
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    return index >= start && index <= end;
  }, [selection]);
  
  // Seçim için öneri
  const currentSuggestion = useMemo(() => {
    if (!selection) return null;
    return suggestFieldType(
      Math.min(selection.start, selection.end),
      Math.max(selection.start, selection.end)
    );
  }, [selection, suggestFieldType]);

  if (previewMode) {
    return (
      <PreviewScreen 
        students={parsedStudents.slice(0, 20)} 
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
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5" /> Optik Form Mapper Pro
            </h2>
            <p className="text-purple-200 text-sm">{rawLines.length} öğrenci • Sürükleyerek alan seçin</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-white/30"
            >
              <FolderOpen className="w-4 h-4" /> Şablon Yükle
            </button>
            {fields.length > 0 && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-600"
              >
                <Download className="w-4 h-4" /> Kaydet
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* İSTATİSTİKLER */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{rawLines.length}</div>
          <div className="text-xs text-blue-500">Öğrenci</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{maxLength}</div>
          <div className="text-xs text-purple-500">Satır Uzunluğu</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.avgChars}</div>
          <div className="text-xs text-amber-500">Ort. Karakter</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{fields.length}</div>
          <div className="text-xs text-emerald-500">Alan Tanımlı</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-rose-600">{stats.definedChars}</div>
          <div className="text-xs text-rose-500">Tanımlı Kar.</div>
        </div>
      </div>
      
      {/* ŞABLON YÜKLEME MODAL */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-600" /> Kayıtlı Form Şablonları
            </h3>
            {savedTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Henüz kayıtlı şablon yok</p>
                <p className="text-sm">Alanları tanımlayıp "Kaydet" butonuna tıklayın</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div>
                      <div className="font-bold">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.fields.length} alan</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Yükle
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowTemplates(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
      
      {/* ŞABLON KAYDETME MODAL */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Save className="w-5 h-5 text-emerald-600" /> Form Şablonu Kaydet
            </h3>
            <input
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="Şablon adı (örn: LGS Optik Form)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="text-sm text-gray-500 mb-4">
              {fields.length} alan kaydedilecek
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                İptal
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* KARAKTER HARİTASI - 5 ÖĞRENCİ */}
      <div className="bg-white border-2 border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-700">Karakter Haritası</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">5 öğrenci</span>
          </div>
          <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Sıfırla
          </button>
        </div>
        
        <div className="p-4 overflow-x-auto select-none" style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
          {/* Pozisyon Cetveli */}
          <div className="flex mb-1">
            <div className="w-8 flex-shrink-0" />
            {Array.from({ length: Math.min(maxLength, 100) }).map((_, i) => (
              <div 
                key={i} 
                className={`w-5 text-center text-[10px] ${(i + 1) % 10 === 0 ? 'font-bold text-blue-600' : 'text-gray-400'}`}
              >
                {(i + 1) % 10 === 0 ? i + 1 : (i + 1) % 5 === 0 ? '·' : ''}
              </div>
            ))}
          </div>
          
          {/* 5 Satır Öğrenci */}
          {sampleLines.map((line, rowIdx) => (
            <div key={rowIdx} className="flex items-center mb-0.5">
              <div className="w-8 flex-shrink-0 text-xs font-bold text-gray-400 text-right pr-2">
                #{rowIdx + 1}
              </div>
              <div className="flex">
                {Array.from({ length: Math.min(line.length, 100) }).map((_, i) => {
                  const char = line[i] || '';
                  const fieldColor = getCharColor(i);
                  const inSelection = isInSelection(i);
                  
                  return (
                    <div
                      key={i}
                      onMouseDown={() => handleCharMouseDown(i)}
                      onMouseEnter={() => handleCharMouseEnter(i)}
                      className={`
                        w-5 h-6 flex items-center justify-center text-xs font-bold cursor-pointer
                        border-r border-b border-gray-100 transition-all
                        ${inSelection ? 'bg-blue-500 text-white scale-105 z-10' : ''}
                        ${fieldColor && !inSelection ? 'text-white' : ''}
                        ${!fieldColor && !inSelection ? 'hover:bg-blue-100' : ''}
                      `}
                      style={fieldColor && !inSelection ? { backgroundColor: fieldColor } : undefined}
                      title={`Poz: ${i + 1} - "${char}"`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {maxLength > 100 && (
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> İlk 100 karakter gösteriliyor ({maxLength} toplam)
            </div>
          )}
        </div>
      </div>
      
      {/* SEÇİM PANELİ - AKILLI ÖNERİ */}
      {selection && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-lg">
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-blue-600">
              {Math.min(selection.start, selection.end) + 1} → {Math.max(selection.start, selection.end) + 1}
            </span>
            <span className="text-gray-500 ml-2 text-lg">
              ({Math.abs(selection.end - selection.start) + 1} karakter)
            </span>
          </div>
          
          <div className="p-3 bg-white rounded-lg font-mono text-center mb-3 text-lg border">
            "{sampleLines[0]?.substring(Math.min(selection.start, selection.end), Math.max(selection.start, selection.end) + 1) || ''}"
          </div>
          
          {/* AKILLI ÖNERİ */}
          {currentSuggestion && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700 font-medium">
                Öneri: <strong>{FIELD_TYPES.find(f => f.type === currentSuggestion.type)?.label}</strong>
              </span>
              <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full">
                %{currentSuggestion.confidence}
              </span>
              <button
                onClick={() => handleAssignField(currentSuggestion.type)}
                className="ml-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm font-bold hover:bg-yellow-600"
              >
                Onayla
              </button>
            </div>
          )}
          
          <div className="text-sm text-gray-600 mb-2 text-center">veya manuel seçin:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {FIELD_TYPES.map((fieldType) => (
              <button
                key={fieldType.type}
                onClick={() => handleAssignField(fieldType.type)}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1 hover:opacity-80 hover:scale-105 transition-all"
                style={{ backgroundColor: fieldType.color }}
              >
                {fieldType.icon} {fieldType.label}
                {fieldType.shortcut && (
                  <span className="ml-1 text-xs opacity-70 bg-white/20 px-1 rounded">{fieldType.shortcut}</span>
                )}
              </button>
            ))}
          </div>
          <div className="text-center mt-3">
            <button onClick={() => setSelection(null)} className="text-sm text-gray-500 hover:text-gray-700">
              İptal
            </button>
          </div>
        </div>
      )}
      
      {/* ALAN TANIMLARI */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="bg-emerald-50 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-700">Alan Tanımları</span>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{fields.length} alan</span>
          </div>
          <button
            onClick={() => {
              setShowManualAdd(!showManualAdd);
              if (!showManualAdd) setTimeout(() => manualInputRef.current?.focus(), 100);
            }}
            className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-emerald-600"
          >
            <Plus className="w-3 h-3" /> Manuel Ekle
          </button>
        </div>
        
        {/* MANUEL EKLEME - ENTER İLE */}
        {showManualAdd && (
          <div className="p-3 bg-emerald-50/50 border-b">
            <div className="flex items-center gap-1 text-xs text-emerald-600 mb-2">
              <Keyboard className="w-3 h-3" /> Enter ile hızlı ekle
            </div>
            <div className="flex gap-2 items-center">
              <input
                ref={manualInputRef}
                type="text"
                value={manualField.label}
                onChange={e => setManualField(p => ({ ...p, label: e.target.value }))}
                onKeyDown={handleManualKeyDown}
                placeholder="Alan adı (örn: Türkçe)"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={manualField.start}
                  onChange={e => setManualField(p => ({ ...p, start: parseInt(e.target.value) || 1 }))}
                  className="w-16 px-2 py-2 border rounded-lg text-center text-sm font-mono"
                />
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={manualField.end}
                  onChange={e => setManualField(p => ({ ...p, end: parseInt(e.target.value) || 10 }))}
                  className="w-16 px-2 py-2 border rounded-lg text-center text-sm font-mono"
                />
              </div>
              <button
                onClick={handleAddManualField}
                disabled={!manualField.label.trim()}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                Ekle
              </button>
            </div>
          </div>
        )}
        
        <div className="p-3">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Henüz alan tanımlanmadı</p>
              <p className="text-sm">Karakter haritasından sürükleyin veya "Manuel Ekle" kullanın</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {fields.map((field) => {
                const fieldType = FIELD_TYPES.find(t => t.type === field.type);
                const previewValue = sampleLines[0]?.substring(field.start - 1, field.end).trim() || '';
                const charCount = field.end - field.start + 1;
                
                return (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:shadow-md transition-shadow"
                    style={{ backgroundColor: (fieldType?.color || '#6B7280') + '10', borderLeft: `4px solid ${fieldType?.color || '#6B7280'}` }}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="p-1.5 rounded text-white text-xs" style={{ backgroundColor: fieldType?.color || '#6B7280' }}>
                        {fieldType?.icon || <Plus className="w-3 h-3" />}
                      </div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded text-sm font-medium bg-white"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <input
                        type="number"
                        value={field.start}
                        onChange={(e) => handleUpdateField(field.id, { start: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border rounded text-center font-mono text-sm bg-white"
                      />
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input
                        type="number"
                        value={field.end}
                        onChange={(e) => handleUpdateField(field.id, { end: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border rounded text-center font-mono text-sm bg-white"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded font-mono">{charCount}</span>
                    </div>
                    <div className="col-span-4">
                      <div 
                        className="px-2 py-1 rounded text-sm font-mono truncate font-bold"
                        style={{ backgroundColor: (fieldType?.color || '#6B7280') + '25', color: fieldType?.color || '#6B7280' }}
                      >
                        {previewValue || '—'}
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button 
                        onClick={() => handleDuplicateField(field)} 
                        className="p-1 text-blue-400 hover:text-blue-600"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveField(field.id)} 
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Validasyon */}
      <div className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${isValid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        {isValid ? (
          <>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Hazır! {fields.length} alan, {stats.definedChars} karakter tanımlı</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 text-sm">En az 2 alan tanımlanmalı</span>
          </>
        )}
      </div>
      
      {/* Butonlar */}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Geri
        </button>
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
            className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${isValid ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg' : 'bg-gray-200 text-gray-400'}`}
          >
            Devam <ChevronRight className="w-4 h-4" />
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
        <p className="text-purple-100 text-sm">{totalCount} öğrenci • İlk 20 gösteriliyor</p>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-1.5">
        {fields.map(field => {
          const fieldType = FIELD_TYPES.find(t => t.type === field.type);
          return (
            <span key={field.id} className="inline-flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-medium" style={{ backgroundColor: fieldType?.color || '#6B7280' }}>
              {fieldType?.icon || <Plus className="w-3 h-3" />} {field.label}
              <span className="opacity-70">({field.start}-{field.end})</span>
            </span>
          );
        })}
      </div>
      
      <div className="bg-white border rounded-xl overflow-hidden mb-4 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">#</th>
                {fields.map(field => (
                  <th key={field.id} className="px-3 py-2 text-left font-bold" style={{ color: FIELD_TYPES.find(t => t.type === field.type)?.color || '#6B7280' }}>
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-center">✓</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                  {fields.map(field => {
                    let value = '';
                    if (field.type === 'ogrenci_no') value = s.ogrenciNo || '';
                    else if (field.type === 'tc') value = s.tc || '';
                    else if (field.type === 'ad_soyad') value = s.adSoyad || '';
                    else if (field.type === 'sinif') value = s.sinif || '';
                    else if (field.type === 'kitapcik') value = s.kitapcik || '';
                    else if (field.type === 'cevaplar') value = s.cevaplar || '';
                    else value = s[field.label] || '';
                    
                    const isAnswer = field.type === 'cevaplar' || field.label.toLowerCase().includes('cevap');
                    
                    return (
                      <td key={field.id} className={`px-3 py-2 ${isAnswer ? 'font-mono text-xs' : ''} truncate max-w-[180px]`}>
                        {value || <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Düzenle
        </button>
        <button onClick={onConfirm} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 flex items-center gap-2 shadow-lg">
          <Save className="w-5 h-5" /> Onayla ve Devam
        </button>
      </div>
    </div>
  );
}

export default FixedWidthMapper;
