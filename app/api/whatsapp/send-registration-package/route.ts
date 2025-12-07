import { NextRequest, NextResponse } from 'next/server';
// WhatsApp service - using direct API integration

/**
 * POST /api/whatsapp/send-registration-package
 * 
 * Sends complete registration package via WhatsApp:
 * 1. Confirmation message
 * 2. Registration certificate PDF
 * 3. Payment plan PDF
 * 4. Contract PDF
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, phoneNumber, studentName } = body;

    if (!phoneNumber || !studentName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+?90?\s?\d{3}\s?\d{3}\s?\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const messageIds: string[] = [];

    // 1. Send confirmation message
    const confirmResult = await whatsappService.sendTemplateMessage(
      phoneNumber,
      'registration_completed',
      'tr',
      [{ type: 'text', text: studentName }]
    );

    if (!confirmResult.success) {
      return NextResponse.json(
        { success: false, error: confirmResult.error?.message || 'Failed to send confirmation' },
        { status: 500 }
      );
    }

    if (confirmResult.messageId) {
      messageIds.push(confirmResult.messageId);
    }

    // 2-4. Send documents (with delay to respect rate limits)
    const documents = [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pdf/registration-certificate/${studentId}`,
        caption: 'Resmi Kayıt Belgeniz - MEB Onaylı',
        filename: `${studentName.replace(/\s+/g, '_')}_Kayit_Belgesi.pdf`,
      },
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pdf/payment-plan/${studentId}`,
        caption: 'Taksit Ödeme Planınız',
        filename: `${studentName.replace(/\s+/g, '_')}_Odeme_Plani.pdf`,
      },
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pdf/contract/${studentId}`,
        caption: 'İmzalı Kayıt Sözleşmeniz',
        filename: `${studentName.replace(/\s+/g, '_')}_Kayit_Sozlesmesi.pdf`,
      },
    ];

    for (const doc of documents) {
      // Wait 2 seconds between messages (WhatsApp rate limit)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const docResult = await whatsappService.sendDocument(
        phoneNumber,
        doc.url,
        doc.caption,
        doc.filename
      );

      if (docResult.success && docResult.messageId) {
        messageIds.push(docResult.messageId);
      }
    }

    return NextResponse.json({
      success: true,
      messageIds,
      message: `Successfully sent ${messageIds.length} messages to ${phoneNumber}`,
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

