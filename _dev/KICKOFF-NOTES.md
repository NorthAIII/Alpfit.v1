# Alpfit — KICKOFF NOTES (Oturum 1)

> Bu dosya `/devflow:kickoff` Oturum 1'in karar günlüğüdür. Bir sonraki oturum (`/devflow:kickoff-docs`) bu dosyayı okuyarak DevFlow standart dokümanlarını (OVERVIEW, INDEX, DURUM, MEMORY, PHASES, MODULE-MAP, QUALITY, DECISIONS, CLAUDE-MD) ve projeye özgü dokümanları üretir. **Bu oturumda doküman oluşturulmadı, sadece kararlar alındı.**

**Oturum tarihi:** 2026-05-29
**Mod:** İlk kickoff (PRD tamamlanmış, henüz kickoff dokümanı yok)

---

## 1. PRD'den Anlaşılan Özet (onaylandı)

**Tek satır:** Alpfit, TR pazarına özel, PT-üye coaching uygulamasıdır — sürdürülebilirlik motoru (streak + reminder + comeback) etrafında kurulmuş.

**v1 hedefi:** Kardeş (1 PT) + 3-4 öğrencisi → ~**90 gün** pilot.

**v1 feature kapsamı (PRD'de tam olarak yazılmış):**
- F01 Sürdürülebilirlik Motoru — *ürünün kalbi*
- F02 Program Builder (PT)
- F03 Onboarding (davet + SMS OTP)
- F04 Bildirim Sistemi (push only)
- F05 Üye Program Görüntüleme + Tamamlama
- F06 PT Dashboard
- F07 Üye Ölçüm Takibi
- F08 Üye Yemek Günlüğü

**Pazarlık dışı kararlar ([ILKELER §Pazarlık Konusu Olmayanlar](ILKELER.md)):** 3 rol mimarisi (Member+Trainer+Gym-Owner-ready), AI nutrition yasal çerçevesi, scope büyütme reddi, sürdürülebilirlik motoru "kalp" konumlandırması.

**İki yüksek öncelikli eksen ([ILKELER §En Yüksek Öncelikli Eksenler](ILKELER.md)):**
1. Sürdürülebilirlik motoru doğruluğu — v1 hipotezinin testi.
2. PT günlük iş akışı sürtünmesizliği — kardeş "WhatsApp+Word daha kolay" demesin.

---

## 2. Modül Yapısı (onaylandı — 7 modül)

| Modül | Kapsam | Feature |
|---|---|---|
| **M0: Çekirdek Altyapı** | Repo iskeleti, env/secret yönetimi, 3 rol veri modeli, test altyapısı, CI/CD, observability, KVKK çerçevesi, TR locale | cross-cutting |
| **M1: Auth & Onboarding** | Davet linki, deep link, SMS OTP, rol seçimi, profil, 30 gün cihaz hatırlama, KVKK açık rıza ekranı | F03 |
| **M2: Program Domain** | Çekirdek 50 egzersiz, PT custom egzersiz, haftalık şablon builder, üye program görüntüleme + tamamlama, video oynatma, offline cache + senkron | F02, F05 |
| **M3: Sürdürülebilirlik Motoru** | Streak, telafi penceresi, T+2/T+7/T+14 comeback, kayıp risk, motor → bildirim olayları | F01 |
| **M4: Bildirim Altyapısı** | APNs+FCM, token yönetimi, sessiz saat (22–08), izin akışı, deep link payload, in-app banner fallback | F04 |
| **M5: PT Dashboard** | Üye listesi + dikkat-öncelikli sıralama, banner stack (adaptif 1/2+), üye detay drill-down, not düşme, WhatsApp deep link, üye çıkarma | F06 |
| **M6: Sağlık Verisi (Ölçüm + Yemek)** | KVKK + gizlilik toggle paterni, 24h düzenleme audit, v1.5 AI-ready veri yapısı, disclaimer enforce | F07, F08 |

**Modüller arası bağımlılık:**
```
M0 ← (tüm modüllerin temeli)
M1 ← M0
M2 ← M0, M1
M3 ← M0, M1, M2 (program ve tamamlama sinyaline bağlı)
M4 ← M0, M1, M3 (çoğu push motordan tetiklenir)
M5 ← M0, M1, M2, M3, M4, M6 (hepsinin agregatörü)
M6 ← M0, M1
```

**Tasarım kararı gerekçeleri:**
- **M0 ayrı modül:** ILKELER §"Kümülatif test altyapısı" + §"Kalıcılık önceliği" altyapıyı erken faza zorluyor; 3 rol veri modeli ve KVKK çerçevesi sonradan eklenirse migration ağrısı yaratır.
- **M2 = Builder + Viewer birleşik:** PT'nin yazdığı şablon ve üyenin gördüğü program aynı data; ayrı modül senkronizasyon yükü yaratır.
- **M6 = Ölçüm + Yemek birleşik:** Aynı paterni paylaşıyorlar (PT/üye giriş ayrımı + gizlilik toggle + KVKK rızası + AI-ready); aynı modülde KVKK çerçevesi tek noktada doğru olur.

---

## 3. Faz Akışı (onaylandı — 5 yakın faz konusu)

> **Faz numaraları verilmedi.** DevFlow kuralı: numara faza girince (`/devflow:discuss-phase`) damgalanır. Aşağıdaki sıralama hedef sıradır, numara değildir.

| Sıra | Konu | Modüller | Test Edilebilir Milestone |
|---|---|---|---|
| **Yakın 1** | Çekirdek altyapı + Auth | M0 + M1 | PT ve üye telefon+SMS OTP ile hesap açabilir; PT davet linki üretir; üye linkten gelip PT'ye bağlanır; KVKK rızası alınır; CI/CD yeşil; env-bazlı config çalışır; 3 rol veri modeli yerleşti. |
| **Yakın 2** | Program akışı uçtan uca | M2 | PT bir üyeye haftalık şablon yazar (çekirdek 50 egzersiz + custom); üye programı görür, antrenmanı tamamlar; offline cache + senkron çalışır; video embed oynar. |
| **Yakın 3** ⭐ | Sürdürülebilirlik motoru + Bildirim | M3 + M4 | Streak +1/0 doğru hesaplanır; 1 gün telafi penceresi açılır/kapanır; T+2 üye push + T+7 PT in-app + T+14 kayıp risk doğru tetiklenir; sessiz saat penceresi (22–08) uygulanır; deep link doğru ekrana gider. **ILKELER §En Yüksek Öncelikli Eksen #1 burada doğrulanır.** |
| **Yakın 4** | PT dashboard + Sağlık verisi | M5 + M6 | PT ana ekranı tüm modüllerin çıktısını gösterir (banner stack adaptif 1/2+); üye detay drill-down çalışır; PT ölçüm ekler (24h düzenleme); üye yemek girer (24h düzenleme + disclaimer); gizlilik toggle iki tarafta çalışır; WhatsApp deep link açılır. |
| **Yakın 5** | UAT + Pilot launch | cross-cutting | Çekirdek 50 egzersiz + video finalize; app store yayını (Apple Developer + Google Play); kardeş gerçek SMS ile pilot kullanır; production deploy; KVKK aydınlatma metni hukuki review'dan geçmiş. |

**Sıradaki Fazlar (uzak — numara yok, milestone yok, sadece konu):**
- Pilot gözlem + öncelikli düzeltmeler (v1 başarı kriterleri ölçümü)
- v1.5 hazırlık (AI nutrition + WhatsApp Business API + PT verimlilik iyileştirmeleri)

**Sıralama mantığı:** Altyapı→Auth→Program→Motor+Bildirim→Dashboard+Sağlık→Launch. Motor (kalp) öncesinde M2 (girdisi) gelmek zorunda. M4 (push) motorla aynı fazda çünkü motorun doğruluk testi push olmadan yarım kalır.

---

## 4. Projeye Özgü Ek Dokümanlar (onaylandı)

| Doküman | Amaç | Hedef oluşum zamanı |
|---|---|---|
| **TECH-STACK.md** | Mobile/Backend/DB/SMS/Push/Hosting tüm teknik seçimler tek yerde. Kararlar damgalanır, gerekçesi yazılır. | `/devflow:kickoff-docs` oturumunda boş şablon açılır; içerik Yakın 1 başlamadan önce `/devflow:research-phase` ile doldurulur |
| **KVKK.md** | KVKK aydınlatma metni + sağlık verisi açık rıza + saklama süresi + üye self-silme akışı | `/devflow:kickoff-docs` oturumunda boş şablon açılır; içerik Yakın 4 başlamadan önce hukuki danışman review'undan geçer |

**STYLE-GUIDE.md şimdi açılmıyor:** Tasarım dili henüz somutlaşmadı (kardeş "modern/akıcı/profesyonel" demiş, yön yok). Yakın 2 başlangıcında PRD-refine veya tasarım oturumu ile netleşince doğar.

**DevFlow standart dokümanları** (kickoff-docs oturumunda otomatik oluşacak): OVERVIEW, INDEX, DURUM, MEMORY, PHASES, MODULE-MAP, QUALITY, DECISIONS, CLAUDE-MD.

---

## 5. Engelleyici Ön-Koşullar (onaylandı)

Aşağıdaki üç ön-koşul ilgili fazlar başlamadan önce çözülmüş olmalı. DURUM.md'de "blocker" olarak izlenecek (kickoff-docs oturumunda).

| Ön-koşul | Blocker olduğu faz | Notlar |
|---|---|---|
| **KVKK aydınlatma + sağlık verisi açık rıza metni** (TR, hukuki danışman review'lu) | **Yakın 4** | Ölçüm + yemek günlüğü bu metin olmadan tamamlanamaz. SESSION-NOTES'ta beklemede. `/devflow:prd-refine` veya hukuki danışmanla erken oturum gerekir. |
| **Çekirdek 50 egzersiz listesi + videolar** | **Yakın 5** (placeholder ile Yakın 2'de başlanabilir) | Kardeşle ortak liste oluşturma + video çekim/lisans (YouTube embed). Bütçe + zaman karar gerekir. |
| **Kardeşin "mevcut WhatsApp+Word program yazma süresi" baseline ölçümü** | **Yakın 2** | ILKELER §En Yüksek Öncelikli Eksen #2 "2× hız" hedefinin doğrulanması için. Basit ölçüm: "yeni üye için kaç dakika sürdü" notu. |

---

## 6. Kickoff'tan Sonraki Adım

`/devflow:kickoff-docs` oturumu açılır. Bu dosya okunur ve aşağıdaki dokümanlar üretilir:

**DevFlow standart:**
- `_dev/OVERVIEW.md`
- `_dev/INDEX.md`
- `_dev/DURUM.md` (engelleyici ön-koşullar burada listelenir)
- `_dev/MEMORY.md` (proje hafızası index)
- `_dev/PHASES.md` (Sıradaki Fazlar bölümünde 5 yakın konu numarasız listelenecek)
- `_dev/MODULE-MAP.md` (M0–M6 + bağımlılıklar)
- `_dev/QUALITY.md` (değerlendirme eksenleri)
- `_dev/DECISIONS.md` (karar günlüğü — bu kickoff'taki yapısal kararlar damgalanır)
- `CLAUDE.md` (proje kökünde — Claude Code talimatları)

**Modül dokümanları:**
- `_dev/modules/M_0_cekirdek_altyapi.md`
- `_dev/modules/M_1_auth_onboarding.md`
- `_dev/modules/M_2_program_domain.md`
- `_dev/modules/M_3_surdurulebilirlik_motoru.md`
- `_dev/modules/M_4_bildirim_altyapisi.md`
- `_dev/modules/M_5_pt_dashboard.md`
- `_dev/modules/M_6_saglik_verisi.md`

**Projeye özgü:**
- `_dev/TECH-STACK.md` (boş şablon — içerik Yakın 1 öncesi)
- `_dev/KVKK.md` (boş şablon — içerik Yakın 4 öncesi)

---

**Son Güncelleme:** 2026-05-29 (kickoff Oturum 1 sonu)
