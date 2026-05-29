# KVKK — Kişisel Verilerin Korunması Çerçevesi

**Amaç:** Alpfit'in KVKK uyumu için aydınlatma metni, sağlık verisi açık rıza metni, saklama süresi politikası ve üye self-silme akışını tek yerde tutmak.
**Ne zaman doldurulur:** Bu doküman **boş şablon olarak** kickoff-docs'ta açıldı. İçerik **Yakın 4 (PT dashboard + Sağlık verisi) fazına girmeden önce** `/devflow:prd-refine` + **hukuki danışman incelemesi** ile doldurulur.
**Statü:** ⬜ Boş şablon — Yakın 4 blocker. DURUM.md'de "Engelleyici Ön-Koşullar" altında izlenir.

> ⚠️ **Bu doküman hukuki tavsiye değildir.** Hazırlanacak metinler **TR KVKK mevzuatına uygun** olmalı ve **hukuki danışman incelemesinden geçmeli**. v1 launch (Yakın 5) için bu adım atlanamaz.

---

## Neden Bu Doküman Erken Açılıyor?

KVKK çerçevesi M0 Çekirdek Altyapı'da kurulur (3 rol veri modeli, açık rıza akış, saklama politikası). Ama metinler ve hukuki kararlar **uzun lead time** gerektirir:

1. **M1 Onboarding (F1.1) KVKK açık rıza ekranı içeriyor** — metin Yakın 1 öncesi gerekli değil ama yer ayrılıyor (placeholder)
2. **M6 Sağlık Verisi (F6.1 + F6.2) sağlık verisi açık rıza istiyor** — Yakın 4 başlamadan önce hazır olmalı
3. **Üye self-silme akışı** (KVKK Madde 11) — Yakın 4 öncesi netleşmeli
4. **Saklama süresi politikası** — backend'de delete job yazılmadan önce karar gerekli

Bu nedenle **kickoff-docs'ta boş şablon** olarak açıldı; gerçek içerik **PRD-refine + hukuki danışman** ile doldurulur.

---

## Doldurulacak Bölümler

### 1. Aydınlatma Metni (KVKK Madde 10)

**Ne içerir:**
- Veri sorumlusu kim (Alpfit Yazılım — kurucu bilgisi)
- Hangi kişisel verileri işliyoruz (isim, soyisim, telefon, profil fotoğrafı, ölçüm verileri, yemek günlüğü, antrenman geçmişi, push token, IP, cihaz bilgisi)
- Hangi amaçla işliyoruz (hizmet sunumu, PT-üye iletişimi, sürdürülebilirlik motoru, KVKK gereği saklama)
- Kimlerle paylaşıyoruz (üyenin atandığı PT — sağlık verisi gizlilik toggle'ı dikkate alınır; SMS provider; push provider; hosting sağlayıcı; AI nutrition v1.5'te — sadece PT onaylı)
- KVKK Madde 11 hakları (erişim, düzeltme, silme, itiraz, taşınabilirlik)
- İletişim kanalı (destek email/form)

**UI yerleşimi:** M1 onboarding'inde SMS OTP sonrası, profil formundan önce. Ekran içeriği:
- Aydınlatma metni özeti (link "Tam metni oku")
- "Aydınlatma metnini okudum, kabul ediyorum" onay kutusu (zorunlu)
- "KVKK metnini kabul etmeden hesap açılamaz" mesajı

**Statü:** ⬜ Boş — hukuki danışmandan metin alınacak.

---

### 2. Sağlık Verisi Açık Rıza Metni (KVKK Madde 6)

KVKK Madde 6 sağlık verisini **özel nitelikli kişisel veri** olarak tanımlar — ayrı açık rıza gerekli. Aydınlatma metniyle birlikte ama ayrı checkbox.

