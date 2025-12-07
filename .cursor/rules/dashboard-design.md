# 📊 AkademiHub Dashboard Tasarımı

## 🎯 Overview

Modern, AI-destekli, full-featured dashboard tasarımı. Renkli görseller, smooth animasyonlar, gerçek-zamanlı veriler.

---

## 1. HERO BANNER

Başlıkta gradient animated background ve hızlı aksiyon kartları.

**Özellikler:**
- Animated gradient background
- Hoş geldin mesajı
- 4 Quick Action Card (Yeni Kayıt, Ödeme Al, Rapor Oluştur, AI Analiz)
- Responsive grid

---

## 2. GELİŞMİŞ KPI KARTLARI

Her karta:
- İkon + Başlık + Değer
- Trend göstergesi (↗️ ↘️ ➡️)
- Mini sparkline grafik
- AI insight/alert
- Hover 3D efekti

**KPI'lar:**
1. Toplam Ciro - ₺1.29M (+12.5% vs geçen ay)
2. Ödeme Oranı - %76.4 (-3.2% vs geçen ay) ⚠️ Alert
3. Gecikmiş Taksit - 3 Acil 🔴
4. Aktif Öğrenci - 128 (+5.8% vs geçen ay)

---

## 3. TAB'LI GRAFİK BÖLÜMÜ

Üç tab sistemi:

### TAB 1: Finans (Dual Y-axis)
- Gelir (yeşil)
- Gider (kırmızı)
- Net Kar (sarı)
- Son 6 ay verisi
- Gradient fill, smooth curves

### TAB 2: Öğrenci
- Kayıt trendi
- Sınıf dağılımı
- Başarı oranı
- Pie chart + bar chart

### TAB 3: Tahmin (Prediction)
- Gelir tahmini (3 ay ileri)
- Güven aralığı (min-max band)
- Actual vs Predicted
- Trend line

---

## 4. AI ANALYSIS PANEL (Sağ Taraf)

Sabit sidebar:
- **Tahsilat Riski:** Risk score + % tahmin
- **Nakit Durumu:** 3 ay öncesine kadar
- **Karlılık:** Trend + hedef
- **Uyarılar:** Top 3 action items
- Gradient background, icons, buttons

---

## 5. ÖĞRENCİ PANELİ

3 Tab:

### TAB 1: Son Kayıtlar
- 5 en yeni kayıt
- Avatar + Ad + Sınıf + Tarih
- Hover animasyonu

### TAB 2: Risk Durumu
- 3 riskli öğrenci
- Risk tipo (Devamsızlık, Akademik, Finansal)
- Level renkleri (Red/Yellow/Orange)
- AI suggestion

### TAB 3: En Başarılılar
- Top 5 öğrenci
- Sıralama + Ortalama
- Başarı rozetleri
- Profile linki

---

## 6. AI CHAT WIDGET

Sabit sağ alt köşede, togglable:
- Chat geçmişi
- Typing indicator (3 dot animation)
- User/AI farklı bubble'lar
- Input field + send button
- Gradient header

---

## 7. REAL-TIME BİLDİRİMLER

Top-right toast notifications:
- Slide-in animasyon
- Renk kodlu (success=green, warning=yellow, error=red, info=blue)
- Icon + title + message
- Action button
- Close button
- Auto-dismiss (5s)

---

## 8. GAMIFICATION BÖLÜMÜ

### Başarı Rozetleri
- 🏆 Mükemmel Kayıt (0 hata)
- ⭐ Ödeme Şampiyonu (100%)
- 🎯 Hedef Aşıcı
- 📈 Trend Yöneticisi

### Sıralama Sistemi
- Top 5 sınıf
- Puan sistemi
- Aylık sıfırlama

### Yıldız Derecelendirmesi
- Öğrenci performansı (1-5 star)
- Veli memnuniyeti

---

## 9. HIZLI MODAL'LAR

### Modal 1: Hızlı Kayıt
- Ad, Soyad, Sınıf, Veli
- 30 saniye
- Success notification

### Modal 2: Hızlı Ödeme
- Arama (fuzzy search)
- Tutar input
- Hızlı butonlar (taksit, tümü)
- Makbuz özet

### Modal 3: Gelişmiş Arama
- Multi-filter
- Tarih range
- Status badges
- Results table

---

## 10. MOBIL RESPONSIVE

- Hero: Stack
- KPI: 1-2 sütun
- Grafikler: Full width
- Panels: Stack
- Modals: Full screen
- Notifications: Smaller

---

## 🎨 RENK PALETİ

- **Primary:** #3b82f6 (Blue)
- **Success:** #10b981 (Green)
- **Warning:** #f59e0b (Amber)
- **Danger:** #ef4444 (Red)
- **Dark:** #1f2937
- **Light:** #f9fafb

---

## ⚡ ANİMASYONLAR

- Hero gradient: 3s infinite
- KPI hover: scale 1.05
- Chart transitions: 0.5s
- Notifications: slide 0.3s
- Buttons: scale 0.95 on click
- Sparklines: smooth curves

---

## 📊 MOCK DATA

```typescript
{
  kpi: [
    { title: 'Toplam Ciro', value: '₺1.29M', trend: 12.5, icon: CreditCard },
    { title: 'Ödeme Oranı', value: '%76.4', trend: -3.2, alert: 'warning' },
    { title: 'Gecikmiş Taksit', value: 3, alert: 'danger' },
    { title: 'Aktif Öğrenci', value: 128, trend: 5.8 }
  ],
  financeData: [ /* 6 aylık verisi */ ],
  latestStudents: [ /* 5 yeni kayıt */ ],
  riskStudents: [ /* 3 riskli */ ],
  topStudents: [ /* 5 en başarılı */ ]
}
```

---

## ✅ KONTROL LİSTESİ

- [ ] Hero banner + quick actions
- [ ] Advanced KPI cards
- [ ] Tab'lı grafik bölümü
- [ ] AI analysis panel
- [ ] Student panels
- [ ] AI chat widget
- [ ] Real-time notifications
- [ ] Gamification
- [ ] Quick modals
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] Performance optimized

---

**STATUS:** 🚀 PRODUCTION-READY DESIGN
