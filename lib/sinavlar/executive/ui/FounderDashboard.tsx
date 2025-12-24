/**
 * ============================================
 * AkademiHub - Founder Dashboard
 * ============================================
 * 
 * PHASE 8.2 - Founder Command Center
 * 
 * BU DOSYA:
 * - Kurucu ana ekranı
 * - Tek bakışta "nerede problem var?"
 * - Mobil uyumlu
 * 
 * DİL:
 * Teknik terimler YASAK!
 * "Snapshot", "Hash", "Invalid" → "Rapor", "Veri", "Hatalı"
 */

'use client';

import React, { useMemo } from 'react';
import type { FounderDashboardData, QuickStat } from '../types';
import { InsightFeed } from './InsightFeed';
import { ClassComparisonChart } from './ClassComparisonChart';

// ==================== PROPS ====================

export interface FounderDashboardProps {
  data: FounderDashboardData;
  quickStats: QuickStat[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onExamSelect?: (examId: string) => void;
  onStudentClick?: (studentId: string) => void;
  onClassClick?: (className: string) => void;
}

// ==================== MAIN COMPONENT ====================

export function FounderDashboard({
  data,
  quickStats,
  isLoading = false,
  onRefresh,
  onExamSelect,
  onStudentClick,
  onClassClick
}: FounderDashboardProps) {
  // En önemli kriz
  const topCrisis = useMemo(() => {
    return data.crisisAlerts.find(a => a.level === 'critical') || data.crisisAlerts[0];
  }, [data.crisisAlerts]);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            👋 Hoş Geldiniz
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {data.organization.name} • {formatDate(data.lastUpdated)}
          </p>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Yenile"
          >
            🔄
          </button>
        )}
      </header>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <QuickStatCard key={i} stat={stat} />
        ))}
      </div>
      
      {/* Kritik Uyarı Banner */}
      {topCrisis && topCrisis.level === 'critical' && (
        <CrisisAlertBanner alert={topCrisis} />
      )}
      
      {/* AI Kurumsal Özet */}
      {data.aiSummary && (
        <AISummaryCard summary={data.aiSummary} />
      )}
      
      {/* Ana İçerik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Insight Feed */}
        <div className="lg:col-span-1">
          <InsightFeed 
            alerts={data.crisisAlerts}
            aiSummary={data.aiSummary}
          />
        </div>
        
        {/* Orta: Sınıf Karşılaştırma */}
        <div className="lg:col-span-2">
          <ClassComparisonChart 
            classes={data.classComparison}
            onClassClick={onClassClick}
          />
        </div>
      </div>
      
      {/* Katılım Özeti */}
      <ParticipationCard 
        participation={data.participation}
        onStudentClick={onStudentClick}
      />
    </div>
  );
}

// ==================== SUB COMPONENTS ====================

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-500">Veriler yükleniyor...</p>
      </div>
    </div>
  );
}

function QuickStatCard({ stat }: { stat: QuickStat }) {
  return (
    <div className={`p-4 rounded-xl ${stat.colorClass} transition-all hover:scale-105`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{stat.emoji}</span>
        {stat.change !== undefined && (
          <span className={`text-xs ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stat.change > 0 ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{stat.value}</p>
      <p className="text-sm opacity-70">{stat.label}</p>
    </div>
  );
}

function CrisisAlertBanner({ alert }: { alert: FounderDashboardData['crisisAlerts'][0] }) {
  return (
    <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <span className="text-4xl">🚨</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">Kritik Müdahale Gerekiyor</h3>
          <p className="text-red-100 mb-3">{alert.message}</p>
          <div className="flex items-center gap-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {alert.affectedStudents} öğrenci etkilendi
            </span>
            <button className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-red-100 transition-colors">
              Detayları Gör →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AISummaryCard({ summary }: { summary: FounderDashboardData['aiSummary'] }) {
  if (!summary) return null;
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <span className="text-3xl">🤖</span>
        <div className="flex-1">
          <p className="text-indigo-900 dark:text-indigo-200 font-medium mb-2">
            {summary.salutation}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {summary.overallAssessment}
          </p>
          
          {/* Kritik Bulgular */}
          {summary.criticalFindings.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Önemli Bulgular:</p>
              <div className="space-y-2">
                {summary.criticalFindings.slice(0, 3).map((finding, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span>{finding.emoji}</span>
                    <span className="text-gray-700 dark:text-gray-300">{finding.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Haftalık Öncelikler */}
          {summary.weeklyPriorities.length > 0 && (
            <div className="pt-4 border-t border-indigo-200 dark:border-indigo-700">
              <p className="text-sm font-medium text-gray-500 mb-2">Bu Hafta Yapılması Gerekenler:</p>
              <ol className="space-y-1 text-sm">
                {summary.weeklyPriorities.map((priority, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">{priority.order}.</span>
                    <span className="text-gray-700 dark:text-gray-300">{priority.description}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticipationCard({ 
  participation, 
  onStudentClick 
}: { 
  participation: FounderDashboardData['participation'];
  onStudentClick?: (studentId: string) => void;
}) {
  const hasAbsent = participation.absentStudents.length > 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                Katılım Durumu
              </h3>
              <p className="text-sm text-gray-500">
                {participation.participatedCount} / {participation.totalStudents} öğrenci
              </p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            participation.participationRate >= 90 
              ? 'bg-green-100 text-green-700'
              : participation.participationRate >= 70
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
          }`}>
            %{participation.participationRate}
          </div>
        </div>
      </div>
      
      {/* Devamsız Öğrenciler */}
      {hasAbsent && (
        <div className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-3">
            Sınava Katılmayan Öğrenciler ({participation.absentCount}):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
            {participation.absentStudents.map(student => (
              <button
                key={student.id}
                onClick={() => onStudentClick?.(student.id)}
                className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-left hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="text-red-500">⚠️</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {student.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {student.className} • {student.studentNo}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Sınıf Bazlı */}
      {participation.byClass.length > 0 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 mb-3">Sınıf Bazlı Katılım:</p>
          <div className="space-y-2">
            {participation.byClass.map(cls => (
              <div key={cls.className} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium">{cls.className}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      cls.participationRate >= 90 ? 'bg-green-500' :
                      cls.participationRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${cls.participationRate}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-500 text-right">
                  %{cls.participationRate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== HELPERS ====================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// ==================== EXPORT ====================

export default FounderDashboard;

