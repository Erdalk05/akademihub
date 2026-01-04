'use client'

import Link from 'next/link'
import { BarChart3, LineChart, Layers } from 'lucide-react'

export default function AnalizlerHome() {
  const cards = [
    {
      title: 'Karşılaştırma (5 Sınav)',
      desc: 'Seçili sınıf/filtreye göre son 5 sınavın ortalama net karşılaştırması.',
      href: '/admin/exam-intelligence/analizler/karsilastirma',
      icon: Layers,
    },
    {
      title: 'Trend',
      desc: 'Zaman serisi: ortalama net ve katılım değişimi.',
      href: '/admin/exam-intelligence/analizler/trend',
      icon: LineChart,
    },
    {
      title: 'Konu Analizi',
      desc: 'Konu bazlı başarı (cevap anahtarı + kazanım sonuçlarından).',
      href: '/admin/exam-intelligence/analizler/konu',
      icon: BarChart3,
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-black">Analizler</h1>
        <p className="text-white/80 mt-1">Kurumsal düzeyde bilimsel özet ve karşılaştırmalar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-2xl p-5 shadow-sm border hover:border-[#25D366] hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#DCF8C6] flex items-center justify-center">
                <c.icon className="w-6 h-6 text-[#075E54]" />
              </div>
              <div>
                <div className="font-black text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-600 mt-1">{c.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 border text-sm text-gray-600">
        Not: Bu sayfalar mock data kullanmaz; mevcut sınav kayıtları üzerinden analiz üretir.
      </div>
    </div>
  )
}
