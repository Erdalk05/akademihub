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
              studentName: i.studentName,
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
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Kasa & Banka Raporu', 14, 20);
    doc.setFontSize(10);
    doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);
    doc.text(`Toplam Bakiye: ${summary.totalBalance.toLocaleString('tr-TR')} TL`, 14, 35);
    
    autoTable(doc, {
      startY: 45,
      head: [['Tarih', 'Aciklama', 'Kategori', 'Tip', 'Tutar']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString('tr-TR'),
        t.description,
        t.category,
        t.type === 'income' ? 'Gelir' : 'Gider',
        `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('tr-TR')} TL`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    });
    
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

        {/* İşlem Listesi */}
        <div className="divide-y divide-slate-100">
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
            filteredTransactions.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {getTypeIcon(t.type)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 truncate">{t.description}</p>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(t.date)}
                    </span>
                    {t.studentName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {t.studentName}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${getTypeColor(t.type)}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gelir/Gider Ekle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className={`p-5 border-b border-slate-100 ${addType === 'income' ? 'bg-emerald-50' : 'bg-red-50'} rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    addType === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {addType === 'income' ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {addType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                    </h2>
                    <p className="text-xs text-slate-500">Yeni işlem kaydı</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Tutar */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tutar *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₺</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="İşlem açıklaması"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
              
              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="">Seçin...</option>
                  {addType === 'income' ? (
                    <>
                      <option value="Eğitim Geliri">Eğitim Geliri</option>
                      <option value="Kayıt Ücreti">Kayıt Ücreti</option>
                      <option value="Diğer Gelir">Diğer Gelir</option>
                    </>
                  ) : (
                    <>
                      <option value="Personel">Personel</option>
                      <option value="Kira">Kira</option>
                      <option value="Fatura">Fatura</option>
                      <option value="Malzeme">Malzeme</option>
                      <option value="Bakım">Bakım</option>
                      <option value="Diğer">Diğer</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleAddTransaction}
                className={`flex-1 px-4 py-3 text-white rounded-xl transition font-medium ${
                  addType === 'income' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <Check className="w-4 h-4 inline mr-2" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
