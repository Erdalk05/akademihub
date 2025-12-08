import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { RoleProvider } from '@/lib/contexts/RoleContext'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AkademiHub - AI Destekli Yönetim Dashboard',
  description: 'Modern, Responsive ve Performanslı Eğitim Yönetim Sistemi',
  keywords: ['eğitim', 'yönetim', 'AI', 'dashboard', 'akademi'],
  authors: [{ name: 'AkademiHub Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

import LayoutWrapper from '@/components/layout/LayoutWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-gray-50`}>
        <ErrorBoundary>
          <ThemeProvider>
            <RoleProvider>
              <NotificationProvider>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </NotificationProvider>
            </RoleProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
