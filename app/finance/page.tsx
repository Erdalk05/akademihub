'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Download, CreditCard, FileText, TrendingUp, TrendingDown, 
  Users, AlertTriangle, CheckCircle, Clock, DollarSign,
  PieChart, BarChart3, Wallet, ArrowRight, Printer,
  RefreshCw, GraduationCap, WifiOff
} from 'lucide-react';
import ClassAverageChart from '@/components/finance/ClassAverageChart';
import { usePermission } from '@/lib/hooks/usePermission';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import toast from 'react-hot-toast';
// ✅ Offline & Cache desteği
import { getDashboardDataCached, invalidateFinanceCache } from '@/lib/data/financeDataProvider';
import { useNetworkStatus } from '@/lib/offline/networkStatus';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
// ✅ RiskEngine
import { calculateRiskStats } from '@/lib/risk/RiskEngine';

// =====================================================
// OPTİMİZE FİNANS ÖN ÖZET RAPOR SAYFASI
// TEK API ÇAĞRISI ile tüm veriler
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

interface ClassData {
  class: string;
  averageFee: number;
  studentCount: number;
  totalAmount: number;
}

export default function FinancePage() {
  const { isAdmin, isAccounting, isLoading: permissionLoading } = usePermission();
  const { currentOrganization } = useOrganizationStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // ✅ Network status ve cache durumu
  const { isOnline, isOffline } = useNetworkStatus();
  const [isFromCache, setIsFromCache] = useState(false);
  
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
  const [classData, setClassData] = useState<ClassData[]>([]);

  // ✅ Cache destekli veri çekme
  const fetchSummary = useCallback(async (forceRefresh: boolean = false) => {
    // Önceki isteği iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      console.log(`[FINANCE] 🔄 Veri yükleniyor (Online: ${isOnline}, ForceRefresh: ${forceRefresh})`);
      
      const result = await getDashboardDataCached(currentOrganization?.id, { forceRefresh });
      
      setIsFromCache(result.fromCache);
      
      console.log(`[FINANCE] ✅ Veri yüklendi:`, {
        fromCache: result.fromCache,
        isOffline: result.isOffline
      });
      
      if (result.data) {
        setSummary(result.data.summary);
        setClassData(result.data.classData || []);
      } else if (result.isOffline) {
        toast.error('Çevrimdışı mod - Kayıtlı veri bulunamadı');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Finans verileri yüklenemedi:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, isOnline]);

  // ✅ Refresh handler
  const handleRefresh = useCallback(async () => {
    if (isOffline) {
      toast.error('İnternet bağlantısı yok - Yenileme yapılamıyor');
      return;
    }
    invalidateFinanceCache();
    await fetchSummary(true);
    toast.success('Veriler güncellendi');
  }, [isOffline, fetchSummary]);

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchSummary();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSummary]);

  // PDF oluşturma fonksiyonu - Sade tablo formatı
  const generatePDF = (section: string) => {
    const today = new Date().toLocaleDateString('tr-TR');
    const netDurum = summary.totalIncome - summary.totalExpense;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Finans Raporu</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
          .header { margin-bottom: 15px; }
          .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
          .header p { font-size: 10px; color: #666; }
          .summary { display: flex; gap: 30px; margin: 15px 0; padding: 10px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
          .summary-item { }
          .summary-label { font-size: 9px; color: #666; }
          .summary-value { font-size: 14px; font-weight: bold; }
          .summary-value.green { color: #10B981; }
          .summary-value.red { color: #EF4444; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f3f4f6; padding: 8px 6px; text-align: left; font-size: 10px; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .green { color: #10B981; }
          .red { color: #EF4444; }
          .total-row { background: #f9fafb; font-weight: bold; }
          .total-row td { border-top: 2px solid #374151; padding-top: 10px; }
          .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Finansal Özet Raporu</h1>
          <p>Tarih: ${today}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Toplam Gelir</div>
            <div class="summary-value green">₺${summary.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Toplam Gider</div>
            <div class="summary-value red">₺${summary.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Net Durum</div>
            <div class="summary-value ${netDurum >= 0 ? 'green' : 'red'}">₺${netDurum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Açıklama</th>
              <th class="text-center">Durum</th>
              <th class="text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Eğitim Gelirleri (Tahsilat)</td>
              <td class="text-center">Aktif</td>
              <td class="text-right green">₺${summary.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Toplam Giderler</td>
              <td class="text-center">Aktif</td>
              <td class="text-right red">₺${summary.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Ödenen Taksit Sayısı</td>
              <td class="text-center green">✓</td>
              <td class="text-right">${summary.paidCount} adet</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Bekleyen Taksit Sayısı</td>
              <td class="text-center">Bekliyor</td>
              <td class="text-right">${summary.pendingCount} adet</td>
            </tr>
            <tr>
              <td>5</td>
              <td>Gecikmiş Taksit Sayısı</td>
              <td class="text-center red">Gecikmiş</td>
              <td class="text-right red">${summary.overdueCount} adet</td>
            </tr>
            <tr>
              <td>6</td>
              <td>Aktif Öğrenci Sayısı</td>
              <td class="text-center">Aktif</td>
              <td class="text-right">${summary.totalStudents} kişi</td>
            </tr>
            <tr>
              <td>7</td>
              <td>Tahsilat Oranı</td>
              <td class="text-center">-</td>
              <td class="text-right">%${summary.collectionRate.toFixed(1)}</td>
            </tr>
            <tr>
              <td>8</td>
              <td>Bu Ay Gelir</td>
              <td class="text-center">Aktif</td>
              <td class="text-right green">₺${summary.thisMonthIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>9</td>
              <td>Bu Ay Gider</td>
              <td class="text-center">Aktif</td>
              <td class="text-right red">₺${summary.thisMonthExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td></td>
              <td><strong>NET DURUM</strong></td>
              <td class="text-center"></td>
              <td class="text-right ${netDurum >= 0 ? 'green' : 'red'}"><strong>₺${netDurum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>${new Date().toLocaleString('tr-TR')} | AkademiHub</p>
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

  // Sınıf Bazında Detaylı PDF - Tablo formatı
  const generateClassPDF = async () => {
    try {
      // Verileri çek
      const [studentsRes, installmentsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/installments?raw=true')
      ]);

      const studentsData = await studentsRes.json();
      const installmentsData = await installmentsRes.json();

      const students = studentsData.data || [];
      const installments = installmentsData.data || [];

      // Sınıf bazında grupla
      const classMap = new Map<string, { 
        ucretli: number; 
        ucretsiz: number; 
        totalAmount: number; 
        paidAmount: number;
        students: Set<string>;
      }>();

      students.forEach((student: any) => {
        const className = student.class || 'Belirsiz';
        if (!classMap.has(className)) {
          classMap.set(className, { ucretli: 0, ucretsiz: 0, totalAmount: 0, paidAmount: 0, students: new Set() });
        }
        const classInfo = classMap.get(className)!;
        classInfo.students.add(student.id);
        
        // Ücretli/Ücretsiz sayımı
        const studentInstallments = installments.filter((i: any) => i.student_id === student.id);
        const hasPayment = studentInstallments.some((i: any) => Number(i.amount) > 0);
        if (hasPayment) {
          classInfo.ucretli++;
        } else {
          classInfo.ucretsiz++;
        }
        
        // Toplam ve ödenen tutarlar
        studentInstallments.forEach((inst: any) => {
          classInfo.totalAmount += Number(inst.amount) || 0;
          if (inst.is_paid) {
            classInfo.paidAmount += Number(inst.paid_amount || inst.amount) || 0;
          }
        });
      });

      // Tablo verisini hazırla
      const tableData = Array.from(classMap.entries())
        .map(([className, info]) => {
          const total = info.ucretli + info.ucretsiz;
          const avgFee = total > 0 ? info.totalAmount / total : 0;
          const collectionRate = info.totalAmount > 0 ? (info.paidAmount / info.totalAmount) * 100 : 0;
          return {
            sinif: className,
            ucretli: info.ucretli,
            ucretsiz: info.ucretsiz,
            toplam: total,
            toplamGelir: info.totalAmount,
            tahsilEdilen: info.paidAmount,
            ortUcret: avgFee,
            tahsilatOran: collectionRate
          };
        })
        .sort((a, b) => {
          const aNum = parseInt(a.sinif);
          const bNum = parseInt(b.sinif);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          if (!isNaN(aNum)) return -1;
          if (!isNaN(bNum)) return 1;
          return a.sinif.localeCompare(b.sinif);
        });

      // Toplamlar
      const totals = tableData.reduce((acc, row) => ({
        ucretli: acc.ucretli + row.ucretli,
        ucretsiz: acc.ucretsiz + row.ucretsiz,
        toplam: acc.toplam + row.toplam,
        toplamGelir: acc.toplamGelir + row.toplamGelir,
        tahsilEdilen: acc.tahsilEdilen + row.tahsilEdilen
      }), { ucretli: 0, ucretsiz: 0, toplam: 0, toplamGelir: 0, tahsilEdilen: 0 });

      const avgTotal = totals.toplam > 0 ? totals.toplamGelir / totals.toplam : 0;
      const totalRate = totals.toplamGelir > 0 ? (totals.tahsilEdilen / totals.toplamGelir) * 100 : 0;

      const today = new Date().toLocaleDateString('tr-TR');
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sınıf Bazlı Detaylı Analiz</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
            .header { margin-bottom: 15px; }
            .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .header p { font-size: 10px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #10B981; color: white; padding: 10px 8px; text-align: left; font-size: 10px; font-weight: 600; }
            th.text-center { text-align: center; }
            th.text-right { text-align: right; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
            td.text-center { text-align: center; }
            td.text-right { text-align: right; }
            .green { color: #10B981; }
            .red { color: #EF4444; }
            .amber { color: #F59E0B; }
            .total-row { background: #f0fdf4; font-weight: bold; }
            .total-row td { border-top: 2px solid #10B981; }
            .risk-bar { display: inline-block; width: 40px; height: 8px; background: #fee2e2; border-radius: 4px; overflow: hidden; }
            .risk-fill { height: 100%; background: #ef4444; }
            .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #9ca3af; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sınıf Bazlı Detaylı Analiz</h1>
            <p>Tarih: ${today} - Toplam: ${totals.toplam} öğrenci</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>SINIF</th>
                <th class="text-center">ÜCRETLİ</th>
                <th class="text-center">ÜCRETSİZ</th>
                <th class="text-center">TOPLAM</th>
                <th class="text-right">TOPLAM GELİR</th>
                <th class="text-right">TAHSİL EDİLEN</th>
                <th class="text-right">ORT. ÜCRET</th>
                <th class="text-center">TAHSİLAT</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => `
                <tr>
                  <td><strong>${row.sinif}. Sınıf</strong></td>
                  <td class="text-center">${row.ucretli}</td>
                  <td class="text-center green">${row.ucretsiz}</td>
                  <td class="text-center"><strong>${row.toplam}</strong></td>
                  <td class="text-right">₺${row.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right ${row.tahsilEdilen > 0 ? 'green' : 'red'}">₺${row.tahsilEdilen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right">₺${row.ortUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-center ${row.tahsilatOran >= 50 ? 'green' : row.tahsilatOran > 0 ? 'amber' : 'red'}">%${row.tahsilatOran.toFixed(0)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>TOPLAM</strong></td>
                <td class="text-center"><strong>${totals.ucretli}</strong></td>
                <td class="text-center green"><strong>${totals.ucretsiz}</strong></td>
                <td class="text-center"><strong>${totals.toplam}</strong></td>
                <td class="text-right"><strong>₺${totals.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></td>
                <td class="text-right green"><strong>₺${totals.tahsilEdilen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></td>
                <td class="text-right"><strong>₺${avgTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></td>
                <td class="text-center ${totalRate >= 50 ? 'green' : 'amber'}"><strong>%${totalRate.toFixed(0)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>${new Date().toLocaleString('tr-TR')} | AkademiHub - Sınıf Bazlı Analiz</p>
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
      toast.success('Sınıf bazlı PDF hazırlandı');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulamadı');
    }
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
      {/* ✅ Offline Göstergesi */}
      <OfflineIndicator onRefresh={handleRefresh} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finansal Özet Raporu</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">Hızlı finans durumu ve detaylı rapor indirme</p>
            {/* Cache durumu göstergesi */}
            {isFromCache && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                <Clock className="w-2.5 h-2.5" />
                Kayıtlı veri
              </span>
            )}
            {isOffline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                <WifiOff className="w-2.5 h-2.5" />
                Çevrimdışı
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={isOffline}
            className={`px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* ✅ Risk Özeti Kartı */}
          {summary.overdueCount > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-5 border border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 text-lg">Risk Durumu</h3>
                    <p className="text-red-600 text-sm">{summary.overdueCount} gecikmiş taksit tespit edildi</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">{summary.overdueCount}</div>
                  <div className="text-xs text-red-500">Aksiyon Bekliyor</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a 
                  href="/finance/reports/founder?tab=risk" 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold text-center hover:bg-red-700 transition"
                >
                  Risk Raporunu Gör
                </a>
                <button 
                  onClick={() => generatePDF('Risk Raporu')}
                  className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          )}

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
              onClick={generateClassPDF}
              className="absolute top-4 right-4 z-10 px-3 py-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white transition flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Printer className="w-4 h-4" />
              PDF
            </button>
            <ClassAverageChart data={classData} loading={loading} />
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
