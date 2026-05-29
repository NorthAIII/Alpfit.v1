# M2: Program Domain

**Sorumluluk:** Antrenman programının PT tarafında yazımı (Program Builder) ve üye tarafında görüntülenmesi/tamamlanması — çekirdek 50 egzersizlik kütüphane + PT custom egzersiz, haftalık şablon yapısı, üye program görüntüleme + tamamlama, in-app video oynatma, offline cache + senkron.
**Bağımlılık:** M0, M1.
**Sınır:** Streak hesabını **M3 yapar** (M2 sadece "antrenman tamamlandı" sinyali üretir). Push bildirim **M4'te** (yeni program / program değişikliği push'ları M4 üzerinden tetiklenir). PT dashboard ekranı **M5'te** (M2 sadece Builder ekranını sağlar — "Üyeler listesi"nden "Program oluştur" CTA'sı M5'tedir).

> **Kapsam kararı (DECISIONS.md):** Builder ve Viewer aynı modülde birleşik — aynı data, ayrı modül senkronizasyon yükü yaratır.

---

## Feature'lar

### F2.1: Program Builder (PT) → —

**Açıklama:** PT'nin üyelerine antrenman programı yazdığı çekirdek araç. Mevcut sürtünmenin (Word/PDF/WhatsApp) Alpfit içine taşınması değil, **yarıya indirilmesi** hedeflenir ([[ilkeler]] §En Yüksek Öncelikli Eksen #2). PT bir kez haftalık şablon yazar; bu şablon üyenin program süresi boyunca her hafta tekrar eder. Egzersizler çekirdek kütüphaneden hızla seçilir; eksik bir hareket varsa PT kendi egzersizini ekler.

**Kabul Kriterleri:**

*Program yapısı:*
- Bir üye için **tek bir aktif haftalık şablon** vardır
- Şablon Pzt'den Paz'a 7 günlük ızgaradır; PT bazı günleri boş bırakabilir (dinlenme)
- Şablon, üyenin program süresi boyunca her hafta **tekrar** eder; v1'de "blok/faz" yapısı YOK
- Şablon güncelleme **bir sonraki yapılmamış antrenmandan** itibaren geçerli; tamamlanmış antrenmanlar geçmiş hâliyle saklanır
- PT belirli bir haftaya **tek seferlik ek antrenman** koyabilir (şablonu bozmadan, sadece o hafta görünür)

*Egzersiz kütüphanesi:*
- Çekirdek ~50 egzersiz Alpfit tarafından ön-yüklenir; her birinde TR ad + hedef kas grubu + kısa video (10–30 sn form gösterimi)
- PT eksik bir hareketi ekleyebilir; tek zorunlu alan: ad. Opsiyonel: hedef kas, video URL (YouTube/Vimeo)
- PT'nin eklediği egzersiz sadece o PT'nin listesinde görünür (paylaşımlı PT kütüphanesi v2)
- PT kendi eklediği egzersizi düzenleyebilir/silebilir; çekirdek kütüphane egzersizleri düzenlenemez/silinemez

*Egzersiz programa eklenme formatı:*
- Zorunlu alanlar: Set sayısı, tekrar sayısı (tek sayı 8, veya aralık 8–12)
- Opsiyonel alanlar: Dinlenme süresi (sn), notlar (serbest metin — örn. "yavaş ekzantrik")
- PT bir gün içindeki egzersizleri sürükle-bırak ile sıralayabilir
- Süperset/giant set v1'de YOK (v1.5)

*Üye atama ve görünürlük:*
- PT yalnızca kabul ettiği üyelere program yazabilir
- Program kaydedilir kaydedilmez üyenin app'inde görünür
- Üye programı **değiştiremez** (sadece görür ve tamamlama işaretler — F2.2)
- PT üyenin programını silebilir; silinen program geçmiş tamamlama verisiyle birlikte arşivlenir

*PT verimlilik:*
- PT yeni üyeye program yazarken "[Başka üyenin adı]'nin programını kopyala" CTA — şablonu hedef üyeye kopyalar, PT kişiselleştirir
- Boş kalan şablon otomatik taslak olarak saklanır; PT geri döndüğünde "Yarım kalan programa devam et" görür

**Bağımlılık:** F1.1 (PT'nin program yazabilmesi için üye Onboarding'i tamamlamış olmalı).

**Edge Case'ler:**
- **PT üyeyi kabul etmeden program yazmaya kalkarsa:** Engellenir — "Önce üyeyi kabul et" uyarısı.
- **Aynı egzersiz aynı güne iki kez eklenirse:** Sistem izin verir (PT bilinçli "warm-up Squat" + "working Squat" yazabilir). Uyarı yok.
- **PT video URL yanlış formatta:** YouTube/Vimeo URL formatı kabul edilir; yanlışsa "Geçersiz video URL" uyarısı.
- **Kütüphane yüklenmedi (offline/hata):** Egzersiz arama "yüklenemedi, tekrar dene" gösterir; PT manuel egzersiz ekleyebilir.
- **Şablon kayıt başarısız:** Hata gösterilir, şablon local'de korunur, tekrar dene butonu.
- **İlk üye:** PT'nin hiç üyesi yoksa "Önce üye ekle" yönlendirmesi (F1.1).
- **Çekirdek kütüphane v1 launch'ta hazır değilse:** PT sadece kendi egzersizlerini ekleyebilir — placeholder mod (kritik blocker DURUM.md'de takip).

