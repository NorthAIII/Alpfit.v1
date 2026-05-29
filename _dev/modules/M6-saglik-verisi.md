# M6: Sağlık Verisi (Ölçüm + Yemek Günlüğü)

**Sorumluluk:** Üyenin sağlık verisi (kilo, boy, vücut çevre ölçümleri, yemek günlüğü) takip altyapısı — PT/üye giriş ayrımı, gizlilik toggle paterni (üye PT'den gizleyebilir), 24h düzenleme audit penceresi, disclaimer enforce (yasal çerçeve), v1.5 AI nutrition için **mimari girdi** olarak yapısal hazırlık.
**Bağımlılık:** M0 (KVKK çerçevesi, veri saklama, açık rıza akış), M1 (kullanıcı + rol).
**Sınır:** Bu veriler **streak'i ETKİLEMEZ** (M3'ten bağımsız — açık beyan). Bildirim/reminder M6'da YOK (yemek/ölçüm reminder push v1'de yok). PT dashboard'daki giriş noktaları (CTA + hint) **M5'te**; M6 sadece formları/listelemeyi sağlar.

> **Kapsam kararı (DECISIONS.md):** Ölçüm + Yemek günlüğü tek modülde — aynı KVKK + gizlilik toggle + AI-ready patern. Ayrı modülde tekrar eder.

---

## Feature'lar

### F6.1: Üye Ölçüm Takibi → —

**Açıklama:** PT'nin üye için kilo, boy ve vücut çevre ölçümlerini zaman içinde kaydettiği ekran. **v1'de PT girer, üye self-girmez** (sade tutulur). Üye kendi ölçümlerini liste olarak görebilir (motivasyon değeri), istemiyorsa gizleme hakkı vardır (yeme bozukluğu / beden algısı koruması). Veri sürdürülebilirlik motoruyla bağlı değildir. PT dashboard'da (M5) "Son ölçüm: X gün önce" hint olarak görünür. v1.5 AI nutrition için **mimari girdi** olarak yapısallandırılır.

**Kabul Kriterleri:**

*Kim girer:*
- v1: sadece PT (üye self-giriş YOK)
- Giriş noktası: üye detay sayfası (M5) → **Ölçüm ekle** CTA (başka giriş noktası YOK)

*Ölçüm alanları:*

| Alan | Birim | Zorunluluk |
|---|---|---|
| Kilo | kg (ondalık 1 hane) | Zorunlu her seferinde |
| Boy | cm (tam sayı) | Zorunlu sadece ilk ölçümde — sonra **kilitli** |
| Bel çevresi | cm (tam sayı) | Opsiyonel |
| Kalça çevresi | cm | Opsiyonel |
| Göğüs çevresi | cm | Opsiyonel |
| Kol çevresi | cm | Opsiyonel (PT sağ/sol ayrımı yapmaz — tek alan) |
| Bacak çevresi | cm | Opsiyonel |
| Vücut yağ % | yüzde (tam sayı) | Opsiyonel — ölçüm yöntemi ayırt edilmez |
| Not | serbest metin, max 200 karakter | Opsiyonel |

- Sadece metrik (cm, kg) — imperial YOK (TR pazarı)
- Fotoğraf v1'de YOK (storage + KVKK + UI maliyeti; v1.5/v2 adayı)
- Validasyon: Kilo 20–300 kg, Boy 100–230 cm, Çevreler 20–250 cm, Yağ % 3–60. Sınır dışı: *"Bu değer olağan dışı — emin misin?"* onayı

*Sıklık:*
- Sistem dayatma yapmaz — PT istediği aralıkta girer
- Reminder YOK v1'de (v1.5 adayı)
- Aynı gün birden fazla giriş izinli (uyarı yok)

