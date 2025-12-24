/**
 * ============================================
 * AkademiHub - Import Wizard
 * ============================================
 * 
 * PHASE 7 - Universal Import Engine
 * 
 * BU DOSYA:
 * - Ana import wizard bileşeni
 * - Adım adım rehberlik
 * - Çocuk kadar kolay UX
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  ImportWizardState,
  ImportWizardStep,
  ColumnMapping,
  MatchResult
} from '../types';
import {
  executeImport,
  createInitialWizardState,
  getNextStep,
  getPreviousStep,
  isStepComplete
} from '../orchestrator';
import { parseSpreadsheet } from '../parsers/spreadsheetParser';
import { autoDetectColumns } from '../mapping/columnMapper';
import { matchStudentsBatch } from '../mapping/studentMatcher';
import { runPreflightChecks } from '../validation/preflightValidator';

// ==================== PROPS ====================

export interface ImportWizardProps {
  examId: string;
  examName?: string;
  organizationId?: string;
  onComplete?: (result: ImportWizardState['importResult']) => void;
  onCancel?: () => void;
}

// ==================== STEPS ====================

const WIZARD_STEPS: { key: ImportWizardStep; title: string; description: string; icon: string }[] = [
  { key: 'upload', title: 'Dosya Yükle', description: 'Excel veya CSV dosyası seçin', icon: '📤' },
  { key: 'preview', title: 'Önizleme', description: 'Verilerinizi kontrol edin', icon: '👀' },
  { key: 'mapping', title: 'Kolon Eşleştir', description: 'Sütunları tanımlayın', icon: '🔗' },
  { key: 'matching', title: 'Öğrenci Eşleştir', description: 'Öğrencileri doğrulayın', icon: '👥' },
  { key: 'confirmation', title: 'Onay', description: 'Son kontrol', icon: '✅' },
  { key: 'processing', title: 'İşleniyor', description: 'Veriler kaydediliyor', icon: '⏳' },
  { key: 'complete', title: 'Tamamlandı', description: 'İşlem bitti', icon: '🎉' }
];

// ==================== ANA COMPONENT ====================

export function ImportWizard({
  examId,
  examName,
  organizationId,
  onComplete,
  onCancel
}: ImportWizardProps) {
  const [state, setState] = useState<ImportWizardState>(createInitialWizardState());
  
  // Dosya yükleme
  const handleFileUpload = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Dosya okunuyor...', error: null }));
    
    try {
      const result = await parseSpreadsheet(file);
      
      if (!result.success) {
        throw new Error(result.errors[0]?.message || 'Dosya okunamadı');
      }
      
      // Kolon mapping
      const columnMapping = autoDetectColumns(result.headers, result.previewRows);
      
      setState(prev => ({
        ...prev,
        file,
        fileInfo: result.fileInfo,
        parsedData: result.parsedRows,
        columnMapping,
        currentStep: 'preview',
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Bir hata oluştu'
      }));
    }
  }, []);
  
  // Kolon mapping güncelle
  const handleMappingChange = useCallback((mappings: ColumnMapping[]) => {
    setState(prev => ({
      ...prev,
      columnMapping: prev.columnMapping ? { ...prev.columnMapping, mappings } : null
    }));
  }, []);
  
  // Öğrenci eşleştirme
  const handleStartMatching = useCallback(async () => {
    if (!state.parsedData || !state.columnMapping) return;
    
    setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Öğrenciler eşleştiriliyor...' }));
    
    try {
      const identifiers = state.parsedData
        .filter(r => r.studentIdentifier)
        .map(r => ({ rowNumber: r.rowNumber, identifier: r.studentIdentifier! }));
      
      const matchResults = await matchStudentsBatch(identifiers, organizationId);
      
      // Preflight
      const preflight = runPreflightChecks(
        state.fileInfo!,
        {
          totalRows: state.parsedData.length,
          dataRows: state.parsedData.filter(r => r.status !== 'skipped').length,
          headerRows: 1,
          emptyRows: state.parsedData.filter(r => r.status === 'skipped').length,
          errorRows: state.parsedData.filter(r => r.status === 'error').length
        },
        state.columnMapping.mappings,
        state.parsedData
      );
      
      setState(prev => ({
        ...prev,
        matchResults,
        preflightResult: preflight,
        currentStep: 'matching',
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Eşleştirme hatası'
      }));
    }
  }, [state.parsedData, state.columnMapping, state.fileInfo, organizationId]);
  
  // Manuel eşleştirme
  const handleManualMatch = useCallback((rowNumber: number, studentId: string) => {
    setState(prev => {
      const corrections = new Map(prev.manualCorrections);
      corrections.set(rowNumber, studentId);
      return { ...prev, manualCorrections: corrections };
    });
  }, []);
  
  // Import başlat
  const handleStartImport = useCallback(async () => {
    if (!state.file) return;
    
    setState(prev => ({ ...prev, currentStep: 'processing', isLoading: true }));
    
    try {
      const result = await executeImport(state.file, {
        examId,
        organizationId,
        columnMapping: state.columnMapping?.mappings,
        manualMatches: state.manualCorrections,
        enablePostProcessing: true,
        onProgress: (progress) => {
          setState(prev => ({
            ...prev,
            loadingMessage: progress.message
          }));
        }
      });
      
      setState(prev => ({
        ...prev,
        importResult: result,
        currentStep: 'complete',
        isLoading: false
      }));
      
      onComplete?.(result);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Import hatası'
      }));
    }
  }, [state.file, state.columnMapping, state.manualCorrections, examId, organizationId, onComplete]);
  
  // Adım değiştir
  const handleNext = useCallback(() => {
    const nextStep = getNextStep(state.currentStep);
    
    if (nextStep === 'matching' && state.currentStep === 'mapping') {
      handleStartMatching();
    } else if (nextStep === 'processing' && state.currentStep === 'confirmation') {
      handleStartImport();
    } else {
      setState(prev => ({ ...prev, currentStep: nextStep }));
    }
  }, [state.currentStep, handleStartMatching, handleStartImport]);
  
  const handleBack = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: getPreviousStep(prev.currentStep) }));
  }, []);
  
  // Step index
  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === state.currentStep);
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">
          📋 Sınav Sonuçlarını Yükle
        </h2>
        {examName && (
          <p className="text-blue-100 text-sm mt-1">{examName}</p>
        )}
      </div>
      
      {/* Progress */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.slice(0, -1).map((step, index) => (
            <React.Fragment key={step.key}>
              <div className={`flex items-center ${index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg
                  ${index < currentStepIndex ? 'bg-green-100 text-green-600' : 
                    index === currentStepIndex ? 'bg-blue-100 text-blue-600' : 
                    'bg-gray-100 text-gray-400'}
                `}>
                  {index < currentStepIndex ? '✓' : step.icon}
                </div>
                <span className="ml-2 text-sm font-medium hidden md:block">{step.title}</span>
              </div>
              {index < WIZARD_STEPS.length - 2 && (
                <div className={`flex-1 h-1 mx-2 rounded ${index < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 min-h-[400px]">
        {/* Error */}
        {state.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">❌ Hata</p>
            <p className="text-sm">{state.error}</p>
          </div>
        )}
        
        {/* Loading */}
        {state.isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">{state.loadingMessage}</p>
          </div>
        )}
        
        {/* Upload Step */}
        {!state.isLoading && state.currentStep === 'upload' && (
          <UploadStep onFileSelect={handleFileUpload} />
        )}
        
        {/* Preview Step */}
        {!state.isLoading && state.currentStep === 'preview' && state.parsedData && (
          <PreviewStep 
            rows={state.parsedData}
            fileInfo={state.fileInfo}
          />
        )}
        
        {/* Mapping Step */}
        {!state.isLoading && state.currentStep === 'mapping' && state.columnMapping && (
          <MappingStep
            mappings={state.columnMapping.mappings}
            onMappingChange={handleMappingChange}
          />
        )}
        
        {/* Matching Step */}
        {!state.isLoading && state.currentStep === 'matching' && state.matchResults && (
          <MatchingStep
            matchResults={state.matchResults}
            parsedData={state.parsedData || []}
            onManualMatch={handleManualMatch}
            manualCorrections={state.manualCorrections}
          />
        )}
        
        {/* Confirmation Step */}
        {!state.isLoading && state.currentStep === 'confirmation' && (
          <ConfirmationStep
            preflightResult={state.preflightResult}
            matchResults={state.matchResults}
            parsedData={state.parsedData || []}
          />
        )}
        
        {/* Complete Step */}
        {!state.isLoading && state.currentStep === 'complete' && state.importResult && (
          <CompleteStep result={state.importResult} />
        )}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          onClick={state.currentStep === 'complete' ? onCancel : handleBack}
          disabled={state.isLoading || state.currentStep === 'upload'}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          {state.currentStep === 'complete' ? 'Kapat' : '← Geri'}
        </button>
        
        {state.currentStep !== 'complete' && state.currentStep !== 'processing' && (
          <button
            onClick={handleNext}
            disabled={state.isLoading || !isStepComplete(state.currentStep, state)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.currentStep === 'confirmation' ? 'Yükle →' : 'Devam →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== SUB COMPONENTS ====================

function UploadStep({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };
  
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Dosya Seçin veya Sürükleyin
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Excel (.xlsx, .xls) veya CSV (.csv, .txt) dosyası
        </p>
      </label>
    </div>
  );
}

function PreviewStep({ rows, fileInfo }: { rows: ImportWizardState['parsedData']; fileInfo: ImportWizardState['fileInfo'] }) {
  if (!rows || rows.length === 0) return null;
  
  const previewRows = rows.slice(0, 5);
  const headers = Object.keys(previewRows[0]?.rawData || {});
  
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="text-2xl">📊</span>
        <div>
          <h3 className="font-semibold">{fileInfo?.name}</h3>
          <p className="text-sm text-gray-500">{rows.length} satır bulundu</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              {headers.slice(0, 8).map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase truncate max-w-[100px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {previewRows.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-sm text-gray-500">{row.rowNumber}</td>
                {headers.slice(0, 8).map(h => (
                  <td key={h} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[100px]">
                    {String(row.rawData[h] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {rows.length > 5 && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          ... ve {rows.length - 5} satır daha
        </p>
      )}
    </div>
  );
}

function MappingStep({ mappings, onMappingChange }: { mappings: ColumnMapping[]; onMappingChange: (m: ColumnMapping[]) => void }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-lg">🔗 Kolon Eşleştirme</h3>
        <p className="text-sm text-gray-500">Her sütunun ne olduğunu belirtin</p>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <span className="font-medium">{mapping.sourceColumn}</span>
              <span className="text-sm text-gray-500 ml-2">(%{mapping.confidence})</span>
            </div>
            <select
              value={mapping.targetType}
              onChange={(e) => {
                const newMappings = [...mappings];
                newMappings[index] = { ...mapping, targetType: e.target.value as ColumnMapping['targetType'], isManual: true };
                onMappingChange(newMappings);
              }}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="unknown">Seçin...</option>
              <option value="student_no">Öğrenci No</option>
              <option value="tc_no">TC Kimlik</option>
              <option value="full_name">Ad Soyad</option>
              <option value="class">Sınıf</option>
              <option value="booklet_type">Kitapçık</option>
              <option value="answer">Cevap</option>
              <option value="ignore">Atla</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchingStep({ 
  matchResults, 
  parsedData, 
  onManualMatch,
  manualCorrections 
}: { 
  matchResults: Map<number, MatchResult>;
  parsedData: ImportWizardState['parsedData'];
  onManualMatch: (rowNumber: number, studentId: string) => void;
  manualCorrections: Map<number, string>;
}) {
  const needsAttention = Array.from(matchResults.entries())
    .filter(([_, m]) => m.status !== 'matched')
    .slice(0, 10);
  
  const matchedCount = Array.from(matchResults.values()).filter(m => m.status === 'matched').length;
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-lg">👥 Öğrenci Eşleştirme</h3>
        <p className="text-sm text-gray-500">
          ✓ {matchedCount} öğrenci otomatik eşleşti
          {needsAttention.length > 0 && ` • ⚠️ ${needsAttention.length} dikkat gerekiyor`}
        </p>
      </div>
      
      {needsAttention.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {needsAttention.map(([rowNumber, match]) => {
            const row = parsedData?.find(r => r.rowNumber === rowNumber);
            const identifier = row?.studentIdentifier;
            
            return (
              <div key={rowNumber} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{identifier?.fullName || identifier?.studentNo || 'Bilinmiyor'}</span>
                    {identifier?.className && <span className="text-sm text-gray-500 ml-2">({identifier.className})</span>}
                  </div>
                  <span className="text-sm text-amber-600">%{match.confidence} eşleşme</span>
                </div>
                
                {match.alternatives.length > 0 && (
                  <select
                    value={manualCorrections.get(rowNumber) || match.studentId || ''}
                    onChange={(e) => onManualMatch(rowNumber, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Öğrenci seçin...</option>
                    {match.matchedStudent && (
                      <option value={match.matchedStudent.id}>
                        {match.matchedStudent.fullName} - {match.matchedStudent.className} (%{match.confidence})
                      </option>
                    )}
                    {match.alternatives.map(alt => (
                      <option key={alt.student.id} value={alt.student.id}>
                        {alt.student.fullName} - {alt.student.className} (%{alt.confidence})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {needsAttention.length === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl">✅</span>
          <p className="mt-2 text-gray-600">Tüm öğrenciler başarıyla eşleşti!</p>
        </div>
      )}
    </div>
  );
}

function ConfirmationStep({ 
  preflightResult, 
  matchResults,
  parsedData 
}: { 
  preflightResult: ImportWizardState['preflightResult'];
  matchResults: ImportWizardState['matchResults'];
  parsedData: ImportWizardState['parsedData'];
}) {
  const matchedCount = matchResults ? Array.from(matchResults.values()).filter(m => m.studentId).length : 0;
  
  return (
    <div>
      <div className="text-center py-6">
        <span className="text-6xl">📋</span>
        <h3 className="text-xl font-semibold mt-4">İçe Aktarıma Hazır</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <p className="text-3xl font-bold text-blue-600">{parsedData?.length || 0}</p>
          <p className="text-sm text-gray-600">Toplam Satır</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <p className="text-3xl font-bold text-green-600">{matchedCount}</p>
          <p className="text-sm text-gray-600">Eşleşen Öğrenci</p>
        </div>
      </div>
      
      {preflightResult?.warnings && preflightResult.warnings.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="font-medium text-amber-700">⚠️ Uyarılar:</p>
          <ul className="text-sm text-amber-600 mt-2 space-y-1">
            {preflightResult.warnings.slice(0, 3).map((w, i) => (
              <li key={i}>• {w.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CompleteStep({ result }: { result: ImportWizardState['importResult'] }) {
  if (!result) return null;
  
  return (
    <div className="text-center py-8">
      {result.success ? (
        <>
          <span className="text-6xl">🎉</span>
          <h3 className="text-2xl font-bold text-green-600 mt-4">Yükleme Tamamlandı!</h3>
          <p className="text-gray-600 mt-2">
            {result.summary.successfulImports} öğrencinin sınav sonucu başarıyla yüklendi.
          </p>
          
          {result.postProcessing.analyticsRecalculated && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg inline-block">
              <p className="text-green-700">
                ✓ Analizler hesaplandı<br />
                ✓ AI yorumları hazır<br />
                ✓ PDF karneler oluşturuldu
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <span className="text-6xl">😕</span>
          <h3 className="text-2xl font-bold text-red-600 mt-4">Yükleme Başarısız</h3>
          <p className="text-gray-600 mt-2">{result.errors[0]?.message}</p>
        </>
      )}
    </div>
  );
}

// ==================== EXPORT ====================

export default ImportWizard;

