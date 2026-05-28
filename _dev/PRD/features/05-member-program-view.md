# Üye Program Görüntüleme + Tamamlama

## Özet

Üyenin günlük etkileşim merkezi — programını gördüğü, antrenmanını yaptığı ve "Tamamlandı" işaretlediği ekranlar. Sürdürülebilirlik motorunun (§01) **girdi katmanıdır**: streak'in +1 artması bu feature'daki "Antrenmanı bitir" eylemine bağlıdır. Ana ekran kompozisyonu streak-merkezlidir (motor görsel olarak başroldedir); antrenman ekranı egzersiz-checklist mantığıyla çalışır; video oynatma in-app embed ile akışı kopartmadan yapılır. Üye programı yalnızca **görür ve tamamlama işaretler** — değiştirme yetkisi yoktur (program builder PT'nindir, §02).

---

## Kullanıcı Senaryoları

### S1 — Pazartesi sabahı düzenli kullanım (mutlu yol)
Ayşe sabah 09:00'da push bildirimi alır: *"Bugün Push günü 💪 Planını gör"*. Tıklar, app açılır, doğrudan Pazartesi'nin antrenman ekranı gelir. 5 egzersizli liste görünür: Bench Press 4×8, Squat 4×8, Lat Pulldown 3×12, Shoulder Press 3×10, Lateral Raise 3×12. Spor salonuna gider. Bench Press setlerini bitirir, ilk egzersizin yanındaki kutuya ✓ atar. Squat'a geçer, formdan emin değil, "▶" butonuna basar, 20 saniyelik video modal açılır, izler, modalı kapatır, setleri yapar, ✓. Diğer egzersizler aynı şekilde tamamlanır. 5/5 tikleyince alttaki **"Antrenmanı bitir"** butonu aktifleşir, basar. Streak 14 → 15. Ana ekrana döner, üstte büyük "🔥 15" görür.

### S2 — Telafi penceresi (geç tamamla)
Mehmet Pazartesi yorgun, antrenmanı yapmaz. Salı sabah 09:00'da push: *"Dün Push günün vardı, 24 saat içinde telafi edebilirsin."* Mehmet app'i açar. Ana ekranda streak'in altında, "BUGÜN" kartının **üstünde** turuncu telafi banner'ı: *"⏰ Dün Push gününü kaçırdın — bugün gece yarısına kadar telafi edebilirsin"* + buton "Dünkü antrenmana git". Akşam spor salonuna gider, banner'a basar, dünkü antrenman ekranı açılır (üstte başlık: *"Telafi: Pazartesi — Push"*). Egzersizleri yapar, tikler, "Antrenmanı bitir" basar. Sistem "geç tamamlandı" bayrağıyla kaydeder, streak korunur (12 → 13). Ana ekranda banner kaybolur.

### S3 — Üye henüz program yok
Selin onboarding'i tamamladı, PT (Kardeş) henüz program yazmadı. Selin app'i açar. Ana ekranda streak alanı saklı, ortada kart: *"Kardeş Hoca senin için programını hazırlıyor 🏋️ Hazır olduğunda buradan görebileceksin"*. Selin app'i kapatır. 2 saat sonra PT programı kaydedince push gelir: *"Programın hazır 🎉 Gör →"*. Selin tıklar, ana ekran artık normal düzende: streak: 0, BUGÜN kartı (varsa o gün antrenman var), haftalık band.

### S4 — Aynı gün iki antrenman
Ali'nin PT'si Salı'ya iki antrenman koymuş: sabah Mobility, akşam Push. Ali ana ekranı açar, "BUGÜN" kartı iki alt-kart gösterir:
  - *"Sabah · Mobility (3 egz)"* + "Antrenmana git →"
  - *"Akşam · Push (5 egz)"* + "Antrenmana git →"
Ali sabah mobility'i tamamlar, streak +1. Akşam Push'u tamamlar, streak +1 daha. Toplam +2.

### S5 — Programda değişiklik
Kardeş, Ayşe'nin programındaki Cuma Squat'ını ağırlaştırdı (4×8 → 4×6). Push: *"Programında değişiklik var."* Ayşe app'i açar, üstte nötr bilgi banner'ı: *"ℹ️ Programında güncelleme var — Cuma Legs günü değişti"*. Banner'ı kapatır. Cuma günü antrenman ekranını açtığında Squat'ın yanında küçük **"yeni"** rozeti vardır (ilk açılışta, sonraki açılışlarda kaybolur).

### S6 — Geçmişe bakma
Ayşe ay sonunda ne kadar düzenli olduğunu merak eder. Alt navigasyondan "Geçmiş" sekmesine geçer. Liste tarih sırasıyla: *14 Mart Cum — Push ✓*, *12 Mart Çar — Pull ✓*, *10 Mart Pzt — Legs ⏰ (geç)*, *7 Mart Cum — Push ✗ (kaçırıldı)*... Bir satıra tıklar, o günkü egzersizleri görür (sadece okuma). Hiçbir şey değiştiremez.

### S7 — Spor salonunda offline
Mehmet spor salonunda, telefon sinyali zayıf. Antrenman ekranını online açtığı için liste cache'lenmiş — egzersizler ve PT notları görünür. Antrenmanı bitirir, "Antrenmanı bitir" basar. Internet yok. Üst bantta nötr bilgi: *"Bağlantı yok — internet gelince otomatik kaydedilecek"*. Mehmet spor salonundan çıkar, telefon Wi-Fi'ye bağlanır, app otomatik senkron olur. Streak güncellenir.

---

## Davranış Kuralları

### Ana ekran kompozisyonu

Üst → alt sırasıyla:

```
┌─────────────────────────────┐
│   🔥 Streak: 14             │  ← üst: streak (büyük, motorun kalbi)
│   En uzun: 21               │
├─────────────────────────────┤
│   [telafi banner — varsa]   │  ← şartlı: §S2
│   [değişiklik banner — varsa]│  ← şartlı: §S5
├─────────────────────────────┤
│   BUGÜN — Push günü         │  ← orta: bugünün eylem CTA'sı
│   [Antrenmana git →]        │
├─────────────────────────────┤
│   Bu hafta: P✓ S- Ç- P- C-  │  ← alt: haftalık band (minik)
└─────────────────────────────┘
```

- **Streak alanı:** Büyük rakam (örn. 48pt) + altında *"En uzun streak'in: M"* satırı. Streak 0 ise "Yeni streak'ini başlat" CTA'sı sayı yerine geçer (§01).
- **Telafi/değişiklik banner'ları:** Şarta bağlı. Birden fazla aktifse üst üste stack olur (telafi önce, değişiklik sonra).
- **"BUGÜN" kartı:** Bugün için planlı antrenman varsa antrenman tipi + "Antrenmana git" CTA. Yoksa: *"Bugün dinlenme günün — yarın Pull günü"* gibi yön gösterici metin. Aynı gün 2 antrenman varsa 2 alt-kart (§S4).
- **Haftalık band:** Pzt-Paz 7 gün, her güne durum ikonu: ✓ (tamamlandı), ⏰ (geç tamamlandı), ✗ (kaçırıldı), `-` (dinlenme), `▶` (bugün), boş kutu (gelecek).

### Bekleme durumu (PT henüz program yazmadı)
- Ana ekran streak alanı saklı (henüz hesap yok).
- Merkezde tek kart: *"[PT Adı] senin için programını hazırlıyor 🏋️ Hazır olduğunda buradan görebileceksin"*.
- Alt navigasyon görünür ama "Geçmiş" sekmesi tıklanınca boş durum gösterir.
- PT ilk programı kaydedince push tetiklenir (§04), ana ekran normal düzene geçer.

### Antrenman ekranı (egzersiz listesi)

```
┌─────────────────────────────────────┐
│  Pazartesi · Push                   │
│  ───────────────────────────────    │
│  ☐ Bench Press            [▶]       │
│    4×8  •  90 sn dinlenme           │
│    PT notu: yavaş ekzantrik         │
│                                     │
│  ☐ Squat                  [▶]       │
│    4×8  •  120 sn                   │
│                                     │
│  ☐ Lat Pulldown           [▶]       │
│    3×12  •  60 sn                   │
│  ...                                │
│  ───────────────────────────────    │
│  [ Antrenmanı bitir ]  (pasif)      │
└─────────────────────────────────────┘
```

- **Egzersiz satırı:** Sol tarafta tik kutusu, ortada egzersiz adı, sağda video butonu (`▶`). İkinci satırda set×tekrar + dinlenme + PT notu (varsa).
- **Tik mekaniği:** Üye egzersizi yapınca kutuya ✓ atar. Bu yerel görsel feedback, henüz §01 motoruna sinyal göndermez. ✗'leme (geri alma) serbest.
- **"Antrenmanı bitir" butonu:** Ekran altında sabit. **Tüm egzersizler tiklenene kadar pasif** (gri/devre dışı). Tüm egzersizler tiklendiğinde aktifleşir.
- **Buton basıldığında:** §01 motoruna "tamamlama sinyali" gider. Streak +1 (veya geç tamamlama durumunda +1 koruma). Üye ana ekrana döner, yeni streak değeri görünür.
- **Egzersiz sırası:** PT'nin §02'de belirlediği sırada gösterilir. Üye sıralamayı değiştiremez.

### Video oynatma
- Egzersiz satırındaki `▶` butonuna basılınca **in-app modal** açılır.
- Modal içeriği: YouTube veya Vimeo embed iframe (PT'nin §02'de yapıştırdığı URL'den).
- Modal üstünde egzersiz adı + "Kapat" butonu.
- Video bitince modal otomatik kapanmaz — üye kapatır (videoyu tekrar izleyebilsin diye).
- **Video URL'i yoksa:** `▶` butonu hiç görünmez. Sadece ad + set/tekrar.
- **Çekirdek kütüphane egzersizleri** (§02): video Alpfit tarafından önceden hazırlanır. PT'nin eklediği egzersizlerde video opsiyonel.

### "Geç tamamla" telafi penceresi (§01 ile uyum)
- Üye dünkü planlı antrenmanı tamamlamadıysa **bugün gece yarısına kadar** telafi açıktır.
- **Ana ekran banner'ı:** Turuncu vurgulu, BUGÜN kartı üstünde. Metin: *"⏰ Dün [antrenman tipi] gününü kaçırdın — bugün gece yarısına kadar telafi edebilirsin"*. Buton: "Dünkü antrenmana git".
- **Telafi antrenman ekranı:** Normal antrenman ekranıyla aynı UI. Üstte başlık: *"Telafi: [Tarih] — [Antrenman tipi]"*.
- **"Antrenmanı bitir" basıldığında:** Tamamlama "geç tamamlandı" bayrağıyla loglanır. Streak korunur (§01).
- **Telafi penceresi içinde aynı zamanda bugünün antrenmanı varsa:** Üye sıra önemli değil — istediğini önce yapabilir. Banner ve BUGÜN kartı yan yana ana ekranda görünür.
- **Telafi süresi dolduktan sonra:** Banner kaybolur, dünkü antrenman geçmişte ✗ olarak loglanır, streak sıfırlanır (§01).

### Programda değişiklik bildirimi
- PT programı düzenleyince §02 + §04 tetiklenir. Üye uygulamayı bir sonraki açtığında:
  - **Ana ekran banner'ı:** Nötr (mavi/gri) bilgi tonu. Metin: *"ℹ️ Programında güncelleme var — [Gün/Antrenman] değişti"*. Banner kapatılabilir; bir kez gösterilir.
  - **Antrenman ekranında "yeni" rozeti:** Değişen egzersiz(ler) yanında küçük "yeni" rozeti (ilk açılışta gösterilir, ekran kapatılıp tekrar açılınca kaybolur).
- **Tamamlanmış geçmiş antrenmanlar etkilenmez** — değişiklik bir sonraki yapılmamış antrenmandan itibaren (§02 ile uyum).

### Geçmiş antrenmanlar
- Alt navigasyonda **"Geçmiş"** sekmesi.
- Tarih sırasıyla liste (en yeni üstte): *Tarih · Antrenman tipi · Durum ikonu (✓/⏰/✗)*.
- Liste sayfalı (lazy load): bir kez 30 antrenman yüklenir, kaydırmayla devam.
- Satıra tıklayınca detay: o günkü egzersizler okuma modunda (tik kutuları görünmez, sadece liste).
- **v1'de filtre/grafik YOK** — düz liste yeterli. (Ay sonu özet, ilerleme grafiği v1.5/v2 adayı.)

### Çoklu antrenman aynı gün
- §01'e göre PT aynı güne 2 antrenman koyabilir.
- Ana ekran "BUGÜN" kartı **2 alt-kart** olarak ayrışır:
  - *"Sabah · [Tip] ([N egz])"* + "Antrenmana git"
  - *"Akşam · [Tip] ([N egz])"* + "Antrenmana git"
- "Sabah/Akşam" otomatik atanır mı? **Hayır.** PT §02'de **sıra ile** yazar; ilk yazılan üstte, ikinci yazılan altta. Saat belirtmemişse "1. antrenman / 2. antrenman" başlığıyla görünür.
- Her antrenman bağımsız tamamlanır, bağımsız +1 streak. İki ayrı "Antrenmanı bitir" butonu.

### Reminder push deep link davranışı (§04 ile uyum)
- Sabah reminder push'una tıklayan üye: doğrudan o günün antrenman ekranı açılır (ana ekran atlanır).
- Antrenman öncesi reminder (2 saat önce): aynı davranış.
- Comeback push (T+2, üye nazik dokunuş): ana ekran açılır (henüz aktif antrenman yok).
- Yeni program push: ana ekran açılır.

### Offline davranış
- **Liste cache'leme:** Üye antrenman ekranını online açtığında, o antrenmanın egzersiz listesi + PT notları + video URL'leri local'de cache'lenir. Çekirdek kütüphane videoları lazımsa o anda streaming gerek (offline'da oynamaz, "Video çevrimiçi gerektirir" mesajı).
- **Tamamlama kuyruğa alma:** "Antrenmanı bitir" basıldığında internet yoksa eylem local'de bekletilir, "Bağlantı yok — internet gelince otomatik kaydedilecek" bilgisi gösterilir. UI'da tamamlanmış gibi davranır (üye spor salonundan çıkarken endişe etmesin).
- **Senkron:** Internet geldiğinde otomatik senkron. Streak hesabı senkron sonrası güncellenir.
- **Çakışma (iki cihaz):** Üye aynı antrenmanı iki cihazdan ayrı ayrı tamamlamaya çalışırsa: ilk gelen kazanır, ikinci cihaz senkron sonrası "Zaten tamamlanmış" görür (sessizce).

### Etkileşim sınırları
- Üye **programı değiştiremez**: egzersiz ekleyemez, çıkaramaz, set/tekrar düzenleyemez, sırasını değiştiremez.
- Üye **tik kutusunu serbest kullanabilir**: ✓ atıp geri alabilir. Antrenman bitmeden istediği kadar tikleme/de-tikleme yapabilir.
- Üye **tamamlama eylemini geri alamaz**: "Antrenmanı bitir" basıldıktan sonra antrenman kapanır, geçmişe yazılır. Yanlış basıldıysa PT'ye bildirim yok (v1'de düzeltme akışı yok — pilot'ta gerçek olursa v1.5).

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **Üye antrenman ekranını açtı ama bitirmedi:** App kapanırsa tik durumu local'de saklanır. Üye geri döndüğünde aynı yerden devam eder. "Yarım kalan antrenman" gibi özel ekran yok — sadece tik durumu korunur.
- **PT antrenmanı silerse üye antrenman ekranındayken:** Üye'ye nötr bilgi: *"Bu antrenman PT tarafından kaldırıldı"*. Ekran kapanır, ana ekrana döner. Üye tikledikleri kaybolur (§01: silinen antrenman streak hesabından çıkar).
- **PT program günlerini değiştirdi (Pzt → Sal):** Üyenin bugünkü antrenmanı kaybolduysa BUGÜN kartı yeni güne göre güncellenir. Üye değişiklik banner'ı görür.
- **Üye seyahatte saat dilimi farkı:** Üye cihaz saatine göre çalışır (§04 ile uyum). Telafi penceresi cihaz saat dilimine göre hesaplanır.
- **Streak görsel temsili:** v1'de sayı + 🔥 emoji yeterli. "Görsel rozet sistemi" §00 brief'te v2'ye atıldı; v1'de alev emoji'si rozet sayılmaz — minimal motivasyon ikonudur.
- **Üye birden fazla cihazda aynı anda antrenmana giriyor:** Her cihazda kendi tik durumu yerel. Hangisinden önce "Antrenmanı bitir" basılırsa o kazanır; diğer cihaz senkron sonrası "tamamlandı" görür.

---

## Hata Durumları

- **Program yüklenemedi (network hatası, cache yok):** Ekran üstünde "Yenile" CTA'sı + *"Programını yükleyemedik, internetini kontrol et"* mesajı. Üye yenileyebilir.
- **Video oynatılamadı (YouTube embed engeli, link kırık):** Modal içinde *"Video şu an oynamıyor — PT'ne bildir"* mesajı + "Kapat" butonu. Üye antrenmanı yapmaya devam edebilir (video opsiyonel).
- **"Antrenmanı bitir" senkron başarısız (3 retry sonrası):** Local'de kaydet, gelecek senkron denemesinde tekrar gönder. Üyeye gösterme (gereksiz endişe).
- **Streak hesabı uyuşmazlığı (üye eşzamanlı 2 tamamlama yaptı):** Server-side idempotent: aynı antrenman id'si için tek +1. Çoklu istek sessizce yok sayılır.

---

## Boş ve Varsayılan Durumlar

- **İlk açılış (PT henüz program yazmadı):** Bekleme ekranı (yukarıda Davranış Kuralları > Bekleme durumu).
- **Bugün dinlenme günü:** BUGÜN kartı: *"Bugün dinlenme günün 🌿"* + alt satır: *"Yarın [Tip] günü"*. Üye antrenman ekranını açamaz (yok).
- **Tüm hafta dinlenme günü (PT bu hafta program koymadı):** Olağan dışı durum. *"Bu hafta PT'n antrenman planlamadı"* mesajı + PT'ye iletişim önerisi (manuel WhatsApp). Sistem otomatik PT'ye bildirim atmaz (v1'de yok).
- **Geçmiş sekmesi boş (yeni üye):** *"Henüz tamamlanmış antrenmanın yok. İlk antrenmanını yapınca burada görünür."*

---

## İlişkili Feature'lar

- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — Bu feature §01'in **girdi katmanıdır**. "Antrenmanı bitir" basışı streak +1 sinyalini gönderir.
- **[Program Builder](02-program-builder.md)** — Üye burada gördüğü programın yazarı §02'deki PT akışı.
- **[Bildirim Sistemi](04-notifications.md)** — Reminder push'ları bu feature'ın antrenman ekranına deep link verir.
- **[Onboarding](03-onboarding.md)** — Yeni üyenin ilk açılışı (bekleme durumu) §03'te bahsedilmişti; UI detayı burada.

---

## Açık Sorular

- **"Antrenmanı bitir" basıldıktan sonra düzeltme:** v1'de yok. Pilot'ta yanlış basma vakaları sık olursa v1.5'te "son 1 saat içinde geri al" özelliği eklenebilir.
- **Egzersiz sırası içinde dinlenme timer'ı:** §02'de PT dinlenme süresi (sn) yazıyor. Üye tarafında "set sonu 90 sn timer başlat" butonu var mı? v1'de YOK; antrenman akışına ekstra UI eklemez. v1.5 adayı.
- **Çekirdek kütüphane videoları nereden stream olur:** YouTube (Alpfit kanalı) mı, Vimeo mu, kendi CDN mi? Kickoff/research kararı. v1'de YouTube embed pratik (maliyet sıfır).
- **Sürükle-kaydır sayfa geçişi:** Üye gün-gün geçmek için ana ekrandan sola/sağa kaydırabilir mi (Pzt → Sal → Çar)? Yoksa sadece "Geçmiş" sekmesi mi? v1'de **hayır** (sadece BUGÜN ana ekranda); kaydırma navigasyon v1.5 adayı.
- **Streak gösterimi rozet sayılır mı:** Brief §4'te "görsel rozet sistemi v2'ye" denmiş. v1'de 🔥 emoji + sayı minimal — rozet sayılmaz. Pilot'ta kardeşin değerlendirmesi netleştirebilir.
- **Üye streak opt-out:** [[SESSION-NOTES]] hipotezi: bazı üyeler gamification'dan rahatsız olabilir. v1'de toggle YOK (sade tutulur), pilot geri bildirimi v1.5'te ekleme tetikleyebilir.
