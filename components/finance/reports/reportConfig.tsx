'use client';

import {
  Calendar,
  TrendingUp,
  ArrowLeftRight,
  PieChart,
  User,
  AlertTriangle,
  Coins,
  CreditCard,
  ShoppingCart,
  GitCompare,
} from 'lucide-react';

export type ReportCategory = 'income' | 'expense' | 'student' | 'analysis' | 'risk';

export type ReportDefinition = {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  icon: React.ElementType;
  color: string;
  gradient: string;
  estimatedTime: string;
  isFavorite?: boolean;
  isAutomatic?: boolean;
  lastGenerated?: string;
  lastTotal?: string;
  lastTrend?: 'up' | 'down';
  lastChange?: string;
};

// Rapor Şablonları - Veriler gerçek API'den gelecek, burada sadece şablon tanımları var
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'monthly-finance',
    name: 'Aylık Finans Raporu',
    description:
      'Seçilen ayın gelir-gider analizi, taksit performansı ve trend grafikleri.',
    category: 'analysis',
    icon: Calendar,
    color: 'hsl(262, 83%, 58%)',
    gradient: 'from-purple-500 to-purple-600',
    estimatedTime: '~30 saniye',
    // Veri yok - henüz rapor oluşturulmadı
  },
  {
    id: 'annual-finance',
    name: 'Yıllık Finans Raporu',
    description:
      'Yıllık performans, aylık trendler ve kapsamlı gelir-gider özetleri.',
    category: 'analysis',
    icon: TrendingUp,
    color: 'hsl(142, 76%, 36%)',
    gradient: 'from-green-500 to-green-600',
    estimatedTime: '~45 saniye',
  },
  {
    id: 'income-expense-comparison',
    name: 'Gelir-Gider Karşılaştırma',
    description:
      'Dönem bazlı detaylı gelir-gider karşılaştırması ve net durum analizi.',
    category: 'analysis',
    icon: ArrowLeftRight,
    color: 'hsl(221, 83%, 53%)',
    gradient: 'from-blue-500 to-blue-600',
    estimatedTime: '~25 saniye',
  },
  {
    id: 'expense-by-category',
    name: 'Kategori Bazlı Gider',
    description:
      'Tüm gider kategorilerinin dağılımı, trendi ve detaylı tablosu.',
    category: 'expense',
    icon: PieChart,
    color: 'hsl(0, 72%, 51%)',
    gradient: 'from-red-500 to-red-600',
    estimatedTime: '~20 saniye',
  },
  {
    id: 'income-by-category',
    name: 'Kategori Bazlı Gelir',
    description:
      'Taksit, peşin, kayıt, kurs ve diğer gelir kalemlerinin analizi.',
    category: 'income',
    icon: TrendingUp,
    color: 'hsl(142, 76%, 36%)',
    gradient: 'from-emerald-500 to-emerald-600',
    estimatedTime: '~20 saniye',
  },
  {
    id: 'student-account-statement',
    name: 'Öğrenci Cari Hesap',
    description:
      'Bireysel öğrenci borç, ödeme geçmişi ve taksit planı raporu.',
    category: 'student',
    icon: User,
    color: 'hsl(221, 83%, 53%)',
    gradient: 'from-sky-500 to-sky-600',
    estimatedTime: '~15 saniye',
  },
  {
    id: 'payment-behavior-risk',
    name: 'Ödeme Davranışı & Risk Analizi',
    description:
      'Öğrenci ödeme davranışlarını analiz eder ve risk skorlaması üretir.',
    category: 'risk',
    icon: AlertTriangle,
    color: 'hsl(38, 92%, 50%)',
    gradient: 'from-orange-500 to-orange-600',
    estimatedTime: '~40 saniye',
  },
  {
    id: 'cash-flow',
    name: 'Nakit Akışı Raporu',
    description:
      'Geçmiş nakit hareketleri ve sonraki 90 gün için nakit projeksiyonu.',
    category: 'analysis',
    icon: Coins,
    color: 'hsl(221, 83%, 53%)',
    gradient: 'from-indigo-500 to-indigo-600',
    estimatedTime: '~35 saniye',
  },
  {
    id: 'installment-performance',
    name: 'Taksit Performans Raporu',
    description:
      'Taksit tahsilat oranları, gecikmeler ve sınıf bazlı performans.',
    category: 'analysis',
    icon: CreditCard,
    color: 'hsl(262, 83%, 58%)',
    gradient: 'from-violet-500 to-violet-600',
    estimatedTime: '~25 saniye',
  },
  {
    id: 'sales-revenue',
    name: 'Satış / Ürün Geliri',
    description:
      'Kitap, kırtasiye ve diğer ürün satışlarının detaylı analizi.',
    category: 'income',
    icon: ShoppingCart,
    color: 'hsl(142, 76%, 36%)',
    gradient: 'from-lime-500 to-emerald-500',
    estimatedTime: '~20 saniye',
  },
  {
    id: 'comparative-period-analysis',
    name: 'Karşılaştırmalı Dönem Analizi',
    description:
      'İki farklı dönemi gelir, gider ve net sonuç açısından karşılaştırır.',
    category: 'analysis',
    icon: GitCompare,
    color: 'hsl(262, 83%, 58%)',
    gradient: 'from-purple-500 to-purple-600',
    estimatedTime: '~30 saniye',
  },
];
