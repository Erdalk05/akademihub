/**
 * ============================================
 * AkademiHub - Optik Form Mapper v9.0 ELITE
 * ============================================
 * 
 * ✅ TÜM KARAKTERLER GÖRÜNÜR
 * ✅ OTOMATİK ALAN ALGILAMA
 * ✅ KLAVYE KISAYOLLARI
 * ✅ UNDO/REDO
 * ✅ ANLIK İSTATİSTİKLER
 * ✅ DUPLICATE ALGILAMA
 * ✅ VERİ KALİTESİ SKORU
 * ✅ BAŞARI KONFETİ
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Eye, Save, RotateCcw, CheckCircle, AlertCircle, 
  Sparkles, Target, Users, Hash, CreditCard, School, BookOpen, FileText,
  Download, FolderOpen, Zap, ChevronRight,
  BarChart3, ZoomIn, ZoomOut, Wand2, Layout, Percent,
  Undo2, Redo2, Keyboard, Award, AlertTriangle, TrendingUp, Copy,
  Link2, Unlink, UserCheck, UserX, Search, FileSpreadsheet
} from 'lucide-react';
import { useStudentStore } from '@/lib/store/studentStore';
import { Student } from '@/types/student.types';
import * as XLSX from 'xlsx';

// ==================== CONFETTI ====================
function createConfetti() {
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];
  const confettiCount = 100;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      opacity: 1;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      pointer-events: none;
      z-index: 9999;
      animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
  
  // Add keyframes if not exists
  if (!document.querySelector('#confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ==================== SOUND EFFECTS ====================
function playSound(type: 'success' | 'error' | 'click') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.value = 523.25; // C5
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => { osc.frequency.value = 659.25; }, 100); // E5
      setTimeout(() => { osc.frequency.value = 783.99; }, 200); // G5
      setTimeout(() => osc.stop(), 400);
    } else if (type === 'error') {
      osc.frequency.value = 200;
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => osc.stop(), 200);
    } else {
      osc.frequency.value = 800;
      gain.gain.value = 0.05;
      osc.start();
      setTimeout(() => osc.stop(), 50);
    }
  } catch (e) { /* Audio not supported */ }
}

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

// ==================== VALIDATION PATTERNS ====================

const VALIDATION_PATTERNS = {
  tc: /^\d{11}$/,                    // TC Kimlik: Tam 11 rakam
  ogrenci_no: /^\d{1,10}$/,          // Öğrenci No: 1-10 rakam
  sinif: /^([1-9]|1[0-2])[A-Z]?$/,   // Sınıf: 1-12 + opsiyonel harf (8A, 11B)
  kitapcik: /^[ABCD]$/i,             // Kitapçık: A, B, C veya D
  cevaplar: /^[ABCDE\s\-]+$/i,       // Cevaplar: A,B,C,D,E ve boşluk/tire
};

// Validasyon fonksiyonu
function validateField(value: string, type: FieldType): { valid: boolean; error?: string } {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Boş değer' };
  }
  
  switch (type) {
    case 'tc':
      if (!VALIDATION_PATTERNS.tc.test(trimmed)) {
        return { valid: false, error: 'TC 11 rakam olmalı' };
      }
      // TC algoritma kontrolü
      if (!validateTCAlgorithm(trimmed)) {
        return { valid: false, error: 'Geçersiz TC' };
      }
      return { valid: true };
      
    case 'ogrenci_no':
      if (!VALIDATION_PATTERNS.ogrenci_no.test(trimmed)) {
        return { valid: false, error: 'Geçersiz öğrenci no' };
      }
      return { valid: true };
      
    case 'sinif':
      if (!VALIDATION_PATTERNS.sinif.test(trimmed)) {
        return { valid: false, error: 'Geçersiz sınıf (örn: 8A)' };
      }
      return { valid: true };
      
    case 'kitapcik':
      if (!VALIDATION_PATTERNS.kitapcik.test(trimmed)) {
        return { valid: false, error: 'Kitapçık A,B,C,D olmalı' };
      }
      return { valid: true };
      
    case 'cevaplar':
      if (!VALIDATION_PATTERNS.cevaplar.test(trimmed)) {
        return { valid: false, error: 'Geçersiz cevap formatı' };
      }
      return { valid: true };
      
    default:
      return { valid: true };
  }
}

// TC Kimlik algoritma doğrulaması
function validateTCAlgorithm(tc: string): boolean {
  if (tc.length !== 11 || tc[0] === '0') return false;
  
  const digits = tc.split('').map(Number);
  
  // 10. hane kontrolü
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = ((oddSum * 7) - evenSum) % 10;
  if (check10 !== digits[9]) return false;
  
  // 11. hane kontrolü
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;
  
  return true;
}

// ==================== OVERLAP DETECTION ====================

function checkOverlap(fields: FieldDefinition[], newStart: number, newEnd: number, excludeId?: string): boolean {
  for (const field of fields) {
    if (excludeId && field.id === excludeId) continue;
    
    // Overlap kontrolü: yeni alanın başı veya sonu mevcut alanla çakışıyor mu?
    const overlap = !(newEnd < field.start || newStart > field.end);
    if (overlap) return true;
  }
  return false;
}

function getOverlapMessage(fields: FieldDefinition[], start: number, end: number): string | null {
  for (const field of fields) {
    if (!(end < field.start || start > field.end)) {
      return `"${field.label}" alanı ile çakışıyor (${field.start}-${field.end})`;
    }
  }
  return null;
}

// ==================== TYPES ====================

type FieldType = 'ogrenci_no' | 'tc' | 'ad_soyad' | 'sinif' | 'kitapcik' | 'cevaplar' | 'custom';

interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  start: number; // inclusive (1-based)
  end: number;
}

interface ParsedStudent {
  ogrenciNo?: string;
  tc?: string;
  adSoyad?: string;
  sinif?: string;
  kitapcik?: string;
  cevaplar?: string;
  answers?: Record<string, string>;
  validationErrors?: string[];
  isValid?: boolean;
  customFields?: Record<string, string>;
}

// Structured output for export
interface StructuredOutput {
  studentNo: string;
  fullName: string;
  tc: string;
  class: string;
  booklet: string;
  answers: Record<string, string>;
  validationStatus: 'valid' | 'warning' | 'error';
  errors: string[];
}

