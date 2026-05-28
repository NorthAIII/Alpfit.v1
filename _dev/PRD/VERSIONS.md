# Alpfit — Versiyonlar

> **Bu dosya source of truth.** Feature dosyalarındaki "Versiyon" satırı buna uyar; çelişki olursa burası geçerlidir.

---

## Versiyon Stratejisi

| Versiyon | Hedef | Tahmini süre | Testçi kitlesi |
|----------|-------|--------------|----------------|
| **v1** | Trainer + Member rolleriyle sürdürülebilirlik motoru iddiasının ilk testi | ~90 gün | Kardeş (1 PT) + 3-4 öğrencisi |
| **v1.5** | AI nutrition (PT onaylı), bildirim çoklu kanal (WhatsApp), PT verimlilik enhancement'ları | v1 sonrası 60-90 gün | v1 testçilerinden geçenler + yeni 2-3 PT |
| **v2** | Gym Owner rolü, akıllı takvim, rozet/gamification, beslenme tam AI | v1.5 sonrası ayrı planlama | Spor salonları + PT ağı |

---

## Feature — Versiyon Haritası

### v1 Feature'ları

| Feature | Feature Dosyası | Versiyon |
|---------|----------------|----------|
| Sürdürülebilirlik Motoru | [features/01-sustainability-engine.md](features/01-sustainability-engine.md) | v1 |
| Program Builder (PT) | [features/02-program-builder.md](features/02-program-builder.md) | v1 |
| Onboarding (Davet + Auth) | [features/03-onboarding.md](features/03-onboarding.md) | v1 |
| Bildirim Sistemi (Push) | [features/04-notifications.md](features/04-notifications.md) | v1 |
| Üye Program Görüntüleme + Tamamlama | [features/05-member-program-view.md](features/05-member-program-view.md) | v1 |

### Henüz Yazılmamış v1 Feature'ları (PRD-refine'da yazılacak)

Bu feature'lar v1 kapsamındadır ama henüz feature dosyası yok — sonraki PRD oturumlarında yazılacak:

- **PT Dashboard / Üye Listesi** — PT'nin üyelerini, streak'lerini, comeback uyarılarını gördüğü ana ekran.
- **Üye Ölçüm Takibi** — PT'nin üye için kilo/boy/vücut ölçümlerini kaydetmesi ve zaman içinde takip.
- **Üye Yemek Günlüğü** — Üyenin yediklerini (kalori/makro form) günlük olarak girmesi. v1'de AI önerisi YOK, sadece kayıt.

### v1.5 Feature Adayları

- **AI Nutrition (PT Onaylı)** — Sistem üyeye günlük kalori hedefi + 3 öğün öneri üretir, PT onayladıktan sonra üyeye gönderilir. Yasal çerçeve: ILKELER §Pazarlık Konusu Olmayanlar §2.
- **WhatsApp Business API entegrasyonu** — Push izni kapalı üyeler için kritik moment (T+7, T+14 comeback) bildirimleri.
- **PT verimlilik geliştirmeleri** — Program kopyalama (zaten v1'de var ama optimize), batch operasyonlar, detay analitik.
- **Üye seyahat/tatil modu** — Streak'i geçici donduran mod.
- **App içi bildirim merkezi** — Geçmiş bildirimlerin app içinden görüntülenmesi.
- **PT doğrulama / spor salonu onayı** — PT hesabı onay akışı.
- **Üye PT değiştirme akışı** — Üyenin PT'sini değiştirebilmesi.

### v2 Feature Adayları

- **Gym Owner rolü** — Üyelik, ödeme, rezervasyon yönetimi.
- **Retention dashboard** — Spor salonu için üye sürdürülebilirlik analitiği.
- **Akıllı takvim (Google Calendar)** — Üye takvimine göre antrenman önerisi.
- **Rozet ve gamification** — Görsel streak rozetleri, achievement'lar.
- **Tam kişisel AI beslenme planı + TR yemek DB** — Türk yemek kültürüne uygun, davranışa göre uyarlanan plan.
- **Süperset / RIR / tempo** — İleri seviye program builder yetenekleri.
- **Süperset, çoklu PT, paylaşımlı egzersiz kütüphanesi** — PT ekosistemi.

---

## Versiyon Kapsam Dışı (Tüm versiyonlarda yok)

- **Diyetisyen 4. rolü** — Asla eklenmeyecek. Beslenme PT + üye + (v1.5+) AI üçgeniyle çözülür.
- **"Beslenme programı" dili** — Yasal risk. Tüm versiyonlarda "öneri / yemek günlüğü / kalori hedefi" dili kullanılır.

---

**Son Güncelleme:** 2026-05-28
