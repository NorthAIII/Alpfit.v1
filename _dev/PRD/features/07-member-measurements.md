# Üye Ölçüm Takibi

## Özet

PT'nin üye için **kilo, boy ve vücut çevre ölçümlerini** zaman içinde kaydettiği ekran. v1'de **PT girer**, üye self-girmez — sade tutulur. Üye kendi ölçümlerini liste olarak görebilir (motivasyon değeri), istemiyorsa gizleme hakkı vardır (yeme bozukluğu / beden algısı koruması). Ölçüm verisi sürdürülebilirlik motoruyla (§01) bağlı değildir — antrenman bazlı streak'i etkilemez. Ama PT dashboard'da (§06) "Son ölçüm: X gün önce" hint olarak görünür ve v1.5 AI nutrition için **mimari girdi** olarak yapısallandırılır. Sağlık verisi olduğundan KVKK açık rızası onboarding'de alınır.

---

## Kullanıcı Senaryoları

### S1 — Yeni üyenin ilk ölçümü (mutlu yol)
Kardeş yeni üyesi Ayşe'yi spor salonunda karşılar. Tartı ve mezurayla ölçer. Alpfit'i açar, Ayşe'nin detay sayfasına gider, **Ölçüm ekle** CTA'sına basar. Form açılır. Kilo: 68.5 kg, Boy: 165 cm (ilk seferinde zorunlu). Opsiyonel alanları doldurur: Bel 72 cm, Kalça 96 cm, Vücut yağ % 24, Not: "tartı sabah, aç karın". Kaydet. Ayşe'nin detay sayfasına döner, "Son ölçüm: Bugün" görünür. Ayşe akşam app'ini açar, alt navigasyondan **Ölçümler** sekmesine gider, ilk ölçümü liste başında görür.

### S2 — Aylık takip ölçümü (Δ delta)
Bir ay sonra Ayşe yine spor salonunda. Kardeş yeni ölçüm girer: Kilo 67.0 kg, Bel 70 cm. Boy alanı **kilitli** (ilk ölçümde girildi, sonradan değişmez — yetişkin). Kaydet. Liste başında yeni ölçüm görünür, yanında küçük **Δ −1.5 kg** (yeşil ok aşağı) ve **Δ −2 cm bel** (yeşil ok aşağı). Ayşe sevinir.

### S3 — Yanlış girdi düzeltme (24 saat penceresi)
Kardeş Mehmet'in kilosunu 75 kg yazacakken yanlışlıkla 57 yazdı. 2 saat sonra fark etti. Mehmet'in son ölçümüne tıklar, **Düzenle** butonu aktif (24 saat içinde). 75 olarak düzeltir, kaydet. Audit log'da "düzenlendi" işareti kalır (PT'nin kendisine görünmez, sistem kaydı).

### S4 — Eski ölçüm kilitli
3 ay önceki bir ölçümü kardeş yanlış hatırladığını düşünür ve düzeltmek ister. Liste'de o satıra tıklar — sadece **görüntüleme modu**. Düzenle butonu yok, sadece *"Bu ölçüm 24 saatten eski, düzenlenemez"* bilgisi. Kardeş yeni ölçüm ekleyerek ilerleyebilir.

### S5 — Üye ölçümlerini gizliyor
Selin yeme bozukluğu öyküsü olduğunu kardeşle paylaştı. Kardeş "kilo girmeye devam ederim ama sen görmesen iyi olur" der. Selin app'inde Ayarlar > Gizlilik'e gider, *"PT'nin girdiği ölçümleri benimle paylaşma"* toggle'ını **kapatır**. Sonraki ölçümlerde Selin'in **Ölçümler** sekmesi gizli — alt navigasyonda görünmez. PT yine ölçümleri girer ve görür.

### S6 — Kayıt sonrası üye notify edilmiyor
Kardeş yeni ölçüm girdiğinde üyeye push gitmez. Üye ölçümü kendi merak edip baktığında görür. (Karar: motivasyon kişiseldir, otomatik bildirim baskı yaratabilir.)

### S7 — Üye çıkarıldığında ölçümler
Kardeş Selin'i §06 üzerinden çıkarır. Selin'in tüm ölçümleri **arşivlenir** — Selin'in hesabı silinmedikçe veri sistemde kalır (KVKK saklama). Selin Alpfit'ten "verilerimi sil" derse ölçümler de silinir.

---

## Davranış Kuralları

### Kim girer

- **v1: sadece PT girer.** Üye self-giriş yok. Sebep: scope sade, PT zaten spor salonunda ölçüyor.
- **v1.5 adayı:** Üye self-giriş (evde tartı kullananlar için). PT onaylayıp/düzenleyebilir.
- **Giriş noktası:** Üye detay sayfası (§06) → **Ölçüm ekle** CTA. Başka giriş noktası yok (örn. ana ekranda toplu "Bugün ölçüm günü" listesi YOK).

