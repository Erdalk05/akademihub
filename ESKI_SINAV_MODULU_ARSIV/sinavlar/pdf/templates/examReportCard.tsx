/**
 * AkademiHub - Sınav Karnesi PDF Template
 * Premium Özel Okul Kalitesinde Tasarım
 * 
 * Özellikler:
 * - Tek sayfa A4 format
 * - Okul logosu ve bilgileri
 * - Ders bazlı performans tablosu
 * - Sıralama bilgileri
 * - Görsel başarı grafiği
 * - Öğretmen notu alanı
 * - Türkçe karakter desteği
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { colors, typography, spacing } from '../constants';
import type { StudentResult, SubjectResult } from '../../core/types';

// ============================================
// 🎨 FONT KAYIT
// ============================================

// Inter font - Türkçe karakter desteği
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 },
  ],
});

// ============================================
// 📋 TİPLER
// ============================================

export interface ExamReportCardProps {
  // Öğrenci bilgileri
  student: StudentResult;
  
  // Sınav bilgileri
  examInfo: {
    name: string;
    date: string;
    type: string;
    totalStudents: number;
  };
  
  // Okul bilgileri
  schoolInfo: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
  };
  
  // Sınıf sıralaması
  classRank?: number;
  classSize?: number;
  
  // Öğretmen notu (AI tarafından üretilebilir)
  teacherNote?: string;
}

// ============================================
// 🎨 STİLLER
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    backgroundColor: '#FFFFFF',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#25D366',
  },
  
  logo: {
    width: 60,
    height: 60,
  },
  
  schoolInfo: {
    flex: 1,
    marginLeft: 15,
  },
  
  schoolName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A',
  },
  
  schoolAddress: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  
  reportTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#25D366',
    textAlign: 'right',
  },
  
  examName: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 2,
  },
  
  examDate: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
  },
  
  // Student Info Card
  studentCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  
  studentInfo: {
    flex: 1,
  },
  
  studentName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0F172A',
  },
  
  studentMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
  },
  
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 8,
    padding: 12,
    minWidth: 70,
  },
  
  rankNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  
  rankLabel: {
    fontSize: 8,
    color: '#FFFFFF',
    marginTop: 2,
  },
  
  // Summary Stats
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
  },
  
  summaryLabel: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  
  // Performance Table
  tableSection: {
    marginBottom: 15,
  },
  
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#0F172A',
  },
  
  tableCellHeader: {
    padding: 8,
    fontSize: 8,
    fontWeight: 600,
    color: '#64748B',
  },
  
  colSubject: { width: '25%' },
  colCorrect: { width: '12%', textAlign: 'center' },
  colWrong: { width: '12%', textAlign: 'center' },
  colEmpty: { width: '12%', textAlign: 'center' },
  colNet: { width: '15%', textAlign: 'center' },
  colPercent: { width: '12%', textAlign: 'center' },
  colBar: { width: '12%' },
  
  // Progress Bar
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Rankings Section
  rankingsSection: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  
  rankingCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  
  rankingValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#25D366',
  },
  
  rankingTotal: {
    fontSize: 10,
    color: '#64748B',
  },
  
  rankingLabel: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 4,
  },
  
  // Visual Chart (Simple Bar)
  chartSection: {
    marginBottom: 15,
  },
  
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 80,
    paddingTop: 10,
  },
  
  chartBar: {
    width: 30,
    borderRadius: 4,
    alignItems: 'center',
  },
  
  chartLabel: {
    fontSize: 7,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  
  chartValue: {
    fontSize: 7,
    fontWeight: 600,
    color: '#FFFFFF',
    position: 'absolute',
    top: 4,
  },
  
  // Teacher Note
  teacherNoteSection: {
    backgroundColor: '#FEF9C3',
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
  },
  
  teacherNoteTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: '#854D0E',
    marginBottom: 6,
  },
  
  teacherNoteText: {
    fontSize: 9,
    color: '#713F12',
    lineHeight: 1.5,
  },
  
  teacherNotePlaceholder: {
    fontSize: 8,
    color: '#A3A3A3',
    fontStyle: 'italic',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
  },
  
  footerBrand: {
    fontSize: 8,
    fontWeight: 600,
    color: '#25D366',
  },
});

// ============================================
// 🎨 RENK HELPERS
// ============================================

function getPercentageColor(percentage: number): string {
  if (percentage >= 80) return '#22C55E'; // Green
  if (percentage >= 60) return '#84CC16'; // Lime
  if (percentage >= 40) return '#F59E0B'; // Amber
  if (percentage >= 20) return '#F97316'; // Orange
  return '#EF4444'; // Red
}

function getSubjectColor(index: number): string {
  const colors = ['#25D366', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];
  return colors[index % colors.length];
}

// ============================================
// 📄 ANA TEMPLATE
// ============================================

export function ExamReportCard({
  student,
  examInfo,
  schoolInfo,
  classRank,
  classSize,
  teacherNote,
}: ExamReportCardProps) {
  const generatedAt = new Date().toLocaleString('tr-TR');
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {schoolInfo.logo && (
              <Image src={schoolInfo.logo} style={styles.logo} />
            )}
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{schoolInfo.name}</Text>
              {schoolInfo.address && (
                <Text style={styles.schoolAddress}>{schoolInfo.address}</Text>
              )}
            </View>
          </View>
          <View>
            <Text style={styles.reportTitle}>📊 SINAV KARNESİ</Text>
            <Text style={styles.examName}>{examInfo.name}</Text>
            <Text style={styles.examDate}>{examInfo.date}</Text>
          </View>
        </View>

        {/* Student Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentMeta}>
              Öğrenci No: {student.studentNo} • Kitapçık: {student.booklet || '-'}
            </Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankNumber}>{student.rank}</Text>
            <Text style={styles.rankLabel}>/ {examInfo.totalStudents}</Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={{ ...styles.summaryValue, color: '#22C55E' }}>
              {student.totalCorrect}
            </Text>
            <Text style={styles.summaryLabel}>Doğru</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={{ ...styles.summaryValue, color: '#EF4444' }}>
              {student.totalWrong}
            </Text>
            <Text style={styles.summaryLabel}>Yanlış</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={{ ...styles.summaryValue, color: '#94A3B8' }}>
              {student.totalEmpty}
            </Text>
            <Text style={styles.summaryLabel}>Boş</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={{ ...styles.summaryValue, color: '#3B82F6' }}>
              {student.totalNet.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Net</Text>
          </View>
          <View style={{ ...styles.summaryCard, backgroundColor: '#25D366' }}>
            <Text style={{ ...styles.summaryValue, color: '#FFFFFF' }}>
              {student.totalScore.toFixed(1)}
            </Text>
            <Text style={{ ...styles.summaryLabel, color: '#FFFFFF' }}>Puan</Text>
          </View>
        </View>

        {/* Performance Table */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>📚 Ders Bazlı Performans</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableCellHeader, ...styles.colSubject }}>Ders</Text>
              <Text style={{ ...styles.tableCellHeader, ...styles.colCorrect }}>Doğru</Text>
              <Text style={{ ...styles.tableCellHeader, ...styles.colWrong }}>Yanlış</Text>
              <Text style={{ ...styles.tableCellHeader, ...styles.colEmpty }}>Boş</Text>
              <Text style={{ ...styles.tableCellHeader, ...styles.colNet }}>Net</Text>
              <Text style={{ ...styles.tableCellHeader, ...styles.colPercent }}>Başarı %</Text>
              <Text style={{ ...styles.tableCellHeader, ...styles.colBar }}></Text>
            </View>
            
            {/* Table Rows */}
            {student.subjects.map((subject, index) => (
              <View 
                key={subject.subjectId} 
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                <Text style={{ ...styles.tableCell, ...styles.colSubject, fontWeight: 500 }}>
                  {subject.subjectName}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colCorrect, color: '#22C55E' }}>
                  {subject.correct}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colWrong, color: '#EF4444' }}>
                  {subject.wrong}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colEmpty, color: '#94A3B8' }}>
                  {subject.empty}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.colNet, fontWeight: 600 }}>
                  {subject.net.toFixed(2)}
                </Text>
                <Text style={{ 
                  ...styles.tableCell, 
                  ...styles.colPercent,
                  color: getPercentageColor(subject.percentage),
                  fontWeight: 600,
                }}>
                  %{subject.percentage}
                </Text>
                <View style={{ ...styles.colBar, padding: 6 }}>
                  <View style={styles.progressBarContainer}>
                    <View style={{
                      ...styles.progressBar,
                      width: `${subject.percentage}%`,
                      backgroundColor: getPercentageColor(subject.percentage),
                    }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Rankings */}
        <View style={styles.rankingsSection}>
          <View style={styles.rankingCard}>
            <Text style={styles.rankingValue}>{student.rank}</Text>
            <Text style={styles.rankingTotal}>/ {examInfo.totalStudents}</Text>
            <Text style={styles.rankingLabel}>Genel Sıralama</Text>
          </View>
          {classRank && classSize && (
            <View style={styles.rankingCard}>
              <Text style={styles.rankingValue}>{classRank}</Text>
              <Text style={styles.rankingTotal}>/ {classSize}</Text>
              <Text style={styles.rankingLabel}>Sınıf Sıralaması</Text>
            </View>
          )}
          <View style={styles.rankingCard}>
            <Text style={styles.rankingValue}>%{student.percentile}</Text>
            <Text style={styles.rankingTotal}></Text>
            <Text style={styles.rankingLabel}>Yüzdelik Dilim</Text>
          </View>
        </View>

        {/* Visual Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>📈 Ders Başarı Grafiği</Text>
          <View style={styles.chartContainer}>
            {student.subjects.slice(0, 6).map((subject, index) => (
              <View key={subject.subjectId} style={{ alignItems: 'center' }}>
                <View style={{
                  ...styles.chartBar,
                  height: Math.max(10, subject.percentage * 0.6),
                  backgroundColor: getSubjectColor(index),
                }}>
                  <Text style={styles.chartValue}>{subject.percentage}%</Text>
                </View>
                <Text style={styles.chartLabel}>
                  {subject.subjectName.substring(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Teacher Note */}
        <View style={styles.teacherNoteSection}>
          <Text style={styles.teacherNoteTitle}>📝 Öğretmen Değerlendirmesi</Text>
          {teacherNote ? (
            <Text style={styles.teacherNoteText}>{teacherNote}</Text>
          ) : (
            <Text style={styles.teacherNotePlaceholder}>
              Bu alan, öğretmen veya AI tarafından doldurulabilir. Öğrencinin güçlü ve 
              geliştirilmesi gereken yönleri hakkında kişiselleştirilmiş bir değerlendirme 
              için ayrılmıştır.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Oluşturulma: {generatedAt} • Bu belge {schoolInfo.name} için AkademiHub tarafından üretilmiştir.
          </Text>
          <Text style={styles.footerBrand}>AkademiHub</Text>
        </View>
      </Page>
    </Document>
  );
}

export default ExamReportCard;