*Listeleme ve Δ delta:*
- Üye tarafı: alt navigasyon **Ölçümler** sekmesi. Toggle kapalıysa sekme gizli
- Liste tarih sırasıyla en yeni üstte; her satır: tarih + kilo + (varsa) Δ kilo
- Satıra tıklayınca o ölçümün tüm alanları okuma modunda
- Δ delta hesabı: bir önceki ölçüme göre fark. Yeşil ↓ (azalış) veya kırmızı ↑ (artış). **Sadece kilo + her bir çevre için**; not veya yağ %'de delta gösterilmez
- **Renk semantiği nötr:** Yeşil/kırmızı sadece yön gösterir, "iyi/kötü" yargısı vermez (üye kilo almak isteyebilir — bulking)
- PT tarafı: üye detayında (M5) "Son notlar" altında yeni bölüm **Son ölçümler** (en yeni 3 ölçüm); tıklayınca tam liste
- Grafik YOK v1'de (çizgi grafik v1.5/v2 adayı)

*Düzenleme ve silme (24h penceresi):*
- Her ölçüm girildikten sonra 24h boyunca PT düzenleyebilir/silebilir
- 24h sonrası **kilit** (audit trail + veri tutarlılığı)
- Silinen ölçüm üye tarafında da kaybolur; Δ delta sonraki ölçümde yeniden hesaplanır
- Sistem "düzenlendi" bayrağı tutar (audit), ama PT/üye'ye gösterilmez (v1'de minimal)

*Üye gizlilik toggle:*
- Konum: Ayarlar > Gizlilik > *"PT'nin girdiği ölçümleri benimle paylaşma"*
- Default: açık (ölçümler üyeye gösterilir)
- Kapalıysa: alt navigasyonda **Ölçümler** sekmesi gizli; ana ekranda hiçbir yerde ölçüm değeri görmez; PT yine girer, PT tarafında her şey normal. PT bu tercihten **haberdar olmaz** (üye sözlü açıklar)
- Tekrar açma: geçmiş tüm ölçümler tekrar görünür

*Sürdürülebilirlik motoru ile ilişki:*
- **Streak'i ETKİLEMEZ** — motor antrenman bazlı
- Comeback / kayıp risk ile bağ YOK
- PT detayında **hint:** *"Son ölçüm: X gün önce"* — sistem zorlamaz, PT'ye sezgi verir

*KVKK ve sağlık verisi:*
- Açık rıza: M1 onboarding'de SMS OTP sonrası, profil formundan önce KVKK aydınlatma + sağlık verisi açık rıza ekranı. Üye onaylamadan hesap açılmaz
- Saklama: üye hesabı aktif olduğu sürece; üye hesabı silinirse veriler de silinir
- Üye çıkarıldığında (M5): veriler arşivlenir (silinmez). Üye "verilerimi sil" derse arşiv dahil silinir
- Veri sızdırma yok: PT başka PT'yle paylaşamaz (sistem yapısal olarak izin vermez)

*v1.5 AI nutrition için mimari hazırlık:*
- Her ölçüm normalize JSON (her alan ayrı kolon)
- v1'de AI yok, yapı v1.5'te ekstra migration gerektirmeyecek ([[ilkeler]] §"Kalıcılık önceliği")
- v1.5 AI çıktısı her zaman PT onayından geçer ([[00-vision]] §6)

