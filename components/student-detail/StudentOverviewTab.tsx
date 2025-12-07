'use client';

import React from 'react';
import { AlertTriangle, Clock, FileText, TrendingUp } from 'lucide-react';

interface Props {
  student: any;
}

export default function StudentOverviewTab({ student }: Props) {
  return (
    <div className="space-y-6">
      {/* Risk Analizi */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Risk Analizi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 font-medium">Ödeme Riski</p>
            <p className="text-2xl font-bold text-red-900 mt-1">Yüksek</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium">Devamsızlık</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">Orta</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700 font-medium">Akademik</p>
            <p className="text-2xl font-bold text-green-900 mt-1">İyi</p>
          </div>
        </div>
      </div>

      {/* Son Hareketler */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          Son Hareketler
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ödeme alındı</p>
              <p className="text-xs text-gray-500">2 gün önce • ₺15.000</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Deneme sınavı girildi</p>
              <p className="text-xs text-gray-500">5 gün önce • TYT-3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notlar */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          Rehberlik Notları
        </h3>
        <p className="text-sm text-gray-500">Henüz not eklenmemiş.</p>
      </div>
    </div>
  );
}





