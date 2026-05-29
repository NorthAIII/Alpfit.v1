# DECISIONS — Karar Günlüğü

**Amaç:** Önemli mimari ve tasarım kararlarının kaydı. "Neden X yerine Y tercih edildi?" sorusunun cevabı burada.
**Ne zaman güncellenir:** Önemli bir teknik, mimari veya tasarım kararı alındığında.

---

## Kararlar

<!-- Her yeni karar aşağıdaki formatta en üste eklenir (en yeni en üstte) -->

### 2026-05-29 — Modül Yapısı: 7 Modüllü Kesim

**Bağlam:** Alpfit v1 PRD'sinde 8 feature var (F01–F08). Bunları nasıl modüllere böleceğimiz mimari karar — featurey'lar kendi modülünde mi, gruplanmış mı?

**Seçenekler:**
1. **Her feature kendi modülünde (8 modül)** — Avantaj: bire-bir izlenebilirlik. Dezavantaj: Builder + Viewer ayrı modülde olunca veri senkronizasyon yükü; Ölçüm + Yemek için KVKK çerçevesi iki yerde tekrar eder; M0 altyapı belirsiz kalır.
2. **7 modüllü kesim: M0 cross-cutting + 5 feature-modül + 2 birleşik (M2 = F02+F05, M6 = F07+F08)** — Avantaj: KVKK çerçevesi M6'da tek noktada; PT/üye program tek data modeli; M0 altyapı erken aşamaya zorlanır. Dezavantaj: Modül-feature haritası 1:1 değil — okuyucu için ek translation.
3. **5 modül (M0 ayrı tutulmaz, altyapı M1'in içine girer)** — Avantaj: Daha az soyutlama. Dezavantaj: Altyapı + Auth iç içe → sonradan migration ağrısı; [[ilkeler]] §"Kümülatif test altyapısı" + §"Kalıcılık önceliği" altyapıyı erken faza zorluyor.

**Karar:** Seçenek 2 — 7 modüllü kesim.

**Gerekçe:** [[ilkeler]] §"Kalıcılık önceliği" + §"Kümülatif test altyapısı" altyapıyı önden ayırmayı zorunlu kılıyor; Builder + Viewer birleşik tutmak senkronizasyon yükünü ortadan kaldırıyor; Ölçüm + Yemek aynı KVKK + gizlilik toggle paterni paylaşıyor, ayrı modülde tekrar eder. M2 ve M6 birleşik tutmanın ek çevirme maliyeti, ayrı tutmanın senkronizasyon + duplicate kod maliyetinden az.

**İlgili Task/Faz:** Tüm fazlar — bu modüler kesim faz numaralandırmasının da temeli.

---

### 2026-05-29 — Faz Sırası: M0+M1 → M2 → M3+M4 → M5+M6 → UAT

**Bağlam:** 7 modülün hangi sırayla hangi fazlara dağıtılacağı kritik karar. Sürdürülebilirlik motoru ([[ilkeler]] §Eksen #1) ürünün kalbi ama önce program akışı (girdisi) hazır olmadan motor doğrulanamaz.

**Seçenekler:**
1. **Lineer feature sırası (F01 → F02 → ... → F08)** — Avantaj: PRD sırasına uyar. Dezavantaj: F01 motorunun bağımlılıkları (program + tamamlama sinyali) önce kurulmadan motoru test edemezsin.
2. **Motor-merkezli sıra: Altyapı → Auth → Program → Motor+Bildirim → Dashboard+Sağlık → Launch (5 faz)** — Avantaj: Her fazın girdisi önceki fazda hazır; Motor (kalp) ile Bildirim aynı fazda çünkü motorun doğruluk testi push olmadan yarım kalır; Dashboard + Sağlık aynı fazda çünkü dashboard tüm modüllerin agregatörü. Dezavantaj: 90 gün taahhüdü için 5 faz sıkı — pilot launch fazı kapsamlı.
3. **Dashboard erken (Sprint 2'de PT'ye early access)** — Avantaj: PT erken geri bildirim. Dezavantaj: Boş dashboard anlamsız; underlying veri yok.

**Karar:** Seçenek 2 — 5 fazlı motor-merkezli sıra.

**Gerekçe:** Motor (M3) PRD'nin kalbi ama girdisi (M2 program + tamamlama) olmadan testlenemez. Bildirim (M4) ile motor aynı fazda çünkü motorun "comeback tetiklendi → push gönderildi → üye geri döndü" testi push olmadan yarım kalır — [[ilkeler]] §Eksen #1 doğrulanamaz. Dashboard (M5) tüm modüllerin agregatörü, son içerik fazı (Yakın 4) doğru yer. Yakın 5 UAT + pilot launch — kardeş gerçek SMS ile pilot kullanır, app store yayını burada olur.

**İlgili Task/Faz:** Faz numaralandırma kuralı PHASES.md'de — bu sıralama "Sıradaki Fazlar" listesinde numarasız tutulur, faza girince numara alır.

---

### 2026-05-29 — Projeye Özgü Doküman Seti: TECH-STACK + KVKK

**Bağlam:** DevFlow standart dokümanlarına ek olarak projeye özgü hangi sabit dokümanları açacağız? Erken açmak boş şablon yaratır, geç açmak bilgi dağılır.

**Seçenekler:**
1. **TECH-STACK + KVKK + STYLE-GUIDE üçü birden** — Avantaj: tek seferde açılır. Dezavantaj: STYLE-GUIDE için tasarım dili henüz somutlaşmadı (kardeş "modern/akıcı/profesyonel" demiş, yön yok) — boş şablon değer üretmez.
2. **Sadece TECH-STACK + KVKK** — Avantaj: ikisi de net ihtiyaç (TECH-STACK Yakın 1 öncesi research-phase doldurulacak; KVKK Yakın 4 öncesi hukuki review'lı doldurulacak). STYLE-GUIDE Yakın 2 başlangıcında tasarım oturumuyla netleşince doğar.
3. **Hiçbiri açılmaz, ihtiyaç anında oluşur** — Avantaj: temizlik. Dezavantaj: "blocker olduğu görünür konum yok" — KVKK Yakın 4'ün engelleyici ön-koşulu, bir yerde duruşunun engel olarak görünmesi gerekir.

**Karar:** Seçenek 2 — TECH-STACK.md + KVKK.md boş şablon olarak kickoff-docs'ta açılır.

**Gerekçe:** İkisi de **engelleyici ön-koşul olarak DURUM.md'de izlenecek**; boş şablon kapsamın görünür kalmasını sağlar. STYLE-GUIDE Yakın 2 başlangıcında tasarım oturumuyla netleşince doğar — şimdi açmak değer üretmez.

**İlgili Task/Faz:** TECH-STACK Yakın 1 öncesi research-phase'de; KVKK Yakın 4 öncesi prd-refine + hukuki review.

---
