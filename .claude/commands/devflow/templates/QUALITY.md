# QUALITY — Kalite Eksenleri

**Amaç:** Planlama, task yazımı ve review sırasında göz önünde bulundurulacak kalite kontrol noktaları
**Ne zaman okunmalı:** Faz planlaması, task yazımı ve faz review'ında

---

## Kalite Eksenleri

Aşağıdaki eksenler bu proje için izlenir. Proje başında ilgisiz olanlar çıkarılmış, projeye özgü olanlar eklenmiş olmalıdır.

### 1. Modülerlik

- Kod, mantıksal olarak ayrılmış modüller halinde mi?
- Bir modülde yapılan değişiklik diğerlerini etkiliyor mu?
- Bileşenler tek sorumluluk prensibine uyuyor mu?
- Tekrar eden kod var mı? Ortak mantık paylaşılıyor mu?

**Kontrol sorusu:** "Bu parçayı bağımsız olarak değiştirebilir miyim?"

### 2. Güvenlik

- Kullanıcı girdileri validate ve sanitize ediliyor mu?
- Yetkilendirme kontrolleri her endpoint'te var mı?
- Hassas veriler güvenli şekilde saklanıyor mu?
- Yaygın saldırı vektörleri (SQL injection, XSS, CSRF) korunuyor mu?
- Hata mesajları hassas bilgi sızdırmıyor mu?

**Kontrol sorusu:** "Kötü niyetli bir kullanıcı bunu nasıl istismar edebilir?"

### 3. Bakım Maliyeti

- Kod okunabilir mi? Başka biri anlayabilir mi?
- Karmaşık mantık yorum veya dokümantasyonla açıklanmış mı?
- Bağımlılıklar güncel ve bakımlı mı?
- Konfigürasyon hardcode değil, environment variable veya config dosyasında mı?
- Gelecekte değişmesi muhtemel kısımlar esnek mi?

**Kontrol sorusu:** "6 ay sonra bunu değiştirmem gerekse ne kadar zor olur?"

### 4. Performans

- Gereksiz veritabanı sorguları var mı? (N+1 problemi vb.)
- Büyük veri setleri sayfalama ile mi geliyor?
- Ağır hesaplamalar uygun şekilde cache'leniyor mu?
- Frontend'de gereksiz re-render var mı?
- Asset'ler (resim, CSS, JS) optimize edilmiş mi?

**Kontrol sorusu:** "Bu 10x veri ile de aynı hızda çalışır mı?"

### 5. Hata Yönetimi

- Hata durumları ele alınıyor mu (try/catch, error boundary)?
- Kullanıcıya anlamlı hata mesajları gösteriliyor mu?
- Beklenmeyen hatalar loglanıyor mu?
- Ağ hataları, timeout'lar handle ediliyor mu?
- Graceful degradation var mı?

**Kontrol sorusu:** "Bu işlem başarısız olursa ne olur?"

### 6. Test Kapsamı

- Kritik iş mantığı test edilmiş mi?
- Edge case'ler test ediliyor mu?
- Testler bağımsız çalışıyor mu?
- Test yazmak zor mu? (Zor ise muhtemelen kod çok bağımlı)

**Kontrol sorusu:** "Bu kodu değiştirdikten sonra bir şeyin bozulup bozulmadığını nasıl bilirim?"

### 7. Erişilebilirlik (UI Projeleri İçin)

- Semantik HTML kullanılıyor mu?
- Renk kontrastı yeterli mi?
- Keyboard navigasyonu çalışıyor mu?
- Form elemanlarında label var mı?
- Screen reader ile anlamlı mı?

**Kontrol sorusu:** "Fareyi olmayan veya ekranı göremeyen biri bunu kullanabilir mi?"

---

## Projeye Özgü Eksenler

Bu liste şablondur. Projeye göre düzenle:

**Eklenebilecek eksenler (projeye göre):**
- **Uyumluluk:** Belirli tarayıcı/platform desteği
- **Veri Tutarlılığı:** Finansal uygulamalarda kritik
- **Ölçeklenebilirlik:** Çok kullanıcılı sistemlerde
- **Yerelleştirme:** Çoklu dil desteği gerekiyorsa
- **API Tutarlılığı:** REST/GraphQL convention'larına uyum

**Çıkarılabilecek eksenler:**
- CLI projelerinde "Erişilebilirlik" gereksiz olabilir
- Tek kullanıcılı uygulamalarda "Güvenlik" daha hafif tutulabilir

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

**Son Güncelleme:** [Tarih]
