'use client'

import Link from 'next/link'
import { FileText, Users, GraduationCap, ShieldAlert } from 'lucide-react'

export default function ReportsHome() {
  const cards = [
    {
      title: 'Veli Raporu',
      desc: 'Öğrencinin son sınavları, trendi ve net özeti. Yazdırılabilir.',
      href: '/admin/exam-intelligence/raporlar/veli-raporu',
      icon: Users,
    },
    {
      title: 'Sınıf Raporu',
      desc: 'Sınıfın ortalama neti, öğrenci listesi ve dağılım grafikleri. Yazdırılabilir.',
      href: '/admin/exam-intelligence/raporlar/sinif-raporu',
      icon: GraduationCap,
    },
    {
      title: 'Öğrenci Karnesi',
      desc: 'Kısa karne: ortalama net, sınav geçmişi ve sıralama özetleri.',
      href: '/admin/exam-intelligence/raporlar/ogrenci-karnesi',
      icon: FileText,
    },
    {
      title: 'Risk Takibi (Rapor)',
      desc: 'Risk eşiği altındaki öğrenciler ve sınıf kırılımı.',
      href: '/admin/exam-intelligence/risk-takibi',
      icon: ShieldAlert,
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-black">Raporlar</h1>
        <p className="text-white/80 mt-1">Yazdırılabilir çıktı ve yönetim raporları</p>
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
        Not: Raporlar gerçek Supabase verisinden üretilir. Veri yoksa boş durum gösterilir.
      </div>
    </div>
  )
}
