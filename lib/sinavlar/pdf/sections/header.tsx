/**
 * ============================================
 * AkademiHub - PDF Header Section
 * ============================================
 * 
 * PHASE 4 - Rapor Başlık Bölümü
 * 
 * İÇERİK:
 * - Okul logosu ve adı
 * - Öğrenci bilgileri
 * - Sınav bilgileri
 * - Tarih
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/fonts';
import { formatDate } from '../utils/formatters';
import type { HeaderProps, SchoolInfo } from '../types';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: 'solid'
  },
  
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  
  logo: {
    width: 50,
    height: 50,
    marginRight: SPACING.md
  },
  
  schoolInfo: {
    flexDirection: 'column'
  },
  
  schoolName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: 2
  },
  
  reportTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: 4
  },
  
  examInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary
  },
  
  rightSection: {
    alignItems: 'flex-end'
  },
  
  studentInfo: {
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 180
  },
  
  studentName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: 4
  },
  
  studentDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: 2
  },
  
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    marginTop: SPACING.xs
  }
});

// ==================== COMPONENT ====================

interface HeaderSectionProps extends HeaderProps {
  reportTitle?: string;
  reportType?: 'student' | 'parent' | 'teacher';
}

/**
 * PDF Header Bölümü
 */
export function HeaderSection({
  studentName,
  studentNo,
  className,
  examName,
  examDate,
  schoolInfo,
  logoUrl,
  reportTitle = 'Sınav Analiz Raporu',
  reportType = 'student'
}: HeaderSectionProps): React.ReactElement {
  const reportTypeLabels = {
    student: 'Öğrenci Karnesi',
    parent: 'Veli Bilgilendirme Raporu',
    teacher: 'Öğretmen Analiz Raporu'
  };
  
  return (
    <View style={styles.header}>
      {/* Sol Bölüm - Logo ve Okul */}
      <View style={styles.leftSection}>
        {logoUrl && (
          <Image src={logoUrl} style={styles.logo} />
        )}
        
        <View style={styles.schoolInfo}>
          {schoolInfo?.name && (
            <Text style={styles.schoolName}>{schoolInfo.name}</Text>
          )}
          <Text style={styles.reportTitle}>{reportTypeLabels[reportType]}</Text>
          <Text style={styles.examInfo}>{examName}</Text>
        </View>
      </View>
      
      {/* Sağ Bölüm - Öğrenci Bilgileri */}
      <View style={styles.rightSection}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{studentName || 'İsimsiz Öğrenci'}</Text>
          
          {studentNo && (
            <Text style={styles.studentDetail}>No: {studentNo}</Text>
          )}
          
          {className && (
            <Text style={styles.studentDetail}>Sınıf: {className}</Text>
          )}
          
          <Text style={styles.dateText}>
            Sınav Tarihi: {formatDate(examDate)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ==================== SUMMARY HEADER ====================

const summaryStyles = StyleSheet.create({
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.accent,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg
  },
  
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary
  },
  
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: 2
  },
  
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md
  }
});

interface SummaryHeaderProps {
  totalNet: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  rankInExam?: number | null;
  rankInClass?: number | null;
  percentile?: number | null;
}

/**
 * Özet istatistikler başlığı
 */
export function SummaryHeader({
  totalNet,
  totalCorrect,
  totalWrong,
  totalEmpty,
  rankInExam,
  rankInClass,
  percentile
}: SummaryHeaderProps): React.ReactElement {
  return (
    <View style={summaryStyles.summaryBox}>
      <View style={summaryStyles.summaryItem}>
        <Text style={summaryStyles.summaryValue}>{totalNet.toFixed(2)}</Text>
        <Text style={summaryStyles.summaryLabel}>Toplam Net</Text>
      </View>
      
      <View style={summaryStyles.divider} />
      
      <View style={summaryStyles.summaryItem}>
        <Text style={summaryStyles.summaryValue}>{totalCorrect}</Text>
        <Text style={summaryStyles.summaryLabel}>Doğru</Text>
      </View>
      
      <View style={summaryStyles.divider} />
      
      <View style={summaryStyles.summaryItem}>
        <Text style={summaryStyles.summaryValue}>{totalWrong}</Text>
        <Text style={summaryStyles.summaryLabel}>Yanlış</Text>
      </View>
      
      <View style={summaryStyles.divider} />
      
      <View style={summaryStyles.summaryItem}>
        <Text style={summaryStyles.summaryValue}>{totalEmpty}</Text>
        <Text style={summaryStyles.summaryLabel}>Boş</Text>
      </View>
      
      {rankInClass && (
        <>
          <View style={summaryStyles.divider} />
          <View style={summaryStyles.summaryItem}>
            <Text style={summaryStyles.summaryValue}>{rankInClass}.</Text>
            <Text style={summaryStyles.summaryLabel}>Sınıf Sırası</Text>
          </View>
        </>
      )}
      
      {percentile !== null && percentile !== undefined && (
        <>
          <View style={summaryStyles.divider} />
          <View style={summaryStyles.summaryItem}>
            <Text style={summaryStyles.summaryValue}>%{percentile}</Text>
            <Text style={summaryStyles.summaryLabel}>Yüzdelik</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ==================== EXPORT ====================

export default {
  HeaderSection,
  SummaryHeader
};

