# Alpfit v1 — PRD Öncesi Hazırlık Paketi

> **Bu dosya `/devflow:prd` oturumuna girmeden önce okunmalı.** İçinde 2026-05-28 tarihli planlama oturumunda alınmış kararlar, kardeşten toplanan kullanıcı araştırması ve scope tablosu var. PRD oturumu sıfırdan başlamayacak — bu içeriği temel alacak ve derinleştirecek.

---

## 1. Tek satır vizyon

**Alpfit, üye sürdürülebilirlik motoru olarak konumlanan bir PT-üye koachluk uygulamasıdır.**

Sadece antrenman/program yönetimi değil. Üyenin spora **devamlılığını** sağlayan akıllı sistem.

Bu cümle ürünün her tasarım kararını test eder: "Bu özellik üye sürdürülebilirliğine ne katıyor?"

---

## 2. Niye var (problem)

### Üye tarafı
- Düzen zorluğu, süreklilik problemi, zaman/program uyumsuzluğu üyenin top 3 şikayeti (kardeşin raporu, Q7)
- Üyelerin spora başlayıp bırakma döngüsü → "sürdürülebilirlik çok önemli, devamlılığı sağlayan sistem büyük fark yaratır" (kardeşin sözleri, Q8)

### PT tarafı (kardeş örneği)
- Program yazımı: defter/Word/PDF, WhatsApp ile paylaşım
- Hatırlatma: elle WhatsApp mesajı
- Beslenme: "diyetisyenin işi" diyor, ama üye soruyor
- Mevcut Flyby kullanımı: sadece takvim, gerisi manuel
- Sözleri: *"sistem içinde üyelerin programlarını kolayca görüp takip edebilmesi benim için çok daha iyi olurdu"*

### Pazar boşluğu (Mayıs 2026 itibarıyla)
- **Flyby (mevcut TR oyuncu)**: gym ops focus (üyelik, rezervasyon, POS). PT-üye koachluk yok. Beslenme yok. Yavaş, UX zayıf.
- **Trainerize / ABC Trainerize / MyPTHub / TrueCoach / PT Distinction**: PT-coaching güçlü, US merkezli, İngilizce, TR yemek/kültür yok, gym ops zayıf.
- **TR pazarında PT-coaching + sürdürülebilirlik + AI nutrition üçlüsünü birleştiren rakip yok.**

---

## 3. Roller (3 rol mimari karar)

