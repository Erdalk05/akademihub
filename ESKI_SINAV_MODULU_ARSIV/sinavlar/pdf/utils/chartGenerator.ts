/**
 * ============================================
 * AkademiHub - PDF Chart Generator
 * ============================================
 * 
 * PHASE 4 - SVG/Base64 Grafik Üretici
 * 
 * Bu dosya:
 * - Analytics verilerini PDF-uyumlu grafiklere dönüştürür
 * - SVG çıktısı üretir (react-pdf ile uyumlu)
 * - Base64 encoding sağlar
 * 
 * KURALLAR:
 * - Pure function - side effect YOK
 * - Canvas/DOM bağımlılığı YOK
 * - Server-side uyumlu
 */

import { CHART_COLORS, SUBJECT_COLORS, getSubjectColor, getSuccessColor } from '../constants/colors';
import { CHART_DIMENSIONS } from '../constants/fonts';
import type { BarChartDataPoint, LineChartDataPoint, ChartRenderResult } from '../types';

// ==================== BAR CHART ====================

/**
 * Yatay bar chart SVG üretir
 */
export function generateBarChartSVG(
  data: BarChartDataPoint[],
  options: {
    width?: number;
    height?: number;
    barHeight?: number;
    showLabels?: boolean;
    showValues?: boolean;
  } = {}
): string {
  const {
    width = 280,
    height = data.length * 28 + 20,
    barHeight = 20,
    showLabels = true,
    showValues = true
  } = options;
  
  const labelWidth = showLabels ? 60 : 0;
  const valueWidth = showValues ? 40 : 0;
  const barAreaWidth = width - labelWidth - valueWidth - 10;
  const maxValue = Math.max(...data.map(d => d.maxValue ?? d.value), 1);
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Arka plan
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  data.forEach((item, index) => {
    const y = index * 28 + 10;
    const barWidth = (item.value / maxValue) * barAreaWidth;
    
    // Label
    if (showLabels) {
      svg += `<text x="0" y="${y + barHeight / 2 + 4}" font-family="Arial" font-size="10" fill="#374151">${item.label}</text>`;
    }
    
    // Bar background
    svg += `<rect x="${labelWidth}" y="${y}" width="${barAreaWidth}" height="${barHeight}" fill="#F3F4F6" rx="2"/>`;
    
    // Bar
    svg += `<rect x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" rx="2"/>`;
    
    // Value
    if (showValues) {
      svg += `<text x="${width - 5}" y="${y + barHeight / 2 + 4}" font-family="Arial" font-size="10" fill="#374151" text-anchor="end">${item.value.toFixed(1)}</text>`;
    }
  });
  
  svg += '</svg>';
  
  return svg;
}

/**
 * Dikey bar chart SVG üretir (ders karşılaştırma için)
 */
export function generateVerticalBarChartSVG(
  data: BarChartDataPoint[],
  options: {
    width?: number;
    height?: number;
    barWidth?: number;
    showLabels?: boolean;
    showGrid?: boolean;
  } = {}
): string {
  const {
    width = 280,
    height = 160,
    barWidth = 24,
    showLabels = true,
    showGrid = true
  } = options;
  
  const marginTop = 20;
  const marginBottom = showLabels ? 30 : 10;
  const marginLeft = 30;
  const marginRight = 10;
  
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  const maxValue = Math.max(...data.map(d => d.maxValue ?? d.value), 1);
  const barGap = (chartWidth - (data.length * barWidth)) / (data.length + 1);
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Arka plan
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Grid lines
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const y = marginTop + (chartHeight / 4) * i;
      const value = maxValue - (maxValue / 4) * i;
      svg += `<line x1="${marginLeft}" y1="${y}" x2="${width - marginRight}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5"/>`;
      svg += `<text x="${marginLeft - 5}" y="${y + 3}" font-family="Arial" font-size="8" fill="#9CA3AF" text-anchor="end">${value.toFixed(0)}</text>`;
    }
  }
  
  // Bars
  data.forEach((item, index) => {
    const x = marginLeft + barGap + index * (barWidth + barGap);
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = marginTop + chartHeight - barHeight;
    
    // Bar
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" rx="2"/>`;
    
    // Label
    if (showLabels) {
      svg += `<text x="${x + barWidth / 2}" y="${height - 10}" font-family="Arial" font-size="8" fill="#374151" text-anchor="middle">${item.label}</text>`;
    }
    
    // Value on top
    svg += `<text x="${x + barWidth / 2}" y="${y - 4}" font-family="Arial" font-size="8" fill="#374151" text-anchor="middle">${item.value.toFixed(1)}</text>`;
  });
  
  svg += '</svg>';
  
  return svg;
}

