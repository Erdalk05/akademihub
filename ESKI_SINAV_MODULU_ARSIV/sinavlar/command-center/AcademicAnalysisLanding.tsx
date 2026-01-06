/**
 * ============================================
 * AkademiHub - Academic Analysis Landing
 * ============================================
 * 
 * PHASE 8.5 - Core Intelligence Hub
 * 
 * Bu component:
 * ✅ Karar odaklı intelligence hub
 * ✅ 5 saniyede akademik durumu gösterir
 * ✅ Rol bazlı görünüm (Admin/Öğretmen)
 * 
 * DİL KURALLARI:
 * ❌ Hata, Kritik, Başarısız, Alarm
 * ✅ Odak alanı, Gelişim fırsatı, Stratejik öncelik
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { 
  CommandCenterData, 
  SignalCard, 
  ActionTile, 
  AINextStep,
  IntelligenceNarrative 
} from './types';
import { getCommandCenterData } from './dataAdapter';

// ==================== MAIN COMPONENT ====================

export function AcademicAnalysisLanding() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'teacher'>('admin');
  
  useEffect(() => {
    loadData();
  }, [userRole]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      // TODO: organizationId'yi auth context'ten al
      const orgId = 'default-org-id';
      const result = await getCommandCenterData(orgId, userRole);
      setData(result);
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || !data) {
    return <LoadingState />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Role Switch */}
        <Header 
          organizationName={data.organization.name}
          userRole={userRole}
          onRoleChange={setUserRole}
          onRefresh={loadData}
        />
        
        {/* 1️⃣ Intelligence Strip */}
        <IntelligenceStrip narrative={data.narrative} />
        
        {/* 2️⃣ Signal Cards */}
        <SignalCardsGrid cards={data.signalCards} />
        
        {/* 3️⃣ Action Tiles */}
        <ActionTilesGrid tiles={data.actionTiles} />
        
        {/* 5️⃣ AI Next Step */}
        {data.nextStep && <AINextStepBar nextStep={data.nextStep} />}
        
      </div>
    </div>
  );
}

// ==================== HEADER ====================

