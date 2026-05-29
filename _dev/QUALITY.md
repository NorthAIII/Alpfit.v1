# QUALITY — Kalite Eksenleri

**Amaç:** Planlama, task yazımı ve review sırasında göz önünde bulundurulacak kalite kontrol noktaları
**Ne zaman okunmalı:** Faz planlaması, task yazımı ve faz review'ında

---

## Kalite Eksenleri

Aşağıdaki eksenler bu proje için izlenir. Alpfit'in TR-pazarı mobile + sağlık verisi + sürdürülebilirlik motoru karakterine göre düzenlenmiştir.

### 1. Modülerlik

- Kod, mantıksal olarak ayrılmış modüller halinde mi? (M0–M6 sınırları kodda da yaşıyor mu?)
- Bir modülde yapılan değişiklik diğerlerini etkiliyor mu? (Özellikle M3 ↔ M5 ↔ M4 bağı)
- Bileşenler tek sorumluluk prensibine uyuyor mu?
- 3 rol mimarisi (Member + Trainer + Gym Owner) yetki kontrolüne tek noktada erişiyor mu?
- Tekrar eden kod var mı? (Özellikle gizlilik toggle paterni M6 içinde — F6.1 ve F6.2 aynı patern)

**Kontrol sorusu:** "Bu parçayı bağımsız olarak değiştirebilir miyim — M3'teki streak kuralı değişirse M5 dashboard banner mantığı kırılır mı?"

### 2. Güvenlik & Gizlilik (KVKK)

- Kullanıcı girdileri validate ve sanitize ediliyor mu? (Telefon formatı +90 5XX, SMS OTP brute force, kilo/boy aralık validasyonu)
- Yetkilendirme kontrolleri her endpoint'te var mı? (PT yalnızca kendi üyelerinin verisini görür; üye kendi verisini görür)
- Hassas veriler (kilo, boy, ölçüm, yemek günlüğü) güvenli şekilde saklanıyor mu? KVKK saklama süresi + üye self-silme akışı?
- Yaygın saldırı vektörleri korunuyor mu? (SMS OTP brute force → 5 hatalı = 15dk kilit; davet linki tek kullanımlık; deep link payload spoofing)
- Hata mesajları hassas bilgi sızdırmıyor mu? (Telefon numarası varlığı sızdırılıyor mu — "Bu telefon zaten kayıtlı" mesajı bilinçli)
- Üye gizlilik toggle (ölçüm + yemek günlüğü) PT tarafında doğru honor ediliyor mu?
- KVKK açık rıza tutarlılığı: rıza yoksa ölçüm/yemek alınmaz, rıza geri çekilirse 30 gün içinde silinir.

**Kontrol sorusu:** "Kötü niyetli bir PT başka PT'nin üyelerine nasıl ulaşabilir? Üye verisi nasıl sızdırılabilir? KVKK denetiminden geçer mi?"

### 3. Bakım Maliyeti

- Kod okunabilir mi? Başka biri anlayabilir mi?
- Karmaşık mantık (özellikle motor §01 — telafi penceresi sınır günleri, T+2/T+7/T+14 sayaç) yorum veya dokümantasyonla açıklanmış mı?
- Bağımlılıklar güncel ve bakımlı mı?
- Konfigürasyon hardcode değil, environment variable veya config dosyasında mı? (SMS provider key, FCM/APNs sertifikası, sessiz saat penceresi)
- Gelecekte değişmesi muhtemel kısımlar esnek mi? (3 rol → 3.+ rol mimari, AI nutrition entegrasyon noktaları, WhatsApp Business API)

**Kontrol sorusu:** "6 ay sonra v1.5 AI nutrition'ı entegre etmem gerekse ne kadar zor olur? M6 veri yapısı AI-ready mi?"

### 4. Performans

