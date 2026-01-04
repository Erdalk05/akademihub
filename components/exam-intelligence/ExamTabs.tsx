'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  GraduationCap,
  Users,
  LineChart,
  AlertTriangle,
  Layers,
  BookOpen,
} from 'lucide-react'

const tabs = [
  { href: '/admin/exam-intelligence', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/exam-intelligence/sinavlar', label: 'Sınavlar', icon: FileText },
  { href: '/admin/exam-intelligence/siniflar', label: 'Sınıf Analizi', icon: GraduationCap },
  { href: '/admin/exam-intelligence/ogrenciler', label: 'Öğrenciler', icon: Users },
  { href: '/admin/exam-intelligence/analizler/karsilastirma', label: 'Karşılaştırma', icon: Layers },
  { href: '/admin/exam-intelligence/analizler/trend', label: 'Trendler', icon: LineChart },
  { href: '/admin/exam-intelligence/risk-takibi', label: 'Risk', icon: AlertTriangle },
  { href: '/admin/exam-intelligence/kazanim-takibi', label: 'Kazanım', icon: BookOpen },
]

export function ExamTabs() {
  const pathname = usePathname()

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + '/')
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition font-semibold text-sm ${
                active
                  ? 'bg-[#25D366] text-white border-[#25D366] shadow'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-[#DCF8C6]'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
