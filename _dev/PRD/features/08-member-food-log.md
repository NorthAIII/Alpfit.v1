# Üye Yemek Günlüğü

## Özet

Üyenin günlük yediklerini **kendi girdiği** kayıt ekranı. v1'de **sadece üye girer** (PT girmez, sadece okur), **AI önerisi yok** (v1.5'te eklenir), **kalori opsiyonel** (boş bırakılabilir). Yapı: günlük 4 öğün kartı (Kahvaltı / Öğle / Akşam / Ara öğün), her kart için serbest metin + opsiyonel kalori. Yasal çerçeve gereği ([00-VISION §6](../00-VISION.md)) "beslenme programı" dili yasak, her ekranda disclaimer var, **AI çıktısı yok** v1'de. Üye dilerse PT'sinin yemek günlüğünü görmesini engelleyebilir (gizlilik toggle, §07 ile tutarlı). Sürdürülebilirlik motoruyla (§01) bağ yok — streak'i etkilemez. v1.5 AI nutrition için **mimari girdi** olarak yapısallandırılır.

---

## Kullanıcı Senaryoları

### S1 — Günlük giriş (mutlu yol)
Ayşe öğle yemeğini bitirdi. Alpfit'i açar, alt navigasyondan **Yemek günlüğü** sekmesine geçer. Bugünün tarihi üstte: "29 Mayıs Cuma". 4 öğün kartı görür: Kahvaltı (sabah girdi, dolu), Öğle (boş), Akşam (boş), Ara öğün (boş). Öğle kartına tıklar, açılır metin alanına yazar: *"tavuk göğsü 150g, bulgur pilavı 1 kepçe, salata"*. Kalori alanı boş bırakır (bilmez). Kaydet. Karta döner, Öğle artık dolu olarak görünür. Akşam Ayşe ev yemeği yer, akşam kartına yazar, kalori bilen biri olduğu için 650 kcal de girer. Kaydet.

### S2 — Hiç girmediği gün
Mehmet bugün hiç yazmadı. Sistem hiçbir şey yapmaz — push yok, baskı yok. Mehmet ertesi gün uygulamayı açtığında dünkü gün **okuma modunda** ve "Henüz giriş yapmadın" görür. Bugün için yeniden boş 4 kart. Mehmet bugünü kullanmaya başlar.

### S3 — PT okuma erişimi (üye detayında)
Kardeş Ayşe'nin yeme alışkanlığını incelemek ister. §06 üye detay sayfasında **Yemek günlüğü** CTA'sına basar. Ayşe'nin son 7 günlük yemek kayıtları liste hâlinde açılır: her gün için 4 öğünün özeti (metin + varsa kalori). En altta "Daha eski günler" linki — basınca tüm geçmişe gider. Kardeş "Yemek günlüğü gizli (üye paylaşmıyor)" durumunu görmez — Ayşe paylaşıma açık, kardeş normal okur. Ekran üstünde disclaimer: *"Bu kayıt tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün."*

### S4 — Üye gizlilik toggle'ı kapatıyor
Selin yeme bozukluğu öyküsü olduğunu kardeşe söyler. Selin Ayarlar > Gizlilik > *"PT'm yemek günlüğümü görmesin"* toggle'ını **kapatır**. PT kardeşin üye detayında "Yemek günlüğü" CTA'sı **disabled** olur, yanında bilgi: *"Selin yemek günlüğünü paylaşmıyor"*. Selin app'inde yemek günlüğü sekmesi normal çalışır — kendisi girer, kendisi görür.

### S5 — Geçmişe dönük giriş yok
Burak Çarşamba unuttu, Perşembe günü Çarşamba'nın yediklerini girmek ister. Perşembe açar, üst tarih navigasyonuyla Çarşamba'ya gider. Çarşamba kartları **okuma modunda** — düzenleme yok. Üstte bilgi: *"Geçmiş günleri değiştiremezsin. Sadece bugünü gir."*. Burak Bugün'e döner, bugünü doldurmaya devam eder.

### S6 — Aynı gün düzenleme
Cemil sabah kahvaltı yazdı: "1 yumurta + simit". 30 dakika sonra peynir de yediğini hatırlar. Bugün kartını açar, "Düzenle" → metni günceller: "1 yumurta + simit + 1 dilim beyaz peynir". Kaydet. Saat 23:59'a kadar düzenleyebilir. Yarın 00:00'dan sonra bugünün kartları okuma moduna geçer.

