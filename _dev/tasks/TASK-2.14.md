# TASK-2.14: Mobile — Program Değişikliği Banner (banner-store Entegrasyonu)

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama (program değişiklik bildirimi)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.03 ✅, TASK-2.10 ✅

---

## Hedef

PT bir programı publish ettiğinde üyenin ana ekranında nötr in-app banner gösterilir: "ℹ️ Programında güncelleme var". Mevcut M1'den gelen `banner-store`'a `program_changed` event tipi eklenir; publish response'ındaki `bannerEvent` işlenerek banner tetiklenir. Task sonunda PT programı kaydettiğinde üye bir sonraki açılışta banneri görür (bir kez gösterilir, kapatılabilir) — M4 olmadan push yok, sadece in-app.

---

## Bağlam

M1 fazında davet kabul banner'ı için `banner-store` (Zustand veya AsyncStorage tabanlı) kurulmuştu. Bu task aynı store'a `program_changed` event tipini ekler — M4 fazında bu event push'a yükseltilecek, değişiklik minimum olacak şekilde yazılmalı.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Program değişikliği bildirimi (M4 yokken)
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Dikkat Edilecekler → Program değişikliği banner (M4 yokken): banner-store kullanılır, M4'te push'a yükseltilir
- `_dev/modules/M2-program-domain.md` §F2.2 Kabul Kriterleri — Program değişiklik bildirimi
- Faz 1 task dokümanları veya kaynak kod: mevcut banner-store implementasyonu (ne kullanıldığını anla)

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. Mevcut banner-store'u İncele**
  - Faz 1'de kurulan banner-store'u bul (Zustand store, AsyncStorage veya Context)
  - Mevcut event tipleri ve banner dismiss mantığını anla
  - M4 uyumlu genişleme için arayüzü anla (event tip eklemek bir satır mı, yoksa büyük değişiklik mi?)

- [ ] **2. `program_changed` Event Tipi Ekle**
  - banner-store'a yeni event tipi ekle:
    - `type: 'program_changed'`
    - `payload?: { programId: string }` (opsiyonel — gelecekte detay için)
    - Mevcut dismiss logic korunur (kullanıcı banneri kapattı → bir daha gösterilmez — programId bazında persist)

- [ ] **3. Publish Response'ı Banner'a Bağla**
  - `useProgramAutoSave.ts` veya `usePublishProgram` hook'undan:
    - Publish başarısı → response body: `{ bannerEvent: 'program_changed' }`
    - Bu field varsa: `bannerStore.addBanner({ type: 'program_changed', programId })` çağır
  - **Üye tarafında tetikleme neden backend tarafına bağlı?**
    - PT publish eder → backend response → PT'nin cihazı banner store'a yazar? Hayır — bu mantıklı değil.
    - Doğru akış: Üye `GET /me/program` çektiğinde `program.updatedAt` veya `publishedAt` değişmişse → banner tetikle.
    - Implementasyon: `useMyActiveProgram` hook'unda `onSuccess` callback — önceki cache'deki `publishedAt` ile yeni `publishedAt` karşılaştır; değiştiyse banner ekle.
    - Alternatifte: backend `GET /me/program` response'ına `hasUnreadUpdate: boolean` flag eklenebilir — basit ve temiz. Tercih et.

- [ ] **4. Banner UI — MemberHomeScreen**
  - `MemberHomeScreen.tsx`'teki banner stack alanını aktif et (TASK-2.10'da placeholder bırakılmıştı):
    - `program_changed` banner var mı? → "ℹ️ Programında güncelleme var" nötr banner göster
    - Banner: solda info ikonu + metin; sağda ✕ kapat butonu
    - Kapatılınca: banner store'dan kaldır (o programId için dismiss set et) + bir daha gösterilmez
    - Renkler: nötr — mavi veya gri-mavi arka plan (M3'teki telafi banner'ı turuncu, comeback banner'ı farklı renkte olacak — bu nötr)

- [ ] **5. Backend — `hasUnreadUpdate` Flag (tercih 3b'de karar verildiyse)**
  - `GET /me/program` response'ına `hasUnreadUpdate: boolean` ekle:
    - Program'ın `publishedAt` veya `updatedAt`'ini üyenin son görüntüleme zamanıyla karşılaştır
    - Alternatif basit: son `publishedAt`'ten üyenin son `WorkoutCompletion.completedAt` tarihini çıkar — eğer son completion'dan sonra program güncellenmiş ise `true`
    - Daha da basit: `program.publishedAt` client'ta localStorage'da saklanır; değişirse banner
  - Bu alt görev implementasyon kararına göre değişir — en basit olanı seç, not bırak

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── stores/bannerStore.ts           # güncellendi (program_changed event tipi eklendi)
├── hooks/useMemberHome.ts          # güncellendi (banner tetikleme mantığı)
└── screens/MemberHomeScreen.tsx    # güncellendi (banner stack aktif)

apps/backend/src/
└── routes/programs.ts              # güncellendi (hasUnreadUpdate flag — opsiyonel)
```

---

## Dikkat Noktaları

- **M4 uyumlu tasarım:** Banner store event tipleri (`program_changed`, `invitation_accepted`) M4'te push notification'a yükseltilecek. Store arayüzü: `addBanner(event)` ve `dismissBanner(programId)` — M4 sadece trigger noktasını değiştiriyor (banner-store yerine push payload), UI aynı kalıyor.
- **Bir kez gösterilir:** Banner programId bazında persist (AsyncStorage). Aynı programın ikinci publish'i → banner tekrar gösterilir (yeni publish = yeni güncelleme). dismiss kaydı: `{ [programId]: dismissedAt }`.
- **Antrenman ekranındaki "yeni" rozeti:** M2 modül spec'inde belirtilmiş ("değişen egzersizin yanında 'yeni' rozeti — ilk açılışta") — pilot MVP skor hesabına göre opsiyonel. UAT'ta sürpriz çıkmaması için şimdi TODO yorum bırak, `// TODO: TASK-M3+ yeni rozeti`.
- **Banner stack sırası:** M3'te telafi banner + comeback banner eklenecek. Şimdi tek banner tipi. Banner stack mantığı: telafi > comeback > program_changed (öncelik). Bu öncelik M5'te tam implement edilir.

---

## Test Kriterleri

- [ ] banner-store'a `program_changed` event eklenebilir
- [ ] Event eklenince MemberHomeScreen'de banner görünür
- [ ] Banner ✕ ile kapatılınca bir daha gösterilmez (aynı oturumda veya app yeniden açılınca)
- [ ] Program yeniden publish edilince banner tekrar gösterilir
- [ ] Banner dismiss edilince WeeklyBand veya BUGÜN kartı etkilenmez
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
