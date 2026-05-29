# TASK-1.28: KVKK rıza ekranı (2 tickbox + placeholder metin)

**Durum:** ⬜ Bekliyor
**Modül:** M1 — Auth & Onboarding (`modules/M1-auth-onboarding.md`)
**Feature:** F1.1 Onboarding (Davet + Auth)
**Faz:** Phase 1 (`phases/PHASE-1.md`)
**Bağımlılıklar:** TASK-1.07, TASK-1.08 (akış sırası: TASK-1.29 OTP verify sonrası bu ekran açılır; ama kendi başına test edilebilir, akış sırası bağımlılık değil)

---

## Hedef

KVKK rıza ekranını implement et — **tek ekran, iki ayrı tickbox**: (1) "KVKK Aydınlatma Metnini okudum ve kabul ediyorum" (zorunlu, hesap açmaya engel), (2) "Sağlık verisi işlenmesine açık rızam vardır" (opsiyonel). Scroll edilebilir metin alanı (placeholder içerikli — Yakın 5'te hukuki review'lı dolacak). "Devam" butonu sadece 1. tickbox işaretliyse aktif.

---

## Bağlam

Discuss-phase: "Rıza ekranı yapısı: Tek ekran, iki ayrı tickbox", "Metin stratejisi: UI akışı (ekran + tickbox + scrolling metin alanı + 'Devam' butonu) tam kurulur. Metin alanında placeholder veya kısa örnek metin. KVKK.md Yakın 5'ten önce hukuki danışman ile doldurulur; sadece string güncellenir, mimari değişmez." Bu ekran OTP verify sonrası, yeni kullanıcılarda gösterilir (mevcut kullanıcılar bypass).

---

## Referans Dokümanlar

**Okunması Gereken:**
- `_dev/modules/M1-auth-onboarding.md` — F1.1 KVKK rızası
- `_dev/PRD/00-VISION.md` §6 (Yasal çerçeve)
- `_dev/KVKK.md` — placeholder şablon
- `_dev/QUALITY.md` §2 (KVKK + gizlilik)
- `_dev/phases/PHASE-1.md` — Kapsam Tartışması → KVKK rıza ekranı

**Güncellenmesi Gereken (Task Sonunda):**
- `_dev/DURUM.md`
- `_dev/phases/PHASE-1.md` (Task Listesi)

---

## Alt Görevler

- [ ] **1. `/auth/kvkk` ekran route**
  - `mobile/app/auth/kvkk.tsx`
  - Header: "Devam etmeden önce" + "Lütfen aşağıdaki metni okuyup onayla"
  - Scroll metin alanı (yüksek), içerik `i18n.kvkk.aydinlatma_metni` (placeholder)
  - Tickbox 1: "KVKK Aydınlatma Metnini okudum ve kabul ediyorum" (zorunlu)
  - Tickbox 2: "Sağlık verisi (ölçüm, yemek günlüğü) işlenmesine açık rızam vardır" (opsiyonel)
  - Alt metin: "Sağlık verisi rızası vermesen de hesap açabilirsin ama ölçüm ve yemek günlüğü özelliklerini kullanamazsın. Sonradan ayarlardan değiştirebilirsin."
  - "Devam" butonu — sadece tickbox 1 işaretli ise aktif
  - Dosya: `mobile/app/auth/kvkk.tsx`

- [ ] **2. Backend'e consent gönderme**
  - "Devam" → onboarding store'da `kvkkConsent: true, healthConsent: boolean` set
  - Bu task'ta backend'e gönderme YOK; profil oluşturma endpoint (`POST /auth/profile` — TASK-1.20) consent'leri payload olarak alır
  - Dosya: `mobile/app/auth/kvkk.tsx` (UPDATE)

