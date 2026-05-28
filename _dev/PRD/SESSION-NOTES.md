# Alpfit PRD — Session Notes

> Bu dosya bir oturum günlüğü değil, PRD'nin **anlık çalışma durumu kanvasıdır**. Olgunlaşmış konular feature dosyalarına / VERSIONS.md / 00-VISION.md'ye aktarıldı ve buradan **izsiz çıktı**. Sadece henüz konuşulmamış veya çözülmemiş konular kalır.

---

## Açık Sorular (PRD-refine'da netleşecek)

### Yazılması Bekleyen v1 Feature'ları
Aşağıdaki feature'lar v1 kapsamında olduğu kabul edildi ama dedicated feature dosyası henüz yok. PRD-refine oturumunda yazılmalı:

- **PT Dashboard / Üye Listesi** — PT ana ekran kompozisyonu. Üye listesi, streak görünürlüğü, comeback uyarıları, "kayıp risk" etiketleri burada görünür. Sürdürülebilirlik motorunun **PT görünümü**. Bir sonraki PRD-refine için en kritik sıradaki feature — `05-member-program-view.md` yazıldı; PT-side tamamlanmadan motor görünmez.
- **Üye Ölçüm Takibi** — Kilo/boy/vücut ölçümleri PT tarafından girilir. Hangi sıklıkla, hangi metrikler, grafik gösterimi var mı? Brief Soru 6.
- **Üye Yemek Günlüğü** — Üyenin yediklerini girdiği form. Kalori/makro yapısı, manuel mi, hazır yemek seçimi mi (v1'de muhtemelen sadece serbest metin + manuel kalori). v1.5 AI önerisinin temelini hazırlamalı.

### Teknik Mimari (kickoff'a bırakılan)
Bu kararlar PRD seviyesi değil, `/devflow:kickoff`'ta verilecek — ama PRD'yi etkileyen yönü varsa not düşülmüş:

- **Mobile stack:** Expo/React Native vs Flutter vs native Swift+Kotlin. Brief Soru 1.
- **Backend stack:** Node + Postgres baz alındı (dev container template'i). Kesin değil.
- **SMS provider:** Twilio vs TR yerel (Netgsm, İletişim Merkezi). Maliyet ve BTK uyumu karşılaştırılmalı.
- **Push provider:** FCM tek nokta vs APNs+FCM ayrı.
- **App store hesapları:** Apple Developer ($99/yıl), Google Play ($25 tek seferlik). Açılma zamanı v1 launch'tan önce.

### Yasal / Operasyonel
- **KVKK aydınlatma metni:** Üye sağlık verisi (ileride kilo/boy/sakatlık) için açık rıza metni. Hazırlanması + UI yerleşimi.
- **PT ücretlendirme modeli:** v1'de tamamen ücretsiz mi, freemium mu, ileride abonelik mi? Brief Soru 10. v1 pilot için ücretsiz mantıklı ama v1.5 öncesi karar verilmeli.
- **Sağlık verisi saklama süresi:** KVKK kapsamında ne kadar tutulur, üye hesabı silindiğinde ne olur?

### v1 Pilot Ölçümleri
- **PT program yazma süresi (mevcut):** Kardeşin Word/WhatsApp ile bir program yazması kaç dakika? Builder hedefi (yarısına indirme) bu baseline olmadan doğrulanamaz. **Kardeşten ölçüm istenebilir** (basit: bir sonraki yeni üye için "kaç dakika sürdü" notu).
- **Çekirdek 50 egzersiz listesi:** Hangi 50 hareket? Kardeşle birlikte liste oluşturulmalı. v1 launch öncesi tamamlanmalı. Bilim/uzmanlık eksenli karar.
- **Çekirdek egzersiz videoları:** Stok mu, Alpfit kendi mi çeker, kardeşle mi? İçerik üretim kararı — bütçe ve zaman bağı.

### Feature Detay Soruları (her feature'da yazılmış)
Her feature dosyasının "Açık Sorular" bölümünde detay kalmıştır — PRD-refine'da o feature için derinleşildiğinde tek tek çözülür.

---

## Keşfedilmemiş Alanlar

### Hata / Edge Senaryolar
- **PT hesabı suspended / banned (ileride moderation gerekirse):** v1'de muhtemelen YOK ama mimari hazırlık?

### UX
- **İlk açılış onboarding tour:** Üye/PT app'i ilk açtığında özellik tanıtım turu var mı, yoksa "kullandıkça öğren" mi? v1 minimal tercih edilebilir.
- **Genel görsel dil:** Renkler, tipografi, ikon dili — kardeş "modern/akıcı/profesyonel his" istedi (Q9) ama somut yön yok. Tasarım fazına özel.
- **Türkçe dil tonu:** Resmî mi, samimi mi? "Bugün Push günü 💪" emoji içeriyor mu içermiyor mu — marka kararı.

### İş Mantığı
- **Üye birden fazla PT'yle çalışabilir mi (gerçek hayat senaryosu):** Bazı üyeler beslenme PT'si + güç PT'si olabilir. v1'de tek PT-tek üye kuralı koyduk, ama gerçek hayatta ne kadar yaygın?
- **Üye ödemesi / faturalandırma:** Alpfit fatura/ödeme tutmuyor (v1), bu PT'nin işi. Ama "üye PT'sine ne ödüyor" görünür mü? v1'de YOK denildi, ama PT için bir gelir takip ekranı talebi gelebilir.

---

## Gözlemler ve Hipotezler (henüz kullanıcıyla konuşulmamış)

- **PT'nin "manuel WhatsApp atması" expected davranış.** T+7 comeback uyarısı PT'ye "manuel iletişim öner" diyor. Sistem otomatik WhatsApp atmıyor (v1.5'e bırakıldı). Bu açıklık PT'ye yük bindirir ama brief'in "kardeş zaten WhatsApp'ta üyeleriyle konuşuyor" gerçeğine uyar. Pilot'ta doğrulanmalı.
- **"Tek PT-tek üye" kuralı yumuşatılabilir mi?** v1'de katı kural ama bazı üye gerçek hayatta birden fazla PT ile çalışıyor (kuvvet + beslenme + esneklik). Bu sınır pilot'ta hissedilirse v1.5'te yumuşatılır.
