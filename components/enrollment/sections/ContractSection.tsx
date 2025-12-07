'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, User, Users, GraduationCap, Wallet, PenTool, Calendar, CreditCard, Edit3, Copy, ClipboardPaste, RotateCcw } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { Section, Divider } from '../ui/Section';
import { Checkbox, FormField } from '../ui/FormField';
import { GUARDIAN_TYPES } from '../types';

const DEFAULT_CONTRACT = `K12 EĞİTİM KAYIT SÖZLEŞMESİ

İşbu Kayıt Sözleşmesi, bir tarafta AkademiHub Eğitim Kurumları (bundan sonra "Kurum" olarak anılacaktır) ile diğer tarafta [VELİ_AD_SOYAD] (bundan sonra "Veli" olarak anılacaktır) arasında [TARİH] tarihinde karşılıklı olarak düzenlenmiştir.

MADDE 1 - TARAFLAR
Bu sözleşme ile Kurum, [ÖĞRENCİ_AD_SOYAD] adlı öğrencinin [EĞİTİM_YILI] eğitim yılında [PROGRAM] programına kaydını kabul etmiştir.

MADDE 2 - EĞİTİM HİZMETİ
Kurum, öğrenciye ilgili öğretim yılı boyunca müfredat, ölçme-değerlendirme, rehberlik, akademik danışmanlık ve kurum içi etkinlikleri kapsayan eğitim hizmetini sunmayı kabul eder.

MADDE 3 - ÜCRET VE ÖDEME KOŞULLARI
Toplam eğitim ücreti [TOPLAM_ÜCRET] olup, net [NET_ÜCRET] olarak belirlenmiştir. Bu tutar [TAKSİT_SAYISI] taksit halinde ödenecektir.

MADDE 4 - VELİ BEYANI
Veli aşağıdaki hususları beyan ve taahhüt eder:
• Kayıt formunda verilen tüm bilgilerin doğruluğunu,
• Okul yönerge ve kurallarını kabul ettiğini,
• Ücret ve ödeme planını onayladığını,
• KVKK kapsamında bilgilendirildiğini kabul eder.

MADDE 5 - KURUM BEYANI
Kurum, sözleşmede belirtilen eğitim hizmetini sunmayı ve öğrenci dosyasını gizlilik esaslarına uygun korumayı taahhüt eder.

Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.`;

