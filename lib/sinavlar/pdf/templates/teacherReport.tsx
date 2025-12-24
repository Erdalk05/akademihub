/**
 * ============================================
 * AkademiHub - Teacher Report Template
 * ============================================
 * 
 * PHASE 4 - Öğretmen Analiz Raporu Şablonu
 * 
 * TASARIM PRENSİPLERİ:
 * - Veri yoğun
 * - Karşılaştırmalı analiz
 * - Sınıf ortalamaları
 * - Teknik detaylar
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, getSuccessColor, getRiskColor, getTrendColor } from '../constants/colors';
import { TYPOGRAPHY, SPACING, PAGE_MARGINS, BORDER_RADIUS, TABLE_STYLES } from '../constants/fonts';
import { HeaderSection } from '../sections/header';
import { SubjectTable } from '../sections/subjectTable';
import { RiskAssessmentSection } from '../sections/riskAssessment';
import { FooterSection, Watermark, PageBreak } from '../sections/footer';
import { formatNet, formatPercent, formatRank } from '../utils/formatters';
import type { StudentAnalyticsOutput } from '../../analytics/orchestrator/types';
import type { PDFOptions, SchoolInfo, ExamInfo } from '../types';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_MARGINS.normal.top,
    paddingRight: PAGE_MARGINS.normal.right,
    paddingBottom: PAGE_MARGINS.normal.bottom + 20,
    paddingLeft: PAGE_MARGINS.normal.left,
    fontFamily: 'Helvetica',
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary
  },
  
  content: {
    flex: 1
  },
  
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg
  },
  
  dataCard: {
    width: '48%',
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  },
  
  dataCardFull: {
    width: '100%'
  },
  
  dataCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase'
  },
  
  dataCardValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary
  },
  
  dataCardSubvalue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  
  metricsTable: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md
  },
  
  metricsRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border
  },
  
  metricsRowLast: {
    borderBottomWidth: 0
  },
  
  metricsLabel: {
    flex: 1,
    padding: SPACING.xs,
    backgroundColor: COLORS.background.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary
  },
  
  metricsValue: {
    flex: 1,
    padding: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.primary,
    textAlign: 'right'
  },
  
  comparisonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  
  comparisonLabel: {
    width: 80,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary
  },
  
  comparisonBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 6,
    overflow: 'hidden'
  },
  
  comparisonBarFill: {
    height: '100%',
    borderRadius: 6
  },
  
  comparisonValue: {
    width: 50,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'right',
    color: COLORS.text.primary
  },
  
  trendDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs
  },
  
  aiMetadataBox: {
    backgroundColor: COLORS.background.accent,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg
  },
  
  aiMetadataTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm
  },
  
  aiMetadataText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed
  },
  
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs
  },
  
  badgeText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold
  }
});

// ==================== TYPES ====================

interface TeacherReportProps {
  analytics: StudentAnalyticsOutput;
  options?: PDFOptions;
  schoolInfo?: SchoolInfo;
  examInfo?: ExamInfo;
}

// ==================== COMPONENT ====================

/**
 * Öğretmen Raporu Şablonu
 * 
 * Detaylı, veri odaklı ve karşılaştırmalı
 */
