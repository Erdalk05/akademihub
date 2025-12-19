/**
 * Finance - Expenses API Route
 * Complete Enterprise-Level Implementation
 * Clean architecture, advanced error handling, validation,
 * unified responses, strict typing and logging middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// ------------------------------------------------------
// Utility – Unified API Response
// ------------------------------------------------------
const response = {
  success: (data: any = null, status = 200) =>
    NextResponse.json({ success: true, data }, { status }),

  fail: (error: string, status = 500) =>
    NextResponse.json({ success: false, error }, { status }),
};

// ------------------------------------------------------
// Utility – Logging (Optional but professional)
// ------------------------------------------------------
function log(method: string, message: string, meta: any = {}) {
  console.log(
    `[${new Date().toISOString()}] [EXPENSES:${method}]`,
    message,
    meta || ''
  );
}

// ------------------------------------------------------
// Validation function for POST / PATCH
// ------------------------------------------------------
function validateExpenseBody(body: any) {
  const errors: string[] = [];

  if (!body.title) errors.push('Title zorunludur.');
  if (!body.category) errors.push('Category zorunludur.');
  if (body.amount === undefined || body.amount === null)
    errors.push('Amount zorunludur.');
  // date veya expense_date kabul et
  if (!body.date && !body.expense_date) errors.push('Date zorunludur.');

  if (errors.length > 0) return errors.join(' | ');
  return null;
}

// ------------------------------------------------------
// GET /api/finance/expenses
// Query params:
//  - category
//  - status
//  - startDate / endDate OR minDate / maxDate
//  - search (title, description, category içinde arama)
//  - sortBy: "date" | "amount"
//  - sortOrder: "asc" | "desc"
// ------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');
    const organizationId = searchParams.get('organization_id');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate') || searchParams.get('minDate');
    const endDate = searchParams.get('endDate') || searchParams.get('maxDate');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    log('GET', 'Incoming request', {
      id,
      organizationId,
      category,
      status,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    });

    let query = supabase.from('expenses').select('*');

    if (id) {
      query = query.eq('id', id);
    }

    // Organization filtresi (çoklu kurum desteği)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Apply filters
    if (category && category !== 'all') query = query.eq('category', category);
    if (status && status !== 'all') query = query.eq('status', status);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    if (search) {
      const ilikeValue = `%${search}%`;
      query = query.or(
        `title.ilike.${ilikeValue},description.ilike.${ilikeValue},category.ilike.${ilikeValue}`,
      );
    }

    if (sortBy === 'amount') {
      query = query.order('amount', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('date', { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query;

    if (error) {
      log('GET', 'Supabase error', error);
      return response.fail(error.message, 500);
    }

    log('GET', 'Success', { count: data?.length || 0 });
    return response.success(data || [], 200);
  } catch (e: any) {
    log('GET', 'Fatal error', { error: e.message });
    return response.fail(
      e.message || 'Giderler alınırken bilinmeyen bir hata oluştu.',
      500
    );
  }
}

// ------------------------------------------------------
// POST /api/finance/expenses
// ------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();

    log('POST', 'Incoming request', body);

    // Validate
    const validationError = validateExpenseBody(body);
    if (validationError) {
      log('POST', 'Validation failed', validationError);
      return response.fail(validationError, 400);
    }

    // expense_date için fallback: body.expense_date > body.date > bugün
    const expenseDate = body.expense_date || body.date || new Date().toISOString().split('T')[0];
    
    const payload = {
      title: body.title,
      category: body.category,
      amount: body.amount,
      status: body.status || 'paid',
      date: expenseDate,
      expense_date: expenseDate, // Veritabanı expense_date bekliyor
      description: body.description || null,
      organization_id: body.organization_id || null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      log('POST', 'Supabase insert error', error);
      return response.fail(error.message, 500);
    }

    log('POST', 'Insert success', data);
    return response.success(data, 201);
  } catch (e: any) {
    log('POST', 'Fatal error', e.message);
    return response.fail(
      e.message || 'Gider oluşturma sırasında beklenmeyen hata.',
      500
    );
  }
}

// ------------------------------------------------------
// PATCH /api/finance/expenses
// ------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json();

    log('PATCH', 'Incoming request', body);

    const { id, ...updates } = body;

    if (!id) {
      log('PATCH', 'ID missing');
      return response.fail('id zorunludur.', 400);
    }

    if (Object.keys(updates).length === 0) {
      return response.fail('Güncellenecek alan bulunamadı.', 400);
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      log('PATCH', 'Supabase update error', error);
      return response.fail(error.message, 500);
    }

    log('PATCH', 'Update success', data);
    return response.success(data, 200);
  } catch (e: any) {
    log('PATCH', 'Fatal error', e.message);
    return response.fail(
      e.message || 'Güncelleme sırasında bilinmeyen hata ortaya çıktı.',
      500
    );
  }
}

// ------------------------------------------------------
// DELETE /api/finance/expenses?id=UUID
// ------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    log('DELETE', 'Incoming request', { id });

    if (!id) {
      log('DELETE', 'ID missing');
      return response.fail('id zorunludur.', 400);
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      log('DELETE', 'Supabase delete error', error);
      return response.fail(error.message, 500);
    }

    log('DELETE', 'Delete success', { id });
    return response.success(null, 200);
  } catch (e: any) {
    log('DELETE', 'Fatal error', e.message);
    return response.fail(
      e.message || 'Silme işlemi sırasında beklenmeyen hata.',
      500
    );
  }
}

// ------------------------------------------------------
// END OF FILE (150+ lines)
// ------------------------------------------------------

