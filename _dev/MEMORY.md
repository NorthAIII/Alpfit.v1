# MEMORY — Proje Hafızası (Index)

> Bu dosya proje hafızasının **index'idir** — her oturum başında okunur. Birikmiş
> öğrenimler tek tek `_dev/memory/<slug>.md` dosyalarında tutulur; buradaki her
> satır o dosyalara bir **pointer**dır (başlık + tek satırlık kanca). Bir öğrenimin
> detayı gerekince o an `memory/<slug>.md` okunur (lazy-load).
>
> Bu yapı şişmeyi önler: index ince kalır (hep yüklü), detay yalnızca gerekince okunur.

**Son Güncelleme:** 2026-05-29 — TASK-1.06: TR locale util + ESLint kuralı disiplini eklendi (`tr-locale-util-zorunlu.md`).

<!-- KURAL: Bu satır her güncellemede ÜZERİNE YAZILIR. "Önceki:" prefix ile kümülatif yığma YASAK (CLAUDE.md → Doküman Disiplini). -->

---

## Teknik Tuzaklar & Workaround'lar

<!-- Proje genelinde geçerli beklenmedik davranışlar/bug'lar ve çözümleri (pasif gözlem: "şu böyle davranır, dikkat"). Tekrar eden, eyleme/kontrole bağlı bir "şu adımda şu kontrolü yap" kuralıysa → Süreç Disiplinleri. -->

- [Henüz yok]

## Kullanıcı Tercihleri

<!-- Kullanıcının proje genelinde geçerli tercihleri (test yaklaşımı, kod stili, iletişim vb.) -->

- [Kullanıcı: Kivanç (kurucu)](memory/user-kivanc.md) — Teknik bilgi zayıf, varsayım istemiyor, yarım kalma deseni farkında — TR sade dil, somut örnek, onay-bekle akışı.

## Ortam & Araç Notları

<!-- Environment, tooling, CI/CD, kalıcı operasyonel veri (VPS IP, repo path, folder yapısı) -->

- [Referans: CONTEXT-BRIEF.md](memory/reference-context-brief.md) — `/workspaces/Alpfit.v1/CONTEXT-BRIEF.md` Alpfit'in PRD-öncesi tek kaynağı; host memory container'a mount EDİLMİYOR (2026-05-28 doğrulandı).

## Çapraz Öğrenimler

<!-- Faz arası taşınan, tek faza/dokümana ait olmayan dersler -->

- [Proje: Alpfit recall kancası](memory/project-alpfit.md) — "Bu özellik üye sürdürülebilirliğine ne katıyor?" testi her tasarım kararında uygulanır; 3 rol mimari + AI yasal çerçeve hatırlatması.

## Süreç Disiplinleri

<!-- Retrospektiften çıkan, proje genelinde geçerli "şunu yaparken şu kontrolü her zaman yap" tipi iş-akışı kuralları. Uygulama anı: planlamada (task bölme) ve task icrası/closure'ında göz önünde tutulur — kanca'yı buna göre yaz ki ilgili anda hatırlansın.
     Sınır: tek seferlik task nüansı DEĞİL (o → faz retrosu); kalite ekseni DEĞİL (o → QUALITY); tekrar eden bir süreç kuralıdır. Teknik Tuzaktan farkı: tuzak pasif bir gözlemdir ("şu böyle davranır, dikkat"); disiplin aktif, adıma-bağlı bir kuraldır ("şu adımda şu kontrolü yap") — bir kayıt eylem/kontrol içeriyorsa disiplindir. Yalnızca BU projeye özgü olanlar buraya yazılır — DevFlow yönteminin geneline dair olanlar faz retrosuna "DevFlow'a Öneri" olarak yazılıp kullanıcıya bildirilir (review-phase triyajı). -->

- [Feedback: Odak / Disiplin](memory/feedback-focus-discipline.md) — Yeni özellik fikrinde "v1 mi v1.5 mi v2 mi?" filtresinden geçir, yarım kalma desenine karşı scope büyütmeye uyarı ver, eklenmemesi gerekeni `/devflow:prd-note` ile sakla.
- [Feedback: Varsayım Yok](memory/feedback-no-assumptions.md) — Mimari karar / paket / dosya / dış servis değişikliğini onaysız yapma; seçenekleri TR sade dille AskUserQuestion ile sun, "yapıyorum" yerine "yapayım mı?" sor.
- [TR locale util zorunlu](memory/tr-locale-util-zorunlu.md) — TR string'lere case dönüşümünde `@alpfit/shared` → `trLower` / `trUpper` kullan; ham `.toLowerCase()` / `.toUpperCase()` ESLint `no-restricted-syntax` ile yasak (TR "İ" → "i̇" tuzağı).

---

## Memory Sistemi — Nasıl Çalışır?

