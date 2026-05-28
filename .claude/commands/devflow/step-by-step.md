# DevFlow — Tek Tek Tartış (Step by Step)

Bu komut aktif oturumun ortasında tartışma tarzını değiştirmek için kullanılır. Birden fazla tartışmalı konu varken hepsini tek mesajda yığmak yerine, konular teker teker — kullanıcının karar hızında — ele alınır.

**Kullanım:** `/devflow:step-by-step` — herhangi bir aktif oturumun içinde çağrılabilir (prd-refine, prd-review, discuss-phase, kickoff, vb.).

---

## Amaç

Kullanıcı uzun açıklamalar yazmak yerine, iyi seçenekler arasından karar vermeyi ve bazen kendi düşüncesini ekleyerek yönlendirmeyi tercih ediyor. Amaç bunu mümkün kılmak: Claude elindeki tartışma konularını değerlendirir, teker teker sunar, her konu için bağlamı açar-seçenekler üretir-öneri belirtir, kullanıcı seçer veya düşüncesini ekler, sonra sıradaki konuya geçilir.

Tartışmanın gündemini Claude yönlendirir. Ama kararlar kullanıcınındır.

---

## Pattern

Her konu için şu dört adım — sıkı kural değil, yön gösterici:

**1. Konuyu aç.** Neden önemli, hangi bağlamda karşımıza çıkıyor, hangi senaryolarda belirleyici. Kullanıcının konuya zihnini ayarlaması için gerekli minimum bağlam.

**2. Seçenekler sun.** Konuyu temsil eden gerçek yönler. Sayı önceden belli değil — ikili ise iki, çok yönlü ise dört beş. Her seçenek için tradeoff: ne kazanırız, ne feda ederiz.

**3. Önerini belirt.** "Benim önerim X, çünkü Y." Eğer gerçekten tercihin varsa, söyle. Eğer iki seçenek de eşit ölçüde geçerliyse, bunu dürüstçe söyle: "İkisi de uygulanabilir, ben şuna yatkınım ama güçlü bir tercih sebebim yok." Kullanıcı bir tartıcı bekler — sessiz kalırsan yalnız kalır.

Not: Kullanıcı genel olarak sağlam/uzun ömürlü tercihleri, hızlı/basit olanlara tercih eder. Önerini kurarken varsayılan eğilimini bu yönden başlat — ama mutlak kural gibi uygulama, konu gerçekten basit olanı çağırıyorsa oraya da git.

**4. Kararı bekle.** Kullanıcı seçer, ek bir düşünce ekler veya farklı bir yön önerir. Karar alınmadan sıradaki konuya geçme. Kararı duymadan kendi varsayımınla uygulamayı başlatma.

---

## Pratik dili kullan, teknik jargona saplanma

Kullanıcı çok farklı alanlarda projeler yürütüyor — her konunun teknik sözlüğüne hakim olmayabilir. Ama her konunun pratikte nasıl görüneceğine dair tercih sahibi olabilir.

Bu yüzden: bir seçim sunarken, kullanıcıya o seçimin pratikte ne anlama geldiğini sor. Terimle değil, davranışla.

Örnek:
- ❌ "Bu endpoint için idempotency mi, optimistic locking mi kullanalım?"
- ✅ "Kullanıcı aynı butona iki kez basarsa ne olsun — iki kayıt mı oluşsun (ikincide hata uyarısı), yoksa ikinci tıklama sessizce yok mu sayılsın?"

Teknik terim gerekiyorsa parantez içinde açıkla. Ama soruyu pratik çıktı üzerinden kur. Amaç kullanıcının terminolojiye hakim olmadan da iyi karar verebilmesi.

---

## Tipik sapmalar (bunlardan kaçın)

- Konuyu araştırmadan, sadece notlardaki bilgiyle yetinerek getirmek (gerektiğinde grep/find/web araştırması yap)
- Aynı mesajda birden fazla konu açmak ("Şunu mu yapalım, bir de şunu da konuşalım mı?")
- Kullanıcı karar vermeden sıradaki konuya geçmek
- Kararı duymadan kendi varsayımınla uygulamayı başlatmak
- Her konuya aynı şablonla yaklaşmak (bazıları kısa, bazıları derin — fark edilmeli)
- Pratik karşılığı olan bir soruyu teknik terimle sormak
