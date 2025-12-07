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
  Filter,
  Search,
  RefreshCw,
  PiggyBank,
  Banknote,
  CreditCard,
  Calendar,
  ChevronDown,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Hesap Türleri
type AccountType = 'cash' | 'bank';
type TransactionType = 'income' | 'expense' | 'transfer';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bankName?: string;
  iban?: string;
  isDefault: boolean;
  color: string;
}

interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  relatedAccountId?: string; // Transfer için
  studentName?: string;
  reference?: string;
}

// Varsayılan Hesaplar
const defaultAccounts: Account[] = [
  { id: 'cash-1', name: 'Ana Kasa', type: 'cash', balance: 0, currency: 'TRY', isDefault: true, color: '#10b981' },
  { id: 'bank-1', name: 'Ziraat Bankası', type: 'bank', balance: 0, currency: 'TRY', bankName: 'Ziraat', iban: 'TR00 0000 0000 0000 0000 0000 00', isDefault: false, color: '#3b82f6' },
];

// Kategori listesi
const incomeCategories = ['Taksit Ödemesi', 'Peşinat', 'Kayıt Ücreti', 'Diğer Gelir'];
const expenseCategories = ['Personel Maaşı', 'Kira', 'Fatura', 'Malzeme', 'Bakım', 'Diğer Gider'];

