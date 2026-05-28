# DevFlow — Doküman Denetimi (Audit Docs)

Bu komut proje-genişlikli doküman drift'ini **artımlı (rolling)** olarak tarar ve düzeltir. Faz döngüsü boyunca yaşayan dokümanlarda kümülatif biriken sorunları (şişme, sıkıştırma, soft-delete kalıntısı, yanlış-ev bilgisi, tetiklenmemiş mezuniyet, statik bayatlama) ve DevFlow konvansiyonu evrildiğinde dokümanların eski yapıda kalmasını (migration) yakalar. **Drift ile migration tek ve aynı kontroldür** — "bu doküman GÜNCEL template'e/konvansiyona uyuyor mu?"; sadece tetikleyici farklıdır.

Tamamen manuel — kullanıcı tetikler; değişiklikleri de ancak **rapor + onaydan** sonra yapar. Tek seferde tüm projeyi taramaz: bir **canvas** (kontrol kuyruğu) sıradaki dokümanı seçer, sen onu işlersin, varsayılan **çalıştırma başına bir doküman**.

**Kullanım:** `/devflow:audit-docs` — varsayılan bir doküman işler, sonra durur. Sürekli işlemek için `/loop` ile çağır; tek turda birden çok için canvas'a `--limit N` ver.

**Not:** Faz döngüsüne otomatik bağlı değildir. Faz sonu, versiyon sonu, kickoff sonrası, konvansiyon değişimi sonrası veya doküman karmaşası hissedildiği herhangi bir anda çağrılabilir.

---

## Ne Zaman Kullanılır

- Faz veya versiyon sonu yeni oturumda (fresh perspective avantajı)
- DevFlow konvansiyonu değiştikten sonra mevcut projeyi yeni yapıya taşımak için (canvas `bump-version` ile herkesi due yapar)
- Birkaç oturum sonrası "DURUM.md uzamış görünüyor" hissi geldiğinde
- Yeni bir Claude oturumu açıldığında ve dokümanların tutarlılığından emin olunmadığında
- Bir başka komutun (`double-check`, `review-phase`) drift sinyali verdiğinde
- Sürekli arka plan denetimi için `/loop` ile (kuyruk boşalınca kendiliğinden temiz raporla durur)

---

## Nasıl Çalışır — Rolling Audit (canvas + script)

İş bölümü nettir:

- **Script = beyin (READ-ONLY).** `audit-canvas.py` hangi dokümanın sırada olduğunu **seçer** ve mekanik kırmızı-çizgileri (şu an: boyut) **tespit eder**. Dokümanları asla değiştirmez; sadece `_dev/.audit/` altındaki canvas'ı yönetir. Sen 1000+ doküman olsa bile script'in **tek satırlık** çıktısını alırsın; tüm listeyi okumazsın.
- **Claude = yargı + düzeltme (onaylı).** Seçilen dokümanı sen okur, teşhis eder, **raporlar, onay alır, düzeltirsin.** Auto-fix yoktur.

Canvas yalnızca bir **cursor**'dır ("hangi doküman ne zaman / hangi konvansiyon versiyonuna göre kontrol edildi"). Asıl kaynak `_dev/`'in kendisidir; canvas silinse aynasından (`canvas.tsv`) yeniden üretilir. Detay: script başlığı.

İki **iş-modu** vardır ve dağıtım (dispatch) `next` çıktısındaki gerekçeye göre yapılır:

- **Section 1 — Acil İşleme** (bu dosyada): mekanik kırmızı-çizgiler. Hızlı, template gerektirmez.
- **Section 2 — Uygunluk/Migration** (`lib/audit-conform.md`, ayrı dosya): derin per-doküman yapı + yargı denetimi. Token tasarrufu için **yalnızca uygunluk dokümanı dağıtıldığında** Read ile yüklenir.

---

## Oturum Başlangıç Protokolü (önce)

