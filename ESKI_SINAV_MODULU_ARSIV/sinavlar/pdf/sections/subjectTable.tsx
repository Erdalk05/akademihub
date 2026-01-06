/**
 * ============================================
 * AkademiHub - PDF Subject Table Section
 * ============================================
 * 
 * PHASE 4 - Ders Bazlı Tablo Bölümü
 * 
 * İÇERİK:
 * - Ders adı
 * - Doğru/Yanlış/Boş
 * - Net
 * - Sınıf ortalaması
 * - Başarı yüzdesi
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, getSuccessColor } from '../constants/colors';
import { TYPOGRAPHY, SPACING, TABLE_STYLES, BORDER_RADIUS } from '../constants/fonts';
import { formatNet, formatPercent, getSubjectName } from '../utils/formatters';

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
  
  table: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: BORDER_RADIUS.sm,
    borderTopRightRadius: BORDER_RADIUS.sm
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border
  },
  
  tableRowAlt: {
    backgroundColor: COLORS.background.secondary
  },
  
  tableRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderBottomRightRadius: BORDER_RADIUS.sm
  },
  
  headerCell: {
    padding: TABLE_STYLES.cellPadding.vertical,
    paddingHorizontal: TABLE_STYLES.cellPadding.horizontal
  },
  
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
    textAlign: 'center'
  },
  
  cell: {
    padding: TABLE_STYLES.cellPadding.vertical,
    paddingHorizontal: TABLE_STYLES.cellPadding.horizontal,
    justifyContent: 'center'
  },
  
  cellText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    textAlign: 'center'
  },
  
  subjectCell: {
    textAlign: 'left',
    fontWeight: TYPOGRAPHY.fontWeight.medium
  },
  
  successBadge: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.sm
  },
  
  // Kolon genişlikleri
  colSubject: { width: '20%' },
  colCorrect: { width: '10%' },
  colWrong: { width: '10%' },
  colEmpty: { width: '10%' },
  colNet: { width: '15%' },
  colClassAvg: { width: '15%' },
  colSuccess: { width: '20%' }
});

// ==================== TYPES ====================

interface SubjectData {
  code: string;
  name?: string;
  net: number;
  correct: number;
  wrong: number;
  empty: number;
  rate: number;
  class_avg?: number;
}

interface SubjectTableProps {
  subjects: Record<string, SubjectData>;
  showClassAvg?: boolean;
}

// ==================== COMPONENT ====================

/**
 * Ders bazlı performans tablosu
 */
