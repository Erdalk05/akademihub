'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, Check, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  studentId?: string;
  currentImageUrl?: string;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  studentId,
  currentImageUrl
}: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    // Validasyon
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setSelectedFile(file);
    
    // Önizleme oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir fotoğraf seçin');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Fotoğraf yükleniyor...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (studentId) {
        formData.append('studentId', studentId);
      }

      const response = await fetch('/api/upload/student-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Yükleme başarısız');
      }

      toast.success('✅ Fotoğraf başarıyla yüklendi!', { id: toastId });
      onUploadComplete(data.url);
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`❌ Hata: ${error.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-600" />
            Öğrenci Fotoğrafı Yükle
          </h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Photo */}
        {currentImageUrl && !previewUrl && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Mevcut Fotoğraf:</p>
            <img
              src={currentImageUrl}
              alt="Current"
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
            />
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-indigo-200 shadow-lg"
            />
          </div>
        )}

        {/* Upload Area */}
        {!previewUrl && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">
              Fotoğraf yüklemek için tıklayın veya sürükleyin
            </p>
            <p className="text-sm text-gray-500 mb-4">
              JPG, PNG veya WEBP (Max 5MB)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition"
            >
              Dosya Seç
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Kaydet
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>İpucu:</strong> En iyi sonuç için kare (1:1) format ve yüksek çözünürlüklü fotoğraf kullanın.
          </p>
        </div>
      </div>
    </div>
  );
}





