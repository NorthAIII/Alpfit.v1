# M5: PT Dashboard

**Sorumluluk:** PT'nin Alpfit'i açtığında ilk gördüğü ana ekran — aktif üye listesi (dikkat-öncelikli sıralama), adaptif banner stack (T+7 comeback uyarıları + programı bekleyen yeni üyeler), üye detay drill-down (özet + CTA grid), PT not düşme, WhatsApp deep link, üye çıkarma akışı, bekleyen davetler listesi.
**Bağımlılık:** M0, M1, M2, M3, M4, M6 — hepsinin agregatörü.
**Sınır:** Bu modül sadece **PT görünüm katmanıdır** — iş mantığı kaynak modüllerde:
- Streak değeri, comeback uyarıları, kayıp risk etiketi → **M3'ten gelir**, M5 sadece görüntüler
- Davet linki üretimi, "Bekleyen davetler" verisi → **M1'den gelir**
- Program / "Program oluştur" CTA → **M2'ye yönlendirir**
- Ölçüm / Yemek günlüğü CTA → **M6'ya yönlendirir**
- WhatsApp deep link açma sistem dışı (üye telefon numarasına WhatsApp URL scheme)

Üye çıkarma akışı M5'te yaşar ama veri arşivleme M0 sorumluluğu (KVKK çerçevesi).

---

## Feature'lar

### F5.1: PT Dashboard — Üye Listesi → —

**Açıklama:** PT'nin "şimdi yapması gereken işi" tek bakışta gösteren ana ekran. M3 motorunun PT görünümüdür. Banner stack 0/1/2+ uyarı senaryosuna adaptif; üye satırları streak + son aktivite + durum etiketleri taşır; üye satırına tıklayınca özet detay sayfası açılır ve buradan drill-down ile program/ölçüm/yemek günlüğüne gider.

**Kabul Kriterleri:**

*Ana ekran kompozisyonu (üst→alt):*
- Üst bar: sol "Üyelerim (N)" başlığı (N = aktif üye sayısı, bekleyen davet sayılmaz); sağ "+ Davet et" CTA → M1 davet linki üretme akışı
- Banner stack: şartlı (aşağıda detay). 0 uyarı varsa bölüm tamamen kaybolur
- Aktif liste: default dikkat-öncelikli sıralı
- Bekleyen davetler: collapse bölüm. 0 davet varsa başlık görünmez. Açılır liste her davet için tek satır + "Linki tekrar kopyala" / "İptal et"

*Üst banner stack (adaptif):*

| Olay | Tetik | Görünüm |
|---|---|---|
| T+7 comeback | M3 (üye 7 gündür aktif değil) | *"[Üye adı] [N] gündür aktif değil — manuel iletişim önerilir"* + **Profili aç** / **Okudum** |
| Program bekleyen yeni üye | M1 (üye davet kabul etti) + M2 (programı yok) | *"[Üye adı] davetini kabul etti — programını oluştur"* + **Program oluştur** |

- **0 uyarı:** Banner bölümü tamamen gizli
- **1 uyarı:** İçerik direkt görünür
- **2+ uyarı:** Collapsed satır: *"⚠️ [N] uyarı var — görüntüle"* — tıklayınca bottom sheet açılır; her uyarı kendi satırı + kendi aksiyonu. Sheet kapatılınca banner sayacı güncellenir
- **Sıralama 2+ sheet içinde:** Comeback uyarıları önce (aciliyet yüksek), sonra program bekleyenler
- **"Okudum" davranışı (comeback için):** PT "Okudum" der → banner kaybolur, **tekrar belirmez**. 14. günde satırda ⚠️ "Kayıp risk" etiketi belirir. Re-aktivasyon olursa etiket kaybolur ve "Okudum" sıfırlanır (yeni kopma olursa T+7 banner tekrar tetiklenir)
- **"Program oluştur" davranışı:** Program yazılıp kaydedilince banner otomatik kaybolur; "Okudum" yok

