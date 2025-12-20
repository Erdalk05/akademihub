'use client';

import React, { useState, useRef } from 'react';
import { User, Shield, Phone, Mail, MapPin, School, Camera, X, Hash, AlertCircle, CheckCircle, Droplet, RefreshCw, ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { useEnrollmentStore } from '../store';
import { BLOOD_GROUPS, NATIONALITIES, CITIES, GRADES } from '../types';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

const validateTCKimlik = (tc: string): boolean => {
  if (tc.length !== 11) return false;
  if (tc[0] === '0') return false;
  const digits = tc.split('').map(Number);
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = (sum1 * 7 - sum2) % 10;
  const check11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return digits[9] === check10 && digits[10] === check11;
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  let cleaned = numbers;
  if (cleaned.startsWith('90')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
};

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const StudentSection = () => {
  const { student, updateStudent, regenerateStudentNo } = useEnrollmentStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(student.photoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const tcValid = student.tcNo.length === 11 && validateTCKimlik(student.tcNo);
  const emailValid = student.email ? validateEmail(student.email) : true;
  const phoneValid = student.phone.replace(/\D/g, '').length >= 10;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingPhoto(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });
      updateStudent({ photoUrl: base64 });
    } catch {} finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    updateStudent({ photoUrl: '' });
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Input stili
  const inputBase = "w-full h-12 px-4 border-2 rounded-xl text-sm bg-white outline-none transition-all";
  const inputNormal = `${inputBase} border-gray-200 focus:border-[#25D366] hover:border-[#128C7E]`;
  const inputValid = `${inputBase} border-[#25D366] bg-[#E7FFDB]`;
  const inputError = `${inputBase} border-red-400 bg-red-50`;
  
  // Label stili
  const labelStyle = "block text-xs font-bold text-[#075E54] mb-2 uppercase tracking-wide";
  
  // Select stili
  const selectStyle = "w-full h-12 px-4 border-2 border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-[#25D366] hover:border-[#128C7E] cursor-pointer appearance-none";

  return (
    <div className="space-y-8">
      
      {/* Bölüm 1: Fotoğraf ve Kimlik Bilgileri */}
      <div className="bg-white p-6 rounded-2xl border-2 border-[#25D366]/20 shadow-sm">
        <h3 className="text-sm font-bold text-[#075E54] mb-6 flex items-center gap-2 pb-3 border-b border-[#DCF8C6]">
          <User className="w-5 h-5 text-[#25D366]" />
          Kimlik Bilgileri
        </h3>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Fotoğraf Alanı - Kamera ve Galeri */}
          <div className="flex flex-col items-center">
            <div className="relative group mb-3">
              {photoPreview ? (
                <div className="relative">
                  <Image 
                    src={photoPreview} 
                    alt="Ogrenci"
                    width={120}
                    height={120}
                    className="w-28 h-28 rounded-2xl object-cover border-3 border-[#25D366] shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#DCF8C6] to-[#E7FFDB] border-2 border-dashed border-[#25D366] flex flex-col items-center justify-center">
                  {uploadingPhoto ? (
                    <div className="w-8 h-8 border-3 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-[#25D366] mb-1" />
                      <span className="text-[10px] text-[#128C7E] font-medium">Fotoğraf</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Kamera ve Galeri Butonları */}
            {!photoPreview && (
              <div className="flex gap-2">
                {/* Kamera Butonu */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#128C7E] transition-all shadow-md hover:shadow-lg"
                >
                  <Camera size={14} />
                  Kamera
                </button>
                
                {/* Galeri Butonu */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#075E54] text-white text-xs font-bold rounded-xl hover:bg-[#064940] transition-all shadow-md hover:shadow-lg"
                >
                  <ImagePlus size={14} />
                  Galeri
                </button>
              </div>
            )}
            
            {/* Fotoğraf varsa değiştir butonu */}
            {photoPreview && (
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#25D366] font-medium hover:bg-[#DCF8C6] rounded-lg transition-all"
                >
                  <Camera size={12} />
                  Yeniden Çek
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#075E54] font-medium hover:bg-[#DCF8C6] rounded-lg transition-all"
                >
                  <ImagePlus size={12} />
                  Galeriden
                </button>
              </div>
            )}
            
            {/* Hidden Inputs */}
            {/* Kamera Input - capture ile direkt kamera açılır */}
            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
            {/* Galeri Input - capture olmadan galeri açılır */}
            <input 
              ref={galleryInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
            
            <span className="text-[9px] text-gray-400 mt-1">Vesikalık Fotoğraf</span>
          </div>

          {/* Kimlik Alanları */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Ad */}
            <div>
              <label className={labelStyle}>
                Ad <span className="text-[#25D366]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={student.firstName}
                  onChange={(e) => updateStudent({ firstName: e.target.value.toLocaleUpperCase('tr-TR') })}
                  placeholder="Öğrenci adı"
                  className={student.firstName.length >= 2 ? inputValid : inputNormal}
                />
                {student.firstName.length >= 2 && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#25D366]" />
                )}
              </div>
            </div>

            {/* Soyad */}
            <div>
              <label className={labelStyle}>
                Soyad <span className="text-[#25D366]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={student.lastName}
                  onChange={(e) => updateStudent({ lastName: e.target.value.toLocaleUpperCase('tr-TR') })}
                  placeholder="Öğrenci soyadı"
                  className={student.lastName.length >= 2 ? inputValid : inputNormal}
                />
                {student.lastName.length >= 2 && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#25D366]" />
                )}
              </div>
            </div>

            {/* TC Kimlik */}
            <div>
              <label className={labelStyle}>
                TC Kimlik No <span className="text-[#25D366]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={student.tcNo}
                  onChange={(e) => updateStudent({ tcNo: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="11 haneli TC"
                  maxLength={11}
                  className={`${student.tcNo.length === 11 ? (tcValid ? inputValid : inputError) : inputNormal} font-mono tracking-wider`}
                />
                {student.tcNo.length === 11 && (
                  tcValid 
                    ? <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#25D366]" />
                    : <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Öğrenci No */}
            <div>
              <label className={labelStyle}>Öğrenci No</label>
              <button
                type="button"
                onClick={regenerateStudentNo}
                className="w-full h-12 px-4 bg-[#DCF8C6] border-2 border-[#25D366] rounded-xl flex items-center hover:bg-[#c5f0a8] transition-colors cursor-pointer group"
                title="Yeni numara üret"
              >
                <Hash className="w-4 h-4 text-[#25D366] mr-2" />
                <span className="font-bold text-[#075E54] tracking-wider">{student.studentNo || '—'}</span>
                <RefreshCw className="w-4 h-4 text-[#128C7E] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <span className="text-[10px] text-[#25D366] mt-1 block">Tıklayarak yeni numara üretin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bölüm 2: Kişisel Bilgiler */}
      <div className="bg-white p-6 rounded-2xl border-2 border-[#25D366]/20 shadow-sm">
        <h3 className="text-sm font-bold text-[#075E54] mb-6 flex items-center gap-2 pb-3 border-b border-[#DCF8C6]">
          <User className="w-5 h-5 text-[#25D366]" />
          Kişisel Bilgiler
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Doğum Tarihi */}
          <div>
            <label className={labelStyle}>
              Doğum Tarihi <span className="text-[#25D366]">*</span>
            </label>
            <ModernDatePicker
              value={student.birthDate}
              onChange={(date) => updateStudent({ birthDate: date })}
              minYear={1990}
              maxYear={2025}
            />
          </div>

          {/* Doğum Yeri */}
          <div>
            <label className={labelStyle}>Doğum Yeri</label>
            <select
              value={student.birthPlace}
              onChange={(e) => updateStudent({ birthPlace: e.target.value })}
              className={selectStyle}
            >
              <option value="">Şehir seçiniz</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Uyruk */}
          <div>
            <label className={labelStyle}>Uyruk</label>
            <select
              value={student.nationality}
              onChange={(e) => updateStudent({ nationality: e.target.value })}
              className={selectStyle}
            >
              <option value="">Seçiniz</option>
              {NATIONALITIES.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Cinsiyet */}
          <div>
            <label className={labelStyle}>
              Cinsiyet <span className="text-[#25D366]">*</span>
            </label>
            <div className="flex gap-3 h-12">
              <button
                type="button"
                onClick={() => updateStudent({ gender: 'male' })}
                className={`flex-1 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  student.gender === 'male'
                    ? 'bg-[#DCF8C6] border-[#25D366] text-[#075E54]'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-[#128C7E]'
                }`}
              >
                👦 Erkek
              </button>
              <button
                type="button"
                onClick={() => updateStudent({ gender: 'female' })}
                className={`flex-1 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  student.gender === 'female'
                    ? 'bg-[#DCF8C6] border-[#25D366] text-[#075E54]'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-[#128C7E]'
                }`}
              >
                👧 Kız
              </button>
            </div>
          </div>

          {/* Kan Grubu */}
          <div>
            <label className={labelStyle}>Kan Grubu</label>
            <select
              value={student.bloodGroup}
              onChange={(e) => updateStudent({ bloodGroup: e.target.value })}
              className={selectStyle}
            >
              <option value="">Seçiniz</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Sınıf */}
          <div>
            <label className={labelStyle}>
              Sınıf <span className="text-[#25D366]">*</span>
            </label>
            <select
              value={student.enrolledClass?.startsWith('custom:') ? 'other' : student.enrolledClass}
              onChange={(e) => {
                if (e.target.value === 'other') {
                  updateStudent({ enrolledClass: 'custom:' });
                } else {
                  updateStudent({ enrolledClass: e.target.value });
                }
              }}
              className={student.enrolledClass ? `${selectStyle} border-[#25D366] bg-[#E7FFDB]` : selectStyle}
            >
              <option value="">Sınıf seçiniz</option>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
              <option value="other">Diğer (Manuel Giriş)</option>
            </select>
            
            {/* Manuel Sınıf Girişi */}
            {student.enrolledClass?.startsWith('custom:') && (
              <div className="mt-2">
                <input
                  type="text"
                  value={student.enrolledClass.replace('custom:', '')}
                  onChange={(e) => updateStudent({ enrolledClass: `custom:${e.target.value}` })}
                  placeholder="Sınıf/Grup adını yazın (örn: Anaokulu, Hazırlık, Özel Grup)"
                  className="w-full h-12 px-4 border-2 border-[#25D366] rounded-xl text-sm outline-none bg-amber-50 focus:bg-white focus:ring-2 focus:ring-[#25D366]/30"
                  autoFocus
                />
                <p className="text-xs text-amber-600 mt-1">💡 Özel sınıf/grup adını serbest olarak girebilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bölüm 3: İletişim Bilgileri */}
      <div className="bg-white p-6 rounded-2xl border-2 border-[#25D366]/20 shadow-sm">
        <h3 className="text-sm font-bold text-[#075E54] mb-6 flex items-center gap-2 pb-3 border-b border-[#DCF8C6]">
          <Phone className="w-5 h-5 text-[#25D366]" />
          İletişim Bilgileri
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Cep Telefonu */}
          <div>
            <label className={labelStyle}>
              Cep Telefonu <span className="text-[#25D366]">*</span>
            </label>
            <div className="flex h-12">
              <span className="w-14 bg-[#075E54] text-white text-sm font-bold rounded-l-xl flex items-center justify-center border-2 border-r-0 border-[#075E54]">
                +90
              </span>
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={student.phone}
                  onChange={(e) => updateStudent({ phone: formatPhone(e.target.value) })}
                  placeholder="5XX XXX XX XX"
                  className={`w-full h-full px-4 border-2 border-l-0 rounded-r-xl text-sm outline-none ${
                    phoneValid && student.phone ? 'border-[#25D366] bg-[#E7FFDB]' : 'border-gray-200 focus:border-[#25D366]'
                  }`}
                />
                {phoneValid && student.phone && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#25D366]" />
                )}
              </div>
            </div>
          </div>

          {/* Yedek Telefon */}
          <div>
            <label className={labelStyle}>Telefon 2 (Yedek)</label>
            <div className="flex h-12">
              <span className="w-14 bg-gray-100 text-gray-500 text-sm font-medium rounded-l-xl flex items-center justify-center border-2 border-r-0 border-gray-200">
                +90
              </span>
              <input
                type="tel"
                value={student.phone2}
                onChange={(e) => updateStudent({ phone2: formatPhone(e.target.value) })}
                placeholder="5XX XXX XX XX"
                className="flex-1 h-full px-4 border-2 border-l-0 rounded-r-xl text-sm outline-none border-gray-200 focus:border-[#25D366]"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className={labelStyle}>
              E-posta <span className="text-[#25D366]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={student.email}
                onChange={(e) => updateStudent({ email: e.target.value.toLowerCase() })}
                placeholder="ornek@mail.com"
                className={`${student.email ? (emailValid ? inputValid : inputError) : inputNormal} pl-12`}
              />
              {student.email && (
                emailValid 
                  ? <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#25D366]" />
                  : <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bölüm 4: Adres Bilgileri */}
      <div className="bg-[#DCF8C6]/50 p-6 rounded-2xl border-2 border-[#25D366]/30">
        <h3 className="text-sm font-bold text-[#075E54] mb-6 flex items-center gap-2 pb-3 border-b border-[#25D366]/20">
          <MapPin className="w-5 h-5 text-[#25D366]" />
          Adres Bilgileri
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* İl */}
          <div>
            <label className={labelStyle}>
              İl <span className="text-[#25D366]">*</span>
            </label>
            <select
              value={student.city}
              onChange={(e) => updateStudent({ city: e.target.value })}
              className={`${selectStyle} bg-white`}
            >
              <option value="">Şehir seçiniz</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* İlçe */}
          <div>
            <label className={labelStyle}>
              İlçe <span className="text-[#25D366]">*</span>
            </label>
            <input
              type="text"
              value={student.district}
              onChange={(e) => updateStudent({ district: e.target.value.toLocaleUpperCase('tr-TR') })}
              placeholder="İlçe adı"
              className={`${inputNormal} bg-white`}
            />
          </div>

          {/* Açık Adres */}
          <div className="sm:col-span-2">
            <label className={labelStyle}>
              Açık Adres <span className="text-[#25D366]">*</span>
            </label>
            <input
              type="text"
              value={student.address}
              onChange={(e) => updateStudent({ address: e.target.value.toLocaleUpperCase('tr-TR') })}
              placeholder="Mahalle, cadde/sokak, bina no, daire no"
              className={`${inputNormal} bg-white`}
            />
          </div>
        </div>
      </div>

      {/* Bölüm 5: Ek Bilgiler */}
      <div className="bg-white p-6 rounded-2xl border-2 border-[#25D366]/20 shadow-sm">
        <h3 className="text-sm font-bold text-[#075E54] mb-6 flex items-center gap-2 pb-3 border-b border-[#DCF8C6]">
          <School className="w-5 h-5 text-[#25D366]" />
          Ek Bilgiler
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Önceki Okul */}
          <div>
            <label className={labelStyle}>Önceki Okul</label>
            <input
              type="text"
              value={student.previousSchool}
              onChange={(e) => updateStudent({ previousSchool: e.target.value })}
              placeholder="Geldiği okul adı"
              className={inputNormal}
            />
          </div>

          {/* Sağlık Notları */}
          <div>
            <label className={labelStyle}>Sağlık Notları</label>
            <input
              type="text"
              value={student.healthNotes}
              onChange={(e) => updateStudent({ healthNotes: e.target.value })}
              placeholder="Alerji, kronik hastalık, ilaç kullanımı vb."
              className={inputNormal}
            />
          </div>
        </div>
      </div>

      {/* Zorunlu Alan Uyarısı */}
      <div className="flex items-center gap-3 p-4 bg-[#DCF8C6] rounded-2xl border-2 border-[#25D366]/30">
        <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-[#075E54]">
          <span className="text-[#25D366] font-bold">*</span> ile işaretli alanların doldurulması zorunludur.
        </p>
      </div>
    </div>
  );
};
