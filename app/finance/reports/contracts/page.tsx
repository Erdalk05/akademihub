'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Download, 
  Printer, 
  Eye, 
  X, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

type Student = {
  id: string;
  student_no: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  class: string | null;
  section: string | null;
  tc_id: string | null;
  created_at: string;
};

type Installment = {
  id: string;
  student_id: string;
  installment_no: number;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  paid_amount: number | null;
};


export default function ContractsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Students fetch
        const studentsRes = await fetch('/api/students');
        const studentsData = await studentsRes.json();
        console.log('Students API response:', studentsData);
        
        if (studentsData.success && studentsData.data) {
          setStudents(studentsData.data);
          console.log('Students set:', studentsData.data.length);
        } else {
          console.error('Students API failed:', studentsData);
        }

        // Installments fetch
        const installmentsRes = await fetch('/api/installments');
        const installmentsData = await installmentsRes.json();
        console.log('Installments API response:', installmentsData);
        
        if (installmentsData.success && installmentsData.data) {
          setInstallments(installmentsData.data);
        }

      } catch (err: any) {
        console.error('Fetch error:', err);
        toast.error('Veriler yüklenemedi: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate student payment status
  const getStudentPaymentInfo = (studentId: string) => {
    const studentInstallments = installments.filter(i => i.student_id === studentId);
    const total = studentInstallments.reduce((sum, i) => sum + i.amount, 0);
    const paid = studentInstallments.filter(i => i.is_paid).reduce((sum, i) => sum + (i.paid_amount || i.amount), 0);
    const pending = studentInstallments.filter(i => !i.is_paid);
    const overdue = pending.filter(i => new Date(i.due_date) < new Date());
    
    return {
      total,
      paid,
      remaining: total - paid,
      paidCount: studentInstallments.filter(i => i.is_paid).length,
      totalCount: studentInstallments.length,
      overdueCount: overdue.length,
      installments: studentInstallments.sort((a, b) => a.installment_no - b.installment_no)
    };
  };

  // Get student name
  const getStudentName = (s: Student) => {
    const firstLast = `${s.first_name || ''} ${s.last_name || ''}`.trim();
    const fromParent = s.parent_name ? s.parent_name.split(' - ')[0].trim() : '';
    return s.full_name || firstLast || fromParent || 'İsimsiz';
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = getStudentName(s).toLowerCase();
      const studentNo = (s.student_no || '').toLowerCase();
      const searchMatch = name.includes(search.toLowerCase()) || studentNo.includes(search.toLowerCase());
      
      if (!searchMatch) return false;
      
      // "Tümü" seçildiğinde tüm öğrencileri göster
      if (statusFilter === 'all') return true;
      
      const info = getStudentPaymentInfo(s.id);
      
      // Taksit kaydı olmayanları filtreden geçir
      if (info.totalCount === 0) {
        // "Ödendi" veya "Bekliyor" seçiliyse taksit kaydı olmayanları gösterme
        return false;
      }
      
      if (statusFilter === 'paid') return info.remaining === 0;
      if (statusFilter === 'pending') return info.remaining > 0 && info.overdueCount === 0;
      if (statusFilter === 'overdue') return info.overdueCount > 0;
      
      return true;
    });
  }, [students, search, statusFilter, installments]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats
  const stats = useMemo(() => {
    let totalContract = students.length; // Tüm öğrenciler
    let paidFull = 0;
    let hasOverdue = 0;
    
    students.forEach(s => {
      const info = getStudentPaymentInfo(s.id);
      if (info.totalCount > 0) {
        if (info.remaining === 0) paidFull++;
        if (info.overdueCount > 0) hasOverdue++;
      }
    });
    
    return { totalContract, paidFull, hasOverdue };
  }, [students, installments]);

  // Print contract
  const handlePrintContract = (student: Student) => {
    const info = getStudentPaymentInfo(student.id);
    const name = getStudentName(student);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sözleşme - ${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; padding: 15mm; }
    .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .header h1 { font-size: 24pt; }
    .header-right { text-align: right; }
    .section { margin-bottom: 20px; }
    .section-title { background: #f0f0f0; border: 1px solid #000; padding: 8px 12px; font-weight: bold; font-size: 12pt; }
    .section-content { border: 1px solid #000; border-top: none; padding: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .paid { color: #16a34a; font-weight: bold; }
    .pending { color: #ea580c; }
    .overdue { color: #dc2626; font-weight: bold; }
    .total-row { border-top: 2px solid #000; font-weight: bold; font-size: 12pt; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-box { border: 2px solid #000; padding: 15px; width: 45%; text-align: center; }
    .signature-box p { margin-bottom: 60px; font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #000; padding-top: 10px; }
    @media print { body { padding: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>AKADEMİHUB</h1>
      <p>K12 Eğitim Kurumları</p>
    </div>
    <div class="header-right">
      <h2 style="border: 2px solid #000; padding: 8px 16px;">KAYIT SÖZLEŞMESİ</h2>
      <p style="margin-top: 8px;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
      <p>Öğrenci No: ${student.student_no || '-'}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ÖĞRENCİ BİLGİLERİ</div>
    <div class="section-content">
      <table>
        <tr>
          <td style="width: 25%; font-weight: bold;">Ad Soyad:</td>
          <td style="width: 25%;">${name}</td>
          <td style="width: 25%; font-weight: bold;">TC Kimlik No:</td>
          <td style="width: 25%;">${student.tc_id || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Sınıf:</td>
          <td>${student.class || '-'}${student.section ? '-' + student.section : ''}</td>
          <td style="font-weight: bold;">Kayıt Tarihi:</td>
          <td>${student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : '-'}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">VELİ BİLGİLERİ</div>
    <div class="section-content">
      <table>
        <tr>
          <td style="width: 25%; font-weight: bold;">Veli Adı:</td>
          <td style="width: 25%;">${student.parent_name ? student.parent_name.split(' - Veli: ')[1] || student.parent_name : '-'}</td>
          <td style="width: 25%; font-weight: bold;">Telefon:</td>
          <td style="width: 25%;">${student.parent_phone || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">E-posta:</td>
          <td colspan="3">${student.parent_email || '-'}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ÖDEME PLANI VE TAKSİT DURUMU</div>
    <div class="section-content">
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">No</th>
            <th style="width: 25%;">Açıklama</th>
            <th style="width: 20%;">Vade Tarihi</th>
            <th style="width: 20%; text-align: right;">Tutar</th>
            <th style="width: 25%; text-align: center;">Durum</th>
          </tr>
        </thead>
        <tbody>
          ${info.installments.map(inst => `
            <tr>
              <td>${inst.installment_no === 0 ? 'P' : inst.installment_no}</td>
              <td>${inst.installment_no === 0 ? 'Peşinat' : inst.installment_no + '. Taksit'}</td>
              <td>${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
              <td style="text-align: right;">${inst.amount.toLocaleString('tr-TR')} ₺</td>
              <td style="text-align: center;" class="${inst.is_paid ? 'paid' : new Date(inst.due_date) < new Date() ? 'overdue' : 'pending'}">
                ${inst.is_paid 
                  ? `✓ Ödendi${inst.paid_at ? ' (' + new Date(inst.paid_at).toLocaleDateString('tr-TR') + ')' : ''}`
                  : new Date(inst.due_date) < new Date() 
                    ? '⚠ Gecikmiş'
                    : '○ Bekliyor'
                }
              </td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3">TOPLAM</td>
            <td style="text-align: right;">${info.total.toLocaleString('tr-TR')} ₺</td>
            <td style="text-align: center;">Ödenen: ${info.paid.toLocaleString('tr-TR')} ₺</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 15px; font-size: 10pt;">
        <strong>Kalan Borç:</strong> ${info.remaining.toLocaleString('tr-TR')} ₺ | 
        <strong>Ödeme Durumu:</strong> ${info.paidCount}/${info.totalCount} taksit ödendi
        ${info.overdueCount > 0 ? ` | <span style="color: #dc2626;"><strong>${info.overdueCount} gecikmiş taksit</strong></span>` : ''}
      </p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SÖZLEŞME ŞARTLARI</div>
    <div class="section-content" style="font-size: 10pt;">
      <p>1. Veli, belirlenen ödeme planına uymayı taahhüt eder.</p>
      <p>2. Taksitlerin zamanında ödenmemesi halinde kurum yasal işlem başlatma hakkını saklı tutar.</p>
      <p>3. Kurum, eğitim hizmetini müfredata uygun şekilde sunmayı taahhüt eder.</p>
      <p>4. Taraflar, KVKK kapsamında bilgilendirilmiştir.</p>
    </div>
  </div>

  <div class="signature">
    <div class="signature-box">
      <p>VELİ İMZASI</p>
      <div style="border-top: 1px solid #000; padding-top: 8px;">
        <small>${student.parent_name ? student.parent_name.split(' - Veli: ')[1] || student.parent_name : '________________________'}</small>
      </div>
    </div>
    <div class="signature-box">
      <p>KURUM YETKİLİSİ</p>
      <div style="border-top: 1px solid #000; padding-top: 8px;">
        <small>________________________</small>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Bu belge ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde oluşturulmuştur.</p>
    <p>AkademiHub K12 Eğitim Kurumları</p>
  </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Download PDF
  const handleDownloadPDF = (student: Student) => {
    handlePrintContract(student);
    toast.success('PDF indirme için yazdırma penceresinden "PDF olarak kaydet" seçin');
  };

  // View contract modal
  const handleViewContract = (student: Student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center">
        <div className="text-center text-white">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p>Sözleşmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/finance/reports" className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-[#25D366]" />
                Sözleşme Arşivi
              </h1>
              <p className="text-gray-500 text-sm">Öğrenci kayıt sözleşmeleri ve ödeme durumları</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Yenile
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Sözleşme</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContract}</p>
              </div>
              <div className="w-12 h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
                <FileText className="text-[#128C7E]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ödemesi Tamamlanan</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidFull}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Gecikmiş Ödeme</p>
                <p className="text-2xl font-bold text-red-600">{stats.hasOverdue}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Öğrenci ara (ad, numara)..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'paid', label: 'Ödendi' },
                { value: 'pending', label: 'Bekliyor' },
                { value: 'overdue', label: 'Gecikmiş' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value as any); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    statusFilter === opt.value 
                      ? 'bg-white text-[#128C7E] shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500">{filteredStudents.length} öğrenci</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Öğrenci</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Sınıf</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Toplam</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ödenen</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kalan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.map(student => {
                const info = getStudentPaymentInfo(student.id);
                const name = getStudentName(student);
                const initials = name.substring(0, 2).toUpperCase();
                
                let statusBadge = { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Kayıt Yok' };
                if (info.totalCount > 0) {
                  if (info.remaining === 0) {
                    statusBadge = { bg: 'bg-green-100', text: 'text-green-700', label: 'Tamamlandı' };
                  } else if (info.overdueCount > 0) {
                    statusBadge = { bg: 'bg-red-100', text: 'text-red-700', label: `${info.overdueCount} Gecikmiş` };
                  } else {
                    statusBadge = { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Devam Ediyor' };
                  }
                }

                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#DCF8C6] flex items-center justify-center text-[#128C7E] font-bold text-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">{student.student_no || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {student.class}{student.section ? `-${student.section}` : ''}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {info.total > 0 ? `${info.total.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600 font-medium">
                      {info.paid > 0 ? `${info.paid.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-amber-600 font-medium">
                      {info.remaining > 0 ? `${info.remaining.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewContract(student)}
                          className="p-2 text-gray-500 hover:text-[#128C7E] hover:bg-[#DCF8C6] rounded-lg transition"
                          title="Görüntüle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handlePrintContract(student)}
                          className="p-2 text-gray-500 hover:text-[#128C7E] hover:bg-[#DCF8C6] rounded-lg transition"
                          title="Yazdır"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(student)}
                          className="p-2 text-gray-500 hover:text-[#128C7E] hover:bg-[#DCF8C6] rounded-lg transition"
                          title="PDF İndir"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sözleşme bulunamadı</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredStudents.length)} / {filteredStudents.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  page = currentPage - 2 + i;
                  if (page > totalPages) page = totalPages - 4 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      currentPage === page 
                        ? 'bg-[#25D366] text-white' 
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contract Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{getStudentName(selectedStudent)}</h2>
                  <p className="text-white/80 text-sm">{selectedStudent.student_no}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <User size={14} />
                    TC Kimlik No
                  </div>
                  <p className="font-medium">{selectedStudent.tc_id || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar size={14} />
                    Kayıt Tarihi
                  </div>
                  <p className="font-medium">
                    {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Phone size={14} />
                    Veli Telefon
                  </div>
                  <p className="font-medium">{selectedStudent.parent_phone || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Mail size={14} />
                    Veli E-posta
                  </div>
                  <p className="font-medium">{selectedStudent.parent_email || '-'}</p>
                </div>
              </div>

              {/* Payment Summary */}
              {(() => {
                const info = getStudentPaymentInfo(selectedStudent.id);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#DCF8C6] rounded-xl p-4 text-center">
                        <p className="text-sm text-[#128C7E]">Toplam</p>
                        <p className="text-xl font-bold text-[#075E54]">{info.total.toLocaleString('tr-TR')} ₺</p>
                      </div>
                      <div className="bg-green-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-green-600">Ödenen</p>
                        <p className="text-xl font-bold text-green-700">{info.paid.toLocaleString('tr-TR')} ₺</p>
                      </div>
                      <div className="bg-amber-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-amber-600">Kalan</p>
                        <p className="text-xl font-bold text-amber-700">{info.remaining.toLocaleString('tr-TR')} ₺</p>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">No</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Açıklama</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Vade</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">Tutar</th>
                            <th className="text-center py-2 px-3 font-medium text-gray-600">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {info.installments.map(inst => (
                            <tr key={inst.id} className={inst.is_paid ? 'bg-green-50/50' : ''}>
                              <td className="py-2 px-3 font-mono">{inst.installment_no === 0 ? 'P' : inst.installment_no}</td>
                              <td className="py-2 px-3">{inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`}</td>
                              <td className="py-2 px-3">{new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                              <td className="py-2 px-3 text-right font-medium">{inst.amount.toLocaleString('tr-TR')} ₺</td>
                              <td className="py-2 px-3 text-center">
                                {inst.is_paid ? (
                                  <span className="inline-flex items-center gap-1 text-green-600">
                                    <CheckCircle2 size={14} />
                                    {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('tr-TR') : 'Ödendi'}
                                  </span>
                                ) : new Date(inst.due_date) < new Date() ? (
                                  <span className="inline-flex items-center gap-1 text-red-600">
                                    <AlertTriangle size={14} />
                                    Gecikmiş
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-600">
                                    <Clock size={14} />
                                    Bekliyor
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Kapat
              </button>
              <button
                onClick={() => { handlePrintContract(selectedStudent); }}
                className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition flex items-center gap-2"
              >
                <Printer size={16} />
                Yazdır
              </button>
              <button
                onClick={() => { handleDownloadPDF(selectedStudent); }}
                className="px-4 py-2 bg-[#075E54] text-white rounded-lg hover:bg-[#128C7E] transition flex items-center gap-2"
              >
                <Download size={16} />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