**Bağımlılık:** F1.1 (KVKK rızası onboarding'de), F5.1 (PT dashboard giriş noktası + hint görünümü).

**Edge Case'ler:**
- **Üye onboarding'de KVKK rızası vermedi:** v1'de rıza zorunlu — hesap açılmaz. Üye sonradan rızayı geri çekerse tüm ölçümler 30 gün içinde silinir; PT bilgilendirilir (in-app nötr bildirim).
- **PT iki cihazdan aynı anda ölçüm girerse:** Server-side timestamp ile sıralanır; iki kayıt da listede görünür.
- **Üye kilo girmek istiyorsa:** v1'de self-giriş YOK; üye PT'ye söyler, PT girer.
- **Ölçüm yokken yağ % girilirse:** İzin verilir (kilo + yağ%, çevre yok — anomali değil).
- **Boy 0 olarak girilirse (PT hatası):** Validasyon yakalar (Boy 100–230 cm aralığı dışı).
- **Δ delta hesaplaması — silinen ölçüm:** A→B→C ve B silinirse, C'nin delta'sı A'ya göre yeniden hesaplanır.
- **Aynı gün birden fazla ölçüm Δ delta'sı:** Hesaplanır (sıra ID/timestamp ile bilinir).
- **Yağ % decimal istiyorsa:** v1'de sadece tam sayı; ondalık v1.5 adayı.
- **Bel çevresi 0:** İzin verilmez (20 cm alt sınır).
- **Üye toggle kapalıyken sekmeyi bookmark/deep linkten açmaya çalışırsa:** *"Bu özellik ayarlarından kapalı"* + Ayarlar'a git CTA.
- **Kaydetme başarısız (network):** Form local kaydedilir, "Bağlantı yok — internet gelince kaydedilecek" toast. PT detay sayfasında "Bekleyen 1 ölçüm" rozeti.
- **Senkron çakışması:** Last-write-wins (server timestamp). Eski versiyon sessizce kaybolur.
- **Validasyon hatası:** Inline alan altında kırmızı mesaj.
- **Boş ve varsayılan:** Üye hiç ölçüm yok → *"Henüz ölçümün yok. PT'n ekledikçe burada görünecek."* PT detayında → *"Henüz ölçüm eklemedin. İlk ölçümünü ekle →"* + CTA.
- **Form default değerler:** Hiçbir alan ön-doldurma yok (Boy hariç — kilitli, önceki değer gösterilir).

**PRD Referans:** `_dev/PRD/features/07-member-measurements.md`

---

### F6.2: Üye Yemek Günlüğü → —

**Açıklama:** Üyenin günlük yediklerini **kendi girdiği** kayıt ekranı. v1'de **sadece üye girer** (PT girmez, sadece okur), **AI önerisi yok** (v1.5'te eklenir), **kalori opsiyonel** (boş bırakılabilir). Yapı: günlük 4 öğün kartı (Kahvaltı / Öğle / Akşam / Ara öğün), her kart için serbest metin + opsiyonel kalori. Yasal çerçeve gereği ([[00-vision]] §6): "beslenme programı" dili yasak, her ekranda disclaimer var, AI çıktısı yok v1'de. Üye dilerse PT'sinin görmesini engelleyebilir (gizlilik toggle, F6.1 ile aynı patern).

**Kabul Kriterleri:**

*Kim girer:*
- v1: sadece üye (PT giriş YOK, sadece okur)
- PT yorum/etiketleme YOK; PT geri bildirim WhatsApp veya M5 "Not düş" üzerinden
- v1.5: AI öneri + PT onayı akışı

*Öğün yapısı:*

| Öğün | Açıklama |
|---|---|
| Kahvaltı | Tek kart |
| Öğle | Tek kart |
| Akşam | Tek kart |
| Ara öğün | Tek kart — gün içinde tüm atıştırmalıkları birleştirir |

- Sabit 4 öğün (üye değiştiremez)
- Saatler v1'de YOK ("Kahvaltı 11:00'de yapıldı" kaydı yok)
- Boş öğün = girilmedi/bilinmiyor (atladım işareti YOK)

*Öğün kart içeriği:*

| Alan | Tip | Zorunluluk |
|---|---|---|
| Açıklama | Serbest metin (TR), max 200 karakter | Zorunlu (kart kaydedilirse) |
| Kalori | Tam sayı, kcal | **Opsiyonel** (boş bırakılabilir) |

- Makro detay (protein/karb/yağ) YOK v1'de
- Kalori opsiyonel sebep: çoğu üye bilmez; zorunlu yapılırsa hiç girmez
- Validasyon: açıklama 1-200 karakter; kalori boş veya 1-3000 kcal (3000+: *"Bu değer olağan dışı — emin misin?"*)
- Kayıt yokken kart hâli: *"Henüz girmedin → girmek için dokun"* CTA