interface FormTemplate {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

// ==================== CEVAP ANAHTARI & NET HESAPLAMA ====================

interface AnswerKey {
  subject: string;
  answers: string;
  questionCount: number;
  startIndex?: number;
  endIndex?: number;
}

interface SubjectResult {
  subject: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  total: number;
}

interface StudentResult extends ParsedStudent {
  results?: SubjectResult[];
  totalNet?: number;
  totalCorrect?: number;
  totalWrong?: number;
  totalEmpty?: number;
}

// LGS Sınav Yapısı (90 soru)
const LGS_STRUCTURE: AnswerKey[] = [
  { subject: 'Türkçe', answers: '', questionCount: 20, startIndex: 0, endIndex: 20 },
  { subject: 'Matematik', answers: '', questionCount: 20, startIndex: 20, endIndex: 40 },
  { subject: 'Fen Bilimleri', answers: '', questionCount: 20, startIndex: 40, endIndex: 60 },
  { subject: 'T.C. İnkılap Tarihi', answers: '', questionCount: 10, startIndex: 60, endIndex: 70 },
  { subject: 'Din Kültürü', answers: '', questionCount: 10, startIndex: 70, endIndex: 80 },
  { subject: 'İngilizce', answers: '', questionCount: 10, startIndex: 80, endIndex: 90 },
];

// TYT Sınav Yapısı (120 soru)
const TYT_STRUCTURE: AnswerKey[] = [
  { subject: 'Türkçe', answers: '', questionCount: 40, startIndex: 0, endIndex: 40 },
  { subject: 'Sosyal Bilimler', answers: '', questionCount: 20, startIndex: 40, endIndex: 60 },
  { subject: 'Matematik', answers: '', questionCount: 40, startIndex: 60, endIndex: 100 },
  { subject: 'Fen Bilimleri', answers: '', questionCount: 20, startIndex: 100, endIndex: 120 },
];

// Net hesaplama (4 yanlış = 1 doğru götürür)
function calculateNet(correct: number, wrong: number, wrongPenalty: number = 4): number {
  const net = correct - (wrong / wrongPenalty);
  return Math.round(net * 100) / 100; // 2 ondalık
}

// Öğrenci cevaplarını değerlendir
function evaluateAnswers(
  studentAnswers: string, 
  answerKey: string, 
  booklet: string = 'A'
): { correct: number; wrong: number; empty: number } {
  let correct = 0;
  let wrong = 0;
  let empty = 0;
  
  // Kitapçık rotasyonu (basit versiyon - A baz alınır)
  const rotatedKey = rotateAnswerKey(answerKey, booklet);
  
  for (let i = 0; i < rotatedKey.length; i++) {
    const studentAnswer = (studentAnswers[i] || ' ').toUpperCase().trim();
    const correctAnswer = rotatedKey[i].toUpperCase();
    
    if (!studentAnswer || studentAnswer === ' ' || studentAnswer === '-') {
      empty++;
    } else if (studentAnswer === correctAnswer) {
      correct++;
    } else {
      wrong++;
    }
  }
  
  return { correct, wrong, empty };
}

// Kitapçık rotasyonu (A→B→C→D)
function rotateAnswerKey(key: string, booklet: string): string {
  if (booklet.toUpperCase() === 'A') return key;
  
  const rotation: Record<string, Record<string, string>> = {
    'B': { 'A': 'B', 'B': 'C', 'C': 'D', 'D': 'A' },
    'C': { 'A': 'C', 'B': 'D', 'C': 'A', 'D': 'B' },
    'D': { 'A': 'D', 'B': 'A', 'C': 'B', 'D': 'C' },
  };
  
  const rotationMap = rotation[booklet.toUpperCase()];
  if (!rotationMap) return key;
  
  return key.split('').map(c => rotationMap[c.toUpperCase()] || c).join('');
}

// Ders bazlı sonuç hesapla
function calculateSubjectResults(
  studentAnswers: string,
  answerKeys: AnswerKey[],
  booklet: string = 'A'
): SubjectResult[] {
  return answerKeys.map(subject => {
    const studentSubjectAnswers = studentAnswers.substring(
      subject.startIndex || 0, 
      subject.endIndex || subject.questionCount
    );
    const { correct, wrong, empty } = evaluateAnswers(
      studentSubjectAnswers, 
      subject.answers, 
      booklet
    );
    
    return {
      subject: subject.subject,
      correct,
      wrong,
      empty,
      net: calculateNet(correct, wrong),
      total: subject.questionCount,
    };
  });
}

// ==================== ÖĞRENCİ EŞLEŞTİRME ====================

interface MatchResult {
  parsedIndex: number;
  parsedStudent: StudentResult;
  matchedStudent: Student | null;
  matchType: 'tc' | 'ogrenciNo' | 'name' | 'fuzzy' | 'none';
  confidence: number; // 0-100
  suggestions: Student[];
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;
  
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;
  
