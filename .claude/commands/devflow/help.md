# /devflow:help — DevFlow Komut Rehberi

Kullanıcıya aşağıdaki bilgiyi göster. Bu komutta dosya okumaya gerek yok.

---

## DevFlow — Komutlar

### PRD (Proje Başlamadan Önce)
| Komut | Açıklama |
|-------|----------|
| `/devflow:prd` | İlk PRD oturumu — projeyi keşfet, PRD dokümanlarını oluştur |
| `/devflow:prd-refine` | PRD'yi derinleştir (tekrarlanabilir, proje başlamadan) |
| `/devflow:prd-save` | PRD oturumunu kaydet — prd, prd-refine, prd-review oturumlarında kullanılır |
| `/devflow:prd-note` | Geliştirme sırasında not/analiz — fikirleri araştır ve kaydet |
| `/devflow:prd-review` | Versiyon sonrası PRD değerlendirmesi (zorunlu, tekrarlanabilir) |

### Proje Başlatma (Her Adım Ayrı Oturum)
| Komut | Açıklama |
|-------|----------|
| `/devflow:kickoff` | Oturum 1: Projeyi anla, modülleri belirle, fazları planla (PRD varsa okur, re-kickoff destekler) |
| `/devflow:kickoff-docs` | Oturum 2: `_dev/` yapısını oluştur, dokümanları doldur |
| `/devflow:kickoff-verify` | Oturum 3: Kontrol et, CLAUDE.md oluştur, eksikleri tamamla |
| `/devflow:map-codebase` | Mevcut kodu analiz et, `_dev/` yapısını otomatik oluştur (brownfield giriş) |

### Faz Döngüsü (Her Adım Ayrı Oturum)
| Komut | Açıklama |
|-------|----------|
| `/devflow:discuss-phase [N]` | Kapsam tartışması — gri alanları belirle, tercihleri topla, versiyon sonu tespiti |
| `/devflow:research-phase [N]` | Teknik araştırma — stack, yaklaşımlar, tuzaklar |
| `/devflow:plan-phase [N]` | Task yazımı |
| `/devflow:verify-plan [N]` | Task dokümanlarını review et, düzelt, onayla |
| `/devflow:run-task` | Sıradaki task'ı çalıştır (her oturumda 1 task) |
| `/devflow:verify-phase [N]` | Kullanıcı kabul testi (UAT) + adversarial test |
| `/devflow:review-phase [N]` | Faz review + retrospektif + kalite kontrol + kullanıcı yolculuğu |

### Yardımcı
| Komut | Açıklama |
|-------|----------|
| `/devflow:next` | Sıradaki adımı DURUM'dan bul ve çalıştır — faz döngüsünde komut takibini ortadan kaldırır |
| `/devflow:quick` | Ad-hoc task — faz döngüsü dışı hızlı iş |
| `/devflow:pause` | Faz döngüsü oturumunu durdur, handoff bilgisi yaz |
| `/devflow:resume` | Kaldığı yerden devam et |
| `/devflow:progress` | Proje durumunu göster |
| `/devflow:double-check` | Oturum sonu doküman kontrolü — değişiklikleri eleştirel gözle incele, hata/tutarsızlıkları yakala |
| `/devflow:audit-docs` | Proje-genişlikli doküman denetimi — artımlı (rolling) canvas; doküman başına **raporla, onayla düzelt**; sürekli ilerleme için `/loop` |
| `/devflow:step-by-step` | Tartışma modu — konuları teker teker aç, seçenek+öneri sun, karar bekle (herhangi bir oturumda çağrılabilir) |
| `/devflow:guide-me` | Eylem modu — uzun bir yapılacaklar listesini adım adım yürüt, her adım için devam sinyali bekle (herhangi bir oturumda çağrılabilir) |
| `/devflow:help` | Bu yardım metnini göster |

