'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, TrendingUp, ArrowRight } from 'lucide-react';

export default function OgrenciListePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const ogrenciler = [
    { id: '1', ad: 'Ahmet', soyad: 'Yılmaz', sinif: '8-A', ortNet: 78.5, trend: '+4.2' },
    { id: '2', ad: 'Zeynep', soyad: 'Kaya', sinif: '8-A', ortNet: 85.2, trend: '+2.1' },
    { id: '3', ad: 'Mehmet', soyad: 'Demir', sinif: '8-B', ortNet: 62.8, trend: '-1.5' },
    { id: '4', ad: 'Elif', soyad: 'Çelik', sinif: '8-B', ortNet: 71.3, trend: '+3.8' },
    { id: '5', ad: 'Can', soyad: 'Öztürk', sinif: '7-A', ortNet: 55.9, trend: '+5.2' },
  ];

  const filtered = ogrenciler.filter(o => 
    `${o.ad} ${o.soyad}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Öğrenci Analizi</h1>
          <p className="text-slate-500">Bireysel öğrenci performansları</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Öğrenci ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Öğrenci Listesi */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.map((ogrenci) => (
            <div
              key={ogrenci.id}
              onClick={() => router.push(`/admin/exam-intelligence/ogrenci/${ogrenci.id}`)}
              className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{ogrenci.ad} {ogrenci.soyad}</h3>
                  <p className="text-sm text-slate-500">{ogrenci.sinif}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-slate-800">{ogrenci.ortNet}</p>
                  <p className="text-xs text-slate-500">Ort. Net</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                  ogrenci.trend.startsWith('+') 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  {ogrenci.trend}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}