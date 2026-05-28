# Onboarding (Davet + Auth)

## Özet

PT bir üyeyi sisteme nasıl ekler ve üye hesabını nasıl açar — Alpfit'in ilk dokunuş deneyimi. **Davet linki + telefon + SMS OTP** üçlüsüyle çalışır. PT sistemin içinden benzersiz davet linki üretir, kendi WhatsApp/SMS kanalından üyeye gönderir (Alpfit kanal almaz, maliyet sıfır). Üye linke tıklar, app'i indirir, telefon numarası + SMS OTP ile hesap açar, PT'ye otomatik bağlanır. PT'lerin de aynı auth akışı vardır (telefon + SMS OTP). v1'de email yok, şifre yok — sadece telefon.

---

## Kullanıcı Senaryoları

### S1 — PT yeni üye davet ediyor (mutlu yol)
Kardeş Alpfit'i açar, "Üyeler" sekmesinde "+ Üye davet et" der. Sistem benzersiz davet linki üretir: `alpfit.app/davet/k7m3x9`. Ekranda iki buton: "Linki kopyala", "QR göster". Kardeş "Linki kopyala" der, kendi WhatsApp'ını açar, Ayşe'ye yazar: *"Selam Ayşe, antrenmanlarını takip edebileceğin uygulamayı kuralım: alpfit.app/davet/k7m3x9"*. Bekleyen davet PT'nin "Üyeler" listesinde "Davet gönderildi — Ayşe (link henüz açılmadı)" olarak görünür.

### S2 — Üye davet linkine tıklıyor
Ayşe WhatsApp'ta linke tıklar. Mobile cihazsa app store'a yönlendirilir (iOS App Store / Android Play Store). App'i indirir, açar. Açılışta otomatik olarak davet kodu (`k7m3x9`) tanınmıştır (deep link). Ekranda: *"Kardeş Hoca seni Alpfit'e davet etti. Hesap aç →"* Ayşe "Hesap aç"a basar.

### S3 — Üye hesap açıyor (SMS OTP)
Ayşe telefon numarasını girer: `+90 555 123 45 67`. "Devam"a basar. Sistem 6 haneli kod SMS gönderir. Ayşe kodu girer (`482931`), doğrulanır. İsim ve soyisim sorulur (zorunlu), profil fotoğrafı opsiyonel. "Bitir"e basar — hesap açıldı, PT'ye otomatik bağlandı. Ana ekranda *"Hoş geldin Ayşe — Kardeş Hoca'nın programını bekliyorsun"* görür.

### S4 — PT üye kabulü
Ayşe hesap açtığı an PT'nin app'inde bildirim: *"Ayşe davetini kabul etti. Programını oluştur →"*. PT "Üyeler" listesinde Ayşe artık "Aktif" olarak görünür. PT program yazmaya geçer.

### S5 — PT kendi hesabını ilk açıyor
Kardeş Alpfit'i ilk kez indirdi. Açılışta "PT olarak hesap aç" / "Üye olarak gir" seçimi. "PT" seçer. Telefon + SMS OTP akışı aynı. Sonrasında PT profil formu: isim, çalıştığı spor salonu (opsiyonel), sertifika bilgisi (opsiyonel). v1'de PT hesabı için onay/manuel inceleme YOK — telefon doğrulayan herkes PT olabilir. (v1.5: PT doğrulama/spor salonu onayı eklenir.)

### S6 — Tekrar giriş
Ayşe app'i 1 ay sonra açar, çıkış yapmadıysa direkt ana ekran. Çıkış yaptıysa: telefon numarası girer → SMS OTP → giriş. "30 gün boyunca beni hatırla" varsayılan açık.

### S7 — Davet linki bozulursa / süresi geçerse
PT davet linki ürettikten sonra üye 30 gün boyunca tıklamazsa link iptal olur. PT yeni link üretir. (Süre kararı: 30 gün.)

---

## Davranış Kuralları

