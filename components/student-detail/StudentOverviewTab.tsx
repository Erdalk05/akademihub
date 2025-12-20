'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Users, GraduationCap, FileText, 
  Phone, Mail, MapPin, Calendar, Hash, Heart, Globe,
  Building, Briefcase, Wallet, CheckCircle,
  BookOpen, Award, Save, X, Edit3, Loader2,
  CreditCard, PiggyBank, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRole } from '@/lib/contexts/RoleContext';

interface Props {
  student: any;
  onRefresh?: () => void;
}

type TabType = 'student' | 'guardian' | 'education' | 'contract';

// Editable Input Component
const EditableField = ({ 
  label, 
  value, 
  field,
  icon: Icon, 
  type = 'text',
  options,
  isEditing,
  onChange,
  placeholder
}: { 
  label: string; 
  value: any; 
  field: string;
  icon?: React.ElementType;
  type?: 'text' | 'date' | 'email' | 'tel' | 'select' | 'textarea' | 'number';
  options?: { value: string; label: string }[];
  isEditing: boolean;
  onChange: (field: string, value: any) => void;
  placeholder?: string;
}) => {
  const displayValue = value || '-';
  
  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all group">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{displayValue}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4 transition-all">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <label className="text-xs text-blue-600 uppercase tracking-wide font-bold mb-1 block">{label}</label>
          
          {type === 'select' && options ? (
            <select
              value={value || ''}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Seçiniz</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder || label}
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
              placeholder={placeholder || label}
              className="w-full px-3 py-2 text-sm border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function StudentOverviewTab({ student, onRefresh }: Props) {
  const { currentUser, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>('student');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Student verisi değiştiğinde form datasını güncelle
  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    }
  }, [student]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Bu işlem için admin yetkisi gereklidir.');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || '',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Güncelleme başarısız');
      }

      toast.success('Öğrenci bilgileri başarıyla güncellendi!');
      setIsEditing(false);
      onRefresh?.();
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...student });
    setIsEditing(false);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '-';
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  const tabs = [
    { id: 'student' as TabType, label: 'Öğrenci', icon: User, color: 'emerald' },
    { id: 'guardian' as TabType, label: 'Veli', icon: Users, color: 'blue' },
    { id: 'education' as TabType, label: 'Eğitim & Ödeme', icon: GraduationCap, color: 'purple' },
    { id: 'contract' as TabType, label: 'Sözleşme', icon: FileText, color: 'orange' },
  ];

  const getTabColor = (tabId: TabType, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      emerald: { active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200', inactive: 'bg-white text-gray-600 hover:bg-emerald-50' },
      blue: { active: 'bg-blue-500 text-white shadow-lg shadow-blue-200', inactive: 'bg-white text-gray-600 hover:bg-blue-50' },
      purple: { active: 'bg-purple-500 text-white shadow-lg shadow-purple-200', inactive: 'bg-white text-gray-600 hover:bg-purple-50' },
      orange: { active: 'bg-orange-500 text-white shadow-lg shadow-orange-200', inactive: 'bg-white text-gray-600 hover:bg-orange-50' },
    };
    const tab = tabs.find(t => t.id === tabId);
    return colors[tab?.color || 'emerald'][isActive ? 'active' : 'inactive'];
  };

  const genderOptions = [
    { value: 'male', label: 'Erkek' },
    { value: 'female', label: 'Kız' },
  ];

  const bloodTypeOptions = [
    { value: 'A+', label: 'A Rh+' },
    { value: 'A-', label: 'A Rh-' },
    { value: 'B+', label: 'B Rh+' },
    { value: 'B-', label: 'B Rh-' },
    { value: 'AB+', label: 'AB Rh+' },
    { value: 'AB-', label: 'AB Rh-' },
    { value: '0+', label: '0 Rh+' },
    { value: '0-', label: '0 Rh-' },
  ];

  const relationOptions = [
    { value: 'anne', label: 'Anne' },
    { value: 'baba', label: 'Baba' },
    { value: 'vasi', label: 'Vasi' },
    { value: 'diger', label: 'Diğer' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Pasif' },
    { value: 'graduated', label: 'Mezun' },
    { value: 'suspended', label: 'Donduruldu' },
  ];

  return (
    <div className="space-y-6">
      {/* Başlık & Düzenleme Butonu */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Öğrenci Kartı</h2>
              <p className="text-emerald-100 text-sm">
                {formData?.full_name || `${formData?.first_name || ''} ${formData?.last_name || ''}`} • {formData?.student_no}
              </p>
            </div>
          </div>
          
          {/* Düzenleme Butonları */}
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-all backdrop-blur"
              >
                <Edit3 className="w-4 h-4" />
                Düzenle
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-sm transition-all"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-sm transition-all shadow-lg"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Düzenleme Modu Göstergesi */}
        {isEditing && (
          <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur">
            <p className="text-sm text-emerald-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              <span className="font-medium">Düzenleme Modu:</span> Bilgileri güncelleyip &quot;Kaydet&quot; butonuna basın
            </p>
          </div>
        )}
      </div>

      {/* Horizontal Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${getTabColor(tab.id, activeTab === tab.id)}`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6 min-h-[400px]">
        
        {/* ÖĞRENCİ BİLGİLERİ */}
        {activeTab === 'student' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Öğrenci Bilgileri</h3>
                <p className="text-sm text-gray-500">Kişisel ve iletişim bilgileri</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField 
                label="Ad" 
                value={formData?.first_name} 
                field="first_name"
                icon={User} 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Soyad" 
                value={formData?.last_name} 
                field="last_name"
                icon={User} 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="TC Kimlik No" 
                value={formData?.tc_id} 
                field="tc_id"
                icon={Hash} 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Öğrenci No" 
                value={formData?.student_no} 
                field="student_no"
                icon={Hash} 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Sınıf" 
                value={formData?.class} 
                field="class"
                icon={GraduationCap} 
                isEditing={isEditing}
                onChange={handleChange}
                placeholder="Örn: 11. Sınıf"
              />
              <EditableField 
                label="Şube" 
                value={formData?.section} 
                field="section"
                icon={GraduationCap} 
                isEditing={isEditing}
                onChange={handleChange}
                placeholder="Örn: A"
              />
              <EditableField 
                label="Doğum Tarihi" 
                value={formData?.birth_date?.split('T')[0]} 
                field="birth_date"
                icon={Calendar} 
                type="date"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Doğum Yeri" 
                value={formData?.birth_place} 
                field="birth_place"
                icon={MapPin} 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Cinsiyet" 
                value={formData?.gender} 
                field="gender"
                icon={User} 
                type="select"
                options={genderOptions}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Kan Grubu" 
                value={formData?.blood_type} 
                field="blood_type"
                icon={Heart} 
                type="select"
                options={bloodTypeOptions}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Uyruk" 
                value={formData?.nationality} 
                field="nationality"
                icon={Globe} 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Telefon" 
                value={formData?.phone} 
                field="phone"
                icon={Phone}
                type="tel" 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="E-posta" 
                value={formData?.email} 
                field="email"
                icon={Mail}
                type="email" 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Durum" 
                value={formData?.status} 
                field="status"
                icon={CheckCircle} 
                type="select"
                options={statusOptions}
                isEditing={isEditing}
                onChange={handleChange}
              />
            </div>

            {/* Adres Bilgileri */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Adres Bilgileri
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField 
                  label="İl" 
                  value={formData?.city} 
                  field="city"
                  icon={MapPin} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="İlçe" 
                  value={formData?.district} 
                  field="district"
                  icon={MapPin} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <div className="sm:col-span-2 lg:col-span-1">
                  <EditableField 
                    label="Adres" 
                    value={formData?.address} 
                    field="address"
                    icon={MapPin}
                    type="textarea" 
                    isEditing={isEditing}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Ek Bilgiler */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-500" />
                Ek Bilgiler
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditableField 
                  label="Önceki Okul" 
                  value={formData?.previous_school} 
                  field="previous_school"
                  icon={Building} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Sağlık Notları" 
                  value={formData?.health_notes} 
                  field="health_notes"
                  icon={Heart}
                  type="textarea" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* VELİ BİLGİLERİ */}
        {activeTab === 'guardian' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Veli Bilgileri</h3>
                <p className="text-sm text-gray-500">Veli ve acil durum iletişim bilgileri</p>
              </div>
            </div>

            {/* Birinci Veli */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                1. Veli (Birincil İletişim)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField 
                  label="Ad Soyad" 
                  value={formData?.parent_name} 
                  field="parent_name"
                  icon={User} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Yakınlık" 
                  value={formData?.parent_relation} 
                  field="parent_relation"
                  icon={Users}
                  type="select"
                  options={relationOptions} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Telefon" 
                  value={formData?.parent_phone} 
                  field="parent_phone"
                  icon={Phone}
                  type="tel" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="E-posta" 
                  value={formData?.parent_email} 
                  field="parent_email"
                  icon={Mail}
                  type="email" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Meslek" 
                  value={formData?.parent_occupation} 
                  field="parent_occupation"
                  icon={Briefcase} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="İş Telefonu" 
                  value={formData?.parent_work_phone} 
                  field="parent_work_phone"
                  icon={Phone}
                  type="tel" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="TC Kimlik No" 
                  value={formData?.parent_tc} 
                  field="parent_tc"
                  icon={Hash} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* İkinci Veli */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="text-sm font-bold text-indigo-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                2. Veli (Alternatif İletişim)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField 
                  label="Ad Soyad" 
                  value={formData?.parent2_name} 
                  field="parent2_name"
                  icon={User} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Yakınlık" 
                  value={formData?.parent2_relation} 
                  field="parent2_relation"
                  icon={Users}
                  type="select"
                  options={relationOptions} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Telefon" 
                  value={formData?.parent2_phone} 
                  field="parent2_phone"
                  icon={Phone}
                  type="tel" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Acil Durum */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
              <p className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Acil Durum İletişim
              </p>
              <p className="text-sm text-red-700">
                {formData?.parent_phone || 'Belirtilmedi'}
              </p>
            </div>
          </div>
        )}

        {/* EĞİTİM & ÖDEME */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eğitim & Ödeme Bilgileri</h3>
                <p className="text-sm text-gray-500">Akademik ve finansal detaylar</p>
              </div>
            </div>

            {/* Eğitim Bilgileri */}
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <p className="text-sm font-bold text-purple-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Eğitim Bilgileri
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField 
                  label="Sınıf" 
                  value={formData?.class} 
                  field="class"
                  icon={GraduationCap} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Şube" 
                  value={formData?.section} 
                  field="section"
                  icon={GraduationCap} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Program" 
                  value={formData?.program_name} 
                  field="program_name"
                  icon={Award} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Akademik Yıl" 
                  value={formData?.academic_year} 
                  field="academic_year"
                  icon={Calendar} 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <p className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Ödeme Bilgileri
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField 
                  label="Toplam Ücret (₺)" 
                  value={formData?.total_amount} 
                  field="total_amount"
                  icon={CreditCard}
                  type="number" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="İndirim (%)" 
                  value={formData?.discount_percent} 
                  field="discount_percent"
                  icon={Percent}
                  type="number" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField 
                  label="Peşinat (₺)" 
                  value={formData?.down_payment} 
                  field="down_payment"
                  icon={PiggyBank}
                  type="number" 
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ödeme Özeti Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-purple-100 text-sm font-medium">Toplam Tutar</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(formData?.total_amount || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-emerald-100 text-sm font-medium">Ödenen</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(formData?.paid_amount || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-amber-100 text-sm font-medium">Kalan Borç</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(formData?.balance || (formData?.total_amount - formData?.paid_amount) || 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* SÖZLEŞME */}
        {activeTab === 'contract' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Sözleşme Bilgileri</h3>
                <p className="text-sm text-gray-500">Kayıt sözleşmesi ve onaylar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditableField 
                label="Sözleşme Tarihi" 
                value={formData?.contract_date?.split('T')[0] || formData?.created_at?.split('T')[0]} 
                field="contract_date"
                icon={Calendar}
                type="date" 
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField 
                label="Kayıt Tarihi" 
                value={formatDate(formData?.created_at)} 
                field="created_at"
                icon={Calendar} 
                isEditing={false}
                onChange={handleChange}
              />
            </div>

            {/* Onay Durumları */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Onay Durumları</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* KVKK */}
                <button
                  onClick={() => isEditing && handleChange('kvkk_approved', !formData?.kvkk_approved)}
                  disabled={!isEditing}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData?.kvkk_approved 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-gray-50 border-gray-200'
                  } ${isEditing ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      formData?.kvkk_approved ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">KVKK Onayı</p>
                      <p className="text-xs text-gray-500">{formData?.kvkk_approved ? 'Onaylandı' : 'Bekliyor'}</p>
                    </div>
                  </div>
                </button>
                
                {/* Kurallar */}
                <button
                  onClick={() => isEditing && handleChange('rules_approved', !formData?.rules_approved)}
                  disabled={!isEditing}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData?.rules_approved 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-gray-50 border-gray-200'
                  } ${isEditing ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      formData?.rules_approved ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">Kurallar Onayı</p>
                      <p className="text-xs text-gray-500">{formData?.rules_approved ? 'Onaylandı' : 'Bekliyor'}</p>
                    </div>
                  </div>
                </button>
                
                {/* Ödeme */}
                <button
                  onClick={() => isEditing && handleChange('payment_approved', !formData?.payment_approved)}
                  disabled={!isEditing}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData?.payment_approved 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-gray-50 border-gray-200'
                  } ${isEditing ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      formData?.payment_approved ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">Ödeme Onayı</p>
                      <p className="text-xs text-gray-500">{formData?.payment_approved ? 'Onaylandı' : 'Bekliyor'}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Sözleşme Özeti */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800">Kayıt Sözleşmesi</p>
                  <p className="text-sm text-gray-600">
                    {formData?.contract_status === 'signed' 
                      ? `${formatDate(formData?.contract_date || formData?.created_at)} tarihinde imzalandı`
                      : 'Sözleşme henüz imzalanmadı'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alt Kaydet Butonu - Düzenleme modunda görünür */}
      {isEditing && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex items-center justify-between sticky bottom-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Düzenleme modu aktif.</span> Değişikliklerinizi kaydetmeyi unutmayın.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
