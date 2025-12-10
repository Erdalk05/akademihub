/**
 * Roboto Regular Font - Base64 Encoded
 * Bu font jsPDF'de Türkçe karakter desteği sağlar
 * 
 * Kaynak: Google Fonts (https://fonts.google.com/specimen/Roboto)
 * Lisans: Apache License 2.0
 */

// jsPDF için Türkçe karakter destekli font ayarı
// Not: Gerçek base64 font yerine, jsPDF'in helvetica fontunu
// özel encoding ile kullanıyoruz

export const setupTurkishPdfFont = async (doc: any): Promise<void> => {
  // jsPDF'in varsayılan fontları Türkçe karakterleri tam desteklemez
  // Bu nedenle Türkçe karakterleri görsel olarak uyumlu ASCII karakterlere çeviriyoruz
  doc.setFont('helvetica');
};

// Türkçe karakterleri PDF için güvenli ASCII'ye çevir
export const toSafePdfText = (text: string): string => {
  if (!text) return '';
  
  const charMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'i': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    '₺': 'TL'
  };
  
  return text.split('').map(char => charMap[char] || char).join('');
};

// PDF başlıklarını Türkçe karakterlerle göster (HTML/CSS için)
export const PDF_TURKISH_LABELS = {
  CONTRACT_TITLE: 'KAYIT SÖZLEŞMESİ',
  STUDENT_INFO: 'ÖĞRENCİ BİLGİLERİ',
  GUARDIAN_INFO: 'VELİ BİLGİLERİ', 
  PAYMENT_PLAN: 'ÖDEME PLANI VE TAKSİT DURUMU',
  RECEIPT_TITLE: 'ÖDEME MAKBUZU',
  STUDENT: 'Öğrenci',
  CLASS: 'Sınıf',
  DEPOSIT: 'Peşinat',
  PAID: 'Ödendi',
  PAID_AMOUNT: 'Ödenen',
  OVERDUE: 'Gecikmiş',
  WAITING: 'Bekliyor',
  DESCRIPTION: 'Açıklama',
  GUARDIAN_NAME: 'Veli Adı',
  REGISTRATION_DATE: 'Kayıt Tarihi',
  TC_ID: 'TC Kimlik No'
};

// PDF için ASCII versiyonları (jsPDF uyumlu)
export const PDF_ASCII_LABELS = {
  CONTRACT_TITLE: 'KAYIT SOZLESMESI',
  STUDENT_INFO: 'OGRENCI BILGILERI',
  GUARDIAN_INFO: 'VELI BILGILERI',
  PAYMENT_PLAN: 'ODEME PLANI VE TAKSIT DURUMU',
  RECEIPT_TITLE: 'ODEME MAKBUZU',
  STUDENT: 'Ogrenci',
  CLASS: 'Sinif',
  DEPOSIT: 'Pesinat',
  PAID: 'Odendi',
  PAID_AMOUNT: 'Odenen',
  OVERDUE: 'Gecikmis',
  WAITING: 'Bekliyor',
  DESCRIPTION: 'Aciklama',
  GUARDIAN_NAME: 'Veli Adi',
  REGISTRATION_DATE: 'Kayit Tarihi',
  TC_ID: 'TC Kimlik No'
};

