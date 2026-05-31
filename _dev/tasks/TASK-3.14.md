# TASK-3.14: T+7 PT In-App Banner — Backend API + Mobile UI

**Durum:** ⬜ Bekliyor
**Modül:** M3 — Sürdürülebilirlik Motoru (`modules/M3-surdurulebilirlik-motoru.md`)
**Feature:** F3.1 — T+7 PT Uyarı Görünümü
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.10 ✅

---

## Hedef

PT'nin aktif T+7 uyarılarını gösteren `GET /pt/member-alerts` endpoint'ini yaz ve PT'nin Alpfit ana ekranında basit in-app banner bileşenini göster. M5 fazına kadar bu banner temel görünüm olarak kalır; "Okudum" TASK-3.10'daki dismiss endpoint'ini kullanır. Bu task Faz 3 milestone'unu tamamlar.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 T+7 PT banner kabul kriterleri ("Okudum" davranışı, banner kaybolma)
- `_dev/phases/PHASE-3.md` §Kapsam Tartışması — "T+7 in-app uyarı: banner-store üzerinden, M5 yokken temel görünüm"
- `mobile/src/components/in-app-banner.tsx` — mevcut in-app banner bileşeni (üzerine kurulacak)
- `mobile/src/stores/memberBannerStore.ts` — mevcut banner store (PT için benzer store veya extension)
- `backend/src/routes/pt-alerts.ts` — dismiss endpoint (TASK-3.10'da oluşturuldu)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi, Retrospektif hazırlık notu

---

## Alt Görevler

- [ ] **1. `GET /pt/member-alerts` Backend Endpoint**

  `backend/src/routes/pt-alerts.ts` → (TASK-3.10'da oluşturulan dosyaya ekle):

  **`GET /pt/member-alerts`** — PT'nin aktif T+7 uyarılarını listele
  - Auth: `app.authenticate`, yalnızca `trainer` rolü
  - `trainerId = claims.sub`
  - Trainer'ın aktif üyelerini bul (`TrainerMember WHERE endedAt IS NULL`)
  - Bu üyeler arasında `ptT7AlertedAt IS NOT NULL` ve `ptT7DismissedAt IS NULL` ve `currentStreak = 0` olanları filtrele
  - Response:
    ```json
    {
      "t7Alerts": [
        { "memberId": "...", "memberName": "Ahmet Y.", "inactiveSinceDays": 8 }
      ]
    }
    ```
  - `inactiveSinceDays`: `streakResetAt` ile bugün arası gün farkı
  - Re-aktive üye (`currentStreak > 0`): listeye dahil etme

  **Güvenlik checklist:**
  - Role: trainer only
  - Ownership: yalnızca kendi aktif üyeleri (`TrainerMember.endedAt IS NULL`)
  - Status guard: deletedAt IS NULL (authenticate middleware)
  - Input bounding: yok (GET, parametre yok)

- [ ] **2. Backend Test**

  `backend/src/routes/pt-alerts.test.ts` → `GET` endpoint testleri:
  - T+7 alert var + dismiss yok → listede görünüyor
  - `ptT7DismissedAt` set → listede yok
  - `currentStreak > 0` (re-aktive) → listede yok
  - Başka PT'nin üyesi → kendi listesinde yok
  - Member rolü → 403

- [ ] **3. Mobile — PT Alerts API Client**

  `mobile/src/api/pt-alerts.ts` (yeni dosya):
  ```ts
  export async function getPtAlerts(): Promise<PtAlertsResponse>
  export async function dismissT7Alert(memberId: string): Promise<void>
  ```

- [ ] **4. `usePtAlerts` Hook**

  `mobile/src/hooks/usePtAlerts.ts` (yeni dosya):
  - `getPtAlerts()` → `t7Alerts` listesi
  - `dismiss(memberId)` → `dismissT7Alert(memberId)` → local state'den kaldır (optimistic)

- [ ] **5. T+7 Banner Bileşeni + PT Ana Ekranı Entegrasyonu**

  `mobile/src/components/T7AlertBanner.tsx` (yeni dosya):
  - `mevcut in-app-banner.tsx` stiline uygun
  - Metin: `"[Üye adı] 7 gündür aktif değil — manuel iletişim önerilir."`
  - Sağda "Okudum" butonu → `dismiss(memberId)` → banner kaybolur
  - Birden fazla alert varsa: liste (her alert ayrı banner satırı veya ilk N alert)

  PT ana ekranı (mevcut PT dashboard ekranı) → `usePtAlerts()` ile alert listesi çek + `T7AlertBanner` bileşenini render et (alerts yüklendiyse ve boş değilse)

---

## Etkilenen Dosyalar

```
backend/src/routes/
├── pt-alerts.ts            # GET /pt/member-alerts eklendi (TASK-3.10'da başlatıldı)
└── pt-alerts.test.ts       # GET testleri eklendi

mobile/src/
├── api/pt-alerts.ts         # YENİ — API client
├── hooks/usePtAlerts.ts     # YENİ — data hook
└── components/
    └── T7AlertBanner.tsx    # YENİ — banner bileşeni
    (PT ana ekranına entegrasyon — mevcut dosya)
```

---

## Dikkat Noktaları

- Üye adı bildirim metninde geçmez (M4 push kuralı), **ama** in-app banner'da geçer — bu kabul edilebilir; in-app banner üyenin adını görmek için zaten PT'nin ekranıdır
- "Okudum" dismiss: `ptT7DismissedAt` set → aynı kopma döngüsünde banner tekrar belirmez; re-aktivasyon sonrası yeni kopma = `ptT7AlertedAt` sıfırlanır, `ptT7DismissedAt` değişmez → T+7 job yeni `ptT7AlertedAt` set eder → yeni banner çıkar (TASK-3.10 notu)
- PT birden fazla üyesi için aynı anda birden fazla T+7 alert alabilir → liste görünümü
- `inactiveSinceDays` frontend hesabı veya backend hesabı: backend'de hesaplayıp göndermek daha temiz (API response'ta)
- M5 fazında PT dashboard tam banner stack entegrasyonu yapılır; bu task basit, minimal görünüm

---

## Test Kriterleri

- [ ] `GET /pt/member-alerts` → aktif T+7 alertler listesi
- [ ] Dismissed alert → listede yok
- [ ] Re-aktive üye → listede yok
- [ ] Başka PT'nin üyesi → listesinde yok
- [ ] Member rolü `GET` → 403
- [ ] Mobile: T7AlertBanner render ediyor (üye adı + "Okudum" butonu)
- [ ] "Okudum" → banner siliyor, re-render
- [ ] API hata → optimistic rollback (banner geri geliyor)
- [ ] Tüm testler yeşil

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Task çalıştırılınca doldurulacak)*

---

**Oluşturulma:** 2026-05-31
