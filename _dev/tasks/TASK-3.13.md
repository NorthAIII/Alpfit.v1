# TASK-3.13: Streak Göstergesi — Backend API + Mobile UI

**Durum:** ⬜ Bekliyor
**Modül:** M3 — Sürdürülebilirlik Motoru (`modules/M3-surdurulebilirlik-motoru.md`)
**Feature:** F3.1 — Streak Görünürlüğü
**Faz:** Phase 3 (`phases/PHASE-3.md`)
**Bağımlılıklar:** TASK-3.03 ✅

---

## Hedef

Üyenin streak bilgisini döndüren `GET /me/streak` endpoint'ini yaz ve mobile'daki gizli streak alanını (M2'de `display: none`) açarak bilgiyi göster. Faz 3 milestone'unun görsel doğrulaması buradadır: streak doğru hesaplanıyor mu?

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M3-surdurulebilirlik-motoru.md` — F3.1 streak görünürlüğü kabul kriterleri (üye tarafı: sayı + max + sıfır CTA)
- `_dev/phases/PHASE-3.md` §Kapsam Tartışması — "Streak açılışı fazın son task'lerinden biri"
- `mobile/src/hooks/useMemberHome.ts` — üye ana ekranı hook'u (streak buraya entegre edilir)
- `backend/src/routes/` — yeni route ekleme paterni

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-3.md` — Task Listesi

---

## Alt Görevler

- [ ] **1. `GET /me/streak` Backend Endpoint**

  `backend/src/routes/streak.ts` (yeni dosya):

  - Auth: `app.authenticate`, yalnızca `member` rolü
  - `memberId = claims.sub`
  - `StreakState` oku (yoksa varsayılan sıfır değerleri döndür — satır oluşturma)
  - Aktif program var mı? → yoksa `noProgram: true` döndür
  - Telafi penceresi açık mı? Hesapla:
    - Üyenin aktif programından dün planlı antrenman var mıydı?
    - Varsa ve `lastActivityDate` dünü kapsamıyorsa → `telafiWindowOpen: true`
  - Response:
    ```json
    {
      "currentStreak": 5,
      "maxStreak": 12,
      "telafiWindowOpen": false,
      "noProgram": false,
      "streakResetAt": null
    }
    ```

  **Güvenlik checklist:**
  - Role: member only
  - Ownership: `memberId = claims.sub` (implicit)
  - Status guard: deletedAt IS NULL (authenticate middleware)

- [ ] **2. Route Kaydı**

  `backend/src/server.ts` → `app.register(streakRoutes)`

- [ ] **3. Backend Test Yaz**

  `backend/src/routes/streak.test.ts` (yeni dosya):
  - Normal üye → `currentStreak`, `maxStreak` doğru
  - `StreakState` yok → sıfır değerler, hata yok
  - Aktif program yok → `noProgram: true`
  - Dün planlı antrenman + completion yok → `telafiWindowOpen: true`
  - Trainer rolü → 403

- [ ] **4. Mobile — Streak API Client**

  `mobile/src/api/streak.ts` (yeni dosya):
  ```ts
  export async function getMyStreak(): Promise<StreakInfo>
  ```

- [ ] **5. `useStreak` Hook**

  `mobile/src/hooks/useStreak.ts` (yeni dosya):
  - `getMyStreak()` çağrısı
  - Loading / error state

- [ ] **6. Mobile Streak UI Açılışı**

  `mobile/src/hooks/useMemberHome.ts` (veya ilgili ekran/component) → streak alanını entegre et:

  **Gösterim durumları:**
  - `noProgram: true` → streak alanı gizli ("PT'n henüz program yazmadı" mesajı)
  - `currentStreak > 0` → `"Streak: N 🔥"` + `"En uzun streak'in: M"`
  - `currentStreak === 0` → `"Yeni streak'ini başlat"` CTA (bugünün antrenmanına gider)
  - `telafiWindowOpen: true` → küçük uyarı: `"Dünkü antrenmanı bugün tamamlayabilirsin"`

  M2'de `display: none` olan streak container → görünür yap.

---

## Etkilenen Dosyalar

```
backend/src/routes/
├── streak.ts           # YENİ — GET /me/streak
└── streak.test.ts      # YENİ — testler

mobile/src/
├── api/streak.ts                  # YENİ — API client
├── hooks/useStreak.ts             # YENİ — data hook
└── hooks/useMemberHome.ts         # streak entegrasyonu + display:none kaldırma
```

---

## Dikkat Noktaları

- Telafi penceresi hesabı: "dün planlı antrenman + bugün hâlâ tamamlanmamış" → `telafiWindowOpen: true`. Bu hesaplama basit tutulmalı (Program + ProgramDay join, yesterday's dayOfWeek)
- `noProgram: true` → streak alanı tamamen gizli (sadece sıfır göstermek hatalı olur — sıfır streak ile programsız üyeyi ayırt et)
- Mobile'da streak container M2'den kalma alan — kodu bul, `display: none` kaldır (ya da `style.display` state'i)
- `🔥` emoji yerelleştirme notlar: tüm platforümde destekleniyor (iOS/Android)
- v1'de streak rozet sistemi yok — sayı + emoji yeterli (M3 teknik notlar)

---

## Test Kriterleri

- [ ] `GET /me/streak` → `currentStreak`, `maxStreak` StreakState'den doğru
- [ ] StreakState yok → 200, sıfır değerler
- [ ] Aktif program yok → `noProgram: true`
- [ ] Dün planlı + completion yok → `telafiWindowOpen: true`
- [ ] Trainer rolü → 403
- [ ] Mobile: `currentStreak > 0` → sayı + emoji görünüyor (render test)
- [ ] Mobile: `currentStreak = 0` → CTA görünüyor
- [ ] Mobile: `noProgram: true` → streak alanı yok
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
