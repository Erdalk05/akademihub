/**
 * Excel Export Utility
 * Basit ve hızlı Excel export fonksiyonları
 */

import * as XLSX from 'xlsx';

interface Student {
  id?: string;
  student_no?: string;
  parent_name?: string;
  class?: string;
  section?: string;
  parent_phone?: string;
  status?: string;
  created_at?: string;
  total_amount?: number;
  paid_amount?: number;
  balance?: number;
  risk_level?: string;
}

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Export student list to Excel
 */
export async function exportStudentsToExcel(
  students: Student[],
  options: ExportOptions = {}
) {
  const {
    filename = 'Ogrenci_Listesi',
    sheetName = 'Öğrenciler',
    includeTimestamp = true,
  } = options;

  const data = students.map((student, index) => ({
    'No': index + 1,
    'Öğrenci No': student.student_no || '-',
    'Öğrenci Adı': student.parent_name || '-',
    'Sınıf': student.class || '-',
    'Şube': student.section || '-',
    'Telefon': student.parent_phone || '-',
    'Durum': getStatusText(student.status),
    'Kayıt Tarihi': student.created_at
      ? new Date(student.created_at).toLocaleDateString('tr-TR')
      : '-',
    'Toplam Tutar': student.total_amount || 0,
    'Ödenen': student.paid_amount || 0,
    'Kalan': student.balance || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  // Kolon genişlikleri
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 8 },
    { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const timestamp = includeTimestamp ? `_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}` : '';
  const finalFilename = `${filename}${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);

  return { success: true, filename: finalFilename, rowCount: students.length };
}

/**
 * Export financial report to Excel
 */
export async function exportFinancialReportToExcel(
  data: any[],
  options: ExportOptions = {}
) {
  const {
    filename = 'Mali_Rapor',
    sheetName = 'Mali Rapor',
    includeTimestamp = true,
  } = options;

  const reportData = data.map((item, index) => ({
    'No': index + 1,
    'Öğrenci': item.studentName || '-',
    'Taksit No': item.installmentNo || '-',
    'Vade Tarihi': item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : '-',
    'Tutar': item.amount || 0,
    'Ödenen': item.paidAmount || 0,
    'Kalan': item.remainingAmount || 0,
    'Durum': item.status || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(reportData);
  const wb = XLSX.utils.book_new();

  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const timestamp = includeTimestamp ? `_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}` : '';
  const finalFilename = `${filename}${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);

  return { success: true, filename: finalFilename, rowCount: data.length };
}

/**
 * Export generic data to Excel
 */
export async function exportToExcel(
  data: any[],
  headers: Record<string, string>,
  options: ExportOptions = {}
) {
  const {
    filename = 'Export',
    sheetName = 'Sheet1',
    includeTimestamp = true,
  } = options;

  const transformedData = data.map((item) => {
    const row: Record<string, any> = {};
    Object.entries(headers).forEach(([key, label]) => {
      row[label] = item[key] !== undefined ? item[key] : '-';
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(transformedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const timestamp = includeTimestamp ? `_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}` : '';
  const finalFilename = `${filename}${timestamp}.xlsx`;

  XLSX.writeFile(wb, finalFilename);

  return { success: true, filename: finalFilename, rowCount: data.length };
}

function getStatusText(status?: string): string {
  const statusMap: Record<string, string> = {
    active: 'Aktif',
    inactive: 'Pasif',
    graduated: 'Mezun',
    suspended: 'Askıda',
  };
  return statusMap[status || ''] || status || '-';
}
