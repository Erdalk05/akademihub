/**
 * ============================================
 * AkademiHub - Parent Report Template
 * ============================================
 * 
 * PHASE 4 - Veli Bilgilendirme Raporu Şablonu
 * 
 * TASARIM PRENSİPLERİ:
 * - Sade ve anlaşılır
 * - Sonuç odaklı
 * - Eylem önerileri
 * - Teknik jargondan arındırılmış
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, getSuccessColor, getRiskColor } from '../constants/colors';
import { TYPOGRAPHY, SPACING, PAGE_MARGINS, BORDER_RADIUS } from '../constants/fonts';
import { HeaderSection } from '../sections/header';
import { CompactSubjectTable } from '../sections/subjectTable';
import { ParentFriendlyRiskSection } from '../sections/riskAssessment';
import { FooterSection, Watermark, ConfidentialBanner } from '../sections/footer';
import { formatNet, formatPercent, formatDate, generateAssessmentSummary } from '../utils/formatters';
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
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary
  },
  
  content: {
    flex: 1
  },
  
  greeting: {
    marginBottom: SPACING.lg
  },
  
  greetingTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },
  
  greetingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed
  },
  
  summaryCard: {
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg
  },
  
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.muted,
    marginBottom: SPACING.xs
  },
  
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  
  bigNumber: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary
  },
  
  bigNumberLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md
  },
  
  statItem: {
    alignItems: 'center'
  },
  
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    marginTop: 2
  },
  
  assessmentBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg
  },
  
  assessmentText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg
  },
  
  trendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md
  },
  
  trendIcon: {
    fontSize: 24,
    marginRight: SPACING.md
  },
  
  trendContent: {
    flex: 1
  },
  
  trendTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2
  },
  
  trendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary
  },
  
  actionBox: {
    backgroundColor: COLORS.background.accent,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginTop: SPACING.lg
  },
  
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm
  },
  
  actionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs
  },
  
  actionBullet: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginRight: SPACING.xs
  },
  
  actionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.normal
  }
});

// ==================== TYPES ====================

interface ParentReportProps {
  analytics: StudentAnalyticsOutput;
  options?: PDFOptions;
  schoolInfo?: SchoolInfo;
  examInfo?: ExamInfo;
}

// ==================== COMPONENT ====================

/**
 * Veli Raporu Şablonu
 * 
 * Sade, anlaşılır ve eylem odaklı
 */
