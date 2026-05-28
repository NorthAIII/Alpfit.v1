# Bildirim Sistemi

## Özet

v1'in bildirim altyapısı — **sadece native push notification** kullanır (iOS APNs + Android FCM). Sürdürülebilirlik motorunun reminder ve comeback bildirimleri, davet kabul bildirimleri, sistem mesajları bu kanaldan geçer. v1'de WhatsApp/SMS yok; mimari WhatsApp Business API'yi v1.5'te ekleyebilecek şekilde kurulur. Üye push iznini reddetmiş veya kapatmışsa sistem in-app uyarısı gösterir, ama v1'de dışarıdan üyeye ulaşma yolu yoktur.

---

## Kullanıcı Senaryoları

### S1 — İlk push izni isteme
Ayşe onboarding'i tamamladıktan sonra ilk push izni promtu görür. App kendi açıklama ekranı: *"Antrenman günlerinde sana hatırlatma göndereceğiz — devamlılığını korumana yardımcı oluyor. Bildirim izni ver →"*. Devam'a bastığında sistem native izin diyaloğu açar.

### S2 — Sabah reminder
Ayşe Pazartesi sabah uyandığında telefonunda push notification: *"Bugün Push günü 💪 Planını gör"*. Tıklayınca direkt o günün antrenman ekranına gider.

### S3 — PT için üye uyarısı
Kardeş Salı sabah app'i açar, üst banner: *"Ali 7 gündür aktif değil — manuel iletişim önerilir."* Banner'ı tıklayınca Ali'nin profiline gider, yanında "Son aktivite: 8 gün önce" görünür. "Okudum" der, banner kaybolur.

### S4 — Üye push iznini reddetti
Mehmet onboarding'de push iznini reddetti. Sürdürülebilirlik motoru tetiklendiğinde sistem push gönderemez. App'i açtığında üst banner: *"Bildirimler kapalı — antrenman hatırlatmaları alamıyorsun. Ayarlardan aç →"*. Banner kapatılabilir ama tekrar görünür (haftalık). PT tarafında Mehmet'in yanında 🔕 ikonu — kardeş manuel WhatsApp atması gerektiğini anlar.

### S5 — Bildirim sessiz saatlere denk geliyor
Ali'nin antrenmanı sabah 06:00. "2 saat önce" reminder 04:00'e denk gelir, sessiz saat penceresi (22:00–08:00) içinde. Sistem bu bildirimi atmaz, sadece sabah 09:00'da varsayılan reminder gönderilir.

---

## Davranış Kuralları

### Bildirim kanalı
- **v1 tek kanal:** Native push notification (iOS APNs + Android FCM).
- **WhatsApp/SMS YOK:** v1'de yok. v1.5 adayı (özellikle T+7 ve T+14 comeback için kritik moment kanalı).
- **In-app fallback:** Push gönderilemediğinde (izin yok, cihaz offline) bilgi in-app banner/ekran içinde gösterilir.

### Bildirim tipleri
- **Reminder bildirimleri:** Sürdürülebilirlik motoru tarafından tetiklenir. Detaylar: [01-sustainability-engine.md](01-sustainability-engine.md) Reminder bölümü.
- **Comeback bildirimleri:** Sürdürülebilirlik motoru tarafından tetiklenir. Detaylar: [01-sustainability-engine.md](01-sustainability-engine.md) Comeback bölümü.
- **Üye davet kabul bildirimi:** Üye davet linkini açıp hesap oluşturduğunda PT'ye push: *"[Üye adı] davetini kabul etti."*
- **Yeni program bildirimi:** PT bir üyeye ilk programı yazdığında üyeye push: *"Programın hazır 🎉 Gör →"*.
- **Program güncelleme bildirimi:** PT mevcut programı düzenlediğinde üyeye push: *"Programında değişiklik var."*
- **Sistem bildirimleri:** Hesap güvenliği (yeni cihazdan giriş), önemli güncellemeler. v1'de minimal.

### Push izni yönetimi
- **İlk istek:** Onboarding tamamlandıktan sonra app içi açıklama ekranı + native diyalog. Hemen onboarding sırasında istenmez (kullanıcının "neden?" bilmesi için açıklama gelmeli).
- **İzin reddi:** Reddedildiyse sistem cebren tekrar isteyemez (iOS/Android kısıtlaması). Bunun yerine:
  - Üye ana ekranında üst banner uyarısı (kapatılabilir, haftada bir tekrar görünür)
  - PT tarafında üye satırında 🔕 ikonu (PT manuel ulaşması gerektiğini bilsin diye)
  - Ayarlar > Bildirimler ekranında "İzin ver" CTA (cihaz ayarlarına yönlendirir)
- **İzin sonradan açma:** Üye iOS/Android ayarlarından açtığında app açılışında otomatik algılanır, banner kaybolur.

### Sessiz saatler
- **Global pencere:** 22:00–08:00 arası hiçbir bildirim gönderilmez.
- **Geç bildirim:** Bu pencereye denk gelen reminder/comeback bildirimleri:
  - Reminder: bir sonraki açık pencerede atılmaz (geç hatırlatma kafa karıştırıcı). Atılmayan bildirim loglanır.
  - Comeback: ertesi gün 09:00'da atılır (zamanlama esnek).
- **PT bildirimleri:** PT için sessiz saat aynı (22:00–08:00). PT uyarıları acil değil — ertelenebilir.