### S7 — AI olmadığı için "kalori toplamım kaç?" sorusu
Ayşe ay sonu "ben bu ay ne kadar yedim?" merak eder. Yemek günlüğü sekmesinde **toplam/özet YOK**. Sadece günlerin listesi. Ayşe kafadan saymaya çalışmaz; PT'sine sorabilir veya v1.5'te AI özet eklendiğinde otomatik görür. v1'de bilinçli sadelik.

---

## Davranış Kuralları

### Kim girer

- **v1: sadece üye girer.** PT giriş yapamaz — sadece okur. Sebep: davranış gözlemi amaçlı, PT girerse veri çarpıtılır.
- **PT yorum/etiketleme yok:** PT öğüne yorum yazamaz, "iyi/kötü" işaretleyemez. PT geri bildirimini Alpfit dışı (WhatsApp) veya §06 "Not düş" üzerinden verir.
- **v1.5 adayı:** AI öneri + PT onayı akışı ([00-VISION §6](../00-VISION.md)). v1'de AI **yok**.

### Öğün yapısı

| Öğün | Açıklama |
|------|----------|
| **Kahvaltı** | Tek kart |
| **Öğle** | Tek kart |
| **Akşam** | Tek kart |
| **Ara öğün** | Tek kart — gün içinde tüm atıştırmalıkları birleştirir (kahvaltı/öğle arası + öğle/akşam arası + gece) |

- **Sabit 4 öğün:** Üye öğün sayısını değiştiremez. Atıştırmalıklar tek "Ara öğün" kartında toplanır (sade tutuldu).
- **Saatler yok:** v1'de öğün saati alanı yok. "Kahvaltı 11:00'de yapıldı" kaydı yok. v1.5 adayı.
- **Boş öğün:** Üye bir öğünü atlarsa kart boş kalır. "Atladım" işareti YOK — boş = girmedim/bilinmiyor.

### Öğün kart içeriği

| Alan | Tip | Zorunluluk |
|------|-----|------------|
| Açıklama | Serbest metin (TR), max 200 karakter | Zorunlu (kart kaydedilirse) |
| Kalori | Tam sayı, kcal | **Opsiyonel** (boş bırakılabilir) |

- **Sadece bu iki alan:** Makro detay (protein/karb/yağ) YOK. v1.5 AI nutrition'da eklenebilir (PT onaylı öneri girdiği zaman).
- **Kalori opsiyonel sebep:** Çoğu üye kaloriyi bilmez. Zorunlu yapılırsa hiç girmez. Veri zenginliği azalır ama girilme oranı artar.
- **Validasyon:** Açıklama 1-200 karakter. Kalori 1-3000 kcal (boş veya bu aralık). 3000+ kcal: *"Bu değer olağan dışı — emin misin?"* onayı.
- **Kayıt yokken kart hâli:** "Henüz girmedin → girmek için dokun" CTA. Tıklayınca form açılır.

### Sıklık ve baskı

- **Sistem zorlamaz.** Üye girer girer, girmezse boş kalır.
- **Reminder YOK:** v1'de "yemek günlüğü zamanı geldi" push yok. Yemek günlüğü ile ilgili tek bildirim olabilir mi: hayır. (Sürdürülebilirlik motoru antrenman bazlı; yemek hatırlatması scope'u büyütür.)
- **Streak ile bağ YOK:** Yemek günlüğüne giriş streak'i etkilemez (§01 antrenman bazlı). Üye günlerce yemek girmese de streak korunur (motorun girdisi değil).
- **Boş günler:** Bir günde hiç giriş yoksa "Henüz giriş yok" görünür. Sayaç/seri yok.

### Geçmişe dönük giriş

- **Sadece bugün düzenlenebilir.** Üye bugünün herhangi bir öğününü saat 23:59'a kadar düzenleyebilir/yeni ekleyebilir.
- **Ertesi gün 00:00 itibarıyla kilit:** Dünkü gün okuma moduna geçer. Düzenleme/silme yok.
- **Sebep:** Veri kalitesi (insanlar geçmişi yanlış hatırlar) + manipülasyon önleme + üyenin "şu an" davranışını yakalama.
- **Üye dünü görmek isterse:** Tarih navigasyonu (üstte ok ile gün gerisi) ile geçmişe bakar — okuma modunda.
- **Saat dilimi:** Üyenin cihaz saat dilimi baz alınır (§04 ile tutarlı).

