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

      {/* Print stilleri globals.css'e taşındı */}

      <div id="print-content" ref={printContentRef} className="print-content" style={{ paddingTop: '72px', paddingBottom: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
        
        {/* =============== SAYFA 1 - KAYIT FORMU =============== */}
        <div className="print-page page-break-after" style={{ width: '210mm', maxWidth: '794px', margin: '0 auto', backgroundColor: '#fff', padding: '15px 20px', boxSizing: 'border-box' }}>
          
          {/* Başlık */}
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
<div style={{ border: '2px solid #000', padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '-0.5px' }}>AkademiHub</span>
                      </div>
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{organizationName.toUpperCase()}</h1>
                <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>Eğitim Kurumu</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ border: '1px solid #000', padding: '4px 12px', display: 'inline-block' }}>
                <h2 style={{ fontSize: '12px', fontWeight: '800', margin: 0 }}>KAYIT FORMU</h2>
              </div>
              <p style={{ fontSize: '9px', margin: '3px 0 0 0' }}>Tarih: {today} | No: {student.studentNo || '____'}</p>
            </div>
          </div>

          {/* ÖĞRENCİ BİLGİLERİ */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>ÖĞRENCİ BİLGİLERİ</h3>
            </div>
            <table style={{ width: '100%', border: '1px solid #000', fontSize: '9px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 6px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>Ad Soyad</td>
                  <td style={{ padding: '4px 6px', width: '28%', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>{student.firstName} {student.lastName}</td>
                  <td style={{ padding: '4px 6px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>TC Kimlik No</td>
                  <td style={{ padding: '4px 6px', width: '20%', fontFamily: 'monospace', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>{student.tcNo || '_____________'}</td>
                  <td style={{ padding: '4px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>Doğum Tarihi</td>
                  <td style={{ padding: '4px 6px' }}>{student.birthDate || '__________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VELİ BİLGİLERİ */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>VELİ BİLGİLERİ</h3>
            </div>
            <table style={{ width: '100%', border: '1px solid #000', fontSize: '9px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc' }}>Yakınlık</td>
                  <td style={{ padding: '4px 6px', width: '12%', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>{getGuardianType(primaryGuardian?.type || '')}</td>
                  <td style={{ padding: '4px 6px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc' }}>Ad Soyad</td>
                  <td style={{ padding: '4px 6px', width: '25%', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</td>
                  <td style={{ padding: '4px 6px', width: '8%', fontWeight: '600', borderRight: '1px solid #ccc' }}>Telefon</td>
                  <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{primaryGuardian?.phone || '____________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* EĞİTİM & ÖDEME yan yana */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>EĞİTİM BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '1px solid #000', fontSize: '9px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '4px 6px', width: '40%', fontWeight: '600', borderRight: '1px solid #ccc' }}>Program</td>
                    <td style={{ padding: '4px 6px' }}>{programName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '4px 6px', fontWeight: '600', borderRight: '1px solid #ccc' }}>Sınıf</td>
                    <td style={{ padding: '4px 6px' }}>{education.gradeName || `${education.gradeId}. Sınıf`}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontWeight: '600', borderRight: '1px solid #ccc' }}>Öğretim Yılı</td>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{education.academicYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>ÖDEME BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '1px solid #000', fontSize: '9px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '4px 6px', width: '40%', fontWeight: '600', borderRight: '1px solid #ccc' }}>Toplam Ücret</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>NET TUTAR</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontWeight: '600', borderRight: '1px solid #ccc' }}>Taksit</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TAKSİT PLANI - KOMPAKT */}
          {payment.installments && payment.installments.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>TAKSİT PLANI ({payment.installments.length} Taksit)</h3>
              </div>
              <table style={{ width: '100%', border: '1px solid #000', fontSize: '8px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: '3px', textAlign: 'center', width: '25px', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1px solid #000' }}>No</th>
                    <th style={{ padding: '3px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1px solid #000' }}>Açıklama</th>
                    <th style={{ padding: '3px', textAlign: 'center', width: '70px', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1px solid #000' }}>Vade</th>
                    <th style={{ padding: '3px', textAlign: 'right', width: '60px', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1px solid #000' }}>Tutar</th>
                    <th style={{ padding: '3px', textAlign: 'center', width: '40px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.installments.map((inst, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '2px 3px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'P' : inst.no}</td>
                      <td style={{ padding: '2px 3px', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'Peşinat' : `${inst.no}. Taksit`}</td>
                      <td style={{ padding: '2px 3px', textAlign: 'center', borderRight: '1px solid #ddd' }}>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__/__/____'}</td>
                      <td style={{ padding: '2px 3px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>{inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style={{ padding: '2px 3px', textAlign: 'center' }}>____</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <td style={{ padding: '4px', fontSize: '9px', fontWeight: 'bold', borderRight: '1px solid #ccc', borderTop: '1px solid #000' }} colSpan={3}>TOPLAM</td>
                    <td style={{ padding: '4px', textAlign: 'right', fontSize: '10px', fontWeight: 'bold', borderRight: '1px solid #ccc', borderTop: '1px solid #000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                    <td style={{ borderTop: '1px solid #000' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* İMZA ALANI - KOMPAKT */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <div style={{ flex: 1, border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '9px', margin: '0 0 20px 0' }}>VELİ İMZASI</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '8px', margin: 0 }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
              <p style={{ fontSize: '7px', color: '#666', margin: 0 }}>Tarih: {today}</p>
            </div>
            <div style={{ flex: 1, border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '9px', margin: '0 0 20px 0' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '8px', margin: 0 }}>{contract.institutionOfficer || '________________'}</p>
              <p style={{ fontSize: '7px', color: '#666', margin: 0 }}>Tarih: {today}</p>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '7px', color: '#666', marginTop: '6px', borderTop: '1px solid #ddd', paddingTop: '4px' }}>Sayfa 1/2 - Kayıt Formu | {organizationName}</p>
        </div>

        {/* =============== SAYFA 2 - SÖZLEŞME =============== */}
        <div className="print-page" style={{ width: '210mm', maxWidth: '794px', margin: '0 auto', backgroundColor: '#fff', padding: '15px 20px', boxSizing: 'border-box', pageBreakBefore: 'always' }}>

          {/* Başlık */}
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
              <p style={{ fontSize: '9px', margin: '3px 0 0 0' }}>{student.firstName} {student.lastName} - {education.academicYear}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '800', fontSize: '12px', margin: 0 }}>{organizationName.toUpperCase()}</p>
                <p style={{ fontSize: '9px', margin: 0 }}>{today}</p>
              </div>
              <div style={{ width: '30px', height: '30px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '900' }}>İ</span>
              </div>
            </div>
          </div>

          {/* Düzenleme Araçları */}
          {isEditing && (
            <div className="no-print toolbar-hide" style={{ marginBottom: '6px', padding: '6px', backgroundColor: '#fef3c7', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleCopy} style={{ padding: '4px 8px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', cursor: 'pointer' }}><Copy size={12}/> Kopyala</button>
              <button onClick={handlePaste} style={{ padding: '4px 8px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', cursor: 'pointer' }}><ClipboardPaste size={12}/> Yapıştır</button>
            </div>
          )}

          {isEditing && (
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="no-print toolbar-hide"
              style={{ width: '100%', height: '100px', padding: '8px', border: '2px solid #fcd34d', borderRadius: '4px', fontSize: '9px', lineHeight: '1.4', resize: 'none', marginBottom: '6px' }}
            />
          )}

          {/* Sözleşme Metni */}
          <div style={{ border: '1px solid #000', padding: '8px', fontSize: '8px', lineHeight: '1.5', whiteSpace: 'pre-wrap', display: isEditing ? 'none' : 'block', marginBottom: '8px' }}>
            {contractText}
          </div>

          {/* Taraf Bilgileri */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <div style={{ flex: 1, border: '1px solid #000' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0 }}>VELİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '6px 8px', fontSize: '8px' }}>
                <p style={{ margin: '0 0 3px 0' }}><strong>Ad Soyad:</strong> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ margin: '0 0 3px 0' }}><strong>TC Kimlik:</strong> {primaryGuardian?.tcNo || '____________'}</p>
                <p style={{ margin: 0 }}><strong>Telefon:</strong> {primaryGuardian?.phone || '____________'}</p>
              </div>
            </div>
            <div style={{ flex: 1, border: '1px solid #000' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0 }}>ÖĞRENCİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '6px 8px', fontSize: '8px' }}>
                <p style={{ margin: '0 0 3px 0' }}><strong>Ad Soyad:</strong> {student.firstName} {student.lastName}</p>
                <p style={{ margin: '0 0 3px 0' }}><strong>TC Kimlik:</strong> {student.tcNo || '____________'}</p>
                <p style={{ margin: 0 }}><strong>Program:</strong> {programName}</p>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti */}
          <div style={{ border: '1px solid #000', marginBottom: '8px' }}>
            <div style={{ borderBottom: '1px solid #000', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0 }}>ÖDEME PLANI ÖZETİ</h4>
            </div>
            <div style={{ display: 'flex', padding: '6px 8px', fontSize: '8px' }}>
              <div style={{ flex: 1 }}><strong>Toplam:</strong> {payment.totalFee.toLocaleString('tr-TR')} TL</div>
              <div style={{ flex: 1 }}><strong>İndirim:</strong> {payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</div>
              <div style={{ flex: 1 }}><strong>Net:</strong> <span style={{ fontWeight: 'bold', fontSize: '10px' }}>{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
              <div style={{ flex: 1 }}><strong>Taksit:</strong> {payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</div>
            </div>
          </div>

          {/* Onaylar - KOMPAKT */}
          <div style={{ border: '1px solid #000', marginBottom: '8px' }}>
            <div style={{ borderBottom: '1px solid #000', padding: '3px 8px', backgroundColor: '#f5f5f5' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0 }}>ONAYLAR</h4>
            </div>
            <div style={{ display: 'flex', padding: '6px 8px', fontSize: '7px', gap: '15px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', border: '1px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                  {contract.kvkkApproved ? '✓' : ''}
                </span>
                <span>KVKK kabul edildi</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', border: '1px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                  {contract.termsApproved ? '✓' : ''}
                </span>
                <span>Okul kuralları kabul edildi</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', border: '1px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                  {contract.paymentApproved ? '✓' : ''}
                </span>
                <span>Ödeme planı kabul edildi</span>
              </div>
            </div>
          </div>

          {/* İMZA ALANI - KOMPAKT */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <div style={{ flex: 1, border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '9px', margin: '0 0 20px 0' }}>VELİ İMZASI</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '8px', margin: 0 }}>{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
              <p style={{ fontSize: '7px', color: '#666', margin: 0 }}>Tarih: {today}</p>
            </div>
            <div style={{ flex: 1, border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '9px', margin: '0 0 20px 0' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '8px', margin: 0 }}>{contract.institutionOfficer || '________________'}</p>
              <p style={{ fontSize: '7px', color: '#666', margin: 0 }}>Tarih: {today}</p>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '7px' }}>
            <p style={{ fontWeight: '600', margin: 0 }}>Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
            <p style={{ color: '#666', margin: '2px 0 0 0' }}>Bu sözleşme iki nüsha olarak düzenlenmiştir. | {organizationName} - {today}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
