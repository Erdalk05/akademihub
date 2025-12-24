/**
 * ============================================
 * AkademiHub - AI Expert Opinion PDF Section
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - PDF'in son sayfası: AI Akademik Değerlendirme
 * - Executive Summary
 * - Strengths & Growth Areas
 * - Priority Actions
 * - Weekly Mini Learning Path
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PDFAIOpinionViewModel } from '../../types';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#FAFAFA'
  },
  
  // Header
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingBottom: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6B7280'
  },
  
  // Executive Summary
  executiveSummary: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  executiveSummaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8
  },
  executiveSummaryText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5
  },
  
  // Two Column Layout
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20
  },
  column: {
    flex: 1
  },
  
  // Section Card
  sectionCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8
  },
  strengthsTitle: {
    color: '#047857'
  },
  growthTitle: {
    color: '#B45309'
  },
  sectionContent: {
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.4,
    marginBottom: 8
  },
  
  // Bullet Points
  bulletList: {
    marginTop: 6
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4
  },
  bullet: {
    width: 12,
    fontSize: 8,
    color: '#6B7280'
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#4B5563'
  },
  
  // Priority Actions
  prioritySection: {
    marginBottom: 20
  },
  prioritySectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10
  },
  priorityList: {
    gap: 8
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  priorityNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  priorityNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  priorityContent: {
    flex: 1
  },
  priorityTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2
  },
  priorityDescription: {
    fontSize: 9,
    color: '#6B7280'
  },
  priorityTime: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4
  },
  
  // Weekly Plan
  weeklyPlan: {
    marginBottom: 20
  },
  weeklyPlanTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10
  },
  weeklyPlanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dayCard: {
    width: '48%',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  dayTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 6
  },
  dayActivity: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 2
  },
  
  // Closing
  closing: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E'
  },
  closingText: {
    fontSize: 10,
    color: '#166534',
    fontStyle: 'italic',
    lineHeight: 1.5
  },
  
  // Metadata
  metadata: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metadataText: {
    fontSize: 7,
    color: '#9CA3AF'
  }
});

// ==================== PROPS ====================

export interface AIExpertOpinionProps {
  viewModel: PDFAIOpinionViewModel;
  language?: 'tr' | 'en';
}

// ==================== ANA COMPONENT ====================

/**
 * AI Expert Opinion PDF Section
 */
export function AIExpertOpinion({ viewModel, language = 'tr' }: AIExpertOpinionProps) {
  const {
    executiveSummary,
    strengths,
    growthAreas,
    priorityActions,
    weeklyPlan,
    closingMessage,
    metadata
  } = viewModel;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🤖 {language === 'tr' ? 'AI Akademik Değerlendirme' : 'AI Academic Assessment'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {language === 'tr' 
            ? 'AkademiHub AI Koç tarafından oluşturuldu'
            : 'Generated by AkademiHub AI Coach'}
        </Text>
      </View>
      
      {/* Executive Summary */}
      <View style={styles.executiveSummary}>
        <Text style={styles.executiveSummaryTitle}>
          📋 {language === 'tr' ? 'Özet Değerlendirme' : 'Executive Summary'}
        </Text>
        <Text style={styles.executiveSummaryText}>
          {executiveSummary}
        </Text>
      </View>
      
      {/* Two Column: Strengths & Growth Areas */}
      <View style={styles.twoColumn}>
        {/* Strengths */}
        <View style={styles.column}>
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, styles.strengthsTitle]}>
              ✓ {strengths.title}
            </Text>
            <Text style={styles.sectionContent}>
              {strengths.content}
            </Text>
            {strengths.bulletPoints.length > 0 && (
              <View style={styles.bulletList}>
                {strengths.bulletPoints.map((point, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        
        {/* Growth Areas */}
        <View style={styles.column}>
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, styles.growthTitle]}>
              ↗ {growthAreas.title}
            </Text>
            <Text style={styles.sectionContent}>
              {growthAreas.content}
            </Text>
            {growthAreas.bulletPoints.length > 0 && (
              <View style={styles.bulletList}>
                {growthAreas.bulletPoints.map((point, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Priority Actions */}
      <View style={styles.prioritySection}>
        <Text style={styles.prioritySectionTitle}>
          🎯 {language === 'tr' ? 'Öncelikli Adımlar' : 'Priority Actions'}
        </Text>
        <View style={styles.priorityList}>
          {priorityActions.map((action) => (
            <View key={action.priority} style={styles.priorityItem}>
              <View style={styles.priorityNumber}>
                <Text style={styles.priorityNumberText}>{action.priority}</Text>
              </View>
              <View style={styles.priorityContent}>
                <Text style={styles.priorityTitle}>{action.title}</Text>
                <Text style={styles.priorityDescription}>{action.description}</Text>
                {action.estimatedTime && (
                  <Text style={styles.priorityTime}>⏱ {action.estimatedTime}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* Weekly Plan */}
      <View style={styles.weeklyPlan}>
        <Text style={styles.weeklyPlanTitle}>
          📅 {weeklyPlan.title}
        </Text>
        <View style={styles.weeklyPlanGrid}>
          {weeklyPlan.days.map((day, index) => (
            <View key={index} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{day.day}</Text>
              {day.activities.map((activity, actIndex) => (
                <Text key={actIndex} style={styles.dayActivity}>
                  • {activity}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
      
      {/* Closing Message */}
      <View style={styles.closing}>
        <Text style={styles.closingText}>
          💬 {closingMessage}
        </Text>
      </View>
      
      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          {language === 'tr' ? 'Oluşturulma' : 'Generated'}: {new Date(metadata.generatedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
        </Text>
        <Text style={styles.metadataText}>
          {language === 'tr' ? 'Model' : 'Model'}: {metadata.model}
        </Text>
        <Text style={styles.metadataText}>
          v{metadata.version}
        </Text>
      </View>
    </View>
  );
}

// ==================== EXPORT ====================

export default AIExpertOpinion;