- [ ] **3. i18n placeholder metin**
  - `mobile/src/i18n/locales/tr/kvkk.json`:
    ```json
    {
      "title": "Devam etmeden önce",
      "subtitle": "Lütfen aşağıdaki metni okuyup onayla",
      "aydinlatma_metni": "[KVKK Aydınlatma Metni — Hukuki review bekliyor. Yakın 5 öncesi yerleşecek.]\n\nBu uygulama 6698 sayılı KVKK ve KVKK Madde 6 (sağlık verisi) çerçevesinde işlenir. Detaylı metin için: alpfit.app/kvkk",
      "tickbox_kvkk": "KVKK Aydınlatma Metnini okudum ve kabul ediyorum",
      "tickbox_saglik": "Sağlık verisi (ölçüm, yemek günlüğü) işlenmesine açık rızam vardır",
      "info_optional": "Sağlık verisi rızası vermesen de hesap açabilirsin ama ölçüm ve yemek günlüğü özelliklerini kullanamazsın. Sonradan ayarlardan değiştirebilirsin.",
      "cta": "Devam"
    }
    ```
  - Dosya: `mobile/src/i18n/locales/tr/kvkk.json` (TASK-1.07 placeholder'ı doldur)

- [ ] **4. Component testleri**
  - `mobile/app/auth/kvkk.test.tsx`:
    - Tickbox 1 işaretsiz → Devam disabled
    - Tickbox 1 işaretli → Devam aktif
    - Tickbox 2 opsiyonel — durumdan bağımsız
    - Tap Devam → consent state set + navigate (profil ekranına)
    - Snapshot
  - Dosya: `mobile/app/auth/kvkk.test.tsx`

- [ ] **5. Accessibility**
  - Tickbox'lar `accessibilityRole="checkbox"` + `accessibilityState={{ checked: ... }}`
  - Metin alanı `accessibilityRole="text"` + scroll edilebilir
  - Screen reader önce tickbox label'ı okur

- [ ] **6. KVKK metin versiyonu**
  - i18n key'inde versiyon string'i de tutulur: `kvkk.text_version: "v2026-05-29-placeholder"`
  - Profil endpoint'e bu versiyon gönderilir (TASK-1.14 ConsentRecord.textVersion)
  - Dosya: `mobile/src/i18n/locales/tr/kvkk.json` (UPDATE)

---

## Etkilenen Dosyalar

```
mobile/
├── app/auth/
│   ├── kvkk.tsx                            # YENİ
│   └── kvkk.test.tsx                       # YENİ
└── src/i18n/locales/tr/
    └── kvkk.json                           # GÜNCELLE
```

---

## Dikkat Noktaları

- **Placeholder metin açık işaretli:** İçerik "[Hukuki review bekliyor]" şeklinde; geliştirme sırasında yanlışlıkla production'a gitmesin diye uyarı. Yakın 5 öncesi hukuki onayla değiştirilir.
- **Tickbox tek seferlik:** Verirken false bırakılırsa ileride toggle edilebilir (Yakın 4 öncesi ayarlar ekranında); bu task'ta sadece onboarding.
- **Yasal sorumluluk:** Mevcut placeholder metin **bağlayıcı değil**; pilot UAT (Yakın 5) öncesi gerçek metin yerleşmek zorunda. **CLAUDE.md → Kurallar:** "KVKK metnini hukuki review olmadan production'a gönderme" — manuel kontrol disiplini.
- **Backend kayıt:** Bu ekrandaki consent profil endpoint'e taşınır (TASK-1.20 `POST /auth/profile` body'sinde `kvkkConsent`, `healthConsent`). Audit: `ConsentRecord` `granted` event TASK-1.14 helper ile yazılır.

---

## Test Kriterleri

- [ ] 5 senaryo PASS
- [ ] Tickbox UI Component'i RN'de native (`Pressable` + custom render veya `@react-native-community/checkbox`)
- [ ] Snapshot snapshot.snap commit edildi
- [ ] Accessibility screen reader test (manuel)

---

## Karar Noktaları

- **Tickbox component:** `@react-native-community/checkbox` mu custom Pressable mı? → Custom Pressable + ikon (iOS Switch, Android Checkbox karışıklığı yok, sade UI).
- **Metin versiyon yönetimi:** i18n key + manuel bump? → Evet, manuel; metin değişikliği rare, çok süreçli.

---

## Tamamlanma Kriterleri

- [ ] Tüm alt görevler tamamlandı
- [ ] Tüm test kriterleri karşılandı
- [ ] Git commit & push yapıldı (`feat(TASK-1.28): add kvkk consent screen with two tickbox flow`)
- [ ] Bu doküman güncellendi (oturum kaydı)
- [ ] DURUM.md güncellendi
- [ ] PHASE-1.md task tablosu güncellendi

---

## Oturum Kayıtları

> Task çalıştırıldığında doldurulacak.

---

**Oluşturulma:** 2026-05-29 (plan-phase 1)
