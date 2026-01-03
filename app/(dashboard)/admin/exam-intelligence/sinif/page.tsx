'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function SinifListePage() {
  const router = useRouter();

  // Mock data - sonra API'den gelecek
  const siniflar = [
    { id: '8a', name: '8-A', ogrenciSayisi: 32, ortNet: 72.5, trend: '+3.2' },
    { id: '8b', name: '8-B', ogrenciSayisi: 30, ortNet: 68.3, trend: '+1.8' },
    { id: '8c', name: '8-C', ogrenciSayisi: 31, ortNet: 65.1, trend: '-0.5' },
    { id: '7a', name: '7-A', ogrenciSayisi: 28, ortNet: 58.7, trend: '+2.1' },
    { id: '7b', name: '7-B', ogrenciSayisi: 29, ortNet: 55.2, trend: '+4.3' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sınıf Analizi</h1>
          <p className="text-slate-500">Tüm sınıfların performans özeti</p>
        </div>
      </div>

      {/* Sınıf Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {siniflar.map((sinif) => (
          <div
            key={sinif.id}
            onClick={() => router.push(`/admin/exam-intelligence/sinif/${sinif.id}`)}
            className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{sinif.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {sinif.ogrenciSayisi} öğrenci
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Ort. Net</p>
                <p className="text-xl font-bold text-slate-800">{sinif.ortNet}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                sinif.trend.startsWith('+') 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                <TrendingUp className="w-4 h-4" />
                {sinif.trend}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}