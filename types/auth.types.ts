import { UserRole, BaseEntity } from './common.types';

// ============================================
// AUTH TYPES
// ============================================

export interface User extends BaseEntity {
  email: string;
  name: string;
  surname: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
}

export interface Session extends BaseEntity {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  surname: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  surname?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
