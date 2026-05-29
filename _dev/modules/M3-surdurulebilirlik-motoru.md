# M3: Sürdürülebilirlik Motoru

**Sorumluluk:** Üyenin antrenman programına devamlılığını destekleyen ve kopma anında geri çağıran akıllı sistem — streak hesaplama, 1 gün telafi penceresi, T+2/T+7/T+14 comeback akışı, kayıp risk etiketi, motor → bildirim olayları üretimi.
**Bağımlılık:** M0, M1, M2.
**Sınır:** Motor antrenman bazlıdır; ölçüm (F6.1) ve yemek günlüğü (F6.2) **streak'i etkilemez** (M6 ile bağ yok — açık beyan). Push bildirim altyapısı M4'te; motor "comeback tetiklendi" event'ini M4'e gönderir, M4 push'u gönderir. PT dashboard banner görünümü M5'te.

> **Bu modül ürünün kalbidir** ([[ilkeler]] §En Yüksek Öncelikli Eksen #1 + [[00-vision]] §1). Her tasarım kararı şu testi geçer: *"Bu özellik üye sürdürülebilirliğine ne katıyor?"*

---

## Feature'lar

### F3.1: Sürdürülebilirlik Motoru (Streak + Telafi + Comeback) → —

**Açıklama:** Üç parçadan oluşur: **streak** (devamlılık serisi göstergesi), **reminder** (antrenman günü hatırlatma), **comeback** (kopma sonrası geri çekme akışı). Streak yalnızca PT programındaki planlı bir antrenmanın tamamlanmasıyla +1 artar. 1 gün telafi penceresi sayesinde tek bir gün kaçıran üye streak'ini koruyabilir. Streak sıfırlanırsa T+2 üye nazik dokunuşu, T+7 PT manuel iletişim uyarısı, T+14 PT kayıp risk etiketi tetiklenir.

**Kabul Kriterleri:**

*Streak hesaplama:*
- **Birim:** Antrenman bazlı (gün bazlı değil) — yalnızca planlı bir antrenmanın tamamlanması +1 sayar
- **Dinlenme günü etkisi:** Plansız gün streak'i ne artırır ne azaltır — geçişte sayılmaz
- **Birden fazla antrenman aynı gün:** PT 2 antrenman koymuşsa, ikisinin tamamlanması +2 sayar
- **Tamamlama tanımı:** Üye antrenman ekranında "Antrenmanı bitir" butonuna basar (M2 sinyal gönderir); kısmi tamamlama sayılmaz

*Tolerans (1 gün telafi penceresi):*
- Planlı antrenman günü 23:59'da tamamlanmamışsa, ertesi gün 23:59'a kadar "Geç tamamla" işareti açık
- Telafi yapılırsa: streak korunur; antrenman tarihi orijinal planlı gün olarak loglanır, "geç işaretlendi" bayrağı taşır (PT görsün)
- Telafi yapılmazsa: planlı günden 48 saat sonra gece yarısı streak sıfırlanır
- **Birden fazla planlı gün üst üste kaçırılırsa:** Telafi sadece son kaçırılan tek gün için; 2 gün üst üste kaçırılırsa streak hemen düşer

*Reminder (antrenman günü bildirimleri):*
- Sabah bildirimi: her planlı antrenman gününde varsayılan 09:00 (üye değiştirebilir)
- İçerik: *"Bugün [antrenman tipi] günü, planını gör."*
- Antrenman öncesi bildirim: üye programa belirli saat girdiyse (örn. 19:00) 2 saat önce ek bildirim; saat tanımlı değilse atılmaz
- Üye reminder'ları tamamen kapatabilir veya saatleri özelleştirebilir; PT'nin reminder ayarına müdahale yetkisi yok
- **Sessiz saatler (22:00–08:00):** Bu pencereye denk gelen reminder bir sonraki açık pencereye **ertelenir veya iptal olur**:
  - Reminder: bir sonraki açık pencerede atılmaz (geç hatırlatma kafa karıştırıcı)
  - Comeback: ertesi gün 09:00'da atılır

*Comeback (kayıp üye akışı):*
- **T+2 (üye nazik dokunuş):** Streak sıfırlandıktan 2 gün sonra üyeye push *"Bugün yeni bir streak başlatabilirsin."* — tek seferlik, tekrar atılmaz
- **T+7 (PT uyarı):** Toplam 7 gün aktivitesizlikten sonra PT'nin Alpfit ana ekranında in-app banner: *"[Üye adı] 7 gündür aktif değil — manuel iletişim önerilir."* (M5 görünüm)
  - PT "Okudum" der → banner kaybolur, **tekrar belirmez**
  - Push backup atılır (PT bildirim izni varsa); push da kapalıysa sadece in-app
- **T+14 (kayıp risk etiketi):** 14 gün aktivitesizlikten sonra PT dashboard'unda üye adının yanında ⚠️ "Kayıp risk" etiketi belirir (M5 görünüm). Etiket üye yeniden aktif olana kadar kalır
- **Re-aktivasyon:** Üye herhangi bir antrenmanı tamamladığı anda tüm comeback etiketleri ve PT uyarıları temizlenir, streak 0'dan başlar, "Okudum" işareti sıfırlanır — yeni bir kopma olursa T+7 banner yeniden tetiklenir

*Streak görünürlüğü:*
- Üye tarafı: Ana ekranda büyük "Streak: N" göstergesi + altında "En uzun streak'in: M" (M2 ana ekran çiziyor)
- PT tarafı: Her üyenin listesinde streak değeri (M5 görünüm); PT sıralayabilir
- Streak sıfırlandığında: üye ekranında "Yeni streak'ini başlat" CTA sayı yerine geçer; PT ekranında düşüş tarihi loglanır

*Motor → bildirim olayları (M4 entegrasyonu):*
- Motor "reminder zamanı", "telafi penceresi açıldı", "comeback T+2 / T+7 / T+14 tetiklendi" event'lerini üretir
- M4 bu event'leri push notification'a çevirir (sessiz saat penceresini M4 honor eder ama event'i motor üretir)
- M5 "T+7 PT banner", "T+14 kayıp risk etiketi" event'lerini gözlemleyip dashboard'da gösterir

**Bağımlılık:** F2.1 (program), F2.2 (antrenman tamamlama sinyali), F4.1 (push gönderimi), F5.1 (PT banner görünümü).

**Edge Case'ler:**
- **PT programı boşsa:** Üyenin atanmış programı yoksa streak hesaplanmaz; üye ekranında "PT'n henüz program yazmadı" gösterilir, streak alanı saklı.
- **PT program günü değiştirirse:** Pazartesi planı Salı'ya alındıysa, yeni Salı baz alınır. Geçmiş tamamlamalar etkilenmez.
- **PT bir antrenmanı sildi/değiştirdi:** Silinen antrenman streak hesabından çıkar; streak yeniden hesaplanır; üye'ye bildirim *"Programında değişiklik var."*
- **Üye tatil/seyahat modu:** v1'de YOK (v1.5 adayı). v1'de telafi penceresini de kaçırırsa streak düşer, comeback akışı tetiklenir.
- **Sistem saat dilimi:** Üye cihaz saat dilimi baz alınır. PT ile farklı zaman diliminde olabilir.
- **Bildirim izni reddedildiyse:** Reminder ve comeback push'ları gönderilemez. Üye ekranında üst bantta sürekli uyarı *"Bildirim izni kapalı — reminder almıyorsun. Aç →"* PT'ye bilgilendirme: ilgili üyenin yanında 🔕 ikonu.
- **PT bildirim almazsa (T+7 uyarısı):** PT in-app açtığında uyarı zaten bekliyor. Push backup atılır.
- **Sistem bildirim gönderiminde gecikir:** Sabah 09:00 reminder en geç 09:30'a kadar atılır; daha geç atılırsa o gün için atılmaz.
- **İlk açılış (streak yok):** "Sıfırdan başla — ilk antrenmanını tamamla, streak başlasın." CTA bugünün antrenmanına gider.
- **PT yeni üye eklediğinde:** Üye davet kabul ettiğinde streak 0'dan başlar; ilk planlı antrenman tamamlanınca 1'e geçer.
- **Reminder ayarları default:** Sabah 09:00, antrenman öncesi 2 saat (saat tanımlıysa). Onboarding'de zorunlu değil, default 09:00.

**PRD Referans:** `_dev/PRD/features/01-sustainability-engine.md`

---

## Teknik Notlar

- **Bu modül [[ilkeler]] §Eksen #1'in DOĞRULAMA YERİ.** Streak hesabı + telafi penceresi + comeback tetik mantığı kodun **en yüksek test sıklığı + en katı kabul kriteri** ile yazılır. Edge case'ler (gece yarısı geçişi, saat dilimi değişimi, çoklu antrenman aynı gün, telafi penceresi gece yarısı kapanışı) test suite'inde olmazsa olmaz.
- **v1 başarı kriteri ([[00-vision]] §7):** "Comeback bildirimleri en az 1 üyeyi geri çekmiş olmalı." Motor yanlış çalışırsa (false comeback, kaçırılmış telafi penceresi, hatalı streak hesabı, T+7 banner'ı doğru üyeyi göstermemesi) v1 hipotezi sınanamaz.
- **Streak'in görsel temsili:** v1'de sayı + 🔥 emoji yeterli (M2 ana ekran çizer); "görsel rozet sistemi" v2'ye atıldı.
- **Üye streak istemiyorsa kapatabilir mi?** v1'de toggle YOK; pilot geri bildirimi v1.5'te ekleyebilir.
- **PT'nin streak'e müdahale hakkı:** PT bir üyenin streak'ini manuel sıfırlayamaz veya değiştiremez — motor otomatik. (PRD açık soru olarak işaretlenmiş; v1'de motor tek otorite.)
- **Hafta sonu/tatil günleri:** PT programı hafta sonuna antrenman koymazsa sistem normal davranır; "hafta sonu modu" YOK.
- **Bildirim "okundu" tracking:** v1'de YOK (push açıldı/açılmadı veri yok); v1.5 adayı.
- **Sessiz saat pencereyi üye değiştirebilir mi:** Şimdilik global 22:00–08:00; gece çalışan üyeler için problem olabilir — PRD-refine konusu.

---

**Son Güncelleme:** 2026-05-29 — Kickoff Oturum 2: F01 PRD davranışı M3 kabul kriterlerine dönüştürüldü; motor → M4 event üretim sınırı netleştirildi.
