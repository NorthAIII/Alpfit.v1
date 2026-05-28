# DevFlow — Adım Adım Uygula (Guide Me)

Bu komut uzun bir eylem/yapılacaklar listesi sunulduğunda listeyi tek tek — bir adım bitince sıradakine — yürütmek için kullanılır.

**Kullanım:** `/devflow:guide-me` — herhangi bir aktif oturumun içinde çağrılabilir. Bir önceki Claude mesajındaki listeyi otomatik alır; parametre verilmez.

---

## Amaç

Claude bir UI işi, kurulum akışı, manuel test sırası veya benzer çok-adımlı görevi tek mesajda blok halinde verdiğinde, kullanıcı listenin içinde kaybolmak ve ara sorulardan sonra "neredeydim" diye geri eşelemek istemiyor. Amaç sade: listeyi parçala, **tek adıma odakta kal**, kullanıcı bir adımı bitirince sıradakine geç.

Tartışma için `step-by-step.md` aynı paterni uygular (karar bekler); bu komut **eylem** için (devam sinyali bekler). İkisi kardeş — birinin yerini diğeri tutmaz.

---

## Pattern

**1. Toplamı duyur.** Bir önceki Claude mesajındaki listeyi say. Kısa açılış: "📋 N adım var. Tek tek gidiyoruz — bir adım bitince sıradakine geçeceğim."

Önceki mesajda yürütülebilir bir liste yoksa veya hangisi olduğu belirsizse durup sor: "Önceki mesajda yürütülecek bir liste göremedim — hangi adımları kastediyorsun?" Varsayma.

**2. Sıradaki adımı aç.** Her adım mesajının başında küçük banner: `**Adım N/Toplam — kısa başlık**`. Bu banner ara sorudan sonra kullanıcının yerini görmesi içindir; her adımda olsun.

Adımın ne kadar detayla anlatılacağına sen karar ver — adımın gerçekten ihtiyaç duyduğu kadar. Bazı adımlar tek cümle, bazıları birkaç paragraf. Şablon dayatma; her adıma "amaç + alt-adım + doğrulama" gibi sabit bir iskelet uygulamaya çalışma. Yüzeysel de olma — adımı, kullanıcı başka bir yere bakmadan yürütebileceği kadar somutlukta anlat.

**3. Devam sinyalini bekle.** "tamam", "yaptım", "devam", ekran görüntüsü, kısa onay — hangisi gelirse yeterli. Sinyali yorumlama, sıradaki adıma geç. Her adımın sonunda "yaptın mı?" diye sormak da gereksiz — sinyal kullanıcıdan kendiliğinden gelir.

**4. Ara soru gelirse cevapla, sonra döndür.** Kullanıcı bir adımı yaparken takılıp soru sorabilir; cevap ver. Cevabın sonunda kısa bir bağlantı: "Adım N'deydik, hazır mısın?" Adıma geri çek; kendi başına yeni bir tartışmaya açılma.

**5. Hepsi bitince kapanış.** "✅ Tüm adımlar tamam." Yeni özet veya tekrar açıklama yok — bittiyse bitti.

---

## Tipik sapmalar (bunlardan kaçın)

- Adımları tek mesajda blok halinde sıralamak (komutun tek anlamı bunu önlemek).
- Adıma sığmayan sabit bir şablonu zorla uygulamak (her adıma aynı bölüm başlıkları gibi).
- Devam sinyali gelmeden sıradaki adıma geçmek.
- Ara soruda listeyi kaybetmek; cevabın sonunda adıma dönmemek.
- Her cevabın altında "yaptın mı?" diye gereksiz onay istemek.
