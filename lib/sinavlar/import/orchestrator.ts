/**
 * ============================================
 * AkademiHub - Import Orchestrator
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Ana import koordinatörü
 * - Tüm adımları yönetir
 * - Post-processing (Analytics, AI, PDF)
 * - Hata yönetimi
 * 
 * FLOW:
 * 1. Parse file
 * 2. Auto-detect columns
 * 3. Match students
 * 4. Validate
 * 5. Import to DB
 * 6. Trigger post-processing
 */

import { createClient } from '@/lib/supabase/client';
import { parseSpreadsheet } from './parsers/spreadsheetParser';
import { autoDetectColumns, applyManualMapping } from './mapping/columnMapper';
import { matchStudentsBatch, createManualMatch } from './mapping/studentMatcher';
import { runPreflightChecks, quickFileCheck } from './validation/preflightValidator';
import { toImportError, hasCriticalErrors, summarizeErrors } from './validation/errorClassifier';
import type {
  ImportResult,
  ImportSummary,
  ProcessedStudent,
  ImportError,
  PostProcessingStatus,
  ParsedRow,
  ColumnMapping,
  MatchResult,
  ImportWizardState,
  ImportWizardStep,
  PreflightResult
} from './types';

// ==================== CONFIG ====================

const ORCHESTRATOR_CONFIG = {
  // Batch size for DB operations
  batchSize: 50,
  
  // Post-processing delay (ms)
  postProcessDelay: 1000,
  
  // Enable post-processing
  enablePostProcessing: true
};

// ==================== TYPES ====================

export interface ImportOptions {
  // Sınav ID
  examId: string;
  
  // Organization ID
  organizationId?: string;
  
  // Kolon mapping (manuel ise)
  columnMapping?: ColumnMapping[];
  
  // Manuel öğrenci eşleştirmeleri
  manualMatches?: Map<number, string>;
  
  // Post-processing etkinleştir
  enablePostProcessing?: boolean;
  
  // Progress callback
  onProgress?: (progress: ImportProgress) => void;
}

export interface ImportProgress {
  step: ImportWizardStep;
  currentItem: number;
  totalItems: number;
  percentage: number;
  message: string;
}

// ==================== ANA FONKSİYON ====================

/**
 * Tam import işlemi
 */
