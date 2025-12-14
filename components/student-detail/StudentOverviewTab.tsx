'use client';

import React, { useState } from 'react';
import { 
  User, Users, GraduationCap, FileText, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Calendar, CreditCard, Hash, Heart, Globe,
  Building, Briefcase, AlertTriangle, Clock, Wallet, CheckCircle,
  BookOpen, Award
} from 'lucide-react';

interface Props {
  student: any;
}

// Accordion Section Component
const AccordionSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  accentColor = 'emerald'
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
  };
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${colorClasses[accentColor]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">Detayları görüntülemek için tıklayın</p>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </div>
      </button>
      
      {isOpen && (
        <div className="px-5 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

// Info Row Component
const InfoRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: React.ElementType }) => {
  if (!value || value === 'null' || value === 'undefined') return null;
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
};

// Info Grid Component
const InfoGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
    {children}
  </div>
);

export default function StudentOverviewTab({ student }: Props) {
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

  // Durum badge'i
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aktif Kayıt' },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', label: 'Pasif' },
      graduated: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Mezun' },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Askıya Alındı' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <CheckCircle className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Öğrenci Kartı Başlığı */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Öğrenci Kartı</h2>
            <p className="text-emerald-100">Tüm kayıt bilgileri ve detaylar</p>
          </div>
        </div>
      </div>

      {/* 1. ÖĞRENCİ BİLGİLERİ */}
      <AccordionSection title="Öğrenci Bilgileri" icon={User} defaultOpen={true} accentColor="emerald">
        <InfoGrid>
          <InfoRow label="Ad Soyad" value={student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`} icon={User} />
          <InfoRow label="TC Kimlik No" value={student?.tc_id} icon={Hash} />
          <InfoRow label="Öğrenci No" value={student?.student_no} icon={Hash} />
          <InfoRow label="Kayıt Tarihi" value={formatDate(student?.created_at)} icon={Calendar} />
          <InfoRow label="Doğum Tarihi" value={formatDate(student?.birth_date)} icon={Calendar} />
          <InfoRow label="Doğum Yeri" value={student?.birth_place} icon={MapPin} />
          <InfoRow label="Cinsiyet" value={student?.gender === 'male' ? 'Erkek' : student?.gender === 'female' ? 'Kız' : student?.gender} icon={User} />
          <InfoRow label="Kan Grubu" value={student?.blood_type} icon={Heart} />
          <InfoRow label="Uyruk" value={student?.nationality} icon={Globe} />
          <InfoRow label="Telefon" value={student?.phone} icon={Phone} />
          <InfoRow label="Telefon 2" value={student?.phone2} icon={Phone} />
          <InfoRow label="E-posta" value={student?.email} icon={Mail} />
          <InfoRow label="İl" value={student?.city} icon={MapPin} />
          <InfoRow label="İlçe" value={student?.district} icon={MapPin} />
          <InfoRow label="Adres" value={student?.address} icon={MapPin} />
          <InfoRow label="Önceki Okul" value={student?.previous_school} icon={Building} />
          <InfoRow label="Sağlık Notları" value={student?.health_notes} icon={Heart} />
        </InfoGrid>
        
        {/* Durum Badge */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Kayıt Durumu</p>
          {getStatusBadge(student?.status)}
        </div>
      </AccordionSection>

      {/* 2. VELİ BİLGİLERİ */}
      <AccordionSection title="Veli Bilgileri" icon={Users} accentColor="blue">
        <InfoGrid>
          <InfoRow label="Veli Adı Soyadı" value={student?.parent_name} icon={User} />
          <InfoRow label="Veli Telefonu" value={student?.parent_phone} icon={Phone} />
          <InfoRow label="Veli E-posta" value={student?.parent_email} icon={Mail} />
          <InfoRow label="Yakınlık" value={student?.parent_relation || 'Veli'} icon={Users} />
          <InfoRow label="Meslek" value={student?.parent_occupation} icon={Briefcase} />
          <InfoRow label="İş Telefonu" value={student?.parent_work_phone} icon={Phone} />
        </InfoGrid>
        
        {/* İkinci Veli */}
        {student?.parent2_name && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">İkinci Veli</p>
            <InfoGrid>
              <InfoRow label="Adı Soyadı" value={student?.parent2_name} icon={User} />
              <InfoRow label="Telefonu" value={student?.parent2_phone} icon={Phone} />
            </InfoGrid>
          </div>
        )}
      </AccordionSection>

      {/* 3. EĞİTİM & ÖDEME */}
      <AccordionSection title="Eğitim & Ödeme Bilgileri" icon={GraduationCap} accentColor="purple">
        <div className="mt-4">
          {/* Eğitim Bilgileri */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Eğitim Bilgileri
            </p>
            <InfoGrid>
              <InfoRow label="Sınıf" value={student?.class} icon={GraduationCap} />
              <InfoRow label="Şube" value={student?.section} icon={GraduationCap} />
              <InfoRow label="Program" value={student?.program_name} icon={Award} />
              <InfoRow label="Akademik Yıl" value={student?.academic_year} icon={Calendar} />
              <InfoRow label="Kayıtlı Sınıf" value={student?.enrolled_class} icon={GraduationCap} />
            </InfoGrid>
          </div>
          
          {/* Ödeme Bilgileri */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-600" />
              Ödeme Özeti
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-600 font-medium mb-1">Toplam Tutar</p>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(student?.total_amount || 0)}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-1">Ödenen</p>
                <p className="text-xl font-bold text-emerald-900">{formatCurrency(student?.paid_amount || 0)}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">Kalan Borç</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(student?.balance || (student?.total_amount - student?.paid_amount) || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* 4. SÖZLEŞME BİLGİLERİ */}
      <AccordionSection title="Sözleşme Bilgileri" icon={FileText} accentColor="orange">
        <InfoGrid>
          <InfoRow label="Sözleşme Tarihi" value={formatDate(student?.contract_date || student?.created_at)} icon={Calendar} />
          <InfoRow label="Sözleşme Durumu" value={student?.contract_status === 'signed' ? 'İmzalandı' : 'Bekliyor'} icon={FileText} />
          <InfoRow label="KVKK Onayı" value={student?.kvkk_approved ? 'Onaylandı' : 'Bekliyor'} icon={CheckCircle} />
          <InfoRow label="Kurallar Onayı" value={student?.rules_approved ? 'Onaylandı' : 'Bekliyor'} icon={CheckCircle} />
        </InfoGrid>
        
        {/* Sözleşme Özeti */}
        <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-800">Kayıt Sözleşmesi</p>
              <p className="text-xs text-orange-600">
                {student?.contract_status === 'signed' 
                  ? `${formatDate(student?.contract_date || student?.created_at)} tarihinde imzalandı`
                  : 'Sözleşme henüz imzalanmadı'}
              </p>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Risk Analizi - Compact */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Risk Analizi
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
            <p className="text-xs text-red-600 font-medium">Ödeme</p>
            <p className="text-lg font-bold text-red-700 mt-1">
              {student?.risk_level === 'high' ? 'Yüksek' : student?.risk_level === 'medium' ? 'Orta' : 'Düşük'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100 text-center">
            <p className="text-xs text-yellow-600 font-medium">Devamsızlık</p>
            <p className="text-lg font-bold text-yellow-700 mt-1">Orta</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
            <p className="text-xs text-green-600 font-medium">Akademik</p>
            <p className="text-lg font-bold text-green-700 mt-1">İyi</p>
          </div>
        </div>
      </div>

      {/* Son Hareketler - Compact */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          Son Hareketler
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Kayıt oluşturuldu</p>
              <p className="text-xs text-gray-500">{formatDate(student?.created_at)}</p>
            </div>
          </div>
          {student?.paid_amount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Ödeme alındı</p>
                <p className="text-xs text-gray-500">{formatCurrency(student?.paid_amount)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