export function SubjectTable({ 
  subjects, 
  showClassAvg = true 
}: SubjectTableProps): React.ReactElement {
  const subjectList = Object.entries(subjects);
  
  if (subjectList.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Ders Bazlı Analiz</Text>
        <View style={{ padding: SPACING.md, alignItems: 'center' }}>
          <Text style={{ color: COLORS.text.muted }}>Ders verisi bulunamadı</Text>
        </View>
      </View>
    );
  }
  
  // Toplam hesapla
  const totals = subjectList.reduce((acc, [, s]) => ({
    correct: acc.correct + s.correct,
    wrong: acc.wrong + s.wrong,
    empty: acc.empty + s.empty,
    net: acc.net + s.net
  }), { correct: 0, wrong: 0, empty: 0, net: 0 });
  
  const totalQuestions = totals.correct + totals.wrong + totals.empty;
  const totalRate = totalQuestions > 0 ? totals.correct / totalQuestions : 0;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📚 Ders Bazlı Analiz</Text>
      
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <View style={[styles.headerCell, styles.colSubject]}>
            <Text style={[styles.headerText, { textAlign: 'left' }]}>Ders</Text>
          </View>
          <View style={[styles.headerCell, styles.colCorrect]}>
            <Text style={styles.headerText}>Doğru</Text>
          </View>
          <View style={[styles.headerCell, styles.colWrong]}>
            <Text style={styles.headerText}>Yanlış</Text>
          </View>
          <View style={[styles.headerCell, styles.colEmpty]}>
            <Text style={styles.headerText}>Boş</Text>
          </View>
          <View style={[styles.headerCell, styles.colNet]}>
            <Text style={styles.headerText}>Net</Text>
          </View>
          {showClassAvg && (
            <View style={[styles.headerCell, styles.colClassAvg]}>
              <Text style={styles.headerText}>Sınıf Ort.</Text>
            </View>
          )}
          <View style={[styles.headerCell, styles.colSuccess]}>
            <Text style={styles.headerText}>Başarı</Text>
          </View>
        </View>
        
        {/* Rows */}
        {subjectList.map(([code, subject], index) => {
          const isLast = index === subjectList.length - 1 && !showClassAvg;
          const isAlt = index % 2 === 1;
          const successColor = getSuccessColor(subject.rate);
          
          return (
            <View 
              key={code} 
              style={{
                ...styles.tableRow,
                ...(isAlt ? styles.tableRowAlt : {}),
                ...(isLast ? styles.tableRowLast : {})
              }}
            >
              <View style={[styles.cell, styles.colSubject]}>
                <Text style={[styles.cellText, styles.subjectCell]}>
                  {getSubjectName(code)}
                </Text>
              </View>
              <View style={[styles.cell, styles.colCorrect]}>
                <Text style={[styles.cellText, { color: COLORS.success }]}>
                  {subject.correct}
                </Text>
              </View>
              <View style={[styles.cell, styles.colWrong]}>
                <Text style={[styles.cellText, { color: COLORS.danger }]}>
                  {subject.wrong}
                </Text>
              </View>
              <View style={[styles.cell, styles.colEmpty]}>
                <Text style={[styles.cellText, { color: COLORS.text.muted }]}>
                  {subject.empty}
                </Text>
              </View>
              <View style={[styles.cell, styles.colNet]}>
                <Text style={[styles.cellText, { fontWeight: 600 }]}>
                  {formatNet(subject.net)}
                </Text>
              </View>
              {showClassAvg && (
                <View style={[styles.cell, styles.colClassAvg]}>
                  <Text style={[styles.cellText, { color: COLORS.text.secondary }]}>
                    {subject.class_avg !== undefined ? formatNet(subject.class_avg) : '-'}
                  </Text>
                </View>
              )}
              <View style={[styles.cell, styles.colSuccess]}>
                <View style={[styles.successBadge, { backgroundColor: successColor.bg }]}>
                  <Text style={[styles.cellText, { color: successColor.text, fontWeight: 600 }]}>
                    {formatPercent(subject.rate)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
        
        {/* Toplam satırı */}
        <View style={[styles.tableRow, { backgroundColor: COLORS.background.accent, borderBottomWidth: 0 }]}>
          <View style={[styles.cell, styles.colSubject]}>
            <Text style={[styles.cellText, styles.subjectCell, { fontWeight: 700 }]}>
              TOPLAM
            </Text>
          </View>
          <View style={[styles.cell, styles.colCorrect]}>
            <Text style={[styles.cellText, { fontWeight: 700, color: COLORS.success }]}>
              {totals.correct}
            </Text>
          </View>
          <View style={[styles.cell, styles.colWrong]}>
            <Text style={[styles.cellText, { fontWeight: 700, color: COLORS.danger }]}>
              {totals.wrong}
            </Text>
          </View>
          <View style={[styles.cell, styles.colEmpty]}>
            <Text style={[styles.cellText, { fontWeight: 700, color: COLORS.text.muted }]}>
              {totals.empty}
            </Text>
          </View>
          <View style={[styles.cell, styles.colNet]}>
            <Text style={[styles.cellText, { fontWeight: 700, color: COLORS.primary }]}>
              {formatNet(totals.net)}
            </Text>
          </View>
          {showClassAvg && (
            <View style={[styles.cell, styles.colClassAvg]}>
              <Text style={styles.cellText}>-</Text>
            </View>
          )}
          <View style={[styles.cell, styles.colSuccess]}>
            <View style={[styles.successBadge, { backgroundColor: getSuccessColor(totalRate).bg }]}>
              <Text style={[styles.cellText, { color: getSuccessColor(totalRate).text, fontWeight: 700 }]}>
                {formatPercent(totalRate)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ==================== COMPACT TABLE ====================

/**
 * Kompakt ders tablosu (veli raporu için)
 */
export function CompactSubjectTable({ 
  subjects 
}: { subjects: Record<string, SubjectData> }): React.ReactElement {
  const subjectList = Object.entries(subjects);
  
  if (subjectList.length === 0) {
    return <View />;
  }
  
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {subjectList.map(([code, subject]) => {
        const successColor = getSuccessColor(subject.rate);
        
        return (
          <View 
            key={code}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: SPACING.xs,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.border
            }}
          >
            <Text style={{ flex: 1, fontSize: 10, color: COLORS.text.primary }}>
              {getSubjectName(code)}
            </Text>
            <Text style={{ width: 50, fontSize: 10, textAlign: 'center', fontWeight: 600 }}>
              {formatNet(subject.net)}
            </Text>
            <View style={[styles.successBadge, { backgroundColor: successColor.bg, marginLeft: 8 }]}>
              <Text style={{ fontSize: 9, color: successColor.text, fontWeight: 600 }}>
                {formatPercent(subject.rate)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ==================== EXPORT ====================

export default {
  SubjectTable,
  CompactSubjectTable
};

