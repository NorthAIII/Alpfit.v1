# DevFlow — Proje Başlatma Oturum 3: Kontrol ve Tamamlama (Kickoff Verify)

Bu komut kickoff sürecinin son adımıdır. Oluşturulan dokümanları kontrol eder, eksikleri tamamlar ve CLAUDE.md'yi oluşturur.

**Kullanım:** `/devflow:kickoff-verify`

**Ön Koşul:** `/devflow:kickoff-docs` oturumu tamamlanmış olmalı.

---

## Okunacak Dosyalar

### Oturum Başlangıç Protokolü (istisna)
Bu komut CLAUDE.md'yi **oluşturan** komuttur — çalıştığı anda CLAUDE.md henüz yoktur. Bu yüzden Oturum Başlangıç Protokolü referansı yerine protokol dosyaları burada doğrudan listelenir ve komut tarafından doğrulanır. (Re-kickoff modunda CLAUDE.md varsa bile, bu komut onu güncellediğinden dosyalar yine doğrudan okunur.)

### Zorunlu (hepsini oku)
1. `_dev/OVERVIEW.md`
2. `_dev/ILKELER.md`
3. `_dev/INDEX.md`
4. `_dev/DURUM.md`
5. `_dev/MEMORY.md`
6. `_dev/MODULE-MAP.md`
7. `_dev/PHASES.md`
8. `_dev/QUALITY.md`
9. `_dev/tasks/TASKS-README.md`

### Göreve Göre (ilgili adımlarda okunacak)
- `_dev/modules/` klasöründeki tüm modül dokümanları → Adım 1'de MODULE-MAP'ten dosya adlarını tespit et ve oku
- INDEX.md'de listelenen projeye özgü dokümanlar (STYLE-GUIDE vb.) → Adım 1'de oku
- `_dev/PRD/VERSIONS.md` → **Adım 1'de** PRD referans kontrolü için oku (PRD varsa)
- `_dev/PRD/features/` altındaki feature dokümanları → **Adım 1'de** PRD→MODULE aktarımı kontrolü için oku (PRD varsa)
- CLAUDE-MD template → **Adım 3'te** oku: `.claude/commands/devflow/templates/CLAUDE-MD.md`
- NATIVE-MEMORY-REDIRECT template → **Adım 5'te** oku: `.claude/commands/devflow/templates/NATIVE-MEMORY-REDIRECT.md`

---

## Yapılacaklar

### Adım 1: Doküman Tutarlılık Kontrolü

Tüm dokümanları okuyarak şu kontrolleri yap:

**a) Bilgi Tutarlılığı:**
- OVERVIEW'daki bilgiler MODULE-MAP ile uyumlu mu?
- MODULE-MAP'teki feature'lar modül dokümanlarıyla örtüşüyor mu?
- PHASES.md'deki **Sıradaki Fazlar** konuları MODULE-MAP'teki feature'lar/versiyonlarla tutarlı mı (kapsam boşluğu yok mu)? (Faz Durumu tablosu kickoff sonrası **boştur** ve MODULE-MAP Faz sütunu tümüyle `—`'dir — bu normaldir; numara faza girince atanır.)
- Bilgi tekrarı var mı? (aynı bilgi birden fazla yerde)

**b) Doküman Bütünlüğü:**
- INDEX.md'de listelenen tüm dokümanlar gerçekten mevcut mu?
- Oluşturulmuş ama INDEX.md'de listelenmemiş **içerik dokümanı** var mı? (modül, docs, PRD içerik, projeye özgü sabit) — task/faz dokümanları INDEX'te enumere edilmez, bu kontrol onları kapsamaz.
- Template placeholder'ları kalmış mı? ([PROJE_ADI], [Tarih] vb.)
- Boş veya eksik bırakılmış bölümler var mı?
- **ILKELER.md var mı ve [PROJE_ADI]/[Tarih] gibi taban placeholder'ları temizlenmiş mi?** "Bu Projeye Özgü" alanları boş olabilir (henüz konuşulmadıysa normal — varsayım yapma); ama o alanlardaki bracket'li **prompt metni** ham bırakılmamalı: ya doldur ya "henüz tanımlanmadı" yaz.

**c) Kalite Kontrolü:**
- Modül dokümanlarında kabul kriterleri somut ve test edilebilir mi?
- Edge case'ler yeterli mi?
- QUALITY.md projeye uygun şekilde düzenlenmiş mi?

**d) PRD Referans Kontrolü (PRD varsa):**
- PRD'deki tüm feature'lar modüllere atanmış mı?
- VERSIONS.md'deki feature-versiyon eşleştirmesi MODULE-MAP'e doğru aktarılmış mı? (Versiyon sütunu)
- Versiyonlar fazlarla uyumlu mu?
- PRD'deki davranış kuralları MODULE dokümanlarına kabul kriterleri olarak yansımış mı?
- DURUM.md'de Aktif Versiyon alanı doğru doldurulmuş mu?

### Adım 2: Eksikleri Tamamla

Kontrol sırasında bulunan eksikleri düzelt:
- Eksik bilgileri doldur
- Tutarsızlıkları gider
- Placeholder'ları temizle
- INDEX.md'yi güncelle

Eğer kullanıcıdan bilgi gerekiyorsa, sor ve al.

### Adım 3: CLAUDE.md Oluştur veya Güncelle

**Önce oku:** `.claude/commands/devflow/templates/CLAUDE-MD.md`

**CLAUDE.md zaten mevcutsa:** Değişen bilgileri güncelle (yeni modüller, yeni projeye özgü kurallar, değişen faz bilgileri vb.). Mevcut özelleştirmeleri koru.

