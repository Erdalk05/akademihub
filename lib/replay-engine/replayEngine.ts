// ============================================================================
// REPLAY ENGINE - CORE
// Puanın nasıl hesaplandığını yeniden oynatır (deterministic)
// ============================================================================

import { adaptWizardPayloadToScoringInput } from '@/lib/scoring-engine/adapters/wizard-adapter';
import { scoreExam } from '@/lib/scoring-engine/core';
import type { ScoringResult } from '@/types/scoring-engine.types';
import type {
  ExamResultRow,
  ReplayResult,
  ReplayStep,
  DiffResult,
  DiffField,
  ScoringSnapshot,
} from './replayTypes';
import {
  SnapshotMissingError,
  EngineVersionMismatchError,
  InvalidSnapshotError,
} from './replayErrors';

/**
 * Scoring snapshot'ından puanı yeniden hesaplar
 * 
 * KRİTİK: Bu fonksiyon YENİ HESAPLAMA YAPMAZ.
 * Sadece kayıtlı snapshot'ı kullanarak sonucu YENİDEN ÜRETİR.
 * 
 * @param snapshot - scoring_snapshot (JSONB)
 * @returns ReplayResult
 */
export function replayScore(
  originalResult: ExamResultRow,
  options: {
    includeSteps?: boolean;
    validateVersion?: boolean;
  } = {}
): ReplayResult {
  const steps: ReplayStep[] = [];
  const startTime = Date.now();

  // Step 1: Snapshot kontrolü
  const step1Start = Date.now();
  const snapshot = originalResult.scoring_snapshot;
  
  if (!snapshot) {
    throw new SnapshotMissingError(originalResult.id);
  }

  steps.push({
    step: 1,
    name: 'SNAPSHOT_LOAD',
    description: 'Scoring snapshot yüklendi',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - step1Start,
    data: {
      engine_version: snapshot.engine_version,
      preset: snapshot.preset,
      booklet: snapshot.booklet,
    },
  });

  // Step 2: Snapshot validasyonu
  const step2Start = Date.now();
  validateSnapshot(snapshot);

  steps.push({
    step: 2,
    name: 'SNAPSHOT_VALIDATE',
    description: 'Snapshot yapısı doğrulandı',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - step2Start,
  });

  // Step 3: Engine version kontrolü
  const step3Start = Date.now();
  const currentVersion = '1.0';
  
  if (options.validateVersion && snapshot.engine_version !== currentVersion) {
    // Uyarı ver ama devam et (farklı versiyonlar olabilir)
    steps.push({
      step: 3,
      name: 'VERSION_WARNING',
      description: `Engine version farklı: snapshot=${snapshot.engine_version}, current=${currentVersion}`,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - step3Start,
    });
  } else {
    steps.push({
      step: 3,
      name: 'VERSION_CHECK',
      description: `Engine version: ${snapshot.engine_version}`,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - step3Start,
    });
  }

  // Step 4: Input payload → Scoring input dönüşümü
  const step4Start = Date.now();
  const scoringInput = adaptWizardPayloadToScoringInput(snapshot.input_payload);

  steps.push({
    step: 4,
    name: 'ADAPT_INPUT',
    description: 'WizardPayload → ScoringInput dönüştürüldü',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - step4Start,
    data: {
      preset: scoringInput.preset.id,
      answerKeyLength: scoringInput.answerKey.length,
      studentAnswersLength: scoringInput.studentAnswers.length,
    },
  });

  // Step 5: Scoring Engine çalıştır (REPLAY)
  const step5Start = Date.now();
  const replayedResult: ScoringResult = scoreExam(scoringInput);

  steps.push({
    step: 5,
    name: 'SCORE_EXAM',
    description: 'scoreExam() yeniden çalıştırıldı',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - step5Start,
    data: {
      totalNet: replayedResult.totalNet,
      totalScore: replayedResult.totalScore,
    },
  });

  // Step 6: Sonuçları karşılaştır
  const step6Start = Date.now();
  const diff = compareResults(originalResult, replayedResult);

  steps.push({
    step: 6,
    name: 'COMPARE_RESULTS',
    description: diff.hasDifference 
      ? `TUTARSIZLIK TESPİT EDİLDİ: ${diff.fields.length} alan farklı`
      : 'Sonuçlar %100 eşleşiyor',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - step6Start,
    data: {
      hasDifference: diff.hasDifference,
      diffFields: diff.fields.map(f => f.field),
    },
  });

  // Final: ReplayResult oluştur
  const status = diff.hasDifference ? 'INCONSISTENT' : 'OK';
  const message = diff.hasDifference
    ? `Replay sonucu DB ile uyuşmuyor (${diff.fields.length} fark)`
    : 'Replay başarılı, sonuçlar %100 eşleşiyor';

  const result: ReplayResult = {
    status,
    message,
    original: {
      total_correct: originalResult.total_correct,
      total_wrong: originalResult.total_wrong,
      total_empty: originalResult.total_empty,
      total_net: originalResult.total_net,
      total_score: originalResult.total_score,
      lesson_breakdown: originalResult.lesson_breakdown,
    },
    replayed: {
      total_correct: replayedResult.totalCorrect,
      total_wrong: replayedResult.totalWrong,
      total_empty: replayedResult.totalEmpty,
      total_net: replayedResult.totalNet,
      total_score: replayedResult.totalScore,
      lesson_breakdown: replayedResult.lessonBreakdowns,
    },
    diff: diff.hasDifference ? diff : undefined,
    steps: options.includeSteps ? steps : [],
    metadata: {
      engine_version: snapshot.engine_version,
      preset: snapshot.preset,
      booklet: snapshot.booklet || null,
      calculated_at: snapshot.calculated_at,
      replayed_at: new Date().toISOString(),
    },
  };

  return result;
}

