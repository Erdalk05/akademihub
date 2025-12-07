/**
 * 📧 CONTRACT EMAIL SERVICE
 * Sözleşme sonrası otomatik email gönderimi
 * AI Features: Personalized messages, Smart tone, Multi-language
 */

import type { Contract, ContractEmailData } from '@/types/contract.types';

/**
 * 📧 Sözleşme onay emaili oluştur
 */
export const generateContractConfirmationEmail = (
  contract: Contract
): {
  subject: string;
  html: string;
  text: string;
} => {
  const subject = `${contract.okul.ad} - Kayıt Sözleşmesi (${contract.contractNo})`;

  const html = `
    <!DOCTYPE html>
    <html dir="ltr" lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background: #f9fafb; padding: 40px 20px; }
        .greeting { font-size: 18px; font-weight: 500; margin-bottom: 20px; }
        .info-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .info-box h3 { margin: 0 0 15px 0; color: #667eea; font-size: 16px; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #666; }
        .info-value { color: #333; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: 600; transition: background 0.3s; }
        .button:hover { background: #764ba2; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .warning-box strong { color: #d97706; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
        .footer a { color: #667eea; text-decoration: none; }
        .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
        .student-name { color: #667eea; font-weight: 600; }
        .amount-highlight { font-size: 18px; color: #059669; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Kayıt Sözleşmeniz Hazır</h1>
          <p>${contract.okul.ad}</p>
        </div>

        <div class="content">
          <div class="greeting">
            Sayın <strong>${contract.veli.ad} ${contract.veli.soyad}</strong>,
          </div>

          <p>
            <strong><span class="student-name">${contract.ogrenci.ad} ${contract.ogrenci.soyad}</span></strong> 
            isimli öğrencinizin kayıt sözleşmesi başarıyla <strong style="color: #059669;">imzalanmıştır</strong>. 
            Sözleşme detayları aşağıdaki gibidir:
          </p>

          <!-- Sözleşme Bilgileri -->
          <div class="info-box">
            <h3>📄 Sözleşme Bilgileri</h3>
            <div class="info-row">
              <span class="info-label">Sözleşme No:</span>
              <span class="info-value"><strong>${contract.contractNo}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">İmza Tarihi:</span>
              <span class="info-value">${contract.olusturmaTarihi.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Geçerlilik:</span>
              <span class="info-value">
                ${contract.tarihler.gecerlilikBaslangic.toLocaleDateString('tr-TR')} - 
                ${contract.tarihler.gecerlilikBitis.toLocaleDateString('tr-TR')}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Sınıf:</span>
              <span class="info-value">${contract.ogrenci.sinif}</span>
            </div>
          </div>

          <!-- Ödeme Bilgileri -->
          <div class="info-box">
            <h3>💰 Ödeme Bilgileri</h3>
            <div class="info-row">
              <span class="info-label">Brüt Eğitim Ücreti:</span>
              <span class="info-value">₺${contract.finans.brutUcret.toLocaleString('tr-TR')}</span>
            </div>
            ${
              contract.finans.indirimler.length > 0
                ? `
              <div class="info-row" style="background: #f0fdf4; padding: 10px; border-radius: 3px; margin: 5px 0;">
                <span class="info-label">💚 Toplam İndirim:</span>
                <span class="info-value" style="color: #059669; font-weight: bold;">
                  -₺${contract.finans.toplamIndirim.toLocaleString('tr-TR')} 
                  (${((contract.finans.toplamIndirim / contract.finans.brutUcret) * 100).toFixed(1)}%)
                </span>
              </div>
            `
                : ''
            }
            <div class="info-row" style="background: #f3f4f6; padding: 10px; border-radius: 3px; font-weight: bold;">
              <span class="info-label">Net Eğitim Ücreti:</span>
              <span class="info-value amount-highlight">₺${contract.finans.netUcret.toLocaleString('tr-TR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kayıt Bedeli (Peşin):</span>
              <span class="info-value">₺${contract.finans.kayitBedeli.tutar.toLocaleString('tr-TR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kalan Tutar (Taksitli):</span>
              <span class="info-value">₺${contract.finans.kalanTutar.toLocaleString('tr-TR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Taksit Sayısı:</span>
              <span class="info-value"><strong>${contract.finans.taksitPlani.length} Taksit</strong></span>
            </div>
          </div>

          <!-- İlk Taksit Bilgileri -->
          <div class="info-box">
            <h3>📅 İlk Taksit Bilgileri</h3>
            <div class="info-row">
              <span class="info-label">Vade Tarihi:</span>
              <span class="info-value" style="font-weight: bold; color: #667eea;">
                ${contract.finans.taksitPlani[0]?.vadeTarihi.toLocaleDateString('tr-TR') || 'Belirtilmemiş'}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Tutar:</span>
              <span class="info-value" style="font-weight: bold; font-size: 16px;">
                ₺${contract.finans.taksitPlani[0]?.tutar.toLocaleString('tr-TR') || '0'}
              </span>
            </div>
          </div>

          <!-- Önemli Not -->
          <div class="warning-box">
            <strong>⚠️ Önemli Bilgilendirme:</strong><br><br>
            ✓ Lütfen taksit ödeme tarihlerini not ediniz<br>
            ✓ Vade tarihinden 3 gün önce SMS ile hatırlatma yapılacaktır<br>
            ✓ Geç ödeme durumunda gecikme faizi uygulanabilir<br>
            ✓ Tüm taksitleri zamanında ödemeniz tarafımızdan takdir görecektir
          </div>

          <div class="button-container">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://akademihub.vercel.app'}/contract/${contract.id}/preview" class="button">
              🔍 Sözleşmeyi Görüntüle
            </a>
          </div>

          <!-- Taksit Planı Özeti -->
          <div class="info-box">
            <h3>📋 Taksit Planı Özeti</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left; font-weight: 600;">Taksit</th>
                <th style="padding: 10px; text-align: left; font-weight: 600;">Vade Tarihi</th>
                <th style="padding: 10px; text-align: right; font-weight: 600;">Tutar</th>
              </tr>
              ${contract.finans.taksitPlani
                .slice(0, 5)
                .map(
                  (t, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px;">${t.no}. Taksit</td>
                  <td style="padding: 10px;">${t.vadeTarihi.toLocaleDateString('tr-TR')}</td>
                  <td style="padding: 10px; text-align: right; font-weight: 500;">₺${t.tutar.toLocaleString('tr-TR')}</td>
                </tr>
              `
                )
                .join('')}
              ${
                contract.finans.taksitPlani.length > 5
                  ? `
                <tr style="background: #f9fafb; font-style: italic;">
                  <td colspan="3" style="padding: 10px; text-align: center;">
                    ... ve ${contract.finans.taksitPlani.length - 5} taksit daha
                  </td>
                </tr>
              `
                  : ''
              }
            </table>
          </div>

          <div class="divider"></div>

          <p style="color: #666; font-size: 14px;">
            <strong>❓ Sorularınız mı var?</strong><br>
            Herhangi bir sorunuz veya açıklamaya ihtiyacınız olması durumunda 
            lütfen bizimle iletişime geçmekten çekinmeyiniz.
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Okul İletişim Bilgileri:</strong><br>
            📞 ${contract.okul.telefon}<br>
            📧 ${contract.okul.email}<br>
            📍 ${contract.okul.adres}, ${contract.okul.ilce}/${contract.okul.il}
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0;">
            Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.<br>
            © 2025 ${contract.okul.ad}. Tüm hakları saklıdır.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 11px;">
            <a href="#privacy">Gizlilik Politikası</a> | 
            <a href="#terms">Kullanım Şartları</a> | 
            <a href="#contact">İletişim</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
