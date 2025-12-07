import { NextRequest, NextResponse } from 'next/server';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/lib/types/role-types';

export const runtime = 'nodejs';

/**
 * API endpoint to check if a user has a specific permission
 * POST /api/auth/check-permission
 * Body: { role: UserRole, permission: Permission }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, permission } = body;

    if (!role || !permission) {
      return NextResponse.json(
        { success: false, error: 'Role and permission are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate permission
    if (!Object.values(Permission).includes(permission)) {
      return NextResponse.json(
        { success: false, error: 'Invalid permission' },
        { status: 400 }
      );
    }

    // Check permission
    const permissions = ROLE_PERMISSIONS[role as UserRole];
    const hasPermission = permissions.includes(permission as Permission);

    return NextResponse.json({
      success: true,
      hasPermission,
      role,
      permission,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Permission check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to get all permissions for a role
 * GET /api/auth/check-permission?role=admin
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get permissions
    const permissions = ROLE_PERMISSIONS[role as UserRole];

    return NextResponse.json({
      success: true,
      role,
      permissions,
      count: permissions.length,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

