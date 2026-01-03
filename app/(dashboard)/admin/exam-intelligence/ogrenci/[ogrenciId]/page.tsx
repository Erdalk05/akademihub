'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Target, TrendingUp, BookOpen, Award } from 'lucide-react';

export default function OgrenciDetayPage() {
  const params = useParams();
  const router = useRouter();
  const ogrenciId = params.ogrenciId as string;

  // Mock data
  const ogrenci = {
    id: ogrenciId,
    ad: 'Ahmet',
    soyad: 'Yılmaz',
    sinif: '8-A',
    ogrenciNo: '2024001',
    ortNet: 78.5,
    sinavSayisi: 12,
    enIyiDers: 'Matematik',
    gelisimAlani: 'Fen Bilimleri',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Geri Dön</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{ogrenci.ad} {ogrenci.soyad}</h1>
              <p className="text-indigo-100">{ogrenci.sinif} • No: {ogrenci.ogrenciNo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5">
          <Target className="w-8 h-8 text-cyan-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{ogrenci.ortNet}</p>
          <p className="text-sm text-slate-500">Ort. Net</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <BookOpen className="w-8 h-8 text-indigo-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{ogrenci.sinavSayisi}</p>
          <p className="text-sm text-slate-500">Sınav</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <Award className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-lg font-bold text-slate-800">{ogrenci.enIyiDers}</p>
          <p className="text-sm text-slate-500">En İyi Ders</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <TrendingUp className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-lg font-bold text-slate-800">{ogrenci.gelisimAlani}</p>
          <p className="text-sm text-slate-500">Gelişim Alanı</p>
        </div>
      </div>

      {/* Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Performans Trendi</h3>
          <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
            <p className="text-slate-400">Grafik yakında eklenecek</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Ders Bazlı Analiz</h3>
          <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
            <p className="text-slate-400">Grafik yakında eklenecek</p>
          </div>
        </div>
      </div>
    </div>
  );
}