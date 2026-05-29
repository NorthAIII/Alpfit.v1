# PT Dashboard — Üye Listesi

## Özet

PT'nin Alpfit'i açtığında ilk gördüğü ana ekran — sürdürülebilirlik motorunun (§01) **PT görünümüdür**. Aktif üye listesi merkezdedir; her satır motorun çıktısını taşır (streak, son aktivite, durum etiketleri). Üstte adaptif banner stack PT'nin "şimdi yapması gereken işi" gösterir: T+7 comeback uyarıları (§01) ve programı bekleyen yeni üyeler (§03). Üye satırına tıklayınca **özet detay sayfası** açılır (drill-down ile program/ölçüm/yemek günlüğüne gider — sekme/scroll yok). Liste, kardeşin günlük açılış akışında *"bugün kime dokunmam gerek?"* sorusunu tek bakışta yanıtlamalıdır.

---

## Kullanıcı Senaryoları

### S1 — Sabah açılış (mutlu yol)
Kardeş 08:15'te Alpfit'i açar. Banner yok. Üye listesinde 5 aktif üye: Ayşe (🔥 14 / Bugün 09:30 ✓), Mehmet (🔥 7 / Dün 18:00 ✓), Ali (🔥 12 / Bugün Push), Selin (🔥 5 / 2 gün önce), Zeynep (🔥 3 / Yarın Pull). Hepsi makul durumda. Kardeş çalışmasına döner.

### S2 — Tek T+7 comeback (1 uyarı içerikli banner)
Salı sabahı. Üst banner: *"Mehmet 7 gündür aktif değil — manuel iletişim önerilir"* + iki buton: **Profili aç** / **Okudum**. Kardeş "Profili aç" der → Mehmet'in detay sayfası açılır. Üstte 📞 telefon ikonu → tıklar → WhatsApp Mehmet'in konuşmasına gider. *"Naber Mehmet, bu hafta hiç görünmedin, her şey yolunda mı?"* yazar. Geri Alpfit'e döner. Mehmet'in detayında "Not düş" → *"Whatsapp attım, hafta sonu programa dönecek dedi"* → kaydet. Üye listesine döner, banner üstünde **Okudum** der → banner kaybolur. Mehmet satırında 🔥 0 ve "7 gün önce" hâlâ görünür (motorun gerçeği değişmedi, sadece PT bilgilendi).

### S3 — Yeni üye davet kabul (program bekliyor)
Cuma akşamı. Üst banner: *"Ayşe davetini kabul etti — programını oluştur"* + buton **Program oluştur**. Kardeş "Program oluştur" der → §02 Program Builder akışı açılır (Ayşe için boş haftalık ızgara). Programı yazar, kaydeder. Dashboard'a döner, banner kaybolur, Ayşe artık aktif üyeler listesinde 🔥 0 ile en altta (program bekleyen kategorisinde değil artık). Üye Ayşe'ye otomatik push gider: *"Programın hazır 🎉"*.

### S4 — 2+ uyarı (collapsed banner)
Pazartesi sabahı. Üst banner: *"⚠️ 3 uyarı var — görüntüle"*. Kardeş tıklar → bottom sheet açılır: üç satır listeli:
- *Mehmet — 7 gündür aktif değil* + **Profili aç** / **Okudum**
- *Selin — 8 gündür aktif değil* + **Profili aç** / **Okudum**
- *Burak davetini kabul etti — program bekliyor* + **Program oluştur**

Kardeş Mehmet için "Okudum" → sheet'te o satır kaybolur. Selin için "Profili aç" → detay sayfası. Burak için sheet'i kapatıp daha sonra ele almaya karar verir. Geri dönünce banner *"⚠️ 2 uyarı var — görüntüle"* olarak güncellenmiştir.

### S5 — Bekleyen davetler bölümü
Kardeş yeni 2 üye davet etti. Aktif liste altında **"Bekleyen davetler (2) ▾"** başlığı görünür, tıklar → açılır:
- *Burak — link 12 Mart'ta gönderildi, henüz açılmadı* + **Linki tekrar kopyala** / **İptal et**
- *Cemil — link 14 Mart'ta gönderildi, henüz açılmadı* + **Linki tekrar kopyala** / **İptal et**

