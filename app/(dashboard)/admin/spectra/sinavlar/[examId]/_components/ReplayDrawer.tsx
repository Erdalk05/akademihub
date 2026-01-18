'use client';

// ============================================================================
// REPLAY DRAWER - Hesaplama Detayı
// Read-only, adım adım puan açıklayıcı drawer
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReplayResult } from '@/lib/replay-engine/replayTypes';

interface ReplayDrawerProps {
  examId: string;
  resultId: string;
  isOpen: boolean;
  onClose: () => void;
  participantName?: string;
}

export function ReplayDrawer({
  examId,
  resultId,
  isOpen,
  onClose,
  participantName,
}: ReplayDrawerProps) {
  const [replayData, setReplayData] = useState<ReplayResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState(true);

  // Fetch replay data
  useEffect(() => {
    if (!isOpen || !examId || !resultId) {
      return;
    }

    const fetchReplay = async () => {
      setIsLoading(true);
      setError(null);
      setReplayData(null);

      try {
        const response = await fetch(
          `/api/spectra/exams/${examId}/results/${resultId}/replay?include_steps=true`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.message || 'Replay başarısız oldu');
          return;
        }

        setReplayData(data.replay);
      } catch (err: any) {
        setError(err.message || 'Beklenmeyen hata');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplay();
  }, [isOpen, examId, resultId]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setReplayData(null);
      setError(null);
      setStepsExpanded(true);
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-[560px] bg-white shadow-2xl z-50',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Replay – Hesaplama Detayı
              </h2>
              {participantName && (
                <p className="text-sm text-gray-500">{participantName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-500">Replay çalıştırılıyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">Replay Başarısız</p>
              <p className="text-sm text-gray-600 text-center max-w-md">{error}</p>
            </div>
          )}

          {/* Replay Data */}
          {replayData && !isLoading && (
            <>
              {/* Status Badge */}
              <StatusBadge status={replayData.status} message={replayData.message} />

              {/* Metadata */}
              <MetadataSection metadata={replayData.metadata} />

              {/* Results Comparison */}
              <ComparisonSection
                original={replayData.original}
                replayed={replayData.replayed}
                status={replayData.status}
              />

              {/* Diff (if inconsistent) */}
              {replayData.diff && replayData.diff.hasDifference && (
                <DiffSection diff={replayData.diff} />
              )}

              {/* Steps */}
              {replayData.steps && replayData.steps.length > 0 && (
                <StepsSection
                  steps={replayData.steps}
                  isExpanded={stepsExpanded}
                  onToggle={() => setStepsExpanded(!stepsExpanded)}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-4 h-4" />
            <span>Bu ekran sadece bilgilendirme amaçlıdır</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status, message }: { status: string; message: string }) {
  const config = {
    OK: {
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-900',
    },
    INCONSISTENT: {
      icon: AlertTriangle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
    ERROR: {
      icon: XCircle,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900',
    },
  };

  const style = config[status as keyof typeof config] || config.ERROR;
  const Icon = style.icon;

  return (
    <div className={cn('p-4 rounded-lg border', style.bg, style.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-6 h-6 flex-shrink-0', style.iconColor)} />
        <div>
          <p className={cn('font-semibold', style.textColor)}>{status}</p>
          <p className={cn('text-sm mt-1', style.textColor)}>{message}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Section
// ─────────────────────────────────────────────────────────────────────────────

function MetadataSection({ metadata }: { metadata: any }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Metadata
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Engine Version</p>
          <p className="font-medium text-gray-900">{metadata.engine_version}</p>
        </div>
        <div>
          <p className="text-gray-500">Preset</p>
          <p className="font-medium text-gray-900">{metadata.preset}</p>
        </div>
        {metadata.booklet && (
          <div>
            <p className="text-gray-500">Kitapçık</p>
            <p className="font-medium text-gray-900">{metadata.booklet}</p>
          </div>
        )}
        <div>
          <p className="text-gray-500">Hesaplama Tarihi</p>
          <p className="font-medium text-gray-900 text-xs">
            {new Date(metadata.calculated_at).toLocaleString('tr-TR')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Section
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonSection({
  original,
  replayed,
  status,
}: {
  original: any;
  replayed: any;
  status: string;
}) {
  const isMatch = status === 'OK';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Sonuç Karşılaştırması
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Original */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-2 uppercase">
            Orijinal (DB)
          </p>
          <div className="space-y-1">
            <ResultItem label="Doğru" value={original.total_correct} />
            <ResultItem label="Yanlış" value={original.total_wrong} />
            <ResultItem label="Boş" value={original.total_empty} />
            <ResultItem
              label="Net"
              value={original.total_net.toFixed(2)}
              highlight
            />
            <ResultItem
              label="Puan"
              value={original.total_score.toFixed(1)}
              highlight
            />
          </div>
        </div>

        {/* Replayed */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium mb-2 uppercase">
            Replay Sonucu
          </p>
          <div className="space-y-1">
            <ResultItem label="Doğru" value={replayed.total_correct} />
            <ResultItem label="Yanlış" value={replayed.total_wrong} />
            <ResultItem label="Boş" value={replayed.total_empty} />
            <ResultItem
              label="Net"
              value={replayed.total_net.toFixed(2)}
              highlight
            />
            <ResultItem
              label="Puan"
              value={replayed.total_score.toFixed(1)}
              highlight
            />
          </div>
        </div>
      </div>

      {/* Match Indicator */}
      {isMatch && (
        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            Sonuçlar %100 eşleşiyor
          </span>
        </div>
      )}
    </div>
  );
}

function ResultItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}:</span>
      <span
        className={cn(
          'text-sm font-semibold',
          highlight ? 'text-gray-900' : 'text-gray-700'
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff Section
// ─────────────────────────────────────────────────────────────────────────────

function DiffSection({ diff }: { diff: any }) {
  return (
    <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wide">
            Tutarsızlık Tespit Edildi
          </h3>
          <p className="text-sm text-red-700 mt-1">{diff.summary}</p>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {diff.fields.map((field: any, index: number) => (
          <div
            key={index}
            className="bg-white rounded p-3 border border-red-200"
          >
            <p className="text-xs font-medium text-red-900 uppercase">
              {field.field}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Orijinal</p>
                <p className="font-semibold text-gray-900">{field.original}</p>
              </div>
              <div>
                <p className="text-gray-500">Replay</p>
                <p className="font-semibold text-gray-900">{field.replayed}</p>
              </div>
              <div>
                <p className="text-gray-500">Fark</p>
                <p className="font-semibold text-red-600">
                  {field.difference > 0 ? '+' : ''}
                  {typeof field.difference === 'number'
                    ? field.difference.toFixed(2)
                    : field.difference}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps Section
// ─────────────────────────────────────────────────────────────────────────────

function StepsSection({
  steps,
  isExpanded,
  onToggle,
}: {
  steps: any[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Adım Adım Hesaplama ({steps.length} adım)
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Steps List */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                {step.step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                  {step.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                {step.duration_ms && (
                  <p className="text-xs text-gray-400 mt-1">
                    {step.duration_ms}ms
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