*Üye satırı içeriği:*
- Sol: üye adı + soyadı baş harfi (örn. "Ayşe Y."). **Profil fotoğrafı YOK** v1
- Orta: 🔥 + streak sayısı (M3'ten)
- Sağ: son aktivite veya sıradaki antrenman (bağlamlı):
  - Bugün tamamladıysa: *"Bugün HH:MM ✓"*
  - Bugün planlı ama tamamlamadıysa: *"Bugün [Tip]"*
  - Dün/önceki aktifti: *"[N] gün önce"*
  - Yarın planlı: *"Yarın [Tip]"*
  - 3+ gün aktif değil: *"[N] gün önce"* (kırmızı/turuncu vurgu)
  - Programı yok: alan boş, etiket bölgesinde 🆕 "program yok"
- Etiket bölgesi (sağdan sola stack):

| Etiket | Tetik | Anlam |
|---|---|---|
| ⚠️ Kayıp risk | M3 T+14 | Üye 14 gündür aktif değil; re-aktivasyona kadar kalır |
| 🔕 | M4 push izni kapalı | PT'nin manuel WhatsApp gerektiği işareti |
| ⏰ Telafi penceresi | M3 dünkü antrenman + telafi açık | Üye dün kaçırdı, bugün gece yarısına kadar telafi |
| 🆕 program yok | M1 davet kabul + M2 program yazılmadı | PT henüz program yazmadı |

Aynı üyede birden fazla etiket olabilir.

*Sıralama (default dikkat-öncelikli):*
1. ⚠️ Kayıp risk (T+14) — en üstte
2. Comeback aktif (T+7 banner aldı, "Okudum" denmemiş)
3. ⏰ Telafi penceresinde
4. 🆕 Program bekleyen yeni üye
5. Normal aktif üyeler (en uzun streak'ten en kısaya)

PT manuel sıralama seçenekleri (üst bar ⇅): "En uzun streak üstte" / "En kısa streak üstte" / "Alfabetik (A→Z)". Seçim **cihaza** kaydedilir (çoklu cihaz sync v1'de YOK).
**Arama/filtre v1'de YOK** (5 üyeli pilotta gereksiz; v1.5 adayı 15+ üyede).

*Bekleyen davetler bölümü:*
- Aktif üye listesinin altında **"Bekleyen davetler (N) ▾"** başlık. N=0 → başlık gizli
- Açık/kapalı state cihazda hatırlanır; default kapalı
- Her davet için satır: gönderim tarihi + **Linki tekrar kopyala** (toast: "Link kopyalandı") + **İptal et** (onay sorulmadan)
- M1 davet süresi (30 gün) dolduğunda davet kendi kendine iptal olur, PT bildirim almaz, satır sessizce kaybolur

*Üye detay sayfası (özet + drill-down):*
- Üst kart: üye adı + soyadı tam (listede kısaltıldı, detayda tam) + telefon numarası (tap → WhatsApp deep link) + aktif etiket(ler) + streak + son aktivite + sıradaki antrenman
- CTA grid:
  - **Program** → M2 Program Builder'da bu üyenin programı
  - **Ölçüm ekle** → M6 (F6.1) yeni kayıt formu
  - **Yemek günlüğü** → M6 (F6.2) okuma erişimi (toggle kapalıysa disabled)
  - **Geçmiş** → üyenin tamamlanmış antrenman geçmişi (M2 (F2.2) liste yapısı, PT okuma modunda)
  - **Not düş** → modal (serbest metin + kaydet)
  - **WhatsApp** → telefon numarasına eşdeğer deep link
- Son notlar: en yeni 3 not + "Hepsini gör →" linki ile tam liste
- Eylem menüsü (⋯): "Üyeyi çıkar"
- *Son ölçümler bölümü:* en yeni 3 ölçüm (M6 (F6.1) sağlar; "Son ölçüm: X gün önce" hint M6'ya bağlı)
- *Yemek günlüğü hint:* "Son giriş: X gün önce" veya "Hiç giriş yok" (M6 (F6.2) sağlar; toggle kapalıysa disabled CTA + "[Üye adı] yemek günlüğünü paylaşmıyor" mesajı)

*PT not düşme:*
- Erişim: Üye detayında "Not düş" CTA veya ⋯ menüsü
- İçerik: serbest metin (TR), max 500 karakter; tarih + saat otomatik; **üye göremez** (PT'ye özel)
- Liste: detay alt bölümünde en yeni 3 not + "Hepsini gör →"
- PT kendi notunu düzenleyebilir/silebilir

*WhatsApp deep link:*
- Tetik: detayda telefon numarasına veya "WhatsApp" CTA'sına tap
- Davranış: `whatsapp://send?phone={üye_telefon_E164}` — WhatsApp yüklüyse o üyenin konuşması açılır, **önceden yazılmış metin yok**
- Fallback: WhatsApp yoksa `tel:` URL (telefon arama uygulaması açılır) + toast *"WhatsApp bulunamadı, arama açılıyor"*
- Alpfit hiçbir zaman üyeye otomatik WhatsApp mesajı atmaz (v1.5'te WhatsApp Business API hariç)

*Üye çıkarma:*
- Erişim: detayda ⋯ → "Üyeyi çıkar"
- Onay modalı: *"[Üye adı] artık üyen olmayacak. Geçmiş tamamlamaları arşivlenir. [Üye adı] 'PT'nle ilişkin sonlandı' uyarısı görür. Geri alınamaz."*
- Onay sonrası: üye listeden kaybolur; M2 programı + M2 (F2.2) geçmiş tamamlamaları + M6 (F6.1 + F6.2) veri arşivlenir (M0 KVKK saklama). Üye app açtığında "PT'nle ilişkin sonlandı" görür. Geri alma v1'de YOK; PT yeniden davet ederse üye **yeni hesap** açar (eski veri taşınmaz)

*Boş ve varsayılan durumlar:*
- Hiç üye yok: merkezde *"İlk üyeni davet et →"* CTA (M1 davet akışı)
- Sadece bekleyen davet var: aktif liste yerine *"Henüz aktif üyen yok — davetinin açılmasını bekliyorsun"* + Bekleyen davetler bölümü default açık
- Tüm aktif üyeler dinlenme: liste normal, her satırda "Yarın [Tip]" veya "[N] gün sonra"
- Banner yok + aktif üye var: üst banner bölümü tamamen kaybolur

**Bağımlılık:** F1.1 (davet, üye çıkarma), F2.1 (program oluştur CTA), F2.2 (geçmiş erişimi), F3.1 (streak/comeback/etiket görünümü), F4.1 (banner stack push event'leri), F6.1 (ölçüm CTA + son ölçümler), F6.2 (yemek günlüğü CTA + hint).

**Edge Case'ler:**
- **Aynı üye birden fazla etiket alır:** Etiket stack sağdan sola dizilir. Sıralama dikkat-öncelikli kalır (etiket sayısı sıralamayı değiştirmez).
- **PT hesabını yeni açtı, hiç üye yok:** Merkezde büyük CTA *"İlk üyeni davet et →"*; banner ve bekleyen davetler bölümü yok.
- **PT'nin sadece bekleyen daveti var, aktif üye yok:** Aktif liste boş; "Henüz aktif üyen yok, davetinin açılmasını bekliyorsun"; bekleyen davetler bölümü default açık.
- **PT app'i ilk kez açar, push token kayıt başarısız:** Üst bar yanında 🔕 ikonu (kendi push kapalı). Tıklayınca *"PT bildirimlerin kapalı — ayarlardan aç →"*.
- **Banner içindeki üye PT tarafından çıkarıldı:** Banner kaybolur, sheet'teki satır da kaybolur (sessiz).
- **PT 50+ üyeli (v1.5+):** v1'de hedef değil; tüm üyeler tek seferde yüklenir. 30+ üyede yavaşlama olursa v1.5 lazy load + arama eklenir.
- **PT kendi telefonunu üye olarak davet ederse:** M1 izin verir (ayrı hesap). Pilot için kabul edilebilir.
- **Çoklu PT cihazı:** iPhone + iPad'den giriş yapabilir. Üye listesi + banner state server-side sync. Manuel sıralama tercih lokal (cihaza özel).
- **Üye listesi yüklenemedi (network):** Üst banner *"Üye listesi yüklenemedi, yenile →"* + cache varsa eski liste.
- **Banner aksiyonu başarısız ("Okudum" senkron hatası):** Local'de işaretlenir, server'a kuyruğa alınır. UI'da kaybolur, arka planda retry. 3 retry sonrası yine başarısızsa next session'da yeniden banner görünür.
- **WhatsApp deep link açılmadı (URL scheme yok):** Toast *"WhatsApp açılamadı — numarayı kopyalıyorum"* + telefon clipboard'a kopyalanır.
- **Üye çıkarma onaylandı ama server hatası:** Üye listede kalır + üst banner *"Çıkarma başarısız, tekrar dene"*. (Local'de "çıkarıldı" gibi davranma — yarı-state riski.)
- **Davet linki kopyala başarısız (clipboard izni yok):** Modal açılır, link metin olarak gösterilir, "Linki manuel kopyala" yönlendirmesi.
- **Notları boş üye (yeni üye):** "Son notlar" altında *"Henüz not düşmedin. İlk notunu ekle →"*.

**PRD Referans:** `_dev/PRD/features/06-pt-dashboard.md`

---

## Teknik Notlar

- **Profil fotoğrafı:** v1'de YOK (sade tutuldu); F1.1'de "opsiyonel" denmiş ama detay sayfasında da YOK varsayıldı. v1.5 adayı.
- **Notlar dışa aktarma (PT yıl sonu özet):** v1'de YOK; v1.5 adayı (Word/PDF export).
- **Üye KVKK self-silme talebi PT dashboard'a nasıl yansır?** KVKK çerçevesi M0'da, ama UI yansıması (üye satırı kaybolur mu, "silindi" notu kalır mı?) PRD-refine konusu — KVKK metni Yakın 4 öncesi tamamlanırken karara bağlanır.
- **PT için "geçmiş comeback" görünümü:** v1'de YOK; v1.5 retention dashboard'a katkı; v2 Gym Owner retention dashboard'una temel.
- **Bekleyen davet süresi göstergesi:** v1'de sadece tarih (sade tutuldu); "kalan süre: 12 gün" sayaç v1.5 adayı.
- **PT'nin notlarına arama:** v1'de YOK; pilot'ta kardeş "Mehmet için ne not düşmüştüm" diye geriye dönerse v1.5 arama eklenebilir.
- **Bu modülün başlama önkoşulu** birçok modülün hazır olmasına bağlıdır — Yakın 4 öncesi tüm M3 + M4 + M6 hazır olmalı, yoksa dashboard boş ekran (kabul edilemez).

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: F06 PRD davranışı M5 kabul kriterlerine dönüştürüldü; modüller arası agregasyon sınırı netleştirildi.
