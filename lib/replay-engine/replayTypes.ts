// ============================================================================
// REPLAY ENGINE - TYPE DEFINITIONS
// ============================================================================

import type { ScoringResult } from '@/types/scoring-engine.types';

/**
 * Replay isteği
 */
export interface ReplayRequest {
  resultId: string;
  examId: string;
  includeSteps?: boolean;
  includeSnapshot?: boolean;
}

/**
 * Replay adımı (debugging/audit için)
 */
export interface ReplayStep {
  step: number;
  name: string;
  description: string;
  timestamp: string;
  duration_ms?: number;
  data?: any;
}

/**
 * Replay sonucu
 */
export interface ReplayResult {
  status: 'OK' | 'INCONSISTENT' | 'ERROR';
  message: string;
  
  // Original (DB'deki)
  original: {
    total_correct: number;
    total_wrong: number;
    total_empty: number;
    total_net: number;
    total_score: number;
    lesson_breakdown?: any[];
  };
  
  // Replayed (yeniden hesaplanan)
  replayed: {
    total_correct: number;
    total_wrong: number;
    total_empty: number;
    total_net: number;
    total_score: number;
    lesson_breakdown?: any[];
  };
  
  // Fark varsa
  diff?: DiffResult;
  
  // Replay adımları
  steps: ReplayStep[];
  
  // Metadata
  metadata: {
    engine_version: string;
    preset: string;
    booklet?: string | null;
    calculated_at: string;
    replayed_at: string;
  };
}

/**
 * Fark raporu
 */
export interface DiffResult {
  hasDifference: boolean;
  fields: DiffField[];
  summary: string;
}

export interface DiffField {
  field: string;
  original: any;
  replayed: any;
  difference?: number | string;
  percentDiff?: number;
}

/**
 * Snapshot veri yapısı (exam_results.scoring_snapshot)
 */
export interface ScoringSnapshot {
  engine_version: string;
  preset: string;
  booklet?: string | null;
  input_payload: any; // WizardPayload
  output_result: ScoringResult;
  calculated_at: string;
}

/**
 * exam_results row (replay için)
 */
export interface ExamResultRow {
  id: string;
  exam_participant_id: string;
  exam_id?: string;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_cancelled?: number;
  total_net: number;
  total_score: number;
  lesson_breakdown?: any[];
  scoring_snapshot?: ScoringSnapshot | null;
  calculated_at: string;
}