### Üye tarafı navigasyon

```
┌─────────────────────────────────────┐
│  Yemek günlüğü                      │
│  ◀ 29 Mayıs Cuma ▶                  │  ← tarih navigasyonu
├─────────────────────────────────────┤
│  Kahvaltı                           │
│   1 yumurta + simit                 │
│   (kalori girilmedi)                │  ← edit/delete (sadece bugün)
├─────────────────────────────────────┤
│  Öğle                          [+]  │
│   Henüz girmedin                    │  ← boş kart
├─────────────────────────────────────┤
│  Akşam                              │
│   ev yemeği — fasulye, pilav       │
│   650 kcal                          │
├─────────────────────────────────────┤
│  Ara öğün                      [+]  │
│   Henüz girmedin                    │
├─────────────────────────────────────┤
│  ℹ️ Bu kayıt tıbbi tavsiye değildir,│
│     kişisel diyet için diyetisyen   │
│     ile görüşün.                    │
└─────────────────────────────────────┘
```

- **Alt navigasyon konumu:** §07 [[member-measurements]] ile birlikte üye app'inin alt navigasyonunda. Sıra: Ana ekran → Geçmiş → Yemek günlüğü → Ölçümler → Ayarlar. (5 sekme, v1 final navigasyon yapısı.)
- **Tarih navigasyonu:** Üstte ok ile dün/yarın gezilir. Yarın'ın ötesine geçilemez. Geçmişe sınırsız bakılır (kullanıcının kendi verisi).
- **Bugün etiketi:** Bugün açıkken tarih satırı altında küçük "BUGÜN" rozeti.
- **Disclaimer pozisyonu:** Sayfa altında her zaman görünür sabit. Gizlenebilir/küçültülebilir mi? **HAYIR** — yasal çerçeve gereği her ekranda görünür kalır ([00-VISION §6](../00-VISION.md) §1-§2).

### PT tarafı (okuma erişimi)

- **Giriş noktası:** Üye detayı (§06) → **Yemek günlüğü** CTA grid butonu.
- **Default görünüm:** Son 7 gün listelenir. Her gün için 4 öğünün özet kartı.
- **Geçmiş erişimi:** Alt'ta **"Daha eski günler →"** linki. Tıklayınca tarih seçici / lazy load liste — üyenin onboarding'inden bugüne tüm günler erişilebilir.
- **PT eylemleri:** Sadece **okuma**. Düzenleme, silme, yorum yazma YOK. PT yorumu §06 "Not düş" üzerinden veya WhatsApp üzerinden yapar.
- **Disclaimer:** PT okuma ekranında da disclaimer alt bantta görünür (PT'yi de yasal çerçeve içinde tutar).
- **Hint olarak PT detayında:** §06 üye detayında "Yemek günlüğü" CTA'nın yanında küçük hint: *"Son giriş: X gün önce"* veya *"Hiç giriş yok"*. Sistemin §06'ya verdiği hint.

### Üye gizlilik toggle

- **Konum:** Üye Ayarlar > Gizlilik > *"PT'm yemek günlüğümü görmesin"*.
- **Default:** Açık (PT görür).
- **Kapalıysa:**
  - Üye normal kullanır (kendi görür, kendi girer).
  - PT üye detayında (§06) "Yemek günlüğü" CTA **disabled** ve yanında bilgi: *"[Üye adı] yemek günlüğünü paylaşmıyor"*.
  - PT bu durumda da gizlilik tercihinin nedenini bilmez — üye sözlü açıklar.
- **§07 toggle ile uyumlu:** Aynı patern (ölçüm gizleme — Ölçümler sekmesi gizlenir). İki toggle birbirinden bağımsız.
- **Tekrar açma:** Üye toggle'ı tekrar açtığında geçmiş tüm günler tekrar PT'ye görünür hale gelir.

### Disclaimer kuralı (yasal çerçeve)

- **Metin:** *"Bu kayıt tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün."*
- **Gösterim:**
  - Üye yemek günlüğü ekranı (alt bantta sabit).
  - PT'nin üye yemek günlüğü okuma ekranı (alt bantta sabit).
- **Kapatılamaz / gizlenemez.**
- **Sebep:** [00-VISION §6](../00-VISION.md) — yasal çerçeve §2.
- **"Beslenme programı" kelimesi yasak:** UI metinlerinde, hatalardaki mesajlarda, push'larda (zaten yemek günlüğü push'u yok) kullanılmaz. Yerine: "kayıt", "yemek günlüğü", "kalori girişi".

