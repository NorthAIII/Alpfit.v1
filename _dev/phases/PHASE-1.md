# Phase 1: Çekirdek altyapı + Auth (M0 + M1)

**Durum:** 🔄 Devam ediyor

---

## Genel Bilgiler

**Amaç:** Alpfit'in temel altyapısını (M0 — repo iskeleti, env/secret, 3 rol veri modeli, KVKK çerçevesi, test, CI/CD, observability, TR locale) ve üyenin/PT'nin sisteme ilk giriş akışını (M1 — davet linki + telefon + SMS OTP + KVKK rızası + 30 gün cihaz hatırlama) uçtan uca ayağa kaldırmak. Faz sonunda hem altyapı çekirdeği hem F1.1 davranışı çalışır halde — sonraki fazlar bu zeminin üstüne kurulur.

**Milestone:**
- PT ve üye telefon + mock SMS OTP ile hesap açabilir
- PT davet linki üretebilir (alpfit.app/davet/{kod}); üye linkten gelip otomatik PT'ye bağlanır
- KVKK aydınlatma + sağlık verisi açık rıza ekranı (placeholder metin) çalışır
- Davet kabul edildiğinde PT'ye in-app banner + liste güncellemesi
- 30 gün cihaz hatırlama mekanizması ayakta
- Backend unit + integration test altyapısı kurulu, CI'da yeşil çalışıyor
- Mobile component test altyapısı kurulu
- Lint + format + type check toolchain PR'da çalışıyor
- main branch → staging environment'a otomatik deploy ediyor
- Backend error tracking + mobile crash reporting kurulu
- 3 rol veri modeli (Member + Trainer + Gym Owner) DB'de yerleşmiş; Gym Owner v1'de UI'da görünmez ama model destekler
- TR locale temeli (i18n shell, telefon/tarih formatları, TR karakter desteği) kurulu

### Feature Listesi

| Feature | Modül | Açıklama |
|---------|-------|----------|
| M0 cross-cutting | M0 | Repo iskeleti + env/secret + 3 rol veri modeli + KVKK çerçevesi + test altyapısı + CI/CD + observability + TR locale |
| F1.1: Onboarding (Davet + Auth) | M1 | PT davet linki + üye SMS OTP (mock) + KVKK rızası + 30 gün cihaz hatırlama + PT-üye ilişki yönetimi |

---

## Kapsam Tartışması

> Bu bölüm `/devflow:discuss-phase 1` oturumunda (2026-05-29) dolduruldu.

### Alınan Kararlar

**Faz Kapsamı (Grup A):**
- **Faz boyutu:** M0 tam + M1 tam — birleşik faz. Gerekçe: §En Yüksek Öncelikli Eksen #2 "PT günlük iş akışı sürtünmesizliği" milestone'unun test edilebilir olması için üyenin gerçekten hesap açabilmesi şart. M0 tek başına soyut milestone üretir; M1'i ayrı bölmek §Kalıcılık (test/CI baştan kümülatif) ihlali olur.
- **SMS OTP:** Sandbox/mock — geliştirme sürecinde mock SMS provider, kod sabit veya log'a yazılır. Gerçek SMS provider entegrasyonu Yakın 5 (UAT + Pilot) öncesi. Gerekçe: TECH-STACK research-phase'de provider seçilir; bu faz onu beklemez. Brute force ve edge case testleri rahat.
- **Davet kabul push:** Bu fazda push altyapısı yok. PT'ye davet kabulü sadece in-app banner (uygulama açıkken) + "Bekleyen davetler" liste güncellemesi. APNs/FCM push altyapısı M4 fazına ertelenir. Gerekçe: Push altyapısı (token, sessiz saat, deep link payload) M4'ün kalbi — burada parça parça kurmak M4'ü yarım bırakır + faz çok büyür.

