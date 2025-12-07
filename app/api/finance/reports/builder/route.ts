/**
 * AkademiHub Free Report Builder 7.0
 * SQL Builder + Core Engine API (v1.1)
 *
 * Amaç:
 * - Frontend'den gelen FreeReportRequest gövdesini alır
 * - freeReportSqlBuilder ile parametrik SQL üretir (önizleme için)
 * - JOIN içermeyen basit raporlar için Supabase üzerinden GERÇEK veri çeker
 * - Sonuç: sql + params + rows + rowCount
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import {
  buildReportQuery,
  type FreeReportRequest,
} from '@/lib/reporting/freeReportSqlBuilder';

export const runtime = 'nodejs';

const response = {
  success: (data: any = null, status = 200) =>
    NextResponse.json({ success: true, data }, { status }),

  fail: (error: string, status = 500, meta: any = null) =>
    NextResponse.json({ success: false, error, meta }, { status }),
};

function log(message: string, meta: any = {}) {
  console.log(
    `[${new Date().toISOString()}] [FREE_REPORT_BUILDER]`,
    message,
    meta || '',
  );
}

function applyRelativeDateFilter(
  col: string,
  preset: string | null | undefined,
): { gte?: string; lte?: string } | null {
  if (!preset) return null;

  const today = new Date();
  const toISO = (d: Date) => d.toISOString().split('T')[0];

  if (preset === 'today') {
    const d = toISO(today);
    return { gte: d, lte: d };
  }

  if (preset === 'last_7_days') {
    const from = new Date(today);
    from.setDate(from.getDate() - 7);
    return { gte: toISO(from), lte: toISO(today) };
  }

  if (preset === 'this_month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { gte: toISO(from), lte: toISO(to) };
  }

  if (preset === 'this_year') {
    const from = new Date(today.getFullYear(), 0, 1);
    const to = new Date(today.getFullYear(), 11, 31);
    return { gte: toISO(from), lte: toISO(to) };
  }

  if (preset === 'last_year') {
    const from = new Date(today.getFullYear() - 1, 0, 1);
    const to = new Date(today.getFullYear() - 1, 11, 31);
    return { gte: toISO(from), lte: toISO(to) };
  }

  return null;
}

// ------------------------------------------------------
// POST /api/finance/reports/builder
// Body: FreeReportRequest
// ------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FreeReportRequest;
    log('Incoming request', body);

    // Basit koruma: en az bir alan seçili olmalı
    if (!body.select || body.select.length === 0) {
      return response.fail('En az bir alan seçmelisiniz (select).', 400);
    }

    const built = buildReportQuery(body);
    log('Query built successfully', built);

    // JOIN içeren karmaşık sorgular için şimdilik sadece SQL önizlemesi döndürülüyor.
    if (body.joins && body.joins.length > 0) {
      return response.success(
        {
          sql: built.sql,
          params: built.params,
          result: {
            rows: [],
            rowCount: 0,
            note:
              'JOIN içeren serbest raporlar için şu anda sadece SQL önizlemesi üretilmektedir. Gerçek veri çalıştırma bir sonraki adımda eklenecek.',
          },
        },
        200,
      );
    }

    // Basit senaryo: sadece primaryTable kullanılıyorsa, Supabase ile gerçek veri çek
    const supabase = getServiceRoleClient();
    const primaryTable = body.primaryTable;

    // Seçili alanlara göre kolon listesi oluştur (şimdilik tablo aliası olmadan, sadece alan adı)
    const selectColumns = body.select.map((s) => s.field);
    let query = supabase.from(primaryTable).select(selectColumns.join(','), {
      head: false,
    });

    // Yalnızca primaryTable için filtreleri uygula
    body.filters
      ?.filter((f) => f.table === primaryTable)
      .forEach((f) => {
        const col = f.field;
        switch (f.op) {
          case '=':
          case '!=':
          case '>':
          case '<':
          case '>=':
          case '<=':
            query = query.filter(col, f.op, f.value);
            break;
          case 'contains':
            query = query.ilike(col, `%${String(f.value)}%`);
            break;
          case 'between':
            if (Array.isArray(f.value) && f.value.length === 2) {
              query = query.gte(col, f.value[0]).lte(col, f.value[1]);
            }
            break;
          case 'in':
            if (Array.isArray(f.value)) {
              query = query.in(col, f.value);
            }
            break;
          case 'relative_date': {
            const range = applyRelativeDateFilter(col, f.preset);
            if (range?.gte) query = query.gte(col, range.gte);
            if (range?.lte) query = query.lte(col, range.lte);
            break;
          }
          default:
            break;
        }
      });

    // Sıralama (yalnızca primaryTable)
    body.orderBy
      ?.filter((o) => o.table === primaryTable)
      .forEach((o) => {
        query = query.order(o.field, {
          ascending: o.direction?.toLowerCase() === 'asc',
        });
      });

    // Limit / offset
    if (typeof body.limit === 'number') {
      if (typeof body.offset === 'number') {
        const from = body.offset;
        const to = body.offset + body.limit - 1;
        query = query.range(from, to);
      } else {
        query = query.limit(body.limit);
      }
    }

    const { data, error } = await query;

    if (error) {
      log('Supabase query error', error);
      
      // Kolon hatası için özel mesaj
      let userMessage = error.message || 'Free Report Builder veri çekme hatası.';
      if (error.message?.includes('does not exist')) {
        const colMatch = error.message.match(/column "?([^" ]+)"? does not exist/i);
        if (colMatch) {
          const colName = colMatch[1];
          userMessage = `Kolon hatası: "${colName}" tabloda bulunamadı. Lütfen seçili alanları kontrol edin veya farklı bir alan seçin.`;
        }
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        const tableMatch = error.message.match(/relation "?([^" ]+)"? does not exist/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          userMessage = `Tablo hatası: "${tableName}" veritabanında bulunamadı.`;
        }
      }
      
      return response.fail(userMessage, 500, { 
        sql: built.sql,
        originalError: error.message,
        table: primaryTable,
        columns: selectColumns,
      });
    }

    const rows = data || [];

    return response.success(
      {
        sql: built.sql,
        params: built.params,
        result: {
          rows,
          rowCount: rows.length,
          note:
            'Bu sonuçlar yalnızca primary tablo üzerinden çekilmiştir. JOIN içeren raporlar için ileride gelişmiş motor eklenecektir.',
        },
      },
      200,
    );
  } catch (e: any) {
    if (e?.code === 'VALIDATION_ERROR') {
      log('Validation error', { error: e.message });
      return response.fail(e.message, 400);
    }

    log('Unexpected error', { error: e?.message || e });
    return response.fail(
      e?.message || 'Free Report Builder sorgusu oluşturulurken beklenmeyen hata.',
      500,
    );
  }
}


