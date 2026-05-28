# DevFlow — Sıradaki Adım (Next)

Bu komut DURUM.md'den sıradaki adımı belirler ve ilgili komutu senin yerine çalıştırır. Böylece her oturumda hangi komutta olduğunu takip etmen gerekmez — `next` faz döngüsünü DURUM'dan okuyup doğru adımı yürütür.

`next` bir **dağıtıcıdır**: kendi iş mantığı yoktur. Sıradaki komutu belirler, **o komutun dokümanını okur** ve sanki o komutu doğrudan çağırmışsın gibi baştan sona uygular. Karmaşık dallanma (versiyon sonu tespiti, fix task'ları vb.) hedef komutun kendi içindedir — `next` onu kopyalamaz, ona devreder.

**Kullanım:** `/devflow:next` — oturumun ilk ve tek komutu olarak çalıştır

**Kapsam:** Faz döngüsü (discuss → research → plan → verify-plan → run-task → verify → review → sonraki faz). Kurulum (kickoff) ve PRD akışları `next`'in kapsamı dışındadır — onları README'deki akışa göre manuel yürüt.

---

## Okunacak Dosyalar

**Zorunlu**
1. `_dev/DURUM.md` — sıradaki adımı belirlemek için: **Aktif Faz → Adım**, **Aktif Versiyon → Versiyon Sonu Durumu**, **Aktif Task durumu**, **Task Durumu tablosu**, **Duraklatma Notu**.

> Tam Oturum Başlangıç Protokolü'nü burada uygulama. Hedef komutu belirledikten sonra o komutun "Okunacak Dosyalar" bölümü neyin okunacağını söyleyecek — gereksiz okuma yapma.

---

## Yapılacaklar

### 1. Ön-koşulları Kontrol Et

- `_dev/DURUM.md` yoksa → DevFlow projesi başlatılmamış. Kullanıcıya bildir: `/devflow:kickoff` (veya PRD için `/devflow:prd`) ile başla. **Dur.**
- DURUM var ama `CLAUDE.md` yoksa → kickoff kurulumu yarım kalmış (kickoff-verify CLAUDE.md'yi oluşturur). Kullanıcıya bildir: `/devflow:kickoff-verify` ile kurulumu tamamla. **Dur.**

### 2. Duraklatma Var mı? (önce bunu kontrol et)

DURUM'daki **Duraklatma Notu** dolu ise (yani "Duraklatma yok" değilse) **veya** Aktif Task durumu **⏸️** ise:
- Yarım kalmış bir adım var. `next` burada `resume`'a devreder.
- `.claude/commands/devflow/resume.md` dosyasını oku ve talimatlarını baştan sona uygula. **Dur** — resume akışını çalıştırdıktan sonra başka adıma geçme.

### 3. Sıradaki Adımı Belirle

Duraklatma yoksa, **Aktif Faz → Adım** alanına göre hedef komutu seç:

| DURUM.Adım | Hedef komut |
|---|---|
| `discuss` | discuss-phase |
| `research` | research-phase |
| `plan` | plan-phase |
| `verify-plan` | verify-plan |
| `task` | run-task |
| `verify` | verify-phase |
| `review` | review-phase |

**Özel durumlar:**
- **Adım = `task`** iken Task Durumu tablosuna bak (savunmacı kontrol): bekleyen (⬜/🔄) task yoksa, yani **hepsi ✅** ise → `verify-phase`. *(run-task artık bu durumda Adım'ı `verify`'a çekiyor; bu kontrol eski/çökmüş state için güvenlik ağı.)*
- **Adım boş** ve **Versiyon Sonu Durumu = `prd_review_bekliyor`** → `/devflow:prd-review` öner. Bu faz döngüsü dışı bir sınır olduğu için **çalıştırma — kullanıcıya bildir ve dur.**
- **Adım boş ama yukarıdakine uymuyor** (ör. versiyon geçişi sonrası: Aktif Faz/Adım boş, Versiyon Sonu Durumu `içerik_fazları`) → versiyon-geçişi sınırı, `next`'in kapsamı dışı. **Çalıştırma — durumu raporla ve kullanıcıya sor** (büyük olasılıkla yeni versiyonun ilk `discuss-phase`'i manuel başlatılacak).

> **Emin değilsen çalıştırma — sor.** Hedef komutu yukarıdaki tablo veya özel durumlardan **tam bir kesinlikle** belirleyemiyorsan (Adım tanınmıyor, boş, tablolarla çelişiyor ya da herhangi bir belirsizlik varsa) **hiçbir komut çalıştırma.** Gördüğün DURUM durumunu kısaca raporla ve kullanıcıya ne yapmak istediğini sor. `next`'in varsayılanı şüphede **durup sormaktır**, tahminle ilerlemek değil.

### 4. Belirlenen Komutu Bildir ve Çalıştır

> Buraya yalnızca Adım 3 **tek ve net** bir hedef ürettiyse geç. Belirsizlik varsa Adım 3'te durmuş ve sormuş olmalısın.

- Kullanıcıya kısaca söyle: `➡️ Sıradaki adım: /devflow:[komut] — çalıştırılıyor...`
- `.claude/commands/devflow/[komut].md` dosyasını oku.
- Talimatlarını **baştan sona, o komut doğrudan çağrılmış gibi** uygula — kendi "Okunacak Dosyalar" ve "Yapılacaklar" akışı dahil. Zaten context'te yüklü dosyaları (DURUM vb.) tekrar okuma.
- Faz numarası `[N]` alan komutlarda (discuss/research/plan/verify-plan/verify/review-phase) N'i belirtme; bu komutlar zaten DURUM'dan aktif fazı alır.

### 5. Tek Adım, Sonra Dur

Sadece bu **tek** adımı çalıştır. Bittikten sonra **dur** — aynı oturumda bir sonraki adıma geçme. Kullanıcı yeni bir oturumda tekrar `/devflow:next` çalıştırarak ilerler. Bu, DevFlow'un "her adım ayrı oturum" kuralını korur.

---

## Önemli Kurallar

- **Net emin değilsen çalıştırma — dur ve sor.** Sıradaki adımı tam bir kesinlikle belirleyemediğin her durumda (belirsizlik, sınır, çelişki, tanınmayan/boş Adım) varsayma; durumu raporla, kullanıcıya sor. `next`'in varsayılanı budur.
- `next` bir dağıtıcıdır — kendi iş mantığı yok; sıradaki komutun dokümanını okuyup uygular.
- Karmaşık dallanmayı (versiyon sonu, fix task'ları vb.) hedef komuta bırak — kopyalama.
- DURUM sıradaki adımın tek yetkili kaynağıdır; ama tablo ile çelişki görürsen (ör. Adım=`task` ama tüm tasklar ✅) tabloyu esas al ve doğru adıma git.
- Tek adım / oturum; zincirleme yok.
- Kapsam faz döngüsüdür. kickoff/prd/re-kickoff akışlarını `next` yürütmez.
