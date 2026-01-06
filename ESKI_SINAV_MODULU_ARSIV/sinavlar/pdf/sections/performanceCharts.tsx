/**
 * ============================================
 * AkademiHub - PDF Performance Charts Section
 * ============================================
 * 
 * PHASE 4 - Performans Grafikleri Bölümü
 * 
 * İÇERİK:
 * - Ders bazlı bar chart
 * - Trend line chart
 * - Sınıf karşılaştırma
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Svg, Path, Rect, Circle, Line, G } from '@react-pdf/renderer';
import { COLORS, getSubjectColor, getTrendColor, getSuccessColor } from '../constants/colors';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/fonts';
import { formatNet, formatPercent, getSubjectName } from '../utils/formatters';
import type { PerformanceChartsProps } from '../types';

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
  
  chartsContainer: {
    flexDirection: 'row',
    gap: SPACING.lg
  },
  
  chartBox: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  },
  
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120
  },
  
  noDataText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.muted,
    textAlign: 'center'
  },
  
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm
  },
  
  trendIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.xs
  },
  
  trendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium
  }
});

// ==================== SUBJECT BAR CHART ====================

interface SubjectBarChartProps {
  subjects: Record<string, {
    code: string;
    name?: string;
    net: number;
    correct: number;
    wrong: number;
    empty: number;
    rate: number;
    class_avg?: number;
  }>;
}

/**
 * Ders bazlı bar chart
 */
