// ============================================================================
// SPECTRA EXPORT UTILITIES
// Excel, PDF, JSON export fonksiyonları
// ============================================================================

import type {
  OgrenciSonuc,
  SinavIstatistikleri,
  CevapAnahtari,
  ExportSecenekleri,
  WizardState,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export interface ExcelExportData {
  sinavAdi: string;
  sinavTarihi: string;
  sinavTuru: string;
  sonuclar: OgrenciSonuc[];
  istatistikler: SinavIstatistikleri;
  cevapAnahtari?: CevapAnahtari;
}

/**
 * Excel export için veri hazırla
 */
export function prepareExcelData(data: ExcelExportData): any[][] {
  const rows: any[][] = [];
  
  // Başlık satırı
  const headers = [
    'Sıra',
    'Öğrenci No',
    'Ad Soyad',
    'Sınıf',
    'Kitapçık',
    'Toplam Doğru',
    'Toplam Yanlış',
    'Toplam Boş',
    'Toplam Net',
    'Kurum Sırası',
    'Yüzdelik Dilim',
    'Tahmini Puan',
    'Durum',
  ];

  // Ders başlıklarını ekle
  if (data.sonuclar[0]?.dersSonuclari) {
    for (const ders of data.sonuclar[0].dersSonuclari) {
      headers.push(`${ders.dersAdi} D`);
      headers.push(`${ders.dersAdi} Y`);
      headers.push(`${ders.dersAdi} B`);
      headers.push(`${ders.dersAdi} Net`);
    }
  }

  rows.push(headers);

  // Öğrenci verileri
  for (const sonuc of data.sonuclar) {
    const row: any[] = [
      sonuc.kurumSirasi,
      sonuc.ogrenciNo,
      sonuc.ogrenciAdi,
      sonuc.sinif || '-',
      sonuc.kitapcik,
      sonuc.toplamDogru,
      sonuc.toplamYanlis,
      sonuc.toplamBos,
      sonuc.toplamNet,
      sonuc.kurumSirasi,
      sonuc.yuzdelikDilim ? `%${sonuc.yuzdelikDilim}` : '-',
      sonuc.tahminiPuan || '-',
      sonuc.isMisafir ? 'Misafir' : 'Asil',
    ];

    // Ders bazlı sonuçlar
    for (const ders of sonuc.dersSonuclari) {
      row.push(ders.dogru);
      row.push(ders.yanlis);
      row.push(ders.bos);
      row.push(ders.net);
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Excel export (exceljs ile)
 */
export async function exportToExcel(
  data: ExcelExportData,
  options?: Partial<ExportSecenekleri>
): Promise<Blob> {
  // Dynamic import for exceljs
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'AkademiHub Spectra';
  workbook.created = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // SAYFA 1: ÖZET BİLGİLER
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.icerik?.ozetBilgiler !== false) {
    const ozetSheet = workbook.addWorksheet('Özet Bilgiler');
    
    ozetSheet.columns = [
      { width: 25 },
      { width: 30 },
    ];

    ozetSheet.addRow(['Sınav Adı', data.sinavAdi]);
    ozetSheet.addRow(['Sınav Tarihi', data.sinavTarihi]);
    ozetSheet.addRow(['Sınav Türü', data.sinavTuru]);
    ozetSheet.addRow([]);
    ozetSheet.addRow(['📊 İstatistikler']);
    ozetSheet.addRow(['Toplam Katılımcı', data.istatistikler.toplamKatilimci]);
    ozetSheet.addRow(['Asil Öğrenci', data.istatistikler.asilKatilimci]);
    ozetSheet.addRow(['Misafir Öğrenci', data.istatistikler.misafirKatilimci]);
    ozetSheet.addRow([]);
    ozetSheet.addRow(['Ortalama Net', data.istatistikler.ortalamaNet]);
    ozetSheet.addRow(['En Yüksek Net', data.istatistikler.enYuksekNet]);
    ozetSheet.addRow(['En Düşük Net', data.istatistikler.enDusukNet]);
    ozetSheet.addRow(['Medyan', data.istatistikler.medyan]);
    ozetSheet.addRow(['Standart Sapma', data.istatistikler.standartSapma]);

    // Stil
    ozetSheet.getRow(1).font = { bold: true };
    ozetSheet.getRow(5).font = { bold: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAYFA 2: ÖĞRENCİ LİSTESİ
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.icerik?.ogrenciListesi !== false) {
    const ogrenciSheet = workbook.addWorksheet('Öğrenci Listesi');
    
    // Sıralama
    let sortedSonuclar = [...data.sonuclar];
    if (options?.siralama) {
      switch (options.siralama) {
        case 'net':
          sortedSonuclar.sort((a, b) => b.toplamNet - a.toplamNet);
          break;
        case 'isim':
          sortedSonuclar.sort((a, b) => a.ogrenciAdi.localeCompare(b.ogrenciAdi, 'tr'));
          break;
        case 'numara':
          sortedSonuclar.sort((a, b) => a.ogrenciNo.localeCompare(b.ogrenciNo));
          break;
        case 'sinif':
          sortedSonuclar.sort((a, b) => (a.sinif || '').localeCompare(b.sinif || '', 'tr'));
          break;
      }
    }

    // Filtreler
    if (options?.filtreler) {
      if (options.filtreler.siniflar?.length) {
        sortedSonuclar = sortedSonuclar.filter(s => 
          options.filtreler!.siniflar!.includes(s.sinif || '')
        );
      }
      if (options.filtreler.minNet !== undefined) {
        sortedSonuclar = sortedSonuclar.filter(s => s.toplamNet >= options.filtreler!.minNet!);
      }
      if (options.filtreler.maxNet !== undefined) {
        sortedSonuclar = sortedSonuclar.filter(s => s.toplamNet <= options.filtreler!.maxNet!);
      }
      if (options.filtreler.sadeceMisafir) {
        sortedSonuclar = sortedSonuclar.filter(s => s.isMisafir);
      }
      if (options.filtreler.sadeceAsil) {
        sortedSonuclar = sortedSonuclar.filter(s => !s.isMisafir);
      }
    }

    // Başlıklar
    const headers = [
      'Sıra', 'Öğrenci No', 'Ad Soyad', 'Sınıf', 'Kitapçık',
      'Doğru', 'Yanlış', 'Boş', 'Net', 'Kurum Sırası', 'Yüzdelik', 'Tahmini Puan', 'Durum'
    ];

    // Ders başlıkları
    if (sortedSonuclar[0]?.dersSonuclari) {
      for (const ders of sortedSonuclar[0].dersSonuclari) {
        headers.push(`${ders.dersAdi} D`);
        headers.push(`${ders.dersAdi} Y`);
        headers.push(`${ders.dersAdi} B`);
        headers.push(`${ders.dersAdi} Net`);
      }
    }

    const headerRow = ogrenciSheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Veriler
    sortedSonuclar.forEach((sonuc, index) => {
      const row: any[] = [
        index + 1,
        sonuc.ogrenciNo,
        sonuc.ogrenciAdi,
        sonuc.sinif || '-',
        sonuc.kitapcik,
        sonuc.toplamDogru,
        sonuc.toplamYanlis,
        sonuc.toplamBos,
        sonuc.toplamNet,
        sonuc.kurumSirasi,
        sonuc.yuzdelikDilim ? `%${sonuc.yuzdelikDilim}` : '-',
        sonuc.tahminiPuan || '-',
        sonuc.isMisafir ? 'Misafir' : 'Asil',
      ];

      for (const ders of sonuc.dersSonuclari) {
        row.push(ders.dogru);
        row.push(ders.yanlis);
        row.push(ders.bos);
        row.push(ders.net);
      }

      const dataRow = ogrenciSheet.addRow(row);

      // Alternatif satır rengi
      if (index % 2 === 1) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0FDF4' },
        };
      }
    });

    // Kolon genişlikleri
    ogrenciSheet.columns.forEach((col, i) => {
      col.width = i < 5 ? 15 : 10;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAYFA 3: DERS BAZLI ANALİZ
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.icerik?.dersBazliAnaliz !== false) {
    const dersSheet = workbook.addWorksheet('Ders Bazlı Analiz');
    
    dersSheet.addRow(['Ders Adı', 'Ortalama Net', 'En Yüksek', 'En Düşük']);
    const dersHeaderRow = dersSheet.getRow(1);
    dersHeaderRow.font = { bold: true };

    for (const ders of data.istatistikler.dersBazliOrtalamalar) {
      dersSheet.addRow([
        ders.dersAdi,
        ders.ortalama,
        (ders as any).enYuksekNet || '-',
        (ders as any).enDusukNet || '-',
      ]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAYFA 4: SINIF KARŞILAŞTIRMA
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.icerik?.sinifKarsilastirma !== false) {
    const sinifSheet = workbook.addWorksheet('Sınıf Karşılaştırma');
    
    sinifSheet.addRow(['Sınıf', 'Öğrenci Sayısı', 'Ortalama Net', 'En Yüksek', 'En Düşük']);
    const sinifHeaderRow = sinifSheet.getRow(1);
    sinifHeaderRow.font = { bold: true };

    for (const sinif of data.istatistikler.sinifBazliOrtalamalar) {
      sinifSheet.addRow([
        sinif.sinif,
        sinif.ogrenciSayisi,
        sinif.ortalama,
        (sinif as any).enYuksekNet || '-',
        (sinif as any).enDusukNet || '-',
      ]);
    }
  }

  // Blob olarak döndür
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PDF export (jspdf ile)
 */
export async function exportToPDF(
  data: ExcelExportData,
  options?: Partial<ExportSecenekleri>
): Promise<Blob> {
  // Dynamic imports
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Başlık
  doc.setFontSize(18);
  doc.text(data.sinavAdi, 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Tarih: ${data.sinavTarihi} | Tür: ${data.sinavTuru}`, 14, 22);

  // İstatistik özeti
  doc.setFontSize(12);
  doc.text('📊 Özet İstatistikler', 14, 32);
  
  doc.setFontSize(9);
  doc.text([
    `Toplam: ${data.istatistikler.toplamKatilimci} | Asil: ${data.istatistikler.asilKatilimci} | Misafir: ${data.istatistikler.misafirKatilimci}`,
    `Ortalama: ${data.istatistikler.ortalamaNet} | En Yüksek: ${data.istatistikler.enYuksekNet} | En Düşük: ${data.istatistikler.enDusukNet}`,
  ], 14, 38);

  // Öğrenci tablosu
  const tableData = data.sonuclar.map((s, i) => [
    String(i + 1),
    s.ogrenciNo,
    s.ogrenciAdi,
    s.sinif || '-',
    s.kitapcik,
    String(s.toplamDogru),
    String(s.toplamYanlis),
    String(s.toplamBos),
    s.toplamNet.toFixed(1),
    String(s.kurumSirasi || '-'),
    s.yuzdelikDilim ? `%${s.yuzdelikDilim}` : '-',
    s.isMisafir ? 'M' : 'A',
  ]);

  autoTable(doc, {
    startY: 48,
    head: [[
      '#', 'No', 'Ad Soyad', 'Sınıf', 'Kit.', 'D', 'Y', 'B', 'Net', 'Sıra', 'Yüzdelik', 'Durum'
    ]],
    body: tableData as string[][],
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 15 },
      2: { cellWidth: 40 },
      3: { cellWidth: 15 },
      4: { cellWidth: 10 },
      5: { cellWidth: 10 },
      6: { cellWidth: 10 },
      7: { cellWidth: 10 },
      8: { cellWidth: 12 },
      9: { cellWidth: 12 },
      10: { cellWidth: 15 },
      11: { cellWidth: 12 },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Sayfa ${i}/${pageCount} | AkademiHub Spectra`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JSON export
 */
export function exportToJSON(
  data: ExcelExportData,
  options?: Partial<ExportSecenekleri>
): Blob {
  const exportData = {
    meta: {
      sinavAdi: data.sinavAdi,
      sinavTarihi: data.sinavTarihi,
      sinavTuru: data.sinavTuru,
      exportTarihi: new Date().toISOString(),
      version: '2.0',
    },
    istatistikler: data.istatistikler,
    sonuclar: data.sonuclar.map(s => ({
      ogrenciNo: s.ogrenciNo,
      ogrenciAdi: s.ogrenciAdi,
      sinif: s.sinif,
      kitapcik: s.kitapcik,
      toplamDogru: s.toplamDogru,
      toplamYanlis: s.toplamYanlis,
      toplamBos: s.toplamBos,
      toplamNet: s.toplamNet,
      kurumSirasi: s.kurumSirasi,
      yuzdelikDilim: s.yuzdelikDilim,
      tahminiPuan: s.tahminiPuan,
      isMisafir: s.isMisafir,
      dersSonuclari: s.dersSonuclari.map(d => ({
        dersKodu: d.dersKodu,
        dersAdi: d.dersAdi,
        dogru: d.dogru,
        yanlis: d.yanlis,
        bos: d.bos,
        net: d.net,
      })),
    })),
    cevapAnahtari: data.cevapAnahtari ? {
      toplamSoru: data.cevapAnahtari.toplamSoru,
      items: data.cevapAnahtari.items.map(i => ({
        soruNo: i.soruNo,
        dogruCevap: i.dogruCevap,
        dersKodu: i.dersKodu,
        kazanimKodu: i.kazanimKodu,
      })),
    } : undefined,
  };

  const json = JSON.stringify(exportData, null, 2);
  return new Blob([json], { type: 'application/json' });
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CSV export
 */
export function exportToCSV(data: ExcelExportData): Blob {
  const rows = prepareExcelData(data);
  
  const csvContent = rows
    .map(row => 
      row.map(cell => {
        const str = String(cell ?? '');
        // Virgül, tırnak veya newline içeriyorsa quote ile sar
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
    .join('\n');

  // UTF-8 BOM ekle (Excel uyumluluğu için)
  const bom = '\uFEFF';
  return new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Blob'u dosya olarak indir
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ana export fonksiyonu
 */
export async function exportExam(
  data: ExcelExportData,
  format: 'excel' | 'pdf' | 'csv' | 'json',
  options?: Partial<ExportSecenekleri>
): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeFilename = data.sinavAdi.replace(/[^a-zA-Z0-9ğüşöçİĞÜŞÖÇ\s]/g, '').replace(/\s+/g, '_');

  let blob: Blob;
  let extension: string;

  switch (format) {
    case 'excel':
      blob = await exportToExcel(data, options);
      extension = 'xlsx';
      break;
    case 'pdf':
      blob = await exportToPDF(data, options);
      extension = 'pdf';
      break;
    case 'csv':
      blob = exportToCSV(data);
      extension = 'csv';
      break;
    case 'json':
      blob = exportToJSON(data, options);
      extension = 'json';
      break;
  }

  downloadBlob(blob, `${safeFilename}_${timestamp}.${extension}`);
}

