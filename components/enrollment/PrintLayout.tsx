'use client';

import React, { useState } from 'react';
import { useEnrollmentStore } from './store';
import { PROGRAMS, GUARDIAN_TYPES } from './types';
import { X, Printer, Edit3, Copy, ClipboardPaste } from 'lucide-react';

interface PrintLayoutProps {
  onClose: () => void;
}

const DEFAULT_CONTRACT = `EĞİTİM HİZMETİ SÖZLEŞMESİ

İşbu sözleşme, AkademiHub Eğitim Kurumları ("Kurum") ile aşağıda bilgileri bulunan veli arasında karşılıklı olarak düzenlenmiştir.

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

Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.`;

export const PrintLayout: React.FC<PrintLayoutProps> = ({ onClose }) => {
  const { student, guardians, education, payment, contract } = useEnrollmentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [contractText, setContractText] = useState(DEFAULT_CONTRACT);

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

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      {/* Toolbar - Sadece ekranda görünür */}
      <div className="print:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
              <Edit3 size={16} /> {isEditing ? 'Bitir' : 'Sözleşmeyi Düzenle'}
            </button>
            <button 
              onClick={() => window.print()} 
              style={{ padding: '8px 20px', backgroundColor: '#10b981', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
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
            margin: 6mm 8mm; 
          }
          html, body { 
            font-size: 8pt !important; 
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-page { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 5mm !important;
            page-break-inside: avoid;
            background: white !important;
          }
          .page-break { page-break-before: always; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 2px 4px !important; }
        }
        @media screen { 
          .print-page { 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
            margin-bottom: 24px; 
            border-radius: 8px;
          } 
        }
      `}</style>

      <div style={{ paddingTop: '72px', paddingBottom: '32px', paddingLeft: '16px', paddingRight: '16px' }} className="print:pt-0">
        
        {/* =============== SAYFA 1 - KAYIT FORMU =============== */}
        <div className="print-page" style={{ maxWidth: '210mm', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px' }}>
          
          {/* Başlık */}
          <div style={{ borderBottom: '2px solid #000000', paddingBottom: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: '#000000', margin: 0 }}>AKADEMİHUB</h1>
                <p style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>K12 Eğitim Kurumları</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ border: '2px solid #000000', padding: '4px 10px', display: 'inline-block' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: 0 }}>KAYIT FORMU</h2>
                </div>
                <p style={{ fontSize: '9px', marginTop: '4px', color: '#000000' }}>Tarih: {today}</p>
                <p style={{ fontSize: '9px', fontFamily: 'monospace', color: '#000000' }}>No: {student.studentNo || '______'}</p>
              </div>
            </div>
          </div>

          {/* ÖĞRENCİ BİLGİLERİ */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ backgroundColor: '#d1d5db', border: '1px solid #000000', padding: '3px 8px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0, color: '#000000' }}>ÖĞRENCİ BİLGİLERİ</h3>
            </div>
            <table style={{ width: '100%', border: '1px solid #000000', borderTop: 'none', fontSize: '8px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                  <td style={{ padding: '3px 5px', width: '25%', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Ad Soyad</td>
                  <td style={{ padding: '3px 5px', width: '25%', fontWeight: 'bold', fontSize: '10px', color: '#000000' }}>{student.firstName} {student.lastName}</td>
                  <td style={{ padding: '3px 5px', width: '25%', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>TC Kimlik No</td>
                  <td style={{ padding: '3px 5px', width: '25%', fontFamily: 'monospace', color: '#000000' }}>{student.tcNo || '___________________'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                  <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Doğum Tarihi</td>
                  <td style={{ padding: '3px 5px', color: '#000000' }}>{student.birthDate || '___________________'}</td>
                  <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Cinsiyet</td>
                  <td style={{ padding: '3px 5px', color: '#000000' }}>{student.gender === 'male' ? 'Erkek' : student.gender === 'female' ? 'Kız' : '___________________'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                  <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Kan Grubu</td>
                  <td style={{ padding: '3px 5px', color: '#000000' }}>{student.bloodGroup || '____'}</td>
                  <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Telefon</td>
                  <td style={{ padding: '3px 5px', color: '#000000' }}>{student.phone ? `+90 ${student.phone}` : '___________________'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Adres</td>
                  <td style={{ padding: '3px 5px', color: '#000000' }} colSpan={3}>{[student.city, student.district, student.address].filter(Boolean).join(', ') || '________________________________________________________________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VELİ BİLGİLERİ */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ backgroundColor: '#d1d5db', border: '1px solid #000000', padding: '3px 8px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0, color: '#000000' }}>VELİ BİLGİLERİ</h3>
            </div>
            {guardians.filter(g => g.firstName).slice(0, 2).map((g, i) => (
              <table key={g.id} style={{ width: '100%', border: '1px solid #000000', borderTop: i === 0 ? 'none' : '1px solid #000000', fontSize: '8px', borderCollapse: 'collapse', marginTop: i > 0 ? '3px' : '0' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                    <td style={{ padding: '3px 5px', width: '25%', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Yakınlık</td>
                    <td style={{ padding: '3px 5px', width: '25%', fontWeight: 'bold', color: '#000000' }}>{getGuardianType(g.type)}</td>
                    <td style={{ padding: '3px 5px', width: '25%', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Ad Soyad</td>
                    <td style={{ padding: '3px 5px', width: '25%', fontWeight: 'bold', color: '#000000' }}>{g.firstName} {g.lastName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>TC Kimlik No</td>
                    <td style={{ padding: '3px 5px', fontFamily: 'monospace', color: '#000000' }}>{g.tcNo || '___________________'}</td>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Telefon</td>
                    <td style={{ padding: '3px 5px', fontWeight: 'bold', color: '#000000' }}>{g.phone ? `+90 ${g.phone}` : '___________________'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>E-posta</td>
                    <td style={{ padding: '3px 5px', color: '#000000' }}>{g.email || '___________________'}</td>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Meslek</td>
                    <td style={{ padding: '3px 5px', color: '#000000' }}>{g.job || '___________________'}</td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>

          {/* EĞİTİM ve ÖDEME BİLGİLERİ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            {/* Eğitim */}
            <div>
              <div style={{ backgroundColor: '#d1d5db', border: '1px solid #000000', padding: '3px 8px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0, color: '#000000' }}>EĞİTİM BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '1px solid #000000', borderTop: 'none', fontSize: '8px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', width: '50%', color: '#000000' }}>Program</td>
                    <td style={{ padding: '3px 5px', fontWeight: 'bold', color: '#000000' }}>{programName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Sınıf / Şube</td>
                    <td style={{ padding: '3px 5px', color: '#000000' }}>{education.gradeName || `${education.gradeId}. Sınıf`} {education.branchName ? `/ ${education.branchName}` : ''}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Öğretim Yılı</td>
                    <td style={{ padding: '3px 5px', fontWeight: 'bold', color: '#000000' }}>{education.academicYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ödeme */}
            <div>
              <div style={{ backgroundColor: '#d1d5db', border: '1px solid #000000', padding: '3px 8px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0, color: '#000000' }}>ÖDEME BİLGİLERİ</h3>
              </div>
              <table style={{ width: '100%', border: '1px solid #000000', borderTop: 'none', fontSize: '8px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', width: '50%', color: '#000000' }}>Toplam Ücret</td>
                    <td style={{ padding: '3px 5px', textAlign: 'right', color: '#000000' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  {payment.discount > 0 && (
                    <tr style={{ borderBottom: '1px solid #9ca3af' }}>
                      <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>İndirim</td>
                      <td style={{ padding: '3px 5px', textAlign: 'right', color: '#000000' }}>-{payment.discount.toLocaleString('tr-TR')} TL</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid #9ca3af', backgroundColor: '#e5e7eb' }}>
                    <td style={{ padding: '3px 5px', fontWeight: 'bold', color: '#000000' }}>NET TUTAR</td>
                    <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 'bold', fontSize: '10px', color: '#000000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 5px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#000000' }}>Taksit</td>
                    <td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: '600', color: '#000000' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TAKSİT PLANI - Kompakt */}
          {payment.installments && payment.installments.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ backgroundColor: '#d1d5db', border: '1px solid #000000', padding: '3px 8px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '9px', margin: 0, color: '#000000' }}>TAKSİT PLANI</h3>
              </div>
              <table style={{ width: '100%', border: '1px solid #000000', borderTop: 'none', fontSize: '7px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #000000' }}>
                    <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', color: '#000000' }}>No</th>
                    <th style={{ padding: '2px 4px', textAlign: 'left', color: '#000000' }}>Açıklama</th>
                    <th style={{ padding: '2px 4px', textAlign: 'left', width: '65px', color: '#000000' }}>Vade</th>
                    <th style={{ padding: '2px 4px', textAlign: 'right', width: '65px', color: '#000000' }}>Tutar</th>
                    <th style={{ padding: '2px 4px', textAlign: 'center', width: '40px', color: '#000000' }}>İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.installments.map((inst, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #d1d5db' }}>
                      <td style={{ padding: '2px 4px', fontFamily: 'monospace', fontWeight: 'bold', color: '#000000' }}>{inst.no === 0 ? 'P' : inst.no}</td>
                      <td style={{ padding: '2px 4px', color: '#000000' }}>{inst.no === 0 ? 'Peşinat' : `${inst.no}. Taksit`}</td>
                      <td style={{ padding: '2px 4px', color: '#000000' }}>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__ / __ / ____'}</td>
                      <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'bold', color: '#000000' }}>{inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td style={{ padding: '2px 4px', textAlign: 'center', borderLeft: '1px solid #d1d5db', color: '#000000' }}>___</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#e5e7eb', borderTop: '2px solid #000000', fontWeight: 'bold' }}>
                    <td style={{ padding: '3px 4px', color: '#000000' }} colSpan={3}>TOPLAM</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right', fontSize: '9px', color: '#000000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* İMZA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
            <div style={{ border: '2px solid #000000', padding: '8px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '30px', fontSize: '9px', color: '#000000' }}>VELİ İMZASI</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '6px', textAlign: 'center' }}>
                <p style={{ fontSize: '8px', color: '#000000' }}>{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ fontSize: '7px', color: '#4b5563' }}>Tarih: {today}</p>
              </div>
            </div>
            <div style={{ border: '2px solid #000000', padding: '8px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '30px', fontSize: '9px', color: '#000000' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '6px', textAlign: 'center' }}>
                <p style={{ fontSize: '8px', color: '#000000' }}>{contract.institutionOfficer || '________________________'}</p>
                <p style={{ fontSize: '7px', color: '#4b5563' }}>Tarih: {today}</p>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '7px', color: '#6b7280', marginTop: '10px', borderTop: '1px solid #000000', paddingTop: '6px' }}>Sayfa 1/2 - Kayıt Formu</p>
        </div>

        {/* =============== SAYFA 2 - SÖZLEŞME =============== */}
        <div className="page-break print-page" style={{ maxWidth: '210mm', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px' }}>

          {/* Başlık */}
          <div style={{ borderBottom: '2px solid #000000', paddingBottom: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '14px', fontWeight: '900', color: '#000000', margin: 0 }}>EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                <p style={{ fontSize: '9px', marginTop: '3px', color: '#000000' }}>{student.firstName} {student.lastName} - {education.academicYear} Öğretim Yılı</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', fontSize: '12px', color: '#000000', margin: 0 }}>AKADEMİHUB</p>
                <p style={{ fontSize: '8px', color: '#000000' }}>{today}</p>
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
          <div style={{ border: '1px solid #000000', padding: '10px', fontSize: '8px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#000000', display: isEditing ? 'none' : 'block' }}>
            {contractText}
          </div>

          {/* Taraf Bilgileri */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div style={{ border: '1px solid #000000' }}>
              <div style={{ backgroundColor: '#d1d5db', padding: '3px 8px', borderBottom: '1px solid #000000' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '8px', margin: 0, color: '#000000' }}>VELİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '6px', fontSize: '7px' }}>
                <p style={{ marginBottom: '2px', color: '#000000' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p style={{ marginBottom: '2px', color: '#000000' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {primaryGuardian?.tcNo || '________________________'}</p>
                <p style={{ marginBottom: '2px', color: '#000000' }}><span style={{ fontWeight: '600' }}>Telefon:</span> {primaryGuardian?.phone ? `+90 ${primaryGuardian.phone}` : '________________________'}</p>
              </div>
            </div>
            <div style={{ border: '1px solid #000000' }}>
              <div style={{ backgroundColor: '#d1d5db', padding: '3px 8px', borderBottom: '1px solid #000000' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '8px', margin: 0, color: '#000000' }}>ÖĞRENCİ BİLGİLERİ</h4>
              </div>
              <div style={{ padding: '6px', fontSize: '7px' }}>
                <p style={{ marginBottom: '2px', color: '#000000' }}><span style={{ fontWeight: '600' }}>Ad Soyad:</span> {student.firstName} {student.lastName}</p>
                <p style={{ marginBottom: '2px', color: '#000000' }}><span style={{ fontWeight: '600' }}>TC Kimlik:</span> {student.tcNo || '________________________'}</p>
                <p style={{ marginBottom: '2px', color: '#000000' }}><span style={{ fontWeight: '600' }}>Program:</span> {programName}</p>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti */}
          <div style={{ border: '1px solid #000000', marginTop: '8px' }}>
            <div style={{ backgroundColor: '#d1d5db', padding: '3px 8px', borderBottom: '1px solid #000000' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '8px', margin: 0, color: '#000000' }}>ÖDEME PLANI ÖZETİ</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '8px', fontSize: '7px' }}>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000' }}>Toplam Ücret</span><span style={{ color: '#000000' }}>{payment.totalFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000' }}>İndirim</span><span style={{ color: '#000000' }}>{payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000' }}>Net Tutar</span><span style={{ fontWeight: 'bold', fontSize: '10px', color: '#000000' }}>{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span style={{ fontWeight: '600', display: 'block', color: '#000000' }}>Taksit</span><span style={{ color: '#000000' }}>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</span></div>
            </div>
          </div>

          {/* Onaylar */}
          <div style={{ border: '1px solid #000000', marginTop: '8px' }}>
            <div style={{ backgroundColor: '#d1d5db', padding: '3px 8px', borderBottom: '1px solid #000000' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '8px', margin: 0, color: '#000000' }}>ONAYLAR</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px', fontSize: '7px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', flexShrink: 0, color: '#000000' }}>
                  {contract.kvkkApproved ? 'X' : ''}
                </span>
                <span style={{ color: '#000000' }}>KVKK Aydınlatma Metni okundu ve kabul edildi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', flexShrink: 0, color: '#000000' }}>
                  {contract.termsApproved ? 'X' : ''}
                </span>
                <span style={{ color: '#000000' }}>Okul kuralları ve yönetmelikleri kabul edildi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', flexShrink: 0, color: '#000000' }}>
                  {contract.paymentApproved ? 'X' : ''}
                </span>
                <span style={{ color: '#000000' }}>Ödeme planı ve koşulları kabul edildi.</span>
              </div>
            </div>
          </div>

          {/* İMZA ALANI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div style={{ border: '2px solid #000000', padding: '8px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '35px', fontSize: '9px', color: '#000000' }}>VELİ İMZASI</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '6px', textAlign: 'center' }}>
                <p style={{ fontSize: '8px', color: '#000000' }}>{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
                <p style={{ fontSize: '7px', color: '#4b5563' }}>Tarih: {today}</p>
              </div>
            </div>
            <div style={{ border: '2px solid #000000', padding: '8px' }}>
              <p style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '35px', fontSize: '9px', color: '#000000' }}>KURUM YETKİLİSİ</p>
              <div style={{ borderTop: '2px solid #000000', paddingTop: '6px', textAlign: 'center' }}>
                <p style={{ fontSize: '8px', color: '#000000' }}>{contract.institutionOfficer || '________________________'}</p>
                <p style={{ fontSize: '7px', color: '#4b5563' }}>Tarih: {today}</p>
              </div>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '2px solid #000000', textAlign: 'center', fontSize: '7px' }}>
            <p style={{ fontWeight: '500', color: '#000000' }}>Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
            <p style={{ color: '#4b5563', marginTop: '2px' }}>Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.</p>
            <p style={{ color: '#4b5563' }}>AkademiHub K12 Eğitim Kurumları - {today}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
