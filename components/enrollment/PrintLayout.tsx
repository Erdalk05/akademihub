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
  
  const organizationName = currentOrganization?.name || 'Eğitim Kurumu';
  
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
  
  useEffect(() => {
    setContractText(defaultContractText);
  }, [defaultContractText]);

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const program = PROGRAMS.find(p => p.id === education.programId);
  const programName = program?.name || education.programName || 'Belirtilmedi';
  const primaryGuardian = guardians.find(g => g.isEmergency) || guardians[0];

  const getGuardianType = (type: string) => GUARDIAN_TYPES.find(g => g.id === type)?.name || type;

  const handleCopy = () => { navigator.clipboard.writeText(contractText); toast.success('Kopyalandı!'); };
  const handlePaste = async () => {
    try { setContractText(await navigator.clipboard.readText()); toast.success('Yapıştırıldı!'); } 
    catch { toast.error('Pano erişimi gerekli.'); }
  };

  const printContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Taksit sayısına göre font boyutu hesapla
  const installmentCount = payment.installments?.length || 0;
  const getInstallmentFontSize = () => {
    if (installmentCount <= 6) return '11px';
    if (installmentCount <= 9) return '10px';
    if (installmentCount <= 12) return '9px';
    return '8px';
  };
  const getInstallmentPadding = () => {
    if (installmentCount <= 6) return '6px 8px';
    if (installmentCount <= 9) return '4px 6px';
    return '3px 5px';
  };

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

      const toolbars = document.querySelectorAll('.toolbar-hide');
      toolbars.forEach(t => (t as HTMLElement).style.display = 'none');

      const pages = element.querySelectorAll('.print-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      toolbars.forEach(t => (t as HTMLElement).style.display = '');
      return pdf.output('blob');
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error);
      throw error;
    }
  };

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
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF indirildi!', { id: toastId });

      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '90' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('90') && formattedPhone.length === 10) {
        formattedPhone = '90' + formattedPhone;
      }

      const message = `📋 *KAYIT SÖZLEŞMESİ*\n\n🏫 *${organizationName}*\n\n👤 Öğrenci: ${student.firstName} ${student.lastName}\n📚 Sınıf: ${education.gradeName || education.gradeId}. Sınıf\n💰 Net Tutar: ${payment.netFee.toLocaleString('tr-TR')} TL\n📅 Taksit: ${payment.installmentCount} x ${payment.monthlyInstallment.toLocaleString('tr-TR')} TL\n\n📎 PDF sözleşme dosyası ektedir.`;
      const encodedMessage = encodeURIComponent(message);
      
      setTimeout(() => {
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
      }, 500);
      
    } catch (error: any) {
      toast.error(`PDF oluşturulamadı: ${error.message}`, { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
      toast.error(`PDF oluşturulamadı: ${error.message}`, { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // A4 sayfa stilleri
  const pageStyle: React.CSSProperties = {
    width: '210mm',
    height: '297mm',
    maxWidth: '794px',
    margin: '0 auto 20px',
    backgroundColor: '#fff',
    padding: '15mm 18mm',
    boxSizing: 'border-box',
    position: 'relative',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  };

  return (
    <div id="enrollment-print-layout" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      {/* Toolbar */}
      <div className="toolbar-hide" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '210mm', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}><X size={20} /></button>
            <div>
              <p style={{ fontWeight: 'bold', color: '#000000', margin: 0 }}>{student.firstName} {student.lastName}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Kayıt Belgesi - 2 Sayfa A4</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsEditing(!isEditing)} 
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isEditing ? '#fef3c7' : '#f3f4f6', color: isEditing ? '#92400e' : '#374151' }}>
              <Edit3 size={16} /> {isEditing ? 'Bitir' : 'Düzenle'}
            </button>
            <button onClick={handleDownloadPDF} disabled={isGeneratingPdf}
              style={{ padding: '8px 20px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: isGeneratingPdf ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', opacity: isGeneratingPdf ? 0.7 : 1 }}>
              <Download size={16} /> PDF İndir
            </button>
            <button onClick={handleWhatsAppPDF} disabled={isGeneratingPdf}
              style={{ padding: '8px 20px', backgroundColor: '#25D366', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: isGeneratingPdf ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', opacity: isGeneratingPdf ? 0.7 : 1 }}>
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button onClick={() => window.print()} 
              style={{ padding: '8px 20px', backgroundColor: '#374151', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
              <Printer size={16} /> Yazdır
            </button>
          </div>
        </div>
      </div>

      <div id="print-content" ref={printContentRef} className="print-content" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        
        {/* =============== SAYFA 1 - KAYIT FORMU =============== */}
        <div className="print-page page-break-after" style={pageStyle}>
          
          {/* Başlık */}
          <div style={{ borderBottom: '3px solid #000', paddingBottom: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ border: '2px solid #000', padding: '6px 14px' }}>
                <span style={{ fontSize: '16px', fontWeight: '900' }}>AkademiHub</span>
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{organizationName.toUpperCase()}</h1>
                <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Eğitim Kurumu</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ border: '2px solid #000', padding: '6px 16px', display: 'inline-block', backgroundColor: '#f5f5f5' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>KAYIT FORMU</h2>
              </div>
              <p style={{ fontSize: '11px', margin: '5px 0 0 0' }}>Tarih: {today}</p>
            </div>
          </div>

          {/* ÖĞRENCİ BİLGİLERİ */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>
              ÖĞRENCİ BİLGİLERİ
            </div>
            <table style={{ width: '100%', border: '2px solid #000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 10px', width: '15%', fontWeight: '600', borderRight: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>Ad Soyad</td>
                  <td style={{ padding: '8px 10px', width: '35%', fontWeight: 'bold', fontSize: '13px', borderRight: '1px solid #ccc' }}>{student.firstName} {student.lastName}</td>
                  <td style={{ padding: '8px 10px', width: '15%', fontWeight: '600', borderRight: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>TC Kimlik</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '12px' }}>{student.tcNo || '_____________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VELİ BİLGİLERİ */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>
              VELİ BİLGİLERİ
            </div>
            <table style={{ width: '100%', border: '2px solid #000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 10px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>Yakınlık</td>
                  <td style={{ padding: '8px 10px', width: '13%', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>{getGuardianType(primaryGuardian?.type || '')}</td>
                  <td style={{ padding: '8px 10px', width: '12%', fontWeight: '600', borderRight: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>Ad Soyad</td>
                  <td style={{ padding: '8px 10px', width: '28%', fontWeight: 'bold', fontSize: '13px', borderRight: '1px solid #ccc' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</td>
                  <td style={{ padding: '8px 10px', width: '10%', fontWeight: '600', borderRight: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>Telefon</td>
                  <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{primaryGuardian?.phone || '____________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* EĞİTİM & ÖDEME yan yana */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>
                EĞİTİM BİLGİLERİ
              </div>
              <table style={{ width: '100%', border: '2px solid #000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 10px', width: '40%', fontWeight: '600', backgroundColor: '#f9f9f9' }}>Program</td>
                    <td style={{ padding: '6px 10px' }}>{programName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 10px', fontWeight: '600', backgroundColor: '#f9f9f9' }}>Sınıf</td>
                    <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>{education.gradeName || `${education.gradeId}. Sınıf`}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: '600', backgroundColor: '#f9f9f9' }}>Öğretim Yılı</td>
                    <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>{education.academicYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>
                ÖDEME BİLGİLERİ
              </div>
              <table style={{ width: '100%', border: '2px solid #000', borderTop: 'none', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 10px', width: '45%', fontWeight: '600', backgroundColor: '#f9f9f9' }}>Toplam Ücret</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>NET TUTAR</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: '600', backgroundColor: '#f9f9f9' }}>Taksit</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TAKSİT PLANI */}
          {payment.installments && payment.installments.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>
                TAKSİT PLANI ({payment.installments.length} Taksit)
              </div>
              <table style={{ width: '100%', border: '2px solid #000', borderTop: 'none', fontSize: getInstallmentFontSize(), borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: getInstallmentPadding(), textAlign: 'center', width: '8%', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '2px solid #000' }}>#</th>
                    <th style={{ padding: getInstallmentPadding(), textAlign: 'center', width: '22%', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '2px solid #000' }}>Vade Tarihi</th>
                    <th style={{ padding: getInstallmentPadding(), textAlign: 'right', width: '20%', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '2px solid #000' }}>Tutar</th>
                    <th style={{ padding: getInstallmentPadding(), textAlign: 'right', width: '20%', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '2px solid #000' }}>Ödenen</th>
                    <th style={{ padding: getInstallmentPadding(), textAlign: 'center', width: '30%', fontWeight: 'bold', borderBottom: '2px solid #000' }}>İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.installments.map((inst, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: getInstallmentPadding(), textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>{inst.no === 0 ? 'P' : inst.no}</td>
                      <td style={{ padding: getInstallmentPadding(), textAlign: 'center', borderRight: '1px solid #ddd' }}>
                        {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__/__/____'}
                      </td>
                      <td style={{ padding: getInstallmentPadding(), textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>{inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style={{ padding: getInstallmentPadding(), textAlign: 'right', borderRight: '1px solid #ddd', color: '#999' }}>—</td>
                      <td style={{ padding: getInstallmentPadding(), textAlign: 'center' }}></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <td colSpan={2} style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 'bold', borderTop: '2px solid #000' }}>TOPLAM</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', borderTop: '2px solid #000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                    <td colSpan={2} style={{ borderTop: '2px solid #000' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* İMZA ALANI */}
          <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
            <div style={{ flex: 1, border: '2px solid #000', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 30px 0' }}>VELİ İMZASI</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
              <p style={{ fontSize: '11px', margin: 0, fontWeight: 'bold' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
              <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
            </div>
            <div style={{ flex: 1, border: '2px solid #000', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 30px 0' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
              <p style={{ fontSize: '11px', margin: 0 }}>{contract.institutionOfficer || '________________'}</p>
              <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
            </div>
          </div>

          {/* Sayfa Alt Bilgisi */}
          <div style={{ position: 'absolute', bottom: '10mm', left: '18mm', right: '18mm', textAlign: 'center', fontSize: '9px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
            Sayfa 1/2 - Kayıt Formu | {organizationName}
          </div>
        </div>

        {/* =============== SAYFA 2 - SÖZLEŞME =============== */}
        <div className="print-page" style={{ ...pageStyle, pageBreakBefore: 'always' }}>

          {/* Başlık */}
          <div style={{ borderBottom: '3px solid #000', paddingBottom: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>{student.firstName} {student.lastName} - {education.academicYear}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '800', fontSize: '14px', margin: 0 }}>{organizationName.toUpperCase()}</p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0' }}>{today}</p>
              </div>
              <div style={{ border: '2px solid #000', padding: '6px 12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900' }}>AkademiHub</span>
              </div>
            </div>
          </div>

          {/* Düzenleme Araçları */}
          {isEditing && (
            <div className="no-print toolbar-hide" style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleCopy} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}><Copy size={14}/> Kopyala</button>
              <button onClick={handlePaste} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}><ClipboardPaste size={14}/> Yapıştır</button>
            </div>
          )}

          {isEditing && (
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="no-print toolbar-hide"
              style={{ width: '100%', height: '150px', padding: '12px', border: '2px solid #fcd34d', borderRadius: '6px', fontSize: '11px', lineHeight: '1.5', resize: 'none', marginBottom: '10px' }}
            />
          )}

          {/* Sözleşme Metni */}
          <div style={{ border: '2px solid #000', padding: '15px', fontSize: '11px', lineHeight: '1.7', whiteSpace: 'pre-wrap', display: isEditing ? 'none' : 'block', marginBottom: '15px', backgroundColor: '#fafafa' }}>
            {contractText}
          </div>

          {/* Taraf Bilgileri */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1, border: '2px solid #000' }}>
              <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}>
                VELİ BİLGİLERİ
              </div>
              <div style={{ padding: '10px 12px', fontSize: '11px' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Ad Soyad:</strong> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ margin: '0 0 5px 0' }}><strong>TC Kimlik:</strong> {primaryGuardian?.tcNo || '____________'}</p>
                <p style={{ margin: 0 }}><strong>Telefon:</strong> {primaryGuardian?.phone || '____________'}</p>
              </div>
            </div>
            <div style={{ flex: 1, border: '2px solid #000' }}>
              <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}>
                ÖĞRENCİ BİLGİLERİ
              </div>
              <div style={{ padding: '10px 12px', fontSize: '11px' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Ad Soyad:</strong> {student.firstName} {student.lastName}</p>
                <p style={{ margin: '0 0 5px 0' }}><strong>TC Kimlik:</strong> {student.tcNo || '____________'}</p>
                <p style={{ margin: 0 }}><strong>Program:</strong> {programName}</p>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti */}
          <div style={{ border: '2px solid #000', marginBottom: '15px' }}>
            <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}>
              ÖDEME PLANI ÖZETİ
            </div>
            <div style={{ display: 'flex', padding: '10px 12px', fontSize: '11px' }}>
              <div style={{ flex: 1 }}><strong>Toplam:</strong> {payment.totalFee.toLocaleString('tr-TR')} TL</div>
              <div style={{ flex: 1 }}><strong>İndirim:</strong> {payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</div>
              <div style={{ flex: 1 }}><strong>Net:</strong> <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
              <div style={{ flex: 1 }}><strong>Taksit:</strong> {payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</div>
            </div>
          </div>

          {/* Onaylar */}
          <div style={{ border: '2px solid #000', marginBottom: '15px' }}>
            <div style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}>
              ONAYLAR
            </div>
            <div style={{ display: 'flex', padding: '10px 12px', fontSize: '11px', gap: '20px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                  {contract.kvkkApproved ? '✓' : ''}
                </span>
                <span>KVKK kabul edildi</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                  {contract.termsApproved ? '✓' : ''}
                </span>
                <span>Okul kuralları kabul edildi</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                  {contract.paymentApproved ? '✓' : ''}
                </span>
                <span>Ödeme planı kabul edildi</span>
              </div>
            </div>
          </div>

          {/* İMZA ALANI */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, border: '2px solid #000', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 30px 0' }}>VELİ İMZASI</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
              <p style={{ fontSize: '11px', margin: 0, fontWeight: 'bold' }}>{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
              <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
            </div>
            <div style={{ flex: 1, border: '2px solid #000', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 30px 0' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
              <p style={{ fontSize: '11px', margin: 0 }}>{contract.institutionOfficer || '________________'}</p>
              <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>Tarih: {today}</p>
            </div>
          </div>

          {/* Sayfa Alt Bilgisi */}
          <div style={{ position: 'absolute', bottom: '10mm', left: '18mm', right: '18mm', textAlign: 'center', fontSize: '9px', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
            <p style={{ fontWeight: '600', margin: 0, color: '#333' }}>Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
            <p style={{ color: '#666', margin: '3px 0 0 0' }}>Bu sözleşme iki nüsha olarak düzenlenmiştir. | {organizationName} - {today}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