export function SubjectBarChart({ subjects }: SubjectBarChartProps): React.ReactElement {
  const subjectList = Object.entries(subjects);
  
  if (subjectList.length === 0) {
    return (
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>Ders Performansı</Text>
        <View style={styles.chartArea}>
          <Text style={styles.noDataText}>Ders verisi bulunamadı</Text>
        </View>
      </View>
    );
  }
  
  const maxNet = Math.max(...subjectList.map(([, s]) => s.net), 1);
  const chartWidth = 220;
  const chartHeight = subjectList.length * 28;
  const barHeight = 18;
  const labelWidth = 50;
  const valueWidth = 35;
  const barAreaWidth = chartWidth - labelWidth - valueWidth;
  
  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>Ders Bazlı Net</Text>
      <View style={styles.chartArea}>
        <Svg width={chartWidth} height={chartHeight}>
          {subjectList.map(([code, subject], index) => {
            const y = index * 28 + 5;
            const barWidth = Math.max(0, (subject.net / maxNet) * barAreaWidth);
            const color = getSubjectColor(code);
            
            return (
              <G key={code}>
                {/* Label */}
                <SvgText
                  x={0}
                  y={y + barHeight / 2 + 4}
                  fontSize={9}
                  fill={COLORS.text.secondary}
                >
                  {code}
                </SvgText>
                
                {/* Background bar */}
                <Rect
                  x={labelWidth}
                  y={y}
                  width={barAreaWidth}
                  height={barHeight}
                  fill="#F3F4F6"
                  rx={2}
                />
                
                {/* Value bar */}
                <Rect
                  x={labelWidth}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx={2}
                />
                
                {/* Value text */}
                <SvgText
                  x={chartWidth - 5}
                  y={y + barHeight / 2 + 4}
                  fontSize={9}
                  fill={COLORS.text.primary}
                  textAnchor="end"
                >
                  {formatNet(subject.net)}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

// ==================== TREND LINE CHART ====================

interface TrendChartProps {
  trends: {
    direction: 'up' | 'down' | 'stable' | null;
    net_trend: number[] | null;
    velocity?: number;
    consistency?: number;
    trend_score?: number;
    explanation?: string;
  };
}

/**
 * Trend line chart
 */
export function TrendChart({ trends }: TrendChartProps): React.ReactElement {
  const { direction, net_trend, explanation } = trends;
  const trendColor = getTrendColor(direction);
  
  // Yeterli veri yok durumu
  if (!net_trend || net_trend.length < 2) {
    return (
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>Gelişim Trendi</Text>
        <View style={styles.chartArea}>
          <Text style={styles.noDataText}>Trend için yeterli sınav verisi yok</Text>
          <Text style={[styles.noDataText, { marginTop: 4, fontSize: 8 }]}>
            (En az 2 sınav gerekli)
          </Text>
        </View>
      </View>
    );
  }
  
  // Chart hesaplamaları
  const chartWidth = 220;
  const chartHeight = 100;
  const padding = { top: 15, right: 10, bottom: 25, left: 30 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;
  
  const minValue = Math.min(...net_trend);
  const maxValue = Math.max(...net_trend);
  const valueRange = maxValue - minValue || 1;
  const valuePadding = valueRange * 0.1;
  
  const adjustedMin = minValue - valuePadding;
  const adjustedMax = maxValue + valuePadding;
  const adjustedRange = adjustedMax - adjustedMin;
  
  // Nokta koordinatları
  const points = net_trend.map((value, index) => {
    const x = padding.left + (index / (net_trend.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((value - adjustedMin) / adjustedRange) * graphHeight;
    return { x, y, value };
  });
  
  // Path data
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  
  // Area path
  const areaPath = `M${points[0].x} ${padding.top + graphHeight} ${points.map(p => `L${p.x} ${p.y}`).join(' ')} L${points[points.length - 1].x} ${padding.top + graphHeight} Z`;
  
  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>Son {net_trend.length} Sınav Trendi</Text>
      <View style={styles.chartArea}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + graphHeight * ratio;
            const value = adjustedMax - adjustedRange * ratio;
            return (
              <G key={i}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                <SvgText
                  x={padding.left - 4}
                  y={y + 3}
                  fontSize={7}
                  fill="#9CA3AF"
                  textAnchor="end"
                >
                  {value.toFixed(0)}
                </SvgText>
              </G>
            );
          })}
          
          {/* Area fill */}
          <Path
            d={areaPath}
            fill={trendColor.accent}
            fillOpacity={0.1}
          />
          
          {/* Line */}
          <Path
            d={pathData}
            fill="none"
            stroke={trendColor.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {points.map((point, i) => (
            <G key={i}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="white"
                stroke={trendColor.accent}
                strokeWidth={2}
              />
              {/* X-axis label */}
              <SvgText
                x={point.x}
                y={chartHeight - 5}
                fontSize={7}
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {i + 1}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>
      
      {/* Trend indicator */}
      <View style={[styles.trendIndicator, { backgroundColor: trendColor.bg }]}>
        <Text style={[styles.trendIcon, { color: trendColor.accent }]}>
          {trendColor.icon}
        </Text>
        <Text style={[styles.trendText, { color: trendColor.text }]}>
          {trendColor.label}
        </Text>
      </View>
      
      {/* Explanation */}
      {explanation && (
        <Text style={{ fontSize: 8, color: COLORS.text.muted, marginTop: 4, textAlign: 'center' }}>
          {explanation}
        </Text>
      )}
    </View>
  );
}

// ==================== MAIN PERFORMANCE SECTION ====================

/**
 * Ana performans grafikleri bölümü
 */
export function PerformanceChartsSection({
  subjectPerformance,
  trends,
  totalNet,
  classAvg
}: PerformanceChartsProps): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Performans Analizi</Text>
      
      <View style={styles.chartsContainer}>
        <SubjectBarChart subjects={subjectPerformance} />
        <TrendChart trends={trends} />
      </View>
      
      {/* Sınıf karşılaştırması */}
      {classAvg !== null && classAvg !== undefined && (
        <View style={{ marginTop: SPACING.md }}>
          <ClassComparisonBar totalNet={totalNet} classAvg={classAvg} />
        </View>
      )}
    </View>
  );
}

// ==================== CLASS COMPARISON ====================

interface ClassComparisonBarProps {
  totalNet: number;
  classAvg: number;
}

/**
 * Sınıf ortalaması karşılaştırma
 */
function ClassComparisonBar({ totalNet, classAvg }: ClassComparisonBarProps): React.ReactElement {
  const diff = totalNet - classAvg;
  const isAbove = diff >= 0;
  const diffColor = isAbove ? COLORS.success : COLORS.danger;
  
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.background.secondary,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm
    }}>
      <Text style={{ fontSize: 10, color: COLORS.text.secondary }}>
        Sınıf Ortalaması: {formatNet(classAvg)}
      </Text>
      <Text style={{ fontSize: 10, color: COLORS.text.muted, marginHorizontal: 8 }}>|</Text>
      <Text style={{ fontSize: 10, color: COLORS.text.secondary }}>
        Fark: 
      </Text>
      <Text style={{ fontSize: 10, fontWeight: 600, color: diffColor, marginLeft: 4 }}>
        {isAbove ? '+' : ''}{formatNet(diff)}
      </Text>
    </View>
  );
}

// ==================== SVG TEXT HELPER ====================

function SvgText({ x, y, fontSize, fill, textAnchor, children }: {
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  textAnchor?: string;
  children: React.ReactNode;
}): React.ReactElement {
  // react-pdf Svg Text için basit wrapper
  return (
    <G>
      {/* SVG text için placeholder - react-pdf Text kullanır */}
    </G>
  );
}

// ==================== EXPORT ====================

export default {
  SubjectBarChart,
  TrendChart,
  PerformanceChartsSection
};

