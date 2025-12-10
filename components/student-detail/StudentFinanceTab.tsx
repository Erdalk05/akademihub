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

// Türkçe karakterleri PDF için düzgün göster
// jsPDF helvetica fontu Türkçe karakterleri desteklemediği için
// karakterleri koruyan bir map kullanıyoruz
const turkishCharMap: Record<string, string> = {
  'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I',
  'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  'İ': 'I', '₺': 'TL'
};

// PDF'de Türkçe karakterleri okunabilir hale getir
const turkishToAscii = (text: string): string => {
  if (!text) return '';
  return text.split('').map(char => turkishCharMap[char] || char).join('');
};

// PDF Başlık Metinleri - Daha okunabilir format
const PDF_LABELS = {
  CONTRACT_TITLE: 'KAYIT SOZLESMESI',
  STUDENT_INFO: 'OGRENCI BILGILERI', 
  GUARDIAN_INFO: 'VELI BILGILERI',
  PAYMENT_PLAN: 'ODEME PLANI VE TAKSIT DURUMU',
  RECEIPT_TITLE: 'ODEME MAKBUZU',
  STUDENT: 'Ogrenci',
  CLASS: 'Sinif',
  DEPOSIT: 'Pesinat',
  PAID: 'Odendi',
  PAID_AMOUNT: 'Odenen',
  OVERDUE: 'Gecikmis',
  WAITING: 'Bekliyor',
  DESCRIPTION: 'Aciklama',
  GUARDIAN_NAME: 'Veli Adi',
  REGISTRATION_DATE: 'Kayit Tarihi',
  TC_ID: 'TC Kimlik No'
};

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
      doc.text('ODEME MAKBUZU', 40, 15, { align: 'center' });
      
      // Çizgi
      doc.setLineWidth(0.5);
      doc.line(10, 20, 70, 20);
      
      // Bilgiler
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 30;
      
      doc.text('Ogrenci:', 10, y);
      doc.text(`${turkishToAscii(student.first_name || '')} ${turkishToAscii(student.last_name || '')}`, 10, y + 5);
      y += 15;
      
      doc.text(`Taksit No: ${installment.installment_no}`, 10, y);
      y += 7;
      
      doc.text(`Vade: ${new Date(installment.due_date).toLocaleDateString('tr-TR')}`, 10, y);
      y += 7;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Tutar: TL ${installment.amount.toLocaleString('tr-TR')}`, 10, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(turkishToAscii(`Odenen: TL ${installment.paid_amount.toLocaleString('tr-TR')}`), 10, y);
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
      const html2pdf = (await import('html2pdf.js')).default;
      const today = new Date().toLocaleDateString('tr-TR');
      
      // HTML içerik oluştur - Türkçe karakterler tam destekleniyor
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <!-- BAŞLIK -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #1e293b;">KAYIT SÖZLEŞMESİ</h1>
            <p style="font-size: 10px; color: #64748b; margin-top: 5px;">
              Tarih: ${today} | Öğrenci No: ${student.student_no || '-'}
            </p>
          </div>
          
          <!-- ÖĞRENCİ VE VELİ BİLGİLERİ -->
          <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            <!-- Öğrenci -->
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 8px 12px; font-size: 11px; font-weight: bold;">
                ÖĞRENCİ BİLGİLERİ
              </div>
              <div style="padding: 12px; font-size: 10px; color: #334155; line-height: 1.6;">
                <div><strong>Ad Soyad:</strong> ${student.first_name || ''} ${student.last_name || ''}</div>
                <div><strong>TC Kimlik No:</strong> ${student.tc_no || '-'}</div>
                <div><strong>Sınıf:</strong> ${student.class || '-'}-${student.section || 'A'}</div>
                <div><strong>Kayıt Tarihi:</strong> ${today}</div>
              </div>
            </div>
            
            <!-- Veli -->
            <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #9333ea, #c026d3); color: white; padding: 8px 12px; font-size: 11px; font-weight: bold;">
                VELİ BİLGİLERİ
              </div>
              <div style="padding: 12px; font-size: 10px; color: #334155; line-height: 1.6;">
                <div><strong>Veli Adı:</strong> ${student.parent_name || '-'}</div>
                <div><strong>Telefon:</strong> ${student.parent_phone || '-'}</div>
                <div><strong>E-posta:</strong> ${student.parent_email || '-'}</div>
              </div>
            </div>
          </div>
          
          <!-- ÖDEME PLANI -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 8px 12px; font-size: 11px; font-weight: bold;">
              ÖDEME PLANI VE TAKSİT DURUMU
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; width: 35px;">No</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Açıklama</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">Vade</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">Ödeme Tarihi</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">Tutar</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${installments.slice(0, 12).map((inst, index) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${inst.installment_no === 0 ? 'P' : index + 1}</td>
                    <td style="padding: 6px 8px;">${inst.installment_no === 0 ? 'Peşinat' : `${inst.installment_no}. Taksit`}</td>
                    <td style="padding: 6px 8px; text-align: center;">${new Date(inst.due_date).toLocaleDateString('tr-TR')}</td>
                    <td style="padding: 6px 8px; text-align: center; color: ${inst.status === 'paid' ? '#059669' : '#9ca3af'};">
                      ${inst.status === 'paid' ? new Date().toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: bold;">${inst.amount.toLocaleString('tr-TR')} TL</td>
                    <td style="padding: 6px 8px; text-align: center;">
                      <span style="padding: 2px 8px; border-radius: 12px; font-size: 8px; font-weight: bold; 
                        ${inst.status === 'paid' ? 'background: #dcfce7; color: #166534;' : 
                          inst.status === 'overdue' ? 'background: #fee2e2; color: #991b1b;' : 
                          'background: #fef3c7; color: #92400e;'}">
                        ${inst.status === 'paid' ? 'Ödendi' : inst.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                <tr style="background: #f8fafc; font-weight: bold;">
                  <td colspan="2" style="padding: 8px;">TOPLAM</td>
                  <td></td>
                  <td style="padding: 8px; text-align: right;">${totalAmount.toLocaleString('tr-TR')} TL</td>
                  <td style="padding: 8px; text-align: center; font-size: 8px;">Ödenen: ${paidAmount.toLocaleString('tr-TR')} TL</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- YASAL BEYAN -->
          <p style="font-size: 8px; color: #64748b; font-style: italic; margin-bottom: 25px; line-height: 1.4;">
            MEB Özel Öğretim Kurumları Yönetmeliği gereği hazırlanmıştır. Yukarıdaki bilgilerin doğruluğunu, ödeme planına uyacağımı, KVKK kapsamında kişisel verilerimin işlenmesini kabul ettiğimi beyan ederim.
          </p>
          
          <!-- İMZA ALANLARI -->
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="text-align: center; width: 45%;">
              <p style="font-size: 10px; font-weight: bold; margin-bottom: 30px;">KURUM YETKİLİSİ</p>
              <div style="border-top: 1px solid #334155; padding-top: 5px;">
                <p style="font-size: 8px; color: #64748b;">İmza / Tarih / Kaşe</p>
              </div>
            </div>
            <div style="text-align: center; width: 45%;">
              <p style="font-size: 10px; font-weight: bold; margin-bottom: 30px;">VELİ / MALİ SORUMLU</p>
              <div style="border-top: 1px solid #334155; padding-top: 5px;">
                <p style="font-size: 8px; color: #64748b;">İmza / Tarih</p>
              </div>
            </div>
          </div>
          
          <!-- FOOTER -->
          <div style="text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 7px; color: #94a3b8;">
              AkademiHub © ${new Date().getFullYear()} | ${student.first_name} ${student.last_name} | ${today}
            </p>
          </div>
        </div>
      `;
      
      // Geçici div oluştur
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      
      // PDF ayarları
      const opt = {
        margin: 10,
        filename: `Sozlesme_${student.first_name}_${student.last_name}_${today.replace(/\./g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      // PDF oluştur ve indir
      await html2pdf().set(opt).from(container).save();
      
      // Geçici div'i kaldır
      document.body.removeChild(container);
      
      toast.success(
        `✅ Sözleşme İndirildi!\n\nTürkçe karakterler düzgün görünüyor.`,
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