### Sürdürülebilirlik motoru ile ilişki

- **Streak'i ETKİLEMEZ.** Yemek günlüğüne giriş motor (§01) için sinyal değil.
- **Comeback ile bağ YOK.** Yemek girmemek üyeyi "kayıp" yapmaz.
- **PT detayında hint:** §06'da "Yemek günlüğü" CTA yanında "Son giriş: X gün önce" — PT'ye "üye uzun süredir girmiyor" bilgisi. Sistem üzerinde aksiyon almaz.

### KVKK ve sağlık verisi

- **Açık rıza:** §07 ile aynı çerçeve. Onboarding'de tek bir KVKK + sağlık verisi açık rıza ekranı (ölçüm + yemek günlüğü + ileride AI öneri kapsamlı). Detay [00-VISION §6](../00-VISION.md) çerçevesinde, tam metin ayrı PRD-refine konusu.
- **Saklama süresi:** Üye hesabı aktif olduğu sürece tutulur.
- **Üye çıkarıldığında:** Yemek günlüğü kayıtları arşivlenir (§07 ile tutarlı). Üye "verilerimi sil" derse arşiv dahil tüm yemek kayıtları silinir.

### v1.5 AI nutrition için mimari hazırlık

- **Veri yapısı:** Her öğün ayrı kayıt (gün + öğün tipi + metin + opsiyonel kalori). v1.5 AI önerisi bu yapıya ek alan getirir (öneri kaynağı, PT onay durumu, makrolar).
- **v1'de AI yok**, ama yapı v1.5'te ekstra migration gerektirmeyecek şekilde tasarlanır (ILKELER §"Kalıcılık önceliği").
- **PT onayı mimari yer:** v1.5'te bir AI öneri tablosu eklenecek; yemek girişi tablosu ondan ayrı ama bağlantılı olabilir.
- **Yasal dil:** v1.5 AI önerisi her zaman PT onayından geçer ([00-VISION §6](../00-VISION.md) §3).

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **Üye KVKK rızası vermediyse:** §07 ile aynı — hesap açılmaz veya rızayı geri çekerse veriler 30 gün içinde silinir.
- **Üye gece yarısı geçtiğinde girer:** 23:59'da kart aktifti, 00:00'da kilit. Üye 00:00'da yazıyor ve gönderiyorsa: yeni güne yazılır (cihaz saat dilimi baz). Dünkü güne yazılmaz — uyarı: *"Saat geçti, dün artık düzenlenemez. Bugün için kayıt mı yapmak istiyorsun?"*.
- **Üye seyahatte saat dilimi farkı:** Cihaz saat dilimi baz (§04 ile uyum). Saat dilimi değişimi sırasında "gün" mantığı kayabilir — kabul edilir (üye karmaşıklığa girmez).
- **Kart kaydedildi ama metin boş:** Kabul edilmez. "En az 1 karakter" validasyon. (Boş kayıt anlamsız.)
- **Aynı öğüne 2 kez tıklayıp yazarsa:** Karta her giriş **mevcut metnin üzerine yazar değil, açar düzenler.** Üye nokta ekleyip yeni içerik yazabilir.
- **PT okuma ekranı, üyenin hiç girişi yok:** "[Üye adı] henüz yemek günlüğüne giriş yapmamış" mesajı + disclaimer.
- **Üye toggle'ı yeni kapattı, PT zaten ekranı açık:** PT yenileme yapana kadar veri görünür (snapshot). Yenilemede CTA disable olur. (Gerçek zamanlı kovma scope dışı.)
- **Üye toggle'ı kapalı ama gizlilik politikası gerekli:** Doktor/diyetisyen reçetesi vs. v1'de yok. KVKK kapsamında üye verisi üyenindir.

---

## Hata Durumları

- **Kaydetme başarısız (network):** Form verisi local'de saklanır, "Bağlantı yok — internet gelince kaydedilecek" toast (§05 ile tutarlı). Karta küçük "bekleyen" rozeti.
- **Senkron çakışması (iki cihaz, aynı öğün):** Last-write-wins (timestamp). Eski versiyon sessizce kaybolur. Notification yok.
- **PT okuma ekranı yüklenemedi:** "Yükleyemedik, yenile" — Cache varsa eski liste + hata banner'ı.
- **Üye geçmiş tarihe gitmeye çalışıyor (URL/deep link):** Geçmiş tarih okuma modunda zaten — düzenleme butonları görünmez, hata yerine sessiz okuma.

