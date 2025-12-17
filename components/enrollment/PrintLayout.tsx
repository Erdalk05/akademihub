'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useEnrollmentStore } from './store';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { PROGRAMS, GUARDIAN_TYPES } from './types';
import { X, Printer, Edit3, Copy, ClipboardPaste, MessageCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadPDF } from '@/lib/utils/pdfGenerator';

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

  // PDF oluşturma fonksiyonu - yeni pdfGenerator kullanarak
  const generatePDFBlob = async (): Promise<Blob | null> => {
    const element = printContentRef.current;
    if (!element) {
      toast.error('İçerik bulunamadı!');
      return null;
    }

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      // Toolbar'ı gizle
      const toolbars = document.querySelectorAll('.toolbar-hide');
      toolbars.forEach(t => (t as HTMLElement).style.display = 'none');

      // Print-content'in padding'ini geçici olarak kaldır
      const originalPadding = element.style.paddingTop;
      element.style.paddingTop = '0';

      // İçeriği canvas'a çevir
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      // Toolbar'ı geri getir
      toolbars.forEach(t => (t as HTMLElement).style.display = '');
      element.style.paddingTop = originalPadding;

      // PDF oluştur
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      
      let heightLeft = imgHeight;
      let position = 0;

      // İlk sayfa
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ek sayfalar
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error);
      throw error;
    }
  };

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
      const pdfBlob = await generatePDFBlob();
      
      if (!pdfBlob) {
        toast.error('PDF oluşturulamadı!', { id: toastId });
        return;
      }

      const fileName = `Kayit_Sozlesmesi_${student.firstName}_${student.lastName}.pdf`;
      
      // PDF'i indir
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF indirildi!', { id: toastId });

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
      }, 500);
      
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
      const pdfBlob = await generatePDFBlob();
      
      if (!pdfBlob) {
        toast.error('PDF oluşturulamadı!', { id: toastId });
        return;
      }

      const fileName = `Kayit_Sozlesmesi_${student.firstName}_${student.lastName}.pdf`;
      
      // PDF'i indir
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
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
            margin: 8mm; 
          }
          html, body { 
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 10px !important;
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
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            page-break-inside: avoid !important;
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
        <div className="print-page page-break-after" style={{ width: '794px', height: '1123px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          
          {/* Başlık */}
          <div style={{ borderBottom: '4px solid #1a1a1a', paddingBottom: '20px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1a1a1a', margin: 0, letterSpacing: '-1px' }}>{organizationName.toUpperCase()}</h1>
                <p style={{ fontSize: '14px', color: '#666', margin: '6px 0 0 0' }}>Eğitim Kurumu</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ border: '4px solid #1a1a1a', padding: '12px 30px', display: 'inline-block', marginBottom: '10px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>KAYIT FORMU</h2>
                </div>
                <p style={{ fontSize: '13px', color: '#1a1a1a', margin: '0' }}>Tarih: {today}</p>
                <p style={{ fontSize: '13px', color: '#1a1a1a', margin: '4px 0 0 0' }}>Kayıt No: <strong>{student.studentNo || '____________'}</strong></p>
              </div>
            </div>
          </div>

          {/* ÖĞRENCİ BİLGİLERİ */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px', marginBottom: '0' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#fff', letterSpacing: '1px' }}>ÖĞRENCİ BİLGİLERİ</h3>
            </div>
            <table style={{ width: '100%', border: '2px solid #1a1a1a', borderTop: 'none', fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 14px', width: '18%', fontWeight: '600', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Ad Soyad</td>
                  <td style={{ padding: '12px 14px', width: '32%', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', color: '#1a1a1a' }}>{student.firstName} {student.lastName}</td>
                  <td style={{ padding: '12px 14px', width: '18%', fontWeight: '600', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>TC Kimlik No</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '14px', borderBottom: '1px solid #ccc', color: '#1a1a1a' }}>{student.tcNo || '___________________'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 14px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Doğum Tarihi</td>
                  <td style={{ padding: '12px 14px', borderRight: '1px solid #ccc', color: '#1a1a1a' }}>{student.birthDate || '___________________'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Cinsiyet</td>
                  <td style={{ padding: '12px 14px', color: '#1a1a1a' }}>{student.gender === 'male' ? 'Erkek' : student.gender === 'female' ? 'Kız' : '___________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VELİ BİLGİLERİ */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#fff', letterSpacing: '1px' }}>VELİ BİLGİLERİ</h3>
            </div>
            <table style={{ width: '100%', border: '2px solid #1a1a1a', borderTop: 'none', fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 14px', width: '18%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Yakınlık</td>
                  <td style={{ padding: '12px 14px', width: '15%', fontWeight: 'bold', borderRight: '1px solid #ccc', color: '#1a1a1a' }}>{getGuardianType(primaryGuardian?.type || '')}</td>
                  <td style={{ padding: '12px 14px', width: '18%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Ad Soyad</td>
                  <td style={{ padding: '12px 14px', width: '17%', fontWeight: 'bold', fontSize: '15px', borderRight: '1px solid #ccc', color: '#1a1a1a' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</td>
                  <td style={{ padding: '12px 14px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Telefon</td>
                  <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#1a1a1a' }}>{primaryGuardian?.phone || '________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* EĞİTİM & ÖDEME yan yana */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#fff', letterSpacing: '1px' }}>EĞİTİM BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '2px solid #1a1a1a', borderTop: 'none', fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '10px 14px', width: '45%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Program</td>
                    <td style={{ padding: '10px 14px', color: '#1a1a1a' }}>{programName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Sınıf</td>
                    <td style={{ padding: '10px 14px', color: '#1a1a1a' }}>{education.gradeName || `${education.gradeId}. Sınıf`}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Öğretim Yılı</td>
                    <td style={{ padding: '10px 14px', fontWeight: 'bold', fontSize: '14px', color: '#1a1a1a' }}>{education.academicYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#fff', letterSpacing: '1px' }}>ÖDEME BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '2px solid #1a1a1a', borderTop: 'none', fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '10px 14px', width: '45%', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Toplam Ücret</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#1a1a1a' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 'bold', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>NET TUTAR</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#1a1a1a' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: '600', borderRight: '1px solid #ccc', color: '#1a1a1a', backgroundColor: '#f5f5f5' }}>Taksit</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 'bold', color: '#1a1a1a' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TAKSİT PLANI */}
          {payment.installments && payment.installments.length > 0 && (
            <div style={{ marginBottom: '20px', flex: 1 }}>
              <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color: '#fff', letterSpacing: '1px' }}>TAKSİT PLANI ({payment.installments.length} Taksit)</h3>
              </div>
              <table style={{ width: '100%', border: '2px solid #1a1a1a', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e5e5' }}>
                    <th style={{ padding: '10px', textAlign: 'center', width: '50px', color: '#1a1a1a', fontWeight: 'bold', borderRight: '1px solid #999', borderBottom: '2px solid #1a1a1a' }}>No</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#1a1a1a', fontWeight: 'bold', borderRight: '1px solid #999', borderBottom: '2px solid #1a1a1a' }}>Açıklama</th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '110px', color: '#1a1a1a', fontWeight: 'bold', borderRight: '1px solid #999', borderBottom: '2px solid #1a1a1a' }}>Vade Tarihi</th>
                    <th style={{ padding: '10px', textAlign: 'right', width: '100px', color: '#1a1a1a', fontWeight: 'bold', borderRight: '1px solid #999', borderBottom: '2px solid #1a1a1a' }}>Tutar</th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '80px', color: '#1a1a1a', fontWeight: 'bold', borderBottom: '2px solid #1a1a1a' }}>İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.installments.map((inst, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: '#1a1a1a', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'P' : inst.no}</td>
                      <td style={{ padding: '8px 10px', color: '#1a1a1a', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'Peşinat' : `${inst.no}. Taksit`}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#1a1a1a', borderRight: '1px solid #ddd' }}>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__ / __ / ____'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: '#1a1a1a', borderRight: '1px solid #ddd' }}>{inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#1a1a1a' }}>________</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#e5e5e5' }}>
                    <td style={{ padding: '12px', color: '#1a1a1a', fontSize: '13px', fontWeight: 'bold', borderRight: '1px solid #999', borderTop: '2px solid #1a1a1a' }} colSpan={3}>TOPLAM</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a', borderRight: '1px solid #999', borderTop: '2px solid #1a1a1a' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                    <td style={{ borderTop: '2px solid #1a1a1a' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* İMZA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: 'auto', paddingTop: '20px' }}>
            <div style={{ border: '3px solid #1a1a1a', padding: '15px', height: '100px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '13px', color: '#1a1a1a', margin: '0 0 40px 0', letterSpacing: '1px' }}>VELİ İMZASI</p>
              <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: '600', margin: 0 }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
              </div>
            </div>
            <div style={{ border: '3px solid #1a1a1a', padding: '15px', height: '100px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '13px', color: '#1a1a1a', margin: '0 0 40px 0', letterSpacing: '1px' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: '600', margin: 0 }}>{contract.institutionOfficer || '________________________'}</p>
                <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '15px', borderTop: '2px solid #ddd', paddingTop: '10px' }}>Sayfa 1/2 - Kayıt Formu | {organizationName}</p>
        </div>

        {/* =============== SAYFA 2 - SÖZLEŞME =============== */}
        <div className="print-page" style={{ width: '794px', height: '1123px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', pageBreakBefore: 'always' }}>

          {/* Başlık */}
          <div style={{ borderBottom: '4px solid #1a1a1a', paddingBottom: '20px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a1a', margin: 0, letterSpacing: '-1px' }}>EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                <p style={{ fontSize: '14px', color: '#1a1a1a', margin: '8px 0 0 0' }}>{student.firstName} {student.lastName} - {education.academicYear} Öğretim Yılı</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '900', fontSize: '22px', color: '#1a1a1a', margin: 0, letterSpacing: '-0.5px' }}>{organizationName.toUpperCase()}</p>
                <p style={{ fontSize: '13px', color: '#1a1a1a', margin: '6px 0 0 0' }}>{today}</p>
              </div>
            </div>
          </div>

          {/* Düzenleme Araçları */}
          {isEditing && (
            <div className="no-print toolbar-hide" style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={handleCopy} style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}><Copy size={16}/> Kopyala</button>
              <button onClick={handlePaste} style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}><ClipboardPaste size={16}/> Yapıştır</button>
              <span style={{ fontSize: '13px', color: '#92400e' }}>Sözleşme metnini düzenleyebilirsiniz.</span>
            </div>
          )}

          {isEditing && (
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="no-print toolbar-hide"
              style={{ width: '100%', height: '200px', padding: '15px', border: '3px solid #fcd34d', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', resize: 'none', marginBottom: '15px' }}
            />
          )}

          {/* Sözleşme Metni */}
          <div style={{ border: '2px solid #1a1a1a', padding: '25px', fontSize: '13px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: '#1a1a1a', display: isEditing ? 'none' : 'block', marginBottom: '25px', flex: 1, backgroundColor: '#fafafa' }}>
            {contractText}
          </div>

          {/* Taraf Bilgileri */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ border: '2px solid #1a1a1a' }}>
              <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#fff', letterSpacing: '1px' }}>VELİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '15px', fontSize: '13px' }}>
                <p style={{ marginBottom: '8px', color: '#1a1a1a', margin: '0 0 8px 0' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ marginBottom: '8px', color: '#1a1a1a', margin: '0 0 8px 0' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {primaryGuardian?.tcNo || '________________________'}</p>
                <p style={{ marginBottom: '0', color: '#1a1a1a', margin: 0 }}><span style={{ fontWeight: '600' }}>Telefon:</span> {primaryGuardian?.phone || '________________________'}</p>
              </div>
            </div>
            <div style={{ border: '2px solid #1a1a1a' }}>
              <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#fff', letterSpacing: '1px' }}>ÖĞRENCİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '15px', fontSize: '13px' }}>
                <p style={{ marginBottom: '8px', color: '#1a1a1a', margin: '0 0 8px 0' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {student.firstName} {student.lastName}</p>
                <p style={{ marginBottom: '8px', color: '#1a1a1a', margin: '0 0 8px 0' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {student.tcNo || '________________________'}</p>
                <p style={{ marginBottom: '0', color: '#1a1a1a', margin: 0 }}><span style={{ fontWeight: '600' }}>Program:</span> {programName}</p>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti */}
          <div style={{ border: '2px solid #1a1a1a', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#fff', letterSpacing: '1px' }}>ÖDEME PLANI ÖZETİ</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '18px', fontSize: '13px' }}>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#1a1a1a', marginBottom: '5px' }}>Toplam Ücret</span><span style={{ color: '#1a1a1a', fontSize: '15px' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#1a1a1a', marginBottom: '5px' }}>İndirim</span><span style={{ color: '#1a1a1a', fontSize: '15px' }}>{payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#1a1a1a', marginBottom: '5px' }}>Net Tutar</span><span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1a1a1a' }}>{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#1a1a1a', marginBottom: '5px' }}>Taksit</span><span style={{ color: '#1a1a1a', fontSize: '15px' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</span></div>
            </div>
          </div>

          {/* Onaylar */}
          <div style={{ border: '2px solid #1a1a1a', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '10px 16px' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#fff', letterSpacing: '1px' }}>ONAYLAR</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '15px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '20px', height: '20px', border: '2px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0, color: '#1a1a1a' }}>
                  {contract.kvkkApproved ? '✓' : ''}
                </span>
                <span style={{ color: '#1a1a1a' }}>KVKK Aydınlatma Metni okundu ve kabul edildi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '20px', height: '20px', border: '2px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0, color: '#1a1a1a' }}>
                  {contract.termsApproved ? '✓' : ''}
                </span>
                <span style={{ color: '#1a1a1a' }}>Okul kuralları ve yönetmelikleri kabul edildi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '20px', height: '20px', border: '2px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0, color: '#1a1a1a' }}>
                  {contract.paymentApproved ? '✓' : ''}
                </span>
                <span style={{ color: '#1a1a1a' }}>Ödeme planı ve koşulları kabul edildi.</span>
              </div>
            </div>
          </div>

          {/* İMZA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: 'auto', paddingTop: '15px' }}>
            <div style={{ border: '3px solid #1a1a1a', padding: '15px', height: '100px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '13px', color: '#1a1a1a', margin: '0 0 40px 0', letterSpacing: '1px' }}>VELİ İMZASI</p>
              <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: '600', margin: 0 }}>{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
                <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
              </div>
            </div>
            <div style={{ border: '3px solid #1a1a1a', padding: '15px', height: '100px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '13px', color: '#1a1a1a', margin: '0 0 40px 0', letterSpacing: '1px' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: '600', margin: 0 }}>{contract.institutionOfficer || '________________________'}</p>
                <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
              </div>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: '2px solid #ddd', textAlign: 'center', fontSize: '11px' }}>
            <p style={{ fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
            <p style={{ color: '#666', margin: '4px 0 0 0' }}>Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.</p>
            <p style={{ color: '#666', margin: '4px 0 0 0' }}>{organizationName} - {today}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