**PRD Referans:** `_dev/PRD/features/02-program-builder.md`

---

### F2.2: Üye Program Görüntüleme + Tamamlama → —

**Açıklama:** Üyenin günlük etkileşim merkezi — programını gördüğü, antrenmanını yaptığı ve "Tamamlandı" işaretlediği ekranlar. M3 sürdürülebilirlik motorunun **girdi katmanıdır**: streak'in +1 artması bu feature'daki "Antrenmanı bitir" eylemine bağlıdır. Ana ekran kompozisyonu streak-merkezlidir; antrenman ekranı egzersiz-checklist mantığıyla çalışır; video oynatma in-app embed ile yapılır. Üye programı yalnızca görür ve tamamlama işaretler — değiştirme yetkisi yoktur.

**Kabul Kriterleri:**

*Ana ekran kompozisyonu (üst→alt):*
- Üst: 🔥 Streak: N + altta "En uzun streak'in: M" (M3 üretir)
- Şartlı banner stack: telafi banner (M3), program değişiklik banner (F2.1 tetikler)
- Orta: "BUGÜN" kartı — bugün antrenman varsa antrenman tipi + "Antrenmana git" CTA; yoksa "Bugün dinlenme günün — yarın Pull günü"
- Alt: haftalık band Pzt-Paz, her güne durum ikonu (✓ tamamlandı / ⏰ geç / ✗ kaçırıldı / `-` dinlenme / `▶` bugün / boş kutu gelecek)
- Streak 0 ise "Yeni streak'ini başlat" CTA sayı yerine geçer

*Bekleme durumu (PT henüz program yazmadı):*
- Ana ekran streak alanı saklı, ortada tek kart: *"[PT Adı] senin için programını hazırlıyor 🏋️ Hazır olduğunda buradan görebileceksin"*
- PT ilk programı kaydedince push tetiklenir (F4.1), ana ekran normal düzene geçer

*Antrenman ekranı:*
- Egzersiz listesi: sol tik kutusu + ad + sağ video butonu (▶); ikinci satır set×tekrar + dinlenme + PT notu
- Üye egzersizi yapınca kutuya ✓ atar; bu yerel görsel feedback (henüz M3'e sinyal göndermez)
- ✗'leme (geri alma) serbest
- "Antrenmanı bitir" butonu **tüm egzersizler tiklenene kadar pasif**
- Buton basıldığında M3'e "tamamlama sinyali" gider; streak +1 (veya geç tamamlama +1 koruma)
- Egzersiz sırası PT'nin belirlediği gibi (üye değiştiremez)

*Video oynatma:*
- ▶ butonu → in-app modal (YouTube/Vimeo embed iframe)
- Video bitince modal otomatik kapanmaz (üye tekrar izleyebilsin)
- Video URL'i yoksa ▶ butonu görünmez
- Çekirdek kütüphane videoları Alpfit tarafından hazırlanır; PT eklediğinde video opsiyonel

*Telafi penceresi (M3 ile uyum):*
- Üye dünkü planlı antrenmanı yapmadıysa **bugün gece yarısına kadar telafi açık**
- Ana ekranda turuncu telafi banner BUGÜN kartının üstünde
- "Dünkü antrenmana git" → telafi antrenman ekranı (üstte başlık: *"Telafi: [Tarih] — [Antrenman tipi]"*)
- "Antrenmanı bitir" → "geç tamamlandı" bayrağıyla loglanır, streak korunur (M3)
- Telafi süresi dolarsa banner kaybolur, antrenman geçmişte ✗, streak sıfırlanır (M3)

*Program değişiklik bildirimi:*
- PT şablonu güncelleyince F4.1 push gider; üye bir sonraki açışta:
  - Ana ekran nötr banner: *"ℹ️ Programında güncelleme var — [Gün/Antrenman] değişti"* (bir kez gösterilir)
  - Antrenman ekranında değişen egzersizin yanında "yeni" rozeti (ilk açılışta)
- Tamamlanmış geçmiş antrenmanlar etkilenmez

*Geçmiş antrenmanlar:*
- Alt navigasyonda "Geçmiş" sekmesi
- Tarih sırasıyla en yeni üstte; her satır: *Tarih · Antrenman tipi · Durum ikonu (✓/⏰/✗)*
- Lazy load (30 antrenman per page)
- Satıra tıklayınca o günkü egzersizler okuma modunda
- v1'de filtre/grafik YOK

*Çoklu antrenman aynı gün:*
- PT aynı güne 2 antrenman koyarsa: ana ekran "BUGÜN" kartı 2 alt-kart olur
- "Sabah/Akşam" otomatik atanmaz; PT'nin yazım sırası — ilk üstte, ikinci altta
- Her antrenman bağımsız tamamlanır, bağımsız +1 streak; iki ayrı "Antrenmanı bitir" butonu

*Reminder push deep link davranışı (F4.1 ile uyum):*
- Sabah reminder → doğrudan o günün antrenman ekranı
- Antrenman öncesi reminder (2 saat önce) → aynı davranış
- Comeback push (T+2) → ana ekran
- Yeni program push → ana ekran

*Offline davranış:*
- Üye antrenman ekranını online açtığında liste cache'lenir (egzersiz + PT notları + video URL'leri)
- Çekirdek kütüphane videoları offline'da oynamaz: "Video çevrimiçi gerektirir" mesajı
- "Antrenmanı bitir" basıldığında internet yoksa eylem local'de bekletilir, "Bağlantı yok — internet gelince otomatik kaydedilecek"
- UI'da tamamlanmış gibi davranır (üye spor salonundan çıkarken endişe etmesin)
- Senkron sonrası M3 streak hesabı güncellenir
- Çakışma (iki cihaz aynı antrenman): ilk gelen kazanır, ikinci cihaz senkron sonrası "Zaten tamamlanmış" görür (sessizce — server-side idempotent)

