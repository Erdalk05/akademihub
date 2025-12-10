'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Download,
  Calendar,
  Search,
  RefreshCw,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
  ChevronDown,
  FileSignature,
  BarChart3,
  PieChart,
  Settings,
  GraduationCap,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';
type ReportTab = 'transactions' | 'class-report' | 'monthly-comparison' | 'guardian-report';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  studentName?: string;
  studentClass?: string;
  studentSection?: string;
}

interface ClassReport {
  className: string;
  studentCount: number;
  totalIncome: number;
  paidCount: number;
  unpaidCount: number;
  unpaidAmount: number;
  collectionRate: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
}

interface ChartSettings {
  showIncome: boolean;
  showExpense: boolean;
  showNet: boolean;
  chartType: 'bar' | 'line' | 'area';
  colorScheme: 'default' | 'colorful' | 'monochrome';
}

interface GuardianReport {
  guardianName: string;
  guardianPhone: string;
  studentCount: number;
  students: string[];
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  collectionRate: number;
  lastPaymentDate?: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [activeTab, setActiveTab] = useState<ReportTab>('transactions');
  
  // Sınıf raporu için
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [allInstallments, setAllInstallments] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  
  // Aylık karşılaştırma için
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [compareMonths, setCompareMonths] = useState<number>(6);
  
  // Veli bazlı rapor için
  const [guardianReports, setGuardianReports] = useState<GuardianReport[]>([]);
  const [guardianSearch, setGuardianSearch] = useState('');
  
