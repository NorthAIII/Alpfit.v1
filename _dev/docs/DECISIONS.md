# DECISIONS — Karar Günlüğü

**Amaç:** Önemli mimari ve tasarım kararlarının kaydı. "Neden X yerine Y tercih edildi?" sorusunun cevabı burada.
**Ne zaman güncellenir:** Önemli bir teknik, mimari veya tasarım kararı alındığında.

---

## Kararlar

<!-- Her yeni karar aşağıdaki formatta en üste eklenir (en yeni en üstte) -->

### 2026-05-29 — Observability: Sentry Developer (EU Frankfurt)

**Bağlam:** Backend Node + RN/Expo için error tracking + crash reporting. KVKK uyumu kritik — sağlık verisi (kilo/boy/ölçüm/yemek günlüğü) log'a/error tracker'a YAZILMAZ.

**Seçenekler:**
1. **Sentry Developer (free)** — Endüstri standardı, EU Frankfurt residency free plan'da, PII scrubbing 3 katmanlı (`beforeSend` + server scrubber + Relay). RN+Node tek araç. 5K event/ay.
2. **GlitchTip self-host** — Sentry SDK uyumlu, ücretsiz; ama Postgres+Redis+Celery ops yükü solo dev için fazla.
3. **Better Stack** — Log management odaklı; crash reporting + source map yok. v1'de gerekli değil.
4. **DataDog** — Premium APM; $26/ay sınırını ilk aydan aşar, solo için overkill.

**Karar:** Sentry Developer (free tier, EU Frankfurt region) — backend Node + RN/Expo tek araç. 6. ay civarı Team plan ($26/ay) gerekirse yükselt.

**Gerekçe:** KVKK için EU residency free plan'a dahil. PII scrubbing 3 katmanlı endüstri standardı + sağlık verisi senaryosu için en güçlü destek. RN/Expo + EAS source map "kur ve unut" — solo dev için kritik. Pilot ölçeği (50 üye, beklenen error <500/ay) free tier'a sığar; v1.5'te Team plan'a geçiş tek tıkla.

**Tradeoff'lar:** GlitchTip (ücretsiz ama ops yükü), DataDog (pahalı), Sadece stdout (production'da kullanıcı görmeden crash riski).

**Risk:** Sentry varsayılan `req.body` tam gönderir → PII scrubber yazılmadan KVKK ihlali. **Mitigation:** İlk task'lerden biri "Sentry kurulumu + PII scrubber + zorunlu unit test". 5K event sınırı silently drop → `quota_exceeded` webhook Slack/email'e bağla.

**KVKK-uyumlu loglama deseni** (TECH-STACK.md'de tam tanım): pino + fast-redact (kilo/boy/ölçüm/yemek alanları stdout'a yazılmadan kesilir) + Sentry `beforeSend` + Sentry server-side scrubber. Loglar v1'de Coolify built-in aggregator'unda (EU).

**İlgili Task/Faz:** Yakın 1 task'ları içinde "Sentry + PII scrubber kurulumu" zorunlu — sağlık verisi modülleri başlamadan (Yakın 4) önce kanıtlanmış olmalı.

---

### 2026-05-29 — Hosting + Staging: Hetzner Cloud (Falkenstein, AB) + Coolify

**Bağlam:** Backend + Postgres + Redis hosting. KVKK m.9 reformu (7499 sayılı Kanun, 01.06.2024) sonrası yurt dışı veri aktarımı için yeterlilik kararı şart; Kasım 2025 itibarıyla hiçbir ülke için yeterlilik yok. Sağlık verisi m.6 özel nitelikli — hosting konumu hukuki argümana doğrudan etki ediyor.