  for (let i = 0; i <= bLen; i++) matrix[i] = [i];
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[bLen][aLen];
}

// Normalize name for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match students
function matchStudents(
  parsedStudents: StudentResult[],
  systemStudents: Student[]
): MatchResult[] {
  return parsedStudents.map((parsed, idx) => {
    // 1. TC ile eşleştir (en güvenilir)
    if (parsed.tc) {
      const tcMatch = systemStudents.find(s => s.tcKimlik === parsed.tc);
      if (tcMatch) {
        return {
          parsedIndex: idx,
          parsedStudent: parsed,
          matchedStudent: tcMatch,
          matchType: 'tc',
          confidence: 100,
          suggestions: [],
        };
      }
    }
    
    // 2. Öğrenci No ile eşleştir
    if (parsed.ogrenciNo) {
      const noMatch = systemStudents.find(s => s.ogrenciNo === parsed.ogrenciNo);
      if (noMatch) {
        return {
          parsedIndex: idx,
          parsedStudent: parsed,
          matchedStudent: noMatch,
          matchType: 'ogrenciNo',
          confidence: 95,
          suggestions: [],
        };
      }
    }
    
    // 3. Ad Soyad ile eşleştir
    if (parsed.adSoyad) {
      const normalizedParsed = normalizeName(parsed.adSoyad);
      
      // Tam eşleşme
      const exactMatch = systemStudents.find(s => 
        normalizeName(`${s.ad} ${s.soyad}`) === normalizedParsed
      );
      if (exactMatch) {
        return {
          parsedIndex: idx,
          parsedStudent: parsed,
          matchedStudent: exactMatch,
          matchType: 'name',
          confidence: 90,
          suggestions: [],
        };
      }
      
      // Fuzzy matching
      const matches = systemStudents.map(s => {
        const systemName = normalizeName(`${s.ad} ${s.soyad}`);
        const distance = levenshteinDistance(normalizedParsed, systemName);
        const maxLen = Math.max(normalizedParsed.length, systemName.length);
        const similarity = Math.round((1 - distance / maxLen) * 100);
        return { student: s, similarity };
      }).filter(m => m.similarity >= 70)
        .sort((a, b) => b.similarity - a.similarity);
      
      if (matches.length > 0 && matches[0].similarity >= 85) {
        return {
          parsedIndex: idx,
          parsedStudent: parsed,
          matchedStudent: matches[0].student,
          matchType: 'fuzzy',
          confidence: matches[0].similarity,
          suggestions: matches.slice(1, 4).map(m => m.student),
        };
      }
      
      // Öneriler var ama kesin eşleşme yok
      if (matches.length > 0) {
        return {
          parsedIndex: idx,
          parsedStudent: parsed,
          matchedStudent: null,
          matchType: 'none',
          confidence: 0,
          suggestions: matches.slice(0, 5).map(m => m.student),
        };
      }
    }
    
    // Eşleşme bulunamadı
    return {
      parsedIndex: idx,
      parsedStudent: parsed,
      matchedStudent: null,
      matchType: 'none',
      confidence: 0,
      suggestions: [],
    };
  });
}

// ==================== CONSTANTS ====================

const FIELD_TYPES: { type: FieldType; label: string; color: string; icon: React.ReactNode; shortcut: string }[] = [
  { type: 'ogrenci_no', label: 'Öğrenci No', color: '#3B82F6', icon: <Hash className="w-3 h-3" />, shortcut: '1' },
  { type: 'tc', label: 'TC Kimlik', color: '#8B5CF6', icon: <CreditCard className="w-3 h-3" />, shortcut: '2' },
  { type: 'ad_soyad', label: 'Ad Soyad', color: '#10B981', icon: <Users className="w-3 h-3" />, shortcut: '3' },
  { type: 'sinif', label: 'Sınıf', color: '#F59E0B', icon: <School className="w-3 h-3" />, shortcut: '4' },
  { type: 'kitapcik', label: 'Kitapçık', color: '#EC4899', icon: <BookOpen className="w-3 h-3" />, shortcut: '5' },
  { type: 'cevaplar', label: 'Cevaplar', color: '#EF4444', icon: <FileText className="w-3 h-3" />, shortcut: '6' },
];

const PRESET_TEMPLATES: FormTemplate[] = [
  {
    id: 'lgs-standard',
    name: 'LGS Standart',
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
    name: 'TYT Standart',
    fields: [
      { id: 'f1', type: 'ogrenci_no', label: 'Öğrenci No', start: 1, end: 6 },
      { id: 'f2', type: 'ad_soyad', label: 'Ad Soyad', start: 7, end: 30 },
      { id: 'f3', type: 'sinif', label: 'Sınıf', start: 31, end: 33 },
      { id: 'f4', type: 'kitapcik', label: 'Kitapçık', start: 34, end: 34 },
      { id: 'f5', type: 'cevaplar', label: 'Cevaplar', start: 35, end: 154 },
    ]
  },
];

// ❌ localStorage KALDIRILDI - Tek veri kaynağı Supabase API
// const STORAGE_KEY = 'akademihub_form_templates_v2';

// ==================== MAIN COMPONENT ====================

interface FixedWidthMapperProps {
  rawLines: string[];
  onComplete: (fields: FieldDefinition[], parsedStudents: ParsedStudent[]) => void;
  onBack: () => void;
  onFileDropped?: (file: File) => void; // Drag & Drop desteği
}

export function FixedWidthMapper({ rawLines, onComplete, onBack, onFileDropped }: FixedWidthMapperProps) {
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
  const [zoom, setZoom] = useState(100);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobil algılama
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // CEVAP ANAHTARI
  const [examType, setExamType] = useState<'lgs' | 'tyt' | 'custom'>('lgs');
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>(LGS_STRUCTURE.map(s => ({ ...s })));
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false);
  const [resultsMode, setResultsMode] = useState(false);
  
  // ÖĞRENCİ EŞLEŞTİRME
  const { students: systemStudents, getStudents } = useStudentStore();
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [matchingDone, setMatchingDone] = useState(false);
  
