/**
 * ============================================
 * AkademiHub - Student Matcher
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Multi-layer öğrenci eşleştirme
 * - Fuzzy name matching (Levenshtein)
 * - Manuel eşleştirme desteği
 * 
 * SIRALAMA:
 * 1. Öğrenci numarası (exact)
 * 2. TC Kimlik (exact)
 * 3. Fuzzy name + class
 * 4. Manuel seçim
 */

import { createClient } from '@/lib/supabase/client';
import type {
  StudentIdentifier,
  MatchResult,
  MatchedStudentInfo,
  AlternativeMatch,
  MatchStatus,
  MatchStrategy
} from '../types';

// OCR Düzeltme - Türkçe karakter desteği
import { correctOCRErrors, calculateTurkishSimilarity } from '../txt/ocrCorrection';

// ==================== CONFIG ====================

const MATCHER_CONFIG = {
  // Fuzzy eşleşme minimum skoru (0-100)
  minFuzzyScore: 70,
  
  // Likely match minimum skoru
  likelyMatchScore: 85,
  
  // Max alternatif sayısı
  maxAlternatives: 5,
  
  // Sınıf eşleşmesi bonus puanı
  classMatchBonus: 10
};

// ==================== TYPES ====================

interface StudentRecord {
  id: string;
  student_no: string;
  tc_id: string | null;
  class: string;
  section: string | null;
  user: {
    name: string;
    surname: string | null;
  } | null;
}

// ==================== ANA FONKSİYON ====================

/**
 * Öğrenciyi eşleştirir
 */
export async function matchStudent(
  identifier: StudentIdentifier,
  organizationId?: string
): Promise<MatchResult> {
  // 1. Öğrenci numarası ile dene
  if (identifier.studentNo) {
    const result = await matchByStudentNo(identifier.studentNo, organizationId);
    if (result.status === 'matched') {
      return result;
    }
  }
  
  // 2. TC Kimlik ile dene
  if (identifier.tcNo) {
    const result = await matchByTcNo(identifier.tcNo, organizationId);
    if (result.status === 'matched') {
      return result;
    }
  }
  
  // 3. Fuzzy name matching
  if (identifier.fullName || (identifier.firstName && identifier.lastName)) {
    const result = await matchByName(identifier, organizationId);
    if (result.status === 'matched' || result.status === 'likely_match') {
      return result;
    }
    
    // Alternatifler varsa ambiguous olarak döndür
    if (result.alternatives.length > 0) {
      return {
        ...result,
        status: 'ambiguous'
      };
    }
  }
  
  // 4. Bulunamadı
  return {
    studentId: null,
    matchedStudent: null,
    strategy: 'manual',
    confidence: 0,
    isExact: false,
    alternatives: [],
    status: 'not_found'
  };
}

/**
 * Birden fazla öğrenciyi batch olarak eşleştirir
 */
export async function matchStudentsBatch(
  identifiers: { rowNumber: number; identifier: StudentIdentifier }[],
  organizationId?: string
): Promise<Map<number, MatchResult>> {
  const results = new Map<number, MatchResult>();
  
  // Tüm öğrencileri bir kere çek (performans için)
  const allStudents = await fetchAllStudents(organizationId);
  
  for (const { rowNumber, identifier } of identifiers) {
    const result = matchStudentFromCache(identifier, allStudents);
    results.set(rowNumber, result);
  }
  
  return results;
}

// ==================== STUDENT NO İLE EŞLEŞME ====================

async function matchByStudentNo(
  studentNo: string,
  organizationId?: string
): Promise<MatchResult> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('students')
      .select(`
        id,
        student_no,
        tc_id,
        class,
        section,
        user:users(name, surname)
      `)
      .eq('student_no', studentNo.trim())
      .eq('status', 'active');
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return createNotFoundResult('student_no');
    }
    
    const student = data as unknown as StudentRecord;
    
    return {
      studentId: student.id,
      matchedStudent: formatStudentInfo(student),
      strategy: 'student_no',
      confidence: 100,
      isExact: true,
      alternatives: [],
      status: 'matched'
    };
  } catch {
    return createNotFoundResult('student_no');
  }
}