**Seçenekler:**
1. **Hetzner Cloud (Falkenstein/Nuremberg, AB) + Coolify** — €8-15/ay, AB konum (KVKK için en savunulabilir), Heroku-benzeri DX; tek-node SPOF.
2. **Render Frankfurt (AB)** — ~$37/ay, tam managed PITR + push-to-deploy. Coolify ops'tan kaçınmak istersen.
3. **DigitalOcean App Platform Frankfurt (AB)** — ~$35/ay, Render benzeri.
4. **Fly.io FRA (AB)** — ~$45-55/ay, Managed PG $38/ay'dan; 2024-2025 FRA WireGuard + IAD outage olayları.
5. **Railway** — 2024-2026 ciddi sicil (DDoS, GCP suspend, Next.js exploit) — önerilmez.
6. **AWS Lightsail/ECS+RDS** — Frankfurt var, RDS PITR endüstri standardı; pilot için overkill.

**Karar:** Hetzner Cloud (Falkenstein veya Nuremberg, AB) + Coolify. Fallback: Render Frankfurt.

**Gerekçe:** KVKK m.9 sonrası AB (Almanya) en savunulabilir konum (GDPR-KVKK uyumu argümanı). Hetzner CPX22 €7.99/ay pilot ölçeğinin 10 katına sığar. Coolify GitHub push-to-deploy + Postgres+Redis one-click + S3 yedek + staging/prod izole project paternini Heroku DX'iyle veriyor. Render Frankfurt commit-edilebilir kaçış yolu olarak duruyor (Coolify'da Linux/Docker tuzağına takılırsan $37/ay'a "tamamen managed PITR" satın al).

**Tradeoff'lar:** Render Frankfurt (3× pahalı ama yönetim kolaylığı), Fly.io (PG pahalı + reliability sicil), Railway (sicil riski), AWS (overkill).

**Risk:** Tek-node SPOF — sunucu çökerse 30-60 dk downtime. **Mitigation:** Günlük Backblaze B2 yedek (Coolify built-in), ayda 1 manuel restore drill (faz retrosunda kontrol), DB+Coolify config ayrı dokümante, v1.5'te HA Postgres (Patroni) değerlendir. **İkincil risk:** KVKK Standart Sözleşme (SCC) Hetzner ile imzalanması — Yakın 4 hukuki adım (KVKK.md'de takip).

**Staging stratejisi:** Tek CPX22 sunucusunda Coolify ile iki ayrı project (`staging-alpfit`, `prod-alpfit`); her project kendi Postgres+Redis+env'i. GitHub Actions: `main` → staging webhook; tagged release + manuel approval → prod webhook.

**İlgili Task/Faz:** Yakın 1 task'larında hosting kurulumu staging'den başlar; prod kurulumu Yakın 5 öncesi (gerçek SMS provider + domain alımı ile birlikte).

---

### 2026-05-29 — Veritabanı + ORM: PostgreSQL 16 + Prisma 7

**Bağlam:** 3 rol veri modeli (Member + Trainer + Gym Owner) + KVKK uyumu + cumulative test prensibi + v1.5 AI-ready (jsonb).

**Seçenekler:**
1. **Prisma 7 + Postgres 16** — Tek `schema.prisma`, graph-tabanlı migration (en olgun, drift detection built-in), en geniş docs.
2. **Prisma 6.x LTS + Postgres 16** — Prisma 7 ekosistemi stabilleyene kadar bekle; Yakın 3 civarı yükseltme.
3. **Drizzle + Postgres 16** — SQL'e yakın, tip güvenliği iyi; ama `drizzle-kit` prod tuzakları (manuel SQL review zorunlu).
4. **Knex + Zod + Postgres** — ORM değil query builder; tip güvenliği elle, çok boilerplate.
5. **TypeORM** — Maintenance modda (v7 alpha 20+ ay); önerilmez.

**Karar:** Prisma 7 + PostgreSQL 16 + `@prisma/adapter-pg`.

**Gerekçe:** Tek schema dosyası → 3 rol model deklaratif. Graph-tabanlı migration [[ilkeler]] §"Kümülatif test altyapısı" + KVKK retention pattern için en güvenli yol. jsonb desteği v1.5 AI verisi için yeterli. En geniş docs solo dev için kritik. Drizzle'ın SQL'e yakınlığı bu bağlamda dezavantaja (manuel migration review = zaman kaybı). Postgres charset UTF-8 TR karakter sorunsuz.

