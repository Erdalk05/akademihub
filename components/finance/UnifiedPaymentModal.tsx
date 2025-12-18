'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Book,
  Shirt,
  UtensilsCrossed,
  Pencil,
  Package,
  GraduationCap,
  Search,
  Check,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

// Ödeme türleri
const PAYMENT_CATEGORIES = [
  { 
    value: 'tuition', 
    label: 'Eğitim Taksiti', 
    icon: GraduationCap, 
    color: 'bg-emerald-500',
    description: 'Öğrenci kayıt taksitleri'
  },
  { 
    value: 'book', 
    label: 'Kitap Satışı', 
    icon: Book, 
    color: 'bg-blue-500',
    description: 'Ders ve yardımcı kitaplar'
  },
  { 
    value: 'meal', 
    label: 'Yemek Ücreti', 
    icon: UtensilsCrossed, 
    color: 'bg-orange-500',
    description: 'Yemek kartı, kantin'
  },
  { 
    value: 'stationery', 
    label: 'Kırtasiye', 
    icon: Pencil, 
    color: 'bg-green-500',
    description: 'Defter, kalem vb.'
  },
  { 
    value: 'uniform', 
    label: 'Üniforma', 
    icon: Shirt, 
    color: 'bg-purple-500',
    description: 'Okul kıyafetleri'
  },
  { 
    value: 'other', 
    label: 'Diğer', 
    icon: Package, 
    color: 'bg-gray-500',
    description: 'Diğer gelirler'
  },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit', icon: '💵' },
  { value: 'card', label: 'Kredi Kartı', icon: '💳' },
  { value: 'bank', label: 'Havale/EFT', icon: '🏦' },
];

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  student_no: string;
};

type Installment = {
  id: string;
  installment_no: number;
  amount: number;
  paid_amount: number;
  is_paid: boolean;
  due_date: string;
};

interface UnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedStudent?: Student | null;
  preSelectedCategory?: string;
}

