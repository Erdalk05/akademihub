import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// ============================================================================
// SPECTRA - PUSH NOTIFICATION API
// Push subscription kayıt ve bildirim gönderimi
// ============================================================================

export const dynamic = 'force-dynamic';

/**
 * POST /api/spectra/push
 * Push subscription kaydet veya bildirim gönder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();

    const { action, userId, subscription, notification, organizationId } = body;

    // Subscription kaydet
    if (action === 'subscribe' && subscription) {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_agent: request.headers.get('user-agent') || '',
          is_active: true,
          subscribed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Subscription save error:', error);
        return NextResponse.json(
          { success: false, error: 'Kayıt başarısız' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Push subscription kaydedildi',
      });
    }

    // Subscription iptal
    if (action === 'unsubscribe' && subscription?.endpoint) {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('Unsubscribe error:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Push subscription iptal edildi',
      });
    }

    // Bildirim gönder
    if (action === 'send' && notification) {
      const { userIds, title, body: notificationBody, data } = notification;

      if (!userIds || userIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'userIds gerekli' },
          { status: 400 }
        );
      }

      // Aktif subscription'ları çek
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (subError || !subscriptions || subscriptions.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Aktif subscription bulunamadı',
        });
      }

      // Web Push gönderimi (gerçek implementasyon için web-push package gerekli)
      // Şimdilik sadece log ve kayıt
      const sentCount = subscriptions.length;

      // Notification log kaydet
      for (const sub of subscriptions) {
        await supabase.from('notification_logs').insert({
          organization_id: organizationId,
          type: 'push',
          recipient_type: 'user',
          recipient_id: sub.user_id,
          message_type: data?.type || 'custom',
          message_preview: `${title}: ${notificationBody}`.substring(0, 100),
          status: 'queued',
        });
      }

      return NextResponse.json({
        success: true,
        message: `${sentCount} bildirim kuyruğa alındı`,
        sentCount,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Geçersiz action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Push API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Beklenmeyen hata' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/spectra/push?userId=xxx
 * Kullanıcının push subscription durumunu kontrol et
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId gerekli' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, is_active, subscribed_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      hasSubscription: (data || []).length > 0,
      subscriptions: data || [],
    });
  } catch (error: any) {
    console.error('Push GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

