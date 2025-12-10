import { FinanceInstallment } from '@/lib/types/finance';

// WhatsApp ile makbuz paylaşma
export const shareReceiptViaWhatsApp = (
  installment: FinanceInstallment, 
  studentName: string,
  parentPhone?: string
) => {
  const amount = Number(installment.paid_amount || installment.amount || 0);
  const date = installment.paid_at 
    ? new Date(installment.paid_at).toLocaleDateString('tr-TR') 
    : new Date().toLocaleDateString('tr-TR');
  const method = installment.payment_method === 'cash' ? 'Nakit' : 
                 installment.payment_method === 'card' ? 'Kredi Kartı' : 
                 installment.payment_method === 'bank' ? 'Havale/EFT' : 
                 installment.payment_method || 'Belirtilmedi';
  
  const receiptNo = `#${installment.id.slice(0, 8).toUpperCase()}`;
  
  const message = `📄 *TAHSİLAT MAKBUZU*
━━━━━━━━━━━━━━━━━━━
📋 Belge No: ${receiptNo}
📅 Tarih: ${date}
━━━━━━━━━━━━━━━━━━━

👤 *Öğrenci:* ${studentName}
📚 *Taksit No:* ${installment.installment_no}. Taksit

💰 *TAHSİL EDİLEN TUTAR*
*₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}*

💳 Ödeme Yöntemi: ${method}
${installment.note ? `📝 Not: ${installment.note}` : ''}

━━━━━━━━━━━━━━━━━━━
✅ Bu makbuz AkademiHub sistemi tarafından otomatik oluşturulmuştur.

_AkademiHub Eğitim Kurumları_`;

  const encodedMessage = encodeURIComponent(message);
  
  if (parentPhone) {
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  } else {
    // Telefon yoksa sadece mesajı kopyala ve WhatsApp aç
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }
};

// WhatsApp ile sözleşme özeti paylaşma
export const shareContractViaWhatsApp = (
  studentName: string,
  studentNo: string,
  className: string,
  totalAmount: number,
  paidAmount: number,
  installmentCount: number,
  monthlyAmount: number,
  parentPhone?: string
) => {
  const remaining = totalAmount - paidAmount;
  const today = new Date().toLocaleDateString('tr-TR');
  
  const message = `📋 *KAYIT SÖZLEŞMESİ ÖZETİ*
━━━━━━━━━━━━━━━━━━━
📅 Tarih: ${today}
━━━━━━━━━━━━━━━━━━━

👤 *ÖĞRENCİ BİLGİLERİ*
• Ad Soyad: ${studentName}
• Öğrenci No: ${studentNo}
• Sınıf: ${className}

💰 *ÖDEME PLANI*
• Toplam Tutar: ₺${totalAmount.toLocaleString('tr-TR')}
• Ödenen: ₺${paidAmount.toLocaleString('tr-TR')}
• Kalan Borç: ₺${remaining.toLocaleString('tr-TR')}
• Taksit Sayısı: ${installmentCount}
• Aylık Taksit: ₺${monthlyAmount.toLocaleString('tr-TR')}

━━━━━━━━━━━━━━━━━━━
📌 Detaylı sözleşme ve taksit planı için okulumuzla iletişime geçebilirsiniz.

_AkademiHub Eğitim Kurumları_`;

  const encodedMessage = encodeURIComponent(message);
  
  if (parentPhone) {
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }
};

// WhatsApp ile taksit planı paylaşma
export const shareInstallmentPlanViaWhatsApp = (
  studentName: string,
  installments: FinanceInstallment[],
  totalAmount: number,
  paidAmount: number,
  parentPhone?: string
) => {
  const remaining = totalAmount - paidAmount;
  const pendingInstallments = installments.filter(i => !i.is_paid).slice(0, 6); // İlk 6 bekleyen taksit
  
  let installmentList = pendingInstallments.map(inst => {
    const dueDate = inst.due_date ? new Date(inst.due_date).toLocaleDateString('tr-TR') : '-';
    const amount = Number(inst.amount || 0);
    return `  ${inst.installment_no}. Taksit | ${dueDate} | ₺${amount.toLocaleString('tr-TR')}`;
  }).join('\n');

  if (installments.filter(i => !i.is_paid).length > 6) {
    installmentList += `\n  ... ve ${installments.filter(i => !i.is_paid).length - 6} taksit daha`;
  }

  const message = `📊 *TAKSİT PLANI*
━━━━━━━━━━━━━━━━━━━
👤 Öğrenci: ${studentName}
━━━━━━━━━━━━━━━━━━━

💰 *ÖZET*
• Toplam: ₺${totalAmount.toLocaleString('tr-TR')}
• Ödenen: ₺${paidAmount.toLocaleString('tr-TR')}
• Kalan: ₺${remaining.toLocaleString('tr-TR')}

📅 *BEKLEYEN TAKSİTLER*
${installmentList}

━━━━━━━━━━━━━━━━━━━
📌 Ödemelerinizi zamanında yapmanızı rica ederiz.

_AkademiHub Eğitim Kurumları_`;

  const encodedMessage = encodeURIComponent(message);
  
  if (parentPhone) {
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }
};

