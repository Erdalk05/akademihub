/**
 * TXT Import Modülü
 * 
 * İki farklı TXT formatını destekler:
 * - OPTIC_RAW: Optik okuyucudan gelen ham veri
 * - REPORT_EXPORT: Hazır sonuç/rapor dosyası
 */

export * from './types';
export { detectTxtKind } from './detectTxtKind';
export { parseReportExportTxt } from './reportExportParser';
