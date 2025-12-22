import React, { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, Calendar, TrendingUp, TrendingDown, FileText, Copy, CheckCircle, MessageCircle, Plus, User, Loader2, AlertTriangle, StickyNote, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/hooks/usePermission';
import toast from 'react-hot-toast';

interface Installment {
  id: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string;
  paid_amount?: number;
}

interface StudentNote {
  id: string;
  content: string;
  note_type: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export default function FinanceQuickViewDrawer({ isOpen, onClose, student }: Props) {
  const router = useRouter();
  const { canCollectPayment, canViewFinancialReports, isAdmin } = usePermission();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  // Risk hesaplaması için state
  const [riskData, setRiskData] = useState({
    score: 0,
    level: 'Düşük' as 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik',
    overdueCount: 0,
    totalDebt: 0,
    paidAmount: 0
  });

  // Fetch all data when drawer opens
  const fetchData = useCallback(async () => {
    if (!student?.id) return;
    
    setLoadingInstallments(true);
    setLoadingNotes(true);
    
    try {
      // Parallel fetch
      const [installmentsRes, notesRes] = await Promise.all([
        fetch(`/api/installments/student/${student.id}`),
        fetch(`/api/students/${student.id}/notes`)
      ]);
      
      const [installmentsData, notesData] = await Promise.all([
        installmentsRes.json(),
        notesRes.json()
      ]);
      
      // Process installments
      if (installmentsData.data) {
        const instData = installmentsData.data;
        setInstallments(instData.slice(0, 6));
        
        // Risk hesaplama
        const today = new Date().toISOString().slice(0, 10);
        let overdueCount = 0;
        let totalDebt = 0;
        let paidAmount = 0;
        
        instData.forEach((inst: Installment) => {
          const amount = Number(inst.amount) || 0;
          if (inst.is_paid) {
            paidAmount += amount;
          } else {
            totalDebt += amount;
            if (inst.due_date < today) {
              overdueCount++;
            }
          }
        });
        
        // Risk skoru hesapla (0-100)
        let score = 100;
        if (overdueCount > 0) score -= overdueCount * 15;
        if (totalDebt > 50000) score -= 20;
        else if (totalDebt > 20000) score -= 10;
        score = Math.max(0, Math.min(100, score));
        
        let level: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik' = 'Düşük';
        if (score < 30) level = 'Kritik';
        else if (score < 50) level = 'Yüksek';
        else if (score < 70) level = 'Orta';
        
        setRiskData({ score, level, overdueCount, totalDebt, paidAmount });
      }
      
      // Process notes
      if (notesData.data) {
        setNotes(notesData.data.slice(0, 5));
      }
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingInstallments(false);
      setLoadingNotes(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (isOpen && student?.id) {
      fetchData();
    }
  }, [isOpen, student?.id, fetchData]);

  if (!student) return null;

  // Calculate next payment from real data
  const today = new Date().toISOString().slice(0, 10);
  const pendingInstallments = installments.filter(i => !i.is_paid);
  const overdueInstallments = pendingInstallments.filter(i => i.due_date < today);
  const nextPaymentData = pendingInstallments[0];
  
  const nextPayment = nextPaymentData ? {
    date: new Date(nextPaymentData.due_date).toLocaleDateString('tr-TR'),
    amount: Number(nextPaymentData.amount) || 0,
    isOverdue: nextPaymentData.due_date < today
  } : { date: '-', amount: 0, isOverdue: false };

  const parentInfo = {
    name: student.parent_name || 'Veli Bilgisi Yok',
    phone: student.parent_phone || student.phone || '+90 XXX XXX XX XX',
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(parentInfo.phone);
    setCopiedPhone(true);
    toast.success('Telefon numarası kopyalandı');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Gerçek API'ye not kaydet
  const handleAddNote = async () => {
    if (!newNote.trim() || !student?.id) return;
    
    setSavingNote(true);
    try {
      const res = await fetch(`/api/students/${student.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote.trim(),
          note_type: 'general'
        })
      });
      
      const data = await res.json();
      if (data.success && data.data) {
        setNotes(prev => [data.data, ...prev]);
        setNewNote('');
        toast.success('Not eklendi');
      } else {
        toast.error(data.error || 'Not eklenemedi');
      }
    } catch (error) {
      toast.error('Not eklenemedi');
    } finally {
      setSavingNote(false);
    }
  };

  // Risk renk sınıfları
  const getRiskColors = (level: string) => {
    switch (level) {
      case 'Kritik': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' };
      case 'Yüksek': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' };
      case 'Orta': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' };
      default: return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' };
    }
  };
  
  const riskColors = getRiskColors(riskData.level);

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
                    {(student.first_name?.charAt(0) || student.full_name?.charAt(0) || 'Ö').toUpperCase()}
                    {(student.last_name?.charAt(0) || '').toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Name & Status Badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`}
                    </h2>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      student.status === 'deleted' 
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      <CheckCircle size={12} />
                      {student.status === 'deleted' ? 'Pasif' : 'Aktif'}
                    </span>
                  </div>
                  
                  {/* Secondary Info */}
                  <p className="text-sm text-gray-600 font-medium">
                    {student.class}{student.section ? `-${student.section}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    Öğrenci No: {student.student_no || '-'}
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
                  ₺{(riskData.totalDebt || student.debt || 0).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
                <p className="text-[10px] font-semibold text-emerald-700 uppercase">Ödenen</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">
                  ₺{riskData.paidAmount.toLocaleString('tr-TR')}
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

            {/* Parent Info Card */}
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

            {/* Quick Actions - Tüm butonlar aktif */}
            <div className="mb-6 space-y-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Hızlı İşlemler</h3>
              <div className="grid grid-cols-3 gap-2">
                {/* Ödeme Al - Finans sekmesine yönlendir */}
                <Link
                  href={`/students/${student.id}?tab=finance`}
                  onClick={onClose}
                  className="flex flex-col items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-md transition-all"
                >
                  <CreditCard size={18} />
                  Ödeme Al
                </Link>

                {/* Taksit Planı - Finans sekmesine yönlendir */}
                <Link
                  href={`/students/${student.id}?tab=finance`}
                  onClick={onClose}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                >
                  <Calendar size={18} />
                  Taksit Planı
                </Link>

                {/* Notlar - Notlar sekmesine yönlendir */}
                <Link
                  href={`/students/${student.id}?tab=notes`}
                  onClick={onClose}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                >
                  <StickyNote size={18} />
                  Notlar
                </Link>
              </div>
            </div>

            {/* Risk & Analysis - GERÇEK VERİ */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-bold text-gray-900 uppercase tracking-wide">Risk Analizi</h3>
              <div className={`rounded-xl border ${riskColors.border} ${riskColors.bg} p-4 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-gray-600">Ödeme Düzeni</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${riskColors.bg} ${riskColors.text} border ${riskColors.border}`}>
                    {riskData.level === 'Kritik' || riskData.level === 'Yüksek' ? (
                      <TrendingDown size={12} />
                    ) : (
                      <TrendingUp size={12} />
                    )}
                    {riskData.level === 'Düşük' ? 'Düzenli' : riskData.level}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Risk Skoru</span>
                      <span className={`font-bold ${riskColors.text}`}>{riskData.score}/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className={`h-full rounded-full ${riskColors.bar} shadow-sm transition-all`} 
                        style={{ width: `${riskData.score}%` }}
                      />
                    </div>
                  </div>
                  {riskData.overdueCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
                      <AlertTriangle size={14} />
                      <span>{riskData.overdueCount} gecikmiş taksit var</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini CRM / Notes Section - GERÇEK API */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Hızlı Notlar</h3>
                <Link 
                  href={`/students/${student.id}?tab=notes`}
                  onClick={onClose}
                  className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Tümünü Gör <ExternalLink size={10} />
                </Link>
              </div>
              
              {/* Add Note Input */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !savingNote && handleAddNote()}
                  placeholder="Hızlı not ekle..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={savingNote}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || savingNote}
                  className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingNote ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>

              {/* Notes List */}
              {loadingNotes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              ) : notes.length > 0 ? (
                <div className="space-y-2">
                  {notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-600">
                          {new Date(note.created_at).toLocaleDateString('tr-TR', { 
                            day: 'numeric', month: 'short', year: 'numeric' 
                          })}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          note.note_type === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                          note.note_type === 'reminder' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {note.note_type === 'payment' ? 'Ödeme' : 
                           note.note_type === 'reminder' ? 'Hatırlatma' : 'Genel'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-xs">
                  Henüz not eklenmemiş
                </div>
              )}
            </div>

             {/* Real Installments Table */}
             <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Taksit Durumu</h3>
                  <Link 
                    href={`/students/${student.id}?tab=finance`}
                    onClick={onClose}
                    className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Tümünü Gör <ExternalLink size={10} />
                  </Link>
                </div>
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
                            {installments.map((inst, idx) => {
                              const isOverdue = !inst.is_paid && inst.due_date < today;
                              return (
                                <tr key={inst.id || idx} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2 text-gray-600">
                                    {new Date(inst.due_date).toLocaleDateString('tr-TR')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      inst.is_paid 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : isOverdue
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {inst.is_paid ? '✓ Ödendi' : isOverdue ? '⚠ Gecikmiş' : '○ Bekliyor'}
                                    </span>
                                  </td>
                                  <td className={`px-3 py-2 text-right font-bold ${
                                    inst.is_paid ? 'text-emerald-600' : 'text-gray-900'
                                  }`}>
                                    ₺{(Number(inst.amount) || 0).toLocaleString('tr-TR')}
                                  </td>
                                </tr>
                              );
                            })}
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
            <Link
              href={`/students/${student.id}`}
              onClick={onClose}
              className="w-full rounded-lg bg-white border border-gray-200 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <User size={16} />
              Detaylı Profil Görüntüle
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