**Tradeoff'lar:** Drizzle (hızlı ama tuzak riski), Knex (boilerplate), TypeORM (maintenance modda).

**Risk:** Prisma 7 ESM + Rust-free geçişi Kasım 2025 — henüz olgunlaşma süreci. Üç tuzak:
1. Monorepo'da Expo/RN ile backend ayrı tsconfig şart.
2. `@prisma/adapter-pg` explicit kurulum atlanırsa runtime'da kırılır.
3. `migrate dev`/`db push` artık `prisma generate` çalıştırmıyor — CI + dev script explicit adım.

**Mitigation:** Yakın 1 ilk task'larında "Prisma 7 setup smoke check" — generate adımı eksikse CI fail. Alternatif: Prisma 6.x LTS ile başla, Yakın 3'te v7'ye yüksel.

**İlgili Task/Faz:** Yakın 1 — backend iskeleti + Prisma setup smoke check + ilk migration (3 rol model).

---

### 2026-05-29 — Backend Stack: Node.js + Fastify 5 + TypeScript

**Bağlam:** TR-pazarı mobile app'in backend'i. Solo founder + zayıf teknik + 90 gün pilot. TypeScript paylaşımı mobile ile.

**Seçenekler:**
1. **Fastify 5 + TypeScript** — "Az sihir + bol batarya", TS ergonomisi iyi, `@fastify/jwt` hazır, Express'ten 2-3× hızlı.
2. **Express 5 + TypeScript** — En geniş ekosistem, en az sürpriz; ama TS ergonomisi zayıf, JWT/validation/schema elle.
3. **NestJS 11 + TypeScript** — Yapısal disiplin güçlü, test altyapısı zengin; decorator/DI dik öğrenme eğrisi (90 gün risk).
4. **Hono** — Modern + edge-native; KVKK audit/queue/cron ekosistemi henüz olgunlaşmadı.

**Karar:** Fastify 5 + TypeScript + Node.js 22 LTS.

**Gerekçe:** "Az sihir + bol batarya" dengesi — solo dev + zayıf teknik + 90 gün için ideal nokta. TypeScript ergonomisi Express'ten çok daha iyi. `@fastify/jwt` plugin'i refresh-token altyapısını hazır veriyor. Built-in JSON schema validation. NestJS'in magic riski + Hono'nun genç KVKK ekosistemi bu bağlamda yüksek risk.

**Tradeoff'lar:** NestJS (yapısal disiplin ama dik öğrenme), Express (en geniş ekosistem ama TS zayıf), Hono (modern ama production-grade audit/queue/cron eksik).

**Risk:** Fastify'ın refresh-token rotation resmi recipe'i yok (topluluk patternleri olgun). **Mitigation:** Pattern unit + integration test ile doğrulanır (rotation + revoke + replay attack senaryoları).

**İlgili Task/Faz:** Yakın 1 — backend iskeleti task'inden tüm sonraki backend task'larına temel.

---

### 2026-05-29 — Mobile Stack: Expo (React Native) + EAS Build

**Bağlam:** TR-pazarı PT-üye coaching mobile app. Solo founder + zayıf teknik + 90 gün pilot + push (M4) + deep link (M1) + offline cache (M2) + TR locale şart.

**Seçenekler:**
1. **Expo (React Native, managed) + EAS Build + Expo Router** — Zero-config, TS paylaşımı backend ile, push+deep link otomasyonu, EAS Build cloud.
2. **Flutter** — UI consistency + performans güçlü; ama push+deep link manuel, Dart öğrenmek, Hive/Isar topluluğa bırakıldı.
3. **Native (Swift + Kotlin)** — En esnek; 2 codebase + 2 CI + 2 release süreci → solo dev için 90 günde gerçekçi değil.