export function ParentReportTemplate({
  analytics,
  options,
  schoolInfo,
  examInfo
}: ParentReportProps): React.ReactElement {
  const {
    summary,
    analytics: analyticsData,
    trends,
    risk,
    study_recommendations,
    calculation_metadata
  } = analytics;
  
  const studentName = analytics.ai_metadata?.student_name || 'Öğrenciniz';
  const assessmentColor = getSuccessColor(
    summary.percentile !== null ? summary.percentile / 100 : 0.5
  );
  
  // Özet değerlendirme metni
  const assessmentSummary = generateAssessmentSummary(
    summary.total_net,
    summary.percentile,
    trends.direction
  );
  
  return (
    <Document
      title={`Veli Raporu - ${studentName}`}
      author="AkademiHub"
      subject="Veli Bilgilendirme Raporu"
      keywords="sınav, veli, bilgilendirme"
      creator="AkademiHub Analiz Sistemi"
      producer="AkademiHub PDF Engine"
    >
      <Page size="A4" style={styles.page}>
        {options?.showWatermark !== false && <Watermark />}
        
        <View style={styles.content}>
          <ConfidentialBanner />
          
          {/* Header */}
          <HeaderSection
            studentName={studentName}
            studentNo={analytics.ai_metadata?.student_no}
            className={analytics.ai_metadata?.class_name}
            examName={examInfo?.name || 'Sınav'}
            examDate={examInfo?.date || new Date().toISOString()}
            schoolInfo={schoolInfo}
            logoUrl={options?.logoUrl}
            reportType="parent"
          />
          
          {/* Selamlama */}
          <View style={styles.greeting}>
            <Text style={styles.greetingTitle}>Sayın Veli,</Text>
            <Text style={styles.greetingText}>
              {studentName} isimli öğrencinizin sınav sonuçları aşağıda özetlenmiştir.
              Bu rapor, öğrencinizin performansını anlamanıza ve desteklemenize yardımcı olmak için hazırlanmıştır.
            </Text>
          </View>
          
          {/* Ana sonuç kartı */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>GENEL SONUÇ</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.bigNumber}>{formatNet(summary.total_net)}</Text>
              <Text style={styles.bigNumberLabel}>
                Toplam Net{'\n'}
                {summary.rank_in_class && `Sınıf ${summary.rank_in_class}.`}
              </Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {summary.total_correct}
                </Text>
                <Text style={styles.statLabel}>Doğru</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.danger }]}>
                  {summary.total_wrong}
                </Text>
                <Text style={styles.statLabel}>Yanlış</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.text.muted }]}>
                  {summary.total_empty}
                </Text>
                <Text style={styles.statLabel}>Boş</Text>
              </View>
              
              {summary.percentile !== null && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: COLORS.primary }]}>
                    %{summary.percentile}
                  </Text>
                  <Text style={styles.statLabel}>Yüzdelik</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Değerlendirme kutusu */}
          <View style={[styles.assessmentBox, { backgroundColor: assessmentColor.bg }]}>
            <Text style={[styles.assessmentText, { color: assessmentColor.text }]}>
              {assessmentSummary}
            </Text>
          </View>
          
          {/* Ders özeti */}
          <Text style={styles.sectionTitle}>Ders Bazlı Özet</Text>
          <CompactSubjectTable subjects={analyticsData.subject_performance} />
          
          {/* Trend */}
          {trends.direction && trends.net_trend && trends.net_trend.length >= 2 && (
            <TrendSummary 
              direction={trends.direction} 
              explanation={trends.explanation}
              velocity={trends.velocity}
            />
          )}
          
          {/* Risk ve öneriler */}
          <ParentFriendlyRiskSection
            level={risk.level}
            score={risk.score}
            factors={risk.factors}
            primaryConcern={risk.primary_concern || null}
            summary={risk.summary}
            actionRequired={risk.action_required}
          />
          
          {/* Çalışma önerileri */}
          {study_recommendations.length > 0 && (
            <View style={styles.actionBox}>
              <Text style={styles.actionTitle}>📚 Evde Yapılabilecekler</Text>
              {study_recommendations.slice(0, 4).map((rec, i) => (
                <View key={i} style={styles.actionItem}>
                  <Text style={styles.actionBullet}>•</Text>
                  <Text style={styles.actionText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Footer */}
        <FooterSection
          pageNumber={1}
          totalPages={1}
          generatedAt={calculation_metadata.calculated_at}
          version={calculation_metadata.analytics_version}
          showQRCode={options?.showQRCode}
        />
      </Page>
    </Document>
  );
}

// ==================== SUB-COMPONENTS ====================

interface TrendSummaryProps {
  direction: 'up' | 'down' | 'stable' | null;
  explanation?: string;
  velocity?: number;
}

function TrendSummary({ direction, explanation, velocity }: TrendSummaryProps): React.ReactElement {
  const icons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  };
  
  const titles = {
    up: 'Yükseliş Trendi',
    down: 'Dikkat: Düşüş Trendi',
    stable: 'Stabil Performans'
  };
  
  const colors = {
    up: COLORS.success,
    down: COLORS.warning,
    stable: COLORS.text.secondary
  };
  
  if (!direction) return <View />;
  
  return (
    <View style={styles.trendBox}>
      <Text style={styles.trendIcon}>{icons[direction]}</Text>
      <View style={styles.trendContent}>
        <Text style={[styles.trendTitle, { color: colors[direction] }]}>
          {titles[direction]}
        </Text>
        <Text style={styles.trendText}>
          {explanation || 'Son sınavlar analiz edildi.'}
        </Text>
      </View>
    </View>
  );
}

// ==================== EXPORT ====================

export default ParentReportTemplate;