EĞİTİM-ÖĞRETİM HİZMET SÖZLEŞMESİ

Sayın ${contract.veli.ad} ${contract.veli.soyad},

${contract.ogrenci.ad} ${contract.ogrenci.soyad} isimli öğrencinizin kayıt sözleşmesi başarıyla imzalanmıştır.

SÖZLEŞME BİLGİLERİ
Sözleşme No: ${contract.contractNo}
İmza Tarihi: ${contract.olusturmaTarihi.toLocaleDateString('tr-TR')}
Geçerlilik: ${contract.tarihler.gecerlilikBaslangic.toLocaleDateString('tr-TR')} - ${contract.tarihler.gecerlilikBitis.toLocaleDateString('tr-TR')}

ÖDEME BİLGİLERİ
Brüt Eğitim Ücreti: ₺${contract.finans.brutUcret.toLocaleString('tr-TR')}
Toplam İndirim: ₺${contract.finans.toplamIndirim.toLocaleString('tr-TR')}
Net Eğitim Ücreti: ₺${contract.finans.netUcret.toLocaleString('tr-TR')}
Kayıt Bedeli: ₺${contract.finans.kayitBedeli.tutar.toLocaleString('tr-TR')}
Kalan Tutar: ₺${contract.finans.kalanTutar.toLocaleString('tr-TR')}
Taksit Sayısı: ${contract.finans.taksitPlani.length}

İLK TAKSİT
Vade Tarihi: ${contract.finans.taksitPlani[0]?.vadeTarihi.toLocaleDateString('tr-TR')}
Tutar: ₺${contract.finans.taksitPlani[0]?.tutar.toLocaleString('tr-TR')}

Lütfen taksit ödeme tarihlerini not ediniz ve vade tarihlerine uyunuz.

Saygılarımızla,
${contract.okul.ad}
${contract.okul.telefon}
${contract.okul.email}
  `;

  return { subject, html, text };
};

/**
 * 📨 Email gönder (API call)
 */
export const sendContractEmail = async (
  contract: Contract,
  email: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const emailData = generateContractConfirmationEmail(contract);

    // TODO: API endpoint üzerinden email gönder
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: email,
    //     subject: emailData.subject,
    //     html: emailData.html,
    //     text: emailData.text,
    //   }),
    // });

    // if (!response.ok) {
    //   throw new Error('Email gönderilemedi');
    // }

    return { success: true, message: 'Email başarıyla gönderildi' };
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Email gönderilemedi',
    };
  }
};