  // UNDO/REDO
  const [history, setHistory] = useState<FieldDefinition[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const manualInputRef = useRef<HTMLInputElement>(null);
  
  // Sınav tipi değiştiğinde cevap anahtarı yapısını güncelle
  useEffect(() => {
    if (examType === 'lgs') {
      setAnswerKeys(LGS_STRUCTURE.map(s => ({ ...s })));
    } else if (examType === 'tyt') {
      setAnswerKeys(TYT_STRUCTURE.map(s => ({ ...s })));
    }
  }, [examType]);
  
  // Undo/Redo fonksiyonları
  const pushHistory = useCallback((newFields: FieldDefinition[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newFields);
      return newHistory.slice(-20); // Max 20 history
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFields(history[historyIndex - 1] || []);
      playSound('click');
    }
  }, [historyIndex, history]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setFields(history[historyIndex + 1] || []);
      playSound('click');
    }
  }, [historyIndex, history]);
  
  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z = Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y = Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // 1-6 = Alan seçimi (selection varken)
      if (selection && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const fieldType = FIELD_TYPES[parseInt(e.key) - 1];
        if (fieldType) {
          handleAssignField(fieldType.type);
          playSound('success');
        }
      }
      // Escape = İptal
      if (e.key === 'Escape') {
        setSelection(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, undo, redo]);
  
  // ❌ localStorage KALDIRILDI - Tek veri kaynağı Supabase API
  // Şablonlar artık API üzerinden yükleniyor (optik_sablonlari tablosu)
  // TODO: API endpoint hazır olduğunda buraya fetch eklenecek
  useEffect(() => {
    // localStorage kullanılmıyor - session-only state
    console.log('⚠️ [FixedWidthMapper] Şablonlar: API entegrasyonu bekleniyor');
  }, []);
  
  const saveTemplates = useCallback((t: FormTemplate[]) => {
    // localStorage kullanılmıyor - sadece session state
    setSavedTemplates(t);
    console.log('⚠️ [FixedWidthMapper] Şablon kaydetme: API endpoint henüz yok');
  }, []);
  
  // 3 satır önizleme
  const sampleLines = useMemo(() => rawLines.slice(0, 3).map(l => fixTurkishChars(l)), [rawLines]);
  const maxLength = useMemo(() => Math.max(...rawLines.map(l => l.length), 100), [rawLines]);
  
  // Parse edilmiş öğrenciler - FIXED-WIDTH PARSING
  const parsedStudents = useMemo((): ParsedStudent[] => {
    return rawLines.map(line => {
      // FIXED-WIDTH: Karakter pozisyonlarına göre ayıkla, SPACE SPLIT YAPMA
      const correctedLine = fixTurkishChars(line);
      const s: ParsedStudent = {};
      const errors: string[] = [];
      const answers: Record<string, string> = {};
      
      fields.forEach(f => {
        // CRITICAL: substring ile tam pozisyon çıkarımı
        // start-1 çünkü UI'da 1-based, JS'te 0-based
        const rawValue = correctedLine.substring(f.start - 1, f.end);
        const trimmedValue = rawValue.trim();
        
        // Validasyon kontrolü
        const validation = validateField(trimmedValue, f.type);
        if (!validation.valid && validation.error) {
          errors.push(`${f.label}: ${validation.error}`);
        }
        
        // Alan tipine göre atama
        switch (f.type) {
          case 'ogrenci_no':
            s.ogrenciNo = trimmedValue;
            break;
          case 'tc':
            s.tc = trimmedValue;
            // TC geçersizse, ad-soyad ile eşleştirme yapılacak (fallback)
            if (!validation.valid) {
              s.tc = undefined; // Geçersiz TC'yi temizle
            }
            break;
          case 'ad_soyad':
            s.adSoyad = trimmedValue;
            break;
          case 'sinif':
            s.sinif = trimmedValue.toUpperCase();
            break;
          case 'kitapcik':
            s.kitapcik = trimmedValue.toUpperCase();
            break;
          case 'cevaplar':
            s.cevaplar = trimmedValue.toUpperCase().replace(/\s+/g, '');
            answers[f.label] = trimmedValue.toUpperCase().replace(/\s+/g, '');
            break;
          default:
            // Custom alanlar - ders bazlı cevaplar olabilir
            if (f.label.toLowerCase().includes('türkçe') || 
                f.label.toLowerCase().includes('matematik') ||
                f.label.toLowerCase().includes('fen') ||
                f.label.toLowerCase().includes('sosyal') ||
                f.label.toLowerCase().includes('ingilizce') ||
                f.label.toLowerCase().includes('din')) {
              answers[f.label] = trimmedValue.toUpperCase().replace(/\s+/g, '');
            }
            if (!s.customFields) s.customFields = {};
            s.customFields[f.label] = trimmedValue;
        }
      });
      
      s.answers = answers;
      s.validationErrors = errors;
      s.isValid = errors.length === 0;
      
      return s;
    });
  }, [rawLines, fields]);
  
  // DUPLICATE ALGILAMA
  const duplicates = useMemo(() => {
    const ids = parsedStudents.map(s => s.ogrenciNo || s.tc || '').filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    ids.forEach(id => {
      if (seen.has(id)) dupes.add(id);
      seen.add(id);
    });
    return dupes;
  }, [parsedStudents]);
  
  // VERİ KALİTESİ SKORU
  const qualityScore = useMemo(() => {
    let score = 0;
    const checks = {
      hasId: fields.some(f => f.type === 'ogrenci_no' || f.type === 'tc'),
      hasName: fields.some(f => f.type === 'ad_soyad'),
      hasAnswers: fields.some(f => f.type === 'cevaplar'),
      noDuplicates: duplicates.size === 0,
      coverage: fields.reduce((s, f) => s + (f.end - f.start + 1), 0) / maxLength,
    };
    if (checks.hasId) score += 25;
    if (checks.hasName) score += 20;
    if (checks.hasAnswers) score += 30;
    if (checks.noDuplicates) score += 15;
    score += Math.round(checks.coverage * 10);
    return Math.min(100, score);
  }, [fields, duplicates, maxLength]);
  
  // Validasyon hataları sayısı
  const validationErrors = useMemo(() => {
    return parsedStudents.filter(s => !s.isValid).length;
  }, [parsedStudents]);
  
  // İstatistikler
  const stats = useMemo(() => ({
    students: rawLines.length,
    maxChars: maxLength,
    definedFields: fields.length,
    definedChars: fields.reduce((s, f) => s + (f.end - f.start + 1), 0),
    coverage: Math.round((fields.reduce((s, f) => s + (f.end - f.start + 1), 0) / maxLength) * 100),
    duplicateCount: duplicates.size,
    qualityScore,
    validationErrors,
  }), [rawLines, fields, maxLength, duplicates, qualityScore, validationErrors]);
  
  // OTOMATİK ALAN ALGILAMA
  const autoDetectFields = useCallback(() => {
    setAutoDetecting(true);
    playSound('click');
    
    const sample = sampleLines[0] || '';
    const detected: FieldDefinition[] = [];
    
    // Öğrenci no
    const numEnd = sample.search(/[A-ZÇĞİÖŞÜa-zçğıöşü]/) - 1;
    if (numEnd > 2) {
      detected.push({ id: `auto-${Date.now()}-1`, type: 'ogrenci_no', label: 'Öğrenci No', start: 1, end: numEnd });
    }
    
    // Ad Soyad
    const nameMatch = sample.match(/[A-ZÇĞİÖŞÜa-zçğıöşü\s]{10,}/);
    if (nameMatch) {
      const start = sample.indexOf(nameMatch[0]) + 1;
      detected.push({ id: `auto-${Date.now()}-2`, type: 'ad_soyad', label: 'Ad Soyad', start, end: start + nameMatch[0].length - 1 });
    }
    
    // Sınıf
    const classMatch = sample.match(/\d[A-Z](?=\s|[ABCD]{2,})/);
    if (classMatch) {
      const start = sample.indexOf(classMatch[0]) + 1;
      detected.push({ id: `auto-${Date.now()}-3`, type: 'sinif', label: 'Sınıf', start, end: start + 1 });
    }
    
    // Cevaplar
    const answerMatch = sample.match(/[ABCD\s]{20,}/);
    if (answerMatch) {
      const start = sample.indexOf(answerMatch[0]) + 1;
      detected.push({ id: `auto-${Date.now()}-5`, type: 'cevaplar', label: 'Cevaplar', start, end: sample.length });
    }
    
    setTimeout(() => {
      const sorted = detected.sort((a, b) => a.start - b.start);
      setFields(sorted);
      pushHistory(sorted);
      setAutoDetecting(false);
      if (sorted.length > 0) {
        playSound('success');
      }
    }, 500);
  }, [sampleLines, pushHistory]);
  
  // Alan ata - OVERLAP KONTROLÜ İLE
  const handleAssignField = useCallback((type: FieldType, label?: string) => {
    if (!selection) return;
    const s = Math.min(selection.start, selection.end) + 1;
    const e = Math.max(selection.start, selection.end) + 1;
    
    // OVERLAP KONTROLÜ
    if (checkOverlap(fields, s, e)) {
      const overlapMsg = getOverlapMessage(fields, s, e);
      playSound('error');
      alert(`⚠️ Çakışma Hatası!\n\n${overlapMsg}\n\nAlanlar üst üste binemez.`);
      return;
    }
    
    const ft = FIELD_TYPES.find(f => f.type === type);
    const newFields = [...fields, { id: `f-${Date.now()}`, type, label: label || ft?.label || 'Özel', start: s, end: e }].sort((a, b) => a.start - b.start);
    setFields(newFields);
    pushHistory(newFields);
    setSelection(null);
    playSound('success');
  }, [selection, fields, pushHistory]);
  
  // Karakter seçimi
  const handleCharMouseDown = useCallback((i: number) => {
    if (fields.find(f => i >= f.start - 1 && i < f.end)) return;
    setIsSelecting(true);
    setSelection({ start: i, end: i });
    playSound('click');
  }, [fields]);
  
  const handleCharMouseEnter = useCallback((i: number) => {
    if (isSelecting) setSelection(p => p ? { ...p, end: i } : null);
  }, [isSelecting]);
  
  const handleMouseUp = useCallback(() => setIsSelecting(false), []);
  
  // Manuel ekle - OVERLAP KONTROLÜ İLE
  const handleAddManualField = useCallback(() => {
    if (!manualField.label.trim()) return;
    
    // OVERLAP KONTROLÜ
    if (checkOverlap(fields, manualField.start, manualField.end)) {
      const overlapMsg = getOverlapMessage(fields, manualField.start, manualField.end);
      playSound('error');
      alert(`⚠️ Çakışma Hatası!\n\n${overlapMsg}\n\nAlanlar üst üste binemez.`);
      return;
    }
    
    const newFields = [...fields, { id: `f-${Date.now()}`, type: 'custom' as FieldType, label: manualField.label, start: manualField.start, end: manualField.end }].sort((a, b) => a.start - b.start);
    setFields(newFields);
    pushHistory(newFields);
    setManualField({ label: '', start: manualField.end + 1, end: manualField.end + 20 });
    playSound('success');
    setTimeout(() => manualInputRef.current?.focus(), 50);
  }, [manualField, fields, pushHistory]);
  
  const handleManualKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && manualField.label.trim()) handleAddManualField();
  }, [handleAddManualField, manualField.label]);
  
  const handleUpdateField = useCallback((id: string, u: Partial<FieldDefinition>) => {
    const newFields = fields.map(f => f.id === id ? { ...f, ...u } : f);
    setFields(newFields);
  }, [fields]);
  
  const handleRemoveField = useCallback((id: string) => {
    const newFields = fields.filter(f => f.id !== id);
    setFields(newFields);
    pushHistory(newFields);
    playSound('click');
  }, [fields, pushHistory]);
  
  const handleReset = useCallback(() => {
    setFields([]);
    pushHistory([]);
    setSelection(null);
    playSound('click');
  }, [pushHistory]);
  
  // Şablon
  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !fields.length) return;
    saveTemplates([...savedTemplates, { id: `t-${Date.now()}`, name: newTemplateName, fields }]);
    setNewTemplateName('');
    setShowSaveDialog(false);
    playSound('success');
  }, [newTemplateName, fields, savedTemplates, saveTemplates]);
  
  const handleLoadTemplate = useCallback((t: FormTemplate) => {
    const newFields = t.fields.map(f => ({ ...f, id: `f-${Date.now()}-${Math.random()}` }));
    setFields(newFields);
    pushHistory(newFields);
    setShowTemplates(false);
    playSound('success');
  }, [pushHistory]);
  
  // Cevap anahtarı güncelle
  const updateAnswerKey = useCallback((index: number, answers: string) => {
    setAnswerKeys(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], answers: answers.toUpperCase().replace(/[^ABCDE]/g, '') };
      return updated;
    });
  }, []);
  
  // Sonuçları hesapla
  const studentResults = useMemo((): StudentResult[] => {
    const hasAnswerKeys = answerKeys.some(k => k.answers.length > 0);
    if (!hasAnswerKeys) return parsedStudents as StudentResult[];
    
    return parsedStudents.map(student => {
      const studentAnswers = student.cevaplar || '';
      const booklet = student.kitapcik || 'A';
      
      const results = calculateSubjectResults(studentAnswers, answerKeys, booklet);
      
      const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
      const totalWrong = results.reduce((s, r) => s + r.wrong, 0);
      const totalEmpty = results.reduce((s, r) => s + r.empty, 0);
      const totalNet = results.reduce((s, r) => s + r.net, 0);
      
      return {
        ...student,
        results,
        totalCorrect,
        totalWrong,
        totalEmpty,
        totalNet,
      };
    });
  }, [parsedStudents, answerKeys]);
  
  // Sınıf ortalamaları
  const classStats = useMemo(() => {
    if (studentResults.length === 0) return null;
    
    const hasResults = studentResults.some(s => s.totalNet !== undefined);
    if (!hasResults) return null;
    
    const validStudents = studentResults.filter(s => s.totalNet !== undefined);
    const avgNet = validStudents.reduce((s, r) => s + (r.totalNet || 0), 0) / validStudents.length;
    const maxNet = Math.max(...validStudents.map(s => s.totalNet || 0));
    const minNet = Math.min(...validStudents.map(s => s.totalNet || 0));
    
    // Ders bazlı ortalamalar
    const subjectAverages: Record<string, number> = {};
    answerKeys.forEach((key, idx) => {
      const avg = validStudents.reduce((s, r) => s + (r.results?.[idx]?.net || 0), 0) / validStudents.length;
      subjectAverages[key.subject] = Math.round(avg * 100) / 100;
    });
    
    return {
      avgNet: Math.round(avgNet * 100) / 100,
      maxNet,
      minNet,
      studentCount: validStudents.length,
      subjectAverages,
    };
  }, [studentResults, answerKeys]);
  
  // Öğrenci eşleştirme başlat
  const startMatching = useCallback(() => {
    const allStudents = getStudents();
    const results = matchStudents(studentResults, allStudents);
    setMatchResults(results);
    setShowMatchingModal(true);
  }, [studentResults, getStudents]);
  
  // Manuel eşleştirme
  const manualMatch = useCallback((parsedIndex: number, student: Student | null) => {
    setMatchResults(prev => prev.map(r => 
      r.parsedIndex === parsedIndex 
        ? { ...r, matchedStudent: student, matchType: student ? 'name' : 'none', confidence: student ? 100 : 0, suggestions: [] }
        : r
    ));
  }, []);
  
  // Eşleştirme istatistikleri
  const matchStats = useMemo(() => {
    const matched = matchResults.filter(r => r.matchedStudent !== null).length;
    const unmatched = matchResults.filter(r => r.matchedStudent === null).length;
    const tcMatched = matchResults.filter(r => r.matchType === 'tc').length;
    const noMatched = matchResults.filter(r => r.matchType === 'ogrenciNo').length;
    const nameMatched = matchResults.filter(r => r.matchType === 'name' || r.matchType === 'fuzzy').length;
    const avgConfidence = matchResults.length > 0 
      ? Math.round(matchResults.reduce((s, r) => s + r.confidence, 0) / matchResults.length)
      : 0;
    
    return { matched, unmatched, tcMatched, noMatched, nameMatched, avgConfidence };
  }, [matchResults]);
  
  // EXCEL EXPORT
  const exportToExcel = useCallback(() => {
    const hasResults = answerKeys.some(k => k.answers.length > 0);
    
    const data = studentResults.map((s, idx) => {
      const row: Record<string, string | number> = {
        'No': idx + 1,
        'Öğrenci No': s.ogrenciNo || '',
        'Ad Soyad': s.adSoyad || '',
        'Sınıf': s.sinif || '',
        'Kitapçık': s.kitapcik || '',
      };
      
      if (hasResults && s.results) {
        s.results.forEach(r => {
          row[`${r.subject} D`] = r.correct;
          row[`${r.subject} Y`] = r.wrong;
          row[`${r.subject} B`] = r.empty;
          row[`${r.subject} Net`] = r.net;
        });
        row['Toplam Doğru'] = s.totalCorrect || 0;
        row['Toplam Yanlış'] = s.totalWrong || 0;
        row['Toplam Boş'] = s.totalEmpty || 0;
        row['Toplam Net'] = s.totalNet || 0;
      } else {
        row['Cevaplar'] = s.cevaplar || '';
      }
      
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Sütun genişlikleri
    ws['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 8 }, { wch: 8 },
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sonuçlar');
    
    // İstatistik sayfası
    if (classStats) {
      const statsData = [
        { 'Metrik': 'Öğrenci Sayısı', 'Değer': classStats.studentCount },
        { 'Metrik': 'Ortalama Net', 'Değer': classStats.avgNet },
        { 'Metrik': 'En Yüksek Net', 'Değer': classStats.maxNet },
        { 'Metrik': 'En Düşük Net', 'Değer': classStats.minNet },
        ...Object.entries(classStats.subjectAverages).map(([subject, avg]) => ({
          'Metrik': `${subject} Ort.`,
          'Değer': avg,
        })),
      ];
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWs, 'İstatistikler');
    }
    
    const filename = `Sinav_Sonuclari_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    playSound('success');
  }, [studentResults, answerKeys, classStats]);
  
  // DRAG & DROP HANDLERS
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && onFileDropped) {
      const validTypes = ['.txt', '.csv', '.xlsx', '.xls'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (validTypes.includes(ext)) {
        onFileDropped(file);
        playSound('success');
      } else {
        playSound('error');
        alert('Desteklenen dosya türleri: TXT, CSV, Excel');
      }
    }
  }, [onFileDropped]);
  
  // CSV EXPORT
  const exportToCSV = useCallback(() => {
    const hasResults = answerKeys.some(k => k.answers.length > 0);
    
    const headers = ['No', 'Öğrenci No', 'Ad Soyad', 'Sınıf', 'Kitapçık'];
    if (hasResults) {
      answerKeys.forEach(k => {
        headers.push(`${k.subject} D`, `${k.subject} Y`, `${k.subject} B`, `${k.subject} Net`);
      });
      headers.push('Toplam D', 'Toplam Y', 'Toplam B', 'Toplam Net');
    } else {
      headers.push('Cevaplar');
    }
    
    const rows = studentResults.map((s, idx) => {
      const row = [
        idx + 1,
        s.ogrenciNo || '',
        s.adSoyad || '',
        s.sinif || '',
        s.kitapcik || '',
      ];
      
      if (hasResults && s.results) {
        s.results.forEach(r => {
          row.push(r.correct, r.wrong, r.empty, r.net);
        });
        row.push(s.totalCorrect || 0, s.totalWrong || 0, s.totalEmpty || 0, s.totalNet || 0);
      } else {
        row.push(s.cevaplar || '');
      }
      
      return row.join(';');
    });
    
    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sinav_Sonuclari_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    playSound('success');
  }, [studentResults, answerKeys]);
  
  const handleDeleteTemplate = useCallback((id: string) => saveTemplates(savedTemplates.filter(t => t.id !== id)), [savedTemplates, saveTemplates]);
  
  const handleComplete = useCallback(() => {
    createConfetti();
    playSound('success');
    setTimeout(() => onComplete(fields, parsedStudents), 500);
  }, [fields, parsedStudents, onComplete]);
  
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
        students={studentResults.slice(0, 20) as StudentResult[]} 
        fields={fields}
        totalCount={studentResults.length}
        duplicates={duplicates}
        qualityScore={qualityScore}
        answerKeys={answerKeys}
        classStats={classStats}
        onBack={() => setPreviewMode(false)}
        onConfirm={handleComplete}
      />
    );
  }

  const charSize = Math.max(12, Math.round(16 * (zoom / 100)));
  const charWidth = Math.max(14, Math.round(18 * (zoom / 100)));

  return (
    <div 
      className={`min-h-[600px] relative transition-all ${isDragging ? 'ring-4 ring-blue-400 ring-offset-2 bg-blue-50/50' : ''}`}
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* DRAG & DROP OVERLAY */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl border-4 border-dashed border-blue-500">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-bold text-blue-700">Dosyayı Buraya Bırakın</p>
            <p className="text-blue-500">TXT, CSV veya Excel</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5" /> Optik Form Mapper Elite
            </h2>
            <p className="text-purple-200 text-sm">{rawLines.length} öğrenci • {maxLength} karakter</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowKeyboardHelp(true)} className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30" title="Klavye Kısayolları">
              <Keyboard className="w-4 h-4" />
            </button>
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
      
      {/* ÖĞRENCİ EŞLEŞTİRME MODAL */}
      {showMatchingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMatchingModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Link2 className="w-5 h-5" /> Öğrenci Eşleştirme
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm">
                  <UserCheck className="w-4 h-4" /> {matchStats.matched} Eşleşti
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm">
                  <UserX className="w-4 h-4" /> {matchStats.unmatched} Eşleşmedi
                </div>
              </div>
            </div>
            
            {/* İstatistikler */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{matchStats.tcMatched}</div>
                <div className="text-xs text-blue-500">TC ile</div>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{matchStats.noMatched}</div>
                <div className="text-xs text-purple-500">Öğr No ile</div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-center">
                <div className="text-lg font-bold text-emerald-600">{matchStats.nameMatched}</div>
                <div className="text-xs text-emerald-500">İsim ile</div>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-center">
                <div className="text-lg font-bold text-amber-600">{matchStats.avgConfidence}%</div>
                <div className="text-xs text-amber-500">Ort. Güven</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-600">{systemStudents.length}</div>
                <div className="text-xs text-gray-500">Sistemde</div>
              </div>
            </div>
            
            {/* Eşleştirme listesi */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Optik Form</th>
                    <th className="px-3 py-2 text-center">Eşleşme</th>
                    <th className="px-3 py-2 text-left">Sistemdeki Öğrenci</th>
                    <th className="px-3 py-2 text-center">Güven</th>
                    <th className="px-3 py-2 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {matchResults.map((r, idx) => (
                    <tr key={idx} className={`border-b ${r.matchedStudent ? 'hover:bg-green-50' : 'bg-red-50 hover:bg-red-100'}`}>
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.parsedStudent.adSoyad || '—'}</div>
                        <div className="text-xs text-gray-500">{r.parsedStudent.ogrenciNo || r.parsedStudent.tc || '—'}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.matchedStudent ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            r.matchType === 'tc' ? 'bg-blue-100 text-blue-700' :
                            r.matchType === 'ogrenciNo' ? 'bg-purple-100 text-purple-700' :
                            r.matchType === 'name' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {r.matchType === 'tc' ? 'TC' : r.matchType === 'ogrenciNo' ? 'NO' : r.matchType === 'name' ? 'İSİM' : 'FUZZY'}
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs font-bold">YOK</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.matchedStudent ? (
                          <div>
                            <div className="font-medium text-emerald-700">{r.matchedStudent.ad} {r.matchedStudent.soyad}</div>
                            <div className="text-xs text-gray-500">{r.matchedStudent.sinif} • {r.matchedStudent.ogrenciNo}</div>
                          </div>
                        ) : r.suggestions.length > 0 ? (
                          <select 
                            onChange={e => {
                              const selected = r.suggestions.find(s => s.id === e.target.value);
                              if (selected) manualMatch(r.parsedIndex, selected);
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="">Öneri seç...</option>
                            {r.suggestions.map(s => (
                              <option key={s.id} value={s.id}>{s.ad} {s.soyad} ({s.sinif})</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-red-400 text-xs">Öneri yok</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.matchedStudent && (
                          <span className={`px-2 py-1 rounded font-bold text-xs ${
                            r.confidence >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            r.confidence >= 70 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {r.confidence}%
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.matchedStudent ? (
                          <button onClick={() => manualMatch(r.parsedIndex, null)} className="text-red-500 hover:text-red-700">
                            <Unlink className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="text-gray-400 cursor-not-allowed">
                            <Search className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button onClick={() => setShowMatchingModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">İptal</button>
              <button 
                onClick={() => { setShowMatchingModal(false); setMatchingDone(true); playSound('success'); }}
                className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-bold"
              >
                ✅ Eşleştirmeyi Onayla ({matchStats.matched}/{matchResults.length})
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CEVAP ANAHTARI MODAL */}
      {showAnswerKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAnswerKeyModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              📝 Cevap Anahtarı - {examType.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Her ders için doğru cevapları girin (örn: ABCDABCDA...)</p>
            
            <div className="space-y-4">
              {answerKeys.map((key, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">{key.subject}</span>
                    <span className="text-xs text-gray-500">{key.questionCount} soru</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={key.answers}
                      onChange={e => updateAnswerKey(idx, e.target.value)}
                      placeholder={`${key.questionCount} cevap girin (ABCDA...)`}
                      maxLength={key.questionCount}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm uppercase tracking-wider focus:border-indigo-500"
                    />
                    <div className={`px-3 py-2 rounded-lg text-sm font-bold ${key.answers.length === key.questionCount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {key.answers.length}/{key.questionCount}
                    </div>
                  </div>
                  {key.answers.length > 0 && key.answers.length !== key.questionCount && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {key.questionCount - key.answers.length} cevap eksik
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>💡 İpucu:</strong> Cevap anahtarını kopyala-yapıştır ile girebilirsiniz. Sadece A, B, C, D, E karakterleri kabul edilir.
            </div>
            
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAnswerKeyModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">İptal</button>
              <button 
                onClick={() => { setShowAnswerKeyModal(false); playSound('success'); }}
                className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold"
              >
                ✅ Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* KLAVYE YARDIMI */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Keyboard className="w-5 h-5" /> Klavye Kısayolları</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Geri Al</span><kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl + Z</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Yinele</span><kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl + Y</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Öğrenci No</span><kbd className="px-2 py-1 bg-blue-100 text-blue-700 rounded">1</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>TC Kimlik</span><kbd className="px-2 py-1 bg-purple-100 text-purple-700 rounded">2</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Ad Soyad</span><kbd className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">3</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Sınıf</span><kbd className="px-2 py-1 bg-amber-100 text-amber-700 rounded">4</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Kitapçık</span><kbd className="px-2 py-1 bg-pink-100 text-pink-700 rounded">5</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Cevaplar</span><kbd className="px-2 py-1 bg-red-100 text-red-700 rounded">6</kbd></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>İptal</span><kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd></div>
            </div>
            <button onClick={() => setShowKeyboardHelp(false)} className="w-full mt-4 px-4 py-2 bg-gray-100 rounded-lg">Kapat</button>
          </div>
        </div>
      )}
      
      {/* METRİKLER */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-blue-600">{stats.students}</div>
          <div className="text-[10px] text-blue-500">Öğrenci</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-purple-600">{stats.maxChars}</div>
          <div className="text-[10px] text-purple-500">Karakter</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-amber-600">{stats.definedFields}</div>
          <div className="text-[10px] text-amber-500">Alan</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-0.5">
            <Percent className="w-3 h-3" />{stats.coverage}
          </div>
          <div className="text-[10px] text-emerald-500">Kapsam</div>
        </div>
        <div className={`border rounded-xl p-2 text-center ${stats.duplicateCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className={`text-lg font-bold flex items-center justify-center gap-1 ${stats.duplicateCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.duplicateCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {stats.duplicateCount}
          </div>
          <div className={`text-[10px] ${stats.duplicateCount > 0 ? 'text-red-500' : 'text-green-500'}`}>Mükerrer</div>
        </div>
        <div className={`border rounded-xl p-2 text-center ${stats.qualityScore >= 80 ? 'bg-emerald-50 border-emerald-200' : stats.qualityScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-lg font-bold flex items-center justify-center gap-1 ${stats.qualityScore >= 80 ? 'text-emerald-600' : stats.qualityScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            <Award className="w-4 h-4" />{stats.qualityScore}
          </div>
          <div className={`text-[10px] ${stats.qualityScore >= 80 ? 'text-emerald-500' : stats.qualityScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>Kalite</div>
        </div>
        <div className={`border rounded-xl p-2 text-center ${stats.validationErrors > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <div className={`text-lg font-bold flex items-center justify-center gap-1 ${stats.validationErrors > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {stats.validationErrors > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {stats.validationErrors}
          </div>
          <div className={`text-[10px] ${stats.validationErrors > 0 ? 'text-orange-500' : 'text-green-500'}`}>Hatalı</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-indigo-600">{zoom}%</div>
          <div className="text-[10px] text-indigo-500">Zoom</div>
        </div>
      </div>
      
      {/* SINAV TİPİ VE CEVAP ANAHTARI */}
      <div className="flex gap-2 mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-indigo-700">Sınav Tipi:</span>
          <select 
            value={examType} 
            onChange={e => setExamType(e.target.value as 'lgs' | 'tyt' | 'custom')}
            className="px-3 py-1.5 border-2 border-indigo-300 rounded-lg text-sm font-medium bg-white focus:border-indigo-500"
          >
            <option value="lgs">LGS (90 Soru)</option>
            <option value="tyt">TYT (120 Soru)</option>
            <option value="custom">Özel</option>
          </select>
        </div>
        <button 
          onClick={() => setShowAnswerKeyModal(true)}
          className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:from-indigo-600 hover:to-purple-600 shadow"
        >
          📝 Cevap Anahtarı Gir
        </button>
        {answerKeys.some(k => k.answers.length > 0) && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            Cevap anahtarı hazır
          </div>
        )}
        <button 
          onClick={startMatching}
          disabled={parsedStudents.length === 0}
          className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:from-emerald-600 hover:to-teal-600 shadow disabled:opacity-50"
        >
          <Link2 className="w-4 h-4" /> Öğrenci Eşleştir
        </button>
        {matchingDone && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
            <UserCheck className="w-4 h-4" />
            {matchStats.matched} eşleşti
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={exportToExcel}
            disabled={parsedStudents.length === 0}
            className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:from-green-600 hover:to-emerald-600 shadow disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToCSV}
            disabled={parsedStudents.length === 0}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:from-blue-600 hover:to-indigo-600 shadow disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          {classStats && (
            <>
              <span className="text-sm text-gray-600 ml-2">Sınıf Ort:</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">{classStats.avgNet} Net</span>
            </>
          )}
        </div>
      </div>
      
      {/* HIZLI EYLEMLER */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={autoDetectFields} disabled={autoDetecting} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 shadow-lg">
          <Wand2 className={`w-4 h-4 ${autoDetecting ? 'animate-spin' : ''}`} />
          {autoDetecting ? 'Algılanıyor...' : '🪄 Otomatik Algıla'}
        </button>
        
        {PRESET_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => handleLoadTemplate(t)} className="px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium flex items-center gap-1 hover:border-blue-400 hover:bg-blue-50">
            <Layout className="w-4 h-4 text-blue-500" /> {t.name}
          </button>
        ))}
        
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30" title="Geri Al (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30" title="Yinele (Ctrl+Y)">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        
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
      
      {/* ŞABLONLAR */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4"><FolderOpen className="w-5 h-5 inline mr-2" />Kayıtlı Şablonlar</h3>
            {savedTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500"><Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Henüz kayıtlı şablon yok</p></div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div><div className="font-bold">{t.name}</div><div className="text-xs text-gray-500">{t.fields.length} alan</div></div>
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
      
      {/* KARAKTER HARİTASI */}
      <div className="bg-white border-2 border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-700">Karakter Haritası</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Tüm karakterler</span>
          </div>
          <button onClick={handleReset} className="text-xs text-red-500 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Sıfırla</button>
        </div>
        
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
                      className={`flex items-center justify-center cursor-pointer border transition-all font-bold
                        ${inSel ? 'bg-blue-500 text-white border-blue-600 scale-110 z-10' : ''}
                        ${color && !inSel ? 'text-white' : ''}
                        ${!color && !inSel ? 'hover:bg-blue-100 border-gray-200' : ''}`}
                      style={{ width: `${charWidth}px`, height: `${charWidth + 4}px`, fontSize: `${charSize}px`, backgroundColor: color && !inSel ? color : undefined, borderColor: color && !inSel ? color : undefined }}
                      title={`Pozisyon: ${i + 1}`}
                    >{char}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* SEÇİM PANELİ */}
      {selection && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-lg">
          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-blue-600">{Math.min(selection.start, selection.end) + 1} → {Math.max(selection.start, selection.end) + 1}</span>
            <span className="text-gray-500 ml-2">({Math.abs(selection.end - selection.start) + 1} karakter)</span>
          </div>
          <div className="p-3 bg-white rounded-lg font-mono text-center mb-3 text-lg border">
            "{sampleLines[0]?.substring(Math.min(selection.start, selection.end), Math.max(selection.start, selection.end) + 1) || ''}"
          </div>
          <div className="text-xs text-gray-500 text-center mb-2">Klavye: 1-6 ile hızlı seç</div>
          <div className="flex flex-wrap justify-center gap-2">
            {FIELD_TYPES.map((ft) => (
              <button key={ft.type} onClick={() => handleAssignField(ft.type)} className="px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{ backgroundColor: ft.color }}>
                {ft.icon} {ft.label} <kbd className="ml-1 text-xs opacity-70 bg-white/20 px-1 rounded">{ft.shortcut}</kbd>
              </button>
            ))}
          </div>
          <div className="text-center mt-2"><button onClick={() => setSelection(null)} className="text-sm text-gray-500">İptal (Esc)</button></div>
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
          <><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700 font-medium">Hazır! Kalite Skoru: {qualityScore}/100</span></>
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
          <button onClick={handleComplete} disabled={!isValid} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${isValid ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
            🎉 Tamamla <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PREVIEW ====================

interface PreviewScreenProps {
  students: StudentResult[];
  fields: FieldDefinition[];
  totalCount: number;
  duplicates: Set<string>;
  qualityScore: number;
  answerKeys: AnswerKey[];
  classStats: { avgNet: number; maxNet: number; minNet: number; studentCount: number; subjectAverages: Record<string, number> } | null;
  onBack: () => void;
  onConfirm: () => void;
}

function PreviewScreen({ students, fields, totalCount, duplicates, qualityScore, answerKeys, classStats, onBack, onConfirm }: PreviewScreenProps) {
  const hasResults = answerKeys.some(k => k.answers.length > 0);
  
  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5" /> Veri Önizleme</h2>
            <p className="text-purple-100 text-sm">{totalCount} öğrenci</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${qualityScore >= 80 ? 'bg-emerald-400 text-emerald-900' : qualityScore >= 50 ? 'bg-amber-400 text-amber-900' : 'bg-red-400 text-red-900'}`}>
              <Award className="w-4 h-4" /> {qualityScore}/100
            </div>
            {duplicates.size > 0 && (
              <div className="px-3 py-1 bg-red-400 text-red-900 rounded-full text-sm font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {duplicates.size} Mükerrer
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* SINIF İSTATİSTİKLERİ */}
      {hasResults && classStats && (
        <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            📊 Sınıf İstatistikleri
          </h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-2xl font-bold text-emerald-600">{classStats.avgNet}</div>
              <div className="text-xs text-gray-500">Ortalama Net</div>
            </div>
            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{classStats.maxNet}</div>
              <div className="text-xs text-gray-500">En Yüksek</div>
            </div>
            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-2xl font-bold text-amber-600">{classStats.minNet}</div>
              <div className="text-xs text-gray-500">En Düşük</div>
            </div>
            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{classStats.studentCount}</div>
              <div className="text-xs text-gray-500">Öğrenci</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(classStats.subjectAverages).map(([subject, avg]) => (
              <div key={subject} className="px-3 py-1 bg-white rounded-lg text-sm">
                <span className="text-gray-600">{subject}:</span>
                <span className="ml-1 font-bold text-emerald-600">{avg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
                <th className="px-3 py-2 text-left text-blue-600">Öğrenci No</th>
                <th className="px-3 py-2 text-left text-emerald-600">Ad Soyad</th>
                <th className="px-3 py-2 text-left text-amber-600">Sınıf</th>
                {hasResults && (
                  <>
                    <th className="px-3 py-2 text-center text-green-600">Doğru</th>
                    <th className="px-3 py-2 text-center text-red-600">Yanlış</th>
                    <th className="px-3 py-2 text-center text-gray-600">Boş</th>
                    <th className="px-3 py-2 text-center text-indigo-600 font-bold">Net</th>
                  </>
                )}
                <th className="px-3 py-2 text-center">Durum</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const id = s.ogrenciNo || s.tc || '';
                const isDupe = duplicates.has(id);
                return (
                  <tr key={idx} className={`border-b ${isDupe ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-blue-700">{s.ogrenciNo || '—'}</td>
                    <td className="px-3 py-2 font-medium">{s.adSoyad || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">{s.sinif || '—'}</span>
                    </td>
                    {hasResults && (
                      <>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">{s.totalCorrect || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">{s.totalWrong || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{s.totalEmpty || 0}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-3 py-1 rounded-lg font-bold text-white ${(s.totalNet || 0) >= (classStats?.avgNet || 0) ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                            {s.totalNet?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2 text-center">
                      {isDupe ? <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" /> : <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-500">← Düzenle</button>
        <button onClick={onConfirm} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">
          🎉 Onayla ve Bitir
        </button>
      </div>
    </div>
  );
}

export default FixedWidthMapper;
