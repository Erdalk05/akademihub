/**
 * ============================================
 * AkademiHub - Column Mapper
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Dinamik kolon eşleştirme
 * - Otomatik kolon tespiti
 * - Preset yönetimi
 * - Cihaz bazlı hatırlama
 */

import type {
  ColumnType,
  ColumnMapping,
  ColumnMappingResult,
  ColumnMappingPreset,
  MappingSuggestion
} from '../types';
import { COLUMN_NAME_ALIASES, REQUIRED_COLUMN_TYPES } from '../types';

// ==================== AUTO DETECT ====================

/**
 * Kolonları otomatik tespit eder
 */
export function autoDetectColumns(
  headers: string[],
  sampleRows: Record<string, unknown>[]
): ColumnMappingResult {
  const mappings: ColumnMapping[] = [];
  const suggestions: MappingSuggestion[] = [];
  let totalConfidence = 0;
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const sampleValues = sampleRows.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    
    // Kolon tipini tespit et
    const detection = detectColumnType(header, sampleValues as string[]);
    
    const mapping: ColumnMapping = {
      sourceColumn: header,
      sourceIndex: i,
      targetType: detection.type,
      confidence: detection.confidence,
      isManual: false
    };
    
    // Cevap kolonu ise soru numarası belirle
    if (detection.type === 'answer' && detection.questionNumber) {
      mapping.questionNumber = detection.questionNumber;
    }
    
    mappings.push(mapping);
    totalConfidence += detection.confidence;
    
    // Düşük güvenli tespitler için öneri
    if (detection.confidence < 70 && detection.type !== 'unknown' && detection.type !== 'ignore') {
      suggestions.push({
        column: header,
        suggestedType: detection.type,
        reason: detection.reason || 'Otomatik tespit edildi',
        confidence: detection.confidence
      });
    }
  }
  
  // Eksik zorunlu kolonları kontrol et
  const missingRequired: ColumnType[] = [];
  const mappedTypes = mappings.map(m => m.targetType);
  
  for (const required of REQUIRED_COLUMN_TYPES) {
    if (required === 'answer') {
      // En az bir cevap kolonu olmalı
      if (!mappedTypes.some(t => t === 'answer')) {
        missingRequired.push('answer');
      }
    } else if (!mappedTypes.includes(required)) {
      missingRequired.push(required);
    }
  }
  
  // Genel güven skoru
  const avgConfidence = mappings.length > 0 ? totalConfidence / mappings.length : 0;
  
  return {
    mappings,
    autoDetected: true,
    confidence: Math.round(avgConfidence),
    missingRequired,
    suggestions
  };
}

// ==================== KOLON TİPİ TESPİT ====================

interface ColumnDetection {
  type: ColumnType;
  confidence: number;
  questionNumber?: number;
  reason?: string;
}

