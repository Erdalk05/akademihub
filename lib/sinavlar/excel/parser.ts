/**
 * 📊 Excel Parser
 * Excel dosyalarını okuma ve ayrıştırma
 */

import * as XLSX from 'xlsx';
import { ExcelRow, ImportResult, ColumnMapping, ParsedQuestion } from './types';
import { validateData, hasErrors, countBySeverity } from './validator';
import { cleanText } from './turkish';
import { detectColumns, createMappingFromDetection } from './columnDetector';

/**
 * Read Excel file and return rows
 */
export async function readExcelFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Read first sheet
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        
        // Get raw JSON data with headers
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1,
          defval: '',
          raw: false  // Convert to strings
        }) as any[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel dosyası boş veya sadece başlık satırı içeriyor'));
          return;
        }
        
        // Convert to object format
        const headers = jsonData[0].map((h: any) => cleanText(String(h || '')));
        
        const rows = jsonData.slice(1).map((row: any[]) => {
          const obj: ExcelRow = {};
          headers.forEach((header: string, index: number) => {
            if (header) {
              obj[header] = row[index] !== undefined ? String(row[index]) : '';
            }
          });
          return obj;
        });
        
        // Filter out completely empty rows
        const nonEmptyRows = rows.filter(row => 
          Object.values(row).some(v => cleanText(v))
        );
        
        // Add header row at beginning for compatibility
        const headerRow: ExcelRow = {};
        headers.forEach((h: string) => { if (h) headerRow[h] = h; });
        
        resolve([headerRow, ...nonEmptyRows]);
        
      } catch (error: any) {
        reject(new Error('Excel dosyası okunamadı: ' + (error?.message || 'Bilinmeyen hata')));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse text (copy-paste) data
 */
export function parseTextData(text: string, delimiter: string = '\t'): ExcelRow[] {
  const lines = text.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('En az 2 satır gerekli (başlık + veri)');
  }
  
  // Parse headers
  const headers = lines[0].split(delimiter).map(h => cleanText(h));
  
  // Parse data rows
  const rows = lines.slice(1).map(line => {
    const values = line.split(delimiter);
    const obj: ExcelRow = {};
    
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = values[index] !== undefined ? cleanText(values[index]) : '';
      }
    });
    
    return obj;
  });
  
  // Filter empty rows
  const nonEmptyRows = rows.filter(row => 
    Object.values(row).some(v => v)
  );
  
  // Add header row
  const headerRow: ExcelRow = {};
  headers.forEach(h => { if (h) headerRow[h] = h; });
  
  return [headerRow, ...nonEmptyRows];
}

/**
 * Convert raw rows to parsed questions
 */
export function convertToQuestions(
  data: ExcelRow[],
  mapping: ColumnMapping
): ParsedQuestion[] {
  
  const questions: ParsedQuestion[] = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    const isEmpty = Object.values(row).every(v => !cleanText(v));
    if (isEmpty) continue;
    
    // Parse soru no
    const soruNoCol = mapping.soru_no || mapping.a_soru_no || '';
    const soruNoRaw = cleanText(row[soruNoCol]);
    const soruNo = parseInt(soruNoRaw) || i;
    
    // Parse other fields
    const testKodu = mapping.test_kodu ? cleanText(row[mapping.test_kodu]) : undefined;
    const dersAdi = cleanText(row[mapping.ders] || '');
    const dogruCevap = cleanText(row[mapping.dogru_cevap] || '').toUpperCase();
    const kazanimKodu = mapping.kazanim_kodu ? cleanText(row[mapping.kazanim_kodu]) : undefined;
    const kazanimMetni = mapping.kazanim_aciklama ? cleanText(row[mapping.kazanim_aciklama]) : undefined;
    
    // Parse booklet-specific numbers
    const kitapcikSoruNo: ParsedQuestion['kitapcikSoruNo'] = {};
    
    if (mapping.a_soru_no) {
      const val = parseInt(cleanText(row[mapping.a_soru_no]));
      if (!isNaN(val)) kitapcikSoruNo.A = val;
    }
    if (mapping.b_soru_no) {
      const val = parseInt(cleanText(row[mapping.b_soru_no]));
      if (!isNaN(val)) kitapcikSoruNo.B = val;
    }
    if (mapping.c_soru_no) {
      const val = parseInt(cleanText(row[mapping.c_soru_no]));
      if (!isNaN(val)) kitapcikSoruNo.C = val;
    }
    if (mapping.d_soru_no) {
      const val = parseInt(cleanText(row[mapping.d_soru_no]));
      if (!isNaN(val)) kitapcikSoruNo.D = val;
    }
    
    questions.push({
      soruNo,
      testKodu,
      dersAdi,
      dogruCevap,
      kazanimKodu,
      kazanimMetni,
      kitapcikSoruNo: Object.keys(kitapcikSoruNo).length > 0 ? kitapcikSoruNo : undefined
    });
  }
  
  return questions;
}

/**
 * Full parsing pipeline
 */
export async function parseExcelWithDetection(file: File): Promise<{
  data: ExcelRow[];
  detection: Awaited<ReturnType<typeof detectColumns>>;
  mapping: ColumnMapping;
  questions: ParsedQuestion[];
  validation: ReturnType<typeof countBySeverity>;
}> {
  // 1. Read file
  const data = await readExcelFile(file);
  
  // 2. Detect columns
  const detection = await detectColumns(data);
  
  // 3. Create mapping
  const mapping = createMappingFromDetection(detection);
  
  // 4. Validate
  const warnings = validateData(data, mapping);
  const validation = countBySeverity(warnings);
  
  // 5. Convert to questions
  const questions = convertToQuestions(data, mapping);
  
  return {
    data,
    detection,
    mapping,
    questions,
    validation
  };
}

/**
 * Parse text with detection
 */
export async function parseTextWithDetection(text: string): Promise<{
  data: ExcelRow[];
  detection: Awaited<ReturnType<typeof detectColumns>>;
  mapping: ColumnMapping;
  questions: ParsedQuestion[];
  validation: ReturnType<typeof countBySeverity>;
}> {
  // 1. Parse text
  const data = parseTextData(text);
  
  // 2. Detect columns
  const detection = await detectColumns(data);
  
  // 3. Create mapping
  const mapping = createMappingFromDetection(detection);
  
  // 4. Validate
  const warnings = validateData(data, mapping);
  const validation = countBySeverity(warnings);
  
  // 5. Convert to questions
  const questions = convertToQuestions(data, mapping);
  
  return {
    data,
    detection,
    mapping,
    questions,
    validation
  };
}

