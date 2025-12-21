'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, CreditCard, FileText, TrendingUp, TrendingDown, 
  Users, AlertTriangle, CheckCircle, Clock, DollarSign,
  PieChart, BarChart3, Wallet, ArrowRight, Printer,
  RefreshCw, GraduationCap
} from 'lucide-react';
import ClassAverageChart from '@/components/finance/ClassAverageChart';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';

// =====================================================
// SADE FİNANS ÖN ÖZET RAPOR SAYFASI
// Her bölüm için PDF indirme özelliği
// =====================================================

interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  collectionRate: number;
  totalStudents: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
}

export default function FinancePage() {
  const { isAdmin, isAccounting, isLoading: permissionLoading } = usePermission();
  const { currentOrganization } = useOrganizationStore();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    collectionRate: 0,
    totalStudents: 0,
    overdueCount: 0,
    paidCount: 0,
    pendingCount: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0
  });

  // Verileri çek
  useEffect(() => {
    fetchSummary();
  }, [currentOrganization?.id]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [installmentsRes, expensesRes, studentsRes] = await Promise.all([
        fetch('/api/installments'),
        fetch('/api/finance/expenses'),
        fetch('/api/students')
      ]);

      const [installmentsData, expensesData, studentsData] = await Promise.all([
        installmentsRes.json(),
        expensesRes.json(),
        studentsRes.json()
      ]);

      const installments = installmentsData.data || [];
      const expenses = expensesData.data || [];
      const students = studentsData.data || [];

      // Hesaplamalar
      const totalIncome = installments.reduce((s: number, i: any) => s + (i.is_paid ? Number(i.amount) : 0), 0);
      const totalInstallments = installments.reduce((s: number, i: any) => s + Number(i.amount), 0);
      const totalExpense = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
      
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      
      const overdueCount = installments.filter((i: any) => 
        !i.is_paid && i.due_date && i.due_date < today
      ).length;
      
      const paidCount = installments.filter((i: any) => i.is_paid).length;
      const pendingCount = installments.filter((i: any) => !i.is_paid).length;
      
      // Bu ay
      const thisMonth = now.toISOString().slice(0, 7);
      const thisMonthIncome = installments
        .filter((i: any) => i.is_paid && i.paid_at?.startsWith(thisMonth))
        .reduce((s: number, i: any) => s + Number(i.amount), 0);
      const thisMonthExpense = expenses
        .filter((e: any) => e.date?.startsWith(thisMonth))
        .reduce((s: number, e: any) => s + Number(e.amount), 0);

      setSummary({
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        collectionRate: totalInstallments > 0 ? (totalIncome / totalInstallments) * 100 : 0,
        totalStudents: students.length,
        overdueCount,
        paidCount,
        pendingCount,
        thisMonthIncome,
        thisMonthExpense
      });
    } catch (error) {
      console.error('Finans verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // PDF oluşturma fonksiyonu
  const generatePDF = (section: string) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Finans Raporu - ${section}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10B981; padding-bottom: 20px; }
          .header h1 { color: #10B981; margin: 0; }
          .header p { color: #666; margin-top: 5px; }
          .section { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
          .section h2 { color: #374151; margin-bottom: 15px; font-size: 18px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .stat { padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .stat-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          .green { color: #10B981; }
          .red { color: #EF4444; }
          .blue { color: #3B82F6; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Finans Özet Raporu</h1>
          <p>${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} - ${section}</p>
        </div>
        
        <div class="section">
          <h2>💰 Genel Finansal Durum</h2>
          <div class="grid">
            <div class="stat">
              <div class="stat-label">Toplam Gelir (Tahsilat)</div>
              <div class="stat-value green">₺${summary.totalIncome.toLocaleString('tr-TR')}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Toplam Gider</div>
              <div class="stat-value red">₺${summary.totalExpense.toLocaleString('tr-TR')}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Net Durum</div>
              <div class="stat-value ${summary.netBalance >= 0 ? 'green' : 'red'}">₺${summary.netBalance.toLocaleString('tr-TR')}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Tahsilat Oranı</div>
              <div class="stat-value blue">%${summary.collectionRate.toFixed(1)}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>📅 Bu Ay Özeti</h2>
          <div class="grid">
            <div class="stat">
              <div class="stat-label">Bu Ay Gelir</div>
              <div class="stat-value green">₺${summary.thisMonthIncome.toLocaleString('tr-TR')}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Bu Ay Gider</div>
              <div class="stat-value red">₺${summary.thisMonthExpense.toLocaleString('tr-TR')}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>📊 Taksit Durumu</h2>
          <div class="grid">
            <div class="stat">
              <div class="stat-label">Ödenen Taksit</div>
              <div class="stat-value green">${summary.paidCount}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Bekleyen Taksit</div>
              <div class="stat-value blue">${summary.pendingCount}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Gecikmiş Taksit</div>
              <div class="stat-value red">${summary.overdueCount}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Aktif Öğrenci</div>
              <div class="stat-value blue">${summary.totalStudents}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          <p>AkademiHub - Finansal Yönetim Sistemi</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
    toast.success('PDF raporu hazırlandı');
  };

  // Yetki kontrolü
  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAdmin && !isAccounting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Erişim Yetkisi Gerekli</h2>
        <p className="text-gray-500 mt-2">Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finansal Özet Raporu</h1>
          <p className="text-gray-500 text-sm mt-1">Hızlı finans durumu ve detaylı rapor indirme</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchSummary}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={() => generatePDF('Genel Özet')}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-200"
          >
            <Download className="w-4 h-4" />
            PDF İndir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-500">Veriler yükleniyor...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ana Özet Kartları - 4'lü Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Durum */}
            <div className={`rounded-2xl p-5 shadow-lg ${summary.netBalance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="text-white/80 text-sm font-medium">Net Durum</p>
                  <p className="text-3xl font-bold mt-2">₺{Math.abs(summary.netBalance).toLocaleString('tr-TR')}</p>
                  <p className="text-white/70 text-xs mt-2">
                    {summary.netBalance >= 0 ? '📈 Kâr durumunda' : '📉 Zarar durumunda'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <button 
                onClick={() => generatePDF('Net Durum')}
                className="absolute bottom-3 right-3 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                title="PDF İndir"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

            {/* Toplam Gelir */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Toplam Tahsilat</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">₺{summary.totalIncome.toLocaleString('tr-TR')}</p>
                  <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    Bu ay: ₺{summary.thisMonthIncome.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <button 
                onClick={() => generatePDF('Gelir Raporu')}
                className="absolute bottom-3 right-3 p-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                title="PDF İndir"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
              </button>
            </div>

            {/* Toplam Gider */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Toplam Gider</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">₺{summary.totalExpense.toLocaleString('tr-TR')}</p>
                  <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    Bu ay: ₺{summary.thisMonthExpense.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <button 
                onClick={() => generatePDF('Gider Raporu')}
                className="absolute bottom-3 right-3 p-2 bg-red-50 rounded-lg hover:bg-red-100 transition"
                title="PDF İndir"
              >
                <Printer className="w-4 h-4 text-red-600" />
              </button>
            </div>

            {/* Tahsilat Oranı */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Tahsilat Oranı</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">%{summary.collectionRate.toFixed(1)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all" 
                      style={{ width: `${Math.min(100, summary.collectionRate)}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <button 
                onClick={() => generatePDF('Tahsilat Raporu')}
                className="absolute bottom-3 right-3 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                title="PDF İndir"
              >
                <Printer className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Taksit & Öğrenci Durumu */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{summary.paidCount}</p>
                <p className="text-gray-500 text-sm">Ödenen Taksit</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{summary.pendingCount}</p>
                <p className="text-gray-500 text-sm">Bekleyen Taksit</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{summary.overdueCount}</p>
                <p className="text-gray-500 text-sm">Gecikmiş Taksit</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{summary.totalStudents}</p>
                <p className="text-gray-500 text-sm">Aktif Öğrenci</p>
              </div>
            </div>
          </div>

          {/* Sınıf Bazında Ortalama Ücretler */}
          <div className="relative">
            <button 
              onClick={() => generatePDF('Sınıf Ücretleri')}
              className="absolute top-4 right-4 z-10 px-3 py-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white transition flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Printer className="w-4 h-4" />
              PDF
            </button>
            <ClassAverageChart />
          </div>

          {/* Hızlı Erişim Linkleri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/finance/reports/founder" 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white hover:from-purple-600 hover:to-indigo-700 transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Detaylı Rapor</p>
                  <p className="text-xl font-bold mt-1">Kurucu Raporu</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
            
            <a 
              href="/finance/reports/contracts" 
              className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-5 text-white hover:from-blue-600 hover:to-cyan-700 transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Detaylı Rapor</p>
                  <p className="text-xl font-bold mt-1">Sözleşme Raporu</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
            
            <a 
              href="/finance/other-income" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-5 text-white hover:from-amber-600 hover:to-orange-700 transition shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Diğer Satışlar</p>
                  <p className="text-xl font-bold mt-1">Gelir Yönetimi</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
