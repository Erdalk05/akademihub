'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { FinanceInstallment, FinanceSummary } from '@/lib/types/finance';
import {
  exportInstallmentPlanToExcel,
  exportInstallmentPlanToPDF,
} from '@/lib/services/exportService';
import { printReceipt, shareReceiptViaWhatsApp, shareInstallmentPlanViaWhatsApp } from '@/lib/services/receiptService';
import { MessageCircle, History, FileText, Send, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

// Components
import FinanceSummaryCard from './components/FinanceSummaryCard';
import InstallmentTable from '@/components/finance/InstallmentTable';
import OldPaymentsTable from '@/components/finance/OldPaymentsTable';
import StudentInfoCard from './components/StudentInfoCard';
import AddInstallmentModal from '@/components/finance/AddInstallmentModal';

// New Enhanced Modals
import PaymentCollectionModal from '@/components/finance/PaymentCollectionModal';
import EditPaymentModal from '@/components/finance/EditPaymentModal';
import RestructurePlanModal from '@/components/finance/RestructurePlanModal';

// Basit UUID format kontrolü (Postgres uuid tipi ile uyum için)
const isValidUuid = (value: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
};

export default function StudentPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  
  // Modals State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<FinanceInstallment | null>(null);
  const [restructureOpen, setRestructureOpen] = useState(false);
  const [addInstallmentOpen, setAddInstallmentOpen] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  const [studentRecord, setStudentRecord] = useState<any | null>(null);
  const isRealStudent = isValidUuid(studentId);

  const fetchSummary = useCallback(async () => {
    // Eğer öğrenci ID'si geçerli bir UUID değilse, API'ye gitme;
    if (!isRealStudent) {
      const empty: FinanceSummary = {
        total: 0,
        paid: 0,
        unpaid: 0,
        balance: 0,
        installments: [],
      };
      setSummary(empty);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/installments/student/${studentId}`, { cache: 'no-store' });
      const js = await res.json();
      if (!js?.success) setError(js?.error || 'Kayıtlar alınamadı');
      else setSummary(js.data as FinanceSummary);
    } catch (e: any) {
      setError(e.message || 'Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, [studentId, isRealStudent]);

  // Öğrencinin ad-soyad bilgisini al
  useEffect(() => {
    if (!isRealStudent) return;
    (async () => {
      try {
        const res = await fetch('/api/students', { cache: 'no-store' });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) return;
        const list = (js.data || []) as any[];
        const stu = list.find((s) => s.id === studentId);
        if (stu) {
          setStudentRecord(stu);
          const fullName =
            `${stu.first_name || ''} ${stu.last_name || ''}`.trim() ||
            stu.full_name ||
            stu.parent_name ||
            'Öğrenci';
          setStudentName(fullName);
        }
      } catch {
        // isim yüklenemese de sayfa çalışmaya devam etsin
      }
    })();
  }, [studentId, isRealStudent]);

  useEffect(() => { if (studentId) fetchSummary(); }, [studentId, fetchSummary]);

  const handleOpenPay = (row: FinanceInstallment) => {
    setSelectedInstallment(row);
    setPaymentModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    const row = summary?.installments.find(i => i.id === id);
    if (row) {
        setSelectedInstallment(row);
        setEditModalOpen(true);
    }
  };

  const handleReceipt = (idOrRow: string | FinanceInstallment) => {
    let row: FinanceInstallment | undefined;
    
    if (typeof idOrRow === 'string') {
      row = summary?.installments.find((i) => i.id === idOrRow);
    } else {
      row = idOrRow;
    }
    
    if (!row) return;
    
    // Güvenilir yazdırma - iframe kullanarak popup blocker'ı aşar
    printReceipt(row, studentName);
  };

  const installments = (summary?.installments as FinanceInstallment[]) || [];
  // Eğitim taksitleri (satış kaynaklı olmayanlar) bu ekranda gösterilecek.
  const educationInstallments = installments.filter(
    (it) => !it.source || it.source === 'education',
  );

  // Özet kartlarında sadece eğitim borçları görünsün
  const total = educationInstallments.reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0,
  );
  const paid = educationInstallments.reduce(
    (sum, it) =>
      sum +
      Number(
        (it.paid_amount ?? (it.is_paid ? it.amount : 0)) || 0,
      ),
    0,
  );
  const remaining = Math.max(0, total - paid);
  const today = new Date();
  const overdueDays = educationInstallments
    .filter((it) => !it.is_paid && it.due_date && new Date(it.due_date) < today)
    .reduce((sum, it) => {
      if (!it.due_date) return sum;
      const diffMs = today.getTime() - new Date(it.due_date).getTime();
      return sum + Math.round(diffMs / (1000 * 60 * 60 * 24));
    }, 0);

  const nextInstallmentNo =
    educationInstallments.length > 0
      ? Math.max(...educationInstallments.map((x) => Number(x.installment_no || 0))) + 1
      : 1;

  const handleExportExcel = () => {
    try {
      if (!summary) {
        alert('Ödeme planı verisi henüz yüklenmedi. Lütfen birkaç saniye sonra tekrar deneyin.');
        return;
      }

      exportInstallmentPlanToExcel(educationInstallments, {
        studentName: studentName || 'Öğrenci',
        className:
          studentRecord?.class_name ||
          studentRecord?.class ||
          studentRecord?.section ||
          null,
        parentName: studentRecord?.parent_name || null,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
      });
    } catch (e: any) {
      // Kullanıcıya basit bir hata mesajı göster
      alert(`Excel oluşturulurken bir hata oluştu: ${e?.message || 'Bilinmeyen hata'}`);
      // Konsola da yaz (geliştirici için)
      // eslint-disable-next-line no-console
      console.error('Excel export error', e);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!summary) {
        alert('Ödeme planı verisi henüz yüklenmedi. Lütfen birkaç saniye sonra tekrar deneyin.');
        return;
      }

      await exportInstallmentPlanToPDF(educationInstallments, {
        studentName: studentName || 'Öğrenci',
        className:
          studentRecord?.class_name ||
          studentRecord?.class ||
          studentRecord?.section ||
          null,
        parentName: studentRecord?.parent_name || null,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
      });
    } catch (e: any) {
      alert(`PDF oluşturulurken bir hata oluştu: ${e?.message || 'Bilinmeyen hata'}`);
      // eslint-disable-next-line no-console
      console.error('PDF export error', e);
    }
  };

  // WhatsApp ile hatırlatma gönder
  const handleWhatsAppReminder = (installment?: FinanceInstallment) => {
    const phone = studentRecord?.parent_phone || studentRecord?.phone || '';
    if (!phone) {
      alert('Veli telefon numarası bulunamadı!');
      return;
    }

    // Telefon numarasını temizle
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.slice(1) : cleanPhone;

    let message = '';
    if (installment) {
      // Tek taksit için hatırlatma
      const amount = Number(installment.amount || 0) - Number(installment.paid_amount || 0);
      const dueDate = installment.due_date ? new Date(installment.due_date).toLocaleDateString('tr-TR') : '-';
      message = `Sayın ${studentRecord?.parent_name || 'Veli'},\n\n` +
        `${studentName} öğrencimizin ${installment.installment_no}. taksit ödemesi hakkında hatırlatma:\n\n` +
        `📅 Vade Tarihi: ${dueDate}\n` +
        `💰 Tutar: ₺${amount.toLocaleString('tr-TR')}\n\n` +
        `Ödemenizi en kısa sürede yapmanızı rica ederiz.\n\n` +
        `Saygılarımızla,\nAkademiHub`;
    } else {
      // Genel borç hatırlatması
      message = `Sayın ${studentRecord?.parent_name || 'Veli'},\n\n` +
        `${studentName} öğrencimizin ödeme durumu:\n\n` +
        `📊 Toplam Borç: ₺${total.toLocaleString('tr-TR')}\n` +
        `✅ Ödenen: ₺${paid.toLocaleString('tr-TR')}\n` +
        `⏳ Kalan: ₺${remaining.toLocaleString('tr-TR')}\n\n` +
        `Bekleyen ödemelerinizi en kısa sürede yapmanızı rica ederiz.\n\n` +
        `Saygılarımızla,\nAkademiHub`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // WhatsApp ile makbuz gönder
  const handleWhatsAppReceipt = (installment: FinanceInstallment) => {
    const phone = studentRecord?.parent_phone || studentRecord?.phone || '';
    shareReceiptViaWhatsApp(installment, studentName, phone);
  };

  // WhatsApp ile taksit planı gönder
  const handleWhatsAppPlan = () => {
    const phone = studentRecord?.parent_phone || studentRecord?.phone || '';
    shareInstallmentPlanViaWhatsApp(studentName, educationInstallments, total, paid, phone);
  };

  // Ödeme geçmişi verileri
  const paidInstallments = educationInstallments
    .filter(it => it.is_paid || Number(it.paid_amount || 0) > 0)
    .sort((a, b) => {
      const aDate = a.paid_at || a.due_date || '';
      const bDate = b.paid_at || b.due_date || '';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  // Gecikmiş taksitler
  const overdueInstallments = educationInstallments.filter(it => {
    if (it.is_paid) return false;
    if (!it.due_date) return false;
    return new Date(it.due_date) < new Date();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="mx-auto flex w-full max-w-[95%] items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Öğrenci Ödemeleri</h1>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 transition-colors"
          >
            Geri
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[95%] space-y-6 px-4 py-6">
        {/* Öğrenci kartı + finans özeti */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <StudentInfoCard
            studentId={studentId}
            fullName={studentName || 'Öğrenci'}
            className={studentRecord?.class_name || studentRecord?.class || null}
            branch={studentRecord?.branch || studentRecord?.section || null}
            contractNumber={studentRecord?.contract_number || null}
            parentName={studentRecord?.parent_name || null}
            parentPhone={studentRecord?.parent_phone || null}
            notes={studentRecord?.notes || null}
          />
          <FinanceSummaryCard
            total={total}
            paid={paid}
            remaining={remaining}
            overdueDays={overdueDays}
            onRestructure={isRealStudent ? () => setRestructureOpen(true) : undefined}
            onAddInstallment={isRealStudent ? () => setAddInstallmentOpen(true) : undefined}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
        </div>

        {/* Hızlı İşlem Butonları */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleWhatsAppReminder()}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            <span>WhatsApp Hatırlatma</span>
          </button>

          <button
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm font-medium ${
              showPaymentHistory 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <History className="w-5 h-5" />
            <span>Ödeme Geçmişi ({paidInstallments.length})</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium"
          >
            <FileText className="w-5 h-5" />
            <span>Sayfa PDF İndir</span>
          </button>

          <button
            onClick={handleWhatsAppPlan}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-all shadow-sm font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Taksit Planını WhatsApp ile Gönder</span>
          </button>

          {overdueInstallments.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{overdueInstallments.length} Gecikmiş Taksit</span>
            </div>
          )}
        </div>

        {/* Ödeme Geçmişi Bölümü */}
        {showPaymentHistory && paidInstallments.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-purple-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                Ödeme Geçmişi
              </h3>
              <p className="text-sm text-gray-500 mt-1">Yapılan tüm ödemelerin kronolojik listesi</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Taksit</th>
                    <th className="px-4 py-3 text-left font-medium">Vade Tarihi</th>
                    <th className="px-4 py-3 text-left font-medium">Ödeme Tarihi</th>
                    <th className="px-4 py-3 text-right font-medium">Planlanan</th>
                    <th className="px-4 py-3 text-right font-medium">Ödenen</th>
                    <th className="px-4 py-3 text-center font-medium">Durum</th>
                    <th className="px-4 py-3 text-left font-medium">Ödeme Yöntemi</th>
                    <th className="px-4 py-3 text-center font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paidInstallments.map((inst, idx) => {
                    const planned = Number(inst.amount || 0);
                    const paidAmt = Number(inst.paid_amount || 0);
                    const isFullyPaid = inst.is_paid || paidAmt >= planned;
                    
                    return (
                      <tr key={inst.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {inst.installment_no ? `T${inst.installment_no}` : `#${idx + 1}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {inst.due_date ? new Date(inst.due_date).toLocaleDateString('tr-TR') : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          ₺{planned.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          ₺{paidAmt.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <Clock className="w-3.5 h-3.5" />
                              Kısmi
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {inst.payment_method || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleReceipt(inst)}
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Makbuz"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleWhatsAppReminder(inst)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="WhatsApp"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">
                      Toplam Ödenen:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
                      ₺{paidInstallments.reduce((sum, it) => sum + Number(it.paid_amount || 0), 0).toLocaleString('tr-TR')}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {showPaymentHistory && paidInstallments.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700">Henüz Ödeme Yapılmadı</h3>
            <p className="text-sm text-gray-500 mt-1">Bu öğrenci için henüz kayıtlı bir ödeme bulunmuyor.</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-xl border bg-white shadow-sm">
          {!isRealStudent ? (
            <div className="p-6 text-sm text-gray-600">
              Bu öğrenci local/mock kayıttır. Ödeme ve taksit işlemleri yalnızca Supabase&apos;de kayıtlı
              gerçek öğrenciler (UUID ID&apos;li) için kullanılabilir.
            </div>
          ) : loading ? (
              <div className="p-6 text-center text-sm text-gray-600">Yükleniyor...</div>
          ) : error ? (
              <div className="p-6 text-sm text-red-600 text-center">{error}</div>
          ) : (
              <div className="space-y-6 p-4">
                {/* Eski Plan - Ödenmiş Taksitler */}
                <OldPaymentsTable
                  installments={educationInstallments.filter(
                    (it) => (it.is_old || !it.is_new) && it.is_paid,
                  )}
                  onEdit={handleOpenEdit}
                  onReceipt={handleReceipt}
                  onWhatsApp={handleWhatsAppReceipt}
                />

                {/* Yeni Taksit Planı */}
                <div className="mt-2">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Yeni Taksit Planı (Bekliyor)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Yapılandırma sonrası kalan borç için oluşturulan yeni taksitler.
                      </p>
                    </div>
                    <button
                      onClick={() => setRestructureOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Yeniden Taksitlendir
                    </button>
                  </div>
            <InstallmentTable
                    installments={educationInstallments.filter(
                      (it) => it.is_new || (!it.is_old && !it.is_paid),
                    )}
              onPay={(id) => {
                      const row = educationInstallments.find((x) => x.id === id);
                      if (row) handleOpenPay(row as FinanceInstallment);
              }}
                    onEdit={handleOpenEdit}
                    onReceipt={handleReceipt}
                    onWhatsApp={handleWhatsAppReceipt}
            />
                </div>
              </div>
          )}
          </div>
        </div>
      </div>

      {isRealStudent && (
        <>
          <PaymentCollectionModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            installment={selectedInstallment}
            studentName={studentName}
            onSuccess={fetchSummary}
          />

          <EditPaymentModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            installment={selectedInstallment}
            studentName={studentName}
            onSuccess={fetchSummary}
          />

          <RestructurePlanModal
            isOpen={restructureOpen}
            onClose={() => setRestructureOpen(false)}
            studentId={studentId}
            currentSummary={summary}
            onSuccess={fetchSummary}
          />

          <AddInstallmentModal
            open={addInstallmentOpen}
            onClose={() => setAddInstallmentOpen(false)}
            studentId={studentId}
            nextInstallmentNo={nextInstallmentNo}
            defaultDueDate={new Date().toISOString().slice(0, 10)}
            onSuccess={fetchSummary}
          />
        </>
      )}
    </div>
  );
}
