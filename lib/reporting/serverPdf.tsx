import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10 },
  header: { marginBottom: 12 },
  title: { fontSize: 14, fontWeight: 700 },
  subtitle: { fontSize: 10, color: '#666', marginTop: 4 },
  table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row' },
  cell: { padding: 4, borderRightWidth: 1, borderRightColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headCell: { backgroundColor: '#f3f4f6', fontWeight: 700 },
});

function normalize(value: any) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  return String(value);
}

export function ReportTablePdf(props: {
  title: string;
  subtitle?: string | null;
  headers: Record<string, string>;
  rows: any[];
  orientation?: 'portrait' | 'landscape';
}) {
  const headerEntries = Object.entries(props.headers || {});
  const colCount = Math.max(headerEntries.length, 1);
  const colWidthPct = 100 / colCount;

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation={props.orientation || 'portrait'}>
        <View style={styles.header}>
          <Text style={styles.title}>{props.title}</Text>
          {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            {headerEntries.map(([key, label], idx) => (
              <View key={key} style={[styles.cell, styles.headCell, { width: `${colWidthPct}%` }, idx === colCount - 1 ? { borderRightWidth: 0 } : null]}>
                <Text>{label}</Text>
              </View>
            ))}
          </View>

          {(props.rows || []).slice(0, 500).map((r, i) => (
            <View key={i} style={styles.row}>
              {headerEntries.map(([key], idx) => (
                <View key={`${i}-${key}`} style={[styles.cell, { width: `${colWidthPct}%` }, idx === colCount - 1 ? { borderRightWidth: 0 } : null]}>
                  <Text>{normalize(r?.[key])}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {(props.rows || []).length > 500 ? (
          <Text style={{ marginTop: 8, color: '#666' }}>
            Not: Performans için ilk 500 satır üretildi. (Satır sayısı: {(props.rows || []).length})
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}


