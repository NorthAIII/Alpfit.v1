# M4: Bildirim Altyapısı

**Sorumluluk:** v1'in bildirim altyapısı — APNs + FCM push notification, token yönetimi, sessiz saat penceresi (22:00–08:00), izin akışı, deep link payload, in-app banner fallback. M3 motorunun ve diğer modüllerin "üyeye / PT'ye bildir" event'lerini push'a (veya in-app fallback'e) çevirir.
**Bağımlılık:** M0, M1, M3 (event üretici).
**Sınır:** v1'de **WhatsApp/SMS YOK** (mimari v1.5'te WhatsApp Business API'yi ekleyebilecek şekilde kurulur). Üye/PT push iznini reddetmişse v1'de **dışarıdan üyeye ulaşma yolu yoktur** — sadece in-app banner. Bildirim içeriğinin (metin, deep link hedefi, tetik zamanı) iş kuralı M3/M5/F1.1'e aittir; M4 sadece teknik teslim altyapısıdır.

---

## Feature'lar

### F4.1: Bildirim Sistemi (Push) → —

**Açıklama:** Native push notification altyapısı (iOS APNs + Android FCM). Sürdürülebilirlik motorunun reminder ve comeback bildirimleri, davet kabul bildirimleri, sistem mesajları bu kanaldan geçer. Üye push iznini reddetmiş/kapatmışsa sistem in-app uyarısı gösterir.

**Kabul Kriterleri:**

*Bildirim kanalı:*
- v1 tek kanal: native push (iOS APNs + Android FCM)
- WhatsApp/SMS v1'de YOK (v1.5 adayı — özellikle T+7 ve T+14 comeback için kritik moment kanalı)
- In-app fallback: push gönderilemediğinde (izin yok, cihaz offline) bilgi in-app banner/ekran içinde gösterilir

