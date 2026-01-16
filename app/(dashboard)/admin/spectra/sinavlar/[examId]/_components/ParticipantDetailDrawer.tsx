'use client';

// ============================================================================
// PARTICIPANT DETAIL DRAWER
// Öğrenci detay bilgilerini gösteren yan panel
// ============================================================================

import React from 'react';
import { X, User, Users, Award, TrendingUp, BookOpen, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResultsRow, LessonBreakdown } from '@/lib/spectra/types';

interface ParticipantDetailDrawerProps {
  participant: ResultsRow | null;
  isOpen: boolean;
  onClose: () => void;
  lessons?: { code: string; name: string }[];
}

export function ParticipantDetailDrawer({
  participant,
  isOpen,
  onClose,
  lessons = [],
}: ParticipantDetailDrawerProps) {
  if (!isOpen || !participant) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                {participant.participantType === 'institution' ? (
                  <User className="w-7 h-7" />
                ) : (
                  <Users className="w-7 h-7" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{participant.participantName}</h2>
                <div className="flex items-center gap-2 mt-1 text-white/80 text-sm">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    participant.participantType === 'institution'
                      ? 'bg-white/20'
                      : 'bg-gray-500/30'
                  )}>
                    {participant.participantType === 'institution' ? 'Asil Öğrenci' : 'Misafir'}
                  </span>
                  {participant.className && (
                    <span>{participant.className}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rank Badge */}
          <div className="mt-4 flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-xl font-black',
              participant.rank === 1
                ? 'bg-yellow-400 text-yellow-900'
                : participant.rank === 2
                  ? 'bg-gray-300 text-gray-700'
                  : participant.rank === 3
                    ? 'bg-orange-400 text-orange-900'
                    : 'bg-white/20'
            )}>
              {participant.rank}
            </div>
            <div>
              <p className="text-sm text-white/70">Sıralama</p>
              <p className="text-lg font-bold">{participant.rank}. sırada</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-200px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              label="Doğru"
              value={participant.totalCorrect}
              color="emerald"
            />
            <StatCard
              icon={<XCircle className="w-5 h-5 text-red-500" />}
              label="Yanlış"
              value={participant.totalWrong}
              color="red"
            />
            <StatCard
              icon={<Circle className="w-5 h-5 text-gray-400" />}
              label="Boş"
              value={participant.totalEmpty}
              color="gray"
            />
          </div>

          {/* Net & Score */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">Toplam Net</p>
              <p className="text-3xl font-black text-emerald-700 mt-1">
                {participant.totalNet.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">Toplam Puan</p>
              <p className="text-3xl font-black text-blue-700 mt-1">
                {participant.totalScore.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Lesson Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              Ders Bazlı Sonuçlar
            </h3>

            {participant.lessonBreakdown && participant.lessonBreakdown.length > 0 ? (
              participant.lessonBreakdown.map((lesson) => {
                const lessonInfo = lessons.find((l) => l.code === lesson.lesson_code);
                return (
                  <LessonCard
                    key={lesson.lesson_code}
                    lesson={lesson}
                    lessonName={lessonInfo?.name || lesson.lesson_code}
                  />
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">Ders bazlı veri bulunamadı</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'emerald' | 'red' | 'gray';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200',
  };

  return (
    <div className={cn('border rounded-xl p-3 text-center', colorClasses[color])}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

interface LessonCardProps {
  lesson: LessonBreakdown;
  lessonName: string;
}

function LessonCard({ lesson, lessonName }: LessonCardProps) {
  const total = lesson.correct + lesson.wrong + lesson.empty;
  const correctPercent = total > 0 ? (lesson.correct / total) * 100 : 0;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{lessonName}</span>
        <span className="text-emerald-600 font-bold">{lesson.net.toFixed(2)} net</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${correctPercent}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          D: {lesson.correct}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          Y: {lesson.wrong}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          B: {lesson.empty}
        </span>
        {lesson.cancelled && lesson.cancelled > 0 && (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            İ: {lesson.cancelled}
          </span>
        )}
      </div>
    </div>
  );
}