---

## Boş ve Varsayılan Durumlar

- **Üye hiç yemek girmedi (yeni üye):** Sekmeye girince 4 boş öğün kartı. Her birinde "Henüz girmedin → girmek için dokun" CTA.
- **Üye onboarding bitti ama yemek girmedi:** Onboarding'de "yemek günlüğü öğretmesi" YOK — minimal. Üye sekmeyi keşfederse keşfeder. (v1.5 adayı: ilk açılışta kısa tanıtım.)
- **PT okuma ekranı boş:** "[Üye adı] henüz yemek günlüğüne giriş yapmamış" + CTA YOK (PT giriş yapmaz). Disclaimer her durumda görünür.
- **Default disclaimer:** Her zaman görünür, sabit.
- **Default kalori:** Boş (girilmemiş = "—" gösterilir).

---

## İlişkili Feature'lar

- **[Üye Ölçüm Takibi](07-member-measurements.md)** — v1.5 AI nutrition'da ölçüm + yemek günlüğü birlikte AI girdisi olur. v1'de ikisi bağımsız. Gizlilik toggle paterni §07 ile tutarlı (iki ayrı toggle).
- **[PT Dashboard — Üye Listesi](06-pt-dashboard.md)** — "Yemek günlüğü" CTA §06 üye detayında. "Son giriş: X gün önce" hint §06'da gösterilir. Toggle kapalıysa CTA disabled.
- **[Onboarding](03-onboarding.md)** — KVKK açık rıza ekranı §03 akışında (§07 ile aynı rıza kapsamı).
- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — **Bağ yok.** Yemek günlüğü streak'i etkilemez. (Belge bütünlüğü için açık beyan.)
- **[Bildirim Sistemi](04-notifications.md)** — v1'de yemek günlüğü push YOK. v1.5'te "AI önerisi geldi, PT onayladı" push tipi eklenebilir.
- **[00-VISION §6](../00-VISION.md)** — Yasal çerçeve (dil, disclaimer, PT onayı katmanı) bu feature'ın yapı kararlarını dikte eder.

---

## Açık Sorular

- **KVKK aydınlatma + açık rıza metni:** §07 ile aynı bekleme — ayrı PRD-refine konusu (SESSION-NOTES "KVKK çerçevesi" altında).
- **Günlük kalori toplamı / özet:** v1'de YOK (sade tutuldu). Pilot'ta üye/PT "ben/o bugün toplam ne yedi?" sorusunu sık soruyorsa v1.5'te otomatik toplam gösterilebilir. Hesap basit (girilenleri topla).
- **Öğün saatleri (saat alanı):** v1'de YOK. Beslenme uzmanları "öğün zamanı önemli" der; v1.5 adayı.
- **Su takibi:** v1'de YOK — yemek günlüğüne karıştırılmaz. Ayrı feature (v1.5 adayı): "Bugün kaç bardak su içtin?" sayaç.
- **Fotoğraf öğün kaydı:** v1'de YOK (storage + KVKK). v2 adayı (özellikle TR yemek DB ile birlikte fotoğraf tanıma).
- **Üye self-girişini PT görmediği durumda PT için sinyal:** Toggle kapalı üye için PT detayında "Yemek günlüğü gizli" mesajı yeterli mi, yoksa PT bunu hiç görmesin mi (üye bu özelliği hiç kullanmıyormuş gibi)? **Şimdilik:** PT toggle'ın kapalı olduğunu görür ("paylaşmıyor" mesajı). Sebep: PT veriyi sormak için boşa hatırlatma yapmasın.
- **PT'nin "yemek günlüğüne yorum yapma" ihtiyacı:** v1'de YOK. PT "Not düş" veya WhatsApp ile geri bildirim verir. Pilot'ta kardeş "burada yazsam daha pratik" derse v1.5 adayı.
- **AI özet (kalori/makro çıkarımı):** v1.5'te AI yemek metnini okuyup kalori/makro tahmin edebilir. Veri zenginliği eksik kaloriyi tahminle dolduran feature olur. Yasal çerçeve: AI çıktısı PT onayından geçer.
