'use client';

import React from 'react';

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil ve Ayarlar</h1>
          <p className="text-gray-600">
            Kişisel bilgilerinizi, dil ve tema tercihinizi bu ekrandan yönetebilirsiniz.
          </p>
        </header>

        <section className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Kişisel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Adınızı ve soyadınızı girin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ornek@okul.com"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Tercihler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="tr">Türkçe</option>
                <option value="en">İngilizce</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="light">Açık Tema</option>
                <option value="dark">Koyu Tema</option>
                <option value="system">Sistem Varsayılanı</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            Vazgeç
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}


