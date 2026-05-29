# M0: Çekirdek Altyapı

**Sorumluluk:** Tüm modüllerin üstüne kurulduğu temel — repo iskeleti, env/secret yönetimi, 3 rol veri modeli (Member + Trainer + Gym Owner ready), test altyapısı, CI/CD, observability, KVKK çerçevesi ve TR locale temeli.
**Bağımlılık:** Yok — diğer tüm modüllerin temeli.
**Sınır:** Cross-cutting altyapı modülü; **kendi başına son-kullanıcı feature'ı taşımaz** (kullanıcı arayüzünde bir şey görünmez). Diğer modüller bu modülün üstüne kurulur. Mobile + backend stack seçimi `TECH-STACK.md`'de kararlaştırılır; bu modül seçilen stack'i kurar.

---

## Sorumluluk Alanları

M0 herhangi bir PRD feature'ına bire-bir denk gelmez. Sorumluluk alanları:

### 1. Repo İskeleti & Build
- Mobile + backend monorepo / poly-repo kararı (TECH-STACK'te)
- Lint + format + type check toolchain
- Branch + commit convention (DevFlow zaten tanımlı — TASKS-README'ye uyum)
- Local dev environment (devcontainer mevcut — `.devcontainer/`)

### 2. Env & Secret Yönetimi
**Kabul Kriteri:** [[ilkeler]] §"Sır ve konfigürasyon yönetimi" — secret'lar koda gömülmez; aynı kod her ortamda farklı değerlerle çalışır.
- `.env` şablonu (production secret'ları repo'ya commit edilmez)
- Environment seti: local, staging, production
- Secret'lar: SMS provider API key, FCM server key, APNs sertifikası, DB connection, JWT secret, observability key

### 3. 3 Rol Veri Modeli (KRİTİK — Pazarlık Konusu Olmayan)
**Kabul Kriteri:** [[ilkeler]] §Pazarlık Konusu Olmayanlar §1 — veri modeli ve auth katmanı **Member + Trainer + Gym Owner** üç rolü ilk günden destekler. v1 ekranlarında sadece Member + Trainer görünür, ama "Gym Owner sonradan üstüne eklenir" — "baştan yazılmaz."

**Davranış:**
- User tablosu rol field'i içerir (enum: `member`, `trainer`, `gym_owner`)
- Auth katmanı 3 rolü ayrı flow olarak ele alır (M1'de implement edilir, model M0'da)
- Gym Owner ↔ Trainer ↔ Member ilişki tabloları **şimdiden tanımlanır** (v1'de boş, v1.5+ kullanılır)
- "Diyetisyen 4. rolü" eklenmez — [[ilkeler]] §Pazarlık Konusu Olmayanlar §1; veri modelinde slot bırakılmaz

**Edge Case'ler:**
- Aynı telefon iki farklı rolde hesap açabilir mi? F1.1'deki kural: bir hesap aynı anda iki rolde olamaz, ayrı hesap açması gerekir (S5 senaryosu §03'te).
- v1'de gym_owner rolü hesap açamaz (UI'da yok), ama veri modeli izin verir.

### 4. KVKK Çerçevesi
**Kabul Kriteri:** [[ilkeler]] §En Yüksek Öncelikli Eksen — sağlık verisi gizliliği baştan kurulu olmalı (sonradan migration çok ağrılı).

**Davranış:**
- KVKK aydınlatma metni `KVKK.md`'de tutulur (boş şablon; Yakın 4 öncesi hukuki review'lı doldurulur)
- Açık rıza onboarding akışında verilir (M1 implement eder, model M0'da)
- Sağlık verisi (ölçüm + yemek günlüğü) için ayrı consent field
- Üye self-silme (KVKK hak) endpoint'i — F6.1 + F6.2 buna bağlı
- Saklama süresi: üye hesabı aktif olduğu sürece; rıza geri çekilirse 30 gün içinde silinir (audit log + delete job)

**Edge Case:** Üye rıza vermeden hesap açmaya çalışırsa → hesap açılmaz. Rızayı sonradan geri çekerse → 30 gün sonra tüm sağlık verileri silinir, hesap kalır (KVKK temel çerçevesi).

### 5. TR Locale Temeli
**Kabul Kriteri:** TR yerelleştirme baştan kurulu (i18n shell, +90 telefon formatı, TR tarih/saat, TR yemek/kültür referans alanları).

**Davranış:**
- i18n framework kurulu (mobile + backend metinler için)
- v1'de tek dil (TR), ama yapı v2 EN/global açılım için hazır kalır ([[ilkeler]] §Proje Ufku — global açılım bilinçli karar olmadan yapılmaz, ama yapı izin verir)
- TR tarih (dd MMM yyyy — "29 Mayıs 2026"), saat (24 saat), telefon (+90 5XX XXX XX XX) format'ları utility olarak kurulu
- TR karakter (ş, ğ, ı, ç) tüm katmanlarda doğru handle edilir (DB charset, API encoding, mobile font)

### 6. Test Altyapısı
**Kabul Kriteri:** [[ilkeler]] §"Kümülatif test altyapısı" — test atlanmaz, her yeni yetenek kendi güvencesini de getirir.

**Davranış:**
- Backend: unit + integration test framework
- Mobile: unit + component test framework + (Yakın 5'te) E2E
- Test DB / mock yapısı (KVKK ihlali olmaması için: gerçek üye verisi ile test edilmez)
- CI'da her PR'da testler çalışır; kırıksa merge bloke

### 7. CI/CD
- PR'da otomatik test + lint + type check
- Staging branch → otomatik staging deploy
- Production branch → manuel onayla production deploy (v1 pilot için kardeş erişimi)
- App store build pipeline (Yakın 5'te canlı, M0'da iskelet)

### 8. Observability
**Kabul Kriteri:** Beklenmeyen hatalar loglanır (QUALITY §Hata Yönetimi).
- Backend error tracking (Sentry vb.)
- Mobile crash reporting (Crashlytics vb.)
- Log seviyeleri (debug, info, warn, error) — production'da debug kapalı
- KVKK uyumu: log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash)

---

## Feature'lar

M0'da PRD feature yok — cross-cutting altyapı. Diğer modüller bu altyapı üzerine kurulur.

---

## Teknik Notlar

- **Mobile + backend stack kararı `TECH-STACK.md`'de**. Bu modül stack seçildikten sonra **Yakın 1 ilk task'i** olarak kurulur.
- M0 [[ilkeler]] §"Kalıcılık önceliği" + §"Kümülatif test altyapısı" + §"Sır ve konfigürasyon yönetimi" temellerini somutlaştırır — bu nedenle ayrı modül.
- 3 rol veri modeli **bilinçli teknik borç**: v1'de gym_owner kullanılmaz ama model şimdiden taşır. Sonradan migration > 3 rol mimari kararı = pazarlık konusu değil ([[ilkeler]] §Pazarlık Konusu Olmayanlar §1).
- **PRD Referans:** Bu modül feature'lara bağlı değil — tüm feature'ların altyapı omurgası. KVKK çerçevesi için F6.1 + F6.2; 3 rol mimarisi için [[00-vision]] §5.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: M0 sorumluluk haritası 8 alana bölündü, feature taşımaz.
