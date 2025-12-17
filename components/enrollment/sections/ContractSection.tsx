'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, User, Users, GraduationCap, Wallet, PenTool, Calendar, CreditCard, Edit3, Copy, ClipboardPaste, RotateCcw, Download, Eye, Printer } from 'lucide-react';
import { useEnrollmentStore } from '../store';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Section, Divider } from '../ui/Section';
import { Checkbox, FormField } from '../ui/FormField';
import { GUARDIAN_TYPES, PROGRAMS } from '../types';
import toast from 'react-hot-toast';

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
  const { currentOrganization } = useOrganizationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [contractText, setContractText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const primaryGuardian = guardians.find(g => g.isEmergency) || guardians[0];
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';
  const program = PROGRAMS.find(p => p.id === education.programId);
  const programName = program?.name || education.programName || 'Belirtilmedi';
  
  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const getGuardianType = (type: string) => GUARDIAN_TYPES.find(g => g.id === type)?.name || type;

  // PDF İndir fonksiyonu
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const toastId = toast.loading('PDF oluşturuluyor...');

    try {
      const element = previewRef.current;
      if (!element) {
        toast.error('Önizleme bulunamadı!', { id: toastId });
        return;
      }

      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Kayit_Formu_${student.firstName}_${student.lastName}.pdf`);
      toast.success('PDF başarıyla indirildi!', { id: toastId });
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error);
      toast.error(`PDF oluşturulamadı: ${error.message}`, { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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

        {/* ========== PDF ÖNİZLEME BÖLÜMÜ ========== */}
        <div className="rounded-2xl border-2 border-[#6366f1]/30 overflow-hidden bg-gradient-to-br from-indigo-50 to-white">
          <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-3 flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Kayıt Formu Önizleme (2 Sayfa)
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition"
              >
                <Eye size={14} />
                {showPreview ? 'Gizle' : 'Göster'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf || !showPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#6366f1] hover:bg-indigo-50 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                <Download size={14} />
                {isGeneratingPdf ? 'Hazırlanıyor...' : 'PDF İndir'}
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="p-4 bg-gray-100 max-h-[600px] overflow-y-auto">
              <p className="text-center text-sm text-gray-500 mb-3">
                📄 Kayıt tamamlanmadan önce formun son halini kontrol edin
              </p>
              
              {/* PDF Önizleme İçeriği */}
              <div ref={previewRef} className="bg-white mx-auto" style={{ width: '794px', transform: 'scale(0.6)', transformOrigin: 'top center', marginBottom: '-300px' }}>
                
                {/* ===== SAYFA 1 - KAYIT FORMU ===== */}
                <div style={{ padding: '15px 20px', borderBottom: '3px dashed #ccc', minHeight: '1123px', boxSizing: 'border-box' }}>
                  {/* Başlık */}
                  <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#000', margin: 0 }}>{organizationName.toUpperCase()}</h1>
                        <p style={{ fontSize: '10px', color: '#666', margin: '2px 0 0 0' }}>Eğitim Kurumu</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ border: '2px solid #000', padding: '4px 12px', display: 'inline-block' }}>
                          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', margin: 0 }}>KAYIT FORMU</h2>
                        </div>
                        <p style={{ fontSize: '9px', marginTop: '4px', color: '#000', margin: '4px 0 0 0' }}>Tarih: {today} | No: {student.studentNo || '______'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Öğrenci Bilgileri */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ backgroundColor: '#f0f0f0', border: '1px solid #000', padding: '3px 8px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>ÖĞRENCİ BİLGİLERİ</h3>
                    </div>
                    <table style={{ width: '100%', border: '1px solid #000', borderTop: 'none', fontSize: '9px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #ccc' }}>
                          <td style={{ padding: '4px 6px', width: '15%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Ad Soyad</td>
                          <td style={{ padding: '4px 6px', width: '20%', fontWeight: 'bold', borderRight: '1px solid #ccc', color: '#000' }}>{student.firstName} {student.lastName}</td>
                          <td style={{ padding: '4px 6px', width: '15%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>TC No</td>
                          <td style={{ padding: '4px 6px', width: '18%', fontFamily: 'monospace', borderRight: '1px solid #ccc', color: '#000' }}>{student.tcNo || '_____________'}</td>
                          <td style={{ padding: '4px 6px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Doğum</td>
                          <td style={{ padding: '4px 6px', width: '20%', color: '#000' }}>{student.birthDate || '__________'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 6px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Telefon</td>
                          <td style={{ padding: '4px 6px', borderRight: '1px solid #ccc', color: '#000' }}>{student.phone || '_____________'}</td>
                          <td style={{ padding: '4px 6px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Cinsiyet</td>
                          <td style={{ padding: '4px 6px', borderRight: '1px solid #ccc', color: '#000' }}>{student.gender === 'male' ? 'Erkek' : student.gender === 'female' ? 'Kız' : '____'}</td>
                          <td style={{ padding: '4px 6px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Adres</td>
                          <td style={{ padding: '4px 6px', color: '#000' }}>{[student.city, student.district].filter(Boolean).join(', ') || '________________'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Veli Bilgileri */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ backgroundColor: '#f0f0f0', border: '1px solid #000', padding: '3px 8px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>VELİ BİLGİLERİ</h3>
                    </div>
                    <table style={{ width: '100%', border: '1px solid #000', borderTop: 'none', fontSize: '9px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 6px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Yakınlık</td>
                          <td style={{ padding: '4px 6px', width: '13%', fontWeight: 'bold', borderRight: '1px solid #ccc', color: '#000' }}>{getGuardianType(primaryGuardian?.type || '')}</td>
                          <td style={{ padding: '4px 6px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Ad Soyad</td>
                          <td style={{ padding: '4px 6px', width: '20%', fontWeight: 'bold', borderRight: '1px solid #ccc', color: '#000' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</td>
                          <td style={{ padding: '4px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>TC No</td>
                          <td style={{ padding: '4px 6px', width: '16%', fontFamily: 'monospace', borderRight: '1px solid #ccc', color: '#000' }}>{primaryGuardian?.tcNo || '_____________'}</td>
                          <td style={{ padding: '4px 6px', width: '8%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Tel</td>
                          <td style={{ padding: '4px 6px', color: '#000' }}>{primaryGuardian?.phone || '___________'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Eğitim & Ödeme */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ backgroundColor: '#f0f0f0', border: '1px solid #000', padding: '3px 8px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>EĞİTİM & ÖDEME BİLGİLERİ</h3>
                    </div>
                    <table style={{ width: '100%', border: '1px solid #000', borderTop: 'none', fontSize: '9px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '5px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Program</td>
                          <td style={{ padding: '5px 6px', width: '15%', borderRight: '1px solid #ccc', color: '#000' }}>{programName}</td>
                          <td style={{ padding: '5px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Sınıf</td>
                          <td style={{ padding: '5px 6px', width: '10%', borderRight: '1px solid #ccc', color: '#000' }}>{education.gradeName || `${education.gradeId}. Sınıf`}</td>
                          <td style={{ padding: '5px 6px', width: '8%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Yıl</td>
                          <td style={{ padding: '5px 6px', width: '12%', fontWeight: 'bold', borderRight: '1px solid #ccc', color: '#000' }}>{education.academicYear}</td>
                          <td style={{ padding: '5px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Net Tutar</td>
                          <td style={{ padding: '5px 6px', width: '12%', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid #ccc', color: '#000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                          <td style={{ padding: '5px 6px', width: '8%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#000' }}>Taksit</td>
                          <td style={{ padding: '5px 6px', fontWeight: 'bold', color: '#000' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Taksit Planı */}
                  {payment.installments && payment.installments.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ backgroundColor: '#f0f0f0', border: '1px solid #000', padding: '3px 8px' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>TAKSİT PLANI ({payment.installments.length} Taksit)</h3>
                      </div>
                      <table style={{ width: '100%', border: '1px solid #000', borderTop: 'none', fontSize: '8px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid #000' }}>
                            <th style={{ padding: '3px 4px', textAlign: 'center', width: '30px', color: '#000', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>No</th>
                            <th style={{ padding: '3px 4px', textAlign: 'left', color: '#000', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Açıklama</th>
                            <th style={{ padding: '3px 4px', textAlign: 'center', width: '70px', color: '#000', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Vade Tarihi</th>
                            <th style={{ padding: '3px 4px', textAlign: 'right', width: '70px', color: '#000', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Tutar</th>
                            <th style={{ padding: '3px 4px', textAlign: 'center', width: '50px', color: '#000', fontWeight: 'bold' }}>İmza</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payment.installments.map((inst, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 'bold', color: '#000', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'P' : inst.no}</td>
                              <td style={{ padding: '3px 4px', color: '#000', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'Peşinat' : `${inst.no}. Taksit`}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'center', color: '#000', borderRight: '1px solid #ddd' }}>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__/__/____'}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 'bold', color: '#000', borderRight: '1px solid #ddd' }}>{inst.amount.toLocaleString('tr-TR')} TL</td>
                              <td style={{ padding: '3px 4px', textAlign: 'center', color: '#000' }}>______</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: '#f0f0f0', borderTop: '2px solid #000', fontWeight: 'bold' }}>
                            <td style={{ padding: '4px', color: '#000', fontSize: '9px', borderRight: '1px solid #ccc' }} colSpan={3}>TOPLAM</td>
                            <td style={{ padding: '4px', textAlign: 'right', fontSize: '10px', color: '#000', borderRight: '1px solid #ccc' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* İmza Alanları */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                    <div style={{ border: '2px solid #000', padding: '8px' }}>
                      <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '25px', fontSize: '10px', color: '#000', margin: '0 0 25px 0' }}>VELİ İMZASI</p>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '6px', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: '#000', fontWeight: '500', margin: 0 }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                        <p style={{ fontSize: '8px', color: '#666', margin: '2px 0 0 0' }}>Tarih: {today}</p>
                      </div>
                    </div>
                    <div style={{ border: '2px solid #000', padding: '8px' }}>
                      <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '25px', fontSize: '10px', color: '#000', margin: '0 0 25px 0' }}>KURUM YETKİLİSİ</p>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '6px', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: '#000', fontWeight: '500', margin: 0 }}>{contract.institutionOfficer || '________________________'}</p>
                        <p style={{ fontSize: '8px', color: '#666', margin: '2px 0 0 0' }}>Tarih: {today}</p>
                      </div>
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: '8px', color: '#888', marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '6px' }}>Sayfa 1/2 - Kayıt Formu | {organizationName}</p>
                </div>

                {/* ===== SAYFA 2 - SÖZLEŞME ===== */}
                <div style={{ padding: '15px 20px', minHeight: '1123px', boxSizing: 'border-box' }}>
                  {/* Başlık */}
                  <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h1 style={{ fontSize: '16px', fontWeight: '900', color: '#000', margin: 0 }}>EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                        <p style={{ fontSize: '10px', marginTop: '3px', color: '#000', margin: '3px 0 0 0' }}>{student.firstName} {student.lastName} - {education.academicYear} Öğretim Yılı</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#000', margin: 0 }}>{organizationName.toUpperCase()}</p>
                        <p style={{ fontSize: '9px', color: '#000', margin: '2px 0 0 0' }}>{today}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sözleşme Metni */}
                  <div style={{ border: '1px solid #000', padding: '12px', fontSize: '9px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#000' }}>
                    {`EĞİTİM HİZMETİ SÖZLEŞMESİ

İşbu sözleşme, ${organizationName} ("Kurum") ile aşağıda bilgileri bulunan veli arasında karşılıklı olarak düzenlenmiştir.

MADDE 1 - TARAFLAR
Kurum eğitim hizmetini sunmayı, Veli belirlenen ücret ve koşulları kabul etmeyi taahhüt eder.

MADDE 2 - EĞİTİM HİZMETİ
Kurum, öğretim yılı boyunca müfredat, ölçme-değerlendirme, rehberlik ve akademik danışmanlık hizmetlerini sunacaktır.

MADDE 3 - ÖDEME KOŞULLARI
Belirlenen ücret ve taksit planı her iki tarafça kabul edilmiştir. Taksitlerin zamanında ödenmemesi halinde kurum yasal işlem başlatma hakkını saklı tutar.

MADDE 4 - VELİ BEYANI
Veli; bilgilerin doğruluğunu, okul kurallarını kabul ettiğini, ödeme planını onayladığını ve KVKK kapsamında bilgilendirildiğini beyan eder.

MADDE 5 - KURUM BEYANI
Kurum, eğitim hizmetini sunmayı ve öğrenci dosyasını gizlilik esaslarına uygun korumayı taahhüt eder.

Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.`}
                  </div>

                  {/* Taraf Bilgileri */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                    <div style={{ border: '1px solid #000' }}>
                      <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderBottom: '1px solid #000' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>VELİ BİLGİLERİ</h4>
                      </div>
                      <div style={{ padding: '8px', fontSize: '9px' }}>
                        <p style={{ marginBottom: '4px', color: '#000', margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                        <p style={{ marginBottom: '4px', color: '#000', margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {primaryGuardian?.tcNo || '________________'}</p>
                        <p style={{ marginBottom: '0', color: '#000', margin: 0 }}><span style={{ fontWeight: '600' }}>Telefon:</span> {primaryGuardian?.phone || '________________'}</p>
                      </div>
                    </div>
                    <div style={{ border: '1px solid #000' }}>
                      <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderBottom: '1px solid #000' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>ÖĞRENCİ BİLGİLERİ</h4>
                      </div>
                      <div style={{ padding: '8px', fontSize: '9px' }}>
                        <p style={{ marginBottom: '4px', color: '#000', margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {student.firstName} {student.lastName}</p>
                        <p style={{ marginBottom: '4px', color: '#000', margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {student.tcNo || '________________'}</p>
                        <p style={{ marginBottom: '0', color: '#000', margin: 0 }}><span style={{ fontWeight: '600' }}>Program:</span> {programName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ödeme Özeti */}
                  <div style={{ border: '1px solid #000', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderBottom: '1px solid #000' }}>
                      <h4 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>ÖDEME PLANI ÖZETİ</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '8px', fontSize: '9px' }}>
                      <div><span style={{ fontWeight: '600', display: 'block', color: '#000', marginBottom: '2px' }}>Toplam Ücret</span><span style={{ color: '#000', fontSize: '10px' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</span></div>
                      <div><span style={{ fontWeight: '600', display: 'block', color: '#000', marginBottom: '2px' }}>İndirim</span><span style={{ color: '#000', fontSize: '10px' }}>{payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</span></div>
                      <div><span style={{ fontWeight: '600', display: 'block', color: '#000', marginBottom: '2px' }}>Net Tutar</span><span style={{ fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
                      <div><span style={{ fontWeight: '600', display: 'block', color: '#000', marginBottom: '2px' }}>Taksit</span><span style={{ color: '#000', fontSize: '10px' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</span></div>
                    </div>
                  </div>

                  {/* Onaylar */}
                  <div style={{ border: '1px solid #000', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderBottom: '1px solid #000' }}>
                      <h4 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0, color: '#000' }}>ONAYLAR</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px', fontSize: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={{ width: '12px', height: '12px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0, color: '#000' }}>
                          {contract.kvkkApproved ? 'X' : ''}
                        </span>
                        <span style={{ color: '#000' }}>KVKK Aydınlatma Metni okundu ve kabul edildi.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={{ width: '12px', height: '12px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0, color: '#000' }}>
                          {contract.termsApproved ? 'X' : ''}
                        </span>
                        <span style={{ color: '#000' }}>Okul kuralları ve yönetmelikleri kabul edildi.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={{ width: '12px', height: '12px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0, color: '#000' }}>
                          {contract.paymentApproved ? 'X' : ''}
                        </span>
                        <span style={{ color: '#000' }}>Ödeme planı ve koşulları kabul edildi.</span>
                      </div>
                    </div>
                  </div>

                  {/* İmza Alanları */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div style={{ border: '2px solid #000', padding: '8px' }}>
                      <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '25px', fontSize: '10px', color: '#000', margin: '0 0 25px 0' }}>VELİ İMZASI</p>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '6px', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: '#000', fontWeight: '500', margin: 0 }}>{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
                        <p style={{ fontSize: '8px', color: '#666', margin: '2px 0 0 0' }}>Tarih: {today}</p>
                      </div>
                    </div>
                    <div style={{ border: '2px solid #000', padding: '8px' }}>
                      <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '25px', fontSize: '10px', color: '#000', margin: '0 0 25px 0' }}>KURUM YETKİLİSİ</p>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '6px', textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: '#000', fontWeight: '500', margin: 0 }}>{contract.institutionOfficer || '________________________'}</p>
                        <p style={{ fontSize: '8px', color: '#666', margin: '2px 0 0 0' }}>Tarih: {today}</p>
                      </div>
                    </div>
                  </div>

                  {/* Alt Bilgi */}
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '8px' }}>
                    <p style={{ fontWeight: '600', color: '#000', margin: 0 }}>Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
                    <p style={{ color: '#666', margin: '3px 0 0 0' }}>Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.</p>
                    <p style={{ color: '#666', margin: '2px 0 0 0' }}>{organizationName} - {today}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};