- **Index satırı:** `- [Başlık](memory/<slug>.md) — tek satırlık kanca`. Slug kebab-case ve açıklayıcı olsun (örn. `mawk-unicode-tuzagi`).
- **Kendi kendine yeten kanca.** Her zaman geçerli olması gereken kritik bilgide (örn. "paket yöneticisi pnpm, npm değil") kancayı **tam** yaz — böylece dosya açılmadan da bilgi her oturum görünür. Yalnızca duruma-özgü veya uzun detayda kanca "buraya bak" olur, gövde dosyada durur.
- **Memory dosyası** (`_dev/memory/<slug>.md`): düz markdown — `# Başlık` + gövde. Frontmatter yok. İlgili başka bir memory'ye `[Başlık](diğer-slug.md)` ile link verilebilir. Klasör ilk öğrenim yazıldığında oluşur.
- **Yeni öğrenim eklerken:**
  1. `_dev/memory/<slug>.md` oluştur — ya da aynı konu varsa **mevcudu güncelle** (dedup, yeni dosya açma).
  2. `_dev/MEMORY.md` index'inde ilgili kategori altına pointer satırını ekle/güncelle.
  3. Bayatlayan öğrenimi hem dosyadan hem index'ten **sil** (soft-delete yok — git history zaten tutar).
  4. Bir memory dosyası kendisi şişerse CLAUDE.md → Boyut ve Bölünme'ye göre alt-dosyaya böl.

---

## Bu Sisteme Ne Yazılır, Ne Yazılmaz?

Memory sistemi (MEMORY.md index + `memory/` dosyaları) **kalıcı/operasyonel veri ve çapraz öğrenimler** içindir. Drift'in en büyük kaynağı yanlış-ev sorunudur: task icra detayları, oturum logları veya aktif durum bilgisi buraya yazılırsa sistem şişer ve gerçek değeri (proje genelinde geçerli bilgi) kaybolur.

### TUTULAN içerik
- Başka dokümana uymayan ama kaybedilmemesi gereken kalıcı bilgiler
- Geliştirme sırasında keşfedilen, **proje genelinde geçerli** tuzaklar ve workaround'lar
- Kullanıcının proje genelindeki **operasyonel/teknik** tercihleri (kod stili, iletişim, araç/test-aracı tercihleri vb.) — **yön/öncelik düzeyindeki ilkeler buraya değil → `ILKELER.md`** (kalıcılık önceliği, sır/konfig politikası, test felsefesi, proje ufku)
- Ortam ve araçlarla ilgili pratik notlar (CI özellikleri, deployment kuralları)
- Fazlar arası geçerliliği olan çapraz öğrenimler
- Retrospektiften çıkan, **bu projeye özgü** süreç disiplinleri (tekrar eden iş-akışı kontrolleri; planlama/icra sırasında uygulanır) → "Süreç Disiplinleri" kategorisi
- Sabit konfigürasyon değerleri ve kalıcı operasyonel veri (VPS IP, hesap email, repo path, folder yapısı)
- Mimari karar **özetleri** — detay `docs/DECISIONS.md`'de
- Secret kategori isimleri (örn. "STRIPE_SECRET_KEY .env'de tutulur") — **değer ASLA yazılmaz**

### YASAK içerik (bunlar başka dokümanlara aittir — memory yanlış evdir)
- **Task icrası sırasında öğrenilen teknik nüanslar** (mawk vs gawk gibi araç davranışı, framework bug'ı, vb.) → `phases/PHASE-N.md` retrospektifinin "Task-Spesifik Teknik Öğrenimler" alt bölümü
- **Oturum logları, "şu oturumda şu yapıldı" tarzı kayıt** → git log + ilgili PHASE/TASK dokümanları
- **Aktif faz/task durumu, ilerleme, son task özetleri** → `DURUM.md` (DURUM'a "Son Tamamlanan Faz" gibi ek özet bölümü EKLENMEZ — detay: CLAUDE.md → Bilginin Doğru Evi)
- **Mimari ve tasarım kararları** (detay) → `docs/DECISIONS.md` (append-only)
- **Proje yapısı ve kimliği** → `OVERVIEW.md`, `INDEX.md`
- **Proje yön-veren ilkeleri ve öncelikleri** (kalıcılık önceliği, sır/konfig politikası, test felsefesi, proje ufku, en yüksek öncelikli eksenler) → `ILKELER.md`
- **Kalite kuralları** → `QUALITY.md`
- **Faz retrospektifi** → `phases/PHASE-N.md`

### Çıkarma Disiplini

CLAUDE.md → Doküman Disiplini bölümü baskındır. Özet:
- Geçersizleşen bilgi tarihi yanında yazılı olsa bile **silinir** — tarih koruma gerekçesi değildir.
- "Önceki:" / "Eski:" prefix ile paragraf merdiveni YASAK; her güncelleme üzerine yazma yapar.
- HTML comment'e sarma (`<!-- removed -->`, `<!-- legacy-... -->`), üstü çizili etiket (`~~...~~`) gibi yumuşak silme yöntemleri YASAK; gerçek silme yapılır (git log zaten her şeyi tutar).
