// ============================================================================
// REPLAY ENGINE - INDEX
// ============================================================================

export { replayScore, compareResults, compareLessonBreakdowns } from './replayEngine';
export type {
  ReplayRequest,
  ReplayResult,
  ReplayStep,
  DiffResult,
  DiffField,
  ScoringSnapshot,
  ExamResultRow,
} from './replayTypes';
export {
  SnapshotMissingError,
  EngineVersionMismatchError,
  InconsistentReplayError,
  InvalidSnapshotError,
} from './replayErrors';