### Davet linki üretimi
- **PT eylemi:** "Üyeler" sekmesinde "+ Üye davet et" butonu. Tıklayınca benzersiz link üretilir (örn. 6 karakterli random kod).
- **Link içeriği:** Sadece davet kodu — üyenin telefon/isim bilgisi yok. PT linki paylaşır, kim alırsa o üye olur.
- **Tek kullanımlık:** Bir davet linki yalnızca ilk açan kişi tarafından kullanılabilir. Kullanıldıktan sonra link geçersizdir.
- **Süre:** 30 gün. 30 gün içinde kullanılmazsa link iptal olur, PT yeni link üretir.
- **PT eşzamanlı çoklu davet:** PT aynı anda birden fazla davet linki tutabilir (örn. 5 yeni üye için 5 link). Liste "Bekleyen davetler" başlığı altında görünür.

### Davet linki paylaşımı
- **Sistem kanal almaz:** Alpfit linki SMS/WhatsApp/email ile **otomatik göndermez**. PT kendi seçtiği kanaldan paylaşır.
- **Yardımcılar:** "Linki kopyala" butonu (panoya kopyalar) ve "QR göster" butonu (yüz yüze paylaşım için QR kod modal'ı).
- **Sebep:** Maliyet sıfır, BTK/SMS provider yükü yok, kardeşin zaten WhatsApp'ta üyeleriyle konuştuğu gerçeğine uygun.

### Üye hesap açma
- **Deep link:** Davet linkine tıklayan üye app'i indirir, açtığında davet kodu otomatik tanınır (mobile deep link).
- **Manuel kod girme:** Üye linki kaybettiyse veya deep link çalışmadıysa "Davet kodumu elle gir" alternatifi vardır.
- **Telefon + SMS OTP:**
  - Telefon numarası TR formatı: +90 5XX XXX XX XX
  - Sistem 6 haneli kod SMS gönderir
  - Kod 5 dakika geçerli, 1 dakika sonra "Yeniden gönder" aktif olur
  - 5 hatalı kod girişinden sonra 15 dakika kilit (brute force koruması)
- **Profil:** Telefon doğrulandıktan sonra isim (zorunlu) + soyisim (zorunlu) + profil fotoğrafı (opsiyonel) istenir.
- **Otomatik PT bağlantısı:** Davet kodu hangi PT'ye aitse, üye o PT'ye bağlı oluşturulur. Üye PT'yi değiştiremez.

### PT hesap açma
- **Aynı SMS OTP akışı** (telefon + 6 haneli kod).
- **Rol seçimi:** Açılışta "PT" / "Üye" / "Davetim var" üç buton. Davet linkiyle gelen üye doğrudan "üye" akışına girer, seçim sorulmaz.
- **PT profili:** İsim + soyisim (zorunlu), çalıştığı spor salonu (opsiyonel), sertifika notu (opsiyonel serbest metin).
- **v1'de PT doğrulama YOK:** Telefon doğrulayan herkes PT hesabı açabilir. (v1.5 adayı: spor salonu onayı, sertifika upload, manuel inceleme.)

### Oturum yönetimi
- **30 gün cihaz hatırlama:** Üye/PT bir cihazda giriş yaptıktan sonra 30 gün boyunca tekrar OTP istenmez.
- **Çıkış:** "Çıkış yap" butonu ayarlarda. Tüm cihazlardan çıkış opsiyonu (güvenlik için).
- **Şifre YOK:** Hiçbir akışta şifre olmaz. Her giriş ya cihaz hatırlama ya da SMS OTP ile.

### PT-üye ilişki yönetimi
- **PT üye çıkarabilir:** PT bir üyeyi listeden çıkarabilir. Üyenin geçmiş tamamlamaları arşivlenir, üye app'i açabilir ama yeni program almaz, "PT'nle ilişkin sonlandı" uyarısı görür.
- **Üye PT'den ayrılamaz (v1):** Üye PT'sini değiştiremez. v1'de tek PT-tek üye. (v1.5 adayı: üye PT değiştirme akışı.)
- **PT'nin hesabı silinirse:** Üyeler "PT'n artık aktif değil" görür. v1'de üye başka PT'ye geçiş akışı YOK — manuel destek gerekir.

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **Aynı telefon numarası iki kez kayıt:** İlk hesap açıldığında bağlanır. İkinci denemede "Bu telefon zaten kayıtlı, giriş yap →" yönlendirmesi.
- **PT kendisini davet ederse (test amaçlı):** Sistem davet linkini PT'nin kendisi açarsa engellemez — bir PT aynı zamanda başka PT'nin üyesi olabilir (gerçek hayatta nadir ama mümkün). Ancak aynı hesap aynı anda iki rolde olamaz; ayrı hesap açması gerekir.
- **Üye yanlış davet linkine tıklarsa:** Davet linki geçersizse "Bu davet süresi geçmiş veya kullanılmış. PT'nden yeni link iste." mesajı.
- **TR dışı telefon numarası:** v1'de sadece +90 kabul edilir. Yurtdışı numaralar reddedilir (v2 adayı).
- **App indirilmemişse:** Davet linkine masaüstünden tıklayan kullanıcıya "Mobile cihazda aç" QR kod gösterilir.

---

## Hata Durumları

- **SMS provider hatası:** SMS gönderilemezse üyeye "SMS gönderilemedi, tekrar dene veya destek ile iletişime geç" gösterilir. Sistem 3 deneme hakkı verir, sonra 5 dk bekleme.
- **Telefon numarası geçersiz:** Anında validasyon (+90 5XX format kontrolü).
- **Üye OTP'yi 5 kez yanlış girerse:** 15 dakika kilit. "Çok fazla yanlış deneme, [süre] sonra tekrar dene."
- **Davet kodu hatası:** Link tıklandığında kod yoksa veya geçersizse: "Davet bağlantısı geçersiz" + "Yeni link için PT'ne yaz" CTA.

---

## Boş ve Varsayılan Durumlar

- **PT'nin hiç üyesi yok:** "Üyeler" sekmesinde büyük CTA: "İlk üyeni davet et →".
- **PT'nin bekleyen davetleri var:** "Bekleyen davetler" başlığı altında liste. Her davet için: link, oluşturma tarihi, "Linki tekrar kopyala", "İptal et" aksiyonları.
- **Üye onboarding tamamlandı ama PT henüz program yazmadı:** Ana ekranda "Kardeş Hoca senin için programını hazırlıyor — birazdan görünür" mesajı. Bildirim sistemine kayıt: PT program kaydederse üyeye push.

---

## İlişkili Feature'lar

- **[Program Builder](02-program-builder.md)** — PT'nin program yazabilmesi için üyenin Onboarding'i tamamlamış olması gerekir.
- **[Bildirim Sistemi](04-notifications.md)** — Push notification altyapısı bu feature'da kurulur (OTP, davet kabul bildirimleri).
- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — Streak 0 olarak başlar; ilk planlı antrenman tamamlandığında 1'e geçer.

---

## Açık Sorular

- **SMS provider seçimi:** Twilio (uluslararası, dolar) vs Netgsm/İletişim Merkezi (TR, TL) — kickoff/research kararı. Maliyet, BTK uyumu, deliverability oranları karşılaştırılmalı.
- **SMS maliyet bütçesi:** ~0.10–0.30 TL/SMS, ayda 100 yeni üye + giriş OTP'leri = ~50–150 TL/ay. v1 pilot için kabul edilebilir; ölçeklendiğinde gözden geçirilir.
- **App store hesapları (Apple Developer, Google Play):** v1 launch öncesi hesap açılmalı. Apple yıllık $99, Google tek seferlik $25. Kickoff/research konusu.
- **Deep link altyapısı:** iOS Universal Link + Android App Link kurulumu. Karmaşıklık orta, kickoff'ta planlanır.
- **KVKK aydınlatma metni:** Üye hesap açarken sağlık verisi (ileride kilo/boy/sakatlık) için açık rıza gerekir. Metnin hazırlanması ve UI yerleşimi PRD-refine.
- **PT abonelik / ücretlendirme:** v1'de PT ücretsiz mi tamamen? Hesap açma sırasında plan seçimi var mı? `prd-note` ile saklandı, v1.5'te netleşir.