export const ContractSection = () => {
  const { student, guardians, education, payment, contract, updateContract } = useEnrollmentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [contractText, setContractText] = useState('');

  const primaryGuardian = guardians.find(g => g.isEmergency) || guardians[0];
  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const getGuardianType = (type: string) => GUARDIAN_TYPES.find(g => g.id === type)?.name || type;

  // Sözleşme metnini form verileriyle doldur
  useEffect(() => {
    const filledContract = DEFAULT_CONTRACT
      .replace('[VELİ_AD_SOYAD]', `${primaryGuardian?.firstName || ''} ${primaryGuardian?.lastName || ''}`)
      .replace('[TARİH]', today)
      .replace('[ÖĞRENCİ_AD_SOYAD]', `${student.firstName} ${student.lastName}`)
      .replace('[EĞİTİM_YILI]', education.academicYear)
      .replace('[PROGRAM]', education.programName || 'Belirtilmedi')
      .replace('[TOPLAM_ÜCRET]', `${payment.totalFee.toLocaleString('tr-TR')} ₺`)
      .replace('[NET_ÜCRET]', `${payment.netFee.toLocaleString('tr-TR')} ₺`)
      .replace('[TAKSİT_SAYISI]', String(payment.installmentCount));
    
    setContractText(filledContract);
  }, [student, guardians, education, payment, primaryGuardian, today]);

  const handleCopy = () => {
    navigator.clipboard.writeText(contractText);
    alert('Sözleşme metni kopyalandı!');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContractText(text);
      alert('Sözleşme metni yapıştırıldı!');
    } catch {
      alert('Pano erişimi izni gerekli.');
    }
  };

  const handleReset = () => {
    if (confirm('Sözleşme metni varsayılana döndürülecek. Emin misiniz?')) {
      const filledContract = DEFAULT_CONTRACT
        .replace('[VELİ_AD_SOYAD]', `${primaryGuardian?.firstName || ''} ${primaryGuardian?.lastName || ''}`)
        .replace('[TARİH]', today)
        .replace('[ÖĞRENCİ_AD_SOYAD]', `${student.firstName} ${student.lastName}`)
        .replace('[EĞİTİM_YILI]', education.academicYear)
        .replace('[PROGRAM]', education.programName || 'Belirtilmedi')
        .replace('[TOPLAM_ÜCRET]', `${payment.totalFee.toLocaleString('tr-TR')} ₺`)
        .replace('[NET_ÜCRET]', `${payment.netFee.toLocaleString('tr-TR')} ₺`)
        .replace('[TAKSİT_SAYISI]', String(payment.installmentCount));
      setContractText(filledContract);
    }
  };

  return (
    <Section title="Kayıt Sözleşmesi" icon={FileText}>
      <div className="space-y-6">
        
        {/* Özet Kartları - WhatsApp Theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Öğrenci Kartı */}
          <div className="p-4 bg-gradient-to-br from-[#DCF8C6] to-white rounded-2xl border-2 border-[#25D366]/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#25D366] rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-[#075E54] text-sm">Öğrenci</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Ad Soyad:</span> <strong>{student.firstName} {student.lastName}</strong></p>
              <p><span className="text-gray-500">TC:</span> <strong className="font-mono">{student.tcNo || '—'}</strong></p>
              <p><span className="text-gray-500">Doğum:</span> <strong>{student.birthDate || '—'}</strong></p>
              <p><span className="text-gray-500">Cinsiyet:</span> <strong>{student.gender === 'male' ? 'Erkek' : 'Kız'}</strong></p>
            </div>
          </div>

          {/* Eğitim Kartı */}
          <div className="p-4 bg-gradient-to-br from-[#DCF8C6] to-white rounded-2xl border-2 border-[#25D366]/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#128C7E] rounded-xl flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-[#075E54] text-sm">Eğitim</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Program:</span> <strong>{education.programName || '—'}</strong></p>
              <p><span className="text-gray-500">Sınıf:</span> <strong>{education.gradeName || '—'}</strong></p>
              <p><span className="text-gray-500">Branş:</span> <strong>{education.branchName || '—'}</strong></p>
              <p><span className="text-gray-500">Yıl:</span> <strong>{education.academicYear}</strong></p>
            </div>
          </div>

          {/* Ödeme Kartı */}
          <div className="p-4 bg-gradient-to-br from-[#DCF8C6] to-white rounded-2xl border-2 border-[#25D366]/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#075E54] rounded-xl flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-[#075E54] text-sm">Ödeme</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Toplam:</span> <strong>{payment.totalFee.toLocaleString('tr-TR')} ₺</strong></p>
              {payment.discount > 0 && (
                <p><span className="text-gray-500">İndirim:</span> <strong className="text-red-600">-{payment.discount.toLocaleString('tr-TR')} ₺</strong></p>
              )}
              <p><span className="text-gray-500">Net:</span> <strong className="text-lg text-[#075E54]">{payment.netFee.toLocaleString('tr-TR')} ₺</strong></p>
              <p><span className="text-gray-500">Taksit:</span> <strong>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} ₺</strong></p>
            </div>
          </div>
        </div>

        {/* Veli Bilgileri */}
        <div className="p-4 bg-[#DCF8C6] rounded-2xl border-2 border-[#25D366]/30">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[#128C7E]" />
            <h4 className="font-bold text-[#075E54]">Veli Bilgileri</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guardians.filter(g => g.firstName).map((g) => (
              <div key={g.id} className="p-3 bg-white rounded-xl border-2 border-[#25D366]/20">
                <p className="text-xs text-[#128C7E] font-bold mb-1">{getGuardianType(g.type)}</p>
                <p className="font-semibold text-[#075E54]">{g.firstName} {g.lastName}</p>
                <p className="text-sm text-gray-600">{g.phone || '—'} • {g.email || '—'}</p>
                {g.isEmergency && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-lg mt-1 inline-block font-medium">Acil İletişim</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Taksit Listesi */}
        {payment.installments && payment.installments.length > 0 && (
          <div className="border-2 border-[#25D366]/30 rounded-2xl overflow-hidden">
            <div className="bg-[#DCF8C6] px-4 py-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#128C7E]" />
              <h4 className="font-bold text-[#075E54]">Taksit Planı</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#E7FFDB]">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-[#075E54]">#</th>
                    <th className="px-4 py-2 text-left font-bold text-[#075E54]">Vade Tarihi</th>
                    <th className="px-4 py-2 text-right font-bold text-[#075E54]">Tutar</th>
                    <th className="px-4 py-2 text-center font-bold text-[#075E54]">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.installments.map((inst, idx) => (
                    <tr key={idx} className="border-t border-[#25D366]/20 hover:bg-[#E7FFDB]/50">
                      <td className="px-4 py-3 font-medium">
                        {inst.no === 0 ? (
                          <span className="bg-[#25D366] text-white px-2 py-1 rounded-lg text-xs font-bold">Peşinat</span>
                        ) : (
                          <span className="text-[#075E54]">{inst.no}. Taksit</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-[#25D366]" />
                          {inst.dueDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#075E54]">
                        {inst.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          inst.status === 'paid' 
                            ? 'bg-[#25D366] text-white' 
                            : inst.status === 'overdue'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {inst.status === 'paid' ? 'Ödendi' : inst.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#DCF8C6]">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-bold text-[#075E54]">TOPLAM</td>
                    <td className="px-4 py-3 text-right font-bold text-[#075E54] text-lg">
                      {payment.netFee.toLocaleString('tr-TR')} ₺
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Sözleşme Metni - DÜZENLENEBİLİR */}
        <div className="rounded-2xl border-2 border-[#25D366]/30 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-[#DCF8C6] px-4 py-3 flex items-center justify-between">
            <h4 className="font-bold text-[#075E54] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#25D366]" />
              Sözleşme Metni
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  isEditing 
                    ? 'bg-[#25D366] text-white' 
                    : 'bg-white text-[#075E54] hover:bg-[#E7FFDB] border-2 border-[#25D366]/30'
                }`}
              >
                <Edit3 size={14} />
                {isEditing ? 'Düzenlemeyi Bitir' : 'Düzenle'}
              </button>
              {isEditing && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#075E54] hover:bg-[#E7FFDB] rounded-xl text-sm font-medium border-2 border-[#25D366]/30"
                  >
                    <Copy size={14} />
                    Kopyala
                  </button>
                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#075E54] hover:bg-[#E7FFDB] rounded-xl text-sm font-medium border-2 border-[#25D366]/30"
                  >
                    <ClipboardPaste size={14} />
                    Yapıştır
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium border-2 border-red-200"
                  >
                    <RotateCcw size={14} />
                    Sıfırla
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sözleşme İçeriği */}
          <div className="p-6 bg-white">
            {isEditing ? (
              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                className="w-full h-[400px] p-4 border-2 border-[#25D366] rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366] font-mono"
                placeholder="Sözleşme metnini buraya yazın veya yapıştırın..."
              />
            ) : (
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap bg-[#E7FFDB] p-4 rounded-xl border-2 border-[#25D366]/20">
                {contractText}
              </div>
            )}
          </div>
        </div>

        {/* Onay Kutuları - WhatsApp Style */}
        <div className="space-y-4 p-5 bg-[#DCF8C6] rounded-2xl border-2 border-[#25D366]/30">
          <h4 className="font-bold text-[#075E54] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#25D366]" />
            Onay ve Kabul
          </h4>
          
          <div className="space-y-3">
            <Checkbox
              label="KVKK Aydınlatma Metnini okudum ve kabul ediyorum."
              description="Kişisel verilerin işlenmesine ilişkin bilgilendirme yapılmıştır."
              checked={contract.kvkkApproved}
              onChange={(e) => updateContract({ kvkkApproved: e.target.checked })}
            />
            
            <Checkbox
              label="Okul yönetmeliğini ve kurallarını kabul ediyorum."
              description="Disiplin kuralları, devamsızlık politikası ve diğer yönetmelikleri okudum."
              checked={contract.termsApproved}
              onChange={(e) => updateContract({ termsApproved: e.target.checked })}
            />
            
            <Checkbox
              label="Ödeme planını ve koşullarını kabul ediyorum."
              description="Yukarıda belirtilen ücret ve taksit planını onaylıyorum."
              checked={contract.paymentApproved}
              onChange={(e) => updateContract({ paymentApproved: e.target.checked })}
            />
          </div>
        </div>

        {/* İmza Alanları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Veli İmzası */}
          <div className="p-6 border-2 border-dashed border-[#25D366] rounded-2xl text-center bg-[#E7FFDB]/30">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PenTool className="w-5 h-5 text-[#25D366]" />
              <span className="text-xs font-bold text-[#075E54] uppercase tracking-wide">Veli İmzası</span>
            </div>
            <div className="h-20 border-b-2 border-[#25D366] mb-4" />
            <FormField
              label=""
              value={contract.guardianSignature}
              onChange={(e) => updateContract({ guardianSignature: e.target.value })}
              placeholder="Ad Soyad yazınız"
              className="text-center"
            />
            <p className="text-xs text-gray-500 mt-2">Tarih: {today}</p>
          </div>

          {/* Kurum Yetkilisi */}
          <div className="p-6 border-2 border-dashed border-[#25D366] rounded-2xl text-center bg-[#E7FFDB]/30">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PenTool className="w-5 h-5 text-[#25D366]" />
              <span className="text-xs font-bold text-[#075E54] uppercase tracking-wide">Kurum Yetkilisi</span>
            </div>
            <div className="h-20 border-b-2 border-[#25D366] mb-4" />
            <FormField
              label=""
              value={contract.institutionOfficer}
              onChange={(e) => updateContract({ institutionOfficer: e.target.value })}
              placeholder="Ad Soyad yazınız"
              className="text-center"
            />
            <p className="text-xs text-gray-500 mt-2">Tarih: {today}</p>
          </div>
        </div>

        {/* Onay Durumu */}
        {contract.kvkkApproved && contract.termsApproved && contract.paymentApproved && (
          <div className="p-4 bg-[#DCF8C6] border-2 border-[#25D366] rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-[#075E54]">Tüm onaylar verildi</p>
              <p className="text-sm text-[#128C7E]">Sözleşme imzaya hazır. "Kaydı Tamamla" butonuna tıklayabilirsiniz.</p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};
