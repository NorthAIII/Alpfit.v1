# Alpfit — Proje Özeti

**Proje Sahibi:** Kıvanç (kurucu) — Alpfit Yazılım
**Başlangıç Tarihi:** 2026-05-28 (planlama oturumu) / 2026-05-29 (kickoff)

---

## Bu Doküman Hakkında

**OVERVIEW.md** projenin genel referans dokümanıdır. Her oturum başında mutlaka okunmalıdır. **Yalnızca statik bilgi** içerir — proje kimliği, stack, amaç, kapsam. Dinamik bilgi (aktif faz/task, ilerleme, faz numarası, durum) buraya **yazılmaz**; onların evi DURUM.md'dir. OVERVIEW yalnızca daha genel değişikliklerde (vizyon, stack, kapsam) güncellenir — nadiren.

**Not:** Bu dosya projenin kendi README.md'si değildir. Bu, DevFlow geliştirme sürecine yönelik bir özettir ve `_dev/` klasöründe yaşar.

---

## Proje Özeti

### Ne Yapıyor?
Alpfit, TR pazarına özel, **PT-üye koachluk** mobile uygulamasıdır. Tek satır vizyon: "üye sürdürülebilirlik motoru olarak konumlanan bir PT-üye uygulaması." Antrenman/program yönetiminin yanı sıra streak + telafi penceresi + comeback akışıyla **devamlılığı sistemli destekleyen akıllı motor** ürünün kalbidir.

