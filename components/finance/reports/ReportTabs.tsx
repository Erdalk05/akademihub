 'use client';

import React, { useState } from 'react';
import {
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Star,
} from 'lucide-react';

type TabKey = 'all' | 'income' | 'expense' | 'student' | 'analysis' | 'favorites';

interface ReportTabsProps {
  counts?: Partial<Record<TabKey, number>>;
  onChange?: (tab: TabKey) => void;
}

const baseTabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Tümü', icon: LayoutGrid },
  { key: 'income', label: 'Gelir Raporları', icon: TrendingUp },
  { key: 'expense', label: 'Gider Raporları', icon: TrendingDown },
  { key: 'student', label: 'Öğrenci Raporları', icon: Users },
  { key: 'analysis', label: 'Analiz Raporları', icon: BarChart3 },
  { key: 'favorites', label: 'Favoriler', icon: Star },
];

export default function ReportTabs({ counts, onChange }: ReportTabsProps) {
  const [active, setActive] = useState<TabKey>('all');

  const handleClick = (key: TabKey) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="inline-flex min-w-full rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        {baseTabs.map((tab) => {
          const Icon = tab.icon;
          const count = counts?.[tab.key];
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleClick(tab.key)}
              className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? 'text-white' : 'text-indigo-500'
                }`}
              />
              <span className="truncate">{tab.label}</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {typeof count === 'number' ? count : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