CLAUDE.md'deki Oturum Başlangıç Protokolü'nü uygula (OVERVIEW, INDEX, DURUM, MEMORY). Bu çekirdek dokümanlar bağlamda olduğu için, herhangi bir dokümanı denetlerken **çapraz çelişki** (örn. modülde yazan stack ile OVERVIEW'ın çeliştiği) kontrolüne de zemin sağlar.

---

## Akış

### Adım 1 — Canvas'ı gerçekle uzlaştır + mekanik tara

```bash
python3 .claude/commands/devflow/scripts/audit-canvas.py reconcile
python3 .claude/commands/devflow/scripts/audit-canvas.py scan
```

- `reconcile` — kök CLAUDE.md + `_dev/**/*.md`'yi tarar; yeni dokümanı kuyruğa ekler, silineni çıkarır, aynayı (`canvas.tsv`) üretir.
- `scan` — mekanik acil tespit (şu an yalnızca boyut kırmızı-çizgisi → `status=urgent`). Eşik altına düşen eski urgent'leri temizler.

### Adım 2 — Sıradaki dokümanı al

```bash
python3 .claude/commands/devflow/scripts/audit-canvas.py next
# birden çok için:   ... next --limit 5
# uygun olanları da en-eskiden rotasyona katmak için:   ... next --rotate
```

Çıktı her satırda `<path>\t<reason>`. Öncelik: `urgent` → `conformance` (`never` | `version-outdated` | `changed`) → (`--rotate` ile) `rotation:oldest`. Kuyrukta hazır doküman yoksa `#` ile başlayan tek satır döner.

### Adım 3 — Dağıtım (dispatch)

`next` çıktısındaki **gerekçeye** göre:

| Gerekçe | Nereye |
|---|---|
| `urgent:*` | **Section 1 — Acil İşleme** (bu dosyada, aşağıda) |
| `conformance:*` / `rotation:*` | **`.claude/commands/devflow/lib/audit-conform.md`'yi Read ile oku**, Section 2 akışını izle |
| çıktı boş veya `#` ile başlıyor | Kuyrukta hazır doküman yok → **temiz, dur** (commit yok) |

### Adım 4 — Düzeltme sonrası

Bir doküman işlenip düzeltme yapıldıysa commit at (mesaj formatı: Önemli Kurallar). **Varsayılan: çalıştırma başına bir doküman, sonra dur.** Sürekli ilerleme `/loop` veya `--limit` iledir — her doküman kendi izole commit'inde kalır.

---

## Section 1 — Acil İşleme (urgent dokümanlar)

Buraya `next` gerekçesi `urgent:*` olduğunda gelinir. Acil dokümanlar **kırmızı çizgi** ihlalleridir (örn. ~20k token'ı aşan, tek-okumayı bozan doküman) — önceliklidir, hemen çözülür. Section 2 (derin uygunluk) bu turda **yapılmaz**; doküman düzeltildikten sonra kuyrukta uygunluk-borçlu kalır ve **sonraki tur(lar)da** S2'ye akar (bkz. Adım sonu).

### Mekanik kontrol listesi

> Bu liste S1'in çekirdeğidir ve **Section 2 de buna referans verir** (uygunluk dokümanını okurken bu ucuz kontrolleri de uygula). Tek yerde tanımlı — tekrar yazma.

Dağıtılan dokümanı oku ve şu mekanik (doğru-cevabı-belli) sorunları tara:

- **Boyut kırmızı-çizgisi** — script'in bu dokümanı urgent yapma nedeni. Snapshot/kanvas/index doküman (DURUM, SESSION-NOTES, INDEX, MEMORY index'i, OVERVIEW) şişmişse **temizle/mezun et**; içerik dokümanı (modül, PRD feature, QUALITY, docs) gerçekten büyümüşse **modüler bölme** gerekir — bu **yapısaldır**, soru olarak raporlanır. Daha ince metrik için tek doküman üzerinde `bash .claude/commands/devflow/scripts/doc-scan.sh <dosya>` çalıştırabilirsin.
- **Placeholder sızıntısı** — production dokümanda kalmış `[PROJE_ADI]`, `[Tarih]`, `[Henüz yok]` gibi template kalıntısı.
- **Kırık dosya referansı** — var olmayan bir dosyaya link (`_dev/foo.md`'ye link ama dosya yok).
- **Soft-delete kalıntısı** — HTML comment'e sarılı eski içerik (`<!-- removed -->`), "Önceki:"/"Eski:" prefix'li paragraf merdiveni, üstü çizili (`~~...~~`) yumuşak silme.
- **INDEX kapsamı** — içerik dokümanları enumere edilmiş mi; task/faz yalnızca klasör konumu olarak mı geçiyor (tamamlanmış faz arşiv listesi sızmamış mı)?
- **Kümülatif tek-değer alanları** — "Son Güncelleme" gibi tek-değerli alan tek satır mı, yoksa oturum izi merdiveni mi birikmiş?
- **Memory pointer bütünlüğü** — işlenen doküman MEMORY index'i veya `memory/*.md` ise: index'te dosyası olmayan **kırık pointer**, dosyası olup index'te olmayan **yetim dosya** var mı? Ayrıca harness native memory konumunu bildirdiyse: native memory index'indeki DevFlow yönlendirmesi `.claude/commands/devflow/templates/NATIVE-MEMORY-REDIRECT.md` ile uyumlu mu? (Bildirmiyorsa atla, raporda not düş.)

> **KURAL kaynağı dokümanın kendisidir.** Yaşayan dokümanlarda template'ten miras `<!-- KURAL: … -->` yorumları **olabilir** — varsa o dokümanın yapısal kuralının tek kaynağıdır (her template'te yoktur; örn. DURUM/PHASES/INDEX yoğun KURAL'lı, OVERVIEW/MODULE/ILKELER ise yapısı template'in kendisinden okunur). Yukarıdaki maddeler **örnektir**, sabit literal değil — varsa dokümanın kendi KURAL'ını ground-truth al, yoksa template'le yapısal karşılaştırma (Section 2 Adım 2) zaten yapılır. KURAL yorumlarını silme.

### Akış

1. **Oku + teşhis et** (yukarıdaki liste; doğru-cevabı-belli olanlar "Önerdiğim Düzeltmeler", yapısal olan bölme "Karar Gerektiren Soru").
2. **Raporla** (değişiklik yapmadan) — tek doküman için kompakt rapor:

   ```
   📄 _dev/modules/AUTH.md  (urgent: ~9200 token)

   🔧 Önerdiğim Düzeltmeler (onayınla):
   - 2 placeholder kalıntısı ([Henüz yok]) temizlenecek

   ❓ Karar Gerektiren Soru:
   - Doküman gerçekten büyümüş. Şu alt-dokümanlara bölelim mi:
     AUTH-FLOWS.md, AUTH-RBAC.md? (parent özet+pointer kalır, MODULE-MAP güncellenir)
   ```
3. **Onay bekle.** Yalnızca onaylananı uygula. Yapısal işlerde (bölme) referans bütünlüğünü koru (INDEX / MODULE-MAP / parent özet+pointer).
4. **Düzeltme sonrası** canvas'ı senkronla ve commit'le — **`touch` ATMA**:

   ```bash
   python3 .claude/commands/devflow/scripts/audit-canvas.py reconcile   # bölmeden doğan çocukları kuyruğa al
   python3 .claude/commands/devflow/scripts/audit-canvas.py scan        # çözülen urgent'i temizle
   ```

   `touch` atılmaz çünkü S1 yalnızca acil/mekanik işi yaptı; doküman (ve yeni çocukları) **uygunluk için kuyrukta kalmalı** → sonraki tur(lar)da S2 derin denetimine akar. (`touch` = "tam denetlendi" anlamına gelir, bunu yalnızca S2 atar.)

Sonra **dur** (çalıştırma başına bir doküman).

---

## Önemli Kurallar

- **Önce raporla, onay al, sonra uygula.** audit tarar ve **önerir**; kullanıcı onaylamadan hiçbir dosyayı değiştirmez. **Neden:** double-check oturum sonunda, o oturumun bağlamıyla çalışır — neyin yeni/yanlış olduğunu bildiği için mekanik düzeltme güvenlidir. audit ise **sıfır oturum-hafızasıyla, baştan** tarar; "drift gibi görünen" bir şey bilinçli bir tercih olabilir. Cold-start + geniş kapsam = "emin olamam, sormalıyım".
- **Proje-genişlikli kapsam, artımlı yürütme** — double-check yalnızca o oturumun değişikliklerini kontrol eder; audit **tüm yaşayan dokümanları** kapsar ama canvas sayesinde **bir oturumda hepsini taramak zorunda değildir** — kuyruk kaldığı yerden devam eder, hiçbir doküman atlanmaz, hiçbiri gereksiz yere iki kez taranmaz.
- **Auto-fix yok** — script seçer ve mekanik tespit eder (READ-ONLY); her düzeltme senin yargın + kullanıcı onayıyla yapılır.
- **Tarihsel/sistem dokümanları** (`tasks/archive/`, PHASES.md'de ✅ işaretli `PHASE-N.md`, `DECISIONS.md`, `TASKS-README.md`): bunlar Section 2'de ele alınır — **içerik-koruyan reformat** dışında düzenlenmez (detay: `lib/audit-conform.md`). S1'de yalnızca raporlanır. **Tarihsel doküman `urgent:token-hard` olursa** (örn. dolu retro içerikli `PHASE-N.md`): bölme yasak (CLAUDE-MD → Tarihsel/append-only kuralı); içerik-koruyan reformat eşiğin altına indirmediyse çözüm **`exclude` ile kalıcı kapatma**: `python3 .claude/commands/devflow/scripts/audit-canvas.py exclude <path>`. Aksi halde doküman her audit turunda tekrar S1'e dispatch edilir — kuyrukta çakılı kalır.
- **Lazy template/Section 2 okuma** — Section 2 talimatını (`lib/audit-conform.md`) yalnızca uygunluk dokümanı dağıtıldığında Read et; template'i de baştan toplu değil, şüphe/bayrak tetiklediğinde oku.
- **Mekanik metrikler kesin kural değildir** — boyut bayrağı işaret fişeğidir, mahkûmiyet değil; gerçekten şişmiş mi yoksa gerçek içerik mi diye eleştirel oku.
- **Varsayımda bulunma** — kafanın karıştığı her şey soru olur; şüpheli durumda kullanıcıya sor.
- **Değişiklik yapmadıysan commit atma.** Değişiklik yaptıysan:
  ```
  docs: audit-docs — [kısa özet, hangi doküman / ne temizlendi]
  ```
- **Kod kalitesi audit-docs'un kapsamı dışı** — onun için `verify-phase`, `review-phase` ve `simplify` var.
