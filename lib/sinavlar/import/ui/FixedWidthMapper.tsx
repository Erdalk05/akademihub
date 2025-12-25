/**
 * ============================================
 * AkademiHub - Optik Form Mapper v8.0 ULTRA
 * ============================================
 * 
 * ✅ TÜM KARAKTERLER GÖRÜNÜR
 * ✅ OTOMATİK ALAN ALGILAMA
 * ✅ HAZIR LGS/TYT ŞABLONLARI
 * ✅ ZOOM ÖZELLİĞİ
 * ✅ PERFORMANS METRİKLERİ
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Eye, Save, RotateCcw, CheckCircle, AlertCircle, 
  Sparkles, Target, Users, Hash, CreditCard, School, BookOpen, FileText,
  Download, FolderOpen, Zap, Copy, ChevronRight, Lightbulb,
  BarChart3, ZoomIn, ZoomOut, Wand2, Layout, Clock, Percent
} from 'lucide-react';

// ==================== TÜRK İSİM MOTORU ====================

const ERKEK_ISIMLERI = ['ALİ', 'AHMET', 'MEHMET', 'MUSTAFA', 'BURAK', 'EMRE', 'EREN', 'ARDA', 'KAAN', 'ENES', 'YAĞIZ', 'YUNUS', 'ERDAL', 'NEHİR', 'BARIŞ', 'BATUHAN'];
const KIZ_ISIMLERI = ['AYŞE', 'ZEYNEP', 'ELİF', 'NUR', 'BÜŞRA', 'ESRA', 'ECE', 'İREM', 'ÖZGE', 'TUĞBA', 'YAĞMUR', 'ASYA', 'NURSENA', 'ALMİNA', 'NEHİR', 'EYLÜL', 'DEFNE'];
const SOYADLARI = ['YILMAZ', 'KAYA', 'DEMİR', 'ÇELİK', 'ŞAHIN', 'YILDIZ', 'ÖZTÜRK', 'ÖZDEMİR', 'ARSLAN', 'KILIÇ', 'KILIÇOĞLU', 'TÜRKMEN', 'ÖZCAN', 'TAŞDEMİR', 'KARAKAYA', 'ÇİNAR'];
const TUM_ISIMLER = [...ERKEK_ISIMLERI, ...KIZ_ISIMLERI, ...SOYADLARI];

function fixOCRErrors(text: string): string {
  return text
    .replace(/◆NAR/gi, 'İNAR').replace(/◆INAR/gi, 'ÇİNAR').replace(/AL◆/gi, 'ALİ')
    .replace(/◆L/gi, 'İL').replace(/◆R/gi, 'İR').replace(/◆N/gi, 'İN').replace(/◆Z/gi, 'İZ')
    .replace(/YA◆/gi, 'YAĞ').replace(/◆/g, 'İ').replace(/�/g, 'İ')
    .replace(/0/g, 'O').replace(/1/g, 'I').replace(/\$/g, 'Ş').replace(/\+/g, 'Ö').toUpperCase();
}

function levenshtein(a: string, b: string): number {
  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i-1] === a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[b.length][a.length];
}

function findClosestName(text: string): string {
  const c = fixOCRErrors(text.trim());
  if (c.length < 2) return c;
  let best = c, dist = Infinity;
  for (const n of TUM_ISIMLER) {
    const d = levenshtein(c, n);
    if (d < dist && d <= n.length * 0.4) { dist = d; best = n; }
  }
  return best;
}

function fixTurkishChars(text: string): string {
  let r = fixOCRErrors(text);
  const patterns: [RegExp, string][] = [
    [/AL[I1◆�][ ]?[C◆�]?[I1◆�]?NAR/gi, 'ALİ ÇİNAR'], [/ALM[I1◆�]NA/gi, 'ALMİNA'],
    [/YA[G◆�][I1◆�]Z/gi, 'YAĞIZ'], [/K[I1]L[I1◆�]?[C◆�]O[G◆�]LU/gi, 'KILIÇOĞLU'],
    [/[O◆�]ZCAN/gi, 'ÖZCAN'], [/T[◆�]RKMEN/gi, 'TÜRKMEN'], [/EYL[◆�]L/gi, 'EYLÜL'],
  ];
  for (const [p, rep] of patterns) r = r.replace(p, rep);
  return r.split(/\s+/).map(w => findClosestName(w)).join(' ');
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
  fields: FieldDefinition[];
}

// ==================== CONSTANTS ====================

const FIELD_TYPES: { type: FieldType; label: string; color: string; icon: React.ReactNode }[] = [
  { type: 'ogrenci_no', label: 'Öğrenci No', color: '#3B82F6', icon: <Hash className="w-3 h-3" /> },
  { type: 'tc', label: 'TC Kimlik', color: '#8B5CF6', icon: <CreditCard className="w-3 h-3" /> },
  { type: 'ad_soyad', label: 'Ad Soyad', color: '#10B981', icon: <Users className="w-3 h-3" /> },
  { type: 'sinif', label: 'Sınıf', color: '#F59E0B', icon: <School className="w-3 h-3" /> },
  { type: 'kitapcik', label: 'Kitapçık', color: '#EC4899', icon: <BookOpen className="w-3 h-3" /> },
  { type: 'cevaplar', label: 'Cevaplar', color: '#EF4444', icon: <FileText className="w-3 h-3" /> },
];

// HAZIR ŞABLONLAR
const PRESET_TEMPLATES: FormTemplate[] = [
  {
    id: 'lgs-standard',
    name: 'LGS Standart (90 Soru)',
    fields: [
      { id: 'f1', type: 'ogrenci_no', label: 'Öğrenci No', start: 1, end: 5 },
      { id: 'f2', type: 'ad_soyad', label: 'Ad Soyad', start: 6, end: 25 },
      { id: 'f3', type: 'sinif', label: 'Sınıf', start: 26, end: 28 },
      { id: 'f4', type: 'kitapcik', label: 'Kitapçık', start: 29, end: 29 },
      { id: 'f5', type: 'cevaplar', label: 'Cevaplar', start: 30, end: 119 },
    ]
  },
  {
    id: 'tyt-standard',
    name: 'TYT Standart (120 Soru)',
    fields: [
      { id: 'f1', type: 'ogrenci_no', label: 'Öğrenci No', start: 1, end: 6 },
      { id: 'f2', type: 'ad_soyad', label: 'Ad Soyad', start: 7, end: 30 },
      { id: 'f3', type: 'sinif', label: 'Sınıf', start: 31, end: 33 },
      { id: 'f4', type: 'kitapcik', label: 'Kitapçık', start: 34, end: 34 },
      { id: 'f5', type: 'cevaplar', label: 'Cevaplar', start: 35, end: 154 },
    ]
  },
];

const STORAGE_KEY = 'akademihub_form_templates_v2';

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
  const [zoom, setZoom] = useState(100); // Zoom yüzdesi
  const [autoDetecting, setAutoDetecting] = useState(false);
  const manualInputRef = useRef<HTMLInputElement>(null);
  
  // LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSavedTemplates(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);
  
  const saveTemplates = useCallback((t: FormTemplate[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); setSavedTemplates(t); } catch (e) { console.error(e); }
  }, []);
  
  // 3 satır önizleme
  const sampleLines = useMemo(() => rawLines.slice(0, 3).map(l => fixTurkishChars(l)), [rawLines]);
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length), 100), [rawLines]);
  
  // İstatistikler
  const stats = useMemo(() => ({
    students: rawLines.length,
    maxChars: maxLength,
    avgChars: Math.round(rawLines.reduce((s, l) => s + l.length, 0) / rawLines.length),
    definedFields: fields.length,
    definedChars: fields.reduce((s, f) => s + (f.end - f.start + 1), 0),
    coverage: Math.round((fields.reduce((s, f) => s + (f.end - f.start + 1), 0) / maxLength) * 100),
  }), [rawLines, fields, maxLength]);
  
  // OTOMATİK ALAN ALGILAMA
  const autoDetectFields = useCallback(() => {
    setAutoDetecting(true);
    
    const sample = sampleLines[0] || '';
    const detected: FieldDefinition[] = [];
    
    // 1. İlk 5-6 karakter genellikle öğrenci no
    const firstPart = sample.substring(0, 6).trim();
    if (/^\d{3,6}$/.test(firstPart.replace(/\s/g, ''))) {
      const numEnd = sample.search(/[A-ZÇĞİÖŞÜa-zçğıöşü]/) - 1;
      detected.push({
        id: `auto-${Date.now()}-1`,
        type: 'ogrenci_no',
        label: 'Öğrenci No',
        start: 1,
        end: numEnd > 0 ? numEnd : 5
      });
    }
    
    // 2. İsim bölgesini bul (harfler ve boşluk)
    const nameMatch = sample.match(/[A-ZÇĞİÖŞÜa-zçğıöşü\s]{10,}/);
    if (nameMatch) {
      const nameStart = sample.indexOf(nameMatch[0]) + 1;
      const nameEnd = nameStart + nameMatch[0].length - 1;
      detected.push({
        id: `auto-${Date.now()}-2`,
        type: 'ad_soyad',
        label: 'Ad Soyad',
        start: nameStart,
        end: nameEnd
      });
    }
    
    // 3. Sınıf (8A, 8B gibi)
    const classMatch = sample.match(/\d[A-Z](?=\s|[ABCD]{2,})/);
    if (classMatch) {
      const classStart = sample.indexOf(classMatch[0]) + 1;
      detected.push({
        id: `auto-${Date.now()}-3`,
        type: 'sinif',
        label: 'Sınıf',
        start: classStart,
        end: classStart + 1
      });
    }
    
    // 4. Kitapçık (tek A, B, C, D)
    const bookletMatch = sample.match(/(?<=[A-Z\s])[ABCD](?=[ABCD]{5,})/);
    if (bookletMatch) {
      const bookletStart = sample.lastIndexOf(bookletMatch[0], sample.lastIndexOf(bookletMatch[0])) + 1;
      detected.push({
        id: `auto-${Date.now()}-4`,
        type: 'kitapcik',
        label: 'Kitapçık',
        start: bookletStart,
        end: bookletStart
      });
    }
    
    // 5. Cevaplar (ABCD tekrarı)
    const answerMatch = sample.match(/[ABCD\s]{20,}/);
    if (answerMatch) {
      const ansStart = sample.indexOf(answerMatch[0]) + 1;
      detected.push({
        id: `auto-${Date.now()}-5`,
        type: 'cevaplar',
        label: 'Cevaplar',
        start: ansStart,
        end: sample.length
      });
    }
    
    setTimeout(() => {
      setFields(detected.sort((a, b) => a.start - b.start));
      setAutoDetecting(false);
    }, 500);
  }, [sampleLines]);
  
  // Karakter seçimi
  const handleCharMouseDown = useCallback((i: number) => {
    if (fields.find(f => i >= f.start - 1 && i < f.end)) return;
    setIsSelecting(true);
    setSelection({ start: i, end: i });
  }, [fields]);
  
  const handleCharMouseEnter = useCallback((i: number) => {
    if (isSelecting) setSelection(p => p ? { ...p, end: i } : null);
  }, [isSelecting]);
  
  const handleMouseUp = useCallback(() => setIsSelecting(false), []);
  
  // Alan ata
  const handleAssignField = useCallback((type: FieldType, label?: string) => {
    if (!selection) return;
    const s = Math.min(selection.start, selection.end) + 1;
    const e = Math.max(selection.start, selection.end) + 1;
    const ft = FIELD_TYPES.find(f => f.type === type);
    setFields(p => [...p, { id: `f-${Date.now()}`, type, label: label || ft?.label || 'Özel', start: s, end: e }].sort((a, b) => a.start - b.start));
    setSelection(null);
  }, [selection]);
  
  // Manuel ekle
  const handleAddManualField = useCallback(() => {
    if (!manualField.label.trim()) return;
    setFields(p => [...p, { id: `f-${Date.now()}`, type: 'custom', label: manualField.label, start: manualField.start, end: manualField.end }].sort((a, b) => a.start - b.start));
    setManualField({ label: '', start: manualField.end + 1, end: manualField.end + 20 });
    setTimeout(() => manualInputRef.current?.focus(), 50);
  }, [manualField]);
  
  const handleManualKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && manualField.label.trim()) handleAddManualField();
  }, [handleAddManualField, manualField.label]);
  
  const handleUpdateField = useCallback((id: string, u: Partial<FieldDefinition>) => {
    setFields(p => p.map(f => f.id === id ? { ...f, ...u } : f));
  }, []);
  
  const handleRemoveField = useCallback((id: string) => setFields(p => p.filter(f => f.id !== id)), []);
  const handleReset = useCallback(() => { setFields([]); setSelection(null); }, []);
  
  // Şablon
  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !fields.length) return;
    saveTemplates([...savedTemplates, { id: `t-${Date.now()}`, name: newTemplateName, fields }]);
    setNewTemplateName('');
    setShowSaveDialog(false);
  }, [newTemplateName, fields, savedTemplates, saveTemplates]);
  
  const handleLoadTemplate = useCallback((t: FormTemplate) => {
    setFields(t.fields.map(f => ({ ...f, id: `f-${Date.now()}-${Math.random()}` })));
    setShowTemplates(false);
  }, []);
  
  const handleDeleteTemplate = useCallback((id: string) => saveTemplates(savedTemplates.filter(t => t.id !== id)), [savedTemplates, saveTemplates]);
  
  // Parse
  const parsedStudents = useMemo((): ParsedStudent[] => {
    return rawLines.map(line => {
      const c = fixTurkishChars(line);
      const s: ParsedStudent = {};
      fields.forEach(f => {
        const v = c.substring(f.start - 1, f.end).trim();
        if (f.type === 'ogrenci_no') s.ogrenciNo = v;
        else if (f.type === 'tc') s.tc = v;
        else if (f.type === 'ad_soyad') s.adSoyad = v;
        else if (f.type === 'sinif') s.sinif = v;
        else if (f.type === 'kitapcik') s.kitapcik = v;
        else if (f.type === 'cevaplar') s.cevaplar = v;
        else s[f.label] = v;
      });
      return s;
    });
  }, [rawLines, fields]);
  
  const isValid = useMemo(() => fields.length >= 2, [fields]);
  
  const getCharColor = useCallback((i: number): string | null => {
    const f = fields.find(f => i >= f.start - 1 && i < f.end);
    return f ? FIELD_TYPES.find(t => t.type === f.type)?.color || '#6B7280' : null;
  }, [fields]);
  
  const isInSelection = useCallback((i: number): boolean => {
    if (!selection) return false;
    const s = Math.min(selection.start, selection.end);
    const e = Math.max(selection.start, selection.end);
    return i >= s && i <= e;
  }, [selection]);

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

  const charSize = Math.max(12, Math.round(16 * (zoom / 100)));
  const charWidth = Math.max(14, Math.round(18 * (zoom / 100)));

  return (
    <div className="min-h-[600px]" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5" /> Optik Form Mapper Ultra
            </h2>
            <p className="text-purple-200 text-sm">{rawLines.length} öğrenci • {maxLength} karakter</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-white/30">
              <FolderOpen className="w-4 h-4" /> Şablon
            </button>
            {fields.length > 0 && (
              <button onClick={() => setShowSaveDialog(true)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-600">
                <Download className="w-4 h-4" /> Kaydet
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* METRİKLER */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.students}</div>
          <div className="text-[10px] text-blue-500">Öğrenci</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-purple-600">{stats.maxChars}</div>
          <div className="text-[10px] text-purple-500">Karakter</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-amber-600">{stats.definedFields}</div>
          <div className="text-[10px] text-amber-500">Alan</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-emerald-600">{stats.definedChars}</div>
          <div className="text-[10px] text-emerald-500">Tanımlı</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-rose-600 flex items-center justify-center gap-1">
            <Percent className="w-4 h-4" />{stats.coverage}
          </div>
          <div className="text-[10px] text-rose-500">Kapsam</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-indigo-600">{zoom}%</div>
          <div className="text-[10px] text-indigo-500">Zoom</div>
        </div>
      </div>
      
      {/* HIZLI EYLEMLER */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={autoDetectFields}
          disabled={autoDetecting}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 shadow-lg"
        >
          <Wand2 className={`w-4 h-4 ${autoDetecting ? 'animate-spin' : ''}`} />
          {autoDetecting ? 'Algılanıyor...' : '🪄 Otomatik Algıla'}
        </button>
        
        {PRESET_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => handleLoadTemplate(t)}
            className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium flex items-center gap-1 hover:border-blue-400 hover:bg-blue-50"
          >
            <Layout className="w-4 h-4 text-blue-500" /> {t.name}
          </button>
        ))}
        
        <div className="flex items-center gap-1 ml-auto bg-gray-100 rounded-lg p-1">
          <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-1.5 hover:bg-gray-200 rounded">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono w-12 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1.5 hover:bg-gray-200 rounded">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* ŞABLONLAR MODAL */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-600" /> Kayıtlı Şablonlar
            </h3>
            {savedTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Henüz kayıtlı şablon yok</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.fields.length} alan</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLoadTemplate(t)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Yükle</button>
                      <button onClick={() => handleDeleteTemplate(t.id)} className="p-1 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowTemplates(false)} className="w-full mt-4 px-4 py-2 bg-gray-100 rounded-lg">Kapat</button>
          </div>
        </div>
      )}
      
      {/* KAYDET MODAL */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4"><Save className="w-5 h-5 inline mr-2" />Şablon Kaydet</h3>
            <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Şablon adı" className="w-full px-4 py-3 border-2 rounded-xl mb-4" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">İptal</button>
              <button onClick={handleSaveTemplate} disabled={!newTemplateName.trim()} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg disabled:bg-gray-200">Kaydet</button>
            </div>
          </div>
        </div>
      )}
      
      {/* KARAKTER HARİTASI - TÜM KARAKTERLER */}
      <div className="bg-white border-2 border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-700">Karakter Haritası</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Tüm karakterler</span>
          </div>
          <button onClick={handleReset} className="text-xs text-red-500 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Sıfırla
          </button>
        </div>
        
        {/* SARMALI (WRAP) GÖRÜNÜM */}
        <div className="p-4 select-none" style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
          {sampleLines.map((line, rowIdx) => (
            <div key={rowIdx} className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Öğrenci #{rowIdx + 1}</div>
              <div className="flex flex-wrap border rounded-lg p-2 bg-gray-50">
                {Array.from(line).map((char, i) => {
                  const color = getCharColor(i);
                  const inSel = isInSelection(i);
                  
                  return (
                    <div
                      key={i}
                      onMouseDown={() => handleCharMouseDown(i)}
                      onMouseEnter={() => handleCharMouseEnter(i)}
                      className={`
                        flex items-center justify-center cursor-pointer border
                        transition-all font-bold
                        ${inSel ? 'bg-blue-500 text-white border-blue-600 scale-110 z-10' : ''}
                        ${color && !inSel ? 'text-white' : ''}
                        ${!color && !inSel ? 'hover:bg-blue-100 border-gray-200' : ''}
                      `}
                      style={{
                        width: `${charWidth}px`,
                        height: `${charWidth + 4}px`,
                        fontSize: `${charSize}px`,
                        backgroundColor: color && !inSel ? color : undefined,
                        borderColor: color && !inSel ? color : undefined,
                      }}
                      title={`Pozisyon: ${i + 1}`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt-1 text-[9px] text-gray-400">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130].filter(n => n <= line.length).map(n => (
                  <span key={n} style={{ marginLeft: `${(n - 1) * charWidth - 10}px`, position: 'absolute' }}>{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* SEÇİM PANELİ */}
      {selection && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-lg">
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-blue-600">
              {Math.min(selection.start, selection.end) + 1} → {Math.max(selection.start, selection.end) + 1}
            </span>
            <span className="text-gray-500 ml-2">({Math.abs(selection.end - selection.start) + 1} karakter)</span>
          </div>
          <div className="p-3 bg-white rounded-lg font-mono text-center mb-3 text-lg border">
            "{sampleLines[0]?.substring(Math.min(selection.start, selection.end), Math.max(selection.start, selection.end) + 1) || ''}"
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {FIELD_TYPES.map((ft) => (
              <button key={ft.type} onClick={() => handleAssignField(ft.type)} className="px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{ backgroundColor: ft.color }}>
                {ft.icon} {ft.label}
              </button>
            ))}
          </div>
          <div className="text-center mt-2">
            <button onClick={() => setSelection(null)} className="text-sm text-gray-500">İptal</button>
          </div>
        </div>
      )}
      
      {/* ALAN TANIMLARI */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="bg-emerald-50 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-700">Alan Tanımları</span>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{fields.length}</span>
          </div>
          <button onClick={() => { setShowManualAdd(!showManualAdd); if (!showManualAdd) setTimeout(() => manualInputRef.current?.focus(), 100); }} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-1">
            <Plus className="w-3 h-3" /> Manuel
          </button>
        </div>
        
        {showManualAdd && (
          <div className="p-3 bg-emerald-50/50 border-b flex gap-2 items-center">
            <input ref={manualInputRef} type="text" value={manualField.label} onChange={e => setManualField(p => ({ ...p, label: e.target.value }))} onKeyDown={handleManualKeyDown} placeholder="Alan adı" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input type="number" value={manualField.start} onChange={e => setManualField(p => ({ ...p, start: parseInt(e.target.value) || 1 }))} className="w-16 px-2 py-2 border rounded-lg text-center text-sm font-mono" />
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <input type="number" value={manualField.end} onChange={e => setManualField(p => ({ ...p, end: parseInt(e.target.value) || 10 }))} className="w-16 px-2 py-2 border rounded-lg text-center text-sm font-mono" />
            <button onClick={handleAddManualField} disabled={!manualField.label.trim()} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold disabled:bg-gray-200">Ekle</button>
          </div>
        )}
        
        <div className="p-3">
          {fields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Wand2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Henüz alan tanımlanmadı</p>
              <p className="text-sm">"Otomatik Algıla" veya hazır şablon kullanın</p>
            </div>
          ) : (
            <div className="space-y-1">
              {fields.map((f) => {
                const ft = FIELD_TYPES.find(t => t.type === f.type);
                const preview = sampleLines[0]?.substring(f.start - 1, f.end).trim() || '';
                return (
                  <div key={f.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg" style={{ backgroundColor: (ft?.color || '#6B7280') + '10', borderLeft: `4px solid ${ft?.color || '#6B7280'}` }}>
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="p-1 rounded text-white text-xs" style={{ backgroundColor: ft?.color || '#6B7280' }}>{ft?.icon || <Plus className="w-3 h-3" />}</div>
                      <input type="text" value={f.label} onChange={e => handleUpdateField(f.id, { label: e.target.value })} className="flex-1 px-2 py-1 border rounded text-sm font-medium bg-white" />
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <input type="number" value={f.start} onChange={e => handleUpdateField(f.id, { start: parseInt(e.target.value) || 1 })} className="w-full px-1 py-1 border rounded text-center font-mono text-sm bg-white" />
                      <span className="text-gray-400">-</span>
                      <input type="number" value={f.end} onChange={e => handleUpdateField(f.id, { end: parseInt(e.target.value) || 1 })} className="w-full px-1 py-1 border rounded text-center font-mono text-sm bg-white" />
                    </div>
                    <div className="col-span-1 text-center text-xs font-mono bg-gray-100 rounded py-1">{f.end - f.start + 1}</div>
                    <div className="col-span-5">
                      <div className="px-2 py-1 rounded text-sm font-mono truncate font-bold" style={{ backgroundColor: (ft?.color || '#6B7280') + '25', color: ft?.color || '#6B7280' }}>{preview || '—'}</div>
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => handleRemoveField(f.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* VALİDASYON */}
      <div className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${isValid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        {isValid ? (
          <><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700 font-medium">Hazır! {fields.length} alan, %{stats.coverage} kapsam</span></>
        ) : (
          <><AlertCircle className="w-5 h-5 text-amber-600" /><span className="text-amber-700 text-sm">En az 2 alan tanımlanmalı</span></>
        )}
      </div>
      
      {/* BUTONLAR */}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500">← Geri</button>
        <div className="flex gap-2">
          <button onClick={() => setPreviewMode(true)} disabled={!isValid} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${isValid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
            <Eye className="w-4 h-4" /> Önizleme
          </button>
          <button onClick={() => onComplete(fields, parsedStudents)} disabled={!isValid} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${isValid ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
            Devam <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PREVIEW ====================

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
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5" /> Veri Önizleme</h2>
        <p className="text-purple-100 text-sm">{totalCount} öğrenci</p>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-1.5">
        {fields.map(f => {
          const ft = FIELD_TYPES.find(t => t.type === f.type);
          return <span key={f.id} className="inline-flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-medium" style={{ backgroundColor: ft?.color || '#6B7280' }}>{ft?.icon} {f.label}</span>;
        })}
      </div>
      
      <div className="bg-white border rounded-xl overflow-hidden mb-4 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                {fields.map(f => <th key={f.id} className="px-3 py-2 text-left" style={{ color: FIELD_TYPES.find(t => t.type === f.type)?.color }}>{f.label}</th>)}
                <th className="px-3 py-2 text-center">✓</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                  {fields.map(f => {
                    let v = '';
                    if (f.type === 'ogrenci_no') v = s.ogrenciNo || '';
                    else if (f.type === 'tc') v = s.tc || '';
                    else if (f.type === 'ad_soyad') v = s.adSoyad || '';
                    else if (f.type === 'sinif') v = s.sinif || '';
                    else if (f.type === 'kitapcik') v = s.kitapcik || '';
                    else if (f.type === 'cevaplar') v = s.cevaplar || '';
                    else v = s[f.label] || '';
                    return <td key={f.id} className="px-3 py-2 font-mono text-sm truncate max-w-[180px]">{v || '—'}</td>;
                  })}
                  <td className="px-3 py-2 text-center"><CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500">← Düzenle</button>
        <button onClick={onConfirm} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">
          <Save className="w-5 h-5" /> Onayla
        </button>
      </div>
    </div>
  );
}

export default FixedWidthMapper;
