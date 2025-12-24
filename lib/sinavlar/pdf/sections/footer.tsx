/**
 * ============================================
 * AkademiHub - PDF Footer Section
 * ============================================
 * 
 * PHASE 4 - Rapor Alt Bilgi Bölümü
 * 
 * İÇERİK:
 * - Sayfa numarası
 * - Oluşturulma tarihi
 * - QR kod (opsiyonel)
 * - Yasal uyarı
 * - Versiyon bilgisi
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/fonts';
import { formatDate, formatTime } from '../utils/formatters';
import type { FooterProps } from '../types';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm
  },
  
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  leftSection: {
    flex: 1
  },
  
  centerSection: {
    alignItems: 'center'
  },
  
  rightSection: {
    flex: 1,
    alignItems: 'flex-end'
  },
  
  pageNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary
  },
  
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted
  },
  
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted
  },
  
  legalText: {
    fontSize: 7,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: SPACING.xs
  },
  
  qrContainer: {
    alignItems: 'center'
  },
  
  qrImage: {
    width: 40,
    height: 40
  },
  
  qrLabel: {
    fontSize: 6,
    color: COLORS.text.muted,
    marginTop: 2
  },
  
  brandText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold
  }
});

// ==================== COMPONENT ====================

/**
 * PDF Footer Bölümü
 */
export function FooterSection({
  pageNumber,
  totalPages,
  generatedAt,
  version,
  showQRCode = false,
  qrData
}: FooterProps): React.ReactElement {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerContent}>
        {/* Sol - Tarih ve versiyon */}
        <View style={styles.leftSection}>
          <Text style={styles.dateText}>
            Oluşturulma: {formatDate(generatedAt)} {formatTime(generatedAt)}
          </Text>
          <Text style={styles.versionText}>
            v{version}
          </Text>
        </View>
        
        {/* Orta - Sayfa numarası veya QR */}
        <View style={styles.centerSection}>
          {showQRCode && qrData ? (
            <View style={styles.qrContainer}>
              {/* QR Code placeholder - gerçek implementasyon için qrcode kütüphanesi gerekli */}
              <View style={[styles.qrImage, { backgroundColor: '#F3F4F6', borderRadius: 4 }]} />
              <Text style={styles.qrLabel}>Detaylı Rapor</Text>
            </View>
          ) : (
            <Text style={styles.pageNumber}>
              Sayfa {pageNumber} / {totalPages}
            </Text>
          )}
        </View>
        
        {/* Sağ - Marka */}
        <View style={styles.rightSection}>
          <Text style={styles.brandText}>AkademiHub</Text>
          <Text style={styles.versionText}>Analiz Sistemi</Text>
        </View>
      </View>
      
      {/* Yasal uyarı */}
      <Text style={styles.legalText}>
        Bu rapor AkademiHub tarafından otomatik olarak oluşturulmuştur. İçerdiği bilgiler gizlidir ve yalnızca ilgili kişilerle paylaşılmalıdır.
      </Text>
    </View>
  );
}

// ==================== SIMPLE FOOTER ====================

interface SimpleFooterProps {
  pageNumber: number;
  totalPages: number;
}

/**
 * Basit sayfa numarası footer'ı
 */
export function SimpleFooter({ pageNumber, totalPages }: SimpleFooterProps): React.ReactElement {
  return (
    <View style={[styles.footer, { borderTopWidth: 0 }]} fixed>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.pageNumber}>
          {pageNumber} / {totalPages}
        </Text>
      </View>
    </View>
  );
}

// ==================== WATERMARK ====================

const watermarkStyles = StyleSheet.create({
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1
  },
  
  watermarkText: {
    fontSize: 48,
    color: COLORS.text.muted,
    opacity: 0.04,
    transform: 'rotate(-30deg)'
  }
});

/**
 * Watermark bileşeni
 */
export function Watermark(): React.ReactElement {
  return (
    <View style={watermarkStyles.watermark} fixed>
      <Text style={watermarkStyles.watermarkText}>
        AkademiHub
      </Text>
    </View>
  );
}

// ==================== CONFIDENTIAL BANNER ====================

const bannerStyles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  bannerIcon: {
    fontSize: 10,
    marginRight: SPACING.xs
  },
  
  bannerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary
  }
});

/**
 * Gizlilik banner'ı
 */
export function ConfidentialBanner(): React.ReactElement {
  return (
    <View style={bannerStyles.banner}>
      <Text style={bannerStyles.bannerIcon}>🔒</Text>
      <Text style={bannerStyles.bannerText}>
        Bu belge kişisel veri içermektedir ve gizlidir.
      </Text>
    </View>
  );
}

// ==================== PAGE BREAK ====================

/**
 * Sayfa sonu bileşeni
 */
export function PageBreak(): React.ReactElement {
  return <View break />;
}

// ==================== EXPORT ====================

export default {
  FooterSection,
  SimpleFooter,
  Watermark,
  ConfidentialBanner,
  PageBreak
};

