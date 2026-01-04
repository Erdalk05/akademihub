'use client'

import Link from 'next/link'
import { FileSpreadsheet, CheckCircle2 } from 'lucide-react'

export default function YeniSinavPage() {
  const steps = [
    'Sınav tanımı (tür, tarih, sınıf/kademe)',
    'Cevap anahtarı / kitapçık eşleştirmeleri',
    'Optik/TXT yükleme veya manuel giriş',
    'Kontrol ve yayınlama',
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-black">Yeni Sınav</h1>
        <p className="text-white/80 mt-1">Tek yetkili akış: Akademik Analiz Sihirbazı</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <h2 className="text-lg font-black text-gray-900">Adımlar</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#25D366] mt-0.5" />
              <span>{s}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Link
            href="/admin/akademik-analiz/sihirbaz"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#25D366] text-white font-bold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Sihirbaza Git
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border text-sm text-gray-600">
        Not: Bu sayfa yeni sınav oluşturma işlemini taşımıyor; yalnızca sihirbaza yönlendirir.
      </div>
    </div>
  )
}