### Ölçüm alanları

| Alan | Birim | Zorunluluk |
|------|-------|------------|
| Kilo | kg (ondalık 1 hane, örn. 68.5) | **Zorunlu** her seferinde |
| Boy | cm (tam sayı) | **Zorunlu sadece ilk ölçümde** — sonra kilitli |
| Bel çevresi | cm (tam sayı) | Opsiyonel |
| Kalça çevresi | cm | Opsiyonel |
| Göğüs çevresi | cm | Opsiyonel |
| Kol çevresi | cm | Opsiyonel (PT sağ/sol ayrımı yapmaz — tek alan) |
| Bacak çevresi | cm | Opsiyonel (üst bacak, PT'nin tercihi) |
| Vücut yağ % | yüzde (tam sayı, örn. 24) | Opsiyonel — ölçüm yöntemi (caliper/impedans/göz) sistem ayırt etmez; PT not'a yazar |
| Not | serbest metin (TR), max 200 karakter | Opsiyonel |

- **Birim:** Sadece **metrik (cm, kg)**. Imperial (inch, lbs) yok — TR pazarı için gereksiz, scope dışı.
- **Fotoğraf:** v1'de **YOK** (storage + KVKK + UI maliyeti). v1.5/v2 adayı.
- **Boy kilidi:** İlk ölçümde girildikten sonra Boy alanı tüm sonraki ölçümlerde **disabled**. PT yetişkin üyede boy değişmez varsayımıyla — istisna (çok genç üye, sakatlık sonrası ölçüm) için PT'nin sistem dışı talebi yönetilir (v1.5'te "boy yeniden ölç" eylemi).
- **Validasyon:** Kilo 20–300 kg, Boy 100–230 cm, Çevreler 20–250 cm, Yağ % 3–60. Sınır dışı değer girilince *"Bu değer olağan dışı — emin misin?"* onayı, üzerine basarsa kaydedilir.

### Sıklık

- **Sistem dayatma yapmaz.** PT istediği aralıkta girer. Haftada bir / ayda bir / 3 ayda bir — esnek.
- **Reminder YOK:** v1'de "ölçüm zamanı" hatırlatması yok. v1.5 adayı (örn. son ölçümden 30 gün geçti → PT'ye in-app nudge).
- **Aynı gün birden fazla giriş:** İzin verilir (örn. sabah aç karın + akşam yemek sonrası karşılaştırma). Sistem uyarı vermez. Listede ikisi de görünür (saat dahil).

### Listeleme ve Δ delta

- **Üye tarafı (Ölçümler sekmesi):**
  - Alt navigasyonda dördüncü sekme: **Ölçümler**. (Sırası: Ana ekran, Geçmiş, Ölçümler, Ayarlar.)
  - Toggle kapalıysa sekme gizli (§S5).
  - Liste tarih sırasıyla en yeni üstte. Her satır: tarih + kilo + (varsa) Δ kilo.
  - Satıra tıklayınca o ölçümün tüm alanları (çevreler, yağ%, not) okuma modunda.
  - **Δ delta hesabı:** Bir önceki ölçüme göre fark. Yeşil ↓ (azalış) veya kırmızı ↑ (artış). Sadece kilo + her bir çevre için. Not'ta ya da yağ%'de delta gösterilmez.
  - **Renk semantiği nötr:** Yeşil = azalış, kırmızı = artış. **Hedef kavramı yok** (üye kilo almak isteyebilir — bulking). Renk sadece yön gösterir, "iyi/kötü" yargısı vermez.

- **PT tarafı (üye detay sayfası):**
  - Üye detayında §06 "Son notlar" altında yeni bölüm: **Son ölçümler** (en yeni 3 ölçüm).
  - Her satır: tarih + kilo + Δ. Tıklayınca tam liste sayfası açılır.
  - **Düzenle/Sil aksiyonları:** Sadece son 24 saat içindeki ölçümler için aktif (aşağıda detay).

- **Grafik YOK:** v1'de görselleştirme sadece liste + Δ. Çizgi grafik v1.5/v2 adayı (scope disiplini).

### Düzenleme ve silme

- **24 saat penceresi:** Her ölçüm girildikten sonra 24 saat boyunca PT tarafından **düzenlenebilir veya silinebilir**.
- **24 saat sonrası kilit:** Daha eski ölçümler okuma modunda. Düzenle/Sil butonları görünmez. Sebep: audit trail + veri tutarlılığı (geçmişe dönük manipülasyon önleme).
- **Silinen ölçüm:** Üye tarafında da kaybolur. Δ delta sonraki ölçümde otomatik yeniden hesaplanır.
- **Düzenleme bilgisi:** Sistem "düzenlendi" bayrağı tutar (audit), ama PT/üye'ye gösterilmez (v1'de minimal).

