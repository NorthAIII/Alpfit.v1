# TECH-STACK — Teknik Mimari Kararları

**Amaç:** Mobile / Backend / DB / SMS / Push / Hosting tüm teknik seçimleri tek yerde tutmak. Kararlar burada damgalanır, gerekçesi yazılır. Gelecekte "neden X seçildi?" sorusu burada cevaplanır.
**Ne zaman doldurulur:** Bu doküman **boş şablon olarak** kickoff-docs'ta açıldı. İçerik **Yakın 1 (Çekirdek altyapı + Auth) fazına girmeden önce** `/devflow:research-phase` ile araştırılarak doldurulur. Tüm kararlar `docs/DECISIONS.md`'ye de özet olarak eklenir.
**Statü:** ⬜ Boş şablon — Yakın 1 öncesi research-phase doldurulacak.

---

## Karar Bekleyen Konular

Aşağıdaki seçimler **Yakın 1'e girmeden önce** araştırılıp karara bağlanmalı. Sırayla:

### 1. Mobile Stack

**Seçenekler:**
- **Expo / React Native** — Tek codebase iOS+Android, JavaScript/TypeScript, hızlı geliştirme, geniş ekosistem. Native modül kısıtları olabilir.
- **Flutter** — Tek codebase, Dart, performans iyi, UI consistency yüksek. Ekosistem React Native'den küçük.
- **Native (Swift + Kotlin)** — En performanslı, en esnek. İki ayrı codebase, en yavaş geliştirme.

**Değerlendirme kriteri:**
- Geliştirme hızı (90 gün v1 hedefi için kritik)
- TR yerelleştirme (Türkçe karakter, +90 telefon format, TR tarih/saat) — hepsi destekler
- Deep link altyapısı (iOS Universal Link + Android App Link) — hepsi destekler
- Native push (APNs + FCM) entegrasyonu — hepsi destekler
- v1.5'te WhatsApp Business API + AI nutrition için esneklik
- Kurucunun ekibinin / mevcut bilgi tabanının uyumu

**Karar:** ⬜ Bekliyor

### 2. Backend Stack

