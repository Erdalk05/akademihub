/**
 * ============================================
 * AkademiHub - Guided Mapping Component
 * ============================================
 * 
 * PHASE 8.2 - UX Refinement
 * 
 * BU DOSYA:
 * - Anne Testi uyumlu kolon eşleştirme
 * - Basit evet/hayır sorular
 * - Görsel önizleme
 * 
 * PRENSİP:
 * Öğretmen teknik terimler görmemeli!
 * "Bunu öğrenci numarası olarak kullanayım mı?"
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { ColumnMapping, ColumnType } from '../types';
import { matchColumnName } from '../validation/fuzzyMatcher';

// ==================== TYPES ====================

export interface GuidedMappingProps {
  /** Mevcut kolon mapping */
  mappings: ColumnMapping[];
  
  /** Örnek veriler */
  sampleData: Record<string, unknown>[];
  
  /** Mapping değiştiğinde */
  onMappingChange: (mappings: ColumnMapping[]) => void;
  
  /** Tamamlandığında */
  onComplete: () => void;
  
  /** Geri git */
  onBack: () => void;
}

interface ColumnSuggestion {
  column: string;
  index: number;
  suggestedType: ColumnType;
  confidence: number;
  humanReadable: string;
  sampleValues: string[];
}

// ==================== CONSTANTS ====================

const TYPE_LABELS: Partial<Record<ColumnType, { label: string; emoji: string; description: string }>> = {
  student_no: { 
    label: 'Öğrenci Numarası', 
    emoji: '🔢', 
    description: 'Her öğrencinin benzersiz numarası'
  },
  tc_no: { 
    label: 'TC Kimlik Numarası', 
    emoji: '🪪', 
    description: '11 haneli TC kimlik numarası'
  },
  full_name: { 
    label: 'Ad Soyad', 
    emoji: '👤', 
    description: 'Öğrencinin tam adı'
  },
  first_name: { 
    label: 'Ad', 
    emoji: '👤', 
    description: 'Öğrencinin adı'
  },
  last_name: { 
    label: 'Soyad', 
    emoji: '👤', 
    description: 'Öğrencinin soyadı'
  },
  class: { 
    label: 'Sınıf', 
    emoji: '🏫', 
    description: 'Öğrencinin sınıfı (örn: 8-A)'
  },
  section: { 
    label: 'Şube', 
    emoji: '📚', 
    description: 'Öğrencinin şubesi'
  },
  booklet_type: { 
    label: 'Kitapçık Türü', 
    emoji: '📖', 
    description: 'Sınav kitapçığı (A, B, C, D)'
  },
  answer: { 
    label: 'Cevap', 
    emoji: '✍️', 
    description: 'Soru cevabı'
  },
  answer_range: {
    label: 'Cevap Aralığı',
    emoji: '✍️',
    description: 'Birden fazla soru cevabı'
  },
  ignore: { 
    label: 'Atla', 
    emoji: '⏭️', 
    description: 'Bu sütunu kullanma'
  },
  unknown: { 
    label: 'Belirsiz', 
    emoji: '❓', 
    description: 'Henüz tanımlanmadı'
  }
};

// ==================== MAIN COMPONENT ====================

