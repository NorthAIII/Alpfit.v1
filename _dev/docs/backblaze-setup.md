# Backblaze B2 Hesap + Bucket Kurulum Rehberi

**Bağlam:** TASK-1.16 — Hetzner tek-node SPOF (PHASE-1 Araştırma §Tuzak #4) mitigation'ı olarak Postgres staging DB'sini günde bir kez off-site B2'ye yedekler. TASK-1.10'da Coolify yerine docker-compose seçildiği için (DECISIONS 2026-05-29 "TASK-1.10"), Coolify built-in backup hedefi yok. Yedek mekaniği host crontab + `pg_dump` + `rclone` ile çalışır → [`staging-pg-backup-cron.md`](staging-pg-backup-cron.md).

**Bu rehber tek seferlik manuel adımlardır** (B2 hesabı oluşturma, bucket, lifecycle, application key). Tamamlandığında `staging-pg-backup-cron.md`'deki script ayağa kalkar.

**Sunucu:** `deploy@178.104.140.36` (Hetzner CPX32, paylaşımlı VPS — [staging-infra memory](../memory/staging-infra.md)).

---

## Neden Backblaze B2?

| Kriter | Backblaze B2 | AWS S3 Glacier | Hetzner Storage Box |
|--------|--------------|----------------|---------------------|
| **Maliyet** | $0.005/GB/ay (storage), $0.01/GB (download) | $0.004/GB/ay + Glacier retrieval ücreti | €3.20/ay 1TB fix |
| **EU region** | ✅ Amsterdam (`eu-central-003`) | ✅ Frankfurt | ✅ Almanya |
| **S3 API uyumlu** | ✅ (rclone/s3cmd çalışır) | ✅ | ⚠️ kısıtlı (sadece SFTP/SMB) |
| **Lifecycle policy** | ✅ | ✅ | ❌ |
| **DPA imzası** | ✅ (template hazır) | ✅ | ✅ |
| **KVKK m.9 SCC** | ⚠️ ABD merkezli ama EU bucket + DPA + SCC ile savunulabilir | ⚠️ ABD merkezli (DPA + SCC) | ✅ AB merkezli |
| **v1 maliyet** | ~$0.001/ay (100 MB) | ~$0.001/ay | €3.20/ay (overkill) |

**Karar:** B2 Amsterdam (`eu-central-003`) — KVKK m.9 SCC + DPA ile savunulabilir, en düşük maliyet, S3 API uyumlu (rclone). Karar detayı: DECISIONS.md "2026-05-30 — TASK-1.16".

---

## Adım 1 — Backblaze Hesabı Aç

1. [https://www.backblaze.com/cloud-storage](https://www.backblaze.com/cloud-storage) → **Sign Up**
2. **Region:** **EU Central** seç (Amsterdam, AB) — *çok önemli, sonradan değiştirilemez*. ABD region varsayılan; yanlış seçilirse hesabı yeniden açmak gerekir.
3. Email + parola (parola password manager'da).
4. Email doğrulama.
5. **2FA zorunlu yap:** Account Settings → Sign-In Settings → **Enable Two-Factor Authentication** (Google Authenticator veya 1Password TOTP).
6. **Billing:** Credit card ekle (B2 ücretsiz tier var ama lifecycle policy + over-quota safety için billing tanımlı).

> ⚠️ **Region seçimi geri alınamaz.** B2 hesabı bir region'a bağlıdır; bucket başka region'da olamaz. Yanlış region'da hesap açıldıysa yeni hesapla başlamak gerekir.

---

## Adım 2 — Bucket Oluştur

Hesap içinde:

1. **B2 Cloud Storage** → **Buckets** → **Create a Bucket**
2. **Bucket Name:** `alpfit-staging-db-backup` (globally unique, küçük harf, tire OK)
3. **Files in Bucket are:** **Private** *(public asla)*
4. **Default Encryption:** **Enable (SSE-B2, server-side AES-256)** — B2 transparent encryption, üstüne client-side encryption da ekleyeceğiz (Adım 4)
5. **Object Lock:** **Disabled** (v1; v1.5+ ransomware koruması için "Compliance Mode 35 gün" düşünülebilir, ama lifecycle ile çelişir)
6. **Create a Bucket**

**Bucket oluştuktan sonra Endpoint URL'i not et:**
- Format: `s3.eu-central-003.backblazeb2.com`
- Bucket Detail sayfasında "Endpoint" alanı altında görünür.

---

## Adım 3 — Lifecycle Policy (30 Gün Otomatik Silme)

1. Bucket Detail → **Lifecycle Settings** → **Customize Lifecycle Rules**
2. Yeni rule:
   - **File Name Prefix:** *(boş — tüm dosyalara uygulanır)*
   - **Days from uploading to hiding:** **30**
   - **Days from hiding to deleting:** **1**
3. **Save Lifecycle Rules**

> 💡 **Neden 30 gün?** B2 maliyeti çok düşük (~$0.001/ay), ama lifecycle olmazsa yedekler sonsuza birikir → KVKK "veri minimizasyonu" ilkesi ihlali. 30 gün = aylık restore drill arası + bir hafta tampon. v1'de DB ~100 MB, 30× yedek ~3 GB.

---

## Adım 4 — Application Key (rclone için)

> ⚠️ **Master Application Key kullanma.** Master key hesabın tamamına yetkilidir (bucket silme, hesap ayarı değiştirme). Her bucket için **scoped application key** üret — read+write bucket scope, başka bucket'a erişim yok.

1. **App Keys** → **Add a New Application Key**
2. **Name of Key:** `alpfit-staging-backup-rclone`
3. **Allow access to Bucket(s):** `alpfit-staging-db-backup` (sadece bu bucket)
4. **Type of Access:** **Read and Write**
5. **Allow List All Bucket Names:** ❌ unchecked
6. **File name prefix:** *(boş)*
7. **Duration (seconds):** *(boş — süresiz)*
8. **Create New Key**

**Çıkacak ekranda iki değer bir kez gösterilir:**
- `keyID` — örn. `0034a1b2c3d4e5f`
- `applicationKey` — örn. `K003abc...` *(uzun, ~31 char)*

**Hemen kaydet:**
1. Password manager'a (1Password / Bitwarden): "Alpfit B2 Staging Backup Key" entry, both values.
2. Ek olarak ayrı bir kaynağa (sealed envelope veya ayrı device — eğer password manager kaybedilirse).
3. **Bu ekrandan çıkınca `applicationKey` bir daha gösterilmez.** Kaybedilirse yeni key üretilir.

---

## Adım 5 — Client-Side Encryption Key (Ek Güvenlik Katmanı)

B2 server-side AES-256 yapar (Adım 2 SSE-B2), ama bu sadece "Backblaze çalışanı disk içeriği okuyamaz" garantisi verir; B2 hesabına erişen biri dosyaları indirip okuyabilir. **Client-side encryption** ek katman: yedek dosyası rclone tarafından şifrelenir, B2'ye şifreli yüklenir, sadece encryption key'i bilen restore edebilir.

```bash
# Encryption password üret (32+ char yüksek entropi)
ENCRYPT_PWD=$(openssl rand -base64 48)
echo "Encryption password: $ENCRYPT_PWD"

# Salt değeri üret (rclone crypt için)
SALT=$(openssl rand -hex 32)
echo "Salt: $SALT"
```

**Hemen kaydet** (password manager'da ayrı entry: "Alpfit B2 rclone crypt — encryption + salt"):
- `ENCRYPT_PWD` (rclone konfigürasyonunda `password`)
- `SALT` (rclone konfigürasyonunda `password2`)

> ⚠️ **Encryption key kaybedilirse tüm yedekler kullanılamaz hale gelir.** Risk + Mitigation: TASK-1.16 task dokümanı; password manager + ayrı kopya ZORUNLU.

---

## Adım 6 — DPA (Data Processing Agreement) İmzala

KVKK m.9 + GDPR uyumu için Backblaze ile **DPA imzası şart**. Backblaze EU müşterileri için DPA template sunar.

1. Backblaze [DPA sayfası](https://www.backblaze.com/company/legal/dpa) → Form doldur
2. Şirket bilgisi: **Alpfit Yazılım** (kurucu Kıvanç + iletişim email)
3. Backblaze imzalı DPA PDF email ile gelir
4. PDF'i `_dev/legal/backblaze-dpa-signed-2026-MM-DD.pdf` olarak repo'ya KOYMA (PII), kurucunun kişisel arşivine + KVKK denetim kaydına ekle
5. `_dev/KVKK.md` → "Üçüncü Taraf Sözleşmeler — TODO" listesinde "Backblaze B2 DPA" maddesini ✅ olarak işaretle (imza tarihi notu)

---

## Adım 7 — Toplama: Bilgileri staging-infra.md'ye Yaz

B2 setup tamamlandığında [`_dev/memory/staging-infra.md`](../memory/staging-infra.md) "B2 Off-Site Yedek" bölümüne sabit veriler yazılır:
- Bucket adı, region, endpoint
- Application key ID (yarısı; tam value password manager'da)
- Encryption key ID (password manager pointer)
- DPA imza tarihi
- İlk drill tarihi (sonra eklenir)

> ⚠️ **Hassas değerler asla repo'ya yazılmaz** — sadece anahtar isimleri ve password manager pointer'ları.

---

## Çıkış: Sonraki Adımlar

B2 kurulumu tamamlandıktan sonra:

1. **[`staging-pg-backup-cron.md`](staging-pg-backup-cron.md)** — rclone kurulum + crontab + script (devops adımları)
2. **[`restore-drill.md`](restore-drill.md)** — ilk restore drill prosedürü (B2'den indir + restore_test DB)
3. **`_dev/KVKK.md`** — DPA TODO ✅, B2 EU konum notu güncellenmiş

---

## Maliyet Notu

| Kaynak | Birim | Aylık (v1) |
|--------|-------|-----------|
| Storage (3 GB, 30 günlük yedek) | $0.005/GB/ay | $0.015 |
| Download (restore drill ayda 1, ~100 MB) | $0.01/GB | $0.001 |
| API calls (yükleme + listeleme) | $0.004/10k Class B | negligible |
| **Toplam** | | **< $0.02/ay** |

**v1.5'te DB büyürse:** 1 GB DB → ~30 GB storage → $0.15/ay; halen yok denecek kadar düşük.

---

## Sorun Giderme

**Region yanlış seçildi:**
→ Hesap yeniden açılmalı. Var olan hesapla EU bucket oluşturulamaz.

**Application key kayıp:**
→ App Keys → eskisini delete → yeni key üret → rclone config update → backend container restart gerekmez (cron script env'i her seferde okur).

**Bucket boyutu beklenenden yüksek:**
→ Lifecycle policy çalışmıyor olabilir; Bucket → Lifecycle Settings → "Show all rules" → "30 gün hide + 1 gün delete" görünür mü?
→ Versioning açık mı? Bucket Detail → File Versions → eski version'lar lifecycle'a tabi mi?

---

## İlgili Dokümanlar

- [`staging-pg-backup-cron.md`](staging-pg-backup-cron.md) — pg_dump + rclone + crontab kurulum
- [`restore-drill.md`](restore-drill.md) — restore drill prosedürü
- [`_dev/memory/staging-infra.md`](../memory/staging-infra.md) — sunucu, network, env dosyası
- [`_dev/memory/restore-drill-disiplini.md`](../memory/restore-drill-disiplini.md) — aylık drill disiplini
- [`_dev/KVKK.md`](../KVKK.md) — DPA + SCC + saklama
- [`_dev/docs/DECISIONS.md`](DECISIONS.md) — "2026-05-30 — TASK-1.16"

---

**Son Güncelleme:** 2026-05-30 — TASK-1.16: B2 manuel hesap/bucket/key/DPA rehberi oluşturuldu.
