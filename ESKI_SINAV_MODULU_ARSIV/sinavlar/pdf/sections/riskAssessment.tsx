/**
 * ============================================
 * AkademiHub - PDF Risk Assessment Section
 * ============================================
 * 
 * PHASE 4 - Risk Değerlendirmesi Bölümü
 * 
 * İÇERİK:
 * - Risk seviyesi göstergesi
 * - Açıklanabilir risk faktörleri
 * - Veli dostu açıklamalar
 * - Eylem önerileri
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, getRiskColor, RISK_COLORS } from '../constants/colors';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/fonts';
import { formatRiskLevel, formatRiskFactorForParent } from '../utils/formatters';
import type { RiskAssessmentProps } from '../types';

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
  
  container: {
    flexDirection: 'row',
    gap: SPACING.md
  },
  
  leftPanel: {
    width: 140,
    alignItems: 'center'
  },
  
  rightPanel: {
    flex: 1
  },
  
  riskGauge: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg
  },
  
  riskIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs
  },
  
  riskLevel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4
  },
  
  riskScore: {
    fontSize: TYPOGRAPHY.fontSize.sm
  },
  
  factorsContainer: {
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  },
  
  factorsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm
  },
  
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm
  },
  
  factorBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    marginRight: SPACING.xs
  },
  
  factorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.normal
  },
  
  summaryBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'solid'
  },
  
  summaryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed
  },
  
  actionBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background.accent,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary
  },
  
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs
  },
  
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.normal
  },
  
  noRiskBox: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: RISK_COLORS.low.bg,
    borderRadius: BORDER_RADIUS.md
  },
  
  noRiskText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: RISK_COLORS.low.text,
    textAlign: 'center'
  }
});

// ==================== COMPONENT ====================

/**
 * Risk değerlendirmesi bölümü
 */
