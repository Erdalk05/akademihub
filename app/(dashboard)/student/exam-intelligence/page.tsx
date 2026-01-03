'use client';

import React from 'react';
import { Target, TrendingUp, Award, BookOpen } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Hoş Geldin! 👋</h1>
          <p className="text-indigo-100">Sınav performansını takip et</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5">
          <Target className="w-8 h-8 text-indigo-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">72.5</p>
          <p className="text-sm text-slate-500">Ortalama Net</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <TrendingUp className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">+5.2</p>
          <p className="text-sm text-slate-500">Son Gelişim</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <Award className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">12</p>
          <p className="text-sm text-slate-500">Sınıf Sırası</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <BookOpen className="w-8 h-8 text-cyan-600 mb-2" />
          <p className="text-2xl font-bold text-slate-800">8</p>
          <p className="text-sm text-slate-500">Sınav Sayısı</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Performans Grafiğin</h3>
        <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
          <p className="text-slate-400">Grafik yakında eklenecek</p>
        </div>
      </div>
    </div>
  );
}