*Sıklık ve baskı:*
- Sistem zorlamaz; üye girer girer, girmezse boş kalır
- Reminder YOK v1'de
- Streak ile bağ YOK
- Boş günler: "Henüz giriş yok"; sayaç/seri yok

*Geçmişe dönük giriş (sadece bugün düzenlenebilir):*
- Üye bugünün herhangi bir öğününü saat 23:59'a kadar düzenleyebilir/yeni ekleyebilir
- Ertesi gün 00:00 itibarıyla kilit (dünkü gün okuma moduna geçer)
- Sebep: veri kalitesi + manipülasyon önleme + üyenin "şu an" davranışını yakalama
- Üye dünü görmek isterse: tarih navigasyonu ile geçmişe bakar (okuma modunda)
- Saat dilimi: cihaz saat dilimi (M4 ile tutarlı)

*Üye tarafı navigasyon:*
- Alt navigasyonda **5 sekme:** Ana ekran → Geçmiş → Yemek günlüğü → Ölçümler → Ayarlar
- Tarih navigasyonu: üstte ok ile dün/yarın gezilir; yarın'ın ötesine geçilemez
- Disclaimer sayfa altında **her zaman görünür, sabit, kapatılamaz/gizlenemez** ([[00-vision]] §6 yasal çerçeve §1-§2)

*PT tarafı (okuma erişimi):*
- Giriş noktası: M5 üye detayı → **Yemek günlüğü** CTA
- Default görünüm: son 7 gün listelenir; her gün için 4 öğünün özet kartı
- "Daha eski günler →" linki ile lazy load / tarih seçici geçmişe gider
- PT eylemleri: sadece **okuma** (düzenleme/silme/yorum YOK)
- Disclaimer PT okuma ekranında da görünür
- M5 hint: "Son giriş: X gün önce" veya "Hiç giriş yok"

*Üye gizlilik toggle:*
- Konum: Ayarlar > Gizlilik > *"PT'm yemek günlüğümü görmesin"*
- Default: açık (PT görür)
- Kapalıysa: üye normal kullanır (kendi görür, kendi girer); PT üye detayında "Yemek günlüğü" CTA **disabled** + *"[Üye adı] yemek günlüğünü paylaşmıyor"*. PT nedeni bilmez
- F6.1 toggle ile aynı patern, iki toggle birbirinden bağımsız
- Tekrar açma: geçmiş tüm günler tekrar PT'ye görünür

*Disclaimer kuralı (yasal çerçeve):*
- Metin: *"Bu kayıt tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün."*
- Gösterim: üye yemek günlüğü ekranı (alt bant sabit), PT okuma ekranı (alt bant sabit). **Kapatılamaz**
- **"Beslenme programı" kelimesi yasak** UI metinlerinde, hatalardaki mesajlarda, push'larda. Yerine: "kayıt", "yemek günlüğü", "kalori girişi"

*Sürdürülebilirlik motoru ile ilişki:*
- **Streak'i ETKİLEMEZ** (açık beyan)
- Comeback ile bağ YOK
- PT hint: "Son giriş: X gün önce" — sistem aksiyon almaz

*KVKK:*
- F6.1 ile aynı çerçeve (tek KVKK + sağlık verisi açık rıza ekranı; ölçüm + yemek + ileride AI kapsamlı)
- Saklama: üye hesabı aktif olduğu sürece
- Üye çıkarıldığında: yemek kayıtları arşivlenir; "verilerimi sil" derse arşiv dahil silinir

*v1.5 AI nutrition için mimari hazırlık:*
- Her öğün ayrı kayıt (gün + öğün tipi + metin + opsiyonel kalori)
- v1.5 AI önerisi bu yapıya ek alan getirir (öneri kaynağı, PT onay durumu, makrolar)
- Yemek girişi tablosu + AI öneri tablosu ayrı ama bağlantılı olabilir
- AI çıktısı her zaman PT onayından geçer ([[00-vision]] §6 §3)

