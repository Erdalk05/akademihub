# 🎯 AkademiHub Cursor Rules

## 📌 Proje Özeti
**AkademiHub** - Next.js + TypeScript tabanlı, AI destekli eğitim yönetim paneli. Öğrenci takibi, finansal yönetim, gamification ve real-time iletişim özellikleri içerir.

---

## 🏗️ TEKNOLOJI STACK

### Frontend
- **Framework:** Next.js 14.2.33 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Lucide Icons
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Charts:** Recharts (ComposedChart, LineChart, AreaChart, BarChart, PieChart)
- **HTTP Client:** Fetch API

### Backend
- **API:** Next.js API Routes (`app/api/`)
- **AI:** OpenAI (GPT-4o model)
- **Email:** Resend API
- **SMS:** Twilio API
- **Database:** Supabase (PostgreSQL)
- **Auth:** Custom Auth Store (Zustand)

### Tools
- **Package Manager:** npm
- **Linter:** ESLint (with @typescript-eslint)
- **Git:** Version Control

---

## 📁 PROJE YAPISI

```
app/
├── api/
│   ├── chat/route.ts              # GPT-4o chat API
│   ├── send-email/route.ts        # Resend email API
│   └── send-sms/route.ts          # Twilio SMS API
├── dashboard/page.tsx             # Main dashboard
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
├── students/
│   ├── page.tsx
│   └── register/page.tsx
├── finance/page.tsx
├── exams/page.tsx
└── page.tsx                       # Home

components/
├── dashboard/
│   ├── HeroBanner.tsx            # Animated hero section
│   ├── NotificationToast.tsx     # Real-time notifications
│   ├── GraphicsTabPanel.tsx      # Tabbed charts (Finance/Prediction/Trends)
│   ├── StudentPanelSection.tsx   # 3-tab student view
│   ├── AIInsightPanel.tsx        # AI-powered insights
│   └── AIChatWidget.tsx          # Fixed bottom-right chat
├── modals/
│   ├── QuickRegistrationModal.tsx # 2-tab registration (Student + Parents + Contract)
│   ├── PaymentModal.tsx          # 5 payment methods
│   └── SearchModal.tsx           # Fuzzy search
├── gamification/
│   ├── AchievementBadges.tsx     # Badge display with progress
│   └── RankingSystem.tsx         # Top 10 leaderboard
└── layout/
    └── PageHeader.tsx            # Reusable header

lib/
├── store.ts                      # Zustand state (Auth, AI)
├── services/
│   └── aiService.ts             # AI insights generation
├── hooks/
│   └── useSupabase.ts           # Supabase hooks
└── supabase/
    ├── client.ts                # Supabase client config
    └── types.ts                 # Database types

types/
├── dashboard.ts                 # KPI, Trend, Risk types
└── index.ts

public/
└── assets/                      # Images, icons

.env.local                        # Environment variables
tsconfig.json                     # TypeScript config
```

---

## 🎨 BILEŞEN MIMARISI

### Dashboard Sayfası Yapısı (Top to Bottom)
1. **AI Test Bar** - Kompakt GPT-4o test alanı
2. **Hero Banner** - Animated gradient, AI rapor butonu
3. **Hızlı İşlemler** - 4 buton (Modal açıyor)
4. **Tab Sistemi** - Grafikler (Finans/Tahmin/Trend)
5. **KPI Kartları** - 4 adet gelişmiş metrik
6. **Öğrenci Paneli** - 3 Tab (Son Kayıtlar/Risk/Başarılılar)
7. **Gamification** - Rozetler & Sıralama (2 kolon)
8. **AI İçgörüleri** - Başarı/Risk/Öneriler
9. **AI Chat Widget** - Sabit sağ alt (Minimize/Maximize)

### Modal Bileşenleri
| Modal | Tabs | Özellikler |
|-------|------|-----------|
| QuickRegistrationModal | 2 | Öğrenci bilgileri, Veli (geniş), Sözleşme + KVKK onayı |
| PaymentModal | 1 | 5 ödeme yöntemi (Kart/Transfer/EFT/Nakit/Manuel) |
| SearchModal | 1 | Fuzzy arama, kategori filtrelemesi |

---

## 🔑 ORTAM VARYA BİLLERİ (.env.local)

```
# OpenAI
OPENAI_API_KEY=sk-...

# Resend (Email)
RESEND_API_KEY=re_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+90...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Other
DATABASE_URL=...
```