*Etkileşim sınırları:*
- Üye programı **değiştiremez** (egzersiz ekleyemez/çıkaramaz/düzenleyemez/sıralayamaz)
- Üye **tik kutusunu serbest kullanabilir** (✓ atıp geri alabilir, antrenman bitmeden istediği kadar)
- "Antrenmanı bitir" basıldıktan sonra **geri alınamaz** (v1'de düzeltme akışı yok)

**Bağımlılık:** F2.1 (programın yazılmış olması gerekir), F1.1 (üye onboarding), F3.1 (streak hesabı), F4.1 (reminder + değişiklik push).

**Edge Case'ler:**
- **Üye antrenman ekranını açtı ama bitirmedi:** Tik durumu local'de saklanır; geri döndüğünde aynı yerden devam eder.
- **PT antrenmanı silerse üye antrenman ekranındayken:** Nötr bilgi *"Bu antrenman PT tarafından kaldırıldı"*; ekran kapanır, ana ekrana döner.
- **PT program günlerini değiştirdi (Pzt→Sal):** Bugünkü antrenman kaybolduysa BUGÜN kartı yeni güne göre güncellenir.
- **Üye seyahatte saat dilimi farkı:** Cihaz saat dilimi baz alınır.
- **Üye birden fazla cihazda aynı anda antrenmana giriyor:** Her cihazda kendi tik durumu yerel; "Antrenmanı bitir" basanı kazanır.
- **Program yüklenemedi (network, cache yok):** Üst banner "Yenile" CTA + "Programını yükleyemedik, internetini kontrol et."
- **Video oynatılamadı (YouTube embed engeli, link kırık):** Modal içinde "Video şu an oynamıyor — PT'ne bildir" + üye antrenmanı devam edebilir.
- **"Antrenmanı bitir" senkron başarısız (3 retry):** Local kaydet, gelecek senkronda tekrar gönder; üyeye gösterme.
- **Bugün dinlenme günü:** "Bugün dinlenme günün 🌿" + alt satır "Yarın [Tip] günü"; antrenman ekranı açılamaz.
- **Tüm hafta dinlenme (PT bu hafta program koymadı):** "Bu hafta PT'n antrenman planlamadı" + PT'ye iletişim önerisi (manuel WhatsApp).
- **Geçmiş sekmesi boş (yeni üye):** "Henüz tamamlanmış antrenmanın yok. İlk antrenmanını yapınca burada görünür."

**PRD Referans:** `_dev/PRD/features/05-member-program-view.md`

---

## Teknik Notlar

- **Çekirdek kütüphane videoları nereden stream olur:** YouTube (Alpfit kanalı) mı, Vimeo mu, kendi CDN mi? `TECH-STACK.md` araştırması — v1'de **YouTube embed pratik** (maliyet sıfır). Karar Yakın 1 research-phase'de.
- **Çekirdek 50 egzersiz listesi:** Kardeşle birlikte oluşturulmalı; Yakın 5 launch öncesi tamamlanmalı (DURUM.md blocker).
- **Çekirdek egzersiz videoları:** Stok mu, Alpfit kendi mi çeker, kardeşle mi? Bütçe + zaman bağı (DURUM.md blocker).
- **Süperset/RIR/tempo:** v1.5 adayı; pilot'ta kardeş "lazım" derse öncelik artar.
- **Program kopyalama (S4 PRD):** v1'de kabul edildi; doğrulanmalı (PT verimliliği için kritik mi?).
- **PT'nin program yazma süresi baseline ölçümü (Yakın 2 blocker):** Kardeşten "yeni üye için kaç dakika sürdü" notu — [[ilkeler]] §Eksen #2 "2× hız" hedefinin doğrulanması için gerekli.
- **Sürükle-kaydır sayfa geçişi üye ana ekranında:** v1'de YOK; v1.5 adayı.
- **Üye streak opt-out:** v1'de toggle YOK (sade tutulur); pilot geri bildirimi v1.5'te ekleyebilir.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: F02 (Builder) + F05 (Viewer) M2 birleşik modülüne kabul kriterleriyle aktarıldı.
