# Scoring Rules Migration - Uygulama Kılavuzu

## 📋 Yapılan Değişiklikler

### 1. RLS Policy Düzeltildi
**Dosya:** `20260111_fix_scoring_rules_rls.sql`

**Değişiklik:**
- Service Role artık tüm policy'leri bypass ediyor
- JWT claims yanında `current_setting('app.current_organization_id')` desteği eklendi
- Global kurallar (organization_id IS NULL) herkes tarafından görülebilir

### 2. API Route Güncellendi
**Dosya:** `app/api/settings/scoring-rules/route.ts`

**Değişiklik:**
- `organization_id` artık query param'dan alınıyor
- Fallback: header > session
- Hata kodu 401 → 400 (bad request)

### 3. Hook Güncellendi
**Dosya:** `lib/hooks/useScoringRules.ts`

**Değişiklik:**
- Zustand localStorage'dan organization_id okuyor
- console.warn → console.info (fallback normal davranış)
- DB'den veri gelirse log: "✅ X kural DB'den yüklendi"

### 4. Seed Data
**Dosya:** `20260111_seed_scoring_rules_for_existing_orgs.sql`

**Ne yapar:**
- Tüm aktif organizasyonlar için varsayılan puanlama kuralları oluşturur
- LGS, TYT, AYT_SAY, AYT_EA, AYT_SOZ, AYT_DIL kuralları

---

## 🚀 Uygulama Adımları

### 1️⃣ Migration'ları Çalıştır

```bash
# Supabase CLI ile
supabase db push

# Veya manuel (psql)
psql $DATABASE_URL -f supabase/migrations/20260111_fix_scoring_rules_rls.sql
psql $DATABASE_URL -f supabase/migrations/20260111_seed_scoring_rules_for_existing_orgs.sql
```

### 2️⃣ Kontrol Et

```sql
-- 1. RLS policy'leri kontrol et
SELECT * FROM pg_policies WHERE tablename = 'scoring_rules';

-- 2. Seed data kontrol et
SELECT organization_id, sinav_turu, ad, is_default 
FROM scoring_rules 
ORDER BY organization_id, sinav_turu;

-- 3. Her organizasyonun kaç kuralı var?
SELECT 
  o.name AS kurum,
  COUNT(sr.id) AS kural_sayisi
FROM organizations o
LEFT JOIN scoring_rules sr ON sr.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.name
ORDER BY o.name;
```

### 3️⃣ Frontend'i Test Et

1. Browser console'u aç
2. "Yeni Sınav Ekle" sayfasına git (`/admin/spectra/sihirbaz`)
3. Console loglarını kontrol et:

**✅ BAŞARILI:**
```
[SCORING RULES] ✅ 6 kural DB'den yüklendi
```

**❌ BAŞARISIZ (Fallback):**
```
[SCORING RULES] Organization ID bulunamadı, fallback kullanılıyor
```
veya
```
[SCORING RULES] DB boş, fallback kullanılacak
```

### 4️⃣ API'yi Doğrudan Test Et

```bash
# Org ID'nizi buraya yazın
ORG_ID="your-org-uuid-here"

curl "http://localhost:3000/api/settings/scoring-rules?active=true&organization_id=$ORG_ID" \
  -H "Content-Type: application/json" | jq
```

**Beklenen:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "sinav_turu": "LGS",
      "ad": "LGS Standart",
      "yanlis_katsayisi": 3,
      ...
    }
  ]
}
```

---

## ✅ Başarı Kriterleri

- [ ] Migration hatasız çalıştı
- [ ] Her organizasyonun 6 puanlama kuralı var (LGS, TYT, 4xAYT)
- [ ] Frontend console'da "✅ X kural DB'den yüklendi" görünüyor
- [ ] "using fallback" mesajı GÖRÜNMÜYORmalı (sadece org ID yoksa veya DB boşsa)
- [ ] Step 1'de yanlış katsayısı otomatik doluyor (LGS → 3, TYT → 4)

---

## 🐛 Sorun Giderme

### Sorun 1: "Organization ID bulunamadı"
**Sebep:** localStorage'da organization yok  
**Çözüm:** TopBar'dan kurum seçin veya logout/login yapın

### Sorun 2: "DB boş, fallback kullanılacak"
**Sebep:** Seed data çalışmamış  
**Çözüm:** `20260111_seed_scoring_rules_for_existing_orgs.sql` tekrar çalıştır

### Sorun 3: "API unauthorized"
**Sebep:** RLS policy güncellenmemiş  
**Çözüm:** `20260111_fix_scoring_rules_rls.sql` tekrar çalıştır

### Sorun 4: "relation does not exist"
**Sebep:** `scoring_rules` tablosu yok  
**Çözüm:** `054_scoring_rules.sql` önce çalıştır

---

## 📝 Notlar

- Fallback mekanizması hala çalışır (DB hatası durumunda güvenli)
- Hardcoded kurallar kaldırılmadı (backward compatibility)
- Console.warn → console.info değişti (spam azaldı)
- API artık query param zorunluluğu ile çalışıyor (güvenlik)
