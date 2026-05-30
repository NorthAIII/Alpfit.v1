# TASK-2.09: Mobile — Program Builder — Auto-save + Publish + Kopyalama

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 — Program Builder (PT)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.08 ✅

---

## Hedef

Program builder'a kayıt akışları eklenir: `useProgramAutoSave` hook'u (1 sn debounce ile PATCH /programs/:id), "Taslak kaydedildi" / "Kaydediliyor..." / "Kaydetme hatası" indicator'ı, explicit "Kaydet" butonu (publish → üye görür), "Başka üyenin programını kopyala" CTA. Task sonunda PT programı yarım bırakıp geri döndüğünde kayıp olmaz; "Kaydet" ile üye programı görür; kopyalama ile başka üyeye aynı şablon atanır.

---

## Bağlam

Auto-save client tarafında debounce yaparak PATCH çağrısını geciktirir — server tarafında özel mantık yok (TASK-2.03). Publish ise debounce'u atlar, direkt mutation çalıştırır. "Auto-save ve publish race" dikkat noktası: PT publish basmadan önce inflight PATCH varsa publish beklemeli veya PATCH iptal edilmeli.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Auto-save Mimarisi
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Program kaydetme UX + Program kopyalama
- `_dev/modules/M2-program-domain.md` §F2.1 Kabul Kriterleri — PT verimlilik + Kabul Kriteri: Boş şablon otomatik taslak saklanır

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. `useProgramAutoSave` Hook**
  - `apps/mobile/src/hooks/useProgramAutoSave.ts` oluştur:
    - Input: `programId: string`, `programData: ProgramDraft` (local state'teki tüm yapı)
    - Davranış: `programData` değiştikçe 1 sn debounce → `PATCH /programs/:id` mutation
    - Save state: `'idle' | 'saving' | 'saved' | 'error'`
    - `saving`: PATCH uçuşta iken
    - `saved`: PATCH başarılıysa → 3 sn sonra `idle`'a döner
    - `error`: PATCH başarısızsa → "Kaydetme hatası, tekrar dene" + manuel retry butonu
    - `cancelPendingAutoSave()` — publish öncesi inflight timer'ı iptal et

- [ ] **2. Auto-save Indicator UI**
  - `ProgramBuilderScreen.tsx`'te header bölgesine (veya footer) durum göstergesi:
    - `idle`: görünmez
    - `saving`: "⏳ Kaydediliyor..."
    - `saved`: "✓ Taslak kaydedildi"
    - `error`: "⚠️ Kaydetme hatası — Tekrar dene" (tap ile retry)

- [ ] **3. "Kaydet" Butonu (Explicit Publish)**
  - `ProgramBuilderScreen.tsx`'te sağ üst veya footer buton:
    - Tıklanınca: `cancelPendingAutoSave()` → auto-save PATCH'ı bekle (veya iptal et) → `POST /programs/:id/publish` mutation
    - Publish başarılı: "Program kaydedildi! Üye görebilir artık." toast/modal → MemberDetailScreen'e navigate (veya builder'da kal)
    - Publish başarısız: "Kaydedilemedi, tekrar dene" inline hata
    - **Draft iken:** buton text "Kaydet ve Yayınla"; **active iken:** "Güncelle" (yeniden publish)
  - `usePublishProgram()` mutation — `POST /programs/:id/publish`

- [ ] **4. "Başka Üyenin Programını Kopyala" CTA**
  - Builder header veya overflow menüsüne ekle: "Programı kopyala..."
  - Tıklanınca modal/bottom sheet: PT'nin üye listesi gösterilir (GET /trainer/members)
  - Üye seçilince: `POST /programs/:id/copy` body: `{ targetMemberId }` → başarıda "Kopyalandı! [Üye adı]'na taslak oluşturuldu" toast
  - `useCopyProgram()` mutation — `POST /programs/:id/copy`

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── hooks/useProgramAutoSave.ts         # YENİ
├── hooks/usePublishProgram.ts          # YENİ (veya useProgram.ts'e eklenir)
└── screens/ProgramBuilderScreen.tsx    # güncellendi (auto-save + publish + kopyalama CTA)
```

---

## Dikkat Noktaları

- **Race condition önlemi:** `cancelPendingAutoSave()` publish butonuna basıldığında debounce timer'ı temizler. Eğer PATCH zaten uçuştaysa, publish mutation PATCH'ın tamamlanmasını beklesin (`isLoading` kontrolü) — yoksa iki eşzamanlı mutasyon çelişebilir.
- **Debounce timer temizleme:** `useEffect` cleanup'ında `clearTimeout`; component unmount'ta da çalışsın.
- **"Üyeler" listesi kopyalama için:** `GET /trainer/members` veya mevcut Faz 1 endpoint'i kullan — kendi üyelerinin listesi. Kendisi (mevcut program sahibi üye) listede de görünebilir ama "Aynı üyeye kopyalama" anlamsız; opsiyonel olarak listeden çıkarılabilir.
- **Publish sonrası banner:** Backend'in `hasUnreadUpdate` flag'i (TASK-2.03) üye tarafında banner tetikler — TASK-2.14'te bağlanacak. Bu task'ta sadece publish başarısını handle et.
- **Draft boş program — mobile validasyon:** PT hiç egzersiz eklemeden "Kaydet" basarsa "En az 1 gün için egzersiz ekle" uyarısı göster ve publish mutation çağırma. Publish butonu tüm günler boşken disabled olabilir ya da basıldığında anlık alert verilebilir. Backend'e 422 eklemek gerekmez.

---

## Test Kriterleri

- [ ] Egzersiz eklendiğinde 1 sn sonra "Kaydediliyor..." gösterilir, ardından "Taslak kaydedildi"
- [ ] Değişiklik olmadığında PATCH çağrılmaz (debounce)
- [ ] Tüm günler boşken "Kaydet" basılınca "En az 1 egzersiz ekle" uyarısı gelir, publish çağrılmaz
- [ ] En az 1 egzersiz varken "Kaydet" basılınca POST /programs/:id/publish çağrılır
- [ ] Publish başarılı → "Program kaydedildi" toast gösterilir
- [ ] "Programı kopyala..." → üye listesi açılır → üye seçilince POST /programs/:id/copy çağrılır
- [ ] Auto-save hata → "Kaydetme hatası" gösterilir + retry çalışır
- [ ] Publish öncesi inflight auto-save PATCH iptal edilir veya beklenir
- [ ] TypeScript typecheck: 0 hata

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (conventional commits formatı)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi

---

## Oturum Kayıtları

*(Doldurulmadı — task henüz çalıştırılmadı)*

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
