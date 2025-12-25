'use client';

/**
 * AkademiHub Akademik Analiz Dashboard
 * Yönetici Özet Ekranı
 * 
 * Tek bakışta tüm önemli metrikler ve görsel analizler
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Plus,
  BookOpen,
} from 'lucide-react';
import { colors, chartColors } from './theme';
import { EvaluationResult } from '../core/types';

// ============================================
// 📋 TİPLER
// ============================================

interface DashboardProps {
  recentExams?: {
    id: string;
    name: string;
    date: string;
    studentCount: number;
    averageScore: number;
    conflictCount: number;
  }[];
  stats?: {
    totalStudents: number;
    totalExams: number;
    averageScore: number;
    conflictRate: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
  };
  subjectStats?: {
    name: string;
    averagePercentage: number;
    color: string;
  }[];
  onNewExam?: () => void;
  onViewExam?: (examId: string) => void;
  onExportExam?: (examId: string) => void;
}

// ============================================
// 🎨 STİLLER
// ============================================

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  
  subtitle: {
    fontSize: '1rem',
    color: colors.text.secondary,
    marginTop: '0.25rem',
  },
  
  newExamButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: colors.primary[500],
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px 0 rgba(37, 211, 102, 0.39)',
  },
  
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  
  metricCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    transition: 'all 0.3s ease',
  },
  
  metricIcon: (color: string) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color + '15',
    marginBottom: '1rem',
  }),
  
  metricValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: '0.25rem',
  },
  
  metricLabel: {
    fontSize: '0.875rem',
    color: colors.text.secondary,
  },
  
  metricTrend: (isPositive: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: isPositive ? colors.success : colors.error,
    marginTop: '0.5rem',
  }),
  
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  chartTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  examListCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  examListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  
  examItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '0.75rem',
    backgroundColor: colors.background.subtle,
    marginBottom: '0.75rem',
    transition: 'all 0.2s',
  },
  
  examInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  
  examIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },
  
  examActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  
  actionButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: colors.text.secondary,
  },
};

// ============================================
// 📦 ANA BİLEŞEN
// ============================================

export function Dashboard({
  recentExams = [],
  stats = {
    totalStudents: 0,
    totalExams: 0,
    averageScore: 0,
    conflictRate: 0,
    trend: 'stable',
    trendValue: 0,
  },
  subjectStats = [],
  onNewExam,
  onViewExam,
  onExportExam,
}: DashboardProps) {
  return (
    <div style={styles.container}>
      {/* Header */}
      <motion.div 
        style={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 style={styles.title}>
            <BarChart3 size={32} color={colors.primary[500]} />
            Akademik Analiz
          </h1>
          <p style={styles.subtitle}>
            Sınav sonuçlarınızı analiz edin ve öğrenci performansını takip edin
          </p>
        </div>
        <button 
          style={styles.newExamButton}
          onClick={onNewExam}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={20} />
          Yeni Sınav
        </button>
      </motion.div>

      {/* Metrik Kartları */}
      <div style={styles.metricsGrid}>
        <MetricCard
          icon={<Users size={24} color={colors.primary[500]} />}
          iconBg={colors.primary[500]}
          value={stats.totalStudents.toLocaleString('tr-TR')}
          label="Toplam Öğrenci"
          trend={stats.trend}
          trendValue={stats.trendValue}
          delay={0}
        />
        <MetricCard
          icon={<FileText size={24} color={colors.info} />}
          iconBg={colors.info}
          value={stats.totalExams.toString()}
          label="Toplam Sınav"
          delay={0.1}
        />
        <MetricCard
          icon={<Award size={24} color={colors.success} />}
          iconBg={colors.success}
          value={stats.averageScore.toFixed(1)}
          label="Ortalama Puan"
          trend="up"
          trendValue={2.5}
          delay={0.2}
        />
        <MetricCard
          icon={<AlertCircle size={24} color={colors.warning} />}
          iconBg={colors.warning}
          value={`%${stats.conflictRate.toFixed(1)}`}
          label="Çakışma Oranı"
          trend={stats.conflictRate < 5 ? 'up' : 'down'}
          trendValue={0.8}
          delay={0.3}
        />
      </div>

      {/* Grafikler */}
      <div style={styles.chartsGrid}>
        {/* Ders Bazlı Başarı */}
        <motion.div 
          style={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 style={styles.chartTitle}>
            <BarChart3 size={20} color={colors.primary[500]} />
            Ders Bazlı Başarı Oranları
          </h3>
          <SubjectBarChart subjects={subjectStats} />
        </motion.div>

        {/* Puan Dağılımı */}
        <motion.div 
          style={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 style={styles.chartTitle}>
            <PieChart size={20} color={colors.info} />
            Başarı Dağılımı
          </h3>
          <PerformanceDonut />
        </motion.div>
      </div>

      {/* Son Sınavlar */}
      <motion.div 
        style={styles.examListCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div style={styles.examListHeader}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: colors.text.primary }}>
            <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Son Sınavlar
          </h3>
          <a 
            href="#" 
            style={{ 
              color: colors.primary[500], 
              fontSize: '0.875rem', 
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Tümünü Gör →
          </a>
        </div>

        {recentExams.length > 0 ? (
          recentExams.map((exam, index) => (
            <motion.div
              key={exam.id}
              style={styles.examItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              whileHover={{ backgroundColor: colors.primary[50], transform: 'translateX(4px)' }}
            >
              <div style={styles.examInfo}>
                <div style={styles.examIcon}>
                  <BookOpen size={22} color={colors.primary[500]} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: colors.text.primary }}>
                    {exam.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
                    {exam.date} • {exam.studentCount} öğrenci
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: colors.primary[600] }}>
                    {exam.averageScore.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>
                    Ort. Puan
                  </div>
                </div>
                {exam.conflictCount > 0 && (
                  <div style={{ 
                    backgroundColor: colors.conflict.background,
                    color: colors.conflict.medium,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}>
                    {exam.conflictCount} çakışma
                  </div>
                )}
                <div style={styles.examActions}>
                  <button
                    style={{ 
                      ...styles.actionButton, 
                      backgroundColor: colors.primary[100],
                    }}
                    onClick={() => onViewExam?.(exam.id)}
                    title="Görüntüle"
                  >
                    <Eye size={18} color={colors.primary[600]} />
                  </button>
                  <button
                    style={{ 
                      ...styles.actionButton, 
                      backgroundColor: colors.secondary[100],
                    }}
                    onClick={() => onExportExam?.(exam.id)}
                    title="İndir"
                  >
                    <Download size={18} color={colors.secondary[600]} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <FileText size={48} color={colors.secondary[300]} style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Henüz sınav yok</div>
            <div style={{ fontSize: '0.875rem' }}>
              İlk sınavınızı oluşturmak için "Yeni Sınav" butonuna tıklayın
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// 📊 METRİK KARTI
// ============================================

function MetricCard({
  icon,
  iconBg,
  value,
  label,
  trend,
  trendValue,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  delay?: number;
}) {
  return (
    <motion.div
      style={styles.metricCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
    >
      <div style={styles.metricIcon(iconBg)}>
        {icon}
      </div>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
      {trend && trendValue !== undefined && (
        <div style={styles.metricTrend(trend === 'up')}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          %{trendValue.toFixed(1)} {trend === 'up' ? 'artış' : 'azalış'}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// 📊 DERS BAZLI BAR CHART
// ============================================

function SubjectBarChart({
  subjects = [
    { name: 'Türkçe', averagePercentage: 72, color: chartColors.subjects[0] },
    { name: 'Matematik', averagePercentage: 58, color: chartColors.subjects[1] },
    { name: 'Fen Bilimleri', averagePercentage: 65, color: chartColors.subjects[2] },
    { name: 'Sosyal Bilimler', averagePercentage: 78, color: chartColors.subjects[3] },
    { name: 'İngilizce', averagePercentage: 55, color: chartColors.subjects[4] },
    { name: 'Din Kültürü', averagePercentage: 82, color: chartColors.subjects[5] },
  ],
}: {
  subjects?: { name: string; averagePercentage: number; color: string }[];
}) {
  return (
    <div style={{ padding: '1rem 0' }}>
      {subjects.map((subject, index) => (
        <div key={subject.name} style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.375rem',
            fontSize: '0.875rem',
          }}>
            <span style={{ fontWeight: '500', color: colors.text.primary }}>
              {subject.name}
            </span>
            <span style={{ fontWeight: '600', color: subject.color }}>
              %{subject.averagePercentage}
            </span>
          </div>
          <div style={{ 
            height: '10px', 
            backgroundColor: colors.secondary[100],
            borderRadius: '5px',
            overflow: 'hidden',
          }}>
            <motion.div
              style={{
                height: '100%',
                backgroundColor: subject.color,
                borderRadius: '5px',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${subject.averagePercentage}%` }}
              transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 📊 PERFORMANS DONUT
// ============================================

function PerformanceDonut() {
  const data = [
    { label: 'Mükemmel', value: 15, color: chartColors.performance.excellent },
    { label: 'İyi', value: 35, color: chartColors.performance.good },
    { label: 'Orta', value: 30, color: chartColors.performance.average },
    { label: 'Düşük', value: 20, color: chartColors.performance.poor },
  ];
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1rem' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;
            cumulativePercentage += percentage;
            
            return (
              <motion.circle
                key={item.label}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray }}
                transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.text.primary }}>
            {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>Öğrenci</div>
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ flex: 1 }}>
        {data.map((item) => (
          <div 
            key={item.label}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '3px',
              backgroundColor: item.color,
            }} />
            <span style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
              {item.label}
            </span>
            <span style={{ 
              marginLeft: 'auto', 
              fontWeight: '600',
              color: colors.text.primary,
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

