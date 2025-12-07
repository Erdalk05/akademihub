import { NextRequest, NextResponse } from 'next/server';
import { LoginCredentials, User, AuthResponse } from '@/types';

// Mock users database
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin',
    surname: 'Yönetici',
    role: 'ADMIN',
  },
  {
    id: '2',
    email: 'teacher@demo.com',
    password: 'teacher123',
    name: 'Ayşe',
    surname: 'Öğretmen',
    role: 'TEACHER',
  },
  {
    id: '3',
    email: 'parent@demo.com',
    password: 'parent123',
    name: 'Mehmet',
    surname: 'Veli',
    role: 'PARENT',
  },
  {
    id: '4',
    email: 'accountant@demo.com',
    password: 'accountant123',
    name: 'Fatma',
    surname: 'Muhasebeci',
    role: 'ACCOUNTANT',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;
    
    // eslint-disable-next-line no-console
    console.log('🔐 Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ve şifre gereklidir',
          statusCode: 400,
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Find user
    const user = MOCK_USERS.find((u) => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email veya şifre hatalı',
          statusCode: 401,
          timestamp: new Date(),
        },
        { status: 401 }
      );
    }

    // Generate mock token
    const token = `token_${user.id}_${Date.now()}`;

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token,
      expiresIn: 86400, // 24 hours
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Başarıyla giriş yapıldı',
        statusCode: 200,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Giriş sırasında bir hata oluştu',
        statusCode: 500,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