**Karar:** Expo (React Native, managed workflow) + EAS Build + Expo Router.

**Gerekçe:** Solo founder + 90 gün + push/deep link kritikliği + tek TypeScript dilinde mobile+backend kombinasyonunda Expo zero-config en yüksek hızı veriyor. EAS Build solo dev ops yükünü %60-70 azaltıyor (free tier pilot için yeterli). `expo-notifications` APNs+FCM tek arayüz → M4'te push entegrasyonu küçük task. Expo Router + EAS Hosting `.well-known/` otomasyonu Universal Link + App Link kurulumunu minimuma indiriyor (Firebase Dynamic Links Ağustos 2025'te kapatıldıktan sonra kritik).

**Tradeoff'lar:** Flutter (UI ama push/deep link manuel + Dart öğrenmek), Native (esnek ama 2 codebase solo için unrealistic).

**Risk:** RN 0.82 ile eski mimari kaldırıldı (New Architecture default). Third-party kütüphane seçerken "**New Arch + Expo SDK 56+ uyumlu**" filtresi zorunlu — uyumsuz kütüphane pilot ortasında ejection veya patch yazma zorunluluğu yaratabilir.

**Mitigation:** Paket seçim disiplinine yazıldı (TECH-STACK.md "Dikkat Edilecekler" §2). Yeni paket eklerken README'sinde New Arch uyumu doğrulanır.

**İlgili Task/Faz:** Yakın 1 — mobile iskeleti + EAS Build kurulumu; tüm sonraki mobile fazlarının temeli.

---

### 2026-05-29 — Modül Yapısı: 7 Modüllü Kesim

**Bağlam:** Alpfit v1 PRD'sinde 8 feature var (F01–F08). Bunları nasıl modüllere böleceğimiz mimari karar — featurey'lar kendi modülünde mi, gruplanmış mı?

