/**
 * ============================================
 * AkademiHub - PDF Recommendations Section
 * ============================================
 * 
 * PHASE 4 - Öneriler ve Güçlü/Zayıf Yönler Bölümü
 * 
 * İÇERİK:
 * - Güçlü yönler listesi
 * - Zayıf yönler listesi
 * - İyileştirme öncelikleri
 * - Çalışma önerileri
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, SUCCESS_COLORS } from '../constants/colors';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/fonts';
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
  
  twoColumn: {
    flexDirection: 'row',
    gap: SPACING.md
  },
  
  column: {
    flex: 1
  },
  
  listBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm
  },
  
  listTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  listTitleIcon: {
    fontSize: 14,
    marginRight: SPACING.xs
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.xs
  },
  
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 5,
    marginRight: SPACING.xs
  },
  
  listItemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.lineHeight.normal
  },
  
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs
  },
  
  priorityText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse
  },
  
  recommendationBox: {
    backgroundColor: COLORS.background.accent,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary
  },
  
  recommendationTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm
  },
  
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs
  },
  
  recommendationNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs
  },
  
  recommendationNumberText: {
    fontSize: 9,
    color: COLORS.text.inverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold
  },
  
  recommendationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.normal
  },
  
  emptyState: {
    padding: SPACING.md,
    alignItems: 'center'
  },
  
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.muted
  }
});

// ==================== STRENGTHS & WEAKNESSES ====================

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

/**
 * Güçlü ve zayıf yönler bölümü
 */
export function StrengthsWeaknessesSection({
  strengths,
  weaknesses
}: StrengthsWeaknessesProps): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💪 Güçlü ve Gelişim Alanları</Text>
      
      <View style={styles.twoColumn}>
        {/* Güçlü yönler */}
        <View style={styles.column}>
          <View style={[styles.listBox, { backgroundColor: SUCCESS_COLORS.good.bg }]}>
            <View style={styles.listTitle}>
              <Text style={styles.listTitleIcon}>✓</Text>
              <Text style={{ color: SUCCESS_COLORS.good.text }}>Güçlü Yönler</Text>
            </View>
            
            {strengths.length > 0 ? (
              strengths.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.bullet, { backgroundColor: SUCCESS_COLORS.good.accent }]} />
                  <Text style={[styles.listItemText, { color: SUCCESS_COLORS.good.text }]}>
                    {item}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: SUCCESS_COLORS.good.text }]}>
                Henüz belirlenmedi
              </Text>
            )}
          </View>
        </View>
        
        {/* Zayıf yönler */}
        <View style={styles.column}>
          <View style={[styles.listBox, { backgroundColor: SUCCESS_COLORS.weak.bg }]}>
            <View style={styles.listTitle}>
              <Text style={styles.listTitleIcon}>!</Text>
              <Text style={{ color: SUCCESS_COLORS.weak.text }}>Gelişim Alanları</Text>
            </View>
            
            {weaknesses.length > 0 ? (
              weaknesses.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.bullet, { backgroundColor: SUCCESS_COLORS.weak.accent }]} />
                  <Text style={[styles.listItemText, { color: SUCCESS_COLORS.weak.text }]}>
                    {item}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: SUCCESS_COLORS.weak.text }]}>
                Önemli bir eksiklik yok
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ==================== IMPROVEMENT PRIORITIES ====================

interface ImprovementPrioritiesProps {
  priorities: string[];
}

/**
 * İyileştirme öncelikleri bölümü
 */
export function ImprovementPrioritiesSection({
  priorities
}: ImprovementPrioritiesProps): React.ReactElement {
  if (priorities.length === 0) {
    return <View />;
  }
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 İyileştirme Öncelikleri</Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {priorities.slice(0, 6).map((priority, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: index < 2 ? SUCCESS_COLORS.critical.bg : 
                           index < 4 ? SUCCESS_COLORS.weak.bg : 
                           SUCCESS_COLORS.average.bg,
            padding: SPACING.xs,
            paddingHorizontal: SPACING.sm,
            borderRadius: BORDER_RADIUS.sm
          }}>
            <View style={[styles.priorityBadge, { 
              backgroundColor: index < 2 ? SUCCESS_COLORS.critical.accent : 
                              index < 4 ? SUCCESS_COLORS.weak.accent : 
                              SUCCESS_COLORS.average.accent 
            }]}>
              <Text style={styles.priorityText}>{index + 1}</Text>
            </View>
            <Text style={{ 
              fontSize: 9, 
              color: index < 2 ? SUCCESS_COLORS.critical.text : 
                     index < 4 ? SUCCESS_COLORS.weak.text : 
                     SUCCESS_COLORS.average.text 
            }}>
              {priority}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ==================== STUDY RECOMMENDATIONS ====================

interface StudyRecommendationsProps {
  recommendations: string[];
}

/**
 * Çalışma önerileri bölümü
 */
export function StudyRecommendationsSection({
  recommendations
}: StudyRecommendationsProps): React.ReactElement {
  if (recommendations.length === 0) {
    return <View />;
  }
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📚 Çalışma Önerileri</Text>
      
      <View style={styles.recommendationBox}>
        {recommendations.slice(0, 5).map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <View style={styles.recommendationNumber}>
              <Text style={styles.recommendationNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ==================== COMBINED SECTION ====================

/**
 * Tüm önerileri birleştiren bölüm
 */
export function RecommendationsSection({
  strengths,
  weaknesses,
  improvementPriorities,
  studyRecommendations
}: {
  strengths: string[];
  weaknesses: string[];
  improvementPriorities: string[];
  studyRecommendations: string[];
}): React.ReactElement {
  return (
    <View>
      <StrengthsWeaknessesSection 
        strengths={strengths} 
        weaknesses={weaknesses} 
      />
      
      <ImprovementPrioritiesSection 
        priorities={improvementPriorities} 
      />
      
      <StudyRecommendationsSection 
        recommendations={studyRecommendations} 
      />
    </View>
  );
}

// ==================== EXPORT ====================

export default {
  StrengthsWeaknessesSection,
  ImprovementPrioritiesSection,
  StudyRecommendationsSection,
  RecommendationsSection
};

