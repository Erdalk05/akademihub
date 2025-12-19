'use client';

import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* 404 Görseli */}
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="h-10 w-10 text-amber-600" />
        </div>

        {/* Başlık */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Sayfa Bulunamadı
        </h2>

        {/* Mesaj */}
        <p className="text-gray-600 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        {/* Aksiyonlar */}
        <div className="flex space-x-3">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </button>
          
          <a
            href="/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Home className="h-4 w-4" />
            <span>Ana Sayfa</span>
          </a>
        </div>
      </div>
    </div>
  );
}
