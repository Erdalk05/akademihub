'use client';

/**
 * ============================================
 * SINAV KARNESİ - BASİT ŞABLON (1 SAYFA)
 * ============================================
 * 
 * Kazanımlar olmadan, sadece ders özeti içeren karne
 * A4 formatında tek sayfa
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Türkçe karakter desteği için font
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

// Stiller
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#0EA5E9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0369A1',
    textAlign: 'center',
  },
  // Öğrenci Bilgileri Tablosu
  infoTable: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    width: '45%',
    padding: 6,
    backgroundColor: '#F0F9FF',
    fontSize: 9,
    fontWeight: 500,
    color: '#0369A1',
  },
  infoValue: {
    width: '55%',
    padding: 6,
    fontSize: 9,
    color: '#1F2937',
  },
  // Ders Tablosu
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0369A1',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0284C7',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    color: '#374151',
  },
  tableCellLeft: {
    padding: 6,
    fontSize: 9,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    color: '#374151',
    fontWeight: 500,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#0369A1',
  },
  tableTotalCell: {
    padding: 8,
    fontSize: 10,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0284C7',
  },
  // Puan ve Sıralama Kutuları
  boxContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  scoreBox: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoxBlue: {
    backgroundColor: '#0EA5E9',
  },
  scoreBoxGreen: {
    backgroundColor: '#10B981',
  },
  scoreBoxPurple: {
    backgroundColor: '#8B5CF6',
  },
  scoreBoxLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 5,
  },
  scoreBoxValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  // Sıralama Tablosu
  rankTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  rankColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  rankHeader: {
    padding: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
  },
  rankHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#0369A1',
  },
  rankValue: {
    padding: 8,
    alignItems: 'center',
  },
  rankValueText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1F2937',
  },
  // Cevap Haritası
  answerMapTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0369A1',
    marginBottom: 8,
  },
  answerMapLegend: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 8,
    fontSize: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 8,
    color: '#6B7280',
  },
  answerMapContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    borderRadius: 4,
  },
  answerMapRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  answerMapLabel: {
    width: 55,
    fontSize: 7,
    color: '#6B7280',
    paddingTop: 2,
  },
  answerMapCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 1,
  },
  answerCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 7,
    fontWeight: 500,
  },
  answerCorrect: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  answerWrong: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  answerEmpty: {
    backgroundColor: '#9CA3AF',
    color: '#FFFFFF',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#9CA3AF',
  },
});

// Veri tipleri
export interface SinavKarnesiBasitProps {
  ogrenci: {
    ad: string;
    numara: string;
    sinif: string;
    okul?: string;
    geldigiOkul?: string;
  };
  sinav: {
    ad: string;
    alan: string;
    tarih: string;
    kitapcik: string;
    danisman?: string;
  };
  dersler: {
    dersAdi: string;
    soruSayisi: number;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
    basariYuzdesi: number;
    cevapAnahtari?: string;
    ogrenciCevabi?: string;
  }[];
  toplam: {
    soruSayisi: number;
    dogru: number;
    yanlis: number;
    bos: number;
    net: number;
    basariYuzdesi: number;
  };
  puan: number;
  siralama: {
    sube: { siralama: number; kisiSayisi: number; ortalama: number };
    okul: { siralama: number; kisiSayisi: number; ortalama: number };
  };
  kurumLogo?: string;
}

const SinavKarnesiBasit: React.FC<SinavKarnesiBasitProps> = ({
  ogrenci,
  sinav,
  dersler,
  toplam,
  puan,
  siralama,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KONU ANALİZLİ SINAV SONUÇ BELGESİ</Text>
        </View>

        {/* Öğrenci ve Sınav Bilgileri */}
        <View style={styles.infoTable}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Öğrenci Adı</Text>
              <Text style={styles.infoValue}>{ogrenci.ad}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Numara</Text>
              <Text style={styles.infoValue}>{ogrenci.numara}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Şube</Text>
              <Text style={styles.infoValue}>{ogrenci.sinif}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Okul</Text>
              <Text style={styles.infoValue}>{ogrenci.okul || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Geldiği Okul</Text>
              <Text style={styles.infoValue}>{ogrenci.geldigiOkul || '-'}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sınav Adı</Text>
              <Text style={styles.infoValue}>{sinav.ad}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alan</Text>
              <Text style={styles.infoValue}>{sinav.alan}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sınav Tarihi</Text>
              <Text style={styles.infoValue}>{sinav.tarih}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kitapçık</Text>
              <Text style={styles.infoValue}>{sinav.kitapcik}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Danışman</Text>
              <Text style={styles.infoValue}>{sinav.danisman || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Ders Tablosu */}
        <Text style={styles.sectionTitle}>DERSLER</Text>
        <View style={styles.table}>
          {/* Tablo Başlığı */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>DERSLER</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Soru Sayısı</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Doğru</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Yanlış</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Boş</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Net</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, borderRightWidth: 0 }]}>Başarı %</Text>
          </View>

          {/* Ders Satırları */}
          {dersler.map((ders, index) => (
            <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCellLeft, { flex: 3 }]}>{ders.dersAdi}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{ders.soruSayisi}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{ders.dogru}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{ders.yanlis}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{ders.bos}</Text>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>{ders.net.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{ders.basariYuzdesi.toFixed(1)}</Text>
            </View>
          ))}

          {/* Toplam Satırı */}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.tableTotalCell, { flex: 3 }]}>TOPLAM</Text>
            <Text style={[styles.tableTotalCell, { flex: 1 }]}>{toplam.soruSayisi}</Text>
            <Text style={[styles.tableTotalCell, { flex: 1 }]}>{toplam.dogru}</Text>
            <Text style={[styles.tableTotalCell, { flex: 1 }]}>{toplam.yanlis}</Text>
            <Text style={[styles.tableTotalCell, { flex: 1 }]}>{toplam.bos}</Text>
            <Text style={[styles.tableTotalCell, { flex: 1 }]}>{toplam.net.toFixed(2)}</Text>
            <Text style={[styles.tableTotalCell, { flex: 1, borderRightWidth: 0 }]}>{toplam.basariYuzdesi.toFixed(1)}</Text>
          </View>
        </View>

        {/* Puan ve Sıralama Kutuları */}
        <View style={styles.boxContainer}>
          {/* LGS Puanı */}
          <View style={[styles.scoreBox, styles.scoreBoxBlue]}>
            <Text style={styles.scoreBoxLabel}>LGS PUANI</Text>
            <Text style={styles.scoreBoxValue}>{puan.toFixed(2)}</Text>
          </View>

          {/* Sıralama Tablosu */}
          <View style={{ flex: 2 }}>
            <View style={styles.rankTable}>
              <View style={styles.rankColumn}>
                <View style={styles.rankHeader}>
                  <Text style={styles.rankHeaderText}></Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={[styles.rankHeaderText, { fontWeight: 400 }]}>Katılımcı Sayısı</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={[styles.rankHeaderText, { fontWeight: 400 }]}>Ortalama</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={[styles.rankHeaderText, { fontWeight: 400 }]}>Derece</Text>
                </View>
              </View>
              <View style={styles.rankColumn}>
                <View style={[styles.rankHeader, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.rankHeaderText}>Şube</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={styles.rankValueText}>{siralama.sube.kisiSayisi}</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={styles.rankValueText}>{siralama.sube.ortalama.toFixed(2)}</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={styles.rankValueText}>{siralama.sube.siralama}</Text>
                </View>
              </View>
              <View style={[styles.rankColumn, { borderRightWidth: 0 }]}>
                <View style={[styles.rankHeader, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.rankHeaderText, { color: '#047857' }]}>Okul</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={styles.rankValueText}>{siralama.okul.kisiSayisi}</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={styles.rankValueText}>{siralama.okul.ortalama.toFixed(2)}</Text>
                </View>
                <View style={styles.rankValue}>
                  <Text style={styles.rankValueText}>{siralama.okul.siralama}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Optik Cevap Haritası */}
        <Text style={styles.answerMapTitle}>OPTİK CEVAP HARİTASI</Text>
        <View style={styles.answerMapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Büyük harf = Doğru</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Küçük harf = Yanlış</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.legendText}>* = Boş</Text>
          </View>
        </View>

        <View style={styles.answerMapContainer}>
          {/* Soru Numaraları */}
          <View style={styles.answerMapRow}>
            <Text style={styles.answerMapLabel}>Soru No:</Text>
            <View style={styles.answerMapCells}>
              {['1-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90'].map((range, i) => (
                <Text key={i} style={{ fontSize: 6, color: '#6B7280', width: 50, textAlign: 'center' }}>{range}</Text>
              ))}
            </View>
          </View>

          {/* Anahtar ve Öğrenci Cevapları */}
          {dersler.filter(d => d.cevapAnahtari).slice(0, 2).map((ders, dersIndex) => (
            <React.Fragment key={dersIndex}>
              <View style={styles.answerMapRow}>
                <Text style={styles.answerMapLabel}>Anahtar:</Text>
                <Text style={{ fontSize: 7, color: '#374151', flex: 1, letterSpacing: 0.5 }}>
                  {ders.cevapAnahtari}
                </Text>
              </View>
              <View style={styles.answerMapRow}>
                <Text style={styles.answerMapLabel}>Öğrenci:</Text>
                <Text style={{ fontSize: 7, color: '#374151', flex: 1, letterSpacing: 0.5 }}>
                  {ders.ogrenciCevabi}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AkademiHub © {new Date().getFullYear()}</Text>
          <Text style={styles.footerText}>
            Bu belge örnek amaçlıdır. Gerçek sınav sonuçlarını yansıtmaz.
          </Text>
          <Text style={styles.footerText}>
            Oluşturma: {new Date().toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default SinavKarnesiBasit;