**Baz varsayım (devcontainer template'inden):** Node.js + PostgreSQL.

**Alternatifler değerlendirilebilir:**
- Node.js (Express/Fastify/NestJS) + Postgres
- Python (FastAPI) + Postgres
- Go + Postgres

**Değerlendirme kriteri:**
- v1.5 AI nutrition entegrasyonu (Python ekosistemi avantajı; ama Node + OpenAI SDK pratik)
- Test altyapısı + observability (Sentry vb.) olgunluğu
- TR locale + Postgres charset desteği
- Geliştirme hızı (90 gün)
- Mobile stack ile API contract tooling (TypeScript paylaşımı?)

**Karar:** ⬜ Bekliyor (baz varsayım Node + Postgres, doğrulanmalı)

### 3. Veritabanı

**Baz varsayım:** PostgreSQL.

**Sebep (baz varsayımın gerekçesi):**
- 3 rol veri modeli + ilişki tabloları (M0) için ilişkisel DB doğal
- KVKK saklama + audit log için ilişkisel + transactional model uygun
- v1.5 AI nutrition için JSON kolon desteği (jsonb) güçlü
- TR character set (UTF-8) sorunsuz

**Karar:** ⬜ Bekliyor (baz varsayım Postgres, doğrulanmalı)

### 4. SMS Provider (M1 Auth için kritik)

**Seçenekler:**
- **Twilio** — Uluslararası, dolar, geniş API, deliverability iyi. Daha pahalı.
- **Netgsm / İletişim Merkezi (TR yerel)** — TR yerel, TL, BTK uyumu. API/dökümantasyon daha az olgun.
- **AWS SNS / Vonage** — Alternatif uluslararası.

**Değerlendirme kriteri:**
- Maliyet (~0.10–0.30 TL/SMS): TR yerel daha ucuz
- BTK uyumu (TR'ye SMS gönderim için)
- Deliverability oranı (özellikle Türk Telekom + Turkcell + Vodafone üzerinde)
- API olgunluğu + SDK
- 5 hatalı OTP koruması + rate limiting özellikleri

**Karar:** ⬜ Bekliyor

### 5. Push Provider (M4 için kritik)

**Seçenekler:**
- **FCM tek nokta** — iOS+Android için tek SDK; FCM APNs köprü yapar. Tek noktadan yönetim.
- **APNs + FCM ayrı** — Direkt entegrasyon, daha az soyutlama, ama iki ayrı kanal yönetimi.

**Değerlendirme kriteri:**
- v1'de tek kanal yeterli, v1.5'te WhatsApp Business API ile çoklu kanal mimari
- Cihaz token yönetimi pratik mi (çoklu cihaz, expire token)
- Sessiz saat penceresi (22:00–08:00) zamanlama kontrolü
- Deep link payload formatı

**Karar:** ⬜ Bekliyor (baz varsayım FCM tek nokta — pratiklik)

### 6. Hosting & Deployment

**Seçenekler:**
- **AWS** — Geniş hizmet, esnek, daha karmaşık
- **GCP** — Geniş hizmet, esnek
- **Hetzner / DigitalOcean** — Daha basit, daha ucuz, daha az hizmet
- **Heroku / Render / Fly.io** — Hızlı kurulum, PaaS

**Değerlendirme kriteri:**
- v1 pilot ölçeği (1 PT + 4 üye + tüm ekip dahil) — küçük
- v1.5+ ölçek (5-10 PT) — orta
- KVKK uyumu / TR data residency gerekiyor mu? (üye sağlık verisi yurt dışında saklanabilir mi? Hukuki danışmana sor.)
- CI/CD entegrasyonu
- Observability (Sentry, log) entegrasyonu
- Maliyet

**Karar:** ⬜ Bekliyor

### 7. App Store Hesapları

**Apple Developer:** $99/yıl. Yakın 5 launch öncesi açılmalı.
**Google Play Developer:** $25 tek seferlik. Yakın 5 launch öncesi açılmalı.

**Karar:** ⬜ Bekliyor — Yakın 5 yaklaşırken açılır.

### 8. Çekirdek Egzersiz Video Hosting

**Seçenekler:**
- **YouTube embed (Alpfit kanalı)** — Maliyet sıfır, pratik. Bant genişliği YouTube'da. Embed izni kontrol gerekli.
- **Vimeo** — Daha kontrollü, brand-friendly, ücretli.
- **Kendi CDN (Cloudflare R2 / AWS S3 + CloudFront)** — Tam kontrol, ölçeklenebilir, ücretli.

**Değerlendirme kriteri:**
- v1 pilot ölçek: 50 video × ~20 sn × 4 üye → düşük trafik. YouTube embed yeterli.
- v1.5/v2 ölçek: trafik artar, daha kontrollü çözüm gerekebilir.
- Offline cache nasıl yapılır? YouTube embed offline çalışmaz.
- v1'de "Video çevrimiçi gerektirir" mesajı kabul edildi (PRD F2.2 §S7).

**Karar:** ⬜ Bekliyor (baz varsayım v1'de YouTube embed — maliyet sıfır)

### 9. Test Altyapısı

**Mobile:**
- Unit + component test framework
- E2E (Detox / Maestro / Appium) — Yakın 5 öncesi kurulur

**Backend:**
- Unit + integration test framework
- Test DB / mock yapısı (KVKK uyumu — gerçek üye verisi ile test edilmez)

**Karar:** ⬜ Bekliyor — Mobile/Backend stack seçildikten sonra netleşir.

### 10. CI/CD

**Seçenekler:**
- **GitHub Actions** — Repo ile entegre, ücretsiz tier yeterli
- **GitLab CI / CircleCI** — Alternatif

**Mobile build pipeline:** EAS Build (Expo varsa), Codemagic, Bitrise.

**Karar:** ⬜ Bekliyor

### 11. Observability

**Seçenekler:**
- **Sentry** — Error tracking, mobile + backend
- **DataDog / NewRelic** — Daha kapsamlı, daha pahalı
- **Self-hosted (Plausible analytics + self-hosted Sentry)** — KVKK uyumu kolay

**Değerlendirme kriteri:**
- Üye sağlık verisi log'a yazılmaz (KVKK ihlali) — log seviyesi disiplin
- v1 pilot ölçek için Sentry yeterli

**Karar:** ⬜ Bekliyor

---

## Karar Verilenler

Henüz karar yok — Yakın 1 öncesi research-phase doldurulacak.

> **Karar formatı:** Karar verildiğinde aşağıdaki şablonla en üste eklenir:
>
> ### [Tarih] — [Karar başlığı]
> **Seçenekler:** [özet]
> **Karar:** [X seçildi]
> **Gerekçe:** [neden — 1-2 cümle]
> **Tradeoff'lar:** [feda edilen alternatifler]
> **Etkilenen modüller:** [M0, M1, ...]
> **DECISIONS.md karşılığı:** [docs/DECISIONS.md'deki ilgili kayıt]

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: TECH-STACK boş şablon olarak oluşturuldu (11 karar bekleyen konu listelendi).