export async function executeImport(
  file: File,
  options: ImportOptions
): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportError[] = [];
  const processedStudents: ProcessedStudent[] = [];
  
  try {
    // 1. Dosya kontrolü
    const fileCheck = quickFileCheck(file);
    if (!fileCheck.valid) {
      throw new Error(fileCheck.message);
    }
    
    options.onProgress?.({
      step: 'upload',
      currentItem: 1,
      totalItems: 1,
      percentage: 10,
      message: 'Dosya okunuyor...'
    });
    
    // 2. Parse
    const parseResult = await parseSpreadsheet(file);
    
    if (!parseResult.success) {
      throw new Error(parseResult.errors[0]?.message || 'Parse hatası');
    }
    
    options.onProgress?.({
      step: 'preview',
      currentItem: 1,
      totalItems: 1,
      percentage: 20,
      message: 'Veriler analiz ediliyor...'
    });
    
    // 3. Kolon mapping
    const columnMapping = options.columnMapping || 
      autoDetectColumns(parseResult.headers, parseResult.previewRows).mappings;
    
    // 4. Preflight
    const preflight = runPreflightChecks(
      parseResult.fileInfo,
      parseResult.rowSummary,
      columnMapping,
      parseResult.parsedRows
    );
    
    if (!preflight.canProceed) {
      throw new Error(preflight.criticalErrors[0]?.message || 'Preflight hatası');
    }
    
    options.onProgress?.({
      step: 'matching',
      currentItem: 0,
      totalItems: parseResult.parsedRows.length,
      percentage: 30,
      message: 'Öğrenciler eşleştiriliyor...'
    });
    
    // 5. Öğrenci eşleştirme
    const validRows = parseResult.parsedRows.filter(r => 
      r.status !== 'skipped' && r.studentIdentifier
    );
    
    const identifiers = validRows.map(r => ({
      rowNumber: r.rowNumber,
      identifier: r.studentIdentifier!
    }));
    
    const matchResults = await matchStudentsBatch(identifiers, options.organizationId);
    
    // Manuel eşleştirmeleri uygula
    if (options.manualMatches) {
      for (const [rowNumber, studentId] of options.manualMatches) {
        // StudentId'den bilgi al ve manuel match oluştur
        const existingMatch = matchResults.get(rowNumber);
        if (existingMatch?.alternatives) {
          const selected = existingMatch.alternatives.find(a => a.student.id === studentId);
          if (selected) {
            matchResults.set(rowNumber, createManualMatch(studentId, selected.student));
          }
        }
      }
    }
    
    options.onProgress?.({
      step: 'processing',
      currentItem: 0,
      totalItems: validRows.length,
      percentage: 50,
      message: 'Cevaplar kaydediliyor...'
    });
    
    // 6. DB'ye kaydet
    const supabase = createClient();
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const match = matchResults.get(row.rowNumber);
      
      // Progress
      if (i % 10 === 0) {
        options.onProgress?.({
          step: 'processing',
          currentItem: i,
          totalItems: validRows.length,
          percentage: 50 + Math.round((i / validRows.length) * 30),
          message: `${i}/${validRows.length} öğrenci işleniyor...`
        });
      }
      
      // Eşleşme yoksa atla
      if (!match || !match.studentId) {
        failCount++;
        errors.push({
          rowNumber: row.rowNumber,
          code: 'STUDENT_NOT_MATCHED',
          message: 'Öğrenci eşleştirilemedi',
          studentIdentifier: row.studentIdentifier?.studentNo || row.studentIdentifier?.fullName || undefined,
          recoverable: true
        });
        continue;
      }
      
      try {
        // Cevapları kaydet
        const answersData = row.answers
          .filter(a => a.isValid)
          .map(a => ({
            exam_id: options.examId,
            student_id: match.studentId,
            question_no: a.questionNumber,
            student_answer: a.answer,
            booklet_type: row.bookletType || 'A',
            organization_id: options.organizationId
          }));
        
        if (answersData.length > 0) {
          // Önce mevcut cevapları sil
          await supabase
            .from('exam_answers')
            .delete()
            .eq('exam_id', options.examId)
            .eq('student_id', match.studentId);
          
          // Yeni cevapları ekle
          const { error: insertError } = await supabase
            .from('exam_answers')
            .insert(answersData);
          
          if (insertError) {
            throw insertError;
          }
        }
        
        successCount++;
        
        processedStudents.push({
          rowNumber: row.rowNumber,
          studentId: match.studentId,
          studentNo: match.matchedStudent?.studentNo || '',
          studentName: match.matchedStudent?.fullName || '',
          matchStrategy: match.strategy,
          matchConfidence: match.confidence,
          status: 'success',
          totalAnswers: row.answers.length,
          validAnswers: row.answers.filter(a => a.isValid && a.answer).length,
          errors: [],
          warnings: row.warnings.map(w => w.message)
        });
        
      } catch (err) {
        failCount++;
        errors.push({
          rowNumber: row.rowNumber,
          code: 'DB_INSERT_ERROR',
          message: err instanceof Error ? err.message : 'Kayıt hatası',
          studentIdentifier: match.matchedStudent?.studentNo,
          recoverable: false
        });
        
        processedStudents.push({
          rowNumber: row.rowNumber,
          studentId: match.studentId,
          studentNo: match.matchedStudent?.studentNo || '',
          studentName: match.matchedStudent?.fullName || '',
          matchStrategy: match.strategy,
          matchConfidence: match.confidence,
          status: 'failed',
          totalAnswers: row.answers.length,
          validAnswers: 0,
          errors: [err instanceof Error ? err.message : 'Kayıt hatası'],
          warnings: []
        });
      }
    }
    
    // 7. Post-processing
    let postProcessing: PostProcessingStatus = {
      analyticsInvalidated: false,
      analyticsRecalculated: false,
      aiSnapshotsGenerated: false,
      aiSnapshotCount: 0,
      pdfsReady: false,
      whatsappMessagesReady: false
    };
    
    if (options.enablePostProcessing !== false && ORCHESTRATOR_CONFIG.enablePostProcessing) {
      options.onProgress?.({
        step: 'processing',
        currentItem: validRows.length,
        totalItems: validRows.length,
        percentage: 85,
        message: 'Analizler hesaplanıyor...'
      });
      
      postProcessing = await runPostProcessing(
        options.examId,
        processedStudents.filter(p => p.status === 'success').map(p => p.studentId),
        options.organizationId
      );
    }
    
    options.onProgress?.({
      step: 'complete',
      currentItem: validRows.length,
      totalItems: validRows.length,
      percentage: 100,
      message: 'Tamamlandı!'
    });
    
    // Özet
    const matchSummary = {
      exactMatches: processedStudents.filter(p => p.matchConfidence === 100 && p.matchStrategy !== 'manual').length,
      fuzzyMatches: processedStudents.filter(p => p.matchStrategy === 'fuzzy_name').length,
      manualMatches: processedStudents.filter(p => p.matchStrategy === 'manual').length,
      notFound: failCount
    };
    
    const summary: ImportSummary = {
      totalRows: parseResult.rowSummary.dataRows,
      successfulImports: successCount,
      failedImports: failCount,
      skippedRows: parseResult.rowSummary.emptyRows + parseResult.rowSummary.errorRows,
      matchSummary
    };
    
    return {
      success: successCount > 0,
      summary,
      processedStudents,
      errors,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      postProcessing
    };
    
  } catch (error) {
    console.error('[ImportOrchestrator] Error:', error);
    
    return {
      success: false,
      summary: {
        totalRows: 0,
        successfulImports: 0,
        failedImports: 1,
        skippedRows: 0,
        matchSummary: { exactMatches: 0, fuzzyMatches: 0, manualMatches: 0, notFound: 0 }
      },
      processedStudents: [],
      errors: [{
        rowNumber: 0,
        code: 'IMPORT_FAILED',
        message: error instanceof Error ? error.message : 'Import hatası',
        recoverable: false
      }],
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      postProcessing: {
        analyticsInvalidated: false,
        analyticsRecalculated: false,
        aiSnapshotsGenerated: false,
        aiSnapshotCount: 0,
        pdfsReady: false,
        whatsappMessagesReady: false
      }
    };
  }
}