/**
 * Snapshot yapısını doğrular
 */
function validateSnapshot(snapshot: ScoringSnapshot): void {
  if (!snapshot.engine_version) {
    throw new InvalidSnapshotError('engine_version eksik');
  }
  if (!snapshot.preset) {
    throw new InvalidSnapshotError('preset eksik');
  }
  if (!snapshot.input_payload) {
    throw new InvalidSnapshotError('input_payload eksik');
  }
  if (!snapshot.calculated_at) {
    throw new InvalidSnapshotError('calculated_at eksik');
  }
}

/**
 * Original ile replayed sonucu karşılaştırır
 */
export function compareResults(
  original: ExamResultRow,
  replayed: ScoringResult
): DiffResult {
  const fields: DiffField[] = [];

  // total_correct
  if (original.total_correct !== replayed.totalCorrect) {
    fields.push({
      field: 'total_correct',
      original: original.total_correct,
      replayed: replayed.totalCorrect,
      difference: replayed.totalCorrect - original.total_correct,
    });
  }

  // total_wrong
  if (original.total_wrong !== replayed.totalWrong) {
    fields.push({
      field: 'total_wrong',
      original: original.total_wrong,
      replayed: replayed.totalWrong,
      difference: replayed.totalWrong - original.total_wrong,
    });
  }

  // total_empty
  if (original.total_empty !== replayed.totalEmpty) {
    fields.push({
      field: 'total_empty',
      original: original.total_empty,
      replayed: replayed.totalEmpty,
      difference: replayed.totalEmpty - original.total_empty,
    });
  }

  // total_net (hassas karşılaştırma: 0.01 tolerans)
  const netDiff = Math.abs(original.total_net - replayed.totalNet);
  if (netDiff > 0.01) {
    fields.push({
      field: 'total_net',
      original: original.total_net,
      replayed: replayed.totalNet,
      difference: replayed.totalNet - original.total_net,
      percentDiff: ((netDiff / original.total_net) * 100),
    });
  }

  // total_score (hassas karşılaştırma: 0.01 tolerans)
  const scoreDiff = Math.abs(original.total_score - replayed.totalScore);
  if (scoreDiff > 0.01) {
    fields.push({
      field: 'total_score',
      original: original.total_score,
      replayed: replayed.totalScore,
      difference: replayed.totalScore - original.total_score,
      percentDiff: ((scoreDiff / original.total_score) * 100),
    });
  }

  const hasDifference = fields.length > 0;
  const summary = hasDifference
    ? `${fields.length} alanda tutarsızlık tespit edildi`
    : 'Tüm alanlar %100 eşleşiyor';

  return {
    hasDifference,
    fields,
    summary,
  };
}

/**
 * Lesson breakdown karşılaştırması (opsiyonel, detaylı analiz için)
 */
export function compareLessonBreakdowns(
  original: any[] | undefined,
  replayed: any[]
): DiffField[] {
  if (!original || original.length === 0) {
    return [];
  }

  const fields: DiffField[] = [];
  
  // Her ders için karşılaştır
  original.forEach((origLesson, index) => {
    const replayedLesson = replayed[index];
    
    if (!replayedLesson) {
      fields.push({
        field: `lesson[${index}]`,
        original: origLesson,
        replayed: null,
        difference: 'Replayed lesson eksik',
      });
      return;
    }

    // Net karşılaştır
    const netDiff = Math.abs(origLesson.net - replayedLesson.net);
    if (netDiff > 0.01) {
      fields.push({
        field: `lesson[${index}].net`,
        original: origLesson.net,
        replayed: replayedLesson.net,
        difference: replayedLesson.net - origLesson.net,
      });
    }
  });

  return fields;
}
