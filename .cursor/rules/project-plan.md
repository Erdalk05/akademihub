# 🚀 AKADEMİHUB - KOMPLE SİSTEM KURULUM DOKÜMANI

## 📁 .cursorrules DOSYASI (TAM VERSİYON)

```.cursorrules
# ============================================
# AKADEMİHUB - K-12 EĞİTİM YÖNETİM SİSTEMİ
# AI Destekli, MEB Uyumlu, Enterprise Seviye
# ============================================

## 🎯 PROJE VİZYONU
Türkiye'deki K-12 eğitim kurumları için tasarlanmış, yapay zeka destekli,
MEB müfredatına uygun, tam entegre eğitim yönetim platformu.

## 📊 MODÜLLER
1. Dashboard & Analytics (AI Destekli)
2. Öğrenci Yönetimi (Kayıt, Profil, Takip)
3. Finans & Muhasebe (Ödeme, Taksit, Borç)
4. Sınav & Soru Bankası (MEB Uyumlu, AI Soru Üretimi)
5. LGS/YKS Deneme Modülü
6. Rehberlik & Danışmanlık
7. İletişim Sistemi (SMS, Email, Otomasyonlu)
8. Raporlama & Analitik
9. Kullanıcı Yönetimi & Yetkilendirme
10. Ayarlar & Konfigürasyon

## 🛠️ TEKNOLOJİ STACK

### Frontend
- React 18.3+ (Function Components + Hooks)
- TypeScript 5.0+ (Strict Mode)
- Vite 5.0+ (Build Tool)
- React Router v6 (Routing)
- Zustand (State Management)

### UI & Styling
- Tailwind CSS 3.4+
- shadcn/ui (Component Library)
- Lucide React (Icons)
- Recharts (Charts)
- React Hook Form (Form Management)
- Zod (Validation)

### Backend Mock (Şimdilik)
- Mirage JS (API Mock)
- Local Storage (Data Persistence)
- IndexedDB (Large Data)

### AI Integration
- OpenAI GPT-4 API (Soru üretimi, analiz)
- Anthropic Claude API (Uzun metin analizi)

## 📂 DOSYA YAPISI (TAM)

```
/akademihub
├── /public
│   ├── /images
│   │   ├── /avatars
│   │   ├── /placeholders
│   │   └── logo.svg
│   ├── /fonts
│   └── favicon.ico
│
├── /src
│   ├── /assets
│   │   ├── /icons
│   │   └── /illustrations
│   │
│   ├── /components
│   │   ├── /ui (shadcn/ui components)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── progress.tsx
│   │   │   └── calendar.tsx
│   │   │
│   │   ├── /layout
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Breadcrumb.tsx
│   │   │
│   │   ├── /forms
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormTextarea.tsx
│   │   │   ├── FormDatePicker.tsx
│   │   │   ├── FormFileUpload.tsx
│   │   │   └── FormWizard.tsx
│   │   │
│   │   ├── /charts
│   │   │   ├── BarChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── AreaChart.tsx
│   │   │
│   │   ├── /common
│   │   │   ├── KPICard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterPanel.tsx
│   │   │
│   │   └── /ai
│   │       ├── AIPanel.tsx
│   │       ├── AIInsightCard.tsx
│   │       ├── AILoadingState.tsx
│   │       └── TypingEffect.tsx
│   │
│   ├── /modules
│   │   ├── /auth
│   │   │   ├── /components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   └── ResetPasswordForm.tsx
│   │   │   ├── /pages
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   └── ResetPasswordPage.tsx
│   │   │   ├── /hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useLogin.ts
│   │   │   └── /utils
│   │   │       ├── authHelpers.ts
│   │   │       └── tokenManager.ts
│   │   │
│   │   ├── /dashboard
│   │   │   ├── /components
│   │   │   │   ├── KPISection.tsx
│   │   │   │   ├── FinanceChart.tsx
│   │   │   │   ├── StudentInsights.tsx
│   │   │   │   ├── LatestStudents.tsx
│   │   │   │   ├── RiskStudents.tsx
│   │   │   │   ├── TopStudents.tsx
│   │   │   │   ├── RecentActivities.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   └── AIInsightsPanel.tsx
│   │   │   ├── /pages
│   │   │   │   ├── MainDashboard.tsx
│   │   │   │   └── FinanceDashboard.tsx
│   │   │   └── /hooks
│   │   │       └── useDashboardData.ts
│   │   │
│   │   ├── /students
│   │   │   ├── /components
│   │   │   │   ├── StudentCard.tsx
│   │   │   │   ├── StudentTable.tsx
│   │   │   │   ├── StudentFilters.tsx
│   │   │   │   ├── RegistrationWizard.tsx
│   │   │   │   ├── PersonalInfoStep.tsx
│   │   │   │   ├── ParentInfoStep.tsx
│   │   │   │   ├── EducationInfoStep.tsx
│   │   │   │   ├── HealthInfoStep.tsx
│   │   │   │   ├── FinanceInfoStep.tsx
│   │   │   │   ├── DocumentsStep.tsx
│   │   │   │   ├── ProfileTabs.tsx
│   │   │   │   ├── GeneralInfoTab.tsx
│   │   │   │   ├── AcademicTab.tsx
│   │   │   │   ├── FinanceTab.tsx
│   │   │   │   ├── HealthTab.tsx
│   │   │   │   ├── CommunicationTab.tsx
│   │   │   │   ├── DocumentsTab.tsx
│   │   │   │   └── GuidanceTab.tsx
│   │   │   ├── /pages
│   │   │   │   ├── StudentListPage.tsx
│   │   │   │   ├── StudentRegistrationPage.tsx
│   │   │   │   ├── StudentProfilePage.tsx
│   │   │   │   └── StudentSearchPage.tsx
│   │   │   └── /hooks
│   │   │       ├── useStudents.ts
│   │   │       ├── useStudentForm.ts
│   │   │       └── useStudentProfile.ts
│   │   │
│   │   ├── /finance
│   │   │   ├── /components
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   ├── InstallmentTable.tsx
│   │   │   │   ├── DebtList.tsx
│   │   │   │   ├── PaymentHistory.tsx
│   │   │   │   ├── CashRegister.tsx
│   │   │   │   ├── ReceiptModal.tsx
│   │   │   │   └── FinanceCharts.tsx
│   │   │   ├── /pages
│   │   │   │   ├── PaymentPage.tsx
│   │   │   │   ├── InstallmentPlansPage.tsx
│   │   │   │   ├── DebtTrackingPage.tsx
│   │   │   │   └── FinanceReportsPage.tsx
│   │   │   └── /hooks
│   │   │       ├── usePayments.ts
│   │   │       └── useInstallments.ts
│   │   │
│   │   ├── /exams
│   │   │   ├── /components
│   │   │   │   ├── QuestionList.tsx
│   │   │   │   ├── QuestionForm.tsx
│   │   │   │   ├── QuestionFilters.tsx
│   │   │   │   ├── ExamBuilder.tsx
│   │   │   │   ├── ExamPreview.tsx
│   │   │   │   ├── GradeEntryTable.tsx
│   │   │   │   ├── ExamAnalysis.tsx
│   │   │   │   ├── LGSExamCreator.tsx
│   │   │   │   ├── YKSExamCreator.tsx
│   │   │   │   ├── OpticalFormReader.tsx
│   │   │   │   └── AIQuestionGenerator.tsx
│   │   │   ├── /pages
│   │   │   │   ├── QuestionBankPage.tsx
│   │   │   │   ├── ExamCreatorPage.tsx
│   │   │   │   ├── ExamListPage.tsx
│   │   │   │   ├── GradeEntryPage.tsx
│   │   │   │   ├── ExamResultsPage.tsx
│   │   │   │   └── LGS_YKS_Page.tsx
│   │   │   └── /hooks
│   │   │       ├── useQuestions.ts
│   │   │       ├── useExams.ts
│   │   │       └── useAIQuestionGen.ts
│   │   │
│   │   ├── /guidance
│   │   │   ├── /components
│   │   │   │   ├── GuidanceNotes.tsx
│   │   │   │   ├── PsychologicalTests.tsx
│   │   │   │   ├── CareerTests.tsx
│   │   │   │   ├── BehaviorTracking.tsx
│   │   │   │   ├── FamilyMeetingNotes.tsx
│   │   │   │   └── GuidanceReportBuilder.tsx
│   │   │   ├── /pages
│   │   │   │   ├── GuidanceProfilePage.tsx
│   │   │   │   ├── TestsPage.tsx
│   │   │   │   └── GuidanceReportsPage.tsx
│   │   │   └── /hooks
│   │   │       └── useGuidance.ts
│   │   │
│   │   ├── /communication
│   │   │   ├── /components
│   │   │   │   ├── SMSPanel.tsx
│   │   │   │   ├── EmailPanel.tsx
│   │   │   │   ├── TemplateManager.tsx
│   │   │   │   ├── BulkMessaging.tsx
│   │   │   │   ├── AutomationRules.tsx
│   │   │   │   ├── MessageHistory.tsx
│   │   │   │   └── AIMessageComposer.tsx
│   │   │   ├── /pages
│   │   │   │   ├── MessagingPage.tsx
│   │   │   │   ├── TemplatesPage.tsx
│   │   │   │   ├── AutomationPage.tsx
│   │   │   │   └── CommunicationHistoryPage.tsx
│   │   │   └── /hooks
│   │   │       ├── useSMS.ts
│   │   │       ├── useEmail.ts
│   │   │       └── useTemplates.ts
│   │   │
│   │   ├── /reports
│   │   │   ├── /components
│   │   │   │   ├── ReportBuilder.tsx
│   │   │   │   ├── ReportFilters.tsx
│   │   │   │   ├── ReportPreview.tsx
│   │   │   │   ├── ExportOptions.tsx
│   │   │   │   └── ScheduledReports.tsx
│   │   │   ├── /pages
│   │   │   │   ├── AcademicReportsPage.tsx
│   │   │   │   ├── FinanceReportsPage.tsx
│   │   │   │   ├── CustomReportsPage.tsx
│   │   │   │   └── ReportCenterPage.tsx
│   │   │   └── /hooks
│   │   │       └── useReports.ts
│   │   │
│   │   ├── /settings
│   │   │   ├── /components
│   │   │   │   ├── GeneralSettings.tsx
│   │   │   │   ├── SchoolSettings.tsx
│   │   │   │   ├── AcademicYearSettings.tsx
│   │   │   │   ├── ClassSettings.tsx
│   │   │   │   ├── SubjectSettings.tsx
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── RolePermissions.tsx
│   │   │   │   ├── EmailSettings.tsx
│   │   │   │   ├── SMSSettings.tsx
│   │   │   │   └── AISettings.tsx
│   │   │   ├── /pages
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── UserManagementPage.tsx
│   │   │   │   └── SystemConfigPage.tsx
│   │   │   └── /hooks
│   │   │       └── useSettings.ts
│   │   │
│   │   └── /ai
│   │       ├── /components
│   │       │   ├── AIQuestionGenerator.tsx
│   │       │   ├── AIExamAnalyzer.tsx
│   │       │   ├── AIParentCommunicator.tsx
│   │       │   ├── AIRiskPredictor.tsx
│   │       │   └── AIInsightsDashboard.tsx
│   │       ├── /pages
│   │       │   └── AIToolsPage.tsx
│   │       └── /hooks
│   │           ├── useAI.ts
│   │           └── useAIAnalysis.ts
│   │
│   ├── /lib
│   │   ├── /api
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── students.ts
│   │   │   ├── finance.ts
│   │   │   ├── exams.ts
│   │   │   ├── guidance.ts
│   │   │   ├── communication.ts
│   │   │   ├── reports.ts
│   │   │   └── ai.ts
│   │   │
│   │   ├── /utils
│   │   │   ├── formatters.ts (Para, tarih formatları)
│   │   │   ├── validators.ts (TC, email, telefon)
│   │   │   ├── helpers.ts
│   │   │   ├── constants.ts
│   │   │   ├── permissions.ts
│   │   │   └── errorHandlers.ts
│   │   │
│   │   ├── /hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   ├── usePagination.ts
│   │   │   ├── useFilters.ts
│   │   │   └── useToast.ts
│   │   │
│   │   └── /schemas (Zod validation)
│   │       ├── student.schema.ts
│   │       ├── finance.schema.ts
│   │       ├── exam.schema.ts
│   │       └── auth.schema.ts
│   │
│   ├── /types
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── student.types.ts
│   │   ├── finance.types.ts
│   │   ├── exam.types.ts
│   │   ├── guidance.types.ts
│   │   ├── communication.types.ts
│   │   ├── report.types.ts
│   │   └── common.types.ts
│   │
│   ├── /store (Zustand)
│   │   ├── authStore.ts
│   │   ├── studentStore.ts
│   │   ├── financeStore.ts
│   │   ├── examStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── /data (Mock Data)
│   │   ├── students.data.ts
│   │   ├── finance.data.ts
│   │   ├── exams.data.ts
│   │   ├── guidance.data.ts
│   │   ├── users.data.ts
│   │   └── index.ts
│   │
│   ├── /routes
│   │   ├── index.tsx (Route definitions)
│   │   ├── ProtectedRoute.tsx
│   │   └── PublicRoute.tsx
│   │
│   ├── /styles
│   │   ├── globals.css
│   │   └── tailwind.css
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .cursorrules (BU DOSYA)
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── README.md
```

## 🎨 TASARIM SİSTEMİ DETAYLI

### Renk Paleti
```css
:root {
  /* Primary Colors */
  --primary-50: #faf5ff;
  --primary-100: #f3e8ff;
  --primary-200: #e9d5ff;
  --primary-300: #d8b4fe;
  --primary-400: #c084fc;
  --primary-500: #a855f7;
  --primary-600: #9333ea; /* Ana mor */
  --primary-700: #7e22ce;
  --primary-800: #6b21a8;
  --primary-900: #581c87;

  /* Secondary Colors */
  --secondary-50: #eff6ff;
  --secondary-100: #dbeafe;
  --secondary-200: #bfdbfe;
  --secondary-300: #93c5fd;
  --secondary-400: #60a5fa;
  --secondary-500: #3b82f6; /* Ana mavi */
  --secondary-600: #2563eb;
  --secondary-700: #1d4ed8;
  --secondary-800: #1e40af;
  --secondary-900: #1e3a8a;

  /* Success */
  --success: #10b981;
  --success-light: #d1fae5;
  --success-dark: #047857;

  /* Warning */
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --warning-dark: #d97706;

  /* Danger */
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --danger-dark: #dc2626;

  /* Neutral */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Spacing System
```css
/* Spacing (4px grid) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Tam yuvarlak */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Animations
```css
/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);

/* Keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 📝 KOD STANDARTLARI

### 1. Component Yapısı (Template)
```tsx
/**
 * ComponentName - Açıklama
 * @module modules/moduleName/components
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropsType } from '@/types';

/**
 * Props interface
 */
interface ComponentNameProps {
  data: PropsType;
  onAction: (id: string) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ComponentName Component
 * Detaylı açıklama buraya
 */
const ComponentName: React.FC<ComponentNameProps> = ({ 
  data, 
  onAction, 
  className,
  children 
}) => {
  // ============================================
  // STATE
  // ============================================
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // HOOKS
  // ============================================
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ============================================
  // COMPUTED VALUES (useMemo)
  // ============================================
  const computedValue = useMemo(() => {
    return data.items.filter(item => item.active);
  }, [data.items]);

  // ============================================
  // CALLBACKS (useCallback)
  // ============================================
  const handleClick = useCallback(() => {
    if (!isLoading) {
      onAction(id!);
    }
  }, [isLoading, onAction, id]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    // Initialization logic
    return () => {
      // Cleanup logic
    };
  }, []);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // API call
      await onAction(id!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderEmpty = () => (
    <div className="text-center py-12">
      <p className="text-gray-500">Veri bulunamadı</p>
    </div>
  );

  // ============================================
  // EARLY RETURNS
  // ============================================
  if (!data) {
    return renderEmpty();
  }

  if (error) {
    return (
      <div className="text-red-600">
        Hata: {error}
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Başlık</h2>
          <Button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Yükleniyor...' : 'Aksiyon'}
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {computedValue.map((item) => (
            <div key={item.id}>
              {/* Item content */}
            </div>
          ))}
        </div>

        {/* Footer */}
        {children}
      </div>
    </Card>
  );
};

// ============================================
// DISPLAY NAME (DevTools için)
// ============================================
ComponentName.displayName = 'ComponentName';

// ============================================
// EXPORT
// ============================================
export default ComponentName;
```

### 2. Custom Hook Template
```tsx
/**
 * useCustomHook - Hook açıklaması
 * @module lib/hooks
 */

import { useState# 🚀 AKADEMİHUB - KOMPLE SİSTEM KURULUM DOKÜMANI

## 📁 .cursorrules DOSYASI (TAM VERSİYON)

```.cursorrules
# ============================================
# AKADEMİHUB - K-12 EĞİTİM YÖNETİM SİSTEMİ
# AI Destekli, MEB Uyumlu, Enterprise Seviye
# ============================================

## 🎯 PROJE VİZYONU
Türkiye'deki K-12 eğitim kurumları için tasarlanmış, yapay zeka destekli,
MEB müfredatına uygun, tam entegre eğitim yönetim platformu.

## 📊 MODÜLLER
1. Dashboard & Analytics (AI Destekli)
2. Öğrenci Yönetimi (Kayıt, Profil, Takip)
3. Finans & Muhasebe (Ödeme, Taksit, Borç)
4. Sınav & Soru Bankası (MEB Uyumlu, AI Soru Üretimi)
5. LGS/YKS Deneme Modülü
6. Rehberlik & Danışmanlık
7. İletişim Sistemi (SMS, Email, Otomasyonlu)
8. Raporlama & Analitik
9. Kullanıcı Yönetimi & Yetkilendirme
10. Ayarlar & Konfigürasyon

## 🛠️ TEKNOLOJİ STACK

### Frontend
- React 18.3+ (Function Components + Hooks)
- TypeScript 5.0+ (Strict Mode)
- Vite 5.0+ (Build Tool)
- React Router v6 (Routing)
- Zustand (State Management)

### UI & Styling
- Tailwind CSS 3.4+
- shadcn/ui (Component Library)
- Lucide React (Icons)
- Recharts (Charts)
- React Hook Form (Form Management)
- Zod (Validation)

### Backend Mock (Şimdilik)
- Mirage JS (API Mock)
- Local Storage (Data Persistence)
- IndexedDB (Large Data)

### AI Integration
- OpenAI GPT-4 API (Soru üretimi, analiz)
- Anthropic Claude API (Uzun metin analizi)

## 📂 DOSYA YAPISI (TAM)

```
/akademihub
├── /public
│   ├── /images
│   │   ├── /avatars
│   │   ├── /placeholders
│   │   └── logo.svg
│   ├── /fonts
│   └── favicon.ico
│
├── /src
│   ├── /assets
│   │   ├── /icons
│   │   └── /illustrations
│   │
│   ├── /components
│   │   ├── /ui (shadcn/ui components)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── progress.tsx
│   │   │   └── calendar.tsx
│   │   │
│   │   ├── /layout
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Breadcrumb.tsx
│   │   │
│   │   ├── /forms
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormTextarea.tsx
│   │   │   ├── FormDatePicker.tsx
│   │   │   ├── FormFileUpload.tsx
│   │   │   └── FormWizard.tsx
│   │   │
│   │   ├── /charts
│   │   │   ├── BarChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── AreaChart.tsx
│   │   │
│   │   ├── /common
│   │   │   ├── KPICard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterPanel.tsx
│   │   │
│   │   └── /ai
│   │       ├── AIPanel.tsx
│   │       ├── AIInsightCard.tsx
│   │       ├── AILoadingState.tsx
│   │       └── TypingEffect.tsx
│   │
│   ├── /modules
│   │   ├── /auth
│   │   │   ├── /components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   └── ResetPasswordForm.tsx
│   │   │   ├── /pages
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   └── ResetPasswordPage.tsx
│   │   │   ├── /hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useLogin.ts
│   │   │   └── /utils
│   │   │       ├── authHelpers.ts
│   │   │       └── tokenManager.ts
│   │   │
│   │   ├── /dashboard
│   │   │   ├── /components
│   │   │   │   ├── KPISection.tsx
│   │   │   │   ├── FinanceChart.tsx
│   │   │   │   ├── StudentInsights.tsx
│   │   │   │   ├── LatestStudents.tsx
│   │   │   │   ├── RiskStudents.tsx
│   │   │   │   ├── TopStudents.tsx
│   │   │   │   ├── RecentActivities.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   └── AIInsightsPanel.tsx
│   │   │   ├── /pages
│   │   │   │   ├── MainDashboard.tsx
│   │   │   │   └── FinanceDashboard.tsx
│   │   │   └── /hooks
│   │   │       └── useDashboardData.ts
│   │   │
│   │   ├── /students
│   │   │   ├── /components
│   │   │   │   ├── StudentCard.tsx
│   │   │   │   ├── StudentTable.tsx
│   │   │   │   ├── StudentFilters.tsx
│   │   │   │   ├── RegistrationWizard.tsx
│   │   │   │   ├── PersonalInfoStep.tsx
│   │   │   │   ├── ParentInfoStep.tsx
│   │   │   │   ├── EducationInfoStep.tsx
│   │   │   │   ├── HealthInfoStep.tsx
│   │   │   │   ├── FinanceInfoStep.tsx
│   │   │   │   ├── DocumentsStep.tsx
│   │   │   │   ├── ProfileTabs.tsx
│   │   │   │   ├── GeneralInfoTab.tsx
│   │   │   │   ├── AcademicTab.tsx
│   │   │   │   ├── FinanceTab.tsx
│   │   │   │   ├── HealthTab.tsx
│   │   │   │   ├── CommunicationTab.tsx
│   │   │   │   ├── DocumentsTab.tsx
│   │   │   │   └── GuidanceTab.tsx
│   │   │   ├── /pages
│   │   │   │   ├── StudentListPage.tsx
│   │   │   │   ├── StudentRegistrationPage.tsx
│   │   │   │   ├── StudentProfilePage.tsx
│   │   │   │   └── StudentSearchPage.tsx
│   │   │   └── /hooks
│   │   │       ├── useStudents.ts
│   │   │       ├── useStudentForm.ts
│   │   │       └── useStudentProfile.ts
│   │   │
│   │   ├── /finance
│   │   │   ├── /components
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   ├── InstallmentTable.tsx
│   │   │   │   ├── DebtList.tsx
│   │   │   │   ├── PaymentHistory.tsx
│   │   │   │   ├── CashRegister.tsx
│   │   │   │   ├── ReceiptModal.tsx
│   │   │   │   └── FinanceCharts.tsx
│   │   │   ├── /pages
│   │   │   │   ├── PaymentPage.tsx
│   │   │   │   ├── InstallmentPlansPage.tsx
│   │   │   │   ├── DebtTrackingPage.tsx
│   │   │   │   └── FinanceReportsPage.tsx
│   │   │   └── /hooks
│   │   │       ├── usePayments.ts
│   │   │       └── useInstallments.ts
│   │   │
│   │   ├── /exams
│   │   │   ├── /components
│   │   │   │   ├── QuestionList.tsx
│   │   │   │   ├── QuestionForm.tsx
│   │   │   │   ├── QuestionFilters.tsx
│   │   │   │   ├── ExamBuilder.tsx
│   │   │   │   ├── ExamPreview.tsx
│   │   │   │   ├── GradeEntryTable.tsx
│   │   │   │   ├── ExamAnalysis.tsx
│   │   │   │   ├── LGSExamCreator.tsx
│   │   │   │   ├── YKSExamCreator.tsx
│   │   │   │   ├── OpticalFormReader.tsx
│   │   │   │   └── AIQuestionGenerator.tsx
│   │   │   ├── /pages
│   │   │   │   ├── QuestionBankPage.tsx
│   │   │   │   ├── ExamCreatorPage.tsx
│   │   │   │   ├── ExamListPage.tsx
│   │   │   │   ├── GradeEntryPage.tsx
│   │   │   │   ├── ExamResultsPage.tsx
│   │   │   │   └── LGS_YKS_Page.tsx
│   │   │   └── /hooks
│   │   │       ├── useQuestions.ts
│   │   │       ├── useExams.ts
│   │   │       └── useAIQuestionGen.ts
│   │   │
│   │   ├── /guidance
│   │   │   ├── /components
│   │   │   │   ├── GuidanceNotes.tsx
│   │   │   │   ├── PsychologicalTests.tsx
│   │   │   │   ├── CareerTests.tsx
│   │   │   │   ├── BehaviorTracking.tsx
│   │   │   │   ├── FamilyMeetingNotes.tsx
│   │   │   │   └── GuidanceReportBuilder.tsx
│   │   │   ├── /pages
│   │   │   │   ├── GuidanceProfilePage.tsx
│   │   │   │   ├── TestsPage.tsx
│   │   │   │   └── GuidanceReportsPage.tsx
│   │   │   └── /hooks
│   │   │       └── useGuidance.ts
│   │   │
│   │   ├── /communication
│   │   │   ├── /components
│   │   │   │   ├── SMSPanel.tsx
│   │   │   │   ├── EmailPanel.tsx
│   │   │   │   ├── TemplateManager.tsx
│   │   │   │   ├── BulkMessaging.tsx
│   │   │   │   ├── AutomationRules.tsx
│   │   │   │   ├── MessageHistory.tsx
│   │   │   │   └── AIMessageComposer.tsx
│   │   │   ├── /pages
│   │   │   │   ├── MessagingPage.tsx
│   │   │   │   ├── TemplatesPage.tsx
│   │   │   │   ├── AutomationPage.tsx
│   │   │   │   └── CommunicationHistoryPage.tsx
│   │   │   └── /hooks
│   │   │       ├── useSMS.ts
│   │   │       ├── useEmail.ts
│   │   │       └── useTemplates.ts
│   │   │
│   │   ├── /reports
│   │   │   ├── /components
│   │   │   │   ├── ReportBuilder.tsx
│   │   │   │   ├── ReportFilters.tsx
│   │   │   │   ├── ReportPreview.tsx
│   │   │   │   ├── ExportOptions.tsx
│   │   │   │   └── ScheduledReports.tsx
│   │   │   ├── /pages
│   │   │   │   ├── AcademicReportsPage.tsx
│   │   │   │   ├── FinanceReportsPage.tsx
│   │   │   │   ├── CustomReportsPage.tsx
│   │   │   │   └── ReportCenterPage.tsx
│   │   │   └── /hooks
│   │   │       └── useReports.ts
│   │   │
│   │   ├── /settings
│   │   │   ├── /components
│   │   │   │   ├── GeneralSettings.tsx
│   │   │   │   ├── SchoolSettings.tsx
│   │   │   │   ├── AcademicYearSettings.tsx
│   │   │   │   ├── ClassSettings.tsx
│   │   │   │   ├── SubjectSettings.tsx
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── RolePermissions.tsx
│   │   │   │   ├── EmailSettings.tsx
│   │   │   │   ├── SMSSettings.tsx
│   │   │   │   └── AISettings.tsx
│   │   │   ├── /pages
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── UserManagementPage.tsx
│   │   │   │   └── SystemConfigPage.tsx
│   │   │   └── /hooks
│   │   │       └── useSettings.ts
│   │   │
│   │   └── /ai
│   │       ├── /components
│   │       │   ├── AIQuestionGenerator.tsx
│   │       │   ├── AIExamAnalyzer.tsx
│   │       │   ├── AIParentCommunicator.tsx
│   │       │   ├── AIRiskPredictor.tsx
│   │       │   └── AIInsightsDashboard.tsx
│   │       ├── /pages
│   │       │   └── AIToolsPage.tsx
│   │       └── /hooks
│   │           ├── useAI.ts
│   │           └── useAIAnalysis.ts
│   │
│   ├── /lib
│   │   ├── /api
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── students.ts
│   │   │   ├── finance.ts
│   │   │   ├── exams.ts
│   │   │   ├── guidance.ts
│   │   │   ├── communication.ts
│   │   │   ├── reports.ts
│   │   │   └── ai.ts
│   │   │
│   │   ├── /utils
│   │   │   ├── formatters.ts (Para, tarih formatları)
│   │   │   ├── validators.ts (TC, email, telefon)
│   │   │   ├── helpers.ts
│   │   │   ├── constants.ts
│   │   │   ├── permissions.ts
│   │   │   └── errorHandlers.ts
│   │   │
│   │   ├── /hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   ├── usePagination.ts
│   │   │   ├── useFilters.ts
│   │   │   └── useToast.ts
│   │   │
│   │   └── /schemas (Zod validation)
│   │       ├── student.schema.ts
│   │       ├── finance.schema.ts
│   │       ├── exam.schema.ts
│   │       └── auth.schema.ts
│   │
│   ├── /types
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── student.types.ts
│   │   ├── finance.types.ts
│   │   ├── exam.types.ts
│   │   ├── guidance.types.ts
│   │   ├── communication.types.ts
│   │   ├── report.types.ts
│   │   └── common.types.ts
│   │
│   ├── /store (Zustand)
│   │   ├── authStore.ts
│   │   ├── studentStore.ts
│   │   ├── financeStore.ts
│   │   ├── examStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── /data (Mock Data)
│   │   ├── students.data.ts
│   │   ├── finance.data.ts
│   │   ├── exams.data.ts
│   │   ├── guidance.data.ts
│   │   ├── users.data.ts
│   │   └── index.ts
│   │
│   ├── /routes
│   │   ├── index.tsx (Route definitions)
│   │   ├── ProtectedRoute.tsx
│   │   └── PublicRoute.tsx
│   │
│   ├── /styles
│   │   ├── globals.css
│   │   └── tailwind.css
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .cursorrules (BU DOSYA)
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── README.md
```

## 🎨 TASARIM SİSTEMİ DETAYLI

### Renk Paleti
```css
:root {
  /* Primary Colors */
  --primary-50: #faf5ff;
  --primary-100: #f3e8ff;
  --primary-200: #e9d5ff;
  --primary-300: #d8b4fe;
  --primary-400: #c084fc;
  --primary-500: #a855f7;
  --primary-600: #9333ea; /* Ana mor */
  --primary-700: #7e22ce;
  --primary-800: #6b21a8;
  --primary-900: #581c87;

  /* Secondary Colors */
  --secondary-50: #eff6ff;
  --secondary-100: #dbeafe;
  --secondary-200: #bfdbfe;
  --secondary-300: #93c5fd;
  --secondary-400: #60a5fa;
  --secondary-500: #3b82f6; /* Ana mavi */
  --secondary-600: #2563eb;
  --secondary-700: #1d4ed8;
  --secondary-800: #1e40af;
  --secondary-900: #1e3a8a;

  /* Success */
  --success: #10b981;
  --success-light: #d1fae5;
  --success-dark: #047857;

  /* Warning */
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --warning-dark: #d97706;

  /* Danger */
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --danger-dark: #dc2626;

  /* Neutral */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Spacing System
```css
/* Spacing (4px grid) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Tam yuvarlak */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Animations
```css
/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);

/* Keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 📝 KOD STANDARTLARI

### 1. Component Yapısı (Template)
```tsx
/**
 * ComponentName - Açıklama
 * @module modules/moduleName/components
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropsType } from '@/types';

/**
 * Props interface
 */
interface ComponentNameProps {
  data: PropsType;
  onAction: (id: string) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ComponentName Component
 * Detaylı açıklama buraya
 */
const ComponentName: React.FC<ComponentNameProps> = ({ 
  data, 
  onAction, 
  className,
  children 
}) => {
  // ============================================
  // STATE
  // ============================================
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // HOOKS
  // ============================================
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ============================================
  // COMPUTED VALUES (useMemo)
  // ============================================
  const computedValue = useMemo(() => {
    return data.items.filter(item => item.active);
  }, [data.items]);

  // ============================================
  // CALLBACKS (useCallback)
  // ============================================
  const handleClick = useCallback(() => {
    if (!isLoading) {
      onAction(id!);
    }
  }, [isLoading, onAction, id]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    // Initialization logic
    return () => {
      // Cleanup logic
    };
  }, []);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // API call
      await onAction(id!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderEmpty = () => (
    <div className="text-center py-12">
      <p className="text-gray-500">Veri bulunamadı</p>
    </div>
  );

  // ============================================
  // EARLY RETURNS
  // ============================================
  if (!data) {
    return renderEmpty();
  }

  if (error) {
    return (
      <div className="text-red-600">
        Hata: {error}
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Başlık</h2>
          <Button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Yükleniyor...' : 'Aksiyon'}
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {computedValue.map((item) => (
            <div key={item.id}>
              {/* Item content */}
            </div>
          ))}
        </div>

        {/* Footer */}
        {children}
      </div>
    </Card>
  );
};

// ============================================
// DISPLAY NAME (DevTools için)
// ============================================
ComponentName.displayName = 'ComponentName';

// ============================================
// EXPORT
// ============================================
export default ComponentName;
```

### 2. Custom Hook Template
```tsx
/**
 * useCustomHook - Hook açıklaması
 * @module lib/hooks
 */

import { useState
, useEffect, useCallback } from 'react';
import type { DataType, OptionsType } from '@/types';
/**

Hook options interface
*/
interface UseCustomHookOptions {
initialValue?: DataType;
autoFetch?: boolean;
onSuccess?: (data: DataType) => void;
onError?: (error: Error) => void;
}

/**

Hook return type
*/
interface UseCustomHookReturn {
data: DataType | null;
isLoading: boolean;
error: Error | null;
refetch: () => Promise<void>;
reset: () => void;
}

/**

useCustomHook
Detaylı kullanım açıklaması

@example



const { data, isLoading, error, refetch } = useCustomHook({
autoFetch: true,
onSuccess: (data) => console.log(data)
});




*/
export const useCustomHook = (
options: UseCustomHookOptions = {}
): UseCustomHookReturn => {
// ============================================
// DESTRUCTURE OPTIONS
// ============================================
const {
initialValue = null,
autoFetch = true,
onSuccess,
onError
} = options;
// ============================================
// STATE
// ============================================
const [data, setData] = useState<DataType | null>(initialValue);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<Error | null>(null);
// ============================================
// FETCH FUNCTION
// ============================================
const fetchData = useCallback(async () => {
setIsLoading(true);
setError(null);
try {
  // API call simulation
  const response = await fetch('/api/endpoint');
  const result = await response.json();
  
  setData(result);
  onSuccess?.(result);
} catch (err) {
  const error = err instanceof Error ? err : new Error('Bilinmeyen hata');
  setError(error);
  onError?.(error);
} finally {
  setIsLoading(false);
}
}, [onSuccess, onError]);
// ============================================
// RESET FUNCTION
// ============================================
const reset = useCallback(() => {
setData(initialValue);
setError(null);
setIsLoading(false);
}, [initialValue]);
// ============================================
// EFFECTS
// ============================================
useEffect(() => {
if (autoFetch) {
fetchData();
}
}, [autoFetch, fetchData]);
// ============================================
// RETURN
// ============================================
return {
data,
isLoading,
error,
refetch: fetchData,
reset
};
};

### 3. API Client Template
```tsx
/**
 * API Client for Students Module
 * @module lib/api/students
 */

import { apiClient } from './client';
import type { 
  Student, 
  StudentCreateDto, 
  StudentUpdateDto,
  PaginatedResponse,
  FilterOptions 
} from '@/types';

/**
 * Students API
 */
export const studentsApi = {
  /**
   * Get all students with pagination and filters
   */
  getAll: async (
    page: number = 1,
    limit: number = 10,
    filters?: FilterOptions
  ): Promise<PaginatedResponse<Student>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await apiClient.get(`/students?${params}`);
    return response.data;
  },

  /**
   * Get single student by ID
   */
  getById: async (id: string): Promise<Student> => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  /**
   * Create new student
   */
  create: async (data: StudentCreateDto): Promise<Student> => {
    const response = await apiClient.post('/students', data);
    return response.data;
  },

  /**
   * Update existing student
   */
  update: async (id: string, data: StudentUpdateDto): Promise<Student> => {
    const response = await apiClient.put(`/students/${id}`, data);
    return response.data;
  },

  /**
   * Delete student
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },

  /**
   * Search students
   */
  search: async (query: string): Promise<Student[]> => {
    const response = await apiClient.get(`/students/search?q=${query}`);
    return response.data;
  },

  /**
   * Get student statistics
   */
  getStats: async (id: string): Promise<StudentStats> => {
    const response = await apiClient.get(`/students/${id}/stats`);
    return response.data;
  }
};
```

### 4. Zustand Store Template
```tsx
/**
 * Auth Store
 * @module store/authStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginCredentials } from '@/types';

/**
 * Auth State Interface
 */
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * Auth Store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ============================================
      // INITIAL STATE
      // ============================================
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ============================================
      // ACTIONS
      // ============================================
      
      /**
       * Login action
       */
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          // API call
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });

          if (!response.ok) {
            throw new Error('Giriş başarısız');
          }

          const { user, token } = await response.json();

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            isLoading: false
          });
        }
      },

      /**
       * Logout action
       */
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      /**
       * Register action
       */
      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error('Kayıt başarısız');
          }

          const { user, token } = await response.json();

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            isLoading: false
          });
        }
      },

      /**
       * Update profile
       */
      updateProfile: async (data) => {
        const { user, token } = get();
        if (!user || !token) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error('Profil güncellenemedi');
          }

          const updatedUser = await response.json();

          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            isLoading: false
          });
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Check authentication status
       */
      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Token geçersiz');
          }

          const user = await response.json();

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

## 🔐 AUTH SYSTEM (KOMPLE)

### Login Page
```tsx
/**
 * Login Page
 * @module modules/auth/pages/LoginPage
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Login Schema
 */
const loginSchema = z.object({
  email: z.string().email('Geçerli bir email giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır')
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page Component
 */
const LoginPage: React.FC = () => {
  // ============================================
  // STATE
  // ============================================
  const [showPassword, setShowPassword] = useState(false);

  // ============================================
  // HOOKS
  // ============================================
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // ============================================
  // HANDLERS
  // ============================================
  const onSubmit = async (data: LoginFormData) => {
    clearError();
    await login(data);
    
    // Başarılı girişte dashboard'a yönlendir
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/dashboard');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AH</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AkademiHub</h1>
          <p className="text-gray-500">Eğitim Yönetim Sistemi</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="ornek@akademihub.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-600">Beni Hatırla</span>
            </label>
            <Link 
              to="/auth/forgot-password" 
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Şifremi Unuttum?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Giriş Yapılıyor...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Giriş Yap
              </>
            )}
          </Button>
        </form>

        {/* Demo Accounts */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm text-gray-500 text-center">Demo Hesaplar</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit({ email: 'admin@demo.com', password: 'admin123' } as LoginFormData)()}
            >
              👨‍💼 Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit({ email: 'ogretmen@demo.com', password: 'ogretmen123' } as LoginFormData)()}
            >
              👩‍🏫 Öğretmen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit({ email: 'veli@demo.com', password: 'veli123' } as LoginFormData)()}
            >
              👨‍👩‍👧 Veli
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit({ email: 'muhasebe@demo.com', password: 'muhasebe123' } as LoginFormData)()}
            >
              💰 Muhasebe
            </Button>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600">
          Hesabınız yok mu?{' '}
          <Link to="/auth/register" className="text-purple-600 hover:text-purple-700 font-semibold">
            Kayıt Olun
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
```

## 🗺️ ROUTING SYSTEM

### Route Definitions
```tsx
/**
 * Route Definitions
 * @module routes/index
 */

import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ============================================
// LAZY LOAD PAGES
// ============================================

// Auth
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/modules/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/modules/auth/pages/ForgotPasswordPage'));

// Layout
const MainLayout = lazy(() => import('@/components/layout/MainLayout'));

// Dashboard
const MainDashboard = lazy(() => import('@/modules/dashboard/pages/MainDashboard'));
const FinanceDashboard = lazy(() => import('@/modules/dashboard/pages/FinanceDashboard'));

// Students
const StudentListPage = lazy(() => import('@/modules/students/pages/StudentListPage'));
const StudentRegistrationPage = lazy(() => import('@/modules/students/pages/StudentRegistrationPage'));
const StudentProfilePage = lazy(() => import('@/modules/students/pages/StudentProfilePage'));

// Finance
const PaymentPage = lazy(() => import('@/modules/finance/pages/PaymentPage'));
const InstallmentPlansPage = lazy(() => import('@/modules/finance/pages/InstallmentPlansPage'));
const DebtTrackingPage = lazy(() => import('@/modules/finance/pages/DebtTrackingPage'));
const FinanceReportsPage = lazy(() => import('@/modules/finance/pages/FinanceReportsPage'));

// Exams
const QuestionBankPage = lazy(() => import('@/modules/exams/pages/QuestionBankPage'));
const ExamCreatorPage = lazy(() => import('@/modules/exams/pages/ExamCreatorPage'));
const ExamListPage = lazy(() => import('@/modules/exams/pages/ExamListPage'));
const GradeEntryPage = lazy(() => import('@/modules/exams/pages/GradeEntryPage'));
const LGS_YKS_Page = lazy(() => import('@/modules/exams/pages/LGS_YKS_Page'));

// Guidance
const GuidanceProfilePage = lazy(() => import('@/modules/guidance/pages/GuidanceProfilePage'));
const TestsPage = lazy(() => import('@/modules/guidance/pages/TestsPage'));
const GuidanceReportsPage = lazy(() => import('@/modules/guidance/pages/GuidanceReportsPage'));

// Communication
const MessagingPage = lazy(() => import('@/modules/communication/pages/MessagingPage'));
const TemplatesPage = lazy(() => import('@/modules/communication/pages/TemplatesPage'));
const AutomationPage = lazy(() => import('@/modules/communication/pages/AutomationPage'));

// Reports
const ReportCenterPage = lazy(() => import('@/modules/reports/pages/ReportCenterPage'));
const AcademicReportsPage = lazy(() => import('@/modules/reports/pages/AcademicReportsPage'));

// Settings
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const UserManagementPage = lazy(() => import('@/modules/settings/pages/UserManagementPage'));

// AI Tools
const AIToolsPage = lazy(() => import('@/modules/ai/pages/AIToolsPage'));

// ============================================
// SUSPENSE WRAPPER
// ============================================
const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>
    {children}
  </Suspense>
);

// ============================================
// ROUTER CONFIGURATION
// ============================================
export const router = createBrowserRouter([
  // ============================================
  // PUBLIC ROUTES
  // ============================================
  {
    path: '/auth',
    element: <PublicRoute />,
    children: [
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        )
      },
      {
        path: 'register',
        element: (
          <SuspenseWrapper>
            <RegisterPage />
          </SuspenseWrapper>
        )
      },
      {
        path: 'forgot-password',
        element: (
          <SuspenseWrapper>
            <ForgotPasswordPage />
          </SuspenseWrapper>
        )
      }
    ]
  },

  // ============================================
  // PROTECTED ROUTES
  // ============================================
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <SuspenseWrapper>
            <MainLayout />
          </SuspenseWrapper>
        ),
        children: [
          // Redirect root to dashboard
          {
            index: true,
            element: <Navigate to="/dashboard" replace />
          },

          // ============================================
          // DASHBOARD
          // ============================================
          {
            path: 'dashboard',
            element: (
              <SuspenseWrapper>
                <MainDashboard />
              </SuspenseWrapper>
            )
          },
          {
            path: 'dashboard/finance',
            element: (
              <SuspenseWrapper>
                <FinanceDashboard />
              </SuspenseWrapper>
            )
          },

          // ============================================
          // STUDENTS
          // ============================================
          {
            path: 'students',
            children: [
              {
                index: true,
                element: (
                  <SuspenseWrapper>
                    <StudentListPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'register',
                element: (
                  <SuspenseWrapper>
                    <StudentRegistrationPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: ':id',
                element: (
                  <SuspenseWrapper>
                    <StudentProfilePage />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // FINANCE
          // ============================================
          {
            path: 'finance',
            children: [
              {
                path: 'payments',
                element: (
                  <SuspenseWrapper>
                    <PaymentPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'installments',
                element: (
                  <SuspenseWrapper>
                    <InstallmentPlansPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'debts',
                element: (
                  <SuspenseWrapper>
                    <DebtTrackingPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'reports',
                element: (
                  <SuspenseWrapper>
                    <FinanceReportsPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // EXAMS
          // ============================================
          {
            path: 'exams',
            children: [
              {
                path: 'question-bank',
                element: (
                  <SuspenseWrapper>
                    <QuestionBankPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'create',
                element: (
                  <SuspenseWrapper>
                    <ExamCreatorPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'list',
                element: (
                  <SuspenseWrapper>
                    <ExamListPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'grades',
                element: (
                  <SuspenseWrapper>
                    <GradeEntryPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'lgs-yks',
                element: (
                  <SuspenseWrapper>
                    <LGS_YKS_Page />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // GUIDANCE
          // ============================================
          {
            path: 'guidance',
            children: [
              {
                path: ':studentId',
                element: (
                  <SuspenseWrapper>
                    <GuidanceProfilePage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'tests',
                element: (
                  <SuspenseWrapper>
                    <TestsPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'reports',
                element: (
                  <SuspenseWrapper>
                    <GuidanceReportsPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // COMMUNICATION
          // ============================================
          {
            path: 'communication',
            children: [
              {
                index: true,
                element: (
                  <SuspenseWrapper>
                    <MessagingPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'templates',
                element: (
                  <SuspenseWrapper>
                    <TemplatesPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'automation',
                element: (
                  <SuspenseWrapper>
                    <AutomationPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // REPORTS
          // ============================================
          {
            path: 'reports',
            children: [
              {
                index: true,
                element: (
                  <SuspenseWrapper>
                    <ReportCenterPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'academic',
                element: (
                  <SuspenseWrapper>
                    <AcademicReportsPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // SETTINGS
          // ============================================
          {
            path: 'settings',
            children: [
              {
                index: true,
                element: (
                  <SuspenseWrapper>
                    <SettingsPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: 'users',
                element: (
                  <SuspenseWrapper>
                    <UserManagementPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },

          // ============================================
          // AI TOOLS
          // ============================================
          {
            path: 'ai-tools',
            element: (
              <SuspenseWrapper>
                <AIToolsPage />
              </SuspenseWrapper>
            )
          }
        ]
      }
    ]
  },

  // ============================================
  // 404 NOT FOUND
  // ============================================
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]);
```

### Protected Route Component
```tsx
/**
 * Protected Route Component
 * @module routes/ProtectedRoute
 */

import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};
```

## 📦 PACKAGE.JSON (TAM)
```json
{
  "name": "akademihub",
  "version": "1.0.0",
  "description": "AI Destekli K-12 Eğitim Yönetim Sistemi",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "format": "prettier --RetryThis response paused because Claude reached its max length for a message. Hit continue to nudge Claude along.ContinueClaude can make mistakes. Please double-check responses.Ceo-Talent  Sonnet 4.5
    write "src/**/*.{ts,tsx,js,jsx,json,css}"",
"type-check": "tsc --noEmit",
"test": "vitest",
"test:ui": "vitest --ui",
"prepare": "husky install"
},
"dependencies": {
"react": "^18.3.1",
"react-dom": "^18.3.1",
"react-router-dom": "^6.22.0",
"@radix-ui/react-alert-dialog": "^1.0.5",
"@radix-ui/react-avatar": "^1.0.4",
"@radix-ui/react-checkbox": "^1.0.4",
"@radix-ui/react-dialog": "^1.0.5",
"@radix-ui/react-dropdown-menu": "^2.0.6",
"@radix-ui/react-label": "^2.0.2",
"@radix-ui/react-popover": "^1.0.7",
"@radix-ui/react-progress": "^1.0.3",
"@radix-ui/react-radio-group": "^1.1.3",
"@radix-ui/react-select": "^2.0.0",
"@radix-ui/react-separator": "^1.0.3",
"@radix-ui/react-slider": "^1.1.2",
"@radix-ui/react-slot": "^1.0.2",
"@radix-ui/react-switch": "^1.0.3",
"@radix-ui/react-tabs": "^1.0.4",
"@radix-ui/react-toast": "^1.1.5",
"@radix-ui/react-tooltip": "^1.0.7",

"lucide-react": "^0.344.0",
"recharts": "^2.12.0",
"date-fns": "^3.3.1",
"react-day-picker": "^8.10.0",

"zustand": "^4.5.0",
"react-hook-form": "^7.50.0",
"@hookform/resolvers": "^3.3.4",
"zod": "^3.22.4",

"clsx": "^2.1.0",
"tailwind-merge": "^2.2.1",
"class-variance-authority": "^0.7.0",

"axios": "^1.6.7",
"miragejs": "^0.1.48",

"jspdf": "^2.5.1",
"jspdf-autotable": "^3.8.2",
"xlsx": "^0.18.5",

"@tanstack/react-table": "^8.12.0",
"@tanstack/react-query": "^5.20.0",

"react-dropzone": "^14.2.3",
"react-pdf": "^7.7.0",

"sonner": "^1.4.0"
},
"devDependencies": {
"@types/react": "^18.2.55",
"@types/react-dom": "^18.2.19",
"@types/node": "^20.11.16",
"@typescript-eslint/eslint-plugin": "^6.21.0",
"@typescript-eslint/parser": "^6.21.0",
"eslint": "^8.56.0",
"eslint-plugin-react-hooks": "^4.6.0",
"eslint-plugin-react-refresh": "^0.4.5",

"prettier": "^3.2.5",
"prettier-plugin-tailwindcss": "^0.5.11",

"@vitejs/plugin-react": "^4.2.1",
"vite": "^5.1.0",
"typescript": "^5.3.3",

"tailwindcss": "^3.4.1",
"autoprefixer": "^10.4.17",
"postcss": "^8.4.35",

"vitest": "^1.2.2",
"@vitest/ui": "^1.2.2",
"@testing-library/react": "^14.2.1",
"@testing-library/jest-dom": "^6.4.2",

"husky": "^9.0.10",
"lint-staged": "^15.2.2"
},
"lint-staged": {
"*.{ts,tsx}": [
"eslint --fix",
"prettier --write"
]
}
}

## 🎯 ADIM ADIM UYGULAMA REHBERİ

### ADIM 1: PROJE KURULUMU
```bash
# 1. Proje klasörünü oluştur
mkdir akademihub
cd akademihub

# 2. Vite ile React + TypeScript projesi başlat
npm create vite@latest . -- --template react-ts

# 3. Dependencies yükle
npm install

# 4. Ek paketleri yükle
npm install react-router-dom zustand react-hook-form @hookform/resolvers zod
npm install lucide-react recharts date-fns clsx tailwind-merge class-variance-authority
npm install axios miragejs

# 5. Dev dependencies yükle
npm install -D tailwindcss autoprefixer postcss
npm install -D @types/node
npm install -D prettier prettier-plugin-tailwindcss
npm install -D eslint-plugin-react-hooks

# 6. Tailwind initialize
npx tailwindcss init -p

# 7. shadcn/ui init
npx shadcn-ui@latest init
```

### ADIM 2: TAILWIND CONFIG
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### ADIM 3: GLOBALS.CSS
```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 271 91% 65%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217 91% 60%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 271 91% 65%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 271 91% 65%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217 91% 60%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 271 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #9333ea;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #7e22ce;
}

/* Loading Spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

### ADIM 4: TSCONFIG.JSON
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/store/*": ["./src/store/*"],
      "@/data/*": ["./src/data/*"],
      "@/hooks/*": ["./src/lib/hooks/*"],
      "@/utils/*": ["./src/lib/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### ADIM 5: VITE.CONFIG.TS
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/hooks': path.resolve(__dirname, './src/lib/hooks'),
      '@/utils': path.resolve(__dirname, './src/lib/utils'),
    },
  },
  server: {
    port: 3031,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### ADIM 6: TYPES DEFINITIONS
```typescript
// src/types/common.types.ts

/**
 * Common Types
 */

export type Status = 'Aktif' | 'Pasif' | 'Mezun' | 'Ayrıldı';
export type Gender = 'Erkek' | 'Kız';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | '0+' | '0-';
export type Role = 'Admin' | 'Öğretmen' | 'Veli' | 'Öğrenci' | 'Muhasebe' | 'Rehberlik';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
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
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```
```typescript
// src/types/student.types.ts

import type { BaseEntity, Status, Gender, BloodType } from './common.types';

export interface VeliInfo {
  ad: string;
  tel: string;
  email: string;
  meslek: string;
}

export interface Veli {
  anne: VeliInfo;
  baba: VeliInfo;
  adres: string;
  acilTelefon: string;
}

export interface SaglikBilgisi {
  durum: string;
  kronikHastalik: string[];
  alerji: string[];
  kullanilanIlac: string[];
  acilDurum?: string;
}

export interface Student extends BaseEntity {
  ogrenciNo: string;
  tcKimlik: string;
  ad: string;
  soyad: string;
  dogumTarihi: Date;
  dogumYeri: string;
  cinsiyet: Gender;
  kanGrubu: BloodType;
  sinif: string;
  sube: string;
  durum: Status;
  kayitTarihi: Date;
  fotoUrl?: string;
  veli: Veli;
  saglik: SaglikBilgisi;
}

export interface StudentCreateDto {
  tcKimlik: string;
  ad: string;
  soyad: string;
  dogumTarihi: Date;
  dogumYeri: string;
  cinsiyet: Gender;
  kanGrubu: BloodType;
  sinif: string;
  sube: string;
  veli: Veli;
  saglik: SaglikBilgisi;
}

export type StudentUpdateDto = Partial<StudentCreateDto>;

export interface StudentStats {
  genelOrtalama: number;
  devamsizlik: {
    ozurlu: number;
    ozursuz: number;
    toplam: number;
  };
  dersler: Array<{
    ad: string;
    not: number;
    trend: 'up' | 'down' | 'same';
  }>;
}
```
```typescript
// src/types/auth.types.ts

import type { BaseEntity, Role } from './common.types';

export interface User extends BaseEntity {
  email: string;
  ad: string;
  soyad: string;
  role: Role;
  telefon?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  ad: string;
  soyad: string;
  telefon?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
```

### ADIM 7: SHADCN/UI COMPONENTS KURULUMU
```bash
# Gerekli tüm componentleri kur
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add slider
```

### ADIM 8: MOCK DATA OLUŞTUR
```typescript
// src/data/students.data.ts

import type { Student } from '@/types';

export const mockStudents: Student[] = [
  {
    id: '1',
    ogrenciNo: '2025001',
    tcKimlik: '12345678901',
    ad: 'Ece',
    soyad: 'Kızıroğlu',
    dogumTarihi: new Date('2015-03-15'),
    dogumYeri: 'İstanbul / Kadıköy',
    cinsiyet: 'Kız',
    kanGrubu: 'A+',
    sinif: '3',
    sube: 'A',
    durum: 'Aktif',
    kayitTarihi: new Date('2024-08-15'),
    fotoUrl: 'https://i.pravatar.cc/150?img=1',
    veli: {
      anne: {
        ad: 'Zeynep Kızıroğlu',
        tel: '+90 532 123 4567',
        email: 'zeynep@example.com',
        meslek: 'Öğretmen'
      },
      baba: {
        ad: 'Ahmet Kızıroğlu',
        tel: '+90 533 987 6543',
        email: 'ahmet@example.com',
        meslek: 'Mühendis'
      },
      adres: 'Bağdat Cad. No:123 Göztepe/Kadıköy/İstanbul',
      acilTelefon: '+90 532 123 4567'
    },
    saglik: {
      durum: 'Sağlıklı',
      kronikHastalik: [],
      alerji: ['Polen'],
      kullanilanIlac: []
    },
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-15')
  },
  // ... Daha fazla öğrenci ekle (en az 50 kayıt)
];
```

## 🚀 UYGULAMA ADIMLARRetryClaude can make mistakes. Please double-check responses.Ceo-Talent  Sonnet 4.5
// src/store/authStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

// Mock users database
const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: 'admin123',
    ad: 'Admin',
    soyad: 'Yönetici',
    role: 'Admin',
    telefon: '+90 532 111 1111',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    email: 'ogretmen@demo.com',
    password: 'ogretmen123',
    ad: 'Ayşe',
    soyad: 'Öğretmen',
    role: 'Öğretmen',
    telefon: '+90 532 222 2222',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    email: 'veli@demo.com',
    password: 'veli123',
    ad: 'Mehmet',
    soyad: 'Veli',
    role: 'Veli',
    telefon: '+90 532 333 3333',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    email: 'muhasebe@demo.com',
    password: 'muhasebe123',
    ad: 'Fatma',
    soyad: 'Muhasebeci',
    role: 'Muhasebe',
    telefon: '+90 532 444 4444',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const user = MOCK_USERS.find(
            u => u.email === credentials.email && u.password === credentials.password
          );

          if (!user) {
            throw new Error('Email veya şifre hatalı');
          }

          const { password, ...userWithoutPassword } = user;
          const mockToken = `mock-token-${user.id}-${Date.now()}`;

          set({
            user: userWithoutPassword,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Giriş başarısız',
            isLoading: false
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const existingUser = MOCK_USERS.find(u => u.email === data.email);
          if (existingUser) {
            throw new Error('Bu email zaten kayıtlı');
          }

          const newUser: User = {
            id: `user-${Date.now()}`,
            email: data.email,
            ad: data.ad,
            soyad: data.soyad,
            role: 'Veli',
            telefon: data.telefon,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const mockToken = `mock-token-${newUser.id}-${Date.now()}`;

          set({
            user: newUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Kayıt başarısız',
            isLoading: false
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock token validation
        const isValid = token.startsWith('mock-token-');

        if (isValid && get().user) {
          set({
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);// src/components/layout/MainLayout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;// src/components/layout/Sidebar.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  GraduationCap,
  Heart,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: string | number;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Öğrenciler', icon: Users, path: '/students' },
  { title: 'Finans', icon: CreditCard, path: '/finance/payments', badge: 3 },
  { title: 'Sınavlar', icon: FileText, path: '/exams/question-bank' },
  { title: 'LGS/YKS', icon: GraduationCap, path: '/exams/lgs-yks' },
  { title: 'Rehberlik', icon: Heart, path: '/guidance' },
  { title: 'İletişim', icon: MessageSquare, path: '/communication' },
  { title: 'Raporlar', icon: BarChart3, path: '/reports' },
  { title: 'AI Araçlar', icon: Sparkles, path: '/ai-tools' },
  { title: 'Ayarlar', icon: Settings, path: '/settings' }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-gradient-to-b from-purple-900 to-blue-900 text-white transition-all duration-300',
          isOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <span className="text-xl font-bold">AH</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">AkademiHub</h1>
                <p className="text-xs text-white/60">Eğitim Yönetimi</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur mx-auto">
              <span className="text-xl font-bold">AH</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive && 'scale-110')} />
                {isOpen && (
                  <>
                    <span className="font-medium flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="m-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 to-blue-900 text-white transform transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Same content as desktop sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-xl font-bold">AH</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">AkademiHub</h1>
              <p className="text-xs text-white/60">Eğitim Yönetimi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onToggle}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium flex-1">{item.title}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
// src/components/layout/Sidebar.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  GraduationCap,
  Heart,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: string | number;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Öğrenciler', icon: Users, path: '/students' },
  { title: 'Finans', icon: CreditCard, path: '/finance/payments', badge: 3 },
  { title: 'Sınavlar', icon: FileText, path: '/exams/question-bank' },
  { title: 'LGS/YKS', icon: GraduationCap, path: '/exams/lgs-yks' },
  { title: 'Rehberlik', icon: Heart, path: '/guidance' },
  { title: 'İletişim', icon: MessageSquare, path: '/communication' },
  { title: 'Raporlar', icon: BarChart3, path: '/reports' },
  { title: 'AI Araçlar', icon: Sparkles, path: '/ai-tools' },
  { title: 'Ayarlar', icon: Settings, path: '/settings' }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-gradient-to-b from-purple-900 to-blue-900 text-white transition-all duration-300',
          isOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <span className="text-xl font-bold">AH</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">AkademiHub</h1>
                <p className="text-xs text-white/60">Eğitim Yönetimi</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur mx-auto">
              <span className="text-xl font-bold">AH</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive && 'scale-110')} />
                {isOpen && (
                  <>
                    <span className="font-medium flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="m-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 to-blue-900 text-white transform transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Same content as desktop sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-xl font-bold">AH</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">AkademiHub</h1>
              <p className="text-xs text-white/60">Eğitim Yönetimi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onToggle}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium flex-1">{item.title}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
// src/components/layout/Header.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Menu, Search, Settings, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getInitials = (ad: string, soyad: string) => {
    return `${ad.charAt(0)}${soyad.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Öğrenci, veli, sınav ara..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 space-y-3">
                <div className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yeni ödeme alındı</p>
                    <p className="text-xs text-gray-500">Ece Kızıroğlu - ₺15.450</p>
                    <p className="text-xs text-gray-400 mt-1">5 dakika önce</p>
                  </div>
                </div>
                <div className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yaklaşan vade</p>
                    <p className="text-xs text-gray-500">3 öğrencinin ödemesi yarın</p>
                    <p className="text-xs text-gray-400 mt-1">2 saat önce</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="ghost" className="w-full text-sm">
                  Tümünü Gör
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatarUrl} alt={user?.ad} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    {user && getInitials(user.ad, user.soyad)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.ad} {user?.soyad}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.ad} {user?.soyad}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="w-4 h-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
// src/components/common/LoadingSpinner.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  fullScreen = false,
  text,
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-purple-600')} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
// src/components/common/KPICard.tsx

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'same';
    label: string;
  };
  color: 'blue' | 'green' | 'orange' | 'purple';
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600'
};

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color,
  onClick 
}) => {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                    trend?.direction === 'down' ? TrendingDown : Minus;

  const trendColor = trend?.direction === 'up' ? 'text-green-300' :
                     trend?.direction === 'down' ? 'text-red-300' : 'text-gray-300';

  return (
    <Card
      className={cn(
        'p-6 bg-gradient-to-br text-white shadow-lg hover:shadow-2xl transition-all cursor-pointer',
        colorClasses[color],
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-10 h-10 opacity-80" />
        {trend && <TrendIcon className={cn('w-6 h-6', trendColor)} />}
      </div>

      <p className="text-sm opacity-90 mb-2">{title}</p>
      <p className="text-4xl font-bold mb-2">{value}</p>

      {trend && (
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white/20 px-2 py-1 rounded-full font-semibold">
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.value}%
          </span>
          <span className="opacity-75">{trend.label}</span>
        </div>
      )}
    </Card>
  );
};

export default KPICard;
// src/App.tsx

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      <SonnerToaster position="top-right" />
    </>
  );
}

export default App;
// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// src/modules/dashboard/pages/MainDashboard.tsx

import React, { useState } from 'react';
import KPICard from '@/components/common/KPICard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  CreditCard,
  AlertCircle,
  Calendar,
  TrendingUp,
  UserPlus,
  AlertTriangle,
  Trophy,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  X,
  DollarSign,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const MainDashboard: React.FC = () => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  // Mock Data
  const kpiData = {
    totalRevenue: {
      value: 1292500,
      trend: { value: 12.5, direction: 'up' as const, label: 'Geçen aya göre' }
    },
    paymentRate: {
      value: 76.4,
      trend: { value: 3.2, direction: 'down' as const, label: 'Geçen aya göre' }
    },
    latePayments: {
      value: 3,
      trend: { value: 2, direction: 'same' as const, label: 'Değişmedi' }
    },
    activeStudents: {
      value: 128,
      trend: { value: 5.8, direction: 'up' as const, label: 'Geçen aya göre' }
    }
  };

  const financeData = [
    { month: 'Ağu', gelir: 120000, gider: 85000 },
    { month: 'Eyl', gelir: 185000, gider: 92000 },
    { month: 'Eki', gelir: 165000, gider: 88000 },
    { month: 'Kas', gelir: 215000, gider: 95000 },
    { month: 'Ara', gelir: 245000, gider: 105000 },
    { month: 'Oca', gelir: 280000, gider: 110000 }
  ];

  const latestStudents = [
    { id: 1, name: 'Ece Kızıroğlu', class: '3-A', date: '15 Eki 2025', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 2, name: 'Zeynep Tunç', class: '2-B', date: '14 Eki 2025', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, name: 'Can Yılmaz', class: '4-A', date: '13 Eki 2025', avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 4, name: 'Ayşe Demir', class: '1-C', date: '12 Eki 2025', avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: 5, name: 'Mehmet Aydın', class: '3-B', date: '11 Eki 2025', avatar: 'https://i.pravatar.cc/150?img=15' }
  ];

  const riskStudents = [
    { id: 1, name: 'Fatma Uysal', type: 'devamsızlık', level: 'high', desc: '10 gün özürsüz devamsızlık' },
    { id: 2, name: 'Caner Aksoy', type: 'akademik', level: 'medium', desc: 'Ortalama düşüşü' },
    { id: 3, name: 'Kerem
    , type: 'finansal', level: 'high', desc: '3 taksit ödemesi gecikmiş' }
];const topStudents = [
{ id: 1, name: 'Ece Kızıroğlu', average: 92, rank: 1 },
{ id: 2, name: 'Fatma Uysal', average: 89, rank: 2 },
{ id: 3, name: 'Kerem Ada', average: 87, rank: 3 },
{ id: 4, name: 'Zeynep Tunç', average: 85, rank: 4 },
{ id: 5, name: 'Can Yılmaz', average: 83, rank: 5 }
];const recentActivities = [
{ id: 1, type: 'payment', desc: 'Ece K. 15.000₺ ödeme', time: 'Bugün, 14:30', user: 'Zeynep Hanım', status: 'success' },
{ id: 2, type: 'registration', desc: 'Fatma U. kayıt tamamlandı', time: 'Dün, 09:15', user: 'Admin', status: 'success' },
{ id: 3, type: 'exam', desc: 'Matematik sınavı notları girildi', time: 'Dün, 16:45', user: 'Ayşe Öğretmen', status: 'success' },
{ id: 4, type: 'sms', desc: 'Toplu SMS gönderildi (45 veli)', time: '2 gün önce', user: 'Sistem', status: 'success' }
];return (
<div className="space-y-6">
{/* Page Header */}
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-bold text-gray-900">Yönetim Konsolu</h1>
<p className="text-gray-500 mt-1">2024-2025 Akademik Yılı</p>
</div>
<div className="flex gap-2">
<Button variant="outline">
<Calendar className="w-4 h-4 mr-2" />
Durumu Kaydet
</Button>
<Button className="bg-gradient-to-r from-purple-600 to-blue-600">
<Sparkles className="w-4 h-4 mr-2" />
Hızlı Demo Verisi
</Button>
</div>
</div>  {/* KPI Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <KPICard
      title="Toplam Ciro"
      value={`₺${kpiData.totalRevenue.value.toLocaleString()}`}
      icon={CreditCard}
      trend={kpiData.totalRevenue.trend}
      color="blue"
    />
    <KPICard
      title="Ödeme Oranı"
      value={`%${kpiData.paymentRate.value}`}
      icon={Activity}
      trend={kpiData.paymentRate.trend}
      color="green"
    />
    <KPICard
      title="Gecikmiş Taksit"
      value={kpiData.latePayments.value}
      icon={AlertCircle}
      trend={kpiData.latePayments.trend}
      color="orange"
    />
    <KPICard
      title="Aktif Öğrenci"
      value={kpiData.activeStudents.value}
      icon={GraduationCap}
      trend={kpiData.activeStudents.trend}
      color="purple"
    />
  </div>  {/* Finance Chart & AI Panel */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Finance Chart */}
    <Card className="lg:col-span-2 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Finans Akışı (6 Ay)</h3>
          <p className="text-sm text-gray-500">Gelir ve gider karşılaştırması</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIPanelOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Özet
          </Button>
          <Button variant="outline" size="sm">
            Güncelle
          </Button>
        </div>
      </div>      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={financeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />Claude can make mistakes. Please double-check responses.de
          {/* KPI Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <KPICard
      title="Toplam Ciro"
      value={`₺${kpiData.totalRevenue.value.toLocaleString()}`}
      icon={CreditCard}
      trend={kpiData.totalRevenue.trend}
      color="blue"
    />
    <KPICard
      title="Ödeme Oranı"
      value={`%${kpiData.paymentRate.value}`}
      icon={Activity}
      trend={kpiData.paymentRate.trend}
      color="green"
    />
    <KPICard
      title="Gecikmiş Taksit"
      value={kpiData.latePayments.value}
      icon={AlertCircle}
      trend={kpiData.latePayments.trend}
      color="orange"
    />
    <KPICard
      title="Aktif Öğrenci"
      value={kpiData.activeStudents.value}
      icon={GraduationCap}
      trend={kpiData.activeStudents.trend}
      color="purple"
    />
  </div>

  {/* Finance Chart & AI Panel */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Finance Chart */}
    <Card className="lg:col-span-2 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Finans Akışı (6 Ay)</h3>
          <p className="text-sm text-gray-500">Gelir ve gider karşılaştırması</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIPanelOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Özet
          </Button>
          <Button variant="outline" size="sm">
            Güncelle
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={financeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #e9d5ff',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number) => `₺${value.toLocaleString()}`}
          />
          <Legend />
          <Bar dataKey="gelir" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Gelir" />
          <Bar dataKey="gider" fill="#a855f7" radius={[8, 8, 0, 0]} name="Gider" />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Quick Stats */}
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">AI Özet</h3>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm font-semibold text-blue-900 mb-1">📊 Hazır</p>
          <p className="text-xs text-blue-700">
            Öğrenci stresi % düşük, akademik trend pozitif.
          </p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm font-semibold text-green-900 mb-1">💰 90 Gün Tahmini</p>
          <p className="text-xs text-green-700 mb-2">Risk Öğrenciler</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => setIsAIPanelOpen(true)}
          >
            Analiz Et
          </Button>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm font-semibold text-purple-900 mb-2">🎯 Hızlı Kısayollar</p>
          <div className="space-y-2">
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs">
              <UserPlus className="w-3 h-3 mr-2" />
              + Kayıt
            </Button>
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs">
              <CreditCard className="w-3 h-3 mr-2" />
              Ödeme Al
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>

  {/* Student Insights */}
  <div>
    <h2 className="text-xl font-bold text-gray-900 mb-4">Öğrenci Paneli</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Latest Students */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            Son Kayıtlar
          </h3>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
            5 yeni
          </span>
        </div>
        
        <div className="space-y-3">
          {latestStudents.map(student => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <img
                src={student.avatar}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-green-200"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{student.name}</p>
                <p className="text-xs text-gray-500">{student.class} • {student.date}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Students */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Risk Grubu
          </h3>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
            3 yüksek
          </span>
        </div>
        
        <div className="space-y-3">
          {riskStudents.map(student => (
            <div
              key={student.id}
              className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500 hover:bg-red-100 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-gray-900">{student.name}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  student.level === 'high' ? 'bg-red-200 text-red-800' :
                  student.level === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-orange-200 text-orange-800'
                }`}>
                  {student.type}
                </span>
              </div>
              <p className="text-xs text-gray-600">{student.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Students */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            En Başarılılar
          </h3>
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
            Top 5
          </span>
        </div>
        
        <div className="space-y-3">
          {topStudents.map((student, index) => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{student.name}</p>
                <p className="text-xs text-gray-500">Sınıf Sırası: {student.rank}/35</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{student.average}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>

  {/* Recent Activities */}
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900">Son İşlemler</h3>
      <Button variant="ghost" size="sm">
        Tümünü Gör →
      </Button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">İşlem</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Zaman</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Yapan</th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Durum</th>
          </tr>
        </thead>
        <tbody>
          {recentActivities.map(activity => (
            <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  {activity.type === 'payment' && <CreditCard className="w-5 h-5 text-green-600" />}
                  {activity.type === 'registration' && <UserPlus className="w-5 h-5 text-blue-600" />}
                  {activity.type === 'exam' && <GraduationCap className="w-5 h-5 text-purple-600" />}
                  {activity.type === 'sms' && <Mail className="w-5 h-5 text-orange-600" />}
                  <span className="text-sm text-gray-900">{activity.desc}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600">{activity.time}</td>
              <td className="py-4 px-4 text-sm text-gray-600">{activity.user}</td>
              <td className="py-4 px-4 text-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ {activity.status === 'success' ? 'Tamamlandı' : 'Bekliyor'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>

  {/* AI Insights Panel */}
  {isAIPanelOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setIsAIPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              AI Analiz
            </h3>
            <button
              onClick={() => setIsAIPanelOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm opacity-90">Gerçek zamanlı öneriler ve tahminler</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Financial Analysis */}
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Finansal Durum
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Son 30 günde <strong className="text-green-600">%12.5 artış</strong> kaydettiniz.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              3 gecikmiş ödeme tespit edildi.
            </p>
            <div className="bg-white rounded p-3 text-xs">
              <strong className="text-purple-600">💡 Öneri:</strong> 5 veliye hatırlatma SMS gönderin.
            </div>
          </div>

          {/* Academic Performance */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Akademik Performans
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Sınıf ortalaması: <strong>82.5 → 84.2</strong> (+1.7)
            </p>
            <p className="text-sm text-gray-700 mb-3">
              8 öğrenci not düşüşü riski taşıyor.
            </p>
            <div className="bg-white rounded p-3 text-xs">
              <strong className="text-purple-600">💡 Öneri:</strong> Bireysel destekleme programı planlayın.
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
            <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Analizi
            </h4>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span>Yüksek Risk:</span>
                <span className="font-bold text-red-600">3 öğrenci</span>
              </div>
              <div className="flex justify-between">
                <span>Orta Risk:</span>
                <span className="font-bold text-yellow-600">12 öğrenci</span>
              </div>
            </div>
            <div className="bg-white rounded p-3 text-xs">
              <strong className="text-purple-600">💡 Öneri:</strong> Bu hafta veli görüşmeleri planlayın.
            </div>
          </div>

          {/* 90 Days Prediction */}
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              90 Gün Tahmini
            </h4>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span>Beklenen Kayıt:</span>
                <span className="font-bold text-green-600">+25 öğrenci</span>
              </div>
              <div className="flex justify-between">
                <span>Tahmini Ciro:</span>
                <span className="font-bold">₺1.450.000</span>
              </div>
              <div className="flex justify-between">
                <span>Risk:</span>
                <span className="font-bold text-red-600">7 öğrenci kayıt yenilemeyebilir</span>
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Güven Skoru:</span>
                <span className="text-2xl font-bold text-purple-600">87%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Mail className="w-4 h-4 mr-2" />
              Toplu Email Gönder
            </Button>
            <Button variant="outline" className="w-full">
              <Phone className="w-4 h-4 mr-2" />
              Risk Velilerini Ara
            </Button>
          </div>
        </div>
      </div>
    </>
  )}
</div>
export default MainDashboard;
## 🎯 SON ADIMLAR VE ÇALIŞTIRMA

### .cursorrules Dosyası Özeti
```
Şimdi cursor'a şunu söyle:

"Yukarıdaki tüm kurallara ve yapıya göre:

1. Auth sistemi kur (Login, Register, Protected Routes)
2. Layout componentleri oluştur (Sidebar, Header, MainLayout)
3. Dashboard sayfasını tam çalışır hale getir (KPI, Charts, AI Panel)
4. Öğrenci modülünü kur (List, Registration, Profile)
5. Finans modülünü kur (Payments, Installments, Debt Tracking)
6. Sınav modülünü kur (Question Bank, Exam Creator, LGS/YKS)
7. Tüm routing'leri ayarla
8. Mock data'ları doldur

Adım adım uygula:
- ADIM 1: package.json ve config dosyalarını oluştur
- ADIM 2: Types ve store'ları kur
- ADIM 3: Common component'leri yap
- ADIM 4: Auth sistemini bitir
- ADIM 5: Layout'u kur
- ADIM 6: Dashboard'u tamamla
- ADIM 7: Diğer modülleri sırayla ekle

Her adımda bana 'ADIM X tamamlandı' de."
```

### Package.json Kurulumu
```bash
npm install
npm run dev
```

Proje http://localhost:3031 adresinde çalışacak.

### Demo Login Bilgileri
Admin: admin@demo.com / admin123
Öğretmen: ogretmen@demo.com / ogretmen123
Veli: veli@demo.com / veli123
Muhasebe: muhasebe@demo.com / muhasebe123
---

## ✅ KONTROL LİSTESİ

- [ ] Proje klasörü oluşturuldu
- [ ] Dependencies kuruldu
- [ ] Tailwind yapılandırıldı
- [ ] TypeScript paths ayarlandı
- [ ] shadcn/ui componentleri eklendi
- [ ] Auth store çalışıyor
- [ ] Routing çalışıyor
- [ ] Login sayfası çalışıyor
- [ ] Dashboard görünüyor
- [ ] Sidebar navigasyon çalışıyor
- [ ] AI Panel açılıyor
- [ ] Charts render ediliyor
- [ ] Mock data yükleniyor

Bu yapıyla **production-ready**, **scalable**, **maintainable** bir sistem kurmuş olacaksın! 🚀