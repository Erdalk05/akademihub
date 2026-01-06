'use client';

/**
 * AkademiHub Öğrenci Profili
 * Akademik Gelişim Takibi ve Longitudinal Analiz
 * 
 * Özellikler:
 * - Tüm sınavlarda gelişim trendi
 * - Zayıf konu analizi (Kazanım)
 * - Ders bazlı performans karşılaştırması
 * - AI destekli öneriler
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  BookOpen,
  Calendar,
  Target,
  Zap,
  ChevronRight,
  Download,
  BarChart3,
} from 'lucide-react';
import { colors, chartColors } from './theme';
import type { StudentResult, SubjectResult } from '../core/types';

// ============================================
// 📋 TİPLER
// ============================================

interface ExamHistory {
  examId: string;
  examName: string;
  examDate: string;
  examType: string;
  result: StudentResult;
}

interface WeakTopic {
  topicId: string;
  topicName: string;
  subjectName: string;
  avgPercentage: number;
  examCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface StudentProfileProps {
  studentName: string;
  studentNo: string;
  className?: string;
  examHistory: ExamHistory[];
  weakTopics?: WeakTopic[];
  onDownloadPDF?: (examId: string) => void;
  onViewExam?: (examId: string) => void;
}

// ============================================
// 🎨 STİLLER
// ============================================

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: colors.primary[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  studentInfo: {
    flex: 1,
  },
  
  studentName: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: colors.text.primary,
  },
  
  studentMeta: {
    fontSize: '0.875rem',
    color: colors.text.secondary,
    marginTop: '0.25rem',
  },
  
  statsGrid: {
    display: 'flex',
    gap: '1rem',
  },
  
  statBadge: {
    textAlign: 'center' as const,
    padding: '0.75rem 1.25rem',
    backgroundColor: colors.background.subtle,
    borderRadius: '0.75rem',
  },
  
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: colors.primary[600],
  },
  
  statLabel: {
    fontSize: '0.75rem',
    color: colors.text.muted,
    marginTop: '0.25rem',
  },
  
  section: {
    marginBottom: '2rem',
  },
  
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  card: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  trendChart: {
    height: '250px',
    position: 'relative' as const,
  },
  
  chartSvg: {
    width: '100%',
    height: '100%',
  },
  
  examCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: colors.background.subtle,
    borderRadius: '0.75rem',
    marginBottom: '0.75rem',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  
  examInfo: {
    flex: 1,
  },
  
  examName: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  examDate: {
    fontSize: '0.875rem',
    color: colors.text.secondary,
  },
  
  examScore: {
    textAlign: 'right' as const,
    marginRight: '1rem',
  },
  
  weakTopicCard: {
    padding: '1rem',
    backgroundColor: '#FEF3C7',
    borderRadius: '0.75rem',
    marginBottom: '0.75rem',
    borderLeft: '4px solid #F59E0B',
  },
  
  topicHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  topicName: {
    fontWeight: '600',
    color: '#92400E',
  },
  
  topicSubject: {
    fontSize: '0.75rem',
    color: '#B45309',
    marginTop: '0.25rem',
  },
  
  topicPercentage: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#DC2626',
  },
  
  progressBar: {
    height: '8px',
    backgroundColor: '#FDE68A',
    borderRadius: '4px',
    marginTop: '0.75rem',
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  
  subjectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  
  subjectCard: {
    padding: '1rem',
    backgroundColor: colors.background.subtle,
    borderRadius: '0.75rem',
    textAlign: 'center' as const,
  },
  
  subjectName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  
  subjectAvg: {
    fontSize: '1.5rem',
    fontWeight: '700',
  },
  
  subjectTrend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    marginTop: '0.5rem',
    fontSize: '0.75rem',
  },
};

// ============================================
// 📦 ANA BİLEŞEN
// ============================================

export function StudentProfile({
  studentName,
  studentNo,
  className,
  examHistory,
  weakTopics = [],
  onDownloadPDF,
  onViewExam,
}: StudentProfileProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Genel istatistikler
  const stats = useMemo(() => {
    if (examHistory.length === 0) {
      return { avgScore: 0, avgNet: 0, bestRank: 0, trend: 'stable' as const };
    }

    const scores = examHistory.map(e => e.result.totalScore);
    const nets = examHistory.map(e => e.result.totalNet);
    const ranks = examHistory.map(e => e.result.rank);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgNet = nets.reduce((a, b) => a + b, 0) / nets.length;
    const bestRank = Math.min(...ranks);

    // Trend hesapla (son 3 sınav)
    const recentScores = scores.slice(-3);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentScores.length >= 2) {
      const diff = recentScores[recentScores.length - 1] - recentScores[0];
      if (diff > 10) trend = 'up';
      else if (diff < -10) trend = 'down';
    }

    return { avgScore, avgNet, bestRank, trend };
  }, [examHistory]);

  // Ders bazlı ortalamalar
  const subjectAverages = useMemo(() => {
    if (examHistory.length === 0) return [];

    const subjectMap: Record<string, { total: number; count: number; scores: number[] }> = {};

    for (const exam of examHistory) {
      for (const subject of exam.result.subjects) {
        if (!subjectMap[subject.subjectId]) {
          subjectMap[subject.subjectId] = { total: 0, count: 0, scores: [] };
        }
        subjectMap[subject.subjectId].total += subject.percentage;
        subjectMap[subject.subjectId].count++;
        subjectMap[subject.subjectId].scores.push(subject.percentage);
      }
    }

    return Object.entries(subjectMap).map(([id, data]) => {
      const avg = data.total / data.count;
      const recentScores = data.scores.slice(-3);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentScores.length >= 2) {
        const diff = recentScores[recentScores.length - 1] - recentScores[0];
        if (diff > 5) trend = 'up';
        else if (diff < -5) trend = 'down';
      }
      
      // Ders adını bul
      const subjectName = examHistory[0]?.result.subjects.find(s => s.subjectId === id)?.subjectName || id;

      return { id, name: subjectName, avg, trend, scores: data.scores };
    });
  }, [examHistory]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <motion.div 
        style={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={styles.avatar}>
          <User size={40} color={colors.primary[500]} />
        </div>
        <div style={styles.studentInfo}>
          <h1 style={styles.studentName}>{studentName}</h1>
          <p style={styles.studentMeta}>
            Öğrenci No: {studentNo} {className && `• ${className}`}
          </p>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statBadge}>
            <div style={styles.statValue}>{examHistory.length}</div>
            <div style={styles.statLabel}>Sınav</div>
          </div>
          <div style={styles.statBadge}>
            <div style={styles.statValue}>{stats.avgNet.toFixed(1)}</div>
            <div style={styles.statLabel}>Ort. Net</div>
          </div>
          <div style={styles.statBadge}>
            <div style={styles.statValue}>{stats.bestRank}</div>
            <div style={styles.statLabel}>En İyi Sıra</div>
          </div>
          <div style={{ 
            ...styles.statBadge, 
            backgroundColor: stats.trend === 'up' ? '#DCFCE7' : stats.trend === 'down' ? '#FEE2E2' : colors.background.subtle 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stats.trend === 'up' && <TrendingUp size={24} color="#22C55E" />}
              {stats.trend === 'down' && <TrendingDown size={24} color="#EF4444" />}
              {stats.trend === 'stable' && <Minus size={24} color="#94A3B8" />}
            </div>
            <div style={styles.statLabel}>Trend</div>
          </div>
        </div>
      </motion.div>

      {/* Gelişim Trendi Grafiği */}
      <motion.div 
        style={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 style={styles.sectionTitle}>
          <TrendingUp size={24} color={colors.primary[500]} />
          Akademik Gelişim Trendi
        </h2>
        <div style={styles.card}>
          <TrendLineChart examHistory={examHistory} />
        </div>
      </motion.div>

      {/* Ders Bazlı Performans */}
      <motion.div 
        style={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 style={styles.sectionTitle}>
          <BookOpen size={24} color={colors.info} />
          Ders Bazlı Ortalamalar
        </h2>
        <div style={styles.subjectGrid}>
          {subjectAverages.map((subject, index) => (
            <motion.div
              key={subject.id}
              style={styles.subjectCard}
              whileHover={{ transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
              transition={{ delay: index * 0.05 }}
            >
              <div style={styles.subjectName}>{subject.name}</div>
              <div style={{ 
                ...styles.subjectAvg, 
                color: subject.avg >= 70 ? colors.success : subject.avg >= 50 ? colors.warning : colors.error 
              }}>
                %{subject.avg.toFixed(0)}
              </div>
              <div style={{ 
                ...styles.subjectTrend, 
                color: subject.trend === 'up' ? colors.success : subject.trend === 'down' ? colors.error : colors.text.muted 
              }}>
                {subject.trend === 'up' && <TrendingUp size={14} />}
                {subject.trend === 'down' && <TrendingDown size={14} />}
                {subject.trend === 'stable' && <Minus size={14} />}
                {subject.trend === 'up' ? 'Yükseliyor' : subject.trend === 'down' ? 'Düşüyor' : 'Stabil'}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Zayıf Konular */}
      {weakTopics.length > 0 && (
        <motion.div 
          style={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 style={styles.sectionTitle}>
            <AlertTriangle size={24} color={colors.warning} />
            Geliştirilmesi Gereken Konular
          </h2>
          <div style={styles.card}>
            {weakTopics.map((topic, index) => (
              <motion.div
                key={topic.topicId}
                style={styles.weakTopicCard}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div style={styles.topicHeader}>
                  <div>
                    <div style={styles.topicName}>{topic.topicName}</div>
                    <div style={styles.topicSubject}>{topic.subjectName}</div>
                  </div>
                  <div style={styles.topicPercentage}>%{topic.avgPercentage.toFixed(0)}</div>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${topic.avgPercentage}%`,
                    backgroundColor: topic.avgPercentage < 30 ? '#DC2626' : '#F59E0B',
                  }} />
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#92400E', 
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  {topic.trend === 'improving' && <TrendingUp size={12} />}
                  {topic.trend === 'declining' && <TrendingDown size={12} />}
                  Son {topic.examCount} sınavda ortalama
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sınav Geçmişi */}
      <motion.div 
        style={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 style={styles.sectionTitle}>
          <Calendar size={24} color={colors.secondary[500]} />
          Sınav Geçmişi
        </h2>
        <div style={styles.card}>
          {examHistory.map((exam, index) => (
            <motion.div
              key={exam.examId}
              style={styles.examCard}
              whileHover={{ backgroundColor: colors.primary[50], transform: 'translateX(4px)' }}
              onClick={() => onViewExam?.(exam.examId)}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px',
                backgroundColor: colors.primary[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
              }}>
                <Award size={20} color={colors.primary[500]} />
              </div>
              <div style={styles.examInfo}>
                <div style={styles.examName}>{exam.examName}</div>
                <div style={styles.examDate}>{exam.examDate} • {exam.examType}</div>
              </div>
              <div style={styles.examScore}>
                <div style={{ fontWeight: '700', fontSize: '1.125rem', color: colors.primary[600] }}>
                  {exam.result.totalScore.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>
                  Sıra: {exam.result.rank}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadPDF?.(exam.examId);
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: colors.secondary[100],
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                }}
                title="PDF İndir"
              >
                <Download size={18} color={colors.secondary[600]} />
              </button>
              <ChevronRight size={20} color={colors.text.muted} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// 📈 TREND LINE CHART
// ============================================

function TrendLineChart({ examHistory }: { examHistory: ExamHistory[] }) {
  if (examHistory.length === 0) {
    return (
      <div style={{ 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: colors.text.muted,
      }}>
        <BarChart3 size={48} style={{ marginRight: '1rem', opacity: 0.3 }} />
        Henüz sınav verisi yok
      </div>
    );
  }

  const data = examHistory.map(e => ({
    label: e.examName.substring(0, 10),
    date: e.examDate,
    score: e.result.totalScore,
    net: e.result.totalNet,
    rank: e.result.rank,
  }));

  const maxScore = Math.max(...data.map(d => d.score)) * 1.1;
  const minScore = Math.min(...data.map(d => d.score)) * 0.9;
  const range = maxScore - minScore;

  const width = 100;
  const height = 60;
  const padding = 5;

  // SVG path oluştur
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((d.score - minScore) / (range || 1)) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div style={{ position: 'relative', height: '250px', padding: '1rem' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '200px' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(ratio => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + ratio * (height - 2 * padding)}
            stroke="#E2E8F0"
            strokeWidth="0.2"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#gradient)"
          opacity="0.3"
        />
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={colors.primary[500]}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - ((d.score - minScore) / (range || 1)) * (height - 2 * padding);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill="white"
              stroke={colors.primary[500]}
              strokeWidth="0.5"
            />
          );
        })}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary[500]} />
            <stop offset="100%" stopColor={colors.primary[500]} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '0.5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}>
        {data.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.7rem', color: colors.text.muted }}>
            <div style={{ fontWeight: '600', color: colors.text.primary }}>{d.score.toFixed(0)}</div>
            <div>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentProfile;

