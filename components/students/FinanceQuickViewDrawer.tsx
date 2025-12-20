import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, TrendingUp, FileText, Copy, CheckCircle, MessageCircle, Plus, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/hooks/usePermission';

interface Installment {
  id: string;
  due_date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_date?: string;
  paid_amount?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export default function FinanceQuickViewDrawer({ isOpen, onClose, student }: Props) {
  const router = useRouter();
  const { canCollectPayment, canViewFinancialReports } = usePermission();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [notes, setNotes] = useState([
    { id: 1, date: '15 Kas 2023', text: 'Veli arandı, taksit ödemesini önümüzdeki hafta yapacak.' },
    { id: 2, date: '10 Kas 2023', text: 'Risk analizi güncellendi - düzenli ödeme yapıyor.' },
  ]);

  // Fetch installments when drawer opens
  useEffect(() => {
    if (isOpen && student?.id) {
      fetchInstallments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, student?.id]);

  const fetchInstallments = async () => {
    if (!student?.id) return;
    
    setLoadingInstallments(true);
    try {
      const res = await fetch(`/api/installments?studentId=${student.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setInstallments(data.data.slice(0, 5));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch installments:', error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  if (!student) return null;

  // Calculate next payment from real data
  const pendingInstallments = installments.filter(i => i.status === 'pending' || i.status === 'overdue');
  const nextPaymentData = pendingInstallments[0];
  const nextPayment = nextPaymentData ? {
    date: new Date(nextPaymentData.due_date).toLocaleDateString('tr-TR'),
    amount: nextPaymentData.amount,
    isOverdue: nextPaymentData.status === 'overdue' || new Date(nextPaymentData.due_date) < new Date()
  } : { date: '-', amount: 0, isOverdue: false };

  const parentInfo = {
    name: student.parent_name || 'Veli Bilgisi Yok',
    phone: student.parent_phone || '+90 XXX XXX XX XX',
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(parentInfo.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    setNotes(prev => [{
      id: Date.now(),
      date: today,
      text: newNote.trim()
    }, ...prev]);
    setNewNote('');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Enhanced Header with Avatar */}
          <div className="border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50 px-6 py-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Large Avatar */}
                <div className="h-16 w-16 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(student.first_name?.charAt(0) || 'Ö').toUpperCase()}
                    {(student.last_name?.charAt(0) || 'G').toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Name & Status Badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle size={12} />
                      Aktif
                    </span>
                  </div>
                  
                  {/* Secondary Info */}
                  <p className="text-sm text-gray-600 font-medium">
                    {student.class}-{student.section}
                  </p>
                  <p className="text-xs text-gray-500">
                    Öğrenci No: {student.student_no || 'Yok'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-white/60 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Finance Summary with Next Payment */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Toplam Borç</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  ₺{student.debt?.toLocaleString('tr-TR') || '0'}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
                <p className="text-[10px] font-semibold text-emerald-700 uppercase">Ödenen</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">
                  ₺{student.paid?.toLocaleString('tr-TR') || '0'}
                </p>
              </div>
              <div className={`rounded-xl border p-3 shadow-sm ${
                nextPayment.isOverdue 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-amber-200 bg-amber-50'
              }`}>
                <p className={`text-[10px] font-semibold uppercase ${
                  nextPayment.isOverdue ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {nextPayment.isOverdue ? 'Gecikmiş!' : 'Sonraki'}
                </p>
                <p className={`mt-1 text-lg font-bold ${
                  nextPayment.isOverdue ? 'text-red-700' : 'text-amber-700'
                }`}>
                  ₺{nextPayment.amount.toLocaleString('tr-TR')}
                </p>
                <p className={`text-[10px] mt-0.5 ${
                  nextPayment.isOverdue ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {nextPayment.date}
                </p>
              </div>
            </div>

            {/* Parent Info Card (Replaces "Veli İletişim" Button) */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Veli Bilgileri</h3>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{parentInfo.name}</p>
                      <p className="text-xs text-gray-600">{parentInfo.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/${parentInfo.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                  
                  {/* Copy Phone Button */}
                  <button
                    onClick={handleCopyPhone}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                      copiedPhone
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {copiedPhone ? (
                      <>
                        <CheckCircle size={14} />
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Telefonu Kopyala
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 space-y-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Hızlı İşlemler</h3>
              <div className="grid grid-cols-3 gap-2">
                {/* Ödeme Al */}
                <button
                  type="button"
                  onClick={() => {
                    if (!student?.id) return;
                    router.push(`/students/${student.id}/payments`);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-md transition-all"
                >
                  <CreditCard size={18} />
                  Ödeme Al
                </button>

                {/* Taksit Planı */}
                <Link
                  href={`/students/${student.id}?tab=finance`}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                >
                  <Calendar size={18} />
                  Taksit Planı
                </Link>

                {/* Makbuzlar */}
                <button
                  type="button"
                  onClick={() => {
                    if (!student?.id) return;
                    router.push(`/students/${student.id}/payments`);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                >
                  <FileText size={18} />
                  Makbuzlar
                </button>
              </div>
            </div>

            {/* Risk & Analysis */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Risk Analizi</h3>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-gray-600">Ödeme Düzeni</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <TrendingUp size={12} />
                    Düzenli
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Risk Skoru</span>
                      <span className="font-bold text-emerald-600">95/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini CRM / Notes Section */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Hızlı Notlar</h3>
              
              {/* Add Note Input */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Not ekle..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-2">
                {notes.slice(0, 2).map((note) => (
                  <div key={note.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-[10px] font-bold text-indigo-600">{note.date}</span>
                    </div>
                    <p className="text-xs text-gray-700">{note.text}</p>
                  </div>
                ))}
              </div>
              
              {notes.length > 2 && (
                <button
                  onClick={() => router.push(`/students/${student.id}`)}
                  className="mt-2 w-full text-center text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Tüm notları görüntüle ({notes.length})
                </button>
              )}
            </div>

             {/* Real Installments Table */}
             <div>
                <h3 className="mb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Taksit Durumu</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  {loadingInstallments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  ) : installments.length > 0 ? (
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px]">Tarih</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px]">Durum</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-500 text-[10px]">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {installments.map((inst, idx) => (
                              <tr key={inst.id || idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2 text-gray-600">
                                  {new Date(inst.due_date).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    inst.status === 'paid' 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : inst.status === 'overdue'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {inst.status === 'paid' ? '✓ Ödendi' : inst.status === 'overdue' ? '⚠ Gecikmiş' : '○ Bekliyor'}
                                  </span>
                                </td>
                                <td className={`px-3 py-2 text-right font-bold ${
                                  inst.status === 'paid' ? 'text-emerald-600' : 'text-gray-900'
                                }`}>
                                  ₺{inst.amount?.toLocaleString('tr-TR') || '0'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-xs">
                      Taksit bilgisi bulunamadı
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <button
                onClick={() => window.location.href = `/students/${student.id}`}
                className="w-full rounded-lg bg-white border border-gray-200 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Detaylı Profil Görüntüle
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