function detectColumnType(header: string, sampleValues: string[]): ColumnDetection {
  const headerLower = header.toLowerCase().trim();
  const headerNormalized = normalizeText(headerLower);
  
  // 1. Soru numarası kontrolü (1, 2, 3... veya S1, S2... veya Soru 1...)
  const questionMatch = headerLower.match(/^(?:s|soru\s*)?(\d+)$/);
  if (questionMatch) {
    const qNum = parseInt(questionMatch[1], 10);
    if (qNum >= 1 && qNum <= 200) {
      // Değerlerin cevap formatında olup olmadığını kontrol et
      const isAnswerLike = sampleValues.every(v => 
        isValidAnswerValue(v)
      );
      
      if (isAnswerLike || sampleValues.length === 0) {
        return {
          type: 'answer',
          confidence: 95,
          questionNumber: qNum,
          reason: 'Soru numarası formatı'
        };
      }
    }
  }
  
  // 2. Alias kontrolü
  for (const [type, aliases] of Object.entries(COLUMN_NAME_ALIASES) as [ColumnType, string[]][]) {
    if (type === 'unknown' || type === 'ignore') continue;
    
    for (const alias of aliases) {
      if (headerNormalized.includes(normalizeText(alias))) {
        const confidence = calculateAliasConfidence(headerLower, alias, sampleValues, type);
        return {
          type,
          confidence,
          reason: `"${alias}" ile eşleşti`
        };
      }
    }
  }
  
  // 3. Değer analizi
  if (sampleValues.length > 0) {
    // TC Kimlik (11 haneli sayı)
    if (sampleValues.every(v => /^\d{11}$/.test(String(v)))) {
      return {
        type: 'tc_no',
        confidence: 90,
        reason: '11 haneli sayı formatı'
      };
    }
    
    // Öğrenci numarası (sayısal veya alfanumerik)
    if (sampleValues.every(v => /^[A-Za-z0-9-]+$/.test(String(v)) && String(v).length < 20)) {
      if (headerLower.includes('no') || headerLower.includes('numara')) {
        return {
          type: 'student_no',
          confidence: 85,
          reason: 'Numara formatı'
        };
      }
    }
    
    // Sınıf (5-A, 8/B, 12A gibi)
    if (sampleValues.every(v => /^[1-9]?[0-2]?[-\/]?[A-Za-z]?$/.test(String(v)))) {
      return {
        type: 'class',
        confidence: 75,
        reason: 'Sınıf formatı'
      };
    }
    
    // Kitapçık (A, B, C, D)
    if (sampleValues.every(v => /^[ABCD]$/i.test(String(v)))) {
      if (!questionMatch) {
        return {
          type: 'booklet_type',
          confidence: 80,
          reason: 'Kitapçık formatı'
        };
      }
    }
    
    // Cevap değerleri (A, B, C, D, E veya boş)
    if (sampleValues.every(v => isValidAnswerValue(v))) {
      // Eğer header sayısal değilse bu muhtemelen cevap değil
      if (!questionMatch) {
        return {
          type: 'unknown',
          confidence: 40,
          reason: 'Cevap gibi görünüyor ama soru numarası yok'
        };
      }
    }
  }
  
  // 4. Bilinmeyen
  return {
    type: 'unknown',
    confidence: 0,
    reason: 'Tespit edilemedi'
  };
}

function isValidAnswerValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  const str = String(value).trim().toUpperCase();
  return /^[ABCDE]$/.test(str) || ['X', '-', '.', '*', 'BOŞ', 'BOS'].includes(str);
}

function calculateAliasConfidence(
  header: string,
  alias: string,
  sampleValues: string[],
  type: ColumnType
): number {
  let confidence = 70; // Base confidence
  
  // Tam eşleşme
  if (header === alias) {
    confidence = 95;
  } else if (header.startsWith(alias) || header.endsWith(alias)) {
    confidence = 85;
  }
  
  // Değer uyumu kontrolü
  if (sampleValues.length > 0) {
    switch (type) {
      case 'tc_no':
        if (sampleValues.every(v => /^\d{11}$/.test(String(v)))) {
          confidence += 10;
        }
        break;
      case 'student_no':
        if (sampleValues.every(v => /^[A-Za-z0-9-]+$/.test(String(v)))) {
          confidence += 5;
        }
        break;
      case 'booklet_type':
        if (sampleValues.every(v => /^[ABCD]$/i.test(String(v)))) {
          confidence += 10;
        }
        break;
    }
  }
  
  return Math.min(confidence, 100);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

// ==================== MANUAL MAPPING ====================

/**
 * Manuel kolon eşleştirmesi uygular
 */
export function applyManualMapping(
  currentMapping: ColumnMappingResult,
  columnIndex: number,
  newType: ColumnType,
  questionNumber?: number
): ColumnMappingResult {
  const mappings = [...currentMapping.mappings];
  
  const mapping = mappings[columnIndex];
  if (mapping) {
    mapping.targetType = newType;
    mapping.isManual = true;
    mapping.confidence = 100;
    
    if (newType === 'answer' && questionNumber) {
      mapping.questionNumber = questionNumber;
    } else {
      delete mapping.questionNumber;
    }
  }
  
  // Eksik zorunlu kolonları yeniden kontrol et
  const missingRequired: ColumnType[] = [];
  const mappedTypes = mappings.map(m => m.targetType);
  
  for (const required of REQUIRED_COLUMN_TYPES) {
    if (required === 'answer') {
      if (!mappedTypes.some(t => t === 'answer')) {
        missingRequired.push('answer');
      }
    } else if (!mappedTypes.includes(required)) {
      missingRequired.push(required);
    }
  }
  
  return {
    ...currentMapping,
    mappings,
    missingRequired
  };
}

/**
 * Cevap kolonlarını toplu ayarlar
 */
export function setAnswerRange(
  currentMapping: ColumnMappingResult,
  startColumnIndex: number,
  endColumnIndex: number,
  startQuestionNumber: number = 1
): ColumnMappingResult {
  const mappings = [...currentMapping.mappings];
  
  let questionNum = startQuestionNumber;
  
  for (let i = startColumnIndex; i <= endColumnIndex; i++) {
    if (mappings[i]) {
      mappings[i].targetType = 'answer';
      mappings[i].questionNumber = questionNum;
      mappings[i].isManual = true;
      mappings[i].confidence = 100;
      questionNum++;
    }
  }
  
  // Eksik kontrolü
  const missingRequired = currentMapping.missingRequired.filter(t => t !== 'answer');
  
  return {
    ...currentMapping,
    mappings,
    missingRequired
  };
}

// ==================== PRESET YÖNETİMİ ====================

const PRESET_STORAGE_KEY = 'akademihub_import_presets';

/**
 * Preset kaydeder
 */
export function savePreset(preset: ColumnMappingPreset): void {
  const presets = loadPresets();
  
  // Aynı ID varsa güncelle
  const existingIndex = presets.findIndex(p => p.id === preset.id);
  if (existingIndex >= 0) {
    presets[existingIndex] = preset;
  } else {
    presets.push(preset);
  }
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }
}

