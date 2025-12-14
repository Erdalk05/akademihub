'use client';

import React, { useState } from 'react';
import { 
  User, Users, GraduationCap, FileText, 
  Phone, Mail, MapPin, Calendar, Hash, Heart, Globe,
  Building, Briefcase, Wallet, CheckCircle,
  BookOpen, Award
} from 'lucide-react';

interface Props {
  student: any;
}

type TabType = 'student' | 'guardian' | 'education' | 'contract';

// Info Card Component
const InfoCard = ({ label, value, icon: Icon }: { label: string; value: any; icon?: React.ElementType }) => {
  if (!value || value === 'null' || value === 'undefined') return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default function StudentOverviewTab({ student }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('student');

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
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
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

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Öğrenci Kartı</h2>
            <p className="text-emerald-100 text-sm">
              {student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`} • {student?.student_no}
            </p>
          </div>
        </div>
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
              <InfoCard label="Ad Soyad" value={student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`} icon={User} />
              <InfoCard label="TC Kimlik No" value={student?.tc_id} icon={Hash} />
              <InfoCard label="Öğrenci No" value={student?.student_no} icon={Hash} />
              <InfoCard label="Kayıt Tarihi" value={formatDate(student?.created_at)} icon={Calendar} />
              <InfoCard label="Doğum Tarihi" value={formatDate(student?.birth_date)} icon={Calendar} />
              <InfoCard label="Doğum Yeri" value={student?.birth_place} icon={MapPin} />
              <InfoCard label="Cinsiyet" value={student?.gender === 'male' ? 'Erkek' : student?.gender === 'female' ? 'Kız' : student?.gender} icon={User} />
              <InfoCard label="Kan Grubu" value={student?.blood_type} icon={Heart} />
              <InfoCard label="Uyruk" value={student?.nationality} icon={Globe} />
              <InfoCard label="Telefon" value={student?.phone} icon={Phone} />
              <InfoCard label="Telefon 2" value={student?.phone2} icon={Phone} />
              <InfoCard label="E-posta" value={student?.email} icon={Mail} />
              <InfoCard label="İl" value={student?.city} icon={MapPin} />
              <InfoCard label="İlçe" value={student?.district} icon={MapPin} />
              <InfoCard label="Adres" value={student?.address} icon={MapPin} />
              <InfoCard label="Önceki Okul" value={student?.previous_school} icon={Building} />
              <InfoCard label="Sağlık Notları" value={student?.health_notes} icon={Heart} />
            </div>

            {/* Durum Badge */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-medium">Kayıt Durumu</p>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                student?.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                student?.status === 'inactive' ? 'bg-red-100 text-red-700' :
                student?.status === 'graduated' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {student?.status === 'active' ? 'Aktif Kayıt' :
                 student?.status === 'inactive' ? 'Pasif' :
                 student?.status === 'graduated' ? 'Mezun' : 'Beklemede'}
              </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard label="Veli Adı Soyadı" value={student?.parent_name} icon={User} />
              <InfoCard label="Veli Telefonu" value={student?.parent_phone} icon={Phone} />
              <InfoCard label="Veli E-posta" value={student?.parent_email} icon={Mail} />
              <InfoCard label="Yakınlık" value={student?.parent_relation || 'Veli'} icon={Users} />
              <InfoCard label="Meslek" value={student?.parent_occupation} icon={Briefcase} />
              <InfoCard label="İş Telefonu" value={student?.parent_work_phone} icon={Phone} />
            </div>

            {/* İkinci Veli */}
            {student?.parent2_name && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  İkinci Veli
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoCard label="Adı Soyadı" value={student?.parent2_name} icon={User} />
                  <InfoCard label="Telefonu" value={student?.parent2_phone} icon={Phone} />
                </div>
              </div>
            )}

            {/* Acil Durum */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Acil Durum İletişim: {student?.parent_phone || 'Belirtilmedi'}
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
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Eğitim Bilgileri
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard label="Sınıf" value={student?.class} icon={GraduationCap} />
                <InfoCard label="Şube" value={student?.section} icon={GraduationCap} />
                <InfoCard label="Program" value={student?.program_name} icon={Award} />
                <InfoCard label="Akademik Yıl" value={student?.academic_year} icon={Calendar} />
                <InfoCard label="Kayıtlı Sınıf" value={student?.enrolled_class} icon={GraduationCap} />
              </div>
            </div>

            {/* Ödeme Özeti */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-500" />
                Ödeme Özeti
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                  <p className="text-purple-100 text-sm font-medium">Toplam Tutar</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(student?.total_amount || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                  <p className="text-emerald-100 text-sm font-medium">Ödenen</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(student?.paid_amount || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                  <p className="text-amber-100 text-sm font-medium">Kalan Borç</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(student?.balance || (student?.total_amount - student?.paid_amount) || 0)}</p>
                </div>
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
              <InfoCard label="Sözleşme Tarihi" value={formatDate(student?.contract_date || student?.created_at)} icon={Calendar} />
              <InfoCard label="Sözleşme Durumu" value={student?.contract_status === 'signed' ? 'İmzalandı' : 'Bekliyor'} icon={FileText} />
            </div>

            {/* Onay Durumları */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border-2 ${student?.kvkk_approved ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${student?.kvkk_approved ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">KVKK Onayı</p>
                    <p className="text-xs text-gray-500">{student?.kvkk_approved ? 'Onaylandı' : 'Bekliyor'}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border-2 ${student?.rules_approved ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${student?.rules_approved ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Kurallar Onayı</p>
                    <p className="text-xs text-gray-500">{student?.rules_approved ? 'Onaylandı' : 'Bekliyor'}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border-2 ${student?.payment_approved ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${student?.payment_approved ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Ödeme Onayı</p>
                    <p className="text-xs text-gray-500">{student?.payment_approved ? 'Onaylandı' : 'Bekliyor'}</p>
                  </div>
                </div>
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
                    {student?.contract_status === 'signed' 
                      ? `${formatDate(student?.contract_date || student?.created_at)} tarihinde imzalandı`
                      : 'Sözleşme henüz imzalanmadı'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