---

## 🔌 API ROTALARı

### `/api/chat` (POST)
```typescript
Request:  { prompt: string }
Response: { answer: string, model: "gpt-4o", timestamp: ISO8601 }
```

### `/api/send-email` (POST)
```typescript
Request:  { to: string, subject: string, body: string }
Response: { message: "Email gönderildi" }
```

### `/api/send-sms` (POST)
```typescript
Request:  { to: string (E.164), body: string }
Response: { message: "SMS gönderildi" }
```

---

## 📊 STATE MANAGEMENT (Zustand)

### authStore
```typescript
{
  user: User | null,
  token: string | null,
  login: (email, password) => void,
  logout: () => void
}
```

### aiStore
```typescript
{
  insights: InsightItem[],
  generateInsights: (type) => Promise<void>,
  markInsightAsRead: (id) => void
}
```

---

## 🎨 DESIGN TOKENS

### Colors
- **Primary:** Blue (600, 700)
- **Success:** Green (500, 600)
- **Warning:** Yellow/Amber (500, 600)
- **Danger/Error:** Red (500, 600)
- **Info:** Blue (500, 600)
- **Accent:** Purple (600, 700)

### Spacing
- Standard: 4px, 8px, 12px, 16px, 24px, 32px, 48px

### Animations
- Duration: 200ms, 300ms, 500ms
- Easing: ease-in-out, ease, linear

---

## ✅ CODING STANDARDS

### TypeScript
- ✅ `strict: true` (tsconfig.json)
- ✅ Explicit type annotations
- ✅ No `any` types (use `unknown` or specific types)
- ✅ Interface > Type (when possible)

### React/Next.js
- ✅ `'use client';` for interactive components
- ✅ Functional components only
- ✅ Hooks pattern (useState, useEffect, useCallback)
- ✅ Server Components by default
- ✅ SSR-friendly code (no window in server context)

### Naming
```
Components:     PascalCase (Button, UserProfile)
Functions:      camelCase (handleSubmit, fetchData)
Constants:      UPPER_SNAKE_CASE (API_URL, MAX_RETRIES)
Files:          kebab-case (user-profile.tsx)
Folders:        kebab-case (components/user-profile/)
```

### File Organization
```
component-name.tsx          # Main component
component-name.types.ts     # Types (optional)
component-name.styles.ts    # Styles (optional)
component-name.test.tsx     # Tests (optional)
```

### ESLint Rules
```json
{
  "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
  "camelcase": ["error", {"properties": "never"}],
  "prefer-const": "warn",
  "no-console": "warn"
}
```

---

## 🚀 COMMON WORKFLOWS

### Yeni Modal Eklemek
1. `components/modals/YeniModal.tsx` oluştur
2. State'leri tanımla (`isOpen`, form data)
3. Overlay + Header + Form + Footer ekle
4. Dashboard'a import + JSX ekle

```typescript
// Template
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

export default function YeniModal({ isOpen, onClose, onSubmit }: Props) {
  if (!isOpen) return null;
  // Modal JSX
}
```

### Yeni API Rotası Eklemek
1. `app/api/endpoint/route.ts` oluştur
2. `POST` fonksiyonu yazıp NextResponse dön
3. Error handling + validation ekle