/**
 * Preset'leri yükler
 */
export function loadPresets(): ColumnMappingPreset[] {
  if (typeof localStorage === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(PRESET_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Preset siler
 */
export function deletePreset(presetId: string): void {
  const presets = loadPresets().filter(p => p.id !== presetId);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }
}

/**
 * En uygun preset'i bulur
 */
export function findMatchingPreset(headers: string[]): ColumnMappingPreset | null {
  const presets = loadPresets();
  
  if (presets.length === 0) return null;
  
  // Header'ları normalize et
  const normalizedHeaders = headers.map(h => normalizeText(h));
  
  let bestMatch: ColumnMappingPreset | null = null;
  let bestScore = 0;
  
  for (const preset of presets) {
    const presetHeaders = preset.mappings.map(m => normalizeText(m.sourceColumn));
    
    // Eşleşen header sayısı
    const matchCount = presetHeaders.filter(ph => normalizedHeaders.includes(ph)).length;
    const score = matchCount / Math.max(presetHeaders.length, normalizedHeaders.length);
    
    if (score > bestScore && score >= 0.8) {
      bestScore = score;
      bestMatch = preset;
    }
  }
  
  return bestMatch;
}

/**
 * Preset'ten mapping oluşturur
 */
export function applyPreset(
  preset: ColumnMappingPreset,
  headers: string[]
): ColumnMappingResult {
  const mappings: ColumnMapping[] = headers.map((header, index) => {
    // Preset'te bu kolon var mı?
    const presetMapping = preset.mappings.find(pm => 
      normalizeText(pm.sourceColumn) === normalizeText(header)
    );
    
    if (presetMapping) {
      return {
        ...presetMapping,
        sourceColumn: header,
        sourceIndex: index
      };
    }
    
    // Yoksa unknown
    return {
      sourceColumn: header,
      sourceIndex: index,
      targetType: 'unknown',
      confidence: 0,
      isManual: false
    };
  });
  
  // Preset kullanım sayısını artır
  preset.usageCount = (preset.usageCount || 0) + 1;
  savePreset(preset);
  
  return {
    mappings,
    autoDetected: false,
    confidence: 85,
    missingRequired: [],
    suggestions: []
  };
}

// ==================== EXPORT ====================

export default {
  autoDetectColumns,
  applyManualMapping,
  setAnswerRange,
  savePreset,
  loadPresets,
  deletePreset,
  findMatchingPreset,
  applyPreset
};

