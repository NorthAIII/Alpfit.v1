# MODULE-MAP — Modül ve Feature Haritası

**Amaç:** Projenin modüler yapısını ve feature haritasını özetlemek
**Ne zaman okunmalı:** Planlama ve review sırasında
**Not:** Modül detayları `modules/` klasöründeki ayrı dosyalardadır. Bu doküman sadece genel harita ve matristir.

---

## Modül Haritası

```
Alpfit (v1)
├── M0: Çekirdek Altyapı                  (cross-cutting — feature yok)
├── M1: Auth & Onboarding
│   └── F1.1: Onboarding (davet + SMS OTP)          → Faz 1
├── M2: Program Domain
│   ├── F2.1: Program Builder (PT)                  → Faz 2
│   └── F2.2: Üye Program Görüntüleme + Tamamlama   → Faz 2
├── M3: Sürdürülebilirlik Motoru
│   └── F3.1: Streak + Telafi + Comeback            → —
├── M4: Bildirim Altyapısı
│   └── F4.1: Push Bildirim Sistemi                 → —
├── M5: PT Dashboard
│   └── F5.1: Üye Listesi + Banner Stack + Detay    → —
└── M6: Sağlık Verisi
    ├── F6.1: Üye Ölçüm Takibi                      → —
    └── F6.2: Üye Yemek Günlüğü                     → —
```

> **Faz sütunu kuralı:** Faz numarası, ilgili feature'ı kapsayan faza girildiğinde (discuss-phase) just-in-time atanır. Bkz. PHASES.md → Faz Numaralandırma Kuralı.

---

## Modüller Arası Bağımlılıklar

```
M0 ← (tüm modüllerin temeli — çekirdek altyapı, 3 rol veri modeli, KVKK çerçevesi)
M1 ← M0
M2 ← M0, M1
M3 ← M0, M1, M2 (program ve tamamlama sinyaline bağlı)
M4 ← M0, M1, M3 (çoğu push motordan tetiklenir)
M5 ← M0, M1, M2, M3, M4, M6 (hepsinin agregatörü)
M6 ← M0, M1
```

**Tasarım kararı gerekçeleri:**
- **M0 ayrı modül:** [[ilkeler]] §"Kümülatif test altyapısı" + §"Kalıcılık önceliği" altyapıyı erken faza zorluyor; 3 rol veri modeli ve KVKK çerçevesi sonradan eklenirse migration ağrısı yaratır.
- **M2 = Builder + Viewer birleşik:** PT'nin yazdığı şablon ve üyenin gördüğü program aynı data; ayrı modül senkronizasyon yükü yaratır.
- **M6 = Ölçüm + Yemek birleşik:** Aynı paterni paylaşıyorlar (PT/üye giriş ayrımı + gizlilik toggle + KVKK rızası + AI-ready); aynı modülde KVKK çerçevesi tek noktada doğru olur.

---

## Modül Dokümanları

| Modül | Doküman | Açıklama |
|-------|---------|----------|
| M0 | `modules/M0-cekirdek-altyapi.md` | Repo iskeleti, env/secret yönetimi, 3 rol veri modeli, test altyapısı, CI/CD, observability, KVKK çerçevesi, TR locale |
| M1 | `modules/M1-auth-onboarding.md` | Davet linki, deep link, SMS OTP, rol seçimi, profil, 30 gün cihaz hatırlama, KVKK açık rıza ekranı |
| M2 | `modules/M2-program-domain.md` | Çekirdek 50 egzersiz, PT custom egzersiz, haftalık şablon builder, üye program görüntüleme + tamamlama, video oynatma, offline cache + senkron |
| M3 | `modules/M3-surdurulebilirlik-motoru.md` | Streak, telafi penceresi, T+2/T+7/T+14 comeback, kayıp risk, motor → bildirim olayları |
| M4 | `modules/M4-bildirim-altyapisi.md` | APNs+FCM, token yönetimi, sessiz saat (22–08), izin akışı, deep link payload, in-app banner fallback |
| M5 | `modules/M5-pt-dashboard.md` | Üye listesi + dikkat-öncelikli sıralama, banner stack (adaptif 1/2+), üye detay drill-down, not düşme, WhatsApp deep link, üye çıkarma |
| M6 | `modules/M6-saglik-verisi.md` | KVKK + gizlilik toggle paterni, 24h düzenleme audit, v1.5 AI-ready veri yapısı, disclaimer enforce |

---

## Feature-Faz Matrisi

| Feature | Modül | Versiyon | Faz | Durum |
|---------|-------|----------|-----|-------|
| F1.1: Onboarding (Davet + Auth) | M1 | v1 | 1 | ✅ |
| F2.1: Program Builder (PT) | M2 | v1 | 2 | ✅ |
| F2.2: Üye Program Görüntüleme + Tamamlama | M2 | v1 | 2 | ✅ |
| F3.1: Sürdürülebilirlik Motoru | M3 | v1 | 3 | 🔄 |
| F4.1: Bildirim Sistemi (Push) | M4 | v1 | 3 | 🔄 |
| F5.1: PT Dashboard — Üye Listesi | M5 | v1 | — | ⬜ |
| F6.1: Üye Ölçüm Takibi | M6 | v1 | — | ⬜ |
| F6.2: Üye Yemek Günlüğü | M6 | v1 | — | ⬜ |

**Durum simgeleri:**
- ⬜ **Bekliyor** — Fazı henüz başlamadı
- 🔄 **Devam ediyor** — Fazı aktif, task'lar çalışılıyor (discuss-phase'de faz başlatıldığında set edilir)
- 🟡 **Kısmen tamamlandı** — Bazı task'ları bitti ama tamamı değil (bazıları sonraki fazlara kaldı)
- ✅ **Tamamlandı** — Tüm kabul kriterleri karşılandı, UAT'tan geçti (review-phase'de set edilir)

> Modül detayları (sorumluluk, feature kabul kriterleri, edge case'ler) → `modules/MX-modul-adi.md`
> Versiyon sütunu PRD'deki VERSIONS.md'den aktarılır. Faz sütunu sadece planlanmış fazlar için doldurulur, henüz planlanmamış feature'lar "—" kalır.

---

**Son Güncelleme:** 2026-05-31 — discuss-phase 3: F3.1 + F4.1 → Faz 3, 🔄 Devam ediyor.