```typescript
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Logic here
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Yeni Grafik Eklemek
```typescript
import { ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

### Notification Göndermek
```typescript
addNotification({
  type: 'success' | 'warning' | 'error' | 'info',
  title: 'Başlık',
  message: 'Mesaj içeriği',
  action: { label: 'Butonu', onClick: () => {} }
});
```

---

## 🔒 SECURITY

- ✅ Environment variables `.env.local` (never commit)
- ✅ API key validation on server-side only
- ✅ Input sanitization (Zod/validation)
- ✅ CORS headers (if needed)
- ✅ Rate limiting (API throttling)
- ✅ XSS prevention (React escaping)

---

## 📈 PERFORMANCE

- ✅ Code splitting (dynamic imports)
- ✅ Image optimization (next/image)
- ✅ Lazy loading (React.lazy)
- ✅ Memoization (React.memo, useMemo, useCallback)
- ✅ Tailwind purging (automatic)
- ✅ ESLint warnings (build-time checks)

---

## 🧪 TESTING

### Build Check
```bash
npm run build
```

### Dev Mode
```bash
npm run dev
```

### Clean & Rebuild
```bash
rm -rf .next && npm run dev
```

---

## 📦 VERCEL DEPLOYMENT

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Environment variables
vercel env add OPENAI_API_KEY
vercel env add RESEND_API_KEY
vercel env add TWILIO_ACCOUNT_SID
# ... etc
```

---

## 🐛 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| 404 Errors | `rm -rf .next && npm run dev` |
| Type Errors | Check `tsconfig.json` strict mode |
| Module Not Found | Verify import path relative to `tsconfig` baseUrl |
| Slow Build | Check ESLint warnings, optimize images |
| Styling Issues | Check Tailwind config, ensure `@apply` used correctly |

---

## 📚 RESOURCES

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Zustand](https://github.com/pmndrs/zustand)
- [Framer Motion](https://www.framer.com/motion/)
- [OpenAI API](https://platform.openai.com/docs)
- [Supabase](https://supabase.com/docs)

---

## 📖 CURSOR RULES REFERENSı

Bu Cursor Rules dosyası aşağıdaki dokümantasyon dosyalarıyla bağlantılıdır:

| Dosya | Amaç | Boyut |
|-------|------|-------|
| **dashboard-design.md** | Dashboard tasarım spesifikasyonları, bileşen mimarisi, UI/UX detayları | 16KB |
| **project-plan.md** | Projenin tam teknik planı, geliştirme roadmap'i, feature list | 140KB |
| **students-database.md** | Öğrenci yönetimi veritabanı şeması, store yapıları, data models | 43KB |
| **finance-management.md** | Mali yönetim, işlemler, raporlar, grafik sistemleri | 32KB |

### 🔗 Dokümantasyon Hiyerarşisi:

```
.cursor/rules/
├── akademihub-rules.mdc          ← ANA KURALLAR (Bu dosya)
│   ├── dashboard-design.md       ← Dashboard detaylı tasarım
│   ├── project-plan.md           ← Projenin tam planı
│   ├── students-database.md      ← Öğrenci DB şeması
│   └── finance-management.md     ← Mali yönetim sistemi
└── corsur-rules.mdc              ← Genel Cursor kuralları
```

### 📝 Dosya Açıklamaları:

**akademihub-rules.mdc** (Ana Kurallar)
- Teknoloji stack
- Proje yapısı
- Bileşen mimarisi
- Coding standards
- Common workflows
- Troubleshooting

**dashboard-design.md** (Dashboard Tasarımı)
- Hero Banner özellikleri
- Hızlı İşlemler modları
- KPI kartları detayları
- Grafik sistem (Tab sistemi)
- Modal bileşenleri
- Gamification özellikleri
- AI entegrasyonu
- Real-time bildirimler

**project-plan.md** (Proje Planı)
- Tam proje roadmap'i
- Feature list detayları
- Development phases
- Timeline planlaması
- Success criteria

**students-database.md** (Öğrenci Veritabanı)
- Student interface yapısı
- Risk student modeli
- Başarılı student modeli
- Store implementasyonları
- Zustand state yönetimi
- Database queries

**finance-management.md** (Mali Yönetim Sistemi)
- Finansal döngü ve iş akışı
- İşlem türleri (Gelir/Gider/Ödeme)
- Finansal raporlar ve analizler
- Öğrenci ödemeli takip sistemi
- useFinanceStore mimarisi
- API entegrasyonları
- Dashboard grafikleri

---

## 🎯 NASIL KULLANILACAK?

1. **Hızlı Referans İçin:** `akademihub-rules.mdc` → Coding standards, workflows
2. **Dashboard Tasarımı:** `dashboard-design.md` → UI/UX spesifikasyonları
3. **Proje Planlaması:** `project-plan.md` → Geliştirme roadmap'i
4. **Veri Yapısı:** `students-database.md` → Öğrenci modelleri
5. **Mali Yönetim:** `finance-management.md` → Finansal işlemler, raporlar, store

---

## 📝 NOTLAR

- **Türkçe**: Tüm UI metin, label, button Türkçe olmalı
- **Responsive**: Tüm componentler mobile-first responsive
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: First Load JS < 100KB
- **Browser Support**: Chrome 90+, Safari 14+, Firefox 88+

---

**Last Updated:** October 2025 | **Version:** 1.0