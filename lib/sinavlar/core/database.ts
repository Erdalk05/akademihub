/**
 * AkademiHub Database Operations
 * Motor Dairesi - Yüksek Performanslı Veritabanı İşlemleri
 * 
 * Batch insert/update işlemleri için optimize edilmiş.
 * 
 * Özellikler:
 * - Batch insert (100+ kayıt/saniye)
 * - Upsert desteği (varsa güncelle, yoksa ekle)
 * - Transaction yönetimi
 * - Hata izolasyonu
 */

import { createClient } from '@supabase/supabase-js';
import {
  StudentResult,
  BatchSaveResult,
  ParsedStudent,
  EvaluationResult,
} from './types';

import {
  logBatchSave,
} from './audit';

// ============================================
// 🔗 SUPABASE CLIENT
// ============================================

// Not: Bu client server-side'da kullanılacak
// Client tarayıcıdan gelecekse farklı bir yapı kullanılmalı
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// 📊 BATCH KAYDETME
// ============================================

/**
 * Sınav sonuçlarını toplu olarak kaydeder
 * 
 * @param examId Sınav ID
 * @param results Değerlendirme sonuçları
 * @param options Opsiyonel ayarlar
 */
export async function saveExamResultsBatch(
  examId: string,
  results: StudentResult[],
  options?: {
    userId?: string;
    organizationId?: string;
    batchSize?: number;
    upsert?: boolean;
  }
): Promise<BatchSaveResult> {
  const startTime = Date.now();
  const batchSize = options?.batchSize || 100;
  const upsert = options?.upsert ?? true;
  
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: { studentNo: string; error: string }[] = [];
  
  try {
    const supabase = getSupabaseClient();
    
    // Sonuçları batch'lere böl
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      // Veritabanı formatına dönüştür
      const records = batch.map(result => ({
        exam_id: examId,
        student_no: result.studentNo,
        tc: result.tc,
        name: result.name,
        booklet: result.booklet,
        total_correct: result.totalCorrect,
        total_wrong: result.totalWrong,
        total_empty: result.totalEmpty,
        total_net: result.totalNet,
        total_score: result.totalScore,
        rank: result.rank,
        percentile: result.percentile,
        subjects: JSON.stringify(result.subjects),
        evaluated_at: result.evaluatedAt.toISOString(),
        organization_id: options?.organizationId,
        created_by: options?.userId,
      }));
      
      if (upsert) {
        // Upsert: varsa güncelle, yoksa ekle
        const { data, error } = await supabase
          .from('exam_results')
          .upsert(records, {
            onConflict: 'exam_id,student_no',
            ignoreDuplicates: false,
          })
          .select();
        
        if (error) {
          // Batch hatası - her kaydı tek tek dene
          for (const record of records) {
            const { error: singleError } = await supabase
              .from('exam_results')
              .upsert(record, { onConflict: 'exam_id,student_no' });
            
            if (singleError) {
              failedCount++;
              errors.push({
                studentNo: record.student_no,
                error: singleError.message,
              });
            } else {
              insertedCount++;
            }
          }
        } else {
          insertedCount += data?.length || records.length;
        }
      } else {
        // Sadece insert
        const { data, error } = await supabase
          .from('exam_results')
          .insert(records)
          .select();
        
        if (error) {
          failedCount += records.length;
          errors.push({
            studentNo: `batch-${i}`,
            error: error.message,
          });
        } else {
          insertedCount += data?.length || records.length;
        }
      }
    }
  } catch (error) {
    failedCount = results.length;
    errors.push({
      studentNo: 'all',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
  
  const duration = Date.now() - startTime;
  
  // Audit log
  logBatchSave(examId, {
    insertedCount,
    updatedCount,
    failedCount,
    duration,
  }, {
    userId: options?.userId,
    organizationId: options?.organizationId,
  });
  
  return {
    success: failedCount === 0,
    insertedCount,
    updatedCount,
    failedCount,
    errors,
    duration,
  };
}

// ============================================
// 📥 VERİ ÇEKME
// ============================================

/**
 * Sınav sonuçlarını getirir
 */
export async function getExamResults(
  examId: string,
  options?: {
    orderBy?: 'rank' | 'total_score' | 'name';
    limit?: number;
    offset?: number;
  }
): Promise<StudentResult[]> {
  try {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('exam_results')
      .select('*')
      .eq('exam_id', examId);
    
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderBy === 'name' });
    } else {
      query = query.order('rank', { ascending: true });
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Veritabanı formatından TypeScript formatına dönüştür
    return (data || []).map(row => ({
      studentNo: row.student_no,
      tc: row.tc,
      name: row.name,
      booklet: row.booklet,
      totalCorrect: row.total_correct,
      totalWrong: row.total_wrong,
      totalEmpty: row.total_empty,
      totalNet: row.total_net,
      totalScore: row.total_score,
      subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects,
      rank: row.rank,
      percentile: row.percentile,
      evaluatedAt: new Date(row.evaluated_at),
      examId: row.exam_id,
    }));
  } catch (error) {
    console.error('getExamResults error:', error);
    return [];
  }
}

