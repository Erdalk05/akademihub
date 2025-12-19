/**
 * WhatsApp Servis Modülü
 * 
 * Bu modül WhatsApp Business API entegrasyonu için placeholder fonksiyonlar içerir.
 * Gerçek entegrasyon için WhatsApp Business API credentialları gereklidir.
 * 
 * Desteklenen özellikler:
 * - Template mesaj gönderme
 * - Doküman gönderme
 * - Durum kontrolü
 */

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time';
  text?: string;
  currency?: { code: string; amount: number };
}

class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Telefon numarasını WhatsApp formatına çevirir
   */
  private formatPhoneNumber(phone: string): string {
    // Türkiye için: +90 5XX XXX XXXX
    let cleaned = phone.replace(/\D/g, '');
    
    // Başında 0 varsa kaldır
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // 90 ile başlamıyorsa ekle
    if (!cleaned.startsWith('90')) {
      cleaned = '90' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Template mesaj gönderir
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    languageCode: string = 'tr',
    parameters: TemplateParameter[] = []
  ): Promise<WhatsAppResult> {
    // API credentials yoksa mock sonuç döndür
    if (!this.accessToken || !this.phoneNumberId) {
      console.log(`[WhatsApp Mock] Template message to ${phoneNumber}: ${templateName}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: languageCode },
              components: parameters.length > 0 ? [
                {
                  type: 'body',
                  parameters: parameters,
                }
              ] : undefined,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.messages?.[0]?.id) {
        return {
          success: true,
          messageId: data.messages[0].id,
        };
      }

      return {
        success: false,
        error: {
          code: data.error?.code || 'UNKNOWN',
          message: data.error?.message || 'Failed to send message',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: (error as Error).message,
        },
      };
    }
  }

  /**
   * Doküman gönderir
   */
  async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    caption: string,
    filename: string
  ): Promise<WhatsAppResult> {
    // API credentials yoksa mock sonuç döndür
    if (!this.accessToken || !this.phoneNumberId) {
      console.log(`[WhatsApp Mock] Document to ${phoneNumber}: ${filename}`);
      return {
        success: true,
        messageId: `mock_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'document',
            document: {
              link: documentUrl,
              caption: caption,
              filename: filename,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.messages?.[0]?.id) {
        return {
          success: true,
          messageId: data.messages[0].id,
        };
      }

      return {
        success: false,
        error: {
          code: data.error?.code || 'UNKNOWN',
          message: data.error?.message || 'Failed to send document',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: (error as Error).message,
        },
      };
    }
  }

  /**
   * Metin mesajı gönderir
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<WhatsAppResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.log(`[WhatsApp Mock] Text to ${phoneNumber}: ${text.substring(0, 50)}...`);
      return {
        success: true,
        messageId: `mock_text_${Date.now()}`,
      };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: text },
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }

      return {
        success: false,
        error: {
          code: data.error?.code || 'UNKNOWN',
          message: data.error?.message || 'Failed to send text',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: (error as Error).message },
      };
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;