| Rol | Sorumluluk | Hangi sürümde |
|---|---|---|
| **Member (üye)** | Programını görme + tamamlama + yemek günlüğü + reminder + streak takibi | v1 |
| **Trainer (PT)** | Üye kabul + ölçüm + program builder + ilerleme görme + otomatik reminder + (v1.5'te AI nutrition onayı) | v1 |
| **Gym Owner** | Üyelik, ödeme, rezervasyon, retention dashboard | v1.5+ |

**Karar:** Diyetisyen 4. rol olarak **eklenmiyor**. Yerine: PT manuel yazar + üye yemek günlüğü tutar + AI önerir (PT onayıyla). Detay: §5.

**Mimari kural:** Veri modeli ve auth katmanı **3 rolü ilk günden destekleyecek** şekilde tasarlanır. v1 ekranlarında sadece 2 rol görünür, ama 3. eklendiğinde "üstüne ekle" işi olur, "baştan yap" değil.

---

## 4. v1 / v1.5 / v2 scope tablosu

| Modül | v1 (~90 gün, kardeş + 3-4 öğrencisi) | v1.5 | v2 |
|---|---|---|---|
| **Trainer rolü** | Üye kabul + ölçüm + program builder + ilerleme görme + otomatik reminder | Detay analitik, batch işlemleri | – |
| **Member rolü** | Programı görme + tamamlama işaretleme + reminder + **streak/devamlılık göstergesi** + yemek günlüğü | Sosyal/peer | **Rozetler + motivasyon push notification** |
| **Beslenme** | PT manuel yazar + üye yemek günlüğü (kalori/makro form) | **AI önerir, PT onaylar, üyeye gider** | Tam kişisel AI plan + TR yemek DB |
| **Gym Owner** | YOK | Üyelik & ödeme & rezervasyon | Retention dashboard |
| **Akıllı takvim** | YOK (manuel rezervasyon) | Google Calendar entegrasyonu | Otomatik planlama |
| **Sürdürülebilirlik motoru** | **v1'in kalbi**: streak, eksik gün uyarısı, comeback notification | Daha derin retention analitiği | Gamification katmanı (rozetler) |

### Niye bu sıralama

- **v1'de sürdürülebilirlik motoru var ama görsel rozet sistemi yok**: değer mekanik (streak/reminder/comeback). Rozet katmanı tasarım eforu yüksek, v2'ye.
- **v1'de Gym Owner yok**: diğer PT'ler Flyby'dan memnun (Q10) → tek tek PT satışı zor. Önce kardeş retention verisi üretsin, sonra Gym Owner satışı.
- **v1'de AI nutrition yok**: yasal risk + scope + LLM kalite. v1.5'te PT onayıyla girer.
- **v1'de akıllı takvim yok**: Google Calendar entegrasyonu v1'i yıkar.

---

## 5. AI Nutrition kararı (yasal güvenlikle)

### Kural
TR'de diyetisyenlik **lisanslı meslek**. Alpfit "beslenme programı yazıyor" olarak konumlanırsa yetkisiz diyetisyenlik riski. Buna karşı:

1. **Dil**: "Beslenme programı" yerine **"öneri", "yemek günlüğü", "kalori hedefi"** kullanılır.
2. **Disclaimer**: Her beslenme ekranında *"Bu öneri tıbbi tavsiye değildir, kişisel diyet için diyetisyen ile görüşün"*.
3. **PT onay zorunlu**: AI çıktısı **PT onayından sonra** üyeye gider. Yasal sorumluluk PT'de.

### Katmanlı yapı
- **v1**: AI yok. PT manuel + üye yemek günlüğü.
- **v1.5**: AI önerir → PT onaylar/düzenler → üyeye gider. Dar senaryo (kalori hedefi + 3 öğün öneri).
- **v2**: Tam kişisel AI plan + TR yemek DB + davranışa göre uyarlama.

Bu Alpfit'in differentiator'ı. **v1'de yok** ama mimari hazırlanır.

---

## 6. Kardeş (ilk tester) profili

- Bir fitness center'da PT olarak çalışıyor
- Şu an Flyby kullanıyor — sadece takvim için
- Pain: program yazımı manuel/WhatsApp, hatırlatma elle, beslenme dışarıda
- **3-4 öğrencisini Alpfit v1 ile test etmeye taahhüt etti** (Bonus soru cevabı: "Evet")
- "Harika app" tanımı: kolay kullanım + hızlı erişim + akıcı/modern/profesyonel his (Q9)

### Kardeşten gelen feature istekleri (ham veri)
- Program in-app görünür olsun ✅ v1
- Otomatik hatırlatma ✅ v1
- Diyetisyen modülü ❌ reddedildi (AI ile çözülecek)
- Üye takvimine göre otomatik planlama ❌ v2'ye

### Tasarım dili (kardeşin kelimeleri)
Üye copy/UX için: **"sürdürülebilirlik"**, **"düzen"**, **"süreklilik"** — bunlar üye dilinde de geçmeli.

---

## 7. Pozisyonlama (rakipler arasında)

```
                      PT-COACHING GÜÇLÜ
                              ▲
                              │
         Trainerize           │           [ALPFIT v1 hedef]
         MyPTHub              │           - TR localized
         TrueCoach            │           - sürdürülebilirlik motoru
         (US, İngilizce)      │           - PT-üye flow
                              │           - AI nutrition (v1.5)
   GYM OPS ZAYIF ─────────────┼─────────────► GYM OPS GÜÇLÜ
                              │
                              │           Flyby
                              │           (TR, gym ops focus
                              │            PT-coaching yok
                              │            UX zayıf, yavaş)
                              │
                      PT-COACHING ZAYIF
```

**Alpfit pozisyonu**: TR pazarında "PT-coaching + sürdürülebilirlik + AI nutrition" üçlüsünün ilk birleştiricisi.

---

## 8. Açık sorular (`/devflow:prd` derinleştirecek)

Bu hazırlıkta cevaplanmamış, PRD oturumunda netleşecek:

1. **Stack**: Mobile (iOS+Android) için Expo/React Native mi, native Swift+Kotlin mi, Flutter mı? Backend Node + Postgres (web-fullstack template baz). Karar `/devflow:kickoff`'ta verilecek.
2. **"Sürdürülebilirlik motoru" mekaniği**: Streak nasıl tanımlanır (gün, hafta, eksik gün toleransı)? Comeback notification ne kadar geç tetiklenir? Reminder sıklığı?
3. **Üye kaç ders/hafta**: Default değer ne, ayarlanabilir mi?
4. **Program yazma süresi**: PT bir üye için kaç dakikada program yazıyor şu an? Builder bu süreyi yarıya indirmeli mi?
5. **Egzersiz veritabanı**: Önceden yüklenmiş egzersiz kütüphanesi mi yoksa PT kendi yazar mı?
6. **Üye onboarding**: Ölçümler (kilo, boy, vücut) hangi sıklıkla güncellenir?
7. **Bildirim kanalı**: Push notification mı, SMS mi, WhatsApp Business API mı?
8. **Auth**: Telefon mu email mi? Üye davet akışı (PT üyeyi nasıl ekler)?
9. **Yasal/legal**: KVKK, sağlık verisi (kilo/boy/sakatlık), saklama süresi
10. **Para modeli**: PT ücretsiz/freemium/abonelik? Gym Owner v1.5'te paid tier mi?

Bu soruları `/devflow:prd` ve `/devflow:prd-refine` oturumlarında derinleştir.

---

## 9. Hatırlatma: Yarım kalma deseni

Kullanıcı (kivanc) önceki projelerin yarım kaldığı bir desenin farkında. Bu **planlama disiplininin sebebi**.

Alpfit'in scope'unu büyütme dürtüsü gelirse:
- "Bu özellik v1 mi v1.5 mi v2 mi?" diye sor
- "Şimdi koyarsak 90 günde biter mi?" diye sor
- Yeni fikir ortaya çıkarsa `/devflow:prd-note` ile **kaydet, eklemiş gibi** yap — versiyon sonunda ele alınır

---

## 10. Kaynaklar (memory pointer'ları — host'ta)

Eğer container host /home/kivanc/.claude'u mount ediyorsa:
- `project_alpfit.md` — proje kimliği
- `alpfit_v1_scope.md` — scope tablosu detaylı
- `alpfit_brother_research.md` — kardeşin 10 soruya tam cevapları
- `feedback_focus_discipline.md` — yarım kalma deseni hatırlatması
- `feedback_communication.md` — varsayım yok, onay iste

Mount edilmiyorsa bu dosya (CONTEXT-BRIEF.md) tek kaynaktır.

---

## Sonraki adım

```
/devflow:prd
```

Komuta girince Claude bu dosyayı baz alıp eksik perspektifleri Q&A ile derinleştirecek. PRD `_dev/PRD/` klasörü olarak şekillenecek.
