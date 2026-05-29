# CI Kurulum Rehberi

Bu doküman GitHub Actions üzerindeki CI pipeline'ı (`.github/workflows/ci.yml`) ile birlikte tek seferlik kurulum adımlarını anlatır. Pipeline'ın kendisi her PR ve `main` push'unda otomatik tetiklenir; aşağıdaki ayarlar kurulum sonrası **sen** repo admin'i olarak bir kez yapacaksın.

---

## CI Pipeline Yapısı

`ci.yml` dört paralel job çalıştırır:

| Job       | Çalıştırdığı                                         | Çalıştığı Yer                                               |
| --------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `quality` | `pnpm lint` + `pnpm format:check`                    | ubuntu-latest                                               |
| `shared`  | `pnpm -F @alpfit/shared typecheck` + `test:coverage` | ubuntu-latest                                               |
| `mobile`  | `pnpm -F @alpfit/mobile typecheck` + `test:coverage` | ubuntu-latest                                               |
| `backend` | `db:generate` + `typecheck` + `test:coverage`        | `node:22-bookworm` container + `postgres:17-alpine` service |

Backend job container içinde çalışır çünkü `backend/test/setup.ts` `DATABASE_URL` env'ini `postgres://dev:dev@postgres:5432/dev` olarak stub'lar; servis hostname'i (`postgres`) yalnızca job container'da resolve olur (devcontainer paterniyle birebir aynı).

Tetik: `pull_request` (tüm dallar) + `push` (`main`). Aynı PR'a yeni commit gelirse eski run iptal edilir (`concurrency.cancel-in-progress: true`).

Coverage artifact'ları her job sonunda yüklenir (`if: always()`); UI'dan indirilebilir.

---

## Branch Protection (Manuel UI — bir kez yapılır)

Repo GitHub'a push edildikten sonra aşağıdaki adımlar **bir kez** uygulanır. CI pipeline'ı yeşil zorunluluğu olmadan da çalışır ama merge'i blocke etmez; bu yüzden production-grade güvenceyi sağlamak için bu kurulum şarttır.

> **Ön koşul:** Repo GitHub'da mevcut, en az bir kez `git push origin main` yapıldı ve CI bir kez yeşil çalıştı (status check isimleri görünmeden korumayı set edemezsin).

1. Repo sayfası → **Settings** → **Branches** sekmesi.
2. **Branch protection rules** bölümünde **Add rule** (veya **Add branch ruleset**).
3. **Branch name pattern**: `main`.
4. Aşağıdaki kutuları işaretle:
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals** (1 yeterli — solo repo'da self-approve şart değil; review'a sahip değilsek bu kutu işaretlenmeyebilir; faz retrosunda gözden geçir)
   - ✅ **Require status checks to pass before merging**
     - ✅ **Require branches to be up to date before merging** (PR rebase / merge-with-main disiplini)
     - **Search for status checks** alanına yazıp ekle:
       - `Lint & Format`
       - `Shared (typecheck + test)`
       - `Mobile (typecheck + test)`
       - `Backend (db:generate + typecheck + test)`
       - (İsimler `ci.yml`'deki `name:` alanından gelir — değiştirirsen burada da güncelle.)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings** (admin dahil — disiplin)
5. **Create** / **Save changes**.

### Doğrulama

- Bir test branch'i aç (`git checkout -b ci-smoke-fail`), kasten kırık değişiklik commit'le (örn. typecheck fail eden bir satır), PR aç.
- 4 job'tan ilgili olan kırmızı görünmeli.
- PR'ın **Merge** butonu disabled olmalı (status check fail mesajıyla).
- Branch'i sil, gerçek değişiklikle devam.

---

## Yeni Status Check İsmi Eklemek

Workflow'a yeni job eklersen veya mevcut `name:` alanını değiştirirsen, **branch protection rule'a da yeni ismi ekle**. Status check ismi `name:` alanından gelir; isim eşleşmezse koruma o check'i beklemez ve PR yeşil olmadan merge edilebilir hale gelir.

---

## Notlar

- **Secrets:** Bu task'ta CI secret kullanılmıyor. TASK-1.10'da (Coolify staging deploy webhook) `COOLIFY_WEBHOOK_URL` ve `COOLIFY_WEBHOOK_TOKEN` secret'ları repo settings → Secrets and variables → Actions'a eklenir.
- **macOS runner / iOS build:** EAS Build (Yakın 5) öncesi CI'da macOS runner yok. Maestro e2e smoke testi Yakın 5'te eklenir.
- **CodeQL / dependency scan:** Bu fazda kapsam dışı; Yakın 5 launch öncesi `review-phase` değerlendirir.
