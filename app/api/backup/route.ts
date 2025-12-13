import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/backup
 * Veritabanı yedeği oluştur - JSON formatında
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tables = searchParams.get('tables')?.split(',') || [
      'students',
      'finance_installments',
      'enrollments',
      'organizations',
      'app_users',
      'expenses',
      'other_income',
      'settings',
    ];

    const supabase = getServiceRoleClient();
    const backup: Record<string, any[]> = {};
    const errors: string[] = [];

    // Her tabloyu sırayla yedekle
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
        }
      } catch (e: any) {
        errors.push(`${table}: ${e.message}`);
      }
    }

    // Yedek meta bilgileri
    const backupMeta = {
      created_at: new Date().toISOString(),
      tables_count: Object.keys(backup).length,
      total_records: Object.values(backup).reduce((sum, arr) => sum + arr.length, 0),
      errors: errors.length > 0 ? errors : undefined,
      version: '1.0',
    };

    // Aktivite logu
    await supabase.from('activity_logs').insert({
      action: 'backup_created',
      entity_type: 'system',
      details: {
        tables: tables,
        record_count: backupMeta.total_records,
      },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      meta: backupMeta,
      data: backup,
    });

  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Yedekleme hatası' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backup
 * Yedekten geri yükle
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data: backupData, options } = body;

    if (!backupData || typeof backupData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz yedek verisi' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const results: Record<string, { success: boolean; count: number; error?: string }> = {};

    // Geri yükleme sırası önemli (foreign key ilişkileri)
    const restoreOrder = [
      'organizations',
      'app_users',
      'settings',
      'students',
      'enrollments',
      'finance_installments',
      'expenses',
      'other_income',
    ];

    for (const table of restoreOrder) {
      if (!backupData[table] || !Array.isArray(backupData[table])) {
        continue;
      }

      try {
        const records = backupData[table];
        
        if (records.length === 0) {
          results[table] = { success: true, count: 0 };
          continue;
        }

        // Mevcut verileri silme seçeneği
        if (options?.clearExisting) {
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Toplu ekleme (100'erli gruplar halinde)
        const batchSize = 100;
        let insertedCount = 0;
        let lastError: string | undefined;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          const { error } = await supabase
            .from(table)
            .upsert(batch, { onConflict: 'id' });

          if (error) {
            lastError = error.message;
          } else {
            insertedCount += batch.length;
          }
        }

        results[table] = {
          success: !lastError,
          count: insertedCount,
          error: lastError,
        };

      } catch (e: any) {
        results[table] = {
          success: false,
          count: 0,
          error: e.message,
        };
      }
    }

    // Aktivite logu
    await supabase.from('activity_logs').insert({
      action: 'backup_restored',
      entity_type: 'system',
      details: {
        results,
        options,
      },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalTables = Object.keys(results).length;

    return NextResponse.json({
      success: successCount === totalTables,
      message: `${successCount}/${totalTables} tablo geri yüklendi`,
      results,
    });

  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Geri yükleme hatası' },
      { status: 500 }
    );
  }
}