### Hangi Problemi Çözüyor?
Üye tarafı: spora başlayıp 2-3 hafta sonra bırakma döngüsü, programa hangi gün ne yapacağını hatırlamama, hayatın araya girmesi. PT tarafı: program yazımı için Word/PDF + WhatsApp manuel akışı, üyelere ayrı ayrı reminder gönderme yükü, üye düşüşünü erken fark edememe. TR pazarında PT-coaching + sürdürülebilirlik + (v1.5'te) AI nutrition üçlüsünü birleştiren rakip yok (Flyby gym ops odaklı, Trainerize/TrueCoach İngilizce ve TR yerelleştirme yok).

### Hedef Kitle
- **Birincil — PT (Trainer):** Bağımsız veya bir spor salonunda çalışan, 5-30 üyeli portföy, şu an WhatsApp+Word/PDF ile yazılım kullanmıyor. İlk testçi: kurucunun kardeşi.
- **Birincil — Member (Üye):** PT ile çalışan veya başlayacak, önceden başlayıp bırakma deneyimi olan, telefon-dominant, Türkçe konuşan. İlk testçiler: kardeşin 3-4 öğrencisi.
- **v1.5+ ikincil — Gym Owner:** Spor salonu işletmecisi. v1'de YOK; rol modelinde **mimari hazırlık** vardır, ekranda görünmez.

### Kapsam
**Dahil (v1):**
- Sürdürülebilirlik motoru (streak + 1 gün telafi penceresi + T+2/T+7/T+14 comeback akışı)
- Program builder (PT, haftalık şablon, ~50 egzersizlik çekirdek kütüphane + PT custom egzersiz)
- Onboarding (PT davet linki + üye SMS OTP, telefon-only, 30 gün cihaz hatırlama)
- Native push bildirimleri (APNs + FCM, sessiz saat 22:00–08:00)
- Üye program görüntüleme + tamamlama (çevrimdışı cache + senkron, in-app video)
- PT dashboard (üye listesi, adaptif banner stack, üye detay drill-down, WhatsApp deep link, not düşme)
- Üye ölçüm takibi (PT girer, üye görür, 24h düzenleme penceresi, gizlilik toggle)
- Üye yemek günlüğü (üye girer, PT okur, kalori opsiyonel, disclaimer enforce)

**Dahil değil (v1):**
- AI nutrition (v1.5)
- WhatsApp Business API entegrasyonu (v1.5)
- Email/şifre auth (hiçbir zaman — telefon-only ürün konumlandırması)
- Diyetisyen 4. rolü (asla — yasal çerçeve)
- "Beslenme programı" dili (yasal çerçeve, tüm versiyonlarda yasak)
- Gym Owner ekranları (v2)
- Profil fotoğrafı, üye self-ölçüm, ölçüm grafikleri (hepsi v1.5 adayı)
- Üye seyahat/tatil modu, app içi bildirim merkezi (v1.5 adayı)
- Süperset / RIR / tempo, çoklu PT, paylaşımlı egzersiz kütüphanesi (v2)

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Mobile | Karar bekliyor (Expo/React Native vs Flutter vs native) — TECH-STACK.md'de |
| Backend | Karar bekliyor (Node + Postgres baz alındı, kesin değil) — TECH-STACK.md'de |
| Veritabanı | PostgreSQL (baz varsayım) — TECH-STACK.md'de |
| SMS Provider | Karar bekliyor (Twilio vs Netgsm/İletişim Merkezi) — TECH-STACK.md'de |
| Push Provider | Karar bekliyor (FCM tek nokta vs APNs+FCM ayrı) — TECH-STACK.md'de |
| Deployment | Karar bekliyor (hosting + CI/CD) — TECH-STACK.md'de |

**Detaylar:** `TECH-STACK.md` (boş şablon; içerik **Yakın 1 öncesi research-phase**'de doldurulur)

---

## Temel Özellikler

- Sürdürülebilirlik motoru (streak, telafi penceresi, comeback)
- PT program builder (haftalık şablon + çekirdek 50 egzersizlik kütüphane)
- Üye davet linki + SMS OTP onboarding
- Native push bildirim (sessiz saat penceresiyle)
- Üye program görüntüleme + tamamlama (offline-aware)
- PT dashboard (adaptif banner stack + üye detay)
- Ölçüm takibi (KVKK + gizlilik toggle)
- Yemek günlüğü (yasal çerçeve + disclaimer)

**Detaylar:** `MODULE-MAP.md` (modül ve feature haritası), `modules/` (modül detayları), `PRD/features/` (feature davranışı)

---

## Kaynak Kod Yapısı

Henüz kod yazılmadı (kickoff aşaması). Klasör yapısı **Yakın 1**'in ilk task'inde (M0 Çekirdek Altyapı) kurulacak. Karar TECH-STACK.md'deki mobile + backend stack seçimine bağlı.

```
(Yakın 1'de oluşacak — TECH-STACK.md kararından sonra)
```

---

## Proje Konumları

| Açıklama | Yol |
|----------|-----|
| Repo Kökü | `/workspaces/Alpfit.v1` |
| DevFlow Dokümanları | `/workspaces/Alpfit.v1/_dev/` |
| PRD | `/workspaces/Alpfit.v1/_dev/PRD/` |
| Bağlam Brief'i | `/workspaces/Alpfit.v1/CONTEXT-BRIEF.md` (2026-05-28 planlama oturumu çıktısı) |
| Kaynak Kod | Henüz yok — Yakın 1'de açılacak |
| Çalışan Uygulama | Henüz yok |

---

## Doküman Yapısı

```
_dev/
├── OVERVIEW.md        # Bu dosya
├── ILKELER.md         # Proje ilkeleri (yön/öncelik — karar fazlarında okunur)
├── INDEX.md           # Navigasyon haritası
├── DURUM.md           # Canlı dashboard
├── MEMORY.md          # Proje hafızası index'i
├── memory/            # Öğrenim dosyaları (ilk öğrenimde oluşur, lazy-load)
├── MODULE-MAP.md      # Modül/feature haritası (özet)
├── PHASES.md          # Faz durum özeti + sıradaki fazlar
├── QUALITY.md         # Kalite eksenleri
├── TECH-STACK.md      # Teknik mimari kararları (boş şablon — Yakın 1 öncesi dolar)
├── KVKK.md            # KVKK aydınlatma + sağlık verisi açık rıza (boş şablon — Yakın 4 öncesi dolar)
│
├── PRD/               # PRD dokümanları
│   ├── VERSIONS.md
│   ├── SESSION-NOTES.md
│   ├── 00-VISION.md
│   └── features/      # 01–08 feature dosyaları
│
├── modules/           # Modül detay dokümanları (M0–M6)
├── phases/            # Faz dokümanları (her faz ayrı, kickoff'ta yok)
├── docs/              # Detay dokümanları, karar günlüğü
│   └── DECISIONS.md
└── tasks/             # Task dokümanları ve arşiv
    ├── TASKS-README.md
    ├── quick/
    └── archive/
```

CLAUDE.md repo kökündedir (`/CLAUDE.md`) — bu kickoff oturumunda henüz oluşturulmadı, **kickoff-verify oturumunda** doğacak.

---

> Operasyonel talimatlar (oturum başlangıç protokolü, task tamamlama sırası, numaralama) burada tekrarlanmaz — onların evi CLAUDE.md'dir. OVERVIEW yalnızca proje kimliğini taşır; tekrar = drift kaynağı.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2 (kickoff-docs): OVERVIEW kickoff kararlarına göre oluşturuldu.