### Üye gizlilik toggle'ı

- **Konum:** Üye Ayarlar > Gizlilik > *"PT'nin girdiği ölçümleri benimle paylaşma"*.
- **Default:** Açık (ölçümler üyeye gösterilir).
- **Kapalıysa:**
  - Üye alt navigasyonunda **Ölçümler** sekmesi gizli.
  - Üye ana ekranda hiçbir yerde ölçüm değeri görmez.
  - PT yine ölçüm girer, PT tarafında her şey normal.
  - PT, üyenin bu tercihi yaptığını **bilmez** (gizlilik). Üye PT'siyle bunu sözlü konuşur.
- **Tekrar açma:** Üye toggle'ı tekrar açtığında geçmiş tüm ölçümler tekrar görünür hale gelir.

### Sürdürülebilirlik motoru ile ilişki

- **Streak'i ETKİLEMEZ.** Motor antrenman bazlı (§01). Ölçüm girilmesi/girilmemesi streak hesabına girmez.
- **Comeback / kayıp risk ile bağ YOK.** Ölçüm yokluğu üyeyi "kayıp" yapmaz.
- **PT detayında hint:** Üye detay sayfasında (§06) "Son ölçüm: X gün önce" satırı görünür — PT'ye "bu üyenin ölçüm zamanı geldi mi?" iç sezgisi verir, sistem zorlamaz.

### KVKK ve sağlık verisi

