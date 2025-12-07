'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, User, Users, GraduationCap, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

interface StudentData {
  id: string;
  student_no: string;
  first_name: string;
  last_name: string;
  tc_id?: string;
  birth_date?: string;
  gender?: string;
  blood_type?: string;
  phone?: string;
  email?: string;
  class?: string;
  section?: string;
  branch?: string;
  city?: string;
  district?: string;
  address?: string;
  health_notes?: string;
  previous_school?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_occupation?: string;
  parent_address?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
}

export default function StudentEditPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'education'>('student');

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (!response.ok) {
        // Fallback to list
        const listRes = await fetch('/api/students');
        const listData = await listRes.json();
        const found = (listData.data || []).find((s: any) => s.id === studentId);
        if (!found) throw new Error('Öğrenci bulunamadı');
        setStudent(found);
      } else {
        const data = await response.json();
        setStudent(data.data || data);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!student) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Öğrenci bilgileri güncellendi!');
        router.push(`/students/${studentId}`);
      } else {
        toast.error(data.error || 'Güncelleme hatası');
      }
    } catch (error: any) {
      toast.error('Güncelleme hatası: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof StudentData, value: string) => {
    if (!student) return;
    setStudent({ ...student, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Öğrenci Bulunamadı</h2>
        <Link href="/students" className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700">
          Öğrenci Listesine Dön
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'student', label: 'Öğrenci Bilgileri', icon: User },
    { id: 'parent', label: 'Veli Bilgileri', icon: Users },
    { id: 'education', label: 'Eğitim Bilgileri', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/students/${studentId}`}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Öğrenci Düzenle</h1>
                <p className="text-sm text-slate-500">
                  {student.first_name} {student.last_name} - #{student.student_no}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all border-b-2 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          
          {/* Öğrenci Bilgileri */}
          {activeTab === 'student' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Kişisel Bilgiler
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ad *</label>
                  <input
                    type="text"
                    value={student.first_name || ''}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Soyad *</label>
                  <input
                    type="text"
                    value={student.last_name || ''}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">TC Kimlik No</label>
                  <input
                    type="text"
                    value={student.tc_id || ''}
                    onChange={(e) => handleChange('tc_id', e.target.value)}
                    maxLength={11}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ModernDatePicker
                  label="Doğum Tarihi"
                  value={student.birth_date || ''}
                  onChange={(date) => handleChange('birth_date', date)}
                  minYear={1990}
                  maxYear={2025}
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cinsiyet</label>
                  <select
                    value={student.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Seçiniz</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kız</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kan Grubu</label>
                  <select
                    value={student.blood_type || ''}
                    onChange={(e) => handleChange('blood_type', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Seçiniz</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="0+">0+</option>
                    <option value="0-">0-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={student.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <Mail className="w-4 h-4 inline mr-1" />
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={student.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">İl</label>
                  <input
                    type="text"
                    value={student.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">İlçe</label>
                  <input
                    type="text"
                    value={student.district || ''}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Durum</label>
                  <select
                    value={student.status || 'active'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="graduated">Mezun</option>
                    <option value="suspended">Donduruldu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Adres
                </label>
                <textarea
                  value={student.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sağlık Notları</label>
                <textarea
                  value={student.health_notes || ''}
                  onChange={(e) => handleChange('health_notes', e.target.value)}
                  rows={2}
                  placeholder="Alerji, kronik hastalık, kullanılan ilaçlar..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Veli Bilgileri */}
          {activeTab === 'parent' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Veli Bilgileri
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Veli Ad Soyad</label>
                  <input
                    type="text"
                    value={student.parent_name || ''}
                    onChange={(e) => handleChange('parent_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meslek</label>
                  <input
                    type="text"
                    value={student.parent_occupation || ''}
                    onChange={(e) => handleChange('parent_occupation', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={student.parent_phone || ''}
                    onChange={(e) => handleChange('parent_phone', e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <Mail className="w-4 h-4 inline mr-1" />
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={student.parent_email || ''}
                    onChange={(e) => handleChange('parent_email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Veli Adresi
                </label>
                <textarea
                  value={student.parent_address || ''}
                  onChange={(e) => handleChange('parent_address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none uppercase"
                />
              </div>
            </div>
          )}

          {/* Eğitim Bilgileri */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Eğitim Bilgileri
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sınıf</label>
                  <select
                    value={student.class || ''}
                    onChange={(e) => handleChange('class', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Seçiniz</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Şube</label>
                  <select
                    value={student.section || ''}
                    onChange={(e) => handleChange('section', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Seçiniz</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Program/Branş</label>
                  <input
                    type="text"
                    value={student.branch || ''}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    placeholder="LGS Hazırlık, YKS vb."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Önceki Okul</label>
                <input
                  type="text"
                  value={student.previous_school || ''}
                  onChange={(e) => handleChange('previous_school', e.target.value)}
                  placeholder="Geldiği okul adı"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

