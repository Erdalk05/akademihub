import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Otomatik Yedekleme Zamanlayıcı
 * 
 * Bu endpoint bir cron job tarafından çağrılmalı:
 * - Vercel Cron: vercel.json'da tanımlanır
 * - External Cron: uptimerobot, easycron vb.
 * 
 * Örnek vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/backup/schedule",
 *     "schedule": "0 3 * * *"  // Her gün saat 03:00
 *   }]
 * }
 */

interface BackupRecord {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'manual';
  status: 'pending' | 'completed' | 'failed';
  tables_count: number;
  total_records: number;
  file_size?: number;
  storage_path?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * GET /api/backup/schedule
 * Otomatik yedekleme çalıştır (cron job için)
 */
export async function GET(req: NextRequest) {
  try {
    // Güvenlik: Cron secret kontrolü
    const cronSecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET || 'akademihub_cron_2025';
    
    // Production'da secret kontrolü yap
    if (process.env.NODE_ENV === 'production' && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getServiceRoleClient();
    const now = new Date();
    const backupId = `backup_${now.toISOString().replace(/[:.]/g, '-')}`;

    // Yedeklenecek tablolar
    const tables = [
      'students',
      'finance_installments',
      'enrollments',
      'organizations',
      'app_users',
      'expenses',
      'other_income',
      'settings',
      'activity_logs',
    ];

    const backup: Record<string, any[]> = {};
    const errors: string[] = [];
    let totalRecords = 0;

    // Her tabloyu yedekle
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          errors.push(`${table}: ${error.message}`);
        } else {
          backup[table] = data || [];
          totalRecords += (data || []).length;
        }
      } catch (e: any) {
        errors.push(`${table}: ${e.message}`);
      }
    }

    // Yedek türünü belirle
    const dayOfWeek = now.getDay(); // 0 = Pazar
    const dayOfMonth = now.getDate();
    let backupType: 'daily' | 'weekly' | 'monthly' = 'daily';
    
    if (dayOfMonth === 1) {
      backupType = 'monthly';
    } else if (dayOfWeek === 0) {
      backupType = 'weekly';
    }

    // Yedek kaydı oluştur
    const backupRecord: Partial<BackupRecord> = {
      id: backupId,
      type: backupType,
      status: errors.length === 0 ? 'completed' : 'failed',
      tables_count: Object.keys(backup).length,
      total_records: totalRecords,
      file_size: JSON.stringify(backup).length,
      error_message: errors.length > 0 ? errors.join('; ') : undefined,
      created_at: now.toISOString(),
      completed_at: new Date().toISOString(),
    };

    // Yedek geçmişini kaydet (backup_history tablosu yoksa oluşturulmalı)
    try {
      await supabase.from('backup_history').insert(backupRecord);
    } catch { /* Tablo yoksa hata vermez */ }

    // Eski yedekleri temizle (30 günden eski daily, 90 günden eski weekly)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    try {
      await supabase
        .from('backup_history')
        .delete()
        .eq('type', 'daily')
        .lt('created_at', thirtyDaysAgo);
    } catch { /* ignore */ }

    try {
      await supabase
        .from('backup_history')
        .delete()
        .eq('type', 'weekly')
        .lt('created_at', ninetyDaysAgo);
    } catch { /* ignore */ }

    // Aktivite logu
    try {
      await supabase.from('activity_logs').insert({
        action: 'scheduled_backup',
        entity_type: 'system',
        details: {
          backup_id: backupId,
          type: backupType,
          tables_count: Object.keys(backup).length,
          total_records: totalRecords,
          errors: errors.length > 0 ? errors : undefined,
        },
        created_at: now.toISOString(),
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: errors.length === 0,
      backup_id: backupId,
      type: backupType,
      tables_count: Object.keys(backup).length,
      total_records: totalRecords,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0 
        ? `${backupType} yedekleme başarılı` 
        : `Yedekleme tamamlandı ancak ${errors.length} hata oluştu`,
    });

  } catch (error: any) {
    console.error('Scheduled backup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Otomatik yedekleme hatası' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backup/schedule
 * Yedekleme ayarlarını güncelle
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Ayarlar gerekli' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Ayarları kaydet
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'backup_settings',
        value: {
          enabled: settings.enabled ?? true,
          daily_time: settings.daily_time || '03:00',
          weekly_day: settings.weekly_day || 0, // Pazar
          monthly_day: settings.monthly_day || 1,
          retention_days: {
            daily: settings.retention_days?.daily || 30,
            weekly: settings.retention_days?.weekly || 90,
            monthly: settings.retention_days?.monthly || 365,
          },
          tables: settings.tables || [
            'students',
            'finance_installments',
            'enrollments',
            'organizations',
            'app_users',
          ],
          notify_email: settings.notify_email || null,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Yedekleme ayarları güncellendi',
    });

  } catch (error: any) {
    console.error('Backup settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ayar güncelleme hatası' },
      { status: 500 }
    );
  }
}

