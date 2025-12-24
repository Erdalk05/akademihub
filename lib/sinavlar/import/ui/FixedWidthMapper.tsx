/**
 * ============================================
 * AkademiHub - Optik Form Mapper v5.0
 * ============================================
 * 
 * ✅ Tıklanabilir karakterler
 * ✅ Türkçe karakter desteği
 * ✅ Geniş aralıklı görünüm
 * ✅ Manuel alan ekleme
 * ✅ 2 satır önizleme
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Eye, Save, RotateCcw, CheckCircle, AlertCircle, 
  Sparkles, Target, Users, Hash, CreditCard, School, BookOpen, FileText
} from 'lucide-react';

// ==================== TÜRK İSİM TAHMİN MOTORU ====================

// Yaygın Türk erkek isimleri
const ERKEK_ISIMLERI = [
  'ALİ', 'AHMET', 'MEHMET', 'MUSTAFA', 'HASAN', 'HÜSEYİN', 'İBRAHİM', 'İSMAİL',
  'OSMAN', 'YUSUF', 'MURAT', 'ÖMER', 'BURAK', 'EMRE', 'EREN', 'ARDA', 'KAAN',
  'BERK', 'BERKAY', 'CAN', 'ÇAĞRI', 'DENIZ', 'EFE', 'ENES', 'FURKAN', 'GÖRKEM',
  'HAKAN', 'KEREM', 'KORAY', 'ONUR', 'OĞUZ', 'OĞUZHAN', 'SERKAN', 'TOLGA',
  'UĞUR', 'UMUT', 'YAĞIZ', 'YIĞIT', 'YUNUS', 'ERDEM', 'ERDAL', 'EROL', 'ERCAN',
  'ŞÜKRÜ', 'ŞEREF', 'GÖKHAN', 'GÖKÇEN', 'İLHAN', 'İSA', 'KEMAL', 'LEVENT',
  'NİHAT', 'OKAN', 'ORHAN', 'ÖZGÜR', 'RECEP', 'RIDVAN', 'SEFA', 'SELİM',
  'SERDAR', 'SİNAN', 'TANER', 'TARIK', 'TUNCAY', 'TUNÇ', 'TÜRKER', 'VOLKAN',
];

// Yaygın Türk kız isimleri
const KIZ_ISIMLERI = [
  'AYŞE', 'FATİMA', 'EMİNE', 'HATİCE', 'ZEYNEP', 'MERVE', 'ELİF', 'NUR',
  'BÜŞRA', 'ESRA', 'SEDA', 'DERYA', 'DİLARA', 'ECE', 'EBRU', 'GAMZE',
  'GİZEM', 'GÜLŞEN', 'GÜLAY', 'GÜNEŞ', 'HANDE', 'İREM', 'KÜBRA', 'MELEK',
  'MELİKE', 'MELTEM', 'NESLİHAN', 'NİLAY', 'ÖZGE', 'ÖZLEM', 'PELİN', 'SELEN',
  'SEVGİ', 'SİBEL', 'ŞİRİN', 'TUĞBA', 'TUĞÇE', 'YAĞMUR', 'YELDA', 'YEŞİM',
  'ASYA', 'ASLI', 'AZİZE', 'BAHAR', 'BAŞAK', 'BELGİN', 'BERNA', 'BİRSEN',
  'BURCU', 'CANAN', 'CEMRE', 'ÇİĞDEM', 'DENİZ', 'DİDEM', 'DUYGU', 'FİGEN',
  'FİLİZ', 'FULYA', 'GÜL', 'GÜLBEN', 'GÜLCAN', 'NURSENA', 'NAZLI', 'NİLGÜN',
];

// Yaygın Türk soyadları
const SOYADLARI = [
  'YILMAZ', 'KAYA', 'DEMİR', 'ÇELİK', 'ŞAHIN', 'YILDIZ', 'YILDIRIM', 'ÖZTÜRK',
  'AYDIN', 'ÖZDEMIR', 'ARSLAN', 'DOĞAN', 'KILIÇ', 'ASLAN', 'ÇETIN', 'KARA',
  'KOÇAK', 'KURT', 'ÖZKAN', 'ŞİMŞEK', 'POLAT', 'KORKMAZ', 'ÇELIK', 'KAPLAN',
  'ACAR', 'GÜNEŞ', 'GÜLER', 'TEKIN', 'ERDOĞAN', 'ATEŞ', 'KURTULMUŞ', 'BULUT',
  'ALTUN', 'AVCI', 'KARACA', 'ÜNAL', 'BAL', 'BOZKURT', 'COŞKUN', 'DEMİRCİ',
  'DURAN', 'EKİNCİ', 'ERDEM', 'GÜVEN', 'IŞIK', 'KARATAŞ', 'AKTAŞ', 'AKSOY',
  'ALBAYRAK', 'AYDOĞAN', 'BARAN', 'BAYRAK', 'BAYRAM', 'BİLGİN', 'CAN', 'CEYLAN',
  'KILIC', 'KILICOGLU', 'KILIÇOĞLU', 'TÜRKMEN', 'TÜRK', 'ÖZCAN', 'NAÇAK',
];

// Tüm isimler
const TUM_ISIMLER = [...ERKEK_ISIMLERI, ...KIZ_ISIMLERI, ...SOYADLARI];

// OCR hata düzeltmeleri
function fixOCRErrors(text: string): string {
  let result = text.toUpperCase();
  
  // Sayı → Harf dönüşümleri
  result = result.replace(/0/g, 'O'); // 0 → O
  result = result.replace(/1/g, 'I'); // 1 → I
  result = result.replace(/3/g, 'E'); // 3 → E
  result = result.replace(/4/g, 'A'); // 4 → A
  result = result.replace(/5/g, 'S'); // 5 → S
  result = result.replace(/8/g, 'B'); // 8 → B
  
  // Özel karakter dönüşümleri
  result = result.replace(/\$/g, 'Ş');
  result = result.replace(/@/g, 'A');
  result = result.replace(/&/g, 'E');
  result = result.replace(/#/g, 'H');
  result = result.replace(/\+/g, 'Ö');
  result = result.replace(/w/gi, 'W');
  
  return result;
}

// Levenshtein mesafesi
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

// En yakın ismi bul
function findClosestName(text: string): string {
  const cleaned = fixOCRErrors(text.trim());
  if (cleaned.length < 2) return cleaned;
  
  let bestMatch = cleaned;
  let bestDistance = Infinity;
  
  for (const name of TUM_ISIMLER) {
    const dist = levenshtein(cleaned, name);
    const threshold = Math.floor(name.length * 0.4); // %40 hata toleransı
    
    if (dist < bestDistance && dist <= threshold) {
      bestDistance = dist;
      bestMatch = name;
    }
  }
  
  return bestMatch;
}

// Ana düzeltme fonksiyonu
function fixTurkishChars(text: string): string {
  // Boşluklara göre ayır
  const words = text.split(/\s+/);
  
  const correctedWords = words.map(word => {
    // OCR hatalarını düzelt
    let cleaned = fixOCRErrors(word);
    
    // İsim veritabanından en yakınını bul
    const matched = findClosestName(cleaned);
    
    // Türkçe karakter düzeltmeleri (eşleşme bulunamazsa)
    if (matched === cleaned) {
      // Manuel düzeltmeler
      cleaned = cleaned
        .replace(/OZCAN/g, 'ÖZCAN')
        .replace(/OZGUR/g, 'ÖZGÜR')
        .replace(/OZLEM/g, 'ÖZLEM')
        .replace(/CIGDEM/g, 'ÇİĞDEM')
        .replace(/CAGLA/g, 'ÇAĞLA')
        .replace(/GUNES/g, 'GÜNEŞ')
        .replace(/GULER/g, 'GÜLER')
        .replace(/GULSEN/g, 'GÜLŞEN')
        .replace(/SUKRU/g, 'ŞÜKRÜ')
        .replace(/SEREF/g, 'ŞEREF')
        .replace(/ILHAN/g, 'İLHAN')
        .replace(/ISMAIL/g, 'İSMAİL')
        .replace(/INAR/g, 'İNAR')
        .replace(/TURKMEN/g, 'TÜRKMEN')
        .replace(/KILICOGLU/g, 'KILIÇOĞLU')
        .replace(/KILIC/g, 'KILIÇ')
        .replace(/YAGIZ/g, 'YAĞIZ')
        .replace(/YAGMUR/g, 'YAĞMUR')
        .replace(/SIRIN/g, 'ŞİRİN');
      return cleaned;
    }
    
    return matched;
  });
  
  return correctedWords.join(' ');
}

// ==================== TYPES ====================

type FieldType = 'ogrenci_no' | 'tc' | 'ad' | 'soyad' | 'sinif' | 'kitapcik' | 'cevaplar' | 'custom';

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
  { type: 'custom', label: 'Özel Alan', color: '#6B7280', icon: <Plus className="w-3 h-3" /> },
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
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // 2 satır, Türkçe düzeltmeli
  const sampleLines = useMemo(() => {
    return rawLines.slice(0, 2).map(line => fixTurkishChars(line));
  }, [rawLines]);
  
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length), 100), [rawLines]);
  
  // Karakter seçimi başlat
  const handleCharMouseDown = useCallback((charIndex: number) => {
    // Zaten tanımlı bir alanda mı?
    const existingField = fields.find(f => charIndex >= f.start - 1 && charIndex < f.end);
    if (existingField) return;
    
    setIsSelecting(true);
    setSelection({ start: charIndex, end: charIndex });
  }, [fields]);
  
  // Karakter seçimi devam
  const handleCharMouseEnter = useCallback((charIndex: number) => {
    if (!isSelecting) return;
    setSelection(prev => prev ? { ...prev, end: charIndex } : null);
  }, [isSelecting]);
  
  // Karakter seçimi bitir
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
    const lastEnd = fields.length > 0 ? Math.max(...fields.map(f => f.end)) : 0;
    
    const label = prompt('Alan adını girin:', 'Yeni Alan');
    if (!label) return;
    
    const startStr = prompt('Başlangıç pozisyonu:', String(lastEnd + 1));
    const start = parseInt(startStr || '1') || 1;
    
    const endStr = prompt('Bitiş pozisyonu:', String(start + 10));
    const end = parseInt(endStr || String(start + 10)) || start + 10;
    
    setFields(prev => [...prev, {
      id: `field-${Date.now()}`,
      type: 'custom',
      label,
      start,
      end
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
  
  // Parse edilmiş öğrenciler
  const parsedStudents = useMemo((): ParsedStudent[] => {
    return rawLines.map(line => {
      const corrected = fixTurkishChars(line);
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
  
  // Validasyon - en az 2 alan tanımlı olmalı
  const isValid = useMemo(() => {
    const hasIdentity = fields.some(f => 
      f.type === 'ogrenci_no' || f.type === 'tc' || f.type === 'ad' || 
      f.label.toLowerCase().includes('öğrenci') || f.label.toLowerCase().includes('no') ||
      f.label.toLowerCase().includes('ad') || f.label.toLowerCase().includes('isim')
    );
    const hasAnswersOrSubjects = fields.some(f => 
      f.type === 'cevaplar' || 
      f.label.toLowerCase().includes('cevap') ||
      f.label.toLowerCase().includes('türkçe') ||
      f.label.toLowerCase().includes('matematik') ||
      f.label.toLowerCase().includes('fen') ||
      f.label.toLowerCase().includes('sosyal') ||
      f.label.toLowerCase().includes('ingilizce') ||
      f.label.toLowerCase().includes('din') ||
      f.label.toLowerCase().includes('inkılap') ||
      f.label.toLowerCase().includes('inkilap')
    );
    // En az 2 alan varsa geçerli
    return fields.length >= 2 && (hasIdentity || hasAnswersOrSubjects);
  }, [fields]);

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
    <div className="min-h-[600px]" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5" /> Optik Form Tanımları
        </h2>
        <p className="text-purple-200 text-sm">{rawLines.length} satır • Karakterleri sürükleyerek seçin</p>
      </div>
      
      {/* KARAKTER HARİTASI - GENİŞ ARALIKLI, 2 SATIR */}
      <div className="bg-white border-2 border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-700">Karakter Haritası</span>
            <span className="text-xs text-gray-500">(Sürükleyerek seçin)</span>
          </div>
          <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Sıfırla
          </button>
        </div>
        
        <div className="p-4 overflow-x-auto select-none" style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
          {/* Pozisyon Cetveli */}
          <div className="flex mb-2">
            <div className="w-10 flex-shrink-0" />
            {Array.from({ length: Math.ceil(Math.min(maxLength, 80) / 10) }).map((_, i) => (
              <div key={i} className="text-sm font-bold text-blue-600" style={{ width: '200px' }}>
                {(i * 10) + 1}
              </div>
            ))}
          </div>
          
          {/* 2 Satır Öğrenci - GENİŞ ARALIKLI */}
          {sampleLines.map((line, rowIdx) => (
            <div key={rowIdx} className="flex items-center mb-2">
              <div className="w-10 flex-shrink-0 text-sm font-bold text-gray-400 text-right pr-2">
                {rowIdx + 1}
              </div>
              <div className="flex">
                {Array.from({ length: Math.min(line.length, 80) }).map((_, i) => {
                  const char = line[i] || '';
                  const fieldColor = getCharColor(i);
                  const inSelection = isInSelection(i);
                  
                  return (
                    <div
                      key={i}
                      onMouseDown={() => handleCharMouseDown(i)}
                      onMouseEnter={() => handleCharMouseEnter(i)}
                      className={`
                        w-5 h-8 flex items-center justify-center text-sm font-bold cursor-pointer
                        border border-gray-200 transition-all
                        ${inSelection ? 'bg-blue-400 text-white border-blue-500 scale-110 z-10' : ''}
                        ${fieldColor && !inSelection ? 'text-white' : ''}
                        ${!fieldColor && !inSelection ? 'hover:bg-blue-100 hover:border-blue-300' : ''}
                      `}
                      style={fieldColor && !inSelection ? { 
                        backgroundColor: fieldColor, 
                        borderColor: fieldColor 
                      } : undefined}
                      title={`Poz: ${i + 1}`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {maxLength > 80 && (
            <div className="mt-2 text-xs text-amber-600">⚠️ İlk 80 karakter ({maxLength} toplam)</div>
          )}
        </div>
      </div>
      
      {/* SEÇİM PANELİ */}
      {selection && (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
          <div className="text-center mb-3">
            <span className="text-2xl font-bold text-blue-600">
              {Math.min(selection.start, selection.end) + 1} → {Math.max(selection.start, selection.end) + 1}
            </span>
            <span className="text-gray-500 ml-2">
              ({Math.abs(selection.end - selection.start) + 1} karakter)
            </span>
          </div>
          <div className="p-2 bg-white rounded-lg font-mono text-center mb-3 text-lg">
            "{sampleLines[0]?.substring(Math.min(selection.start, selection.end), Math.max(selection.start, selection.end) + 1) || ''}"
          </div>
          <div className="text-sm text-gray-600 mb-2 text-center">Bu alan ne?</div>
          <div className="flex flex-wrap justify-center gap-2">
            {FIELD_TYPES.filter(f => f.type !== 'custom').map((fieldType) => (
              <button
                key={fieldType.type}
                onClick={() => handleAssignField(fieldType.type)}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1 hover:opacity-80"
                style={{ backgroundColor: fieldType.color }}
              >
                {fieldType.icon} {fieldType.label}
              </button>
            ))}
          </div>
          <div className="text-center mt-2">
            <button
              onClick={() => setSelection(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              İptal
            </button>
          </div>
        </div>
      )}
      
      {/* ALAN TANIMLARI */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="bg-emerald-50 px-4 py-2 border-b flex justify-between items-center">
          <span className="font-bold text-emerald-700">Alan Tanımları ({fields.length})</span>
          <button
            onClick={handleAddManualField}
            className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-emerald-600"
          >
            <Plus className="w-3 h-3" /> Manuel Ekle
          </button>
        </div>
        
        <div className="p-3">
          {fields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Karakterleri sürükleyerek seçin veya "Manuel Ekle" butonunu kullanın
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => {
                const fieldType = FIELD_TYPES.find(t => t.type === field.type);
                const previewValue = sampleLines[0]?.substring(field.start - 1, field.end).trim() || '';
                
                return (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg"
                    style={{ backgroundColor: (fieldType?.color || '#6B7280') + '15', borderLeft: `3px solid ${fieldType?.color || '#6B7280'}` }}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="p-1.5 rounded text-white text-xs" style={{ backgroundColor: fieldType?.color || '#6B7280' }}>
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
                      <div 
                        className="px-2 py-1 rounded text-sm font-mono truncate font-bold"
                        style={{ backgroundColor: (fieldType?.color || '#6B7280') + '30', color: fieldType?.color || '#6B7280' }}
                      >
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
                ? 'Öğrenci No/TC/Ad alanı gerekli'
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
        <p className="text-purple-100 text-sm">{totalCount} öğrenci</p>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-1.5">
        {fields.map(field => {
          const fieldType = FIELD_TYPES.find(t => t.type === field.type);
          return (
            <span key={field.id} className="inline-flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-medium" style={{ backgroundColor: fieldType?.color || '#6B7280' }}>
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