export function RiskAssessmentSection({
  level,
  score,
  factors,
  primaryConcern,
  summary,
  actionRequired
}: RiskAssessmentProps): React.ReactElement {
  const riskColor = getRiskColor(level);
  
  // Risk yok veya düşük durumu
  if (!level || level === 'low') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Risk Değerlendirmesi</Text>
        
        <View style={styles.noRiskBox}>
          <Text style={{ fontSize: 24, marginBottom: SPACING.xs }}>✓</Text>
          <Text style={styles.noRiskText}>
            Öğrenci performansı iyi durumda.{'\n'}
            Herhangi bir risk faktörü tespit edilmedi.
          </Text>
        </View>
      </View>
    );
  }
  
  // Risk faktörlerini parse et
  const parsedFactors = parseFactors(factors);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚠️ Risk Değerlendirmesi</Text>
      
      <View style={styles.container}>
        {/* Sol Panel - Risk Göstergesi */}
        <View style={styles.leftPanel}>
          <View style={[styles.riskGauge, { backgroundColor: riskColor.bg }]}>
            <Text style={styles.riskIcon}>{riskColor.icon}</Text>
            <Text style={[styles.riskLevel, { color: riskColor.text }]}>
              {riskColor.label}
            </Text>
            {score !== null && (
              <Text style={[styles.riskScore, { color: riskColor.text }]}>
                Skor: {score}/100
              </Text>
            )}
          </View>
          
          {/* Primary concern */}
          {primaryConcern && (
            <View style={{ marginTop: SPACING.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, color: COLORS.text.muted, marginBottom: 2 }}>
                Ana Odak
              </Text>
              <Text style={{ fontSize: 9, color: riskColor.text, textAlign: 'center', fontWeight: 600 }}>
                {primaryConcern}
              </Text>
            </View>
          )}
        </View>
        
        {/* Sağ Panel - Faktörler */}
        <View style={styles.rightPanel}>
          {parsedFactors.length > 0 && (
            <View style={styles.factorsContainer}>
              <Text style={styles.factorsTitle}>Dikkat Edilmesi Gerekenler:</Text>
              
              {parsedFactors.map((factor, index) => (
                <View key={index} style={styles.factorItem}>
                  <View style={[styles.factorBullet, { backgroundColor: getSeverityColor(factor.severity) }]} />
                  <Text style={styles.factorText}>
                    {factor.explanation}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Özet */}
          {summary && (
            <View style={[styles.summaryBox, { borderColor: riskColor.accent }]}>
              <Text style={[styles.summaryText, { color: riskColor.text }]}>
                {summary}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Eylem kutusu */}
      {actionRequired && (
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>📋 Önerilen Aksiyonlar</Text>
          <Text style={styles.actionText}>
            {getActionRecommendation(level, primaryConcern)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ==================== PARENT FRIENDLY VERSION ====================

/**
 * Veli dostu risk bölümü
 */
export function ParentFriendlyRiskSection({
  level,
  score,
  factors,
  primaryConcern,
  summary
}: RiskAssessmentProps): React.ReactElement {
  const riskColor = getRiskColor(level);
  const parsedFactors = parseFactors(factors);
  
  // Düşük risk veya risk yok
  if (!level || level === 'low') {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: TYPOGRAPHY.fontSize.lg }]}>
          Veli Bilgilendirmesi
        </Text>
        
        <View style={[styles.noRiskBox, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={{ fontSize: 20, marginRight: SPACING.sm }}>😊</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.noRiskText, { textAlign: 'left', fontWeight: 600 }]}>
              Tebrikler!
            </Text>
            <Text style={[styles.noRiskText, { textAlign: 'left', fontSize: 10, marginTop: 2 }]}>
              Öğrenciniz başarılı bir performans gösterdi. Mevcut çalışma düzenini desteklemeye devam edin.
            </Text>
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: TYPOGRAPHY.fontSize.lg }]}>
        Veli Bilgilendirmesi
      </Text>
      
      {/* Özet kutusu */}
      <View style={[styles.summaryBox, { 
        backgroundColor: riskColor.bg, 
        borderColor: riskColor.accent,
        marginTop: 0 
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
          <Text style={{ fontSize: 20, marginRight: SPACING.sm }}>
            {level === 'critical' ? '⚠️' : level === 'high' ? '⚡' : '💡'}
          </Text>
          <Text style={[styles.riskLevel, { color: riskColor.text, marginBottom: 0 }]}>
            {getParentFriendlyTitle(level)}
          </Text>
        </View>
        
        <Text style={[styles.summaryText, { color: riskColor.text }]}>
          {summary || getDefaultParentMessage(level)}
        </Text>
      </View>
      
      {/* Faktörler - veli dostu dilde */}
      {parsedFactors.length > 0 && (
        <View style={{ marginTop: SPACING.md }}>
          <Text style={[styles.factorsTitle, { marginBottom: SPACING.xs }]}>
            Dikkat Edilmesi Gereken Noktalar:
          </Text>
          
          {parsedFactors.slice(0, 3).map((factor, index) => (
            <View key={index} style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.sm,
              backgroundColor: index % 2 === 0 ? COLORS.background.secondary : 'transparent',
              borderRadius: BORDER_RADIUS.sm
            }}>
              <Text style={{ fontSize: 10, marginRight: SPACING.xs }}>•</Text>
              <Text style={{ flex: 1, fontSize: 10, color: COLORS.text.primary }}>
                {factor.parentFriendly}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Veli için öneriler */}
      <View style={[styles.actionBox, { marginTop: SPACING.md }]}>
        <Text style={styles.actionTitle}>Velilerimize Öneriler</Text>
        <Text style={styles.actionText}>
          {getParentRecommendation(level, primaryConcern)}
        </Text>
      </View>
    </View>
  );
}

// ==================== HELPER FUNCTIONS ====================

interface ParsedFactor {
  factor: string;
  explanation: string;
  parentFriendly: string;
  severity: string;
}

function parseFactors(factors: RiskAssessmentProps['factors']): ParsedFactor[] {
  if (!Array.isArray(factors)) return [];
  
  return factors.map(f => {
    if (typeof f === 'string') {
      return {
        factor: 'unknown',
        explanation: f,
        parentFriendly: f,
        severity: 'medium'
      };
    }
    
    return {
      factor: f.factor ?? 'unknown',
      explanation: f.explanation ?? f.factor_name ?? '',
      parentFriendly: f.factor ? formatRiskFactorForParent(f.factor) : (f.explanation ?? ''),
      severity: f.severity ?? 'medium'
    };
  }).filter(f => f.explanation);
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return COLORS.danger;
    case 'high': return COLORS.warning;
    case 'medium': return '#F59E0B';
    case 'low':
    default: return COLORS.info;
  }
}

function getParentFriendlyTitle(level: string | null): string {
  switch (level) {
    case 'critical': return 'Acil Destek Gerekiyor';
    case 'high': return 'Dikkat Edilmeli';
    case 'medium': return 'Gelişim Alanları Var';
    default: return 'Bilgilendirme';
  }
}

function getDefaultParentMessage(level: string | null): string {
  switch (level) {
    case 'critical':
      return 'Öğrencinizin performansında ciddi düşüşler tespit edildi. Öğretmenle görüşmenizi ve ek destek sağlamanızı öneriyoruz.';
    case 'high':
      return 'Öğrencinizin bazı alanlarda desteğe ihtiyacı var. Düzenli çalışma programı ve takip öneriyoruz.';
    case 'medium':
      return 'Öğrenciniz genel olarak iyi ilerliyor ancak bazı konularda gelişim gösterebilir. Eksik konulara odaklanmanızı öneriyoruz.';
    default:
      return 'Öğrencinizin durumu hakkında bilgilendirme.';
  }
}

function getActionRecommendation(level: string | null, primaryConcern: string | null): string {
  const base = primaryConcern 
    ? `Öncelikli olarak "${primaryConcern}" konusuna odaklanılmalı. `
    : '';
  
  switch (level) {
    case 'critical':
      return base + 'Acil olarak öğretmen görüşmesi yapılmalı ve bireysel çalışma programı oluşturulmalıdır. Gerekirse ek ders desteği alınmalıdır.';
    case 'high':
      return base + 'Haftalık düzenli çalışma programı oluşturulmalı, eksik konular belirlenmeli ve bu konulara yoğunlaşılmalıdır.';
    case 'medium':
      return base + 'Mevcut çalışma programı gözden geçirilmeli ve zayıf konulara daha fazla zaman ayrılmalıdır.';
    default:
      return 'Performansı yakından takip etmeye devam edin.';
  }
}

function getParentRecommendation(level: string | null, primaryConcern: string | null): string {
  switch (level) {
    case 'critical':
      return '• Öğretmenle yüz yüze görüşme randevusu alın\n• Günlük çalışma saatlerini artırın\n• Öğrencinizle motivasyon konuşması yapın\n• Gerekirse destek eğitim imkanlarını araştırın';
    case 'high':
      return '• Haftalık çalışma planı oluşturun\n• Eksik konuları birlikte belirleyin\n• Düzenli soru çözümünü teşvik edin\n• Öğrencinizin ilerlemesini takip edin';
    case 'medium':
      return '• Mevcut çalışma düzenini destekleyin\n• Zayıf konulara ekstra zaman ayırmasını sağlayın\n• Düzenli deneme sınavları çözmesini teşvik edin';
    default:
      return '• Başarıyı takdir edin ve motive edin\n• Düzenli çalışma alışkanlığını destekleyin';
  }
}

// ==================== EXPORT ====================

export default {
  RiskAssessmentSection,
  ParentFriendlyRiskSection
};