### Cihaz token yönetimi
- **Kayıt:** Üye/PT app'i ilk açtığında ve her açılışta push token (APNs/FCM) backend'e gönderilir.
- **Çoklu cihaz:** Aynı hesap birden fazla cihazda açıksa hepsine push gönderilir.
- **Token yenileme:** Token expire olursa app açılışında yenisi alınır.
- **Çıkış sonrası:** Üye çıkış yaparsa o cihaz token'ı sistemden silinir.

### Bildirim içerik formatı
- **Başlık:** Kısa, eyleme yönelik (örn. "Bugün Push günü 💪").
- **Body:** Bir cümle, ayrıntı (örn. "Plana git ve antrenmanını başlat").
- **Deep link:** Her bildirim ilgili ekrana götüren deep link içerir (örn. reminder → o günün antrenman ekranı).
- **Türkçe:** Tüm bildirim metinleri TR. v1'de İngilizce yok.
- **Kişiselleştirme:** Üye adı bildirim metninde geçmez (gizlilik basitliği — "Bugün Push günü" yeter, "Ayşe bugün Push günü" değil).

### Bildirim ayarları (üye tarafı)
- **Kategori bazlı kontrol:** Üye Ayarlar > Bildirimler ekranında:
  - Reminder bildirimleri (aç/kapa)
  - Comeback bildirimleri (aç/kapa)
  - Sistem bildirimleri (aç/kapa, default açık)
  - Sabah reminder saati (varsayılan 09:00, üye değiştirebilir)
- **PT'nin müdahale yetkisi yok:** PT üye bildirim ayarlarını göremez/değiştiremez.

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **Üye birden fazla cihaza giriş yapıyor:** Tümüne push gider. Üye bir cihazda "Tamamlandı" işaretlerse diğer cihazlardaki bildirim "okundu" sayılır mı? v1'de hayır — bildirim sadece gönderilir, "okundu" senkron yok (karmaşıklık). Üye iki cihazda iki kez aynı bildirimi görebilir. (v1.5: read sync.)
- **Cihaz offline:** APNs/FCM cihaz tekrar online olduğunda bildirimi teslim eder (en fazla 28 gün). Reminder eski olabilir; bu durumda bildirimde tarih bilgisi olmalı.
- **Saat dilimi değişimi:** Üye seyahatte saat dilimi değiştirirse sistem cihaz saat dilimini baz alır. Sabah 09:00 yerel saat olarak hesaplanır.
- **Çok fazla bildirim:** v1'de günlük teorik maksimum: 2 reminder (sabah + 2 saat önce) + 1 comeback + 1 sistem = ~4 bildirim/gün. Üye için kabul edilebilir.

---

## Hata Durumları

- **APNs/FCM gönderim hatası:** Sistem 3 retry yapar (5dk, 30dk, 2saat backoff). Tüm denemeler başarısızsa loglanır, kullanıcıya gösterilmez.
- **Token geçersiz (uninstall):** APNs/FCM "invalid token" döndüğünde token DB'den silinir. Aynı hesap başka cihazda açıksa devam, hiçbir cihaz yoksa kullanıcı "pasif" sayılır.
- **Sistem aşırı yük (bildirim kuyruğu birikti):** Reminder bildirimleri öncelikli (zaman kritik). Sistem bildirimleri ertelenebilir.

---

## Boş ve Varsayılan Durumlar

- **İlk açılış:** Hiç bildirim yok. Push izni istenmemiş.
- **Bildirim ayarları default:** Tüm kategoriler açık, sabah reminder 09:00.
- **Bildirim geçmişi:** v1'de uygulama içinde "bildirim merkezi/geçmiş" YOK. Bildirim cihazın notification center'ında kalır, oradan görülür. (v1.5 adayı: app içi bildirim merkezi.)

---

## İlişkili Feature'lar

- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — Bildirim sisteminin en büyük tüketicisi. Reminder, comeback ve telafi penceresi bildirimleri bu motordan tetiklenir.
- **[Onboarding](03-onboarding.md)** — Push izni isteme onboarding sonrasında. Davet kabul bildirimi onboarding'in çıktısı.
- **[Program Builder](02-program-builder.md)** — Yeni program / program güncelleme bildirimleri buradan tetiklenir.

---

## Açık Sorular

- **Push provider:** Firebase Cloud Messaging (FCM) iOS+Android için tek noktadan yönetim sağlar (iOS'a APNs köprü yapar). Alternatif: Direkt APNs+FCM ayrı entegrasyon. Kickoff/research kararı.
- **Bildirim metinleri için A/B test:** v1'de A/B yok ama mimari hazır olsun mu? Şimdilik hayır — `prd-note` ile saklandı.
- **Bildirim "okundu" tracking:** Sürdürülebilirlik motoru için "üye reminder'ı gördü mü?" verisi anlamlı olabilir (push açıldı/açılmadı). v1'de YOK, v1.5 adayı.
- **Üye bildirim ayarlarını ne kadar granular yapacak:** Sadece kategori bazlı mı (reminder/comeback) yoksa daha mı detaylı (her gün ayrı saat)? PRD-refine.
- **Sessiz saat pencereyi üye değiştirebilir mi:** Şimdilik global 22:00–08:00. Gece çalışan üyeler için problem olabilir — PRD-refine'da kullanıcı geri bildirimiyle netleşir.
