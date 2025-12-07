/**
 * API Client
 * @module lib/api/client
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiResponseWrapper } from '@/types';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // GET
  async get<T>(url: string, config?: any): Promise<AxiosResponse<ApiResponseWrapper<T>>> {
    return this.axiosInstance.get<ApiResponseWrapper<T>>(url, config);
  }

  // POST
  async post<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponseWrapper<T>>> {
    return this.axiosInstance.post<ApiResponseWrapper<T>>(url, data, config);
  }

  // PUT
  async put<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponseWrapper<T>>> {
    return this.axiosInstance.put<ApiResponseWrapper<T>>(url, data, config);
  }

  // PATCH
  async patch<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponseWrapper<T>>> {
    return this.axiosInstance.patch<ApiResponseWrapper<T>>(url, data, config);
  }

  // DELETE
  async delete<T>(url: string, config?: any): Promise<AxiosResponse<ApiResponseWrapper<T>>> {
    return this.axiosInstance.delete<ApiResponseWrapper<T>>(url, config);
  }

  // File upload
  async uploadFile<T>(url: string, formData: FormData, config?: any): Promise<AxiosResponse<ApiResponseWrapper<T>>> {
    return this.axiosInstance.post<ApiResponseWrapper<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }
}

export const apiClient = new ApiClient();