- Gereksiz veritabanı sorguları var mı? (N+1: PT dashboard'da her üye için ayrı streak query)
- Büyük veri setleri sayfalama ile mi geliyor? (Üye geçmiş antrenmanlar — 30 antrenmanlık lazy load)
- Ağır hesaplamalar uygun şekilde cache'leniyor mu? (Streak hesabı her sayfa açılışında yeniden hesaplanıyor mu yoksa cached mi?)
- Frontend'de gereksiz re-render var mı? (Özellikle PT dashboard real-time update)
- Asset'ler (egzersiz videoları, resim) optimize edilmiş mi? (YouTube embed maliyet sıfır; kendi CDN ise compression)
- Bildirim sistemi: T+2/T+7/T+14 batch process verimli mi, üye başına ayrı job mu? (30+ üyede önemli)

**Kontrol sorusu:** "Bu 50 üyeli PT (v1.5) ile de aynı hızda çalışır mı? Dashboard 1 saniyenin altında açılır mı?"

### 5. Hata Yönetimi & Offline-Aware

- Hata durumları ele alınıyor mu (try/catch, error boundary)?
- Kullanıcıya anlamlı hata mesajları gösteriliyor mu? (SMS provider hatası, FCM token expire, network hatası)
- Beklenmeyen hatalar loglanıyor mu? (Sentry vb. observability — M0 sorumluluğu)
- Ağ hataları, timeout'lar handle ediliyor mu?
- **Offline davranış:** Spor salonunda sinyal zayıf — antrenman cache'i + tamamlama kuyruğa alma + senkron sonrası idempotent. "Antrenmanı bitir" iki cihazdan basılırsa server-side idempotent.
- Graceful degradation: bildirim izni kapalıyken üye yine app'i kullanabilmeli; PT'ye 🔕 işareti.

**Kontrol sorusu:** "Üye spor salonundayken WiFi yoksa antrenmanı tamamlayabilir mi? Senkronda çakışma olursa veri kaybı olur mu?"

### 6. Test Kapsamı

- Kritik iş mantığı test edilmiş mi? (Streak hesabı, telafi penceresi, T+2/T+7/T+14 tetik, sessiz saat geç bildirim ertelemesi — bunlar **en yüksek test sıklığı + en katı kabul kriteri** [[ilkeler]] §En Yüksek Öncelikli Eksen #1)
- Edge case'ler test ediliyor mu? (Gece yarısı geçişi, saat dilimi değişimi, çoklu antrenman aynı gün, telafi penceresi gece yarısı kapanışı)
- Testler bağımsız çalışıyor mu?
- Test yazmak zor mu? (Zor ise muhtemelen kod çok bağımlı)
- Kümülatif test altyapısı: [[ilkeler]] §"Kümülatif test altyapısı" — her yeni yetenek kendi güvencesini de getirir, üstüne koyarak büyür.

**Kontrol sorusu:** "Streak hesabı yanlış çalışırsa pilot v1 hipotezi sınanamaz — bu kod yanlışken nasıl kırmızı bayrak yakalanır?"

### 7. Erişilebilirlik & Kullanılabilirlik

- Semantik HTML/native komponentler kullanılıyor mu?
- Renk kontrastı yeterli mi? (Telafi banner turuncu, kayıp risk kırmızı, streak alev — daltonizm testi)
- Keyboard navigasyonu (web admin varsa) çalışıyor mu?
- Form elemanlarında label var mı? Türkçe placeholder düzgün mü?
- Screen reader ile anlamlı mı? (TalkBack / VoiceOver — Türkçe karakter doğru okunmalı)
- **TR yerelleştirme:** Tüm metinler Türkçe (i18n shell başlangıçtan kurulu, v2 EN/global açılım için hazır olsun — [[ilkeler]] proje ufku); +90 telefon formatı; TR yemek/kültür referansları; tarih formatı dd-MMM (29 Mayıs) yerel; saat 24 saat formatı.

**Kontrol sorusu:** "Türkçe karakterler (ş, ğ, ı, ç) tüm ekranlarda doğru gösteriliyor mu? Ekran okuyucu doğru telaffuz ediyor mu? Renk-körü PT banner'ları ayırt edebiliyor mu?"

### 8. PT Sürtünme Ölçümü (Projeye Özgü)

- PT için "kaç tıklama / kaç ekran geçişi / kaç form alanı" ölçülüyor mu? (Builder şablon yazma, üye davet etme, ölçüm girme akışlarında)
- Mevcut WhatsApp+Word akışına göre **2× hız** hedefi (program builder için) test ediliyor mu?
- Hantal akış varsa (örn. ölçüm formu çok fazla alan) sade tutuluyor mu?
- "Çalışıyor ama hantal" kabul edilmez — [[ilkeler]] §En Yüksek Öncelikli Eksen #2.

**Kontrol sorusu:** "Bu akış kardeşin mevcut WhatsApp+Word akışından gerçekten daha mı hızlı, yoksa sadece dijital mi oldu?"

---

## Projeye Özgü Eksenler

**Eklenen eksenler (projeye özgü):**
- **#7 — Yerelleştirme & Erişilebilirlik:** TR pazarı odaklı ürün, yerelleştirme dışlanamaz.
- **#8 — PT Sürtünme Ölçümü:** v1 başarısızlık kriteri kardeşin "WhatsApp+Word daha kolay" demesi — ölçülmezse kontrol edilemez.

**Standart eksenden uyarlananlar:**
- **#2 Güvenlik:** KVKK + sağlık verisi gizliliği nedeniyle "Güvenlik & Gizlilik" olarak genişletildi.
- **#5 Hata Yönetimi:** "Offline-Aware" eklendi — spor salonunda sinyal zayıflığı kritik kullanım senaryosu.

**Çıkarılan eksenler:** Yok. Tüm standart eksenler uygulanır.

> **Öncelik sıralaması burada değil → `ILKELER.md`:** Bu doküman eksenleri *tanımlar* (ne kontrol edilir). Hangi eksenin bu projede diğerlerinin önüne geçtiği (öncelik/sıralama) `ILKELER.md` → "En Yüksek Öncelikli Eksenler"de tutulur. Buraya öncelik ifadesi yazma — tekrar drift kaynağıdır.

---

## Kalite Kontrol Sonuçlarının Kaydı

Faz review'ı tamamlandığında, kalite kontrol sonuçları ilgili faz dokümanına (`phases/PHASE-X.md`) yazılır. QUALITY.md sadece eksenleri tanımlar, sonuçlar faz dokümanlarında tutulur.

---

## Kalite Eksenlerinin Kullanım Noktaları

| Aşama | Nasıl Kullanılır |
|-------|-----------------|
| **Kapsam Tartışması** | Feature'lar tartışılırken kalite beklentileri belirlenir |
| **Araştırma** | Yaklaşımlar seçilirken kalite eksenlerinin etkisi değerlendirilir |
| **Task Yazımı** | Task'ın test kriterleri ve kabul koşulları kalite eksenlerini yansıtmalı |
| **Task Çalıştırma** | Kod yazarken ilgili eksenler göz önünde tutulur |
| **UAT** | Test senaryolarında kalite beklentileri doğrulanır |
| **Faz Review** | Her kalite ekseni sistematik olarak kontrol edilir |

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: 8 eksenli (6 standart + 2 projeye özgü) QUALITY çerçevesi oluşturuldu.
