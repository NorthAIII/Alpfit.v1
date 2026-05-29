# Restore Drill Disiplini — Aylık

> **Rule:** Staging Postgres yedeklerinin gerçekten restore edilebilir olduğu **ayda bir kez** elle teyit edilir. Drill atlanırsa yedek süreci sessizce çürüyebilir — restore gerektiğinde fark etmek geç olur.

**Why:** "Yedek aldığını sanmak ≠ yedek almak." Backup script exit 0 dönse bile dump dosyası corrupt olabilir, encryption key kaybolabilir, pg_dump silently truncate yapabilir, rclone'un cache'i bozulmuş olabilir. Drill ilk fark etme şansıdır. Yedek olmayan staging = veri kaybı = ürün ölümü (üye sürdürülebilirlik motoru ürünün kalbi → kaybedilen üye verisi = ürünün özünün kaybı).

**How to apply:**

- **Sıklık:** Her ayın 15'i (hatırlatma kolay tarih; ay ortası → her ay garanti tetiklenir). 15'i kaçırılırsa o ay tamamlandıktan sonra atlamaz, ayın geri kalan günlerinde geç de olsa yap.
- **Süre:** ~10-15 dk (v1 ~100 MB DB için); büyüdükçe ölç.
- **Prosedür:** [`_dev/docs/restore-drill.md`](../docs/restore-drill.md) adım adım.
- **Kayıt:** Drill sonucu (✅/❌ + süre + smoke query çıktısı özeti) [`_dev/memory/staging-infra.md`](staging-infra.md) "Restore Drill Kayıtları" bölümüne yazılır.
- **Aksilik:** Drill başarısızsa **task aç** (`/devflow:quick` ile) — neden başarısız + müdahale + prosedür güncellemesi. Sorunu bir sonraki drill'e bırakma.
- **Faz retrosu:** Her faz `review-phase`'inde "son drill başarılı mı" kontrol edilir; drill atlanırsa retroda eksiklik notu.

**Kim yapar?**

- Kullanıcı (kurucu) tek başına — Claude oturumu gerekmez. Rehber adım adım, deploy@staging SSH erişimi ile yapılır.
- Aksilik veya prosedürde belirsizlik varsa Claude oturumuyla çalışılır.

**Drill ile ne fark edilir?**

- pg_dump silently truncate (disk dolu, postgres-side rollback) → smoke query veri eksik
- rclone crypt password/salt drift → indirme başarısız (Decrypt: bad data)
- B2 lifecycle yanlış configure → yedek beklenenden eski
- pg_restore migration drift → schema mismatch (yeni migration eklendiyse dump eski)
- Şifreleme key kaybı (en kötü senaryo) → fark etme erken aşamada, başka kaynaktan yedek arama şansı

**Drift sinyalleri (drill dışı):**

- `/var/log/alpfit/pg-backup.log` ardışık FAIL → drill beklemeden müdahale
- B2 bucket boyutu yarın da bugünkü kadar (yeni dump yok) → cron çalışmıyor
- Local `/var/backups/alpfit/` dizininde son 7 günden eski dump (rotate çalışıyor) ama dün yok → dünkü cron fail

**Bu kural kime özel?**

Bu projeye özgüdür (Alpfit staging mimari + KVKK saklama politikası). Genel DevFlow yöntemine dair olsaydı `phases/PHASE-N.md` retrospektifinin "DevFlow'a Öneri" alt bölümünde olurdu (kullanıcıya bildirim + DevFlow'a taşıma önerisi).

---

**İlgili:**
- [Staging altyapısı](staging-infra.md) — sunucu + B2 + drill kayıt yeri
- [`_dev/docs/restore-drill.md`](../docs/restore-drill.md) — prosedür
- [`_dev/docs/staging-pg-backup-cron.md`](../docs/staging-pg-backup-cron.md) — backup script
