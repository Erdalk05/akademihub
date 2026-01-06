'use client';

/**
 * ============================================
 * SINAV KARNESİ - DETAYLI ŞABLON (KAZANIM BAZLI)
 * ============================================
 * 
 * Detaylı konu ve kazanım analizi içeren profesyonel karne
 * A4 formatında çok sayfalı (4+ sayfa)
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
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#0EA5E9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0369A1',
    textAlign: 'center',
  },
  // Alt Başlık (Sayfa 2+)
  subHeader: {
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0369A1',
    textAlign: 'center',
  },
  // Öğrenci Bilgileri Tablosu
  infoTable: {
    flexDirection: 'row',
    marginBottom: 15,
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
    padding: 5,
    backgroundColor: '#F0F9FF',
    fontSize: 8,
    fontWeight: 500,
    color: '#0369A1',
  },
  infoValue: {
    width: '55%',
    padding: 5,
    fontSize: 8,
    color: '#1F2937',
  },
  // Ders Tablosu
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0369A1',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 8,
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
    padding: 5,
    fontSize: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    color: '#374151',
  },
  tableCellLeft: {
    padding: 5,
    fontSize: 8,
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
    padding: 6,
    fontSize: 8,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0284C7',
  },
  // Puan ve Sıralama
  boxContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  scoreBox: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoxBlue: {
    backgroundColor: '#0EA5E9',
  },
  scoreBoxLabel: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  scoreBoxValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  // Sıralama Tablosu (Küçük)
  rankTableSmall: {
    flex: 2,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rankColumnSmall: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  rankHeaderSmall: {
    padding: 5,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
  },
  rankHeaderTextSmall: {
    fontSize: 7,
    fontWeight: 700,
    color: '#0369A1',
  },
  rankValueSmall: {
    padding: 5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rankValueTextSmall: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1F2937',
  },
  rankLabelSmall: {
    fontSize: 6,
    color: '#6B7280',
  },
  // Cevap Haritası (Kompakt)
  answerMapTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0369A1',
    marginBottom: 6,
  },
  answerMapLegend: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 7,
    color: '#6B7280',
  },
  answerMapContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 6,
    borderRadius: 4,
    marginBottom: 15,
  },
  answerMapRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  answerMapLabel: {
    width: 45,
    fontSize: 6,
    color: '#6B7280',
    paddingTop: 1,
  },
  // Konu Analizi
  konuSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#FFFFFF',
    backgroundColor: '#0369A1',
    padding: 6,
    marginBottom: 0,
  },
  konuTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  konuTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
  },
  konuTableHeaderCell: {
    padding: 5,
    fontSize: 7,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0284C7',
  },
  konuTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  konuTableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  konuTableCell: {
    padding: 4,
    fontSize: 7,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    color: '#374151',
  },
  konuTableCellLeft: {
    padding: 4,
    fontSize: 7,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    color: '#374151',
  },
  konuTableCellKazanim: {
    padding: 4,
    paddingLeft: 12,
    fontSize: 6,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    color: '#6B7280',
  },
  konuTableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
  },
  konuTableTotalCell: {
    padding: 5,
    fontSize: 7,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0284C7',
  },
  // Başarı Yüzdesi Renkleri
  successHigh: {
    color: '#047857',
    fontWeight: 700,
  },
  successMedium: {
    color: '#D97706',
    fontWeight: 500,
  },
  successLow: {
    color: '#DC2626',
    fontWeight: 700,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6,
    color: '#9CA3AF',
  },
  pageNumber: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
  },
});

// Veri tipleri
export interface KazanimDetay {
  kazanimKodu?: string;
  kazanimMetni: string;
  soruSayisi: number;
  dogru: number;
  yanlis: number;
  bos: number;
  basariYuzdesi: number;
  isKonu?: boolean; // Ana konu mu yoksa alt kazanım mı
}

export interface DersKonuAnalizi {
  dersAdi: string;
  dersKodu: string;
  toplamSoru: number;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  basariYuzdesi: number;
  konular: KazanimDetay[];
}

export interface SinavKarnesiDetayliProps {
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
  // Detaylı Konu Analizi
  konuAnalizleri: DersKonuAnalizi[];
  kurumLogo?: string;
}

// Başarı yüzdesine göre stil döndür
const getSuccessStyle = (basari: number) => {
  if (basari >= 70) return styles.successHigh;
  if (basari >= 40) return styles.successMedium;
  return styles.successLow;
};

const SinavKarnesiDetayli: React.FC<SinavKarnesiDetayliProps> = ({
  ogrenci,
  sinav,
  dersler,
  toplam,
  puan,
  siralama,
  konuAnalizleri,
}) => {
  // Konu analizlerini 2'şerli gruplara böl (her sayfada 2 ders)
  const konuGruplari: DersKonuAnalizi[][] = [];
  for (let i = 0; i < konuAnalizleri.length; i += 2) {
    konuGruplari.push(konuAnalizleri.slice(i, i + 2));
  }

  return (
    <Document>
      {/* SAYFA 1: ÖZET */}
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
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>DERSLER</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Soru Sayısı</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Doğru</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Yanlış</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Boş</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Net</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, borderRightWidth: 0 }]}>Başarı %</Text>
          </View>

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

        {/* Puan ve Sıralama */}
        <View style={styles.boxContainer}>
          <View style={[styles.scoreBox, styles.scoreBoxBlue]}>
            <Text style={styles.scoreBoxLabel}>LGS PUANI</Text>
            <Text style={styles.scoreBoxValue}>{puan.toFixed(2)}</Text>
          </View>

          <View style={styles.rankTableSmall}>
            <View style={styles.rankColumnSmall}>
              <View style={styles.rankHeaderSmall}>
                <Text style={styles.rankHeaderTextSmall}></Text>
              </View>
              <View style={styles.rankValueSmall}>
                <Text style={styles.rankLabelSmall}>Katılımcı</Text>
              </View>
              <View style={styles.rankValueSmall}>
                <Text style={styles.rankLabelSmall}>Ortalama</Text>
              </View>
              <View style={[styles.rankValueSmall, { borderBottomWidth: 0 }]}>
                <Text style={styles.rankLabelSmall}>Derece</Text>
              </View>
            </View>
            <View style={styles.rankColumnSmall}>
              <View style={[styles.rankHeaderSmall, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.rankHeaderTextSmall}>Şube</Text>
              </View>
              <View style={styles.rankValueSmall}>
                <Text style={styles.rankValueTextSmall}>{siralama.sube.kisiSayisi}</Text>
              </View>
              <View style={styles.rankValueSmall}>
                <Text style={styles.rankValueTextSmall}>{siralama.sube.ortalama.toFixed(2)}</Text>
              </View>
              <View style={[styles.rankValueSmall, { borderBottomWidth: 0 }]}>
                <Text style={styles.rankValueTextSmall}>{siralama.sube.siralama}</Text>
              </View>
            </View>
            <View style={[styles.rankColumnSmall, { borderRightWidth: 0 }]}>
              <View style={[styles.rankHeaderSmall, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.rankHeaderTextSmall, { color: '#047857' }]}>Okul</Text>
              </View>
              <View style={styles.rankValueSmall}>
                <Text style={styles.rankValueTextSmall}>{siralama.okul.kisiSayisi}</Text>
              </View>
              <View style={styles.rankValueSmall}>
                <Text style={styles.rankValueTextSmall}>{siralama.okul.ortalama.toFixed(2)}</Text>
              </View>
              <View style={[styles.rankValueSmall, { borderBottomWidth: 0 }]}>
                <Text style={styles.rankValueTextSmall}>{siralama.okul.siralama}</Text>
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
          <View style={styles.answerMapRow}>
            <Text style={styles.answerMapLabel}>Soru No:</Text>
            <Text style={{ fontSize: 6, color: '#6B7280', flex: 1 }}>
              1-10        11-20       21-30       31-40       41-50       51-60       61-70       71-80       81-90
            </Text>
          </View>
          {dersler.filter(d => d.cevapAnahtari).slice(0, 2).map((ders, i) => (
            <React.Fragment key={i}>
              <View style={styles.answerMapRow}>
                <Text style={styles.answerMapLabel}>Anahtar:</Text>
                <Text style={{ fontSize: 6, color: '#374151', flex: 1, letterSpacing: 0.3 }}>
                  {ders.cevapAnahtari}
                </Text>
              </View>
              <View style={styles.answerMapRow}>
                <Text style={styles.answerMapLabel}>Öğrenci:</Text>
                <Text style={{ fontSize: 6, color: '#374151', flex: 1, letterSpacing: 0.3 }}>
                  {ders.ogrenciCevabi}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AkademiHub © {new Date().getFullYear()}</Text>
          <Text style={styles.footerText}>Sayfa 1</Text>
          <Text style={styles.footerText}>{new Date().toLocaleDateString('tr-TR')}</Text>
        </View>
      </Page>

      {/* SAYFA 2+: DETAYLI KONU ANALİZİ */}
      {konuGruplari.map((grup, grupIndex) => (
        <Page key={grupIndex} size="A4" style={styles.page}>
          {/* Alt Başlık */}
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderTitle}>DETAYLI KONU ANALİZİ</Text>
          </View>

          {/* Her grupta 2 ders */}
          {grup.map((dersAnaliz, dersIndex) => (
            <View key={dersIndex} style={{ marginBottom: 15 }}>
              {/* Ders Başlığı */}
              <Text style={styles.konuSectionTitle}>
                {dersAnaliz.dersAdi}.{ogrenci.sinif.replace(/\D/g, '') || '08'}
              </Text>

              {/* Konu Tablosu */}
              <View style={styles.konuTable}>
                <View style={styles.konuTableHeader}>
                  <Text style={[styles.konuTableHeaderCell, { flex: 5 }]}>Konu Adı</Text>
                  <Text style={[styles.konuTableHeaderCell, { flex: 1 }]}>Sayı</Text>
                  <Text style={[styles.konuTableHeaderCell, { flex: 1 }]}>Doğ</Text>
                  <Text style={[styles.konuTableHeaderCell, { flex: 1 }]}>Yan</Text>
                  <Text style={[styles.konuTableHeaderCell, { flex: 1 }]}>Boş</Text>
                  <Text style={[styles.konuTableHeaderCell, { flex: 1, borderRightWidth: 0 }]}>%</Text>
                </View>

                {/* Toplam Satırı */}
                <View style={styles.konuTableTotalRow}>
                  <Text style={[styles.konuTableTotalCell, { flex: 5, textAlign: 'left', paddingLeft: 8 }]}>
                    {dersAnaliz.dersAdi}.{ogrenci.sinif.replace(/\D/g, '') || '08'}
                  </Text>
                  <Text style={[styles.konuTableTotalCell, { flex: 1 }]}>{dersAnaliz.toplamSoru}</Text>
                  <Text style={[styles.konuTableTotalCell, { flex: 1 }]}>{dersAnaliz.toplamDogru}</Text>
                  <Text style={[styles.konuTableTotalCell, { flex: 1 }]}>{dersAnaliz.toplamYanlis}</Text>
                  <Text style={[styles.konuTableTotalCell, { flex: 1 }]}>{dersAnaliz.toplamBos}</Text>
                  <Text style={[styles.konuTableTotalCell, { flex: 1, borderRightWidth: 0 }]}>
                    {dersAnaliz.basariYuzdesi}
                  </Text>
                </View>

                {/* Konu ve Kazanım Satırları */}
                {dersAnaliz.konular.map((konu, konuIndex) => (
                  <View 
                    key={konuIndex} 
                    style={konuIndex % 2 === 0 ? styles.konuTableRow : styles.konuTableRowAlt}
                  >
                    <Text 
                      style={[
                        konu.isKonu ? styles.konuTableCellLeft : styles.konuTableCellKazanim, 
                        { flex: 5 }
                      ]}
                    >
                      {konu.isKonu ? '' : '- '}{konu.kazanimMetni}
                    </Text>
                    <Text style={[styles.konuTableCell, { flex: 1 }]}>{konu.soruSayisi}</Text>
                    <Text style={[styles.konuTableCell, { flex: 1 }]}>{konu.dogru}</Text>
                    <Text style={[styles.konuTableCell, { flex: 1 }]}>{konu.yanlis}</Text>
                    <Text style={[styles.konuTableCell, { flex: 1 }]}>{konu.bos}</Text>
                    <Text 
                      style={[
                        styles.konuTableCell, 
                        { flex: 1, borderRightWidth: 0 },
                        getSuccessStyle(konu.basariYuzdesi)
                      ]}
                    >
                      {konu.basariYuzdesi}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>AkademiHub © {new Date().getFullYear()}</Text>
            <Text style={styles.footerText}>Sayfa {grupIndex + 2}</Text>
            <Text style={styles.footerText}>{new Date().toLocaleDateString('tr-TR')}</Text>
          </View>
        </Page>
      ))}

      {/* SON SAYFA: ÖZET VE ÖNERİLER */}
      <Page size="A4" style={styles.page}>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderTitle}>DEĞERLENDİRME VE ÖNERİLER</Text>
        </View>

        {/* Zayıf Konular */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626' }]}>
            🔴 Geliştirilmesi Gereken Konular (Başarı {'<'} 50%)
          </Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: '#DC2626' }]}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Ders</Text>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Konu/Kazanım</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, borderRightWidth: 0 }]}>Başarı %</Text>
            </View>
            {konuAnalizleri.flatMap(ders => 
              ders.konular
                .filter(k => k.basariYuzdesi < 50)
                .map((konu, i) => (
                  <View key={`${ders.dersKodu}-${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCellLeft, { flex: 2 }]}>{ders.dersAdi}</Text>
                    <Text style={[styles.tableCellLeft, { flex: 4 }]}>{konu.kazanimMetni}</Text>
                    <Text style={[styles.tableCell, { flex: 1, borderRightWidth: 0, color: '#DC2626', fontWeight: 700 }]}>
                      {konu.basariYuzdesi}%
                    </Text>
                  </View>
                ))
            ).slice(0, 10)}
          </View>
        </View>

        {/* Güçlü Konular */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { color: '#047857', borderBottomColor: '#10B981' }]}>
            🟢 Güçlü Konular (Başarı {'>'} 80%)
          </Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: '#10B981' }]}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Ders</Text>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Konu/Kazanım</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, borderRightWidth: 0 }]}>Başarı %</Text>
            </View>
            {konuAnalizleri.flatMap(ders => 
              ders.konular
                .filter(k => k.basariYuzdesi >= 80)
                .map((konu, i) => (
                  <View key={`${ders.dersKodu}-${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCellLeft, { flex: 2 }]}>{ders.dersAdi}</Text>
                    <Text style={[styles.tableCellLeft, { flex: 4 }]}>{konu.kazanimMetni}</Text>
                    <Text style={[styles.tableCell, { flex: 1, borderRightWidth: 0, color: '#047857', fontWeight: 700 }]}>
                      {konu.basariYuzdesi}%
                    </Text>
                  </View>
                ))
            ).slice(0, 8)}
          </View>
        </View>

        {/* Öneri Kutusu */}
        <View style={{ 
          backgroundColor: '#F0F9FF', 
          padding: 12, 
          borderRadius: 6, 
          borderWidth: 1, 
          borderColor: '#0EA5E9' 
        }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', marginBottom: 8 }}>
            💡 Akademik Danışman Önerileri
          </Text>
          <Text style={{ fontSize: 8, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>
            • Kırmızı ile işaretlenen konulara öncelik verin ve bu konuları tekrar edin.
          </Text>
          <Text style={{ fontSize: 8, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>
            • Yeşil konulardaki başarınızı koruyun, bu konularda kendinizi geliştirmeye devam edin.
          </Text>
          <Text style={{ fontSize: 8, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>
            • Düzenli çalışma programı oluşturun ve her gün en az 2 saat ders çalışın.
          </Text>
          <Text style={{ fontSize: 8, color: '#374151', lineHeight: 1.5 }}>
            • Sorularınız için danışmanınızla iletişime geçin.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AkademiHub © {new Date().getFullYear()}</Text>
          <Text style={styles.footerText}>
            Bu belge konu analizleri MEB müfredatına göre hazırlanmıştır.
          </Text>
          <Text style={styles.footerText}>{new Date().toLocaleDateString('tr-TR')}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SinavKarnesiDetayli;

