'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <WifiOff className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Çevrimdışısınız
        </h1>

        {/* Description */}
        <p className="text-slate-400 mb-8 leading-relaxed">
          İnternet bağlantınız kesilmiş görünüyor. Bazı özellikler çevrimdışı kullanılabilir,
          ancak tam deneyim için bağlantınızı kontrol edin.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition"
          >
            <Home className="w-5 h-5" />
            Ana Sayfa
          </Link>
        </div>

        {/* PWA Info */}
        <div className="mt-12 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#075E54] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <span className="text-white font-semibold">AkademiHub</span>
          </div>
          <p className="text-slate-500 text-sm">
            Uygulama çevrimdışı modda çalışıyor. Son görüntülenen veriler önbellekten yükleniyor.
          </p>
        </div>

        {/* Tips */}
        <div className="mt-8 text-left">
          <h3 className="text-slate-300 font-medium mb-3">💡 Çevrimdışı İpuçları:</h3>
          <ul className="text-slate-500 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              Son görüntülenen sayfalar önbellekte saklanır
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              Ödeme bilgileri bağlantı geldiğinde senkronize edilir
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">!</span>
              Yeni kayıt işlemleri için internet gereklidir
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