// ==================== LINE CHART ====================

/**
 * Trend line chart SVG üretir
 */
export function generateTrendChartSVG(
  data: number[],
  options: {
    width?: number;
    height?: number;
    showPoints?: boolean;
    showArea?: boolean;
    showGrid?: boolean;
    color?: string;
  } = {}
): string {
  const {
    width = 280,
    height = 120,
    showPoints = true,
    showArea = true,
    showGrid = true,
    color = CHART_COLORS.line.primary
  } = options;
  
  if (data.length < 2) {
    return generateNoDataSVG(width, height, 'Trend verisi yetersiz');
  }
  
  const marginTop = 15;
  const marginBottom = 25;
  const marginLeft = 30;
  const marginRight = 15;
  
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1;
  const padding = valueRange * 0.1;
  
  const adjustedMin = minValue - padding;
  const adjustedMax = maxValue + padding;
  const adjustedRange = adjustedMax - adjustedMin;
  
  // Nokta koordinatlarını hesapla
  const points = data.map((value, index) => {
    const x = marginLeft + (index / (data.length - 1)) * chartWidth;
    const y = marginTop + chartHeight - ((value - adjustedMin) / adjustedRange) * chartHeight;
    return { x, y, value };
  });
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Arka plan
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Grid
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const y = marginTop + (chartHeight / 4) * i;
      const value = adjustedMax - (adjustedRange / 4) * i;
      svg += `<line x1="${marginLeft}" y1="${y}" x2="${width - marginRight}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5" stroke-dasharray="4,2"/>`;
      svg += `<text x="${marginLeft - 5}" y="${y + 3}" font-family="Arial" font-size="8" fill="#9CA3AF" text-anchor="end">${value.toFixed(1)}</text>`;
    }
  }
  
  // X-axis labels
  points.forEach((point, index) => {
    svg += `<text x="${point.x}" y="${height - 5}" font-family="Arial" font-size="8" fill="#9CA3AF" text-anchor="middle">${index + 1}</text>`;
  });
  
  // Area fill
  if (showArea) {
    const areaPath = `M${points[0].x},${marginTop + chartHeight} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${marginTop + chartHeight} Z`;
    svg += `<path d="${areaPath}" fill="${color}" fill-opacity="0.1"/>`;
  }
  
  // Line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  svg += `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  
  // Points
  if (showPoints) {
    points.forEach(point => {
      svg += `<circle cx="${point.x}" cy="${point.y}" r="4" fill="white" stroke="${color}" stroke-width="2"/>`;
    });
  }
  
  svg += '</svg>';
  
  return svg;
}

// ==================== RADAR CHART ====================

/**
 * Radar (örümcek) chart SVG üretir
 */
