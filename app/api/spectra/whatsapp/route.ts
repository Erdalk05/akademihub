import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// SPECTRA - WHATSAPP BİLDİRİM API
// Sınav sonuçlarını ve raporları WhatsApp üzerinden gönderir
// ============================================================================

export const dynamic = 'force-dynamic';

interface WhatsAppPayload {
  type: 'exam_result' | 'report_card' | 'risk_alert' | 'payment_reminder' | 'custom';
  recipientType: 'student' | 'parent' | 'both';
  recipientIds: string[]; // student_ids
  message?: string;
  examId?: string;
  templateId?: string;
  organizationId: string;
}

/**
 * POST /api/spectra/whatsapp
 * WhatsApp mesajı gönder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body: WhatsAppPayload = await request.json();

    const { type, recipientType, recipientIds, message, examId, organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID gerekli' },
        { status: 400 }
      );
    }

    if (!recipientIds || recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'En az bir alıcı gerekli' },
        { status: 400 }
      );
    }

    // Öğrenci ve veli telefon numaralarını çek
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        parent_phone,
        parent_name
      `)
      .in('id', recipientIds)
      .eq('organization_id', organizationId);

    if (studentsError) {
      console.error('Öğrenci çekme hatası:', studentsError);
      return NextResponse.json(
        { success: false, error: 'Öğrenci bilgileri alınamadı' },
        { status: 500 }
      );
    }

    // Telefon numaralarını topla
    const phoneNumbers: { phone: string; name: string; studentId: string }[] = [];

    students?.forEach((student) => {
      if (recipientType === 'student' || recipientType === 'both') {
        if (student.phone) {
          phoneNumbers.push({
            phone: normalizePhone(student.phone),
            name: `${student.first_name} ${student.last_name}`,
            studentId: student.id,
          });
        }
      }
      if (recipientType === 'parent' || recipientType === 'both') {
        if (student.parent_phone) {
          phoneNumbers.push({
            phone: normalizePhone(student.parent_phone),
            name: student.parent_name || `${student.first_name} ${student.last_name} Velisi`,
            studentId: student.id,
          });
        }
      }
    });

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geçerli telefon numarası bulunamadı' },
        { status: 400 }
      );
    }

    // Mesaj hazırla
    let messageText = message;

    if (type === 'exam_result' && examId) {
      // Sınav sonuç mesajı oluştur
      const { data: exam } = await supabase
        .from('exams')
        .select('name, exam_date')
        .eq('id', examId)
        .single();

      const examName = exam?.name || 'Sınav';
      const examDate = exam?.exam_date
        ? new Date(exam.exam_date).toLocaleDateString('tr-TR')
        : '';

      messageText = `📊 *${examName}* sonuçlarınız açıklandı!\n\n📅 Tarih: ${examDate}\n\nDetaylı sonuçlar için sisteme giriş yapabilirsiniz.\n\n🎓 AkademiHub`;
    }

    if (type === 'risk_alert') {
      messageText = `⚠️ *Dikkat*\n\nÖğrencinizin performansında düşüş tespit edildi. Detaylı bilgi için rehberlik birimimizle iletişime geçebilirsiniz.\n\n🎓 AkademiHub`;
    }

    if (type === 'payment_reminder') {
      messageText = `💳 *Ödeme Hatırlatması*\n\nTaksit ödemenizin son tarihi yaklaşıyor. Detaylar için sisteme giriş yapabilirsiniz.\n\n🎓 AkademiHub`;
    }

    // WhatsApp API entegrasyonu - Şu an sadece log ve kayıt
    // Gerçek entegrasyon için: Twilio, MessageBird, WhatsApp Business API vb.
    const sentMessages: {
      phone: string;
      status: 'sent' | 'failed' | 'queued';
      error?: string;
    }[] = [];

    for (const recipient of phoneNumbers) {
      try {
        // TODO: Gerçek WhatsApp API çağrısı
        // await sendWhatsAppMessage(recipient.phone, messageText);

        // Şimdilik başarılı varsayıyoruz
        sentMessages.push({
          phone: maskPhone(recipient.phone),
          status: 'queued',
        });

        // Log kaydı
        await supabase.from('notification_logs').insert({
          organization_id: organizationId,
          type: 'whatsapp',
          recipient_type: recipientType,
          recipient_id: recipient.studentId,
          recipient_phone: recipient.phone,
          message_type: type,
          message_preview: messageText?.substring(0, 100),
          status: 'queued',
        });
      } catch (err: any) {
        sentMessages.push({
          phone: maskPhone(recipient.phone),
          status: 'failed',
          error: err.message,
        });
      }
    }

    const successCount = sentMessages.filter((m) => m.status === 'queued').length;
    const failedCount = sentMessages.filter((m) => m.status === 'failed').length;

    return NextResponse.json({
      success: true,
      message: `${successCount} mesaj kuyruğa alındı${failedCount > 0 ? `, ${failedCount} başarısız` : ''}`,
      totalRecipients: phoneNumbers.length,
      successCount,
      failedCount,
      details: sentMessages,
    });
  } catch (error: any) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

// Telefon numarasını normalize et
function normalizePhone(phone: string): string {
  // Sadece rakamları al
  let normalized = phone.replace(/\D/g, '');

  // Başındaki 0'ı kaldır
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }

  // Türkiye kodu ekle
  if (!normalized.startsWith('90')) {
    normalized = '90' + normalized;
  }

  return normalized;
}

// Telefon numarasını maskele (gizlilik)
function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
}

/**
 * GET /api/spectra/whatsapp/templates
 * WhatsApp mesaj şablonlarını getir
 */
export async function GET(request: NextRequest) {
  const templates = [
    {
      id: 'exam_result',
      name: 'Sınav Sonucu',
      description: 'Sınav sonuçları açıklandı bildirimi',
      preview:
        '📊 *[Sınav Adı]* sonuçlarınız açıklandı!\n\n📅 Tarih: [Tarih]\n\nDetaylı sonuçlar için sisteme giriş yapabilirsiniz.\n\n🎓 AkademiHub',
    },
    {
      id: 'report_card',
      name: 'Karne Bildirimi',
      description: 'Dönem sonu karne bildirimi',
      preview:
        '📋 *Karne Bildirimi*\n\nDönem sonu karneniz hazır! Sisteme giriş yaparak inceleyebilirsiniz.\n\n🎓 AkademiHub',
    },
    {
      id: 'risk_alert',
      name: 'Risk Uyarısı',
      description: 'Performans düşüşü uyarısı',
      preview:
        '⚠️ *Dikkat*\n\nÖğrencinizin performansında düşüş tespit edildi.\n\n🎓 AkademiHub',
    },
    {
      id: 'payment_reminder',
      name: 'Ödeme Hatırlatması',
      description: 'Taksit ödeme hatırlatması',
      preview:
        '💳 *Ödeme Hatırlatması*\n\nTaksit ödemenizin son tarihi yaklaşıyor.\n\n🎓 AkademiHub',
    },
  ];

  return NextResponse.json({ success: true, templates });
}

