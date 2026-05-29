<!-- Alpfit PR template — DevFlow task / quick disiplini -->

## Özet

<!-- Bu PR ne yapıyor? 1-3 cümle. -->

## Bağlantı

- Task: <!-- TASK-X.YY (faz task'i) veya quick/<isim> -->
- Modül / Feature: <!-- M? / F?.? — varsa -->
- Faz: <!-- PHASE-N — varsa -->

## Değişiklik Türü

<!-- Tek seçim — commit prefix'i ile eşleşir. -->

- [ ] `feat` — yeni özellik
- [ ] `fix` — bug fix
- [ ] `refactor` — davranış değişmedi
- [ ] `docs` — yalnızca doküman
- [ ] `test` — yalnızca test
- [ ] `chore` — build / config / araç

## Test Planı

<!-- Manuel + otomatik adımlar. Test çalıştırılmayan PR mergelenmez. -->

- [ ] `pnpm typecheck` temiz
- [ ] `pnpm lint` temiz
- [ ] `pnpm format:check` temiz
- [ ] `pnpm test` recursive yeşil
- [ ] (Varsa) Task dokümanındaki "Test Kriterleri" karşılandı
- [ ] (UI değişikliği varsa) Görsel doğrulama: <!-- ekran / akış -->

## DevFlow Doküman Güncellemeleri

<!-- Faz task'inde bu zorunlu. -->

- [ ] Task dokümanı: oturum kaydı + durum güncellendi
- [ ] DURUM.md: aktif task pointer + son task özeti güncellendi
- [ ] PHASE-N.md: Task Listesi tablosu güncellendi
- [ ] (Gerekirse) DECISIONS.md / MEMORY.md güncellendi

## KVKK / Gizlilik

<!-- Sağlık verisi (kilo / boy / ölçüm / yemek günlüğü) dokunan PR'larda zorunlu. -->

- [ ] Log'lara sağlık verisi sızıntısı yok
- [ ] Sentry payload'unda PII yok (varsa scrubber doğrulandı)
- [ ] Gizlilik toggle'ı etkilenen feature'da test edildi

## Not

<!-- Reviewer için ek bağlam — varsa. -->