export function generateRadarChartSVG(
  data: Array<{ label: string; value: number; maxValue: number }>,
  options: {
    width?: number;
    height?: number;
    showLabels?: boolean;
    color?: string;
  } = {}
): string {
  const {
    width = 180,
    height = 180,
    showLabels = true,
    color = CHART_COLORS.radar.stroke
  } = options;
  
  if (data.length < 3) {
    return generateNoDataSVG(width, height, 'Yetersiz veri');
  }
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - (showLabels ? 25 : 10);
  const angleStep = (2 * Math.PI) / data.length;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Arka plan
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // Grid circles
  for (let i = 1; i <= 4; i++) {
    const r = (radius / 4) * i;
    svg += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="0.5"/>`;
  }
  
  // Axis lines
  data.forEach((_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5"/>`;
  });
  
  // Data polygon
  const points = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const value = item.value / (item.maxValue || 1);
    const r = value * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  });
  
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  svg += `<path d="${pathData}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>`;
  
  // Data points
  points.forEach(p => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="white" stroke="${color}" stroke-width="2"/>`;
  });
  
  // Labels
  if (showLabels) {
    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 15;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      let anchor = 'middle';
      if (Math.cos(angle) < -0.1) anchor = 'end';
      else if (Math.cos(angle) > 0.1) anchor = 'start';
      
      svg += `<text x="${x}" y="${y + 3}" font-family="Arial" font-size="8" fill="#374151" text-anchor="${anchor}">${item.label}</text>`;
    });
  }
  
  svg += '</svg>';
  
  return svg;
}

// ==================== PROGRESS BAR ====================

/**
 * Progress bar SVG üretir
 */
export function generateProgressBarSVG(
  value: number,
  maxValue: number = 100,
  options: {
    width?: number;
    height?: number;
    color?: string;
    showPercentage?: boolean;
  } = {}
): string {
  const {
    width = 120,
    height = 12,
    showPercentage = true
  } = options;
  
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const color = options.color ?? getSuccessColor(percentage / 100).accent;
  const progressWidth = (percentage / 100) * width;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#E5E7EB" rx="${height / 2}"/>`;
  
  // Progress
  if (progressWidth > 0) {
    svg += `<rect width="${progressWidth}" height="${height}" fill="${color}" rx="${height / 2}"/>`;
  }
  
  // Percentage text
  if (showPercentage && width >= 60) {
    const textX = width / 2;
    const textColor = percentage > 50 ? 'white' : '#374151';
    svg += `<text x="${textX}" y="${height / 2 + 3}" font-family="Arial" font-size="8" fill="${textColor}" text-anchor="middle">%${percentage.toFixed(0)}</text>`;
  }
  
  svg += '</svg>';
  
  return svg;
}

// ==================== SPARKLINE ====================

/**
 * Mini sparkline SVG üretir
 */
export function generateSparklineSVG(
  data: number[],
  options: {
    width?: number;
    height?: number;
    color?: string;
    showEndpoint?: boolean;
  } = {}
): string {
  const {
    width = 80,
    height = 24,
    color = CHART_COLORS.line.primary,
    showEndpoint = true
  } = options;
  
  if (data.length < 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#F9FAFB"/></svg>`;
  }
  
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y };
  });
  
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
  
  if (showEndpoint) {
    const lastPoint = points[points.length - 1];
    svg += `<circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="2.5" fill="${color}"/>`;
  }
  
  svg += '</svg>';
  
  return svg;
}

// ==================== NO DATA PLACEHOLDER ====================

/**
 * Veri yok placeholder SVG üretir
 */
export function generateNoDataSVG(
  width: number,
  height: number,
  message: string = 'Veri bulunamadı'
): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#F9FAFB" rx="4"/>
      <text x="${width / 2}" y="${height / 2 + 4}" font-family="Arial" font-size="10" fill="#9CA3AF" text-anchor="middle">${message}</text>
    </svg>
  `.trim();
}

// ==================== DERS PERFORMANS CHART ====================

/**
 * Ders performans karşılaştırma chart'ı üretir
 */
export function generateSubjectPerformanceChart(
  subjects: Record<string, { code: string; net: number; class_avg?: number }>
): string {
  const data = Object.entries(subjects).map(([code, perf]) => ({
    label: code,
    value: perf.net,
    color: getSubjectColor(code)
  }));
  
  return generateVerticalBarChartSVG(data, {
    width: 280,
    height: 160,
    showLabels: true,
    showGrid: true
  });
}

// ==================== SVG TO BASE64 ====================

/**
 * SVG string'i base64'e dönüştürür
 */
export function svgToBase64(svg: string): string {
  // Buffer kullanımı (Node.js)
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  
  // btoa kullanımı (Browser)
  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }
  
  // Fallback: URI encoded
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ==================== EXPORT ====================

export default {
  generateBarChartSVG,
  generateVerticalBarChartSVG,
  generateTrendChartSVG,
  generateRadarChartSVG,
  generateProgressBarSVG,
  generateSparklineSVG,
  generateNoDataSVG,
  generateSubjectPerformanceChart,
  svgToBase64
};

