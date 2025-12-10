'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Download,
  CreditCard,
  FileText,
  RefreshCw
} from 'lucide-react';
import RestructurePlanModal from '@/components/finance/RestructurePlanModal';
import toast from 'react-hot-toast';

interface Installment {
  id: string;
  installment_no: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface Props {
  student: any;
  onRefresh?: () => void;
}

export default function StudentFinanceTab({ student, onRefresh }: Props) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showRestructureModal, setShowRestructureModal] = useState(false);

  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/installments?student_id=${student.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const allInstallments = data.data;
        
        if (allInstallments.length > 20) {
          toast.error(`⚠️ DİKKAT: Bu öğrenci için ${allInstallments.length} taksit bulundu!\n\nBu normalin üzerinde. Veritabanında hata olabilir.\n\nSadece ilk 20 taksit gösteriliyor.`, {
            duration: 8000,
          });
        }
        
        setInstallments(allInstallments.slice(0, 20));
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  const handlePayment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
  };

  const processPayment = async (paymentAmount?: number, paymentMethod?: string) => {
    if (!selectedInstallment) return;

    const amount = paymentAmount || selectedInstallment.amount;
    const toastId = toast.loading('Ödeme işleniyor...');
    
    try {
      // Gerçek API çağrısı
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installment_id: selectedInstallment.id,
          student_id: student.id,
          amount,
          payment_method: paymentMethod || 'cash',
          notes: `${selectedInstallment.installment_no}. taksit ödemesi`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ödeme işlenemedi');
      }
      
      toast.success(
        `✅ Ödeme Kaydedildi!\n\n` +
        `Taksit: ${selectedInstallment.installment_no}\n` +
        `Tutar: ₺${amount.toLocaleString('tr-TR')}\n` +
        `${data.data.is_fully_paid ? '🎉 Taksit tamamen ödendi!' : `Kalan: ₺${data.data.remaining.toLocaleString('tr-TR')}`}`,
        { id: toastId, duration: 6000, icon: '💰' }
      );
      
      setShowPaymentModal(false);
      setSelectedInstallment(null);
      
      // Listeyi yenile
      setTimeout(() => {
        fetchInstallments();
        onRefresh?.();
      }, 500);
    } catch (error: any) {
      toast.error(`❌ Ödeme hatası: ${error.message}`, { id: toastId });
    }
  };

  const downloadReceipt = async (installment: Installment) => {
    const toastId = toast.loading('Makbuz hazırlanıyor...');
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', [80, 120]); // Makbuz boyutu
      
      // Başlık
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ÖDEME MAKBUZU', 40, 15, { align: 'center' });
      
      // Çizgi
      doc.setLineWidth(0.5);
      doc.line(10, 20, 70, 20);
      
      // Bilgiler
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 30;
      
      doc.text(`Öğrenci:`, 10, y);
      doc.text(`${student.first_name} ${student.last_name}`, 10, y + 5);
      y += 15;
      
      doc.text(`Taksit No: ${installment.installment_no}`, 10, y);
      y += 7;
      
      doc.text(`Vade: ${new Date(installment.due_date).toLocaleDateString('tr-TR')}`, 10, y);
      y += 7;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Tutar: ₺${installment.amount.toLocaleString('tr-TR')}`, 10, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ödenen: ₺${installment.paid_amount.toLocaleString('tr-TR')}`, 10, y);
      y += 10;
      
      // Alt bilgi
      doc.setFontSize(8);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, 10, y);
      y += 7;
      doc.text(`Makbuz No: #${installment.id.substring(0, 8).toUpperCase()}`, 10, y);
      
      // İndir
      const fileName = `Makbuz_${installment.installment_no}_${student.last_name}_${new Date().toLocaleDateString('tr-TR')}.pdf`;
      doc.save(fileName);
      
      toast.success(
        `✅ Makbuz İndirildi!\n\n${installment.installment_no}. Taksit - ₺${installment.amount.toLocaleString('tr-TR')}`,
        { id: toastId, duration: 4000, icon: '🧾' }
      );
    } catch (error: any) {
      toast.error(`❌ Makbuz oluşturulamadı: ${error.message}`, { id: toastId });
    }
  };

  const downloadContract = async () => {
    const toastId = toast.loading('Sözleşme PDF\'i hazırlanıyor...');
    
    try {
      // jsPDF ile PDF oluştur
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString('tr-TR');
      
      // === BAŞLIK ===
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KAYIT SÖZLEŞMESİ', pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tarih: ${today}  |  Öğrenci No: ${student.student_no}`, pageWidth / 2, 18, { align: 'center' });
      
      // === ÖĞRENCİ BİLGİLERİ (Kompakt - Yan yana) ===
      let y = 25;
      
      // Sol kolon: Öğrenci
      doc.setFillColor(79, 70, 229);
      doc.rect(10, y, 90, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ÖĞRENCİ BİLGİLERİ', 12, y + 3.5);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      y += 8;
      doc.text(`Ad Soyad: ${student.first_name} ${student.last_name}`, 12, y);
      doc.text(`TC Kimlik No: ${student.tc_no || '-'}`, 12, y + 4);
      doc.text(`Sınıf: ${student.class || '-'}-${student.section || 'A'}`, 12, y + 8);
      doc.text(`Kayıt Tarihi: ${today}`, 12, y + 12);
      
      // Sağ kolon: Veli
      doc.setFillColor(147, 51, 234);
      doc.rect(105, y - 8, 95, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('VELİ BİLGİLERİ', 107, y - 4.5);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Veli Adı: ${student.parent_name || '-'}`, 107, y);
      doc.text(`Telefon: ${student.parent_phone || '-'}`, 107, y + 4);
      doc.text(`E-posta: ${student.parent_email || '-'}`, 107, y + 8);
      
      // === ÖDEME PLANI VE TAKSİT DURUMU (Kompakt Tablo) ===
      y += 20;
      doc.setFillColor(34, 197, 94);
      doc.rect(10, y, pageWidth - 20, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ÖDEME PLANI VE TAKSİT DURUMU', 12, y + 3.5);
      
      // Taksit tablosu - Maksimum 12 satır göster
      const maxRows = 12;
      const displayInstallments = installments.slice(0, maxRows);
      const tableData = displayInstallments.map((inst, index) => [
        inst.installment_no === 0 ? 'P' : String(index + 1),
        inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`,
        new Date(inst.due_date).toLocaleDateString('tr-TR'),
        `${inst.amount.toLocaleString('tr-TR')} ₺`,
        inst.status === 'paid' ? '✓ Ödendi' : inst.status === 'overdue' ? '⚠ Gecikmiş' : '○ Bekliyor'
      ]);
      
      // Toplam satırı ekle
      tableData.push([
        '', 'TOPLAM', '', `${totalAmount.toLocaleString('tr-TR')} ₺`, `Ödenen: ${paidAmount.toLocaleString('tr-TR')} ₺`
      ]);
      
      (doc as any).autoTable({
        startY: y + 7,
        head: [['No', 'Açıklama', 'Vade Tarihi', 'Tutar', 'Durum']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold', fontSize: 7, cellPadding: 1.5 },
        styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 'auto', halign: 'center' }
        },
        margin: { left: 10, right: 10 },
        didParseCell: function(data: any) {
          // Toplam satırını kalın yap
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });
      
      // === YASAL BEYAN (Kompakt) ===
      const tableEndY = (doc as any).lastAutoTable.finalY + 5;
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const legalText = 'MEB Özel Öğretim Kurumları Yönetmeliği gereği hazırlanmıştır. Yukarıdaki bilgilerin doğruluğunu, ödeme planına uyacağımı, KVKK kapsamında kişisel verilerimin işlenmesini kabul ettiğimi beyan ederim.';
      const splitText = doc.splitTextToSize(legalText, pageWidth - 20);
      doc.text(splitText, 10, tableEndY);
      
      // === İMZA ALANLARI (Kompakt) ===
      const signY = tableEndY + 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      
      // Sol: Kurum
      doc.text('KURUM YETKİLİSİ', 30, signY);
      doc.line(10, signY + 10, 70, signY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('İmza / Tarih / Kaşe', 25, signY + 14);
      
      // Sağ: Veli
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('VELİ / MALİ SORUMLU', pageWidth - 55, signY);
      doc.line(pageWidth - 70, signY + 10, pageWidth - 10, signY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('İmza / Tarih', pageWidth - 45, signY + 14);
      
      // === FOOTER ===
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(`AkademiHub © ${new Date().getFullYear()} | ${student.first_name} ${student.last_name} | ${today}`, pageWidth / 2, 290, { align: 'center' });
      
      // PDF'i indir
      const fileName = `Sozlesme_${student.first_name}_${student.last_name}_${today.replace(/\./g, '-')}.pdf`;
      doc.save(fileName);
      
      toast.success(
        `✅ Sözleşme İndirildi!\n\n${fileName}`,
        { id: toastId, duration: 4000, icon: '📄' }
      );
    } catch (error: any) {
      toast.error(`❌ PDF oluşturulamadı: ${error.message}`, { id: toastId });
    }
  };

  const handleQuickPayment = () => {
    // En yakın ödenmemiş taksiti bul
    const unpaidInstallment = installments.find(i => i.status !== 'paid');
    
    if (!unpaidInstallment) {
      toast.success('🎉 Tüm taksitler ödendi!');
      return;
    }
    
    setSelectedInstallment(unpaidInstallment);
    setShowPaymentModal(true);
  };

  // Taksitlerden otomatik hesaplama
  const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = installments.reduce((sum, i) => sum + i.paid_amount, 0);
  const balance = totalAmount - paidAmount;

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { label: 'Ödendi', className: 'bg-green-100 text-green-700 border-green-300' },
      pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      overdue: { label: 'Gecikmiş', className: 'bg-red-100 text-red-700 border-red-300' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <>
    <div className="space-y-6">
      {/* ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">Toplam Sözleşme</p>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">₺{totalAmount.toLocaleString('tr-TR')}</p>
        </div>

        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-700">Tahsil Edilen</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">₺{paidAmount.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-green-600 mt-1">
            %{totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0} ödendi
          </p>
        </div>

        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-orange-700">Kalan Borç</p>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-900">₺{balance.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-orange-600 mt-1">
            {installments.filter(i => i.status !== 'paid').length} taksit bekliyor
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-3 justify-center">
          <button 
            onClick={handleQuickPayment}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 transition flex items-center justify-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            Hızlı Ödeme Al
          </button>
          <button 
            onClick={() => setShowRestructureModal(true)}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 transition flex items-center justify-center gap-2 shadow-md"
          >
            <RefreshCw className="h-5 w-5" />
            Yeniden Taksitlendir
          </button>
        </div>
      </div>

      {/* TAKSİT LİSTESİ */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Ödeme Planı ve Hareketler
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : installments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz taksit planı oluşturulmamış.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left">Taksit</th>
                  <th className="p-4 text-left">Vade Tarihi</th>
                  <th className="p-4 text-right">Tutar</th>
                  <th className="p-4 text-right">Ödenen</th>
                  <th className="p-4 text-right">Kalan</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((installment, index) => {
                  const remaining = installment.amount - installment.paid_amount;
                  const statusBadge = getStatusBadge(installment.status);
                  const isOverdue = installment.status === 'overdue';

                  return (
                    <tr
                      key={installment.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                        isOverdue ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{index + 1}. Taksit</span>
                      </td>
                      <td className={`p-4 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                        {isOverdue && <span className="ml-2 text-xs">(Gecikmede)</span>}
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        ₺{installment.amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-right text-green-600 font-medium">
                        ₺{installment.paid_amount.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        ₺{remaining.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {installment.status === 'paid' ? (
                            <button
                              onClick={() => downloadReceipt(installment)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition"
                            >
                              <Download className="h-3 w-3" />
                              Makbuz
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayment(installment)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium transition"
                            >
                              <CreditCard className="h-3 w-3" />
                              Tahsil Et
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SÖZLEŞME ÖNİZLEMESİ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Kayıt Sözleşmesi
          </h3>
          <button 
            onClick={downloadContract}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition"
          >
            <Download className="h-4 w-4" />
            PDF İndir
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Dijital sözleşme önizlemesi yakında...</p>
        </div>
      </div>
    </div>

    {/* YENİDEN TAKSİTLENDİRME MODAL */}
    <RestructurePlanModal
      isOpen={showRestructureModal}
      onClose={() => setShowRestructureModal(false)}
      studentId={student.id}
      currentSummary={{
        total: totalAmount,
        paid: paidAmount,
        unpaid: balance,
        balance: balance,
        installments: installments.map(i => ({
          id: i.id,
          student_id: student.id,
          installment_no: i.installment_no,
          amount: i.amount,
          due_date: i.due_date,
          is_paid: i.status === 'paid',
          paid_amount: i.paid_amount,
          paid_at: null,
          created_at: new Date().toISOString(),
        })),
      }}
      onSuccess={() => {
        fetchInstallments();
        onRefresh?.();
      }}
    />

    {/* ÖDEME MODAL */}
    {showPaymentModal && selectedInstallment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Ödeme Al</h3>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-700 mb-1">Taksit Bilgisi</p>
              <p className="text-2xl font-bold text-indigo-900">
                {selectedInstallment.installment_no}. Taksit
              </p>
              <p className="text-sm text-indigo-600 mt-1">
                Vade: {new Date(selectedInstallment.due_date).toLocaleDateString('tr-TR')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tahsil Edilecek Tutar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₺</span>
                <input
                  type="number"
                  defaultValue={selectedInstallment.amount - selectedInstallment.paid_amount}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                  id="payment-amount"
                />
              </div>
              <p className="text-xs text-gray-500">
                Kalan: ₺{(selectedInstallment.amount - selectedInstallment.paid_amount).toLocaleString('tr-TR')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ödeme Yöntemi
              </label>
              <select 
                id="payment-method"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="cash">💵 Nakit</option>
                <option value="card">💳 Kredi Kartı</option>
                <option value="transfer">🏦 Banka Transferi</option>
                <option value="eft">📱 Havale/EFT</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              İptal
            </button>
            <button
              onClick={() => {
                const input = document.getElementById('payment-amount') as HTMLInputElement;
                const select = document.getElementById('payment-method') as HTMLSelectElement;
                const amount = parseFloat(input.value) || selectedInstallment.amount;
                const method = select.value;
                processPayment(amount, method);
              }}
              className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Ödemeyi Kaydet
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

