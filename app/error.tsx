'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hatayı loglama servisi varsa buraya eklenebilir
    console.error('Uygulama hatası:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Hata İkonu */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Başlık */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bir Hata Oluştu
        </h1>

        {/* Mesaj */}
        <p className="text-gray-600 mb-6">
          Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>

        {/* Hata Detayı */}
        {error.message && (
          <div className="mb-6 p-3 bg-red-50 rounded-lg text-left">
            <p className="text-sm text-red-700 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex space-x-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Tekrar Dene</span>
          </button>
          
          <a
            href="/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="h-4 w-4" />
            <span>Ana Sayfa</span>
          </a>
        </div>
      </div>
    </div>
  );
}