export default function UnifiedPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedStudent = null,
  preSelectedCategory = ''
}: UnifiedPaymentModalProps) {
  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState(preSelectedCategory || '');
  
  // Student selection
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(preSelectedStudent);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  
  // Installments (for tuition)
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  
  // Payment details
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBackdatedPayment, setIsBackdatedPayment] = useState(false);
  
  // Loading
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedCategory(preSelectedCategory || '');
      setSelectedStudent(preSelectedStudent);
      setStudentSearch(preSelectedStudent ? `${preSelectedStudent.first_name} ${preSelectedStudent.last_name}` : '');
      setAmount('');
      setTitle('');
      setPaymentMethod('cash');
      setNotes('');
      setSelectedInstallment(null);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsBackdatedPayment(false);
    }
  }, [isOpen, preSelectedCategory, preSelectedStudent]);
  
  // Tarih değişikliği kontrolü
  const handleDateChange = (newDate: string) => {
    setPaymentDate(newDate);
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    setIsBackdatedPayment(selectedDate < today);
  };

  // Fetch students
  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const res = await fetch('/api/students');
          const json = await res.json();
          if (json.data) {
            setStudents(json.data.filter((s: Student & { status?: string }) => s.status !== 'deleted'));
          }
        } catch (e) {
          console.error('Students fetch error:', e);
        }
      })();
    }
  }, [isOpen]);

  // Fetch installments when student is selected and category is tuition
  useEffect(() => {
    if (selectedStudent && selectedCategory === 'tuition') {
      setLoading(true);
      (async () => {
        try {
          const res = await fetch(`/api/installments?studentId=${selectedStudent.id}`);
          const json = await res.json();
          if (json.success && json.data) {
            const unpaid = json.data.filter((i: Installment) => !i.is_paid);
            setInstallments(unpaid);
          }
        } catch (e) {
          console.error('Installments fetch error:', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [selectedStudent, selectedCategory]);

  // Filtered students
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(studentSearch.toLowerCase()) || 
           s.student_no?.toLowerCase().includes(studentSearch.toLowerCase());
  }).slice(0, 8);

  // Handle category select
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStep(2);
  };

  // Handle student select
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowStudentDropdown(false);
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === 2) {
      if (selectedCategory === 'tuition') {
        // Tuition needs installment selection
        if (!selectedStudent) {
          toast.error('Lütfen öğrenci seçin');
          return;
        }
        if (!selectedInstallment) {
          toast.error('Lütfen taksit seçin');
          return;
        }
        setAmount(String(Number(selectedInstallment.amount) - Number(selectedInstallment.paid_amount)));
      } else {
        // Other income
        if (!title.trim()) {
          toast.error('Lütfen başlık girin');
          return;
        }
        if (!amount || Number(amount) <= 0) {
          toast.error('Lütfen geçerli tutar girin');
          return;
        }
      }
      setStep(3);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    setSaving(true);
    
    // Seçilen tarihi hazırla
    const selectedPaymentDate = new Date(paymentDate);
    selectedPaymentDate.setHours(12, 0, 0, 0);
    const paymentNotes = notes + (isBackdatedPayment ? ' [Geçmiş tarihli ödeme]' : '');
    
    try {
      if (selectedCategory === 'tuition' && selectedInstallment) {
        // Pay tuition installment
        const res = await fetch('/api/installments/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installmentId: selectedInstallment.id,
            amount: Number(amount),
            paymentMethod,
            notes: paymentNotes,
            payment_date: selectedPaymentDate.toISOString()
          })
        });
        
        const json = await res.json();
        if (json.success) {
          toast.success('Taksit ödemesi alındı');
          onSuccess?.();
          onClose();
        } else {
          toast.error(json.error || 'Ödeme alınamadı');
        }
      } else {
        // Add other income
        const res = await fetch('/api/finance/other-income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent?.id || null,
            title,
            category: selectedCategory,
            amount: Number(amount),
            payment_type: paymentMethod,
            notes: paymentNotes,
            date: selectedPaymentDate.toISOString()
          })
        });
        
        const json = await res.json();
        if (json.success) {
          toast.success('Gelir kaydı oluşturuldu');
          onSuccess?.();
          onClose();
        } else {
          toast.error(json.error || 'Kayıt oluşturulamadı');
        }
      }
    } catch (e) {
      console.error('Payment error:', e);
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ödeme Al</h2>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Ödeme türünü seçin'}
                {step === 2 && 'Detayları girin'}
                {step === 3 && 'Onaylayın'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s ? <Check size={16} /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PAYMENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`p-4 rounded-xl border-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50 ${
                      selectedCategory === cat.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-2`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <p className="font-medium text-slate-900 text-sm">{cat.label}</p>
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Student Selection (for all except tuition, optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {selectedCategory === 'tuition' ? 'Öğrenci Seçin *' : 'Öğrenci (Opsiyonel)'}
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                      if (!e.target.value) setSelectedStudent(null);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Öğrenci ara..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  
                  {showStudentDropdown && studentSearch && filteredStudents.length > 0 && !selectedStudent && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredStudents.map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <p className="font-medium text-slate-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{student.student_no}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tuition: Installment Selection */}
              {selectedCategory === 'tuition' && selectedStudent && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Taksit Seçin *</label>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-emerald-600" />
                    </div>
                  ) : installments.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">Ödenmemiş taksit bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {installments.map((inst) => {
                        const remaining = Number(inst.amount) - Number(inst.paid_amount);
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => setSelectedInstallment(inst)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition ${
                              selectedInstallment?.id === inst.id
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{inst.installment_no}. Taksit</p>
                                <p className="text-xs text-slate-500">
                                  Vade: {inst.due_date ? new Date(inst.due_date).toLocaleDateString('tr-TR') : '-'}
                                </p>
                              </div>
                              <p className="font-bold text-emerald-600">₺{remaining.toLocaleString('tr-TR')}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Other Income: Title & Amount */}
              {selectedCategory !== 'tuition' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Başlık *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn: Matematik Kitabı"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tutar (₺) *</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-bold"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium text-slate-900 mb-3">Ödeme Özeti</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tür:</span>
                    <span className="font-medium">{PAYMENT_CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
                  </div>
                  {selectedStudent && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Öğrenci:</span>
                      <span className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                    </div>
                  )}
                  {selectedCategory === 'tuition' && selectedInstallment && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taksit:</span>
                      <span className="font-medium">{selectedInstallment.installment_no}. Taksit</span>
                    </div>
                  )}
                  {selectedCategory !== 'tuition' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Başlık:</span>
                      <span className="font-medium">{title}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-900 font-medium">Tutar:</span>
                    <span className="text-xl font-bold text-emerald-600">₺{Number(amount).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Ödeme Tarihi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    Ödeme Tarihi
                  </span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none ${
                    isBackdatedPayment 
                      ? 'border-orange-400 bg-orange-50' 
                      : 'border-slate-200'
                  }`}
                />
                {isBackdatedPayment && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 flex items-center gap-1.5">
                      <Clock size={14} />
                      <span><strong>Geçmiş tarihli ödeme:</strong> Bu ödeme {new Date(paymentDate).toLocaleDateString('tr-TR')} tarihine kaydedilecek.</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ödeme Yöntemi</label>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        paymentMethod === pm.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{pm.icon}</span>
                      <p className="text-xs font-medium text-slate-700 mt-1">{pm.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Not (Opsiyonel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ek açıklama..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2) : onClose()}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition"
          >
            {step === 1 ? 'İptal' : 'Geri'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              İleri
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {saving ? 'İşleniyor...' : 'Ödemeyi Onayla'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