Burak'ın linkini kopyalar, WhatsApp'a gider, tekrar yapıştırır + *"Bu Alpfit linkini açabilir misin?"* yazar. Geri döner.

### S6 — Üye detayında ölçüm girme
Ayşe ay sonu kontrol günü. Kardeş Ayşe'nin satırına tıklar → özet detay açılır. Üstte 🔥 21, "Son aktivite: Bugün 09:30", "Sıradaki: Çar Pull". CTA grid'inden **Ölçüm ekle** → §07 Üye Ölçüm Takibi açılır. Kilo/bel/kalça girer, kaydeder. Detay özetine döner. Alt notlar bölümünde 3 önceki not görünür.

### S7 — Üye çıkarma
Selin 6 ay sonra "artık devam etmeyeceğim" demiş. Kardeş Selin'in detayına gider, üst sağda **⋯** → eylem menüsü: *"Not düş / Üyeyi çıkar"*. "Üyeyi çıkar" der → modal: *"Selin Ö. artık üyen olmayacak. Geçmiş tamamlamaları arşivlenir. Selin 'PT'nle ilişkin sonlandı' uyarısı görür. Geri alınamaz."* + **Vazgeç** / **Çıkar**. "Çıkar" der → onay → Selin listeden kaybolur, geçmiş arşive geçer (gizli — v1'de arşiv görüntüleme YOK).

---

## Davranış Kuralları

### Ana ekran kompozisyonu

Üst → alt sırasıyla:

```
┌─────────────────────────────────────────┐
│  Üyelerim (5)              [+ Davet et] │  ← üst bar
├─────────────────────────────────────────┤
│  ⚠️ 3 uyarı var — görüntüle           │  ← banner stack (şartlı)
├─────────────────────────────────────────┤
│  Ayşe Y.        🔥 14   Bugün 09:30 ✓  │
│  Ali D.         🔥 12   Bugün Push     │  ← aktif liste
│  Mehmet K.      🔥 0    ⚠️ Kayıp risk 🔕│
│  Selin O.       🔥 0    🆕 program yok │
│  Zeynep Ş.      🔥 5    ⏰ Telafi penc.│
├─────────────────────────────────────────┤
│  Bekleyen davetler (2) ▾               │  ← collapse bölüm (şartlı)
└─────────────────────────────────────────┘
```

- **Üst bar:** Sol "Üyelerim (N)" başlığı (N = aktif üye sayısı, bekleyen davet sayılmaz). Sağ "+ Davet et" CTA — §03 davet linki üretme akışına gider.
- **Banner stack:** Şartlı (aşağıda detay). 0 uyarı varsa bölüm tamamen kaybolur.
- **Aktif liste:** Default dikkat-öncelikli sıralı (aşağıda detay). PT manuel olarak sıralamayı değiştirebilir.
- **Bekleyen davetler:** Collapse bölüm. 0 davet varsa başlık görünmez. Açılır liste her davet için tek satır + "Linki tekrar kopyala" / "İptal et".

### Üst banner stack

**Hangi olaylar banner üretir:**
- **T+7 comeback (§01):** Bir üye toplam 7 gün aktivitesiz kalınca PT'ye banner.
- **Program bekleyen yeni üye (§03):** Bir üye davet kabul etti ve henüz programı yok.

**Adaptif görünüm:**
- **0 uyarı:** Banner bölümü tamamen gizli.
- **1 uyarı:** İçerik direkt görünür. Format:
  - Comeback için: *"[Üye adı] [N] gündür aktif değil — manuel iletişim önerilir"* + **Profili aç** / **Okudum**
  - Program bekleyen için: *"[Üye adı] davetini kabul etti — programını oluştur"* + **Program oluştur**
