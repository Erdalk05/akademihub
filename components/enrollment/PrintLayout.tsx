'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useEnrollmentStore } from './store';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { PROGRAMS, GUARDIAN_TYPES } from './types';
import { X, Printer, Edit3, Copy, ClipboardPaste, MessageCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface PrintLayoutProps {
  onClose: () => void;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ onClose }) => {
  const { student, guardians, education, payment, contract } = useEnrollmentStore();
  const { currentOrganization } = useOrganizationStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Kurum adı - dinamik olarak mevcut kurumdan alınır
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';
  
  // Sözleşme metni kurum adıyla dinamik oluşturulur
  const defaultContractText = useMemo(() => `EĞİTİM HİZMETİ SÖZLEŞMESİ

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

Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.`, [organizationName]);

  const [contractText, setContractText] = useState(defaultContractText);
  
  // Kurum değiştiğinde sözleşme metnini güncelle
  useEffect(() => {
    setContractText(defaultContractText);
  }, [defaultContractText]);

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const program = PROGRAMS.find(p => p.id === education.programId);
  const programName = program?.name || education.programName || 'Belirtilmedi';
  const primaryGuardian = guardians.find(g => g.isEmergency) || guardians[0];

  const getGuardianType = (type: string) => GUARDIAN_TYPES.find(g => g.id === type)?.name || type;

  const handleCopy = () => { navigator.clipboard.writeText(contractText); alert('Kopyalandı!'); };
  const handlePaste = async () => {
    try { setContractText(await navigator.clipboard.readText()); alert('Yapıştırıldı!'); } 
    catch { alert('Pano erişimi gerekli.'); }
  };

  const printContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // PDF oluştur ve WhatsApp ile gönder
  const handleWhatsAppPDF = async () => {
    const phone = primaryGuardian?.phone;
    if (!phone) {
      toast.error('Veli telefon numarası bulunamadı!');
      return;
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading('PDF oluşturuluyor...');

    try {
      // html2pdf'i dinamik import et
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;
      
      const element = printContentRef.current;
      if (!element) {
        toast.error('İçerik bulunamadı!', { id: toastId });
        setIsGeneratingPdf(false);
        return;
      }

      const fileName = `Kayit_Sozlesmesi_${student.firstName}_${student.lastName}.pdf`;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // PDF'i oluştur ve indir
      await html2pdf().set(opt).from(element).save();
      
      toast.dismiss(toastId);
      toast.success('PDF indirildi!');

      // WhatsApp'ı aç
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '90' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('90') && formattedPhone.length === 10) {
        formattedPhone = '90' + formattedPhone;
      }

      const message = `📋 *KAYIT SÖZLEŞMESİ*\n\n` +
        `🏫 *${organizationName}*\n\n` +
        `👤 Öğrenci: ${student.firstName} ${student.lastName}\n` +
        `📚 Sınıf: ${education.gradeName || education.gradeId}. Sınıf\n` +
        `💰 Net Tutar: ${payment.netFee.toLocaleString('tr-TR')} TL\n` +
        `📅 Taksit: ${payment.installmentCount} x ${payment.monthlyInstallment.toLocaleString('tr-TR')} TL\n\n` +
        `📎 PDF sözleşme dosyası indirildi. Lütfen WhatsApp'tan dosya olarak ekleyerek gönderin.`;

      const encodedMessage = encodeURIComponent(message);
      
      // Biraz bekleyip WhatsApp'ı aç
      setTimeout(() => {
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
      }, 1000);
      
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error);
      toast.error(`PDF oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`, { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Sadece PDF indir (WhatsApp olmadan)
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const toastId = toast.loading('PDF oluşturuluyor...');

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;
      
      const element = printContentRef.current;
      if (!element) {
        toast.error('İçerik bulunamadı!', { id: toastId });
        setIsGeneratingPdf(false);
        return;
      }

      const fileName = `Kayit_Sozlesmesi_${student.firstName}_${student.lastName}.pdf`;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast.success('PDF başarıyla indirildi!', { id: toastId });
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error);
      toast.error(`PDF oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`, { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div id="enrollment-print-layout" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      {/* Toolbar - Sadece ekranda görünür */}
      <div className="toolbar-hide" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '210mm', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}><X size={20} /></button>
            <div>
              <p style={{ fontWeight: 'bold', color: '#000000', margin: 0 }}>{student.firstName} {student.lastName}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Kayıt Belgesi - Tam 2 Sayfa</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsEditing(!isEditing)} 
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isEditing ? '#fef3c7' : '#f3f4f6', color: isEditing ? '#92400e' : '#374151' }}>
              <Edit3 size={16} /> {isEditing ? 'Bitir' : 'Düzenle'}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              style={{ padding: '8px 20px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: isGeneratingPdf ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', opacity: isGeneratingPdf ? 0.7 : 1 }}
            >
              <Download size={16} /> {isGeneratingPdf ? 'PDF Hazırlanıyor...' : 'PDF İndir'}
            </button>
            <button 
              onClick={handleWhatsAppPDF}
              disabled={isGeneratingPdf}
              style={{ padding: '8px 20px', backgroundColor: '#25D366', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: isGeneratingPdf ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', opacity: isGeneratingPdf ? 0.7 : 1 }}
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button 
              onClick={() => window.print()} 
              style={{ padding: '8px 20px', backgroundColor: '#374151', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
            >
              <Printer size={16} /> Yazdır
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 12mm; 
          }
          html, body { 
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #enrollment-print-layout {
            background: white !important;
            min-height: auto !important;
          }
          .toolbar-hide { 
            display: none !important; 
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          #print-content { 
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-page { 
            box-shadow: none !important; 
            margin: 0 0 0 0 !important;
            padding: 15px !important;
            background: white !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
          }
          .page-break-after {
            page-break-after: always;
          }
          table { 
            border-collapse: collapse !important; 
            width: 100% !important; 
          }
          th, td {
            font-size: 11pt !important;
          }
        }
        @media screen { 
          .print-page { 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
            margin-bottom: 24px; 
            border-radius: 8px;
          } 
        }
      `}</style>

      <div id="print-content" ref={printContentRef} style={{ paddingTop: '72px', paddingBottom: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
        
        {/* =============== SAYFA 1 - KAYIT FORMU =============== */}
        <div className="print-page page-break-after" style={{ maxWidth: '210mm', margin: '0 auto', backgroundColor: '#ffffff', padding: '25px' }}>
          
          {/* Başlık */}
          <div style={{ borderBottom: '3px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', color: '#000000', margin: 0 }}>{organizationName.toUpperCase()}</h1>
                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>Eğitim Kurumu</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ border: '3px solid #000000', padding: '8px 20px', display: 'inline-block' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', margin: 0 }}>KAYIT FORMU</h2>
                </div>
                <p style={{ fontSize: '12px', marginTop: '8px', color: '#000000' }}>Tarih: {today}</p>
                <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#000000' }}>No: {student.studentNo || '______'}</p>
              </div>
            </div>
          </div>

          {/* ÖĞRENCİ BİLGİLERİ */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '2px solid #000000', padding: '8px 12px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#000000' }}>ÖĞRENCİ BİLGİLERİ</h3>
            </div>
            <table style={{ width: '100%', border: '2px solid #000000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '10px 12px', width: '25%', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Ad Soyad</td>
                  <td style={{ padding: '10px 12px', width: '25%', fontWeight: 'bold', fontSize: '14px', borderRight: '1px solid #000000', color: '#000000' }}>{student.firstName} {student.lastName}</td>
                  <td style={{ padding: '10px 12px', width: '25%', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>TC Kimlik No</td>
                  <td style={{ padding: '10px 12px', width: '25%', fontFamily: 'monospace', fontSize: '13px', color: '#000000' }}>{student.tcNo || '___________________'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Doğum Tarihi</td>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #000000', color: '#000000' }}>{student.birthDate || '___________________'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Cinsiyet</td>
                  <td style={{ padding: '10px 12px', color: '#000000' }}>{student.gender === 'male' ? 'Erkek' : student.gender === 'female' ? 'Kız' : '___________________'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Kan Grubu</td>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #000000', color: '#000000' }}>{student.bloodGroup || '____'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Telefon</td>
                  <td style={{ padding: '10px 12px', color: '#000000' }}>{student.phone ? `+90 ${student.phone}` : '___________________'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Adres</td>
                  <td style={{ padding: '10px 12px', color: '#000000' }} colSpan={3}>{[student.city, student.district, student.address].filter(Boolean).join(', ') || '________________________________________________________________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VELİ BİLGİLERİ */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '2px solid #000000', padding: '8px 12px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#000000' }}>VELİ BİLGİLERİ</h3>
            </div>
            {guardians.filter(g => g.firstName).slice(0, 2).map((g, i) => (
              <table key={g.id} style={{ width: '100%', border: '2px solid #000000', borderTop: i === 0 ? 'none' : '2px solid #000000', fontSize: '12px', borderCollapse: 'collapse', marginTop: i > 0 ? '8px' : '0' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '10px 12px', width: '25%', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Yakınlık</td>
                    <td style={{ padding: '10px 12px', width: '25%', fontWeight: 'bold', fontSize: '13px', borderRight: '1px solid #000000', color: '#000000' }}>{getGuardianType(g.type)}</td>
                    <td style={{ padding: '10px 12px', width: '25%', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Ad Soyad</td>
                    <td style={{ padding: '10px 12px', width: '25%', fontWeight: 'bold', fontSize: '14px', color: '#000000' }}>{g.firstName} {g.lastName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>TC Kimlik No</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '13px', borderRight: '1px solid #000000', color: '#000000' }}>{g.tcNo || '___________________'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Telefon</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '13px', color: '#000000' }}>{g.phone ? `+90 ${g.phone}` : '___________________'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>E-posta</td>
                    <td style={{ padding: '10px 12px', borderRight: '1px solid #000000', color: '#000000' }}>{g.email || '___________________'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Meslek</td>
                    <td style={{ padding: '10px 12px', color: '#000000' }}>{g.job || '___________________'}</td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>

          {/* EĞİTİM ve ÖDEME BİLGİLERİ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Eğitim */}
            <div>
              <div style={{ backgroundColor: '#ffffff', border: '2px solid #000000', padding: '8px 12px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#000000' }}>EĞİTİM BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '2px solid #000000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600', width: '50%', borderRight: '1px solid #000000', color: '#000000' }}>Program</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '13px', color: '#000000' }}>{programName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Sınıf / Şube</td>
                    <td style={{ padding: '10px 12px', color: '#000000' }}>{education.gradeName || `${education.gradeId}. Sınıf`} {education.branchName ? `/ ${education.branchName}` : ''}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Öğretim Yılı</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '13px', color: '#000000' }}>{education.academicYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ödeme */}
            <div>
              <div style={{ backgroundColor: '#ffffff', border: '2px solid #000000', padding: '8px 12px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#000000' }}>ÖDEME BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '2px solid #000000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600', width: '50%', borderRight: '1px solid #000000', color: '#000000' }}>Toplam Ücret</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#000000' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  {payment.discount > 0 && (
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>İndirim</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#000000' }}>-{payment.discount.toLocaleString('tr-TR')} TL</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '2px solid #000000' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', borderRight: '1px solid #000000', color: '#000000' }}>NET TUTAR</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>Taksit</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#000000' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TAKSİT PLANI */}
          {payment.installments && payment.installments.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '2px solid #000000', padding: '8px 12px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#000000' }}>TAKSİT PLANI</h3>
              </div>
              <table style={{ width: '100%', border: '2px solid #000000', borderTop: 'none', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #000000' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', width: '50px', color: '#000000', fontWeight: 'bold', borderRight: '1px solid #000000' }}>No</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#000000', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Açıklama</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', width: '100px', color: '#000000', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Vade Tarihi</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px', color: '#000000', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Tutar</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px', color: '#000000', fontWeight: 'bold' }}>İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.installments.map((inst, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px', color: '#000000', borderRight: '1px solid #000000' }}>{inst.no === 0 ? 'P' : inst.no}</td>
                      <td style={{ padding: '8px 10px', color: '#000000', borderRight: '1px solid #000000' }}>{inst.no === 0 ? 'Peşinat' : `${inst.no}. Taksit`}</td>
                      <td style={{ padding: '8px 10px', color: '#000000', borderRight: '1px solid #000000' }}>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__ / __ / ____'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#000000', borderRight: '1px solid #000000' }}>{inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#000000' }}>______</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #000000', fontWeight: 'bold' }}>
                    <td style={{ padding: '10px', color: '#000000', fontSize: '12px', borderRight: '1px solid #000000' }} colSpan={3}>TOPLAM</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px', color: '#000000', borderRight: '1px solid #000000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* İMZA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ border: '3px solid #000000', padding: '15px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', fontSize: '14px', color: '#000000' }}>VELİ İMZASI</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#000000', fontWeight: '500' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Tarih: {today}</p>
              </div>
            </div>
            <div style={{ border: '3px solid #000000', padding: '15px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', fontSize: '14px', color: '#000000' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#000000', fontWeight: '500' }}>{contract.institutionOfficer || '________________________'}</p>
                <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Tarih: {today}</p>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginTop: '16px', borderTop: '2px solid #000000', paddingTop: '10px' }}>Sayfa 1/2 - Kayıt Formu</p>
        </div>

        {/* =============== SAYFA 2 - SÖZLEŞME =============== */}
        <div className="print-page" style={{ maxWidth: '210mm', margin: '0 auto', backgroundColor: '#ffffff', padding: '25px' }}>

          {/* Başlık */}
          <div style={{ borderBottom: '3px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#000000', margin: 0 }}>EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                <p style={{ fontSize: '14px', marginTop: '6px', color: '#000000' }}>{student.firstName} {student.lastName} - {education.academicYear} Öğretim Yılı</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', fontSize: '20px', color: '#000000', margin: 0 }}>{organizationName.toUpperCase()}</p>
                <p style={{ fontSize: '12px', color: '#000000', marginTop: '4px' }}>{today}</p>
              </div>
            </div>
          </div>

          {/* Düzenleme Araçları */}
          {isEditing && (
            <div className="no-print" style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleCopy} style={{ padding: '4px 8px', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}><Copy size={12}/> Kopyala</button>
              <button onClick={handlePaste} style={{ padding: '4px 8px', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}><ClipboardPaste size={12}/> Yapıştır</button>
              <span style={{ fontSize: '10px', color: '#92400e' }}>Sözleşme metnini düzenleyebilirsiniz.</span>
            </div>
          )}

          {isEditing && (
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="no-print"
              style={{ width: '100%', height: '160px', padding: '10px', border: '2px solid #fcd34d', borderRadius: '6px', fontSize: '10px', lineHeight: '1.4', resize: 'none', marginBottom: '10px' }}
            />
          )}

          {/* Sözleşme Metni */}
          <div style={{ border: '2px solid #000000', padding: '20px', fontSize: '12px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#000000', display: isEditing ? 'none' : 'block' }}>
            {contractText}
          </div>

          {/* Taraf Bilgileri */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <div style={{ border: '2px solid #000000' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderBottom: '2px solid #000000' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#000000' }}>VELİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '12px', fontSize: '12px' }}>
                <p style={{ marginBottom: '8px', color: '#000000' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ marginBottom: '8px', color: '#000000' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {primaryGuardian?.tcNo || '________________________'}</p>
                <p style={{ marginBottom: '0', color: '#000000' }}><span style={{ fontWeight: '600' }}>Telefon:</span> {primaryGuardian?.phone ? `+90 ${primaryGuardian.phone}` : '________________________'}</p>
              </div>
            </div>
            <div style={{ border: '2px solid #000000' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderBottom: '2px solid #000000' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#000000' }}>ÖĞRENCİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '12px', fontSize: '12px' }}>
                <p style={{ marginBottom: '8px', color: '#000000' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {student.firstName} {student.lastName}</p>
                <p style={{ marginBottom: '8px', color: '#000000' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {student.tcNo || '________________________'}</p>
                <p style={{ marginBottom: '0', color: '#000000' }}><span style={{ fontWeight: '600' }}>Program:</span> {programName}</p>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti */}
          <div style={{ border: '2px solid #000000', marginTop: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderBottom: '2px solid #000000' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#000000' }}>ÖDEME PLANI ÖZETİ</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px', fontSize: '12px' }}>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000', marginBottom: '4px' }}>Toplam Ücret</span><span style={{ color: '#000000', fontSize: '14px' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000', marginBottom: '4px' }}>İndirim</span><span style={{ color: '#000000', fontSize: '14px' }}>{payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000', marginBottom: '4px' }}>Net Tutar</span><span style={{ fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000', marginBottom: '4px' }}>Taksit</span><span style={{ color: '#000000', fontSize: '14px' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</span></div>
            </div>
          </div>

          {/* Onaylar */}
          <div style={{ border: '2px solid #000000', marginTop: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderBottom: '2px solid #000000' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#000000' }}>ONAYLAR</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, color: '#000000' }}>
                  {contract.kvkkApproved ? 'X' : ''}
                </span>
                <span style={{ color: '#000000' }}>KVKK Aydınlatma Metni okundu ve kabul edildi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, color: '#000000' }}>
                  {contract.termsApproved ? 'X' : ''}
                </span>
                <span style={{ color: '#000000' }}>Okul kuralları ve yönetmelikleri kabul edildi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, color: '#000000' }}>
                  {contract.paymentApproved ? 'X' : ''}
                </span>
                <span style={{ color: '#000000' }}>Ödeme planı ve koşulları kabul edildi.</span>
              </div>
            </div>
          </div>

          {/* İMZA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ border: '3px solid #000000', padding: '15px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', fontSize: '14px', color: '#000000' }}>VELİ İMZASI</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#000000', fontWeight: '500' }}>{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
                <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Tarih: {today}</p>
              </div>
            </div>
            <div style={{ border: '3px solid #000000', padding: '15px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', fontSize: '14px', color: '#000000' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#000000', fontWeight: '500' }}>{contract.institutionOfficer || '________________________'}</p>
                <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Tarih: {today}</p>
              </div>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #000000', textAlign: 'center', fontSize: '11px' }}>
            <p style={{ fontWeight: '600', color: '#000000' }}>Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
            <p style={{ color: '#4b5563', marginTop: '4px' }}>Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.</p>
            <p style={{ color: '#4b5563' }}>{organizationName} - {today}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
