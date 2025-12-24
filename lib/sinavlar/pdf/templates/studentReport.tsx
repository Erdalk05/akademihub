/**
 * ============================================
 * AkademiHub - Student Report Template
 * ============================================
 * 
 * PHASE 4 - Öğrenci Karnesi Şablonu
 * 
 * TASARIM PRENSİPLERİ:
 * - Motivasyonel ve pozitif ton
 * - Detaylı analiz
 * - Görsel zenginlik
 * - Öğrencinin anlayabileceği dil
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SPACING, PAGE_MARGINS, PAGE_SIZES } from '../constants/fonts';
import { 
  HeaderSection, 
  SummaryHeader 
} from '../sections/header';
import { SubjectTable } from '../sections/subjectTable';
import { PerformanceChartsSection } from '../sections/performanceCharts';
import { RiskAssessmentSection } from '../sections/riskAssessment';
import { RecommendationsSection } from '../sections/recommendations';
import { FooterSection, Watermark, ConfidentialBanner } from '../sections/footer';
import type { StudentAnalyticsOutput } from '../../analytics/orchestrator/types';
import type { PDFOptions, SchoolInfo, ExamInfo } from '../types';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_MARGINS.normal.top,
    paddingRight: PAGE_MARGINS.normal.right,
    paddingBottom: PAGE_MARGINS.normal.bottom + 20, // Footer için ekstra
    paddingLeft: PAGE_MARGINS.normal.left,
    fontFamily: 'Helvetica',
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary
  },
  
  content: {
    flex: 1
  },
  
  motivationalBanner: {
    backgroundColor: COLORS.background.accent,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    alignItems: 'center'
  },
  
  motivationalText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center'
  },
  
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg
  }
});

// ==================== TYPES ====================

interface StudentReportProps {
  analytics: StudentAnalyticsOutput;
  options?: PDFOptions;
  schoolInfo?: SchoolInfo;
  examInfo?: ExamInfo;
}

// ==================== COMPONENT ====================

/**
 * Öğrenci Raporu Şablonu
 * 
 * Motivasyonel, detaylı ve görsel olarak zengin
 */
export function StudentReportTemplate({
  analytics,
  options,
  schoolInfo,
  examInfo
}: StudentReportProps): React.ReactElement {
  // Veri çıkarımı
  const {
    student_id,
    exam_id,
    summary,
    analytics: analyticsData,
    trends,
    risk,
    strengths,
    weaknesses,
    improvement_priorities,
    study_recommendations,
    calculation_metadata
  } = analytics;
  
  // Motivasyonel mesaj seç
  const motivationalMessage = getMotivationalMessage(
    summary.percentile,
    trends.direction,
    summary.total_net
  );
  
  // String array'e dönüştür
  const strengthsArray = normalizeToStringArray(strengths);
  const weaknessesArray = normalizeToStringArray(weaknesses);
  const prioritiesArray = normalizeToStringArray(improvement_priorities);
  
  return (
    <Document
      title={`Öğrenci Karnesi - ${student_id}`}
      author="AkademiHub"
      subject="Sınav Analiz Raporu"
      keywords="sınav, analiz, karne, LGS, TYT"
      creator="AkademiHub Analiz Sistemi"
      producer="AkademiHub PDF Engine"
    >
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {options?.showWatermark !== false && <Watermark />}
        
        <View style={styles.content}>
          {/* Gizlilik banner'ı */}
          <ConfidentialBanner />
          
          {/* Header */}
          <HeaderSection
            studentName={analytics.ai_metadata?.student_name || 'Öğrenci'}
            studentNo={analytics.ai_metadata?.student_no}
            className={analytics.ai_metadata?.class_name}
            examName={examInfo?.name || 'Sınav'}
            examDate={examInfo?.date || new Date().toISOString()}
            schoolInfo={schoolInfo}
            logoUrl={options?.logoUrl}
            reportType="student"
          />
          
          {/* Özet istatistikler */}
          <SummaryHeader
            totalNet={summary.total_net}
            totalCorrect={summary.total_correct}
            totalWrong={summary.total_wrong}
            totalEmpty={summary.total_empty}
            rankInExam={summary.rank_in_exam}
            rankInClass={summary.rank_in_class}
            percentile={summary.percentile}
          />
          
          {/* Motivasyonel banner */}
          <View style={styles.motivationalBanner}>
            <Text style={styles.motivationalText}>
              {motivationalMessage}
            </Text>
          </View>
          
          {/* Performans grafikleri */}
          {options?.showCharts !== false && (
            <PerformanceChartsSection
              subjectPerformance={analyticsData.subject_performance}
              trends={{
                direction: trends.direction,
                net_trend: trends.net_trend,
                velocity: trends.velocity,
                consistency: trends.consistency,
                trend_score: trends.trend_score,
                explanation: trends.explanation
              }}
              totalNet={summary.total_net}
              classAvg={summary.vs_class_avg ? summary.total_net - summary.vs_class_avg : null}
            />
          )}
          
          {/* Ders tablosu */}
          <SubjectTable
            subjects={analyticsData.subject_performance}
            showClassAvg={true}
          />
          
          {/* Güçlü/zayıf yönler ve öneriler */}
          <RecommendationsSection
            strengths={strengthsArray}
            weaknesses={weaknessesArray}
            improvementPriorities={prioritiesArray}
            studyRecommendations={study_recommendations}
          />
          
          {/* Risk değerlendirmesi (sadece orta/yüksek/kritik ise göster) */}
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Motivasyonel mesaj seçer
 */
function getMotivationalMessage(
  percentile: number | null,
  trendDirection: string | null,
  totalNet: number
): string {
  // Yüzdelik bazlı mesajlar
  if (percentile !== null) {
    if (percentile >= 90) {
      return '🌟 Muhteşem bir performans! En iyi %10 içindesin!';
    }
    if (percentile >= 75) {
      return '🎯 Harika gidiyorsun! Ortalamanın çok üzerindesin!';
    }
    if (percentile >= 50) {
      return '💪 İyi bir performans! Biraz daha çabayla zirveye ulaşabilirsin!';
    }
    if (percentile >= 25) {
      return '📈 Gelişim potansiyelin var! Düzenli çalışmayla başarı senin!';
    }
    return '🚀 Her başarı küçük adımlarla başlar. Vazgeçme!';
  }
  
  // Trend bazlı mesajlar
  if (trendDirection === 'up') {
    return '📈 Harika! Performansın yükseliyor! Bu tempoyu koru!';
  }
  if (trendDirection === 'down') {
    return '💪 Zorlu dönemler olabilir. Birlikte üstesinden geleceğiz!';
  }
  
  // Genel mesaj
  if (totalNet >= 70) {
    return '🌟 Çok başarılı bir sınav geçirdin!';
  }
  if (totalNet >= 50) {
    return '💪 İyi bir performans! Gelişmeye devam!';
  }
  
  return '🎯 Her sınav yeni bir fırsat! Hedefe odaklan!';
}

/**
 * Herhangi bir array'i string array'e dönüştürür
 */
function normalizeToStringArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item?.topic) return item.topic;
    if (item?.name) return item.name;
    return String(item);
  }).filter(Boolean);
}

// ==================== EXPORT ====================

export default StudentReportTemplate;

