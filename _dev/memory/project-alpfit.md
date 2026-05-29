# Proje: Alpfit v1 — Sürdürülebilirlik Motoru Pozisyonu (Recall Kancası)

> Bu memory bir kanca/uygulama notudur. Proje kimliği için tam kaynak: `_dev/OVERVIEW.md` + `_dev/PRD/00-VISION.md` + `_dev/ILKELER.md`.

Alpfit, üye **sürdürülebilirlik motoru** olarak konumlanan PT-üye koachluk uygulaması (TR pazarı, Mayıs 2026 başlangıç).

**Her tasarım kararının testi:** *"Bu özellik üye sürdürülebilirliğine ne katıyor?"*

**Why:** TR pazarında üç şeyi birleştiren rakip yok: (a) PT-coaching, (b) sürdürülebilirlik motoru (streak / reminder / comeback), (c) AI nutrition (v1.5+). Flyby gym ops odaklı, Trainerize / MyPTHub US / İngilizce. Boşluk doğrulandı.

**How to apply:**
- v1 scope = Trainer + Member rolleri, AI nutrition YOK, Gym Owner YOK, görsel rozet YOK, akıllı takvim YOK. v1.5 ve v2 yol haritası `_dev/PRD/VERSIONS.md`'de.
- Mimari kural: veri modeli ve auth **3 rolü** (Member + Trainer + Gym Owner) ilk günden destekler. v1 ekranlarında 2 rol görünür ama sonradan "ekle" işi olur, "baştan yap" değil.
- AI nutrition yasal: "öneri / yemek günlüğü / kalori hedefi" dili + disclaimer + **PT onayı zorunlu**. Sorumluluk PT'de. v1'de AI yok ama mimari + dil hazırlanır.
- İlk testçi: kardeş + 3-4 öğrencisi, ~90 günde v1.
- v1 başarı kriteri: "Comeback bildirimleri en az 1 üyeyi geri çekmiş olmalı" + "Kardeş 'WhatsApp + Word daha kolay' dememeli."