export function TeacherReportTemplate({
  analytics,
  options,
  schoolInfo,
  examInfo
}: TeacherReportProps): React.ReactElement {
  const {
    student_id,
    summary,
    analytics: analyticsData,
    trends,
    risk,
    strengths,
    weaknesses,
    improvement_priorities,
    ai_metadata,
    calculation_metadata,
    cache_info
  } = analytics;
  
  const studentName = ai_metadata?.student_name || 'Öğrenci';
  const riskColor = getRiskColor(risk.level);
  const trendColor = getTrendColor(trends.direction);
  
  return (
    <Document
      title={`Öğretmen Raporu - ${studentName}`}
      author="AkademiHub"
      subject="Öğretmen Analiz Raporu"
      keywords="sınav, analiz, öğretmen, detay"
      creator="AkademiHub Analiz Sistemi"
      producer="AkademiHub PDF Engine"
    >
      <Page size="A4" style={styles.page}>
        {options?.showWatermark !== false && <Watermark />}
        
        <View style={styles.content}>
          {/* Header */}
          <HeaderSection
            studentName={studentName}
            studentNo={ai_metadata?.student_no}
            className={ai_metadata?.class_name}
            examName={examInfo?.name || 'Sınav'}
            examDate={examInfo?.date || new Date().toISOString()}
            schoolInfo={schoolInfo}
            logoUrl={options?.logoUrl}
            reportType="teacher"
          />
          
          {/* Özet veri kartları */}
          <View style={styles.dataGrid}>
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Toplam Net</Text>
              <Text style={styles.dataCardValue}>{formatNet(summary.total_net)}</Text>
              <Text style={styles.dataCardSubvalue}>
                D:{summary.total_correct} Y:{summary.total_wrong} B:{summary.total_empty}
              </Text>
            </View>
            
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Sıralama</Text>
              <Text style={styles.dataCardValue}>
                {formatRank(summary.rank_in_class)}
              </Text>
              <Text style={styles.dataCardSubvalue}>
                Sınav: {formatRank(summary.rank_in_exam)}
                {summary.percentile !== null && ` (${summary.percentile}%)`}
              </Text>
            </View>
            
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Risk Durumu</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.dataCardValue, { color: riskColor.accent }]}>
                  {risk.level?.toUpperCase() || 'DÜŞÜK'}
                </Text>
                {risk.score !== null && (
                  <View style={[styles.badge, { backgroundColor: riskColor.bg }]}>
                    <Text style={[styles.badgeText, { color: riskColor.text }]}>
                      {risk.score}/100
                    </Text>
                  </View>
                )}
              </View>
              {risk.primary_concern && (
                <Text style={styles.dataCardSubvalue}>{risk.primary_concern}</Text>
              )}
            </View>
            
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Trend</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.dataCardValue, { color: trendColor.accent }]}>
                  {trendColor.icon} {trendColor.label}
                </Text>
              </View>
              {trends.velocity !== undefined && (
                <Text style={styles.dataCardSubvalue}>
                  Velocity: {formatNet(trends.velocity)} net/sınav
                </Text>
              )}
            </View>
          </View>
          
          {/* Ders tablosu */}
          <SubjectTable
            subjects={analyticsData.subject_performance}
            showClassAvg={true}
          />
          
          {/* Detaylı metrikler */}
          <Text style={styles.sectionTitle}>📊 Detaylı Metrikler</Text>
          
          <View style={styles.metricsTable}>
            <MetricRow 
              label="Tutarlılık Skoru" 
              value={analyticsData.consistency_score !== null 
                ? formatPercent(analyticsData.consistency_score) 
                : '-'} 
            />
            <MetricRow 
              label="Sınıf Ort. Farkı" 
              value={summary.vs_class_avg !== null 
                ? `${summary.vs_class_avg > 0 ? '+' : ''}${formatNet(summary.vs_class_avg)}` 
                : '-'} 
            />
            <MetricRow 
              label="Önceki Sınav Farkı" 
              value={summary.vs_previous_exam !== null 
                ? `${summary.vs_previous_exam > 0 ? '+' : ''}${formatNet(summary.vs_previous_exam)}` 
                : '-'} 
            />
            <MetricRow 
              label="Trend Skoru" 
              value={trends.trend_score !== undefined 
                ? `${trends.trend_score > 0 ? '+' : ''}${trends.trend_score}` 
                : '-'}
              isLast 
            />
          </View>
          
          {/* Zorluk analizi */}
          {analyticsData.difficulty_performance && (
            <>
              <Text style={styles.sectionTitle}>🎯 Zorluk Seviyesi Analizi</Text>
              <DifficultyComparison data={analyticsData.difficulty_performance} />
            </>
          )}
          
          {/* Risk faktörleri (detaylı) */}
          {risk.level && risk.level !== 'low' && (
            <RiskAssessmentSection
              level={risk.level}
              score={risk.score}
              factors={risk.factors}
              primaryConcern={risk.primary_concern || null}
              summary={risk.summary}
              actionRequired={risk.action_required}
            />
          )}
          
          {/* AI Metadata (eğer varsa) */}
          {ai_metadata?.ai_ready_text && (
            <View style={styles.aiMetadataBox}>
              <Text style={styles.aiMetadataTitle}>🤖 AI Analiz Özeti</Text>
              <Text style={styles.aiMetadataText}>
                {ai_metadata.ai_ready_text}
              </Text>
            </View>
          )}
          
          {/* Hesaplama metadata */}
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={{ fontSize: 7, color: COLORS.text.muted }}>
              Hesaplama Süresi: {calculation_metadata.calculation_duration_ms}ms | 
              Versiyon: {calculation_metadata.analytics_version} | 
              Veri Kalitesi: {formatPercent(calculation_metadata.data_completeness)} |
              Güven: {formatPercent(calculation_metadata.confidence_score)} |
              Cache: {cache_info?.is_cached ? 'Evet' : 'Hayır'}
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <FooterSection
          pageNumber={1}
          totalPages={1}
          generatedAt={calculation_metadata.calculated_at}
          version={calculation_metadata.analytics_version}
          showQRCode={false}
        />
      </Page>
    </Document>
  );
}

// ==================== SUB-COMPONENTS ====================

interface MetricRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function MetricRow({ label, value, isLast }: MetricRowProps): React.ReactElement {
  return (
    <View style={{
      ...styles.metricsRow,
      ...(isLast ? styles.metricsRowLast : {})
    }}>
      <Text style={styles.metricsLabel}>{label}</Text>
      <Text style={styles.metricsValue}>{value}</Text>
    </View>
  );
}

interface DifficultyComparisonProps {
  data: {
    easy: { correct: number; total: number; rate: number };
    medium: { correct: number; total: number; rate: number };
    hard: { correct: number; total: number; rate: number };
  };
}

function DifficultyComparison({ data }: DifficultyComparisonProps): React.ReactElement {
  const items = [
    { label: 'Kolay', ...data.easy, color: COLORS.success },
    { label: 'Orta', ...data.medium, color: COLORS.warning },
    { label: 'Zor', ...data.hard, color: COLORS.danger }
  ];
  
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {items.map((item, index) => (
        <View key={index} style={styles.comparisonBar}>
          <Text style={styles.comparisonLabel}>{item.label}</Text>
          <View style={styles.comparisonBarContainer}>
            <View 
              style={[
                styles.comparisonBarFill, 
                { 
                  width: `${item.rate * 100}%`,
                  backgroundColor: item.color 
                }
              ]} 
            />
          </View>
          <Text style={styles.comparisonValue}>
            {formatPercent(item.rate)} ({item.correct}/{item.total})
          </Text>
        </View>
      ))}
    </View>
  );
}

// ==================== EXPORT ====================

export default TeacherReportTemplate;

