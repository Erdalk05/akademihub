# AkademiHub - AI Destekli Yönetim Dashboard

Modern, responsive ve performanslı eğitim yönetim sistemi. Next.js, TypeScript ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Özellikler

### 📊 Dashboard Özellikleri
- **KPI Kartları**: Toplam ciro, ödeme oranı, gecikmiş taksit, aktif öğrenci
- **Finansal Grafik**: 6 aylık gelir-gider analizi (Recharts)
- **Öğrenci Panelleri**: Son kayıtlar, risk grubu, en başarılılar
- **AI Özet Paneli**: Finansal, akademik ve risk analizleri
- **Hızlı Kısayollar**: Kayıt, sınav, ödeme, rapor işlemleri
- **Son İşlemler**: Gerçek zamanlı aktivite takibi

### 🎨 Tasarım Özellikleri
- **Responsive Tasarım**: Mobil, tablet ve desktop uyumlu
- **Modern UI**: Gradient renkler, gölgeler ve animasyonlar
- **Dark Mode**: Gece modu desteği
- **Animasyonlar**: Framer Motion ile smooth geçişler
- **Toast Bildirimleri**: Kullanıcı geri bildirimleri

### 🤖 AI Özellikleri
- **Finansal Analiz**: Otomatik trend analizi
- **Risk Değerlendirmesi**: Öğrenci risk seviyesi tespiti
- **Akademik Performans**: Başarı analizi ve öneriler
- **Tahmin Sistemi**: 90 günlük finansal tahminler

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Development**: ESLint, Prettier

## 📦 Kurulum

### Gereksinimler
- Node.js 18.0.0 veya üzeri
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd akademihub-dashboard
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
# veya
yarn install
```

3. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
# veya
yarn dev
```

4. **Tarayıcıda açın**
```
http://localhost:3000
```

## 🏗️ Proje Yapısı

```
akademihub-dashboard/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global stiller
│   ├── layout.tsx         # Ana layout
│   └── page.tsx           # Ana sayfa
├── components/            # React bileşenleri
│   ├── dashboard/         # Dashboard bileşenleri
│   │   ├── KPICard.tsx
│   │   ├── FinancialChart.tsx
│   │   ├── StudentPanels.tsx
│   │   └── AIPanel.tsx
│   ├── ui/                # UI bileşenleri
│   │   ├── LoadingSpinner.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   └── DashboardPage.tsx  # Ana dashboard
├── data/                  # Mock veriler
│   └── mockData.ts
├── types/                 # TypeScript tipleri
│   └── dashboard.ts
├── public/                # Statik dosyalar
└── README.md
```

## 🎯 Kullanım

### Dashboard Açılışı
1. Sayfa yüklendiğinde loading animasyonu gösterilir
2. Mock veriler yüklenir (1.5 saniye simülasyon)
3. Dashboard bileşenleri animasyonlu olarak görüntülenir

### KPI Kartları
- Kartlara tıklayarak detaylı bilgi alabilirsiniz
- Hover efektleri ile interaktif deneyim
- Trend göstergeleri (yukarı/aşağı/aynı)

### Finans Grafiği
- 6 aylık gelir, gider ve net kar analizi
- Hover ile detaylı bilgi gösterimi
- Responsive tasarım

### AI Analiz
- "Analiz Et" butonuna tıklayın
- 2 saniye loading animasyonu
- Sağdan açılan panel ile detaylı analiz

### Öğrenci Panelleri
- Son kayıtlar, risk grubu, en başarılılar
- Her öğrenci kartına tıklayarak detay görüntüleyin
- "Tümünü Gör" ile tam liste

## 📱 Responsive Tasarım

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobil Değişikler
- KPI kartları tek kolon
- Grafik tam genişlik
- Öğrenci panelleri stacked
- AI panel full screen overlay

## 🎨 Renk Paleti

```css
Primary: #7C3AED (Mor)
Secondary: #3B82F6 (Mavi)
Success: #10B981 (Yeşil)
Warning: #F59E0B (Turuncu)
Danger: #EF4444 (Kırmızı)
```

## 🔧 Geliştirme

### Komutlar
```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run start        # Production sunucusu
npm run lint         # ESLint kontrolü
npm run type-check   # TypeScript kontrolü
```

### Kod Standartları
- ESLint: Airbnb base config
- Prettier: Tailwind plugin ile
- TypeScript: Strict mode
- Naming: camelCase

## 🚀 Deployment

### Vercel (Önerilen)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Mock Data

Proje gerçekçi mock verilerle geliştirilmiştir:
- 128 aktif öğrenci
- 6 aylık finansal veri
- AI analiz örnekleri
- Öğrenci risk değerlendirmeleri

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Proje**: AkademiHub AI Dashboard
- **Geliştirici**: AkademiHub Team
- **Versiyon**: 1.0.0

## 🎉 Teşekkürler

- Next.js ekibi
- Tailwind CSS ekibi
- Recharts ekibi
- Framer Motion ekibi
- Lucide ikonları

---

**AkademiHub** - Eğitimde AI devrimi! 🚀

