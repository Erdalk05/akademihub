'use client';

import React from 'react';
import { Users, Phone, Mail, Briefcase, Shield, Plus, Trash2, AlertCircle, MapPin, Building2, Copy } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section } from '../ui/Section';
import { FormField, FormSelect, Checkbox } from '../ui/FormField';
import { GUARDIAN_TYPES } from '../types';

export const GuardianSection = () => {
  const { student, guardians, addGuardian, updateGuardian, removeGuardian } = useEnrollmentStore();

  // Öğrenci adresini veliye kopyala
  const copyStudentAddress = (guardianId: string) => {
    updateGuardian(guardianId, {
      homeCity: student.city,
      homeDistrict: student.district,
      homeAddress: student.address,
    });
  };

  return (
    <Section title="Veli Bilgileri" icon={Users} badge={`${guardians.length} veli kayıtlı`}>
      <div className="space-y-6">
        {guardians.map((guardian, index) => (
          <div
            key={guardian.id}
            className="p-5 bg-gradient-to-br from-[#E7FFDB] to-white rounded-2xl border-2 border-[#25D366]/20 relative group print:bg-white print:border-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold
                  ${guardian.isEmergency 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-[#DCF8C6] text-[#075E54]'
                  }
                `}>
                  {index + 1}
                </div>
                <FormSelect
                  label=""
                  options={GUARDIAN_TYPES.map((t) => ({ value: t.id, label: t.name }))}
                  value={guardian.type}
                  onChange={(e) => updateGuardian(guardian.id, { type: e.target.value as any })}
                  className="!py-1.5 !text-sm font-medium min-w-[140px]"
                />
                
                <Checkbox
                  label="Acil Durum İletişim"
                  checked={guardian.isEmergency}
                  onChange={(e) => updateGuardian(guardian.id, { isEmergency: e.target.checked })}
                />
              </div>

              {guardians.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGuardian(guardian.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 no-print"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Kişisel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <FormField
                label="Ad"
                value={guardian.firstName}
                onChange={(e) => updateGuardian(guardian.id, { firstName: e.target.value.toLocaleUpperCase('tr-TR') })}
                placeholder="Veli adı"
                required
              />
              <FormField
                label="Soyad"
                value={guardian.lastName}
                onChange={(e) => updateGuardian(guardian.id, { lastName: e.target.value.toLocaleUpperCase('tr-TR') })}
                placeholder="Veli soyadı"
                required
              />
              <FormField
                label="TC Kimlik No"
                icon={Shield}
                value={guardian.tcNo}
                onChange={(e) => updateGuardian(guardian.id, { tcNo: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                placeholder="11 haneli TC"
                maxLength={11}
              />
              <FormField
                label="Telefon"
                icon={Phone}
                value={guardian.phone}
                onChange={(e) => updateGuardian(guardian.id, { phone: e.target.value })}
                placeholder="5XX XXX XX XX"
                required
              />
              <FormField
                label="E-posta"
                icon={Mail}
                type="email"
                value={guardian.email}
                onChange={(e) => updateGuardian(guardian.id, { email: e.target.value.toLowerCase() })}
                placeholder="ornek@mail.com"
              />
              <FormField
                label="Meslek / Görev"
                icon={Briefcase}
                value={guardian.job}
                onChange={(e) => updateGuardian(guardian.id, { job: e.target.value })}
                placeholder="Meslek / Görev"
              />
            </div>

            {/* İş Bilgileri */}
            <div className="p-4 bg-[#DCF8C6]/50 rounded-xl border-2 border-[#25D366]/20 mb-4">
              <h4 className="text-sm font-bold text-[#075E54] mb-3 flex items-center gap-2">
                <Building2 size={16} className="text-[#25D366]" />
                İş Bilgileri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Çalıştığı Yer"
                  value={guardian.workplace || ''}
                  onChange={(e) => updateGuardian(guardian.id, { workplace: e.target.value })}
                  placeholder="Şirket / Kurum adı"
                />
                <FormField
                  label="İş Adresi"
                  value={guardian.workAddress || ''}
                  onChange={(e) => updateGuardian(guardian.id, { workAddress: e.target.value })}
                  placeholder="İş yeri adresi"
                />
                <FormField
                  label="İş Telefonu"
                  icon={Phone}
                  value={guardian.workPhone || ''}
                  onChange={(e) => updateGuardian(guardian.id, { workPhone: e.target.value })}
                  placeholder="İş telefonu"
                />
              </div>
            </div>

            {/* Ev Adresi */}
            <div className="p-4 bg-[#DCF8C6]/50 rounded-xl border-2 border-[#25D366]/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#075E54] flex items-center gap-2">
                  <MapPin size={16} className="text-[#25D366]" />
                  Ev Adresi
                </h4>
                <button
                  type="button"
                  onClick={() => copyStudentAddress(guardian.id)}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors no-print"
                >
                  <Copy size={14} />
                  Öğrenci Adresini Kopyala
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="İl"
                  value={guardian.homeCity || ''}
                  onChange={(e) => updateGuardian(guardian.id, { homeCity: e.target.value })}
                  placeholder="İl"
                />
                <FormField
                  label="İlçe"
                  value={guardian.homeDistrict || ''}
                  onChange={(e) => updateGuardian(guardian.id, { homeDistrict: e.target.value.toLocaleUpperCase('tr-TR') })}
                  placeholder="İlçe"
                />
                <FormField
                  label="Açık Adres"
                  value={guardian.homeAddress || ''}
                  onChange={(e) => updateGuardian(guardian.id, { homeAddress: e.target.value.toLocaleUpperCase('tr-TR') })}
                  placeholder="Mahalle, sokak, bina no..."
                />
              </div>
            </div>

            {/* Emergency Badge */}
            {guardian.isEmergency && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-600">
                  Bu veli acil durumlarda ilk aranacak kişi olarak belirlenmiştir.
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Add Guardian Button - WhatsApp Style */}
        <button
          type="button"
          onClick={addGuardian}
          className="
            w-full py-4 
            border-2 border-dashed border-[#25D366] rounded-2xl
            text-[#075E54] hover:text-white hover:bg-[#25D366] hover:border-[#25D366]
            transition-all duration-200
            flex items-center justify-center gap-2
            no-print
          "
        >
          <Plus size={20} />
          <span className="font-bold">Yeni Veli Ekle</span>
        </button>
      </div>
    </Section>
  );
};
