# M1: Auth & Onboarding

**Sorumluluk:** Üye ve PT'nin sisteme girişi — PT davet linki üretimi, deep link, üye SMS OTP onboarding'i, rol seçimi, profil oluşturma, 30 gün cihaz hatırlama ve KVKK açık rıza ekranı.
**Bağımlılık:** M0 (3 rol veri modeli, env/secret, KVKK çerçevesi, TR locale).
**Sınır:** Davet linki **üretimi ve kullanımı** burada; davet linkinin **WhatsApp/SMS ile paylaşımı sistem dışı** (PT kendi kanalından paylaşır — Alpfit kanal almaz). Push bildirim altyapısı M4'te (davet kabul bildirimi M4 üzerinden tetiklenir).

---

## Feature'lar

### F1.1: Onboarding (Davet + Auth) → —

**Açıklama:** PT bir üyeyi nasıl ekler ve üye hesabını nasıl açar — Alpfit'in ilk dokunuş deneyimi. Davet linki + telefon + SMS OTP üçlüsüyle çalışır. PT sistemin içinden benzersiz davet linki üretir, kendi WhatsApp/SMS kanalından üyeye gönderir (Alpfit kanal almaz, maliyet sıfır). Üye linke tıklar, app'i indirir, telefon + SMS OTP ile hesap açar, PT'ye otomatik bağlanır. PT'lerin de aynı auth akışı vardır. v1'de email yok, şifre yok — sadece telefon.

**Kabul Kriterleri:**

*Davet linki üretimi:*
- PT "Üyeler" sekmesinde "+ Üye davet et" butonuna basınca benzersiz davet kodu (örn. 6 karakterli) içeren link üretilir: `alpfit.app/davet/{kod}`
- Link sadece davet kodu içerir — üye telefon/isim bilgisi link içinde yok
- Bir davet linki **tek kullanımlık** (ilk açan kişi bağlanır, sonra geçersiz)
- Davet linki **30 gün** içinde kullanılmazsa otomatik iptal olur
- PT eş zamanlı birden fazla davet linki tutabilir (örn. 5 yeni üye için 5 ayrı link), liste "Bekleyen davetler" başlığında görünür
- PT için iki yardımcı: "Linki kopyala" (panoya kopyalar), "QR göster" (yüz yüze paylaşım için QR kod modal'ı)
- Alpfit linki **otomatik SMS/WhatsApp/email ile göndermez** — PT kendi kanalından paylaşır

*Üye onboarding (SMS OTP):*
- Davet linkine tıklayan üye app store'a yönlendirilir; app açıldığında davet kodu otomatik tanınır (deep link)
- "Davet kodumu elle gir" alternatifi vardır (deep link çalışmadığında)
- Telefon numarası TR formatında girilir (+90 5XX XXX XX XX), inline validation
- 6 haneli OTP kod SMS gönderilir
- Kod 5 dakika geçerli, 1 dakika sonra "Yeniden gönder" aktif
- 5 hatalı kod girişinden sonra 15 dakika kilit (brute force koruması)
- Telefon doğrulandıktan sonra: isim (zorunlu) + soyisim (zorunlu) + profil fotoğrafı (opsiyonel — v1'de profil fotoğrafı zorunlu değil)
- Davet kodu hangi PT'ye aitse, üye o PT'ye **otomatik bağlanır**
- Üye onboarding biter bitmez PT'ye push: *"[Üye adı] davetini kabul etti. Programını oluştur →"* (F4.1 üzerinden)

*PT onboarding:*
- App açılışında "PT" / "Üye" / "Davetim var" üç buton (davet linkiyle gelen üye doğrudan üye akışına girer, seçim sorulmaz)
- PT için aynı telefon + 6 haneli SMS OTP akışı
- PT profili: isim + soyisim (zorunlu), çalıştığı spor salonu (opsiyonel), sertifika notu (opsiyonel serbest metin)
- **v1'de PT doğrulama YOK** — telefon doğrulayan herkes PT olabilir (v1.5 adayı)

*Oturum yönetimi:*
- 30 gün cihaz hatırlama varsayılan açık (üye/PT bir cihazda giriş yaptıktan sonra 30 gün tekrar OTP istenmez)
- "Çıkış yap" butonu Ayarlar'da; "Tüm cihazlardan çıkış" opsiyonu da var
- **Şifre YOK** — her giriş ya cihaz hatırlama ya da SMS OTP

*PT-üye ilişki yönetimi:*
- PT üyeyi listeden çıkarabilir (F5.1 dashboard üzerinden)
- Üye PT'sini değiştiremez (v1'de tek PT-tek üye; v1.5 adayı: üye PT değiştirme akışı)
- PT'nin hesabı silinirse üye "PT'n artık aktif değil" görür; v1'de başka PT'ye geçiş akışı yok — manuel destek

*KVKK rızası:*
- SMS OTP sonrası, profil formundan önce KVKK aydınlatma + sağlık verisi açık rıza ekranı çıkar
- Üye onaylamadan hesap açılmaz
- Tam metin `KVKK.md`'de (boş şablon — Yakın 4 öncesi hukuki review'lı doldurulur)

