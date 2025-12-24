/**
 * ============================================
 * AkademiHub - PDF Topic Breakdown Section
 * ============================================
 * 
 * PHASE 4 - Konu Bazlı Analiz Bölümü
 * 
 * İÇERİK:
 * - Konuların başarı/zorluk durumuna göre gruplandırılması
 * - Güçlü ve zayıf konular
 * - Görsel başarı göstergeleri
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, getSuccessColor, SUCCESS_COLORS } from '../constants/colors';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/fonts';
import { formatPercent, getSubjectName } from '../utils/formatters';
import type { TopicBreakdownProps } from '../types';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  
  groupContainer: {
    marginBottom: SPACING.md
  },
  
  groupTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm
  },
  
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs
  },
  
  topicChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  topicName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginRight: SPACING.xs
  },
  
  topicRate: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold
  },
  
  noDataText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.muted,
    textAlign: 'center',
    padding: SPACING.md
  },
  
  summaryBox: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md
  },
  
  summaryCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center'
  },
  
  summaryNumber: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold
  },
  
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2
  }
});

// ==================== TYPES ====================

interface TopicData {
  id: string;
  name: string;
  subject_code?: string;
  correct: number;
  total: number;
  rate: number;
  status: string;
}

interface GroupedTopics {
  excellent: TopicData[];
  good: TopicData[];
  average: TopicData[];
  weak: TopicData[];
  critical: TopicData[];
}

// ==================== COMPONENT ====================

/**
 * Konu bazlı analiz bölümü
 */
export function TopicBreakdownSection({
  topicPerformance,
  strengths,
  weaknesses,
  improvementPriorities
}: TopicBreakdownProps): React.ReactElement {
  const topics = Object.values(topicPerformance);
  
  if (topics.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Konu Bazlı Analiz</Text>
        <Text style={styles.noDataText}>Konu verisi bulunamadı</Text>
      </View>
    );
  }
  
  // Konuları durumlarına göre grupla
  const grouped = groupTopicsByStatus(topics);
  
  // İstatistikler
  const stats = {
    total: topics.length,
    mastered: grouped.excellent.length + grouped.good.length,
    needsWork: grouped.weak.length + grouped.critical.length
  };
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📖 Konu Bazlı Analiz</Text>
      
      {/* Özet kartları */}
      <View style={styles.summaryBox}>
        <View style={[styles.summaryCard, { backgroundColor: SUCCESS_COLORS.good.bg }]}>
          <Text style={[styles.summaryNumber, { color: SUCCESS_COLORS.good.text }]}>
            {stats.mastered}
          </Text>
          <Text style={[styles.summaryLabel, { color: SUCCESS_COLORS.good.text }]}>
            İyi Seviye
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: SUCCESS_COLORS.average.bg }]}>
          <Text style={[styles.summaryNumber, { color: SUCCESS_COLORS.average.text }]}>
            {grouped.average.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: SUCCESS_COLORS.average.text }]}>
            Orta Seviye
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: SUCCESS_COLORS.weak.bg }]}>
          <Text style={[styles.summaryNumber, { color: SUCCESS_COLORS.weak.text }]}>
            {stats.needsWork}
          </Text>
          <Text style={[styles.summaryLabel, { color: SUCCESS_COLORS.weak.text }]}>
            Gelişim Alanı
          </Text>
        </View>
      </View>
      
      {/* Mükemmel konular */}
      {grouped.excellent.length > 0 && (
        <TopicGroup 
          title="🌟 Mükemmel Konular" 
          topics={grouped.excellent}
          colorScheme={SUCCESS_COLORS.excellent}
        />
      )}
      
      {/* İyi konular */}
      {grouped.good.length > 0 && (
        <TopicGroup 
          title="✓ İyi Seviye" 
          topics={grouped.good}
          colorScheme={SUCCESS_COLORS.good}
        />
      )}
      
      {/* Orta konular */}
      {grouped.average.length > 0 && (
        <TopicGroup 
          title="△ Geliştirilmeli" 
          topics={grouped.average}
          colorScheme={SUCCESS_COLORS.average}
        />
      )}
      
      {/* Zayıf konular */}
      {grouped.weak.length > 0 && (
        <TopicGroup 
          title="! Zayıf" 
          topics={grouped.weak}
          colorScheme={SUCCESS_COLORS.weak}
        />
      )}
      
      {/* Kritik konular */}
      {grouped.critical.length > 0 && (
        <TopicGroup 
          title="⚠ Acil Çalışılmalı" 
          topics={grouped.critical}
          colorScheme={SUCCESS_COLORS.critical}
        />
      )}
    </View>
  );
}

