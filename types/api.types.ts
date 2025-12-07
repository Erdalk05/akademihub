// ============================================
// API TYPES
// ============================================

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: ApiErrorDetail[];
  timestamp: Date;
  path?: string;
  method?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponseWrapper<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
  timestamp: Date;
  meta?: PaginationMeta;
}

export interface ListApiResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

export interface FileUploadResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  interceptors?: {
    onRequest?: (config: any) => any;
    onError?: (error: any) => any;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  services?: Record<string, {
    status: string;
    responseTime: number;
  }>;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  timestamp: Date;
}

export interface BackupResponse {
  success: boolean;
  backupId: string;
  fileName: string;
  size: number;
  createdAt: Date;
  downloadUrl?: string;
}
