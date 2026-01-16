'use client';

// ============================================================================
// OPTICAL UPLOAD PANEL
// TXT/DAT dosya yükleme ve işleme paneli
// ============================================================================

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, X, Info, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OpticalUploadPanelProps {
  examId: string;
  onUploadSuccess?: () => void;
}

interface UploadResult {
  insertedParticipants: number;
  insertedResults: number;
  errors: string[];
  warnings: string[];
  parseInfo?: {
    fileName: string;
    templateName: string;
    totalLines: number;
    successfulLines: number;
    errorLines: number;
  };
}

export function OpticalUploadPanel({ examId, onUploadSuccess }: OpticalUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.dat'))) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast.error('Sadece .txt veya .dat dosyası yükleyebilirsiniz');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('auto_detect', 'true');
      formData.append('recalculate_results', 'true');

      const response = await fetch(`/api/spectra/exams/${examId}/optical/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message || 'Yükleme başarısız');
        setUploadResult({
          insertedParticipants: 0,
          insertedResults: 0,
          errors: [result.message || 'Bilinmeyen hata'],
          warnings: [],
        });
        return;
      }

      setUploadResult(result);
      
      if (result.insertedParticipants > 0) {
        toast.success(`${result.insertedParticipants} katılımcı başarıyla eklendi`);
        onUploadSuccess?.();
      } else {
        toast.error('Katılımcı eklenemedi');
      }

    } catch (error) {
      console.error('[OpticalUpload] Error:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-600" />
          Optik Okuma Dosyası Yükle
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          TXT veya DAT formatında optik okuma dosyası yükleyin
        </p>
      </div>

      {/* Upload Area */}
      <div className="p-6">
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragging
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
            )}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-1">
              Dosyayı sürükleyip bırakın
            </p>
            <p className="text-sm text-gray-500">
              veya <span className="text-emerald-600">dosya seçin</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Desteklenen formatlar: .txt, .dat
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.dat"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Button */}
            {!uploadResult && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Yükle ve İşle
                  </>
                )}
              </button>
            )}

            {/* Result */}
            {uploadResult && (
              <div className="space-y-4">
                {/* Success Stats */}
                {uploadResult.insertedParticipants > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Başarıyla İşlendi
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-emerald-600">Katılımcı:</span>
                        <span className="font-bold ml-2">{uploadResult.insertedParticipants}</span>
                      </div>
                      <div>
                        <span className="text-emerald-600">Sonuç:</span>
                        <span className="font-bold ml-2">{uploadResult.insertedResults}</span>
                      </div>
                    </div>
                    {uploadResult.parseInfo && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 text-xs text-emerald-600">
                        <p>Şablon: {uploadResult.parseInfo.templateName}</p>
                        <p>Satır: {uploadResult.parseInfo.successfulLines} / {uploadResult.parseInfo.totalLines}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {uploadResult.warnings.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      Uyarılar
                    </div>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {uploadResult.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Errors */}
                {uploadResult.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      Hatalar
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {uploadResult.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* New Upload Button */}
                <button
                  onClick={handleClear}
                  className="w-full py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Yeni Dosya Yükle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Desteklenen Şablonlar:</p>
            <ul className="text-xs space-y-0.5">
              <li>• MEB LGS (90 soru)</li>
              <li>• TYT (120 soru)</li>
              <li>• AYT (80 soru)</li>
              <li>• Özdebir, NAR, FEM ve diğer yayınevleri</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