**CLAUDE.md yoksa:** Repo kökünde (`/CLAUDE.md`) oluştur. Template'i kullan ama projeye göre düzenle:

- Proje bilgilerini doldur
- Projeye özgü sabit dokümanları "Oturum Başlangıç Protokolü"ne ekle
- Dokunulmazları belirle (config dosyaları, migration'lar vb.)
- Projeye özgü kuralları yaz (framework kuralları, convention'lar vb.)
- Commit convention'ı projeye uyarla

**Kritik:** CLAUDE.md repo kökünde olmalı, `_dev/` içinde değil.

### Adım 4: Son Güncellemeler

- INDEX.md'ye CLAUDE.md'yi ekle (repo kökünde olduğunu belirt)
- DURUM.md'yi güncelle — **Aktif Faz:** girilecek sıradaki faz = **Faz Durumu tablosundaki en büyük faz no + 1** (tablo boşsa 1); adı Sıradaki Fazlar listesinin ilk maddesinden alınır (geçici — discuss-phase kesinleştirir), **Adım:** discuss. İlk kickoff'ta bu Phase 1'dir; re-kickoff'ta global sayaç devam eder (versiyon değişse de sıfırlanmaz). "Phase 1" varsayma — max+1 ile hesapla ([PHASES.md → Faz Numaralandırma Kuralı](templates/PHASES.md)).

**Not:** Faz dokümanı (PHASE-1.md) bu oturumda oluşturulmaz — discuss-phase oturumunda oluşturulacak.

### Adım 5: Native Memory Yönlendirmesi (Harness Entegrasyonu)

DevFlow proje hafızasını repo içinde (`_dev/memory/`) tutar; Claude'un native (yerleşik) memory'si proje bilgisi için kullanılmaz (CLAUDE.md → Doküman Disiplini). Bunu kalıcı kılmak için projenin native memory index'ine — `~/.claude/projects/<bu-proje>/memory/MEMORY.md`, yani harness'ın sana bu oturumda bildirdiği native memory konumu — bir yönlendirme yazılır. Bu adım ilk kickoff'ta yönlendirmeyi kurar, re-kickoff'ta bozulmuşsa geri getirir.

**Değişmez kural (önce taşı, sonra yaz):** Native MEMORY.md'de yönlendirme template'i DIŞINDA herhangi bir içerik (eski native öğrenimler, sızmış proje bilgisi) varsa, o içerik ÖNCE `_dev/memory/`'ye taşınır (her biri `_dev/memory/<slug>.md` + `_dev/MEMORY.md` index pointer'ı). **Taşımadan asla üzerine yazma.**

Sırayla:
1. Native memory index'ini (MEMORY.md) oku.
2. Yönlendirme dışında içerik varsa → `_dev/memory/`'ye taşı (yukarıdaki kural).
3. `.claude/commands/devflow/templates/NATIVE-MEMORY-REDIRECT.md` içeriğini native MEMORY.md'ye **yaz** (dosyanın tüm içeriği bu olur; zaten birebir doğruysa dokunma).
4. Taşıdığın bilgi varsa kontrol raporunda belirt.

> Bu, DevFlow'un repo DIŞINA yazdığı **tek** şeydir; bilinçli bir harness entegrasyonudur. Native memory proje-bazlıdır (`~/.claude/projects/<bu-proje>/`), içeriği yalnızca bu projeye aittir — `_dev/`'ye taşımak doğru hedeftir. Harness native memory konumunu bildirmiyorsa bu adımı atla ve raporda not düş.

### Adım 6: Git Commit & Push

Tüm doküman değişikliklerini ve CLAUDE.md'yi commit & push yap:
```
docs: kickoff-verify — verification complete, CLAUDE.md created
```

### Adım 7: Kontrol Raporu ve Sıradaki Adım

Kullanıcıya kontrol sonuçlarını sun:

```
📋 Kickoff Kontrol Raporu:
✅ Doküman tutarlılığı: X doküman kontrol edildi
✅ Bilgi bütünlüğü: Eksik/tutarsızlık yok (veya düzeltildi)
✅ CLAUDE.md oluşturuldu
✅ Native memory yönlendirmesi kuruldu/doğrulandı (taşınan bilgi varsa belirt)
✅ INDEX.md güncel

Oluşturulan dokümanlar:
- /CLAUDE.md
- _dev/OVERVIEW.md
- _dev/ILKELER.md
- _dev/INDEX.md
- _dev/DURUM.md
- _dev/MEMORY.md
- _dev/MODULE-MAP.md
- _dev/PHASES.md
- _dev/QUALITY.md
- _dev/modules/M1-[Ad].md
- ...
- _dev/tasks/TASKS-README.md
- _dev/docs/DECISIONS.md
- [projeye özgü dokümanlar]

✅ Proje başlatma tamamlandı!
📋 Sıradaki adım: /devflow:discuss-phase N        ← N = yukarıda set edilen Aktif Faz (ilk kickoff'ta 1, re-kickoff'ta yeni versiyonun ilk fazı)
   → Bu fazın kapsam tartışmasını ve faz dokümanı oluşturulmasını yapmak için yeni bir oturum başlat.
```

---

## Önemli Kurallar

- Bu oturumda task çalıştırma — sadece kontrol ve doküman tamamlama
- Placeholder bırakma — her şey doldurulmuş olmalı
- CLAUDE.md repo kökünde olmalı
- Faz dokümanı bu oturumda oluşturulmaz — discuss-phase'de oluşturulacak
- Kontrol sonuçlarını kullanıcıya raporla
