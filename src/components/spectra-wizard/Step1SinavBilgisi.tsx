"use client";

import React from 'react';

interface Step1Props {
  data: {
    examName: string;
    examType: string;
    publisher: string;
    date: string;
  };
  updateData: (newData: any) => void;
  onNext: () => void;
}

export default function Step1SinavBilgisi({ data, updateData, onNext }: Step1Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sınav Adı</label>
          <input 
            type="text"
            value={data.examName}
            onChange={(e) => updateData({ examName: e.target.value })}
            placeholder="Örn: 2026 Spectra Türkiye Geneli - 1"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sınav Kategorisi</label>
            <select 
              value={data.examType}
              onChange={(e) => updateData({ examType: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-gray-50 text-gray-900"
            >
              <option value="">Kategori Seçiniz</option>
              <option value="LGS">LGS (Lise Giriş)</option>
              <option value="TYT">TYT (Temel Yeterlilik)</option>
              <option value="AYT">AYT (Alan Yeterlilik)</option>
              <option value="DENEME">Genel Deneme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Uygulama Tarihi</label>
            <input 
              type="date"
              value={data.date}
              onChange={(e) => updateData({ date: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-gray-50 text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-100">
        <button 
          onClick={onNext}
          disabled={!data.examName || !data.examType}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-200 disabled:shadow-none transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          Devam Et: Cevap Anahtarını Tanımla →
        </button>
      </div>
    </div>
  );
}