export default function CashBankPage() {
  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  
  // Modal States
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  // Form States
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as TransactionType,
    amount: '',
    description: '',
    category: '',
    accountId: '',
    date: new Date().toISOString().slice(0, 10),
  });
  
  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
  });

  // Verileri yükle
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Tahsilatları çek (gelir olarak)
      const installmentsRes = await fetch('/api/installments');
      const installmentsJson = await installmentsRes.json();
      
      // Giderleri çek
      const expensesRes = await fetch('/api/finance/expenses');
      const expensesJson = await expensesRes.json();
      
      const incomeTransactions: Transaction[] = [];
      const expenseTransactions: Transaction[] = [];
      
      // Ödenen taksitleri gelir olarak ekle
      if (installmentsJson.success && Array.isArray(installmentsJson.data)) {
        installmentsJson.data
          .filter((i: any) => i.is_paid && i.paid_at)
          .forEach((i: any) => {
            incomeTransactions.push({
              id: `inc-${i.id}`,
              accountId: 'cash-1', // Varsayılan kasa
              type: 'income',
              amount: i.paid_amount || i.amount || 0,
              description: `${i.installment_no || 1}. Taksit Ödemesi`,
              category: 'Taksit Ödemesi',
              date: i.paid_at,
              studentName: i.studentName || i.student_id?.substring(0, 8),
              reference: i.id,
            });
          });
      }
      
      // Giderleri ekle
      if (expensesJson.success && Array.isArray(expensesJson.data)) {
        expensesJson.data.forEach((e: any) => {
          expenseTransactions.push({
            id: `exp-${e.id}`,
            accountId: 'cash-1',
            type: 'expense',
            amount: e.amount || 0,
            description: e.description || e.title || 'Gider',
            category: e.category || 'Diğer Gider',
            date: e.date || e.created_at,
            reference: e.id,
          });
        });
      }
      
      // Tüm işlemleri birleştir
      const allTransactions = [...incomeTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
      
      // Hesap bakiyelerini güncelle
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      setAccounts(prev => prev.map(acc => ({
        ...acc,
        balance: acc.id === 'cash-1' ? totalIncome - totalExpense : acc.balance,
      })));
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş işlemler
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Hesap filtresi
    if (selectedAccount) {
      filtered = filtered.filter(t => t.accountId === selectedAccount);
    }
    
    // Tür filtresi
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // Tarih filtresi
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(t => new Date(t.date) >= startOfDay);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(startOfDay);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(t => new Date(t.date) >= monthStart);
    } else if (dateFilter === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(t => new Date(t.date) >= yearStart);
    }
    
    // Arama filtresi
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term) ||
        t.studentName?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [transactions, selectedAccount, typeFilter, dateFilter, searchTerm]);

  // Özet hesaplamalar
  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const cashBalance = accounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.balance, 0);
    const bankBalance = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);
    
    const periodIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const periodExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return { totalBalance, cashBalance, bankBalance, periodIncome, periodExpense };
  }, [accounts, filteredTransactions]);

  // Yeni işlem ekle
  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.accountId || !newTransaction.category) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    
    const amount = parseFloat(newTransaction.amount);
    
    // Eğer GİDER ise, Giderler modülüne de kaydet
    if (newTransaction.type === 'expense') {
      try {
        const res = await fetch('/api/finance/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTransaction.description || newTransaction.category,
            description: newTransaction.description,
            amount: amount,
            category: newTransaction.category,
            date: newTransaction.date,
            payment_method: 'cash',
            source: 'kasa-banka', // Nereden eklendiğini belirt
          }),
        });
        
        if (!res.ok) {
          toast.error('Gider kaydedilemedi');
          return;
        }
        
        const json = await res.json();
        if (json.success && json.data) {
          // API'den dönen ID'yi kullan
          const transaction: Transaction = {
            id: `exp-${json.data.id}`,
            accountId: newTransaction.accountId,
            type: 'expense',
            amount: amount,
            description: newTransaction.description || newTransaction.category,
            category: newTransaction.category,
            date: newTransaction.date,
          };
          
          setTransactions(prev => [transaction, ...prev]);
          
          // Hesap bakiyesini güncelle
          setAccounts(prev => prev.map(acc => {
            if (acc.id === newTransaction.accountId) {
              return { ...acc, balance: acc.balance - amount };
            }
            return acc;
          }));
          
          toast.success('Gider kaydedildi');
        }
      } catch (error) {
        console.error('Gider kaydetme hatası:', error);
        toast.error('Gider kaydedilemedi');
        return;
      }
    } else {
      // GELİR için sadece local state güncelle (tahsilatlar ayrı yönetiliyor)
      const transaction: Transaction = {
        id: `manual-${Date.now()}`,
        accountId: newTransaction.accountId,
        type: newTransaction.type,
        amount: amount,
        description: newTransaction.description,
        category: newTransaction.category,
        date: newTransaction.date,
      };
      
      setTransactions(prev => [transaction, ...prev]);
      
      // Hesap bakiyesini güncelle
      setAccounts(prev => prev.map(acc => {
        if (acc.id === newTransaction.accountId) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      }));
      
      toast.success('Gelir kaydedildi');
    }
    
    setShowAddTransaction(false);
    setNewTransaction({
      type: 'income',
      amount: '',
      description: '',
      category: '',
      accountId: '',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  // Hesaplar arası transfer
  const handleTransfer = () => {
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    
    if (transferData.fromAccountId === transferData.toAccountId) {
      toast.error('Aynı hesaba transfer yapılamaz');
      return;
    }
    
    const amount = parseFloat(transferData.amount);
    
    // Hesap bakiyelerini güncelle
    setAccounts(prev => prev.map(acc => {
      if (acc.id === transferData.fromAccountId) {
        return { ...acc, balance: acc.balance - amount };
      }
      if (acc.id === transferData.toAccountId) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    }));
    
    // Transfer işlemlerini ekle
    const fromAcc = accounts.find(a => a.id === transferData.fromAccountId);
    const toAcc = accounts.find(a => a.id === transferData.toAccountId);
    
    const transferOut: Transaction = {
      id: `transfer-out-${Date.now()}`,
      accountId: transferData.fromAccountId,
      type: 'transfer',
      amount: -amount,
      description: `${toAcc?.name}'a transfer`,
      category: 'Transfer',
      date: new Date().toISOString(),
      relatedAccountId: transferData.toAccountId,
    };
    
    const transferIn: Transaction = {
      id: `transfer-in-${Date.now()}`,
      accountId: transferData.toAccountId,
      type: 'transfer',
      amount: amount,
      description: `${fromAcc?.name}'dan transfer`,
      category: 'Transfer',
      date: new Date().toISOString(),
      relatedAccountId: transferData.fromAccountId,
    };
    
    setTransactions(prev => [transferIn, transferOut, ...prev]);
    
    setShowTransfer(false);
    setTransferData({ fromAccountId: '', toAccountId: '', amount: '', description: '' });
    
    toast.success('Transfer tamamlandı');
  };

  // PDF Rapor
  const generatePDF = () => {
    const dateLabel = dateFilter === 'today' ? 'Bugün' :
      dateFilter === 'week' ? 'Bu Hafta' :
      dateFilter === 'month' ? 'Bu Ay' :
      dateFilter === 'year' ? 'Bu Yıl' : 'Tüm Zamanlar';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kasa-Banka Raporu - ${dateLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; font-size: 11px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { font-size: 24px; color: #1e40af; margin-bottom: 5px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-card { padding: 15px; border-radius: 10px; text-align: center; }
          .summary-card.total { background: #dbeafe; border: 2px solid #3b82f6; }
          .summary-card.cash { background: #dcfce7; border: 2px solid #22c55e; }
          .summary-card.income { background: #dcfce7; border: 2px solid #22c55e; }
          .summary-card.expense { background: #fee2e2; border: 2px solid #ef4444; }
          .summary-card h3 { font-size: 10px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
          .summary-card .amount { font-size: 18px; font-weight: bold; }
          .accounts { margin-bottom: 25px; }
          .accounts h3 { font-size: 14px; margin-bottom: 10px; color: #1e40af; }
          .account-row { display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; margin-bottom: 5px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Kasa & Banka Raporu</h1>
          <p>${dateLabel} - ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>

        <div class="summary">
          <div class="summary-card total">
            <h3>Toplam Bakiye</h3>
            <div class="amount" style="color: #1e40af;">${summary.totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <div class="summary-card cash">
            <h3>Kasa</h3>
            <div class="amount" style="color: #16a34a;">${summary.cashBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <div class="summary-card income">
            <h3>Dönem Geliri</h3>
            <div class="amount" style="color: #16a34a;">+${summary.periodIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <div class="summary-card expense">
            <h3>Dönem Gideri</h3>
            <div class="amount" style="color: #dc2626;">-${summary.periodExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
        </div>

        <div class="accounts">
          <h3>Hesap Bakiyeleri</h3>
          ${accounts.map(acc => `
            <div class="account-row">
              <span>${acc.type === 'cash' ? '💵' : '🏦'} ${acc.name}</span>
              <span style="font-weight: bold; color: ${acc.balance >= 0 ? '#16a34a' : '#dc2626'}">
                ${acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
            </div>
          `).join('')}
        </div>

        <h3 style="font-size: 14px; margin-bottom: 10px; color: #1e40af;">İşlem Geçmişi (${filteredTransactions.length} kayıt)</h3>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Açıklama</th>
              <th>Kategori</th>
              <th>Hesap</th>
              <th class="text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.slice(0, 50).map(t => `
              <tr>
                <td>${new Date(t.date).toLocaleDateString('tr-TR')}</td>
                <td>${t.description}${t.studentName ? ` - ${t.studentName}` : ''}</td>
                <td>${t.category}</td>
                <td>${accounts.find(a => a.id === t.accountId)?.name || '-'}</td>
                <td class="text-right ${t.type === 'income' ? 'text-green' : t.type === 'expense' ? 'text-red' : ''}">
                  ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${Math.abs(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredTransactions.length > 50 ? `<p style="text-align: center; margin-top: 10px; color: #666;">... ve ${filteredTransactions.length - 50} kayıt daha</p>` : ''}

        <div class="footer">
          <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          <p>AkademiHub - Kasa & Banka Yönetim Sistemi</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-blue-600" />
              Kasa & Banka Yönetimi
            </h1>
            <p className="text-gray-500 text-sm mt-1">Tüm finansal hareketlerinizi tek yerden yönetin</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
            >
              <Plus size={16} />
              Gelir/Gider Ekle
            </button>
            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <ArrowLeftRight size={16} />
              Transfer
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-medium"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
              title="Yenile"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-xs font-medium uppercase">Toplam Bakiye</span>
            <PiggyBank className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-2xl font-bold">₺{summary.totalBalance.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-blue-200 mt-1">{accounts.length} hesap</p>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-medium uppercase">Kasa</span>
            <Banknote className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₺{summary.cashBalance.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-emerald-600 mt-1">Nakit para</p>
            </div>
        
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-medium uppercase">Dönem Geliri</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">+₺{summary.periodIncome.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredTransactions.filter(t => t.type === 'income').length} işlem</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-medium uppercase">Dönem Gideri</span>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">-₺{summary.periodExpense.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredTransactions.filter(t => t.type === 'expense').length} işlem</p>
        </div>
      </div>

      {/* Hesaplar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Hesap Kartları */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Hesaplar
          </h3>
          
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(selectedAccount === account.id ? null : account.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedAccount === account.id 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${account.color}20` }}
                  >
                    {account.type === 'cash' ? (
                      <Banknote className="w-5 h-5" style={{ color: account.color }} />
                    ) : (
                      <Building2 className="w-5 h-5" style={{ color: account.color }} />
                    )}
                  </div>
            <div>
                    <p className="font-semibold text-gray-900">{account.name}</p>
                    <p className="text-xs text-gray-500">
                      {account.type === 'cash' ? 'Nakit Kasa' : account.bankName || 'Banka'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₺{account.balance.toLocaleString('tr-TR')}
                  </p>
                  {account.isDefault && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Varsayılan</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          
          <button
            onClick={() => setShowAddAccount(true)}
            className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Yeni Hesap Ekle</span>
          </button>
        </div>

        {/* İşlem Listesi */}
        <div className="lg:col-span-2">
          {/* Filtreler */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Tarih Filtresi */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['today', 'week', 'month', 'year', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setDateFilter(period)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      dateFilter === period
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period === 'today' ? 'Bugün' :
                     period === 'week' ? 'Hafta' :
                     period === 'month' ? 'Ay' :
                     period === 'year' ? 'Yıl' : 'Tümü'}
                  </button>
                ))}
              </div>
              
              {/* Tür Filtresi */}
              <div className="flex items-center gap-1">
                {(['all', 'income', 'expense'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      typeFilter === type
                        ? type === 'income' ? 'bg-emerald-100 text-emerald-700' :
                          type === 'expense' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {type === 'all' ? 'Tümü' : type === 'income' ? '↑ Gelir' : '↓ Gider'}
                  </button>
                ))}
              </div>
              
              {/* Arama */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="İşlem ara..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* İşlem Tablosu */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                İşlem Geçmişi
                <span className="ml-2 text-sm font-normal text-gray-500">({filteredTransactions.length} kayıt)</span>
              </h3>
        </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Bu dönemde işlem bulunamadı</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTransactions.slice(0, 50).map((transaction) => {
                    const account = accounts.find(a => a.id === transaction.accountId);
                    
                    return (
                      <div key={transaction.id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              transaction.type === 'income' ? 'bg-emerald-100' :
                              transaction.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {transaction.type === 'income' ? (
                                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                              ) : transaction.type === 'expense' ? (
                                <ArrowDownRight className="w-5 h-5 text-red-600" />
                              ) : (
                                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{transaction.category}</span>
                                {transaction.studentName && (
                                  <>
                                    <span>•</span>
                                    <span>{transaction.studentName}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{account?.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              transaction.type === 'income' ? 'text-emerald-600' :
                              transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                              ₺{Math.abs(transaction.amount).toLocaleString('tr-TR')}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.date).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gelir/Gider Ekleme Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Yeni İşlem Ekle</h2>
                <button onClick={() => setShowAddTransaction(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Tür Seçimi */}
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income', category: '' }))}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${
                    newTransaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ↑ Gelir
                </button>
                <button
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense', category: '' }))}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${
                    newTransaction.type === 'expense'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ↓ Gider
                </button>
              </div>
              
              {/* Tutar */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Hesap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hesap</label>
                <select
                  value={newTransaction.accountId}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Hesap Seçin</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Kategori Seçin</option>
                  {(newTransaction.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="Açıklama girin..."
                />
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddTransaction(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                İptal
              </button>
              <button
                onClick={handleAddTransaction}
                className={`flex-1 py-3 text-white rounded-xl font-medium transition ${
                  newTransaction.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                  Hesaplar Arası Transfer
                </h2>
                <button onClick={() => setShowTransfer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Kaynak Hesap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak Hesap</label>
                <select
                  value={transferData.fromAccountId}
                  onChange={(e) => setTransferData(prev => ({ ...prev, fromAccountId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Hesap Seçin</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (₺{acc.balance.toLocaleString('tr-TR')})</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600" />
        </div>
      </div>

              {/* Hedef Hesap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Hesap</label>
                <select
                  value={transferData.toAccountId}
                  onChange={(e) => setTransferData(prev => ({ ...prev, toAccountId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Hesap Seçin</option>
                  {accounts.filter(a => a.id !== transferData.fromAccountId).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Tutar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Tutarı</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                  <input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowTransfer(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                İptal
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                Transfer Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