**Seçenekler:**
1. **Her feature kendi modülünde (8 modül)** — Avantaj: bire-bir izlenebilirlik. Dezavantaj: Builder + Viewer ayrı modülde olunca veri senkronizasyon yükü; Ölçüm + Yemek için KVKK çerçevesi iki yerde tekrar eder; M0 altyapı belirsiz kalır.
2. **7 modüllü kesim: M0 cross-cutting + 5 feature-modül + 2 birleşik (M2 = F02+F05, M6 = F07+F08)** — Avantaj: KVKK çerçevesi M6'da tek noktada; PT/üye program tek data modeli; M0 altyapı erken aşamaya zorlanır. Dezavantaj: Modül-feature haritası 1:1 değil — okuyucu için ek translation.
3. **5 modül (M0 ayrı tutulmaz, altyapı M1'in içine girer)** — Avantaj: Daha az soyutlama. Dezavantaj: Altyapı + Auth iç içe → sonradan migration ağrısı; [[ilkeler]] §"Kümülatif test altyapısı" + §"Kalıcılık önceliği" altyapıyı erken faza zorluyor.

**Karar:** Seçenek 2 — 7 modüllü kesim.

**Gerekçe:** [[ilkeler]] §"Kalıcılık önceliği" + §"Kümülatif test altyapısı" altyapıyı önden ayırmayı zorunlu kılıyor; Builder + Viewer birleşik tutmak senkronizasyon yükünü ortadan kaldırıyor; Ölçüm + Yemek aynı KVKK + gizlilik toggle paterni paylaşıyor, ayrı modülde tekrar eder. M2 ve M6 birleşik tutmanın ek çevirme maliyeti, ayrı tutmanın senkronizasyon + duplicate kod maliyetinden az.

**İlgili Task/Faz:** Tüm fazlar — bu modüler kesim faz numaralandırmasının da temeli.

---

### 2026-05-29 — Faz Sırası: M0+M1 → M2 → M3+M4 → M5+M6 → UAT

**Bağlam:** 7 modülün hangi sırayla hangi fazlara dağıtılacağı kritik karar. Sürdürülebilirlik motoru ([[ilkeler]] §Eksen #1) ürünün kalbi ama önce program akışı (girdisi) hazır olmadan motor doğrulanamaz.

**Seçenekler:**
1. **Lineer feature sırası (F01 → F02 → ... → F08)** — Avantaj: PRD sırasına uyar. Dezavantaj: F01 motorunun bağımlılıkları (program + tamamlama sinyali) önce kurulmadan motoru test edemezsin.
2. **Motor-merkezli sıra: Altyapı → Auth → Program → Motor+Bildirim → Dashboard+Sağlık → Launch (5 faz)** — Avantaj: Her fazın girdisi önceki fazda hazır; Motor (kalp) ile Bildirim aynı fazda çünkü motorun doğruluk testi push olmadan yarım kalır; Dashboard + Sağlık aynı fazda çünkü dashboard tüm modüllerin agregatörü. Dezavantaj: 90 gün taahhüdü için 5 faz sıkı — pilot launch fazı kapsamlı.
3. **Dashboard erken (Sprint 2'de PT'ye early access)** — Avantaj: PT erken geri bildirim. Dezavantaj: Boş dashboard anlamsız; underlying veri yok.

**Karar:** Seçenek 2 — 5 fazlı motor-merkezli sıra.

**Gerekçe:** Motor (M3) PRD'nin kalbi ama girdisi (M2 program + tamamlama) olmadan testlenemez. Bildirim (M4) ile motor aynı fazda çünkü motorun "comeback tetiklendi → push gönderildi → üye geri döndü" testi push olmadan yarım kalır — [[ilkeler]] §Eksen #1 doğrulanamaz. Dashboard (M5) tüm modüllerin agregatörü, son içerik fazı (Yakın 4) doğru yer. Yakın 5 UAT + pilot launch — kardeş gerçek SMS ile pilot kullanır, app store yayını burada olur.

**İlgili Task/Faz:** Faz numaralandırma kuralı PHASES.md'de — bu sıralama "Sıradaki Fazlar" listesinde numarasız tutulur, faza girince numara alır.

---

### 2026-05-29 — Projeye Özgü Doküman Seti: TECH-STACK + KVKK

**Bağlam:** DevFlow standart dokümanlarına ek olarak projeye özgü hangi sabit dokümanları açacağız? Erken açmak boş şablon yaratır, geç açmak bilgi dağılır.

**Seçenekler:**
1. **TECH-STACK + KVKK + STYLE-GUIDE üçü birden** — Avantaj: tek seferde açılır. Dezavantaj: STYLE-GUIDE için tasarım dili henüz somutlaşmadı (kardeş "modern/akıcı/profesyonel" demiş, yön yok) — boş şablon değer üretmez.
2. **Sadece TECH-STACK + KVKK** — Avantaj: ikisi de net ihtiyaç (TECH-STACK Yakın 1 öncesi research-phase doldurulacak; KVKK Yakın 4 öncesi hukuki review'lı doldurulacak). STYLE-GUIDE Yakın 2 başlangıcında tasarım oturumuyla netleşince doğar.
3. **Hiçbiri açılmaz, ihtiyaç anında oluşur** — Avantaj: temizlik. Dezavantaj: "blocker olduğu görünür konum yok" — KVKK Yakın 4'ün engelleyici ön-koşulu, bir yerde duruşunun engel olarak görünmesi gerekir.

**Karar:** Seçenek 2 — TECH-STACK.md + KVKK.md boş şablon olarak kickoff-docs'ta açılır.

**Gerekçe:** İkisi de **engelleyici ön-koşul olarak DURUM.md'de izlenecek**; boş şablon kapsamın görünür kalmasını sağlar. STYLE-GUIDE Yakın 2 başlangıcında tasarım oturumuyla netleşince doğar — şimdi açmak değer üretmez.

**İlgili Task/Faz:** TECH-STACK Yakın 1 öncesi research-phase'de; KVKK Yakın 4 öncesi prd-refine + hukuki review.

---
