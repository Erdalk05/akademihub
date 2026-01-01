# Cursor'da şu klasörleri sil:
- /admin/akademik-analiz/sonuclar
- /admin/akademik-analiz/ogrenci-karne
```

### 🟡 ADIM 2: YENİ SAYFA OLUŞTUR (1 saat)
```
Cursor Agent'a basit prompt:

"Create new page: /admin/akademik-analiz/exam-dashboard
- Use existing layout and auth
- One page with student list + details
- Turkish labels"
```

### 🟢 ADIM 3: MENÜYE EKLE (10 dakika)
Sol menüde "Akademik Analiz" altına "Sınav Analizi" ekle.

## 💡 ÖNEMLİ: FAZLARA AYIR

### FAZ 1 - BASİT BAŞLA (İLK GÜN)
- ✅ Tek sayfa
- ✅ Sınav seç → Öğrenci listesi → Detay gör
- ✅ Basit tablo ve liste
- ❌ Grafik yok, AI yok, tahmin yok

### FAZ 2 - ZENGİNLEŞTİR (2. HAFTA)  
- ➕ Grafikler
- ➕ Karşılaştırmalar
- ➕ Excel export

### FAZ 3 - AKILLANDI (1. AY)
- ➕ Risk skorları
- ➕ AI öneriler
- ➕ Veli/Öğretmen görünümleri

## 🚀 ŞİMDİ NE YAPMALISIN?

1. **Cursor'u aç**
2. **Agent Mode → Opus 4.5**
3. **Şu basit prompt'u kullan:**
```
I have AkademiHub project with existing auth and layout.

Delete old pages:
- /admin/akademik-analiz/sonuclar  
- /admin/akademik-analiz/ogrenci-karne

Create single new page:
- /admin/akademik-analiz/exam-dashboard

Requirements:
- Use existing project structure
- Fetch exam + students data
- Left panel: student list
- Right panel: selected student details
- Turkish UI labels
- Keep it simple for now