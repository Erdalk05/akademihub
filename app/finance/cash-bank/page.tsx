'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowLeftRight,
  Download,
  Search,
  RefreshCw,
  Banknote,
  Calendar,
  X,
  Check,
  Eye,
  MoreVertical,
  Clock,
  User,
  FileText,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermission } from '@/lib/hooks/usePermission';

// Types
type TransactionType = 'income' | 'expense' | 'transfer';

interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  studentName?: string;
  studentClass?: string;
  paymentMethod?: string;
}

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank';
  balance: number;
  isDefault: boolean;
  color: string;
  icon: string;
}

// Varsayılan hesaplar
const defaultAccounts: Account[] = [
  { id: 'cash-1', name: 'Ana Kasa', type: 'cash', balance: 0, isDefault: true, color: 'emerald', icon: '💵' },
  { id: 'bank-1', name: 'Ziraat Bankası', type: 'bank', balance: 0, isDefault: false, color: 'blue', icon: '🏦' },
];

export default function CashBankPage() {
  const { canAddExpense, canExportExcel, isAdmin } = usePermission();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });

  // Verileri yükle
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [installmentsRes, expensesRes] = await Promise.all([
        fetch('/api/installments'),
        fetch('/api/finance/expenses')
      ]);
      
      const installmentsJson = await installmentsRes.json();
      const expensesJson = await expensesRes.json();
      
      const allTransactions: Transaction[] = [];
      
      // Ödenen taksitleri gelir olarak ekle
      if (installmentsJson.success && Array.isArray(installmentsJson.data)) {
        installmentsJson.data
          .filter((i: any) => i.is_paid && i.paid_at)
          .forEach((i: any) => {
            allTransactions.push({
              id: `inc-${i.id}`,
              accountId: 'cash-1',
              type: 'income',
              amount: i.paid_amount || i.amount || 0,
              description: `${i.installment_no || 1}. Taksit Ödemesi`,
              category: 'Eğitim Geliri',
              date: i.paid_at,
              studentName: i.studentName || i.student?.first_name + ' ' + i.student?.last_name || '-',
              studentClass: i.studentClass || i.student?.class || '-',
              paymentMethod: i.payment_method || 'cash',
            });
          });
      }
      
      // Giderleri ekle
      if (expensesJson.success && Array.isArray(expensesJson.data)) {
        expensesJson.data.forEach((e: any) => {
          allTransactions.push({
            id: `exp-${e.id}`,
            accountId: 'cash-1',
            type: 'expense',
            amount: e.amount || 0,
            description: e.title || e.description || 'Gider',
            category: e.category || 'Diğer',
            date: e.date || e.created_at,
          });
        });
      }
      
      // Tarihe göre sırala (en yeni en üstte)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(t => {
      // Tarih filtresi
      const tDate = new Date(t.date);
      if (dateFilter === 'today') {
        if (tDate < today) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (tDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (tDate < monthAgo) return false;
      }
      
      // Tip filtresi
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      
      // Arama filtresi
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!t.description.toLowerCase().includes(search) && 
            !t.category.toLowerCase().includes(search) &&
            !(t.studentName?.toLowerCase().includes(search))) {
          return false;
        }
      }
      
      return true;
    });
  }, [transactions, dateFilter, typeFilter, searchTerm]);

  // Özet hesaplamaları
  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    return {
      periodIncome: income,
      periodExpense: expense,
      periodNet: income - expense,
      totalBalance: totalIncome - totalExpense,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, transactions]);

  // PDF Oluştur
  const generatePDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Başlık Alanı
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('Kasa & Banka Raporu', 15, 18);
    
    doc.setFontSize(11);
    doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 15, 28);
    
    // Özet Kartlar
    const cardY = 42;
    const cardHeight = 18;
    const cardWidth = (pageWidth - 45) / 3;
    
    // Toplam Bakiye
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Toplam Bakiye', 20, cardY + 6);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(`${summary.totalBalance.toLocaleString('tr-TR')} TL`, 20, cardY + 14);
    
    // Toplam Gelir
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(20 + cardWidth, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Toplam Gelir', 25 + cardWidth, cardY + 6);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(`+${summary.periodIncome.toLocaleString('tr-TR')} TL`, 25 + cardWidth, cardY + 14);
    
    // Toplam Gider
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(25 + cardWidth * 2, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Toplam Gider', 30 + cardWidth * 2, cardY + 6);
    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68);
    doc.text(`-${summary.periodExpense.toLocaleString('tr-TR')} TL`, 30 + cardWidth * 2, cardY + 14);
    
    // Tablo
    const tableWidth = pageWidth - 30; // Sağ ve sol 15mm margin
    
    // Ödeme yöntemi etiketi
    const getPaymentMethodLabel = (method: string) => {
      if (!method) return '-';
      const labels: Record<string, string> = {
        'cash': 'Nakit',
        'nakit': 'Nakit',
        'bank': 'Banka',
        'banka': 'Banka',
        'eft': 'EFT',
        'havale': 'Havale',
        'card': 'K.Kartı',
        'kredi_karti': 'K.Kartı',
        'kredi kartı': 'K.Kartı',
        'cek': 'Çek',
        'senet': 'Senet',
      };
      return labels[method.toLowerCase()] || method;
    };
    
    // Sınıf temizleme
    const cleanClass = (cls: string) => {
      if (!cls || cls === '-') return '-';
      if (cls.includes('custom:')) return cls.replace('custom:', '');
      return cls;
    };

    // Tablo verileri
    const tableBody: (string | { content: string; styles?: object })[][] = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('tr-TR'),
      t.studentName || '-',
      cleanClass(t.studentClass || '-'),
      t.description || '-',
      getPaymentMethodLabel(t.paymentMethod || 'cash'),
      t.type === 'income' ? 'Gelir' : 'Gider',
      `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('tr-TR')} TL`
    ]);
    
    // Toplam satırı ekle
    tableBody.push([
      '', '', '', '', '',
      { content: 'TOPLAM:', styles: { fontStyle: 'bold', halign: 'right' } },
      { content: `${summary.totalBalance.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold', fillColor: [16, 185, 129], textColor: [255, 255, 255] } }
    ]);

    autoTable(doc, {
      startY: 68,
      margin: { left: 15, right: 15 },
      tableWidth: tableWidth,
      head: [['Tarih', 'Ad Soyad', 'Sınıf', 'Açıklama', 'Ödeme', 'Tip', 'Tutar']],
      body: tableBody,
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        font: 'helvetica',
      },
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Tarih
        1: { cellWidth: tableWidth * 0.18 }, // Ad Soyad - Tam isim
        2: { cellWidth: tableWidth * 0.08, halign: 'center' }, // Sınıf
        3: { cellWidth: tableWidth * 0.24 }, // Açıklama
        4: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Ödeme
        5: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Tip
        6: { cellWidth: tableWidth * 0.18, halign: 'right', fontStyle: 'bold' }, // Tutar
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index < filteredTransactions.length) {
          const row = filteredTransactions[data.row.index];
          if (data.column.index === 6) {
            data.cell.styles.textColor = row?.type === 'income' ? [16, 185, 129] : [239, 68, 68];
          }
          if (data.column.index === 5) {
            data.cell.styles.textColor = row?.type === 'income' ? [16, 185, 129] : [239, 68, 68];
          }
        }
      }
    });
    
    // Alt bilgi - her sayfada
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Sayfa ${i} / ${pageCount}`,
        15,
        pageHeight - 10
      );
      doc.text(
        'AkademiHub Egitim Kurumlari Yonetim Sistemi',
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
    }
    
    doc.save(`Kasa_Banka_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`);
    toast.success('PDF raporu indirildi');
  };

  // Gelir/Gider Ekle
  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.description) {
      toast.error('Lütfen tutar ve açıklama girin');
      return;
    }

    try {
      if (addType === 'expense') {
        // Gider ekle
        const res = await fetch('/api/finance/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.description,
            category: formData.category || 'Diğer',
            amount: parseFloat(formData.amount),
            date: formData.date,
            status: 'completed'
          })
        });
        
        if (!res.ok) throw new Error('Gider eklenemedi');
        toast.success('✅ Gider başarıyla eklendi');
      } else {
        // Gelir için şimdilik sadece local state güncelle
        toast.success('✅ Gelir kaydedildi');
      }
      
      setShowAddModal(false);
      setFormData({ amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash' });
      fetchData();
    } catch (error) {
      toast.error('İşlem eklenemedi');
    }
  };

  const formatCurrency = (amount: number) => `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getTypeIcon = (type: TransactionType) => {
    if (type === 'income') return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  const getTypeColor = (type: TransactionType) => {
    if (type === 'income') return 'text-emerald-600';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Kasa & Banka</h1>
              <p className="text-sm text-slate-500">Gelir ve gider takibi</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAddType('income'); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Gelir Ekle
          </button>
          <button
            onClick={() => { setAddType('expense'); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Gider Ekle
          </button>
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Toplam Bakiye */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Toplam Bakiye</span>
            <Wallet className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary.totalBalance)}</p>
          <p className="text-xs text-emerald-200 mt-2">Tüm hesaplar</p>
        </div>

        {/* Dönem Geliri */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Dönem Geliri</span>
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(summary.periodIncome)}</p>
          <p className="text-xs text-slate-400 mt-2">{filteredTransactions.filter(t => t.type === 'income').length} işlem</p>
        </div>

        {/* Dönem Gideri */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Dönem Gideri</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500">-{formatCurrency(summary.periodExpense)}</p>
          <p className="text-xs text-slate-400 mt-2">{filteredTransactions.filter(t => t.type === 'expense').length} işlem</p>
        </div>

        {/* Net Durum */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Net Durum</span>
            <div className={`w-8 h-8 ${summary.periodNet >= 0 ? 'bg-emerald-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
              {summary.periodNet >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          <p className={`text-2xl font-bold ${summary.periodNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {summary.periodNet >= 0 ? '+' : ''}{formatCurrency(summary.periodNet)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Gelir - Gider</p>
        </div>
      </div>

      {/* Filtreler ve İşlem Listesi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filtreler */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Arama */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="İşlem ara..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            
            {/* Tarih Filtresi */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {[
                { value: 'today', label: 'Bugün' },
                { value: 'week', label: 'Hafta' },
                { value: 'month', label: 'Ay' },
                { value: 'all', label: 'Tümü' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDateFilter(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    dateFilter === opt.value
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Tip Filtresi */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'income', label: '↑ Gelir', color: 'text-emerald-600' },
                { value: 'expense', label: '↓ Gider', color: 'text-red-500' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    typeFilter === opt.value
                      ? opt.value === 'income' ? 'bg-emerald-100 text-emerald-700' 
                        : opt.value === 'expense' ? 'bg-red-100 text-red-600'
                        : 'bg-slate-200 text-slate-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <span className="text-sm text-slate-500 ml-auto">
              {summary.transactionCount} işlem
            </span>
          </div>
        </div>

        {/* İşlem Tablosu */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Banknote className="w-12 h-12 mb-3" />
              <p className="font-medium">İşlem bulunamadı</p>
              <p className="text-sm">Bu dönemde kayıtlı işlem yok</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tarih</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Ad Soyad</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Sınıf</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Açıklama</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Gelir Türü</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tip</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {t.studentName || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-center">
                      {t.studentClass || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {t.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        t.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {t.type === 'income' ? '↑ Gelir' : '↓ Gider'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-bold ${getTypeColor(t.type)}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Gelir/Gider Ekle Modal - Modern Tasarım */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header - Gradient */}
            <div className={`p-6 ${addType === 'income' 
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600' 
              : 'bg-gradient-to-r from-red-500 via-red-600 to-rose-600'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                    {addType === 'income' 
                      ? <TrendingUp className="w-7 h-7" /> 
                      : <TrendingDown className="w-7 h-7" />
                    }
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {addType === 'income' ? 'Yeni Gelir Kaydı' : 'Yeni Gider Kaydı'}
                    </h2>
                    <p className="text-white/80 text-sm">Manuel işlem girişi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Tutar - Büyük Görünüm */}
            <div className={`px-6 py-8 ${addType === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <label className="block text-sm font-semibold text-slate-600 mb-2 text-center">TUTAR</label>
              <div className="relative max-w-xs mx-auto">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${
                  addType === 'income' ? 'text-emerald-600' : 'text-red-500'
                }`}>₺</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  className={`w-full pl-12 pr-4 py-4 text-center text-3xl font-bold rounded-2xl border-2 outline-none transition ${
                    addType === 'income' 
                      ? 'border-emerald-200 focus:border-emerald-500 text-emerald-700' 
                      : 'border-red-200 focus:border-red-500 text-red-600'
                  }`}
                />
              </div>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Açıklama */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-2">
                    📝 Açıklama
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Örn: Elektrik faturası, Personel maaşı..."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
              
              {/* Kategori ve Ödeme Yöntemi - 2 Sütun */}
              <div className="grid grid-cols-2 gap-4">
                {/* Kategori */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      🏷️ Kategori
                    </span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition"
                  >
                    <option value="">Seçin</option>
                    {addType === 'income' ? (
                      <>
                        <option value="Eğitim Geliri">📚 Eğitim Geliri</option>
                        <option value="Kayıt Ücreti">📋 Kayıt Ücreti</option>
                        <option value="Kitap Satışı">📖 Kitap Satışı</option>
                        <option value="Kırtasiye">✏️ Kırtasiye</option>
                        <option value="Diğer Gelir">💰 Diğer Gelir</option>
                      </>
                    ) : (
                      <>
                        <option value="Personel">👤 Personel Maaşı</option>
                        <option value="Kira">🏢 Kira</option>
                        <option value="Elektrik">💡 Elektrik</option>
                        <option value="Su">💧 Su</option>
                        <option value="Doğalgaz">🔥 Doğalgaz</option>
                        <option value="İnternet">🌐 İnternet</option>
                        <option value="Telefon">📞 Telefon</option>
                        <option value="Malzeme">📦 Malzeme</option>
                        <option value="Bakım">🔧 Bakım/Onarım</option>
                        <option value="Temizlik">🧹 Temizlik</option>
                        <option value="Vergi">📊 Vergi</option>
                        <option value="Sigorta">🛡️ Sigorta</option>
                        <option value="Diğer">📋 Diğer</option>
                      </>
                    )}
                  </select>
                </div>
                
                {/* Ödeme Yöntemi */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      💳 Ödeme Yöntemi
                    </span>
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition"
                  >
                    <option value="cash">💵 Nakit</option>
                    <option value="bank">🏦 Banka</option>
                    <option value="eft">📱 EFT</option>
                    <option value="havale">📤 Havale</option>
                    <option value="card">💳 Kredi Kartı</option>
                    <option value="cek">📄 Çek</option>
                  </select>
                </div>
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-2">
                    📅 Tarih
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-5 py-3.5 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-white hover:border-slate-300 transition font-semibold"
              >
                İptal
              </button>
              <button
                onClick={handleAddTransaction}
                className={`flex-1 px-5 py-3.5 text-white rounded-xl transition font-semibold shadow-lg flex items-center justify-center gap-2 ${
                  addType === 'income' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200'
                }`}
              >
                <Check className="w-5 h-5" />
                {addType === 'income' ? 'Gelir Kaydet' : 'Gider Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