function Header({ 
  organizationName, 
  userRole, 
  onRoleChange,
  onRefresh 
}: {
  organizationName: string;
  userRole: 'admin' | 'teacher';
  onRoleChange: (role: 'admin' | 'teacher') => void;
  onRefresh: () => void;
}) {
  return (
    <header 
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fadeIn"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Akademik Analiz Merkezi
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {organizationName || 'Kurum'} • Akademik Karar Platformu
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Role Switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => onRoleChange('admin')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              userRole === 'admin'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            👑 Yönetici
          </button>
          <button
            onClick={() => onRoleChange('teacher')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              userRole === 'teacher'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            👩‍🏫 Öğretmen
          </button>
        </div>
        
        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

// ==================== 1️⃣ INTELLIGENCE STRIP ====================

function IntelligenceStrip({ narrative }: { narrative: IntelligenceNarrative }) {
  const moodStyles = {
    positive: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
    neutral: 'from-slate-500/10 to-slate-400/10 border-slate-200 dark:border-slate-700',
    attention: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800',
    opportunity: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800'
  };
  
  const moodIcons = {
    positive: '✨',
    neutral: '📊',
    attention: '🔍',
    opportunity: '💡'
  };
  
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${moodStyles[narrative.mood]} p-6 mb-8 animate-fadeIn`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{moodIcons[narrative.mood]}</div>
        <div className="flex-1">
          <p className="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            {narrative.message}
          </p>
          {narrative.detail && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {narrative.detail}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          {narrative.dataSource === 'ai' && <Sparkles className="w-3 h-3" />}
          <span>{narrative.dataSource === 'ai' ? 'AI Analizi' : 'Sistem'}</span>
        </div>
      </div>
    </section>
  );
}

// ==================== 2️⃣ SIGNAL CARDS ====================

function SignalCardsGrid({ cards }: { cards: SignalCard[] }) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fadeIn"
    >
      {cards.map((card, index) => (
        <SignalCardComponent key={card.id} card={card} index={index} />
      ))}
    </section>
  );
}

function SignalCardComponent({ card, index }: { card: SignalCard; index: number }) {
  const signalStyles = {
    positive: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400',
    neutral: 'border-slate-200 dark:border-slate-700 hover:border-slate-400',
    attention: 'border-amber-200 dark:border-amber-800 hover:border-amber-400',
    opportunity: 'border-blue-200 dark:border-blue-800 hover:border-blue-400'
  };
  
  const valueStyles = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    neutral: 'text-slate-600 dark:text-slate-400',
    attention: 'text-amber-600 dark:text-amber-400',
    opportunity: 'text-blue-600 dark:text-blue-400'
  };
  
  return (
    <div className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
      <Link
        href={card.deepLink}
        className={`block h-full bg-white dark:bg-slate-800/50 rounded-xl border-2 ${signalStyles[card.signal]} p-5 transition-all hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{card.icon}</span>
          <TrendIndicator signal={card.signal} />
        </div>
        
        <p className={`text-3xl font-bold ${valueStyles[card.signal]} mb-1`}>
          {card.primaryValue}
        </p>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {card.valueLabel}
        </p>
        
        {card.context && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 line-clamp-1">
            {card.context}
          </p>
        )}
        
        <div className="flex items-center gap-1 mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <span>{card.deepLinkText}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}

function TrendIndicator({ signal }: { signal: SignalCard['signal'] }) {
  const icons = {
    positive: <TrendingUp className="w-4 h-4 text-emerald-500" />,
    neutral: <Minus className="w-4 h-4 text-slate-400" />,
    attention: <TrendingDown className="w-4 h-4 text-amber-500" />,
    opportunity: <Sparkles className="w-4 h-4 text-blue-500" />
  };
  
  return <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-700">{icons[signal]}</div>;
}

// ==================== 3️⃣ ACTION TILES ====================

function ActionTilesGrid({ tiles }: { tiles: ActionTile[] }) {
  return (
    <section className="mb-8 animate-fadeIn"
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
        İşlem Merkezi
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile, index) => (
          <ActionTileComponent key={tile.id} tile={tile} index={index} />
        ))}
      </div>
    </section>
  );
}

function ActionTileComponent({ tile, index }: { tile: ActionTile; index: number }) {
  const colorStyles = {
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
    blue: 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    purple: 'bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
    slate: 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'
  };
  
  return (
    <div className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
      <Link
        href={tile.href}
        className={`relative block rounded-xl ${colorStyles[tile.colorTheme]} p-6 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1`}
      >
        {tile.badge && (
          <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
            {tile.badge}
          </span>
        )}
        
        <div className="text-4xl mb-3">{tile.icon}</div>
        
        <h3 className="text-lg font-bold mb-1">{tile.title}</h3>
        
        <p className="text-sm text-white/80 leading-relaxed">
          {tile.description}
        </p>
        
        <div className="flex items-center gap-1 mt-4 text-sm text-white/70">
          <span>Başla</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}

// ==================== 5️⃣ AI NEXT STEP ====================

function AINextStepBar({ nextStep }: { nextStep: AINextStep }) {
  const priorityStyles = {
    high: 'from-indigo-500 to-purple-600',
    medium: 'from-blue-500 to-indigo-600',
    low: 'from-slate-500 to-slate-600'
  };
  
  return (
    <section
      className={`rounded-2xl bg-gradient-to-r ${priorityStyles[nextStep.priority]} p-6 text-white shadow-xl animate-fadeIn`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-white/70 font-medium">Önerilen Adım</p>
            <p className="text-lg font-semibold">{nextStep.recommendation}</p>
          </div>
        </div>
        
        <Link
          href={nextStep.actionLink}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-white/90 transition-colors shadow-lg"
        >
          {nextStep.actionText}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ==================== LOADING STATE ====================

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">
          📊
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Akademik veriler hazırlanıyor...
        </p>
      </div>
    </div>
  );
}

// ==================== EXPORT ====================

export default AcademicAnalysisLanding;