**Bağımlılık:** F1.1 (KVKK rızası onboarding'de), F5.1 (PT dashboard CTA + hint görünümü).

**Edge Case'ler:**
- **Üye KVKK rızası vermediyse:** F6.1 ile aynı — hesap açılmaz veya rıza geri çekilirse 30 gün içinde silinir.
- **Üye gece yarısı geçtiğinde girer:** 23:59'da kart aktifti, 00:00'da kilit. Üye 00:00'da gönderiyorsa yeni güne yazılır (cihaz saat dilimi baz) — uyarı: *"Saat geçti, dün artık düzenlenemez. Bugün için kayıt mı yapmak istiyorsun?"*
- **Üye seyahatte saat dilimi farkı:** Cihaz saat dilimi baz; "gün" mantığı kayabilir — kabul edilir.
- **Kart kaydedildi ama metin boş:** Kabul edilmez ("En az 1 karakter" validasyon).
- **Aynı öğüne 2 kez tıklayıp yazarsa:** Her giriş mevcut metni **üzerine yazmaz, açar düzenler**.
- **PT okuma ekranı üyenin hiç girişi yok:** *"[Üye adı] henüz yemek günlüğüne giriş yapmamış"* + disclaimer.
- **Üye toggle yeni kapattı, PT zaten ekranı açık:** PT yenileme yapana kadar veri görünür (snapshot). Yenilemede CTA disable.
- **Kaydetme başarısız (network):** Form local kaydedilir, "Bağlantı yok — internet gelince kaydedilecek" toast (M2 (F2.2) ile tutarlı). Karta "bekleyen" rozeti.
- **Senkron çakışması:** Last-write-wins (timestamp).
- **PT okuma ekranı yüklenemedi:** "Yükleyemedik, yenile" + cache varsa eski liste + hata banner'ı.
- **Üye geçmiş tarihe gitmeye çalışıyor:** Geçmiş tarih okuma modunda; düzenleme butonları görünmez (sessiz okuma).
- **Boş ve varsayılan:** Üye yeni → 4 boş öğün kartı "Henüz girmedin → girmek için dokun" CTA. PT okuma ekranı boş → "[Üye adı] henüz yemek günlüğüne giriş yapmamış" + disclaimer.

**PRD Referans:** `_dev/PRD/features/08-member-food-log.md`

---

## Teknik Notlar

- **KVKK aydınlatma metni** Yakın 4 blocker — `KVKK.md` boş şablon olarak duruyor; PRD-refine + hukuki danışman ile doldurulacak.
- **PT'nin ölçüm trend okuma alışkanlığı:** Pilot'ta gözlem — Δ delta yeterli mi, mini grafiğe ihtiyaç var mı?
- **Üye self-girişin v1.5 önceliği:** Pilot'ta "evde tartılıyorum, ben mi gireyim?" sık duyulursa öncelik artar.
- **Boy yeniden ölçüm akışı:** v1.5'te "boy düzelt" eylemi olabilir (sakatlık sonrası vb.).
- **Vücut yağ % ölçüm yöntemi standardizasyonu:** v1'de yöntem ayrımı YOK; pilot'ta tutarsızlık fark edilirse v1.5'te "yöntem dropdown" eklenebilir.
- **Toggle açma/kapama tarih log'u (KVKK denetimi için):** v1'de YOK.
- **Günlük kalori toplamı / özet:** v1'de YOK; pilot'ta sık sorulursa v1.5'te otomatik toplam.
- **Öğün saatleri alanı:** v1'de YOK; v1.5 adayı.
- **Su takibi:** v1'de YOK (ayrı feature, v1.5).
- **Fotoğraf öğün kaydı:** v1'de YOK (v2 — TR yemek DB ile fotoğraf tanıma).
- **PT "yemek günlüğüne yorum yapma" ihtiyacı:** v1'de YOK; v1.5 adayı.
- **AI özet (kalori/makro çıkarımı):** v1.5'te AI yemek metnini okuyup tahmin edebilir.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: F07 (Ölçüm) + F08 (Yemek günlüğü) M6 birleşik modülüne ortak KVKK + gizlilik toggle paterniyle aktarıldı.
