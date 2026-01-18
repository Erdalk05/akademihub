// ============================================================================
// REPLAY ENGINE - ERROR DEFINITIONS
// ============================================================================

/**
 * Snapshot eksik hatası
 */
export class SnapshotMissingError extends Error {
  constructor(resultId: string) {
    super(`Scoring snapshot bulunamadı: ${resultId}`);
    this.name = 'SnapshotMissingError';
  }
}

/**
 * Engine version uyumsuzluğu
 */
export class EngineVersionMismatchError extends Error {
  constructor(expected: string, found: string) {
    super(`Engine version uyuşmazlığı: beklenen=${expected}, bulunan=${found}`);
    this.name = 'EngineVersionMismatchError';
  }
}

/**
 * Tutarsız replay sonucu
 */
export class InconsistentReplayError extends Error {
  constructor(message: string, public diff: any) {
    super(`Replay tutarsızlığı: ${message}`);
    this.name = 'InconsistentReplayError';
  }
}

/**
 * Geçersiz snapshot formatı
 */
export class InvalidSnapshotError extends Error {
  constructor(reason: string) {
    super(`Geçersiz snapshot formatı: ${reason}`);
    this.name = 'InvalidSnapshotError';
  }
}