export function GuidedMapping({
  mappings,
  sampleData,
  onMappingChange,
  onComplete,
  onBack
}: GuidedMappingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmedMappings, setConfirmedMappings] = useState<Set<number>>(new Set());
  
  // Öneri gerektiren kolonları bul
  const suggestions = useMemo(() => {
    const result: ColumnSuggestion[] = [];
    
    for (const mapping of mappings) {
      // Zaten cevap olan veya yüksek güvenli olanları atla
      if (mapping.targetType === 'answer' && mapping.confidence >= 90) continue;
      if (mapping.targetType === 'ignore') continue;
      
      // Düşük güvenli veya unknown olanları göster
      if (mapping.confidence < 90 || mapping.targetType === 'unknown') {
        const columnMatch = matchColumnName(mapping.sourceColumn);
        
        const sampleValues = sampleData
          .slice(0, 3)
          .map(row => String(row[mapping.sourceColumn] || ''))
          .filter(Boolean);
        
        result.push({
          column: mapping.sourceColumn,
          index: mapping.sourceIndex,
          suggestedType: columnMatch?.type as ColumnType || 'unknown',
          confidence: columnMatch?.confidence || 0,
          humanReadable: columnMatch?.suggestion || 'Bilinmiyor',
          sampleValues
        });
      }
    }
    
    return result;
  }, [mappings, sampleData]);
  
  // Mevcut öneri
  const currentSuggestion = suggestions[currentStep];
  
  // Kabul et
  const handleAccept = () => {
    if (!currentSuggestion) return;
    
    const newMappings = [...mappings];
    const mapping = newMappings.find(m => m.sourceIndex === currentSuggestion.index);
    
    if (mapping) {
      mapping.targetType = currentSuggestion.suggestedType;
      mapping.confidence = 100;
      mapping.isManual = true;
    }
    
    setConfirmedMappings(prev => new Set([...prev, currentSuggestion.index]));
    onMappingChange(newMappings);
    
    if (currentStep < suggestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  // Reddet (farklı tip seç)
  const handleReject = (newType: ColumnType) => {
    if (!currentSuggestion) return;
    
    const newMappings = [...mappings];
    const mapping = newMappings.find(m => m.sourceIndex === currentSuggestion.index);
    
    if (mapping) {
      mapping.targetType = newType;
      mapping.confidence = 100;
      mapping.isManual = true;
    }
    
    setConfirmedMappings(prev => new Set([...prev, currentSuggestion.index]));
    onMappingChange(newMappings);
    
    if (currentStep < suggestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  // Atla
  const handleSkip = () => {
    if (!currentSuggestion) return;
    
    const newMappings = [...mappings];
    const mapping = newMappings.find(m => m.sourceIndex === currentSuggestion.index);
    
    if (mapping) {
      mapping.targetType = 'ignore';
      mapping.confidence = 100;
      mapping.isManual = true;
    }
    
    onMappingChange(newMappings);
    
    if (currentStep < suggestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  // Tüm öneriler tamamlandıysa
  if (!currentSuggestion || suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Tüm Sütunlar Tanımlandı!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Verileriniz işlenmeye hazır.
        </p>
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Devam Et →
        </button>
      </div>
    );
  }
  
  const typeInfo = TYPE_LABELS[currentSuggestion.suggestedType] || TYPE_LABELS['unknown'] || { label: 'Belirsiz', emoji: '❓', description: '' };
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Sütun Tanımlama</span>
          <span>{currentStep + 1} / {suggestions.length}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / suggestions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Soru Kartı */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="text-4xl mb-2">{typeInfo.emoji}</div>
          <h3 className="text-xl font-bold mb-1">
            &quot;{currentSuggestion.column}&quot; sütunu
          </h3>
          <p className="text-blue-100">
            Bu sütun neyi temsil ediyor?
          </p>
        </div>
        
        {/* Örnek Veriler */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Örnek Değerler:
          </p>
          <div className="flex flex-wrap gap-2">
            {currentSuggestion.sampleValues.map((val, i) => (
              <span 
                key={i}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-mono"
              >
                {val}
              </span>
            ))}
          </div>
        </div>
        
        {/* Öneri */}
        {currentSuggestion.confidence > 50 && currentSuggestion.suggestedType !== 'unknown' && (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-green-700 dark:text-green-400 mb-3">
              🤖 Sistem Önerisi (%{currentSuggestion.confidence} güven):
            </p>
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-green-400">
              <span className="text-2xl">{typeInfo.emoji}</span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {typeInfo.label}
                </p>
                <p className="text-sm text-gray-500">{typeInfo.description}</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                ✓ Evet, Bu Doğru
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Atla
              </button>
            </div>
          </div>
        )}
        
        {/* Alternatif Seçenekler */}
        <div className="p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            {currentSuggestion.confidence > 50 ? 'Veya farklı bir tip seçin:' : 'Bu sütun ne olmalı?'}
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {(['student_no', 'full_name', 'class', 'tc_no', 'booklet_type', 'ignore'] as ColumnType[]).map(type => {
              const info = TYPE_LABELS[type] || { label: type, emoji: '❓', description: '' };
              const isSelected = currentSuggestion.suggestedType === type;
              
              return (
                <button
                  key={type}
                  onClick={() => handleReject(type)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <span className="text-sm font-medium">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={currentStep > 0 ? () => setCurrentStep(prev => prev - 1) : onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Geri
        </button>
        
        <button
          onClick={onComplete}
          className="text-blue-600 hover:text-blue-800"
        >
          Tümünü Atla →
        </button>
      </div>
    </div>
  );
}

// ==================== EXPORT ====================

export default GuidedMapping;

