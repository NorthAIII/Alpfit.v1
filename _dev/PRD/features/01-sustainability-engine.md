# Sürdürülebilirlik Motoru

## Özet

Üyenin antrenman programına devamlılığını destekleyen ve kopma anında geri çağıran akıllı sistem. Üç parçadan oluşur: **streak** (devamlılık serisi göstergesi), **reminder** (antrenman günü hatırlatma), **comeback** (kopma sonrası geri çekme akışı). Alpfit'in ürün-pazar farkını taşıyan çekirdek motordur — diğer feature'lar (program görüntüleme, tamamlama işaretleme, PT dashboard) bu motorun girdi/çıktısıdır. Her tasarım kararı şu testi geçer: "Bu özellik üye sürdürülebilirliğine ne katıyor?"

---

## Kullanıcı Senaryoları

### S1 — Düzenli üyenin haftası
Ayşe (üye) Pazartesi sabah 09:00'da push bildirimi alır: *"Bugün Push günü, planını gör."* Saat 17:00'de (antrenman 19:00'da) 2. bildirim: *"Antrenmanın 2 saat sonra."* Ayşe spor salonunda antrenmanı tamamlar, app'te "Tamamlandı" butonuna basar. Streak 7 → 8. Salı dinlenme günüdür (plansız) — sistem hiçbir şey yapmaz, streak 8 kalır. Çarşamba aynı döngü tekrar eder.

### S2 — Geç tamamlama (1 gün tolerans)
Mehmet Pazartesi Push gününü kaçırır. Salı sabah 09:00'da bildirim: *"Dün Push günün vardı, 24 saat içinde telafi edebilirsin."* Mehmet Salı akşam spor salonuna gider, dünkü antrenmanı tamamlar ve "Geç tamamla" işaretler. Streak korunur (12 → 13). Çarşamba normal akışa döner.

### S3 — Comeback ilk dokunuş (T+2)
Selin Pazartesi antrenmanı yapmaz, Salı telafi penceresinde de yapmaz. Salı gece yarısı streak 9 → 0 olur. Perşembe sabah Selin'e push: *"Yeni bir streak başlatabilirsin — bugün sıfırdan başla."* Selin app'i açar, programını görür.

### S4 — Comeback PT uyarısı (T+7)
Ali, streak'i kırıldıktan sonra hâlâ aktif olmaz. 7. günde PT'si (kardeş) Alpfit'i açar, in-app uyarı görür: *"Ali 7 gündür aktif değil — manuel iletişim önerilir."* PT WhatsApp'tan Ali'yi arar.

### S5 — Kayıp risk işareti (T+14)
Zeynep 14 gündür aktif değil. PT dashboard'unda Zeynep'in adı yanında ⚠️ "Kayıp risk" etiketi belirir. PT haftalık üye review'unda bu listeyi öncelikli olarak görür.

---

## Davranış Kuralları

### Streak hesaplama
- **Birim:** Antrenman bazlı. Streak yalnızca PT programında **planlı** bir antrenmanın tamamlanmasıyla +1 artar.
- **Dinlenme günü etkisi:** Plansız gün streak'i ne artırır ne azaltır — geçişte sayılmaz.
- **Birden fazla antrenman aynı gün:** PT programda aynı güne 2 antrenman koymuşsa, ikisinin tamamlanması +2 sayar.
- **Tamamlama tanımı:** Üye antrenman ekranında "Tamamlandı" işaretler. Sistem kısmi tamamlama saymaz — antrenman ya tamam ya değil.

### Tolerans (1 gün penceresi)
- **Kural:** Planlı antrenman günü 23:59'da tamamlanmamışsa, ertesi gün 23:59'a kadar "Geç tamamla" işareti açıktır.
- **Telafi yapılırsa:** Streak korunur. Antrenman tarihi orijinal planlı gün olarak loglanır, ama "geç işaretlendi" bayrağı taşır (PT'nin görmesi için).
- **Telafi yapılmazsa:** Telafi penceresi sonunda (planlı günden 48 saat sonra gece yarısı) streak sıfırlanır.
- **Birden fazla planlı gün kaçırılırsa:** Telafi sadece **en son kaçırılan tek gün** için geçerlidir. 2 gün üst üste kaçırılırsa streak hemen düşer.

### Reminder (antrenman günü bildirimleri)
- **Sabah bildirimi:** Her planlı antrenman gününde varsayılan 09:00 (üye değiştirebilir). İçerik: *"Bugün [antrenman tipi] günü, planını gör."*
- **Antrenman öncesi bildirim:** Üye programa belirli saat girdiyse (örn. 19:00 antrenman), 2 saat önce ek bildirim. Saat tanımlı değilse atılmaz.
- **Üye kontrolü:** Üye reminder'ları tamamen kapatabilir veya saatleri özelleştirebilir. PT'nin reminder ayarına müdahale yetkisi yoktur — üyenin kişisel tercihi.
- **Sessiz saatler:** 22:00–08:00 arasında hiç bildirim atılmaz. Bu pencereye denk gelen reminder bir sonraki açık pencereye ertelenir veya iptal olur (örn. 06:00 antrenmanı için "2 saat önce" bildirimi atılmaz, sadece sabah 09:00 sonraki gün için).

### Comeback (kayıp üye akışı)
- **T+2 gün (üye nazik dokunuş):** Streak sıfırlandıktan 2 gün sonra (yani toplam ~4 gün aktivitesiz) üyeye push: *"Bugün yeni bir streak başlatabilirsin."* Tek seferlik, tekrar atılmaz.
- **T+7 gün (PT uyarı):** Toplam 7 gün aktivitesizlikten sonra PT'nin Alpfit ana ekranında in-app uyarı: *"[Üye adı] 7 gündür aktif değil — manuel iletişim önerilir."* PT bunu "okudum" ile temizleyebilir veya not düşebilir.
- **T+14 gün (kayıp risk):** 14 gün aktivitesizlikten sonra PT dashboard'unda üye adının yanında ⚠️ "Kayıp risk" etiketi belirir. Etiket üye yeniden aktif olana kadar kalır.
- **Re-aktivasyon:** Üye herhangi bir antrenmanı tamamladığı anda tüm comeback etiketleri ve PT uyarıları temizlenir, streak 0'dan başlar.

### Streak görünürlüğü
- **Üye tarafı:** Ana ekranda büyük bir "Streak: N" göstergesi. Altında "En uzun streak'in: M" satırı (motivasyon).
- **PT tarafı:** Her üyenin listesinde streak değeri görünür. PT sıralayabilir (en uzun streak en üstte / en kısa en üstte).
- **Streak sıfırlandığında:** Üye ekranında "Yeni streak'ini başlat" CTA'sı 0 yerine geçer. PT ekranında düşüş tarihi loglanır.

---

## Versiyon

v0.1 (v1)

<!-- VERSIONS.md tek kaynak (source of truth). Çelişki durumunda VERSIONS.md geçerlidir. -->

---

## Edge Case'ler ve Sınır Durumları

- **PT programı boşsa:** Üyenin atanmış programı yoksa streak hesaplanmaz. Üye ekranında "PT'n henüz program yazmadı" gösterilir, streak alanı saklı.
- **PT program günü değiştirirse:** Pazartesi planı Salı'ya alındıysa, yeni Salı gününü baz al. Geçmiş tamamlamalar etkilenmez.
- **PT bir antrenmanı sildi/değiştirdi:** Silinen antrenman streak hesaplamasından çıkar. Streak yeniden hesaplanır. Üye'ye bildirim: *"Programında değişiklik var."*
- **Üye tatil/seyahat modu:** v1'de YOK (v1.5 adayı — `prd-note` ile saklanır). v1'de üye telafi penceresini de kaçırırsa streak düşer, comeback akışı tetiklenir.
- **Sistem saat dilimi:** Üyenin cihaz saat dilimi baz alınır. PT ile farklı zaman diliminde olabilir.

---

## Hata Durumları

- **Bildirim izni reddedildiyse:** Reminder ve comeback push'ları gönderilemez. Üye ekranında üst bantta sürekli uyarı: *"Bildirim izni kapalı — reminder almıyorsun. Aç →"* PT'ye bilgilendirme: ilgili üyenin yanında 🔕 ikonu.
- **PT bildirim almazsa (T+7 uyarısı):** PT in-app açtığında uyarı zaten bekleyecek. Push backup atılır (PT bildirim izni varsa). Push da kapalıysa sadece in-app.
- **Sistem bildirim gönderiminde gecikir:** Sabah 09:00 reminder en geç 09:30'a kadar atılır. Daha geç atılırsa o gün için atılmaz (geç bildirim üye için kafa karıştırıcıdır).

---

## Boş ve Varsayılan Durumlar

- **İlk açılış (streak yok):** "Sıfırdan başla — ilk antrenmanını tamamla, streak başlasın." CTA: bugünün antrenmanına git.
- **PT yeni üye eklediğinde:** Üye davet kabul ettiğinde streak 0'dan başlar. İlk planlı antrenman tamamlandığında 1'e geçer.
- **Reminder ayarları default:** Sabah 09:00, antrenman öncesi 2 saat (saat tanımlıysa). Üye onboarding'inde "Sabah kaçta hatırlatalım?" sorusu sorulabilir (v1'de zorunlu değil, default 09:00).

---

## İlişkili Feature'lar

- **[Program Görüntüleme + Tamamlama]** (henüz yazılmadı) — Streak'in artması bu feature'daki "Tamamlandı" aksiyonuna bağlı.
- **[PT Dashboard — Üye Listesi]** (henüz yazılmadı) — Comeback etiketleri ve T+7 uyarıları burada yaşar.
- **[Bildirim Sistemi]** (henüz yazılmadı) — Reminder ve comeback push'larının teknik altyapısı bu feature'ın sorumluluğundadır.

---

## Açık Sorular

- **Üye streak'i istemiyorsa kapatabilir mi?** Bazı üyeler gamification'dan rahatsız olur. v1'de açık/kapalı toggle gerek mi yoksa "herkese streak" mi? PRD-refine konusu.
- **PT'nin streak'e müdahale hakkı:** PT bir üyenin streak'ini manuel sıfırlayabilir mi (örn. uzun mola sonrası temiz başlangıç)? Yoksa sistem otomatik mi?
- **Streak'in görsel temsili:** Sadece sayı mı, alev/yıldız ikon mu? Brief §4'te "görsel rozet sistemi v2'ye" denmiş — streak göstergesi rozet sayılmaz ama görsel ağırlığı PRD-refine'da netleşmeli.
- **Hafta sonu/tatil günleri:** PT programı hafta sonuna antrenman koymazsa sistem normal davranır mı, yoksa "hafta sonu modu" var mı?
