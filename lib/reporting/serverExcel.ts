import * as XLSX from 'xlsx';

export function buildExcelBuffer(input: {
  rows: any[];
  headers: Record<string, string>;
  sheetName?: string;
}) {
  const sheetName = input.sheetName || 'Rapor';

  const transformed = (input.rows || []).map((item) => {
    const row: Record<string, any> = {};
    for (const [key, label] of Object.entries(input.headers || {})) {
      row[label] = item?.[key] !== undefined ? item[key] : '';
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(transformed);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Node buffer
  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return out;
}


