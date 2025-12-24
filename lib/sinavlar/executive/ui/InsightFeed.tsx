/**
 * ============================================
 * AkademiHub - Insight Feed
 * ============================================
 * 
 * PHASE 8.2 - Founder Command Center
 * 
 * BU DOSYA:
 * - Kurum geneli AI aksiyonlar
 * - Gerçek zamanlı güncellemeler
 * - Aksiyon odaklı içerik
 */

'use client';

import React from 'react';
import type { AcademicCrisisAlert, AIInstitutionalSummary } from '../types';

// ==================== PROPS ====================

export interface InsightFeedProps {
  alerts: AcademicCrisisAlert[];
  aiSummary: AIInstitutionalSummary | null;
}

// ==================== MAIN COMPONENT ====================

export function InsightFeed({ alerts, aiSummary }: InsightFeedProps) {
  // Feed items oluştur
  const feedItems = React.useMemo(() => {
    const items: FeedItem[] = [];
    
    // Kriz uyarıları
    for (const alert of alerts) {
      items.push({
        id: alert.id,
        type: alert.level === 'critical' ? 'crisis' : 'warning',
        emoji: alert.level === 'critical' ? '🔴' : '🟡',
        title: alert.subject,
        description: alert.message,
        action: alert.suggestedAction,
        priority: alert.priority,
        colorClass: alert.level === 'critical' 
          ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' 
          : 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20'
      });
    }
    
    // AI önerileri
    if (aiSummary) {
      for (const action of aiSummary.recommendedActions) {
        items.push({
          id: `action-${action.type}`,
          type: 'action',
          emoji: action.emoji,
          title: 'Önerilen Aksiyon',
          description: action.description,
          action: `Hedef: ${action.target === 'teachers' ? 'Öğretmenler' : 
                          action.target === 'parents' ? 'Veliler' : 
                          action.target === 'students' ? 'Öğrenciler' : 'Tümü'}`,
          priority: 10,
          colorClass: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
        });
      }
    }
    
    // Önceliğe göre sırala
    return items.sort((a, b) => a.priority - b.priority);
  }, [alerts, aiSummary]);
  
  if (feedItems.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="text-center py-8">
          <span className="text-4xl">✅</span>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-3">
            Her şey yolunda!
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Şu an dikkat gerektiren bir durum yok.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">📢</span>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Dikkat Gerektiren Durumlar
          </h3>
        </div>
      </div>
      
      {/* Feed */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
        {feedItems.map(item => (
          <FeedItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ==================== TYPES ====================

interface FeedItem {
  id: string;
  type: 'crisis' | 'warning' | 'action' | 'info';
  emoji: string;
  title: string;
  description: string;
  action?: string;
  priority: number;
  colorClass: string;
}

// ==================== SUB COMPONENTS ====================

function FeedItemCard({ item }: { item: FeedItem }) {
  return (
    <div className={`p-4 border-l-4 ${item.colorClass} transition-colors hover:brightness-95`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {item.title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {item.description}
          </p>
          
          {item.action && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                💡 {item.action}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== EXPORT ====================

export default InsightFeed;