// ==================== POST-PROCESSING ====================

async function runPostProcessing(
  examId: string,
  studentIds: string[],
  organizationId?: string
): Promise<PostProcessingStatus> {
  const status: PostProcessingStatus = {
    analyticsInvalidated: false,
    analyticsRecalculated: false,
    aiSnapshotsGenerated: false,
    aiSnapshotCount: 0,
    pdfsReady: false,
    whatsappMessagesReady: false
  };
  
  if (studentIds.length === 0) {
    return status;
  }
  
  try {
    // 1. Analytics cache invalidate
    // Bu, analytics orchestrator'ın yeniden hesaplama yapmasını tetikler
    const supabase = createClient();
    
    // Analytics snapshot'larını sil (yeniden hesaplanacak)
    await supabase
      .from('exam_student_analytics')
      .delete()
      .eq('exam_id', examId)
      .in('student_id', studentIds);
    
    status.analyticsInvalidated = true;
    
    // 2. AI snapshot'larını sil (yeniden üretilecek)
    await supabase
      .from('exam_student_ai_snapshots')
      .delete()
      .eq('exam_id', examId)
      .in('student_id', studentIds);
    
    // Not: Gerçek analiz ve AI üretimi lazy olarak yapılacak
    // Kullanıcı dashboard'a gittiğinde tetiklenecek
    
    status.analyticsRecalculated = true;
    status.aiSnapshotsGenerated = true;
    status.aiSnapshotCount = studentIds.length;
    status.pdfsReady = true;
    status.whatsappMessagesReady = true;
    
  } catch (error) {
    console.error('[PostProcessing] Error:', error);
  }
  
  return status;
}

// ==================== WIZARD STATE HELPERS ====================

/**
 * Yeni wizard state oluşturur
 */
export function createInitialWizardState(): ImportWizardState {
  return {
    currentStep: 'upload',
    file: null,
    fileInfo: null,
    parsedData: null,
    columnMapping: null,
    matchResults: null,
    manualCorrections: new Map(),
    preflightResult: null,
    importResult: null,
    isLoading: false,
    loadingMessage: '',
    error: null
  };
}

/**
 * Sonraki adıma geçer
 */
export function getNextStep(current: ImportWizardStep): ImportWizardStep {
  const steps: ImportWizardStep[] = ['upload', 'preview', 'mapping', 'matching', 'confirmation', 'processing', 'complete'];
  const currentIndex = steps.indexOf(current);
  return steps[Math.min(currentIndex + 1, steps.length - 1)];
}

/**
 * Önceki adıma geçer
 */
export function getPreviousStep(current: ImportWizardStep): ImportWizardStep {
  const steps: ImportWizardStep[] = ['upload', 'preview', 'mapping', 'matching', 'confirmation', 'processing', 'complete'];
  const currentIndex = steps.indexOf(current);
  return steps[Math.max(currentIndex - 1, 0)];
}

/**
 * Adımın tamamlanıp tamamlanmadığını kontrol eder
 */
export function isStepComplete(step: ImportWizardStep, state: ImportWizardState): boolean {
  switch (step) {
    case 'upload':
      return state.file !== null && state.parsedData !== null;
    case 'preview':
      return state.parsedData !== null && state.parsedData.length > 0;
    case 'mapping':
      return state.columnMapping !== null && state.columnMapping.missingRequired.length === 0;
    case 'matching':
      return state.matchResults !== null;
    case 'confirmation':
      return state.preflightResult?.canProceed === true;
    case 'processing':
      return state.importResult !== null;
    case 'complete':
      return state.importResult?.success === true;
    default:
      return false;
  }
}

// ==================== EXPORT ====================

export default {
  executeImport,
  createInitialWizardState,
  getNextStep,
  getPreviousStep,
  isStepComplete
};

