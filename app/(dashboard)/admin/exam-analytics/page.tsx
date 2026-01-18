'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  Trophy,
  AlertTriangle,
  Plus,
  List,
  UserCheck,
  UserX,
  BookOpen,
  BarChart3,
  LineChart,
  Target,
  AlertCircle,
  Sparkles,
  FileBarChart,
  Settings,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  toplamSinav: number;
  toplamKatilimci: number;
  asilKatilimci: number;
  ortNet: number;
  netDegisim: number;
  enIyiPerformans: { sinif: string; net: number } | null;
  sonSinav: { ad: string; gun: number } | null;
  bekleyenEslesme: number;
  misafirKatilimci: number;
  ortBasari: number;
  buAySinav: number;
}

export default function ExamAnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    toplamSinav: 0,
    toplamKatilimci: 0,
    asilKatilimci: 0,
    ortNet: 0,
    netDegisim: 0,
    enIyiPerformans: null,
    sonSinav: null,
    bekleyenEslesme: 0,
    misafirKatilimci: 0,
    ortBasari: 0,
    buAySinav: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API'den istatistikleri çek
    async function fetchStats() {
      try {
        // TODO: Gerçek API hazır olduğunda kullanılacak
        // const res = await fetch('/api/admin/exam-analytics/dashboard');
        // const data = await res.json();
        // setStats(data);
        
        // Mock data - veritabanı hazır olduğunda kaldırılacak
        setStats({
          toplamSinav: 24,
          toplamKatilimci: 1247,
          asilKatilimci: 113,
          ortNet: 67.3,
          netDegisim: 2.1,
          enIyiPerformans: { sinif: '8/A', net: 72.4 },
          sonSinav: { ad: 'LGS Deneme #5', gun: 3 },
          bekleyenEslesme: 12,
          misafirKatilimci: 34,
          ortBasari: 72.4,
          buAySinav: 5,
        });
      } catch (error) {
        console.error('Dashboard stats fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  // Hızlı erişim kartları
  const quickAccessCards = [
    {
      title: 'Yeni Sınav Ekle',
      description: 'Sınav yükle ve analiz et',
      href: '/admin/exam-analytics/create',
      icon: Plus,
      color: 'emerald',
    },
    {
      title: 'Sınavlar Listesi',
      description: 'Tüm sınavları görüntüle',
      href: '/admin/exam-analytics/sinavlar',
      icon: List,
      color: 'emerald',
    },
    {
      title: 'Öğrenciler Performans',
      description: 'Asıl öğrenci analizleri',
      href: '/admin/exam-analytics/ogrenciler',
      icon: UserCheck,
      color: 'emerald',
    },
    {
      title: 'Misafir Öğrenciler',
      description: 'Misafir liste ve eşleştirme',
      href: '/admin/exam-analytics/misafirler',
      icon: UserX,
      color: 'orange',
    },
    {
      title: 'Karneler',
      description: 'Öğrenci karne raporları',
      href: '/admin/exam-analytics/karneler',
      icon: BookOpen,
      color: 'emerald',
    },
    {
      title: 'Sınıf Karşılaştırma',
      description: 'Sınıflar arası performans',
      href: '/admin/exam-analytics/sinif-karsilastirma',
      icon: BarChart3,
      color: 'emerald',
    },
    {
      title: 'Trend Analizi',
      description: 'Zaman serisi analizleri',
      href: '/admin/exam-analytics/trend',
      icon: LineChart,
      color: 'emerald',
    },
    {
      title: 'Hedef Takibi',
      description: 'LGS/YKS hedef takip',
      href: '/admin/exam-analytics/hedef',
      icon: Target,
      color: 'orange',
    },
    {
      title: 'Risk Öğrenciler',
      description: 'Düşüş riski olanlar',
      href: '/admin/exam-analytics/risk',
      icon: AlertCircle,
      color: 'red',
    },
    {
      title: 'AI Öneriler',
      description: 'Akıllı analiz ve öneriler',
      href: '/admin/exam-analytics/ai',
      icon: Sparkles,
      color: 'emerald',
    },
    {
      title: 'Raporlar',
      description: 'PDF/Excel raporları',
      href: '/admin/exam-analytics/raporlar',
      icon: FileBarChart,
      color: 'emerald',
    },
    {
      title: 'Ayarlar',
      description: 'Modül ayarları',
      href: '/admin/exam-analytics/ayarlar',
      icon: Settings,
      color: 'orange',
    },
  ];

  const getCardColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100';
      case 'orange':
        return 'bg-orange-50 hover:bg-orange-100 border-orange-100';
      case 'red':
        return 'bg-red-50 hover:bg-red-100 border-red-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100 border-gray-100';
    }
  };

  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500 text-white';
      case 'orange':
        return 'bg-orange-500 text-white';
      case 'red':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Üst İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {/* Toplam Sınav */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Toplam Sınav</span>
          </div>
          <div className="text-3xl font-bold">{stats.toplamSinav}</div>
          <div className="text-xs opacity-75 mt-1">Bu dönem</div>
        </div>

        {/* Toplam Katılımcı */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Toplam Katılımcı</span>
          </div>
          <div className="text-3xl font-bold">{stats.toplamKatilimci.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-1">{stats.asilKatilimci} asil</div>
        </div>

        {/* Ortalama Net */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Ort. Net</span>
          </div>
          <div className="text-3xl font-bold">{stats.ortNet.toFixed(1)}</div>
          <div className="text-xs mt-1 flex items-center gap-1">
            <span className="text-emerald-200">↑</span>
            <span className="opacity-75">+{stats.netDegisim}</span>
          </div>
        </div>

        {/* En İyi Performans */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-medium">En İyi Performans</span>
          </div>
          <div className="text-3xl font-bold">{stats.enIyiPerformans?.sinif || '-'}</div>
          <div className="text-xs opacity-75 mt-1">{stats.enIyiPerformans?.net || 0} net</div>
        </div>

        {/* Son Sınav */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Son Sınav</span>
          </div>
          <div className="text-3xl font-bold">{stats.sonSinav ? `${stats.sonSinav.gun} gün önce` : '-'}</div>
          <div className="text-xs opacity-75 mt-1 truncate">{stats.sonSinav?.ad || '-'}</div>
        </div>

        {/* Bekleyen Eşleşme */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Bekleyen Eşleşme</span>
          </div>
          <div className="text-3xl font-bold">{stats.bekleyenEslesme}</div>
          <div className="text-xs opacity-75 mt-1">öğrenci</div>
        </div>
      </div>

      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {quickAccessCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-xl p-5 border transition-all hover:shadow-md ${getCardColorClasses(card.color)}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${getIconColorClasses(card.color)}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.description}</p>
          </Link>
        ))}
      </div>

      {/* Alt İstatistik Barı */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Asıl Öğrenci */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ASİL ÖĞRENCİ</div>
            <div className="text-3xl font-bold text-gray-900">{stats.asilKatilimci}</div>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Misafir */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">MİSAFİR</div>
            <div className="text-3xl font-bold text-gray-900">{stats.misafirKatilimci}</div>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <UserX className="w-6 h-6 text-orange-600" />
          </div>
        </div>

        {/* Ort. Başarı */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ORT. BAŞARI</div>
            <div className="text-3xl font-bold text-emerald-600">%{stats.ortBasari}</div>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Bu Ay Sınav */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">BU AY SINAV</div>
            <div className="text-3xl font-bold text-gray-900">{stats.buAySinav}</div>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
