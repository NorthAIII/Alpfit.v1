# DevFlow — Audit Section 2: Uygunluk & Migration (audit-conform)

> **Bu dosya doğrudan çağrılmaz.** `audit-docs`'un Section 2'sidir. `audit-docs`, `next` çıktısındaki gerekçe `conformance:*` veya `rotation:*` olduğunda bu dosyayı **Read ile okur** ve aşağıdaki akışı izler. Token tasarrufu için ayrı dosyadır — derin denetim talimatı yalnızca gerçekten gerektiğinde bağlama girer.

Bu, tek dokümana yönelik **derin per-doküman** denetimidir: dokümanın GÜNCEL template'e/konvansiyona yapısal uygunluğu + yargı gerektiren drift'in temizlenmesi. **Drift ile migration aynı kontroldür** — "bu doküman bugünkü yapıya uyuyor mu?"; rapor nedeni ayırır (bayatlama mı, konvansiyon evrimi mi). Her zaman **rapor → onay → düzelt**; auto-fix yok.

## Buraya ne zaman gelinir

- `conformance:never` — doküman hiç denetlenmemiş (yeni eklendi)
- `conformance:version-outdated` — konvansiyon versiyonu artmış, doküman eski versiyonda denetlenmiş (migration)
- `conformance:changed` — son denetimden bu yana doküman içeriği değişmiş
- `rotation:oldest` (`--rotate`) — uygun ama en uzun süredir denetlenmemiş; proaktif rotasyon

---

## Akış (tek doküman)

### Adım 0 — Mekanik kontroller (S1 listesi)

`audit-docs` Section 1'in **"Mekanik kontrol listesi"**ni bu doküman üzerinde de uygula (placeholder, kırık ref, soft-delete, INDEX kapsamı, kümülatif tek-değer, memory pointer bütünlüğü). Ucuz — dokümanı zaten okuyorsun. Bulguları aşağıdaki raporun "Önerdiğim Düzeltmeler" kısmına kat. (Tek kaynak: liste S1'de tanımlı, burada tekrar yazılmaz.)

### Adım 1 — Dokümanı + ilgili template'i oku

Dokümanı rolüne göre `.claude/commands/devflow/templates/` altındaki template'le eşle ve **referans** olarak oku:

- `CLAUDE.md` → `CLAUDE-MD.md` · `OVERVIEW.md` → `OVERVIEW.md` · `DURUM.md` → `DURUM.md` · `INDEX.md` → `INDEX.md`
- `MODULE-MAP.md` → `MODULE-MAP.md` · `PHASES.md` → `PHASES.md` · `QUALITY.md` → `QUALITY.md` · `ILKELER.md` → `ILKELER.md` · `MEMORY.md` → `MEMORY.md`
- `modules/*.md` → `MODULE.md` · `phases/PHASE-N.md` → `PHASE.md`
- `tasks/TASK-*.md` → `TASK.md` · `tasks/TASKS-README.md` → `TASKS-README.md` · `docs/DECISIONS.md` → `DECISIONS.md` · `PRD/features/*.md` → `PRD-FEATURE.md`

1:1 template'i olmayanlar (örn. `memory/<slug>.md` atomları, `PRD/{VERSIONS,SESSION-NOTES,NOTES}.md` üst-düzey PRD dokümanları, `tasks/quick/*.md` ad-hoc kayıtları, projeye-özgü sabit dokümanlar): uygunluk = rolün kuralları + dokümanın kendi `<!-- KURAL -->` yorumları. Yanlış template'le karşılaştırma kuralı: pattern listede yoksa bu maddeye düşer, başka template'i zorla uygulama.

### Adım 2 — Yapı/KURAL conformance

Dokümanı template'le karşılaştır:

- **Template'de olup canlıda olmayan bölüm/KURAL var mı?** → ekle (**merge-preserve**: mevcut içeriği silmeden, doğru yere). Örn. CLAUDE.md'de `## Dil` bölümü yoksa template'ten ekle. Silinmiş `<!-- KURAL -->` yorumunu geri koy (KURAL = tek kaynak, korunur).
- **Canlıda olup template'de olmayan bölüm var mı?** → drift mi, bilinçli proje-özgü ekleme mi belirsiz → **soru olarak raporla**, varsayımla silme.
- **Yapısal kuralın kaynağı dokümanın kendi KURAL yorumudur** — audit literal'i yeniden yazmaz; KURAL'ı ground-truth alır, ona karşı kontrol eder.

### Adım 3 — Yargı-drift kategorileri

Dokümanı fresh-read zihniyetiyle oku; rolüne uyan kategorileri tara:

