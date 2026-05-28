# DevFlow — Oturum Sonu Doküman Kontrolü (Double Check)

Bu komut mevcut oturumda yapılan doküman değişikliklerini eleştirel gözle tekrar inceler. Oturumu kapatmadan önce hata, eksiklik ve tutarsızlıkları yakalamak içindir. Herhangi bir oturum tipinde çalışır.

**Kullanım:** `/devflow:double-check`

---

## Ne Zaman Kullanılır

Her DevFlow oturumunun son adımı olarak — ana komut (ör. `prd-refine`, `verify-phase`) tamamlandıktan ve sıradaki adımı önerdikten **sonra** çağrılır. Oturumdaki doküman değişikliklerini eleştirel gözle son kez inceler.

Genelde `/devflow:pause`, `/devflow:prd-save` veya oturum sonu özetinden **önce** çağrılır.

---

## Okunacak Dosyalar

### Göreve Göre
Bu oturumda düzenlenen veya oluşturulan dokümanları mevcut context üzerinden belirle. Kontrol sırasında bu dosyalarla ilgili çapraz referansları gerektiği kadar oku. **Sabit bir dosya listesi yok** — kapsam oturumun doğasına göre belirlenir.

---

## Yapılacaklar

### 1. Bu Oturumda Değişen Dokümanları Belirle

Mevcut context üzerinden bu oturumda düzenlenen, oluşturulan veya silinen doküman dosyalarını belirle. Bu dosyalar kontrolün merkezi olacak.

Eğer oturumda hiçbir doküman değişikliği tespit edilmezse kullanıcıya bildir: "Bu oturumda kontrol edilecek doküman değişikliği tespit edilemedi." ve komutu sonlandır.

### 2. Eleştirel Gözle İncele

Değişen dokümanları ve ilgili çapraz referansları fresh-read zihniyetiyle tekrar oku. **Sabit bir kontrol listesi yok** — serbest ve eleştirel düşün. Oturumun doğasına göre neye dikkat edeceğin değişir, kapsama sıkışma.

Varsayımda bulunma — şüpheli durumlarda kullanıcıya sor. Kafanın karıştığı her yeri sorguya açman beklenir.

### 3. Düzeltme ve Soru Sorma

`verify-plan` düzeltme kalıbını uygula:

- **Mekanik sorunları doğrudan düzelt** — typo, placeholder kalıntısı, kırık referans, INDEX kayıt eksiği gibi doğru cevabı belli olan düzeltmeler için kullanıcıya sorma gerekmez
- **Yapısal veya anlam etkileyen sorunları kullanıcıya sor** — "şurada şu tutarsızlığı gördüm, nasıl ilerleyelim?"
- **Kafanın karıştığı yerleri mutlaka sor** — varsayımla düzeltme yapma, emin değilsen sor

### 4. Rapor Sun

Kullanıcıya iki kategoride rapor ver:

```
🔧 Doğrudan Düzeltilenler:
- [dosya]: [kısa açıklama]

❓ Sorularım / Dikkatine Sunarım:
- [dosya]: [sorun ve öneri]
```

Sorun bulunmadıysa:
```
✅ Double-check tamamlandı. Dokümanlarda hata/tutarsızlık tespit edilmedi.
```

### 5. Git Commit & Push

**Değişiklik yapıldıysa** commit & push yap:
```
docs: double-check — [kısa özet]
```

**Değişiklik yapılmadıysa** commit atma.

### 6. Sıradaki Adımı Yinele

Double-check'ten önce çalışan ana komutun verdiği "Sıradaki adım" önerisini aynen tekrar et:

```
📋 Sıradaki adım: /devflow:[önceki komutun önerdiği komut]
   → [önceki komutun verdiği gerekçe]
```

Eğer önceki komut bir sıradaki adım önermediyse bu çıktıyı atla — kendi öneriyi uydurma.

---

## Önemli Kurallar

- **Sadece bu oturumda yapılan değişikliklere odaklan** — tüm projeyi baştan taramaya çalışma
- **Sabit kontrol listesi yok** — eleştirel ve serbest düşün, kapsama sıkışma
- **Sadece dokümantasyon** — kod kalitesi bu komutun kapsamı dışında (onun için `verify-phase`, `review-phase` ve `simplify` var)
- **Varsayımda bulunma** — şüpheli durumlarda kullanıcıya sor
- **Değişiklik yapmadıysan commit atma**
- **Bu komut ana komutun akışına müdahale etmez** — oturumun son doğrulama adımıdır
- **Sıradaki adımı kendin uydurma** — önceki komutun önerisini birebir yinele, önceki komut öneri vermediyse hiç önerme