**KVKK + Yasal (Grup B):**
- **Rıza ekranı yapısı:** Tek ekran, iki ayrı tickbox — (1) "KVKK Aydınlatma Metnini okudum" (zorunlu, hesap açmaya engel), (2) "Sağlık verisi işlenmesine açık rızam vardır" (opsiyonel — işaretlemezse hesap açılır ama Yakın 4'te ölçüm/yemek günlüğü kullanamaz; toggle ile sonradan açabilir). Gerekçe: KVKK Madde 6 özel nitelikli veriler için ayrı açık rıza zorunlu. §Kalıcılık: şimdi mimari kurulduğundan Yakın 4'te migration olmaz.
- **Metin stratejisi:** UI akışı (ekran + tickbox + scrolling metin alanı + "Devam" butonu) tam kurulur. Metin alanında placeholder ("[KVKK metni hukuki review bekliyor — Yakın 5 öncesi yerleşecek]") veya kısa örnek metin. KVKK.md Yakın 5'ten önce hukuki danışman ile doldurulur; sadece string güncellenir, mimari değişmez. Pilot'a (Yakın 5 sonu) gerçek metin yetişmesi şart.

**Test / CI/CD / Observability (Grup C):**
- **Test stratejisi:** Backend unit (saf fonksiyonlar) + integration (DB ile, gerçek migration'lar üzerinde). Mobile component test (UI elemanları izole) + smoke test (3-5 kritik akış: SMS OTP girme, davet linki açma). E2E (uygulama tam uçtan uca) Yakın 5'te. Test DB ayrı, gerçek üye verisiyle test edilmez (KVKK). CI'da her PR'da çalışır.
- **CI/CD:** Tam — her PR'da test + lint + type check otomatik (kırıksa merge bloke). main branch → staging environment'a otomatik deploy. Production branch → manuel onayla deploy. App store build pipeline iskeleti (açık script'ler), gerçek build Yakın 5'te.
- **Observability:** Backend error tracking servisi (Sentry vb. — TECH-STACK research-phase'de karar) + mobile crash reporting (Crashlytics vb.). Log seviyeleri (debug/info/warn/error), production'da debug kapalı. KVKK uyumu: log'lara üye sağlık verisi YAZILMAZ (sadece event tip + üye ID hash).

**Altyapı / Operasyonel (Grup D):**
- **Repo yapısı:** Monorepo — tek repo (Alpfit.v1) içinde `mobile/` ve `backend/` klasörleri. Gerekçe: tek geliştirici (kurucu) için atomic PR'lar, paylaşılan tip tanımları, tek CI konfigi. v2'de ekip büyürse poly-repo'ya bölünür.
- **Domain:** Geliştirmede staging subdomain (örn. staging.alpfit.app veya hosting platform default URL'si), prod domain (alpfit.app) Yakın 5 öncesi alınır/yapılandırılır. Bu fazda env-bazlı BASE_URL ile çözülür. Deep link (Universal Link + App Link) konfigürasyonu domain'e bağlı — prod domain Yakın 5'te test edilir.
- **App store hesapları:** Kapsam dışı — Yakın 5 (UAT + Pilot) öncesi açılır. Bu fazda mobile geliştirme simulator/emulator + dev cihazlarla yapılır.
- **Davet linki 30 gün iptal:** Lazy-check — davet link'e tıklandığında backend `expires_at < now()` kontrolü yapar; "Bekleyen davetler" liste sorgusunda da aynı kontrol. Cron/scheduled job gerekmez. En basit, en sağlam.

**Sahipsiz Alanlar (Grup E):**
- **First PT (kurucu kardeş) onboarding:** Standart akış — kardeş de diğer PT'ler gibi açılışta "PT" butonuna basar, telefon + mock SMS OTP + profil ile açar. Avantaj: ayrı admin/seed akışı yok; kardeşin akışı gerçek kullanıcı deneyimini doğrular.
- **Auth token mekanizması:** Yön kararı — stateless JWT + refresh token mekanizması bazında gidilir (mobile-native pattern). Detay (kütüphane, JWT türü, expiry süreleri, refresh token rotation politikası) research-phase'de TECH-STACK kararıyla beraber netleşir.
- **PT üye çıkarma — veri akıbeti:** Soft delete + 30 gün saklama. User row korunur, `pt_member_relation` tablosu `ended_at` ile işaretlenir. Üyenin geçmiş tamamlamaları/programı arşivlenir. KVKK rızası aktif kaldıkça veri 30 gün saklanır; rıza geri çekilirse veya 30 gün dolarsa otomatik silinir. Üye app'i açabilir, "PT'nle ilişkin sonlandı" uyarısı görür; yeni program almaz. v1'de başka PT'ye geçiş yok.
- **PT "Üyeler" sekmesi UI:** Tek scrollable liste, iki başlık altında — üstte "Bekleyen davetler (varsa)", altta "Aktif üyeler". Bekleyen üstte çünkü PT'nin aksiyona ihtiyacı olabilir (linki tekrar paylaş, iptal et). Aktif üye yoksa boş durum CTA: "İlk üyeni davet et →".

### Kullanıcı Tercihleri

- **Mock SMS:** Geliştirme + CI ortamında SMS gönderilmez. Test telefonlarına sabit kod (örn. `482931`) veya log'a yazılan kod kabul edilir. Provider entegrasyonu detayı plan-phase'de netleşir.
- **PT için "spor salonu" ve "sertifika notu":** Profil ekranında opsiyonel alanlar olarak görünür; boş bırakılabilir. v1'de PT doğrulama yok (PRD'de net), bu alanlar sadece bilgilendirici.
- **3 rol veri modeli — Gym Owner slot:** Veri modeli ve auth katmanı Gym Owner rolü için baştan hazır (enum + ilişki tabloları boş ama tanımlı). UI'da Gym Owner görünmez. v1.5+/v2'de sadece UI eklenir, model migration olmaz.

### Kapsam Dışı

Bu fazda **yapılmayacak** ama net olarak hatırlamak gereken konular:

- **Gerçek SMS provider entegrasyonu** — Yakın 5 (TECH-STACK research-phase'inden sonra; sandbox kalır)
- **APNs / FCM push bildirim altyapısı** — M4 fazı (sürdürülebilirlik motoru + bildirim)
- **Prod domain (alpfit.app) satın alma + yapılandırma** — Yakın 5 öncesi
- **Apple Developer + Google Play hesapları** — Yakın 5 öncesi
- **E2E (mobile uçtan uca) testler** — Yakın 5
- **KVKK metninin gerçek hali (hukuki danışman onaylı)** — Yakın 5 öncesi (placeholder ile akış kuruldu)
- **M0'da cron / scheduled job altyapısı** — bu fazda gerek yok (lazy-check); ileride bir feature ihtiyaç duyarsa eklenir
- **Auth token detay (kütüphane seçimi, JWT türü, expiry kararları)** — research-phase
- **Üye telefon değiştirme akışı** — v1.5 adayı, yok
- **Üye PT değiştirme akışı** — PRD'de zaten v1.5 adayı, yok
- **PT abonelik / ücretlendirme** — PRD'de v1.5 öncesi netleşecek; auth flow plan-bilinçsiz kurulur
- **PT doğrulama (sertifika upload, spor salonu onayı, manuel inceleme)** — v1.5 adayı, yok
- **Üye profil fotoğrafı upload backend altyapısı** — F1.1 PRD'de "opsiyonel"; bu fazda file upload backend kurulmaz, sadece UI'da alan görünür ama yüklenmesi v1.5'e ertelenir (plan-phase'de teyit edilecek)
- **TR dışı telefon numarası desteği** — v2 adayı, sadece +90 kabul
- **Üye sayfasından "tüm cihazlardan çıkış" akışı** — F1.1 PRD'de var, ama plan-phase'de task seviyesinde değerlendirilecek (kapsamda; sadece UI/UX detayı)

---

## Araştırma Bulguları

> Bu bölüm `/devflow:research-phase 1` oturumunda doldurulacak. Faz 1'in en kritik teknik kararı: **TECH-STACK.md** içeriği (mobile + backend + DB + SMS provider + push provider + hosting). Bu kararlar bu fazda alınır ve sonraki tüm fazlar bu zeminin üstüne kurulur.

---

## Task Listesi

> Bu bölüm `/devflow:plan-phase 1` oturumunda doldurulacak.

| # | Task | Durum | Açıklama |
|---|------|-------|----------|

**Durum simgeleri:** ⬜ Bekliyor | 🔄 Devam ediyor | ⏸️ Duraklatıldı | ✅ Tamamlandı | 🔴 Bloke | ❌ İptal

---

## UAT Sonuçları

> Bu bölüm `/devflow:verify-phase 1` oturumunda doldurulacak.

---

## Retrospektif

> Bu bölüm `/devflow:review-phase 1` oturumunda doldurulacak.

---

## Kalite Kontrol Sonuçları

> Bu bölüm `/devflow:review-phase 1` oturumunda doldurulacak.

---

## Sonuç

- **Tamamlanma Tarihi:** —
- **Toplam Task:** — (plan-phase'de belirlenecek)
- **Notlar:** —

---

**Oluşturulma:** 2026-05-29 (discuss-phase 1)
**Son Güncelleme:** 2026-05-29 — discuss-phase 1 tamamlandı; kapsam tartışması yazıldı, 14 gri alan + 4 sahipsiz alan kararı kaydedildi.