- **Açık rıza:** Onboarding'de §03 SMS OTP sonrası, profil formundan önce, **KVKK aydınlatma + sağlık verisi açık rıza** ekranı çıkar. Üye onaylamadan hesap açılmaz. (Bu ekranın tam metni ayrı PRD-refine konusu — KVKK çerçevesi.)
- **Saklama süresi:** Üye hesabı aktif olduğu sürece tutulur. Üye hesabı silinirse veriler de silinir.
- **Üye çıkarıldığında:** PT §06'dan üyeyi çıkarırsa veriler **arşivlenir** (silinmez). Üye Alpfit'ten "verilerimi sil" derse arşiv dahil tüm ölçümler silinir. (Üye self-silme akışı v1'de KVKK gereği var — §Onboarding ek olarak yazılabilir.)
- **Veri sızdırma yok:** PT bir üyenin ölçümlerini başka PT'yle paylaşamaz (sistem yapısal olarak izin vermez). PT kendi cihazından ekran görüntüsü alabilir — bu Alpfit'in sorumluluğunda değil.

### v1.5 AI nutrition için mimari hazırlık

- **Veri yapısı:** Her ölçüm normalize edilmiş JSON şeklinde saklanır (her alan ayrı kolon). v1.5 AI önerisi BMI + kilo trendi + vücut yağ %'yi girdi olarak kullanabilir.
- **v1'de AI yok**, ama yapı v1.5'te ekstra migration gerektirmeyecek şekilde tasarlanır (ILKELER §"Kalıcılık önceliği").
- **Yasal dil:** Ölçümler v1.5 AI önerisinin girdisi olur ama AI çıktısı **her zaman PT onayından geçer** (§00-VISION §6 yasal çerçeve).

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **Üye onboarding'de KVKK rızası vermedi:** v1'de KVKK rızası zorunlu (hesap açılmaz). Üye sonradan rızayı geri çekerse: tüm ölçümler 30 gün içinde silinir, PT bilgilendirilir (in-app nötr bildirim).
- **PT iki cihazdan aynı anda ölçüm girerse:** Server-side timestamp ile sıralanır. İki kayıt da listede görünür (aynı gün iki ölçüm normal davranış).
- **Üye kilo girmek istiyorsa (v1'de yok):** Üye self-giriş v1'de YOK. Üye PT'ye söyleyip PT girer. (v1.5 self-giriş adayı.)
- **Ölçüm verisi yokken yağ % girilirse:** İzin verilir (kilo + yağ%, çevre yok — anomali değil).
- **Boy 0 olarak girilirse (PT hatası):** Validasyon yakalar (Boy 100–230 cm aralığı dışı).
- **Δ delta hesaplaması — silinen ölçüm:** A → B → C ölçümleri varsa ve B silinirse, C'nin delta'sı A'ya göre yeniden hesaplanır.
- **Aynı gün birden fazla ölçüm Δ delta'sı:** Aynı günün ölçümleri arası delta hesaplanmaz mı? **Hesaplanır.** Sistem ölçüm sırasını ID/timestamp ile bilir.
- **Yağ % decimal istiyorsa:** v1'de sadece tam sayı (24, 25 vs.). Ondalık (24.5) v1.5 adayı.
- **Bel çevresi 0 girilirse:** İzin verilmez (validasyon 20 cm alt sınır).
- **Üye toggle'ı kapalıyken ölçüm sekmesini bookmark/deep linkten açmaya çalışırsa:** *"Bu özellik ayarlarından kapalı"* ekranı + Ayarlara git CTA.

---

## Hata Durumları

- **Kaydetme başarısız (network):** Form verisi local'de saklanır, "Bağlantı yok — internet gelince kaydedilecek" toast. PT detay sayfasında "Bekleyen 1 ölçüm" rozeti.
- **Senkron çakışması (PT cihaz A girdi + cihaz B düzenledi):** Last-write-wins (server timestamp). Eski versiyon sessizce kaybolur.
- **Validasyon hatası:** Inline alan altında kırmızı mesaj (örn. *"Boy 100 ile 230 cm arasında olmalı"*). Form gönderilmez.
- **KVKK rıza eksik (eski hesap mig durumu):** v1 launch'ta bu durum yaşanmamalı (tüm yeni hesaplar rıza alarak açılıyor). Yaşanırsa app açılışta rıza istenir, vermeyen üye ölçümleri görmez/girmez ama hesap kalır (KVKK temel çerçevesi ayrı PRD-refine konusu).

---

## Boş ve Varsayılan Durumlar

- **Üye hiç ölçüm yok (yeni üye):** Üye Ölçümler sekmesi: *"Henüz ölçümün yok. PT'n ekledikçe burada görünecek."* PT detayında "Son ölçüm" satırı: *"Henüz ölçüm yok"*.
- **PT detayı, ölçüm yok:** "Son notlar" altında "Son ölçümler" başlığı: *"Henüz ölçüm eklemedin. İlk ölçümünü ekle →"* + **Ölçüm ekle** CTA.
- **Form default değerler:** Hiçbir alan ön-doldurma yok. Boy alanı sadece ilk ölçümde aktif; sonraki tüm açılışlarda önceki boy değeri gösterilip kilitli.
- **Not alanı default:** Boş. Placeholder: *"örn: sabah aç karın, regl haftası, vb."*

---

## İlişkili Feature'lar

- **[PT Dashboard — Üye Listesi](06-pt-dashboard.md)** — Üye detayında "Ölçüm ekle" CTA buraya gelir. "Son ölçümler" özet listesi detay sayfasında yaşar. "Son ölçüm: X gün önce" hint §06'da gösterilir.
- **[Onboarding](03-onboarding.md)** — KVKK aydınlatma + sağlık verisi açık rıza ekranı §03 akışında. Bu feature §03'e rıza ekranı sorumluluğunu bağlar.
- **[Sürdürülebilirlik Motoru](01-sustainability-engine.md)** — **Bağ yok.** Ölçüm streak'i etkilemez. (Belge bütünlüğü için açık beyan.)
- **[Üye Yemek Günlüğü](08-member-food-log.md)** *(henüz yazılmadı)* — v1.5 AI nutrition'da ölçüm + yemek günlüğü birlikte AI'ya girdi olur. v1'de ikisi bağımsız.

---

## Açık Sorular

- **KVKK aydınlatma metni:** Açık rıza ekranının tam Türkçe metni hazır değil. Hukuki danışman incelemesi gerekebilir. **PRD-refine'da KVKK çerçevesi başlığı altında ele alınmalı** (SESSION-NOTES'ta beklemede).
- **PT'nin ölçüm trend okuma alışkanlığı:** Kardeş aylık olarak mı, haftalık mı bakar? v1 pilot'ta gözlem — Δ delta yeterli mi, mini grafiğe ihtiyaç var mı?
- **Üye self-girişin v1.5 önceliği:** Pilot'ta Selin/Mehmet "evde tartılıyorum, ben mi gireyim?" derse v1.5'e itme aciliyeti artar.
- **Boy yeniden ölçüm akışı:** Yetişkin boy değişmez varsayımı %99 doğru ama istisnalar (postür düzeltici sakatlık sonrası ölçüm, vb.) için v1.5'te "boy düzelt" eylemi olabilir.
- **Vücut yağ % ölçüm yöntemi standardizasyonu:** PT caliper kullanırken başka PT akıllı tartı (impedans) kullanabilir. Aynı kişinin iki yöntem arası farkı %5-10 olabilir. Sistem yöntem ayrımı yapmıyor — pilot'ta tutarsızlık fark edilirse v1.5'te "yöntem dropdown" eklenebilir.
- **Toggle açma/kapama tarih log'u:** Üye toggle'ı kapatıp açtığında log tutulmalı mı (örn. KVKK denetimi için)? v1'de YOK — gizlilik tercihi kişisel, log gereksiz.