### Tipik Akış — Yeni Proje (PRD ile)
```
prd → prd-refine (tekrarla) → prd-save (opsiyonel)
  → kickoff → kickoff-docs → kickoff-verify
  → discuss-phase 1 → research-phase 1 → plan-phase 1 → verify-plan 1
  → run-task (tekrar) → verify-phase 1 → review-phase 1
  → discuss-phase 2 → ...
  → [versiyon sonu: teknik borç fazı → senaryo testi fazı]
  → prd-review → [değişiklik varsa: kickoff (re-kickoff)]
  → discuss-phase N → ...
```

### Tipik Akış — Yeni Proje (PRD'siz)
```
kickoff → kickoff-docs → kickoff-verify
  → discuss-phase 1 → research-phase 1 → plan-phase 1 → verify-plan 1
  → run-task (tekrar) → verify-phase 1 → review-phase 1
  → discuss-phase 2 → ...
```

### Tipik Akış — Mevcut Projeye PRD Ekleme
```
prd → prd-refine (tekrarla)
  → kickoff (re-kickoff modu) → kickoff-docs → kickoff-verify
  → discuss-phase N → ...
```

### Tipik Akış — Mevcut Projeye Giriş (Brownfield)
```
map-codebase
  → prd → prd-refine (opsiyonel) → kickoff (re-kickoff) → kickoff-docs → kickoff-verify
  → discuss-phase 1 → ...
```

> **Not:** Akış diyagramlarına dahil olmayan dört komut herhangi bir oturumda çağrılabilir:
> - `/devflow:double-check` — oturum sonunda (pause/prd-save/kapanış özeti öncesinde) bu oturumda düzenlenen dokümanları eleştirel gözle tekrar inceler. Kapsam: bu oturum.
> - `/devflow:audit-docs` — proje-genişlikli doküman denetimi, **artımlı (rolling)** çalışır: bir canvas sıradaki dokümanı seçer, varsayılan çalıştırma başına bir doküman işlenir (sürekli için `/loop`). Drift/şişme/soft-delete kalıntıları + statik doküman bayatlaması (gerçeklik mutabakatı) + DevFlow konvansiyonu değiştiğinde migration tek mekanizmada toplanır. Bulguları **raporlar ve onayınla** düzeltir (auto-fix yok). Faz/versiyon sonu, konvansiyon güncellemesi veya doküman karmaşası hissedildiğinde manuel çağrılır.
> - `/devflow:step-by-step` — tartışmalı birden fazla konu olduğunda tartışma tarzını tek-tek moda çevirir; her konu için bağlam+seçenek+öneri sunar, karar bekler.
> - `/devflow:guide-me` — Claude bir önceki mesajda uzun bir eylem/yapılacaklar listesi verdiğinde, o listeyi adım adım yürütür: her adımı tek başına açar (banner'la `Adım N/Toplam`), kullanıcı devam sinyali (yaptım/tamam/ekran görüntüsü) verince sıradakine geçer. step-by-step'in eylem-modu eşi.

### Kurallar
- Faz döngüsünde sıradaki komutu kendin takip etmek yerine `/devflow:next` yazabilirsin — DURUM'dan doğru adımı bulup o komutu çalıştırır (kapsam: faz döngüsü; kickoff/PRD manuel)
- Her faz adımı ayrı oturumda çalışır — oturumlar arası bilgi aktarımı dokümanlar üzerinden olur
- Her oturum sonunda sıradaki adım önerilir
- Task oturumlarında sadece 1 task çalıştırılır
- Planlama oturumunda task çalıştırılmaz
- Bir seferde sadece 1 faz planlanır
- `_dev/` klasörü tüm proje dokümanlarını barındırır
- `_dev/PRD/` klasörü PRD dokümanlarını barındırır
- Versiyon ortasında PRD değişikliği yapılmaz — fikirler `/devflow:prd-note` ile kaydedilir
- Her versiyon sonunda teknik borç + senaryo testi fazları ve ardından zorunlu prd-review çalıştırılır
- Oturum beklenmedik şekilde kesildiyse → `/devflow:resume` ile kaldığı yerden devam et
- PRD oturumu kesildiyse → `/devflow:prd-save` ile kaydet
