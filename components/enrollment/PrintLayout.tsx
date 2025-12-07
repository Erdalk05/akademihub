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
    <div className="bg-gray-100 min-h-screen print:bg-white">
      {/* Toolbar - Sadece ekranda görünür */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            <div>
              <p className="font-bold">{student.firstName} {student.lastName}</p>
              <p className="text-xs text-gray-500">Kayıt Belgesi (Siyah-Beyaz Baskı İçin)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isEditing ? 'bg-amber-100 text-amber-700' : 'bg-gray-100'}`}>
              <Edit3 size={16} /> {isEditing ? 'Bitir' : 'Sözleşmeyi Düzenle'}
        </button>
            <button 
              onClick={() => {
                // Doğrudan yazdırma komutu
                window.print();
              }} 
              className="px-5 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg"
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
            margin: 12mm 15mm; 
          }
          html, body { 
            font-size: 11pt !important; 
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            color: black !important;
            background: white !important;
            border-color: #000 !important;
          }
          .no-print { display: none !important; }
          .print-page { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important;
            page-break-inside: avoid;
          }
          .page-break { page-break-before: always; }
          table { border-collapse: collapse; }
          th, td { padding: 6px 8px !important; }
        }
        @media screen { 
          .print-page { 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
            margin-bottom: 24px; 
            border-radius: 8px;
          } 
        }
      `}</style>

      <div className="pt-20 print:pt-0 pb-8 px-4">
        
        {/* =============== SAYFA 1 - KAYIT FORMU =============== */}
        <div className="print-page max-w-[210mm] mx-auto bg-white p-8 print:p-0">
          
          {/* Başlık */}
          <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-black tracking-tight">AKADEMİHUB</h1>
                <p className="text-sm text-gray-600 mt-1">K12 Eğitim Kurumları</p>
            </div>
            <div className="text-right">
                <div className="border-2 border-black px-4 py-2 inline-block">
                  <h2 className="text-xl font-bold">KAYIT FORMU</h2>
                </div>
                <p className="text-sm mt-2">Tarih: {today}</p>
                <p className="text-sm font-mono">No: {student.studentNo || '______'}</p>
              </div>
          </div>
        </div>

          {/* ÖĞRENCİ BİLGİLERİ */}
          <div className="mb-5">
            <div className="bg-gray-200 border border-black px-4 py-2">
              <h3 className="font-bold text-sm">ÖĞRENCİ BİLGİLERİ</h3>
            </div>
            <table className="w-full border border-t-0 border-black text-sm">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="py-2 px-3 w-1/4 font-semibold bg-gray-50">Ad Soyad</td>
                  <td className="py-2 px-3 w-1/4 font-bold text-base">{student.firstName} {student.lastName}</td>
                  <td className="py-2 px-3 w-1/4 font-semibold bg-gray-50">TC Kimlik No</td>
                  <td className="py-2 px-3 w-1/4 font-mono">{student.tcNo || '___________________'}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="py-2 px-3 font-semibold bg-gray-50">Doğum Tarihi</td>
                  <td className="py-2 px-3">{student.birthDate || '___________________'}</td>
                  <td className="py-2 px-3 font-semibold bg-gray-50">Cinsiyet</td>
                  <td className="py-2 px-3">{student.gender === 'male' ? 'Erkek' : student.gender === 'female' ? 'Kız' : '___________________'}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="py-2 px-3 font-semibold bg-gray-50">Kan Grubu</td>
                  <td className="py-2 px-3">{student.bloodGroup || '___________________'}</td>
                  <td className="py-2 px-3 font-semibold bg-gray-50">Telefon</td>
                  <td className="py-2 px-3">{student.phone ? `+90 ${student.phone}` : '___________________'}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="py-2 px-3 font-semibold bg-gray-50">E-posta</td>
                  <td className="py-2 px-3">{student.email || '___________________'}</td>
                  <td className="py-2 px-3 font-semibold bg-gray-50">Önceki Okul</td>
                  <td className="py-2 px-3">{student.previousSchool || '___________________'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold bg-gray-50">Adres</td>
                  <td className="py-2 px-3" colSpan={3}>{[student.city, student.district, student.address].filter(Boolean).join(', ') || '________________________________________________________________________'}</td>
                </tr>
                {student.healthNotes && (
                  <tr className="border-t border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50">Sağlık Notları</td>
                    <td className="py-2 px-3 font-bold text-red-800" colSpan={3}>{student.healthNotes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* VELİ BİLGİLERİ */}
          <div className="mb-5">
            <div className="bg-gray-200 border border-black px-4 py-2">
              <h3 className="font-bold text-sm">VELİ BİLGİLERİ</h3>
            </div>
            {guardians.filter(g => g.firstName).map((g, i) => (
              <table key={g.id} className={`w-full border border-t-0 border-black text-sm ${i > 0 ? 'mt-2' : ''}`}>
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 w-1/4 font-semibold bg-gray-50">Yakınlık</td>
                    <td className="py-2 px-3 w-1/4 font-bold">{getGuardianType(g.type)} {g.isEmergency ? '⚠️' : ''}</td>
                    <td className="py-2 px-3 w-1/4 font-semibold bg-gray-50">Ad Soyad</td>
                    <td className="py-2 px-3 w-1/4 font-bold">{g.firstName} {g.lastName}</td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50">TC Kimlik No</td>
                    <td className="py-2 px-3 font-mono">{g.tcNo || '___________________'}</td>
                    <td className="py-2 px-3 font-semibold bg-gray-50">Telefon</td>
                    <td className="py-2 px-3 font-bold">{g.phone ? `+90 ${g.phone}` : '___________________'}</td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50">E-posta</td>
                    <td className="py-2 px-3">{g.email || '___________________'}</td>
                    <td className="py-2 px-3 font-semibold bg-gray-50">Meslek</td>
                    <td className="py-2 px-3">{g.job || '___________________'}</td>
                  </tr>
                  {(g.workplace || g.workPhone) && (
                    <tr className="border-b border-gray-400">
                      <td className="py-2 px-3 font-semibold bg-gray-50">İş Yeri</td>
                      <td className="py-2 px-3">{g.workplace || '___________________'}</td>
                      <td className="py-2 px-3 font-semibold bg-gray-50">İş Telefonu</td>
                      <td className="py-2 px-3">{g.workPhone || '___________________'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ))}
          </div>

          {/* EĞİTİM ve ÖDEME BİLGİLERİ */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Eğitim */}
            <div>
              <div className="bg-gray-200 border border-black px-4 py-2">
                <h3 className="font-bold text-sm">EĞİTİM BİLGİLERİ</h3>
            </div>
              <table className="w-full border border-t-0 border-black text-sm">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50 w-1/2">Program</td>
                    <td className="py-2 px-3 font-bold">{programName}</td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50">Sınıf / Şube</td>
                    <td className="py-2 px-3">{education.gradeName || `${education.gradeId}. Sınıf`} {education.branchName ? `/ ${education.branchName}` : ''}</td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50">Öğretim Yılı</td>
                    <td className="py-2 px-3 font-bold">{education.academicYear}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold bg-gray-50">Kayıt Türü</td>
                    <td className="py-2 px-3">{education.studentType === 'new' ? 'Yeni Kayıt' : education.studentType === 'transfer' ? 'Nakil' : education.studentType === 'scholarship' ? 'Burslu' : 'Yenileme'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ödeme */}
            <div>
              <div className="bg-gray-200 border border-black px-4 py-2">
                <h3 className="font-bold text-sm">ÖDEME BİLGİLERİ</h3>
            </div>
              <table className="w-full border border-t-0 border-black text-sm">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50 w-1/2">Toplam Ücret</td>
                    <td className="py-2 px-3 text-right">{payment.totalFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  {payment.discount > 0 && (
                    <tr className="border-b border-gray-400">
                      <td className="py-2 px-3 font-semibold bg-gray-50">İndirim</td>
                      <td className="py-2 px-3 text-right">-{payment.discount.toLocaleString('tr-TR')} TL</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-400 bg-gray-100">
                    <td className="py-2 px-3 font-bold">NET TUTAR</td>
                    <td className="py-2 px-3 text-right font-bold text-lg">{payment.netFee.toLocaleString('tr-TR')} TL</td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="py-2 px-3 font-semibold bg-gray-50">Peşinat</td>
                    <td className="py-2 px-3 text-right">{payment.downPayment > 0 ? `${payment.downPayment.toLocaleString('tr-TR')} TL` : '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold bg-gray-50">Taksit</td>
                    <td className="py-2 px-3 text-right font-semibold">{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</td>
                  </tr>
                </tbody>
              </table>
          </div>
        </div>

          {/* TAKSİT PLANI */}
          {payment.installments && payment.installments.length > 0 && (
            <div className="mb-5">
              <div className="bg-gray-200 border border-black px-4 py-2">
                <h3 className="font-bold text-sm">TAKSİT PLANI</h3>
          </div>
              <table className="w-full border border-t-0 border-black text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="py-2 px-3 text-left w-16">No</th>
                    <th className="py-2 px-3 text-left">Açıklama</th>
                    <th className="py-2 px-3 text-left w-32">Vade Tarihi</th>
                    <th className="py-2 px-3 text-right w-32">Tutar</th>
                    <th className="py-2 px-3 text-center w-24">İmza</th>
              </tr>
            </thead>
            <tbody>
                  {payment.installments.map((inst, i) => (
                    <tr key={i} className="border-b border-gray-300">
                      <td className="py-2 px-3 font-mono font-bold">{inst.no === 0 ? 'P' : inst.no}</td>
                      <td className="py-2 px-3">{inst.no === 0 ? 'Peşinat' : `${inst.no}. Taksit`}</td>
                      <td className="py-2 px-3">{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('tr-TR') : '__ / __ / ____'}</td>
                      <td className="py-2 px-3 text-right font-bold">{inst.amount.toLocaleString('tr-TR')} TL</td>
                      <td className="py-2 px-3 text-center border-l border-gray-300">______</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-black font-bold">
                    <td className="py-3 px-3" colSpan={3}>TOPLAM</td>
                    <td className="py-3 px-3 text-right text-lg">{payment.netFee.toLocaleString('tr-TR')} TL</td>
                    <td></td>
                  </tr>
                </tfoot>
          </table>
        </div>
          )}

          {/* İMZA ALANI */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="border-2 border-black p-4">
              <p className="font-bold text-center mb-16">VELİ İMZASI</p>
              <div className="border-t-2 border-black pt-3 text-center">
                <p className="text-sm">{primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p className="text-xs text-gray-600">Tarih: {today}</p>
              </div>
            </div>
            <div className="border-2 border-black p-4">
              <p className="font-bold text-center mb-16">KURUM YETKİLİSİ</p>
              <div className="border-t-2 border-black pt-3 text-center">
                <p className="text-sm">{contract.institutionOfficer || '________________________'}</p>
                <p className="text-xs text-gray-600">Tarih: {today}</p>
          </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6 border-t pt-4">Sayfa 1/2 - Kayıt Formu</p>
        </div>

        {/* =============== SAYFA 2 - SÖZLEŞME =============== */}
        <div className="page-break print-page max-w-[210mm] mx-auto bg-white p-8 print:p-0">

          {/* Başlık */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex justify-between items-start">
          <div>
                <h1 className="text-2xl font-black">EĞİTİM HİZMETİ SÖZLEŞMESİ</h1>
                <p className="text-sm mt-1">{student.firstName} {student.lastName} - {education.academicYear} Öğretim Yılı</p>
          </div>
              <div className="text-right">
                <p className="font-bold text-lg">AKADEMİHUB</p>
                <p className="text-sm">{today}</p>
        </div>
            </div>
            </div>

          {/* Düzenleme Araçları */}
          {isEditing && (
            <div className="no-print mb-4 p-3 bg-amber-50 rounded-lg flex gap-3 items-center">
              <button onClick={handleCopy} className="px-3 py-1.5 bg-white border rounded flex items-center gap-1 text-sm"><Copy size={14}/> Kopyala</button>
              <button onClick={handlePaste} className="px-3 py-1.5 bg-white border rounded flex items-center gap-1 text-sm"><ClipboardPaste size={14}/> Yapıştır</button>
              <span className="text-xs text-amber-700">Sözleşme metnini düzenleyebilir veya kendi metninizi yapıştırabilirsiniz.</span>
            </div>
          )}

          {isEditing && (
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="no-print w-full h-[250px] p-4 border-2 border-amber-300 rounded-lg text-sm leading-relaxed resize-none focus:outline-none mb-4"
            />
          )}

          {/* Sözleşme Metni */}
          <div className={`border border-black p-6 text-sm leading-relaxed whitespace-pre-wrap ${isEditing ? 'hidden print:block' : 'block'}`}>
            {contractText}
        </div>

          {/* Taraf Bilgileri */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="border border-black">
              <div className="bg-gray-200 px-4 py-2 border-b border-black">
                <h4 className="font-bold text-sm">VELİ BİLGİLERİ</h4>
                </div>
              <div className="p-4 text-sm space-y-1">
                <p><span className="font-semibold">Ad Soyad:</span> {primaryGuardian?.firstName} {primaryGuardian?.lastName}</p>
                <p><span className="font-semibold">TC Kimlik:</span> {primaryGuardian?.tcNo || '________________________'}</p>
                <p><span className="font-semibold">Telefon:</span> {primaryGuardian?.phone ? `+90 ${primaryGuardian.phone}` : '________________________'}</p>
                <p><span className="font-semibold">Adres:</span> {[primaryGuardian?.homeCity, primaryGuardian?.homeDistrict, primaryGuardian?.homeAddress].filter(Boolean).join(', ') || '________________________'}</p>
                </div>
                </div>
            <div className="border border-black">
              <div className="bg-gray-200 px-4 py-2 border-b border-black">
                <h4 className="font-bold text-sm">ÖĞRENCİ BİLGİLERİ</h4>
                </div>
              <div className="p-4 text-sm space-y-1">
                <p><span className="font-semibold">Ad Soyad:</span> {student.firstName} {student.lastName}</p>
                <p><span className="font-semibold">TC Kimlik:</span> {student.tcNo || '________________________'}</p>
                <p><span className="font-semibold">Program:</span> {programName}</p>
                <p><span className="font-semibold">Sınıf:</span> {education.gradeName || `${education.gradeId}. Sınıf`}</p>
              </div>
            </div>
          </div>

          {/* Ödeme Özeti */}
          <div className="border border-black mt-4">
            <div className="bg-gray-200 px-4 py-2 border-b border-black">
              <h4 className="font-bold text-sm">ÖDEME PLANI ÖZETİ</h4>
            </div>
            <div className="grid grid-cols-4 gap-4 p-4 text-sm">
              <div><span className="font-semibold block">Toplam Ücret</span>{payment.totalFee.toLocaleString('tr-TR')} TL</div>
              <div><span className="font-semibold block">İndirim</span>{payment.discount > 0 ? `-${payment.discount.toLocaleString('tr-TR')} TL` : '—'}</div>
              <div><span className="font-semibold block">Net Tutar</span><span className="font-bold text-lg">{payment.netFee.toLocaleString('tr-TR')} TL</span></div>
              <div><span className="font-semibold block">Taksit</span>{payment.installmentCount} x {payment.monthlyInstallment.toLocaleString('tr-TR')} TL</div>
        </div>
          </div>

          {/* Onaylar */}
          <div className="border border-black mt-4">
            <div className="bg-gray-200 px-4 py-2 border-b border-black">
              <h4 className="font-bold text-sm">ONAYLAR</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 text-sm">
              <label className="flex items-start gap-2">
                <span className="w-5 h-5 border-2 border-black flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {contract.kvkkApproved ? 'X' : ''}
                </span>
                <span>KVKK Aydınlatma Metni okundu ve kabul edildi.</span>
              </label>
              <label className="flex items-start gap-2">
                <span className="w-5 h-5 border-2 border-black flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {contract.termsApproved ? 'X' : ''}
                </span>
                <span>Okul kuralları ve yönetmelikleri kabul edildi.</span>
              </label>
              <label className="flex items-start gap-2">
                <span className="w-5 h-5 border-2 border-black flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {contract.paymentApproved ? 'X' : ''}
                </span>
                <span>Ödeme planı ve koşulları kabul edildi.</span>
              </label>
            </div>
        </div>

          {/* İMZA ALANI */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="border-2 border-black p-4">
              <p className="font-bold text-center mb-20">VELİ İMZASI</p>
              <div className="border-t-2 border-black pt-3 text-center">
                <p className="text-sm">{contract.guardianSignature || `${primaryGuardian?.firstName} ${primaryGuardian?.lastName}`}</p>
                <p className="text-xs text-gray-600">Tarih: {today}</p>
              </div>
            </div>
            <div className="border-2 border-black p-4">
              <p className="font-bold text-center mb-20">KURUM YETKİLİSİ</p>
              <div className="border-t-2 border-black pt-3 text-center">
                <p className="text-sm">{contract.institutionOfficer || '________________________'}</p>
                <p className="text-xs text-gray-600">Tarih: {today}</p>
              </div>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="mt-6 pt-4 border-t-2 border-black text-center text-xs">
            <p className="font-medium">Sayfa 2/2 - Eğitim Hizmeti Sözleşmesi</p>
            <p className="text-gray-600 mt-1">Bu sözleşme iki nüsha olarak düzenlenmiş olup, taraflarca okunarak imza altına alınmıştır.</p>
            <p className="text-gray-600">AkademiHub K12 Eğitim Kurumları - {today}</p>
        </div>
        </div>
      </div>
    </div>
  );
};