**Ne içerir:**
- Kilo, boy, vücut çevre ölçümleri, yemek günlüğü içeriği "özel nitelikli kişisel veri"dir
- Bu veriler **antrenman programının kişiselleştirilmesi**, **sürdürülebilirlik takibi** ve **v1.5'te AI nutrition önerisi** için işlenir
- PT (kullanıcının atandığı) bu verilere erişebilir — **gizlilik toggle ile üye PT erişimini kısıtlayabilir** (F6.1 + F6.2)
- Diyetisyen rolü Alpfit'te yoktur; AI nutrition v1.5'te aktif olduğunda **çıktı PT onayından sonra üyeye gider** ([[00-vision]] §6 yasal çerçeve)
- Veri **yurt içinde mi yurt dışında mı** saklanır? (Hosting kararı `TECH-STACK.md`'de — sağlık verisi data residency hukuki incelemesi gerekir)

**UI yerleşimi:** M1 onboarding'inde aydınlatma metni onayından sonra. Ekran içeriği:
- Sağlık verisi açık rıza metni özeti (link "Tam metni oku")
- "Sağlık verilerimin işlenmesine açık rıza veriyorum" onay kutusu (zorunlu)
- "Sağlık verisi rızası verilmezse ölçüm + yemek günlüğü özellikleri kullanılamaz" mesajı

**Sonradan geri çekme:** Üye Ayarlar > Gizlilik > "KVKK rızamı geri çek" CTA. Geri çekildiğinde 30 gün içinde sağlık verisi silinir (hesap kalır).

**Statü:** ⬜ Boş — hukuki danışmandan metin alınacak.

---

### 3. Saklama Süresi Politikası

**v1 baz varsayım (PRD'den):**
- Üye hesabı **aktif** olduğu sürece tüm veri saklanır
- Üye hesabı silinirse: tüm veri silinir (KVKK hak)
- Üye PT'den çıkarıldığında: veri **arşivlenir** (silinmez); üye "verilerimi sil" derse arşiv dahil silinir
- KVKK rızası geri çekilirse: sağlık verisi 30 gün içinde silinir; hesap kalır (KVKK aydınlatma metni kabul edilmiş sayılır)

**Doldurulacak:**
- Audit log (kim, ne zaman, hangi veriyi okudu/değiştirdi) saklama süresi
- Backup'larda veri ne kadar tutulur? (Hosting kararı sonrası)
- Hesap inaktif olduğunda (üye 6 ay/1 yıl giriş yapmadıysa) ne olur? Otomatik silme yok mu? Bilgilendirme + onay var mı?
- KVKK denetim talebine yanıt süresi (yasal: 30 gün)

**Statü:** ⬜ Boş — hukuki danışmandan + PRD-refine ile netleşecek.

---

### 4. Üye Self-Silme Akışı (KVKK Madde 11)

**KVKK Madde 11:** Üye verilerinin silinmesini talep etme hakkına sahiptir. Bu hak teknik olarak self-service olmalı (manuel müracaat zorlanmamalı).

**UI yerleşimi:** Ayarlar > Hesap > "Hesabımı sil" CTA. Akış:
1. Üye "Hesabımı sil" der → uyarı modalı: *"Tüm verilerin (ölçümler, yemek günlüğü, antrenman geçmişi, notlar) silinecek. PT'nle ilişkin sonlanacak. Geri alınamaz."*
2. Onay → SMS OTP ile bir kez daha doğrula (güvenlik)
3. Silme talebi backend'e iletilir → asenkron silme job'u (audit log dışında her şey 30 gün içinde silinir)
4. Üye'ye onay email/SMS bildirimi (silme tamamlandığında)

**PT tarafında etki:** PT dashboard'da üye satırı kaybolur. Notlarda kalmış mı? Veri yapısında üye verisi nasıl tutulur (foreign key constraint vb.)? — M0 implement edilirken karar.

**Statü:** ⬜ Boş — UI akış M5'te + backend job M0'da implement, metin hukuki danışman.

---

### 5. Veri İhlali Bildirim Süreci

**KVKK Madde 12:** Veri ihlali öğrenildiğinde **72 saat içinde** KVK Kurumu'na bildirim zorunluluğu.

**Doldurulacak:**
- İhlal tespit edildiğinde kim sorumlu (kurucu)
- KVK Kurumu bildirim şablonu
- Etkilenen üyelere bildirim metni şablonu (email/in-app)
- Pre-mortem: en kötü senaryolar (örn. SMS provider compromise — telefon numaraları sızdı; DB sızdı — tüm sağlık verisi)

**Statü:** ⬜ Boş — Yakın 5 launch öncesi hazır olmalı.

---

## Hukuki Danışman Süreci

**Önerilen adımlar:**
1. v1 PRD + bu doküman taslağı + ürün demosunu (mockup) hukuki danışmana göster
2. Aydınlatma metni + sağlık verisi açık rıza metni + üye self-silme akışı taslağını al
3. Saklama süresi + audit log + veri ihlali bildirim süreci politikasını netleştir
4. **Diyetisyen rolü olmaması** ve **AI nutrition PT onayı modeli** üzerinde özellikle danış — yetkisiz diyetisyenlik riskinin yasal değerlendirmesi
5. Hosting kararı yapıldıktan sonra **data residency** (yurt içi/yurt dışı saklama) hukuki incelemesi
6. v1 launch (Yakın 5) öncesi son review

**Beklenen süre:** 2-4 hafta. Yakın 4 başlamadan önce başlanmalı (Yakın 4 milestone'u sağlık verisi giriş akışıyla ilgili).

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: KVKK boş şablon olarak oluşturuldu (5 doldurulacak bölüm + hukuki danışman süreci listelendi).