// ==================== TC KİMLİK İLE EŞLEŞME ====================

async function matchByTcNo(
  tcNo: string,
  organizationId?: string
): Promise<MatchResult> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('students')
      .select(`
        id,
        student_no,
        tc_id,
        class,
        section,
        user:users(name, surname)
      `)
      .eq('tc_id', tcNo.trim())
      .eq('status', 'active');
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return createNotFoundResult('tc_no');
    }
    
    const student = data as unknown as StudentRecord;
    
    return {
      studentId: student.id,
      matchedStudent: formatStudentInfo(student),
      strategy: 'tc_no',
      confidence: 100,
      isExact: true,
      alternatives: [],
      status: 'matched'
    };
  } catch {
    return createNotFoundResult('tc_no');
  }
}

// ==================== İSİM İLE EŞLEŞME (FUZZY) ====================

async function matchByName(
  identifier: StudentIdentifier,
  organizationId?: string
): Promise<MatchResult> {
  try {
    // Tüm öğrencileri al
    const allStudents = await fetchAllStudents(organizationId);
    
    return matchStudentFromCache(identifier, allStudents);
  } catch {
    return createNotFoundResult('fuzzy_name');
  }
}

function matchStudentFromCache(
  identifier: StudentIdentifier,
  students: StudentRecord[]
): MatchResult {
  // İsim oluştur
  const searchName = identifier.fullName || 
    `${identifier.firstName || ''} ${identifier.lastName || ''}`.trim();
  
  if (!searchName) {
    return createNotFoundResult('fuzzy_name');
  }
  
  const normalizedSearch = normalizeNameForMatch(searchName);
  const searchClass = identifier.className?.trim();
  
  // Tüm öğrencileri skorla
  const scored: Array<{ student: StudentRecord; score: number; matchedFields: string[] }> = [];
  
  for (const student of students) {
    const studentName = student.user 
      ? `${student.user.name || ''} ${student.user.surname || ''}`.trim()
      : '';
    
    if (!studentName) continue;
    
    const normalizedStudent = normalizeNameForMatch(studentName);
    
    // İsim benzerliği hesapla
    let score = calculateSimilarity(normalizedSearch, normalizedStudent);
    const matchedFields: string[] = [];
    
    if (score >= MATCHER_CONFIG.minFuzzyScore) {
      matchedFields.push('name');
    }
    
    // Sınıf eşleşmesi bonus
    if (searchClass && student.class) {
      const normalizedSearchClass = normalizeClass(searchClass);
      const normalizedStudentClass = normalizeClass(student.class);
      
      if (normalizedSearchClass === normalizedStudentClass) {
        score += MATCHER_CONFIG.classMatchBonus;
        matchedFields.push('class');
      }
    }
    
    if (score >= MATCHER_CONFIG.minFuzzyScore) {
      scored.push({ student, score: Math.min(score, 100), matchedFields });
    }
  }
  
  // Skorlara göre sırala
  scored.sort((a, b) => b.score - a.score);
  
  if (scored.length === 0) {
    return createNotFoundResult('fuzzy_name');
  }
  
  const best = scored[0];
  const alternatives: AlternativeMatch[] = scored.slice(1, MATCHER_CONFIG.maxAlternatives + 1).map(s => ({
    student: formatStudentInfo(s.student),
    confidence: s.score,
    matchedFields: s.matchedFields,
    reason: `%${s.score} eşleşme`
  }));
  
  // Status belirle
  let status: MatchStatus;
  
  if (best.score >= 95) {
    status = 'matched';
  } else if (best.score >= MATCHER_CONFIG.likelyMatchScore) {
    status = 'likely_match';
  } else if (alternatives.length > 0) {
    status = 'ambiguous';
  } else {
    status = 'manual_required';
  }
  
  return {
    studentId: best.student.id,
    matchedStudent: formatStudentInfo(best.student),
    strategy: 'fuzzy_name',
    confidence: best.score,
    isExact: false,
    alternatives,
    status
  };
}