export const generateReceiptHTML = (installment: FinanceInstallment, studentName: string) => {
  const amount = Number(installment.paid_amount || installment.amount || 0);
  const date = installment.paid_at ? new Date(installment.paid_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
  const method = installment.payment_method === 'cash' ? 'Nakit' : 
                 installment.payment_method === 'card' ? 'Kredi Kartı' : 
                 installment.payment_method === 'bank' ? 'Havale/EFT' : 
                 installment.payment_method || 'Belirtilmedi';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tahsilat Makbuzu - ${studentName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; background: white; }
          .container { max-width: 800px; margin: 0 auto; border: 2px solid #eee; padding: 40px; border-radius: 12px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #075E54; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #444; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
          .info-item { margin-bottom: 10px; }
          .label { font-size: 12px; text-transform: uppercase; color: #888; font-weight: bold; }
          .value { font-size: 16px; font-weight: 500; }
          .amount-box { background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 40px; border: 1px solid #4caf50; }
          .amount-label { font-size: 14px; color: #2e7d32; margin-bottom: 5px; }
          .amount-value { font-size: 32px; font-weight: bold; color: #1b5e20; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
          .signature { margin-top: 40px; display: flex; justify-content: space-between; }
          .sig-box { text-align: center; width: 200px; }
          .sig-line { border-top: 1px solid #ccc; margin-top: 40px; }
          @media print {
            @page { size: A4; margin: 15mm; }
            body { padding: 0; }
            .container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AkademiHub</div>
            <div class="title">Tahsilat Makbuzu</div>
            <div style="font-size: 12px; color: #888; margin-top: 5px;">Belge No: #${installment.id.slice(0, 8).toUpperCase()}</div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item">
                <div class="label">Öğrenci Adı Soyadı</div>
                <div class="value">${studentName}</div>
              </div>
              <div class="info-item">
                <div class="label">Ödeme Yapan</div>
                <div class="value">Sayın Veli</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="info-item">
                <div class="label">Tarih</div>
                <div class="value">${date}</div>
              </div>
              <div class="info-item">
                <div class="label">Ödeme Yöntemi</div>
                <div class="value">${method}</div>
              </div>
              <div class="info-item">
                <div class="label">Taksit No</div>
                <div class="value">#${installment.installment_no}</div>
              </div>
            </div>
          </div>

          <div class="amount-box">
            <div class="amount-label">Tahsil Edilen Tutar</div>
            <div class="amount-value">₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
             <div style="font-size: 12px; color: #2e7d32; margin-top: 5px;">${installment.note ? `Not: ${installment.note}` : ''}</div>
          </div>

          <div class="signature">
            <div class="sig-box">
              <div class="label">Teslim Alan</div>
              <div class="value">Muhasebe Birimi</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-box">
              <div class="label">Teslim Eden</div>
              <div class="value">${studentName} / Veli</div>
              <div class="sig-line"></div>
            </div>
          </div>

          <div class="footer">
            Bu belge elektronik ortamda üretilmiştir. Geçerli bir tahsilat belgesi yerine geçer.<br/>
            AkademiHub Eğitim Kurumları Yönetim Sistemi
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(function() {
              window.print(); 
            }, 100);
          }
        </script>
      </body>
    </html>
  `;
};

// Güvenilir yazdırma fonksiyonu - iframe kullanarak popup blocker'ı aşar
export const printReceipt = (installment: FinanceInstallment, studentName: string) => {
  const html = generateReceiptHTML(installment, studentName);
  
  // iframe ile yazdırma
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: yeni pencere aç
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Yazdırma tamamlandığında iframe'i temizle
  iframe.contentWindow?.addEventListener('afterprint', () => {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 100);
  });

  // Fallback: 5 saniye sonra temizle
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 5000);
};