// ==================== SUB-COMPONENTS ====================

interface TopicGroupProps {
  title: string;
  topics: TopicData[];
  colorScheme: typeof SUCCESS_COLORS.excellent;
}

function TopicGroup({ title, topics, colorScheme }: TopicGroupProps): React.ReactElement {
  return (
    <View style={styles.groupContainer}>
      <View style={[styles.groupTitle, { backgroundColor: colorScheme.bg }]}>
        <Text style={{ color: colorScheme.text, fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: 600 }}>
          {title} ({topics.length})
        </Text>
      </View>
      
      <View style={styles.topicGrid}>
        {topics.slice(0, 10).map((topic) => (
          <View 
            key={topic.id} 
            style={[styles.topicChip, { backgroundColor: colorScheme.bg }]}
          >
            <Text style={[styles.topicName, { color: colorScheme.text }]}>
              {truncateTopic(topic.name)}
            </Text>
            <Text style={[styles.topicRate, { color: colorScheme.accent }]}>
              {formatPercent(topic.rate)}
            </Text>
          </View>
        ))}
        
        {topics.length > 10 && (
          <View style={[styles.topicChip, { backgroundColor: COLORS.background.secondary }]}>
            <Text style={{ fontSize: 8, color: COLORS.text.muted }}>
              +{topics.length - 10} daha
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ==================== COMPACT VERSION ====================

/**
 * Kompakt konu özeti (veli raporu için)
 */
export function CompactTopicSummary({
  topicPerformance
}: { topicPerformance: Record<string, TopicData> }): React.ReactElement {
  const topics = Object.values(topicPerformance);
  
  if (topics.length === 0) return <View />;
  
  const grouped = groupTopicsByStatus(topics);
  const needsWork = [...grouped.weak, ...grouped.critical];
  
  if (needsWork.length === 0) {
    return (
      <View style={{ 
        padding: SPACING.sm, 
        backgroundColor: SUCCESS_COLORS.good.bg, 
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.md
      }}>
        <Text style={{ fontSize: 10, color: SUCCESS_COLORS.good.text }}>
          ✓ Tüm konularda yeterli seviyede
        </Text>
      </View>
    );
  }
  
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={{ fontSize: 10, color: COLORS.text.secondary, marginBottom: SPACING.xs }}>
        Üzerinde Çalışılması Gereken Konular:
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {needsWork.slice(0, 5).map((topic) => (
          <View 
            key={topic.id}
            style={{
              backgroundColor: SUCCESS_COLORS.weak.bg,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: BORDER_RADIUS.sm
            }}
          >
            <Text style={{ fontSize: 8, color: SUCCESS_COLORS.weak.text }}>
              {truncateTopic(topic.name)}
            </Text>
          </View>
        ))}
        
        {needsWork.length > 5 && (
          <Text style={{ fontSize: 8, color: COLORS.text.muted }}>
            +{needsWork.length - 5} daha
          </Text>
        )}
      </View>
    </View>
  );
}

// ==================== HELPER FUNCTIONS ====================

function groupTopicsByStatus(topics: TopicData[]): GroupedTopics {
  return {
    excellent: topics.filter(t => t.rate >= 0.8),
    good: topics.filter(t => t.rate >= 0.6 && t.rate < 0.8),
    average: topics.filter(t => t.rate >= 0.4 && t.rate < 0.6),
    weak: topics.filter(t => t.rate >= 0.2 && t.rate < 0.4),
    critical: topics.filter(t => t.rate < 0.2)
  };
}

function truncateTopic(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 2) + '..';
}

// ==================== EXPORT ====================

export default {
  TopicBreakdownSection,
  CompactTopicSummary
};

