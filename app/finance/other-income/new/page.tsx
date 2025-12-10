'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Book,
  Shirt,
  UtensilsCrossed,
  Pencil,
  Package,
  User,
  Calendar,
  CreditCard,
  FileText,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// Kategori tanımları
const CATEGORIES = [
  { value: 'book', label: 'Kitap', icon: Book, color: 'bg-blue-500', description: 'Ders kitabı, yardımcı kitap vb.' },
  { value: 'uniform', label: 'Üniforma', icon: Shirt, color: 'bg-purple-500', description: 'Okul kıyafetleri' },
  { value: 'meal', label: 'Yemek', icon: UtensilsCrossed, color: 'bg-orange-500', description: 'Yemek ücreti, kantin' },
  { value: 'stationery', label: 'Kırtasiye', icon: Pencil, color: 'bg-green-500', description: 'Defter, kalem vb.' },
  { value: 'other', label: 'Diğer', icon: Package, color: 'bg-gray-500', description: 'Diğer gelirler' },
];

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Nakit', icon: '💵' },
  { value: 'card', label: 'Kredi Kartı', icon: '💳' },
  { value: 'bank', label: 'Havale/EFT', icon: '🏦' },
  { value: 'other', label: 'Diğer', icon: '📋' },
];

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  student_no: string;
};

export default function NewOtherIncomePage() {
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('book');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  
  // Students for dropdown
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Loading
  const [saving, setSaving] = useState(false);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const json = await res.json();
        if (json.data) {
          setStudents(json.data.filter((s: Student & { status?: string }) => s.status !== 'deleted'));
        }
      } catch (error) {
        console.error('Students fetch error:', error);
      }
    };
    fetchStudents();
  }, []);

  // Filtered students
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(studentSearch.toLowerCase()) || 
           s.student_no?.toLowerCase().includes(studentSearch.toLowerCase());
  }).slice(0, 10);

  // Handle student select
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setStudentId(student.id);
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowStudentDropdown(false);
  };

  // Clear student
  const clearStudent = () => {
    setSelectedStudent(null);
    setStudentId(null);
    setStudentSearch('');
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Başlık zorunludur');
      return;
    }
    
    if (!amount || Number(amount) <= 0) {
      toast.error('Geçerli bir tutar giriniz');
      return;
    }
    
    setSaving(true);
    
    try {
      const res = await fetch('/api/finance/other-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          amount: Number(amount),
          payment_type: paymentType,
          date: new Date(date).toISOString(),
          notes: notes.trim() || null,
          student_id: studentId
        })
      });
      
      const json = await res.json();
      
      if (json.success) {
        toast.success('Gelir kaydı oluşturuldu');
        router.push('/finance/other-income');
      } else {
        toast.error(json.error || 'Kayıt oluşturulamadı');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/finance/other-income"
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Yeni Gelir Ekle</h1>
            <p className="text-slate-500 text-sm">Kitap, kırtasiye, yemek veya diğer gelir kaydı</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Kategori Seçimi */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Kategori Seçin
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      category === cat.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      <CatIcon size={20} className="text-white" />
                    </div>
                    <p className="font-medium text-sm text-slate-900">{cat.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Başlık ve Tutar */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Başlık / Açıklama
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Matematik Kitabı, Yemek Kartı Yüklemesi..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  💰 Tutar (₺)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-bold"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Tarih
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Ödeme Türü */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <CreditCard size={14} className="inline mr-1" />
              Ödeme Türü
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PAYMENT_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPaymentType(pt.value)}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    paymentType === pt.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{pt.icon}</span>
                  <p className="text-xs font-medium text-slate-700">{pt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Öğrenci Seçimi (Opsiyonel) */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User size={14} className="inline mr-1" />
              Öğrenci (Opsiyonel)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Geliri belirli bir öğrenciye bağlamak için seçin
            </p>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setShowStudentDropdown(true);
                  if (!e.target.value) clearStudent();
                }}
                onFocus={() => setShowStudentDropdown(true)}
                placeholder="Öğrenci ara..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
              
              {selectedStudent && (
                <button
                  type="button"
                  onClick={clearStudent}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
              
              {showStudentDropdown && studentSearch && filteredStudents.length > 0 && !selectedStudent && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
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

          {/* Notlar */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📝 Notlar (Opsiyonel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek açıklama veya notlar..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link
              href="/finance/other-income"
              className="px-6 py-3 text-slate-600 hover:text-slate-900 transition"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