// ==================== VERİTABANI FONKSİYONLARI ====================

async function fetchAllStudents(organizationId?: string): Promise<StudentRecord[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('students')
    .select(`
      id,
      student_no,
      tc_id,
      class,
      section,
      user:users(name, surname)
    `)
    .eq('status', 'active')
    .order('class', { ascending: true })
    .order('student_no', { ascending: true });
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[StudentMatcher] Fetch error:', error);
    return [];
  }
  
  return (data || []) as unknown as StudentRecord[];
}

// ==================== MANUEL EŞLEŞME ====================

/**
 * Manuel öğrenci seçimi yapar
 */
export function createManualMatch(
  studentId: string,
  student: MatchedStudentInfo
): MatchResult {
  return {
    studentId,
    matchedStudent: student,
    strategy: 'manual',
    confidence: 100,
    isExact: true,
    alternatives: [],
    status: 'matched'
  };
}

/**
 * Öğrenci listesini getirir (manuel seçim için)
 */
export async function getStudentList(
  classFilter?: string,
  searchQuery?: string,
  organizationId?: string
): Promise<MatchedStudentInfo[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('students')
    .select(`
      id,
      student_no,
      tc_id,
      class,
      section,
      user:users(name, surname)
    `)
    .eq('status', 'active')
    .order('class', { ascending: true })
    .order('student_no', { ascending: true });
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  if (classFilter) {
    query = query.eq('class', classFilter);
  }
  
  const { data, error } = await query;
  
  if (error) return [];
  
  let students = (data || []) as unknown as StudentRecord[];
  
  // Arama filtresi
  if (searchQuery) {
    const search = searchQuery.toLowerCase();
    students = students.filter(s => {
      const name = s.user ? `${s.user.name || ''} ${s.user.surname || ''}`.toLowerCase() : '';
      const no = s.student_no?.toLowerCase() || '';
      return name.includes(search) || no.includes(search);
    });
  }
  
  return students.map(formatStudentInfo);
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function formatStudentInfo(student: StudentRecord): MatchedStudentInfo {
  return {
    id: student.id,
    studentNo: student.student_no,
    fullName: student.user 
      ? `${student.user.name || ''} ${student.user.surname || ''}`.trim()
      : 'İsimsiz',
    className: student.class,
    section: student.section,
    tcNo: student.tc_id || undefined
  };
}

function createNotFoundResult(strategy: MatchStrategy): MatchResult {
  return {
    studentId: null,
    matchedStudent: null,
    strategy,
    confidence: 0,
    isExact: false,
    alternatives: [],
    status: 'not_found'
  };
}

function normalizeNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeClass(cls: string): string {
  return cls
    .toLowerCase()
    .replace(/[-\/\s]/g, '')
    .trim();
}

/**
 * Levenshtein distance benzerliks skoru (0-100)
 * OCR düzeltmeli Türkçe karakter desteği
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100;
  if (!str1 || !str2) return 0;
  
  // OCR düzeltmesi uygula (Türkçe karakter düzeltme)
  const corrected1 = correctOCRErrors(str1).toUpperCase();
  const corrected2 = correctOCRErrors(str2).toUpperCase();
  
  // Düzeltilmiş hallerle karşılaştır
  if (corrected1 === corrected2) return 100;
  
  // Türkçe benzerlik hesapla
  const turkishScore = calculateTurkishSimilarity(corrected1, corrected2);
  
  // Eğer Türkçe skor yüksekse onu kullan
  if (turkishScore >= 0.85) {
    return Math.round(turkishScore * 100);
  }
  
  // Yoksa standart Levenshtein hesapla
  const len1 = corrected1.length;
  const len2 = corrected2.length;
  
  // Levenshtein distance hesapla
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = corrected1[i - 1] === corrected2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  // Benzerlik yüzdesi
  return Math.round((1 - distance / maxLen) * 100);
}

// ==================== EXPORT ====================

export default {
  matchStudent,
  matchStudentsBatch,
  createManualMatch,
  getStudentList
};