**Bağımlılık:** Yok (M1'in tek feature'ı; üst-seviye sadece M0'a bağlı).

**Edge Case'ler:**
- **Aynı telefon iki kez kayıt:** İlk hesap açıldığında bağlanır. İkinci denemede "Bu telefon zaten kayıtlı, giriş yap →" yönlendirmesi.
- **PT kendi davet linkini kendisi açarsa:** Sistem engellemez (bir PT başka PT'nin üyesi olabilir teorik olarak), ama aynı hesap iki rolde olamaz — ayrı hesap açması gerekir.
- **Üye geçersiz davet linkine tıklarsa:** "Bu davet süresi geçmiş veya kullanılmış. PT'nden yeni link iste." mesajı.
- **TR dışı telefon numarası:** v1'de sadece +90 kabul edilir, yurt dışı reddedilir (v2 adayı).
- **App indirilmemişse:** Davet linkine masaüstünden tıklayan kullanıcıya "Mobile cihazda aç" QR kod gösterilir.
- **SMS provider hatası:** "SMS gönderilemedi, tekrar dene veya destek ile iletişime geç" — sistem 3 deneme hakkı verir, sonra 5 dk bekleme.
- **Telefon numarası geçersiz:** Anında inline validation (+90 5XX format kontrolü).
- **5 hatalı OTP:** 15 dakika kilit; "Çok fazla yanlış deneme, [süre] sonra tekrar dene."
- **Davet kodu hatası:** Link tıklandığında kod yoksa veya geçersizse: "Davet bağlantısı geçersiz" + "Yeni link için PT'ne yaz" CTA.

**PRD Referans:** `_dev/PRD/features/03-onboarding.md`

---

## Teknik Notlar

- **SMS provider seçimi `TECH-STACK.md`'de** (Twilio vs Netgsm/İletişim Merkezi). Maliyet ~0.10–0.30 TL/SMS; v1 pilot kabul edilebilir.
- **Deep link altyapısı:** iOS Universal Link + Android App Link kurulumu — Yakın 1'de planlanır.
- **App store hesapları (Apple Developer $99/yıl, Google Play $25 tek seferlik):** Yakın 5 launch öncesi açılmalı.
- **PT abonelik / ücretlendirme modeli:** v1'de PT tamamen ücretsiz mi yoksa hesap açma sırasında plan seçimi var mı? `prd-note` ile saklandı — v1.5 öncesi netleşir. **Auth flow şimdilik plan-bilinçsiz** kurulur.
- **F4.1 bağı:** Davet kabul push'u F4.1 altyapısı kurulmadan tetiklenemez — bu nedenle "Çekirdek Altyapı + Auth" fazı F4.1 olmadan bitirilirse "kabul ettim" event'i sadece in-app olarak gösterilir, push Yakın 3'te eklenir. **Karar:** v1 Auth fazında push KISMI olabilir — discuss-phase'de netleşir.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: F03 PRD davranışı M1 kabul kriterlerine dönüştürüldü.
