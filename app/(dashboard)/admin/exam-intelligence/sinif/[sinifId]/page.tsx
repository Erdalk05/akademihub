'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Target, TrendingUp, Award } from 'lucide-react';

export default function SinifDetayPage() {
  const params = useParams();
  const router = useRouter();
  const sinifId = params.sinifId as string;

  // Mock data
  const sinifBilgisi = {
    name: sinifId.toUpperCase().replace(/(\d)(\w)/, '$1-$2'),
    ogrenciSayisi: 32,
    ortNet: 72.5,
    enYuksek: 89.2,
    enDusuk: 45.8,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Geri Dön</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{sinifBilgisi.name} Sınıfı</h1>
          <p className="text-cyan-100">Detaylı performans analizi</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5">
          <Users className="w-8 h-8 text-cyan-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{sinifBilgisi.ogrenciSayisi}</p>
          <p className="text-sm text-slate-500">Öğrenci</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <Target className="w-8 h-8 text-indigo-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{sinifBilgisi.ortNet}</p>
          <p className="text-sm text-slate-500">Ort. Net</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <TrendingUp className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{sinifBilgisi.enYuksek}</p>
          <p className="text-sm text-slate-500">En Yüksek</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <Award className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{sinifBilgisi.enDusuk}</p>
          <p className="text-sm text-slate-500">En Düşük</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Öğrenci Listesi</h3>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
          <p className="text-slate-400">Öğrenci tablosu yakında eklenecek</p>
        </div>
      </div>
    </div>
  );
}