- **2+ uyarı:** Collapsed satır: *"⚠️ [N] uyarı var — görüntüle"*. Tıklayınca bottom sheet açılır; her uyarı kendi satırı + kendi aksiyonu. PT sheet içinde tek tek aksiyon alabilir; aksiyon alınan satır sheet'ten kaybolur. Sheet kapatılınca banner sayacı güncellenir.

**"Okudum" davranışı (sadece comeback için):**
- PT "Okudum" der → o üye için banner kaybolur. **Tekrar belirmez.**
- Üye hâlâ aktif olmazsa: 14. günde satırda ⚠️ "Kayıp risk" etiketi belirir (aşağıda).
- Üye herhangi bir antrenmanı tamamlarsa: banner zaten geçersiz (motor §01 re-aktivasyon kuralı).

**Aksiyon davranışı (program bekleyen için):**
- "Okudum" YOK — aksiyon "Program oluştur"dur. Program yazılıp kaydedilince banner otomatik kaybolur.
- PT program yazmayı erteleyebilir; banner ekranda kalmaya devam eder (program yazılana kadar veya üye sistemden çıkana kadar).

**Banner sıralaması (2+ uyarıda sheet içinde):**
1. Comeback uyarıları önce (aciliyet yüksek — kayıp riski),
2. Sonra program bekleyenler (zaman duyarlı ama can riski yok).

### Üye satırı içeriği

Her satır 3 alan + 1 etiket bölgesi:
- **Sol:** Üye adı + soyadı baş harfi (örn. "Ayşe Y."). Profil fotoğrafı **YOK** (v1 minimal — fotoğraf v1.5 adayı).
- **Orta:** 🔥 + streak sayısı (§01).
- **Sağ:** Son aktivite veya sıradaki antrenman (durum bağlamlı — aşağıda kural).
- **Etiket bölgesi:** Sağda streak ve son aktivite yanında ikon/etiket stack.

**"Sağ alan" içeriği kuralı:**
- Üye bugün antrenman tamamladıysa: *"Bugün HH:MM ✓"*
- Üye bugün antrenman planlı ama tamamlamadıysa: *"Bugün [Tip]"* (örn. "Bugün Push")
- Üye dün/önceki günler aktifti, bugün dinlenme: *"[N] gün önce"*
- Üye yarın antrenman planlı: *"Yarın [Tip]"*
- Üye 3+ gün aktif değil: *"[N] gün önce"* (kırmızı/turuncu vurgu)
- Üye programı yok: alan boş — etiket bölgesinde 🆕 "program yok" görünür

**Etiket cinsleri (sağdan sola stack):**

| Etiket | Tetik | Anlam |
|--------|-------|-------|
| ⚠️ Kayıp risk | §01 T+14 | Üye 14 gündür aktif değil. Re-aktivasyona kadar kalır. |
| 🔕 | §04 push izni kapalı | PT'nin manuel WhatsApp gerektiği işareti. |
| ⏰ Telafi penceresi | §01 dünkü antrenman + telafi açık | Üye dün kaçırdı, bugün gece yarısına kadar telafi var. |
| 🆕 program yok | §03 davet kabul + §02 program yazılmadı | PT henüz program yazmadı — üst banner'da da CTA olarak görünür. |

Aynı üyede birden fazla etiket olabilir (örn. ⚠️ + 🔕 kombinasyonu yaygın — kayıp risk + bildirim kapalı).

### Sıralama

**Default — dikkat-öncelikli:**