- **a) Bayat-tarih bilgisi** — tarih yazılı bir bilgi hâlâ geçerli mi (tarih, koruma gerekçesi değil)? DURUM'da eski faz/task hâlâ "Aktif" mi? Memory'de sonradan yanlış çıkmış öğrenim var mı?
- **b) Yoğunluk / bölme yargısı** — boyut bayraklıysa eleştirel oku: snapshot/index doküman uzunsa **şişme** (temizle/mezun et); içerik dokümanı gerçekten büyümüşse **modüler bölme** (yapısal → soru: hangi alt-dokümanlar/isimler, parent özet+pointer, harita güncellemesi). Tek satır gerçekten tek mantıksal birim mi, yoksa 3+ düşünce sıkışmış mı?
- **c) Yanlış-ev bilgisi** — Memory'de task-icrasına özgü teknik nüans (araç davranışı, framework bug'ı) → PHASE-N retrospektifine ait. DURUM'a KURAL'ının yasakladığı ek bölüm (örn. "Son Tamamlanan Faz") eklenmiş mi → PHASES/PHASE-N'e ait. PHASES'te faz detayı/retro özeti → PHASE-N'e ait. DECISIONS'da karar olmayan oturum notu → kullanıcıya bildir (DECISIONS'a dokunma; düzeltme `review-phase` işi).
- **d) Mezuniyet tetiklenmemiş** — Faz ✅ Tamamlandı halde DURUM'da eski faz task tablosu/özeti duruyor mu? PHASES → Sıradaki Fazlar'da Faz Durumu tablosuna girmiş (numara almış) konu hâlâ duruyor mu (girişte silinmeliydi)? SESSION-NOTES'ta "X'e aktarıldı / ✓ tamamlandı / şuraya taşındı" breadcrumb'ı kalmış mı (izsiz mezuniyet ihlali — bilgi silinince iz de silinmeli)? Hedef: SESSION-NOTES boş/yakın-boş kanvas. PRD/NOTES'ta prd-review'da işlenmiş ama silinmemiş not?
- **e) Memory dedup / atomizasyon migrasyonu** — MEMORY.md hâlâ **monolitik** mi (öğrenim doğrudan index'te, `memory/<slug>.md`'ye atomize edilmemiş)? → eski sürümden kalma, **migrasyon** (yapısal → soru). Aynı öğrenim birden çok memory dosyasında tekrar ediyor mu → dedup, tek dosyada topla. (Pointer kırık/yetim = Adım 0 mekanik.)
- **f) Statik doküman gerçeklik mutabakatı** — OVERVIEW ve projeye-özgü sabitler **bugünü** anlatır, her oturum dokunulmadığı için sessizce gerçeklikten kopar: stack/pratik değişti mi (gerçeklik = kod + bağlamdaki çekirdek dokümanlar; **çapraz çelişki** örn. OVERVIEW "SQLite" derken kod PostgreSQL)? OVERVIEW'da **dinamik bilgi kaçağı** (aktif faz/task, ilerleme, durum) var mı → DURUM'a ait, temizle. Bulguyu raporla, **açık onayla** reconcile et.

### Adım 4 — Migration (eski → yeni eşle)

Konvansiyon evrildiyse (`version-outdated`): eski yapıyı yeniye **eşle ve taşı**. Eşi/evi olmayan içeriği **RAPORLA, sessizce atma** — git geçmişi backstop'tur ama kasıtlı kayıp olmamalı. Yeni dosya/bölme yaratan migration sonrası `reconcile` ile çocukları kuyruğa al.

### Adım 5 — Tarihsel doküman ise

Doküman tarihsel/sistem dokümanıysa (`tasks/archive/*`, PHASES'te ✅ işaretli `PHASE-N.md`, `docs/DECISIONS.md`, `tasks/TASKS-README.md`):

- Yalnızca **içerik-koruyan reformat** yapılır (yeni yapıya hizalama); anlam, kayıt ve sıra korunur. Raporda **"tarihsel reformat"** olarak işaretle.
- **DECISIONS.md**: kayıt sırası korunur (append-only mantığı); yeni karar ekleme/`Superseded` işaretleme audit'in işi değildir (`review-phase`/`prd-review`).
- **TASKS-README.md**: çekirdek protokol kopyasıdır; yeni protokole hizalayan **protokol-migration meşrudur** (içerik-koruyan).
- Bunların dışında düzenleme yok — yanlış bilgi görürsen yalnızca raporla.

### Adım 6 — Raporla → onay → düzelt → kapat

Kompakt per-doküman rapor (değişiklik yapmadan):

```
📄 _dev/CLAUDE.md  (conformance:version-outdated → migration)

🔧 Önerdiğim Düzeltmeler (onayınla):
- Template'e eklenen "## Dil" bölümü canlıda yok → ekle (merge-preserve)
- 1 kırık referans (_dev/old.md) → kaldır

❓ Karar Gerektiren Soru:
- "## Eski Bölüm" template'de yok; bilinçli proje-özgü mü, drift mi?

📁 Tarihsel Not (varsa): —
```

Onay sonrası **yalnızca onaylananı** uygula; yapısal işlerde (bölme, atomizasyon, migration) referans bütünlüğünü koru (INDEX / MODULE-MAP / parent özet+pointer). Sonra:

```bash
python3 .claude/commands/devflow/scripts/audit-canvas.py touch <path>   # "tam denetlendi": conformant, v=current, hash güncel
python3 .claude/commands/devflow/scripts/audit-canvas.py reconcile      # migration/bölme yeni dosya yarattıysa
```

`touch` **yalnızca burada** atılır (tam uygunluk denetimi tamamlandığında). Commit at (`docs: audit-docs — …`) ve `audit-docs` Adım 4'e dön — **çalıştırma başına bir doküman**, sonra dur (`/loop`/`--limit` devam ettirir).

---

## Önemli

- **Rapor → onay → düzelt; auto-fix yok; varsayma → sor.** Kafanın karıştığı her şey "Karar Gerektiren Soru" olur.
- **Yapısal işler yalnızca açık onayla** (modüler bölme, MEMORY atomizasyonu, migration); uygularken referans bütünlüğünü koru.
- **Tarihsel dokümanlar:** içerik-koruyan reformat dışında dokunma.
- **`touch` yalnızca S2'de** — S1 (acil) `touch` atmaz; doküman tam denetlenince conformant işaretlenir.
- **Çapraz çelişki** için Oturum Başlangıç Protokolü'nde okunan çekirdek dokümanları (OVERVIEW/DURUM/MEMORY/INDEX) referans al.
