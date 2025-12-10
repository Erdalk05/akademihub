/**
 * Türkçe PDF Font Helper
 * jsPDF için Türkçe karakter desteği sağlar
 */

import { jsPDF } from 'jspdf';

// Türkçe karakterleri PDF'e uygun hale getir (font desteği yokken)
export const convertTurkishForPdf = (text: string): string => {
  if (!text) return '';
  
  // jsPDF varsayılan fontları Türkçe karakterleri desteklemez
  // Bu nedenle bazı karakterleri Unicode escape ile değiştiriyoruz
  const replacements: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G', 
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    '₺': 'TL'
  };
  
  return text.split('').map(char => replacements[char] || char).join('');
};

// Türkçe karakterleri koruyarak PDF metin dönüşümü
// Görüntü için özel karakterler
export const turkishTextMap: Record<string, string> = {
  'KAYIT SOZLESMESI': 'KAYIT SÖZLEŞMESI',
  'OGRENCI BILGILERI': 'ÖĞRENCİ BİLGİLERİ',
  'VELI BILGILERI': 'VELİ BİLGİLERİ',
  'ODEME PLANI VE TAKSIT DURUMU': 'ÖDEME PLANI VE TAKSİT DURUMU',
  'ODEME MAKBUZU': 'ÖDEME MAKBUZU',
  'Ogrenci': 'Öğrenci',
  'Odeme': 'Ödeme',
  'Sinif': 'Sınıf',
  'Pesinat': 'Peşinat',
  'Odendi': 'Ödendi',
  'Odenen': 'Ödenen',
  'Gecikmis': 'Gecikmiş',
  'Aciklama': 'Açıklama'
};

/**
 * PDF için Türkçe metni hazırla
 * @param text - Orijinal metin
 * @param keepTurkish - Türkçe karakterleri koru (font destekliyorsa)
 */
export const prepareTurkishText = (text: string, keepTurkish: boolean = false): string => {
  if (!text) return '';
  
  if (keepTurkish) {
    return text; // Font Türkçe destekliyorsa olduğu gibi döndür
  }
  
  return convertTurkishForPdf(text);
};

/**
 * jsPDF'e Roboto font ekle (Türkçe karakter desteği için)
 * Not: Bu fonksiyon, font dosyası yüklendiğinde çağrılmalıdır
 */
export const setupTurkishFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    // Google Fonts'tan Roboto yükleme denemesi
    // Not: Bu production'da çalışmayabilir, alternatif olarak base64 font kullanılabilir
    
    // Varsayılan font kullan
    doc.setFont('helvetica');
    return false;
  } catch (error) {
    console.warn('Türkçe font yüklenemedi, varsayılan font kullanılıyor');
    return false;
  }
};

/**
 * PDF başlık stilini ayarla
 */
export const setPdfHeaderStyle = (doc: jsPDF, fontSize: number = 14, bold: boolean = true) => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
};

/**
 * PDF normal metin stilini ayarla
 */
export const setPdfTextStyle = (doc: jsPDF, fontSize: number = 10) => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
};