1. ⚠️ Kayıp risk (T+14) — en üstte
2. Comeback aktif (T+7'de banner aldı, henüz "Okudum" denmemiş) — kayıp riskten sonra
3. ⏰ Telafi penceresinde
4. 🆕 Program bekleyen yeni üye
5. Normal aktif üyeler (en uzun streak'ten en kısaya kendi arasında)

**PT manuel sıralama (üst bar yanında ⇅ ikonu):**
- "En uzun streak üstte" (vitrin sıralaması)
- "En kısa streak üstte"
- "Alfabetik (A→Z)"

PT seçimi cihaza kaydedilir (PT her cihaza ayrı tercih girer; çoklu cihazda sync v1'de YOK).

**Arama/filtre:** v1'de YOK. 5 üyeli pilotta gereksiz. v1.5 adayı (üye sayısı 15+ olduğunda).

### Bekleyen davetler bölümü

- Aktif üye listesinin altında **"Bekleyen davetler (N) ▾"** başlık.
- N = bekleyen davet sayısı. 0 ise başlık tamamen gizli.
- Tıklayınca açılır liste (collapse). Açık/kapalı state cihazda hatırlanır; default = kapalı.
- Her davet için tek satır: davet kodunun gönderildiği tarih + iki aksiyon:
  - **Linki tekrar kopyala** — clipboard'a kopyalar, kısa toast: *"Link kopyalandı"*.
  - **İptal et** — onay sorulmadan iptal (kaza riski düşük, davet henüz açılmadı). Satır kaybolur.
- §03 davet süresi (30 gün) dolduğunda davet kendi kendine iptal olur; PT bildirim almaz, satır sessizce kaybolur.

### Üye detay sayfası (özet + drill-down)

```
┌─────────────────────────────────────────┐
│  < Mehmet K.                         ⋯ │  ← geri + eylem menü
├─────────────────────────────────────────┤
│  Mehmet K.                              │
│  📞 +90 555 ...                         │  ← tap → WhatsApp deep link
│  ⚠️ Kayıp risk · 🔕                     │
│                                         │
│  🔥 0    Son: 14 gün önce               │
│         Sıradaki: Pzt Push              │
├─────────────────────────────────────────┤
│  [ Program ]      [ Ölçüm ekle ]       │  ← CTA grid (drill-down)
│  [ Yemek günlüğü ] [ Geçmiş ]          │
│  [ Not düş ]      [ WhatsApp ]         │
├─────────────────────────────────────────┤
│  Son notlar (2)                         │
│  • 12 Mart: "WhatsApp attım"            │
│  • 5 Mart: "Diz ağrısı var"             │
└─────────────────────────────────────────┘
```

**Üst kart (özet):**
- Üye adı + soyadı tam (örn. "Mehmet Kaya"; listede kısaltıldı, detayda tam).
- Telefon numarası — **tap → WhatsApp deep link** (`whatsapp://send?phone=+90...`). Fallback: WhatsApp yüklü değilse `tel:` arama linki.
- Aktif etiket(ler) (Kayıp risk / Telafi / 🔕 vb.).
- Streak + son aktivite + sıradaki antrenman.

**CTA grid:**
- **Program** → §02 Program Builder'da bu üyenin programı (görüntüle veya düzenle).
- **Ölçüm ekle** → §07 Üye Ölçüm Takibi'nde yeni kayıt formu.
- **Yemek günlüğü** → §08 Üye Yemek Günlüğü'nde üyenin kayıtlarına okuma erişimi (PT girmez, üye girer; PT görür).
- **Geçmiş** → üyenin tamamlanmış antrenman geçmişi (§05 ile aynı liste yapısı, PT okuma modunda).
- **Not düş** → modal: serbest metin + kaydet (aşağıda detay).
- **WhatsApp** → telefon numarasına eşdeğer deep link (üst karttaki ile aynı, daha belirgin CTA).

**Son notlar:**
- En son 3 not gösterilir, "Hepsini gör →" linki ile tam liste.
- Her not: tarih + metin. Düzenleme/silme PT'nin kendi notları için serbest (aşağıda not davranışı).

**Eylem menüsü (⋯):**
- "Üyeyi çıkar" — modal onayı ile (aşağıda).
- (v1'de başka eylem yok. v1.5: notları toplu dışa aktar, vb.)

### PT not düşme

- **Erişim:** Üye detayında "Not düş" CTA veya üst bar ⋯ menüsü.
- **İçerik:** Serbest metin (TR), karakter sınırı 500.
- **Kayıt:** Tarih + saat otomatik. PT'ye özel — üye **göremez**.
- **Liste:** Üye detay alt bölümünde en yeni 3 not. "Hepsini gör →" tüm not listesine gider.
- **Düzenleme/silme:** PT kendi notunu düzenleyebilir/silebilir. Yanlış yazıma karşı koruma yok (PT'nin kendi alanı).
- **Comeback ile bağ:** PT "Okudum" der + ardından not düşmek isteyebilir. v1'de iki ayrı eylem (önce okudum, sonra "Not düş"). v1.5'te "Okudum + not düş" tek akış olabilir.

### WhatsApp deep link

- **Tetik:** Üye detayında telefon numarasına veya "WhatsApp" CTA'sına tap.
- **Davranış:** `whatsapp://send?phone={üye_telefon_E164}` URL açılır. WhatsApp yüklüyse o üyenin konuşması açılır. **Önceden yazılmış metin yok** — PT kendi yazar.
- **Fallback (WhatsApp yok):** Sistem `tel:` URL'ye geçer (telefonun arama uygulaması açılır). Kısa toast: *"WhatsApp bulunamadı, arama açılıyor"*.
- **Üyenin WhatsApp'ı yoksa:** Sistem bunu bilemez (önceden test yok). Konuşma açılır, mesaj iletilmez — bu uygulama meselesi.
- **Otomatik mesaj YOK:** Alpfit hiçbir zaman üyeye WhatsApp mesajı atmaz (v1.5 WhatsApp Business API hariç). v1'de tüm WhatsApp etkileşimi PT'nin kendi hesabından.

### Üye çıkarma

- **Erişim:** Üye detayında ⋯ → "Üyeyi çıkar".
- **Onay modalı:** *"[Üye adı] artık üyen olmayacak. Geçmiş tamamlamaları arşivlenir. [Üye adı] 'PT'nle ilişkin sonlandı' uyarısı görür. Geri alınamaz."* + **Vazgeç** / **Çıkar**.
- **Onay sonrası:**
  - Üye PT'nin listesinden kaybolur.
  - Üyenin §02 programı arşivlenir (PT geçmişe erişemez — v1'de arşiv görünmez).
  - Üyenin §05 geçmiş tamamlamaları arşivlenir.
  - Üye Alpfit'i açtığında: *"PT'nle ilişkin sonlandı"* ekranı görür. Yeni program almaz, geçmişe okuma erişimi v1'de YOK (v1.5 adayı).
  - §04 push: PT'ye push yok, üyeye push yok (sessiz değişiklik).
- **Geri alma:** v1'de YOK. PT çıkardığı üyeyi geri çağırmak isterse: §03 yeni davet linki üretip üyeye gönderir; üye **yeni hesap** açar, eski hesabın hiçbir verisi taşınmaz.

### Comeback uyarı ve kayıp risk davranışı

**T+7 banner yenilenme kuralı:**
- PT "Okudum" der → o üye için banner kaybolur. **Tekrar belirmez.**
- Üye 14. gün de aktif değilse: satırda ⚠️ "Kayıp risk" etiketi belirir (§01 ile uyum). Banner tekrar gelmez — etiket yeterli.
- 21./30./N. günde de banner tekrar gelmez. PT'yi aynı uyarıyla yormamak için.
- **Re-aktivasyon:** Üye herhangi bir antrenman tamamlarsa:
  - Etiket kaybolur.
  - Streak 0'dan başlar (§01).
  - Tüm "Okudum" işareti sıfırlanır — yeni bir kopma olursa T+7 banner yeniden tetiklenir.

**Kayıp risk etiketi kalıcılığı:**
- ⚠️ "Kayıp risk" etiketi yalnızca üyenin re-aktive olmasıyla temizlenir.
- PT manuel temizleyemez (motorun gerçeği — PT'nin "kabul etmesi" gerçeği değiştirmez).
- Üye 30/60/90 gün aktif değilse etiket aynı şekilde kalır. PT istediği zaman üyeyi çıkarabilir; çıkarılan üye listeden komple kaybolur, etiket de gider.

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **Aynı üye birden fazla etiket alır:** Etiket stack sağdan sola dizilir. Örn. ⚠️ Kayıp risk + 🔕 → satır sağında "🔕 ⚠️ Kayıp risk" şeklinde. Sıralama dikkat-öncelikli kalır (etiket sayısı sıralamayı değiştirmez).
- **PT hesabını yeni açtı, hiç üye yok:** Aktif liste yerine merkezde büyük CTA: *"İlk üyeni davet et →"* (§03 ile uyum). Banner ve bekleyen davetler bölümü yok. Üst bar başlık: *"Henüz üyen yok"*.
- **PT'nin sadece bekleyen daveti var, aktif üye yok:** Aktif liste boş; "Henüz aktif üyen yok, davetinin açılmasını bekliyorsun" notu. Bekleyen davetler bölümü açık (default açık bu durumda).
- **PT app'i ilk kez açar, push token kayıt başarısız:** Üst bar yanında küçük 🔕 ikonu PT için de görünür (kendi push kapalı). Tıklayınca *"PT bildirimlerin kapalı — ayarlardan aç →"*.
- **Banner içindeki üye PT tarafından çıkarıldı:** Banner kaybolur, sheet'teki satır da kaybolur. Sessiz davranış.
- **PT 50+ üyeli (v1.5+):** v1'de hedef değil. Liste lazy load değil v1'de — tüm üyeler tek seferde yüklenir. 30+ üyede yavaşlama olursa v1.5 lazy load + arama eklenir.
- **PT kendi telefonunu üye olarak davet ederse:** §03 izin verir (ayrı hesap). PT-üye listesinde kendi adı görünür — pilot için kabul edilebilir, üretimde nadir kullanım.
- **Çoklu PT cihazı:** PT iPhone + iPad'den giriş yapabilir. Üye listesi + banner state senkron (server-side). "Okudum" iki cihazdan birinde basılırsa diğerinde de güncel. Manuel sıralama tercih lokal (cihaza özel).

---

## Hata Durumları

- **Üye listesi yüklenemedi (network):** Üst banner: *"Üye listesi yüklenemedi, yenile →"*. PT yenileyebilir. Cache varsa eski liste gösterilir + üst banner aktif kalır.
- **Banner aksiyonu başarısız ("Okudum" senkron hatası):** Local'de işaretlenir, server'a kuyruğa alınır. UI'da kaybolur (PT için kesintisiz his), arka planda retry. 3 retry sonrası yine başarısızsa next session'da yeniden banner görünür (server'da işaretlenmemiş).
- **WhatsApp deep link açılmadı (URL scheme yok):** Toast: *"WhatsApp açılamadı — numarayı kopyalıyorum"* + telefon numarası clipboard'a kopyalanır.
- **Üye çıkarma onaylandı ama server hatası:** Üye listede kalır + üst banner: *"Çıkarma başarısız, tekrar dene"*. PT tekrar denemeli — local'de "çıkarıldı" gibi davranma (yarı-state riski).
- **Davet linki kopyala başarısız (clipboard izni yok):** Modal açılır, link metin olarak gösterilir, *"Linki manuel kopyala"* yönlendirmesi.

---

## Boş ve Varsayılan Durumlar

- **Hiç üye yok (yeni PT):** Merkezde *"İlk üyeni davet et →"* CTA — §03 davet akışına gider. Bu durumda banner stack ve bekleyen davetler bölümü tamamen yok.
- **Sadece bekleyen davet var (yeni PT):** Aktif liste yerine *"Henüz aktif üyen yok — davetinin açılmasını bekliyorsun"* + "Bekleyen davetler" bölümü default açık.
- **Tüm aktif üyeler dinlenme günü (bugün hiç antrenman yok):** Liste normal, her satırda "Yarın [Tip]" veya "[N] gün sonra" görünür. Banner stack varsa (bağımsız) yine üstte.
- **Banner yok + aktif üye var:** Üst banner bölümü tamamen kaybolur, liste üst bara değer.
- **Notları boş üye (yeni üye):** Üye detayında "Son notlar" başlığı altında: *"Henüz not düşmedin. İlk notunu ekle →"*.
- **Üyenin telefon numarası eksik (eski hesap, opsiyonel kayıt durumu):** v1'de telefon zorunlu (§03 SMS OTP). Bu durum yaşanmaz; yaşanırsa WhatsApp CTA disabled olur.

---

## İlişkili Feature'lar

- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — Bu feature §01'in **PT görünüm katmanıdır**. Streak değerleri, comeback uyarıları (T+7), kayıp risk etiketleri (T+14) ve telafi penceresi ikonları doğrudan §01'in çıktısıdır.
- **[Program Builder](02-program-builder.md)** — Üye detayındaki "Program" ve "Program oluştur" CTA'ları §02 akışına bağlanır.
- **[Onboarding](03-onboarding.md)** — "+ Davet et", "Bekleyen davetler" ve üye çıkarma akışı §03 ile birlikte yaşar.
- **[Bildirim Sistemi](04-notifications.md)** — Banner stack §04'teki push olaylarının in-app yansımasıdır. PT'nin app içinde gördüğü tüm "şimdi yap" sinyalleri §04 ile aynı kaynaktan.
- **[Üye Program Görüntüleme + Tamamlama](05-member-program-view.md)** — Üyenin "Antrenmanı bitir" eylemi PT dashboard'ta o üyenin satırını real-time günceller (son aktivite, streak).
- **[Üye Ölçüm Takibi](07-member-measurements.md)** — Üye detayında "Ölçüm ekle" CTA buraya gider. "Son ölçümler" özet bölümü detay sayfasında §07 davranış kurallarına göre yaşar. "Son ölçüm: X gün önce" hint motorun değil §07'nin çıktısıdır.
- **[Üye Yemek Günlüğü](08-member-food-log.md)** — Üye detayında "Yemek günlüğü" CTA PT'nin okuma erişimini açar. Üyenin gizlilik toggle'ı kapalıysa CTA disabled. "Son giriş: X gün önce" hint §08 davranışı.

---

## Açık Sorular

- **Profil fotoğrafı:** v1'de YOK (sade tutuldu) ama §03 onboarding'de "profil fotoğrafı opsiyonel" denmiş. v1 üye detay sayfasında fotoğraf alanı var mı? Şimdilik üye detayında da YOK varsayıldı. Pilot'ta kardeş 4 üyenin yüzünü ad/soyadla tanıyacağı için kritik değil; v1.5 adayı.
- **Notlar dışa aktarma:** PT bir üye için yıl sonu özet almak isterse? v1'de YOK; v1.5 adayı (Word/PDF export).
- **Üyenin PT'ye "çıkmak istiyorum" diyebilmesi:** §03'te "üye PT'sini değiştiremez (v1)" denmiş. Üye PT'den ayrılmak isterse ne yapar? v1'de üye Alpfit'ten silinmek isteyebilir (KVKK hak); bu PT dashboard'a yansır mı (üye satırı kaybolur mu)? PRD'de KVKK başlığı henüz yazılmadı — sonraki PRD-refine oturumunda ele alınmalı (SESSION-NOTES "KVKK" başlığı altında bekliyor).
- **PT için "geçmiş comeback" görünümü:** Bir PT "geçen ay kimlere comeback uyarısı geldi, hangileri geri döndü" gibi analitik isteyebilir mi? v1'de YOK; pilot geri bildirimi v1.5 retention dashboard'a katkı. v2 Gym Owner retention dashboard'una temel olur.
- **Bekleyen davet süresi göstergesi:** §03'te 30 gün. Bekleyen davetler bölümünde "kalan süre: 12 gün" gibi sayaç var mı yoksa sadece "gönderildi: 12 Mart" mı? v1'de sadece tarih (sade tutuldu).
- **PT'nin notlarına arama:** v1'de YOK. Pilot'ta kardeş "Mehmet için ne not düşmüştüm" diye geriye dönerse v1.5 arama eklenebilir.
