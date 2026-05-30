# TASK-2.11: Mobile — Antrenman Ekranı — Egzersiz Listesi + Tik State + Video Modal

**Durum:** ⬜ Bekliyor
**Modül:** M2: Program Domain (modules/M2-program-domain.md)
**Feature:** F2.2 — Üye Program Görüntüleme + Tamamlama
**Faz:** Phase 2 (phases/PHASE-2.md)
**Bağımlılıklar:** TASK-2.10 ✅

---

## Hedef

`WorkoutScreen` implement edilir: PT'nin belirlediği egzersiz listesi (tik kutusu + ad + video butonu + set×tekrar + dinlenme + notlar), yerel tik state (üye serbest ✓/✗ atabilir), `VideoModal` (react-native-webview + YouTube iframe embed, iOS inline flags), "Antrenmanı bitir" butonu (tüm tiklendikten sonra aktif). Task sonunda üye antrenman ekranını açıp tüm egzersizleri işaretleyerek "Antrenmanı bitir" butonunu aktif hale getirebilir.

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Video Oynatma kararı (react-native-webview)
- `_dev/phases/PHASE-2.md` §Araştırma Bulguları → Dikkat Edilecekler → YouTube embed iOS
- `_dev/modules/M2-program-domain.md` §F2.2 Kabul Kriterleri — Antrenman ekranı + Video oynatma + Edge case'ler

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md` — Task durumu ve özet
- `_dev/phases/PHASE-2.md` — Task Listesi tablosunda durum ve commit güncelle

---

## Alt Görevler

- [ ] **1. `WorkoutScreen` — Temel Layout ve Egzersiz Listesi**
  - `apps/mobile/src/screens/WorkoutScreen.tsx` oluştur:
    - Route params: `programDayId`, `scheduledDate`, `isLate?` (telafi akışı için — M3 tam implement eder)
    - Header: antrenman tipi (ProgramDay.title veya "Antrenman") + tarih
    - `GET /programs/:id` sonucundan ilgili günün egzersizleri — `useQuery` veya prop olarak geçilir (MemberHomeScreen'den)
    - **Egzersiz satırı (her satır):**
      - Sol: tik kutusu (`Pressable` + checkbox UI)
      - Orta: egzersiz adı (bold üst satır) + `set×tekrar` + `dinlenme Xsn` + PT notu (muted, 2. satır)
      - Sağ: video butonu (▶ ikonu) — videoUrl yoksa hidden; videoUrl varsa `VideoModal`'ı açar
    - Sıra: PT'nin belirlediği position sırasına göre — üye değiştiremez

- [ ] **2. Yerel Tik State**
  - `WorkoutScreen`'de:
    - `checkedExercises: Set<exerciseId>` local state
    - Tik kutusuna tap: toggle (ekle/çıkar) — serbest ✓/✗
    - Checked: dolu daire veya checkmark; unchecked: boş daire/kutu
    - Tamamlanmış egzersiz satırı: slightly muted (opacity 0.7 veya renk değişimi)
    - **Tüm egzersizler tiklendi mi?** → `checkedExercises.size === exercises.length`

- [ ] **3. `VideoModal` Bileşeni (react-native-webview)**
  - `apps/mobile/src/components/VideoModal.tsx` oluştur:
    - Props: `isVisible: bool`, `videoUrl: string`, `onClose: () => void`
    - YouTube videoUrl'ini embed URL'e dönüştür:
      - `watch?v=VIDEO_ID` → `https://www.youtube.com/embed/VIDEO_ID`
      - `youtu.be/VIDEO_ID` → `https://www.youtube.com/embed/VIDEO_ID`
    - `WebView` props (iOS inline için ZORUNLU):
      - `allowsInlineMediaPlayback={true}`
      - `mediaPlaybackRequiresUserAction={false}`
      - `javaScriptEnabled={true}`
    - Modal kapsayıcı: `Modal` bileşeni ile tam ekran arka plan + sağ üst "✕" kapat butonu
    - Video bitince modal kapanmaz (üye tekrar izleyebilir)
    - **Hata durumu:** Video yüklenemedi → "Video şu an oynamıyor — PT'ne bildir" metni; `onError` prop ile
    - videoUrl yoksa bu bileşen render edilmez (ebeveyn kontrol eder)

- [ ] **4. "Antrenmanı Bitir" Butonu**
  - WorkoutScreen footer'ında:
    - **Pasif (tüm tikler tamamlanmadı):** disabled görünüm + muted metin "Tüm egzersizleri işaretle"
    - **Aktif (tümü tiklendi):** primary buton rengi + "Antrenmanı Bitir 🎉"
    - Basıldığında: TASK-2.12'de tamamlama mantığı bağlanacak; şimdilik `console.log('workout done')` placeholder + `Alert.alert('Harika iş!')` (integration test için)

- [ ] **5. Ekrana Dönme Koruması**
  - Üye yarım bırakıp geri dönerse tik state local'de kalır (`useRef` veya `useState` persist ile — sayfa unmount olmadıkça)
  - Hard back / swipe close: tik durumu kaybolmaz (state navigation stack'te)
  - M2 modül edge case: "Üye antrenman ekranını açtı ama bitirmedi → tik durumu local'de saklanır"

---

## Etkilenen Dosyalar

```
apps/mobile/src/
├── screens/WorkoutScreen.tsx       # YENİ
└── components/VideoModal.tsx       # YENİ
```

---

## Dikkat Noktaları

- **iOS inline video:** `allowsInlineMediaPlayback={true}` + `mediaPlaybackRequiresUserAction={false}` OLMADAN iOS'ta video tam ekrana geçer — bu davranış istenmiyor (PHASE-2.md Dikkat Edilecekler).
- **YouTube embed URL dönüşümü:** `videoUrl` "watch?v=" veya "youtu.be/" formatında gelebilir — her ikisini de `embed/` URL'ine çeviren util fonksiyon yaz. Geçersiz format: VideoModal render edilmez (▶ butonu hidden).
- **Tik state persistence (sayfa içi):** React Navigation stack'inde sayfa mount kaldığı sürece tik state kaybolmaz. Kullanıcı ana ekrana gitsin geri gelsin — `BackHandler` kullanımı yoksa sayfa stack'te kalır. Eğer sayfa pop edilirse tik state sıfırlanır (M2 spec: "Antrenmanı bitir basıldıktan sonra geri alınamaz" — ama tamamlanmadan çıkıp geri gelme için tik korunmalı).
- **"Antrenmanı bitir" bir kez:** TASK-2.12'de tamamlama sonrası buton disabled/hidden + navigasyon. Bu task'ta sadece placeholder.
- **Egzersiz sırası:** ProgramDayExercise.position ile sırala — PT order'ı.

---

## Test Kriterleri

- [ ] WorkoutScreen egzersiz listesini doğru sırada gösterir
- [ ] Tik kutusuna tap: exercise toggle olur (tekrar tap: undo)
- [ ] Tümü tiklenmeden "Antrenmanı Bitir" butonu disabled
- [ ] Tümü tiklendikten sonra buton aktif ve basılabilir
- [ ] ▶ butonuna basılınca VideoModal açılır
- [ ] VideoModal: webview doğru embed URL ile yüklenir
- [ ] iOS flags set edilmiş (`allowsInlineMediaPlayback`, `mediaPlaybackRequiresUserAction`)
- [ ] VideoUrl yoksa ▶ butonu görünmez
- [ ] VideoModal "✕" ile kapanır; video durur
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
