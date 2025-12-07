// ============================================
// COMMON TYPES
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  ACCOUNTANT = 'ACCOUNTANT',
  GUIDANCE = 'GUIDANCE',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  LEFT_SCHOOL = 'LEFT_SCHOOL',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodType {
  O_PLUS = 'O_PLUS',
  O_MINUS = 'O_MINUS',
  A_PLUS = 'A_PLUS',
  A_MINUS = 'A_MINUS',
  B_PLUS = 'B_PLUS',
  B_MINUS = 'B_MINUS',
  AB_PLUS = 'AB_PLUS',
  AB_MINUS = 'AB_MINUS',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  isVisible: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ValidationError {
  field: string;
  message: string;
}