  // Grafik özelleştirme
  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    showIncome: true,
    showExpense: true,
    showNet: true,
    chartType: 'bar',
    colorScheme: 'default',
  });
  const [showChartSettings, setShowChartSettings] = useState(false);
  
  // Custom date range
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Verileri yükle
  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Taksitler (gelir)
      const installmentsRes = await fetch('/api/installments');
      const installmentsJson = await installmentsRes.json();
      
      // Giderler
      const expensesRes = await fetch('/api/finance/expenses');
      const expensesJson = await expensesRes.json();
      
      // Öğrenciler (sınıf bilgisi için)
      const studentsRes = await fetch('/api/students');
      const studentsJson = await studentsRes.json();
      
      const students = studentsJson.success ? studentsJson.data || [] : [];
      setAllStudents(students);
      
      // Öğrenci map'i oluştur (id -> student)
      const studentMap = new Map<string, any>();
      students.forEach((s: any) => {
        studentMap.set(s.id, s);
      });
      
      const installments = installmentsJson.success ? installmentsJson.data || [] : [];
      setAllInstallments(installments);
      
      const allTransactions: Transaction[] = [];
      
      // Ödenen taksitler = Gelir
      if (Array.isArray(installments)) {
        installments
          .filter((i: any) => i.is_paid && i.paid_at)
          .forEach((i: any) => {
            const student = studentMap.get(i.student_id);
            allTransactions.push({
              id: `inc-${i.id}`,
              type: 'income',
              amount: i.paid_amount || i.amount || 0,
              description: `${i.installment_no || 1}. Taksit Ödemesi`,
              category: 'Taksit',
              date: i.paid_at,
              studentName: i.studentName || (student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : ''),
              studentClass: student?.class,
              studentSection: student?.section,
            });
          });
      }
      
      // Giderler
      if (expensesJson.success && Array.isArray(expensesJson.data)) {
        expensesJson.data.forEach((e: any) => {
          allTransactions.push({
            id: `exp-${e.id}`,
            type: 'expense',
            amount: e.amount || 0,
            description: e.description || e.title || 'Gider',
            category: e.category || 'Diğer',
            date: e.date || e.created_at,
          });
        });
      }
      
      // Tarihe göre sırala
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
      
      // Sınıf bazlı rapor hesapla
      calculateClassReports(installments, students);
      
      // Aylık karşılaştırma hesapla
      calculateMonthlyComparison(allTransactions, expensesJson.data || []);
      
      // Veli bazlı rapor hesapla
      calculateGuardianReports(installments, students);
      
    } catch (err) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };
  
  // Sınıf bazlı rapor hesaplama
  const calculateClassReports = (installments: any[], students: any[]) => {
    const classMap = new Map<string, ClassReport>();
    
    // Öğrenci sınıf map'i
    const studentClassMap = new Map<string, { className: string; section: string }>();
    students.forEach((s: any) => {
      if (s.class) {
        studentClassMap.set(s.id, {
          className: s.class,
          section: s.section || '',
        });
      }
    });
    
    // Sınıflara göre öğrenci sayısı
    const classStudentCount = new Map<string, Set<string>>();
    students.forEach((s: any) => {
      if (s.class) {
        const key = s.section ? `${s.class}-${s.section}` : s.class;
        if (!classStudentCount.has(key)) {
          classStudentCount.set(key, new Set());
        }
        classStudentCount.get(key)!.add(s.id);
      }
    });
    
    // Taksitleri sınıflara göre grupla
    installments.forEach((inst: any) => {
      const studentInfo = studentClassMap.get(inst.student_id);
      if (!studentInfo) return;
      
      const className = studentInfo.section 
        ? `${studentInfo.className}-${studentInfo.section}` 
        : studentInfo.className;
      
      if (!classMap.has(className)) {
        classMap.set(className, {
          className,
          studentCount: classStudentCount.get(className)?.size || 0,
          totalIncome: 0,
          paidCount: 0,
          unpaidCount: 0,
          unpaidAmount: 0,
          collectionRate: 0,
        });
      }
      
      const report = classMap.get(className)!;
      if (inst.is_paid) {
        report.totalIncome += (inst.paid_amount || inst.amount || 0);
        report.paidCount += 1;
      } else {
        report.unpaidCount += 1;
        report.unpaidAmount += (inst.amount || 0);
      }
    });
    
    // Tahsilat oranı hesapla
    classMap.forEach((report) => {
      const total = report.paidCount + report.unpaidCount;
      report.collectionRate = total > 0 ? Math.round((report.paidCount / total) * 100) : 0;
    });
    
    // Sırala ve state'e kaydet
    const sorted = Array.from(classMap.values()).sort((a, b) => b.totalIncome - a.totalIncome);
    setClassReports(sorted);
  };
  
  // Aylık karşılaştırma hesaplama
  const calculateMonthlyComparison = (transactions: Transaction[], expenses: any[]) => {
    const now = new Date();
    const months: MonthlyData[] = [];
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    // Son 12 ay için veri oluştur
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      months.push({
        month: monthKey,
        monthLabel: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        income: 0,
        expense: 0,
        net: 0,
        incomeCount: 0,
        expenseCount: 0,
      });
    }
    
    // Gelirler
    transactions.filter(t => t.type === 'income').forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find(m => m.month === key);
      if (month) {
        month.income += t.amount;
        month.incomeCount += 1;
      }
    });
    
    // Giderler
    expenses.forEach((e: any) => {
      if (!e.date && !e.created_at) return;
      const d = new Date(e.date || e.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find(m => m.month === key);
      if (month) {
        month.expense += (e.amount || 0);
        month.expenseCount += 1;
      }
    });
    
    // Net hesapla
    months.forEach(m => {
      m.net = m.income - m.expense;
    });
    
    setMonthlyData(months);
  };
  
  // Veli bazlı rapor hesaplama
  const calculateGuardianReports = (installments: any[], students: any[]) => {
    const guardianMap = new Map<string, GuardianReport>();
    
    // Öğrenci -> Veli eşleştirmesi
    students.forEach((student: any) => {
      const guardianName = student.parent_name || 'Bilinmeyen Veli';
      const guardianPhone = student.parent_phone || '';
      const key = guardianPhone || guardianName;
      
      if (!guardianMap.has(key)) {
        guardianMap.set(key, {
          guardianName,
          guardianPhone,
          studentCount: 0,
          students: [],
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          collectionRate: 0,
        });
      }
      
      const report = guardianMap.get(key)!;
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      if (studentName && !report.students.includes(studentName)) {
        report.students.push(studentName);
        report.studentCount += 1;
      }
    });
    
    // Öğrenci ID -> Veli key eşleştirmesi
    const studentToGuardian = new Map<string, string>();
    students.forEach((student: any) => {
      const guardianPhone = student.parent_phone || '';
      const guardianName = student.parent_name || 'Bilinmeyen Veli';
      const key = guardianPhone || guardianName;
      studentToGuardian.set(student.id, key);
    });
    
    // Taksitleri velilere göre grupla
    installments.forEach((inst: any) => {
      const guardianKey = studentToGuardian.get(inst.student_id);
      if (!guardianKey || !guardianMap.has(guardianKey)) return;
      
      const report = guardianMap.get(guardianKey)!;
      const amount = inst.amount || 0;
      const paidAmount = inst.paid_amount || 0;
      
      report.totalAmount += amount;
      if (inst.is_paid) {
        report.paidAmount += paidAmount || amount;
        if (inst.paid_at) {
          if (!report.lastPaymentDate || new Date(inst.paid_at) > new Date(report.lastPaymentDate)) {
            report.lastPaymentDate = inst.paid_at;
          }
        }
      } else {
        report.unpaidAmount += amount;
      }
    });
    
    // Tahsilat oranı hesapla
    guardianMap.forEach((report) => {
      if (report.totalAmount > 0) {
        report.collectionRate = Math.round((report.paidAmount / report.totalAmount) * 100);
      }
    });
    
    // Sırala (toplam tutara göre)
    const sorted = Array.from(guardianMap.values())
      .filter(r => r.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    setGuardianReports(sorted);
  };

  // Tarih filtreleme
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      case 'custom':
        return { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') };
      default:
        return { start: new Date(0), end: now };
    }
  };

  // Filtrelenmiş işlemler
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    
    return transactions.filter(t => {
      const date = new Date(t.date);
      if (date < start || date > end) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!t.description.toLowerCase().includes(term) && 
            !t.category.toLowerCase().includes(term) &&
            !(t.studentName?.toLowerCase().includes(term))) return false;
      }
      return true;
    });
  }, [transactions, period, startDate, endDate, typeFilter, search]);

  // Özet hesaplamaları
  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const incomeCount = filteredTransactions.filter(t => t.type === 'income').length;
    const expenseCount = filteredTransactions.filter(t => t.type === 'expense').length;
    
    return { income, expense, net, incomeCount, expenseCount, total: incomeCount + expenseCount };
  }, [filteredTransactions]);

  // PDF Oluştur
  const generatePDF = () => {
    const periodLabel = period === 'today' ? 'Bugün' :
      period === 'week' ? 'Son 7 Gün' :
      period === 'month' ? 'Bu Ay' :
      period === 'year' ? 'Bu Yıl' : `${startDate} - ${endDate}`;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Finansal Rapor - ${periodLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #333; font-size: 11px; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; }
          .header h1 { font-size: 22px; color: #1e40af; margin-bottom: 5px; }
          .header p { color: #64748b; font-size: 12px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .summary-card { padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card.income { background: #dcfce7; border: 1px solid #22c55e; }
          .summary-card.expense { background: #fee2e2; border: 1px solid #ef4444; }
          .summary-card.net { background: #dbeafe; border: 1px solid #3b82f6; }
          .summary-card.count { background: #f3f4f6; border: 1px solid #9ca3af; }
          .summary-card h3 { font-size: 9px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-card .amount { font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; font-size: 10px; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
          .text-right { text-align: right; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .footer { margin-top: 25px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Finansal Rapor</h1>
          <p>Dönem: ${periodLabel} | Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>

        <div class="summary">
          <div class="summary-card income">
            <h3>Toplam Gelir</h3>
            <div class="amount" style="color: #16a34a;">+${summary.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
            <p style="font-size: 9px; color: #666; margin-top: 4px;">${summary.incomeCount} islem</p>
          </div>
          <div class="summary-card expense">
            <h3>Toplam Gider</h3>
            <div class="amount" style="color: #dc2626;">-${summary.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
            <p style="font-size: 9px; color: #666; margin-top: 4px;">${summary.expenseCount} islem</p>
          </div>
          <div class="summary-card net">
            <h3>Net Durum</h3>
            <div class="amount" style="color: ${summary.net >= 0 ? '#16a34a' : '#dc2626'};">${summary.net >= 0 ? '+' : ''}${summary.net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
          </div>
          <div class="summary-card count">
            <h3>Toplam Islem</h3>
            <div class="amount" style="color: #374151;">${summary.total}</div>
          </div>
        </div>

        <h3 style="font-size: 13px; margin-bottom: 10px; color: #1e40af;">Islem Detaylari</h3>
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Aciklama</th>
              <th>Kategori</th>
              <th class="text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.slice(0, 100).map(t => `
              <tr>
                <td>${new Date(t.date).toLocaleDateString('tr-TR')}</td>
                <td>${t.description}${t.studentName ? ` - ${t.studentName}` : ''}</td>
                <td>${t.category}</td>
                <td class="text-right ${t.type === 'income' ? 'text-green' : 'text-red'}">
                  ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredTransactions.length > 100 ? `<p style="text-align: center; margin-top: 10px; color: #666; font-size: 10px;">... ve ${filteredTransactions.length - 100} islem daha</p>` : ''}

        <div class="footer">
          <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde olusturulmustur.</p>
          <p>AkademiHub - Finans Raporlama Sistemi</p>
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Finansal Raporlar</h1>
            <p className="text-slate-500 text-sm">Gelir, gider ve tahsilat raporları</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sözleşmeler Butonu */}
            <Link
              href="/finance/reports/contracts"
              className="px-4 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition flex items-center gap-2 font-medium"
            >
              <FileSignature size={16} />
              Sözleşmeler
            </Link>
            
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
              title="Yenile"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              <Download size={16} />
              PDF İndir
            </button>
          </div>
        </div>

        {/* Rapor Sekmeleri */}
        <div className="bg-white rounded-xl border border-slate-100 mb-6">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'transactions'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <FileText size={18} />
              İşlem Geçmişi
            </button>
            <button
              onClick={() => setActiveTab('class-report')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'class-report'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <GraduationCap size={18} />
              Sınıf Bazlı Rapor
            </button>
            <button
              onClick={() => setActiveTab('monthly-comparison')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'monthly-comparison'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <BarChart3 size={18} />
              Aylık Karşılaştırma
            </button>
            <button
              onClick={() => setActiveTab('guardian-report')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 ${
                activeTab === 'guardian-report'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Users size={18} />
              Veli Bazlı Rapor
            </button>
          </div>
        </div>

        {/* Dönem Seçici - Sadece İşlem Geçmişi sekmesinde */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Dönem:</span>
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                {[
                  { value: 'today', label: 'Bugün' },
                  { value: 'week', label: 'Son 7 Gün' },
                  { value: 'month', label: 'Bu Ay' },
                  { value: 'year', label: 'Bu Yıl' },
                  { value: 'custom', label: 'Özel' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value as Period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      period === opt.value
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              {period === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Özet Kartları - Sadece İşlem Geçmişi sekmesinde */}
        {activeTab === 'transactions' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">Toplam Gelir</span>
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">₺{(summary.income / 1000).toFixed(0)}K</p>
            <p className="text-xs text-slate-400 mt-1">{summary.incomeCount} işlem</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">Toplam Gider</span>
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight size={18} className="text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">₺{(summary.expense / 1000).toFixed(0)}K</p>
            <p className="text-xs text-slate-400 mt-1">{summary.expenseCount} işlem</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">Net Durum</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${summary.net >= 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                <Wallet size={18} className={summary.net >= 0 ? 'text-blue-600' : 'text-amber-600'} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {summary.net >= 0 ? '+' : ''}₺{(summary.net / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-slate-400 mt-1">Gelir - Gider</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">Toplam İşlem</span>
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-slate-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            <p className="text-xs text-slate-400 mt-1">Seçili dönemde</p>
          </div>
        </div>
        )}

        {/* Filtreler ve Arama - Sadece İşlem Geçmişi sekmesinde */}
        {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İşlem ara..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'income', label: '↑ Gelir' },
                { value: 'expense', label: '↓ Gider' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    typeFilter === opt.value
                      ? opt.value === 'income' ? 'bg-emerald-100 text-emerald-700' :
                        opt.value === 'expense' ? 'bg-red-100 text-red-700' :
                        'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <span className="text-sm text-slate-500 ml-auto">
              {filteredTransactions.length} kayıt
            </span>
          </div>
        </div>
        )}

        {/* İşlem Listesi - Sadece İşlem Geçmişi sekmesinde */}
        {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={48} className="mb-3" />
              <p>İşlem bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Tarih</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Açıklama</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Kategori</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.slice(0, 50).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(t.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {t.type === 'income' ? (
                              <ArrowUpRight size={14} className="text-emerald-600" />
                            ) : (
                              <ArrowDownRight size={14} className="text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{t.description}</p>
                            {t.studentName && (
                              <p className="text-xs text-slate-500">{t.studentName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredTransactions.length > 50 && (
                <div className="text-center py-4 text-sm text-slate-500 border-t border-slate-100">
                  ... ve {filteredTransactions.length - 50} kayıt daha (PDF'de tamamı görüntülenir)
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* ==================== SINIF BAZLI RAPOR ==================== */}
        {activeTab === 'class-report' && (
          <div className="space-y-6">
            {/* Sınıf Özet Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase">Toplam Sınıf</span>
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Layers size={18} className="text-indigo-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-indigo-600">{classReports.length}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase">Toplam Öğrenci</span>
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users size={18} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {classReports.reduce((sum, c) => sum + c.studentCount, 0)}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase">Toplam Gelir</span>
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ArrowUpRight size={18} className="text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  ₺{(classReports.reduce((sum, c) => sum + c.totalIncome, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase">Bekleyen Alacak</span>
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingDown size={18} className="text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  ₺{(classReports.reduce((sum, c) => sum + c.unpaidAmount, 0) / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            {/* Sınıf Tablosu */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <GraduationCap size={20} className="text-indigo-600" />
                  Sınıf Bazlı Gelir Dağılımı
                </h3>
                <button
                  onClick={() => {
                    // Sınıf raporunu PDF olarak indir
                    const printContent = `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="UTF-8">
                        <title>Sınıf Bazlı Rapor</title>
                        <style>
                          body { font-family: 'Segoe UI', sans-serif; padding: 30px; }
                          h1 { text-align: center; color: #1e40af; margin-bottom: 20px; }
                          table { width: 100%; border-collapse: collapse; }
                          th { background: #f1f5f9; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
                          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                          .text-right { text-align: right; }
                          .text-green { color: #16a34a; }
                          .text-amber { color: #d97706; }
                          .progress { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
                          .progress-bar { height: 100%; background: #22c55e; }
                        </style>
                      </head>
                      <body>
                        <h1>📚 Sınıf Bazlı Gelir Raporu</h1>
                        <p style="text-align: center; color: #64748b; margin-bottom: 30px;">Oluşturma: ${new Date().toLocaleDateString('tr-TR')}</p>
                        <table>
                          <thead>
                            <tr>
                              <th>Sınıf</th>
                              <th class="text-right">Öğrenci</th>
                              <th class="text-right">Toplam Gelir</th>
                              <th class="text-right">Bekleyen</th>
                              <th class="text-right">Tahsilat %</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${classReports.map(c => `
                              <tr>
                                <td><strong>${c.className}</strong></td>
                                <td class="text-right">${c.studentCount}</td>
                                <td class="text-right text-green">₺${c.totalIncome.toLocaleString('tr-TR')}</td>
                                <td class="text-right text-amber">₺${c.unpaidAmount.toLocaleString('tr-TR')}</td>
                                <td class="text-right">%${c.collectionRate}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </body>
                      </html>
                    `;
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.write(printContent);
                      w.document.close();
                      setTimeout(() => w.print(), 500);
                    }
                    toast.success('PDF hazırlandı');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                >
                  <Download size={14} />
                  PDF
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={24} className="animate-spin text-indigo-600" />
                </div>
              ) : classReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <GraduationCap size={48} className="mb-3" />
                  <p>Sınıf verisi bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Sınıf</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Öğrenci</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Toplam Gelir</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Ödenen / Bekleyen</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Bekleyen Tutar</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 w-40">Tahsilat Oranı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classReports.map((c) => (
                        <tr key={c.className} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {c.className.substring(0, 2)}
                              </div>
                              <span className="font-semibold text-slate-900">{c.className}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                              <Users size={12} />
                              {c.studentCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            ₺{c.totalIncome.toLocaleString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-emerald-600 font-medium">{c.paidCount}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-amber-600 font-medium">{c.unpaidCount}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-600">
                            ₺{c.unpaidAmount.toLocaleString('tr-TR')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    c.collectionRate >= 80 ? 'bg-emerald-500' :
                                    c.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${c.collectionRate}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold min-w-[40px] text-right ${
                                c.collectionRate >= 80 ? 'text-emerald-600' :
                                c.collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                %{c.collectionRate}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sınıf Bazlı Pasta Grafik */}
            {classReports.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart size={20} className="text-indigo-600" />
                  Gelir Dağılımı (Sınıflara Göre)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {classReports.slice(0, 12).map((c, idx) => {
                    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-lime-500', 'bg-fuchsia-500'];
                    const totalIncome = classReports.reduce((sum, r) => sum + r.totalIncome, 0);
                    const percentage = totalIncome > 0 ? Math.round((c.totalIncome / totalIncome) * 100) : 0;
                    
                    return (
                      <div key={c.className} className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full ${colors[idx % colors.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                          %{percentage}
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">{c.className}</p>
                        <p className="text-xs text-slate-500">₺{(c.totalIncome / 1000).toFixed(0)}K</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== AYLIK KARŞILAŞTIRMA ==================== */}
        {activeTab === 'monthly-comparison' && (
          <div className="space-y-6">
            {/* Grafik Ayarları */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">Görüntüle:</span>
                  <select
                    value={compareMonths}
                    onChange={(e) => setCompareMonths(Number(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={3}>Son 3 Ay</option>
                    <option value={6}>Son 6 Ay</option>
                    <option value={12}>Son 12 Ay</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChartSettings(!showChartSettings)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      showChartSettings ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Settings size={16} />
                    Grafik Ayarları
                  </button>
                  
                  <button
                    onClick={() => {
                      // Aylık raporu PDF olarak indir
                      const visibleMonths = monthlyData.slice(-compareMonths);
                      const printContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <title>Aylık Karşılaştırma Raporu</title>
                          <style>
                            body { font-family: 'Segoe UI', sans-serif; padding: 30px; }
                            h1 { text-align: center; color: #1e40af; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { background: #f1f5f9; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
                            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                            .text-right { text-align: right; }
                            .text-green { color: #16a34a; }
                            .text-red { color: #dc2626; }
                            .text-blue { color: #2563eb; }
                          </style>
                        </head>
                        <body>
                          <h1>📊 Aylık Karşılaştırma Raporu</h1>
                          <p style="text-align: center; color: #64748b;">Son ${compareMonths} Ay | Oluşturma: ${new Date().toLocaleDateString('tr-TR')}</p>
                          <table>
                            <thead>
                              <tr>
                                <th>Ay</th>
                                <th class="text-right">Gelir</th>
                                <th class="text-right">Gider</th>
                                <th class="text-right">Net</th>
                                <th class="text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${visibleMonths.map(m => `
                                <tr>
                                  <td><strong>${m.monthLabel}</strong></td>
                                  <td class="text-right text-green">+₺${m.income.toLocaleString('tr-TR')}</td>
                                  <td class="text-right text-red">-₺${m.expense.toLocaleString('tr-TR')}</td>
                                  <td class="text-right text-blue">${m.net >= 0 ? '+' : ''}₺${m.net.toLocaleString('tr-TR')}</td>
                                  <td class="text-right">${m.incomeCount + m.expenseCount}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </body>
                        </html>
                      `;
                      const w = window.open('', '_blank');
                      if (w) {
                        w.document.write(printContent);
                        w.document.close();
                        setTimeout(() => w.print(), 500);
                      }
                      toast.success('PDF hazırlandı');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    <Download size={16} />
                    PDF İndir
                  </button>
                </div>
              </div>
              
              {/* Grafik Özelleştirme Paneli */}
              {showChartSettings && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Göster/Gizle</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setChartSettings(s => ({ ...s, showIncome: !s.showIncome }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          chartSettings.showIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        ✓ Gelir
                      </button>
                      <button
                        onClick={() => setChartSettings(s => ({ ...s, showExpense: !s.showExpense }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          chartSettings.showExpense ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        ✓ Gider
                      </button>
                      <button
                        onClick={() => setChartSettings(s => ({ ...s, showNet: !s.showNet }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          chartSettings.showNet ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        ✓ Net
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Grafik Tipi</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'bar', label: 'Çubuk' },
                        { value: 'line', label: 'Çizgi' },
                        { value: 'area', label: 'Alan' },
                      ].map(t => (
                        <button
                          key={t.value}
                          onClick={() => setChartSettings(s => ({ ...s, chartType: t.value as any }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            chartSettings.chartType === t.value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Renk Şeması</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'default', label: 'Varsayılan' },
                        { value: 'colorful', label: 'Renkli' },
                        { value: 'monochrome', label: 'Tek Ton' },
                      ].map(c => (
                        <button
                          key={c.value}
                          onClick={() => setChartSettings(s => ({ ...s, colorScheme: c.value as any }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            chartSettings.colorScheme === c.value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aylık Grafik */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" />
                Aylık Gelir/Gider Karşılaştırması
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={24} className="animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* CSS Grafik */}
                  <div className="h-64 flex items-end gap-2 px-4">
                    {monthlyData.slice(-compareMonths).map((m, idx) => {
                      const maxValue = Math.max(
                        ...monthlyData.slice(-compareMonths).map(d => Math.max(d.income, d.expense, Math.abs(d.net)))
                      );
                      const incomeHeight = maxValue > 0 ? (m.income / maxValue) * 100 : 0;
                      const expenseHeight = maxValue > 0 ? (m.expense / maxValue) * 100 : 0;
                      const netHeight = maxValue > 0 ? (Math.abs(m.net) / maxValue) * 100 : 0;
                      
                      // Renk şemaları
                      const colors = {
                        default: { income: 'bg-emerald-500', expense: 'bg-red-500', net: 'bg-blue-500' },
                        colorful: { income: 'bg-gradient-to-t from-emerald-600 to-emerald-400', expense: 'bg-gradient-to-t from-rose-600 to-rose-400', net: 'bg-gradient-to-t from-violet-600 to-violet-400' },
                        monochrome: { income: 'bg-slate-700', expense: 'bg-slate-500', net: 'bg-slate-300' },
                      };
                      const colorSet = colors[chartSettings.colorScheme];
                      
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center gap-1 h-48">
                            {chartSettings.showIncome && (
                              <div 
                                className={`w-4 ${colorSet.income} rounded-t transition-all duration-500`}
                                style={{ height: `${incomeHeight}%`, minHeight: m.income > 0 ? '4px' : '0' }}
                                title={`Gelir: ₺${m.income.toLocaleString('tr-TR')}`}
                              />
                            )}
                            {chartSettings.showExpense && (
                              <div 
                                className={`w-4 ${colorSet.expense} rounded-t transition-all duration-500`}
                                style={{ height: `${expenseHeight}%`, minHeight: m.expense > 0 ? '4px' : '0' }}
                                title={`Gider: ₺${m.expense.toLocaleString('tr-TR')}`}
                              />
                            )}
                            {chartSettings.showNet && (
                              <div 
                                className={`w-4 ${m.net >= 0 ? colorSet.net : 'bg-amber-500'} rounded-t transition-all duration-500`}
                                style={{ height: `${netHeight}%`, minHeight: Math.abs(m.net) > 0 ? '4px' : '0' }}
                                title={`Net: ₺${m.net.toLocaleString('tr-TR')}`}
                              />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">{m.monthLabel.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100">
                    {chartSettings.showIncome && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                        <span className="text-xs text-slate-600">Gelir</span>
                      </div>
                    )}
                    {chartSettings.showExpense && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span className="text-xs text-slate-600">Gider</span>
                      </div>
                    )}
                    {chartSettings.showNet && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded" />
                        <span className="text-xs text-slate-600">Net</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Aylık Tablo */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  Aylık Detay Tablosu
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Ay</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Gelir</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Gider</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Net</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">İşlem</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Değişim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData.slice(-compareMonths).reverse().map((m, idx, arr) => {
                      const prevMonth = arr[idx + 1];
                      const change = prevMonth ? ((m.income - prevMonth.income) / (prevMonth.income || 1)) * 100 : 0;
                      
                      return (
                        <tr key={m.month} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-semibold text-slate-900">{m.monthLabel}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            +₺{m.income.toLocaleString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">
                            -₺{m.expense.toLocaleString('tr-TR')}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${m.net >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                            {m.net >= 0 ? '+' : ''}₺{m.net.toLocaleString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                              {m.incomeCount + m.expenseCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {prevMonth && (
                              <div className={`flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span className="text-xs font-medium">
                                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {!prevMonth && (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VELİ BAZLI RAPOR ==================== */}
        {activeTab === 'guardian-report' && (
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-100 text-xs font-medium">Toplam Veli</span>
                  <Users className="w-5 h-5 text-purple-200" />
                </div>
                <p className="text-2xl font-bold">{guardianReports.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs font-medium">Toplam Öğrenci</span>
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{guardianReports.reduce((s, r) => s + r.studentCount, 0)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs font-medium">Toplam Tahsilat</span>
                  <Wallet className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">₺{guardianReports.reduce((s, r) => s + r.paidAmount, 0).toLocaleString('tr-TR')}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs font-medium">Bekleyen Tutar</span>
                  <CreditCard className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-600">₺{guardianReports.reduce((s, r) => s + r.unpaidAmount, 0).toLocaleString('tr-TR')}</p>
              </div>
            </div>

            {/* Arama */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={guardianSearch}
                  onChange={(e) => setGuardianSearch(e.target.value)}
                  placeholder="Veli ara..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Veli Tablosu */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-purple-600" />
                  Veli Bazlı Ödeme Durumu
                </h3>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : guardianReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Users size={48} className="mb-3" />
                  <p>Veli verisi bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Veli</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Öğrenci</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Sözleşme</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Tahsilat</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Kalan</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Oran</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Son Ödeme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {guardianReports
                        .filter(r => 
                          !guardianSearch || 
                          r.guardianName.toLowerCase().includes(guardianSearch.toLowerCase()) ||
                          r.students.some(s => s.toLowerCase().includes(guardianSearch.toLowerCase()))
                        )
                        .map((report, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900">{report.guardianName}</p>
                                {report.guardianPhone && (
                                  <p className="text-xs text-slate-500">{report.guardianPhone}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-slate-900">{report.studentCount}</span>
                                <span className="text-xs text-slate-500 truncate max-w-[150px]">
                                  {report.students.slice(0, 2).join(', ')}
                                  {report.students.length > 2 && ` +${report.students.length - 2}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              ₺{report.totalAmount.toLocaleString('tr-TR')}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              ₺{report.paidAmount.toLocaleString('tr-TR')}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-600">
                              ₺{report.unpaidAmount.toLocaleString('tr-TR')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      report.collectionRate >= 80 ? 'bg-emerald-500' :
                                      report.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${report.collectionRate}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${
                                  report.collectionRate >= 80 ? 'text-emerald-600' :
                                  report.collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  %{report.collectionRate}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {report.lastPaymentDate ? (
                                <span className="text-xs text-slate-600">
                                  {new Date(report.lastPaymentDate).toLocaleDateString('tr-TR')}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
