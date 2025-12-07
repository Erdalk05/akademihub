'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, ChevronDown, Printer } from 'lucide-react';

type CollectionData = {
  id: string;
  studentName: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
  installmentNo: number;
};

type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

const paymentMethodLabels: Record<string, string> = {
  cash: 'Nakit',
  credit_card: 'Kredi Kartı',
  bank_transfer: 'Havale/EFT',
  check: 'Çek',
  pos: 'POS',
  online: 'Online',
};

export default function CollectionReport() {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Tarih aralığını hesapla
  const getDateRange = () => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'today':
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(today);
        start.setDate(today.getDate() + mondayOffset);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        start = new Date(startDate);
        end = new Date(endDate);
        break;
    }

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  };

  // Verileri çek
  const fetchCollections = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const res = await fetch('/api/installments', { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const filtered = json.data
          .filter((p: any) => {
            if (!p.is_paid || !p.paid_at) return false;
            const paidDate = p.paid_at.slice(0, 10);
            return paidDate >= start && paidDate <= end;
          })
          .map((p: any) => ({
            id: p.id,
            studentName: p.studentName || p.student_id?.substring(0, 8) || 'Bilinmiyor',
            amount: p.paid_amount || p.amount || 0,
            paidAt: p.paid_at,
            paymentMethod: p.payment_method || 'cash',
            installmentNo: p.installment_no || 1,
          }));
        
        setCollections(filtered);
      }
    } catch (error) {
      console.error('Tahsilat verisi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede bugünkü verileri çek
  useEffect(() => {
    fetchCollections();
  }, []);

  // Dönem değiştiğinde verileri yenile
  useEffect(() => {
    if (period !== 'custom') {
      fetchCollections();
    }
  }, [period]);

  // Özet hesaplamalar
  const totalAmount = collections.reduce((sum, c) => sum + c.amount, 0);
  const methodSummary = collections.reduce((acc, c) => {
    const method = c.paymentMethod || 'cash';
    acc[method] = (acc[method] || 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);

  // PDF Oluştur
  const generatePDF = () => {
    const { start, end } = getDateRange();
    const periodLabel = period === 'today' ? 'Bugün' :
      period === 'week' ? 'Bu Hafta' :
      period === 'month' ? 'Bu Ay' :
      period === 'year' ? 'Bu Yıl' :
      `${new Date(start).toLocaleDateString('tr-TR')} - ${new Date(end).toLocaleDateString('tr-TR')}`;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Tahsilat Raporu - ${periodLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
          .header h1 { font-size: 24px; color: #10b981; margin-bottom: 5px; }
          .header .period { font-size: 16px; color: #666; margin-top: 10px; }
          .summary { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
          .summary-card { flex: 1; padding: 20px; border-radius: 10px; text-align: center; border: 2px solid; }
          .summary-card.total { background: #dcfce7; border-color: #22c55e; }
          .summary-card.count { background: #dbeafe; border-color: #3b82f6; }
          .summary-card h3 { font-size: 11px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
          .summary-card .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
          .summary-card .count-num { font-size: 24px; font-weight: bold; color: #2563eb; }
          .method-summary { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .method-summary h3 { font-size: 12px; color: #475569; margin-bottom: 10px; }
          .method-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; }
          .method-row:last-child { border-bottom: none; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; font-size: 11px; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:hover { background: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #16a34a; font-weight: 600; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Tahsilat Raporu</h1>
          <div class="period">📅 ${periodLabel}</div>
        </div>

        <div class="summary">
          <div class="summary-card total">
            <h3>Toplam Tahsilat</h3>
            <div class="amount">${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <div class="summary-card count">
            <h3>İşlem Sayısı</h3>
            <div class="count-num">${collections.length}</div>
          </div>
        </div>

        <div class="method-summary">
          <h3>Ödeme Yöntemlerine Göre Dağılım</h3>
          ${Object.entries(methodSummary).map(([method, amount]) => `
            <div class="method-row">
              <span>${paymentMethodLabels[method] || method}</span>
              <span class="text-green">${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
          `).join('')}
        </div>

        ${collections.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th class="text-center">Taksit No</th>
                <th class="text-center">Ödeme Tarihi</th>
                <th class="text-center">Ödeme Yöntemi</th>
                <th class="text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${collections.map(c => `
                <tr>
                  <td>${c.studentName}</td>
                  <td class="text-center">${c.installmentNo}. Taksit</td>
                  <td class="text-center">${new Date(c.paidAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td class="text-center">${paymentMethodLabels[c.paymentMethod] || c.paymentMethod}</td>
                  <td class="text-right text-green">${c.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; padding: 30px; color: #9ca3af;">Bu dönemde tahsilat bulunamadı.</p>'}

        <div class="footer">
          <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          <p style="margin-top: 5px;">AkademiHub - Finansal Yönetim Sistemi</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const periodLabels: Record<ReportPeriod, string> = {
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    year: 'Bu Yıl',
    custom: 'Özel Aralık',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white/80" />
            <span className="text-sm font-semibold text-white">Tahsilat Raporu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              ₺{totalAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white">
              {collections.length} işlem
            </span>
          </div>
        </div>
      </div>

      {/* Dönem Seçici */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'week', 'month', 'year', 'custom'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                period === p
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Özel Tarih Aralığı */}
        {period === 'custom' && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={fetchCollections}
              disabled={loading}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? '...' : 'Getir'}
            </button>
          </div>
        )}
      </div>

      {/* Ödeme Yöntemi Özeti */}
      {collections.length > 0 && (
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap gap-3">
            {Object.entries(methodSummary).map(([method, amount]) => (
              <div key={method} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-gray-600">{paymentMethodLabels[method] || method}:</span>
                <span className="font-semibold text-gray-900">₺{amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detay Liste */}
      {collections.length > 0 && (
        <div className="p-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
          >
            <ChevronDown className={`w-3 h-3 transition ${showDetails ? 'rotate-180' : ''}`} />
            {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
          </button>

          {showDetails && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {collections.slice(0, 20).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded text-xs">
                  <div>
                    <span className="font-medium text-gray-900">{c.studentName}</span>
                    <span className="text-gray-400 ml-2">#{c.installmentNo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{new Date(c.paidAt).toLocaleDateString('tr-TR')}</span>
                    <span className="font-semibold text-emerald-600">₺{c.amount.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ))}
              {collections.length > 20 && (
                <p className="text-center text-[10px] text-gray-400 pt-2">
                  +{collections.length - 20} kayıt daha (PDF'de görünür)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Boş Durum */}
      {collections.length === 0 && !loading && (
        <div className="p-6 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Bu dönemde tahsilat bulunamadı</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        </div>
      )}

      {/* PDF İndir Butonu */}
      {collections.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={generatePDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
          >
            <Printer className="w-4 h-4" />
            PDF Rapor İndir
          </button>
        </div>
      )}
    </div>
  );
}

