# TASK-2.07: Mobile — Program Builder Giriş Noktası + Şablon Çatısı + Gün Sekmeleri

**Durum:** ✅ Tamamlandı
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.1 — Program Builder (PT)
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.03 ✅, TASK-2.05 ✅

---

## Hedef

PT'nin mevcut "Üyeler" sekmesindeki üye satırına tıklamasıyla açılan `MemberDetailScreen` (ad, telefon son 4, katılım tarihi + "Program yaz" butonu) ve üyenin mevcut aktif programını yükleyen `ProgramBuilderScreen` temel layout'u (yatay kaydırmalı 7 gün sekme + aktif gün highlight) implement edilir. Task sonunda PT, üye listesinden bir üyeye tap yapıp "Program yaz" butonuna basarak builder ekranını açabilir; programın taslağı oluşturulur (POST /programs) ve 7 günlük gün sekmeleri görünür.

---

## Bağlam

M5 (PT Dashboard) Faz 5'te yapılacak — bu fazda geçici giriş noktası olarak üye satırına tap = mini-detay sayfası mantığı kullanılıyor. Bu "mini-detay" M5'te tam üye detay ekranına dönüşecek; şimdi yazılan navigasyon ve builder başlatma mantığı sağlam kalacak şekilde yazılmalı.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Builder giriş noktası kararı (M5 yokken)
- `_dev/phases/PHASE-2.md` §Kapsam Tartışması → Builder UI layout (gün sekmeleri kararı)
- `_dev/modules/M2-program-domain.md` §F2.1 Kabul Kriterleri — haftalık şablon yapısı

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [x] **1. MemberDetailScreen — Üye Mini-Detay Sayfası**
  - `apps/mobile/src/screens/MemberDetailScreen.tsx` oluştur:
    - Props/route params: `memberId`
    - API: `GET /members/:memberId` — mevcut Faz 1 endpoint'i kullan (ad, telefon son 4, katılım tarihi)
    - UI:
      - Üstte: üye adı (büyük), katılım tarihi ("Üye oldu: 15 Mayıs 2026")
      - Telefon: "05** *** **XX" formatı (gizlenmiş)
      - "Program yaz" butonu — tıklayınca ProgramBuilderScreen'e navigate et
      - Eğer aktif program varsa: "Mevcut programı düzenle" butonu + "Yeni program yaz" (mevcut arşivlenir)
    - Navigation: mevcut "Üyeler" sekmesi listesindeki üye satırının `onPress` → MemberDetailScreen

- [x] **2. `useProgram` ve `useCreateProgram` Hook'ları**
  - `apps/mobile/src/hooks/useProgram.ts` oluştur:
    - `useTrainerMemberProgram(memberId)` — `GET /members/:memberId/program` query; `staleTime: 30s` (PT view için taze tutulur)
    - `useCreateProgram()` mutation — `POST /programs`; başarıda ProgramBuilderScreen navigate (yeni programId ile)