*Bildirim tipleri:*
- Reminder bildirimleri (M3 tetikler) — sabah + 2 saat önce (saat tanımlıysa)
- Comeback bildirimleri (M3 tetikler) — T+2 üye, T+7 PT, T+14 PT (kayıp risk — etiket M5'te de görünür)
- Üye davet kabul bildirimi (F1.1 tetikler) — PT'ye push *"[Üye adı] davetini kabul etti."*
- Yeni program bildirimi (F2.1 tetikler) — üyeye push *"Programın hazır 🎉 Gör →"*
- Program güncelleme bildirimi (F2.1 tetikler) — üyeye push *"Programında değişiklik var."*
- Sistem bildirimleri (hesap güvenliği, önemli güncellemeler) — v1'de minimal

*Push izni yönetimi:*
- İlk istek: onboarding tamamlandıktan sonra app içi açıklama ekranı + native diyalog (onboarding sırasında değil — "neden?" bilmesi için açıklama gelmeli)
- İzin reddedildiyse cebren tekrar istenmez (iOS/Android kısıtlaması). Yerine:
  - Üye ana ekranında üst banner uyarısı (kapatılabilir, haftada bir tekrar görünür)
  - PT tarafında üye satırında 🔕 ikonu (M5 görünüm)
  - Ayarlar > Bildirimler ekranında "İzin ver" CTA (cihaz ayarlarına yönlendirir)
- İzin sonradan açıldığında app açılışında otomatik algılanır, banner kaybolur

*Sessiz saatler:*
- Global pencere: 22:00–08:00 arası hiçbir bildirim gönderilmez
- Pencereye denk gelen reminder: bir sonraki açık pencerede **atılmaz** (geç hatırlatma kafa karıştırıcı); atılmayan bildirim loglanır
- Pencereye denk gelen comeback: ertesi gün 09:00'da atılır (zamanlama esnek)
- PT bildirimleri için sessiz saat aynı (22:00–08:00) — PT uyarıları acil değil, ertelenebilir

*Cihaz token yönetimi:*
- Üye/PT app'i ilk açtığında ve her açılışta push token (APNs/FCM) backend'e gönderilir
- Çoklu cihaz: aynı hesap birden fazla cihazda açıksa hepsine push gönderilir
- Token expire olursa app açılışında yenisi alınır
- Çıkış sonrası: o cihaz token'ı sistemden silinir

*Bildirim içerik formatı:*
- Başlık: kısa, eyleme yönelik (örn. "Bugün Push günü 💪")
- Body: bir cümle, ayrıntı (örn. "Plana git ve antrenmanını başlat")
- Her bildirim deep link içerir (örn. reminder → o günün antrenman ekranı)
- Tüm bildirim metinleri TR (v1'de İngilizce yok)
- Üye adı bildirim metninde geçmez (gizlilik basitliği)

*Bildirim ayarları (üye tarafı — Ayarlar > Bildirimler):*
- Reminder bildirimleri (aç/kapa)
- Comeback bildirimleri (aç/kapa)
- Sistem bildirimleri (aç/kapa, default açık)
- Sabah reminder saati (varsayılan 09:00, üye değiştirebilir)
- PT'nin müdahale yetkisi yok — üye kendi ayarlar

**Bağımlılık:** F1.1 (token kaydı onboarding sonrası), F3.1 (motor reminder/comeback event'leri), F2.1 (program değişiklik event'i), F5.1 (PT banner görünümü için).

**Edge Case'ler:**
- **Üye birden fazla cihaza giriş yapıyor:** Tümüne push gider; v1'de "okundu sync" YOK; üye iki cihazda iki kez aynı bildirimi görebilir (v1.5 read sync).
- **Cihaz offline:** APNs/FCM cihaz tekrar online olduğunda bildirimi teslim eder (en fazla 28 gün). Reminder eski olabilir; bildirimde tarih bilgisi olmalı.
- **Saat dilimi değişimi:** Üye seyahatte saat dilimi değiştirirse sistem cihaz saat dilimini baz alır.
- **Çok fazla bildirim:** v1'de günlük teorik maksimum ~4 bildirim/gün (2 reminder + 1 comeback + 1 sistem). Üye için kabul edilebilir.
- **APNs/FCM gönderim hatası:** 3 retry (5dk, 30dk, 2saat backoff). Tüm denemeler başarısızsa loglanır, kullanıcıya gösterilmez.
- **Token geçersiz (uninstall):** APNs/FCM "invalid token" döndüğünde token DB'den silinir. Aynı hesap başka cihazda açıksa devam; hiçbir cihaz yoksa kullanıcı "pasif" sayılır.
- **Sistem aşırı yük (bildirim kuyruğu birikti):** Reminder bildirimleri öncelikli (zaman kritik); sistem bildirimleri ertelenebilir.
- **İlk açılış:** Hiç bildirim yok; push izni istenmemiş.
- **Bildirim ayarları default:** Tüm kategoriler açık, sabah reminder 09:00.
- **Bildirim geçmişi:** v1'de uygulama içinde bildirim merkezi/geçmiş YOK; cihazın notification center'ında kalır (v1.5 adayı).

**PRD Referans:** `_dev/PRD/features/04-notifications.md`

---

## Teknik Notlar

- **Push provider seçimi `TECH-STACK.md`'de:** FCM tek nokta (iOS+Android tek SDK, FCM APNs köprüsü yapar) vs Direkt APNs+FCM ayrı entegrasyon. Karar Yakın 1 research-phase'de.
- **Mimari v1.5 WhatsApp Business API ekleyebilecek şekilde:** Bildirim gönderim katmanı "kanal-agnostik" tasarlanır — push kanalı tek implementation, WhatsApp ikinci implementation olarak gelir.
- **Bildirim metinleri için A/B test:** v1'de YOK; mimari hazır olsun mu? Şimdilik hayır (`prd-note`'a saklandı).
- **Sessiz saat penceresi:** Şimdilik global hardcode 22:00–08:00; üye-özelleştirilebilir yapı v1.5 adayı.
- **PT üyenin bildirim ayarını göremez/değiştiremez** — gizlilik sınırı.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: F04 PRD davranışı M4 kabul kriterlerine dönüştürüldü; modüller arası event üretim/teslim sınırı netleştirildi.
