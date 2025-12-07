'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShieldX className="w-12 h-12 text-white" />
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 mb-2">
            403
          </h1>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Erişim Reddedildi
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Bu sayfayı görüntüleme yetkiniz bulunmamaktadır. 
            Bu işlem sadece <span className="font-semibold text-red-600">Admin</span> yetkisi gerektirmektedir.
          </p>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Not:</strong> Eğer bu sayfaya erişmeniz gerektiğini düşünüyorsanız, 
              lütfen sistem yöneticiniz ile iletişime geçin.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Home className="w-4 h-4" />
              Ana Sayfaya Dön
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Git
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          AkademiHub Güvenlik Sistemi
        </p>
      </div>
    </div>
  );
}




