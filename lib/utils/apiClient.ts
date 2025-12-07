/**
 * API Client with Role Headers
 * Tüm API isteklerinde kullanıcı rolünü header olarak gönderir
 */

import { UserRole } from '@/lib/types/role-types';

// Varsayılan headers
const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
};

/**
 * Rol header'ı ile API isteği oluştur
 */
export function createApiHeaders(role: UserRole): HeadersInit {
  return {
    ...defaultHeaders,
    'X-User-Role': role,
  };
}

/**
 * GET isteği
 */
export async function apiGet<T>(
  url: string, 
  role: UserRole
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: createApiHeaders(role),
      cache: 'no-store',
    });

    const json = await response.json();

    if (!response.ok) {
      return { success: false, error: json.error || 'Bir hata oluştu' };
    }

    return json;
  } catch (error: any) {
    return { success: false, error: error.message || 'Bağlantı hatası' };
  }
}

/**
 * POST isteği
 */
export async function apiPost<T>(
  url: string,
  data: any,
  role: UserRole
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: createApiHeaders(role),
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      return { success: false, error: json.error || 'Bir hata oluştu' };
    }

    return json;
  } catch (error: any) {
    return { success: false, error: error.message || 'Bağlantı hatası' };
  }
}

/**
 * PUT isteği - Admin gerektirir
 */
export async function apiPut<T>(
  url: string,
  data: any,
  role: UserRole
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: createApiHeaders(role),
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      // 403 özel mesaj
      if (response.status === 403) {
        return { 
          success: false, 
          error: json.error || 'Bu işlem için admin yetkisi gereklidir' 
        };
      }
      return { success: false, error: json.error || 'Bir hata oluştu' };
    }

    return json;
  } catch (error: any) {
    return { success: false, error: error.message || 'Bağlantı hatası' };
  }
}

/**
 * PATCH isteği - Admin gerektirir
 */
export async function apiPatch<T>(
  url: string,
  data: any,
  role: UserRole
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: createApiHeaders(role),
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        return { 
          success: false, 
          error: json.error || 'Bu işlem için admin yetkisi gereklidir' 
        };
      }
      return { success: false, error: json.error || 'Bir hata oluştu' };
    }

    return json;
  } catch (error: any) {
    return { success: false, error: error.message || 'Bağlantı hatası' };
  }
}

/**
 * DELETE isteği - Admin gerektirir
 */
export async function apiDelete<T>(
  url: string,
  role: UserRole
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: createApiHeaders(role),
    });

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        return { 
          success: false, 
          error: json.error || 'Bu işlem için admin yetkisi gereklidir' 
        };
      }
      return { success: false, error: json.error || 'Bir hata oluştu' };
    }

    return json;
  } catch (error: any) {
    return { success: false, error: error.message || 'Bağlantı hatası' };
  }
}