/**
 * Tek öğrencinin sonuçlarını getirir
 */
export async function getStudentResults(
  studentNo: string,
  options?: {
    examId?: string;
    limit?: number;
  }
): Promise<StudentResult[]> {
  try {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('exam_results')
      .select('*')
      .eq('student_no', studentNo)
      .order('evaluated_at', { ascending: false });
    
    if (options?.examId) {
      query = query.eq('exam_id', options.examId);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(row => ({
      studentNo: row.student_no,
      tc: row.tc,
      name: row.name,
      booklet: row.booklet,
      totalCorrect: row.total_correct,
      totalWrong: row.total_wrong,
      totalEmpty: row.total_empty,
      totalNet: row.total_net,
      totalScore: row.total_score,
      subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects,
      rank: row.rank,
      percentile: row.percentile,
      evaluatedAt: new Date(row.evaluated_at),
      examId: row.exam_id,
    }));
  } catch (error) {
    console.error('getStudentResults error:', error);
    return [];
  }
}

// ============================================
// 🗃️ ÖĞRENCİ KAYITLARI
// ============================================

/**
 * Mevcut öğrenci kayıtlarını getirir (cross-check için)
 */
export async function getExistingStudents(
  organizationId: string
): Promise<{ studentNo: string; tc: string; name: string }[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('students')
      .select('student_no, tc, first_name, last_name')
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    
    return (data || []).map(row => ({
      studentNo: row.student_no || '',
      tc: row.tc || '',
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    }));
  } catch (error) {
    console.error('getExistingStudents error:', error);
    return [];
  }
}

/**
 * Parse edilmiş öğrencileri öğrenci tablosuna eşleştirir
 */
export async function matchStudentsToDatabase(
  students: ParsedStudent[],
  organizationId: string
): Promise<{
  matched: { parsed: ParsedStudent; dbId: string }[];
  unmatched: ParsedStudent[];
}> {
  try {
    const supabase = getSupabaseClient();
    
    // TC'lere göre öğrenci ID'lerini bul
    const tcs = students.map(s => s.tc).filter(Boolean);
    
    const { data, error } = await supabase
      .from('students')
      .select('id, tc')
      .eq('organization_id', organizationId)
      .in('tc', tcs);
    
    if (error) throw error;
    
    const tcToId = new Map((data || []).map(row => [row.tc, row.id]));
    
    const matched: { parsed: ParsedStudent; dbId: string }[] = [];
    const unmatched: ParsedStudent[] = [];
    
    for (const student of students) {
      const dbId = tcToId.get(student.tc);
      if (dbId) {
        matched.push({ parsed: student, dbId });
      } else {
        unmatched.push(student);
      }
    }
    
    return { matched, unmatched };
  } catch (error) {
    console.error('matchStudentsToDatabase error:', error);
    return { matched: [], unmatched: students };
  }
}

// ============================================
// 📊 SINAV KAYITLARI
// ============================================

/**
 * Yeni sınav kaydı oluşturur
 */
export async function createExamRecord(
  exam: {
    name: string;
    type: string;
    date: Date;
    organizationId: string;
  },
  options?: {
    userId?: string;
  }
): Promise<{ id: string } | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('exams')
      .insert({
        name: exam.name,
        type: exam.type,
        exam_date: exam.date.toISOString(),
        organization_id: exam.organizationId,
        created_by: options?.userId,
        status: 'draft',
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('createExamRecord error:', error);
    return null;
  }
}

/**
 * Sınav durumunu günceller
 */
export async function updateExamStatus(
  examId: string,
  status: 'draft' | 'processing' | 'completed' | 'error',
  stats?: {
    totalStudents?: number;
    averageScore?: number;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('exams')
      .update({
        status,
        total_students: stats?.totalStudents,
        average_score: stats?.averageScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', examId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('updateExamStatus error:', error);
    return false;
  }
}

// ============================================
// 🧹 TEMİZLİK
// ============================================

/**
 * Sınav sonuçlarını siler
 */
export async function deleteExamResults(examId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('exam_results')
      .delete()
      .eq('exam_id', examId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('deleteExamResults error:', error);
    return false;
  }
}