- [x] **3. ProgramBuilderScreen — Temel Layout + Gün Sekmeleri**
  - `apps/mobile/src/screens/ProgramBuilderScreen.tsx` oluştur:
    - Route params: `programId`, `memberId`
    - Header: "Program Düzenle — [Üye Adı]"; back butonu ile MemberDetailScreen'e döner
    - **Gün sekmeleri (üstte yatay kaydırmalı):**
      - `FlatList horizontal` — 7 item: "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"
      - Aktif gün highlight (arka plan rengi + bold text)
      - İlk render'da bugünün günü aktif (0=Pzt..6=Paz); `getDay()` ile hesapla (Pazar=0 → 6, Pazartesi=1 → 0)
      - Sekmeye tıklayınca o gün aktif olur
    - **Gün içerik alanı (sekmenin altında):**
      - Aktif günün egzersizleri — şimdilik boş state ("Bugün egzersiz yok — + ile ekle")
      - "+" butonu — TASK-2.08'de ExerciseSearchBottomSheet bağlanacak
    - **Durum göstergesi:** "Taslak" / "Yayında" badge (program.status'a göre)
    - **"Kaydet" butonu** (sağ üst veya footer) — TASK-2.09'da publish mantığı eklenecek; şimdilik placeholder

- [x] **4. Navigasyon bağlantısı**
  - "Üyeler" sekmesindeki her üye satırına `onPress` → `MemberDetailScreen` navigate
  - `MemberDetailScreen`'deki "Program yaz" → `useCreateProgram()` mutation → başarıda `ProgramBuilderScreen` navigate (`programId` ile)
  - `ProgramBuilderScreen`'deki back butonu → `MemberDetailScreen`'e dön

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── screens/MemberDetailScreen.tsx      # YENİ
├── screens/ProgramBuilderScreen.tsx    # YENİ
└── hooks/useProgram.ts                 # YENİ
```

---

## Dikkat Noktaları

- **Bugünün günü hesabı:** JS `new Date().getDay()` Pazar=0, Pazartesi=1...Cumartesi=6. Alpfit'teki `dayOfWeek` Pazartesi=0 — dönüşüm gerekli: `(jsDay + 6) % 7`.
- **"Program yaz" vs "Mevcut programı düzenle":** Mevcut aktif program varsa → builder mevcut programı yükler (POST değil, var olan programId ile navigate); yoksa → POST /programs çağrısı. Bu mantık `MemberDetailScreen`'de `useTrainerMemberProgram` sonucuna göre ayrışır.
- **Navigation stack:** Faz 1'de kurulan React Navigation veya Expo Router yapısını bozma. Stack navigator kullanılıyorsa `navigation.push('ProgramBuilder', { programId, memberId })` ile git.
- **ProgramBuilderScreen veri yüklemesi:** `programId` ile `GET /programs/:id` — TASK-2.03 sonrası aktif. Bu task'ta sadece programId'yi state'e al; tam veri yüklemesi TASK-2.08'de bağlanır.

---

## Test Kriterleri

- [x] "Üyeler" sekmesinde üye satırına tıklanınca MemberDetailScreen açılır
- [x] MemberDetailScreen üye adı, katılım tarihi gösteriyor
- [x] "Program yaz" butonuna basılınca POST /programs çağrılır → ProgramBuilderScreen açılır
- [x] ProgramBuilderScreen'de 7 gün sekmesi görünür ve kaydırılabilir
- [x] Sekmeye tıklayınca aktif gün değişir (highlight)
- [x] Back butonu MemberDetailScreen'e döner
- [x] TypeScript typecheck: 0 hata

---

## Tamamlanma Kriterleri

- [x] Tüm alt görevler tamamlandı
- [x] Tüm test kriterleri karşılandı
- [x] Git commit & push yapıldı (conventional commits formatı)
- [x] Bu doküman güncellendi (oturum kaydı)
- [x] DURUM.md güncellendi

---

## Oturum Kayıtları

### Oturum 2026-05-30
**Durum:** ✅ Tamamlandı

**Yapılanlar:**
- `mobile/src/api/programs.ts`: `fetchMemberActiveProgram` (GET /members/:memberId/program, 404 → null) + `createProgram` (POST /programs) API fonksiyonları.
- `mobile/src/hooks/useProgram.ts`: `useTrainerMemberProgram(memberId)` (staleTime 30s) + `useCreateProgram({memberId, onSuccess})` mutation hook'ları.
- `mobile/app/member/[memberId].tsx` (MemberDetailScreen): Üye adı + katılım tarihi; aktif program varsa "Mevcut programı düzenle" + "Yeni program yaz", yoksa "Program yaz" CTA'sı. Üye verisi params üzerinden geliyor (ek API çağrısı yok).
- `mobile/app/program/[programId].tsx` (ProgramBuilderScreen): Header (üye adı + "Taslak" badge), yatay kaydırmalı 7 gün sekmeleri (FlatList horizontal, today highlight), boş gün içeriği + "+" FAB, "Kaydet" placeholder.
- `mobile/app/(tabs)/members.tsx`: Üye satırı `View` → `Pressable`, `useRouter` import, `onPress` navigasyonu (`/member/:id?firstName=...`).
- Test dosyaları: `[memberId].test.tsx` (7 test), `[programId].test.tsx` (6 test) — 138 toplam, 0 hata.
- `router.d.ts` manuel güncellendi: `/member/[memberId]` + `/program/[programId]` rotaları eklendi (expo export sonrası auto-regenerate edilecek).

**Not:** Backend'de `GET /members/:memberId` endpoint'i yok (sadece liste var). MemberDetailScreen üye verilerini navigasyon params üzerinden alıyor — task kapsamında yeterli; M5'te PT Dashboard üye detay ekranı tam API'yi getirecek. Üye telefon numarası backend trainer view'ında dönmediği için gösterilmedi.

---

**Oluşturulma:** 2026-05-30 (plan-phase 2)
